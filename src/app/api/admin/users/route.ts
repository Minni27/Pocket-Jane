import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Per-user row counts, so the UI can say what a delete would destroy.
  // Counted with head+exact rather than fetching rows: PostgREST caps
  // responses at 1000, which would under-report any sizeable library.
  const countFor = async (table: string, userId: string) => {
    const { count } = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  };

  const counted = await Promise.all(
    data.users.map(async (u) => ({
      id: u.id,
      analyses: await countFor("analyses", u.id),
      chunks: await countFor("book_chunks", u.id),
    }))
  );
  const aCount = new Map(counted.map((c) => [c.id, c.analyses]));
  const cCount = new Map(counted.map((c) => [c.id, c.chunks]));

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: (u.app_metadata?.role as string) ?? "member",
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    isSelf: u.id === auth.user.id,
    analyses: aCount.get(u.id) ?? 0,
    chunks: cCount.get(u.id) ?? 0,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email, password, role } = await req.json() as {
    email?: string; password?: string; role?: string;
  };

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true, // no verification email — they can sign in immediately
    app_metadata: { role: role === "admin" ? "admin" : "member" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, role: data.user.app_metadata?.role ?? "member" },
  });
}
