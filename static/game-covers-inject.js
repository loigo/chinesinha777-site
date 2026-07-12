/**
 * Capas de jogos — v4
 *
 * Causa: SPA (GameImg) faz data-src = ASSETS_BASE + Icon quando Icon NÃO é http(s).
 * ASSETS_BASE = https://www.okx007.com/res/banana_man
 * Icon local /static/games-orig/X.png → CDN 404.
 *
 * Fix: reescrever data-src/src para same-origin absoluto ANTES do browser carregar.
 * v=4 — hooks setAttribute + src; rewrite banana_man/static/games-orig.
 */
(function () {
  'use strict';
  if (window.__ch7GameCoversV4) return;
  window.__ch7GameCoversV4 = 1;
  window.__ch7GameCoversV3 = 1;
  window.__ch7GameCoversV2 = 1;
  window.__ch7GameCoversV1 = 1;

  var STYLE_ID = 'ch7-game-covers-v4';
  var ORIGIN = location.origin || '';

  function fileName(path) {
    var s = String(path || '');
    var i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(i + 1) : s;
  }

  /**
   * Converte URL de capa para same-origin absoluto /static/games-orig/FILE
   * (http(s) same-origin → SPA não prefixa banana_man)
   */
  function toLocalCover(url) {
    var s = String(url || '').trim();
    if (!s) return s;

    // CDN errado: banana_man + games-orig (404)
    if (/banana_man/i.test(s) && /games-orig/i.test(s)) {
      return ORIGIN + '/static/games-orig/' + fileName(s);
    }
    if (/okx007\.com/i.test(s) && /games-orig/i.test(s)) {
      return ORIGIN + '/static/games-orig/' + fileName(s);
    }

    // Já same-origin absoluto com games-orig
    try {
      if (/^https?:\/\//i.test(s)) {
        var u = new URL(s);
        if (/\/static\/games-orig\//i.test(u.pathname)) {
          if (u.origin === ORIGIN) return s;
          return ORIGIN + u.pathname;
        }
        // externo legítimo (não games-orig) — mantém
        return s;
      }
    } catch (e0) {}

    // Path relativo /static/games-orig/...
    if (/\/static\/games-orig\//i.test(s) || /^static\/games-orig\//i.test(s)) {
      var p = s.charAt(0) === '/' ? s : '/' + s;
      // normaliza se faltar /static
      if (!/^\/static\//i.test(p)) p = '/static/games-orig/' + fileName(p);
      return ORIGIN + p.replace(/\/{2,}/g, '/').replace(':/', '://');
    }

    // só filename g_0_*.png / game_*.png
    if (/^(g_0_|game_)/i.test(s)) {
      return ORIGIN + '/static/games-orig/' + s;
    }

    // path /games/... no CDN original funciona — opcional reescrever se local existir
    // (não forçamos: CDN okx /games/ retorna 200)
    return s;
  }

  function ensureStyle() {
    try {
      ['ch7-game-covers-v1', 'ch7-game-covers-v2', 'ch7-game-covers-v3'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    } catch (e0) {}
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.gameImgBox{' +
      'width:1.15rem!important;max-width:1.15rem!important;' +
      'flex:0 0 1.15rem!important;position:relative!important;}' +
      '.gameImgBox .gameImg,' +
      '.gameImgBox .q-img.gameImg{' +
      'width:100%!important;border-radius:.07rem!important;overflow:hidden!important;' +
      'background:var(--bg-color,#1a1a1a)!important;}' +
      '.gameImgBox .gameImg .q-img__image,' +
      '.gameImgBox .q-img.gameImg .q-img__image,' +
      '.gameImgBox img.ch7-cover-fallback{' +
      'object-fit:cover!important;object-position:center center!important;' +
      'opacity:1!important;visibility:visible!important;}' +
      '.gameImgBox .collectionBox,' +
      '.gameImgBox button.collectionBox{' +
      'position:absolute!important;top:0!important;right:.05rem!important;' +
      'min-width:0!important;min-height:0!important;width:auto!important;height:auto!important;' +
      'padding:0 .02rem .03rem!important;z-index:3!important;' +
      'background:rgba(0,0,0,.4)!important;border-radius:0 0 .1rem .1rem!important;}' +
      '.gameImgBox .collectionBox .q-btn__content{min-width:0!important;padding:0!important;}' +
      '.gameImgBox .collection,' +
      '.gameImgBox img.collection,' +
      '.gameImgBox .collectionBox img{' +
      'width:.16rem!important;max-width:.17rem!important;min-width:0!important;' +
      'height:auto!important;max-height:.2rem!important;' +
      'object-fit:contain!important;display:block!important;}' +
      '@media (max-width:400px){' +
      '.gameImgBox{width:1.08rem!important;max-width:1.08rem!important;flex-basis:1.08rem!important;}' +
      '.gameImgBox .collection,.gameImgBox img.collection{width:.14rem!important;}' +
      '}' +
      '@media (min-width:481px){' +
      '.gameImgBox{width:1.12rem!important;max-width:1.12rem!important;flex-basis:1.12rem!important;}' +
      '}';
    document.head.appendChild(s);
  }

  // ── Hooks cedo: Vue seta data-src com CDN+path; reescrevemos na hora ──
  try {
    var origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === 'data-src' || name === 'src') {
        var next = toLocalCover(value);
        if (next && next !== value) value = next;
      }
      return origSetAttr.call(this, name, value);
    };
  } catch (eHook1) {}

  try {
    var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (desc && desc.set && desc.get) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: true,
        enumerable: desc.enumerable,
        get: function () {
          return desc.get.call(this);
        },
        set: function (v) {
          var next = toLocalCover(v);
          return desc.set.call(this, next && next !== v ? next : v);
        },
      });
    }
  } catch (eHook2) {}

  function fixImg(img) {
    if (!img || !img.getAttribute) return;
    var before = img.getAttribute('src') || '';
    var next = toLocalCover(before);
    if (next && next !== before) {
      try {
        img.setAttribute('src', next);
      } catch (e) {}
    }
  }

  function fixBox(box) {
    if (!box || !box.getAttribute) return;
    var ds = box.getAttribute('data-src') || '';
    if (ds) {
      var fixedDs = toLocalCover(ds);
      if (fixedDs && fixedDs !== ds) {
        box.setAttribute('data-src', fixedDs);
        ds = fixedDs;
      }
    }
    try {
      var qimg = box.querySelector('.gameImg, .q-img.gameImg');
      var coverImg = qimg && qimg.querySelector('img.q-img__image');
      var naturalOk =
        coverImg &&
        coverImg.naturalWidth > 20 &&
        parseFloat(getComputedStyle(coverImg).height || '0') > 10;

      if (qimg && !naturalOk && ds) {
        var src = toLocalCover(ds);
        if (coverImg) {
          var cur = coverImg.getAttribute('src') || '';
          var curFixed = toLocalCover(cur);
          if (!cur || coverImg.naturalWidth === 0 || (curFixed && curFixed !== cur)) {
            try {
              coverImg.setAttribute('src', src || curFixed || cur);
            } catch (e4) {}
          }
        } else if (!box.querySelector('img.ch7-cover-fallback')) {
          var im = document.createElement('img');
          im.className = 'ch7-cover-fallback';
          im.alt = '';
          im.decoding = 'async';
          im.loading = 'lazy';
          im.src = src;
          im.style.cssText =
            'display:block;width:100%;height:auto;aspect-ratio:100/135;object-fit:cover;border-radius:0.07rem;';
          var sizer = qimg.querySelector('div[style*="padding-bottom"]');
          if (sizer) {
            im.style.cssText =
              'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0.07rem;z-index:1;';
            qimg.style.position = 'relative';
            qimg.appendChild(im);
          } else {
            qimg.appendChild(im);
          }
        }
      }
    } catch (e3) {}
  }

  function scan() {
    ensureStyle();
    try {
      document.querySelectorAll('img').forEach(fixImg);
      document.querySelectorAll('.gameImgBox').forEach(fixBox);
    } catch (e) {}
  }

  var t = null;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(scan, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else schedule();
  window.addEventListener('load', schedule);
  setTimeout(schedule, 200);
  setTimeout(schedule, 800);
  setTimeout(schedule, 2000);
  setTimeout(schedule, 4000);
  try {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src'],
    });
  } catch (e) {}
})();
