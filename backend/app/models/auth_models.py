from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    name: str = Field(min_length=1)

class LoginResponse(BaseModel):
    member: dict
    rsvp: dict
    my_invite: dict | None = None

class HostLoginRequest(BaseModel):
    phone: str = Field(min_length=7)
    password: str = Field(min_length=8)