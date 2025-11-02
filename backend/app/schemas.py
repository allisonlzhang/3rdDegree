from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Host schemas
class HostBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10, description="10-digit phone number")
    name: Optional[str] = Field(None, max_length=100)

class HostCreate(HostBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class HostLogin(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=6)

class HostSetup(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class HostResponse(HostBase):
    id: int
    is_setup_complete: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Party schemas
class PartyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    start_time: datetime
    location: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None

class PartyCreate(PartyBase):
    pass

class PartyResponse(PartyBase):
    id: int
    invite_code: str
    host_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PartyListResponse(PartyResponse):
    rsvp_count: int = 0
    attending_count: int = 0

# RSVP schemas
class RSVPBase(BaseModel):
    guest_name: str = Field(..., min_length=1, max_length=100)
    guest_phone: str = Field(..., min_length=10, max_length=10)
    is_attending: bool

class RSVPCreate(RSVPBase):
    invited_by_code: Optional[str] = Field(None, description="Invitation code from the person who invited them")

class RSVPResponse(RSVPBase):
    id: int
    party_id: int
    degree: int
    invited_by_rsvp_id: Optional[int]
    invitation_code: Optional[str]
    is_confirmed: bool
    has_sent_invitation: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class RSVPInviteRequest(BaseModel):
    guest_name: str = Field(..., min_length=1, max_length=100)
    guest_phone: str = Field(..., min_length=10, max_length=10)
    is_attending: bool = True  # Must be True to send invitations

class RSVPInviteResponse(BaseModel):
    invitation_code: str
    invitation_url: str
    message: str

class GuestRSVPResponse(RSVPResponse):
    """RSVP response with party info and first downstream acceptance for guest dashboard."""
    party: PartyResponse
    first_downstream_acceptance: Optional[dict] = None  # {name: str, phone: str} of first person who accepted their invite
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone: Optional[str] = None
