ALTER TABLE member ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE member ADD COLUMN IF NOT EXISTS password_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_member_party_phone
  ON member (party_id, phone) WHERE phone IS NOT NULL;
