from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.party import Party
from app.models.rsvp import RSVP
from app.schemas import RSVPCreate, RSVPResponse, PartyResponse, RSVPInviteRequest, RSVPInviteResponse
from app.utils.helpers import format_phone_number, generate_rsvp_invitation_code

router = APIRouter()

@router.get("/party/{invite_code}", response_model=PartyResponse)
def get_party_by_invite_code(invite_code: str, db: Session = Depends(get_db)):
    """Get party information by invite code (for guests)."""
    party = db.query(Party).filter(Party.invite_code == invite_code).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    return party

def confirm_rsvp_chain(rsvp: RSVP, db: Session):
    """Confirm RSVP and propagate confirmation up the chain."""
    rsvp.is_confirmed = True
    db.commit()
    
    # If this RSVP was invited by someone, confirm them too
    if rsvp.invited_by_rsvp_id:
        inviter = db.query(RSVP).filter(RSVP.id == rsvp.invited_by_rsvp_id).first()
        if inviter and not inviter.is_confirmed:
            confirm_rsvp_chain(inviter, db)

@router.post("/party/{invite_code}/rsvp", response_model=RSVPResponse)
def create_rsvp(invite_code: str, rsvp_data: RSVPCreate, db: Session = Depends(get_db)):
    """Create an RSVP for a party using invite code with Kevin Bacon rule."""
    # Find party by invite code
    party = db.query(Party).filter(Party.invite_code == invite_code).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    # Format phone number
    phone = format_phone_number(rsvp_data.guest_phone)
    if len(phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    # Check if RSVP already exists for this phone number and party
    existing_rsvp = db.query(RSVP).filter(
        RSVP.party_id == party.id,
        RSVP.guest_phone == phone
    ).first()
    
    if existing_rsvp:
        # Update existing RSVP
        existing_rsvp.guest_name = rsvp_data.guest_name
        existing_rsvp.is_attending = rsvp_data.is_attending
        db.commit()
        db.refresh(existing_rsvp)
        return existing_rsvp
    
    # Determine degree and inviter
    degree = 1
    invited_by_rsvp_id = None
    
    if rsvp_data.invited_by_code:
        # Find the RSVP that sent this invitation
        inviter_rsvp = db.query(RSVP).filter(
            RSVP.invitation_code == rsvp_data.invited_by_code,
            RSVP.party_id == party.id
        ).first()
        
        if not inviter_rsvp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invitation code"
            )
        
        if inviter_rsvp.degree >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot invite beyond 3rd degree"
            )
        
        degree = inviter_rsvp.degree + 1
        invited_by_rsvp_id = inviter_rsvp.id
    
    # Create new RSVP
    invitation_code = None
    is_confirmed = False
    
    if degree < 3 and rsvp_data.is_attending:
        # Generate invitation code for 1st and 2nd degree attendees
        invitation_code = generate_rsvp_invitation_code()
        # Ensure uniqueness
        while db.query(RSVP).filter(RSVP.invitation_code == invitation_code).first():
            invitation_code = generate_rsvp_invitation_code()
    elif degree == 3 and rsvp_data.is_attending:
        # 3rd degree attendees are automatically confirmed
        is_confirmed = True
    
    rsvp = RSVP(
        guest_name=rsvp_data.guest_name,
        guest_phone=phone,
        is_attending=rsvp_data.is_attending,
        party_id=party.id,
        degree=degree,
        invited_by_rsvp_id=invited_by_rsvp_id,
        invitation_code=invitation_code,
        is_confirmed=is_confirmed,
        has_sent_invitation=False
    )
    
    db.add(rsvp)
    db.commit()
    db.refresh(rsvp)
    
    # If this is a 3rd degree RSVP, confirm the chain
    if degree == 3 and rsvp_data.is_attending:
        confirm_rsvp_chain(rsvp, db)
        db.refresh(rsvp)
    
    return rsvp

@router.get("/rsvp/{rsvp_id}")
def get_rsvp_details(rsvp_id: int, db: Session = Depends(get_db)):
    """Get RSVP details including invitation information."""
    rsvp = db.query(RSVP).filter(RSVP.id == rsvp_id).first()
    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )
    
    return {
        "rsvp": rsvp,
        "invitation_url": f"/party/{rsvp.party.invite_code}/rsvp?invited_by={rsvp.invitation_code}" if rsvp.invitation_code else None,
        "can_invite": rsvp.degree < 3 and rsvp.is_attending and not rsvp.is_confirmed,
        "needs_invitation": rsvp.degree < 3 and rsvp.is_attending and not rsvp.is_confirmed
    }

def get_first_downstream_acceptance(rsvp: RSVP, db: Session):
    """Find the immediate downstream person who was directly invited by this RSVP."""
    if not rsvp.invitation_code or not rsvp.is_confirmed:
        return None
    
    # Find the first RSVP that was directly invited by this RSVP (immediate downstream)
    # Since this RSVP is confirmed, at least one person they invited must have completed the chain
    immediate_downstream = db.query(RSVP).filter(
        RSVP.invited_by_rsvp_id == rsvp.id,
        RSVP.is_attending == True
    ).order_by(RSVP.created_at).first()
    
    if immediate_downstream:
        return {
            "name": immediate_downstream.guest_name,
            "phone": immediate_downstream.guest_phone
        }
    
    return None

