/**
 * Auth validação v19 — profissional (segurança + glass UI).
 * Login: E-mail ou Telefone + Senha, validação em tempo real, CTA Entrar azul.
 * Cadastro: Nome, E-mail, Telefone (+55), Senha forte, Registrar-se amarelo, texto 18+.
 * Design: dark glassmorphism, pills, campos alinhados, mobile-first.
 * CRÍTICO: NUNCA montar form em .q-dialog genérico (lottery/reward).
 */
(function () {
  'use strict';
  if (window.__ch7RegisterFieldsV20) return;
  window.__ch7RegisterFieldsV20 = 1;
  window.__ch7RegisterFieldsV19 = 1;
  window.__ch7RegisterFieldsV18 = 1;
  window.__ch7RegisterFieldsV17 = 1;
  window.__ch7RegisterFieldsV16 = 1;
  window.__ch7RegisterFieldsV15 = 1;
  window.__ch7RegisterFieldsV14 = 1;
  window.__ch7RegisterFieldsV13 = 1;
  window.__ch7RegisterFieldsV12 = 1;
  window.__ch7RegisterFieldsV9 = 1;
  window.__ch7RegisterFieldsV8 = 1;

  /** Cadastro multi-campo ch7 (validação forte + UX profissional) */
  var USE_CUSTOM_REGISTER = true;

  var STYLE_ID = 'ch7-reg-v20-style';
  var AGE_COPY =
    'Ao acessar o site, confirmo que tenho 18 anos e li os termos';
  var FORM_ID = 'ch7-reg-full-form';
  var LOGIN_ERR_ID = 'ch7-login-id-err';
  var LOGIN_PASS_ERR_ID = 'ch7-login-pass-err';
  var EDGE =
    window.__CH7_GOFUN_EDGE__ ||
    'https://vcohnsuomswwfxqlmllm.supabase.co/functions/v1/gofun';
  var ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWpiYnZnY3Fxa2J2YnR3bmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcyODUsImV4cCI6MjA5OTM1MzI4NX0.AwabvvbOtljHtrvk_KJGKQVuvZLJRphrtcrSQnojGr0';
  var CRYPTO_KEY = '9EzYC7IZE1PTREu8';
  var lastMode = null;
  var submitting = false;
  var MSG = {
    emptyId: 'Informe e-mail ou telefone com DDD',
    email: 'Digite um e-mail válido (ex: nome@email.com)',
    phone: 'Telefone inválido. Use DDD + número (11 dígitos)',
    phoneShort: 'Complete o telefone com DDD',
    name: 'Informe seu nome completo (mín. 3 letras)',
    nameShort: 'Nome muito curto',
    pass: 'Senha fraca: use 8+ caracteres, com letra e número',
    passLogin: 'Informe sua senha (mínimo 6 caracteres)',
    passMatch: 'As senhas não conferem',
    dup: 'Telefone ou e-mail já cadastrado. Faça login.',
    network: 'Erro de conexão. Verifique a internet e tente de novo.',
    generic: 'Não foi possível concluir. Tente novamente.',
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
    var e = String(s || '').trim().toLowerCase();
    // rejeita espaços, pontos duplos, domínio sem TLD
    if (!e || e.length > 80) return false;
    if (/\s/.test(e)) return false;
    if (/\.\./.test(e)) return false;
    return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(e);
  }

  function isPhoneBR(s) {
    var d = onlyDigits(s);
    if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);
    // celular 11 (9xxxx) ou fixo 10
    if (d.length === 11) return /^[1-9]{2}9\d{8}$/.test(d);
    if (d.length === 10) return /^[1-9]{2}[2-5]\d{7}$/.test(d);
    return false;
  }

  function normalizePhone(s) {
    var d = onlyDigits(s);
    if (d.indexOf('55') === 0 && (d.length === 12 || d.length === 13)) d = d.slice(2);
    return d;
  }

  /** Login: backend aceita 6+. Cadastro: senha forte (8+ letra e número). */
  function loginPassOk(s) {
    return String(s || '').length >= 6;
  }
  function strongPass(s) {
    var p = String(s || '');
    if (p.length < 8) return false;
    if (!/[A-Za-zÀ-ú]/.test(p)) return false;
    if (!/\d/.test(p)) return false;
    // bloqueia senhas óbvias
    if (/^(12345678|password|senha123|abcdefgh|11111111|00000000)$/i.test(p)) return false;
    return true;
  }
  function passStrengthLabel(s) {
    var p = String(s || '');
    if (!p) return '';
    if (p.length < 6) return 'Muito fraca';
    if (!strongPass(p)) return 'Fraca — use 8+ com letra e número';
    if (p.length >= 10 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p))
      return 'Forte';
    return 'Boa';
  }

  /** @returns {true|string} */
  function validateIdentity(raw) {
    var s = String(raw || '').trim();
    var kind = detectIdentity(s);
    if (kind === 'empty') return MSG.emptyId;
    if (kind === 'email') return isEmail(s) || MSG.email;
    var d = onlyDigits(s);
    if (d.length > 0 && d.length < 10) return MSG.phoneShort;
    return isPhoneBR(s) || MSG.phone;
  }

  function ensureStyle() {
    try {
      var oldIds = [
        'ch7-reg-v8-style',
        'ch7-reg-v9-style',
        'ch7-reg-v13-style',
        'ch7-reg-v14-style',
        'ch7-reg-v16-style',
        'ch7-reg-v17-style',
        'ch7-reg-v18-style',
        'ch7-reg-v19-style',
      ];
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
      /* ── Card glass dark ── */
      '.q-dialog.dialogBox .q-dialog__inner,' +
      '.q-dialog--modal.dialogBox .q-dialog__inner{' +
      'padding:12px!important;align-items:center!important;justify-content:center!important;' +
      'box-sizing:border-box!important;}' +
      '.q-dialog.dialogBox .login-dialog-container,' +
      '.q-dialog.dialogBox .login-dialog,' +
      '.q-dialog.dialogBox .login-dialog-card,' +
      '.login-dialog-container,' +
      '.login-dialog,' +
      '.login-dialog-card{' +
      'width:min(400px,92vw)!important;max-width:400px!important;' +
      'max-height:min(90vh,680px)!important;height:auto!important;min-height:0!important;' +
      'margin:0 auto!important;overflow-x:hidden!important;overflow-y:auto!important;' +
      'border-radius:20px!important;box-sizing:border-box!important;' +
      'border:1px solid rgba(255,255,255,.1)!important;' +
      'box-shadow:0 24px 64px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)!important;' +
      'backdrop-filter:blur(18px) saturate(1.2)!important;-webkit-backdrop-filter:blur(18px) saturate(1.2)!important;' +
      '-webkit-overflow-scrolling:touch;}' +
      '.login-dialog-card{' +
      'display:flex!important;flex-direction:column!important;' +
      'background:linear-gradient(165deg,rgba(36,34,40,.96) 0%,rgba(18,17,22,.98) 55%,rgba(12,11,14,.99) 100%)!important;}' +
      /* Banner "Depósito Bônus Diário" — completo, sem corte */
      '.login_bg_wrapper,' +
      '.login-dialog-card .login_bg_wrapper,' +
      '.login-dialog-container .login_bg_wrapper{' +
      'max-height:none!important;height:auto!important;min-height:0!important;' +
      'overflow:hidden!important;flex:0 0 auto!important;width:100%!important;' +
      'line-height:0!important;border-radius:20px 20px 0 0!important;}' +
      '.login_bg_wrapper .login_bg,' +
      '.login-dialog-card img.login_bg,' +
      '.login-dialog-container img.login_bg,' +
      '.login-dialog img.login_bg,' +
      'img.login_bg{' +
      'max-height:none!important;height:auto!important;width:100%!important;' +
      'max-width:100%!important;object-fit:contain!important;object-position:center top!important;' +
      'display:block!important;vertical-align:top!important;}' +
      '.login-dialog-container .form-section, .login-dialog .form-section{' +
      'padding:14px 18px 10px!important;margin:0!important;height:auto!important;max-height:none!important;' +
      'flex:1 1 auto!important;overflow:visible!important;box-sizing:border-box!important;}' +
      '.login-dialog-container .submit-section, .login-dialog .submit-section{' +
      'padding:4px 18px 18px!important;margin:0!important;height:auto!important;}' +
      '.login-dialog-container .title-section, .login-dialog .title-section,' +
      '.login-dialog-container .tabs, .login-dialog .tabs{' +
      'padding:10px 14px 0!important;height:auto!important;min-height:0!important;}' +
      /* esconde +55 no login smart */
      '.login-dialog-container.ch7-smart-id .country-code,' +
      '.login-dialog-container.ch7-login-email-mode .country-code,' +
      '.login-dialog.ch7-smart-id .country-code{' +
      'display:none!important;width:0!important;height:0!important;overflow:hidden!important;' +
      'margin:0!important;padding:0!important;}' +
      /* campos glass */
      '.login-dialog-container .q-field, .login-dialog .q-field,' +
      '.login-dialog-container .form-section .q-field{' +
      'width:100%!important;margin:0 0 10px!important;}' +
      '.login-dialog-container .q-field__control, .login-dialog .q-field__control{' +
      'min-height:50px!important;height:auto!important;border-radius:14px!important;' +
      'background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.12)!important;' +
      'padding:0 12px!important;transition:border-color .15s,box-shadow .15s!important;}' +
      '.login-dialog-container .q-field--focused .q-field__control,' +
      '.login-dialog .q-field--focused .q-field__control{' +
      'border-color:rgba(91,140,255,.55)!important;box-shadow:0 0 0 3px rgba(91,140,255,.15)!important;}' +
      '.login-dialog-container input, .login-dialog input{' +
      'font-size:15px!important;max-width:100%!important;color:#f5f5f7!important;}' +
      '.login-dialog-container input::placeholder, .login-dialog input::placeholder{' +
      'color:rgba(255,255,255,.4)!important;}' +
      '.login-dialog-container .forgot, .login-dialog .forgot,' +
      '.login-dialog-container .forgot a, .login-dialog .forgot a{' +
      'font-size:13px!important;color:#f6cf87!important;text-align:right!important;' +
      'padding:6px 4px 10px!important;cursor:pointer!important;}' +
      /* CTA pills */
      '.login-dialog-container .submit-section .q-btn, .login-dialog .submit-section .q-btn,' +
      '.login-dialog-container button.q-btn.full-width:not(.ch7-submit){' +
      'min-height:50px!important;border-radius:999px!important;font-weight:800!important;' +
      'font-size:17px!important;letter-spacing:.02em!important;border:0!important;' +
      'transition:transform .12s,filter .12s!important;}' +
      '.login-dialog-container:not(.ch7-reg-mode) .submit-section .q-btn,' +
      '.login-dialog:not(.ch7-reg-mode) .submit-section .q-btn,' +
      '.login-dialog-container:not(.ch7-reg-mode) button.q-btn.full-width:not(.ch7-submit){' +
      'background:linear-gradient(180deg,#6b9bff 0%,#4b62ed 48%,#3a4fd4 100%)!important;' +
      'color:#fff!important;box-shadow:0 10px 28px rgba(59,98,237,.4)!important;}' +
      '.login-dialog-container.ch7-native-reg .submit-section .q-btn,' +
      '.login-dialog.ch7-native-reg .submit-section .q-btn{' +
      'background:linear-gradient(180deg,#ffe566,#f0b429 55%,#d4920a)!important;' +
      'color:#1a1208!important;box-shadow:0 10px 28px rgba(240,180,41,.35)!important;border-radius:999px!important;}' +
      /* erros legíveis */
      '#' + LOGIN_ERR_ID + ',#' + LOGIN_PASS_ERR_ID + '{' +
      'display:none;color:#ff9b9b;font-size:12.5px;line-height:1.4;padding:2px 4px 6px;}' +
      '#' + LOGIN_ERR_ID + '.show,#' + LOGIN_PASS_ERR_ID + '.show{display:block;}' +
      /* texto 18 anos */
      '.login-dialog-container .agreement, .login-dialog .agreement,' +
      '.login-dialog-container .register, .login-dialog .register,' +
      '.login-dialog-container .bonus-text, .login-dialog .bonus-text,' +
      '.login-dialog-container .ch7-age,#' + FORM_ID + ' .ch7-age{' +
      'font-size:12px!important;line-height:1.5!important;color:rgba(255,255,255,.58)!important;' +
      'text-align:center!important;padding:10px 10px 6px!important;white-space:normal!important;' +
      'word-break:normal!important;overflow:visible!important;max-width:100%!important;}' +
      '.header-content .loginRegister,' +
      '.header-content .login-register,' +
      '.header-content [class*="loginRegister"]{' +
      'display:flex!important;align-items:center!important;gap:6px!important;}' +
      '@media (max-width:480px){' +
      '.q-dialog.dialogBox .login-dialog-container,' +
      '.q-dialog.dialogBox .login-dialog,' +
      '.q-dialog.dialogBox .login-dialog-card{' +
      'width:min(400px,94vw)!important;max-height:92vh!important;border-radius:16px!important;}' +
      '.login_bg_wrapper,.login-dialog-card .login_bg_wrapper{' +
      'max-height:none!important;border-radius:16px 16px 0 0!important;}' +
      '.login_bg_wrapper .login_bg,img.login_bg{' +
      'max-height:none!important;height:auto!important;object-fit:contain!important;}' +
      '.login-dialog-container .submit-section .q-btn{min-height:48px!important;font-size:16px!important;}' +
      '}' +
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
      '{display:flex!important;visibility:visible!important;flex-direction:column;gap:8px;width:100%;' +
      'margin:6px 0 4px;box-sizing:border-box;position:relative;z-index:50;min-height:0;max-height:none;}' +
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
      'width:100%;margin-top:6px;padding:14px 16px;border:0;border-radius:999px;cursor:pointer;' +
      'font:800 16px/1.2 system-ui,sans-serif;color:#1a1208;' +
      'background:linear-gradient(180deg,#ffe566 0%,#f0b429 55%,#d4920a 100%);' +
      'box-shadow:0 10px 28px rgba(240,180,41,.35);letter-spacing:.02em;' +
      'transition:transform .12s,filter .12s;}' +
      '#' +
      FORM_ID +
      ' .ch7-submit:hover{filter:brightness(1.05);}' +
      '#' +
      FORM_ID +
      ' .ch7-submit:active{transform:scale(.98);}' +
      '#' +
      FORM_ID +
      ' .ch7-submit:disabled{opacity:.6;cursor:wait;transform:none;}' +
      '#' +
      FORM_ID +
      ' .ch7-hint{display:none!important;}' +
      '#' +
      FORM_ID +
      ' .ch7-age{' +
      'display:block!important;visibility:visible!important;opacity:1!important;' +
      'height:auto!important;min-height:0!important;max-height:none!important;' +
      'font-size:12px!important;line-height:1.5!important;color:rgba(255,255,255,.58)!important;' +
      'text-align:center!important;padding:10px 8px 2px!important;margin:0!important;' +
      'white-space:normal!important;word-break:normal!important;overflow:visible!important;' +
      'pointer-events:auto!important;box-sizing:border-box!important;}' +
      '#' +
      FORM_ID +
      ' .ch7-strength{font-size:11.5px;line-height:1.3;padding:0 4px 4px;color:rgba(255,255,255,.45);}' +
      '#' +
      FORM_ID +
      ' .ch7-strength.weak{color:#ff9b9b;}' +
      '#' +
      FORM_ID +
      ' .ch7-strength.ok{color:#9dffb0;}' +
      '#' +
      FORM_ID +
      ' .ch7-strength.strong{color:#7bfe7c;}' +
      '#' +
      FORM_ID +
      ' .ch7f{' +
      'background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.12)!important;' +
      'border-radius:14px!important;min-height:50px!important;}' +
      '#' +
      FORM_ID +
      ' .ch7f:focus-within{border-color:rgba(246,207,135,.5)!important;box-shadow:0 0 0 3px rgba(246,207,135,.12)!important;}' +
      '.login-dialog-container.ch7-login-email-mode .country-code{display:none!important;}' +
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
      if (n.length < 3) setFieldState('name', MSG.nameShort);
      else if (!/^[A-Za-zÀ-ú\s'.-]{3,60}$/.test(n)) setFieldState('name', MSG.name);
      else setFieldState('name', '');
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
      var st = document.querySelector('#' + FORM_ID + ' .ch7-strength');
      if (st) {
        var lab = passStrengthLabel(pw);
        st.textContent = lab ? 'Senha: ' + lab : '';
        st.className =
          'ch7-strength' +
          (!pw ? '' : strongPass(pw) ? (lab === 'Forte' ? ' strong' : ' ok') : ' weak');
      }
      if (!pw) return setFieldState('pass', '');
      setFieldState('pass', strongPass(pw) ? '' : MSG.pass);
    }
  }

  function validate(data) {
    var name = String(data.name || '').trim();
    if (name.length < 3 || !/^[A-Za-zÀ-ú\s'.-]{3,60}$/.test(name)) {
      var nm = name.length < 3 ? MSG.nameShort : MSG.name;
      setFieldState('name', nm);
      setErr(document.getElementById('ch7f-name') && document.getElementById('ch7f-name').parentElement, nm);
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
      var pe = onlyDigits(data.phone).length > 0 && onlyDigits(data.phone).length < 10 ? MSG.phoneShort : MSG.phone;
      setFieldState('phone', pe);
      setErr(document.getElementById('ch7f-phone') && document.getElementById('ch7f-phone').parentElement, pe);
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
      var msg = (j && j.msg) || MSG.generic;
      if (/already exists|já cadastrad|30103|duplicate|exists/i.test(msg + ' ' + (j && j.code))) {
        msg = MSG.dup;
      }
      if (/password|senha/i.test(msg) && /short|mín|min|6|8/i.test(msg)) msg = MSG.pass;
      setErr(null, msg);
      toast(msg, false);
    } catch (e) {
      setErr(null, MSG.network);
      toast(MSG.network, false);
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
      placeholder: 'Senha (8+ letras e números)',
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

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ch7-submit';
    btn.id = 'ch7f-submit';
    btn.textContent = 'Registrar-se';
    btn.addEventListener('click', onSubmit);

    var age = document.createElement('div');
    age.className = 'ch7-age';
    age.setAttribute('data-ch7-age', '1');
    age.textContent = AGE_COPY;

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
    var strength = document.createElement('div');
    strength.className = 'ch7-strength';
    strength.setAttribute('aria-live', 'polite');

    form.appendChild(passF.wrap);
    form.appendChild(passF.msg);
    form.appendChild(strength);
    form.appendChild(err);
    form.appendChild(btn);
    form.appendChild(age);
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
      ensureRegisterAge(existing);
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

  /** Garante texto de idade no form de cadastro ch7 (abaixo do botão). */
  function ensureRegisterAge(form) {
    if (!form) form = document.getElementById(FORM_ID);
    if (!form) return;
    try {
      // remove hint técnico antigo
      var hints = form.querySelectorAll('.ch7-hint');
      for (var h = 0; h < hints.length; h++) {
        try {
          hints[h].remove();
        } catch (e0) {}
      }
      var age = form.querySelector('.ch7-age');
      if (!age) {
        age = document.createElement('div');
        age.className = 'ch7-age';
        age.setAttribute('data-ch7-age', '1');
        form.appendChild(age);
      }
      if (age.textContent !== AGE_COPY) age.textContent = AGE_COPY;
      // sempre por último (abaixo do Registrar-se)
      var btn = form.querySelector('.ch7-submit, #ch7f-submit');
      if (btn && age.previousElementSibling !== btn) {
        try {
          form.appendChild(age);
        } catch (e1) {}
      }
    } catch (e) {}
  }

  function isBrokenAgeText(t) {
    if (!t) return false;
    // SPA rioslots costuma vir: "Ao acassar osite,confirmo que tenho 18anos e li os"
    return (
      /18\s*anos|18anos|confirmo\s*que\s*tenho|acassar|acessar\s*o/i.test(t) &&
      t.length < 130 &&
      !/PARAB|GANHOU|CONGRATS|SLOT DA SORTE|Descric/i.test(t)
    );
  }

  /** Texto de idade + termos (SPA costuma vir sem espaços / truncado). */
  function polishAgeCopy(root) {
    if (!root) return;
    try {
      ensureRegisterAge(document.getElementById(FORM_ID));
      var nodes = root.querySelectorAll(
        '.agreement, .register, .bonus-text, .bonus, p, span, label, div, a',
      );
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el) continue;
        // form ch7 já tem .ch7-age
        if (el.classList && el.classList.contains('ch7-age')) {
          if (el.textContent !== AGE_COPY) el.textContent = AGE_COPY;
          continue;
        }
        if (el.closest && el.closest('#' + FORM_ID) && !el.classList.contains('ch7-age')) continue;
        if (el.closest && el.closest('.submit-section, button, .q-btn, .q-field, input')) continue;
        var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 120) continue;
        if (!isBrokenAgeText(t) && !/18\s*anos|confirmo que tenho|Ao acessar/i.test(t)) continue;
        if (/PARAB|GANHOU|CONGRATS|SLOT DA SORTE|Descric/i.test(t)) continue;
        // já correto?
        if (t === AGE_COPY || t.indexOf(AGE_COPY) === 0) continue;
        // não quebrar blocos com muitos filhos (exceto agreement com link)
        if (el.children && el.children.length > 2) continue;
        var a = el.querySelector && el.querySelector('a');
        if (a && el.children.length <= 2) {
          var before = 'Ao acessar o site, confirmo que tenho 18 anos e li os ';
          while (el.firstChild) el.removeChild(el.firstChild);
          el.appendChild(document.createTextNode(before));
          a.textContent = a.textContent && /termo/i.test(a.textContent) ? a.textContent : 'termos';
          el.appendChild(a);
        } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          el.childNodes[0].nodeValue = AGE_COPY;
        } else if (!el.querySelector('input,button,.q-btn')) {
          el.textContent = AGE_COPY;
        }
      }
    } catch (e) {}
  }

  /** CTA principal do dialog: "Login" → "Entrar" (azul via CSS). */
  function polishLoginCta(root) {
    if (!root) return;
    try {
      var btns = root.querySelectorAll(
        '.submit-section .q-btn, .submit-section button, button.q-btn.full-width, .form-section > .q-btn',
      );
      for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        if (btn.closest('#' + FORM_ID) || btn.classList.contains('ch7-submit')) continue;
        var t = (btn.innerText || btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/^Login$|^Entrar$|^Sign\s*in$/i.test(t)) continue;
        // Quasar: texto em .q-btn__content span
        var span =
          btn.querySelector('.q-btn__content > span:not(.q-spinner):not(.q-icon)') ||
          btn.querySelector('.block') ||
          null;
        if (span && !span.querySelector('svg,img,i')) {
          if (span.textContent !== 'Entrar') span.textContent = 'Entrar';
        } else {
          // último recurso: só se o botão for folha simples
          var hasComplex = btn.querySelector('svg,img,input');
          if (!hasComplex && t !== 'Entrar') {
            // preserva ícones: só troca nós de texto
            var walk = function (n) {
              if (!n) return false;
              if (n.nodeType === 3 && /Login|Entrar|Sign\s*in/i.test(n.nodeValue || '')) {
                n.nodeValue = 'Entrar';
                return true;
              }
              if (n.nodeType === 1) {
                for (var c = 0; c < n.childNodes.length; c++) {
                  if (walk(n.childNodes[c])) return true;
                }
              }
              return false;
            };
            walk(btn);
          }
        }
        btn.setAttribute('aria-label', 'Entrar');
      }
      // link "Registrar-se" no rodapé do card
      root.querySelectorAll('a, span, button, div').forEach(function (el) {
        var tt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (/^Registrar$|^Register$/i.test(tt) && tt.length < 14) {
          if (el.children && el.children.length === 0) el.textContent = 'Registrar-se';
        }
      });
    } catch (e) {}
  }

  /** Header: padroniza labels Entrar / Registrar */
  function polishHeaderButtons() {
    try {
      var host =
        document.querySelector('.header-content .loginRegister') ||
        document.querySelector('.header-content [class*="loginRegister"]') ||
        document.querySelector('.header-content .login-register');
      if (!host) return;
      var btns = host.querySelectorAll('button, .q-btn, a, div, span');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.children && b.children.length > 1) continue;
        var t = (b.innerText || b.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^Login$|^Sign\s*in$/i.test(t)) {
          if (b.childNodes.length === 1 && b.childNodes[0].nodeType === 3) b.childNodes[0].nodeValue = 'Entrar';
          else if (!b.querySelector('svg,img')) b.textContent = 'Entrar';
          b.classList.add('entrar');
        }
        if (/^Registrar$|^Register$|^Sign\s*up$/i.test(t)) {
          if (b.childNodes.length === 1 && b.childNodes[0].nodeType === 3)
            b.childNodes[0].nodeValue = 'Registrar';
          else if (!b.querySelector('svg,img') && t.length < 12) b.textContent = 'Registrar';
          b.classList.add('register');
        }
      }
    } catch (e) {}
  }

  function ensureLoginPassErr(root, passInput) {
    if (!root || !passInput) return null;
    var existing = document.getElementById(LOGIN_PASS_ERR_ID);
    if (existing) return existing;
    var box = document.createElement('div');
    box.id = LOGIN_PASS_ERR_ID;
    box.setAttribute('role', 'alert');
    var field = passInput.closest('.q-field') || passInput.parentElement;
    if (field && field.parentElement) field.parentElement.insertBefore(box, field.nextSibling);
    else root.appendChild(box);
    return box;
  }

  function setLoginPassErr(msg) {
    var box = document.getElementById(LOGIN_PASS_ERR_ID);
    if (!box) return;
    if (msg) {
      box.textContent = msg;
      box.classList.add('show');
    } else {
      box.textContent = '';
      box.classList.remove('show');
    }
  }

  function findLoginPassInput(root) {
    if (!root) return null;
    var list = root.querySelectorAll('input[type="password"], input');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest && el.closest('#' + FORM_ID)) continue;
      if (el.type === 'password') return el;
      var ph = (el.placeholder || '') + (el.getAttribute('aria-label') || '');
      if (/senha|password|pass/i.test(ph)) return el;
    }
    return null;
  }

  function adaptLogin() {
    var root = dialogRoot();
    if (!root) return;
    root.classList.remove('ch7-reg-mode');
    root.classList.remove('ch7-native-reg');
    root.classList.add('ch7-smart-id');
    ensureStyle();

    polishLoginCta(root);
    polishAgeCopy(root);
    polishHeaderButtons();

    var el = findLoginIdentityInput(root);
    if (!el) return;

    // identidade unificada
    el.placeholder = 'E-mail ou Telefone';
    el.setAttribute('aria-label', 'E-mail ou Telefone');
    el.setAttribute('maxlength', '80');
    try {
      el.setAttribute('type', 'text');
    } catch (e0) {}
    el.setAttribute('inputmode', 'email');
    el.setAttribute('autocomplete', 'username');

    ensureLoginErr(root, el);
    var passEl = findLoginPassInput(root);
    if (passEl) {
      if (!passEl.placeholder) passEl.placeholder = 'Senha';
      passEl.setAttribute('autocomplete', 'current-password');
      ensureLoginPassErr(root, passEl);
    }

    function onIdentityInput() {
      var r = dialogRoot();
      if (!r) return;
      var val = el.value || '';
      var kind = detectIdentity(val);
      if (kind === 'email') r.classList.add('ch7-login-email-mode');
      else r.classList.remove('ch7-login-email-mode');

      if (!String(val).trim()) {
        setLoginErr('');
        return;
      }
      if (kind === 'email') {
        if (val.indexOf('@') >= 0 && val.indexOf('.') > val.indexOf('@')) {
          setLoginErr(isEmail(val) ? '' : MSG.email);
        } else setLoginErr('');
      } else {
        var d = onlyDigits(val);
        if (d.length >= 10) setLoginErr(isPhoneBR(val) ? '' : MSG.phone);
        else if (d.length >= 8) setLoginErr(MSG.phoneShort);
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

    function onPassInput() {
      if (!passEl) return;
      var v = passEl.value || '';
      if (!v) return setLoginPassErr('');
      if (v.length < 6) setLoginPassErr(MSG.passLogin);
      else setLoginPassErr('');
    }

    if (!el.__ch7LoginV19) {
      el.__ch7LoginV19 = 1;
      el.addEventListener('input', onIdentityInput);
      el.addEventListener('blur', onIdentityBlur);
    } else onIdentityInput();

    if (passEl && !passEl.__ch7LoginV19) {
      passEl.__ch7LoginV19 = 1;
      passEl.addEventListener('input', onPassInput);
      passEl.addEventListener('blur', onPassInput);
    }

    if (!root.__ch7LoginSubmitV19) {
      root.__ch7LoginSubmitV19 = 1;
      root.addEventListener(
        'click',
        function (ev) {
          var btn = ev.target && ev.target.closest && ev.target.closest('button, .q-btn');
          if (!btn || btn.closest('#' + FORM_ID)) return;
          var t = (btn.textContent || '').replace(/\s+/g, ' ').trim();
          if (!/^Login$|^Entrar$/i.test(t)) return;
          var idEl = findLoginIdentityInput(dialogRoot());
          var pEl = findLoginPassInput(dialogRoot());
          var bad = false;
          if (idEl) {
            var res = validateIdentity(idEl.value);
            if (res !== true) {
              setLoginErr(res);
              bad = true;
            } else setLoginErr('');
          }
          if (pEl) {
            if (!loginPassOk(pEl.value)) {
              setLoginPassErr(MSG.passLogin);
              bad = true;
            } else setLoginPassErr('');
          }
          if (bad) {
            try {
              ev.preventDefault();
              ev.stopPropagation();
            } catch (e1) {}
            setTimeout(function () {
              rewriteQuasarPhoneErrors(dialogRoot());
            }, 80);
          }
        },
        true,
      );
    }

    if (!root.__ch7LoginMoV19) {
      root.__ch7LoginMoV19 = 1;
      var moT = null;
      var mo = new MutationObserver(function () {
        if (moT) return;
        moT = setTimeout(function () {
          moT = null;
          rewriteQuasarPhoneErrors(root);
          polishLoginCta(root);
          polishAgeCopy(root);
        }, 120);
      });
      mo.observe(root, { childList: true, subtree: true });
    }
  }

  function adaptNativeRegister() {
    var root = dialogRoot();
    if (!root) return;
    root.classList.remove('ch7-reg-mode');
    root.classList.remove('ch7-smart-id');
    root.classList.add('ch7-native-reg');
    ensureStyle();
    unmountRegisterForm();
    polishAgeCopy(root);
    polishHeaderButtons();
    // CTA nativo: "Registrar-se" (já vem do SPA)
    try {
      var btns = root.querySelectorAll(
        '.submit-section .q-btn, .submit-section button, button.q-btn.full-width',
      );
      for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var t = (btn.innerText || btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/^(Register|Registrar|Sign\s*up)$/i.test(t)) continue;
        var span =
          btn.querySelector('.q-btn__content > span:not(.q-spinner):not(.q-icon)') ||
          btn.querySelector('.block') ||
          null;
        if (span && !span.querySelector('svg,img,i')) span.textContent = 'Registrar-se';
        else if (!btn.querySelector('svg,img') && t !== 'Registrar-se') {
          var walk = function (n) {
            if (!n) return false;
            if (n.nodeType === 3 && /Register|Registrar|Sign/i.test(n.nodeValue || '')) {
              n.nodeValue = 'Registrar-se';
              return true;
            }
            if (n.nodeType === 1) {
              for (var c = 0; c < n.childNodes.length; c++) {
                if (walk(n.childNodes[c])) return true;
              }
            }
            return false;
          };
          walk(btn);
        }
      }
      // rodapé "Ainda sem conta? Login" → Entrar
      root.querySelectorAll('a, span, div, button').forEach(function (el) {
        if (el.closest && el.closest('.submit-section, .loginRegister, .q-field')) return;
        var tt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^Login$|^Sign\s*in$/i.test(tt) && tt.length < 12 && el.children.length === 0) {
          el.textContent = 'Entrar';
        }
      });
    } catch (e) {}
  }

  function sync() {
    cleanupOrphanForm();
    polishHeaderButtons();
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
      if (USE_CUSTOM_REGISTER) {
        mountRegisterForm();
        hideNativeRegisterButtons(root);
        polishAgeCopy(root);
      } else {
        // modelo rioslots: cadastro nativo (Novo Telefone + Nova Senha)
        adaptNativeRegister();
      }
    } else {
      unmountRegisterForm();
      adaptLogin();
    }
  }

  function ensureCrypto() {
    if (window.CryptoJS || document.getElementById('ch7-cryptojs')) return;
    var s = document.createElement('script');
    s.id = 'ch7-cryptojs';
    // same-origin (evita Tracking Prevention / storage block do CDN Cloudflare)
    s.src = '/static/vendor/crypto-js.min.js';
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
        if (
          !d.querySelector(
            '.slotBox, .lotteryBg, .rotary-table, .bottomBoxTitle, .lotteryContent, [class*="Activity"]',
          ) &&
          !/Descric|Atividade|CONGRATS|RESPIN/i.test(d.innerText || '')
        )
          continue;
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
  try {
    ensureStyle();
  } catch (e0) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      cleanupOrphanForm();
      ensureStyle();
      schedule();
    });
  } else {
    schedule();
  }
  window.addEventListener('hashchange', schedule);
  // boot: reaplica se o dialog montar depois
  setTimeout(schedule, 800);
  setTimeout(schedule, 2000);
  setTimeout(schedule, 4000);

  // observa aparecimento do login-dialog (sem characterData = sem loop)
  try {
    var __ch7DialogMo = null;
    var __ch7DialogMoT = null;
    __ch7DialogMo = new MutationObserver(function () {
      if (__ch7DialogMoT) return;
      __ch7DialogMoT = setTimeout(function () {
        __ch7DialogMoT = null;
        if (dialogRoot()) schedule();
      }, 150);
    });
    __ch7DialogMo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (eMo) {}

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
