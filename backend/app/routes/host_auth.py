from fastapi import APIRouter, HTTPException
from ..db.connection import pool
from ..models.auth_models import HostLoginRequest
from ..util.phone import normalize_phone
from ..util.security import verify_password

router = APIRouter(prefix="/host", tags=["auth"])

@router.post("/login")
def host_login(body: HostLoginRequest):
    try:
        phone_e164 = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e))

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, party_id, name, role, phone, password_hash
                   FROM member
                   WHERE role='host' AND phone=%s
                   ORDER BY id DESC
                   LIMIT 1""",
                (phone_e164,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(401, "invalid credentials")
            member_id, party_id, name, role, phone, pwd_hash = row

            if not verify_password(body.password, pwd_hash):
                raise HTTPException(401, "invalid credentials")

            # return minimal host info (you can set a session/cookie separately)
            return {"member": {"id": member_id, "party_id": party_id, "name": name, "role": role, "phone": phone}}
