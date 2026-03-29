-- Track time spent in lessons
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_minutes_learned integer NOT NULL DEFAULT 0;
