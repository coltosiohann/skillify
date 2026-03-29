-- Add weekly XP goal to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_xp_goal integer NOT NULL DEFAULT 200;
