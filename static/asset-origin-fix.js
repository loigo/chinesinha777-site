/**
 * Asset origin fix + anti Tracking Prevention (Cloudflare CDN).
 * - Reescreve chinesinha777.bet/static → /static
 * - Bloqueia Cloudflare Insights / beacon (storage third-party)
 * - Redireciona crypto-js/qrcode de cdnjs.cloudflare.com → /static/vendor/*
 */
(function () {
  if (window.__ch7AssetOriginFixV2) return;
  window.__ch7AssetOriginFixV2 = 1;
  window.__ch7AssetOriginFix = 1;

  var RE = /^https?:\/\/(?:www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/i;
  var RE2 = /^\/\/(?:www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/i;

  function isLocalHost() {
    try {
      var h = String(location.hostname || '');
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    } catch (e) {
      return false;
    }
  }

  function isCfTracking(u) {
    var s = String(u || '');
    return (
      /static\.cloudflareinsights\.com/i.test(s) ||
      /cloudflareinsights/i.test(s) ||
      /\/cdn-cgi\/rum/i.test(s) ||
      /\/beacon\.min\.js/i.test(s) ||
      /cloudflare\.com\/.*beacon/i.test(s)
    );
  }

  function fix(u) {
    var s = String(u == null ? '' : u);
    if (!s) return s;

    // bloqueia analytics CF (Tracking Prevention / storage)
    if (isCfTracking(s)) return 'about:blank';

    // crypto-js / libs Cloudflare CDN → same-origin
    if (/cdnjs\.cloudflare\.com\/ajax\/libs\/crypto-js\//i.test(s)) {
      return '/static/vendor/crypto-js.min.js';
    }
    if (/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\//i.test(s)) {
      return '/static/qrcode.min.js';
    }
    if (/cdn\.jsdelivr\.net\/npm\/qrcode@/i.test(s) || /unpkg\.com\/qrcode@/i.test(s)) {
      return '/static/vendor/qrcode.min.js';
    }

    if (RE.test(s)) return s.replace(RE, '$1');
    if (RE2.test(s)) return s.replace(RE2, '$1');
    if (/okx007\.com/i.test(s) && /\/static\//.test(s)) {
      var m = s.match(/(\/static\/.+)$/);
      if (m) return m[1];
    }
    return s;
  }

  // Em local: não carregar GTM/pixel de terceiros que usam storage de tracking
  // (já existe guard no index; aqui reforça insights CF)
  try {
    var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (desc && desc.set) {
      Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get: function () {
          return desc.get.call(this);
        },
        set: function (v) {
          var n = fix(v);
          if (n === 'about:blank' || isCfTracking(v)) {
            // drop script
            return;
          }
          return desc.set.call(this, n);
        },
      });
    }
  } catch (e) {}

  try {
    var descImg = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (descImg && descImg.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get: function () {
          return descImg.get.call(this);
        },
        set: function (v) {
          return descImg.set.call(this, fix(v));
        },
      });
    }
  } catch (e) {}

  try {
    var sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      var n = String(name || '').toLowerCase();
      if (n === 'src' || n === 'href') {
        var fv = fix(value);
        if (fv === 'about:blank' || isCfTracking(value)) {
          if (this.tagName === 'SCRIPT') return;
          value = fv === 'about:blank' ? '' : fv;
        } else {
          value = fv;
        }
      }
      return sa.call(this, name, value);
    };
  } catch (e) {}

  // createElement('script') guard
  try {
    var ce = document.createElement.bind(document);
    document.createElement = function (tag) {
      var el = ce(tag);
      if (String(tag).toLowerCase() === 'script') {
        try {
          var d = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
          // already patched above
        } catch (e2) {}
      }
      return el;
    };
  } catch (e) {}

  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (!n || n.nodeType !== 1) continue;
          if (n.tagName === 'SCRIPT') {
            var src = n.getAttribute('src') || n.src || '';
            if (isCfTracking(src)) {
              try {
                n.removeAttribute('src');
                n.type = 'text/plain';
                n.remove();
              } catch (e3) {}
              continue;
            }
            var nf = fix(src);
            if (nf && nf !== src && nf !== 'about:blank') {
              try {
                n.setAttribute('src', nf);
              } catch (e4) {}
            }
          } else if (n.tagName === 'IMG') {
            var s = n.getAttribute('src') || '';
            var f = fix(s);
            if (f !== s) n.setAttribute('src', f);
          } else if (n.querySelectorAll) {
            var list = n.querySelectorAll('img[src*="chinesinha777.bet"], script[src*="cloudflare"]');
            for (var k = 0; k < list.length; k++) {
              var el = list[k];
              var s2 = el.getAttribute('src') || '';
              if (el.tagName === 'SCRIPT' && isCfTracking(s2)) {
                try {
                  el.remove();
                } catch (e5) {}
                continue;
              }
              var f2 = fix(s2);
              if (f2 !== s2 && f2 !== 'about:blank') el.setAttribute('src', f2);
            }
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
