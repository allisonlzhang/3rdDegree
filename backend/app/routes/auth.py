from fastapi import APIRouter, HTTPException
from ..db.util import run_tx
from ..models.auth_models import LoginRequest, LoginResponse
from ..models.member_models import MeResponse

router = APIRouter(prefix="/login", tags=["auth"])
me_router = APIRouter(prefix="/parties", tags=["me"])

@router.post("/{party_id}", response_model=LoginResponse)
def login_by_name(party_id: int, body: LoginRequest):
    def _tx(conn, cur):
        name = body.name.strip()
        if not name:
            raise HTTPException(400, "name required")

        cur.execute(
            """SELECT id, party_id, name, role, parent_id, distance, has_invite_link
               FROM member WHERE party_id=%s AND name=%s""",
            (party_id, name)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "member not found")
        member = dict(zip([d.name for d in cur.description], row))
        member_id = member["id"]

        cur.execute(
            "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
            (party_id, member_id)
        )
        rrow = cur.fetchone()
        if not rrow:
            raise HTTPException(500, "rsvp missing")
        rsvp = dict(zip([d.name for d in cur.description], rrow))

        my_invite = None
        if member["has_invite_link"] and member["distance"] < 3:
            cur.execute(
                "SELECT token FROM invite WHERE party_id=%s AND inviter_id=%s ORDER BY created_at DESC LIMIT 1",
                (party_id, member_id)
            )
            tok = cur.fetchone()
            if tok:
                my_invite = {"token": tok[0], "url": f"/{party_id}/invite/{tok[0]}"}

        return {"member": member, "rsvp": rsvp, "my_invite": my_invite}

    return run_tx(_tx)

@me_router.get("/{party_id}/me", response_model=MeResponse)
def get_me(party_id: int, member_id: int):
    def _tx(conn, cur):
        cur.execute(
            "SELECT id, party_id, name, role, parent_id, distance, has_invite_link FROM member WHERE party_id=%s AND id=%s",
            (party_id, member_id)
        )
        m = cur.fetchone()
        if not m:
            raise HTTPException(404, "member not found")
        member = dict(zip([d.name for d in cur.description], m))

        cur.execute(
            "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
            (party_id, member_id)
        )
        r = cur.fetchone()
        if not r:
            raise HTTPException(500, "rsvp missing")
        rsvp = dict(zip([d.name for d in cur.description], r))

        unlocker_name = None
        if rsvp["approved_by_child_id"]:
            cur.execute(
                "SELECT name FROM member WHERE party_id=%s AND id=%s",
                (party_id, rsvp["approved_by_child_id"])
            )
            n = cur.fetchone()
            if n:
                unlocker_name = n[0]

        return {"member": member, "rsvp": rsvp, "unlocker_name": unlocker_name}

    return run_tx(_tx)
