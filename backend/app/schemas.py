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
    pass

class RSVPResponse(RSVPBase):
    id: int
    party_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone: Optional[str] = None
