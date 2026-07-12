/**
 * Iframes de jogos + PIX.
 *
 * Erros típicos no console do shell PG Soft:
 *  - formatarURL → Cannot read properties of null (reading '1')
 *    (Meta Pixel sendObjectBeacon com URL que o shell não parseia)
 *  - AudioContext was not allowed to start
 *  - Allow attribute will take precedence over allowfullscreen
 *
 * Estratégia:
 *  1) remove sandbox restrito em jogos
 *  2) allow=autoplay sem duplicar allowfullscreen
 *  3) reescreve src do jogo para /game-shell?u=... (proxy same-origin com patch)
 *  4) injeta patch se same-origin
 */
(function () {
  'use strict';

  var SANDBOX =
    'allow-scripts allow-same-origin allow-forms allow-popups ' +
    'allow-popups-to-escape-sandbox allow-modals allow-pointer-lock ' +
    'allow-top-navigation-by-user-activation allow-downloads';

  // NÃO incluir allowfullscreen junto com fullscreen no allow (Chrome warning)
  var ALLOW =
    'autoplay *; fullscreen *; payment *; clipboard-write *; ' +
    'accelerometer *; gyroscope *; encrypted-media *';

  // Patch defensivo no shell do jogo (same-origin). Não quebra beacon/CF analytics.
  var XHR_SAFE_PATCH =
    '(function(){try{' +
    'if(window.__ch7XhrSafe)return;window.__ch7XhrSafe=1;' +
    'function safeStr(u){try{if(u==null)return"";if(typeof u==="string")return u;if(typeof URL!=="undefined"&&u instanceof URL)return u.href;return String(u);}catch(e){return"";}}' +
    'function wrapFormatar(fn){return function(u){try{var s=safeStr(u);if(!s)return s;var r=fn.call(this,s);return r==null?s:r;}catch(e){return safeStr(u);}};}' +
    'try{' +
    'var _f=typeof window.formatarURL==="function"?window.formatarURL:null;' +
    'window.formatarURL=function(u){try{if(!_f)return safeStr(u);var s=safeStr(u);if(!s)return s;if(/cloudflareinsights|google|facebook|hotjar/i.test(s))return s;var r=_f.call(this,s);return r==null?s:r;}catch(e){return safeStr(u);}};' +
    'Object.defineProperty(window,"formatarURL",{configurable:true,enumerable:true,' +
    'get:function(){return window.__ch7Fmt||function(u){return safeStr(u);};},' +
    'set:function(fn){window.__ch7Fmt=typeof fn==="function"?wrapFormatar(fn):function(u){return safeStr(u);};}});' +
    'if(_f)window.__ch7Fmt=wrapFormatar(_f);' +
    '}catch(e){}' +
    'var _open=XMLHttpRequest.prototype.open;' +
    'XMLHttpRequest.prototype.open=function(method,url){' +
    'try{if(url==null)url="";else if(typeof url!=="string")url=safeStr(url);' +
    'return _open.call(this,method,url,arguments.length>2?arguments[2]:true);}' +
    'catch(err){try{return _open.call(this,method,"",true);}catch(e2){}}' +
    '};' +
    '}catch(e){}})();';

  function isPixSrc(src) {
    return /pix-pay|digitopay|\/pix\//i.test(String(src || ''));
  }

  function isGameSrc(src) {
    var s = String(src || '');
    if (!s || s === 'about:blank') return false;
    if (isPixSrc(s)) return false;
    if (/\/game-shell\b/i.test(s)) return true;
    return /igamewin|pgsoft|pragmatic|jili|cq9|evolution|spribe|royalgam|game_launch|[?&]ot=|[?&]ops=/i.test(
      s,
    );
  }

  function isPixIframe(el) {
    try {
      var src = (el && el.getAttribute && el.getAttribute('src')) || '';
      if (isPixSrc(src)) return true;
      if (el && el.classList && el.classList.contains('iframe2') && !isGameSrc(src)) return true;
    } catch (e) {}
    return false;
  }

  // Proxy game-shell: local usa same-origin /game-shell; prod usa Edge Supabase
  // (permite injetar tradução de popup de vitória + formatarURL).
  var EDGE_GAME_SHELL =
    'https://csdzxeohpgnvvewnwxod.supabase.co/functions/v1/game-shell';

  function isStaticProdHost() {
    var h = location.hostname || '';
    return h === 'chinesinha777.bet' || h === 'www.chinesinha777.bet' || /\.github\.io$/i.test(h);
  }

  function needsProxy(src) {
    var s = String(src || '');
    if (!s || /\/game-shell\b/i.test(s) || /functions\/v1\/game-shell/i.test(s)) return false;
    if (isPixSrc(s)) return false;
    try {
      var u = new URL(s, location.href);
      if (u.origin === location.origin && !isGameSrc(s)) return false;
      return isGameSrc(s);
    } catch (e) {
      return false;
    }
  }

  function toProxyUrl(src) {
    try {
      var abs = new URL(src, location.href).href;
      // local: front server.mjs
      if (
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.port === '5177'
      ) {
        return location.origin + '/game-shell?u=' + encodeURIComponent(abs);
      }
      // produção estática → Edge game-shell (tradução + patches)
      if (isStaticProdHost()) {
        return EDGE_GAME_SHELL + '?u=' + encodeURIComponent(abs);
      }
      return location.origin + '/game-shell?u=' + encodeURIComponent(abs);
    } catch (e) {
      return src;
    }
  }

  function injectXhrSafe(winDoc) {
    try {
      if (!winDoc || !winDoc.documentElement) return;
      if (winDoc.documentElement.dataset && winDoc.documentElement.dataset.ch7Xhr === '1') return;
      if (winDoc.documentElement.dataset) winDoc.documentElement.dataset.ch7Xhr = '1';
      var s = winDoc.createElement('script');
      s.textContent = XHR_SAFE_PATCH;
      (winDoc.head || winDoc.documentElement).appendChild(s);
      try {
        s.remove();
      } catch (e) {}
    } catch (e) {}
  }

  /** notranslate + script de vitória pt-BR no iframe (same-origin / game-shell) */
  function injectWinPt(winDoc) {
    try {
      if (!winDoc || !winDoc.documentElement) return;
      try {
        winDoc.documentElement.setAttribute('lang', 'pt-BR');
        winDoc.documentElement.setAttribute('translate', 'no');
        winDoc.documentElement.classList.add('notranslate');
        if (winDoc.body) {
          winDoc.body.setAttribute('translate', 'no');
          winDoc.body.classList.add('notranslate');
        }
      } catch (e0) {}
      if (winDoc.documentElement.dataset && winDoc.documentElement.dataset.ch7WinPtScript === '1') {
        try {
          if (typeof window.__ch7ScanWinPopupPt === 'function') window.__ch7ScanWinPopupPt();
        } catch (e1) {}
        return;
      }
      if (winDoc.documentElement.dataset) winDoc.documentElement.dataset.ch7WinPtScript = '1';
      var s = winDoc.createElement('script');
      s.src = '/static/win-popup-pt-inject.js?v=winpt4';
      s.defer = true;
      (winDoc.head || winDoc.documentElement).appendChild(s);
    } catch (e) {}
  }

  function tryPatchIframe(el) {
    try {
      var doc = el.contentDocument;
      if (doc) {
        injectXhrSafe(doc);
        injectWinPt(doc);
        setTimeout(function () {
          injectXhrSafe(doc);
          injectWinPt(doc);
        }, 50);
        setTimeout(function () {
          injectXhrSafe(doc);
          injectWinPt(doc);
        }, 300);
        setTimeout(function () {
          injectWinPt(doc);
          try {
            if (typeof window.__ch7ScanWinPopupPt === 'function') window.__ch7ScanWinPopupPt();
          } catch (e2) {}
        }, 1000);
      }
    } catch (e) {}
  }

  var applying = false;

  function setAttrIfChanged(el, name, value) {
    if ((el.getAttribute(name) || '') === value) return false;
    el.setAttribute(name, value);
    return true;
  }

  function applyAttrs(el) {
    if (!el || el.tagName !== 'IFRAME' || el.__ch7Applying) return;
    // já processado e estável (exceto src novo de jogo)
    try {
      var src = el.getAttribute('src') || '';

      // reescreve jogos externos → proxy same-origin (1x)
      if (needsProxy(src) && !el.dataset.ch7Proxied) {
        el.dataset.ch7Proxied = '1';
        el.__ch7Applying = 1;
        el.setAttribute('src', toProxyUrl(src));
        el.__ch7Applying = 0;
        src = el.getAttribute('src') || src;
      }

      var pix = isPixIframe(el) || isPixSrc(src);
      var game = isGameSrc(src);
      var sig = (pix ? 'p' : game ? 'g' : 'o') + '|' + src.slice(0, 80);
      if (el.dataset.ch7Sig === sig) return;
      el.dataset.ch7Sig = sig;
      el.__ch7Applying = 1;

      if (pix) {
        setAttrIfChanged(
          el,
          'sandbox',
          'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
        );
        setAttrIfChanged(el, 'allow', 'payment *; clipboard-write *');
        try {
          el.removeAttribute('allowfullscreen');
          el.removeAttribute('webkitallowfullscreen');
          el.removeAttribute('mozallowfullscreen');
        } catch (e) {}
        el.style.minHeight = '70vh';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.background = '#171512';
        el.__ch7Applying = 0;
        return;
      }

      if (game) {
        if (el.hasAttribute('sandbox')) {
          try {
            el.removeAttribute('sandbox');
          } catch (e) {}
        }
        setAttrIfChanged(el, 'allow', ALLOW);
        try {
          el.removeAttribute('allowfullscreen');
          el.removeAttribute('webkitallowfullscreen');
          el.removeAttribute('mozallowfullscreen');
        } catch (e) {}
        if (!el.getAttribute('referrerpolicy')) {
          el.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        }
        if (!el.__ch7LoadHook) {
          el.__ch7LoadHook = 1;
          el.addEventListener('load', function () {
            tryPatchIframe(el);
          });
        }
        tryPatchIframe(el);
        el.__ch7Applying = 0;
        return;
      }

      setAttrIfChanged(el, 'allow', ALLOW);
      try {
        el.removeAttribute('allowfullscreen');
      } catch (e) {}
      el.__ch7Applying = 0;
    } catch (e) {
      el.__ch7Applying = 0;
    }
  }

  // Intercepta createElement('iframe')
  try {
    var _create = Document.prototype.createElement;
    Document.prototype.createElement = function (tagName, options) {
      var el = _create.call(this, tagName, options);
      try {
        if (String(tagName || '').toLowerCase() === 'iframe') {
          el.setAttribute('allow', ALLOW);
          // não setar allowfullscreen (conflita com allow)
        }
      } catch (e) {}
      return el;
    };
  } catch (e) {}

  // Bloqueia sandbox restrito em jogos
  try {
    var _setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      var n = String(name).toLowerCase();
      if (this.tagName === 'IFRAME') {
        if (n === 'src') {
          var v = String(value || '');
          if (needsProxy(v)) {
            this.dataset.ch7Proxied = '1';
            return _setAttr.call(this, name, toProxyUrl(v));
          }
        }
        if (n === 'sandbox') {
          var src = this.getAttribute('src') || '';
          if (isGameSrc(src) || isPixSrc(src)) {
            // jogos: sem sandbox; PIX: permissivo
            if (isGameSrc(src)) {
              try {
                this.removeAttribute('sandbox');
              } catch (e2) {}
              return;
            }
            return _setAttr.call(
              this,
              name,
              'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
            );
          }
        }
        if (n === 'allowfullscreen') {
          // ignora — usamos allow="fullscreen *"
          return;
        }
      }
      return _setAttr.call(this, name, value);
    };
  } catch (e) {}

  function scan(root) {
    try {
      var list = (root || document).querySelectorAll('iframe');
      for (var i = 0; i < list.length; i++) applyAttrs(list[i]);
    } catch (e) {}
  }

  function boot() {
    if (window.__ch7GameIframeBoot) return;
    window.__ch7GameIframeBoot = 1;
    scan(document);
    if (typeof MutationObserver === 'undefined') return;
    var mo = new MutationObserver(function (mutations) {
      // processa síncrono (records expiram após o callback)
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.target && m.target.tagName === 'IFRAME') {
          if (m.target.__ch7Applying) continue;
          applyAttrs(m.target);
          continue;
        }
        var nodes = m.addedNodes;
        if (!nodes) continue;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (!n || n.nodeType !== 1) continue;
          if (n.tagName === 'IFRAME') applyAttrs(n);
          else if (n.querySelectorAll) {
            var list = n.querySelectorAll('iframe');
            for (var k = 0; k < list.length; k++) applyAttrs(list[k]);
          }
        }
      }
    });
    // só childList + src (sandbox/allow que NÓS setamos NÃO re-disparam trabalho)
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
