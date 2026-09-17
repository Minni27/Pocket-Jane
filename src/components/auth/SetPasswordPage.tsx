"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Reached via an invite link, which has already established a session.
  // Landing here without one means the link expired or was already used.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?error=" + encodeURIComponent("That invite link has expired or was already used."));
        return;
      }
      setEmail(data.user.email ?? null);
      setChecking(false);
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Use at least 8 characters."); return; }

    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setBusy(false); return; }

    router.push("/");
    router.refresh();
  }

  if (checking) return null;

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(1.6rem, 4.5vw, 2.1rem)", fontWeight: 600,
            color: "var(--text-primary)", lineHeight: 1.15, marginBottom: "8px",
          }}>
            Choose a password
          </h1>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-muted)" }}>
            {email ? <>Setting up <span style={{ color: "var(--text-dim)" }}>{email}</span></> : "Finish setting up your account."}
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

          {error && (
            <p style={{
              fontFamily: "var(--font-inter), sans-serif", fontSize: "12px",
              color: "var(--accent)", lineHeight: 1.5,
              background: "var(--surface)", border: "1px solid var(--border-accent)",
              borderRadius: "8px", padding: "10px 12px", margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password || !confirm}
            style={{
              marginTop: "4px", padding: "13px", borderRadius: "8px",
              border: "1px solid var(--border-accent)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-deep, var(--accent)))",
              color: "#fff",
              fontFamily: "var(--font-playfair), serif",
              fontSize: "17px", fontWeight: 500, letterSpacing: "0.03em",
              cursor: busy || !password || !confirm ? "not-allowed" : "pointer",
              opacity: busy || !password || !confirm ? 0.5 : 1,
              boxShadow: busy ? "none" : "var(--shadow-glow)",
              transition: "all 0.2s ease",
            }}
          >
            {busy ? "…" : "Set password and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, autoComplete,
}: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  return (
    <div>
      <label style={{
        display: "block", fontFamily: "var(--font-inter), sans-serif",
        fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "7px",
      }}>
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        autoComplete={autoComplete}
        required
        style={{
          width: "100%",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "8px", outline: "none", padding: "11px 13px",
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "14px", fontWeight: 300,
          color: "var(--text-primary)", caretColor: "var(--accent)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}
