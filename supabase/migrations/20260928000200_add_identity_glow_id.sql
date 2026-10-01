ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_glow_id uuid;

NOTIFY pgrst, 'reload schema';