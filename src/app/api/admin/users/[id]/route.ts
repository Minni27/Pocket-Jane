import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { listAllUsers, isAdmin } from "@/lib/admin-users";
import { createLogger } from "@/lib/log";
import { internalError, jsonError, sameOrigin } from "@/lib/http";
import { updateUserRequest } from "@/lib/schemas";
import { z } from "zod";

const uuid = z.string().uuid();

// Deleting a user cascades to their analyses and book_chunks via the
// foreign keys, so this wipes their whole library. Irreversible.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = createLogger("admin.users.delete");
  try {
    if (!sameOrigin(req)) return jsonError(403, "Cross-origin request refused.");

    const auth = await requireAdmin();
    if (!auth.ok) return jsonError(auth.status, auth.error);

    const { id } = await params;
    if (!uuid.safeParse(id).success) return jsonError(400, "Not a valid account id.");

    if (id === auth.user.id) {
      return jsonError(400, "You can't delete your own account.");
    }

    const admin = createSupabaseAdminClient();

    // Refuse to remove the last admin — that would lock everyone out of this
    // page. Counted across every page of accounts, not just the first.
    const { users: allUsers, error: listErr } = await listAllUsers(admin);
    if (listErr) {
      log.error("listUsers failed", { err: listErr });
      return jsonError(500, `Could not verify admin count. Reference: ${log.requestId}`);
    }
    const admins = allUsers.filter(isAdmin);
    if (admins.length <= 1 && admins.some((u) => u.id === id)) {
      return jsonError(400, "That's the last admin — promote someone else first.");
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      log.warn("delete rejected", { err: error.message });
      return jsonError(400, error.message);
    }

    log.info("user deleted", { actor: auth.user.id, target: id });
    return NextResponse.json({ deleted: id });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}

// Set a new password, or change role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = createLogger("admin.users.update");
  try {
    if (!sameOrigin(req)) return jsonError(403, "Cross-origin request refused.");

    const auth = await requireAdmin();
    if (!auth.ok) return jsonError(auth.status, auth.error);

    const { id } = await params;
    if (!uuid.safeParse(id).success) return jsonError(400, "Not a valid account id.");

    const parsed = updateUserRequest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Nothing to update.");
    }
    const { password, role } = parsed.data;

    if (role !== undefined && id === auth.user.id && role !== "admin") {
      return jsonError(400, "You can't remove your own admin access.");
    }

    const admin = createSupabaseAdminClient();

    // Demoting the last admin locks everyone out of this page just as
    // surely as deleting them, so it gets the same guard.
    if (role === "member") {
      const { users: allUsers, error: listErr } = await listAllUsers(admin);
      if (listErr) {
        log.error("listUsers failed", { err: listErr });
        return jsonError(500, `Could not verify admin count. Reference: ${log.requestId}`);
      }
      const admins = allUsers.filter(isAdmin);
      if (admins.length <= 1 && admins.some((u) => u.id === id)) {
        return jsonError(400, "That's the last admin — promote someone else first.");
      }
    }

    const patch: { password?: string; app_metadata?: { role: string } } = {};
    if (password) patch.password = password;
    if (role) patch.app_metadata = { role };

    const { error } = await admin.auth.admin.updateUserById(id, patch);
    if (error) {
      log.warn("update rejected", { err: error.message });
      return jsonError(400, error.message);
    }

    log.info("user updated", {
      actor: auth.user.id, target: id,
      changed: [password ? "password" : null, role ? `role=${role}` : null].filter(Boolean),
    });
    return NextResponse.json({ updated: id });
  } catch (err) {
    return internalError(log, err, "unhandled");
  }
}
