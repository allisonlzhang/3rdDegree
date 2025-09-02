from fastapi import APIRouter, HTTPException
from ..db.connection import pool
from ..models.member_models import JoinRequest, JoinResponse
from ..util.tokens import new_token
from ..util.phone import normalize_phone

router = APIRouter(prefix="/join", tags=["join"])

@router.post("/{party_id}/{token}", response_model=JoinResponse)
def join_party(party_id: int, token: str, body: JoinRequest):
    try:
        pool.open(wait=True, timeout=30)
    except Exception:
        # if it's already open, this is harmless; continue
        pass

    try:
        name = (body.name or "").strip()
        if not name:
            raise HTTPException(400, "name required")

        try:
            phone_e164 = normalize_phone(body.phone)
        except ValueError as e:
            raise HTTPException(400, str(e))

        with pool.connection() as conn, conn.cursor() as cur:
            # validate invite token belongs to this party
            cur.execute("SELECT inviter_id, party_id FROM invite WHERE token=%s", (token,))
            r = cur.fetchone()
            if not r or r[1] != party_id:
                raise HTTPException(404, "invalid invite")

            inviter_id = r[0]
            # fetch inviter (distance)
            cur.execute("SELECT id, party_id, distance FROM member WHERE id=%s", (inviter_id,))
            inv = cur.fetchone()
            if not inv or inv[1] != party_id:
                raise HTTPException(404, "invalid inviter")

            new_distance = inv[2] + 1
            has_link = new_distance < 3

            # insert member (catch name/phone uniqueness)
            try:
                cur.execute(
                    """
                    INSERT INTO member
                        (party_id, name, role, parent_id, distance, has_invite_link, phone)
                    VALUES
                        (%s,%s,'guest',%s,%s,%s,%s)
                    RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
                    """,
                    (party_id, name, inviter_id, new_distance, has_link, phone_e164),
                )
            except Exception as e:
                # likely unique constraint (name or phone already used in this party)
                raise HTTPException(409, "name or phone already exists in this party")

            member = dict(zip([d.name for d in cur.description], cur.fetchone()))
            member_id = member["id"]

            # create RSVP
            cur.execute(
                """
                INSERT INTO rsvp (party_id, member_id, status, approved)
                VALUES (%s, %s, 'pending', FALSE)
                RETURNING status, approved, approved_by_child_id
                """,
                (party_id, member_id),
            )
            rsvp = dict(zip([d.name for d in cur.description], cur.fetchone()))

            # optional invite for this member
            my_invite = None
            if has_link:
                t = new_token()
                cur.execute(
                    "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s,%s,%s) RETURNING token",
                    (party_id, member_id, t),
                )
                tok = cur.fetchone()[0]
                my_invite = {"token": tok, "url": f"/{party_id}/invite/{tok}"}

            return {"member": member, "rsvp": rsvp, "my_invite": my_invite}

    except HTTPException as he:
        # return clean JSON (no 500)
        raise he
    except Exception as e:
        # last-resort shield
        raise HTTPException(400, f"join failed: {str(e)}")
