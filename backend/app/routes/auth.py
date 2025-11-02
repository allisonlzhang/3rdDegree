from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from app.database import get_db
from app.models.host import Host
from app.schemas import HostCreate, HostLogin, HostSetup, HostResponse, Token
from app.utils.security import verify_password, get_password_hash, create_access_token, verify_token
from app.utils.helpers import format_phone_number

router = APIRouter()
security = HTTPBearer()

def get_current_host(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> Host:
    """Get the current authenticated host from JWT token."""
    token = credentials.credentials
    phone = verify_token(token)
    if phone is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    host = db.query(Host).filter(Host.phone == phone).first()
    if host is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Host not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return host

@router.post("/signup", response_model=HostResponse)
def signup(host_data: HostCreate, db: Session = Depends(get_db)):
    """Create a new host account."""
    # Format phone number
    phone = format_phone_number(host_data.phone)
    if len(phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    # Check if host already exists
    existing_host = db.query(Host).filter(Host.phone == phone).first()
    if existing_host:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create new host
    host = Host(
        phone=phone,
        password_hash=get_password_hash(host_data.password),
        name=host_data.name,
        is_setup_complete=bool(host_data.name)  # Complete setup if name provided
    )
    
    db.add(host)
    db.commit()
    db.refresh(host)
    
    return host

@router.post("/login", response_model=Token)
def login(login_data: HostLogin, db: Session = Depends(get_db)):
    """Login with phone and password."""
    # Format phone number
    phone = format_phone_number(login_data.phone)
    if len(phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    # Find host
    host = db.query(Host).filter(Host.phone == phone).first()
    if not host or not verify_password(login_data.password, host.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": host.phone}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/setup", response_model=HostResponse)
def setup_host(setup_data: HostSetup, current_host: Host = Depends(get_current_host), db: Session = Depends(get_db)):
    """Complete host setup (set name)."""
    if current_host.is_setup_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Host setup already completed"
        )
    
    # Update host with name
    current_host.name = setup_data.name
    current_host.is_setup_complete = True
    
    db.commit()
    db.refresh(current_host)
    
    return current_host

@router.get("/me", response_model=HostResponse)
def get_current_host_info(current_host: Host = Depends(get_current_host)):
    """Get current host information."""
    return current_host

