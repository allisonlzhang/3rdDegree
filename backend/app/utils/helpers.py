import string
import random
from typing import Optional

def generate_invite_code(length: int = 8) -> str:
    """Generate a random invite code for parties."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def format_phone_number(phone: str) -> str:
    """Format phone number to 10 digits."""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    # Return last 10 digits
    return digits[-10:] if len(digits) >= 10 else digits
