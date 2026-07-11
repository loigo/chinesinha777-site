/**
 * SLOT DA SORTE / RegistrationRewardDialog / Descrição da Atividade
 * X de fechar SEMPRE visível (v4).
 * Detecta: .slotBox, .bottomBox, .dialog lottery, texto com encoding quebrado (Descricäo).
 */
(function () {
  'use strict';
  if (window.__ch7ActivityCloseV4) return;
  window.__ch7ActivityCloseV4 = 1;

  var KEY = 'activity_desc_closed';
  var STYLE_ID = 'ch7-activity-close-style-v4';
  var BTN = 'activity-desc-close';
  var FIXED = 'ch7-slot-fixed-x';

  function dismissed() {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch (e) {
      return false;
    }
  }
  function markDismissed() {
    try {
      localStorage.setItem(KEY, '1');
    } catch (e) {}
  }

  function ensureStyle() {
    var s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    s.textContent =
      '.' +
      BTN +
      ',.' +
      FIXED +
      '{z-index:2147483000!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;' +
      'padding:0!important;margin:0!important;border:2px solid rgba(255,255,255,.5)!important;border-radius:50%!important;' +
      'background:rgba(0,0,0,.85)!important;color:#fff!important;font:800 26px/38px system-ui,-apple-system,Segoe UI,sans-serif!important;' +
      'text-align:center!important;cursor:pointer!important;box-shadow:0 4px 16px rgba(0,0,0,.5)!important;' +
      'pointer-events:auto!important;opacity:1!important;visibility:visible!important;-webkit-tap-highlight-color:transparent!important;}' +
      '.' +
      BTN +
      '{position:absolute!important;top:6px!important;right:6px!important;display:flex!important;align-items:center!important;justify-content:center!important;}' +
      '.' +
      FIXED +
      '{position:fixed!important;display:block!important;}' +
      '.' +
      FIXED +
      ':active,.' +
      BTN +
      ':active{transform:scale(.92)!important;}' +
      '.dialog.ch7-slot-host,.dialog{position:relative!important;overflow:visible!important}' +
      '.header-content .' +
      BTN +
      ',.q-header .' +
      BTN +
      '{display:none!important}';
  }

  function textOf(el) {
    try {
      return ((el && el.innerText) || (el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    } catch (e) {
      return '';
    }
  }

  function isActivityText(t) {
    if (!t) return false;
    // encoding quebrado no bundle: "Descricäo da Atividade"
    return /Descri.{0,4}o da Atividade|Descricao da Atividade|da Atividade/i.test(t);
  }

  function isSlotDialog(el) {
    if (!el || !el.querySelector) return false;
    if (el.querySelector('.slotBox, .lotteryBg, .lotteryGan, .rotary-table, .lotteryBtnBox')) return true;
    if (el.classList && (el.classList.contains('slotBox') || el.classList.contains('dialog'))) {
      if (el.querySelector && el.querySelector('.lotteryBg, .bottomBox')) return true;
    }
    var t = textOf(el);
    return isActivityText(t) && (el.querySelector('.bottomBox, .bottomBoxTitle, .bottom-container') || /recompensas|recem-chegados|recém/i.test(t));
  }

  function findRoots() {
    var out = [];
    var seen = new Set();
    function add(el) {
      if (!el || seen.has(el)) return;
      var root =
        (el.closest && el.closest('.q-dialog')) ||
        (el.classList && el.classList.contains('q-dialog') && el) ||
        el;
      if (seen.has(root)) return;
      seen.add(root);
      out.push(root);
    }

    document.querySelectorAll('.q-dialog, [role="dialog"]').forEach(function (d) {
      if (d.getAttribute('aria-hidden') === 'true') return;
      try {
        var st = getComputedStyle(d);
        if (st.display === 'none') return;
      } catch (e) {}
      if (isSlotDialog(d) || isActivityText(textOf(d))) add(d);
    });
    document.querySelectorAll('.slotBox, .dialog .bottomBox, .bottomBox').forEach(function (el) {
      add(el.closest('.q-dialog') || el.closest('.dialog') || el);
    });
    return out;
  }

  function hideEl(el) {
    if (!el) return;
    try {
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
    } catch (e) {}
  }

  function closeStore() {
    try {
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia =
        app && app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (store.loading) {
              if ('registrationRewardDialog' in store.loading) store.loading.registrationRewardDialog = false;
              if ('passDialog' in store.loading) store.loading.passDialog = false;
            }
            if (typeof store.removeDialog === 'function') {
              store.removeDialog('registrationRewardDialog');
              store.removeDialog('passDialog');
            }
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  function closeFrom(el) {
    markDismissed();
    // try native ClosePopup first
    try {
      var scope = (el && el.closest && el.closest('.q-dialog, .dialog')) || document;
      var native = scope.querySelector && scope.querySelector('.ch7-slot-close, .clone2, .ch7-pass-x');
      if (native && native !== el) {
        try {
          native.click();
        } catch (e) {}
      }
    } catch (e) {}

    findRoots().forEach(function (root) {
      hideEl(root);
      var dlg = root.classList && root.classList.contains('q-dialog') ? root : root.closest && root.closest('.q-dialog');
      if (dlg) hideEl(dlg);
      var portal = (dlg || root).parentElement;
      if (portal) portal.querySelectorAll('.q-dialog, .q-dialog__backdrop').forEach(hideEl);
    });
    document.querySelectorAll('.q-dialog__backdrop').forEach(hideEl);
    closeStore();
    document.querySelectorAll('.' + FIXED + ', .' + BTN).forEach(function (b) {
      try {
        b.remove();
      } catch (e) {}
    });
  }

  function placeFixed(root) {
    ensureStyle();
    var existing = document.querySelector('.' + FIXED);
    var host =
      (root.querySelector && (root.querySelector('.dialog') || root.querySelector('.slotBox'))) ||
      root;
    var pr = host.getBoundingClientRect();
    var top = 12;
    var left = Math.max(8, window.innerWidth - 56);
    if (pr.width > 40) {
      top = Math.max(8, Math.min(pr.top + 8, window.innerHeight - 56));
      left = Math.min(window.innerWidth - 52, Math.max(8, pr.right - 48));
    }
    var btn = existing;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = FIXED;
      btn.setAttribute('aria-label', 'Fechar');
      btn.textContent = '×';
      btn.addEventListener(
        'click',
        function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          closeFrom(btn);
        },
        true,
      );
      document.body.appendChild(btn);
    }
    btn.style.top = top + 'px';
    btn.style.left = left + 'px';
    btn.style.right = 'auto';
    btn.style.display = 'block';
  }

  function placeOnDialog(root) {
    ensureStyle();
    var dialog =
      (root.querySelector && root.querySelector('.dialog')) ||
      (root.classList && root.classList.contains('dialog') && root) ||
      null;
    if (!dialog) return;
    if (dialog.querySelector('.' + BTN + ', .ch7-slot-close')) return;
    try {
      var st = getComputedStyle(dialog);
      if (st.position === 'static') dialog.style.position = 'relative';
    } catch (e) {
      dialog.style.position = 'relative';
    }
    dialog.classList.add('ch7-slot-host');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN;
    btn.setAttribute('aria-label', 'Fechar');
    btn.textContent = '×';
    btn.addEventListener(
      'click',
      function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        closeFrom(btn);
      },
      true,
    );
    dialog.appendChild(btn);
  }

  function placeOnBottom(root) {
    ensureStyle();
    var box =
      (root.querySelector && root.querySelector('.bottomBox, .bottom-container')) ||
      (root.classList && (root.classList.contains('bottomBox') || root.classList.contains('bottom-container')) && root);
    if (!box) return;
    if (box.querySelector('.' + BTN)) return;
    try {
      var st = getComputedStyle(box);
      if (st.position === 'static') box.style.position = 'relative';
    } catch (e) {
      box.style.position = 'relative';
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN;
    btn.setAttribute('aria-label', 'Fechar');
    btn.textContent = '×';
    btn.addEventListener(
      'click',
      function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        closeFrom(btn);
      },
      true,
    );
    box.appendChild(btn);
  }

  function tick() {
    var roots = findRoots();
    if (!roots.length) {
      document.querySelectorAll('.' + FIXED).forEach(function (b) {
        b.style.display = 'none';
      });
      return;
    }
    // se o usuário já fechou antes, fecha de novo
    if (dismissed()) {
      roots.forEach(function (r) {
        closeFrom(r);
      });
      return;
    }
    roots.forEach(function (r) {
      placeOnDialog(r);
      placeOnBottom(r);
      placeFixed(r);
    });
  }

  var tmr = null;
  var __ch7ActBusy = false;
  function schedule() {
    if (__ch7ActBusy) return;
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      __ch7ActBusy = true;
      try {
        tick();
      } finally {
        setTimeout(function () {
          __ch7ActBusy = false;
        }, 350);
      }
    }, 120);
  }

  // sem setInterval 350ms (loop com MO)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  setTimeout(schedule, 300);
  setTimeout(schedule, 1200);
  setTimeout(schedule, 3000);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7ActMoV2) {
    window.__ch7ActMoV2 = 1;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var cls = String((muts[i].target && muts[i].target.className) || '');
        if (/dialog|activity|desc|q-dialog/i.test(cls)) {
          schedule();
          return;
        }
      }
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
    });
  }

  window.__ch7ActivityClose = { tick: tick, close: closeFrom };
})();
