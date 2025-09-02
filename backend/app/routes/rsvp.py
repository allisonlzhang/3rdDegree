# backend/app/routes/rsvp.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from ..db.util import run_tx
from ..models.rsvp_models import RsvpSetRequest, RsvpSetResponse

router = APIRouter(prefix="/parties", tags=["rsvp"])


@router.post("/{party_id}/rsvp", response_model=RsvpSetResponse)
def set_rsvp(party_id: int, body: RsvpSetRequest):
    """
    Update a member's RSVP and determine approval per rules:
      - If party locked (started or now >= starts_at): no change, return locked=True
      - If status=='yes' and member.distance>=3: auto-approve
      - If status=='yes' and member.distance<3: approve only if some child has (yes & approved)
      - Else (maybe/no): approved=false, approved_by_child_id=NULL
    """
    now = datetime.now(timezone.utc)

    def _tx(conn, cur):
        # 1) Lock check
        cur.execute("SELECT starts_at, started FROM party WHERE id=%s", (party_id,))
        pr = cur.fetchone()
        if not pr:
            raise HTTPException(404, "party not found")
        starts_at, started = pr
        locked = bool(started) or (now >= starts_at)
        if locked:
            return {"rsvp": None, "locked": True}

        # 2) Ensure member exists in this party
        cur.execute(
            "SELECT id, distance FROM member WHERE party_id=%s AND id=%s",
            (party_id, body.member_id),
        )
        m = cur.fetchone()
        if not m:
            raise HTTPException(404, "member not found")
        member_id, distance = m

        # 3) Upsert/update RSVP status first
        # (If an rsvp row is guaranteed to exist, this UPDATE is sufficient; if not, fallback INSERT)
        cur.execute(
            "UPDATE rsvp SET status=%s, updated_at=NOW() WHERE party_id=%s AND member_id=%s",
            (body.status, party_id, member_id),
        )
        if cur.rowcount == 0:
            # safety: create a row if missing
            cur.execute(
                """
                INSERT INTO rsvp (party_id, member_id, status, approved)
                VALUES (%s,%s,%s,FALSE)
                """,
                (party_id, member_id, body.status),
            )

        approved = False
        approved_by_child = None

        # 4) Apply approval rules
        if body.status == "yes":
            if distance >= 3:
                # auto-approve for 3rd degree or beyond
                cur.execute(
                    """
                    UPDATE rsvp
                    SET approved=TRUE, approved_by_child_id=NULL, updated_at=NOW()
                    WHERE party_id=%s AND member_id=%s
                    """,
                    (party_id, member_id),
                )
                approved = True
                approved_by_child = None
            else:
                # need at least one approved 'yes' child to unlock
                cur.execute(
                    """
                    SELECT m.id
                    FROM member m
                    JOIN rsvp r
                      ON r.party_id = m.party_id
                     AND r.member_id = m.id
                    WHERE m.party_id=%s
                      AND m.parent_id=%s
                      AND r.status='yes'
                      AND r.approved=TRUE
                    LIMIT 1
                    """,
                    (party_id, member_id),
                )
                child = cur.fetchone()
                if child:
                    cur.execute(
                        """
                        UPDATE rsvp
                        SET approved=TRUE, approved_by_child_id=%s, updated_at=NOW()
                        WHERE party_id=%s AND member_id=%s
                        """,
                        (child[0], party_id, member_id),
                    )
                    approved = True
                    approved_by_child = child[0]
                else:
                    cur.execute(
                        """
                        UPDATE rsvp
                        SET approved=FALSE, approved_by_child_id=NULL, updated_at=NOW()
                        WHERE party_id=%s AND member_id=%s
                        """,
                        (party_id, member_id),
                    )
                    approved = False
                    approved_by_child = None
        else:
            # 'maybe' or 'no' ⇒ not approved
            cur.execute(
                """
                UPDATE rsvp
                SET approved=FALSE, approved_by_child_id=NULL, updated_at=NOW()
                WHERE party_id=%s AND member_id=%s
                """,
                (party_id, member_id),
            )
            approved = False
            approved_by_child = None

        # 5) Return current row
        cur.execute(
            "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
            (party_id, member_id),
        )
        r = cur.fetchone()
        rsvp = dict(zip([d.name for d in cur.description], r)) if r else None
        return {"rsvp": rsvp, "locked": False}

    return run_tx(_tx)
