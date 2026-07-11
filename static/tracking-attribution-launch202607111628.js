/**
 * Tracking Chinesinha777 — atribuição + dataLayer (GTM).
 * Eventos FE: cadastro | init_checkout
 * Sem fbq hardcoded — tudo via GTM.
 * Guard anti "Duplicate Pixel ID" reforçado (GTM com várias tags no mesmo pixel).
 */
(function () {
  'use strict';

  var ATTR_KEY = 'ch7_tracking_attr';
  var ATTR_TTL_MS = 90 * 24 * 60 * 60 * 1000;
  var LS_FBC = 'ch7_fbc';

  // Reforço: se o guard do <head> não pegou, aplica aqui
  (function reinforceFbqDedup() {
    if (typeof window === 'undefined') return;
    var inited = window.__ch7FbInitedIds || (window.__ch7FbInitedIds = Object.create(null));
    function okInit(args) {
      if (!args || args[0] !== 'init') return true;
      var id = String(args[1] || '');
      if (!id) return true;
      if (inited[id]) return false;
      inited[id] = 1;
      return true;
    }
    function patch(fbq) {
      if (typeof fbq !== 'function' || fbq.__ch7Dedup2) return;
      var orig = fbq;
      var cm = fbq.callMethod;
      function wrapped() {
        if (!okInit(arguments)) return;
        if (typeof cm === 'function') return cm.apply(orig, arguments);
        return orig.apply(orig, arguments);
      }
      for (var k in orig) {
        try {
          wrapped[k] = orig[k];
        } catch (e) {}
      }
      wrapped.queue = orig.queue;
      wrapped.callMethod = function () {
        if (!okInit(arguments)) return;
        if (typeof cm === 'function') return cm.apply(orig, arguments);
      };
      wrapped.__ch7Dedup = 1;
      wrapped.__ch7Dedup2 = 1;
      window.fbq = wrapped;
    }
    if (typeof window.fbq === 'function') patch(window.fbq);
    else {
      var n = 0;
      var t = setInterval(function () {
        if (typeof window.fbq === 'function') {
          patch(window.fbq);
          clearInterval(t);
        } else if (++n > 200) clearInterval(t);
      }, 50);
    }
  })();

  function nowMs() {
    return Date.now();
  }

  function readCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) {
      return '';
    }
  }

  function getQueryParam(key) {
    try {
      return new URLSearchParams(window.location.search).get(key) || '';
    } catch (e) {
      return '';
    }
  }

  function collectUtms() {
    var out = {};
    try {
      var sp = new URLSearchParams(window.location.search);
      sp.forEach(function (v, k) {
        if (/^utm_/i.test(k) && v) out[k.toLowerCase()] = String(v);
      });
    } catch (e) {}
    return out;
  }

  function buildFbcFromFbclid(fbclid) {
    if (!fbclid) return '';
    return 'fb.1.' + nowMs() + '.' + fbclid;
  }

  function loadStoredAttr() {
    try {
      var raw = localStorage.getItem(ATTR_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o && o._savedAt && nowMs() - o._savedAt > ATTR_TTL_MS) {
        localStorage.removeItem(ATTR_KEY);
        return null;
      }
      return o;
    } catch (e) {
      return null;
    }
  }

  function saveStoredAttr(attr) {
    try {
      attr._savedAt = nowMs();
      localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
      if (attr.fbc) localStorage.setItem(LS_FBC, attr.fbc);
    } catch (e) {}
  }

  /**
   * Captura atribuição na chegada. Substitui bloco completo se paid (fbclid/fbc).
   * Orgânico não sobrescreve paid já gravado.
   */
  function captureAttribution() {
    var fbclid = getQueryParam('fbclid') || '';
    var fbc = readCookie('_fbc') || '';
    var fbp = readCookie('_fbp') || '';
    var utms = collectUtms();
    var landing = String(window.location.href || '').slice(0, 2000);

    if (fbclid && !fbc) {
      fbc = buildFbcFromFbclid(fbclid);
      try {
        localStorage.setItem(LS_FBC, fbc);
      } catch (e) {}
    }
    if (!fbc) {
      try {
        fbc = localStorage.getItem(LS_FBC) || '';
      } catch (e) {}
    }

    var incomingPaid = Boolean(fbclid || (fbc && fbc.indexOf('fb.1.') === 0));
    var prev = loadStoredAttr() || {};
    var prevPaid = Boolean(prev.fbclid || (prev.fbc && String(prev.fbc).indexOf('fb.1.') === 0));

    var next;
    if (incomingPaid) {
      // substituição em bloco
      next = {
        fbclid: fbclid || prev.fbclid || '',
        fbc: fbc || prev.fbc || '',
        fbp: fbp || prev.fbp || '',
        landing_page: landing || prev.landing_page || '',
        client_user_agent: navigator.userAgent || '',
      };
      Object.keys(utms).forEach(function (k) {
        next[k] = utms[k];
      });
    } else if (prevPaid) {
      // orgânico: mantém paid
      next = prev;
      if (fbp && !next.fbp) next.fbp = fbp;
      if (!next.client_user_agent) next.client_user_agent = navigator.userAgent || '';
    } else {
      next = {
        fbclid: '',
        fbc: fbc || prev.fbc || '',
        fbp: fbp || prev.fbp || '',
        landing_page: prev.landing_page || landing || '',
        client_user_agent: navigator.userAgent || '',
      };
      Object.keys(utms).forEach(function (k) {
        next[k] = utms[k];
      });
      // merge utms antigos se não houver novos
      Object.keys(prev).forEach(function (k) {
        if (/^utm_/i.test(k) && !next[k]) next[k] = prev[k];
      });
    }

    saveStoredAttr(next);
    window.__CH7_TRACKING__ = next;
    return next;
  }

  function getAttribution() {
    return window.__CH7_TRACKING__ || loadStoredAttr() || captureAttribution();
  }

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
  }

  /** cadastro — 1x após registro confirmado */
  function pushCadastro(userId) {
    if (!userId) return;
    ensureDataLayer();
    var key = 'ch7_dl_cadastro_' + userId;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    window.dataLayer.push({
      event: 'cadastro',
      event_id: 'cadastro-' + userId,
    });
  }

  /** init_checkout — quando QR/PIX é exibido */
  function pushInitCheckout(orderId, value) {
    if (!orderId) return;
    ensureDataLayer();
    var v = Number(value);
    if (!Number.isFinite(v)) v = 0;
    window.dataLayer.push({
      event: 'init_checkout',
      event_id: 'init_checkout-' + orderId,
      value: v,
      currency: 'BRL',
      content_name: 'deposito',
      content_category: 'casino',
    });
  }

  function postAttribution(token) {
    var attr = getAttribution();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    try {
      fetch('/api/tracking/attribution', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(attr),
        credentials: 'same-origin',
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  function parseJsonSafe(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  /** Intercepta fetch gofun regist/login/shop/order */
  function patchFetch() {
    if (window.__ch7TrackFetchPatched) return;
    window.__ch7TrackFetchPatched = true;
    var orig = window.fetch;
    if (typeof orig !== 'function') return;

    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = ((init && init.method) || 'GET').toUpperCase();
      var isRegist = /\/account\/regist|\/account\/register/i.test(url) && method === 'POST';
      var isLogin = /\/account\/login/i.test(url) && method === 'POST' && !/loginBy/i.test(url);
      var isOrder = /\/shop\/order/i.test(url) && method === 'POST';

      // anexa tracking no body de regist/login
      if ((isRegist || isLogin) && init && init.body && typeof init.body === 'string') {
        try {
          var bodyObj = parseJsonSafe(init.body);
          if (bodyObj && typeof bodyObj === 'object') {
            var attr = getAttribution();
            bodyObj.tracking = attr;
            bodyObj.attribution = attr;
            if (bodyObj.data && typeof bodyObj.data === 'object') {
              bodyObj.data.tracking = attr;
            }
            init = Object.assign({}, init, { body: JSON.stringify(bodyObj) });
          }
        } catch (e) {}
      }

      return orig.call(this, input, init).then(function (res) {
        try {
          var clone = res.clone();
          clone.text().then(function (text) {
            var j = parseJsonSafe(text);
            if (!j) return;

            if (isRegist && (j.code === 0 || j.code === '0')) {
              var uid =
                (j.data && j.data.userInfoData && (j.data.userInfoData.uid || j.data.userInfoData.id || j.data.userInfoData.UID)) ||
                (j.data && (j.data.uid || j.data.id)) ||
                '';
              var tok =
                (j.data && j.data.userInfoData && (j.data.userInfoData.token || j.data.userInfoData.Token)) ||
                (j.data && (j.data.token || j.data.Token)) ||
                '';
              if (uid) pushCadastro(String(uid));
              if (tok) postAttribution(tok);
              else postAttribution();
            }

            if (isLogin && (j.code === 0 || j.code === '0')) {
              var tokL =
                (j.data && j.data.userInfoData && (j.data.userInfoData.token || j.data.userInfoData.Token)) ||
                (j.data && (j.data.token || j.data.Token)) ||
                '';
              if (tokL) postAttribution(tokL);
            }

            if (isOrder && (j.code === 0 || j.code === '0')) {
              var d = j.data || {};
              var orderId = d.OrderID || d.orderId || d.order_id || d.id || '';
              var amountCents = Number(d.amount || d.Amount || 0);
              var valueReais = amountCents >= 500 ? amountCents / 100 : amountCents;
              if (orderId) pushInitCheckout(String(orderId), valueReais);
            }
          });
        } catch (e) {}
        return res;
      });
    };
  }

  // boot
  captureAttribution();
  patchFetch();
  window.__CH7_TRACKING_API__ = {
    captureAttribution: captureAttribution,
    getAttribution: getAttribution,
    pushCadastro: pushCadastro,
    pushInitCheckout: pushInitCheckout,
    postAttribution: postAttribution,
  };

  // re-captura em mudanças de hash (SPA)
  window.addEventListener('hashchange', function () {
    captureAttribution();
  });
  window.addEventListener('popstate', function () {
    captureAttribution();
  });
})();
