from fastapi import APIRouter, HTTPException
from ..db.connection import pool
from ..models.party_models import PartyCreate, PartyOut
from ..util.tokens import new_token
from ..util.phone import normalize_phone
from ..util.security import hash_password

router = APIRouter(prefix="/parties", tags=["parties"])


@router.post("", response_model=PartyOut)
def create_party(body: PartyCreate):
    """
    Creates a party, host member (with phone + password), host RSVP (pending),
    and the host's initial invite token.
    """
    # Validate / normalize inputs
    try:
        phone_e164 = normalize_phone(body.host_phone)
        pwd_hash = hash_password(body.host_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = new_token()

    with pool.connection() as conn:
        with conn.cursor() as cur:
            try:
                # 1) party
                cur.execute(
                    """
                    INSERT INTO party (title, location, starts_at)
                    VALUES (%s, %s, %s)
                    RETURNING id, title, location, starts_at, started
                    """,
                    (body.title, body.location, body.starts_at),
                )
                party = dict(zip([d.name for d in cur.description], cur.fetchone()))
                party_id = party["id"]

                # 2) host member (phone + password_hash)
                cur.execute(
                    """
                    INSERT INTO member
                        (party_id, name, role, parent_id, distance, has_invite_link, phone, password_hash)
                    VALUES
                        (%s, %s, 'host', NULL, 0, TRUE, %s, %s)
                    RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
                    """,
                    (party_id, body.host_name, phone_e164, pwd_hash),
                )
                host_member = dict(zip([d.name for d in cur.description], cur.fetchone()))
                host_id = host_member["id"]

                # 2b) host RSVP (pending)
                cur.execute(
                    "INSERT INTO rsvp (party_id, member_id, status, approved) VALUES (%s, %s, 'pending', FALSE)",
                    (party_id, host_id),
                )

                # 3) host invite
                cur.execute(
                    "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s, %s, %s) RETURNING token",
                    (party_id, host_id, token),
                )
                token_row = cur.fetchone()
                host_invite = {"token": token_row[0], "url": f"/{party_id}/invite/{token_row[0]}"}

                return {"party": party, "host_member": host_member, "host_invite": host_invite}

            except Exception as e:
                # Most likely unique constraint on (party_id, phone) or other DB error
                raise HTTPException(status_code=400, detail=str(e))
