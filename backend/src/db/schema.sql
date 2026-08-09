CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  birth_date DATE,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('LIKE', 'DISLIKE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT swipes_unique UNIQUE (swiper_id, target_id)
);

CREATE INDEX IF NOT EXISTS swipes_swiper_id_idx ON swipes (swiper_id);
CREATE INDEX IF NOT EXISTS swipes_target_id_idx ON swipes (target_id);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT matches_unique UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS matches_user1_id_idx ON matches (user1_id);
CREATE INDEX IF NOT EXISTS matches_user2_id_idx ON matches (user2_id);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages (sender_id);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  token TEXT PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
