/**
 * Esqueci a senha — modal completo, glassmorphism, alinhado ao tema Chinesinha777.
 * v4: layout premium, tipografia clara, desktop + mobile.
 * API: POST /api/auth/forgot-password (local) ou Edge auth-api.
 */
(function () {
  'use strict';
  if (window.__ch7ForgotV5) return;
  window.__ch7ForgotV5 = 1;
  window.__ch7ForgotV4 = 1;
  window.__ch7ForgotV3 = 1;
  window.__ch7ForgotV2 = 1;
  window.__ch7ForgotV1 = 1;

  var EDGE =
    (window.__CH7_AUTH_API__ ||
      'https://vcohnsuomswwfxqlmllm.supabase.co/functions/v1/auth-api') + '';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var MODAL_ID = 'ch7-forgot-modal';
  var STYLE_ID = 'ch7-forgot-style-v5';

  function isLocal() {
    try {
      var h = location.hostname || '';
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    } catch (e) {
      return false;
    }
  }

  function apiBase() {
    if (isLocal()) return location.origin + '/api/auth';
    return EDGE;
  }

  function ensureStyle() {
    try {
      ['ch7-forgot-style', 'ch7-forgot-style-v3', 'ch7-forgot-style-v4'].forEach(function (id) {
        var n = document.getElementById(id);
        if (n) n.remove();
      });
    } catch (e0) {}
    if (document.getElementById(STYLE_ID)) return;

    var s = document.createElement('style');
    s.id = STYLE_ID;
    /* Fontes só em px — SPA usa rem/vw gigante e estourava o título "senha" */
    s.textContent =
      '#' +
      MODAL_ID +
      ',#' +
      MODAL_ID +
      ' *{box-sizing:border-box!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important;' +
      'line-height:1.4!important;letter-spacing:normal!important;text-transform:none!important;}' +
      '#' +
      MODAL_ID +
      '{position:fixed!important;inset:0!important;z-index:100050!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      'padding:16px!important;margin:0!important;width:100vw!important;height:100vh!important;' +
      'max-width:none!important;max-height:none!important;' +
      'background:rgba(6,5,4,.92)!important;' +
      'backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;' +
      'font-size:14px!important;color:#fff!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-card{' +
      'position:relative!important;width:min(400px,calc(100vw - 32px))!important;max-width:400px!important;' +
      'margin:0 auto!important;padding:24px 20px 18px!important;' +
      'border-radius:20px!important;overflow:hidden!important;' +
      'background:linear-gradient(165deg,#2a2118 0%,#16120c 100%)!important;' +
      'border:1px solid rgba(246,207,135,.32)!important;' +
      'box-shadow:0 20px 50px rgba(0,0,0,.55)!important;' +
      'font-size:14px!important;max-height:min(90vh,520px)!important;overflow-y:auto!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-glow{display:none!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-brand{display:flex!important;align-items:center!important;justify-content:center!important;' +
      'gap:8px!important;margin:0 0 14px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-mark{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;' +
      'max-width:32px!important;max-height:32px!important;border-radius:10px!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      'font-size:12px!important;font-weight:900!important;line-height:1!important;color:#1a1208!important;' +
      'background:linear-gradient(145deg,#ffe566,#d4920a)!important;flex:0 0 32px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-brand span{font-size:12px!important;font-weight:800!important;line-height:1!important;' +
      'letter-spacing:.06em!important;color:#f6cf87!important;text-transform:uppercase!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-title,#' +
      MODAL_ID +
      ' #ch7-fg-title,#' +
      MODAL_ID +
      ' h1,#' +
      MODAL_ID +
      ' h2,#' +
      MODAL_ID +
      ' h3{display:block!important;margin:0 0 10px!important;padding:0!important;' +
      'color:#f6cf87!important;font-size:22px!important;font-weight:800!important;line-height:1.25!important;' +
      'text-align:center!important;letter-spacing:0!important;text-transform:none!important;' +
      'white-space:normal!important;word-break:normal!important;overflow:visible!important;' +
      'max-width:100%!important;width:100%!important;height:auto!important;min-height:0!important;' +
      'transform:none!important;scale:1!important;zoom:1!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-sub{display:block!important;margin:0 0 18px!important;padding:0 4px!important;' +
      'color:#b8b0a4!important;font-size:13px!important;font-weight:500!important;line-height:1.5!important;' +
      'text-align:center!important;max-width:100%!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-label{display:block!important;margin:0 0 6px!important;font-size:11px!important;' +
      'font-weight:700!important;color:#a89f92!important;letter-spacing:.04em!important;' +
      'text-transform:uppercase!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-field{position:relative!important;margin:0 0 12px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-input,#' +
      MODAL_ID +
      ' input{width:100%!important;height:48px!important;min-height:48px!important;max-height:48px!important;' +
      'padding:0 14px 0 42px!important;margin:0!important;' +
      'border-radius:12px!important;border:1px solid rgba(255,255,255,.12)!important;' +
      'background:rgba(255,255,255,.07)!important;color:#fff!important;' +
      'font-size:15px!important;font-weight:400!important;line-height:1.2!important;outline:0!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-input::placeholder{color:rgba(255,255,255,.4)!important;font-size:14px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-input:focus{border-color:rgba(246,207,135,.55)!important;' +
      'box-shadow:0 0 0 2px rgba(246,207,135,.14)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-ico{position:absolute!important;left:12px!important;top:50%!important;' +
      'transform:translateY(-50%)!important;width:18px!important;height:18px!important;' +
      'opacity:.55!important;pointer-events:none!important;color:#f6cf87!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg{display:none;font-size:12px!important;margin:0 0 10px!important;' +
      'line-height:1.4!important;padding:8px 10px!important;border-radius:10px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.show{display:block!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.ok{background:rgba(74,222,128,.1)!important;color:#86efac!important;' +
      'border:1px solid rgba(74,222,128,.28)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.err{background:rgba(255,120,120,.1)!important;color:#ff9b9b!important;' +
      'border:1px solid rgba(255,120,120,.28)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-actions{display:flex!important;flex-direction:column!important;gap:8px!important;margin-top:2px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-send,#' +
      MODAL_ID +
      ' button.ch7-fg-send{width:100%!important;height:48px!important;padding:0 14px!important;margin:0!important;' +
      'border:0!important;border-radius:12px!important;font-size:15px!important;font-weight:800!important;' +
      'line-height:1!important;cursor:pointer!important;' +
      'background:linear-gradient(180deg,#ffe566,#f0b429 52%,#d4920a)!important;' +
      'color:#1a1208!important;box-shadow:0 8px 18px rgba(240,180,41,.28)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-send:disabled{opacity:.65!important;cursor:wait!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-close,#' +
      MODAL_ID +
      ' button.ch7-fg-close{width:100%!important;height:44px!important;margin:0!important;padding:0 14px!important;' +
      'border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;' +
      'font-size:14px!important;font-weight:700!important;line-height:1!important;cursor:pointer!important;' +
      'background:rgba(255,255,255,.06)!important;color:#fff!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-hint{margin:12px 0 0!important;text-align:center!important;font-size:11px!important;' +
      'color:#7a7368!important;line-height:1.4!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-dev{display:none;margin-top:12px!important;padding:10px!important;border-radius:10px!important;' +
      'background:rgba(246,207,135,.08)!important;border:1px dashed rgba(246,207,135,.3)!important;' +
      'font-size:11px!important;line-height:1.4!important;word-break:break-all!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-dev.show{display:block!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-dev a{color:#f6cf87!important;font-weight:700!important;font-size:11px!important;}' +
      '@media (max-width:400px){#' +
      MODAL_ID +
      '{padding:12px!important;}#' +
      MODAL_ID +
      ' .ch7-fg-card{padding:18px 14px 14px!important;}#' +
      MODAL_ID +
      ' .ch7-fg-title,#' +
      MODAL_ID +
      ' #ch7-fg-title{font-size:20px!important;}}';
    document.head.appendChild(s);
  }

  function closeModal() {
    var el = document.getElementById(MODAL_ID);
    if (el) {
      try {
        el.remove();
      } catch (e) {}
    }
  }

  function openModal(prefill) {
    ensureStyle();
    closeModal();
    var el = document.createElement('div');
    el.id = MODAL_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'ch7-fg-title');
    el.setAttribute('translate', 'no');
    el.className = 'notranslate';
    el.innerHTML =
      '<div class="ch7-fg-card" role="document">' +
      '<div class="ch7-fg-brand" aria-hidden="true">' +
      '<div class="ch7-fg-mark">C7</div><span>Chinesinha777</span></div>' +
      /* div, NÃO h2 — SPA estoura font-size de h1/h2 */
      '<div class="ch7-fg-title" id="ch7-fg-title" role="heading" aria-level="2">Esqueceu a senha?</div>' +
      '<p class="ch7-fg-sub">Informe o e-mail ou telefone da conta. Enviaremos um link válido por 15 minutos.</p>' +
      '<label class="ch7-fg-label" for="ch7-fg-id">E-mail ou telefone</label>' +
      '<div class="ch7-fg-field">' +
      '<svg class="ch7-fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>' +
      '</svg>' +
      '<input class="ch7-fg-input" id="ch7-fg-id" type="text" inputmode="email" autocomplete="username" ' +
      'placeholder="E-mail ou telefone com DDD" maxlength="80"/>' +
      '</div>' +
      '<div class="ch7-fg-msg" id="ch7-fg-msg" role="alert"></div>' +
      '<div class="ch7-fg-actions">' +
      '<button type="button" class="ch7-fg-send" id="ch7-fg-send">Enviar link</button>' +
      '<button type="button" class="ch7-fg-close" id="ch7-fg-close">Voltar ao login</button>' +
      '</div>' +
      '<p class="ch7-fg-hint">Verifique a caixa de entrada e o spam após o envio.</p>' +
      '<div class="ch7-fg-dev" id="ch7-fg-dev"></div>' +
      '</div>';
    document.body.appendChild(el);

    // Inline hard lock (ganha de qualquer CSS do SPA)
    try {
      var titleEl = document.getElementById('ch7-fg-title');
      if (titleEl) {
        titleEl.style.cssText =
          'display:block;margin:0 0 10px;padding:0;color:#f6cf87;font-size:22px;font-weight:800;' +
          'line-height:1.25;text-align:center;letter-spacing:0;text-transform:none;max-width:100%;' +
          'white-space:normal;transform:none;zoom:1;';
      }
      var cardEl = el.querySelector('.ch7-fg-card');
      if (cardEl) {
        cardEl.style.cssText =
          'max-width:400px;width:min(400px,calc(100vw - 32px));margin:0 auto;padding:24px 20px 18px;' +
          'border-radius:20px;font-size:14px;';
      }
    } catch (eLock) {}

    var msg = document.getElementById('ch7-fg-msg');
    var btn = document.getElementById('ch7-fg-send');
    var input = document.getElementById('ch7-fg-id');
    var dev = document.getElementById('ch7-fg-dev');

    if (prefill) input.value = String(prefill);

    function showMsg(text, ok) {
      if (!text) {
        msg.className = 'ch7-fg-msg';
        msg.textContent = '';
        return;
      }
      msg.className = 'ch7-fg-msg show ' + (ok ? 'ok' : 'err');
      msg.textContent = text;
    }

    document.getElementById('ch7-fg-close').onclick = closeModal;
    el.addEventListener('click', function (e) {
      if (e.target === el) closeModal();
    });
    document.addEventListener(
      'keydown',
      function onEsc(ev) {
        if (ev.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', onEsc, true);
        }
      },
      true,
    );

    async function send() {
      var identity = String(input.value || '').trim();
      if (!identity) {
        showMsg('Informe e-mail ou telefone.', false);
        input.focus();
        return;
      }
      var isMail = identity.indexOf('@') >= 0;
      if (isMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)) {
        showMsg('E-mail inválido.', false);
        return;
      }
      if (!isMail) {
        var d = identity.replace(/\D/g, '');
        if (d.length < 10) {
          showMsg('Telefone inválido (use DDD + número).', false);
          return;
        }
      }

      btn.disabled = true;
      btn.textContent = 'Enviando…';
      dev.classList.remove('show');
      dev.innerHTML = '';
      showMsg('', true);

      try {
        var base = apiBase();
        var headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
        if (base.indexOf('supabase.co') >= 0) {
          headers.apikey = ANON;
          headers.Authorization = 'Bearer ' + ANON;
        }

        var res = await fetch(base + '/forgot-password', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            identity: identity,
            email: identity,
            phone: identity,
          }),
        });
        var j = await res.json().catch(function () {
          return {};
        });

        if (res.ok && j.ok !== false) {
          var okMsg =
            j.msg ||
            'Se existir uma conta, enviaremos as instruções por e-mail. Verifique a caixa de entrada e o spam.';
          if (j.mailSent) {
            okMsg =
              'Enviamos o link de recuperação para o e-mail da conta (válido por 15 minutos). Confira a caixa de entrada e o spam.';
          }
          showMsg(okMsg, true);
          btn.textContent = 'Enviado';
          if (j.resetUrl) {
            dev.classList.add('show');
            dev.innerHTML =
              '<div style="color:#aeb7bb;margin-bottom:8px;font-size:12px">' +
              (j.mailSent
                ? 'Link também disponível (15 min):'
                : 'Link de recuperação (15 min) — use abaixo se o e-mail não chegar:') +
              '</div>' +
              '<a href="' +
              j.resetUrl +
              '" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;padding:10px 14px;border-radius:10px;background:linear-gradient(180deg,#ffe566,#f0b429);color:#1a1208;font-weight:800;text-decoration:none;font-size:13px">Abrir página de nova senha</a>' +
              '<div style="margin-top:8px;font-size:11px;color:#8a8680;word-break:break-all">' +
              j.resetUrl +
              '</div>';
          }
        } else {
          showMsg(j.error || j.msg || 'Não foi possível enviar. Tente mais tarde.', false);
          btn.disabled = false;
          btn.textContent = 'Enviar link';
        }
      } catch (e) {
        showMsg('Erro de conexão. Tente novamente.', false);
        btn.disabled = false;
        btn.textContent = 'Enviar link';
      }
    }

    btn.onclick = send;
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        send();
      }
    });

    setTimeout(function () {
      try {
        input.focus();
      } catch (e) {}
    }, 80);
  }

  function isForgotTarget(el) {
    if (!el || !el.closest) return false;
    if (el.closest('#' + MODAL_ID)) return false;
    if (el.closest('.forgot')) return true;
    var node = el.closest('a, button, span, div, p, label');
    if (!node) return false;
    var t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length > 48) return false;
    return /esqueceu\s*a\s*senha|forgot\s*password|recuperar\s*senha|esqueci\s*a\s*senha/i.test(
      t,
    );
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      if (!isForgotTarget(el)) return;
      ev.preventDefault();
      ev.stopPropagation();
      try {
        ev.stopImmediatePropagation();
      } catch (e) {}

      var pre = '';
      try {
        var loginInput =
          document.querySelector('.login-dialog-container input:not([type=password])') ||
          document.querySelector('.login-dialog input:not([type=password])');
        if (loginInput && loginInput.value) pre = loginInput.value;
      } catch (e2) {}
      openModal(pre);
    },
    true,
  );

  window.__ch7ForgotPassword = { open: openModal, close: closeModal };
})();
