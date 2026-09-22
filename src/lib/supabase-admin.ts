import { createClient } from "@supabase/supabase-js";

// Service-role client. This BYPASSES Row Level Security entirely and can
// read, write, and delete anything — so it must never be imported into a
// client component, and the key must never carry a NEXT_PUBLIC_ prefix.
// Only /api/admin/* uses it, and only after verifying the caller is an admin.
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
