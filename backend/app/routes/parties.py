# backend/app/routes/parties.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

from ..db.util import run_tx
from ..util.phone import normalize_phone
from ..util.security import hash_password
from ..util.tokens import new_token

router = APIRouter(prefix="/parties", tags=["parties"])


# --------- Schemas ---------

class CreatePartyRequest(BaseModel):
    title: str = Field(min_length=1)
    location: str = Field(min_length=1)
    starts_at: str = Field(min_length=1, description="ISO8601; e.g. 2025-09-10T00:00:00Z")
    host_name: str = Field(min_length=1)
    host_phone: str = Field(min_length=1)
    host_password: str = Field(min_length=6)


class CreatePartyResponse(BaseModel):
    party: dict
    host_member: dict
    host_invite: dict


# --------- Routes ---------

@router.post("", response_model=CreatePartyResponse)
def create_party(body: CreatePartyRequest):
    """
    Creates:
      - party
      - host member (distance=0, has_invite_link=TRUE, phone+password)
      - host rsvp (pending)
      - host invite token
    """
    def _tx(conn, cur):
        # 1) parse/validate inputs
        try:
            starts_at = datetime.fromisoformat(body.starts_at.replace("Z", "+00:00"))
            if starts_at.tzinfo is None:
                # require timezone-aware
                raise ValueError
        except Exception:
            raise HTTPException(400, "invalid starts_at (use ISO 8601, include Z or offset)")

        try:
            phone_e164 = normalize_phone(body.host_phone)
        except ValueError as e:
            raise HTTPException(400, str(e))

        # 2) insert party
        cur.execute(
            """
            INSERT INTO party (title, location, starts_at)
            VALUES (%s, %s, %s)
            RETURNING id, title, location, starts_at, started
            """,
            (body.title.strip(), body.location.strip(), starts_at),
        )
        party = dict(zip([d.name for d in cur.description], cur.fetchone()))
        party_id = party["id"]

        # 3) insert host member
        cur.execute(
            """
            INSERT INTO member
                (party_id, name, role, parent_id, distance, has_invite_link, phone, password_hash)
            VALUES
                (%s, %s, 'host', NULL, 0, TRUE, %s, %s)
            RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
            """,
            (party_id, body.host_name.strip(), phone_e164, hash_password(body.host_password)),
        )
        host_member = dict(zip([d.name for d in cur.description], cur.fetchone()))
        host_id = host_member["id"]

        # 4) host RSVP (pending)
        cur.execute(
            "INSERT INTO rsvp (party_id, member_id, status, approved) VALUES (%s, %s, 'pending', FALSE)",
            (party_id, host_id),
        )

        # 5) host invite link
        token = new_token()
        cur.execute(
            "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s, %s, %s) RETURNING token",
            (party_id, host_id, token),
        )
        token_val = cur.fetchone()[0]
        host_invite = {"token": token_val, "url": f"/{party_id}/invite/{token_val}"}

        return {
            "party": party,
            "host_member": host_member,
            "host_invite": host_invite,
        }

    return run_tx(_tx)
