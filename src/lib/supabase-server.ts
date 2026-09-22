import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Server client for route handlers. Carries the caller's session from cookies
// so inserts land under their user_id and RLS applies — using the bare anon
// client here would write rows with a null user_id that nobody can read back.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route handlers can't always set cookies; the proxy refreshes
            // the session anyway, so this is safe to swallow.
          }
        },
      },
    }
  );
}
