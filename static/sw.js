/* SW kill-switch v10 — NÃO intercepta fetch (evita tela cinza / cache podre).
 * Bridge gofun na página é suficiente. Limpa caches e se desregistra.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (err) {}
      try {
        await self.registration.unregister();
      } catch (err2) {}
      await self.clients.claim();
    })(),
  );
});
