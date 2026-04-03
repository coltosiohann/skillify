-- Add RLS to rate_limits table
-- The table was created in 011 without RLS ("No RLS needed" comment was premature).
-- Server-side API routes use the service role key (bypasses RLS),
-- so enabling RLS here only prevents accidental client-side reads/writes.

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed for regular users — only service_role can access this table.
-- This effectively blocks all anon/authenticated direct access while keeping
-- server-side (service_role) operations working as before.
