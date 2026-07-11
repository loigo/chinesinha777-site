/**
 * Bridge silencioso — sem botão "Jogos RG".
 * - saldo teste
 * - FORÇA capas personalizadas no DOM (customImage nunca sobrescrita)
 */
(function () {
  'use strict';

  const HC = 100;
  const state = { user: null, covers: [] };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function normalizeCode(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function findCustomForImg(img) {
    const covers = state.covers || [];
    if (!covers.length) return null;

    const alt = normalizeName(img.alt || img.title || '');
    const dataCode = normalizeCode(
      img.getAttribute('data-game-code') ||
        img.getAttribute('data-gameid') ||
        img.dataset?.gameCode ||
        '',
    );

    // já é custom? não mexer
    if (img.dataset.rgCustom === '1' && img.src) {
      const stillCustom = covers.some((c) => c.customImage && img.src.includes(c.customImage.split('/').pop()));
      if (stillCustom || img.dataset.rgCustomLock === '1') return null;
    }

    if (dataCode) {
      const byCode = covers.find((c) => c.customImage && normalizeCode(c.gameCode) === dataCode);
      if (byCode) return byCode.customImage;
    }

    if (alt) {
      const byName = covers.find((c) => c.customImage && normalizeName(c.name) === alt);
      if (byName) return byName.customImage;
      const byPartial = covers.find((c) => {
        if (!c.customImage || !c.name) return false;
        const n = normalizeName(c.name);
        if (!n || n.length < 4) return false;
        return alt === n || alt.startsWith(n + ' ') || n.startsWith(alt + ' ') || alt.includes(n) || n.includes(alt);
      });
      if (byPartial) return byPartial.customImage;
    }

    // parent card text
    const card = img.closest('.gameImgBox, .rg-card, [class*="game"]');
    if (card) {
      const text = normalizeName(card.textContent || '');
      const hit = covers.find((c) => {
        const n = normalizeName(c.name);
        return n && text.includes(n) && c.customImage;
      });
      if (hit) return hit.customImage;
    }

    return null;
  }

  async function api(path, opts) {
    const res = await fetch(path, {
      ...opts,
      headers: {
        Accept: 'application/json',
        ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts?.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  }

  function findUserStore() {
    try {
      const app = document.querySelector('#q-app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      if (!pinia?.state?.value?.user) return null;
      if (pinia._s?.get) return pinia._s.get('user');
      const userState = pinia.state.value.user;
      return {
        walletInfo: userState.walletInfo,
        profileInfo: userState.profileInfo,
        setWalletData(data) {
          if (userState.walletInfo) {
            userState.walletInfo.cash = data.Cash;
            userState.walletInfo.withdrawCash = data.WithdrawCash ?? data.Cash;
          }
        },
      };
    } catch {
      return null;
    }
  }

  function injectNativeWallet(reais) {
    const cents = Math.round(Number(reais) * HC);
    if (!Number.isFinite(cents) || cents < 0) return;
    try {
      const store = findUserStore();
      if (store?.setWalletData) {
        store.setWalletData({
          Cash: cents,
          Bonus: 0,
          WithdrawCash: cents,
          WithdrawBonus: 0,
          BonusResource: 0,
          MiniWithdrawAmount: 0,
        });
      } else if (store?.walletInfo) {
        store.walletInfo.cash = cents;
        store.walletInfo.withdrawCash = cents;
      }
      if (store?.profileInfo) {
        store.profileInfo.Recharge = Math.max(Number(store.profileInfo.Recharge) || 0, cents);
        store.profileInfo.DayRecharge = Math.max(Number(store.profileInfo.DayRecharge) || 0, cents);
      }
    } catch {
      /* ignore */
    }
    localStorage.setItem('rg_user_balance', String(reais));
  }

  async function loadTestUser() {
    try {
      const data = await api('/api/test-user');
      if (data.user) {
        state.user = data.user;
        localStorage.setItem('rg_user_code', data.user.userCode);
        localStorage.setItem('rg_user_balance', String(data.user.balance));
        injectNativeWallet(data.user.balance);
      }
    } catch (e) {
      console.warn('[rg-bridge] test-user', e);
    }
  }

  /**
   * Força capas custom no DOM.
   * - Se achar custom para o jogo → seta src e LOCK (nunca volta para provider)
   * - Nunca remove customImage já aplicada
   */
  function applyCustomCoversToDom() {
    if (!state.covers.length) return;
    document.querySelectorAll('img').forEach((img) => {
      // lock: já custom do usuário — nunca sobrescrever com provider
      if (img.dataset.rgCustomLock === '1') return;

      const custom = findCustomForImg(img);
      if (!custom) return;

      // se já é a custom, só trava
      if (img.src === custom || img.getAttribute('src') === custom) {
        img.dataset.rgCustom = '1';
        img.dataset.rgCustomLock = '1';
        return;
      }

      // lazy load do SPA usa data-src
      if (img.dataset.src && !/^https?:/i.test(img.dataset.src) === false) {
        /* keep */
      }
      img.dataset.src = custom;
      img.src = custom;
      img.dataset.rgCustom = '1';
      img.dataset.rgCustomLock = '1';
      // parent gameImgBox data-src (GameImg Vue)
      const box = img.closest('.gameImgBox');
      if (box) {
        box.setAttribute('data-src', custom);
        box.dataset.rgCustomLock = '1';
      }
    });
  }

  async function patchNativeCovers() {
    try {
      const coversData = await api('/api/covers');
      state.covers = (coversData.covers || []).filter((c) => c && c.customImage);
      if (!state.covers.length) return;

      applyCustomCoversToDom();
      const mo = new MutationObserver(() => {
        // não reverter locks
        applyCustomCoversToDom();
      });
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src'],
      });
      // reaplicar várias vezes (SPA re-render)
      setTimeout(applyCustomCoversToDom, 500);
      setTimeout(applyCustomCoversToDom, 1500);
      setTimeout(applyCustomCoversToDom, 4000);
      setInterval(applyCustomCoversToDom, 8000);
    } catch (e) {
      console.warn('[rg-bridge] covers', e);
    }
  }

  function removeLegacyUi() {
    document.querySelectorAll('#rg-fab, #rg-panel').forEach((n) => n.remove());
  }

  function startWalletKeeper() {
    const tick = () => {
      const bal = Number(localStorage.getItem('rg_user_balance') || state.user?.balance || 0);
      if (bal > 0) injectNativeWallet(bal);
      removeLegacyUi();
    };
    tick();
    setInterval(tick, 3000);
  }

  function boot() {
    if (!document.body) return setTimeout(boot, 50);
    removeLegacyUi();
    loadTestUser().then(() => {
      patchNativeCovers();
      startWalletKeeper();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
