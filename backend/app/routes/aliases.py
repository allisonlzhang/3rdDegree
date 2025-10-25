# backend/app/routes/aliases.py
from fastapi import APIRouter, HTTPException, Query
from ..db.util import run_tx

router = APIRouter(prefix="/host", tags=["aliases"])

@router.get("/me")
def host_me(member_id: int | None = None, party_id: int | None = None):
    if not member_id or not party_id:
        raise HTTPException(400, "member_id and party_id required")
    
    def _tx(conn, cur):
        cur.execute(
            "SELECT status, approved, approved_by_child_id FROM rsvp WHERE party_id=%s AND member_id=%s",
            (party_id, member_id),
        )
        if not cur.fetchone():
            raise HTTPException(404, "not found")
        return {"ok": True}
    
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
def update_host_name(member_id: int, name: str):
    """Update host's name"""
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
