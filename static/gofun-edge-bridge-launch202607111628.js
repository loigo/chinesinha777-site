/**
 * Bridge v7 — /gofun → Supabase Edge.
 * NÃO mexe em XHR do iframe de jogos (evita formatarURL crash no shell PG Soft).
 * NÃO registra SW problemático (só unregister).
 */
(function () {
  'use strict';
  if (window.__ch7GofunBridgeV7) return;
  window.__ch7GofunBridgeV7 = 1;

  var EDGE = 'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1';
  var GOFUN = EDGE + '/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';

  function isOurHost(hostname) {
    return (
      hostname === location.hostname ||
      hostname === 'chinesinha777.bet' ||
      hostname === 'www.chinesinha777.bet' ||
      hostname === '127.0.0.1' ||
      hostname === 'localhost'
    );
  }

  function mapUrl(u) {
    if (u == null) return u;
    // Cloudflare beacon / non-string → não tocar
    if (typeof u !== 'string') {
      try {
        if (typeof URL !== 'undefined' && u instanceof URL) u = u.href;
        else return u;
      } catch (e) {
        return u;
      }
    }
    if (!u) return u;
    // URLs de analytics / jogos externos — nunca reescrever
    if (/cloudflareinsights|google-analytics|googletagmanager|facebook\.net|hotjar|sentry/i.test(u)) {
      return u;
    }
    if (/igamewin|pgsoft|pragmaticplay|jili|evolution|spribe|royalgam/i.test(u)) {
      return u;
    }
    try {
      var url = new URL(u, location.href);
      if (!isOurHost(url.hostname) && u.indexOf('/gofun/') === -1) return u;

      if (url.pathname.indexOf('/gofun') === 0) {
        return GOFUN + url.pathname.replace(/^\/gofun/, '') + url.search;
      }
      // game-shell: não stubar — deixa o game-iframe-fix decidir (URL direta do jogo)
      if (url.pathname.indexOf('/banner/') === 0 || url.pathname.indexOf('/banners/') === 0) {
        var file = url.pathname.split('/').pop();
        return 'https://www.okx007.com/res/banana_man/banner/' + file;
      }
    } catch (e) {}
    return u;
  }

  function patchInitHeaders(init, mapped) {
    if (!mapped || String(mapped).indexOf('supabase.co') === -1) return init;
    init = init || {};
    var h = init.headers;
    if (!h) {
      init.headers = { apikey: ANON };
      return init;
    }
    if (typeof Headers !== 'undefined' && h instanceof Headers) {
      if (!h.has('apikey')) h.set('apikey', ANON);
    } else if (Array.isArray(h)) {
      init.headers = h.concat([['apikey', ANON]]);
    } else {
      if (!h.apikey && !h.Apikey) h.apikey = ANON;
    }
    return init;
  }

  // fetch (só top-level; iframes de jogo têm window próprio)
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string') {
        var nu = mapUrl(input);
        if (nu !== input) {
          input = nu;
          init = patchInitHeaders(init, nu);
        }
      } else if (input && typeof Request !== 'undefined' && input instanceof Request) {
        var nu2 = mapUrl(input.url);
        if (nu2 !== input.url) {
          var h2 = new Headers(input.headers);
          if (!h2.has('apikey')) h2.set('apikey', ANON);
          input = new Request(nu2, {
            method: input.method,
            headers: h2,
            body: input.method === 'GET' || input.method === 'HEAD' ? undefined : input.body,
            mode: 'cors',
            credentials: 'omit',
            cache: input.cache,
            redirect: input.redirect,
          });
        }
      }
    } catch (e) {}
    return _fetch(input, init);
  };

  // XHR top window only
  var XO = XMLHttpRequest.prototype.open;
  var XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try {
      if (url != null && typeof url !== 'string') {
        try {
          url = String(url);
        } catch (e) {
          url = '';
        }
      }
      var mapped = mapUrl(url == null ? '' : url);
      this.__ch7Url = mapped;
      arguments[1] = mapped;
    } catch (e) {}
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (this.__ch7Url && String(this.__ch7Url).indexOf('supabase.co') !== -1) {
        this.setRequestHeader('apikey', ANON);
      }
    } catch (e) {}
    return XS.apply(this, arguments);
  };

  // axios hook (SPA)
  function hookAxios() {
    try {
      var ax = window.axios || null;
      if (ax && ax.interceptors && ax.interceptors.request && !ax.__ch7Hooked) {
        ax.__ch7Hooked = 1;
        ax.interceptors.request.use(function (config) {
          if (config && config.url) {
            config.url = mapUrl(config.url);
            if (String(config.url).indexOf('supabase.co') !== -1) {
              config.headers = config.headers || {};
              config.headers.apikey = ANON;
            }
          }
          return config;
        });
      }
    } catch (e) {}
  }
  setInterval(hookAxios, 800);
  setTimeout(hookAxios, 200);
  setTimeout(hookAxios, 1500);

  // SW: só limpar / desregistrar — NÃO registrar (evita conflito de scope)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) {
        try {
          r.unregister();
        } catch (e) {}
      });
    });
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) {
          caches.delete(k).catch(function () {});
        });
      });
    }
  }

  window.__CH7_GOFUN_EDGE__ = GOFUN;
  window.__ch7MapGofun = mapUrl;
})();
