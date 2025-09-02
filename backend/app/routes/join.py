# backend/app/routes/join.py

from fastapi import APIRouter, HTTPException
from ..db.util import run_tx
from ..models.member_models import JoinRequest, JoinResponse
from ..util.tokens import new_token
from ..util.phone import normalize_phone

router = APIRouter(prefix="/join", tags=["join"])


@router.post("/{party_id}/{token}", response_model=JoinResponse)
def join_party(party_id: int, token: str, body: JoinRequest):
    """
    Join a party via invite token.
    - Validates token belongs to party
    - Creates member (guest) with parent = inviter
    - distance = inviter.distance + 1
    - has_invite_link = (distance < 3)
    - Creates RSVP(pending)
    - Creates a personal invite link only if has_invite_link == True
    """
    def _tx(conn, cur):
        name = (body.name or "").strip()
        if not name:
            raise HTTPException(400, "name required")

        # normalize phone → E.164; reject invalid
        try:
            phone_e164 = normalize_phone(body.phone)
        except ValueError as e:
            raise HTTPException(400, str(e))

        # 1) validate invite token + party
        cur.execute("SELECT inviter_id, party_id FROM invite WHERE token=%s", (token,))
        t = cur.fetchone()
        if not t or t[1] != party_id:
            raise HTTPException(404, "invalid invite")
        inviter_id = t[0]

        # 2) load inviter to compute distance
        cur.execute(
            "SELECT id, party_id, distance FROM member WHERE id=%s",
            (inviter_id,),
        )
        inv = cur.fetchone()
        if not inv or inv[1] != party_id:
            raise HTTPException(404, "invalid inviter")
        new_distance = inv[2] + 1
        has_link = new_distance < 3  # 3rd degree has NO further invite link

        # 3) create member (guard uniqueness of name/phone within party)
        try:
            cur.execute(
                """
                INSERT INTO member
                    (party_id, name, role, parent_id, distance, has_invite_link, phone)
                VALUES
                    (%s, %s, 'guest', %s, %s, %s, %s)
                RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
                """,
                (party_id, name, inviter_id, new_distance, has_link, phone_e164),
            )
        except Exception:
            # likely UNIQUE violation on (party_id, name) or (party_id, phone)
            raise HTTPException(409, "name or phone already exists in this party")

        member = dict(zip([d.name for d in cur.description], cur.fetchone()))
        member_id = member["id"]

        # 4) create RSVP (pending)
        cur.execute(
            """
            INSERT INTO rsvp (party_id, member_id, status, approved)
            VALUES (%s, %s, 'pending', FALSE)
            RETURNING status, approved, approved_by_child_id
            """,
            (party_id, member_id),
        )
        rsvp = dict(zip([d.name for d in cur.description], cur.fetchone()))

        # 5) optional personal invite link (only if < 3 degrees)
        my_invite = None
        if has_link:
            tok = new_token()
            cur.execute(
                "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s, %s, %s) RETURNING token",
                (party_id, member_id, tok),
            )
            token_val = cur.fetchone()[0]
            my_invite = {"token": token_val, "url": f"/{party_id}/invite/{token_val}"}

        return {"member": member, "rsvp": rsvp, "my_invite": my_invite}

    return run_tx(_tx)
