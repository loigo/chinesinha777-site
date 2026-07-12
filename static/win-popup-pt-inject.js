/**
 * Tradução EN→pt-BR de popups de vitória / RESPIN / free spins.
 * v5 — glass overlay + SEM loop (só dialogs de prêmio).
 */
(function () {
  'use strict';
  if (window.__ch7WinPopupPtV5) return;
  window.__ch7WinPopupPtV5 = 1;
  window.__ch7WinPopupPtV4 = 1;

  var OVERLAY_ID = 'ch7-win-pt-overlay';
  var metaReady = false;

  function lockNoTranslateOnce() {
    try {
      var html = document.documentElement;
      if (html) {
        // SPA às vezes sobrescreve lang=en-US — reafirma pt-BR sem reescrever o body inteiro
        if (html.getAttribute('lang') !== 'pt-BR') html.setAttribute('lang', 'pt-BR');
        if (html.getAttribute('translate') !== 'no') html.setAttribute('translate', 'no');
        if (!html.classList.contains('notranslate')) html.classList.add('notranslate');
      }
      if (document.body) {
        if (document.body.getAttribute('translate') !== 'no')
          document.body.setAttribute('translate', 'no');
        if (!document.body.classList.contains('notranslate'))
          document.body.classList.add('notranslate');
      }
      if (!metaReady && document.head && !document.getElementById('ch7-notranslate-meta')) {
        var m = document.createElement('meta');
        m.id = 'ch7-notranslate-meta';
        m.setAttribute('name', 'google');
        m.setAttribute('content', 'notranslate');
        document.head.appendChild(m);
        metaReady = true;
      }
    } catch (e) {}
  }

  /** Só frases de vitória — NÃO traduz "bonus/spin/continue" isolados (quebrava o SPA). */
  function translateWinText(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var t = raw;
    var orig = t;

    t = t.replace(
      /congrats!?[\s,!.]*you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'PARABÉNS! VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(
      /you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(
      /congrats!?[\s,!.]*you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+free\s*spins?\s+bonus!?/gi,
      'PARABÉNS! VOCÊ GANHOU $1 EM BÔNUS DE RODADAS GRÁTIS!',
    );
    t = t.replace(
      /you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+free\s*spins?\s+bonus!?/gi,
      'VOCÊ GANHOU $1 EM BÔNUS DE RODADAS GRÁTIS!',
    );
    t = t.replace(
      /congrats!?[\s,!.]*you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)/gi,
      'PARABÉNS! VOCÊ GANHOU $1',
    );
    t = t.replace(
      /you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)/gi,
      'VOCÊ GANHOU $1',
    );
    t = t.replace(/you\s+won\s+(R\$\s*[\d.,]+)/gi, 'VOCÊ GANHOU $1');
    t = t.replace(/\s+in\s+free\s*spins?\s+bonus!?\b/gi, ' EM BÔNUS DE RODADAS GRÁTIS!');
    t = t.replace(/\s+in\s+respin\s+bonus!?\b/gi, ' EM BÔNUS DE RESPIN!');
    t = t.replace(/\bin\s+respin\s+bonus!?\b/gi, 'EM BÔNUS DE RESPIN!');
    t = t.replace(/\brespin\s+bonus!?\b/gi, 'BÔNUS DE RESPIN!');
    t = t.replace(/\bfree\s*spins?\s+bonus!?\b/gi, 'BÔNUS DE RODADAS GRÁTIS!');
    t = t.replace(/\bbig\s+win\b/gi, 'GRANDE VITÓRIA');
    t = t.replace(/\bmega\s+win\b/gi, 'MEGA VITÓRIA');
    t = t.replace(/\bsuper\s+win\b/gi, 'SUPER VITÓRIA');
    t = t.replace(/\btotal\s+win\b/gi, 'GANHO TOTAL');
    t = t.replace(/\bcongratulations!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\bcongrats!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\byou(?:'ve|’ve| have)\s+won\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/\byou\s+won\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/\byou\s+win\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/[ \t]{2,}/g, ' ').replace(/!{2,}/g, '!').trim();

    if (t === orig.trim()) return null;
    return t;
  }

  function looksEnglishWin(s) {
    return /congrat|you.?ve\s+won|you\s+won|respin\s*bonus|in\s+respin|free\s*spins?\s+bonus|big\s+win|mega\s+win|total\s+win|you\s+win/i.test(
      String(s || ''),
    );
  }

  function extractAmount(s) {
    var m = String(s || '').match(/R\$\s*[\d.,]+/);
    return m ? m[0] : '';
  }

  /** Só text nodes — NÃO setAttribute em elementos (causava MO loop). */
  function walkText(node, depth) {
    if (!node || depth > 24) return;
    if (node.nodeType === 1) {
      var tag = (node.tagName || '').toUpperCase();
      if (
        tag === 'SCRIPT' ||
        tag === 'STYLE' ||
        tag === 'TEXTAREA' ||
        tag === 'INPUT' ||
        tag === 'SVG' ||
        tag === 'CANVAS' ||
        tag === 'CODE' ||
        tag === 'PRE'
      )
        return;
      var ch = node.childNodes;
      for (var i = 0; i < ch.length; i++) walkText(ch[i], depth + 1);
      return;
    }
    if (node.nodeType !== 3) return;
    var val = node.nodeValue;
    if (!val || !/[A-Za-z]/.test(val)) return;
    if (!looksEnglishWin(val)) return;
    var tr = translateWinText(val);
    if (tr && tr !== val) {
      node.nodeValue = tr;
      return;
    }
    if (/congrats|respin|free\s*spin|you.?ve\s+won/i.test(val) && /won|bonus|spin/i.test(val)) {
      var amt = extractAmount(val);
      node.nodeValue = amt
        ? 'PARABÉNS! VOCÊ GANHOU ' + amt + ' EM BÔNUS DE RESPIN!'
        : 'PARABÉNS! VOCÊ GANHOU EM BÔNUS DE RESPIN!';
    }
  }

  var POPUP_SEL =
    '.q-dialog, .q-dialog__inner, [class*="dialog"], [class*="Dialog"], ' +
    '[class*="Award"], [class*="award"], [class*="reward"], [class*="Reward"], ' +
    '[class*="popup"], [class*="Popup"], [class*="winning"], [class*="Winning"], ' +
    '[class*="congrat"], [class*="Congrat"]';

  /** Em dialogs de prêmio/vitória: no máximo 1 botão fechar visível */
  function dedupeCloseButtons(dialogEl) {
    try {
      if (!dialogEl || !dialogEl.querySelectorAll) return;
      var closes = dialogEl.querySelectorAll(
        '.clone2, .cloneImg, .ch7-pass-one-x, .ch7-slot-one-x, .ch7-pass-close-btn, .ch7-pass-close-btn-abs, .ch7-slot-fixed-x, .activity-desc-close, [aria-label="Close"], [aria-label="Fechar"]',
      );
      var kept = 0;
      for (var i = 0; i < closes.length; i++) {
        var el = closes[i];
        // ignore botões de ação (Continuar, Coletar, etc.)
        var t = ((el.innerText || el.textContent || '') + '').trim();
        if (t && t.length > 2 && !/^[×xX✕✖]$/.test(t)) continue;
        if (kept === 0) {
          el.style.setProperty('display', '', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('opacity', '1', 'important');
          kept++;
        } else {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    } catch (e) {}
  }

  function scanPopups(root) {
    root = root || document;
    try {
      var list = root.querySelectorAll ? root.querySelectorAll(POPUP_SEL) : [];
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        var txt = (el.innerText || el.textContent || '').slice(0, 300);
        if (looksEnglishWin(txt)) walkText(el, 0);
        // qualquer dialog de prêmio/vitória/slot
        if (
          looksEnglishWin(txt) ||
          /PARAB[EÉ]NS|VOC[EÊ]\s+GANHOU|SLOT DA SORTE|Ca[cç]a ao Tesouro|B[OÔ]NUS/i.test(txt)
        ) {
          dedupeCloseButtons(el);
        }
      }
    } catch (e) {}
  }

  function maybeOverlay() {
    try {
      var list = document.querySelectorAll(POPUP_SEL + ',div,span,p,h1,h2,h3');
      for (var i = 0; i < Math.min(list.length, 80); i++) {
        var el = list[i];
        var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 12 || t.length > 180) continue;
        if (!/congrats|you.?ve\s+won|you\s+won|respin\s+bonus|free\s*spins?\s+bonus/i.test(t))
          continue;
        if (/PARAB[EÉ]NS|VOC[EÊ]\s+GANHOU/i.test(t)) continue;
        var amt = extractAmount(t) || 'R$';
        showOverlay(amt);
        try {
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        } catch (e) {}
        return;
      }
    } catch (e) {}
  }

  function showOverlay(amountLabel) {
    if (document.getElementById(OVERLAY_ID)) return;
    var el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('translate', 'no');
    el.className = 'notranslate';
    el.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));' +
      'background:rgba(5,4,8,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    el.innerHTML =
      '<div translate="no" class="notranslate ch7-win-card" style="max-width:min(360px,92vw);width:100%;text-align:center;padding:28px 22px 22px;' +
      'border-radius:22px;background:linear-gradient(165deg,rgba(74,44,10,.92) 0%,rgba(26,16,8,.96) 50%,rgba(11,10,9,.98) 100%);' +
      'border:1px solid rgba(246,207,135,.42);box-shadow:0 24px 70px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);' +
      'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">' +
      '<div style="font-size:44px;line-height:1;margin-bottom:10px">🎉</div>' +
      '<h2 style="margin:0 0 10px;font:800 clamp(1.05rem,4.2vw,1.3rem)/1.25 system-ui,sans-serif;color:#ffe566;letter-spacing:.02em">PARABÉNS! VOCÊ GANHOU</h2>' +
      '<p style="margin:0 0 20px;font:700 clamp(.95rem,3.8vw,1.08rem)/1.4 system-ui,sans-serif;color:#fff">' +
      String(amountLabel).replace(/</g, '') +
      ' EM BÔNUS DE RESPIN!</p>' +
      '<button type="button" id="ch7-win-pt-ok" style="width:100%;padding:14px;border:0;border-radius:999px;' +
      'font:800 15px system-ui,sans-serif;cursor:pointer;color:#1a1208;' +
      'background:linear-gradient(180deg,#ffe566,#f0b429 55%,#d4920a);box-shadow:0 10px 24px rgba(240,180,41,.35)">Continuar</button></div>';
    document.body.appendChild(el);
    var btn = document.getElementById('ch7-win-pt-ok');
    if (btn)
      btn.onclick = function () {
        try {
          el.remove();
        } catch (e) {}
      };
    el.addEventListener('click', function (ev) {
      if (ev.target === el) {
        try {
          el.remove();
        } catch (e) {}
      }
    });
    setTimeout(function () {
      try {
        el.remove();
      } catch (e) {}
    }, 8000);
  }

  var busy = false;
  var tmr = null;
  function scheduleScan(reason) {
    if (busy) return;
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      busy = true;
      try {
        lockNoTranslateOnce();
        scanPopups(document);
        maybeOverlay();
      } finally {
        setTimeout(function () {
          busy = false;
        }, 500);
      }
    }, 250);
  }

  function isInterestingMutation(mut) {
    if (!mut) return false;
    if (mut.type === 'characterData') {
      return looksEnglishWin(mut.target && mut.target.nodeValue);
    }
    if (mut.type === 'childList' && mut.addedNodes && mut.addedNodes.length) {
      for (var i = 0; i < mut.addedNodes.length; i++) {
        var n = mut.addedNodes[i];
        if (!n || n.nodeType !== 1) continue;
        var cls = (n.className && String(n.className)) || '';
        var id = n.id || '';
        if (/dialog|award|reward|win|popup|congrat|winning/i.test(cls + ' ' + id)) return true;
        var t = (n.innerText || n.textContent || '').slice(0, 160);
        if (looksEnglishWin(t)) return true;
      }
    }
    return false;
  }

  lockNoTranslateOnce();
  // uma varredura leve no boot (só popups existentes)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scheduleScan('dom');
    });
  } else {
    scheduleScan('boot');
  }
  // 2 rechecks curtos (SPA monta dialogs tarde) — sem loop infinito
  setTimeout(function () {
    scheduleScan('t1s');
  }, 1200);
  setTimeout(function () {
    scheduleScan('t4s');
  }, 4000);

  if (!window.__ch7WinPtMoV4) {
    window.__ch7WinPtMoV4 = 1;
    try {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (isInterestingMutation(muts[i])) {
            scheduleScan('mo');
            return;
          }
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: false, // characterData em massa gerava loop
        attributes: false,
      });
    } catch (e) {}
  }

  // API pública (game-shell / testes)
  window.__ch7TranslateWinPopup = translateWinText;
  window.__ch7ScanWinPopupPt = function () {
    scheduleScan('api');
  };
  window.__ch7LockNoTranslate = lockNoTranslateOnce;
})();
