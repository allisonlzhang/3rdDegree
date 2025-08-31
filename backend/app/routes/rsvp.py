from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from ..db.connection import pool
from ..models.rsvp_models import RsvpSetRequest, RsvpSetResponse

router = APIRouter(prefix="/parties", tags=["rsvp"])

@router.post("/{party_id}/rsvp", response_model=RsvpSetResponse)
def set_rsvp(party_id: int, body: RsvpSetRequest):
    now = datetime.now(timezone.utc)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            # party lock check
            cur.execute("SELECT starts_at, started FROM party WHERE id=%s", (party_id,))
            pr = cur.fetchone()
            if not pr:
                raise HTTPException(404, "party not found")
            starts_at, started = pr
            locked = started or (now >= starts_at)
            if locked:
                return {"rsvp": None, "locked": True}

            # fetch member + distance
            cur.execute(
                "SELECT id, distance FROM member WHERE id=%s AND party_id=%s",
                (body.member_id, party_id),
            )
            mr = cur.fetchone()
            if not mr:
                raise HTTPException(404, "member not found")
            member_id, distance = mr

            # 3) Update status first
            cur.execute(
                "UPDATE rsvp SET status=%s, updated_at=NOW() WHERE party_id=%s AND member_id=%s",
                (body.status, party_id, body.member_id),
            )

            approved = False
            approved_by_child = None

            if body.status == "yes":
                # fetch member distance
                cur.execute(
                    "SELECT distance FROM member WHERE party_id=%s AND id=%s",
                    (party_id, body.member_id),
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(404, "member not found")
                distance = row[0]

                if distance >= 3:
                    # auto-approve
                    cur.execute(
                        "UPDATE rsvp SET approved=true, approved_by_child_id=NULL WHERE party_id=%s AND member_id=%s",
                        (party_id, body.member_id),
                    )
                    approved = True
                else:
                    # check for child
                    cur.execute(
                        """
                        SELECT m.id
                        FROM member m
                        JOIN rsvp r ON r.member_id = m.id AND r.party_id = m.party_id
                        WHERE m.party_id=%s AND m.parent_id=%s AND r.status='yes' AND r.approved=true
                        LIMIT 1
                        """,
                        (party_id, body.member_id),
                    )
                    child = cur.fetchone()
                    if child:
                        cur.execute(
                            "UPDATE rsvp SET approved=true, approved_by_child_id=%s WHERE party_id=%s AND member_id=%s",
                            (child[0], party_id, body.member_id),
                        )
                        approved = True
                        approved_by_child = child[0]
                    else:
                        cur.execute(
                            "UPDATE rsvp SET approved=false, approved_by_child_id=NULL WHERE party_id=%s AND member_id=%s",
                            (party_id, body.member_id),
                        )
                        approved = False
            else:
                # maybe/no always unapproved
                cur.execute(
                    "UPDATE rsvp SET approved=false, approved_by_child_id=NULL WHERE party_id=%s AND member_id=%s",
                    (party_id, body.member_id),
                )
                approved = False

            # NEW: parent auto-unlock if this member just became approved
            if body.status == "yes":
                cur.execute(
                    "SELECT approved FROM rsvp WHERE party_id=%s AND member_id=%s",
                    (party_id, member_id),
                )
                row = cur.fetchone()
                if row and row[0]:
                    cur.execute(
                        "SELECT parent_id FROM member WHERE party_id=%s AND id=%s",
                        (party_id, member_id),
                    )
                    p = cur.fetchone()
                    if p and p[0]:
                        parent_id = p[0]
                        cur.execute(
                            """
                            UPDATE rsvp rp
                            SET approved=TRUE,
                                approved_by_child_id=%s,
                                updated_at=NOW()
                            FROM member mp
                            WHERE rp.party_id=%s
                              AND rp.member_id=%s
                              AND mp.id=rp.member_id
                              AND mp.party_id=rp.party_id
                              AND mp.distance < 3
                              AND rp.status='yes'
                              AND rp.approved=FALSE
                            """,
                            (member_id, party_id, parent_id),
                        )

            # return row
            cur.execute(
                "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
                (party_id, member_id),
            )
            rsvp = dict(zip([d.name for d in cur.description], cur.fetchone()))
            return {"rsvp": rsvp, "locked": False}
