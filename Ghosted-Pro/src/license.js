/* Ghosted — licence gate (content-script side).
 *
 * Rewritten from the minified original with identical behaviour; the only
 * change is that FREE_MODE and PRODUCT now come from src/build.js instead of
 * being buried in here, so free↔paid and Pro↔Plus are one edit in one file.
 *
 * The actual network calls live in background.js (service worker); this file
 * only reads the cached result that background.js wrote to chrome.storage. */
(function () {
  'use strict';

  var BUILD = globalThis.GhostedBuild || { FREE_MODE: true, PRODUCT: 'pro' };

  var CONFIG = {
    appUrl: 'https://ghoosted.net',
    buyUrl: 'https://ghoosted.net/#pricing',
    licenseApiUrl: 'https://ghoosted.net/api/license',
    freeMode: BUILD.FREE_MODE,
    product: BUILD.PRODUCT,
    trialDays: 0,
    // Which features are gated behind a licence. A name missing from here is
    // free for everyone, which is what makes the Plus build possible: drop a
    // capability out of this map and it stops being sold as part of it.
    pro: { access: true, storyViewers: true, instantAlerts: true, history: true },
  };

  var LICENSE_KEY = 'ghosted_license';
  var INSTALL_KEY = 'ghosted_installed_at';

  function getLicense(store) {
    return store.get(LICENSE_KEY, null);
  }

  function inTrial(store) {
    if (!CONFIG.trialDays) return false;
    var installedAt = store.get(INSTALL_KEY, 0);
    if (!installedAt) return false;
    return Date.now() - installedAt < CONFIG.trialDays * 86400000;
  }

  function isPro(store) {
    if (CONFIG.freeMode) return true;
    var lic = getLicense(store);
    // `refunded`/`revoked` are written by background.js from the server's
    // answer, so a refunded key stops working on the next re-verify.
    if (lic && lic.valid && !lic.refunded && !lic.revoked && lic.accountId) return true;
    return inTrial(store);
  }

  function feature(store, name) {
    if (CONFIG.freeMode) return true;
    if (!CONFIG.pro[name]) return true;
    return isPro(store);
  }

  self.GhostedConfig = CONFIG;
  self.GhostedLicense = {
    getLicense: getLicense,
    isPro: isPro,
    inTrial: inTrial,
    feature: feature,
    LICENSE_KEY: LICENSE_KEY,
    INSTALL_KEY: INSTALL_KEY,
  };
})();
