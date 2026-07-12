/**
 * Capas de jogos — tamanho compacto SEM quebrar o QImg do SPA.
 * v=3 — não mexe em padding-bottom / height do q-img__container (causava h=0).
 */
(function () {
  'use strict';
  if (window.__ch7GameCoversV3) return;
  window.__ch7GameCoversV3 = 1;
  window.__ch7GameCoversV2 = 1;
  window.__ch7GameCoversV1 = 1;

  var BANANA = 'https://www.okx007.com/res/banana_man';
  var STYLE_ID = 'ch7-game-covers-v3';

  function ensureStyle() {
    try {
      ['ch7-game-covers-v1', 'ch7-game-covers-v2'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    } catch (e0) {}
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      /* Cards um pouco menores — só largura; altura vem do padding-bottom nativo do QImg */
      '.gameImgBox{' +
      'width:1.15rem!important;max-width:1.15rem!important;' +
      'flex:0 0 1.15rem!important;position:relative!important;}' +
      '.gameImgBox .gameImg,' +
      '.gameImgBox .q-img.gameImg{' +
      'width:100%!important;border-radius:.07rem!important;overflow:hidden!important;' +
      'background:var(--bg-color,#1a1a1a)!important;}' +
      /* capa: cover sem forçar height 0 */
      '.gameImgBox .gameImg .q-img__image,' +
      '.gameImgBox .q-img.gameImg .q-img__image{' +
      'object-fit:cover!important;object-position:center center!important;}' +
      /* Estrela favorita pequena */
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

  function rewriteSrc(src) {
    var s = String(src || '');
    if (!s) return s;
    if (/\/static\//i.test(s) || /games-orig/i.test(s)) {
      // corrige CDN errado banana_man/static/games-orig → local
      try {
        var u = new URL(s, location.href);
        if (/banana_man\/static\/games-orig/i.test(u.pathname + u.href)) {
          return '/static/games-orig/' + u.pathname.split('/').pop();
        }
      } catch (e) {}
      return s;
    }
    if (/^\/games\//i.test(s) || /^games\//i.test(s)) {
      return BANANA + (s.charAt(0) === '/' ? s : '/' + s);
    }
    try {
      var u2 = new URL(s, location.href);
      if (/banana_man\/static\/games-orig/i.test(u2.href)) {
        return '/static/games-orig/' + u2.pathname.split('/').pop();
      }
    } catch (e2) {}
    return s;
  }

  function fixImg(img) {
    if (!img || !img.getAttribute) return;
    var before = img.getAttribute('src') || '';
    var next = rewriteSrc(before);
    if (next && next !== before) {
      try {
        img.setAttribute('src', next);
      } catch (e) {}
    }
  }

  function fixBox(box) {
    if (!box || !box.getAttribute) return;
    var ds = box.getAttribute('data-src') || '';
    if (!ds) return;
    if (/banana_man\/static\/games-orig/i.test(ds)) {
      var fixed = '/static/games-orig/' + ds.split('/').pop();
      box.setAttribute('data-src', fixed);
      ds = fixed;
    }
    // normaliza data-src local
    if (/games-orig/i.test(ds) && !/^https?:\/\//i.test(ds) && ds.indexOf('/static/') !== 0) {
      ds = '/static/games-orig/' + ds.split('/').pop();
      box.setAttribute('data-src', ds);
    }
    try {
      var qimg = box.querySelector('.gameImg, .q-img.gameImg');
      var coverImg = qimg && qimg.querySelector('img.q-img__image');
      var naturalOk =
        coverImg &&
        coverImg.naturalWidth > 20 &&
        parseFloat(getComputedStyle(coverImg).height || '0') > 10;

      // Força src no QImg se data-src existe e imagem vazia
      if (qimg && !naturalOk && ds) {
        var src = rewriteSrc(ds);
        if (src && !/^https?:\/\//i.test(src) && src.charAt(0) !== '/') {
          src = '/static/games-orig/' + src.split('/').pop();
        }
        if (src && src.indexOf('games-orig') >= 0 && src.charAt(0) !== '/' && !/^https?:/.test(src)) {
          src = '/' + src;
        }
        // se path relativo games-orig sem /static
        if (/^\/?g_0_|^\/?game_/i.test(src)) src = '/static/games-orig/' + src.replace(/^\//, '');

        if (coverImg) {
          var cur = coverImg.getAttribute('src') || '';
          if (!cur || coverImg.naturalWidth === 0) {
            try {
              coverImg.setAttribute('src', src);
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
          if (qimg) {
            // se o sizer padding existe, usa absolute
            var sizer = qimg.querySelector('div[style*="padding-bottom"]');
            if (sizer) {
              im.style.cssText =
                'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0.07rem;z-index:1;';
              qimg.style.position = 'relative';
              qimg.appendChild(im);
            } else {
              qimg.appendChild(im);
            }
          } else {
            box.insertBefore(im, box.firstChild);
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
    t = setTimeout(scan, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else schedule();
  window.addEventListener('load', schedule);
  setTimeout(schedule, 300);
  setTimeout(schedule, 1200);
  setTimeout(schedule, 3000);
  try {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (e) {}
})();
