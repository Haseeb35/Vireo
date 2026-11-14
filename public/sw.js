/*
  Vireo service worker.

  Next.js itself (experimental.useOffline) handles in-app navigation while the
  connection drops. This worker covers what Next can't: opening or reloading a
  page with no network at all.

  - App code (/_next/static): cache-first. Files are content-hashed, so a
    cached copy is always correct.
  - Images (/_next/image): show the cached copy, refresh it in the background.
  - Pages: network-first. Every page you visit is saved; offline, the saved
    copy is shown, or /offline if you've never opened that page.
  - Everything else (RSC data, server actions, Firebase, video) is left alone.
*/

const VERSION = "vireo-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const IMAGES = `${VERSION}-images`;
const MAX_IMAGES = 300;
const MAX_PAGES = 60;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // React Server Component payloads are handled by Next's own retry logic.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(request);
        const fresh = fetch(request)
          .then((res) => {
            if (res.ok) {
              cache.put(request, res.clone());
              trim(IMAGES, MAX_IMAGES);
            }
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(request, copy).then(() => trim(PAGES, MAX_PAGES)));
          }
          return res;
        } catch {
          const cache = await caches.open(PAGES);
          return (
            (await cache.match(request)) ||
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match("/offline")) ||
            Response.error()
          );
        }
      })(),
    );
  }
});
