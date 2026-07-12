/**
 * Bridge v15 — /gofun → Supabase Edge (Pro aposta 777).
 * CRÍTICO: token do jogador (ch7.*) NÃO pode ir só em Authorization.
 * v15: reescreve Icons firstpage p/ URL absoluta same-origin (SPA não prefixa CDN)
 *      + log debug (__CHINESINHA_DEBUG__ / ?debug=1)
 * v14: FORÇA host nativo *.supabase.co (csdzxeohpgnvvewnwxod) para XHR/apikey
 * v13: isEdgeMapped no XHR/axios.
 */
(function () {
  'use strict';
  if (window.__ch7GofunBridgeV15) return;
  window.__ch7GofunBridgeV15 = 1;
  window.__ch7GofunBridgeV14 = 1;
  window.__ch7GofunBridgeV13 = 1;
  window.__ch7GofunBridgeV12 = 1;
  window.__ch7GofunBridgeV11 = 1;
  window.__ch7GofunBridgeV10 = 1;
  window.__ch7GofunBridgeV9 = 1;
  window.__ch7GofunBridgeV8 = 1;
  window.__ch7GofunBridgeV7 = 1;

  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';
  var dbgLog = [];
  window.__CH7_GOFUN_DEBUG__ = dbgLog;

  function isDebug() {
    try {
      if (window.__CHINESINHA_DEBUG__ === true) return true;
      if (localStorage.getItem('CHINESINHA_DEBUG') === '1') return true;
      var q = new URLSearchParams(location.search);
      if (q.get('debug') === '1' || q.get('bug') === '1') return true;
    } catch (e) {}
    return false;
  }

  function dbg() {
    if (!isDebug()) return;
    try {
      var args = ['[ch7-bridge]'].concat([].slice.call(arguments));
      dbgLog.push({ t: Date.now(), msg: args.map(String).join(' ') });
      if (dbgLog.length > 100) dbgLog.shift();
      if (console && console.log) console.log.apply(console, args);
    } catch (e) {}
  }

  /**
   * AES-128-ECB raw Base64 (igual Node createCipheriv / SPA).
   * NÃO usar CryptoJS.AES.encrypt().toString() (formato Salted__ OpenSSL).
   */
  function aesDecrypt(b64) {
    var C = window.CryptoJS;
    if (!C || !b64) return null;
    try {
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var raw = String(b64).trim();
      var params = C.lib.CipherParams.create({
        ciphertext: C.enc.Base64.parse(raw),
      });
      var dec = C.AES.decrypt(params, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      var s = dec.toString(C.enc.Utf8);
      return s || null;
    } catch (e) {
      return null;
    }
  }

  function aesEncrypt(obj) {
    var C = window.CryptoJS;
    if (!C) return null;
    try {
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var plain = typeof obj === 'string' ? obj : JSON.stringify(obj);
      var enc = C.AES.encrypt(plain, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      // só ciphertext raw em Base64 (compatível com gofunJson / SPA)
      return C.enc.Base64.stringify(enc.ciphertext);
    } catch (e) {
      return null;
    }
  }

  function fixCoverUrl(v) {
    var s = String(v || '').trim();
    if (!s) return s;
    var origin = location.origin || 'https://chinesinha777.bet';
    if (/banana_man/i.test(s) && /games-orig/i.test(s)) {
      return origin + '/static/games-orig/' + s.split('/').pop();
    }
    if (/okx007\.com/i.test(s) && /games-orig/i.test(s)) {
      return origin + '/static/games-orig/' + s.split('/').pop();
    }
    if (/\/static\/games-orig\//i.test(s)) {
      if (/^https?:\/\//i.test(s)) {
        try {
          var u = new URL(s);
          return origin + u.pathname;
        } catch (e0) {
          return s;
        }
      }
      var p = s.charAt(0) === '/' ? s : '/' + s;
      return origin + p;
    }
    return s;
  }

  function walkFixCovers(node) {
    if (!node || typeof node !== 'object') return 0;
    var n = 0;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) n += walkFixCovers(node[i]);
      return n;
    }
    var keys = ['Icon', 'Image', 'Pic', 'Cover'];
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (node[key] != null && typeof node[key] === 'string') {
        var next = fixCoverUrl(node[key]);
        if (next !== node[key]) {
          node[key] = next;
          n++;
        }
      }
    }
    for (var prop in node) {
      if (!Object.prototype.hasOwnProperty.call(node, prop)) continue;
      if (typeof node[prop] === 'object' && node[prop]) n += walkFixCovers(node[prop]);
    }
    return n;
  }

  /** Reescreve resposta AES firstpage: Icons → absolute same-origin */
  function rewriteFirstpageBody(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    var text = raw.trim();
    if (!text) return raw;
    try {
      var plain;
      var wasAes = false;
      if (text.charAt(0) === '{' || text.charAt(0) === '[') {
        plain = text;
      } else {
        plain = aesDecrypt(text);
        wasAes = true;
        if (!plain) return raw;
      }
      var j = JSON.parse(plain);
      var fixed = walkFixCovers(j);
      var count =
        (j.data && j.data.AllGames && (j.data.AllGames.Count || (j.data.AllGames.List || []).length)) ||
        0;
      window.__CH7_LAST_FIRSTPAGE__ = {
        at: Date.now(),
        gameCount: count,
        coversFixed: fixed,
        code: j.code,
        ok: j.code === 0 || j.code === '0',
      };
      dbg('firstpage rewrite games=' + count + ' coversFixed=' + fixed);
      if (fixed === 0) return raw; // nada mudou — não re-encripta
      if (!wasAes) return JSON.stringify(j);
      var enc = aesEncrypt(j);
      if (!enc) return raw;
      // sanity: re-decrypt deve funcionar
      var check = aesDecrypt(enc);
      if (!check || check.indexOf('"code"') < 0) {
        dbg('re-encrypt sanity fail — keep original');
        return raw;
      }
      return enc;
    } catch (e) {
      dbg('firstpage rewrite fail', e && e.message);
      return raw;
    }
  }

  function attachFirstpageRewrite(xhr) {
    if (!xhr || xhr.__ch7FpHook) return;
    xhr.__ch7FpHook = 1;
    xhr.addEventListener('readystatechange', function () {
      try {
        if (xhr.readyState !== 4) return;
        var u = String(xhr.__ch7Url || '');
        if (!/firstpage/i.test(u)) return;
        if (xhr.status < 200 || xhr.status >= 300) {
          dbg('firstpage HTTP', xhr.status, u);
          window.__CH7_LAST_FIRSTPAGE__ = {
            at: Date.now(),
            ok: false,
            status: xhr.status,
            url: u,
          };
          return;
        }
        var raw = xhr.responseText;
        var fixed = rewriteFirstpageBody(raw);
        if (fixed && fixed !== raw) {
          try {
            Object.defineProperty(xhr, 'responseText', {
              configurable: true,
              get: function () {
                return fixed;
              },
            });
            Object.defineProperty(xhr, 'response', {
              configurable: true,
              get: function () {
                return fixed;
              },
            });
          } catch (eDef) {
            dbg('defineProperty fail', eDef && eDef.message);
          }
        }
      } catch (e2) {
        dbg('fp hook err', e2 && e2.message);
      }
    });
  }

  // Pro aposta 777 — SEMPRE host nativo (contém supabase.co → auth XHR 100%)
  var PRO_REF = 'csdzxeohpgnvvewnwxod';
  var EDGE = 'https://' + PRO_REF + '.supabase.co/functions/v1';
  var GOFUN = EDGE + '/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZHp4ZW9ocGdudnZld253eG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MjY3ODQsImV4cCI6MjA5OTQwMjc4NH0.63S2UMqVcfhpZ6EYIrJlrKx9lsrE1rXUw-_7IRxIloA';

  function applySupabaseCfg(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    if (cfg.anonKey) ANON = String(cfg.anonKey);
    // Preferir SEMPRE URL nativa do projeto Pro (não custom domain) para o gofun
    if (cfg.url && /supabase\.co/i.test(String(cfg.url))) {
      EDGE = String(cfg.url).replace(/\/$/, '') + '/functions/v1';
      GOFUN = EDGE + '/gofun';
    } else if (cfg.projectRef) {
      EDGE = 'https://' + String(cfg.projectRef) + '.supabase.co/functions/v1';
      GOFUN = EDGE + '/gofun';
    }
    window.__CH7_GOFUN_EDGE__ = GOFUN;
    window.__CH7_EDGE_BASE__ = EDGE;
    window.__CH7_ANON__ = ANON;
  }

  // Config síncrono se boot já rodou; senão fetch assíncrono
  if (window.__CH7_SUPABASE__ && window.__CH7_SUPABASE__.url) {
    applySupabaseCfg(window.__CH7_SUPABASE__);
  } else {
    try {
      fetch('/static/supabase-config.json', { cache: 'no-store' })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          if (j) applySupabaseCfg(j);
        })
        .catch(function () {});
    } catch (eCfg) {}
  }

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

  function isEdgeMapped(mapped) {
    var s = String(mapped || '');
    return (
      s.indexOf('supabase.co') !== -1 ||
      s.indexOf('api.chinesinha777.bet') !== -1 ||
      s.indexOf('/functions/v1/') !== -1
    );
  }

  function patchInitHeaders(init, mapped) {
    if (!mapped || !isEdgeMapped(mapped)) return init;
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
      if (/firstpage/i.test(String(mapped || '')) || /firstpage/i.test(String(url || ''))) {
        attachFirstpageRewrite(this);
      }
      if (mapped !== url) dbg('XHR map', url, '→', mapped);
    } catch (e) {}
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    try {
      // v13: custom domain api.chinesinha777.bet também é Edge (não só *.supabase.co)
      if (this.__ch7Url && isEdgeMapped(this.__ch7Url)) {
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
      if (this.__ch7Url && isEdgeMapped(this.__ch7Url)) {
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
      if (ax && ax.interceptors && ax.interceptors.request && !ax.__ch7HookedV13) {
        ax.__ch7HookedV13 = 1;
        ax.__ch7HookedV8 = 1;
        ax.__ch7Hooked = 1;
        ax.interceptors.request.use(function (config) {
          if (config && config.url) {
            config.url = mapUrl(config.url);
            // v13: custom domain também precisa apikey + Authorization ANON
            if (isEdgeMapped(config.url)) {
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
  window.__ch7RewriteFirstpage = rewriteFirstpageBody;
  dbg('bridge v15 ready', GOFUN);
})();
