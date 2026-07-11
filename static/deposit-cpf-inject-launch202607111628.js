/**
 * Anexa CPF do payAccount (localStorage) nas requisições shop/order.
 * A SPA grava {UID}_payAccount ao salvar Conta bancária, mas não envia no depósito.
 */
(function () {
  'use strict';
  if (window.__ch7DepositCpfInit) return;
  window.__ch7DepositCpfInit = 1;

  function readPayAccount() {
    try {
      var keys = Object.keys(localStorage || {});
      // preferência: chave que termina com _payAccount e tem Number
      var best = null;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (!/_payAccount$/i.test(k)) continue;
        try {
          var raw = localStorage.getItem(k);
          if (!raw) continue;
          var obj = JSON.parse(raw);
          if (obj && obj.Number) {
            best = obj;
            break;
          }
          if (obj && !best) best = obj;
        } catch (e) {}
      }
      return best;
    } catch (e) {
      return null;
    }
  }

  function enrichBody(text) {
    var pay = readPayAccount();
    if (!pay || !pay.Number) return text;
    try {
      var body = text ? JSON.parse(text) : {};
      if (!body || typeof body !== 'object') body = {};
      // formatos gofun: { data: {...} } ou plano
      var target = body.data && typeof body.data === 'object' ? body.data : body;
      if (!target.cpf && !target.CPF) {
        target.cpf = String(pay.Number).replace(/\D/g, '');
      }
      if (!target.PayAccount && !target.payAccount) {
        target.PayAccount = {
          Name: pay.Name || '',
          Mobile: pay.Mobile || '',
          Email: pay.Email || '',
          Number: String(pay.Number).replace(/\D/g, ''),
          PayType: pay.PayType != null ? pay.PayType : 1,
        };
      }
      if (body.data && typeof body.data === 'object') body.data = target;
      else body = target;
      return JSON.stringify(body);
    } catch (e) {
      return text;
    }
  }

  function isShopOrder(url) {
    return /shop\/order/i.test(String(url || ''));
  }

  // fetch
  if (typeof window.fetch === 'function') {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : input && input.url;
        if (isShopOrder(url) && init && init.body && typeof init.body === 'string') {
          init = Object.assign({}, init, { body: enrichBody(init.body) });
        }
      } catch (e) {}
      return _fetch.call(this, input, init);
    };
  }

  // XHR (axios/gofun costuma usar) — não quebrar open(url=null/undefined)
  if (typeof XMLHttpRequest !== 'undefined') {
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__ch7Url = url == null ? '' : String(url);
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      try {
        if (isShopOrder(this.__ch7Url) && typeof body === 'string') {
          body = enrichBody(body);
        }
      } catch (e) {}
      return _send.call(this, body);
    };
  }
})();
