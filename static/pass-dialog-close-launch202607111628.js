/**
 * SLOT DA SORTE / Caça ao Tesouro — X de fechar SEMPRE visível (v3).
 * - Detecção ampla (classe + texto + dialog aberto)
 * - Botão fixed no viewport (não depende de CSS do painel)
 * - Botão no .panel + reforço no .clone2 nativo
 */
(function () {
  'use strict';
  // always re-bind latest version
  window.__ch7PassDialogCloseV3 = 1;

  var STYLE_ID = 'ch7-pass-dialog-close-style-v3';
  var BTN_CLASS = 'ch7-pass-close-btn';
  var ABS_CLASS = 'ch7-pass-close-btn-abs';

  function ensureStyle() {
    var s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    s.textContent =
      '.' +
      BTN_CLASS +
      '{position:fixed!important;z-index:2147483000!important;' +
      'width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;' +
      'padding:0!important;margin:0!important;border:2px solid rgba(255,255,255,.55)!important;' +
      'border-radius:50%!important;background:rgba(0,0,0,.85)!important;color:#fff!important;' +
      'font:800 28px/40px system-ui,-apple-system,Segoe UI,sans-serif!important;text-align:center!important;' +
      'cursor:pointer!important;box-shadow:0 4px 18px rgba(0,0,0,.55)!important;' +
      '-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important;' +
      'pointer-events:auto!important;opacity:1!important;visibility:visible!important;display:block!important;}' +
      '.' +
      BTN_CLASS +
      ':active{transform:scale(.92)!important;}' +
      '.' +
      ABS_CLASS +
      '{position:absolute!important;top:6px!important;right:6px!important;z-index:200!important;' +
      'width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;' +
      'padding:0!important;border:2px solid rgba(255,255,255,.4)!important;border-radius:50%!important;' +
      'background:rgba(0,0,0,.8)!important;color:#fff!important;' +
      'font:800 24px/36px system-ui,sans-serif!important;cursor:pointer!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      'opacity:1!important;visibility:visible!important;pointer-events:auto!important;}' +
      '.pass-dialog,.pass-dialog .panel{position:relative!important;overflow:visible!important}' +
      '.pass-dialog .clone2,.pass-dialog .ch7-pass-x{' +
      'position:absolute!important;top:6px!important;right:6px!important;z-index:180!important;' +
      'width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;' +
      'opacity:1!important;visibility:visible!important;display:inline-flex!important;' +
      'align-items:center!important;justify-content:center!important;' +
      'background:rgba(0,0,0,.75)!important;border-radius:50%!important;color:#fff!important;' +
      'pointer-events:auto!important;}' +
      '.pass-dialog .clone2img,.pass-dialog .clone2 img{width:28px!important;height:28px!important;display:block!important}' +
      /* se a imagem do X nativo falhar, mostra × via CSS */
      '.pass-dialog .clone2:not(:has(img[src]:not([src=""])))::after,' +
      '.pass-dialog .clone2 img[src=""],.pass-dialog .clone2 img:not([src]){content:"×";color:#fff;font:800 22px/1 system-ui,sans-serif}';
  }

  function textOf(el) {
    try {
      return ((el && el.innerText) || (el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    } catch (e) {
      return '';
    }
  }

  function isVisibleish(el) {
    if (!el || !el.getBoundingClientRect) return false;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      if (parseFloat(st.opacity) === 0) return false;
    } catch (e) {}
    var r = el.getBoundingClientRect();
    return r.width > 20 && r.height > 20;
  }

  function looksLikePass(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains('pass-dialog')) return true;
    if (el.querySelector && el.querySelector('.pass-dialog')) return true;
    if (el.querySelector && el.querySelector('.promo-hero') && el.querySelector('.cta-btn, .myBtnStyle1, .btn-text, .comeBtn'))
      return true;
    var t = textOf(el);
    if (!t || t.length < 6) return false;
    return (
      /Ca[cç]a ao Tesouro|SLOT DA SORTE|BORA VAR|Bora var|2200%|de retorno|Até 2200/i.test(t) ||
      (/Tesouro/i.test(t) && /retorno|2200|BORA|Come[cç]ar/i.test(t))
    );
  }

  function findOpenPassRoots() {
    var out = [];
    var seen = new Set();

    function add(el) {
      if (!el || seen.has(el)) return;
      if (!looksLikePass(el) && !(el.classList && el.classList.contains('pass-dialog'))) return;
      // prefer the dialog shell if present
      var root =
        (el.classList && el.classList.contains('q-dialog') && el) ||
        (el.closest && el.closest('.q-dialog')) ||
        el;
      if (seen.has(root)) return;
      // skip fully hidden
      if (!isVisibleish(root) && !isVisibleish(el) && !el.querySelector('.pass-dialog')) {
        // still allow .pass-dialog in DOM even if parent animating
        if (!(el.classList && el.classList.contains('pass-dialog'))) return;
      }
      seen.add(root);
      out.push(root);
    }

    document.querySelectorAll('.pass-dialog').forEach(function (el) {
      add(el);
    });
    document.querySelectorAll('.q-dialog, [role="dialog"]').forEach(function (el) {
      if (looksLikePass(el)) add(el);
    });
    // fallback: any large panel with pass copy
    document.querySelectorAll('.panel, .promo-hero').forEach(function (el) {
      var host = el.closest('.pass-dialog, .q-dialog, [role="dialog"]') || el.parentElement;
      if (host && looksLikePass(host)) add(host);
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
      var native = scope && scope.querySelector('.clone2, .ch7-pass-x, button.clone2, .q-btn.clone2');
      if (native && native !== from) {
        try {
          native.click();
        } catch (e) {}
      }
    } catch (e) {}

    findOpenPassRoots().forEach(function (root) {
      hideEl(root);
      var dlg = root.classList && root.classList.contains('q-dialog') ? root : root.closest && root.closest('.q-dialog');
      if (dlg) hideEl(dlg);
      var portal = (dlg || root).parentElement;
      if (portal) {
        portal.querySelectorAll('.q-dialog, .q-dialog__backdrop').forEach(hideEl);
      }
    });
    // hide remaining pass-dialog nodes
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
        app && app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (store.loading && 'passDialog' in store.loading) store.loading.passDialog = false;
            if (typeof store.removeDialog === 'function') store.removeDialog('passDialog');
            if (typeof store.closeDialog === 'function') store.closeDialog('passDialog');
            if (typeof store.setLoading === 'function') {
              try {
                store.setLoading({ passDialog: false });
              } catch (e2) {}
            }
          } catch (e3) {}
        });
      }
    } catch (e4) {}

    document.querySelectorAll('.' + BTN_CLASS + ', .' + ABS_CLASS).forEach(function (b) {
      try {
        b.remove();
      } catch (e) {}
    });
  }

  function placeFixedBtn(dialogEl) {
    ensureStyle();
    var existing = document.querySelector('.' + BTN_CLASS + '[data-ch7-pass="1"]');
    var panel =
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog .panel')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.panel')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog')) ||
      dialogEl;

    var pr = panel && panel.getBoundingClientRect ? panel.getBoundingClientRect() : null;
    var top = 12;
    var left = Math.max(8, window.innerWidth - 56);
    if (pr && pr.width > 40 && pr.height > 40) {
      top = Math.max(8, Math.min(pr.top + 8, window.innerHeight - 56));
      left = Math.min(window.innerWidth - 52, Math.max(8, pr.right - 48));
    }

    var btn = existing;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = BTN_CLASS;
      btn.setAttribute('data-ch7-pass', '1');
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
      document.body.appendChild(btn);
    }
    btn.style.top = top + 'px';
    btn.style.left = left + 'px';
    btn.style.right = 'auto';
    btn.style.display = 'block';
    btn.style.opacity = '1';
    btn.style.visibility = 'visible';
  }

  function alsoInPanel(dialogEl) {
    ensureStyle();
    var panel =
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog .panel')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.panel')) ||
      (dialogEl && dialogEl.querySelector && dialogEl.querySelector('.pass-dialog'));
    if (!panel) return;
    if (panel.querySelector('.' + ABS_CLASS)) return;
    try {
      var st = window.getComputedStyle(panel);
      if (st.position === 'static') panel.style.position = 'relative';
    } catch (e) {
      panel.style.position = 'relative';
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = ABS_CLASS;
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

  function reinforceNative(dialogEl) {
    ensureStyle();
    var scope = dialogEl || document;
    scope.querySelectorAll &&
      scope.querySelectorAll('.pass-dialog .clone2, .clone2.ch7-pass-x').forEach(function (el) {
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('display', 'inline-flex', 'important');
        el.style.setProperty('z-index', '180', 'important');
        // if image broken / empty, ensure × text
        var img = el.querySelector('img');
        if (!img || !img.getAttribute('src') || img.naturalWidth === 0) {
          if (!el.querySelector('.ch7-x-fallback')) {
            var span = document.createElement('span');
            span.className = 'ch7-x-fallback';
            span.textContent = '×';
            span.style.cssText = 'color:#fff;font:800 22px/1 system-ui,sans-serif;';
            el.appendChild(span);
          }
        }
      });
  }

  function tick() {
    ensureStyle();
    var roots = findOpenPassRoots();
    if (!roots.length) {
      // last resort: any pass-dialog node in DOM
      var raw = document.querySelectorAll('.pass-dialog');
      if (raw.length) {
        raw.forEach(function (el) {
          roots.push(el.closest('.q-dialog') || el);
        });
      }
    }
    if (!roots.length) {
      document.querySelectorAll('.' + BTN_CLASS).forEach(function (b) {
        b.style.display = 'none';
      });
      return;
    }
    roots.forEach(function (r) {
      reinforceNative(r);
      alsoInPanel(r);
      placeFixedBtn(r);
    });
  }

  var t = null;
  var __ch7PassBusy = false;
  function schedule() {
    if (__ch7PassBusy) return;
    clearTimeout(t);
    t = setTimeout(function () {
      __ch7PassBusy = true;
      try {
        tick();
      } finally {
        setTimeout(function () {
          __ch7PassBusy = false;
        }, 300);
      }
    }, 120);
  }

  // sem setInterval agressivo (causava loop com MO)
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

  if (typeof MutationObserver !== 'undefined' && !window.__ch7PassMoV2) {
    window.__ch7PassMoV2 = 1;
    new MutationObserver(function (muts) {
      // só reage a diálogos abertos, não a qualquer mutação
      var hit = false;
      for (var i = 0; i < muts.length && !hit; i++) {
        var n = muts[i].target;
        if (!n || !n.classList) continue;
        var cls = n.className && String(n.className);
        if (cls && /pass|dialog|q-dialog/i.test(cls)) hit = true;
      }
      if (hit) schedule();
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
    });
  }

  window.__ch7PassClose = { tick: tick, close: closePass };
})();
