/**
 * Garante que #/rechargeIframe mostre o PIX (QR + copia e cola).
 * v9 — modal de erro amigável + instruções login/suporte.
 */
(function () {
  'use strict';
  if (window.__ch7DepositPixInitV9) return;
  window.__ch7DepositPixInitV9 = 1;
  window.__ch7DepositPixInitV8 = 1;
  window.__ch7DepositPixInit = 1;

  var KEY = 'ch7_last_pix_url';
  var KEY_ORDER = 'ch7_last_pix_order';
  var KEY_TS = 'ch7_last_pix_ts';
  var STYLE_ID = 'ch7-deposit-pix-style';
  var FALLBACK_ID = 'ch7-pix-fallback';
  var MAX_AGE_MS = 60 * 60 * 1000;
  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';

  function isRechargeIframe() {
    return /#\/?rechargeIframe\b/i.test(String(location.hash || ''));
  }

  function normalizePixUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    // local Node usava /pix-pay — em GH Pages precisa .html
    s = s.replace(/\/pix-pay(\?|#|$)/i, '/pix-pay.html$1');
    s = s.replace(/pix-pay\?/i, function (m) {
      return m.indexOf('.html') >= 0 ? m : 'pix-pay.html?';
    });
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === '/') return location.origin + s;
    if (/pix-pay/i.test(s)) return location.origin + '/' + s.replace(/^\//, '');
    return location.origin + '/' + s;
  }

  function absUrl(u) {
    return normalizePixUrl(u);
  }

  function savePix(url, orderId) {
    try {
      var n = normalizePixUrl(url);
      if (n) {
        localStorage.setItem(KEY, n);
        localStorage.setItem(KEY_TS, String(Date.now()));
      }
      if (orderId) localStorage.setItem(KEY_ORDER, String(orderId));
    } catch (e) {}
  }

  function loadPix() {
    try {
      var url = localStorage.getItem(KEY) || '';
      var ts = Number(localStorage.getItem(KEY_TS) || 0);
      if (!url) return null;
      if (ts && Date.now() - ts > MAX_AGE_MS) return null;
      return {
        url: normalizePixUrl(url),
        orderId: localStorage.getItem(KEY_ORDER) || '',
      };
    } catch (e) {
      return null;
    }
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '/* PIX iframe full height + hide stuck loaders */' +
      '.iframe-container.ch7-pix-fix,' +
      '.iframe-container:has(iframe.iframe2),' +
      '.iframe-container:has(iframe.ch7-pix-iframe){' +
      'position:absolute!important;inset:0!important;height:100%!important;min-height:70vh!important;z-index:5;}' +
      '.iframe-container iframe.iframe2,' +
      '.iframe-container iframe.ch7-pix-iframe{' +
      'width:100%!important;height:100%!important;min-height:70vh!important;border:0!important;background:#171512!important;}' +
      'body.ch7-recharge-iframe .q-loading,' +
      'body.ch7-recharge-iframe .q-loading__backdrop,' +
      'body.ch7-recharge-iframe .q-inner-loading,' +
      'body.ch7-recharge-iframe .fullscreen.q-loading,' +
      'body.ch7-recharge-iframe .q-loading-bar{' +
      'display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}' +
      '#' +
      FALLBACK_ID +
      '{position:fixed;inset:0;z-index:99970;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(10,8,6,.92);padding:16px;}' +
      '#' +
      FALLBACK_ID +
      ' .box{max-width:380px;width:100%;background:linear-gradient(180deg,#2a1e10,#16120c);border:1px solid rgba(246,207,135,.3);' +
      'border-radius:16px;padding:20px;color:#fff;font:400 14px/1.45 system-ui,sans-serif;text-align:center;}' +
      '#' +
      FALLBACK_ID +
      ' h2{margin:0 0 8px;color:#f6cf87;font-size:16px;}' +
      '#' +
      FALLBACK_ID +
      ' p{margin:0 0 14px;color:rgba(255,255,255,.7);font-size:13px;}' +
      '#' +
      FALLBACK_ID +
      ' button{width:100%;padding:12px;border:0;border-radius:12px;margin-top:8px;font-weight:800;cursor:pointer;}' +
      '#' +
      FALLBACK_ID +
      ' .primary{background:linear-gradient(180deg,#ffe566,#f0b429);color:#1a1208;}' +
      '#' +
      FALLBACK_ID +
      ' .ghost{background:#323749;color:#fff;}';
    document.head.appendChild(s);
  }

  function hideSpaLoading() {
    try {
      document.body.classList.toggle('ch7-recharge-iframe', isRechargeIframe());
    } catch (e) {}
    try {
      var app =
        document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia =
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (typeof store.setIframeLoading === 'function') store.setIframeLoading(false);
            if (store.$state && store.$state.iframeLoading) store.$state.iframeLoading = false;
            if (store.iframeLoading) store.iframeLoading = false;
          } catch (e) {}
        });
      }
    } catch (e) {}
    try {
      document
        .querySelectorAll(
          '.q-loading, .q-loading__backdrop, .q-inner-loading, .fullscreen.q-loading, .q-loading-bar',
        )
        .forEach(function (el) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          el.style.opacity = '0';
        });
    } catch (e) {}
  }

  function findRechargeIframe() {
    return (
      document.querySelector('.iframe-container iframe.iframe2') ||
      document.querySelector('.iframe-container iframe') ||
      document.querySelector('iframe.iframe2') ||
      document.querySelector('iframe.ch7-pix-iframe')
    );
  }

  function ensureIframe(url) {
    ensureStyle();
    var abs = normalizePixUrl(url);
    if (!abs) return false;

    var container =
      document.querySelector('.iframe-container') ||
      document.querySelector('.q-page.bg-white') ||
      document.querySelector('#q-app .q-page') ||
      document.querySelector('#q-app') ||
      document.body;

    var iframe = findRechargeIframe();
    if (!iframe) {
      var wrap = document.querySelector('.iframe-container');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'iframe-container ch7-pix-fix';
        container.appendChild(wrap);
      }
      wrap.classList.add('ch7-pix-fix');
      iframe = document.createElement('iframe');
      iframe.className = 'iframe2 ch7-pix-iframe';
      wrap.appendChild(iframe);
    }

    iframe.classList.add('ch7-pix-iframe');
    try {
      iframe.removeAttribute('sandbox');
    } catch (e) {}
    iframe.setAttribute(
      'allow',
      'payment *; clipboard-write *; fullscreen *; autoplay *',
    );
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.style.cssText =
      'width:100%;height:100%;min-height:70vh;border:0;background:#171512;display:block;';

    var cur = iframe.getAttribute('src') || '';
    if (normalizePixUrl(cur) !== abs) {
      iframe.setAttribute('src', abs);
    }
    iframe.onload = function () {
      hideSpaLoading();
    };
    iframe.onerror = function () {
      hideSpaLoading();
    };
    hideFallback();
    hideSpaLoading();
    // safety: loading some browsers não dispara se cache
    setTimeout(hideSpaLoading, 300);
    setTimeout(hideSpaLoading, 1200);
    return true;
  }

  function showFallback(msg) {
    ensureStyle();
    hideSpaLoading();
    var el = document.getElementById(FALLBACK_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = FALLBACK_ID;
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="box">' +
      '<h2>Depósito PIX</h2>' +
      '<p>' +
      (msg ||
        'Não encontramos um pedido PIX ativo. Volte e escolha um valor para gerar o QR Code.') +
      '</p>' +
      '<button type="button" class="primary" id="ch7-pix-go-recharge">Ir para Depósito</button>' +
      '<button type="button" class="ghost" id="ch7-pix-retry">Tentar de novo</button>' +
      '</div>';
    el.style.display = 'flex';
    var b1 = document.getElementById('ch7-pix-go-recharge');
    if (b1)
      b1.onclick = function () {
        location.hash = '#/recharge';
        hideFallback();
      };
    var b2 = document.getElementById('ch7-pix-retry');
    if (b2)
      b2.onclick = function () {
        hideFallback();
        fixRechargeIframe(true);
      };
  }

  function hideFallback() {
    var el = document.getElementById(FALLBACK_ID);
    if (el) el.style.display = 'none';
  }

  function getPiniaStores() {
    try {
      var app =
        document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia =
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$pinia;
      if (!pinia || !pinia._s) return [];
      var out = [];
      pinia._s.forEach(function (store) {
        out.push(store);
      });
      return out;
    } catch (e) {
      return [];
    }
  }

  function patchSetRechargeUrl() {
    getPiniaStores().forEach(function (store) {
      try {
        if (!store || store.__ch7PixUrlPatch) return;
        if (typeof store.setRechargeUrl !== 'function') return;
        store.__ch7PixUrlPatch = 1;
        var orig = store.setRechargeUrl.bind(store);
        store.setRechargeUrl = function (url) {
          var fixed = normalizePixUrl(url);
          if (fixed) {
            savePix(fixed, '');
            setTimeout(function () {
              if (isRechargeIframe() || /rechargeIframe/i.test(location.hash)) {
                ensureIframe(fixed);
              }
              hideSpaLoading();
            }, 30);
            setTimeout(hideSpaLoading, 400);
          }
          return orig(fixed || url);
        };
      } catch (e) {}
    });
  }

  function readStoreRechargeUrl() {
    var url = '';
    getPiniaStores().forEach(function (store) {
      if (url) return;
      try {
        if (store.rechargeUrl) url = store.rechargeUrl;
        if (typeof store.getRechargeUrl === 'function') {
          url = store.getRechargeUrl() || url;
        }
        if (store.$state && store.$state.rechargeUrl) url = store.$state.rechargeUrl;
      } catch (e) {}
    });
    return normalizePixUrl(url);
  }

  function fixRechargeIframe(force) {
    if (!isRechargeIframe() && !force) {
      try {
        document.body.classList.remove('ch7-recharge-iframe');
      } catch (e) {}
      hideFallback();
      return;
    }
    if (!isRechargeIframe()) return;

    ensureStyle();
    hideSpaLoading();
    patchSetRechargeUrl();

    var iframe = findRechargeIframe();
    var src = iframe ? iframe.getAttribute('src') || '' : '';
    if (/pix-pay/i.test(src)) {
      ensureIframe(src);
      return;
    }

    var storeUrl = readStoreRechargeUrl();
    if (storeUrl) {
      savePix(storeUrl, '');
      ensureIframe(storeUrl);
      return;
    }

    var saved = loadPix();
    if (saved && saved.url) {
      // re-injeta na store para o MainLayout também pegar
      try {
        getPiniaStores().forEach(function (store) {
          if (typeof store.setRechargeUrl === 'function') {
            store.setRechargeUrl(saved.url);
          }
        });
      } catch (e) {}
      ensureIframe(saved.url);
      return;
    }

    // se order na query do hash/local
    try {
      var oid = localStorage.getItem(KEY_ORDER) || '';
      if (oid) {
        var rebuild = location.origin + '/pix-pay.html?order=' + encodeURIComponent(oid);
        ensureIframe(rebuild);
        return;
      }
    } catch (e) {}

    showFallback();
  }

  function pickPayFromObj(j) {
    if (!j || typeof j !== 'object') return null;
    var d = j.data || j.Data || j;
    if (!d || typeof d !== 'object') {
      // às vezes o payload já é o data
      if (j.url || j.Url || j.payUrl) d = j;
      else return null;
    }
    var pay =
      d.url || d.Url || d.payUrl || d.PayUrl || d.pay_url || d.path || d.Path || '';
    var oid = d.OrderID || d.orderId || d.order_id || '';
    if (!pay && typeof d === 'string' && /pix-pay/i.test(d)) pay = d;
    if (!pay) return null;
    return { pay: normalizePixUrl(pay), oid: oid || '' };
  }

  /** Decrypt AES-ECB base64 (mesmo formato do SPA / Edge). */
  function tryDecryptAes(text) {
    var raw = String(text || '').trim();
    if (!raw || raw.charAt(0) === '{' || raw.charAt(0) === '[') return null;
    try {
      // CryptoJS global se já no page (bundle SPA não expõe fácil)
      var C = window.CryptoJS;
      if (!C) return null;
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var params = C.lib.CipherParams.create({
        ciphertext: C.enc.Base64.parse(raw),
      });
      var dec = C.AES.decrypt(params, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      var plain = dec.toString(C.enc.Utf8);
      if (plain && plain.charAt(0) === '{') return JSON.parse(plain);
    } catch (e) {}
    return null;
  }

  function parseShopOrderPayload(text) {
    try {
      if (text && (text.charAt(0) === '{' || text.charAt(0) === '[')) {
        return JSON.parse(text);
      }
    } catch (e) {}
    return tryDecryptAes(text);
  }

  function harvestShopOrderBody(text) {
    var j = parseShopOrderPayload(text);
    if (j) {
      var hit = pickPayFromObj(j);
      if (hit) return hit;
    }
    try {
      var m = String(text || '').match(
        /https?:\/\/[^\s"'\\]+pix-pay(?:\.html)?\?order=[A-Za-z0-9_-]+/i,
      );
      if (m) {
        return {
          pay: normalizePixUrl(m[0]),
          oid: (m[0].match(/order=([^&]+)/) || [])[1] || '',
        };
      }
    } catch (e2) {}
    return null;
  }

  var ERR_ID = 'ch7-deposit-error-modal';

  /**
   * Modal amigável de falha do PIX.
   * @param {string} msg  mensagem da API (opcional)
   * @param {string|number} [code] código do erro (ex. 10001)
   */
  function showDepositError(msg, code) {
    hideSpaLoading();
    var apiMsg = String(msg || '').trim().replace(/</g, '');
    var errCode =
      code != null && String(code) !== '' && String(code) !== '0'
        ? String(code)
        : '';
    // extrair código se vier no texto
    if (!errCode) {
      var cm = apiMsg.match(/\b(code|código|codigo)[:\s#]*([0-9]{3,5})\b/i);
      if (cm) errCode = cm[2];
    }

    var old = document.getElementById(ERR_ID);
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = ERR_ID;
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-labelledby', 'ch7-de-title');
    el.style.cssText =
      'position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(8,6,4,.88)';

    var codeHtml = errCode
      ? '<div style="display:inline-block;margin:0 0 14px;padding:6px 12px;border-radius:999px;' +
        'background:rgba(246,207,135,.12);border:1px solid rgba(246,207,135,.35);' +
        'font:700 12px/1.2 ui-monospace,Consolas,monospace;color:#f6cf87;letter-spacing:.04em">' +
        'Código: ' +
        errCode +
        '</div>'
      : '';

    // detalhe técnico curto (sem repetir o bloco amigável inteiro)
    var detail = '';
    if (apiMsg) {
      var short = apiMsg
        .replace(/\s*Faça login novamente[\s\S]*/i, '')
        .replace(/\s*Se o problema[\s\S]*/i, '')
        .trim();
      if (
        short &&
        short.length < 160 &&
        !/n[aã]o foi poss[ií]vel gerar o pix no momento/i.test(short)
      ) {
        detail =
          '<p style="margin:0 0 14px;font-size:12px;color:rgba(255,255,255,.55);line-height:1.4">' +
          short +
          '</p>';
      }
    }

    el.innerHTML =
      '<div style="max-width:400px;width:100%;text-align:center;border-radius:18px;padding:24px 20px 18px;' +
      'background:linear-gradient(165deg,#2c2114 0%,#16120c 100%);border:1px solid rgba(246,207,135,.35);' +
      'color:#fff;font:500 14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;' +
      'box-shadow:0 16px 48px rgba(0,0,0,.5)">' +
      '<div style="font-size:40px;line-height:1;margin-bottom:10px" aria-hidden="true">⚠️</div>' +
      '<h2 id="ch7-de-title" style="margin:0 0 14px;color:#f6cf87;font:800 1.15rem/1.3 system-ui,sans-serif">' +
      'Não foi possível gerar o PIX</h2>' +
      '<div style="text-align:left;margin:0 0 12px;padding:12px 14px;border-radius:12px;' +
      'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">' +
      '<p style="margin:0 0 8px;color:rgba(255,255,255,.9);font-size:13.5px;line-height:1.5">' +
      'Não foi possível gerar o PIX no momento.</p>' +
      '<p style="margin:0 0 8px;color:rgba(255,255,255,.82);font-size:13.5px;line-height:1.5">' +
      'Sua sessão pode ter expirado.</p>' +
      '<p style="margin:0 0 8px;color:rgba(255,255,255,.82);font-size:13.5px;line-height:1.5">' +
      'Faça login novamente e tente o depósito.</p>' +
      '<p style="margin:0;color:rgba(255,255,255,.75);font-size:13px;line-height:1.5">' +
      'Se o problema continuar, contate o suporte com o código do erro.</p>' +
      '</div>' +
      codeHtml +
      detail +
      '<button type="button" id="ch7-de-retry" style="width:100%;padding:14px;border:0;border-radius:12px;' +
      'font:800 15px/1.2 system-ui,sans-serif;cursor:pointer;' +
      'background:linear-gradient(180deg,#ffe566 0%,#f0b429 55%,#d4920a 100%);color:#1a1208;' +
      'box-shadow:0 6px 18px rgba(240,180,41,.28)">Tentar novamente</button>' +
      '<button type="button" id="ch7-de-login" style="width:100%;margin-top:8px;padding:13px;border:0;border-radius:12px;' +
      'font:700 14px/1.2 system-ui,sans-serif;cursor:pointer;background:#323749;color:#fff">' +
      'Ir para Login</button>' +
      '<button type="button" id="ch7-de-close" style="width:100%;margin-top:6px;padding:11px;border:0;border-radius:12px;' +
      'font:600 13px/1.2 system-ui,sans-serif;cursor:pointer;background:transparent;' +
      'color:rgba(255,255,255,.55)">Fechar</button>' +
      '</div>';
    document.body.appendChild(el);

    function closeModal() {
      try {
        el.remove();
      } catch (e) {}
    }

    var bRetry = document.getElementById('ch7-de-retry');
    if (bRetry)
      bRetry.onclick = function () {
        closeModal();
        // volta para depósito para tentar de novo
        location.hash = '#/recharge';
      };

    var b1 = document.getElementById('ch7-de-login');
    if (b1)
      b1.onclick = function () {
        closeModal();
        location.hash = '#/';
        setTimeout(function () {
          try {
            var btns = document.querySelectorAll('button, .q-btn, a, span, div');
            for (var i = 0; i < btns.length; i++) {
              var t = (btns[i].textContent || '').replace(/\s+/g, ' ').trim();
              if (/^(Entrar|Login)$/i.test(t)) {
                btns[i].click();
                break;
              }
            }
          } catch (e2) {}
        }, 350);
      };

    var b2 = document.getElementById('ch7-de-close');
    if (b2) b2.onclick = closeModal;

    el.addEventListener('click', function (ev) {
      if (ev.target === el) closeModal();
    });
  }

  function handleShopOrderResponse(text) {
    var hit = harvestShopOrderBody(text);
    if (hit && hit.pay) {
      onShopOrderHit(hit.pay, hit.oid);
      return;
    }
    var j = parseShopOrderPayload(text);
    if (j && typeof j === 'object' && j.code != null && Number(j.code) !== 0) {
      showDepositError(
        j.msg || j.message || 'Erro ao processar o depósito.',
        j.code,
      );
    }
  }

  function onShopOrderHit(pay, oid) {
    if (!pay) return;
    var fixed = normalizePixUrl(pay);
    savePix(fixed, oid);
    hideSpaLoading();
    try {
      getPiniaStores().forEach(function (store) {
        if (typeof store.setRechargeUrl === 'function') store.setRechargeUrl(fixed);
      });
    } catch (e) {}
    setTimeout(function () {
      if (isRechargeIframe()) ensureIframe(fixed);
      hideSpaLoading();
    }, 40);
    setTimeout(function () {
      if (isRechargeIframe()) ensureIframe(fixed);
      hideSpaLoading();
    }, 500);
  }

  // fetch intercept
  if (typeof window.fetch === 'function' && !window.__ch7PixFetchV9) {
    window.__ch7PixFetchV9 = 1;
    window.__ch7PixFetchV8 = 1;
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return _fetch.apply(this, arguments).then(function (res) {
        try {
          if (/shop\/order/i.test(url) && res && res.clone) {
            res
              .clone()
              .text()
              .then(function (text) {
                handleShopOrderResponse(text);
              })
              .catch(function () {});
          }
        } catch (e) {}
        return res;
      });
    };
  }

  // XHR intercept
  if (typeof XMLHttpRequest !== 'undefined' && !window.__ch7PixXhrV9) {
    window.__ch7PixXhrV9 = 1;
    window.__ch7PixXhrV8 = 1;
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__ch7u = url == null ? '' : String(url);
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      var xhr = this;
      if (/shop\/order/i.test(xhr.__ch7u || '')) {
        xhr.addEventListener('load', function () {
          try {
            handleShopOrderResponse(xhr.responseText || '');
          } catch (e) {}
          setTimeout(hideSpaLoading, 80);
          setTimeout(hideSpaLoading, 600);
        });
      }
      return _send.apply(this, arguments);
    };
  }

  // loading killer while on rechargeIframe
  var killTimer = null;
  function armLoadingKiller() {
    if (killTimer) clearInterval(killTimer);
    if (!isRechargeIframe()) return;
    var n = 0;
    killTimer = setInterval(function () {
      n++;
      hideSpaLoading();
      patchSetRechargeUrl();
      if (n === 1 || n === 4 || n === 10) fixRechargeIframe(false);
      if (!isRechargeIframe() || n > 40) {
        clearInterval(killTimer);
        killTimer = null;
      }
    }, 400);
  }

  var t = null;
  function schedule() {
    patchSetRechargeUrl();
    if (!isRechargeIframe()) {
      try {
        document.body.classList.remove('ch7-recharge-iframe');
      } catch (e) {}
      return;
    }
    armLoadingKiller();
    clearTimeout(t);
    t = setTimeout(function () {
      fixRechargeIframe(false);
    }, 120);
  }

  // success overlay (postMessage from pix-pay)
  var SUCCESS_ID = 'ch7-deposit-success';
  function fmtBRL(n) {
    try {
      return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return 'R$ ' + n;
    }
  }
  function showDepositSuccess(payload) {
    hideSpaLoading();
    var amt = Number(payload && payload.amountReais != null ? payload.amountReais : 0);
    var existing = document.getElementById(SUCCESS_ID);
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = SUCCESS_ID;
    el.style.cssText =
      'position:fixed;inset:0;z-index:99980;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,4,.85)';
    el.innerHTML =
      '<div style="max-width:400px;width:100%;text-align:center;border-radius:20px;padding:26px 20px;background:linear-gradient(165deg,#2c2114,#16120c);border:1px solid rgba(246,207,135,.38);color:#fff;font:500 14px/1.45 system-ui,sans-serif">' +
      '<div style="width:78px;height:78px;margin:0 auto 12px;border-radius:50%;background:linear-gradient(145deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;font-size:40px">✓</div>' +
      '<h2 style="margin:0 0 8px;color:#f6cf87">Obrigado por depositar!</h2>' +
      '<div style="margin:10px 0;color:#ffe13c;font:800 1.75rem/1.1 system-ui,sans-serif">' +
      fmtBRL(amt) +
      '</div>' +
      '<p style="color:rgba(255,255,255,.8)">Saldo atualizado na carteira.</p>' +
      '<button type="button" id="ch7-ds-play" style="width:100%;padding:13px;border:0;border-radius:12px;margin-top:12px;font-weight:800;background:linear-gradient(180deg,#ffe566,#f0b429);color:#1a1208;cursor:pointer">Continuar jogando</button>' +
      '</div>';
    document.body.appendChild(el);
    var b = document.getElementById('ch7-ds-play');
    if (b)
      b.onclick = function () {
        try {
          el.remove();
        } catch (e) {}
        location.hash = '#/';
      };
  }

  window.addEventListener('message', function (ev) {
    try {
      var d = ev && ev.data;
      if (!d) return;
      if (d.type === 'ch7-pix-ready' || d.type === 'ch7-pix-close') {
        hideSpaLoading();
        return;
      }
      if (d.type === 'ch7-pix-paid') showDepositSuccess(d);
    } catch (e) {}
  });

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  setTimeout(schedule, 200);
  setTimeout(schedule, 800);
  setTimeout(schedule, 2000);
  setTimeout(patchSetRechargeUrl, 1000);
  setTimeout(patchSetRechargeUrl, 3000);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7PixMoV8) {
    window.__ch7PixMoV8 = 1;
    var mo = new MutationObserver(function () {
      if (!isRechargeIframe()) return;
      schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7Pix = {
    fix: function () {
      fixRechargeIframe(true);
    },
    last: loadPix,
    success: showDepositSuccess,
    hideLoading: hideSpaLoading,
  };
})();
