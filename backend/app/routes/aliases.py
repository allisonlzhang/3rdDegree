# backend/app/routes/aliases.py
from fastapi import APIRouter, HTTPException, Query
from ..db.util import run_tx

router = APIRouter(prefix="/host", tags=["aliases"])

@router.get("/me")
def host_me(member_id: str | None = None, party_id: str | None = None):
    if not member_id:
        raise HTTPException(400, "member_id required")
    
    def _tx(conn, cur):
        # Convert string to int for database query
        try:
            member_id_int = int(member_id)
        except ValueError:
            raise HTTPException(400, "Invalid member_id")
        
        # Check if member exists and is a host
        cur.execute(
            "SELECT id, name, role, party_id FROM member WHERE id=%s AND role='host'",
            (member_id_int,)
        )
        member = cur.fetchone()
        if not member:
            raise HTTPException(404, "Host member not found")
        
        member_id_db, name, role, party_id_db = member
        
        # If no party_id provided or member has no party, return basic host info
        if not party_id or not party_id_db:
            return {
                "ok": True,
                "member": {
                    "id": member_id_db,
                    "name": name,
                    "role": role,
                    "party_id": party_id_db
                }
            }
        
        # If party_id provided, check RSVP status
        try:
            party_id_int = int(party_id)
        except (ValueError, TypeError):
            raise HTTPException(400, "Invalid party_id")
            
        cur.execute(
            "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
            (party_id_int, member_id_int),
        )
        rsvp = cur.fetchone()
        if not rsvp:
            raise HTTPException(404, "RSVP not found")
        
        return {
            "ok": True,
            "member": {
                "id": member_id_db,
                "name": name,
                "role": role,
                "party_id": party_id_db
            },
            "rsvp": {
                "status": rsvp[0],
                "approved": rsvp[1],
                "approved_by_child_id": rsvp[2]
            }
        }
    
    return run_tx(_tx)

@router.get("/parties")
def host_parties(member_id: int = Query(...)):
    """Get all parties for a host member"""
    def _tx(conn, cur):
        cur.execute(
            """
            SELECT p.id, p.title, p.location, p.starts_at, p.started
            FROM party p
            JOIN member m ON p.id = m.party_id
            WHERE m.id = %s AND m.role = 'host'
            ORDER BY p.starts_at DESC
            """,
            (member_id,)
        )
        parties = []
        for row in cur.fetchall():
            parties.append({
                "id": str(row[0]),
                "title": row[1],
                "location": row[2],
                "starts_at": row[3].isoformat() if row[3] else None,
                "started": row[4]
            })
        return parties
    
    return run_tx(_tx)

@router.post("/update-name")
def update_host_name(payload: dict):
    """Update host's name"""
    member_id = payload.get("member_id")
    name = payload.get("name")
    
    if not member_id or not name:
        raise HTTPException(400, "member_id and name are required")
    
    def _tx(conn, cur):
        # Update the member's name
        cur.execute(
            "UPDATE member SET name = %s WHERE id = %s AND role = 'host'",
            (name.strip(), member_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Host member not found")
        
        return {"ok": True, "message": "Name updated successfully"}
    
    return run_tx(_tx)
