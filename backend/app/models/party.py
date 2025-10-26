from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Party(Base):
    __tablename__ = "parties"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    invite_code = Column(String(20), unique=True, index=True, nullable=False)  # For guest access
    host_id = Column(Integer, ForeignKey("hosts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    host = relationship("Host", back_populates="parties")
    rsvps = relationship("RSVP", back_populates="party", cascade="all, delete-orphan")
