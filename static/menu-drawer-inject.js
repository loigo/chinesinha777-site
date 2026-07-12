/**
 * Menu lateral — garante ícone ⋮/hamburger visível + fallback local.
 * Modelo rioslots777. v=1
 */
(function () {
  'use strict';
  if (window.__ch7MenuDrawerV1) return;
  window.__ch7MenuDrawerV1 = 1;

  var LOCAL_ICON = '/static/brand/menu-icon-10002.png?v=1';
  var CDN_HINT = /10002\.png|banana_man\/assets\/10002/i;

  function fixIcon(img) {
    if (!img) return;
    try {
      img.setAttribute('data-ch7-menu-icon', '1');
      img.classList.add('img10002');
      img.decoding = 'async';
      img.loading = 'eager';
      img.alt = img.alt || 'Menu';
      // se CDN falhou ou natural 0, usa asset local
      if (!img.complete || img.naturalWidth === 0) {
        if (!CDN_HINT.test(img.getAttribute('src') || '') || img.naturalWidth === 0) {
          if (img.getAttribute('src') !== LOCAL_ICON) img.setAttribute('src', LOCAL_ICON);
        }
      }
      img.onerror = function () {
        img.onerror = null;
        img.setAttribute('src', LOCAL_ICON);
      };
    } catch (e) {}
  }

  function polishMenuBtn() {
    var btns = document.querySelectorAll(
      '.header-content .menu-btn, button.menu-btn, .q-toolbar .menu-btn',
    );
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Menu');
      var img = btn.querySelector('img');
      if (img) {
        fixIcon(img);
        btn.classList.remove('ch7-menu-fallback');
      } else {
        // sem img: tenta inserir local
        var content = btn.querySelector('.q-btn__content') || btn;
        var ni = document.createElement('img');
        ni.className = 'img10002';
        ni.src = LOCAL_ICON;
        ni.alt = 'Menu';
        ni.setAttribute('data-ch7-menu-icon', '1');
        content.appendChild(ni);
        fixIcon(ni);
      }
      // se ainda 0x0 após paint, fallback CSS
      (function (b, im) {
        setTimeout(function () {
          try {
            if (!im || im.naturalWidth === 0 || im.getBoundingClientRect().width < 8) {
              if (im && im.getAttribute('src') !== LOCAL_ICON) im.setAttribute('src', LOCAL_ICON);
              setTimeout(function () {
                if (!im || im.getBoundingClientRect().width < 8) b.classList.add('ch7-menu-fallback');
                else b.classList.remove('ch7-menu-fallback');
              }, 200);
            }
          } catch (e2) {}
        }, 120);
      })(btn, img || btn.querySelector('img'));
    }
  }

  function schedule() {
    clearTimeout(schedule._t);
    schedule._t = setTimeout(polishMenuBtn, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('load', schedule);
  setTimeout(schedule, 500);
  setTimeout(schedule, 1500);
  setTimeout(schedule, 3000);

  try {
    var mo = new MutationObserver(function () {
      schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
