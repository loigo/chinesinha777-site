/* Service Worker v8 — network-only, sem página Offline, sem cache de HTML */
const CACHE = 'ch7-static-v8';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isApi(url) {
  return (
    url.pathname.startsWith('/gofun/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/pix-pay') ||
    url.pathname.startsWith('/game-shell') ||
    url.pathname.startsWith('/painel/')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return; // API: browser puro

  // HTML / navegação: SEMPRE rede, sem fallback Offline (causava tela "Offline")
  if (
    req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/index.html' ||
    url.pathname === '/version.json'
  ) {
    event.respondWith(
      fetch(req).catch(function () {
        // NÃO devolve "Offline" — deixa o browser tratar
        return Response.error();
      }),
    );
    return;
  }

  // static JS/CSS: network-first, fallback cache só se rede falhar
  if (
    (url.pathname.startsWith('/static/') && /\.(js|css)$/i.test(url.pathname)) ||
    url.pathname === '/sw.js' ||
    /\/assets\/.+\.(js|css)$/i.test(url.pathname)
  ) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          if (!res || res.status !== 200) return res;
          var ct = res.headers.get('content-type') || '';
          if (/text\/html/i.test(ct)) return res;
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy).catch(function () {});
          });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (c) {
            return c || Response.error();
          });
        }),
    );
    return;
  }

  // imagens/fonts hashed: cache-first leve
  if (/\.(woff2?|png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (!res || res.status !== 200) return res;
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy).catch(function () {});
          });
          return res;
        });
      }),
    );
  }
});
