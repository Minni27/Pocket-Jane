"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Icon, Input, Label } from "@/components/ui";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
  isSelf: boolean;
  analyses: number;
  chunks: number;
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const show = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to load users."); setLoading(false); return; }
    setUsers(json.users);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-4xl mx-auto w-full gap-8">

      {toast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          zIndex: 999, padding: "var(--s-4) var(--s-5)", borderRadius: "var(--r-card)",
          background: "var(--surface)", border: "1px solid var(--border)",
          boxShadow: "0 0 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "var(--s-3)",
        }}>
          <Icon name="check" size={15} style={{ color: "var(--signal)" }} />
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-primary)" }}>{toast}</span>
        </div>
      )}

      <div>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "var(--t-display)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 var(--s-2)" }}>
          Users
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-muted)", margin: 0, maxWidth: "var(--measure)" }}>
          Create an account and hand over the password yourself. Each person gets their own library, their own readings, and their own calibration.
        </p>
      </div>

      {error && (
        <div style={{
          padding: "var(--s-3) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--surface)",
          border: "1px solid var(--border-accent)", color: "var(--accent-text)",
          fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)",
        }}>
          {error}
        </div>
      )}

      {adding
        ? <AddUserForm onDone={(msg) => { setAdding(false); if (msg) { show(msg); refresh(); } }} />
        : (
          <Button variant="secondary" icon="plus" onClick={() => setAdding(true)} style={{ alignSelf: "flex-start" }}>
            New user
          </Button>
        )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card p-4" style={{ height: "64px" }}>
              <div className="shimmer h-3 w-48 rounded mb-2" />
              <div className="shimmer h-2 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <UserRow key={u.id} user={u} onChanged={(msg) => { show(msg); refresh(); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: (msg?: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function generate() {
    const a = "abcdefghjkmnpqrstuvwxyz";
    const pick = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)))
      .map((b) => a[b % a.length]).join("");
    const num = 1000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 9000);
    setPassword(`${pick(4)}-${pick(4)}-${num}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(json.error ?? "Failed to create user."); return; }
    onDone(`Created ${email} — password: ${password}`);
  }

  return (
    <form onSubmit={submit} className="card p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div style={{ flex: 1 }}>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="them@example.com" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Password</Label>
          <div className="flex gap-2">
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="at least 8 characters" />
            <button type="button" onClick={generate}
              style={{ flexShrink: 0, padding: "0 12px", borderRadius: "var(--r-input)", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer", whiteSpace: "nowrap" }}
            >Generate</button>
          </div>
        </div>
      </div>

      <div>
        <Label>Role</Label>
        <div className="flex gap-2">
          {["member", "admin"].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              style={{
                padding: "var(--s-2) var(--s-4)", borderRadius: "var(--r-input)", cursor: "pointer",
                fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
                fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                background: role === r ? "var(--raised)" : "transparent",
                border: `1px solid ${role === r ? "var(--border-accent)" : "var(--border)"}`,
                color: role === r ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >{r}</button>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", color: "var(--text-ghost)", marginTop: "var(--s-2)" }}>
          Admins can create and delete users. Members only get their own workspace.
        </p>
      </div>

      {err && (
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", color: "var(--accent-text)", background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: "var(--r-input)", padding: "var(--s-3) var(--s-3)", margin: 0 }}>
          {err}
        </p>
      )}

      <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", color: "var(--text-ghost)", margin: 0, lineHeight: 1.6 }}>
        No email is sent. Copy the password and pass it on yourself — it is shown once, after you create the account.
      </p>

      <div className="flex gap-2 flex-wrap">
        <button type="submit" disabled={busy || !email || !password}
          style={{ padding: "9px 22px", borderRadius: "var(--r-input)", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--signal)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", fontWeight: 500, letterSpacing: "0.06em", cursor: busy ? "not-allowed" : "pointer", opacity: busy || !email || !password ? 0.5 : 1 }}
        >{busy ? "Creating…" : "Create user"}</button>
        <button type="button" onClick={() => onDone()}
          style={{ padding: "var(--s-3) var(--s-4)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
        >Cancel</button>
      </div>
    </form>
  );
}

function UserRow({ user, onChanged }: { user: AdminUser; onChanged: (msg: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false); setConfirming(false);
    onChanged(res.ok ? `Deleted ${user.email}` : json.error);
  }

  async function savePassword() {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw }),
    });
    const json = await res.json();
    setBusy(false); setResetting(false);
    onChanged(res.ok ? `New password for ${user.email}: ${newPw}` : json.error);
    setNewPw("");
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="card p-4" style={{ borderColor: isAdmin ? "var(--border)" : undefined }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div style={{
          width: "34px", height: "34px", borderRadius: "var(--r-input)", flexShrink: 0,
          background: "var(--raised)", border: `1px solid ${isAdmin ? "var(--border)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--t-ui)", color: isAdmin ? "var(--signal)" : "var(--text-muted)",
        }}>
          <Icon name={isAdmin ? "users" : "eye"} size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-primary)", marginBottom: "var(--s-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
            {user.isSelf && <span style={{ color: "var(--text-ghost)", fontSize: "var(--t-meta)" }}> — you</span>}
          </p>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", color: "var(--text-ghost)" }}>
            {user.role} · {user.analyses} reading{user.analyses === 1 ? "" : "s"} · {user.chunks.toLocaleString()} passages
            {user.lastSignInAt
              ? ` · last in ${new Date(user.lastSignInAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : " · never signed in"}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={() => setResetting((r) => !r)}
            style={{ padding: "var(--s-2) var(--s-3)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
          >Set password</button>
          {!user.isSelf && (
            <button onClick={() => setConfirming(true)}
              style={{ padding: "var(--s-2) var(--s-3)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-ghost)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-text)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >Delete</button>
          )}
        </div>
      </div>

      {resetting && (
        <div className="flex gap-2 flex-wrap" style={{ marginTop: "var(--s-3)", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <input
            type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            placeholder="new password, at least 8 characters" autoFocus
            style={{ flex: 1, minWidth: "200px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-input)", outline: "none", padding: "var(--s-2) var(--s-3)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-primary)" }}
          />
          <button onClick={savePassword} disabled={busy || newPw.length < 8}
            style={{ padding: "var(--s-2) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--signal)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer", opacity: newPw.length < 8 ? 0.5 : 1 }}
          >Save</button>
          <button onClick={() => { setResetting(false); setNewPw(""); }}
            style={{ padding: "var(--s-2) var(--s-3)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
          >Cancel</button>
        </div>
      )}

      {confirming && (
        <div style={{ marginTop: "var(--s-3)", paddingTop: "12px", borderTop: "1px solid var(--border-accent)" }}>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: "var(--s-3)" }}>
            Delete <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>? This also destroys their{" "}
            {user.analyses} reading{user.analyses === 1 ? "" : "s"} and {user.chunks.toLocaleString()} book passages. It cannot be undone.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={del} disabled={busy}
              style={{ padding: "var(--s-2) var(--s-4)", borderRadius: "var(--r-input)", background: "var(--surface)", border: "1px solid var(--border-accent)", color: "var(--accent-text)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", fontWeight: 500, cursor: "pointer" }}
            >{busy ? "Deleting…" : "Yes, delete permanently"}</button>
            <button onClick={() => setConfirming(false)}
              style={{ padding: "var(--s-2) var(--s-3)", borderRadius: "var(--r-input)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)", cursor: "pointer" }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


