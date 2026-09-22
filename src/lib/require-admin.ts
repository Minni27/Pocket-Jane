import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { User } from "@supabase/supabase-js";

// Admin status lives in app_metadata, which only the service role can write.
// user_metadata would be the wrong place: users can edit their own, so
// anyone could promote themselves to admin.
export async function requireAdmin(): Promise<
  { ok: true; user: User } | { ok: false; status: number; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: "Not signed in." };
  if (user.app_metadata?.role !== "admin") {
    return { ok: false, status: 403, error: "Admins only." };
  }
  return { ok: true, user };
}
