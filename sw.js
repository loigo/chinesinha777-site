/* SW v9 — root scope / — proxy /gofun → Supabase Edge */
const EDGE_GOFUN = 'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1/gofun';
const CACHE = 'ch7-static-v9';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function mapGofun(url) {
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith('/gofun')) return null;
    const path = u.pathname.replace(/^\/gofun/, '') || '/';
    return EDGE_GOFUN + path + u.search;
  } catch {
    return null;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // same-origin /gofun/* → Supabase Edge
  if (url.origin === self.location.origin && url.pathname.startsWith('/gofun')) {
    const target = mapGofun(req.url);
    if (!target) return;
    event.respondWith(
      (async () => {
        const headers = new Headers(req.headers);
        // ensure edge accepts
        if (!headers.has('apikey')) {
          headers.set(
            'apikey',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0',
          );
        }
        const init = {
          method: req.method,
          headers,
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
        };
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          init.body = await req.arrayBuffer();
        }
        const res = await fetch(target, init);
        // clone with CORS-friendly headers for page
        const buf = await res.arrayBuffer();
        const h = new Headers(res.headers);
        h.set('Access-Control-Allow-Origin', self.location.origin);
        return new Response(buf, { status: res.status, statusText: res.statusText, headers: h });
      })(),
    );
    return;
  }

  // game-shell stub
  if (url.origin === self.location.origin && url.pathname.startsWith('/game-shell')) {
    event.respondWith(fetch(self.location.origin + '/static/game-shell-stub.html' + url.search));
    return;
  }

  // default: network
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
});
