/**
 * Esqueci a senha — modal compacto (não gigante) + API local/edge.
 * v3: tamanho fixo/responsivo, tipografia controlada, z-index acima do login.
 */
(function () {
  'use strict';
  if (window.__ch7ForgotV3) return;
  window.__ch7ForgotV3 = 1;
  window.__ch7ForgotV2 = 1;
  window.__ch7ForgotV1 = 1;

  var EDGE =
    (window.__CH7_AUTH_API__ ||
      'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1/auth-api') + '';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var MODAL_ID = 'ch7-forgot-modal';
  var STYLE_ID = 'ch7-forgot-style-v3';

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
      var old = document.getElementById('ch7-forgot-style');
      if (old) old.remove();
    } catch (e0) {}
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#' +
      MODAL_ID +
      '{position:fixed!important;inset:0!important;z-index:100050!important;' +
      'display:flex!important;align-items:center!important;justify-content:center!important;' +
      'padding:16px!important;margin:0!important;width:100%!important;height:100%!important;' +
      'max-width:none!important;max-height:none!important;box-sizing:border-box!important;' +
      'background:rgba(6,5,4,.88)!important;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);' +
      'font-size:14px!important;line-height:1.4!important;}' +
      '#' +
      MODAL_ID +
      ' *{box-sizing:border-box!important;max-width:100%;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-card{' +
      'position:relative!important;width:100%!important;max-width:360px!important;' +
      'height:auto!important;max-height:min(90vh,480px)!important;overflow:auto!important;' +
      'margin:0 auto!important;padding:20px 16px 16px!important;border-radius:16px!important;' +
      'background:linear-gradient(165deg,#2c2114 0%,#16120c 100%)!important;' +
      'border:1px solid rgba(246,207,135,.35)!important;color:#fff!important;' +
      'font:500 14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif!important;' +
      'box-shadow:0 16px 40px rgba(0,0,0,.55)!important;flex:0 1 auto!important;}' +
      '#' +
      MODAL_ID +
      ' h2,#' +
      MODAL_ID +
      ' #ch7-fg-title{margin:0 0 6px!important;color:#f6cf87!important;' +
      'font:800 1.1rem/1.3 system-ui,sans-serif!important;text-align:center!important;' +
      'letter-spacing:0!important;text-transform:none!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-sub{margin:0 0 14px!important;color:#aeb7bb!important;font-size:12.5px!important;' +
      'line-height:1.45!important;text-align:center!important;font-weight:500!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-sub b{color:#fff!important;font-weight:700!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-input{width:100%!important;height:46px!important;min-height:46px!important;' +
      'max-height:46px!important;padding:0 14px!important;margin:0 0 10px!important;' +
      'border-radius:12px!important;border:1px solid rgba(255,255,255,.12)!important;' +
      'background:rgba(255,255,255,.06)!important;color:#fff!important;' +
      'font:400 15px/1.2 system-ui,sans-serif!important;outline:0!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-input:focus{border-color:rgba(246,207,135,.55)!important;' +
      'box-shadow:0 0 0 2px rgba(246,207,135,.12)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg{display:none;font-size:12.5px!important;margin:0 0 10px!important;' +
      'line-height:1.4!important;padding:8px 10px!important;border-radius:10px!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.show{display:block!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.ok{background:rgba(123,254,124,.1)!important;color:#7bfe7c!important;' +
      'border:1px solid rgba(123,254,124,.25)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-msg.err{background:rgba(255,120,120,.1)!important;color:#ff9b9b!important;' +
      'border:1px solid rgba(255,120,120,.25)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-send{width:100%!important;height:46px!important;padding:0 14px!important;margin:0!important;' +
      'border:0!important;border-radius:12px!important;font:800 15px/1 system-ui,sans-serif!important;' +
      'cursor:pointer!important;background:linear-gradient(180deg,#ffe566,#f0b429 55%,#d4920a)!important;' +
      'color:#1a1208!important;box-shadow:0 6px 16px rgba(240,180,41,.25)!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-send:disabled{opacity:.65!important;cursor:wait!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-close{width:100%!important;height:42px!important;margin-top:8px!important;padding:0 14px!important;' +
      'border:0!important;border-radius:12px!important;font:700 14px/1 system-ui,sans-serif!important;' +
      'cursor:pointer!important;background:#323749!important;color:#fff!important;}' +
      '#' +
      MODAL_ID +
      ' .ch7-fg-dev{display:none;margin-top:10px!important;padding:10px!important;border-radius:10px!important;' +
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
      ' .ch7-fg-card{max-width:100%!important;padding:16px 14px 14px!important;}}';
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
    el.innerHTML =
      '<div class="ch7-fg-card" role="document">' +
      '<h2 id="ch7-fg-title">Esqueceu a senha?</h2>' +
      '<p class="ch7-fg-sub">Informe o <b>e-mail</b> ou <b>telefone</b> da conta.<br/>Enviamos um link válido por 15 minutos.</p>' +
      '<input class="ch7-fg-input" id="ch7-fg-id" type="text" inputmode="email" autocomplete="username" ' +
      'placeholder="E-mail ou telefone com DDD" maxlength="80"/>' +
      '<div class="ch7-fg-msg" id="ch7-fg-msg" role="alert"></div>' +
      '<button type="button" class="ch7-fg-send" id="ch7-fg-send">Enviar link</button>' +
      '<button type="button" class="ch7-fg-close" id="ch7-fg-close">Voltar ao login</button>' +
      '<div class="ch7-fg-dev" id="ch7-fg-dev"></div>' +
      '</div>';
    // inline guards (caso CSS do SPA force font/size gigante)
    try {
      el.style.cssText =
        'position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;padding:16px;';
      var card = el.querySelector('.ch7-fg-card');
      if (card) {
        card.style.cssText =
          'max-width:360px;width:100%;max-height:min(90vh,480px);height:auto;margin:0 auto;padding:20px 16px 16px;' +
          'border-radius:16px;overflow:auto;';
      }
    } catch (eInline) {}
    document.body.appendChild(el);

    var msg = document.getElementById('ch7-fg-msg');
    var btn = document.getElementById('ch7-fg-send');
    var input = document.getElementById('ch7-fg-id');
    var dev = document.getElementById('ch7-fg-dev');

    if (prefill) input.value = String(prefill);

    function showMsg(text, ok) {
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
      // validação leve
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
      msg.classList.remove('show');

      try {
        var base = apiBase();
        var headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
        // edge precisa apikey; local não
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
          showMsg(
            j.msg ||
              'Se existir uma conta, enviaremos as instruções por e-mail. Verifique a caixa de entrada e o spam.',
            true,
          );
          btn.textContent = 'Enviado';
          // dev: mostra link clicável
          if (j.resetUrl) {
            dev.classList.add('show');
            dev.innerHTML =
              '<div style="color:#aeb7bb;margin-bottom:6px">Modo local — link de teste (15 min):</div>' +
              '<a href="' +
              j.resetUrl +
              '" target="_blank" rel="noopener">' +
              j.resetUrl +
              '</a>';
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
    return /esqueceu\s*a\s*senha|forgot\s*password|recuperar\s*senha|esqueci\s*a\s*senha/i.test(t);
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

      // tenta pré-preencher com o campo de login
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
