-- Streak freeze: users can preserve their streak for missed days
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freeze_used_at date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;
