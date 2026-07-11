/**
 * Traduz popups de vitória / free spin / respin para pt-BR.
 * Mantém layout e moedas; só reescreve text nodes em inglês.
 */
(function () {
  'use strict';
  if (window.__ch7WinPopupPtV1) return;
  window.__ch7WinPopupPtV1 = 1;

  function translateText(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var t = raw;
    var orig = t;

    // Frase completa: CONGRATS YOU'VE WON R$ 5 IN RESPIN BONUS!
    t = t.replace(
      /congrats!?[\s,]*you(?:'ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'PARABÉNS! VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(
      /you(?:'ve| have)\s+won\s+(R\$\s*[\d.,]+)\s+in\s+respin\s+bonus!?/gi,
      'VOCÊ GANHOU $1 EM BÔNUS DE RESPIN!',
    );
    t = t.replace(/\bin\s+respin\s+bonus!?\b/gi, 'EM BÔNUS DE RESPIN!');
    t = t.replace(/\brespin\s+bonus!?\b/gi, 'BÔNUS DE RESPIN!');
    t = t.replace(/\bcongrats!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\bcongratulations!?\b/gi, 'PARABÉNS!');
    t = t.replace(/\byou(?:'ve| have)\s+won\b/gi, 'VOCÊ GANHOU');
    t = t.replace(/\byou\s+won\b/gi, 'VOCÊ GANHOU');

    // Normalizar espaços
    t = t.replace(/[ \t]{2,}/g, ' ').replace(/\s+\n/g, '\n').trim();
    if (t === orig.trim()) return null;
    return t;
  }

  function walk(node) {
    if (!node) return;
    // não mexer em script/style/input
    if (node.nodeType === 1) {
      var tag = (node.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return;
      // atributos title/aria
      if (node.hasAttribute && node.hasAttribute('title')) {
        var tt = translateText(node.getAttribute('title'));
        if (tt) node.setAttribute('title', tt);
      }
      var ch = node.childNodes;
      for (var i = 0; i < ch.length; i++) walk(ch[i]);
      return;
    }
    if (node.nodeType === 3) {
      var parent = node.parentElement;
      if (parent) {
        var ptag = (parent.tagName || '').toUpperCase();
        if (ptag === 'SCRIPT' || ptag === 'STYLE') return;
      }
      var val = node.nodeValue;
      if (!val || !/[A-Za-z]/.test(val)) return;
      // só se parecer inglês de vitória
      if (!/congrat|you.?ve\s+won|you\s+won|respin\s*bonus|in\s+respin/i.test(val)) return;
      var tr = translateText(val);
      if (tr && tr !== val) node.nodeValue = tr;
    }
  }

  function scan() {
    try {
      walk(document.body);
      // q-dialog overlays
      document.querySelectorAll('.q-dialog, .q-dialog__inner, [class*="dialog"], [class*="Dialog"], [class*="Award"], [class*="reward"]').forEach(function (el) {
        walk(el);
      });
    } catch (e) {}
  }

  // Observa DOM
  var tmr = null;
  function schedule() {
    clearTimeout(tmr);
    tmr = setTimeout(scan, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  setTimeout(scan, 400);
  setTimeout(scan, 1200);
  setInterval(scan, 2000);

  if (!window.__ch7WinPtMo) {
    window.__ch7WinPtMo = 1;
    try {
      var mo = new MutationObserver(schedule);
      mo.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } catch (e) {}
  }

  window.__ch7TranslateWinPopup = translateText;
})();
