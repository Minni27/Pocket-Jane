import { createClient } from "@supabase/supabase-js";
import { env, requireServerEnv } from "@/lib/env";

// Service-role client. This BYPASSES Row Level Security entirely and can
// read, write, and delete anything — so it must never be imported into a
// client component, and the key must never carry a NEXT_PUBLIC_ prefix.
// Used by /api/admin/* (after verifying the caller is an admin) and by the
// cross-tenant daily cap in /api/analyze, which cannot see other tenants'
// rows through RLS.
export function createSupabaseAdminClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Whether the service role is configured, for callers that degrade without it. */
export function hasServiceRole(): boolean {
  return !!env.SUPABASE_SERVICE_ROLE_KEY;
}
