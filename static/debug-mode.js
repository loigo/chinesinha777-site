/**
 * Modo BUG / DEBUG completo — console + gofun/firstpage + contagem de jogos.
 *
 * Ativo se:
 *  - window.__CHINESINHA_DEBUG__ === true
 *  - localStorage.CHINESINHA_DEBUG === '1'
 *  - ?debug=1 ou ?bug=1
 *
 * Desligar: localStorage.removeItem('CHINESINHA_DEBUG') e ?debug=0
 * v2 — painel de saúde (bridge, firstpage, game boxes)
 */
(function () {
  'use strict';
  if (window.__ch7DebugModeV2) return;
  window.__ch7DebugModeV2 = 1;

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
  var MAX = 120;
  var panel, listEl, badge, healthEl;

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
      badge.textContent = String(
        logs.filter(function (l) {
          return l.level === 'error';
        }).length,
      );
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

  function healthSnapshot() {
    var fp = window.__CH7_LAST_FIRSTPAGE__ || null;
    var boxes = 0;
    var imgsOk = 0;
    try {
      boxes = document.querySelectorAll('.gameImgBox').length;
      document.querySelectorAll('.gameImgBox img.q-img__image, .gameImgBox img').forEach(function (img) {
        if (img && img.naturalWidth > 10) imgsOk++;
      });
    } catch (e) {}
    return {
      bridge: !!(window.__ch7GofunBridgeV15 || window.__ch7GofunBridgeV14),
      bridgeV: window.__ch7GofunBridgeV15 ? 15 : window.__ch7GofunBridgeV14 ? 14 : 0,
      edge: window.__CH7_GOFUN_EDGE__ || '',
      firstpage: fp,
      gameBoxes: boxes,
      imgsLoaded: imgsOk,
      coversV4: !!window.__ch7GameCoversV4,
      host: location.host,
    };
  }

  function renderHealth() {
    if (!healthEl) return;
    var h = healthSnapshot();
    var fp = h.firstpage;
    var fpLine = fp
      ? 'firstpage: ' +
        (fp.ok ? 'OK' : 'FAIL') +
        ' games=' +
        (fp.gameCount != null ? fp.gameCount : '?') +
        (fp.coversFixed != null ? ' coversFix=' + fp.coversFixed : '') +
        (fp.status ? ' http=' + fp.status : '')
      : 'firstpage: (aguardando…)';
    healthEl.innerHTML =
      '<div style="font-size:11px;line-height:1.45;color:#cfcfcf;padding:6px 10px;background:#161616;border-bottom:1px solid #333">' +
      '<b style="color:#7bfe7c">HEALTH</b> ' +
      'bridge=v' +
      h.bridgeV +
      ' · boxes=' +
      h.gameBoxes +
      ' · imgs=' +
      h.imgsLoaded +
      ' · covers=' +
      (h.coversV4 ? 'v4' : 'no') +
      '<br>' +
      esc(fpLine) +
      '<br><span style="color:#888;word-break:break-all">edge=' +
      esc(h.edge || '-') +
      '</span></div>';
  }

  function ensureUI() {
    if (panel) return;

    var style = document.createElement('style');
    style.textContent =
      '#ch-debug-fab{position:fixed;right:10px;bottom:70px;z-index:2147483646;width:48px;height:48px;border-radius:50%;border:2px solid #ff6b6b;background:#1a1a1a;color:#ff6b6b;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.45)}' +
      '#ch-debug-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#ff6b6b;color:#fff;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px}' +
      '#ch-debug-panel{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;max-height:50vh;background:#111;color:#eee;border-top:2px solid #ff6b6b;display:none;flex-direction:column;font-family:system-ui,sans-serif}' +
      '#ch-debug-panel.open{display:flex}' +
      '#ch-debug-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1c1c1c;border-bottom:1px solid #333;flex-wrap:wrap}' +
      '#ch-debug-head strong{color:#ff6b6b;font-size:13px}' +
      '#ch-debug-head button{background:#333;color:#fff;border:0;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}' +
      '#ch-debug-list{overflow:auto;flex:1;-webkit-overflow-scrolling:touch}';
    document.head.appendChild(style);

    var fab = document.createElement('button');
    fab.id = 'ch-debug-fab';
    fab.type = 'button';
    fab.title = 'Modo BUG — debug completo';
    fab.textContent = 'BUG';
    badge = document.createElement('span');
    badge.id = 'ch-debug-badge';
    fab.appendChild(badge);
    fab.onclick = function () {
      panel.classList.toggle('open');
      renderHealth();
    };
    document.body.appendChild(fab);

    panel = document.createElement('div');
    panel.id = 'ch-debug-panel';
    panel.innerHTML =
      '<div id="ch-debug-head">' +
      '<strong>🐞 DEBUG PROD</strong>' +
      '<span style="font-size:11px;color:#aaa">gofun · jogos · erros</span>' +
      '<button type="button" id="ch-debug-refresh">Health</button>' +
      '<button type="button" id="ch-debug-copy">Copiar</button>' +
      '<button type="button" id="ch-debug-clear">Limpar</button>' +
      '<button type="button" id="ch-debug-close">Fechar</button>' +
      '<button type="button" id="ch-debug-off">Desligar</button>' +
      '</div><div id="ch-debug-health"></div><div id="ch-debug-list"></div>';
    document.body.appendChild(panel);
    listEl = panel.querySelector('#ch-debug-list');
    healthEl = panel.querySelector('#ch-debug-health');

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
    panel.querySelector('#ch-debug-refresh').onclick = function () {
      renderHealth();
      push('info', ['HEALTH', healthSnapshot()]);
    };
    panel.querySelector('#ch-debug-copy').onclick = function () {
      var h = healthSnapshot();
      var t =
        'HEALTH ' +
        JSON.stringify(h, null, 2) +
        '\n\n' +
        logs
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
        window.__CHINESINHA_DEBUG__ = false;
      } catch (e) {}
      location.href = location.pathname + location.hash;
    };

    push('info', ['Modo DEBUG completo ativo. Bridge + firstpage + contagem de jogos.']);
    renderHealth();
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
      ev.preventDefault && ev.preventDefault();
      return;
    }
    ensureUI();
    push('error', [
      msg + (ev.filename ? ' @ ' + ev.filename + ':' + ev.lineno + ':' + ev.colno : ''),
      ev.error || '',
    ]);
  });

  window.addEventListener('unhandledrejection', function (ev) {
    ensureUI();
    push('error', ['UnhandledRejection', ev.reason]);
  });

  // XHR gofun logging
  try {
    var XO = XMLHttpRequest.prototype.open;
    var XS = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__ch7DbgUrl = url;
      this.__ch7DbgMethod = method;
      return XO.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      var xhr = this;
      var u = String(xhr.__ch7DbgUrl || xhr.__ch7Url || '');
      if (/gofun|firstpage|supabase\.co|functions\/v1/i.test(u)) {
        xhr.addEventListener('loadend', function () {
          try {
            ensureUI();
            var st = xhr.status;
            var level = st >= 200 && st < 300 ? 'info' : 'error';
            var extra = '';
            if (/firstpage/i.test(u) && window.__CH7_LAST_FIRSTPAGE__) {
              extra = ' ' + JSON.stringify(window.__CH7_LAST_FIRSTPAGE__);
            }
            push(level, [
              'XHR ' + (xhr.__ch7DbgMethod || '') + ' ' + st + ' ' + u.slice(0, 140) + extra,
            ]);
            renderHealth();
          } catch (e) {}
        });
      }
      return XS.apply(this, arguments);
    };
  } catch (eX) {}

  // fetch errors / launch
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

  function boot() {
    ensureUI();
    // recheck games after SPA mounts
    setTimeout(function () {
      renderHealth();
      var h = healthSnapshot();
      push('info', [
        'games boxes=' + h.gameBoxes + ' imgs=' + h.imgsLoaded + ' firstpage=',
        h.firstpage || null,
      ]);
      if (h.gameBoxes === 0) {
        push('warn', [
          'ZERO gameImgBox no DOM — firstpage pode ter falhado, cache antigo, ou popup bloqueando.',
        ]);
      }
    }, 2500);
    setTimeout(renderHealth, 5000);
    setTimeout(renderHealth, 10000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
