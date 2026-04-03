-- Certificate privacy flag
-- Adds is_public boolean to courses table so certificate share links
-- can be made private. Default true keeps existing behavior unchanged.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Index for fast lookup when checking certificate visibility
CREATE INDEX IF NOT EXISTS courses_is_public_idx ON public.courses (id, is_public);

-- Comment explaining usage
COMMENT ON COLUMN public.courses.is_public IS
  'When false, the certificate share link returns 401 for non-owners. Default true preserves existing open-sharing behavior.';
