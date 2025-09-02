# backend/app/routes/snapshot.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from ..db.util import run_tx

router = APIRouter(prefix="/parties", tags=["snapshot"])


@router.get("/{party_id}/snapshot")
def get_snapshot(party_id: int):
    """
    After the party has started (party.started = true OR now >= starts_at),
    return a snapshot of:
      - roster: [member_id, name, role, distance, rsvp_status, approved]
      - edges:  [parent_id, child_id]
      - generated_at (UTC ISO8601)
    Before start, respond 404 (not found).
    """
    now = datetime.now(timezone.utc)

    def _tx(conn, cur):
        # 1) start/lock check
        cur.execute("SELECT starts_at, started FROM party WHERE id=%s", (party_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "party not found")
        starts_at, started = row
        has_started = bool(started) or (now >= starts_at)
        if not has_started:
            # pre-start: hide roster/edges
            raise HTTPException(404, "not found")

        # 2) roster
        cur.execute(
            """
            SELECT
                m.id   AS member_id,
                m.name,
                m.role,
                m.distance,
                COALESCE(r.status, 'pending')  AS rsvp_status,
                COALESCE(r.approved, FALSE)    AS approved
            FROM member m
            LEFT JOIN rsvp r
              ON r.party_id = m.party_id
             AND r.member_id = m.id
            WHERE m.party_id = %s
            ORDER BY m.id
            """,
            (party_id,),
        )
        roster_cols = [d.name for d in cur.description]
        roster = [dict(zip(roster_cols, rec)) for rec in cur.fetchall()]

        # 3) edges
        cur.execute(
            """
            SELECT parent_id, id AS child_id
            FROM member
            WHERE party_id=%s AND parent_id IS NOT NULL
            ORDER BY id
            """,
            (party_id,),
        )
        edge_cols = [d.name for d in cur.description]
        edges = [dict(zip(edge_cols, rec)) for rec in cur.fetchall()]

        return {
            "started": True,
            "roster": roster,
            "edges": edges,
            "generated_at": now.isoformat(),
        }

    return run_tx(_tx)
