"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // With email confirmation on, there's no session until they verify.
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div style={{ width: "100%", maxWidth: "380px" }}>

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%", margin: "0 auto 20px",
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep, var(--accent)))",
            boxShadow: "var(--shadow-glow)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", color: "#fff",
          }}>
            ◈
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 600,
            color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "8px",
          }}>
            Pocket Jane
          </h1>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-muted)" }}>
            {mode === "signin" ? "Sign in to your readings." : "Create an account to begin."}
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <Field
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" autoComplete="email"
          />
          <Field
            label="Password" type="password" value={password} onChange={setPassword}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
              color: "var(--gold)", lineHeight: 1.5,
              background: "var(--raised)", border: "1px solid var(--border-gold)",
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
              background: "linear-gradient(135deg, var(--accent), var(--accent-deep, var(--accent)))",
              color: "#fff",
              fontFamily: "var(--font-playfair), serif",
              fontSize: "17px", fontWeight: 500, letterSpacing: "0.03em",
              cursor: busy || !email || !password ? "not-allowed" : "pointer",
              opacity: busy || !email || !password ? 0.5 : 1,
              boxShadow: busy ? "none" : "var(--shadow-glow)",
              transition: "all 0.2s ease",
            }}
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 500, padding: 0 }}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
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
