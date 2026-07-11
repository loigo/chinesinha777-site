/**
 * Cadastro: Nome Completo + E-mail + CPF (acima de telefone/senha).
 * Login: placeholder "Telefone ou E-mail" (sem campos extras).
 * Envia name/email/cpf no body (JSON ou AES) e headers x-ch7-*.
 * v6 — produção estável + CPF + login e-mail.
 */
(function () {
  'use strict';
  if (window.__ch7RegisterFieldsV7) return;
  window.__ch7RegisterFieldsV7 = 1;
  window.__ch7RegisterFieldsV6 = 1;

  var STYLE_ID = 'ch7-register-fields-style-v7';
  var BOX_ID = 'ch7-register-extra-fields';
  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';
  /** último clique do usuário: 'login' | 'register' | null */
  var lastAuthMode = null;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#' +
      BOX_ID +
      '{display:flex!important;flex-direction:column;gap:12px;width:100%;margin:0 0 12px;box-sizing:border-box;z-index:5;position:relative;}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-field{' +
      'display:flex!important;align-items:center;gap:10px;width:100%;min-height:48px;' +
      'padding:0 14px;border-radius:12px;box-sizing:border-box;' +
      'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);' +
      'color:#e8e8e8;font:400 15px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;' +
      '}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-field:focus-within{border-color:rgba(246,207,135,0.45);box-shadow:0 0 0 1px rgba(246,207,135,0.15);}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-ico{flex:0 0 auto;opacity:.75;font-size:16px;line-height:1;}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-field input{' +
      'flex:1 1 auto;min-width:0;border:0;outline:0;background:transparent;color:inherit;' +
      'font:inherit;padding:12px 0;-webkit-appearance:none;appearance:none;' +
      '}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-field input::placeholder{color:rgba(255,255,255,0.45);}' +
      '.login-dialog-container.ch7-login-email-mode .country-code{display:none!important;}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-err{color:#ff8a8a;font-size:12px;margin:-4px 0 0 4px;display:none;}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-err.show{display:block;}';
    document.head.appendChild(s);
  }

  function dialogRoot() {
    return (
      document.querySelector('.login-dialog-container') ||
      document.querySelector('.login-dialog') ||
      document.querySelector('.dialogBox.q-dialog') ||
      document.querySelector('.q-dialog .login-dialog-card') ||
      document.querySelector('.q-dialog') ||
      null
    );
  }

  function isRegisterContext() {
    var root = dialogRoot();
    if (!root) return false;

    // 0) clique recente do usuário (mais confiável no SPA)
    if (lastAuthMode === 'register') return true;
    if (lastAuthMode === 'login') return false;

    // 1) aba ativa (várias classes SPA/Quasar)
    var tabs = root.querySelectorAll(
      '.tab, .tabs > *, [class*="tab"], .q-tab, .loginRegister span, .loginRegister div',
    );
    for (var ti = 0; ti < tabs.length; ti++) {
      var tab = tabs[ti];
      var tabTxt = (tab.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/^(Login|Entrar|Registrar(-se)?|Cadastro|Register|Sign\s*up)$/i.test(tabTxt)) {
        // texto curto com registrar
        if (!/Registrar|Cadastro|Register/i.test(tabTxt) || tabTxt.length > 24) continue;
      }
      var cls = String(tab.className || '');
      var active =
        /\bactive\b|q-tab--active|selected|is-active/i.test(cls) ||
        tab.getAttribute('aria-selected') === 'true' ||
        tab.getAttribute('aria-current') === 'true';
      if (active) {
        if (/^Login$|^Entrar$/i.test(tabTxt)) return false;
        if (/Registrar|Cadastro|Register|Sign\s*up/i.test(tabTxt)) return true;
      }
    }

    var activeTab =
      root.querySelector('.tab.active') ||
      root.querySelector('.tabs .active') ||
      root.querySelector('[class*="tab"].active') ||
      root.querySelector('.q-tab--active');
    if (activeTab) {
      var at = (activeTab.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Login$|^Entrar$/i.test(at)) return false;
      if (/Registrar|Cadastro|Sign\s*up|Register/i.test(at)) return true;
    }

    // 2) botão submit principal
    var buttons = root.querySelectorAll('button, .q-btn, [type="submit"]');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.offsetParent === null && b.getClientRects().length === 0) continue;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Login$|^Entrar$/i.test(t)) return false;
      if (/^Registrar(-se)?$/i.test(t) || /Cadastrar/i.test(t)) return true;
    }

    // 3) placeholder telefone
    var phone = findPhoneInput();
    if (phone) {
      var ph = String(phone.getAttribute('placeholder') || phone.placeholder || '');
      if (/Novo\s*Telefone/i.test(ph)) return true;
      if (/Telefone ou E-?mail/i.test(ph) || /^Telefone$/i.test(ph.trim())) return false;
    }

    // 4) texto visível "Nova Senha" no dialog = cadastro
    var rootTxt = (root.innerText || root.textContent || '').slice(0, 400);
    if (/Nova\s*Senha/i.test(rootTxt) && /Novo\s*Telefone|Registrar/i.test(rootTxt)) {
      return true;
    }

    var href = String(location.href || '') + String(location.hash || '');
    if (/regist|register|signup|sign-up/i.test(href)) return true;
    return false;
  }

  function isLoginContext() {
    var root = dialogRoot();
    if (!root) return false;
    if (isRegisterContext()) return false;
    return !!findPasswordInput();
  }

  function findPhoneInput() {
    var root = dialogRoot() || document;
    var inputs = root.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.closest('#' + BOX_ID)) continue;
      if ((el.getAttribute('type') || '').toLowerCase() === 'password') continue;
      var ph =
        (el.getAttribute('placeholder') || '') +
        ' ' +
        (el.getAttribute('aria-label') || '');
      var type = (el.getAttribute('type') || 'text').toLowerCase();
      if (/telefone|phone|celular|mobile|e-?mail/i.test(ph)) return el;
      if (type === 'tel') return el;
      var parent = el.closest('label, .q-field, .q-input, div');
      if (parent && /\+55/.test(parent.textContent || '')) return el;
    }
    return null;
  }

  function findPasswordInput() {
    var root = dialogRoot() || document;
    var inputs = root.querySelectorAll('input[type="password"]');
    for (var i = 0; i < inputs.length; i++) {
      if (!inputs[i].closest('#' + BOX_ID)) return inputs[i];
    }
    return null;
  }

  function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  function isValidCpf(cpf) {
    var d = onlyDigits(cpf);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    var s = 0;
    for (var i = 0; i < 9; i++) s += Number(d[i]) * (10 - i);
    var r = (s * 10) % 11;
    if (r === 10) r = 0;
    if (r !== Number(d[9])) return false;
    s = 0;
    for (var j = 0; j < 10; j++) s += Number(d[j]) * (11 - j);
    r = (s * 10) % 11;
    if (r === 10) r = 0;
    return r === Number(d[10]);
  }

  function maskCpf(v) {
    var d = onlyDigits(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
    return (
      d.slice(0, 3) +
      '.' +
      d.slice(3, 6) +
      '.' +
      d.slice(6, 9) +
      '-' +
      d.slice(9)
    );
  }

  function makeField(opts) {
    var wrap = document.createElement('div');
    wrap.className = 'ch7-reg-field';
    wrap.setAttribute('data-ch7-field', opts.key);

    var ico = document.createElement('span');
    ico.className = 'ch7-reg-ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = opts.icon;

    var input = document.createElement('input');
    input.type = opts.type || 'text';
    input.placeholder = opts.placeholder;
    input.autocomplete = opts.autocomplete || 'off';
    input.name = opts.name;
    input.id = 'ch7-reg-' + opts.key;
    input.setAttribute('aria-label', opts.placeholder);
    if (opts.inputmode) input.setAttribute('inputmode', opts.inputmode);
    if (opts.maxlength) input.setAttribute('maxlength', String(opts.maxlength));

    wrap.appendChild(ico);
    wrap.appendChild(input);
    return { wrap: wrap, input: input };
  }

  function removeExtraFields() {
    var old = document.getElementById(BOX_ID);
    if (old) old.remove();
  }

  function adaptLoginIdentityField() {
    var root = dialogRoot();
    var phone = findPhoneInput();
    if (!phone || !isLoginContext()) {
      if (root) root.classList.remove('ch7-login-email-mode');
      return;
    }
    ensureStyle();
    phone.removeAttribute('maxlength');
    phone.setAttribute('maxlength', '80');
    phone.setAttribute('type', 'text');
    phone.setAttribute('inputmode', 'email');
    phone.setAttribute('autocomplete', 'username');
    phone.placeholder = 'Telefone ou E-mail';
    phone.setAttribute('aria-label', 'Telefone ou E-mail');

    var val = String(phone.value || '');
    if (root) {
      if (/@/.test(val)) root.classList.add('ch7-login-email-mode');
      else root.classList.remove('ch7-login-email-mode');
    }
    if (!phone.__ch7LoginBound) {
      phone.__ch7LoginBound = true;
      phone.addEventListener('input', function () {
        var r = dialogRoot();
        var v = String(phone.value || '');
        if (r) {
          if (/@/.test(v)) r.classList.add('ch7-login-email-mode');
          else r.classList.remove('ch7-login-email-mode');
        }
      });
    }
  }

  function injectFields() {
    var reg = isRegisterContext();
    if (!reg) {
      removeExtraFields();
      try {
        adaptLoginIdentityField();
      } catch (e) {}
      return;
    }

    ensureStyle();
    // se já existe, garante que continua no DOM (SPA pode remountar)
    var existing = document.getElementById(BOX_ID);
    if (existing && document.body.contains(existing)) return;
    if (existing) {
      try {
        existing.remove();
      } catch (e) {}
    }

    var phone = findPhoneInput();
    var pass = findPasswordInput();
    if (!phone && !pass) return;

    var anchor = phone || pass;
    var container =
      anchor.closest('.q-card__section, .q-dialog__inner, form, .q-page, .q-card, .form-section') ||
      anchor.parentElement;
    if (!container) return;

    var phoneRow =
      (phone && (phone.closest('.q-field') || phone.closest('label') || phone.parentElement)) ||
      (pass && (pass.closest('.q-field') || pass.parentElement));

    var box = document.createElement('div');
    box.id = BOX_ID;

    var nameF = makeField({
      key: 'name',
      name: 'ch7_name',
      icon: '👤',
      placeholder: 'Nome Completo',
      autocomplete: 'name',
      type: 'text',
    });
    var emailF = makeField({
      key: 'email',
      name: 'ch7_email',
      icon: '✉',
      placeholder: 'E-mail',
      autocomplete: 'email',
      type: 'email',
      inputmode: 'email',
    });
    var cpfF = makeField({
      key: 'cpf',
      name: 'ch7_cpf',
      icon: '🪪',
      placeholder: 'CPF',
      autocomplete: 'off',
      type: 'text',
      inputmode: 'numeric',
      maxlength: 14,
    });
    cpfF.input.addEventListener('input', function () {
      var pos = cpfF.input.selectionStart;
      var before = cpfF.input.value;
      cpfF.input.value = maskCpf(before);
      try {
        cpfF.input.setSelectionRange(cpfF.input.value.length, cpfF.input.value.length);
      } catch (e) {}
    });

    var err = document.createElement('div');
    err.className = 'ch7-reg-err';
    err.id = 'ch7-reg-err';

    box.appendChild(nameF.wrap);
    box.appendChild(emailF.wrap);
    box.appendChild(cpfF.wrap);
    box.appendChild(err);

    if (phoneRow && phoneRow.parentElement) {
      phoneRow.parentElement.insertBefore(box, phoneRow);
    } else {
      container.insertBefore(box, container.firstChild);
    }

    // adapta placeholder do telefone no cadastro
    if (phone) {
      phone.placeholder = phone.placeholder || 'Novo Telefone';
    }
  }

  function readExtra() {
    var nameEl = document.getElementById('ch7-reg-name');
    var emailEl = document.getElementById('ch7-reg-email');
    var cpfEl = document.getElementById('ch7-reg-cpf');
    return {
      name: nameEl ? String(nameEl.value || '').trim() : '',
      email: emailEl ? String(emailEl.value || '').trim().toLowerCase() : '',
      cpf: cpfEl ? onlyDigits(cpfEl.value) : '',
    };
  }

  function showRegError(msg) {
    var el = document.getElementById('ch7-reg-err');
    if (!el) return;
    if (!msg) {
      el.classList.remove('show');
      el.textContent = '';
      return;
    }
    el.textContent = msg;
    el.classList.add('show');
  }

  function validateExtra(extra) {
    if (!extra.name || extra.name.length < 3) {
      showRegError('Informe o nome completo.');
      return false;
    }
    if (!extra.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extra.email)) {
      showRegError('Informe um e-mail válido.');
      return false;
    }
    if (!extra.cpf || !isValidCpf(extra.cpf)) {
      showRegError('Informe um CPF válido.');
      return false;
    }
    showRegError('');
    return true;
  }

  // ── AES helpers (mesmo key do SPA) ──
  function tryDecryptAes(text) {
    var raw = String(text || '').trim();
    if (!raw || raw.charAt(0) === '{' || raw.charAt(0) === '[') return null;
    try {
      var C = window.CryptoJS;
      if (!C) return null;
      var key = C.enc.Utf8.parse(CRYPTO_KEY);
      var params = C.lib.CipherParams.create({
        ciphertext: C.enc.Base64.parse(raw),
      });
      var dec = C.AES.decrypt(params, key, {
        mode: C.mode.ECB,
        padding: C.pad.Pkcs7,
      });
      var plain = dec.toString(C.enc.Utf8);
      if (plain && plain.charAt(0) === '{') return JSON.parse(plain);
    } catch (e) {}
    return null;
  }

  function tryEncryptAes(obj) {
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

  function applyExtraToObj(target, extra) {
    if (!target || typeof target !== 'object') target = {};
    if (extra.name) {
      target.name = extra.name;
      target.Name = extra.name;
      target.nick = target.nick || extra.name;
      target.Nick = target.Nick || extra.name;
      target.realName = extra.name;
    }
    if (extra.email) {
      target.email = extra.email;
      target.Email = extra.email;
      target.mail = extra.email;
    }
    if (extra.cpf) {
      target.cpf = extra.cpf;
      target.CPF = extra.cpf;
      target.Cpf = extra.cpf;
    }
    return target;
  }

  function enrichRegisterBody(text) {
    var extra = readExtra();
    if (!extra.name && !extra.email && !extra.cpf) return text;
    // plain JSON
    try {
      if (text && (text.charAt(0) === '{' || text.charAt(0) === '[')) {
        var body = JSON.parse(text);
        if (!body || typeof body !== 'object') body = {};
        var target = body.data && typeof body.data === 'object' ? body.data : body;
        target = applyExtraToObj(target, extra);
        if (body.data && typeof body.data === 'object') body.data = target;
        else body = target;
        return JSON.stringify(body);
      }
    } catch (e) {}
    // AES ciphertext
    var dec = tryDecryptAes(text);
    if (dec && typeof dec === 'object') {
      var t2 = dec.data && typeof dec.data === 'object' ? dec.data : dec;
      t2 = applyExtraToObj(t2, extra);
      if (dec.data && typeof dec.data === 'object') dec.data = t2;
      else dec = t2;
      var enc = tryEncryptAes(dec);
      if (enc) return enc;
    }
    return text;
  }

  function isRegisterApi(url) {
    return /account\/(regist|register)/i.test(String(url || ''));
  }

  function isLoginApi(url) {
    return /account\/login/i.test(String(url || '')) && !/loginby/i.test(String(url || ''));
  }

  function patchHeadersWithExtra(headers, extra) {
    if (!extra) return headers;
    function set(h, k, v) {
      if (!v) return;
      if (typeof Headers !== 'undefined' && h instanceof Headers) {
        h.set(k, v);
      } else if (h && typeof h === 'object' && !Array.isArray(h)) {
        h[k] = v;
      }
    }
    if (!headers) headers = {};
    set(headers, 'x-ch7-name', extra.name);
    set(headers, 'x-ch7-email', extra.email);
    set(headers, 'x-ch7-cpf', extra.cpf);
    return headers;
  }

  // Validate on register submit click
  document.addEventListener(
    'click',
    function (ev) {
      try {
        if (!isRegisterContext()) return;
        var el = ev.target;
        if (!el || !el.closest) return;
        var btn = el.closest('button, .q-btn, [type="submit"]');
        if (!btn) return;
        var t = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/Registrar|Cadastrar|Sign\s*up|Register/i.test(t)) return;
        var extra = readExtra();
        if (!validateExtra(extra)) {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            ev.stopImmediatePropagation();
          } catch (e) {}
        }
      } catch (e) {}
    },
    true,
  );

  // fetch
  if (typeof window.fetch === 'function' && !window.__ch7RegFetchV6) {
    window.__ch7RegFetchV6 = 1;
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : input && input.url;
        if (isRegisterApi(url)) {
          var extra = readExtra();
          init = init || {};
          if (init.body && typeof init.body === 'string') {
            init = Object.assign({}, init, { body: enrichRegisterBody(init.body) });
          }
          init.headers = patchHeadersWithExtra(init.headers || {}, extra);
        }
      } catch (e) {}
      return _fetch.call(this, input, init);
    };
  }

  // XHR
  if (typeof XMLHttpRequest !== 'undefined' && !window.__ch7RegXhrV6) {
    window.__ch7RegXhrV6 = 1;
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    var _set = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__ch7RegUrl = url == null ? '' : String(url);
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      try {
        if (isRegisterApi(this.__ch7RegUrl)) {
          var extra = readExtra();
          if (typeof body === 'string') body = enrichRegisterBody(body);
          try {
            if (extra.name) _set.call(this, 'x-ch7-name', extra.name);
            if (extra.email) _set.call(this, 'x-ch7-email', extra.email);
            if (extra.cpf) _set.call(this, 'x-ch7-cpf', extra.cpf);
          } catch (e2) {}
        }
      } catch (e) {}
      return _send.call(this, body);
    };
  }

  // Load CryptoJS if needed (for AES body enrich)
  function ensureCrypto() {
    if (window.CryptoJS) return;
    if (document.getElementById('ch7-cryptojs')) return;
    var s = document.createElement('script');
    s.id = 'ch7-cryptojs';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
    s.async = true;
    document.head.appendChild(s);
  }
  try {
    ensureCrypto();
  } catch (e) {}

  // observe
  var t = null;
  var running = false;
  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      if (running) return;
      running = true;
      try {
        if (!dialogRoot()) return;
        injectFields();
      } catch (e) {
        /* */
      } finally {
        running = false;
      }
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      // detecta clique nas abas Login / Registrar
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var clickable = el.closest(
        'button, .q-btn, .tab, .q-tab, [class*="tab"], span, div, a',
      );
      if (clickable) {
        var ct = (clickable.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^(Login|Entrar)$/i.test(ct) || /^Login$/i.test(t)) lastAuthMode = 'login';
        if (
          /^(Registrar(-se)?|Cadastro|Register|Sign\s*up|Cadastrar)$/i.test(ct) ||
          /Registrar/i.test(t)
        ) {
          lastAuthMode = 'register';
        }
      }
      if (
        el.closest(
          '.loginRegister, .login-dialog, .q-dialog, button, .q-btn, [class*="login"], [class*="Login"], [class*="regist"]',
        )
      ) {
        schedule();
        setTimeout(schedule, 80);
        setTimeout(schedule, 250);
        setTimeout(schedule, 600);
      }
    },
    true,
  );
  setTimeout(schedule, 200);
  setTimeout(schedule, 600);
  setTimeout(schedule, 1200);
  setTimeout(schedule, 2500);
  setInterval(function () {
    if (dialogRoot()) schedule();
  }, 1500);

  if (!window.__ch7RegFieldsMoV6) {
    window.__ch7RegFieldsMoV6 = 1;
    var mo = new MutationObserver(function () {
      if (dialogRoot()) schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__ch7RegisterFields = {
    inject: injectFields,
    read: readExtra,
    isRegister: isRegisterContext,
  };
})();
