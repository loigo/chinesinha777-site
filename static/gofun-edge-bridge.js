/**
 * Bridge v3 — força /gofun → Supabase Edge (fetch + XHR + axios).
 * Também registra SW na raiz (/sw.js) com scope /.
 */
(function () {
  'use strict';
  if (window.__ch7GofunBridgeV3) return;
  window.__ch7GofunBridgeV3 = 1;

  var EDGE = 'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1';
  var GOFUN = EDGE + '/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';

  function mapUrl(u) {
    if (!u || typeof u !== 'string') return u;
    try {
      var url = new URL(u, location.href);
      // same host only
      if (url.hostname !== location.hostname && url.origin !== location.origin) {
        // still map if path is /gofun on our domain string
        if (u.indexOf('/gofun/') === -1 && u.indexOf('/gofun?') === -1) return u;
      }
      if (url.pathname.indexOf('/gofun') === 0) {
        return GOFUN + url.pathname.replace(/^\/gofun/, '') + url.search;
      }
      if (url.pathname.indexOf('/game-shell') === 0) {
        return location.origin + '/static/game-shell-stub.html' + url.search;
      }
      // banners do firstpage (mesmo CDN do local banana_man)
      if (url.pathname.indexOf('/banner/') === 0 || url.pathname.indexOf('/banners/') === 0) {
        var file = url.pathname.split('/').pop();
        return 'https://www.okx007.com/res/banana_man/banner/' + file;
      }
    } catch (e) {}
    return u;
  }

  function patchInitHeaders(init) {
    init = init || {};
    var h = init.headers;
    if (!h) {
      init.headers = { apikey: ANON };
      return init;
    }
    if (h instanceof Headers) {
      if (!h.has('apikey')) h.set('apikey', ANON);
    } else if (Array.isArray(h)) {
      init.headers = h.concat([['apikey', ANON]]);
    } else {
      if (!h.apikey && !h.Apikey) h.apikey = ANON;
    }
    return init;
  }

  // --- fetch ---
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string') {
        var nu = mapUrl(input);
        if (nu !== input) {
          input = nu;
          init = patchInitHeaders(init);
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

  // --- XHR ---
  var XO = XMLHttpRequest.prototype.open;
  var XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try {
      this.__ch7Url = mapUrl(String(url));
      arguments[1] = this.__ch7Url;
    } catch (e) {}
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (this.__ch7Url && this.__ch7Url.indexOf('supabase.co') !== -1) {
        this.setRequestHeader('apikey', ANON);
      }
    } catch (e) {}
    return XS.apply(this, arguments);
  };

  // --- axios intercept after SPA loads ---
  function hookAxios() {
    try {
      var ax =
        window.axios ||
        (window.__ch7Axios) ||
        null;
      // Quasar may put axios on app config — also patch prototype path only
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
          if (config && config.baseURL && String(config.baseURL).indexOf(location.origin) === 0) {
            // leave baseURL; url is absolute after map
          }
          return config;
        });
      }
    } catch (e) {}
  }
  setInterval(hookAxios, 500);
  setTimeout(hookAxios, 100);
  setTimeout(hookAxios, 1000);
  setTimeout(hookAxios, 3000);

  // --- SW root ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      var jobs = regs.map(function (r) {
        // remove bad static scope workers
        var script = (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || '';
        if (script.indexOf('/static/sw.js') !== -1 || (r.scope && r.scope.indexOf('/static/') !== -1)) {
          return r.unregister();
        }
        return Promise.resolve();
      });
      return Promise.all(jobs);
    }).then(function () {
      return navigator.serviceWorker.register('/sw.js?v=9', { scope: '/' });
    }).then(function () {
      window.__ch7SwOk = 1;
    }).catch(function (e) {
      window.__ch7SwErr = String(e && e.message || e);
    });
  }

  window.__CH7_GOFUN_EDGE__ = GOFUN;
  window.__ch7MapGofun = mapUrl;
})();
