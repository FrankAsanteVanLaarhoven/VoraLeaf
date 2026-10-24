CREATE TABLE IF NOT EXISTS oauth_states (
 state TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL,
 verifier_ciphertext TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS oauth_states_expiry ON oauth_states(expires_at);
CREATE TABLE IF NOT EXISTS social_connections (
 user_id TEXT NOT NULL, provider TEXT NOT NULL, token_ciphertext TEXT NOT NULL,
 connected_at INTEGER NOT NULL, PRIMARY KEY(user_id,provider)
);
CREATE TABLE IF NOT EXISTS creator_assets (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL, content_type TEXT NOT NULL, byte_size INTEGER NOT NULL,
 clean_attested INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'private',
 moderation_status TEXT NOT NULL DEFAULT 'pending_review', created_at INTEGER NOT NULL,
 youtube_id TEXT
);
CREATE INDEX IF NOT EXISTS creator_assets_user ON creator_assets(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS live_sessions (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider_uid TEXT NOT NULL,
 title TEXT NOT NULL, publish_ciphertext TEXT NOT NULL, playback_url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'created', ads_enabled INTEGER NOT NULL DEFAULT 0,
 break_minutes INTEGER NOT NULL DEFAULT 10, break_seconds INTEGER NOT NULL DEFAULT 15,
 created_at INTEGER NOT NULL, ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS live_sessions_user ON live_sessions(user_id,created_at DESC);
