/**
 * Banners de bônus no depósito — layout limpo.
 * v5 — sem /painel em produção estática (evita 404 no console).
 * Fontes: /static/deposit-bonuses.json → Edge gofun shop/info → fallback vazio silencioso.
 */
(function () {
  'use strict';
  if (window.__ch7DepositBonusV5) return;
  window.__ch7DepositBonusV5 = 1;

  var ROOT_ID = 'ch7-deposit-promos';
  var cache = null;
  var cacheAt = 0;
  var mounting = false;
  var EDGE =
    (window.__CH7_GOFUN_EDGE__ ||
      'https://csdzxeohpgnvvewnwxod.supabase.co/functions/v1/gofun') + '';

  function isStaticProd() {
    var h = location.hostname || '';
    return (
      h === 'chinesinha777.bet' ||
      h === 'www.chinesinha777.bet' ||
      /\.github\.io$/i.test(h)
    );
  }

  function isDepositView() {
    var h = String(location.hash || '');
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
    var panels = document.querySelectorAll(
      '.recharge-dialog .q-tab-panel, .recharge-dialog',
    );
    for (var i = 0; i < panels.length; i++) {
      var el = panels[i];
      if (el.offsetParent === null && el.clientHeight === 0) continue;
      var t = (el.textContent || '').slice(0, 300);
      if (/Retirada|Saque|withdraw/i.test(t) && !/Dep[oó]sito|PIX|Recarga/i.test(t)) {
        continue;
      }
      return el;
    }
    return document.querySelector('.recharge-dialog') || document.querySelector('.q-page');
  }

  function clearRoot() {
    var existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();
  }

  function placeRoot(root) {
    var mount = findMountPoint();
    if (!mount) return false;
    var bonus = mount.querySelector('.bonusContent');
    if (bonus && bonus.parentNode) {
      if (bonus.nextSibling) bonus.parentNode.insertBefore(root, bonus.nextSibling);
      else bonus.parentNode.appendChild(root);
      return true;
    }
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
        var msgEl = document.getElementById('ch7-promo-msg-' + id);
        if (!msgEl) return;
        var open = msgEl.classList.toggle('open');
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
    if (raw.data && Array.isArray(raw.data.promoBanners)) return raw.data.promoBanners;
    if (raw.data && Array.isArray(raw.data.depositPromos)) return raw.data.depositPromos;
    return [];
  }

  function cleanList(list) {
    list = (list || []).filter(function (p) {
      return p && (p.bannerUrl || p.title) && p.isActive !== false;
    });
    return list.map(function (p) {
      if (p && p.bannerUrl) {
        p.bannerUrl = String(p.bannerUrl).replace(
          /^https?:\/\/(www\.)?chinesinha777\.bet(?::\d+)?/i,
          '',
        );
      }
      return p;
    });
  }

  /** Fetch silencioso — nunca deixa 404 barulhento no console se evitável. */
  function quietFetchJson(url) {
    return fetch(url, {
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(function (r) {
        if (!r.ok) return null;
        var ct = (r.headers && r.headers.get('content-type')) || '';
        if (!/json/i.test(ct) && !/text\/plain/i.test(ct)) return null;
        return r.json().catch(function () {
          return null;
        });
      })
      .catch(function () {
        return null;
      });
  }

  function loadUrls() {
    // Nunca chamar /painel em produção (404 + ruído no console).
    // Só JSON estático; fallback Edge em loadFromGofunShop().
    return [location.origin + '/static/deposit-bonuses.json'];
  }

  function loadFromGofunShop() {
    if (!EDGE) return Promise.resolve([]);
    var ANON =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
    return fetch(EDGE + '/v2/shop/info', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-plain-json': '1',
        apikey: ANON,
        Authorization: 'Bearer ' + ANON,
      },
      body: '{}',
    })
      .then(function (r) {
        if (!r.ok) return [];
        return r.json();
      })
      .then(function (j) {
        var d = (j && j.data) || {};
        var list = d.promoBanners || d.depositPromos || [];
        return Array.isArray(list) ? list : [];
      })
      .catch(function () {
        return [];
      });
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

    var urls = loadUrls();
    var chain = Promise.resolve(null);
    urls.forEach(function (url) {
      chain = chain.then(function (prev) {
        if (prev && normalizeList(prev).length) return prev;
        return quietFetchJson(url);
      });
    });

    chain
      .then(function (j) {
        var list = cleanList(normalizeList(j));
        if (list.length) return list;
        return loadFromGofunShop().then(cleanList);
      })
      .then(function (list) {
        cache = list || [];
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
