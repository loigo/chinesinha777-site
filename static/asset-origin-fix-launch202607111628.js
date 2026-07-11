/**
 * Reescreve URLs chinesinha777.bet/static → /static (antes do SPA).
 */
(function () {
  if (window.__ch7AssetOriginFix) return;
  window.__ch7AssetOriginFix = 1;
  var RE = /^https?:\/\/(?:www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/i;
  var RE2 = /^\/\/(?:www\.)?chinesinha777\.bet(?::\d+)?(\/static\/)/i;
  function fix(u) {
    var s = String(u == null ? '' : u);
    if (!s) return s;
    if (RE.test(s)) return s.replace(RE, '$1');
    if (RE2.test(s)) return s.replace(RE2, '$1');
    if (/okx007\.com/i.test(s) && /\/static\//.test(s)) {
      var m = s.match(/(\/static\/.+)$/);
      if (m) return m[1];
    }
    return s;
  }
  try {
    var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (desc && desc.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get: function () { return desc.get.call(this); },
        set: function (v) { return desc.set.call(this, fix(v)); }
      });
    }
  } catch (e) {}
  try {
    var sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      var n = String(name || '').toLowerCase();
      if (n === 'src' || n === 'href') value = fix(value);
      return sa.call(this, name, value);
    };
  } catch (e) {}
  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (!n || n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') {
            var s = n.getAttribute('src') || '';
            var f = fix(s);
            if (f !== s) n.setAttribute('src', f);
          } else if (n.querySelectorAll) {
            var list = n.querySelectorAll('img[src*="chinesinha777.bet"]');
            for (var k = 0; k < list.length; k++) {
              var s2 = list[k].getAttribute('src') || '';
              var f2 = fix(s2);
              if (f2 !== s2) list[k].setAttribute('src', f2);
            }
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
