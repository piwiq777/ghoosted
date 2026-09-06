/* ===========================================================================
   Ghosted — BUILD FLAGS.  This is the only file that differs between the
   free/paid and the Pro/Plus builds. Nothing else should hardcode either.

   Loaded twice, on purpose, from two different contexts:
     · as a content script (manifest content_scripts, before license.js)
     · as a side-effect import from the module service worker (background.js)
   That's why it assigns onto globalThis instead of exporting — a classic
   content script can't be an ES module, but a module CAN import a file that
   only has side effects.

   ---------------------------------------------------------------------------
   FREE_MODE
     true  → every feature is unlocked for everyone and the licence is never
             checked. This is how the extension ships TODAY.
     false → licence enforced: the key must be activated and bound to the
             Instagram account, and it must have been bought for THIS product.

     Flipping this to false is the launch switch. Before flipping it, be aware
     that anyone already running the extension loses access unless they buy —
     there is no grandfathering built in.

   PRODUCT
     'pro' or 'plus'. Sent to /api/license/{activate,verify} and checked
     server-side (lib/licenses.js → wrongProduct) against the plan the key was
     actually paid for. Get this wrong and paying customers are locked out:
     a key bought as Plus will be REJECTED by a build claiming to be Pro.
   =========================================================================== */
(function () {
  'use strict';
  globalThis.GhostedBuild = {
    FREE_MODE: true,
    PRODUCT: 'pro',
  };
})();
