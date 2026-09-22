import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Browser client. Reads the session from cookies written by the proxy,
// so RLS policies scoped to auth.uid() apply to every query made from a
// client component.
export const supabase = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
