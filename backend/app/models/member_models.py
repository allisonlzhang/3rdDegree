from pydantic import BaseModel, Field

# Join (via invite link)
class JoinRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=7)

class JoinResponse(BaseModel):
    member: dict
    rsvp: dict
    my_invite: dict | None = None

# "Me" (self view)
class MeResponse(BaseModel):
    member: dict
    rsvp: dict
    unlocker_name: str | None = None
