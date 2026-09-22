"use client";

import Icon from "./Icon";
export { default as Icon } from "./Icon";
export type { IconName } from "./Icon";
export { default as Mark } from "./Mark";

/* ── Button ───────────────────────────────────────────────────
   306 inline style objects shipped three different radii for what
   was meant to be one button. It is declared once here. */

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, React.CSSProperties> = {
  primary:   { background: "var(--accent)", color: "#fff", border: "1px solid transparent" },
  secondary: { background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)" },
  ghost:     { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" },
  danger:    { background: "transparent", color: "var(--accent)", border: "1px solid var(--border-accent)" },
};

export function Button({
  children, variant = "secondary", size = "md", icon, loading, style, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: "sm" | "md" | "lg"; icon?: React.ComponentProps<typeof Icon>["name"]; loading?: boolean;
}) {
  const pad = size === "sm" ? "6px 12px" : size === "lg" ? "13px 26px" : "9px 18px";
  const fs  = size === "sm" ? "var(--t-meta)" : "var(--t-ui)";
  const disabled = rest.disabled || loading;

  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: "var(--s-2)", padding: pad,
        borderRadius: "var(--r-input)",
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: fs, fontWeight: 500, letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: `background var(--dur-state) ease, border-color var(--dur-state) ease, color var(--dur-state) ease`,
        whiteSpace: "nowrap",
        ...variants[variant],
        ...style,
      }}
    >
      {loading
        ? <Icon name="spinner" size={15} style={{ animation: "spin 0.9s linear infinite" }} />
        : icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

/* ── Field ──────────────────────────────────────────────────── */

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label style={{
      display: "block", marginBottom: "var(--s-2)",
      fontFamily: "var(--font-inter), sans-serif",
      fontSize: "var(--t-micro)", fontWeight: 600,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--text-muted)",
    }}>
      {children}
      {hint && (
        <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "var(--t-meta)", color: "var(--text-ghost)" }}>
          {" "}{hint}
        </span>
      )}
    </label>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-input)",
  outline: "none",
  padding: "10px 12px",
  fontFamily: "var(--font-inter), sans-serif",
  fontSize: "var(--t-ui)", fontWeight: 400, lineHeight: 1.6,
  color: "var(--text-primary)",
  transition: "border-color var(--dur-state) ease",
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...fieldStyle, ...props.style }}
    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; props.onBlur?.(e); }} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...fieldStyle, resize: "vertical", ...props.style }}
    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; props.onBlur?.(e); }} />;
}

/* ── Chip ───────────────────────────────────────────────────── */

export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "signal" }) {
  const c = tone === "accent" ? "var(--accent)" : tone === "signal" ? "var(--signal)" : "var(--text-muted)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", borderRadius: "var(--r-pill)",
      border: `1px solid ${tone === "neutral" ? "var(--border)" : "currentColor"}`,
      color: c,
      fontFamily: "var(--font-inter), sans-serif",
      fontSize: "var(--t-micro)", fontWeight: 500, letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/* ── Meter ──────────────────────────────────────────────────
   State reads from the numeral and the bar's extent, never from
   hue alone, so it survives both themes and colour blindness. */

export function Meter({ label, value, seeded = false }: { label: string; value: number; seeded?: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", gap: "var(--s-3)" }}>
        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "var(--t-ui)", color: "var(--text-dim)" }}>
          {label}
        </span>
        <span className="tabular" style={{
          fontFamily: "var(--font-playfair), serif", fontSize: "var(--t-title)",
          fontWeight: 600, color: seeded ? "var(--mark)" : "var(--text-primary)", lineHeight: 1,
        }}>
          {value}
        </span>
      </div>
      <div style={{ height: "3px", background: "var(--raised)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: seeded ? "var(--mark)" : "var(--accent)",
          borderRadius: "var(--r-pill)",
          transition: "width 1s var(--ease-out)",
        }} />
      </div>
    </div>
  );
}
