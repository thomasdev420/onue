-- Per-user API keys for POST /api/v1/route (hashed at rest).
-- Run in Supabase SQL editor. Service role from Next.js bypasses RLS.

CREATE TABLE IF NOT EXISTS amply_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_amply_api_keys_hash_active
    ON amply_api_keys (key_hash)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_amply_api_keys_user_active
    ON amply_api_keys (user_id)
    WHERE revoked_at IS NULL;

COMMENT ON TABLE amply_api_keys IS 'User-issued Amply API keys (secret stored as SHA-256 only)';

ALTER TABLE amply_api_keys ENABLE ROW LEVEL SECURITY;
