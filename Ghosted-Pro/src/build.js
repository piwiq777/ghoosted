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
             checked.
     false → licence enforced: the key must be activated and bound to the
             Instagram account, and it must have been bought for THIS product.
             This is how the extension SHIPS, and test/licencia.test.js falla
             si alguien lo deja en true: sin esto la clave que se cobra no
             abre nada, porque no habia nada cerrado.

     Para trabajar en local sin clave esta tools/escritorio.js, que copia al
     escritorio con la puerta abierta. Eso es SOLO tu copia: lo que se
     empaqueta y se vende sale de aqui, y sale cerrado.

   PRODUCT
     'pro' or 'plus'. Sent to /api/license/{activate,verify} and checked
     server-side (lib/licenses.js → wrongProduct) against the plan the key was
     actually paid for. Get this wrong and paying customers are locked out:
     a key bought as Plus will be REJECTED by a build claiming to be Pro.
   =========================================================================== */
(function () {
  'use strict';
  globalThis.GhostedBuild = {
    FREE_MODE: false,
    PRODUCT: 'pro',
  };
})();
