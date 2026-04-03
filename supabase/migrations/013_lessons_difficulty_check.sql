-- Add CHECK constraint on lessons.difficulty
-- The app uses 'standard' as default (not 'beginner'), so the constraint allows:
-- easy | standard | challenging | beginner | intermediate | advanced

-- Step 1: Ensure the column exists
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS difficulty text;

-- Step 2: Normalize any existing bad values before adding the constraint.
-- NULL → 'standard', anything not in the allowed list → 'standard'
UPDATE public.lessons
SET difficulty = 'standard'
WHERE difficulty IS NULL
   OR difficulty NOT IN ('easy', 'standard', 'challenging', 'beginner', 'intermediate', 'advanced');

-- Step 3: Now that all rows are valid, set NOT NULL + default
ALTER TABLE public.lessons
  ALTER COLUMN difficulty SET NOT NULL,
  ALTER COLUMN difficulty SET DEFAULT 'standard';

-- Step 4: Drop old constraint if it exists, then add fresh one
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_difficulty_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_difficulty_check
  CHECK (difficulty IN ('easy', 'standard', 'challenging', 'beginner', 'intermediate', 'advanced'));

-- Step 5: Ensure content_json and estimated_minutes columns exist
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer NOT NULL DEFAULT 8;
