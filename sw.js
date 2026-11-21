// Offline cache for Mick Fit (shell + training app + meal app).
// 1) Bump CACHE (and VERSION in shell.js) every time you upload changes.
// 2) If you add a new file, add it to ASSETS too. Recipe photos (meal/img, meal/page) are cached
//    the first time they are viewed, so they are not listed here.
const CACHE = "mickfit-v2.4.0";
const ASSETS = [
  "./",
  "./index.html",
  "./shell.css",
  "./shell.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./train/css/app.css",
  "./train/fonts/ibm-plex-mono-500.woff2",
  "./train/fonts/ibm-plex-mono-600.woff2",
  "./train/index.html",
  "./train/js/data.js",
  "./train/js/exercise.js",
  "./train/js/main.js",
  "./train/js/muscle-map.js",
  "./train/js/storage.js",
  "./train/js/timer.js",
  "./train/js/ui.js",
  "./train/js/utils.js",
  "./train/js/views/body.js",
  "./train/js/views/settings.js",
  "./train/js/views/sheets.js",
  "./train/js/views/week.js",
  "./train/js/views/workout.js",
  "./meal/index.html",
  "./meal/cookbook.json",
];
const IMG = /\/meal\/(img|page)\//;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // always download fresh files, never reuse the browser's HTTP cache
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== CACHE + "-img").map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // recipe photos and cookbook pages: cache first, kept across app updates
  if (IMG.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE + "-img").then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }
  // everything else: stale-while-revalidate. Opens instantly from cache (works offline at the gym),
  // refreshes the cache in the background so the next launch gets any update.
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit =
        (await c.match(req, { ignoreSearch: true })) ||
        (req.mode === "navigate" && url.pathname.endsWith("/") ? await c.match("./index.html") : undefined);
      const net = fetch(req.url, { cache: "no-cache" })
        .then((res) => {
          if (res && res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (hit) {
        e.waitUntil(net);
        return hit;
      }
      const res = await net;
      return res || Response.error();
    }),
  );
});
