from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.host import Host
from app.models.party import Party
from app.models.rsvp import RSVP
from app.schemas import PartyCreate, PartyResponse, PartyListResponse
from app.routes.auth import get_current_host
from app.utils.helpers import generate_invite_code

router = APIRouter()

@router.post("/", response_model=PartyResponse)
def create_party(party_data: PartyCreate, current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Create a new party."""
    # Generate unique invite code
    invite_code = generate_invite_code()
    
    # Ensure invite code is unique
    while db.query(Party).filter(Party.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    # Create party
    party = Party(
        name=party_data.name,
        start_time=party_data.start_time,
        location=party_data.location,
        description=party_data.description,
        invite_code=invite_code,
        host_id=current_host.id
    )
    
    db.add(party)
    db.commit()
    db.refresh(party)
    
    return party

@router.get("/", response_model=List[PartyListResponse])
def get_host_parties(current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Get all parties for the current host."""
    parties = db.query(Party).filter(Party.host_id == current_host.id).all()
    
    # Add RSVP counts to each party
    party_responses = []
    for party in parties:
        rsvps = db.query(RSVP).filter(RSVP.party_id == party.id).all()
        attending_count = sum(1 for rsvp in rsvps if rsvp.is_attending)
        
        party_response = PartyListResponse(
            id=party.id,
            name=party.name,
            start_time=party.start_time,
            location=party.location,
            description=party.description,
            invite_code=party.invite_code,
            host_id=party.host_id,
            created_at=party.created_at,
            rsvp_count=len(rsvps),
            attending_count=attending_count
        )
        party_responses.append(party_response)
    
    return party_responses

@router.get("/{party_id}", response_model=PartyResponse)
def get_party(party_id: int, current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Get a specific party by ID."""
    party = db.query(Party).filter(Party.id == party_id, Party.host_id == current_host.id).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    return party

@router.delete("/{party_id}")
def delete_party(party_id: int, current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Delete a party."""
    party = db.query(Party).filter(Party.id == party_id, Party.host_id == current_host.id).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    db.delete(party)
    db.commit()
    
    return {"message": "Party deleted successfully"}

@router.get("/{party_id}/rsvps")
def get_party_rsvps(party_id: int, current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Get all RSVPs for a specific party."""
    # Verify party belongs to current host
    party = db.query(Party).filter(Party.id == party_id, Party.host_id == current_host.id).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    rsvps = db.query(RSVP).filter(RSVP.party_id == party_id).all()
    return rsvps

