import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// Deleting a user cascades to their analyses and book_chunks via the
// foreign keys, so this wipes their whole library. Irreversible.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Refuse to remove the last admin — that would lock everyone out of this page
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const admins = (list?.users ?? []).filter((u) => u.app_metadata?.role === "admin");
  if (admins.length <= 1 && admins.some((u) => u.id === id)) {
    return NextResponse.json({ error: "That's the last admin — promote someone else first." }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ deleted: id });
}

// Set a new password, or change role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { password, role } = await req.json() as { password?: string; role?: string };

  if (password !== undefined && password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (role !== undefined && id === auth.user.id && role !== "admin") {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {};
  if (password) patch.password = password;
  if (role) patch.app_metadata = { role: role === "admin" ? "admin" : "member" };

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(id, patch);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ updated: id });
}
