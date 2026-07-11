/**
 * Banners de bônus no depósito — layout limpo, rem-friendly, sem bagunçar o SPA.
 * v=4 — max 2 cards, mount seguro, só em #/recharge
 */
(function () {
  'use strict';

  var ROOT_ID = 'ch7-deposit-promos';
  var cache = null;
  var cacheAt = 0;
  var mounting = false;

  function isDepositView() {
    var h = String(location.hash || '');
    // só #/recharge (e query), nunca iframe / records / convite
    if (/rechargeIframe|rechargeRecord|invitedRecharge/i.test(h)) return false;
    return /#\/recharge\b/i.test(h);
  }

  function formatBRL(n) {
    try {
      return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return 'R$ ' + n;
    }
  }

  function bonusText(p) {
    if (p.bonusValue == null) return '';
    var base =
      p.bonusType === 'PERCENTAGE' ? p.bonusValue + '%' : formatBRL(p.bonusValue);
    if (p.maxBonusValue != null && Number(p.maxBonusValue) > 0) {
      return base + ' · até ' + formatBRL(p.maxBonusValue);
    }
    return base;
  }

  function findMountPoint() {
    // 1) painel de depósito nativo
    var panels = document.querySelectorAll(
      '.recharge-dialog .q-tab-panel, .recharge-dialog',
    );
    for (var i = 0; i < panels.length; i++) {
      var el = panels[i];
      if (el.offsetParent === null && el.clientHeight === 0) continue;
      // evita aba de retirada
      var t = (el.textContent || '').slice(0, 300);
      if (/Retirada|Saque|withdraw/i.test(t) && !/Dep[oó]sito|PIX|Recarga/i.test(t)) {
        continue;
      }
      return el;
    }
    // 2) fallback: primeiro q-page da rota recharge
    var page = document.querySelector('.recharge-dialog') || document.querySelector('.q-page');
    return page;
  }

  function clearRoot() {
    var existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();
  }

  function placeRoot(root) {
    var mount = findMountPoint();
    if (!mount) return false;
    // logo após o banner de bônus nativo, se existir
    var bonus = mount.querySelector('.bonusContent');
    if (bonus && bonus.parentNode) {
      if (bonus.nextSibling) bonus.parentNode.insertBefore(root, bonus.nextSibling);
      else bonus.parentNode.appendChild(root);
      return true;
    }
    // dentro do tab-panel de depósito (não antes das tabs)
    var panel =
      mount.matches && mount.matches('.q-tab-panel')
        ? mount
        : mount.querySelector('.q-tab-panel');
    var target = panel || mount;
    if (target.firstChild) target.insertBefore(root, target.firstChild);
    else target.appendChild(root);
    return true;
  }

  function render(promos) {
    if (!isDepositView()) {
      clearRoot();
      return;
    }
    if (!promos || !promos.length) {
      clearRoot();
      return;
    }
    if (mounting) return;
    mounting = true;

    try {
      // no máximo 2 cards para não poluir
      promos = promos.slice(0, 2);

      var existing = document.getElementById(ROOT_ID);
      var root = existing || document.createElement('div');
      root.id = ROOT_ID;
      root.setAttribute('role', 'region');
      root.setAttribute('aria-label', 'Promoções de depósito');
      root.innerHTML = '';

      promos.forEach(function (p, idx) {
        var card = document.createElement('div');
        card.className = 'ch7-promo-card ch7-card';
        var html = '';
        if (p.bannerUrl) {
          html +=
            '<img class="ch7-banner" src="' +
            String(p.bannerUrl).replace(/"/g, '&quot;') +
            '" alt="" loading="lazy" decoding="async"/>';
        }
        html += '<div class="ch7-promo-body">';
        html +=
          '<div class="ch7-promo-title">' +
          String(p.title || 'Promoção').replace(/</g, '') +
          '</div>';
        var meta = bonusText(p);
        if (meta) html += '<div class="ch7-promo-meta">Bônus ' + meta + '</div>';
        if (p.minimumRechargeValue) {
          html +=
            '<div class="ch7-promo-meta" style="color:rgba(255,255,255,.55);font-weight:500">Mín. ' +
            formatBRL(p.minimumRechargeValue) +
            '</div>';
        }
        var msg = String(p.message || p.subtitle || '').replace(/</g, '');
        if (msg) {
          html +=
            '<p class="ch7-promo-msg" id="ch7-promo-msg-' + idx + '">' + msg + '</p>';
          html += '<div class="ch7-promo-actions">';
          html +=
            '<button type="button" class="ch7-promo-btn ghost" data-detail="' +
            idx +
            '">Detalhe</button>';
          html += '</div>';
        }
        html += '</div>';
        card.innerHTML = html;
        root.appendChild(card);
      });

      root.onclick = function (e) {
        var btn = e.target.closest('[data-detail]');
        if (!btn) return;
        var id = btn.getAttribute('data-detail');
        var msg = document.getElementById('ch7-promo-msg-' + id);
        if (!msg) return;
        var open = msg.classList.toggle('open');
        btn.textContent = open ? 'Fechar' : 'Detalhe';
      };

      if (!existing || !document.body.contains(existing)) {
        if (!placeRoot(root)) return;
      }
    } finally {
      mounting = false;
    }
  }

  function normalizeList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.list)) return raw.list;
    return [];
  }

  function load() {
    if (!isDepositView()) {
      clearRoot();
      return;
    }
    if (cache && Date.now() - cacheAt < 60000) {
      render(cache);
      return;
    }
    fetch('/painel/api/public/deposit-bonuses', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(function (r) {
        var ct = (r.headers && r.headers.get('content-type')) || '';
        if (!r.ok || !/json/i.test(ct)) return { data: [] };
        return r.json();
      })
      .then(function (j) {
        var list = normalizeList(j && j.data ? j : j);
        // filtra só ativos com banner ou título
        list = list.filter(function (p) {
          return p && (p.bannerUrl || p.title) && p.isActive !== false;
        });
        // normaliza bannerUrl absoluto → relative (anti CORB/timeout prod)
        list = list.map(function (p) {
          if (p && p.bannerUrl) {
            p.bannerUrl = String(p.bannerUrl).replace(
              /^https?:\/\/(www\.)?chinesinha777\.bet(?::\d+)?/i,
              '',
            );
          }
          return p;
        });
        cache = list;
        cacheAt = Date.now();
        render(cache);
      })
      .catch(function () {
        render([]);
      });
  }

  var t = null;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(load, 280);
  }

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  setTimeout(schedule, 600);
  setTimeout(schedule, 1600);

  if (typeof MutationObserver !== 'undefined' && !window.__ch7DepBonusMo) {
    window.__ch7DepBonusMo = 1;
    var moBusy = false;
    var mo = new MutationObserver(function () {
      if (moBusy || !isDepositView() || document.getElementById(ROOT_ID)) return;
      moBusy = true;
      schedule();
      setTimeout(function () {
        moBusy = false;
      }, 400);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7DepositPromos = { reload: load };
})();
