/* Offline shell for Peter's Hangman.
   Bump CACHE and the ?v= links in index.html together with the footer.
   Navigations, index.html, game.js, and styles.css use the network when
   online so a stale cache cannot keep an old script after a deploy. */
const CACHE = "peters-hangman-v1.3";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles.css?v=1.3",
  "./game.js",
  "./game.js?v=1.3",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

function isCritical(request) {
  if (request.mode === "navigate") return true;
  var path = new URL(request.url).pathname;
  return (
    path.endsWith("/index.html") ||
    path.endsWith("/game.js") ||
    path.endsWith("/styles.css")
  );
}

async function cached(cache, request) {
  return (
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true }))
  );
}

function offlineShell() {
  return new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function networkFirst(cache, request) {
  try {
    var fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.type === "basic" && !fresh.redirected) {
      await cache.put(request, fresh.clone());
    }
    if (fresh) return fresh;
  } catch (err) {
    /* Offline or a failed connection: use the cached shell. */
  }

  var saved = await cached(cache, request);
  if (saved) return saved;
  if (request.mode === "navigate") {
    var shell = (await cache.match("./index.html")) || (await cache.match("./"));
    if (shell) return shell;
  }
  return offlineShell();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  var request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      var cache = await caches.open(CACHE);
      if (isCritical(request)) return networkFirst(cache, request);

      var saved = await cache.match(request);
      if (saved) return saved;
      try {
        var fresh = await fetch(request);
        if (fresh && fresh.ok && fresh.type === "basic" && !fresh.redirected) {
          await cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return offlineShell();
      }
    })()
  );
});
