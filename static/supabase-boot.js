/**
 * Expõe config Supabase no browser (apenas URL + anon key).
 * Carrega /static/supabase-config.json se necessário.
 */
(function () {
  if (window.__ch7SupabaseBoot) return;
  window.__ch7SupabaseBoot = 1;

  function apply(cfg) {
    window.__CH7_SUPABASE__ = cfg || {};
    window.__ch7SupabaseReady = !!(cfg && cfg.url && cfg.anonKey);
  }

  if (window.__CH7_SUPABASE__ && window.__CH7_SUPABASE__.url) {
    apply(window.__CH7_SUPABASE__);
    return;
  }

  try {
    fetch('/static/supabase-config.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        apply(j || {});
      })
      .catch(function () {
        apply({});
      });
  } catch (e) {
    apply({});
  }
})();
