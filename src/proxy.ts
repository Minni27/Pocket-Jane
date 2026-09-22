import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Routes reachable without a session. Everything else redirects to /login.
const PUBLIC_ROUTES = ["/login", "/auth"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes an expired token and rewrites the cookie. Must run before the
  // redirect check, or a user with a stale token gets bounced to /login.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));

  // API routes return their own 401 JSON. Redirecting them to /login would
  // hand fetch() an HTML page to parse as JSON.
  if (pathname.startsWith("/api")) return response;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Only ever a pathname from this request — never a caller-supplied value,
    // and the login page re-validates it before navigating.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Admin area is gated on app_metadata.role, which only the service role
  // can set. The API routes check it again server-side; this is just so a
  // non-admin gets bounced rather than shown an empty page.
  if (pathname.startsWith("/admin") && user?.app_metadata?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, images, and the PWA files.
    // The manifest and service worker are fetched before anyone signs in —
    // redirecting them to /login hands the browser an HTML page where it
    // expects JSON/JS, and the install prompt never appears.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
