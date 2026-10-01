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

  IF profile_username !~ '^[a-z0-9_]{3,24}$' THEN
    RAISE EXCEPTION 'Signup username metadata is missing or invalid'
      USING ERRCODE = '23514';
  END IF;

  IF profile_display_name IS NULL OR char_length(profile_display_name) > 50 THEN
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

NOTIFY pgrst, 'reload schema';