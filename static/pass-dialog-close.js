/**
 * SLOT DA SORTE / Caça ao Tesouro — UM único X de fechar (v4 limpo).
 * - Prefere o .clone2 nativo do SPA
 * - Se falhar, adiciona no máximo 1 botão × no painel
 * - NUNCA fixed + abs + nativo juntos
 */
(function () {
  'use strict';
  if (window.__ch7PassDialogCloseV4) return;
  window.__ch7PassDialogCloseV4 = 1;

  var STYLE_ID = 'ch7-pass-dialog-close-style-v4';
  var ONE_X = 'ch7-pass-one-x';

  function ensureStyle() {
    var s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    // esconde botões extras de versões antigas + reforça um X nativo
    s.textContent =
      '.ch7-pass-close-btn,.ch7-pass-close-btn-abs,.ch7-pass-x:not(.' +
      ONE_X +
      '){display:none!important;visibility:hidden!important;pointer-events:none!important;}' +
      '.pass-dialog,.pass-dialog .panel{position:relative!important;overflow:visible!important}' +
      '.pass-dialog .clone2,' +
      '.' +
      ONE_X +
      '{position:absolute!important;top:8px!important;right:8px!important;z-index:200!important;' +
      'width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;' +
      'opacity:1!important;visibility:visible!important;display:inline-flex!important;' +
      'align-items:center!important;justify-content:center!important;' +
      'background:rgba(0,0,0,.8)!important;border:2px solid rgba(255,255,255,.45)!important;' +
      'border-radius:50%!important;color:#fff!important;cursor:pointer!important;' +
      'pointer-events:auto!important;box-shadow:0 4px 14px rgba(0,0,0,.45)!important;}' +
      '.pass-dialog .clone2 img{width:22px!important;height:22px!important;display:block!important}' +
      /* se houver 2+ clone2, esconde a partir do 2º */
      '.pass-dialog .clone2 ~ .clone2{display:none!important}';
  }

  function textOf(el) {
    try {
      return ((el && el.innerText) || (el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    } catch (e) {
      return '';
    }
  }

  function looksLikePass(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains('pass-dialog')) return true;
    if (el.querySelector && el.querySelector('.pass-dialog')) return true;
    var t = textOf(el);
    if (!t || t.length < 6) return false;
    return /Ca[cç]a ao Tesouro|SLOT DA SORTE|BORA VAR|2200%|de retorno|Até 2200/i.test(t);
  }

  function findOpenPassRoots() {
    var out = [];
    var seen = new Set();
    function add(el) {
      if (!el || seen.has(el)) return;
      var root =
        (el.classList && el.classList.contains('q-dialog') && el) ||
        (el.closest && el.closest('.q-dialog')) ||
        el;
      if (seen.has(root)) return;
      seen.add(root);
      out.push(root);
    }
    document.querySelectorAll('.pass-dialog').forEach(add);
    document.querySelectorAll('.q-dialog, [role="dialog"]').forEach(function (el) {
      if (looksLikePass(el)) add(el);
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

  function closePass(from) {
    try {
      var scope =
        (from && from.closest && from.closest('.pass-dialog, .q-dialog')) ||
        document.querySelector('.pass-dialog');
      var native =
        scope &&
        scope.querySelector &&
        scope.querySelector('.clone2, .' + ONE_X + ', button.clone2');
      if (native && native !== from) {
        try {
          native.click();
        } catch (e) {}
      }
    } catch (e) {}

    findOpenPassRoots().forEach(function (root) {
      hideEl(root);
      var dlg =
        root.classList && root.classList.contains('q-dialog')
          ? root
          : root.closest && root.closest('.q-dialog');
      if (dlg) hideEl(dlg);
    });
    document.querySelectorAll('.pass-dialog').forEach(function (el) {
      hideEl(el);
      var d = el.closest && el.closest('.q-dialog');
      if (d) hideEl(d);
    });
    document.querySelectorAll('.q-dialog__backdrop').forEach(function (b) {
      if (!document.querySelector('.pass-dialog:not([aria-hidden="true"])')) hideEl(b);
    });

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
            if (store.loading && 'passDialog' in store.loading) store.loading.passDialog = false;
            if (typeof store.removeDialog === 'function') store.removeDialog('passDialog');
          } catch (e3) {}
        });
      }
    } catch (e4) {}

    // remove extras antigos
    document
      .querySelectorAll('.ch7-pass-close-btn, .ch7-pass-close-btn-abs, .' + ONE_X)
      .forEach(function (b) {
        try {
          b.remove();
        } catch (e) {}
      });
  }

  function ensureOneX(dialogEl) {
    ensureStyle();
    var panel =
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog .panel')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.panel')) ||
      dialogEl;
    if (!panel) return;

    // 1) nativo
    var natives = panel.querySelectorAll
      ? panel.querySelectorAll('.clone2')
      : [];
    if (natives.length) {
      // só o primeiro visível
      for (var i = 0; i < natives.length; i++) {
        var n = natives[i];
        if (i === 0) {
          n.style.setProperty('opacity', '1', 'important');
          n.style.setProperty('visibility', 'visible', 'important');
          n.style.setProperty('display', 'inline-flex', 'important');
          n.style.setProperty('z-index', '200', 'important');
          if (!n.__ch7PassBound) {
            n.__ch7PassBound = 1;
            n.addEventListener(
              'click',
              function (ev) {
                // deixa nativo, reforça close
                setTimeout(function () {
                  closePass(n);
                }, 50);
              },
              true,
            );
          }
        } else {
          n.style.setProperty('display', 'none', 'important');
        }
      }
      // remove nosso botão se nativo existe
      panel.querySelectorAll('.' + ONE_X).forEach(function (b) {
        try {
          b.remove();
        } catch (e) {}
      });
      return;
    }

    // 2) fallback único
    if (panel.querySelector('.' + ONE_X)) return;
    try {
      var st = window.getComputedStyle(panel);
      if (st.position === 'static') panel.style.position = 'relative';
    } catch (e) {
      panel.style.position = 'relative';
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
        closePass(btn);
      },
      true,
    );
    panel.appendChild(btn);
  }

  function tick() {
    ensureStyle();
    // limpa botões de versões antigas sempre
    document
      .querySelectorAll('.ch7-pass-close-btn, .ch7-pass-close-btn-abs')
      .forEach(function (b) {
        try {
          b.remove();
        } catch (e) {}
      });

    var roots = findOpenPassRoots();
    if (!roots.length) return;
    roots.forEach(function (r) {
      ensureOneX(r);
    });
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
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  setTimeout(schedule, 400);
  setTimeout(schedule, 1500);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7PassMoV4) {
    window.__ch7PassMoV4 = 1;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        if (!nodes) continue;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (!n || n.nodeType !== 1) continue;
          var cls = (n.className && String(n.className)) || '';
          if (/pass-dialog|q-dialog|dialog/i.test(cls) || (n.querySelector && n.querySelector('.pass-dialog'))) {
            schedule();
            return;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7ClosePassDialog = closePass;
})();
