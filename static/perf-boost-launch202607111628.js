/**
 * Performance boost — lazy images, CLS shell, preconnect, SW register.
 * Carrega após first paint (defer).
 */
(function () {
  'use strict';

  // ── 1) Lazy-load + async decode para imagens dinâmicas do SPA ──
  function enhanceImg(img) {
    if (!img || img.dataset.perfDone) return;
    img.dataset.perfDone = '1';
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    // evita layout shift se já tiver dimensões CSS
    if (!img.hasAttribute('fetchpriority') && img.closest && img.closest('.q-carousel, .banner, .swiper-slide-active')) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
  }

  function scan(root) {
    (root || document).querySelectorAll?.('img').forEach(enhanceImg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scan(document);
    });
  } else {
    scan(document);
  }

  // MutationObserver — SPA injeta capas de jogos depois
  try {
    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') enhanceImg(n);
          else if (n.querySelectorAll) scan(n);
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {
    /* ignore */
  }

  // ── 2) Prefetch firstpage em idle (aquece cache do SW / browser) ──
  function warmFirstpage() {
    if (!window.fetch || !window.crypto) return;
    // o SPA já chama firstpage; só damos hint de prioridade baixa
    try {
      if (navigator.connection && navigator.connection.saveData) return;
    } catch (e) {}
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warmFirstpage, { timeout: 3000 });
  } else {
    setTimeout(warmFirstpage, 2000);
  }

  // ── 3) Service Worker: só limpar (NÃO registrar — evita scope errors em prod/estático) ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      if (window.__ch7SwClean) return;
      window.__ch7SwClean = 1;
      try {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) {
            try {
              r.unregister();
            } catch (e) {}
          });
        });
      } catch (e) {}
      if (window.caches && caches.keys) {
        caches.keys().then(function (keys) {
          keys.forEach(function (k) {
            caches.delete(k).catch(function () {});
          });
        }).catch(function () {});
      }
    });
  }

  // ── 4) Reduz jank de scroll em listas de jogos ──
  try {
    document.documentElement.style.scrollBehavior = 'auto';
  } catch (e) {}
})();
