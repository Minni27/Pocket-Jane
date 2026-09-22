import type { NextConfig } from "next";

// Content-Security-Policy.
//
// 'unsafe-inline' for styles is required: the app styles almost everything
// with inline style={{}} objects, and next/font injects a <style> tag.
// 'unsafe-eval' is required by pdf.js, which compiles glyph programs at
// runtime to render text — removing it breaks library uploads.
//
// The pdf.js worker is served from this origin (public/pdf.worker.min.mjs),
// so worker-src does not need to allow a CDN. Loading it cross-origin would
// let a compromised CDN run code with the user's session, since pdf.js
// fetches the script and runs it from a blob: URL that inherits this origin.
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self' blob:",
  // No Google Fonts origins: next/font/google downloads the files at build
  // time and serves them from /_next/static/media, so nothing is fetched
  // from fonts.googleapis.com or fonts.gstatic.com at runtime — verified
  // against the served HTML. If a raw <link> to Google Fonts is ever added,
  // it will be blocked, and the fix is to use next/font instead.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // blob:/data: cover camera captures and PDF-rendered images
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_ORIGIN.replace(/^https:/, "wss:")}`.trim(),
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
  // Hides the framework and version from responses — free, and one less
  // hint for an automated scanner.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Defence in depth for browsers that ignore frame-ancestors
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The camera is used by /analyze on this origin only; everything
          // else the app never needs.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
          // Only meaningful over HTTPS; Vercel serves HTTPS by default.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Never let a proxy or browser cache an account-scoped response.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
