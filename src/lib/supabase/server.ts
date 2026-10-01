import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads/writes auth cookies via Next.js's cookie store.
 *
 * NOTE: this must be created fresh per request (it's async because
 * `cookies()` is async in the App Router) — never module-level cached.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component (not a Route
            // Handler/Server Action) — safe to ignore as long as
            // middleware is refreshing the session.
          }
        },
      },
    },
  );
}
