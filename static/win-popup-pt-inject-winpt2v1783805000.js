/**
 * Tradução agressiva de popup de vitória / RESPIN / free spin → pt-BR.
 * - Parent document
 * - iframes same-origin (game-shell)
 * - Overlay se detectar texto EN em container de prêmio
 */
(function () {
  'use strict';
  if (window.__ch7WinPopupPtV2) return;
  window.__ch7WinPopupPtV2 = 1;

  var OVERLAY_ID = 'ch7-win-pt-overlay';

  function translateText(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var t = raw;
    var orig = t;

    // Frase completa (várias grafias)
    t = t.replace(
      /congrats!?[\s,!.]*you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'PARABÉNS! VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(
      /you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(
      /congrats!?[\s,!.]*you(?:'ve|’ve| have)\s+won\s+(R\$\s*[\d.,]+)/gi,
      'PARABÉNS! VOCÊ GANHOU $1',
    );
    t = t.replace(/\bin\s+respin\s+bonus!?\b/gi, 'EM BÔNUS DE RESPIN!');
    t = t.replace(/\brespin\s+bonus!?\b/gi, 'BÔNUS DE RESPIN!');
    t = t.replace(/\bcongrats!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\bcongratulations!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\byou(?:'ve|’ve| have)\s+won\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/\byou\s+won\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/[ \t]{2,}/g, ' ').replace(/\s+\n/g, '\n').trim();
    if (t === orig.trim()) return null;
    return t;
  }

  function looksEnglishWin(s) {
    return /congrat|you.?ve\s+won|you\s+won|respin\s*bonus|in\s+respin|you.?ve\s+won/i.test(
      String(s || ''),
    );
  }

  function extractAmount(s) {
    var m = String(s || '').match(/R\$\s*[\d.,]+/);
    return m ? m[0] : '';
  }

  function walk(node, depth) {
    if (!node || depth > 40) return;
    if (node.nodeType === 1) {
      var tag = (node.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SVG')
        return;
      if (node.hasAttribute && node.hasAttribute('title')) {
        var tt = translateText(node.getAttribute('title'));
        if (tt) node.setAttribute('title', tt);
      }
      // data-text used by some dialogs
      if (node.hasAttribute && node.hasAttribute('data-text')) {
        var dt = translateText(node.getAttribute('data-text'));
        if (dt) node.setAttribute('data-text', dt);
      }
      var ch = node.childNodes;
      for (var i = 0; i < ch.length; i++) walk(ch[i], depth + 1);
      return;
    }
    if (node.nodeType === 3) {
      var val = node.nodeValue;
      if (!val || !/[A-Za-z]/.test(val)) return;
      if (!looksEnglishWin(val)) return;
      var tr = translateText(val);
      if (tr && tr !== val) {
        node.nodeValue = tr;
        return;
      }
      // fallback: replace whole win phrase context
      if (/congrats|respin/i.test(val) && /won|bonus/i.test(val)) {
        var amt = extractAmount(val);
        node.nodeValue = amt
          ? 'PARABÉNS! VOCÊ GANHOU ' + amt + ' EM BÔNUS DE RESPIN!'
          : 'PARABÉNS! VOCÊ GANHOU EM BÔNUS DE RESPIN!';
      }
    }
  }

  function scanDoc(doc) {
    if (!doc || !doc.body) return;
    try {
      walk(doc.body, 0);
      // containers típicos
      var sels =
        '.q-dialog,.q-dialog__inner,[class*="dialog"],[class*="Dialog"],[class*="Award"],[class*="reward"],[class*="popup"],[class*="Popup"],[class*="win"],[class*="Win"],[class*="bonus"],[class*="Bonus"]';
      try {
        doc.querySelectorAll(sels).forEach(function (el) {
          walk(el, 0);
        });
      } catch (e) {}
    } catch (e) {}
  }

  function scanIframes() {
    try {
      var list = document.querySelectorAll('iframe');
      for (var i = 0; i < list.length; i++) {
        try {
          var d = list[i].contentDocument || (list[i].contentWindow && list[i].contentWindow.document);
          if (d) {
            scanDoc(d);
            injectIntoDoc(d);
          }
        } catch (e) {
          /* cross-origin */
        }
      }
    } catch (e) {}
  }

  function injectIntoDoc(doc) {
    try {
      if (!doc || !doc.documentElement) return;
      if (doc.documentElement.dataset && doc.documentElement.dataset.ch7WinPt === '1') return;
      if (doc.documentElement.dataset) doc.documentElement.dataset.ch7WinPt = '1';
      // re-run walker periodically inside iframe
      if (!doc.__ch7WinPtTimer) {
        doc.__ch7WinPtTimer = setInterval(function () {
          try {
            scanDoc(doc);
          } catch (e) {}
        }, 800);
      }
    } catch (e) {}
  }

  /** Overlay se ainda restar EN visível em elemento grande */
  function maybeOverlay() {
    try {
      var all = document.querySelectorAll('div,span,p,h1,h2,h3,label');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 10 || t.length > 200) continue;
        if (!/congrats|you.?ve\s+won|respin\s+bonus/i.test(t)) continue;
        // já em PT?
        if (/PARAB[EÉ]NS|VOC[EÊ]\s+GANHOU|B[OÔ]NUS\s+DE\s+RESPIN/i.test(t)) continue;
        var amt = extractAmount(t) || 'R$';
        showOverlay(amt);
        // esconde o EN se possível
        try {
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        } catch (e) {}
        return;
      }
    } catch (e) {}
  }

  function showOverlay(amountLabel) {
    var old = document.getElementById(OVERLAY_ID);
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.setAttribute('role', 'dialog');
    el.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(0,0,0,.55);pointer-events:auto';
    el.innerHTML =
      '<div style="position:relative;max-width:340px;width:100%;text-align:center;padding:28px 20px 22px;' +
      'border-radius:20px;background:radial-gradient(ellipse at 50% 0%,#4a2c0a 0%,#1a1008 55%,#0b0a09 100%);' +
      'border:1px solid rgba(246,207,135,.45);box-shadow:0 20px 60px rgba(0,0,0,.55);overflow:hidden">' +
      '<div class="ch7-win-coins" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>' +
      '<div style="position:relative;z-index:2">' +
      '<div style="font-size:42px;line-height:1;margin-bottom:8px">🎉</div>' +
      '<h2 style="margin:0 0 8px;font:800 1.25rem/1.25 system-ui,sans-serif;color:#ffe566;' +
      'text-shadow:0 2px 12px rgba(240,180,41,.45)">PARABÉNS! VOCÊ GANHOU</h2>' +
      '<p style="margin:0 0 18px;font:700 1.05rem/1.35 system-ui,sans-serif;color:#fff">' +
      String(amountLabel).replace(/</g, '') +
      ' EM BÔNUS DE RESPIN!</p>' +
      '<button type="button" id="ch7-win-pt-ok" style="width:100%;padding:14px;border:0;border-radius:12px;' +
      'font:800 15px system-ui,sans-serif;cursor:pointer;color:#1a1208;' +
      'background:linear-gradient(180deg,#ffe566,#f0b429 55%,#d4920a)">Continuar</button>' +
      '</div></div>';
    document.body.appendChild(el);
    // moedas CSS
    try {
      var box = el.querySelector('.ch7-win-coins');
      for (var i = 0; i < 14; i++) {
        var c = document.createElement('span');
        c.textContent = '🪙';
        c.style.cssText =
          'position:absolute;left:' +
          Math.random() * 100 +
          '%;top:-10%;font-size:' +
          (16 + Math.random() * 14) +
          'px;animation:ch7CoinFall ' +
          (1.8 + Math.random() * 1.6) +
          's linear ' +
          Math.random() * 0.8 +
          's infinite';
        box.appendChild(c);
      }
      if (!document.getElementById('ch7-win-pt-style')) {
        var st = document.createElement('style');
        st.id = 'ch7-win-pt-style';
        st.textContent =
          '@keyframes ch7CoinFall{0%{transform:translateY(0) rotate(0);opacity:1}' +
          '100%{transform:translateY(110vh) rotate(360deg);opacity:.2}}';
        document.head.appendChild(st);
      }
    } catch (e) {}
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
    // auto close
    setTimeout(function () {
      try {
        el.remove();
      } catch (e) {}
    }, 8000);
  }

  function scanAll() {
    scanDoc(document);
    scanIframes();
    maybeOverlay();
  }

  var tmr = null;
  var __ch7WinBusy = false;
  function schedule() {
    if (__ch7WinBusy) return;
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      __ch7WinBusy = true;
      try {
        scanAll();
      } finally {
        setTimeout(function () {
          __ch7WinBusy = false;
        }, 400);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  // sem setInterval contínuo (pesava e gerava loop com MO)
  setTimeout(scanAll, 500);
  setTimeout(scanAll, 2000);
  setTimeout(scanAll, 5000);

  if (!window.__ch7WinPtMo3) {
    window.__ch7WinPtMo3 = 1;
    try {
      new MutationObserver(function (muts) {
        // só se parecer popup/dialog/prêmio
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          var txt = (t && (t.className || t.id || '')) + '';
          if (/dialog|award|reward|win|bonus|popup|congrat/i.test(txt)) {
            schedule();
            return;
          }
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch (e) {}
  }

  // API pública para game-shell embutido
  window.__ch7TranslateWinPopup = translateText;
  window.__ch7ScanWinPopupPt = scanAll;
})();
