-- Persistent rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

-- No RLS needed — accessed only from server-side API routes via service role
-- Auto-clean expired entries (runs on each upsert via a simple delete)
