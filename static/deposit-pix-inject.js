/**
 * Garante que #/rechargeIframe mostre o PIX (QR + copia e cola).
 *
 * Problemas comuns:
 *  - SPA seta rechargeUrl e navega; em refresh a URL some → tela branca
 *  - iframe sandbox / altura 0
 *  - shop/order falha e mesmo assim abre iframe vazio
 *
 * Estratégia:
 *  1) Intercepta shop/order e grava última URL PIX no localStorage
 *  2) Em #/rechargeIframe, injeta/força iframe src = última URL
 *  3) CSS para iframe 100% altura + fallback UI se sem pedido
 */
(function () {
  'use strict';
  if (window.__ch7DepositPixInit) return;
  window.__ch7DepositPixInit = 1;

  var KEY = 'ch7_last_pix_url';
  var KEY_ORDER = 'ch7_last_pix_order';
  var KEY_TS = 'ch7_last_pix_ts';
  var STYLE_ID = 'ch7-deposit-pix-style';
  var FALLBACK_ID = 'ch7-pix-fallback';
  var MAX_AGE_MS = 60 * 60 * 1000; // 1h

  function isRechargeIframe() {
    return /#\/?rechargeIframe\b/i.test(String(location.hash || ''));
  }

  function isRechargePage() {
    return /#\/?recharge\b/i.test(String(location.hash || ''));
  }

  function savePix(url, orderId) {
    try {
      if (url) {
        localStorage.setItem(KEY, String(url));
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
        url: url,
        orderId: localStorage.getItem(KEY_ORDER) || '',
      };
    } catch (e) {
      return null;
    }
  }

  function absUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === '/') return location.origin + s;
    return location.origin + '/' + s;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '/* PIX iframe full height */' +
      '.iframe-container.ch7-pix-fix,' +
      '.iframe-container:has(iframe.iframe2){' +
      'position:absolute!important;inset:0!important;height:100%!important;min-height:70vh!important;z-index:5;}' +
      '.iframe-container iframe.iframe2,' +
      '.iframe-container iframe.ch7-pix-iframe{' +
      'width:100%!important;height:100%!important;min-height:70vh!important;border:0!important;background:#171512!important;}' +
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
    var container =
      document.querySelector('.iframe-container') ||
      document.querySelector('.q-page.bg-white') ||
      document.querySelector('#q-app .q-page');

    var iframe = findRechargeIframe();
    if (!iframe && container) {
      // cria iframe se o SPA não montou (src vazio / bug)
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
    if (!iframe) return false;

    iframe.classList.add('ch7-pix-iframe');
    // sandbox permissivo para QR + scripts
    try {
      iframe.removeAttribute('sandbox');
    } catch (e) {}
    iframe.setAttribute(
      'allow',
      'payment *; clipboard-write *; fullscreen *',
    );
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '70vh';
    iframe.style.border = '0';
    iframe.style.background = '#171512';

    var abs = absUrl(url);
    if (abs && iframe.getAttribute('src') !== abs) {
      iframe.setAttribute('src', abs);
    }
    // esconde fallback se tem src
    hideFallback();
    return true;
  }

  function showFallback(msg) {
    ensureStyle();
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
        'Não encontramos um pedido PIX ativo nesta sessão. Gere um novo depósito para ver o QR Code e o código copia e cola.') +
      '</p>' +
      '<button type="button" class="primary" id="ch7-pix-go-recharge">Ir para Depósito</button>' +
      '<button type="button" class="ghost" id="ch7-pix-retry">Tentar carregar de novo</button>' +
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

  /** Esconde overlay de loading do Quasar / gameStore (trava em #/rechargeIframe). */
  function hideSpaLoading() {
    try {
      var app =
        document.querySelector('#q-app') &&
        document.querySelector('#q-app').__vue_app__;
      var pinia =
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (typeof store.setIframeLoading === 'function') {
              store.setIframeLoading(false);
            }
          } catch (e) {}
        });
      }
    } catch (e) {}
    try {
      // overlays Quasar comuns
      document
        .querySelectorAll(
          '.q-loading, .q-loading__backdrop, .q-inner-loading, .fullscreen.q-loading',
        )
        .forEach(function (el) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        });
    } catch (e) {}
  }

  function fixRechargeIframe(force) {
    if (!isRechargeIframe() && !force) {
      hideFallback();
      return;
    }
    if (!isRechargeIframe()) return;

    ensureStyle();
    hideSpaLoading();
    var saved = loadPix();
    var iframe = findRechargeIframe();
    var src = iframe ? iframe.getAttribute('src') || '' : '';

    // se iframe já tem pix-pay, ok
    if (/pix-pay/i.test(src)) {
      ensureIframe(src);
      hideFallback();
      hideSpaLoading();
      // onload do iframe → tira loading de novo
      try {
        iframe.onload = function () {
          hideSpaLoading();
        };
      } catch (e) {}
      return;
    }

    // tenta recuperar da última ordem
    if (saved && saved.url) {
      ensureIframe(saved.url);
      hideSpaLoading();
      return;
    }

    // tenta ler do pinia/vue se existir
    try {
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia = app && app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
      var st = pinia && pinia.state && pinia.state.value;
      var url =
        (st && st.game && (st.game.rechargeUrl || st.game.RechargeUrl)) ||
        (st && st.user && st.user.rechargeUrl) ||
        '';
      // busca em stores
      if (!url && pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          if (url) return;
          try {
            if (store.rechargeUrl) url = store.rechargeUrl;
            if (store.getRechargeUrl) url = store.getRechargeUrl;
          } catch (e) {}
        });
      }
      if (url) {
        savePix(url, '');
        ensureIframe(url);
        return;
      }
    } catch (e) {}

    // sem URL → fallback (não deixa tela branca)
    showFallback();
  }

  function pickPayFromObj(j) {
    if (!j || typeof j !== 'object') return null;
    var d = j.data || j.Data || j;
    if (!d || typeof d !== 'object') return null;
    var pay = d.url || d.Url || d.payUrl || d.PayUrl || d.pay_url || '';
    var oid = d.OrderID || d.orderId || d.order_id || '';
    if (!pay && typeof d === 'string' && /pix-pay/i.test(d)) pay = d;
    if (!pay) return null;
    return { pay: absUrl(pay), oid: oid || '' };
  }

  /** Extrai URL pix-pay mesmo de corpo AES (texto com URL em claro é raro; tenta JSON). */
  function harvestShopOrderBody(text) {
    try {
      var j = JSON.parse(text);
      return pickPayFromObj(j);
    } catch (e) {}
    // fallback: URL absoluta no texto (respostas legíveis / logs)
    try {
      var m = String(text || '').match(
        /https?:\/\/[^\s"'\\]+pix-pay\?order=[A-Za-z0-9_-]+/i,
      );
      if (m) return { pay: m[0], oid: (m[0].match(/order=([^&]+)/) || [])[1] || '' };
    } catch (e2) {}
    return null;
  }

  function onShopOrderHit(pay, oid) {
    if (!pay) return;
    savePix(pay, oid);
    hideSpaLoading();
    if (isRechargeIframe()) {
      setTimeout(function () {
        ensureIframe(pay);
        hideSpaLoading();
      }, 50);
    } else {
      // garante URL pronta quando o SPA navegar
      setTimeout(function () {
        if (isRechargeIframe()) {
          ensureIframe(pay);
          hideSpaLoading();
        }
      }, 400);
    }
  }

  // Intercepta fetch shop/order
  if (typeof window.fetch === 'function' && !window.__ch7PixFetch) {
    window.__ch7PixFetch = 1;
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
                var hit = harvestShopOrderBody(text);
                if (hit) onShopOrderHit(hit.pay, hit.oid);
              })
              .catch(function () {});
          }
        } catch (e) {}
        return res;
      });
    };
  }

  // XHR (axios do SPA — body AES; após decrypt o store já tem URL; aqui é backup)
  if (typeof XMLHttpRequest !== 'undefined' && !window.__ch7PixXhr) {
    window.__ch7PixXhr = 1;
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
            var hit = harvestShopOrderBody(xhr.responseText || '');
            if (hit) onShopOrderHit(hit.pay, hit.oid);
          } catch (e) {}
          // após order, tira loading residual
          setTimeout(hideSpaLoading, 100);
          setTimeout(hideSpaLoading, 800);
        });
      }
      return _send.apply(this, arguments);
    };
  }

  // Poll curto da store (só em #/rechargeIframe, max ~12s) — NÃO setInterval eterno
  if (!window.__ch7PixStoreWatch) {
    window.__ch7PixStoreWatch = 1;
    var storePolls = 0;
    var storeTimer = null;
    function pollStoreOnce() {
      storePolls++;
      if (!isRechargeIframe() || storePolls > 24) {
        if (storeTimer) clearInterval(storeTimer);
        storeTimer = null;
        return;
      }
      try {
        var app =
          document.querySelector('#q-app') &&
          document.querySelector('#q-app').__vue_app__;
        var pinia =
          app &&
          app.config &&
          app.config.globalProperties &&
          app.config.globalProperties.$pinia;
        var url = '';
        if (pinia && pinia._s) {
          pinia._s.forEach(function (store) {
            try {
              if (store.rechargeUrl) url = store.rechargeUrl;
              if (typeof store.getRechargeUrl === 'function') {
                url = store.getRechargeUrl() || url;
              }
            } catch (e) {}
          });
        }
        if (url && /pix-pay/i.test(url)) {
          savePix(absUrl(url), '');
          ensureIframe(absUrl(url));
          hideSpaLoading();
          if (storeTimer) clearInterval(storeTimer);
          storeTimer = null;
        }
      } catch (e) {}
    }
    function startStorePoll() {
      if (!isRechargeIframe()) return;
      storePolls = 0;
      if (storeTimer) clearInterval(storeTimer);
      storeTimer = setInterval(pollStoreOnce, 500);
      pollStoreOnce();
    }
    window.addEventListener('hashchange', startStorePoll);
    if (isRechargeIframe()) startStorePoll();
  }

  var t = null;
  function schedule() {
    if (!isRechargeIframe()) return;
    clearTimeout(t);
    t = setTimeout(function () {
      fixRechargeIframe(false);
    }, 250);
  }

  // ── Confirmação bonita + saldo ao vivo (webhook / poll) ──
  var SUCCESS_ID = 'ch7-deposit-success';
  var STYLE_OK = 'ch7-deposit-success-style';

  function fmtBRL(n) {
    try {
      return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return 'R$ ' + n;
    }
  }

  function ensureSuccessStyle() {
    if (document.getElementById(STYLE_OK)) return;
    var s = document.createElement('style');
    s.id = STYLE_OK;
    s.textContent =
      '#' +
      SUCCESS_ID +
      '{position:fixed;inset:0;z-index:99980;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(8,6,4,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}' +
      '#' +
      SUCCESS_ID +
      ' .panel{max-width:400px;width:100%;text-align:center;border-radius:20px;padding:26px 20px 20px;' +
      'background:linear-gradient(165deg,#2c2114,#16120c);border:1px solid rgba(246,207,135,.38);' +
      'box-shadow:0 24px 60px rgba(0,0,0,.55);animation:ch7sPop .5s cubic-bezier(.16,1,.3,1) both;color:#fff;' +
      'font:500 14px/1.45 system-ui,sans-serif;}' +
      '#' +
      SUCCESS_ID +
      ' .ico{width:78px;height:78px;margin:0 auto 12px;border-radius:50%;' +
      'background:linear-gradient(145deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 8px 28px rgba(34,197,94,.4);font-size:40px;line-height:1;}' +
      '#' +
      SUCCESS_ID +
      ' h2{margin:0 0 8px;color:#f6cf87;font:800 1.2rem/1.25 system-ui,sans-serif;}' +
      '#' +
      SUCCESS_ID +
      ' .amt{margin:10px 0;color:#ffe13c;font:800 1.75rem/1.1 system-ui,sans-serif;}' +
      '#' +
      SUCCESS_ID +
      ' .sub{margin:0 0 8px;color:rgba(255,255,255,.8);}' +
      '#' +
      SUCCESS_ID +
      ' .bal{margin:12px 0 16px;padding:10px;border-radius:12px;color:#7bfe7c;font-weight:700;' +
      'background:rgba(123,254,124,.08);border:1px solid rgba(123,254,124,.22);}' +
      '#' +
      SUCCESS_ID +
      ' button{width:100%;padding:13px;border:0;border-radius:12px;margin-top:8px;font-weight:800;cursor:pointer;}' +
      '#' +
      SUCCESS_ID +
      ' .primary{background:linear-gradient(180deg,#ffe566,#f0b429);color:#1a1208;}' +
      '#' +
      SUCCESS_ID +
      ' .ghost{background:#323749;color:#fff;}' +
      '@keyframes ch7sPop{from{opacity:0;transform:scale(.88) translateY(12px)}to{opacity:1;transform:none}}' +
      '#ch7-cf{pointer-events:none;position:fixed;inset:0;z-index:99981;overflow:hidden}' +
      '#ch7-cf i{position:absolute;top:-10px;width:8px;height:12px;border-radius:2px;' +
      'animation:ch7cf linear forwards}' +
      '@keyframes ch7cf{to{transform:translateY(110vh) rotate(720deg);opacity:.15}}';
    document.head.appendChild(s);
  }

  function confettiBurst() {
    var host = document.getElementById('ch7-cf');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ch7-cf';
      document.body.appendChild(host);
    }
    host.innerHTML = '';
    var colors = ['#f6cf87', '#ffe13c', '#f0b429', '#7bfe7c', '#60a5fa', '#f472b6', '#fff'];
    for (var i = 0; i < 42; i++) {
      var d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDuration = 1.5 + Math.random() * 1.8 + 's';
      d.style.animationDelay = Math.random() * 0.3 + 's';
      d.style.width = 6 + Math.random() * 6 + 'px';
      d.style.height = 8 + Math.random() * 10 + 'px';
      host.appendChild(d);
    }
    setTimeout(function () {
      try {
        host.remove();
      } catch (e) {}
    }, 3200);
  }

  function patchWalletUi(balanceReais, bonusReais) {
    var cashCents = Math.round(Number(balanceReais || 0) * 100);
    var bonusCents = Math.round(Number(bonusReais || 0) * 100);
    try {
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia = app && app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (typeof store.setWalletData === 'function') {
              store.setWalletData({
                Cash: cashCents,
                Bonus: bonusCents,
                WithdrawCash: cashCents,
                WithdrawBonus: 0,
                BonusResource: 0,
                MiniWithdrawAmount: 0,
              });
            }
            if (typeof store.setBalance === 'function') {
              store.setBalance({
                cash: cashCents,
                bonus: bonusCents,
                Balance: cashCents,
              });
            }
            if (typeof store.fetchWalletInfo === 'function') {
              store.fetchWalletInfo();
            }
            if (typeof store.updateUserAllInfo === 'function') {
              store.updateUserAllInfo();
            }
          } catch (e) {}
        });
      }
    } catch (e) {}

    // fallback visual: textos de saldo no header
    try {
      var label = fmtBRL(balanceReais);
      document.querySelectorAll('.amountColor, .amount-container .amount, [class*="wallet"] .amount').forEach(
        function (el) {
          var t = (el.textContent || '').trim();
          if (/^R\$\s*[\d.,]+$/.test(t) || /[\d.,]+/.test(t)) {
            el.textContent = label.replace('R$', '').trim().length
              ? label
              : el.textContent;
            // prefer keep structure
            if (el.classList.contains('amountColor')) el.textContent = label.replace(/^R\$\s*/, '');
          }
        },
      );
    } catch (e) {}
  }

  function showDepositSuccess(payload) {
    ensureSuccessStyle();
    confettiBurst();
    var amt = Number(payload && payload.amountReais != null ? payload.amountReais : 0);
    var bal =
      payload && payload.balanceReais != null ? Number(payload.balanceReais) : null;
    var bonus =
      payload && payload.bonusReais != null ? Number(payload.bonusReais) : 0;

    if (bal != null) patchWalletUi(bal, 0);

    // tenta refresh real via SPA (AES) — atualiza header sem F5
    setTimeout(function () {
      try {
        var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
        var pinia = app && app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
        if (pinia && pinia._s) {
          pinia._s.forEach(function (store) {
            try {
              if (typeof store.fetchWalletInfo === 'function') store.fetchWalletInfo();
              if (typeof store.updateUserAllInfo === 'function') store.updateUserAllInfo();
            } catch (e) {}
          });
        }
      } catch (e) {}
    }, 200);

    var existing = document.getElementById(SUCCESS_ID);
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = SUCCESS_ID;
    el.innerHTML =
      '<div class="panel" role="dialog" aria-label="Depósito confirmado">' +
      '<div class="ico" aria-hidden="true">✓</div>' +
      '<h2>Obrigado por depositar!</h2>' +
      '<p class="sub">Seu depósito de</p>' +
      '<div class="amt">' +
      fmtBRL(amt) +
      '</div>' +
      '<p class="sub">foi confirmado com sucesso.</p>' +
      '<p class="sub"><b>Seu saldo já foi atualizado na carteira!</b></p>' +
      (bal != null
        ? '<div class="bal">Saldo atual: ' + fmtBRL(bal) + '</div>'
        : '') +
      (bonus > 0 ? '<p class="sub">Bônus creditado: ' + fmtBRL(bonus) + '</p>' : '') +
      '<button type="button" class="primary" id="ch7-ds-play">Continuar jogando</button>' +
      '<button type="button" class="ghost" id="ch7-ds-close">Fechar</button>' +
      '</div>';
    document.body.appendChild(el);

    function goHome() {
      try {
        el.remove();
      } catch (e) {}
      location.hash = '#/';
    }
    var b1 = document.getElementById('ch7-ds-play');
    if (b1) b1.onclick = goHome;
    var b2 = document.getElementById('ch7-ds-close');
    if (b2)
      b2.onclick = function () {
        try {
          el.remove();
        } catch (e) {}
      };
  }

  window.addEventListener('message', function (ev) {
    try {
      var d = ev && ev.data;
      if (!d) return;
      if (d.type === 'ch7-pix-ready') {
        hideSpaLoading();
        return;
      }
      if (d.type !== 'ch7-pix-paid') return;
      showDepositSuccess(d);
    } catch (e) {}
  });

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  setTimeout(schedule, 500);
  setTimeout(schedule, 1500);

  // MutationObserver só em rota PIX; debounce longo (evita freeze com SPA)
  if (typeof MutationObserver !== 'undefined' && !window.__ch7PixMo) {
    window.__ch7PixMo = 1;
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
  };
})();
