DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    GROUP BY lower(username)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Resolve case-insensitive duplicate profile usernames before applying this migration';
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_glow_id uuid,
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean;

UPDATE public.profiles
SET identity_glow_id = gen_random_uuid()
WHERE identity_glow_id IS NULL;

UPDATE public.profiles
SET tutorial_completed = true
WHERE tutorial_completed IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN identity_glow_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN identity_glow_id SET NOT NULL,
  ALTER COLUMN tutorial_completed SET DEFAULT false,
  ALTER COLUMN tutorial_completed SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique_idx
  ON public.profiles (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_identity_glow_id_unique_idx
  ON public.profiles (identity_glow_id);

CREATE OR REPLACE FUNCTION public.prevent_identity_glow_id_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.identity_glow_id IS DISTINCT FROM OLD.identity_glow_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'identity_glow_id is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_identity_glow_immutable ON public.profiles;

CREATE TRIGGER profiles_identity_glow_immutable
  BEFORE UPDATE OF identity_glow_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_identity_glow_id_change();