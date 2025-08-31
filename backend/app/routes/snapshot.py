from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from ..db.connection import pool
from ..models.party_models import SnapshotResponse
from psycopg.types.json import Json

router = APIRouter(prefix="/parties", tags=["snapshot"])

@router.get("/{party_id}/snapshot", response_model=SnapshotResponse)
def get_snapshot(party_id: int):
    now = datetime.now(timezone.utc)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # load party (lock if we might freeze)
            cur.execute("SELECT starts_at, started, snapshot FROM party WHERE id=%s", (party_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "party not found")
            starts_at, started, snapshot = row

            if not started and now < starts_at:
                return {"started": False}

            # if already frozen, serve it
            if started and snapshot:
                return {
                    "started": True,
                    "roster": snapshot.get("roster"),
                    "edges": snapshot.get("edges"),
                    "generated_at": snapshot.get("generated_at"),
                }

            # lazy-freeze: lock party row, recompute, save
            cur.execute("SELECT id FROM party WHERE id=%s FOR UPDATE", (party_id,))

            # recompute roster
            cur.execute("""
                SELECT m.id AS member_id, m.name, m.role, m.distance,
                       r.status AS rsvp_status, r.approved
                FROM member m
                JOIN rsvp r ON r.member_id=m.id AND r.party_id=m.party_id
                WHERE m.party_id=%s
                ORDER BY m.distance, m.role, m.name
            """, (party_id,))
            mcols = [d.name for d in cur.description]
            roster = [dict(zip(mcols, r)) for r in cur.fetchall()]

            # edges
            cur.execute("""
                SELECT parent_id, id AS child_id
                FROM member
                WHERE party_id=%s AND parent_id IS NOT NULL
            """, (party_id,))
            edges = [{"parent_id": p, "child_id": c} for (p, c) in cur.fetchall()]

            snap = {
                "roster": roster,
                "edges": edges,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

            cur.execute(
                "UPDATE party SET snapshot=%s, started=TRUE WHERE id=%s",
                (Json(snap), party_id),
            )   


            return {"started": True, **snap}
