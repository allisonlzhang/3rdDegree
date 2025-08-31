-- Parties
CREATE TABLE party (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  location     TEXT NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  started      BOOLEAN NOT NULL DEFAULT FALSE,
  snapshot     JSONB
);
CREATE INDEX idx_party_starts_at ON party (starts_at);
CREATE INDEX idx_party_started   ON party (started);

-- Members (scoped to a party)
CREATE TABLE member (
  id               BIGSERIAL PRIMARY KEY,
  party_id         BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
  name             TEXT   NOT NULL,
  role             TEXT   NOT NULL CHECK (role IN ('host','guest')),
  parent_id        BIGINT REFERENCES member(id) ON DELETE SET NULL,
  distance         INT    NOT NULL DEFAULT 0,
  has_invite_link  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (party_id, name)
);
CREATE INDEX idx_member_party_parent   ON member (party_id, parent_id);
CREATE INDEX idx_member_party_distance ON member (party_id, distance);

-- Invites (personalized tokens tied to inviter)
CREATE TABLE invite (
  id          BIGSERIAL PRIMARY KEY,
  party_id    BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
  inviter_id  BIGINT NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  token       TEXT   NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invite_party_inviter ON invite (party_id, inviter_id);

-- RSVPs (one per member per party)
CREATE TABLE rsvp (
  id                  BIGSERIAL PRIMARY KEY,
  party_id            BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
  member_id           BIGINT NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  status              TEXT   NOT NULL CHECK (status IN ('pending','yes','maybe','no')),
  approved            BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_child_id BIGINT REFERENCES member(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, member_id)
);
CREATE INDEX idx_rsvp_party_status_approved ON rsvp (party_id, status, approved);
CREATE INDEX idx_rsvp_party_approved        ON rsvp (party_id, approved);

-- Optional: enforce "one host per party" (soft, via partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_host_per_party
  ON member (party_id)
  WHERE role = 'host';
