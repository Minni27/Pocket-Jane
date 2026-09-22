import type { SupabaseClient, User } from "@supabase/supabase-js";

const PAGE = 200;

/**
 * Every account, across pages.
 *
 * listUsers() caps a page at 1000 and defaults far lower, so a single call
 * silently truncated the list: above 200 accounts the "last admin" guard
 * could miss an admin on page 2 and let the final one be deleted, locking
 * everyone out of the admin page.
 */
export async function listAllUsers(
  admin: SupabaseClient,
  maxPages = 25
): Promise<{ users: User[]; error?: string }> {
  const users: User[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) return { users, error: error.message };
    users.push(...data.users);
    if (data.users.length < PAGE) break;
  }
  return { users };
}

export function isAdmin(u: User): boolean {
  return u.app_metadata?.role === "admin";
}
