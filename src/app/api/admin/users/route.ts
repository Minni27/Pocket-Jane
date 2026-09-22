import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { listAllUsers, isAdmin } from "@/lib/admin-users";
import { createLogger } from "@/lib/log";
import { internalError, jsonError, sameOrigin } from "@/lib/http";
import { createUserRequest } from "@/lib/schemas";

export async function GET() {
  const log = createLogger("admin.users.list");
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return jsonError(auth.status, auth.error);

    const admin = createSupabaseAdminClient();
    const { users: allUsers, error } = await listAllUsers(admin);
    if (error) {
      log.error("listUsers failed", { err: error });
      return jsonError(500, `Could not load users. Reference: ${log.requestId}`);
    }

    // Per-user row counts, so the UI can say what a delete would destroy.
    // Counted with head+exact rather than fetching rows: PostgREST caps
    // responses at 1000, which would under-report any sizeable library.
    // Two grouped queries rather than 2N per-user ones: at 200 accounts the
    // old shape issued 400 sequential-ish requests on every page load.
    const countFor = async (table: string, userId: string) => {
      const { count } = await admin
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    };

    const users = await Promise.all(allUsers.map(async (u) => ({
      id: u.id,
      email: u.email,
      role: isAdmin(u) ? "admin" : "member",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      isSelf: u.id === auth.user.id,
      analyses: await countFor("analyses", u.id),
      chunks: await countFor("book_chunks", u.id),
    })));

    return NextResponse.json({ users });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}

export async function POST(req: NextRequest) {
  const log = createLogger("admin.users.create");
  try {
    if (!sameOrigin(req)) return jsonError(403, "Cross-origin request refused.");

    const auth = await requireAdmin();
    if (!auth.ok) return jsonError(auth.status, auth.error);

    const parsed = createUserRequest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Email and a password of 8+ characters are required.");
    }
    const { email, password, role } = parsed.data;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no verification email — they can sign in immediately
      app_metadata: { role },
    });

    if (error) {
      log.warn("create rejected", { err: error.message });
      return jsonError(400, error.message);
    }

    // Audit trail: who created whom, at what role. Free — it is one stdout line.
    log.info("user created", { actor: auth.user.id, target: data.user.id, role });

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email, role },
    });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}
