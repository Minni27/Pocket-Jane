"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function resetPassword() {
    if (!email) { setError("Enter your email first, then tap reset."); return; }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setNotice("If that address has an account, a reset link is on its way.");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div style={{ width: "100%", maxWidth: "380px" }}>

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%", margin: "0 auto 20px",
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
            boxShadow: "var(--shadow-glow)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}>
            <Icon name="eye" size={22} />
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 600,
            color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "8px",
          }}>
            Pocket Jane
          </h1>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-muted)" }}>
            Sign in to your readings.
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <Field
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" autoComplete="email"
          />
          <Field
            label="Password" type="password" value={password} onChange={setPassword}
            placeholder="••••••••" autoComplete="current-password"
          />

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

          {notice && (
            <p style={{
              fontFamily: "var(--font-inter), sans-serif", fontSize: "12px",
              color: "var(--signal)", lineHeight: 1.5,
              background: "var(--raised)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "10px 12px", margin: 0,
            }}>
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            style={{
              marginTop: "4px", padding: "13px", borderRadius: "8px",
              border: "1px solid var(--border-accent)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
              color: "#fff",
              fontFamily: "var(--font-playfair), serif",
              fontSize: "17px", fontWeight: 500, letterSpacing: "0.03em",
              cursor: busy || !email || !password ? "not-allowed" : "pointer",
              opacity: busy || !email || !password ? 0.5 : 1,
              boxShadow: busy ? "none" : "var(--shadow-glow)",
              transition: "all 0.2s ease",
            }}
          >
            {busy ? "…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={resetPassword}
            disabled={busy}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", padding: "2px", textAlign: "center" }}
          >
            Forgot your password?
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-ghost)", lineHeight: 1.6 }}>
          Access is by invitation. If you need an account,<br />ask whoever runs this instance to invite you.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; autoComplete: string;
}) {
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
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
