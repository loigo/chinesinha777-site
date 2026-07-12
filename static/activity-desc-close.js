/**
 * SLOT / Descrição da Atividade — UM único X de fechar (v5 limpo).
 * Sem fixed + absolute duplicados.
 */
(function () {
  'use strict';
  if (window.__ch7ActivityCloseV5) return;
  window.__ch7ActivityCloseV5 = 1;

  var KEY = 'activity_desc_closed';
  var STYLE_ID = 'ch7-activity-close-style-v5';
  var ONE_X = 'ch7-slot-one-x';

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
      /* some antigas */
      '.activity-desc-close,.ch7-slot-fixed-x{display:none!important;visibility:hidden!important;pointer-events:none!important;}' +
      '.' +
      ONE_X +
      '{position:absolute!important;top:8px!important;right:8px!important;z-index:200!important;' +
      'width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;' +
      'padding:0!important;border:2px solid rgba(255,255,255,.45)!important;border-radius:50%!important;' +
      'background:rgba(0,0,0,.8)!important;color:#fff!important;font:800 24px/1 system-ui,sans-serif!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      'cursor:pointer!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;}' +
      '.dialog.ch7-slot-host,.dialog,.slotBox{position:relative!important;overflow:visible!important}' +
      '.dialog .clone2 ~ .clone2{display:none!important}';
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
    return /Descri.{0,4}o da Atividade|Descricao da Atividade|da Atividade/i.test(t);
  }

  function isSlotDialog(el) {
    if (!el || !el.querySelector) return false;
    if (el.querySelector('.slotBox, .lotteryBg, .lotteryGan, .rotary-table, .lotteryBtnBox')) return true;
    var t = textOf(el);
    return isActivityText(t);
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
      if (isSlotDialog(d) || isActivityText(textOf(d))) add(d);
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
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (store.loading) {
              if ('registrationRewardDialog' in store.loading)
                store.loading.registrationRewardDialog = false;
            }
            if (typeof store.removeDialog === 'function') {
              store.removeDialog('registrationRewardDialog');
            }
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  function closeFrom(el) {
    markDismissed();
    try {
      var scope = (el && el.closest && el.closest('.q-dialog, .dialog')) || document;
      var native = scope.querySelector && scope.querySelector('.clone2, .' + ONE_X);
      if (native && native !== el) {
        try {
          native.click();
        } catch (e) {}
      }
    } catch (e) {}
    findRoots().forEach(function (root) {
      hideEl(root);
      var dlg =
        root.classList && root.classList.contains('q-dialog')
          ? root
          : root.closest && root.closest('.q-dialog');
      if (dlg) hideEl(dlg);
    });
    document.querySelectorAll('.q-dialog__backdrop').forEach(hideEl);
    closeStore();
    document.querySelectorAll('.' + ONE_X + ', .activity-desc-close, .ch7-slot-fixed-x').forEach(function (b) {
      try {
        b.remove();
      } catch (e) {}
    });
  }

  function ensureOneX(root) {
    ensureStyle();
    var host =
      (root.querySelector &&
        (root.querySelector('.dialog') ||
          root.querySelector('.slotBox') ||
          root.querySelector('.bottomBox') ||
          root.querySelector('.panel'))) ||
      root;

    var natives = host.querySelectorAll ? host.querySelectorAll('.clone2') : [];
    if (natives.length) {
      for (var i = 0; i < natives.length; i++) {
        if (i === 0) {
          natives[i].style.setProperty('opacity', '1', 'important');
          natives[i].style.setProperty('visibility', 'visible', 'important');
          natives[i].style.setProperty('display', 'inline-flex', 'important');
        } else {
          natives[i].style.setProperty('display', 'none', 'important');
        }
      }
      host.querySelectorAll('.' + ONE_X).forEach(function (b) {
        try {
          b.remove();
        } catch (e) {}
      });
      return;
    }

    if (host.querySelector('.' + ONE_X)) return;
    try {
      var st = getComputedStyle(host);
      if (st.position === 'static') host.style.position = 'relative';
    } catch (e) {
      host.style.position = 'relative';
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = ONE_X;
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
    host.appendChild(btn);
  }

  function tick() {
    if (dismissed()) {
      findRoots().forEach(function (r) {
        closeFrom(r);
      });
      return;
    }
    ensureStyle();
    document.querySelectorAll('.activity-desc-close, .ch7-slot-fixed-x').forEach(function (b) {
      try {
        b.remove();
      } catch (e) {}
    });
    var roots = findRoots();
    roots.forEach(ensureOneX);
  }

  var t = null;
  var busy = false;
  function schedule() {
    if (busy) return;
    clearTimeout(t);
    t = setTimeout(function () {
      busy = true;
      try {
        tick();
      } finally {
        setTimeout(function () {
          busy = false;
        }, 250);
      }
    }, 120);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  setTimeout(schedule, 500);
  setTimeout(schedule, 2000);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7ActMoV5) {
    window.__ch7ActMoV5 = 1;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        if (!nodes) continue;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (!n || n.nodeType !== 1) continue;
          var cls = (n.className && String(n.className)) || '';
          if (/q-dialog|slotBox|bottomBox|dialog/i.test(cls)) {
            schedule();
            return;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
