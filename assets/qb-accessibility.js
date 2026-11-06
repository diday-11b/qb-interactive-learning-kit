/* Applies account-wide motion, contrast, and sound preferences on signed-in pages. */
(() => {
  "use strict";
  const systemReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
  const fallback = { soundEnabled: false, reducedMotion: systemReducedMotion, highContrast: false };

  function apply(preferences) {
    const normalized = {
      soundEnabled: preferences?.soundEnabled === true,
      reducedMotion: preferences?.reducedMotion === true,
      highContrast: preferences?.highContrast === true
    };
    window.QBAccountPreferences = normalized;
    document.documentElement.dataset.qbReducedMotion = String(normalized.reducedMotion || systemReducedMotion);
    document.documentElement.dataset.qbHighContrast = String(normalized.highContrast);
    window.dispatchEvent(new CustomEvent("qb-account-preferences-change", { detail: normalized }));
    return normalized;
  }

  window.QBApplyAccountPreferences = apply;
  apply(fallback);
  window.QBAccountPreferencesReady = (async () => {
    try {
      if (!window.QBSupabase?.configured) return window.QBAccountPreferences;
      const session = await window.QBSupabase.getSession();
      if (!session) return window.QBAccountPreferences;
      const settings = await window.QBSupabase.getAccountSettings();
      return apply(settings?.preferences || fallback);
    } catch (_) {
      return window.QBAccountPreferences;
    }
  })();
})();
