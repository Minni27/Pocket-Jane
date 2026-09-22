// Minimal service worker. Chrome only offers the install prompt when one is
// registered with a fetch handler.
//
// Deliberately network-first and non-caching for pages and API calls: every
// reading, the library and the user list are live per-account data, and a
// stale cached response would show one tenant yesterday's state — or worse,
// a page rendered for a different account. Only immutable build assets and
// the icons are served from cache.

const CACHE = "pocket-jane-v2";
const PRECACHE = ["/icon-192.png", "/icon-512.png", "/apple-icon.png"];

// The pdf.js worker is a 1.2MB immutable vendor file served from this origin
// (see SECURITY.md). Cached on first use rather than precached, so installing
// the app does not pull it down for someone who never uploads a book.
const CACHE_ON_USE = ["/pdf.worker.min.mjs"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache anything account-scoped or server-rendered
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  const isImmutable =
    url.pathname.startsWith("/_next/static/") ||
    PRECACHE.includes(url.pathname) ||
    CACHE_ON_USE.includes(url.pathname);

  if (isImmutable) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
  }
  // Everything else falls through to the network untouched.
});
