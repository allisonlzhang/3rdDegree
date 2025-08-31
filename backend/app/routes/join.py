from fastapi import APIRouter, HTTPException
from ..db.connection import pool
from ..models.member_models import JoinRequest, JoinResponse
from ..util.tokens import new_token
from ..util.phone import normalize_phone

router = APIRouter(prefix="/join", tags=["join"])


@router.post("/{party_id}/{token}", response_model=JoinResponse)
def join_party(party_id: int, token: str, body: JoinRequest):
    """
    Guest joins a party via invite token:
      - validate token & inviter (same party),
      - normalize phone (E.164) and enforce (party_id, phone) uniqueness,
      - create guest member (parent_id = inviter, distance = inviter.distance + 1),
      - create RSVP (pending),
      - if distance < 3, mint their invite link.
    """
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "name required")

    # phone normalization
    try:
        phone_e164 = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    with pool.connection() as conn:
        with conn.cursor() as cur:
            # 0) validate invite token belongs to this party
            cur.execute(
                "SELECT inviter_id, party_id FROM invite WHERE token=%s",
                (token,),
            )
            row = cur.fetchone()
            if not row or row[1] != party_id:
                raise HTTPException(404, "invalid invite")
            inviter_id = row[0]

            # 1) fetch inviter (for distance + party check)
            cur.execute(
                "SELECT id, party_id, distance FROM member WHERE id=%s",
                (inviter_id,),
            )
            inv = cur.fetchone()
            if not inv or inv[1] != party_id:
                raise HTTPException(404, "invalid inviter")

            parent_distance = inv[2]
            new_distance = parent_distance + 1
            has_link = new_distance < 3

            # 2) create member (unique (party_id, name) and (party_id, phone))
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
                # Either duplicate name in party OR duplicate phone in party
                raise HTTPException(409, "name or phone already exists in this party")

            member = dict(zip([d.name for d in cur.description], cur.fetchone()))
            member_id = member["id"]

            # 3) make RSVP (pending)
            cur.execute(
                """
                INSERT INTO rsvp (party_id, member_id, status, approved)
                VALUES (%s, %s, 'pending', FALSE)
                RETURNING status, approved, approved_by_child_id
                """,
                (party_id, member_id),
            )
            rsvp = dict(zip([d.name for d in cur.description], cur.fetchone()))

            # 4) (if distance < 3) mint invite for this member
            my_invite = None
            if has_link:
                t = new_token()
                cur.execute(
                    "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s, %s, %s) RETURNING token",
                    (party_id, member_id, t),
                )
                tok = cur.fetchone()[0]
                my_invite = {"token": tok, "url": f"/{party_id}/invite/{tok}"}

            return {"member": member, "rsvp": rsvp, "my_invite": my_invite}
