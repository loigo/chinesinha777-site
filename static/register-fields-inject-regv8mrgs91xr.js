/**
 * Cadastro completo v8 — formulário próprio (não depende do patch frágil do SPA).
 * Campos: Nome Completo, E-mail, Telefone, Senha.
 * Login: adapta placeholder "Telefone ou E-mail".
 */
(function () {
  'use strict';
  if (window.__ch7RegisterFieldsV8) return;
  window.__ch7RegisterFieldsV8 = 1;

  var STYLE_ID = 'ch7-reg-v8-style';
  var FORM_ID = 'ch7-reg-full-form';
  var EDGE =
    window.__CH7_GOFUN_EDGE__ ||
    'https://bgajbbvgcqqkbvbtwnec.supabase.co/functions/v1/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';
  var lastMode = null; // 'login' | 'register'
  var submitting = false;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      /* esconde inputs nativos só no cadastro quando nosso form está ativo */
      '.login-dialog-container.ch7-reg-mode .form-section .q-field,' +
      '.login-dialog-container.ch7-reg-mode .form-section .q-input,' +
      '.login-dialog-container.ch7-reg-mode .form-section form > .q-field,' +
      '.login-dialog.ch7-reg-mode .form-section .q-field{' +
      'display:none!important;}' +
      '.login-dialog-container.ch7-reg-mode .form-section > .q-btn,' +
      '.login-dialog.ch7-reg-mode .form-section > .q-btn{' +
      'display:none!important;}' +
      '#' +
      FORM_ID +
      '{display:flex;flex-direction:column;gap:12px;width:100%;margin:8px 0 4px;box-sizing:border-box;position:relative;z-index:20;}' +
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
      ' .ch7f.err{border-color:rgba(255,120,120,.7);}' +
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
      ' .ch7-submit:active:not(:disabled){transform:scale(.98);}' +
      '#' +
      FORM_ID +
      ' .ch7-hint{font-size:11.5px;color:rgba(255,255,255,.45);padding:0 4px;}' +
      '.login-dialog-container.ch7-login-email-mode .country-code{display:none!important;}';
    document.head.appendChild(s);
  }

  function dialogRoot() {
    return (
      document.querySelector('.login-dialog-container') ||
      document.querySelector('.login-dialog') ||
      document.querySelector('.q-dialog .login-dialog-card') ||
      document.querySelector('.q-dialog') ||
      null
    );
  }

  function formSection(root) {
    return (
      (root && root.querySelector('.form-section')) ||
      (root && root.querySelector('form')) ||
      root
    );
  }

  function modeFromUi(root) {
    if (!root) return null;
    if (lastMode) return lastMode;

    // submit button text
    var buttons = root.querySelectorAll('button, .q-btn');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.closest('#' + FORM_ID)) continue;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Registrar(-se)?$/i.test(t) || /^Cadastrar$/i.test(t)) return 'register';
      if (/^Login$|^Entrar$/i.test(t)) return 'login';
    }

    // active tab
    var active =
      root.querySelector('.tab.active, .tabs .active, .q-tab--active, [class*="tab"].active') ||
      null;
    if (active) {
      var at = (active.textContent || '').replace(/\s+/g, ' ').trim();
      if (/Registrar|Cadastro|Register/i.test(at)) return 'register';
      if (/Login|Entrar/i.test(at)) return 'login';
    }

    // placeholder
    var inputs = root.querySelectorAll('input');
    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j].closest('#' + FORM_ID)) continue;
      var ph = String(inputs[j].placeholder || '');
      if (/Novo\s*Telefone/i.test(ph)) return 'register';
      if (/Telefone ou E-?mail/i.test(ph)) return 'login';
    }

    // "Nova Senha" visible
    var txt = (root.innerText || '').slice(0, 500);
    if (/Nova\s*Senha/i.test(txt)) return 'register';
    return 'login';
  }

  function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function isPhoneBR(s) {
    var d = onlyDigits(s);
    // 10 ou 11 dígitos (DDD + número), ou com 55
    if (d.length === 12 || d.length === 13) {
      if (d.indexOf('55') === 0) d = d.slice(2);
    }
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
    return { wrap: wrap, input: input };
  }

  function setErr(el, msg) {
    var box = document.getElementById(FORM_ID);
    if (!box) return;
    var err = box.querySelector('.ch7-err');
    if (!err) return;
    // clear field errs
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

  function validate(data) {
    var nameEl = document.getElementById('ch7f-name')?.parentElement;
    var emailEl = document.getElementById('ch7f-email')?.parentElement;
    var phoneEl = document.getElementById('ch7f-phone')?.parentElement;
    var passEl = document.getElementById('ch7f-pass')?.parentElement;
    var name = String(data.name || '').trim();
    if (name.length < 3) {
      setErr(nameEl, 'Informe o nome completo.');
      return false;
    }
    if (!isEmail(data.email)) {
      setErr(emailEl, 'Informe um e-mail válido.');
      return false;
    }
    if (!isPhoneBR(data.phone)) {
      setErr(phoneEl, 'Informe o telefone com DDD (10 ou 11 dígitos).');
      return false;
    }
    if (!strongPass(data.pass)) {
      setErr(passEl, 'A senha deve ter no mínimo 6 caracteres.');
      return false;
    }
    setErr(null, '');
    return true;
  }

  function toast(msg, ok) {
    try {
      // Quasar notify se existir
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

  function aesEncrypt(obj) {
    try {
      var C = window.CryptoJS;
      if (!C) return null;
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var src = C.enc.Utf8.parse(JSON.stringify(obj));
      var enc = C.AES.encrypt(src, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      return C.enc.Base64.stringify(enc.ciphertext);
    } catch (e) {
      return null;
    }
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
    // prefer plain JSON (edge aceita x-plain-json)
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
      var tok =
        loginData.token ||
        loginData.Token ||
        (loginData.userInfoData && loginData.userInfoData.token) ||
        '';
      var info = loginData.userInfoData || loginData.UserInfoData || {};
      var app = document.querySelector('#q-app') && document.querySelector('#q-app').__vue_app__;
      var pinia =
        app &&
        app.config &&
        app.config.globalProperties &&
        app.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        pinia._s.forEach(function (store) {
          try {
            if (typeof store.setUserData === 'function') {
              store.setUserData({
                token: tok,
                Token: tok,
                uid: info.uid || info.id,
                ...info,
              });
            }
            if (store.$id === 'auth' || store.token !== undefined) {
              if (store.token !== undefined) store.token = tok;
              if (store.isAuthenticated !== undefined) store.isAuthenticated = true;
            }
          } catch (e) {}
        });
      }
      // localStorage backup
      try {
        localStorage.setItem(
          'ch7_auth',
          JSON.stringify({ token: tok, uid: info.uid || info.id, at: Date.now() }),
        );
      } catch (e) {}
    } catch (e) {}
  }

  function closeDialog() {
    try {
      var close =
        document.querySelector('.login-dialog-container .q-dialog__close') ||
        document.querySelector('.login-dialog .close') ||
        document.querySelector('.q-dialog [aria-label="Close"]') ||
        document.querySelector('.login-dialog-container .q-icon');
      // click backdrop
      var backdrop = document.querySelector('.q-dialog__backdrop');
      if (backdrop) backdrop.click();
    } catch (e) {}
    // hard hide
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
      // format (11) 99999-9999 light
      if (d.length > 6) {
        phoneF.input.value =
          '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + (d.length > 7 ? '-' + d.slice(7) : '');
      } else if (d.length > 2) {
        phoneF.input.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      } else {
        phoneF.input.value = d;
      }
    });

    var err = document.createElement('div');
    err.className = 'ch7-err';
    err.setAttribute('role', 'alert');

    var hint = document.createElement('div');
    hint.className = 'ch7-hint';
    hint.textContent = 'Preencha todos os campos para criar sua conta.';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ch7-submit';
    btn.id = 'ch7f-submit';
    btn.textContent = 'Registrar-se';
    btn.addEventListener('click', onSubmit);

    // enter key
    [nameF, emailF, phoneF, passF].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') onSubmit(e);
      });
    });

    form.appendChild(nameF.wrap);
    form.appendChild(emailF.wrap);
    form.appendChild(phoneF.wrap);
    form.appendChild(passF.wrap);
    form.appendChild(err);
    form.appendChild(hint);
    form.appendChild(btn);
    return form;
  }

  function mountRegisterForm() {
    ensureStyle();
    var root = dialogRoot();
    if (!root) return;
    root.classList.add('ch7-reg-mode');
    root.classList.remove('ch7-login-email-mode');

    var section = formSection(root);
    if (!section) return;

    var existing = document.getElementById(FORM_ID);
    if (existing && section.contains(existing)) return;
    if (existing) {
      try {
        existing.remove();
      } catch (e) {}
    }

    var form = buildForm();
    // inserir no topo do form-section
    if (section.firstChild) section.insertBefore(form, section.firstChild);
    else section.appendChild(form);
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
  }

  function adaptLogin() {
    var root = dialogRoot();
    if (!root) return;
    root.classList.remove('ch7-reg-mode');
    var inputs = root.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.closest('#' + FORM_ID)) continue;
      if ((el.type || '').toLowerCase() === 'password') continue;
      var ph = String(el.placeholder || '');
      if (/telefone|phone|e-?mail|novo/i.test(ph) || el.type === 'tel') {
        el.placeholder = 'Telefone ou E-mail';
        el.setAttribute('aria-label', 'Telefone ou E-mail');
        el.setAttribute('maxlength', '80');
        el.setAttribute('type', 'text');
        el.setAttribute('inputmode', 'email');
        if (!el.__ch7LoginBound) {
          el.__ch7LoginBound = 1;
          el.addEventListener('input', function () {
            var r = dialogRoot();
            if (!r) return;
            if (/@/.test(el.value || '')) r.classList.add('ch7-login-email-mode');
            else r.classList.remove('ch7-login-email-mode');
          });
        }
        break;
      }
    }
  }

  function sync() {
    var root = dialogRoot();
    if (!root) {
      unmountRegisterForm();
      return;
    }
    var mode = modeFromUi(root);
    if (mode === 'register') {
      mountRegisterForm();
    } else {
      unmountRegisterForm();
      adaptLogin();
    }
  }

  // CryptoJS for AES fallback (login path may need later)
  function ensureCrypto() {
    if (window.CryptoJS || document.getElementById('ch7-cryptojs')) return;
    var s = document.createElement('script');
    s.id = 'ch7-cryptojs';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
    s.async = true;
    document.head.appendChild(s);
  }
  ensureCrypto();

  // click tabs
  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      var node = el.closest('button, .q-btn, .tab, .q-tab, span, div, a');
      if (!node) return;
      var t = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(Login|Entrar)$/i.test(t)) {
        lastMode = 'login';
        setTimeout(sync, 50);
        setTimeout(sync, 200);
      }
      if (/^(Registrar(-se)?|Cadastro|Register|Cadastrar)$/i.test(t)) {
        lastMode = 'register';
        setTimeout(sync, 50);
        setTimeout(sync, 150);
        setTimeout(sync, 400);
      }
      // open login dialog
      if (/Entrar|Login|Registrar|Cadastr/i.test(t)) {
        setTimeout(sync, 100);
        setTimeout(sync, 350);
      }
    },
    true,
  );

  var tmr = null;
  function schedule() {
    clearTimeout(tmr);
    tmr = setTimeout(sync, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  setTimeout(schedule, 300);
  setTimeout(schedule, 800);
  setTimeout(schedule, 1600);
  setInterval(function () {
    if (dialogRoot()) sync();
  }, 1200);

  if (!window.__ch7RegMoV8) {
    window.__ch7RegMoV8 = 1;
    var mo = new MutationObserver(function () {
      if (dialogRoot()) schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7RegisterFields = {
    sync: sync,
    mode: function () {
      return lastMode || modeFromUi(dialogRoot());
    },
  };
})();
