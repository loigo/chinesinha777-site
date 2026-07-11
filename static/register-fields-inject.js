/**
 * Auth validação v13 — inteligente e em tempo real.
 * Cadastro: Nome Completo, E-mail, Telefone, Senha.
 * Login: E-mail OU Telefone + Senha (detecta @ / letras → e-mail; dígitos → telefone).
 * CRÍTICO: NUNCA montar form em .q-dialog genérico (lottery/reward) — causa loop e UI quebrada.
 * CRÍTICO: promove loginDialog na fila do gameStore (senão fica atrás de reward/winning).
 * Só atua em .login-dialog-container / .login-dialog.
 */
(function () {
  'use strict';
  if (window.__ch7RegisterFieldsV14) return;
  window.__ch7RegisterFieldsV14 = 1;
  window.__ch7RegisterFieldsV13 = 1;
  window.__ch7RegisterFieldsV12 = 1;
  window.__ch7RegisterFieldsV9 = 1;
  window.__ch7RegisterFieldsV8 = 1;

  var STYLE_ID = 'ch7-reg-v13-style';
  var FORM_ID = 'ch7-reg-full-form';
  var LOGIN_ERR_ID = 'ch7-login-id-err';
  var EDGE =
    window.__CH7_GOFUN_EDGE__ ||
    'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';
  var lastMode = null;
  var submitting = false;
  var MSG = {
    emptyId: 'Informe e-mail ou telefone',
    email: 'E-mail inválido',
    phone: 'Número de telefone inválido (use DDD + número)',
    name: 'Informe o nome completo',
    pass: 'A senha deve ter no mínimo 6 caracteres.',
  };

  function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  /** empty | email | phone */
  function detectIdentity(raw) {
    var s = String(raw || '').trim();
    if (!s) return 'empty';
    if (s.indexOf('@') >= 0 || /[a-zA-Z]/.test(s)) return 'email';
    if (/^[\d\s().+\-]+$/.test(s)) return 'phone';
    return 'email';
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function isPhoneBR(s) {
    var d = onlyDigits(s);
    if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);
    return d.length === 10 || d.length === 11;
  }

  function normalizePhone(s) {
    var d = onlyDigits(s);
    if (d.indexOf('55') === 0 && (d.length === 12 || d.length === 13)) d = d.slice(2);
    return d;
  }

  function strongPass(s) {
    return String(s || '').length >= 6;
  }

  /** @returns {true|string} */
  function validateIdentity(raw) {
    var s = String(raw || '').trim();
    var kind = detectIdentity(s);
    if (kind === 'empty') return MSG.emptyId;
    if (kind === 'email') return isEmail(s) || MSG.email;
    return isPhoneBR(s) || MSG.phone;
  }

  function ensureStyle() {
    try {
      var oldIds = ['ch7-reg-v8-style', 'ch7-reg-v9-style'];
      for (var oi = 0; oi < oldIds.length; oi++) {
        var oldEl = document.getElementById(oldIds[oi]);
        if (oldEl) oldEl.remove();
      }
    } catch (e) {}
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    var rootSel =
      '.login-dialog-container.ch7-reg-mode, .login-dialog.ch7-reg-mode, .login-dialog-card.ch7-reg-mode';
    s.textContent =
      /* Cadastro: esconde TUDO nativo do SPA — só form ch7 + botão dourado */
      rootSel +
      ' .form-section > .q-field,' +
      rootSel +
      ' .form-section > .q-input,' +
      rootSel +
      ' .form-section .q-field,' +
      rootSel +
      ' .form-section .q-input,' +
      rootSel +
      ' .form-section form > .q-field,' +
      rootSel +
      ' .form-section form > .q-input,' +
      rootSel +
      ' .form-section .custom-input,' +
      rootSel +
      ' .form-section .country-code,' +
      rootSel +
      ' .form-section .icon-wrapper,' +
      rootSel +
      ' .form-section .forgot,' +
      rootSel +
      ' .form-section .agreement,' +
      rootSel +
      ' .form-section .register,' +
      rootSel +
      ' .form-section .bonus,' +
      rootSel +
      ' .form-section .bonus-text,' +
      rootSel +
      ' .submit-section,' +
      rootSel +
      ' .submit-section .q-btn,' +
      rootSel +
      ' .form-section > button.q-btn,' +
      rootSel +
      ' .form-section > .q-btn,' +
      rootSel +
      ' .form-section button.q-btn:not(.ch7-submit):not(#ch7f-submit),' +
      rootSel +
      ' .login-dialog-card > button.q-btn:not(.ch7-submit),' +
      rootSel +
      ' button.q-btn.full-width:not(.ch7-submit),' +
      /* irmãos nativos após nosso form */
      '#' +
      FORM_ID +
      ' ~ .q-field, #' +
      FORM_ID +
      ' ~ .q-btn, #' +
      FORM_ID +
      ' ~ .q-input, #' +
      FORM_ID +
      ' ~ .custom-input, #' +
      FORM_ID +
      ' ~ .submit-section, #' +
      FORM_ID +
      ' ~ .forgot, #' +
      FORM_ID +
      ' ~ .register, #' +
      FORM_ID +
      ' ~ .agreement, #' +
      FORM_ID +
      ' ~ .bonus, #' +
      FORM_ID +
      ' ~ .country-code, #' +
      FORM_ID +
      ' ~ form, #' +
      FORM_ID +
      ' ~ .q-form, #' +
      FORM_ID +
      ' ~ [class*="q-field"]{' +
      'display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;' +
      'max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;' +
      'pointer-events:none!important;opacity:0!important;border:0!important;}' +
      /* form nativo inteiro quando nosso form existe */
      rootSel +
      ' .form-section > form.q-form,' +
      rootSel +
      ' .form-section > .q-form{' +
      'display:none!important;height:0!important;overflow:hidden!important;opacity:0!important;' +
      'pointer-events:none!important;}' +
      /* tabs Login/Registrar do dialog ficam visíveis */
      rootSel +
      ' .title-section,' +
      rootSel +
      ' .tabs,' +
      rootSel +
      ' .tab,' +
      rootSel +
      ' .q-tab{display:flex!important;visibility:visible!important;height:auto!important;' +
      'min-height:0!important;max-height:none!important;opacity:1!important;pointer-events:auto!important;overflow:visible!important;}' +
      /* nosso botão dourado sempre visível */
      '#' +
      FORM_ID +
      ' .ch7-submit, button.ch7-submit, #ch7f-submit{' +
      'display:block!important;visibility:visible!important;height:auto!important;min-height:48px!important;' +
      'max-height:none!important;pointer-events:auto!important;opacity:1!important;overflow:visible!important;}' +
      '#' +
      FORM_ID +
      '{display:flex!important;visibility:visible!important;flex-direction:column;gap:10px;width:100%;' +
      'margin:8px 0 4px;box-sizing:border-box;position:relative;z-index:50;min-height:220px;}' +
      '#' +
      FORM_ID +
      ' .ch7f{' +
      'display:flex;align-items:center;gap:10px;width:100%;min-height:50px;' +
      'padding:0 14px;border-radius:12px;box-sizing:border-box;' +
      'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);' +
      'color:#f2f2f2;font:400 15px/1.25 system-ui,-apple-system,Segoe UI,sans-serif;' +
      'transition:border-color .15s,box-shadow .15s;}' +
      '#' +
      FORM_ID +
      ' .ch7f:focus-within{border-color:rgba(246,207,135,.55);box-shadow:0 0 0 2px rgba(246,207,135,.12);}' +
      '#' +
      FORM_ID +
      ' .ch7f.err{border-color:rgba(255,120,120,.7)!important;}' +
      '#' +
      FORM_ID +
      ' .ch7f.ok{border-color:rgba(123,254,124,.45);}' +
      '#' +
      FORM_ID +
      ' .ch7f-ico{opacity:.8;font-size:16px;flex:0 0 auto;}' +
      '#' +
      FORM_ID +
      ' .ch7f input{' +
      'flex:1;min-width:0;border:0;outline:0;background:transparent;color:inherit;font:inherit;' +
      'padding:13px 0;-webkit-appearance:none;appearance:none;}' +
      '#' +
      FORM_ID +
      ' .ch7f input::placeholder{color:rgba(255,255,255,.42);}' +
      '#' +
      FORM_ID +
      ' .ch7f-prefix{opacity:.75;font-size:13px;font-weight:600;color:#f6cf87;flex:0 0 auto;}' +
      '#' +
      FORM_ID +
      ' .ch7-field-msg{' +
      'display:none;color:#ff9b9b;font-size:12px;line-height:1.35;padding:0 4px 2px;margin-top:-4px;}' +
      '#' +
      FORM_ID +
      ' .ch7-field-msg.show{display:block;}' +
      '#' +
      FORM_ID +
      ' .ch7-err{' +
      'display:none;color:#ff9b9b;font-size:12.5px;line-height:1.35;padding:2px 4px;}' +
      '#' +
      FORM_ID +
      ' .ch7-err.show{display:block;}' +
      '#' +
      FORM_ID +
      ' .ch7-submit{' +
      'width:100%;margin-top:4px;padding:14px 16px;border:0;border-radius:12px;cursor:pointer;' +
      'font:800 16px/1.2 system-ui,sans-serif;color:#1a1208;' +
      'background:linear-gradient(180deg,#ffe566 0%,#f0b429 55%,#d4920a 100%);' +
      'box-shadow:0 6px 18px rgba(240,180,41,.28);letter-spacing:.02em;}' +
      '#' +
      FORM_ID +
      ' .ch7-submit:disabled{opacity:.6;cursor:wait;}' +
      '#' +
      FORM_ID +
      ' .ch7-hint{font-size:11.5px;color:rgba(255,255,255,.45);padding:0 4px;}' +
      '.login-dialog-container.ch7-login-email-mode .country-code{display:none!important;}' +
      '#' +
      LOGIN_ERR_ID +
      '{display:none;color:#ff9b9b;font-size:12.5px;line-height:1.35;padding:4px 2px 0;}' +
      '#' +
      LOGIN_ERR_ID +
      '.show{display:block;}' +
      '.login-dialog-container.ch7-login-email-mode .q-field__messages,' +
      '.login-dialog-container.ch7-login-email-mode .q-field__bottom{color:#ff9b9b;}' +
      '.login-dialog-container.ch7-smart-id input{max-width:100%;}';
    document.head.appendChild(s);
  }

  /** Só dialog de login/cadastro — NUNCA lottery/reward/activity */
  function isLoginDialogEl(el) {
    if (!el || !el.querySelector) return false;
    // rejeita popups de atividade/lottery primeiro
    if (el.querySelector('.slotBox, .lotteryBg, .rotary-table, .lotteryBtnBox')) return false;
    if (el.classList && (el.classList.contains('login-dialog-container') || el.classList.contains('login-dialog')))
      return true;
    if (el.querySelector('.login-dialog-container, .login-dialog')) return true;
    // form-section só conta se NÃO for activity desc
    if (el.querySelector('.form-section') && !el.querySelector('.bottomBoxTitle, .slotBox')) return true;
    return false;
  }

  function dialogRoot() {
    var c =
      document.querySelector('.login-dialog-container') ||
      document.querySelector('.login-dialog') ||
      document.querySelector('.q-dialog .login-dialog-card');
    if (c && isLoginDialogEl(c)) return c;
    // último recurso: q-dialog que contenha form-section de login
    var dialogs = document.querySelectorAll('.q-dialog');
    for (var i = 0; i < dialogs.length; i++) {
      var d = dialogs[i];
      if (d.querySelector('.login-dialog-container, .login-dialog, .form-section.login, .form-section')) {
        if (!d.querySelector('.slotBox, .lotteryBg, .rotary-table')) {
          var inner =
            d.querySelector('.login-dialog-container') ||
            d.querySelector('.login-dialog') ||
            d.querySelector('.form-section');
          if (inner) return inner.closest('.login-dialog-container') || inner.closest('.login-dialog') || inner;
        }
      }
    }
    return null;
  }

  function formSection(root) {
    if (!root) return null;
    return root.querySelector('.form-section') || null;
  }

  /** Remove form se ficou preso em dialog errado (lottery etc.) */
  function cleanupOrphanForm() {
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var ok =
      form.closest('.login-dialog-container') ||
      form.closest('.login-dialog') ||
      (form.closest('.form-section') && !form.closest('.slotBox, .lotteryBg'));
    if (!ok) {
      try {
        form.remove();
      } catch (e) {}
    }
    // limpa classes em dialogs que não são login
    try {
      var bad = document.querySelectorAll('.q-dialog.ch7-reg-mode, .q-dialog.ch7-smart-id');
      for (var i = 0; i < bad.length; i++) {
        if (!isLoginDialogEl(bad[i])) {
          bad[i].classList.remove('ch7-reg-mode', 'ch7-smart-id', 'ch7-login-email-mode');
        }
      }
    } catch (e2) {}
  }

  function modeFromUi(root) {
    if (!root) return null;
    if (lastMode) return lastMode;

    var buttons = root.querySelectorAll('button, .q-btn');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.closest('#' + FORM_ID)) continue;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Registrar(-se)?$/i.test(t) || /^Cadastrar$/i.test(t)) return 'register';
      if (/^Login$|^Entrar$/i.test(t)) return 'login';
    }

    var active =
      root.querySelector('.tab.active, .tabs .active, .q-tab--active, [class*="tab"].active') ||
      null;
    if (active) {
      var at = (active.textContent || '').replace(/\s+/g, ' ').trim();
      if (/Registrar|Cadastro|Register/i.test(at)) return 'register';
      if (/Login|Entrar/i.test(at)) return 'login';
    }

    var inputs = root.querySelectorAll('input');
    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j].closest('#' + FORM_ID)) continue;
      var ph = String(inputs[j].placeholder || '');
      if (/Novo\s*Telefone/i.test(ph)) return 'register';
      if (/E-?mail ou Telefone|Telefone ou E-?mail/i.test(ph)) return 'login';
    }

    var txt = (root.innerText || '').slice(0, 500);
    if (/Nova\s*Senha/i.test(txt)) return 'register';
    return 'login';
  }

  function field(icon, opts) {
    var wrap = document.createElement('div');
    wrap.className = 'ch7f';
    wrap.dataset.key = opts.key;
    var ico = document.createElement('span');
    ico.className = 'ch7f-ico';
    ico.textContent = icon;
    wrap.appendChild(ico);
    if (opts.prefix) {
      var pre = document.createElement('span');
      pre.className = 'ch7f-prefix';
      pre.textContent = opts.prefix;
      wrap.appendChild(pre);
    }
    var input = document.createElement('input');
    input.id = 'ch7f-' + opts.key;
    input.name = opts.key;
    input.type = opts.type || 'text';
    input.placeholder = opts.placeholder;
    input.autocomplete = opts.autocomplete || 'off';
    input.setAttribute('aria-label', opts.placeholder);
    if (opts.inputmode) input.setAttribute('inputmode', opts.inputmode);
    if (opts.maxlength) input.maxLength = opts.maxlength;
    wrap.appendChild(input);

    var msg = document.createElement('div');
    msg.className = 'ch7-field-msg';
    msg.id = 'ch7f-msg-' + opts.key;
    msg.setAttribute('role', 'alert');

    return { wrap: wrap, input: input, msg: msg };
  }

  function setFieldState(key, errMsg) {
    var input = document.getElementById('ch7f-' + key);
    var msg = document.getElementById('ch7f-msg-' + key);
    var wrap = input && input.closest('.ch7f');
    if (!wrap) return;
    if (errMsg) {
      wrap.classList.add('err');
      wrap.classList.remove('ok');
      if (msg) {
        msg.textContent = errMsg;
        msg.classList.add('show');
      }
    } else {
      wrap.classList.remove('err');
      if (input && String(input.value || '').trim()) wrap.classList.add('ok');
      else wrap.classList.remove('ok');
      if (msg) {
        msg.textContent = '';
        msg.classList.remove('show');
      }
    }
  }

  function setErr(el, msg) {
    var box = document.getElementById(FORM_ID);
    if (!box) return;
    var err = box.querySelector('.ch7-err');
    if (!err) return;
    box.querySelectorAll('.ch7f.err').forEach(function (f) {
      f.classList.remove('err');
    });
    if (el) el.classList.add('err');
    if (msg) {
      err.textContent = msg;
      err.classList.add('show');
    } else {
      err.textContent = '';
      err.classList.remove('show');
    }
  }

  function readForm() {
    return {
      name: (document.getElementById('ch7f-name') || {}).value || '',
      email: String((document.getElementById('ch7f-email') || {}).value || '')
        .trim()
        .toLowerCase(),
      phone: (document.getElementById('ch7f-phone') || {}).value || '',
      pass: (document.getElementById('ch7f-pass') || {}).value || '',
    };
  }

  function liveValidateField(key) {
    var data = readForm();
    if (key === 'name') {
      var n = String(data.name || '').trim();
      if (!n) return setFieldState('name', '');
      setFieldState('name', n.length < 3 ? MSG.name : '');
      return;
    }
    if (key === 'email') {
      var e = String(data.email || '').trim();
      if (!e) return setFieldState('email', '');
      setFieldState('email', isEmail(e) ? '' : MSG.email);
      return;
    }
    if (key === 'phone') {
      var p = String(data.phone || '').trim();
      if (!p) return setFieldState('phone', '');
      setFieldState('phone', isPhoneBR(p) ? '' : MSG.phone);
      return;
    }
    if (key === 'pass') {
      var pw = String(data.pass || '');
      if (!pw) return setFieldState('pass', '');
      setFieldState('pass', strongPass(pw) ? '' : MSG.pass);
    }
  }

  function validate(data) {
    var name = String(data.name || '').trim();
    if (name.length < 3) {
      setFieldState('name', MSG.name);
      setErr(document.getElementById('ch7f-name') && document.getElementById('ch7f-name').parentElement, MSG.name);
      return false;
    }
    setFieldState('name', '');
    if (!isEmail(data.email)) {
      setFieldState('email', MSG.email);
      setErr(document.getElementById('ch7f-email') && document.getElementById('ch7f-email').parentElement, MSG.email);
      return false;
    }
    setFieldState('email', '');
    if (!isPhoneBR(data.phone)) {
      setFieldState('phone', MSG.phone);
      setErr(document.getElementById('ch7f-phone') && document.getElementById('ch7f-phone').parentElement, MSG.phone);
      return false;
    }
    setFieldState('phone', '');
    if (!strongPass(data.pass)) {
      setFieldState('pass', MSG.pass);
      setErr(document.getElementById('ch7f-pass') && document.getElementById('ch7f-pass').parentElement, MSG.pass);
      return false;
    }
    setFieldState('pass', '');
    setErr(null, '');
    return true;
  }

  function toast(msg, ok) {
    try {
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var q =
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$q;
      if (q && q.notify) {
        q.notify({
          message: msg,
          color: ok ? 'positive' : 'negative',
          position: 'top',
        });
        return;
      }
    } catch (e) {}
    alert(msg);
  }

  function aesDecrypt(text) {
    try {
      var C = window.CryptoJS;
      if (!C || !text || text[0] === '{') return null;
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var params = C.lib.CipherParams.create({
        ciphertext: C.enc.Base64.parse(text),
      });
      var dec = C.AES.decrypt(params, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      var plain = dec.toString(C.enc.Utf8);
      if (plain && plain[0] === '{') return JSON.parse(plain);
    } catch (e) {}
    return null;
  }

  async function apiRegist(data) {
    var phone = normalizePhone(data.phone);
    var payload = {
      phone: phone,
      pass: data.pass,
      password: data.pass,
      name: String(data.name).trim(),
      email: data.email,
      nick: String(data.name).trim(),
    };
    var res = await fetch(EDGE + '/v2/account/regist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-plain-json': '1',
        apikey: ANON,
        Authorization: 'Bearer ' + ANON,
        'x-ch7-name': payload.name,
        'x-ch7-email': payload.email,
      },
      body: JSON.stringify(payload),
    });
    var text = await res.text();
    var j;
    try {
      j = JSON.parse(text);
    } catch (e) {
      j = aesDecrypt(text) || { code: 500, msg: 'Resposta inválida' };
    }
    return j;
  }

  function setAuthStore(loginData) {
    try {
      var token =
        loginData.token ||
        loginData.Token ||
        (loginData.userInfoData && loginData.userInfoData.token) ||
        '';
      var info = loginData.userInfoData || loginData.UserInfoData || {};
      var payload = {
        token: token,
        id: info.id || info.UID || '',
        phone: info.phone || '',
        nick: info.nick || info.name || '',
        email: info.email || '',
        gateAddr: info.gateAddr || '',
      };
      try {
        localStorage.setItem('ch7_user', JSON.stringify(payload));
      } catch (e) {}
      // pinia stores se existirem
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      if (app && app.config && app.config.globalProperties) {
        // best-effort; reload covers state
      }
    } catch (e) {}
  }

  function closeDialog() {
    try {
      var closeBtn =
        document.querySelector('.login-dialog-container .cloneImg') ||
        document.querySelector('.login-dialog-container .q-dialog__close') ||
        document.querySelector('.login-dialog .close') ||
        document.querySelector('.login-dialog-container .q-icon');
      if (closeBtn) closeBtn.click();
    } catch (e) {}
    try {
      var backdrop = document.querySelector('.q-dialog__backdrop');
      if (backdrop) backdrop.click();
    } catch (e) {}
    try {
      var root = dialogRoot();
      if (root) {
        var dlg = root.closest('.q-dialog') || root;
        dlg.style.display = 'none';
      }
    } catch (e2) {}
  }

  async function onSubmit(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (submitting) return;
    var data = readForm();
    // force live all
    ['name', 'email', 'phone', 'pass'].forEach(liveValidateField);
    if (!validate(data)) return;
    submitting = true;
    var btn = document.getElementById('ch7f-submit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Registrando…';
    }
    try {
      var j = await apiRegist(data);
      if (j && j.code === 0) {
        setAuthStore(j.data || j);
        toast('Registro bem-sucedido!', true);
        closeDialog();
        setTimeout(function () {
          location.hash = '#/';
          try {
            location.reload();
          } catch (e) {}
        }, 400);
        return;
      }
      var msg = (j && j.msg) || 'Não foi possível registrar. Tente de novo.';
      if (/already exists|já cadastrad|30103/i.test(msg)) {
        msg = 'Telefone ou e-mail já cadastrado. Faça login.';
      }
      setErr(null, msg);
      toast(msg, false);
    } catch (e) {
      setErr(null, 'Erro de conexão. Tente novamente.');
      toast('Erro de conexão. Tente novamente.', false);
    } finally {
      submitting = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Registrar-se';
      }
    }
  }

  function buildForm() {
    var form = document.createElement('div');
    form.id = FORM_ID;
    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', 'Cadastro');

    var nameF = field('👤', {
      key: 'name',
      placeholder: 'Nome Completo',
      autocomplete: 'name',
    });
    var emailF = field('✉', {
      key: 'email',
      placeholder: 'E-mail',
      autocomplete: 'email',
      type: 'email',
      inputmode: 'email',
    });
    var phoneF = field('📱', {
      key: 'phone',
      placeholder: 'Telefone com DDD',
      autocomplete: 'tel',
      type: 'tel',
      inputmode: 'tel',
      maxlength: 15,
      prefix: '+55',
    });
    var passF = field('🔒', {
      key: 'pass',
      placeholder: 'Senha (mín. 6 caracteres)',
      autocomplete: 'new-password',
      type: 'password',
    });

    phoneF.input.addEventListener('input', function () {
      var d = onlyDigits(phoneF.input.value).slice(0, 11);
      if (d.length > 6) {
        phoneF.input.value =
          '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + (d.length > 7 ? '-' + d.slice(7) : '');
      } else if (d.length > 2) {
        phoneF.input.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      } else {
        phoneF.input.value = d;
      }
      liveValidateField('phone');
    });

    nameF.input.addEventListener('input', function () {
      liveValidateField('name');
    });
    nameF.input.addEventListener('blur', function () {
      liveValidateField('name');
    });
    emailF.input.addEventListener('input', function () {
      liveValidateField('email');
    });
    emailF.input.addEventListener('blur', function () {
      liveValidateField('email');
    });
    phoneF.input.addEventListener('blur', function () {
      liveValidateField('phone');
    });
    passF.input.addEventListener('input', function () {
      liveValidateField('pass');
    });
    passF.input.addEventListener('blur', function () {
      liveValidateField('pass');
    });

    var err = document.createElement('div');
    err.className = 'ch7-err';
    err.setAttribute('role', 'alert');

    var hint = document.createElement('div');
    hint.className = 'ch7-hint';
    hint.textContent = 'Nome, e-mail, telefone com DDD e senha (mín. 6).';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ch7-submit';
    btn.id = 'ch7f-submit';
    btn.textContent = 'Registrar-se';
    btn.addEventListener('click', onSubmit);

    [nameF, emailF, phoneF, passF].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') onSubmit(e);
      });
    });

    form.appendChild(nameF.wrap);
    form.appendChild(nameF.msg);
    form.appendChild(emailF.wrap);
    form.appendChild(emailF.msg);
    form.appendChild(phoneF.wrap);
    form.appendChild(phoneF.msg);
    form.appendChild(passF.wrap);
    form.appendChild(passF.msg);
    form.appendChild(err);
    form.appendChild(hint);
    form.appendChild(btn);
    return form;
  }

  function mountRegisterForm() {
    ensureStyle();
    var root = dialogRoot();
    if (!root) return;
    root.classList.remove('ch7-login-email-mode');

    var section = formSection(root);
    if (!section) {
      // sem seção: não esconde nativos
      root.classList.remove('ch7-reg-mode');
      return;
    }

    var existing = document.getElementById(FORM_ID);
    if (existing && section.contains(existing)) {
      root.classList.add('ch7-reg-mode');
      hideNativeRegisterButtons(root);
      return;
    }
    if (existing) {
      try {
        existing.remove();
      } catch (e) {}
    }

    var form = buildForm();
    if (section.firstChild) section.insertBefore(form, section.firstChild);
    else section.appendChild(form);
    // só ativa hide dos nativos DEPOIS do form no DOM
    root.classList.add('ch7-reg-mode');
    hideNativeRegisterButtons(root);
  }

  /** Esconde botão + campos SPA nativos; mantém só #ch7f-submit dourado */
  function hideNativeRegisterButtons(root) {
    if (!root) return;
    try {
      var hideEl = function (el) {
        if (!el || el.id === FORM_ID || el.closest('#' + FORM_ID)) return;
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('height', '0', 'important');
        el.style.setProperty('max-height', '0', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
      };

      var selectors = [
        '.submit-section',
        '.form-section .q-field',
        '.form-section .q-input',
        '.form-section .custom-input',
        '.form-section .forgot',
        '.form-section .register',
        '.form-section .agreement',
        '.form-section .bonus',
        '.form-section .country-code',
        '.form-section > form',
        '.form-section > .q-form',
      ];
      for (var s = 0; s < selectors.length; s++) {
        var nodes = root.querySelectorAll(selectors[s]);
        for (var n = 0; n < nodes.length; n++) hideEl(nodes[n]);
      }

      // irmãos nativos depois do nosso form
      var form = document.getElementById(FORM_ID);
      if (form && form.parentElement) {
        var sib = form.nextElementSibling;
        while (sib) {
          if (sib.id !== FORM_ID && !sib.classList.contains('ch7f')) hideEl(sib);
          sib = sib.nextElementSibling;
        }
      }

      // Campos nativos "Novo Telefone" / "Nova Senha" (fora de .q-field)
      var allInputs = root.querySelectorAll('input, textarea');
      for (var ii = 0; ii < allInputs.length; ii++) {
        var inp = allInputs[ii];
        if (inp.closest('#' + FORM_ID)) continue;
        var ph = String(inp.placeholder || '');
        var nm = String(inp.name || '');
        if (
          /Novo\s*Telefone|Nova\s*Senha|New\s*Phone|New\s*Password/i.test(ph) ||
          /Novo\s*Telefone|Nova\s*Senha/i.test(nm)
        ) {
          hideEl(inp);
          var row = inp.closest('.q-field, .custom-input, .row, .q-input, label, .form-item') || inp.parentElement;
          if (row && !row.closest('#' + FORM_ID)) hideEl(row);
        }
      }

      var btns = root.querySelectorAll('button, .q-btn, [role="button"]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.id === 'ch7f-submit' || b.classList.contains('ch7-submit')) continue;
        if (b.closest('#' + FORM_ID)) continue;
        if (b.closest('.title-section, .tabs, .q-tabs')) continue;
        var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
        var isSubmitLike =
          /^Registrar(-se)?$/i.test(t) ||
          /^Cadastrar(-se)?$/i.test(t) ||
          /^Register$/i.test(t) ||
          /^Login$|^Entrar$/i.test(t) ||
          b.closest('.submit-section');
        if (isSubmitLike) {
          hideEl(b);
          try {
            b.disabled = true;
          } catch (e1) {}
        }
      }
    } catch (e) {}
  }

  function unmountRegisterForm() {
    var root = dialogRoot();
    if (root) root.classList.remove('ch7-reg-mode');
    var existing = document.getElementById(FORM_ID);
    if (existing) {
      try {
        existing.remove();
      } catch (e) {}
    }
    cleanupOrphanForm();
  }

  function findLoginIdentityInput(root) {
    if (!root) return null;
    var inputs = root.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.closest('#' + FORM_ID)) continue;
      if ((el.type || '').toLowerCase() === 'password') continue;
      var ph = String(el.placeholder || '');
      if (
        /telefone|phone|e-?mail|novo|conta|usu[aá]rio/i.test(ph) ||
        el.type === 'tel' ||
        el.type === 'email' ||
        el.inputMode === 'tel' ||
        el.inputMode === 'email'
      ) {
        return el;
      }
    }
    // fallback: first non-password
    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j].closest('#' + FORM_ID)) continue;
      if ((inputs[j].type || '').toLowerCase() !== 'password') return inputs[j];
    }
    return null;
  }

  function ensureLoginErr(root, afterEl) {
    var err = document.getElementById(LOGIN_ERR_ID);
    if (err) return err;
    err = document.createElement('div');
    err.id = LOGIN_ERR_ID;
    err.setAttribute('role', 'alert');
    var parent =
      (afterEl && afterEl.closest('.q-field')) ||
      (afterEl && afterEl.parentElement) ||
      formSection(root) ||
      root;
    if (parent && parent.parentElement) {
      // insert after q-field if possible
      var field = afterEl && afterEl.closest('.q-field');
      if (field && field.parentElement) {
        if (field.nextSibling) field.parentElement.insertBefore(err, field.nextSibling);
        else field.parentElement.appendChild(err);
      } else {
        parent.appendChild(err);
      }
    }
    return err;
  }

  function setLoginErr(msg) {
    var err = document.getElementById(LOGIN_ERR_ID);
    if (!err) return;
    if (msg) {
      err.textContent = msg;
      err.classList.add('show');
    } else {
      err.textContent = '';
      err.classList.remove('show');
    }
  }

  function rewriteQuasarPhoneErrors(root) {
    if (!root) return;
    var nodes = root.querySelectorAll(
      '.q-field__messages, .q-field__bottom, .q-field__messages div, [role="alert"]',
    );
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.id === LOGIN_ERR_ID || n.closest('#' + FORM_ID)) continue;
      var t = (n.textContent || '').trim();
      if (!t) continue;
      var idInput = findLoginIdentityInput(root);
      var val = idInput ? String(idInput.value || '') : '';
      var kind = detectIdentity(val);
      if (/telefone|phone|DDD|n[uú]mero/i.test(t) && kind === 'email') {
        var fixed = validateIdentity(val);
        var next = fixed === true ? '' : fixed === MSG.emptyId ? MSG.email : fixed;
        // só escreve se mudou — evita loop com MutationObserver
        if (t !== next) n.textContent = next;
      }
    }
  }

  function adaptLogin() {
    var root = dialogRoot();
    if (!root) return;
    root.classList.remove('ch7-reg-mode');
    root.classList.add('ch7-smart-id');
    ensureStyle();

    var el = findLoginIdentityInput(root);
    if (!el) return;

    el.placeholder = 'E-mail ou Telefone';
    el.setAttribute('aria-label', 'E-mail ou Telefone');
    el.setAttribute('maxlength', '80');
    try {
      el.setAttribute('type', 'text');
    } catch (e) {}
    el.setAttribute('inputmode', 'email');
    el.setAttribute('autocomplete', 'username');

    ensureLoginErr(root, el);

    function onIdentityInput() {
      var r = dialogRoot();
      if (!r) return;
      var val = el.value || '';
      var kind = detectIdentity(val);
      if (kind === 'email') r.classList.add('ch7-login-email-mode');
      else r.classList.remove('ch7-login-email-mode');

      // realtime: só mostra erro se já digitou algo e parece completo o suficiente
      if (!String(val).trim()) {
        setLoginErr('');
        return;
      }
      if (kind === 'email') {
        // enquanto digita e-mail incompleto, só alerta se tem @ e domínio incompleto com blur handled below
        if (val.indexOf('@') >= 0 && val.indexOf('.') > val.indexOf('@')) {
          setLoginErr(isEmail(val) ? '' : MSG.email);
        } else if (val.indexOf('@') >= 0 && val.length > 5) {
          // tem @ mas ainda incompleto — não gritar "telefone"
          setLoginErr('');
        } else if (/[a-zA-Z]/.test(val) && val.length >= 3 && val.indexOf('@') < 0) {
          // letras sem @: dica suave só se parece "quase email" longo
          setLoginErr('');
        } else {
          setLoginErr('');
        }
      } else {
        // phone: só erro se 4+ dígitos e ainda inválido (evita gritar no 1º dígito)
        var d = onlyDigits(val);
        if (d.length >= 8) setLoginErr(isPhoneBR(val) ? '' : MSG.phone);
        else setLoginErr('');
      }
      rewriteQuasarPhoneErrors(r);
    }

    function onIdentityBlur() {
      var val = String(el.value || '').trim();
      if (!val) {
        setLoginErr('');
        return;
      }
      var res = validateIdentity(val);
      setLoginErr(res === true ? '' : res);
      rewriteQuasarPhoneErrors(dialogRoot());
    }

    if (!el.__ch7LoginV9) {
      el.__ch7LoginV9 = 1;
      el.addEventListener('input', onIdentityInput);
      el.addEventListener('blur', onIdentityBlur);
    } else {
      onIdentityInput();
    }

    // intercept submit nativo: reescreve erros ruins
    if (!root.__ch7LoginSubmitV9) {
      root.__ch7LoginSubmitV9 = 1;
      root.addEventListener(
        'click',
        function (ev) {
          var btn = ev.target && ev.target.closest && ev.target.closest('button, .q-btn');
          if (!btn || btn.closest('#' + FORM_ID)) return;
          var t = (btn.textContent || '').replace(/\s+/g, ' ').trim();
          if (!/^Login$|^Entrar$/i.test(t)) return;
          var idEl = findLoginIdentityInput(dialogRoot());
          if (!idEl) return;
          var res = validateIdentity(idEl.value);
          if (res !== true) {
            setLoginErr(res);
            // deixa SPA tentar; reescreve mensagens em seguida
            setTimeout(function () {
              rewriteQuasarPhoneErrors(dialogRoot());
              setLoginErr(res);
            }, 50);
            setTimeout(function () {
              rewriteQuasarPhoneErrors(dialogRoot());
            }, 200);
          } else {
            setLoginErr('');
          }
        },
        true,
      );
    }

    // observer leve para mensagens Quasar (sem characterData = menos loop)
    if (!root.__ch7LoginMoV12) {
      root.__ch7LoginMoV12 = 1;
      var moT = null;
      var mo = new MutationObserver(function () {
        if (moT) return;
        moT = setTimeout(function () {
          moT = null;
          rewriteQuasarPhoneErrors(root);
        }, 120);
      });
      mo.observe(root, { childList: true, subtree: true });
    }
  }

  function sync() {
    cleanupOrphanForm();
    var root = dialogRoot();
    if (!root) {
      // sem login dialog: só limpa form órfão, NÃO toca em lottery
      var orphan = document.getElementById(FORM_ID);
      if (orphan) {
        try {
          orphan.remove();
        } catch (e) {}
      }
      return;
    }
    var mode = modeFromUi(root);
    if (mode === 'register') {
      mountRegisterForm();
      hideNativeRegisterButtons(root);
    } else {
      unmountRegisterForm();
      adaptLogin();
    }
  }

  function ensureCrypto() {
    if (window.CryptoJS || document.getElementById('ch7-cryptojs')) return;
    var s = document.createElement('script');
    s.id = 'ch7-cryptojs';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
    s.async = true;
    document.head.appendChild(s);
  }
  ensureCrypto();

  /** Pinia game store — fila de dialogs (só 1 ativo por vez) */
  function getGameStore() {
    try {
      var app = document.querySelector('#q-app');
      var vue = app && app.__vue_app__;
      var pinia = vue && vue.config && vue.config.globalProperties && vue.config.globalProperties.$pinia;
      if (!pinia || !pinia._s) return null;
      return pinia._s.get('game') || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Promo loginDialog para o topo da fila do gameStore.
   * Sem isso, registrationReward/winning ficam na frente e o cadastro nunca abre.
   */
  function promoteLoginDialog(loginType) {
    try {
      var game = getGameStore();
      if (!game) return false;
      if (loginType === 1 || loginType === 2) {
        if (typeof game.setLoginType === 'function') game.setLoginType(loginType);
        else game.loginType = loginType;
      }
      var list = game.loadingList;
      if (!list) return false;
      // remove tudo que não é login da fila (do começo)
      var guard = 0;
      while (guard++ < 30 && list.length && list[0] !== 'loginDialog') {
        var first = list[0];
        if (typeof game.removeDialog === 'function') {
          game.removeDialog(first);
        } else {
          try {
            if (game.loading) game.loading[first] = false;
          } catch (e1) {}
          list.shift();
        }
      }
      // se login não está na fila, adiciona
      var hasLogin = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i] === 'loginDialog') {
          hasLogin = true;
          break;
        }
      }
      if (!hasLogin) {
        if (typeof game.addDialog === 'function') game.addDialog('loginDialog');
        else {
          list.push('loginDialog');
          if (game.loading) {
            Object.keys(game.loading).forEach(function (k) {
              game.loading[k] = false;
            });
            game.loading.loginDialog = true;
          }
        }
      } else if (list[0] === 'loginDialog' && game.loading) {
        Object.keys(game.loading).forEach(function (k) {
          game.loading[k] = false;
        });
        game.loading.loginDialog = true;
      }
      // se login ficou no meio, reordena
      if (list[0] !== 'loginDialog') {
        var next = [];
        next.push('loginDialog');
        for (var j = 0; j < list.length; j++) {
          if (list[j] !== 'loginDialog') next.push(list[j]);
        }
        // mutate in place for reactivity
        list.splice(0, list.length);
        for (var k = 0; k < next.length; k++) list.push(next[k]);
        if (game.loading) {
          Object.keys(game.loading).forEach(function (key) {
            game.loading[key] = false;
          });
          game.loading.loginDialog = true;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Fecha popups visuais de lottery/atividade (backup do promoteLoginDialog) */
  function dismissBlockingPopups() {
    try {
      var dialogs = document.querySelectorAll('.q-dialog');
      for (var i = 0; i < dialogs.length; i++) {
        var d = dialogs[i];
        if (isLoginDialogEl(d)) continue;
        if (!d.querySelector('.slotBox, .lotteryBg, .rotary-table, .bottomBoxTitle')) continue;
        var closeBtn = null;
        var candidates = d.querySelectorAll('button.q-btn, .q-btn');
        for (var c = 0; c < candidates.length; c++) {
          var btn = candidates[c];
          var tx = (btn.textContent || '').replace(/\s+/g, ' ').trim();
          var r = btn.getBoundingClientRect();
          if (tx === '×' || tx === 'x' || tx === 'X') {
            closeBtn = btn;
            break;
          }
          if ((!tx || tx.length <= 1) && r.top < 90 && r.width <= 56 && r.height <= 56) {
            closeBtn = btn;
            break;
          }
        }
        if (closeBtn) {
          try {
            closeBtn.click();
          } catch (e1) {}
        }
      }
    } catch (e) {}
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      // header Entrar/Registrar ou tabs do dialog
      var node = el.closest(
        'button.entrar, button.registrar, .loginRegister button, .login-dialog-container button, .login-dialog button, .tab, .q-tab, .title-section .tab, .tabs .tab',
      );
      if (!node) {
        // fallback texto curto (evita capturar textos longos da lottery)
        node = el.closest('button, .q-btn, .tab, .q-tab');
        if (!node) return;
        var raw = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (raw.length > 24) return;
      }
      var t = (node.textContent || '').replace(/\s+/g, ' ').trim();
      var isHeaderAuth =
        (node.classList && (node.classList.contains('entrar') || node.classList.contains('registrar'))) ||
        !!(node.closest && node.closest('.loginRegister'));
      if (/^(Login|Entrar)$/i.test(t) || (node.classList && node.classList.contains('entrar'))) {
        lastMode = 'login';
        if (isHeaderAuth) {
          // SPA addDialog enfileira atrás de reward/winning — promove login
          setTimeout(function () {
            promoteLoginDialog(1);
            dismissBlockingPopups();
          }, 30);
          setTimeout(function () {
            promoteLoginDialog(1);
          }, 200);
          setTimeout(function () {
            promoteLoginDialog(1);
          }, 500);
        }
        [100, 300, 700, 1400, 2200].forEach(function (ms) {
          setTimeout(schedule, ms);
        });
        return;
      }
      if (
        /^(Registrar(-se)?|Cadastro|Register|Cadastrar)$/i.test(t) ||
        (node.classList && node.classList.contains('registrar'))
      ) {
        lastMode = 'register';
        if (isHeaderAuth) {
          setTimeout(function () {
            promoteLoginDialog(2);
            dismissBlockingPopups();
          }, 30);
          setTimeout(function () {
            promoteLoginDialog(2);
          }, 200);
          setTimeout(function () {
            promoteLoginDialog(2);
          }, 500);
        }
        [100, 300, 700, 1400, 2200].forEach(function (ms) {
          setTimeout(schedule, ms);
        });
      }
    },
    true,
  );

  var tmr = null;
  var __ch7RegBusy = false;
  function schedule() {
    // sem MO global no document — evita loop com Vue re-render
    if (__ch7RegBusy) return;
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      __ch7RegBusy = true;
      try {
        sync();
      } finally {
        setTimeout(function () {
          __ch7RegBusy = false;
        }, 250);
      }
    }, 80);
  }

  // limpa form órfão do v11 (montado na lottery)
  cleanupOrphanForm();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      cleanupOrphanForm();
      schedule();
    });
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  // boot curto: só tenta se login dialog existir
  setTimeout(schedule, 800);
  setTimeout(schedule, 2000);

  window.__ch7RegisterFields = {
    sync: sync,
    detectIdentity: detectIdentity,
    validateIdentity: validateIdentity,
    mode: function () {
      var r = dialogRoot();
      return lastMode || (r ? modeFromUi(r) : null);
    },
  };
})();
