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

  var XHR_SAFE_PATCH =
    '(function(){try{' +
    'if(window.__ch7XhrSafe)return;window.__ch7XhrSafe=1;' +
    'function wrapFormatar(fn){return function(u){try{var r=fn(u);return r==null?u:r;}catch(e){return u;}};}' +
    'try{' +
    'var _desc=Object.getOwnPropertyDescriptor(window,"formatarURL");' +
    'if(!_desc||_desc.configurable){' +
    'var _f=typeof formatarURL==="function"?formatarURL:null;' +
    'Object.defineProperty(window,"formatarURL",{configurable:true,enumerable:true,' +
    'get:function(){return _f?wrapFormatar(_f):function(u){return u;};},' +
    'set:function(fn){_f=typeof fn==="function"?fn:null;}});' +
    '}' +
    '}catch(e){}' +
    'var _open=XMLHttpRequest.prototype.open;' +
    'XMLHttpRequest.prototype.open=function(method,url){' +
    'try{return _open.apply(this,arguments);}' +
    'catch(err){try{return _open.call(this,method,url==null?"":String(url),true);}catch(e2){}}' +
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

  function needsProxy(src) {
    var s = String(src || '');
    if (!s || /\/game-shell\b/i.test(s)) return false;
    if (isPixSrc(s)) return false;
    try {
      var u = new URL(s, location.href);
      if (u.origin === location.origin) return false;
      return isGameSrc(s);
    } catch (e) {
      return false;
    }
  }

  function toProxyUrl(src) {
    try {
      var abs = new URL(src, location.href).href;
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

  function tryPatchIframe(el) {
    try {
      var doc = el.contentDocument;
      if (doc) {
        injectXhrSafe(doc);
        setTimeout(function () {
          injectXhrSafe(doc);
        }, 50);
        setTimeout(function () {
          injectXhrSafe(doc);
        }, 300);
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
