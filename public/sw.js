// Skillify Service Worker — offline lesson caching
const CACHE_NAME = "skillify-lessons-v1";
const STATIC_CACHE = "skillify-static-v1";

// Static assets to pre-cache
const STATIC_ASSETS = ["/", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests for lesson pages and their API data
  if (request.method !== "GET") return;

  // Cache lesson page navigations
  if (url.pathname.match(/^\/courses\/[^/]+\/lesson\/[^/]+$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        // Return cached immediately if available, update in background
        return cached ?? fetchPromise;
      })
    );
    return;
  }

  // Network-first for API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
});

// Listen for message to cache a specific lesson
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_LESSON" && event.data.url) {
    caches.open(CACHE_NAME).then((cache) => {
      fetch(event.data.url)
        .then((response) => { if (response.ok) cache.put(event.data.url, response); })
        .catch(() => {});
    });
  }
});
