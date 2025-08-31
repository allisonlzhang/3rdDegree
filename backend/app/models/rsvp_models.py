from pydantic import BaseModel, Field

class RsvpSetRequest(BaseModel):
    member_id: int
    status: str = Field(pattern="^(yes|maybe|no)$")

class RsvpSetResponse(BaseModel):
    rsvp: dict
    locked: bool
