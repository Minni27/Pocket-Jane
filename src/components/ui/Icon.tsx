"use client";

// One drawn set at a single 1.5 stroke on a 24 grid. The app previously used
// ◈ ◎ ✦ ⊕ ◉ as its icon system: those are typographic ornaments at the mercy
// of font fallback, not icons.

export type IconName =
  | "eye" | "books" | "clock" | "users" | "camera" | "pen" | "check" | "close"
  | "chevron" | "trash" | "print" | "signout" | "plus" | "spinner" | "alert";

const paths: Record<IconName, React.ReactNode> = {
  eye:     <><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/></>,
  books:   <><path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 3H20v18H6.2A2.2 2.2 0 0 1 4 18.8V5.2A2.2 2.2 0 0 1 6.2 3Z"/><path d="M9 7h7"/></>,
  clock:   <><circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.2 1.9"/></>,
  users:   <><path d="M16 20v-1.4a3.8 3.8 0 0 0-3.8-3.8H6.8A3.8 3.8 0 0 0 3 18.6V20"/><circle cx="9.5" cy="7.4" r="3.2"/><path d="M21 20v-1.4a3.8 3.8 0 0 0-2.9-3.7"/><path d="M15.5 4.4a3.2 3.2 0 0 1 0 6"/></>,
  camera:  <><path d="M3 8.4A1.4 1.4 0 0 1 4.4 7h2.3l1.4-2h7.8l1.4 2h2.3A1.4 1.4 0 0 1 21 8.4v9.2a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 17.6Z"/><circle cx="12" cy="12.6" r="3.4"/></>,
  pen:     <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z"/><path d="M15 6.5 17.5 9"/></>,
  check:   <path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>,
  close:   <><path d="M6 6 18 18"/><path d="M18 6 6 18"/></>,
  chevron: <path d="M6 9.5 12 15.5 18 9.5"/>,
  trash:   <><path d="M4 7h16"/><path d="M9.5 7V4.8h5V7"/><path d="M6.2 7l.9 12.2A1.5 1.5 0 0 0 8.6 20.6h6.8a1.5 1.5 0 0 0 1.5-1.4L17.8 7"/></>,
  print:   <><path d="M7 9V3.5h10V9"/><path d="M7 18H5.2A2.2 2.2 0 0 1 3 15.8v-4.3A2.2 2.2 0 0 1 5.2 9.3h13.6A2.2 2.2 0 0 1 21 11.5v4.3A2.2 2.2 0 0 1 18.8 18H17"/><path d="M7 14.5h10v6H7Z"/></>,
  signout: <><path d="M9.5 20.5H5.4A2 2 0 0 1 3.4 18.5V5.5a2 2 0 0 1 2-2h4.1"/><path d="M16 16.5 20.6 12 16 7.5"/><path d="M20.6 12H9.5"/></>,
  plus:    <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  spinner: <><circle cx="12" cy="12" r="8.6" opacity="0.22"/><path d="M12 3.4A8.6 8.6 0 0 1 20.6 12"/></>,
  alert:   <><circle cx="12" cy="12" r="8.6"/><path d="M12 7.6v5"/><path d="M12 16.2v.2"/></>,
};

export default function Icon({
  name, size = 18, className, style,
}: { name: IconName; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      className={className} style={{ flexShrink: 0, ...style }}
    >
      {paths[name]}
    </svg>
  );
}
