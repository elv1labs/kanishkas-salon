// Service Worker — kfs-salon-v2
// Strategy:
//   Static shell (HTML, fonts, manifest) → cache-first
//   API + dynamic routes → network-first with cache fallback
//   Images → stale-while-revalidate

const CACHE_NAME    = "kfs-salon-v2";
const STATIC_CACHE  = "kfs-static-v2";
const IMAGE_CACHE   = "kfs-images-v2";

const STATIC_ASSETS = [
  "/",
  "/book",
  "/services",
  "/gallery",
  "/products",
  "/about",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate — purge old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const KEEP = [STATIC_CACHE, IMAGE_CACHE, CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. API → always network-first (never serve stale API data)
  if (url.pathname.startsWith("/api/")) return;

  // 2. NextAuth internal routes → skip
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(event.request).then((hit) => hit || fetch(event.request))
    );
    return;
  }

  // 3. Images → stale-while-revalidate
  if (
    event.request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // 4. Everything else (pages, fonts, CSS) → network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
