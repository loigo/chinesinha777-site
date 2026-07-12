/**
 * Bridge v11 — /gofun → Supabase Edge.
 * CRÍTICO: token do jogador (ch7.*) NÃO pode ir só em Authorization —
 * o gateway Supabase engole/valida JWT e a sessão some no depósito.
 * Copia ch7.* → x-player-token + token; Authorization = Bearer ANON.
 * v11: se SPA não manda Authorization, busca token em localStorage/pinia
 *       (sem isso shop/order falha com "precisa estar logado").
 */
(function () {
  'use strict';
  if (window.__ch7GofunBridgeV11) return;
  window.__ch7GofunBridgeV11 = 1;
  window.__ch7GofunBridgeV10 = 1;
  window.__ch7GofunBridgeV9 = 1;
  window.__ch7GofunBridgeV8 = 1;
  window.__ch7GofunBridgeV7 = 1;

  var EDGE = 'https://vcohnsuomswwfxqlmllm.supabase.co/functions/v1';
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

  function isPlayerToken(t) {
    var s = String(t || '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    if (!s) return false;
    if (s.indexOf('ch7.') === 0 || s.indexOf('ch7_') === 0) return true;
    // token gofun legado (não JWT)
    if (s.indexOf('eyJ') === 0) return false;
    return s.length >= 12 && s.indexOf('.') !== -1;
  }

  /** Token salvo pelo SPA/pinia quando o header Authorization não carrega ch7.* */
  function getStoredPlayerToken() {
    try {
      var keys = [
        'token',
        'Token',
        'ch7_token',
        'auth',
        'ch7_auth',
        'user',
        'userInfo',
        'user-store',
        'auth-store',
      ];
      for (var i = 0; i < keys.length; i++) {
        var raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        if (isPlayerToken(raw)) return String(raw).replace(/^Bearer\s+/i, '').trim();
        if (raw.charAt(0) === '{') {
          try {
            var j = JSON.parse(raw);
            var cand =
              j.token ||
              j.Token ||
              (j.state && (j.state.token || j.state.Token)) ||
              (j.userInfo && (j.userInfo.token || j.userInfo.Token)) ||
              (j.userInfoData && j.userInfoData.token) ||
              '';
            if (isPlayerToken(cand)) return String(cand).replace(/^Bearer\s+/i, '').trim();
          } catch (e1) {}
        }
      }
      // pinia persist keys genéricas
      for (var k = 0; k < localStorage.length; k++) {
        var key = localStorage.key(k) || '';
        if (!/auth|user|token|persist/i.test(key)) continue;
        var v = localStorage.getItem(key) || '';
        if (isPlayerToken(v)) return String(v).replace(/^Bearer\s+/i, '').trim();
        if (v.charAt(0) === '{') {
          try {
            var o = JSON.parse(v);
            var t2 =
              o.token ||
              o.Token ||
              (o.state && (o.state.token || o.state.Token)) ||
              '';
            if (isPlayerToken(t2)) return String(t2).replace(/^Bearer\s+/i, '').trim();
          } catch (e2) {}
        }
      }
    } catch (e) {}
    return '';
  }

  function extractPlayerToken(headersLike) {
    try {
      if (!headersLike) return '';
      if (typeof Headers !== 'undefined' && headersLike instanceof Headers) {
        return (
          headersLike.get('x-player-token') ||
          headersLike.get('token') ||
          headersLike.get('authorization') ||
          headersLike.get('Authorization') ||
          ''
        );
      }
      if (Array.isArray(headersLike)) {
        for (var i = 0; i < headersLike.length; i++) {
          var n = String(headersLike[i][0] || '').toLowerCase();
          if (n === 'x-player-token' || n === 'token' || n === 'authorization') {
            return headersLike[i][1] || '';
          }
        }
        return '';
      }
      return (
        headersLike['x-player-token'] ||
        headersLike['X-Player-Token'] ||
        headersLike.token ||
        headersLike.Token ||
        headersLike.Authorization ||
        headersLike.authorization ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  /** Garante apikey + preserva token do jogador fora do Authorization JWT. */
  function ensureEdgeAuth(headersLike, preferTok) {
    var tok = String(
      preferTok || extractPlayerToken(headersLike) || getStoredPlayerToken() || '',
    )
      .replace(/^Bearer\s+/i, '')
      .trim();
    var player = isPlayerToken(tok) ? tok : '';

    if (typeof Headers !== 'undefined' && headersLike instanceof Headers) {
      if (!headersLike.has('apikey')) headersLike.set('apikey', ANON);
      if (player) {
        headersLike.set('x-player-token', player);
        headersLike.set('token', player);
        headersLike.set('Authorization', 'Bearer ' + ANON);
      } else if (!headersLike.has('Authorization') && !headersLike.has('authorization')) {
        headersLike.set('Authorization', 'Bearer ' + ANON);
      }
      return headersLike;
    }

    if (Array.isArray(headersLike)) {
      var out = headersLike.slice();
      var hasApi = false;
      for (var i = 0; i < out.length; i++) {
        var k = String(out[i][0] || '').toLowerCase();
        if (k === 'apikey') hasApi = true;
        if (k === 'authorization' && player) {
          out[i] = ['Authorization', 'Bearer ' + ANON];
        }
      }
      if (!hasApi) out.push(['apikey', ANON]);
      if (player) {
        out.push(['x-player-token', player]);
        out.push(['token', player]);
      }
      return out;
    }

    var h = headersLike && typeof headersLike === 'object' ? Object.assign({}, headersLike) : {};
    if (!h.apikey && !h.Apikey) h.apikey = ANON;
    if (player) {
      h['x-player-token'] = player;
      h.token = player;
      h.Authorization = 'Bearer ' + ANON;
      h.authorization = 'Bearer ' + ANON;
    } else if (!h.Authorization && !h.authorization) {
      h.Authorization = 'Bearer ' + ANON;
    }
    return h;
  }

  function isStaticProdHost() {
    var h = location.hostname || '';
    return (
      h === 'chinesinha777.bet' ||
      h === 'www.chinesinha777.bet' ||
      /\.github\.io$/i.test(h)
    );
  }

  /** Local dev: server.mjs tem P0 (vip/shop/auth) — NÃO mandar pro Edge vazio */
  function isLocalDev() {
    var h = location.hostname || '';
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  /** /painel/* não existe no GH Pages — reescreve ou stub. */
  function mapPainelUrl(u) {
    try {
      var url = new URL(u, location.href);
      if (!/\/painel\//i.test(url.pathname) && !/deposit-bonuses/i.test(url.pathname + url.search)) {
        return null;
      }
      // deposit-bonuses → JSON estático (sem 404)
      if (/deposit-bonuses/i.test(url.pathname)) {
        return location.origin + '/static/deposit-bonuses.json';
      }
      // outros endpoints do painel em prod estático → stub vazio
      if (isStaticProdHost() && /\/painel\//i.test(url.pathname)) {
        return '__ch7_stub_empty_json__';
      }
    } catch (e) {}
    return null;
  }

  function emptyJsonResponse() {
    return new Response(JSON.stringify({ ok: true, data: [], list: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  function mapUrl(u) {
    if (u == null) return u;
    if (typeof u !== 'string') {
      try {
        if (typeof URL !== 'undefined' && u instanceof URL) u = u.href;
        else return u;
      } catch (e) {
        return u;
      }
    }
    if (!u) return u;
    if (/cloudflareinsights|google-analytics|googletagmanager|facebook\.net|hotjar|sentry/i.test(u)) {
      return u;
    }
    if (/igamewin|pgsoft|pragmaticplay|jili|evolution|spribe|royalgam/i.test(u)) {
      return u;
    }
    // painel morto em prod
    var painel = mapPainelUrl(u);
    if (painel) return painel;

    try {
      var url = new URL(u, location.href);
      if (!isOurHost(url.hostname) && u.indexOf('/gofun/') === -1) return u;

      if (url.pathname.indexOf('/gofun') === 0) {
        // localhost → same-origin (front/server.mjs com List VIP completa)
        if (isLocalDev()) {
          return location.origin + url.pathname + url.search;
        }
        return GOFUN + url.pathname.replace(/^\/gofun/, '') + url.search;
      }
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
    var prefer = extractPlayerToken(init.headers) || getStoredPlayerToken();
    init.headers = ensureEdgeAuth(init.headers || {}, prefer);
    return init;
  }

  // fetch
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string') {
        var nu = mapUrl(input);
        if (nu === '__ch7_stub_empty_json__') return Promise.resolve(emptyJsonResponse());
        if (nu !== input) {
          input = nu;
          init = patchInitHeaders(init, nu);
        }
      } else if (input && typeof Request !== 'undefined' && input instanceof Request) {
        var nu2 = mapUrl(input.url);
        if (nu2 === '__ch7_stub_empty_json__') return Promise.resolve(emptyJsonResponse());
        if (nu2 !== input.url) {
          var h2 = new Headers(input.headers);
          var ptok = extractPlayerToken(h2);
          ensureEdgeAuth(h2, ptok);
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

  // XHR
  var XO = XMLHttpRequest.prototype.open;
  var XS = XMLHttpRequest.prototype.send;
  var XSR = XMLHttpRequest.prototype.setRequestHeader;
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
      if (mapped === '__ch7_stub_empty_json__') {
        this.__ch7StubEmpty = 1;
        mapped = location.origin + '/static/deposit-bonuses.json';
      }
      this.__ch7Url = mapped;
      this.__ch7PlayerTok = '';
      arguments[1] = mapped;
    } catch (e) {}
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    try {
      if (this.__ch7Url && String(this.__ch7Url).indexOf('supabase.co') !== -1) {
        if (/^authorization$/i.test(String(name || ''))) {
          var v = String(value || '')
            .replace(/^Bearer\s+/i, '')
            .trim();
          if (isPlayerToken(v)) {
            this.__ch7PlayerTok = v;
            // não envia ch7 no Authorization — gateway Supabase quebra a sessão
            try {
              XSR.call(this, 'x-player-token', v);
            } catch (e1) {}
            try {
              XSR.call(this, 'token', v);
            } catch (e2) {}
            return XSR.call(this, 'Authorization', 'Bearer ' + ANON);
          }
        }
      }
    } catch (e) {}
    return XSR.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (this.__ch7Url && String(this.__ch7Url).indexOf('supabase.co') !== -1) {
        try {
          this.setRequestHeader('apikey', ANON);
        } catch (e) {}
        // fallback: SPA pode não ter setado Authorization (só token no pinia)
        if (!this.__ch7PlayerTok || !isPlayerToken(this.__ch7PlayerTok)) {
          this.__ch7PlayerTok = getStoredPlayerToken() || this.__ch7PlayerTok || '';
        }
        if (this.__ch7PlayerTok && isPlayerToken(this.__ch7PlayerTok)) {
          try {
            this.setRequestHeader('x-player-token', this.__ch7PlayerTok);
          } catch (e2) {}
          try {
            this.setRequestHeader('token', this.__ch7PlayerTok);
          } catch (e3) {}
          try {
            // Authorization = ANON (gateway Supabase); player vai no x-player-token
            this.setRequestHeader('Authorization', 'Bearer ' + ANON);
          } catch (e4) {}
        } else {
          try {
            this.setRequestHeader('Authorization', 'Bearer ' + ANON);
          } catch (e5) {}
        }
      }
    } catch (e) {}
    return XS.apply(this, arguments);
  };

  // axios (SPA gofun client)
  function hookAxios() {
    try {
      var ax = window.axios || null;
      if (ax && ax.interceptors && ax.interceptors.request && !ax.__ch7HookedV8) {
        ax.__ch7HookedV8 = 1;
        ax.__ch7Hooked = 1;
        ax.interceptors.request.use(function (config) {
          if (config && config.url) {
            config.url = mapUrl(config.url);
            if (String(config.url).indexOf('supabase.co') !== -1) {
              config.headers = config.headers || {};
              var auth =
                config.headers.Authorization ||
                config.headers.authorization ||
                '';
              var tok = String(auth)
                .replace(/^Bearer\s+/i, '')
                .trim();
              // SPA auth store às vezes só no default header
              if (!isPlayerToken(tok) && ax.defaults && ax.defaults.headers) {
                var d =
                  (ax.defaults.headers.common && ax.defaults.headers.common.Authorization) ||
                  ax.defaults.headers.Authorization ||
                  '';
                tok = String(d)
                  .replace(/^Bearer\s+/i, '')
                  .trim() || tok;
              }
              // pinia / localStorage fallback (depósito PIX)
              if (!isPlayerToken(tok)) {
                tok = getStoredPlayerToken() || tok;
              }
              config.headers = ensureEdgeAuth(config.headers, tok);
            }
          }
          return config;
        });
      }
    } catch (e) {}
  }
  // hook axios poucas vezes (sem interval infinito)
  setTimeout(hookAxios, 100);
  setTimeout(hookAxios, 500);
  setTimeout(hookAxios, 1500);
  setTimeout(hookAxios, 4000);

  // SW cleanup
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
  window.__ch7EnsureEdgeAuth = ensureEdgeAuth;
})();