@router.get("/guest/{phone}/rsvps")
def get_guest_rsvps(phone: str, db: Session = Depends(get_db)):
    """Get all RSVPs for a specific guest by phone number, with party info and first downstream acceptance."""
    # Format phone number
    formatted_phone = format_phone_number(phone)
    if len(formatted_phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    rsvps = db.query(RSVP).filter(RSVP.guest_phone == formatted_phone).all()
    
    # Include party information and first downstream acceptance for each RSVP
    rsvps_with_parties = []
    for rsvp in rsvps:
        party = db.query(Party).filter(Party.id == rsvp.party_id).first()
        first_downstream = get_first_downstream_acceptance(rsvp, db) if rsvp.is_confirmed else None
        
        rsvp_dict = {
            "id": rsvp.id,
            "guest_name": rsvp.guest_name,
            "guest_phone": rsvp.guest_phone,
            "is_attending": rsvp.is_attending,
            "party_id": rsvp.party_id,
            "degree": rsvp.degree,
            "invited_by_rsvp_id": rsvp.invited_by_rsvp_id,
            "invitation_code": rsvp.invitation_code,
            "is_confirmed": rsvp.is_confirmed,
            "has_sent_invitation": rsvp.has_sent_invitation,
            "created_at": rsvp.created_at.isoformat(),
            "party": {
                "id": party.id,
                "name": party.name,
                "start_time": party.start_time.isoformat(),
                "location": party.location,
                "description": party.description,
                "invite_code": party.invite_code,
                "host_id": party.host_id,
                "created_at": party.created_at.isoformat()
            } if party else None,
            "first_downstream_acceptance": first_downstream
        }
        rsvps_with_parties.append(rsvp_dict)
    
    return rsvps_with_parties

@router.get("/guest/{phone}/party/{invite_code}")
def get_guest_party_rsvp(phone: str, invite_code: str, db: Session = Depends(get_db)):
    """Get a specific guest's RSVP for a specific party with first downstream acceptance."""
    # Format phone number
    formatted_phone = format_phone_number(phone)
    if len(formatted_phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    # Find party by invite code
    party = db.query(Party).filter(Party.invite_code == invite_code).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    # Find RSVP for this phone and party
    rsvp = db.query(RSVP).filter(
        RSVP.party_id == party.id,
        RSVP.guest_phone == formatted_phone
    ).first()
    
    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )
    
    # Get first downstream acceptance if confirmed
    first_downstream = get_first_downstream_acceptance(rsvp, db) if rsvp.is_confirmed else None
    
    return {
        "id": rsvp.id,
        "guest_name": rsvp.guest_name,
        "guest_phone": rsvp.guest_phone,
        "is_attending": rsvp.is_attending,
        "party_id": rsvp.party_id,
        "degree": rsvp.degree,
        "invited_by_rsvp_id": rsvp.invited_by_rsvp_id,
        "invitation_code": rsvp.invitation_code,
        "is_confirmed": rsvp.is_confirmed,
        "has_sent_invitation": rsvp.has_sent_invitation,
        "created_at": rsvp.created_at.isoformat(),
        "party": {
            "id": party.id,
            "name": party.name,
            "start_time": party.start_time.isoformat(),
            "location": party.location,
            "description": party.description,
            "invite_code": party.invite_code,
            "host_id": party.host_id,
            "created_at": party.created_at.isoformat()
        },
        "first_downstream_acceptance": first_downstream
    }

@router.get("/party/{invite_code}/rsvps/all")
def get_party_rsvps_all(invite_code: str, db: Session = Depends(get_db)):
    """Get all RSVPs for a party (for hosts to see detailed info)."""
    # Find party by invite code
    party = db.query(Party).filter(Party.invite_code == invite_code).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    rsvps = db.query(RSVP).filter(RSVP.party_id == party.id).all()
    
    # Include referrer names
    rsvps_with_referrers = []
    for rsvp in rsvps:
        referrer_name = "Host (1st degree)"
        if rsvp.invited_by_rsvp_id:
            referrer = db.query(RSVP).filter(RSVP.id == rsvp.invited_by_rsvp_id).first()
            if referrer:
                referrer_name = referrer.guest_name
        
        rsvp_dict = {
            "id": rsvp.id,
            "guest_name": rsvp.guest_name,
            "guest_phone": rsvp.guest_phone,
            "is_attending": rsvp.is_attending,
            "party_id": rsvp.party_id,
            "degree": rsvp.degree,
            "invited_by_rsvp_id": rsvp.invited_by_rsvp_id,
            "invitation_code": rsvp.invitation_code,
            "is_confirmed": rsvp.is_confirmed,
            "has_sent_invitation": rsvp.has_sent_invitation,
            "created_at": rsvp.created_at.isoformat(),
            "referrer_name": referrer_name
        }
        rsvps_with_referrers.append(rsvp_dict)
    
    return rsvps_with_referrers

@router.get("/party/{invite_code}/rsvps")
def get_party_rsvps_public(invite_code: str, db: Session = Depends(get_db)):
    """Get all RSVPs for a party (public endpoint for guests to see who's coming)."""
    # Find party by invite code
    party = db.query(Party).filter(Party.invite_code == invite_code).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Party not found"
        )
    
    rsvps = db.query(RSVP).filter(RSVP.party_id == party.id).all()
    
    # Return only attending guests for privacy
    attending_guests = [
        {
            "guest_name": rsvp.guest_name,
            "is_attending": rsvp.is_attending
        }
        for rsvp in rsvps
        if rsvp.is_attending
    ]
    
    return {
        "party_name": party.name,
        "attending_count": len(attending_guests),
        "total_rsvps": len(rsvps),
        "attending_guests": attending_guests
    }
