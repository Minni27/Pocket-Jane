"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button, Icon, Input, Label } from "@/components/ui";
import { authErrorMessage, safeRedirect } from "@/lib/safe-redirect";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  // Validated, not trusted: ?next=//evil.com would otherwise send the user
  // off-site the moment they sign in.
  const next = safeRedirect(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Mapped from a code, never rendered from the query string, so a crafted
  // link cannot put its own text in the app's error box.
  const [error, setError] = useState<string | null>(authErrorMessage(params.get("error")));
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push(next);
    router.refresh();
  }

  async function resetPassword() {
    if (!email) { setError("Enter your email first, then choose reset."); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setNotice("If that address has an account, a reset link is on its way.");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div style={{ width: "100%", maxWidth: "372px" }}>

        <div style={{ textAlign: "center", marginBottom: "var(--s-6)" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "var(--t-display)", fontWeight: 600,
            color: "var(--text-primary)", lineHeight: 1.05,
            letterSpacing: "-0.02em", margin: "0 0 var(--s-2)",
          }}>
            Pocket Jane
          </h1>
          <p style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "var(--t-ui)", color: "var(--text-muted)", margin: 0,
          }}>
            Sign in to your readings.
          </p>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" required />
          </div>

          {error && <Notice tone="error">{error}</Notice>}
          {notice && <Notice tone="info">{notice}</Notice>}

          <Button type="submit" variant="primary" size="lg" loading={busy}
            disabled={!email || !password} style={{ width: "100%", marginTop: "var(--s-1)" }}>
            Sign in
          </Button>

          <button type="button" onClick={resetPassword} disabled={busy}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontFamily: "var(--font-inter), sans-serif",
              fontSize: "var(--t-meta)", padding: "2px",
            }}>
            Forgot your password?
          </button>
        </form>

        <p style={{
          textAlign: "center", marginTop: "var(--s-5)",
          fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
          color: "var(--text-ghost)", lineHeight: 1.7, maxWidth: "32ch",
          marginLeft: "auto", marginRight: "auto",
        }}>
          Access is by invitation. If you need an account, ask whoever runs this instance.
        </p>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  const accent = tone === "error" ? "var(--accent)" : "var(--signal)";
  return (
    <p style={{
      display: "flex", alignItems: "flex-start", gap: "var(--s-2)",
      fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-meta)",
      color: accent, lineHeight: 1.55,
      background: "var(--raised)", border: `1px solid ${accent}`,
      borderRadius: "var(--r-input)", padding: "var(--s-2) var(--s-3)", margin: 0,
    }}>
      <Icon name={tone === "error" ? "alert" : "check"} size={14} style={{ marginTop: "1px" }} />
      <span>{children}</span>
    </p>
  );
}
