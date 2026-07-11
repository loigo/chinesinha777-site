/**
 * Check-in / Caça ao Tesouro — alinhado ao SPA original (banana_man).
 *
 * NÃO substitui a UI nativa (#/signIn = PassCom + QiandaoCom + DailyTasks).
 * Apenas:
 *  - botão flutuante que abre #/signIn (UI original do bundle)
 *  - garante assets CDN okx007 (fallback local se falhar)
 *  - atalho de debug window.__ch7Checkin
 */
(function () {
  'use strict';

  var FAB_ID = 'ch7-checkin-fab';
  var STYLE_ID = 'ch7-checkin-native-style';
  var CDN = 'https://www.okx007.com/res/banana_man/assets/';
  var LOCAL = '/static/checkin/';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    /* Stack flutuante direita:
       - Alinha ao shell 461px no desktop (não no canto da janela)
       - Fica ABAIXO do WhatsApp (bottom menor que o WA típico ~100–130px)
       - Mesmo tamanho dos floats (~48px) + pulse suave
    */
    s.textContent =
      '#' +
      FAB_ID +
      '{position:fixed!important;z-index:99940!important;' +
      'width:48px!important;height:48px!important;border-radius:50%!important;' +
      'border:2px solid rgba(246,207,135,.6)!important;padding:0!important;cursor:pointer!important;' +
      'background:radial-gradient(circle at 35% 28%,#6b4218 0%,#2a1608 55%,#120a04 100%)!important;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 0 1px rgba(246,207,135,.12)!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      /* mobile: colado na pilha direita, logo abaixo do WA */
      'right:12px!important;' +
      'bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;' +
      'animation:ch7CrownPulse 1.7s ease-in-out infinite!important;' +
      'transform-origin:center center!important;-webkit-tap-highlight-color:transparent!important;}' +
      '#' +
      FAB_ID +
      ' img{width:30px!important;height:30px!important;object-fit:contain!important;pointer-events:none!important;display:block!important;}' +
      '#' +
      FAB_ID +
      ':active{transform:scale(.94)!important;animation:none!important;}' +
      '#' +
      FAB_ID +
      ':hover{border-color:rgba(255,225,60,.85)!important;}' +
      '@keyframes ch7CrownPulse{' +
      '0%,100%{transform:translateY(0) scale(1);box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 0 0 rgba(246,207,135,.35)}' +
      '50%{transform:translateY(-3px) scale(1.06);box-shadow:0 8px 20px rgba(0,0,0,.45),0 0 0 8px rgba(246,207,135,0)}' +
      '}' +
      /* Desktop: shell centralizado 461px — cola no canto do shell, não da tela */
      '@media (min-width:480px){' +
      '#' +
      FAB_ID +
      '{right:max(12px,calc((100vw - 461px)/2 + 10px))!important;' +
      'bottom:calc(86px + env(safe-area-inset-bottom,0px))!important;' +
      'width:50px!important;height:50px!important;}' +
      '#' +
      FAB_ID +
      ' img{width:32px!important;height:32px!important;}' +
      '}' +
      '@media (max-width:360px){' +
      '#' +
      FAB_ID +
      '{width:44px!important;height:44px!important;right:10px!important;' +
      'bottom:calc(70px + env(safe-area-inset-bottom,0px))!important;}' +
      '#' +
      FAB_ID +
      ' img{width:28px!important;height:28px!important;}' +
      '}' +
      /* esconde FAB na própria página de check-in */
      'body.ch7-on-signin #' +
      FAB_ID +
      '{display:none!important;}';
    document.head.appendChild(s);
  }

  /** Cola a coroa logo abaixo do float mais baixo à direita (WhatsApp etc.) */
  function snapFabToStack() {
    try {
      var fab = document.getElementById(FAB_ID);
      if (!fab || isSignInRoute()) return;
      var vw = window.innerWidth || 0;
      var vh = window.innerHeight || 0;
      var best = null;
      var nodes = document.querySelectorAll('a,button,div,img,span');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || el === fab || el.id === FAB_ID) continue;
        if (el.closest && el.closest('#' + FAB_ID)) continue;
        var st = window.getComputedStyle(el);
        if (st.position !== 'fixed' && st.position !== 'sticky') continue;
        if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0')
          continue;
        var r = el.getBoundingClientRect();
        if (r.width < 28 || r.width > 72 || r.height < 28 || r.height > 72) continue;
        // lado direito da tela / shell
        if (r.right < vw - 100) continue;
        if (r.bottom < vh - 220 || r.top > vh - 40) continue;
        // preferir o mais baixo (mais perto do rodapé) — WhatsApp costuma ser o de cima da pilha
        if (!best || r.bottom > best.bottom) best = r;
      }
      if (!best) return;
      // posiciona logo ABAIXO do botão encontrado (gap 8px)
      var gap = 8;
      var fabH = fab.offsetHeight || 48;
      var bottomPx = Math.max(12, vh - best.bottom - gap - fabH);
      // se o alvo já está baixo demais, coloca logo abaixo com gap
      // best is higher on screen → we want fab under it → smaller bottom than (vh-best.bottom)
      // Under WhatsApp: fab.top = best.bottom + gap → bottom = vh - (best.bottom + gap + fabH)
      bottomPx = Math.round(vh - best.bottom - gap - fabH);
      if (bottomPx < 56) bottomPx = 56; // não entrar no bottom nav
      if (bottomPx > vh * 0.45) return; // algo estranho, mantém CSS
      fab.style.setProperty('bottom', bottomPx + 'px', 'important');
      // alinha right com o stack
      var rightPx = Math.max(8, Math.round(vw - best.right));
      fab.style.setProperty('right', rightPx + 'px', 'important');
    } catch (e) {}
  }

  function isSignInRoute() {
    return /#\/?signIn\b/i.test(String(location.hash || ''));
  }

  function syncBodyClass() {
    try {
      document.body.classList.toggle('ch7-on-signin', isSignInRoute());
    } catch (e) {}
  }

  function openNative() {
    // UI 100% original do bundle banana_man
    location.hash = '#/signIn';
  }

  function ensureFab() {
    ensureStyle();
    syncBodyClass();
    var fab = document.getElementById(FAB_ID);
    if (!fab) {
      fab = document.createElement('button');
      fab.id = FAB_ID;
      fab.type = 'button';
      fab.title = 'Check-in / Caça ao Tesouro';
      fab.setAttribute('aria-label', 'Check-in diário');
      var img = document.createElement('img');
      img.alt = 'Check-in';
      img.src = CDN + 'qiandao7.png';
      img.onerror = function () {
        img.onerror = null;
        img.src = LOCAL + 'qiandao7.png';
      };
      fab.appendChild(img);
      fab.addEventListener('click', function (e) {
        e.preventDefault();
        openNative();
      });
      document.body.appendChild(fab);
    }
    // reposiciona após floats nativos/WhatsApp montarem
    setTimeout(snapFabToStack, 400);
    setTimeout(snapFabToStack, 1200);
    setTimeout(snapFabToStack, 2500);
  }

  /**
   * Se imagens do CDN falharem no SPA, troca src para /static/checkin/*
   * (cópia local dos assets banana_man).
   */
  function patchBrokenAssets() {
    var map = {
      img590: 'img590.png',
      qiandaoCom2: 'qiandaoCom2.png',
      qiandaoCom2Big: 'qiandaoCom2Big.png',
      goldCoins: 'goldCoins.png',
      bigGold: 'bigGold.png',
      qiandao7: 'qiandao7.png',
      qiandao7BgGuang: 'qiandao7BgGuang.png',
      img902: 'img902.png',
      passComBg: 'passComBg.png',
      toPassBtnBg: 'toPassBtnBg.png',
      popupBoxClose: 'popupBoxClose.png',
      popupBoxHelp: 'popupBoxHelp.png',
    };
    document.addEventListener(
      'error',
      function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'IMG') return;
        var src = String(t.currentSrc || t.src || '');
        if (!src || t.dataset.ch7AssetFixed) return;
        for (var key in map) {
          if (src.indexOf(key) >= 0 || src.indexOf(map[key]) >= 0) {
            t.dataset.ch7AssetFixed = '1';
            t.src = LOCAL + map[key];
            break;
          }
        }
      },
      true,
    );
  }

  window.addEventListener('hashchange', function () {
    syncBodyClass();
    setTimeout(snapFabToStack, 300);
  });
  window.addEventListener('popstate', function () {
    syncBodyClass();
    setTimeout(snapFabToStack, 300);
  });
  window.addEventListener(
    'resize',
    function () {
      setTimeout(snapFabToStack, 100);
    },
    { passive: true },
  );

  function boot() {
    ensureFab();
    patchBrokenAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.__ch7Checkin = {
    open: openNative,
    route: function () {
      return isSignInRoute();
    },
    snap: snapFabToStack,
  };
})();
