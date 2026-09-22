"use client";

import { useCallback, useEffect, useState } from "react";

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
          zIndex: 999, padding: "14px 28px", borderRadius: "10px",
          background: "var(--surface)", border: "1px solid var(--border-gold)",
          boxShadow: "0 0 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "15px", color: "var(--gold)" }}>✓</span>
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "var(--text-primary)" }}>{toast}</span>
        </div>
      )}

      <div>
        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600,
          color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "6px",
        }}>
          Users
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-muted)" }}>
          Create accounts and hand out the password. Each person gets their own private library and readings.
        </p>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", background: "var(--surface)",
          border: "1px solid var(--border-accent)", color: "var(--accent)",
          fontFamily: "var(--font-inter), sans-serif", fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      {adding
        ? <AddUserForm onDone={(msg) => { setAdding(false); if (msg) { show(msg); refresh(); } }} />
        : (
          <button
            onClick={() => setAdding(true)}
            style={{
              alignSelf: "flex-start", padding: "10px 22px", borderRadius: "8px",
              background: "transparent", border: "1px solid var(--border-gold)",
              color: "var(--gold)", fontFamily: "var(--font-inter), sans-serif",
              fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--raised)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            + New user
          </button>
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
          <Input type="email" value={email} onChange={setEmail} placeholder="them@example.com" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Password</Label>
          <div className="flex gap-2">
            <Input type="text" value={password} onChange={setPassword} placeholder="at least 8 characters" />
            <button type="button" onClick={generate}
              style={{ flexShrink: 0, padding: "0 12px", borderRadius: "8px", background: "var(--raised)", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
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
                padding: "7px 16px", borderRadius: "7px", cursor: "pointer",
                fontFamily: "var(--font-inter), sans-serif", fontSize: "11px",
                fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                background: role === r ? "var(--raised)" : "transparent",
                border: `1px solid ${role === r ? "var(--border-accent)" : "var(--border)"}`,
                color: role === r ? "var(--accent)" : "var(--text-muted)",
              }}
            >{r}</button>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "var(--text-ghost)", marginTop: "6px" }}>
          Admins can create and delete users. Members only get their own workspace.
        </p>
      </div>

      {err && (
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "var(--accent)", background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: "8px", padding: "10px 12px", margin: 0 }}>
          {err}
        </p>
      )}

      <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "var(--text-ghost)", margin: 0, lineHeight: 1.6 }}>
        No email is sent. Copy the password and pass it on yourself — it is shown once, after you create the account.
      </p>

      <div className="flex gap-2 flex-wrap">
        <button type="submit" disabled={busy || !email || !password}
          style={{ padding: "9px 22px", borderRadius: "8px", background: "var(--raised)", border: "1px solid var(--border-gold)", color: "var(--gold)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", cursor: busy ? "not-allowed" : "pointer", opacity: busy || !email || !password ? 0.5 : 1 }}
        >{busy ? "Creating…" : "Create user"}</button>
        <button type="button" onClick={() => onDone()}
          style={{ padding: "9px 14px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", cursor: "pointer" }}
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
    <div className="card p-4" style={{ borderColor: isAdmin ? "var(--border-gold)" : undefined }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div style={{
          width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
          background: "var(--raised)", border: `1px solid ${isAdmin ? "var(--border-gold)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", color: isAdmin ? "var(--gold)" : "var(--text-muted)",
        }}>
          {isAdmin ? "◈" : "◎"}
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "var(--text-primary)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
            {user.isSelf && <span style={{ color: "var(--text-ghost)", fontSize: "11px" }}> — you</span>}
          </p>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "var(--text-ghost)" }}>
            {user.role} · {user.analyses} reading{user.analyses === 1 ? "" : "s"} · {user.chunks.toLocaleString()} passages
            {user.lastSignInAt
              ? ` · last in ${new Date(user.lastSignInAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : " · never signed in"}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={() => setResetting((r) => !r)}
            style={{ padding: "5px 12px", borderRadius: "6px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer" }}
          >Set password</button>
          {!user.isSelf && (
            <button onClick={() => setConfirming(true)}
              style={{ padding: "5px 12px", borderRadius: "6px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-ghost)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >Delete</button>
          )}
        </div>
      </div>

      {resetting && (
        <div className="flex gap-2 flex-wrap" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <input
            type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            placeholder="new password, at least 8 characters" autoFocus
            style={{ flex: 1, minWidth: "200px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "7px", outline: "none", padding: "8px 11px", fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "var(--text-primary)" }}
          />
          <button onClick={savePassword} disabled={busy || newPw.length < 8}
            style={{ padding: "8px 16px", borderRadius: "7px", background: "var(--raised)", border: "1px solid var(--border-gold)", color: "var(--gold)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer", opacity: newPw.length < 8 ? 0.5 : 1 }}
          >Save</button>
          <button onClick={() => { setResetting(false); setNewPw(""); }}
            style={{ padding: "8px 12px", borderRadius: "7px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer" }}
          >Cancel</button>
        </div>
      )}

      {confirming && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-accent)" }}>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: "10px" }}>
            Delete <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>? This also destroys their{" "}
            {user.analyses} reading{user.analyses === 1 ? "" : "s"} and {user.chunks.toLocaleString()} book passages. It cannot be undone.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={del} disabled={busy}
              style={{ padding: "8px 16px", borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border-accent)", color: "var(--accent)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}
            >{busy ? "Deleting…" : "Yes, delete permanently"}</button>
            <button onClick={() => setConfirming(false)}
              style={{ padding: "8px 12px", borderRadius: "7px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", cursor: "pointer" }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "7px" }}>
      {children}
    </label>
  );
}

function Input({ type, value, onChange, placeholder }: { type: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", outline: "none", padding: "10px 12px", fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-primary)", caretColor: "var(--accent)" }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    />
  );
}
