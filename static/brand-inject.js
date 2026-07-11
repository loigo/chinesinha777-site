/**
 * Logo chinesinha777 — header/footer (v=ch7-22 freeze-safe).
 * SEM MutationObserver em attributes (causava loop set src → mutation → set src).
 * Debounce + flag reentrante + interval raro.
 */
(function () {
  'use strict';
  if (window.__CH7_BRAND_INIT_V26__) return;
  window.__CH7_BRAND_INIT_V26__ = 1;
  window.__CH7_BRAND_INIT_V25__ = 1;
  window.__CH7_BRAND_INIT__ = 1;

  var V = 'ch7-22';
  var LOGO = '/static/brand/logo-horizontal.png?v=' + V;
  var LOGO_SM = '/static/brand/logo-horizontal-sm.png?v=' + V;
  var LOGO_FOOTER = '/static/brand/logo-footer.png?v=' + V;
  var LOGO_FOOTER_FALLBACK = '/static/brand/logo-horizontal.png?v=' + V;
  var applying = false;
  var schedT = null;
  var lastRun = 0;

  try {
    fetch('/static/brand/version.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (m) {
        if (!m || !m.version) return;
        V = String(m.version);
        LOGO = (m.logos && m.logos.header) || '/static/brand/logo-horizontal.png?v=' + V;
        LOGO_SM = (m.logos && m.logos.mobile) || '/static/brand/logo-horizontal-sm.png?v=' + V;
        LOGO_FOOTER = (m.logos && m.logos.footer) || '/static/brand/logo-footer.png?v=' + V;
        schedule(0);
      })
      .catch(function () {});
  } catch (e) {}

  function headerSrc() {
    return window.innerWidth <= 420 ? LOGO_SM : LOGO;
  }

  function isGameArea(el) {
    return !!(
      el &&
      el.closest &&
      el.closest(
        '.swiper-slide, .q-carousel, .game-list, .game-item, [class*="GameImg"], [class*="game-img"], .hot-game',
      )
    );
  }

  function setSrcOnce(img, src) {
    if (!img || !src) return;
    var cur = img.getAttribute('src') || '';
    if (cur === src) return;
    img.setAttribute('src', src);
  }

  function applyHeaderStyles(host, img) {
    if (host) {
      host.style.setProperty('width', '1.4rem', 'important');
      host.style.setProperty('max-width', '1.4rem', 'important');
      host.style.setProperty('min-height', '0.31rem', 'important');
      host.style.setProperty('height', 'auto', 'important');
      host.style.setProperty('padding', '0', 'important');
      host.style.setProperty('margin-left', '0.1rem', 'important');
      host.style.setProperty('margin-right', '0', 'important');
      host.style.setProperty('background', 'transparent', 'important');
      host.style.setProperty('background-image', 'none', 'important');
      host.style.setProperty('overflow', 'hidden', 'important');
      host.style.setProperty('display', 'inline-flex', 'important');
      host.style.setProperty('align-items', 'center', 'important');
      host.style.setProperty('justify-content', 'flex-start', 'important');
      host.style.setProperty('flex', '0 0 auto', 'important');
      host.style.setProperty('flex-shrink', '0', 'important');
    }
    if (img) {
      if (img.getAttribute('data-ch7-logo') !== '1') img.setAttribute('data-ch7-logo', '1');
      img.alt = 'chinesinha777';
      img.decoding = 'async';
      img.loading = 'eager';
      img.style.setProperty('display', 'block', 'important');
      img.style.setProperty('visibility', 'visible', 'important');
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('width', '100%', 'important');
      img.style.setProperty('max-width', '1.4rem', 'important');
      img.style.setProperty('height', 'auto', 'important');
      img.style.setProperty('max-height', '0.36rem', 'important');
      img.style.setProperty('object-fit', 'contain', 'important');
      img.style.setProperty('object-position', 'left center', 'important');
      img.style.setProperty('position', 'relative', 'important');
      img.style.setProperty('z-index', '5', 'important');
      img.style.setProperty('margin', '0', 'important');
      img.style.setProperty('padding', '0', 'important');
      img.style.setProperty('flex-shrink', '0', 'important');
    }
  }

  function applyFooterStyles(img) {
    if (img.getAttribute('data-ch7-logo') !== '1') img.setAttribute('data-ch7-logo', '1');
    img.alt = 'chinesinha777';
    img.style.setProperty('display', 'block', 'important');
    img.style.setProperty('visibility', 'visible', 'important');
    img.style.setProperty('opacity', '1', 'important');
    img.style.setProperty('width', '1.42rem', 'important');
    img.style.setProperty('max-width', '1.42rem', 'important');
    img.style.setProperty('height', 'auto', 'important');
    img.style.setProperty('max-height', '0.36rem', 'important');
    img.style.setProperty('object-fit', 'contain', 'important');
    img.style.setProperty('margin-right', '0.5rem', 'important');
  }

  function fixHeader() {
    var src = headerSrc();
    document.querySelectorAll('.header-content').forEach(function (hc) {
      var lr = hc.querySelector('.loginRegister');
      if (lr) lr.style.setProperty('flex-shrink', '0', 'important');

      var hosts = hc.querySelectorAll('.logoBtn, .logo-img');
      if (!hosts.length) {
        hc.querySelectorAll('img').forEach(function (img) {
          var s = (img.getAttribute('src') || '').toLowerCase();
          if (/logo1|\/logo\//.test(s) && !isGameArea(img)) {
            setSrcOnce(img, src);
            applyHeaderStyles(img.parentElement, img);
          }
        });
        return;
      }

      hosts.forEach(function (host) {
        host.querySelectorAll('.q-img, img').forEach(function (el) {
          if (el.getAttribute('data-ch7-logo') === '1') return;
          if (el.__ch7Hidden) return;
          el.__ch7Hidden = 1;
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('width', '0', 'important');
          el.style.setProperty('height', '0', 'important');
          el.style.setProperty('position', 'absolute', 'important');
        });

        var img = host.querySelector('img[data-ch7-logo="1"]');
        if (!img) {
          img = document.createElement('img');
          img.setAttribute('data-ch7-logo', '1');
          host.appendChild(img);
        }
        setSrcOnce(img, src);
        applyHeaderStyles(host, img);
      });
    });
  }

  function fixFooter() {
    var src = LOGO_FOOTER;
    function wire(img) {
      if (!img || isGameArea(img)) return;
      if (
        img.getAttribute('src') !== src &&
        img.getAttribute('src') !== LOGO_FOOTER_FALLBACK
      ) {
        setSrcOnce(img, src);
      }
      img.onerror = function () {
        img.onerror = null;
        setSrcOnce(img, LOGO_FOOTER_FALLBACK);
      };
      try {
        if (img.getAttribute('srcset')) {
          img.removeAttribute('srcset');
          img.srcset = '';
        }
      } catch (e) {}
      applyFooterStyles(img);
    }
    document.querySelectorAll('img.logImg, .footerImgContainer img.logImg').forEach(wire);
    document.querySelectorAll('.footerImgContainer img').forEach(function (img) {
      if (isGameArea(img) || img.getAttribute('data-ch7-logo') === '1') return;
      var s = (img.getAttribute('src') || img.currentSrc || '').toLowerCase();
      if (/logo1|\/logo\/|okx007.*logo|logo-footer|logo-horizontal/i.test(s) || !s) {
        wire(img);
      }
    });
  }

  /** Logos do CDN rioslots (okx007/res/rioslots777/logo/*) → brand local */
  function rewriteRioslotsLogoUrl(v) {
    var s = String(v || '');
    if (!s) return s;
    // domínio original — nunca carregar no player
    if (/rioslots777\.com/i.test(s) && /logo/i.test(s)) return LOGO;
    // path de logo no CDN do tema original
    if (/okx007\.com\/res\/rioslots777\/logo\//i.test(s)) {
      if (/logo1|logo-horizontal|logo\.png/i.test(s)) return LOGO;
      if (/logo-footer|footer/i.test(s)) return LOGO_FOOTER;
      return LOGO;
    }
    if (/okx007\.com\/res\/[^/]+\/logo\/logo1/i.test(s)) return LOGO;
    return s;
  }

  /** Reescreve https://chinesinha777.bet/static/... → /static/... (anti timeout quando prod offline) */
  function fixSelfHostAssetUrls(root) {
    try {
      var base = root || document;
      var re = /^https?:\/\/(www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/i;
      base.querySelectorAll &&
        base.querySelectorAll('img[src], source[src], video[src], image[href], a[href]').forEach(function (el) {
          var attr = el.hasAttribute('href') && el.tagName === 'A' ? 'href' : el.hasAttribute('href') && !el.hasAttribute('src') ? 'href' : 'src';
          if (el.tagName === 'A') attr = 'href';
          else if (el.hasAttribute('src')) attr = 'src';
          else if (el.hasAttribute('href')) attr = 'href';
          else return;
          var v = el.getAttribute(attr) || '';
          // bloqueia navegação pro domínio original
          if (attr === 'href' && /rioslots777\.com/i.test(v)) {
            try {
              var u = new URL(v, location.href);
              el.setAttribute('href', location.origin + (u.hash || '/#/'));
            } catch (e1) {
              el.setAttribute('href', location.origin + '/#/');
            }
            return;
          }
          var logoFixed = rewriteRioslotsLogoUrl(v);
          if (logoFixed !== v) {
            el.setAttribute(attr, logoFixed);
            return;
          }
          if (re.test(v)) {
            el.setAttribute(attr, v.replace(re, '$2'));
          }
        });
      // CSS backgrounds inline raros
      base.querySelectorAll &&
        base.querySelectorAll('[style*="chinesinha777.bet"], [style*="rioslots777"]').forEach(function (el) {
          var s = el.getAttribute('style') || '';
          s = s.replace(/https?:\/\/(www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/gi, '$2');
          s = s.replace(
            /https?:\/\/(www\.)?okx007\.com\/res\/rioslots777\/logo\/[^)'"\s]+/gi,
            LOGO,
          );
          el.setAttribute('style', s);
        });
    } catch (e) {}
  }

  function runAll() {
    if (applying) return;
    var now = Date.now();
    if (now - lastRun < 120) return;
    lastRun = now;
    applying = true;
    try {
      fixSelfHostAssetUrls(document);
      fixHeader();
      fixFooter();
    } catch (e) {
      /* ignore */
    } finally {
      applying = false;
    }
  }

  function schedule(ms) {
    clearTimeout(schedT);
    schedT = setTimeout(runAll, ms == null ? 200 : ms);
  }

  runAll();

  // SEM MutationObserver global (causava loop com Vue re-render)
  // Só boot pontual + resize
  [100, 500, 1500, 4000].forEach(function (ms) {
    setTimeout(runAll, ms);
  });

  var resizeT = null;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(runAll, 200);
    },
    { passive: true },
  );

  window.__CH7_BRAND__ = { LOGO: LOGO, LOGO_FOOTER: LOGO_FOOTER, fix: runAll, v: V };
})();
