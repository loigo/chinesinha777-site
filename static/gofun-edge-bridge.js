/**
 * Produção estática (GitHub Pages):
 * - desliga Service Workers problemáticos
 * - reescreve /gofun e /game-shell para Supabase Edge
 */
(function () {
  'use strict';
  if (window.__ch7GofunBridge) return;
  window.__ch7GofunBridge = 1;

  var EDGE = 'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1';
  var GOFUN = EDGE + '/gofun';

  // 1) SW: unregister tudo (evita scope /static/sw.js)
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) {
          try {
            r.unregister();
          } catch (e) {}
        });
      });
    }
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) {
          caches.delete(k).catch(function () {});
        });
      });
    }
  } catch (e) {}

  function mapUrl(u) {
    if (!u) return u;
    try {
      var url = new URL(u, location.origin);
      if (url.origin !== location.origin && url.hostname !== location.hostname) return u;
      if (url.pathname.indexOf('/gofun/') === 0 || url.pathname === '/gofun') {
        return GOFUN + url.pathname.replace(/^\/gofun/, '') + url.search;
      }
      // game-shell: stub vazio no edge www/static
      if (url.pathname.indexOf('/game-shell') === 0) {
        return location.origin + '/static/game-shell-stub.html' + url.search;
      }
    } catch (e) {}
    return u;
  }

  // fetch
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string') {
        input = mapUrl(input);
      } else if (input && typeof Request !== 'undefined' && input instanceof Request) {
        var nu = mapUrl(input.url);
        if (nu !== input.url) {
          input = new Request(nu, input);
        }
      }
    } catch (e) {}
    return _fetch.call(this, input, init);
  };

  // XHR (axios)
  var XO = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    try {
      arguments[1] = mapUrl(url);
    } catch (e) {}
    return XO.apply(this, arguments);
  };

  window.__CH7_GOFUN_EDGE__ = GOFUN;
})();
