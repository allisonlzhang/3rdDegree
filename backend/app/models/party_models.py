from pydantic import BaseModel, Field
from datetime import datetime

class PartyCreate(BaseModel):
    title: str
    location: str
    starts_at: datetime
    host_name: str = Field(min_length=1)
    host_phone: str = Field(min_length=7)      
    host_password: str = Field(min_length=8)   
    
class PartyOut(BaseModel):
    party: dict
    host_member: dict
    host_invite: dict

class SnapshotResponse(BaseModel):
    started: bool
    roster: list | None = None
    edges: list | None = None
    generated_at: str | None = None