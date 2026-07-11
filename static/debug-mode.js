/**
 * Modo BUG / DEBUG — mostra erros do console na tela.
 *
 * Ativo se:
 *  - ?debug=1 ou ?bug=1 na URL
 *  - localStorage.CHINESINHA_DEBUG === '1'
 *  - window.__CHINESINHA_DEBUG__ === true (env-config)
 *
 * Desligar: localStorage.removeItem('CHINESINHA_DEBUG') e tire ?debug=1
 */
(function () {
  'use strict';

  function wantDebug() {
    try {
      if (window.__CHINESINHA_DEBUG__ === true) return true;
      if (localStorage.getItem('CHINESINHA_DEBUG') === '1') return true;
      var q = new URLSearchParams(location.search);
      if (q.get('debug') === '1' || q.get('bug') === '1') {
        localStorage.setItem('CHINESINHA_DEBUG', '1');
        return true;
      }
      if (q.get('debug') === '0' || q.get('bug') === '0') {
        localStorage.removeItem('CHINESINHA_DEBUG');
        return false;
      }
    } catch (e) {}
    return false;
  }

  if (!wantDebug()) return;

  var logs = [];
  var MAX = 80;
  var panel, listEl, badge;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtArg(a) {
    if (a == null) return String(a);
    if (a instanceof Error) {
      return a.name + ': ' + a.message + (a.stack ? '\n' + a.stack : '');
    }
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a, null, 2);
      } catch (e) {
        return String(a);
      }
    }
    return String(a);
  }

  /** Erros conhecidos inofensivos (Quasar/Chrome) — não poluir o painel */
  function isNoise(text) {
    var t = String(text || '');
    if (/ResizeObserver loop/i.test(t)) return true;
    if (/ResizeObserver loop limit exceeded/i.test(t)) return true;
    if (/Non-Error promise rejection captured/i.test(t)) return true;
    if (/Script error\.?$/i.test(t.trim())) return true;
    return false;
  }

  function push(level, args) {
    var text = Array.prototype.map.call(args, fmtArg).join(' ');
    if (isNoise(text)) return;
    var entry = {
      level: level,
      text: text,
      time: new Date().toISOString().slice(11, 19),
    };
    logs.push(entry);
    if (logs.length > MAX) logs.shift();
    render();
    if (badge) {
      badge.textContent = String(logs.filter(function (l) {
        return l.level === 'error';
      }).length);
      badge.style.display = logs.length ? 'flex' : 'none';
    }
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = logs
      .slice()
      .reverse()
      .map(function (l) {
        var color =
          l.level === 'error' ? '#ff6b6b' : l.level === 'warn' ? '#ffd43b' : '#74c0fc';
        return (
          '<div style="border-bottom:1px solid #333;padding:6px 8px;font-size:11px;line-height:1.35">' +
          '<span style="color:#888">' +
          esc(l.time) +
          '</span> ' +
          '<span style="color:' +
          color +
          ';font-weight:700;text-transform:uppercase">' +
          esc(l.level) +
          '</span>' +
          '<pre style="margin:4px 0 0;white-space:pre-wrap;word-break:break-word;color:#eee;font-family:ui-monospace,Consolas,monospace">' +
          esc(l.text) +
          '</pre></div>'
        );
      })
      .join('');
  }

  function ensureUI() {
    if (panel) return;

    var style = document.createElement('style');
    style.textContent =
      '#ch-debug-fab{position:fixed;right:10px;bottom:70px;z-index:2147483646;width:48px;height:48px;border-radius:50%;border:2px solid #ff6b6b;background:#1a1a1a;color:#ff6b6b;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.45)}' +
      '#ch-debug-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#ff6b6b;color:#fff;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px}' +
      '#ch-debug-panel{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;max-height:45vh;background:#111;color:#eee;border-top:2px solid #ff6b6b;display:none;flex-direction:column;font-family:system-ui,sans-serif}' +
      '#ch-debug-panel.open{display:flex}' +
      '#ch-debug-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1c1c1c;border-bottom:1px solid #333}' +
      '#ch-debug-head strong{color:#ff6b6b;font-size:13px}' +
      '#ch-debug-head button{margin-left:auto;background:#333;color:#fff;border:0;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}' +
      '#ch-debug-list{overflow:auto;flex:1;-webkit-overflow-scrolling:touch}';
    document.head.appendChild(style);

    var fab = document.createElement('button');
    fab.id = 'ch-debug-fab';
    fab.type = 'button';
    fab.title = 'Modo BUG — erros do console';
    fab.textContent = 'BUG';
    badge = document.createElement('span');
    badge.id = 'ch-debug-badge';
    fab.appendChild(badge);
    fab.onclick = function () {
      panel.classList.toggle('open');
    };
    document.body.appendChild(fab);

    panel = document.createElement('div');
    panel.id = 'ch-debug-panel';
    panel.innerHTML =
      '<div id="ch-debug-head">' +
      '<strong>🐞 MODO BUG</strong>' +
      '<span style="font-size:11px;color:#aaa">console + erros de rede/launch</span>' +
      '<button type="button" id="ch-debug-copy">Copiar</button>' +
      '<button type="button" id="ch-debug-clear">Limpar</button>' +
      '<button type="button" id="ch-debug-close">Fechar</button>' +
      '<button type="button" id="ch-debug-off">Desligar</button>' +
      '</div><div id="ch-debug-list"></div>';
    document.body.appendChild(panel);
    listEl = panel.querySelector('#ch-debug-list');

    panel.querySelector('#ch-debug-close').onclick = function () {
      panel.classList.remove('open');
    };
    panel.querySelector('#ch-debug-clear').onclick = function () {
      logs = [];
      render();
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
    };
    panel.querySelector('#ch-debug-copy').onclick = function () {
      var t = logs
        .map(function (l) {
          return '[' + l.time + '] ' + l.level.toUpperCase() + ' ' + l.text;
        })
        .join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).catch(function () {});
      }
    };
    panel.querySelector('#ch-debug-off').onclick = function () {
      try {
        localStorage.removeItem('CHINESINHA_DEBUG');
      } catch (e) {}
      location.href = location.pathname + location.hash;
    };

    push('info', ['Modo BUG ativo — erros do console aparecem aqui.']);
  }

  // wrap console
  var levels = ['error', 'warn', 'log', 'info'];
  levels.forEach(function (level) {
    var orig = console[level] && console[level].bind(console);
    if (!orig) return;
    console[level] = function () {
      try {
        if (level === 'error' || level === 'warn') {
          ensureUI();
          push(level, arguments);
        }
      } catch (e) {}
      return orig.apply(console, arguments);
    };
  });

  window.addEventListener('error', function (ev) {
    var msg = ev.message || 'Error';
    if (isNoise(msg)) {
      // evita o browser logar como uncaught ruidoso no nosso painel
      ev.preventDefault && ev.preventDefault();
      return;
    }
    ensureUI();
    push('error', [
      msg +
        (ev.filename ? ' @ ' + ev.filename + ':' + ev.lineno + ':' + ev.colno : ''),
      ev.error || '',
    ]);
  });

  window.addEventListener('unhandledrejection', function (ev) {
    ensureUI();
    push('error', ['UnhandledRejection', ev.reason]);
  });

  // intercept fetch errors / launch failures
  if (window.fetch) {
    var rawFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return rawFetch(input, init).then(
        function (res) {
          if (!res.ok && /gofun|launch|wallet|api\//i.test(url)) {
            res
              .clone()
              .text()
              .then(function (t) {
                ensureUI();
                push('error', [
                  'HTTP ' + res.status + ' ' + url + '\n' + (t || '').slice(0, 500),
                ]);
              })
              .catch(function () {});
          }
          // also log launch business errors (HTTP 200 + code!=0)
          if (/game\/launch/i.test(url)) {
            res
              .clone()
              .json()
              .then(function (j) {
                if (j && j.code !== 0 && j.code !== '0') {
                  ensureUI();
                  push('error', [
                    'LAUNCH FAIL ' +
                      url +
                      '\n' +
                      JSON.stringify(
                        { code: j.code, msg: j.msg, _rg: j._rg, data: j.data },
                        null,
                        2,
                      ).slice(0, 800),
                  ]);
                } else if (j && j.data && j.data.gameUrl) {
                  ensureUI();
                  push('info', [
                    'LAUNCH OK gameUrl=' + String(j.data.gameUrl).slice(0, 120),
                    j._rg || '',
                  ]);
                }
              })
              .catch(function () {});
          }
          return res;
        },
        function (err) {
          ensureUI();
          push('error', ['FETCH FAIL ' + url, err]);
          throw err;
        },
      );
    };
  }

  // boot UI soon
  function boot() {
    ensureUI();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
