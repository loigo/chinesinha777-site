/**
 * Esqueci a senha — modal + call auth-api/forgot-password.
 * Intercepta .forgot e texto "Esqueceu a senha?".
 */
(function () {
  'use strict';
  if (window.__ch7ForgotV1) return;
  window.__ch7ForgotV1 = 1;

  var API =
    (window.__CH7_AUTH_API__ ||
      'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1/auth-api') + '';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var MODAL_ID = 'ch7-forgot-modal';

  function openModal() {
    var old = document.getElementById(MODAL_ID);
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = MODAL_ID;
    el.setAttribute('role', 'dialog');
    el.style.cssText =
      'position:fixed;inset:0;z-index:99995;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(8,6,4,.88)';
    el.innerHTML =
      '<div style="max-width:400px;width:100%;border-radius:18px;padding:22px 18px;' +
      'background:linear-gradient(165deg,#2c2114,#16120c);border:1px solid rgba(246,207,135,.35);' +
      'color:#fff;font:500 14px/1.45 system-ui,sans-serif;box-shadow:0 16px 48px rgba(0,0,0,.5)">' +
      '<h2 style="margin:0 0 8px;color:#f6cf87;font:800 1.15rem/1.3 system-ui,sans-serif;text-align:center">Esqueceu a senha?</h2>' +
      '<p style="margin:0 0 14px;color:#aeb7bb;font-size:13px;text-align:center">Informe o e-mail ou telefone da conta. Enviaremos um link válido por 15 minutos.</p>' +
      '<input id="ch7-fg-id" type="text" placeholder="E-mail ou telefone" autocomplete="username" ' +
      'style="width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);' +
      'background:rgba(255,255,255,.06);color:#fff;font:400 15px system-ui,sans-serif;margin:0 0 10px;outline:0"/>' +
      '<div id="ch7-fg-msg" style="display:none;font-size:13px;margin:0 0 10px;line-height:1.4"></div>' +
      '<button type="button" id="ch7-fg-send" style="width:100%;padding:13px;border:0;border-radius:12px;font-weight:800;' +
      'cursor:pointer;background:linear-gradient(180deg,#ffe566,#f0b429);color:#1a1208">Enviar link</button>' +
      '<button type="button" id="ch7-fg-close" style="width:100%;margin-top:8px;padding:12px;border:0;border-radius:12px;' +
      'font-weight:700;cursor:pointer;background:#323749;color:#fff">Fechar</button>' +
      '</div>';
    document.body.appendChild(el);

    var msg = document.getElementById('ch7-fg-msg');
    var btn = document.getElementById('ch7-fg-send');
    var input = document.getElementById('ch7-fg-id');

    function showMsg(text, ok) {
      msg.style.display = 'block';
      msg.style.color = ok ? '#7bfe7c' : '#ff9b9b';
      msg.textContent = text;
    }

    document.getElementById('ch7-fg-close').onclick = function () {
      try {
        el.remove();
      } catch (e) {}
    };
    el.addEventListener('click', function (e) {
      if (e.target === el) {
        try {
          el.remove();
        } catch (x) {}
      }
    });

    btn.onclick = async function () {
      var identity = String(input.value || '').trim();
      if (!identity) {
        showMsg('Informe e-mail ou telefone.', false);
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Enviando…';
      try {
        var res = await fetch(API + '/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: ANON,
            Authorization: 'Bearer ' + ANON,
          },
          body: JSON.stringify({ identity: identity, email: identity, phone: identity }),
        });
        var j = await res.json().catch(function () {
          return {};
        });
        if (j.ok !== false) {
          showMsg(
            j.msg ||
              'Se existir uma conta, enviaremos as instruções por e-mail. Verifique a caixa de entrada e o spam.',
            true,
          );
          btn.textContent = 'Enviado';
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
    };

    setTimeout(function () {
      try {
        input.focus();
      } catch (e) {}
    }, 100);
  }

  function isForgotTarget(el) {
    if (!el || !el.closest) return false;
    if (el.closest('.forgot')) return true;
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (/esqueceu a senha|forgot password|recuperar senha/i.test(t) && t.length < 40) {
      return true;
    }
    return false;
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
      openModal();
    },
    true,
  );

  window.__ch7ForgotPassword = { open: openModal };
})();
