/**
 * Cadastro: injeta Nome Completo + E-mail acima de Telefone/Senha
 * e anexa name/email no body de /account/regist|register.
 *
 * Login: NÃO injeta Nome/E-mail — só Telefone/E-mail nativo + Senha.
 */
(function () {
  'use strict';

  var STYLE_ID = 'ch7-register-fields-style';
  var BOX_ID = 'ch7-register-extra-fields';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#' +
      BOX_ID +
      '{display:flex;flex-direction:column;gap:12px;width:100%;margin:0 0 12px;box-sizing:border-box;}' +
      '#' +
      BOX_ID +
      ' .ch7-reg-field{' +
      'display:flex;align-items:center;gap:10px;width:100%;min-height:48px;' +
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
      /* Login: esconde +55 se o usuário digitar e-mail */
      '.login-dialog-container.ch7-login-email-mode .country-code{display:none!important;}';
    document.head.appendChild(s);
  }

  function dialogRoot() {
    return (
      document.querySelector('.login-dialog-container') ||
      document.querySelector('.login-dialog') ||
      document.querySelector('.dialogBox.q-dialog') ||
      document.querySelector('.q-dialog .login-dialog-card') ||
      null
    );
  }

  /**
   * true somente na aba/cadastro Registrar.
   * Nunca confiar só em "Registrar-se" (tab sempre visível no Login).
   */
  function isRegisterContext() {
    var root = dialogRoot();
    if (!root) {
      // sem dialog: não injeta (evita lixo na home)
      return false;
    }

    // 1) Aba ativa
    var activeTab =
      root.querySelector('.tab.active') ||
      root.querySelector('.tabs .active') ||
      root.querySelector('[class*="tab"].active');
    if (activeTab) {
      var tabTxt = (activeTab.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Login$|^Entrar$/i.test(tabTxt)) return false;
      if (/Registrar|Cadastro|Sign\s*up|Register/i.test(tabTxt)) return true;
    }

    // 2) Botão principal de submit (azul grande)
    var buttons = root.querySelectorAll('button, .q-btn, [type="submit"]');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.offsetParent === null && b.getClientRects().length === 0) continue;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      // submit principal costuma ser só "Login" ou "Registrar-se"
      if (/^Login$|^Entrar$/i.test(t)) return false;
      if (/^Registrar(-se)?$/i.test(t)) return true;
    }

    // 3) Placeholder do campo telefone nativo
    var phone = findPhoneInput();
    if (phone) {
      var ph = String(phone.getAttribute('placeholder') || phone.placeholder || '');
      if (/Novo\s*Telefone/i.test(ph)) return true;
      if (/^Telefone$/i.test(ph.trim()) || /Telefone ou E-?mail/i.test(ph)) return false;
    }

    // 4) URL (raro no SPA modal)
    var href = String(location.href || '') + String(location.hash || '');
    if (/regist|register|signup|sign-up/i.test(href)) return true;

    return false;
  }

  function isLoginContext() {
    var root = dialogRoot();
    if (!root) return false;
    if (isRegisterContext()) return false;
    // dialog de auth aberto com senha
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

    wrap.appendChild(ico);
    wrap.appendChild(input);
    return { wrap: wrap, input: input };
  }

  function removeExtraFields() {
    var old = document.getElementById(BOX_ID);
    if (old) old.remove();
  }

  /** Login: um único campo aceita telefone ou e-mail */
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

    // Neutraliza validação nativa Quasar (só dígitos) se ainda estiver ativa
    try {
      var field = phone.closest('.q-field') || phone.closest('.q-input');
      if (field && field.__vueParentComponent) {
        var props = field.__vueParentComponent.props;
        if (props && Array.isArray(props.rules)) {
          // deixa o rules do formulário; se for só dígitos, será coberto pelo patch de assets
        }
      }
    } catch (e) {}

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

  /**
   * Intercepta respostas de login e normaliza mensagens amigáveis no toast do SPA.
   */
  function patchLoginErrorMessages() {
    if (window.__ch7LoginMsgPatch) return;
    window.__ch7LoginMsgPatch = 1;

    function mapMsg(msg) {
      var m = String(msg || '');
      if (/acccount does not exist|password is incorrect|account does not exist/i.test(m)) {
        return 'E-mail/telefone ou senha incorretos';
      }
      if (/invalid request param/i.test(m) && /@/.test(m)) return 'E-mail inválido';
      if (/E-mail inválido|Número de telefone inválido|E-mail\/telefone/i.test(m)) return m;
      if (/invalid request param/i.test(m)) return m;
      return m;
    }

    // Quasar Notify intercept
    try {
      var desc = Object.getOwnPropertyDescriptor(window, 'Quasar') || null;
    } catch (e) {}

    // Intercepta body de resposta de login (fetch)
    if (typeof window.fetch === 'function') {
      var _fetch = window.fetch;
      window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        return _fetch.apply(this, arguments).then(function (res) {
          if (!/account\/login/i.test(url) || !res || !res.clone) return res;
          res
            .clone()
            .text()
            .then(function (txt) {
              try {
                // pode ser AES (base64) — ignora
                if (!txt || txt.length < 2 || txt[0] !== '{') return;
                var j = JSON.parse(txt);
                if (j && j.msg) j.msg = mapMsg(j.msg);
              } catch (e) {}
            })
            .catch(function () {});
          return res;
        });
      };
    }
  }

  try {
    patchLoginErrorMessages();
  } catch (e) {}

  function injectFields() {
    // Login → remove extras e adapta identidade
    if (!isRegisterContext()) {
      removeExtraFields();
      try {
        adaptLoginIdentityField();
      } catch (e) {}
      return;
    }

    ensureStyle();
    if (document.getElementById(BOX_ID)) return;

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

    box.appendChild(nameF.wrap);
    box.appendChild(emailF.wrap);

    if (phoneRow && phoneRow.parentElement) {
      phoneRow.parentElement.insertBefore(box, phoneRow);
    } else {
      container.insertBefore(box, container.firstChild);
    }
  }

  function readExtra() {
    var nameEl = document.getElementById('ch7-reg-name');
    var emailEl = document.getElementById('ch7-reg-email');
    return {
      name: nameEl ? String(nameEl.value || '').trim() : '',
      email: emailEl ? String(emailEl.value || '').trim().toLowerCase() : '',
    };
  }

  function enrichRegisterBody(text) {
    var extra = readExtra();
    if (!extra.name && !extra.email) return text;
    try {
      var body = text ? JSON.parse(text) : {};
      if (!body || typeof body !== 'object') body = {};
      var target = body.data && typeof body.data === 'object' ? body.data : body;
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
      if (body.data && typeof body.data === 'object') body.data = target;
      else body = target;
      return JSON.stringify(body);
    } catch (e) {
      return text;
    }
  }

  function isRegisterApi(url) {
    return /account\/(regist|register)/i.test(String(url || ''));
  }

  // fetch
  if (typeof window.fetch === 'function') {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : input && input.url;
        if (isRegisterApi(url) && init && init.body && typeof init.body === 'string') {
          init = Object.assign({}, init, { body: enrichRegisterBody(init.body) });
        }
      } catch (e) {}
      return _fetch.call(this, input, init);
    };
  }

  // XHR
  if (typeof XMLHttpRequest !== 'undefined') {
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__ch7RegUrl = url;
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      try {
        if (isRegisterApi(this.__ch7RegUrl) && typeof body === 'string') {
          body = enrichRegisterBody(body);
        }
      } catch (e) {}
      return _send.call(this, body);
    };
  }

  // observe SPA route/dialog changes (freeze-safe)
  var t = null;
  var running = false;
  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      if (running) return;
      running = true;
      try {
        // só trabalha se há dialog de login/registro
        if (!dialogRoot()) return;
        injectFields();
      } catch (e) {
        /* ignore */
      } finally {
        running = false;
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  // click só em botões Entrar/Registrar (não em todo documento)
  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      if (
        el.closest(
          '.loginRegister, .login-dialog, .q-dialog, button, .q-btn, [class*="login"], [class*="Login"]',
        )
      ) {
        schedule();
      }
    },
    true,
  );

  if (!window.__ch7RegFieldsMo) {
    window.__ch7RegFieldsMo = 1;
    var mo = new MutationObserver(function () {
      if (dialogRoot()) schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
