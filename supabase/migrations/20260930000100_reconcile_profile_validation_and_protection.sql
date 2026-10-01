-- Reconcile signup metadata validation with the live public.profiles constraints.
-- Profile creation remains owned by the auth.users trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_username text;
  profile_display_name text;
BEGIN
  profile_username := lower(regexp_replace(
    btrim(coalesce(new.raw_user_meta_data->>'username', '')),
    '^@',
    ''
  ));
  profile_display_name := nullif(btrim(new.raw_user_meta_data->>'display_name'), '');

  IF profile_username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Signup username metadata is missing or invalid'
      USING ERRCODE = '23514';
  END IF;

  IF profile_display_name IS NULL OR char_length(profile_display_name) > 40 THEN
    RAISE EXCEPTION 'Signup display name metadata is missing or invalid'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = profile_username) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'Username already exist.',
      CONSTRAINT = 'profiles_username_key';
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_seed,
    identity_glow_id,
    tutorial_completed
  ) VALUES (
    new.id,
    profile_username,
    profile_display_name,
    gen_random_uuid()::text,
    gen_random_uuid(),
    false
  );

  RETURN new;
END;
$function$;

-- Reject attempts to alter immutable identity and creation fields.
-- tutorial_completed and status deliberately remain mutable for future controlled workflows.
CREATE OR REPLACE FUNCTION public.prevent_profile_system_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'profiles.id is immutable';
  END IF;
  IF NEW.avatar_seed IS DISTINCT FROM OLD.avatar_seed THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'profiles.avatar_seed is system-controlled';
  END IF;
  IF NEW.identity_glow_id IS DISTINCT FROM OLD.identity_glow_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'profiles.identity_glow_id is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'profiles.created_at is immutable';
  END IF;
  RETURN NEW;
END;
$function$;

-- Replace the older one-column glow guard with the complete system-field guard.
DROP TRIGGER IF EXISTS profiles_identity_glow_immutable ON public.profiles;
DROP TRIGGER IF EXISTS profiles_system_fields_immutable ON public.profiles;

CREATE TRIGGER profiles_system_fields_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_system_field_changes();

-- RLS continues to decide which profile row an authenticated user may update.
-- Column privileges decide which fields that client may write on the permitted row.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url)
  ON TABLE public.profiles TO authenticated;

-- A duplicate check was run against the live database before this migration was made.
-- The partial index permits existing/future NULLs while requiring every non-NULL glow ID to be unique.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_identity_glow_id_unique_20260930_idx
  ON public.profiles (identity_glow_id)
  WHERE identity_glow_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
