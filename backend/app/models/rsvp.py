from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class RSVP(Base):
    __tablename__ = "rsvps"
    
    id = Column(Integer, primary_key=True, index=True)
    guest_name = Column(String(100), nullable=False)
    guest_phone = Column(String(10), nullable=False)
    is_attending = Column(Boolean, nullable=False)  # True for "Yes", False for "No"
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False)
    
    # Kevin Bacon rule fields
    degree = Column(Integer, nullable=False, default=1)  # 1st, 2nd, or 3rd degree
    invited_by_rsvp_id = Column(Integer, ForeignKey("rsvps.id"), nullable=True)  # Who invited this person
    invitation_code = Column(String(20), nullable=True, unique=True)  # Unique code for this RSVP's invitations
    is_confirmed = Column(Boolean, nullable=False, default=False)  # True when chain is complete
    has_sent_invitation = Column(Boolean, nullable=False, default=False)  # Has this person sent an invitation?
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    party = relationship("Party", back_populates="rsvps")
    invited_by = relationship("RSVP", remote_side=[id], backref="invitations_sent")
