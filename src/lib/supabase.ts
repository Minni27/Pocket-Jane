import { createBrowserClient } from "@supabase/ssr";

// Browser client. Reads the session from cookies written by the middleware,
// so RLS policies scoped to auth.uid() apply to every query made from a
// client component.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
