"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/library", label: "Library" },
  { href: "/history", label: "History" },
];

export default function Navigation() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session?.user)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // The login screen has its own branding and no nav targets
  if (pathname === "/login") return null;

  // Default to light (Jane) until mounted
  const isLight = !mounted || theme === "light";

  const navBg     = isLight ? "rgba(255,255,255,0.92)" : "rgba(7,6,10,0.92)";
  const navBorder = isLight ? "rgba(45,91,227,0.10)"   : "rgba(185,28,28,0.12)";
  const logoBg    = isLight
    ? "linear-gradient(135deg,#2d5be3,#0f2060)"
    : "linear-gradient(135deg,#b91c1c,#7f1d1d)";
  const logoGlow  = isLight
    ? "0 0 14px rgba(45,91,227,0.5)"
    : "0 0 14px rgba(185,28,28,0.5)";
  const activeBg  = isLight ? "rgba(45,91,227,0.08)"  : "rgba(185,28,28,0.10)";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 24px",
      background: navBg,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${navBorder}`,
      transition: "background 0.4s ease, border-color 0.4s ease",
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: logoBg, boxShadow: logoGlow,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.4s ease",
        }}>
          {isLight ? <TeacupMini /> : <SmileMini />}
        </div>
        <span className="hidden sm:inline" style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: "17px", fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "0.01em",
          transition: "color 0.4s ease",
        }}>
          Pocket Jane
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "12px", fontWeight: 500,
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: active ? "var(--accent-mid)" : "var(--text-muted)",
              textDecoration: "none",
              padding: "6px 10px", borderRadius: "6px",
              background: active ? activeBg : "transparent",
              border: active ? "1px solid var(--border-accent)" : "1px solid transparent",
              transition: "all 0.2s ease",
            }}>
              {label}
            </Link>
          );
        })}

        {mounted && (
          <button
            onClick={() => setTheme(isLight ? "dark" : "light")}
            title={isLight ? "Enter Red John mode" : "Enter Jane mode"}
            style={{
              marginLeft: "4px", width: "34px", height: "34px", borderRadius: "8px",
              background: isLight ? "rgba(45,91,227,0.07)" : "rgba(185,28,28,0.08)",
              border: `1px solid ${isLight ? "rgba(45,91,227,0.18)" : "rgba(185,28,28,0.20)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.25s ease", flexShrink: 0,
            }}
          >
            {isLight ? <SmileToggle /> : <TeacupToggle />}
          </button>
        )}

        {mounted && signedIn && (
          <button
            onClick={signOut}
            title="Sign out"
            style={{
              marginLeft: "4px", width: "34px", height: "34px", borderRadius: "8px",
              background: "transparent",
              border: `1px solid ${isLight ? "rgba(45,91,227,0.18)" : "rgba(185,28,28,0.20)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.25s ease", flexShrink: 0,
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}

/* Mini icons inside the logo circle */
function TeacupMini() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h10l-1.2 7.5H4.2L3 6z" stroke="rgba(210,225,255,0.9)" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M13 8.5Q16.5 8.5 16.5 11Q16.5 13.5 13 13.5" stroke="rgba(210,225,255,0.9)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M2 15h12" stroke="rgba(210,225,255,0.7)" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}
function SmileMini() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="3.8" cy="5.2" r="1.1" fill="rgba(255,220,220,0.9)"/>
      <circle cx="9.2" cy="5.2" r="1.1" fill="rgba(255,220,220,0.9)"/>
      <path d="M2.8 8.5Q6.5 11.5 10.2 8.5" stroke="rgba(255,220,220,0.9)" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* Toggle button icons (hint at the OTHER mode) */
function SmileToggle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--text-muted)" strokeWidth="1.3" fill="none"/>
      <circle cx="8.5" cy="10" r="1.3" fill="var(--text-muted)"/>
      <circle cx="15.5" cy="10" r="1.3" fill="var(--text-muted)"/>
      <path d="M7.5 14.5Q12 18.5 16.5 14.5" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function TeacupToggle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h11l-1.5 9H6.5L5 8z" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
      <path d="M16 10.5Q20 10.5 20 13Q20 15.5 16 15.5" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M3 18h15" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M8 6Q8.5 4.5 8 3M11 6Q11.5 4 11 3" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}
