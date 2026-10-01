# FORGED Project Update

Last updated: 2026-09-29

## Current State

- The existing login design is wired to a Supabase password-authentication flow.
- Login accepts an email or a unique username. Username lookup stays server-side and uses the profile-to-auth user ID mapping.
- The successful-login session uses Supabase SSR cookies.
- `/signup` now validates registration details and creates Supabase Auth users plus linked Forged profiles through a server-only service.
- Registration generates an immutable unique Identity Glow ID and initializes `tutorial_completed` to false for new accounts.
- Supabase email confirmation returns users to the app through `/auth/callback`; `/home` is a minimal protected placeholder.
- Password recovery uses Supabase reset emails, the existing callback/session flow, and authenticated password updates.
- The tutorial is intentionally not implemented yet.
- Production build, TypeScript checks, and focused lint checks pass. Live authentication has not been tested.
- Run the app locally with `npm run dev` from the `forged` project directory.

## Problems and Blockers

- Apply `supabase/migrations/20260928000100_registration_profile_fields.sql` to the Supabase database before testing registration. The live schema was not accessible from this workspace, and the migration has not been applied.
- The migration stops if existing usernames collide when compared case-insensitively; resolve any such rows before retrying it.
- Confirm Supabase email confirmation settings and allow-list the app's `/auth/callback` redirect URL.
- `forged/.env.local` is present. It must contain `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; keep the service-role key server-only and never commit the file.
- If the service-role key that appeared in `.env.example` was committed or shared, rotate it in Supabase before relying on it.
- Live account creation and email delivery have not been verified against Supabase.
- Live password-reset email delivery has not been verified; allow-list the callback redirect and confirm the Supabase recovery email template.
- `/home` is only a protected welcome placeholder; the product dashboard is not implemented. The first-time tutorial remains future work.
- Password login requires an Auth email. Phone login is out of scope, and email-less accounts cannot use this password flow.

## Next Steps

1. Apply the registration profile migration to Supabase after reviewing its duplicate-username preflight.
2. Confirm Supabase email confirmation and recovery redirect settings, then test registration, password reset, and email/username login with test accounts.
3. Build the real authenticated home and the tutorial later as separate features.