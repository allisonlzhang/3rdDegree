# backend/app/routes/host_auth.py

from fastapi import APIRouter, Body, HTTPException
from datetime import datetime, timedelta, timezone

from ..db.util import run_tx
from ..util.phone import normalize_phone
from ..util.security import hash_password, verify_password
from ..util.tokens import new_token

router = APIRouter(prefix="/host", tags=["host-auth"])


@router.post("/login")
def host_login(payload: dict = Body(...)):
    """
    Login by phone+password.

    Behavior:
      - If a host with this phone exists (latest row by id):
          * If password_hash is NULL, set it to the provided password (first-time set).
          * Else verify; on mismatch -> {"error":"invalid credentials"}.
          * Return member + party metadata.
      - If not found:
          * Auto-create party + host(member) + rsvp + invite.
          * Return member + party + host_invite.

    This endpoint does not raise 500 on normal client errors; it returns JSON with "error".
    """
    phone_raw = (payload.get("phone") or "").strip()
    password = (payload.get("password") or "").strip()
    if not phone_raw or not password:
        raise HTTPException(400, "phone and password are required")

    # Normalize phone to E.164; raise 400 if invalid
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as e:
        raise HTTPException(400, str(e))

    def _tx(conn, cur):
        # 1) Try to find an existing host by phone (most recent)
        cur.execute(
            """
            SELECT id, party_id, name, role, phone, password_hash
            FROM member
            WHERE role='host' AND phone=%s
            ORDER BY id DESC
            LIMIT 1
            """,
            (phone,),
        )
        row = cur.fetchone()

        if row:
            member_id, party_id, name, role, phone_db, pwd_hash = row

            # First-time password set
            if not pwd_hash:
                cur.execute(
                    "UPDATE member SET password_hash=%s WHERE id=%s",
                    (hash_password(password), member_id),
                )
            else:
                if not verify_password(password, pwd_hash):
                    return {"error": "invalid credentials"}

            # Fetch party metadata
            cur.execute(
                "SELECT id, title, location, starts_at, started FROM party WHERE id=%s",
                (party_id,),
            )
            prow = cur.fetchone()
            party = (
                dict(zip([d.name for d in cur.description], prow))
                if prow else None
            )

            return {
                "member": {
                    "id": member_id,
                    "party_id": party_id,
                    "name": name,
                    "role": role,
                    "phone": phone_db,
                },
                "party": party,
            }

        # 2) Not found → Create host account with a placeholder party
        name = (payload.get("name") or "Host").strip()
        pwd_hash = hash_password(password)

        # Create a placeholder party (will be hidden in frontend)
        cur.execute(
            """
            INSERT INTO party (title, location, starts_at, started)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, location, starts_at, started
            """,
            ("PLACEHOLDER_PARTY", "TBD", datetime.now(timezone.utc) + timedelta(days=365), True),
        )
        party = dict(zip([d.name for d in cur.description], cur.fetchone()))
        party_id = party["id"]

        # Create host member with placeholder party
        cur.execute(
            """
            INSERT INTO member
                (party_id, name, role, parent_id, distance, has_invite_link, phone, password_hash)
            VALUES
                (%s, %s, 'host', NULL, 0, TRUE, %s, %s)
            RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
            """,
            (party_id, name, phone, pwd_hash),
        )
        host = dict(zip([d.name for d in cur.description], cur.fetchone()))
        host_id = host["id"]

        # Host RSVP (pending)
        cur.execute(
            "INSERT INTO rsvp (party_id, member_id, status, approved) VALUES (%s, %s, 'pending', FALSE)",
            (party_id, host_id),
        )

        # Return response with placeholder party (frontend will hide it)
        return {
            "member": {"id": host_id, "party_id": party_id, "name": name, "role": "host", "phone": phone},
            "party": party,
            "host_invite": None,
        }

    # Execute with per-request connection
    return run_tx(_tx)
