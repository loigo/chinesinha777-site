/**
 * Loja de Convite — reforça #/invited com regras admin + grade de baús configurável.
 * O SPA nativo já renderiza Meu link, shares, stats e AwardCollection.
 * Este inject:
 *  1) atualiza "Regras da atividade" com texto do admin
 *  2) se a grade hardcoded divergir, injeta overlay de baús com valores do admin
 */
(function () {
  'use strict';

  var STYLE_ID = 'ch7-invite-style';
  var RULES_ID = 'ch7-invite-rules';
  var cache = null;
  var cacheAt = 0;

  function isInviteRoute() {
    var h = String(location.hash || '');
    return /#\/?invited\b/i.test(h) || /#\/?convite\b/i.test(h);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#' +
      RULES_ID +
      '{margin:12px 14px 24px;padding:14px 16px;border-radius:14px;' +
      'background:linear-gradient(180deg,#2a1a0c,#14100c);border:1px solid rgba(246,207,135,.22);' +
      'color:rgba(255,245,220,.78);font:400 12px/1.55 system-ui,sans-serif;}' +
      '#' +
      RULES_ID +
      ' .t{font:800 13px/1.2 system-ui,sans-serif;color:#f6cf87;margin:0 0 10px;}' +
      '#' +
      RULES_ID +
      ' p{margin:0 0 8px;white-space:pre-wrap;}' +
      '#ch7-invite-tiers{margin:8px 12px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}' +
      '#ch7-invite-tiers .tier{border-radius:12px;padding:10px 6px;text-align:center;' +
      'background:linear-gradient(180deg,#3a2410,#1a1208);border:1px solid rgba(246,207,135,.28);}' +
      '#ch7-invite-tiers .tier .p{font:800 10px/1 system-ui;color:#f6cf87;}' +
      '#ch7-invite-tiers .tier .chest{font-size:22px;margin:6px 0;}' +
      '#ch7-invite-tiers .tier .m{font:800 12px/1 system-ui;color:#ffe566;}' +
      '#ch7-invite-tiers .tier.done{opacity:.55;filter:grayscale(.2);}' +
      '@media(max-width:420px){#ch7-invite-tiers{grid-template-columns:repeat(3,1fr);}}';
    document.head.appendChild(s);
  }

  function fetchConfig() {
    if (cache && Date.now() - cacheAt < 45000) return Promise.resolve(cache);
    return fetch('/gofun/v2/share/invite/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: '{}',
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (j && j.code === 0 && j.data) {
          cache = j.data;
          cacheAt = Date.now();
          return cache;
        }
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  function mountRules(data) {
    if (!data || !data.RulesText) return;
    var host =
      document.querySelector('.bottom-container') ||
      document.querySelector('.invitedPage') ||
      document.querySelector('.invitedBox');
    if (!host) return;

    // esconde descrição hardcoded se existir
    try {
      var boxes = document.querySelectorAll('.bottom-container .box-description, .bottom-container .box-title');
      for (var i = 0; i < boxes.length; i++) boxes[i].style.display = 'none';
    } catch (e) {}

    var el = document.getElementById(RULES_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = RULES_ID;
      var bottom = document.querySelector('.bottom-container');
      if (bottom && bottom.parentNode) bottom.parentNode.insertBefore(el, bottom.nextSibling);
      else host.appendChild(el);
    }
    var title = data.Title || 'Regras da atividade';
    el.innerHTML =
      '<div class="t">' +
      escapeHtml(title) +
      ' — Regras</div><p>' +
      escapeHtml(data.RulesText) +
      '</p>';
  }

  function mountTiers(data) {
    var tiers = data && data.Tiers;
    if (!Array.isArray(tiers) || !tiers.length) return;
    var page = document.querySelector('.invitedPage') || document.querySelector('.invitedBox');
    if (!page) return;

    // se AwardCollection nativo já existe e tiers batem no default, não força overlay
    var el = document.getElementById('ch7-invite-tiers');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ch7-invite-tiers';
      var stats = page.querySelector('.stats-container') || page.querySelector('.invitedBox');
      if (stats && stats.parentNode) {
        // após stats / earnings
        var insertAfter = stats.nextSibling;
        stats.parentNode.insertBefore(el, insertAfter);
      } else {
        page.appendChild(el);
      }
    }

    var count = Number(data.InvalidInvites || 0);
    el.innerHTML = tiers
      .slice(0, 24)
      .map(function (t) {
        var people = Number(t.Count || 0);
        var reward = Number(t.Reward || 0) / 100;
        var done = count >= people;
        return (
          '<div class="tier' +
          (done ? ' done' : '') +
          '"><div class="p">' +
          people +
          ' pess.</div><div class="chest">🎁</div><div class="m">R$ ' +
          reward.toFixed(0) +
          '</div></div>'
        );
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function run() {
    if (!isInviteRoute()) return;
    ensureStyle();
    fetchConfig().then(function (data) {
      if (!data) return;
      mountRules(data);
      mountTiers(data);
    });
  }

  var t = null;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(run, 350);
  }

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  // SPA demora a montar
  setTimeout(schedule, 800);
  setTimeout(schedule, 2000);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7InviteMo) {
    window.__ch7InviteMo = 1;
    var mo = new MutationObserver(function () {
      if (isInviteRoute()) schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7Invite = { reload: run };
})();
