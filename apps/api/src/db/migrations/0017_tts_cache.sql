-- 0017_tts_cache
-- Server-side cache of generated TTS audio. Without this, every play of a
-- word's audio re-hits OpenAI (~1-3 sec) — perceived as lag. With it, the
-- first play caches forever; subsequent plays return the bytes directly.
--
-- Cache key includes voice + model so changing either invalidates without
-- serving stale audio.

CREATE TABLE IF NOT EXISTS tts_cache (
  text_hash CHAR(64) PRIMARY KEY,
  text TEXT NOT NULL,
  voice VARCHAR(32) NOT NULL,
  model VARCHAR(32) NOT NULL,
  audio_data BYTEA NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_cache_text ON tts_cache(text);
