import phonenumbers

def normalize_phone(raw: str, default_region: str = "US") -> str:
    if not raw:
        raise ValueError("phone required")
    parsed = phonenumbers.parse(raw, default_region)
    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("invalid phone")
    # Return E.164, e.g., +15551234567
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
