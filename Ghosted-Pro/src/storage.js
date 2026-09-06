(function() {
  "use strict";
  const Y = new Map;
  let t = false;
  const g = {
    async hydrate() {
      if (t) return;
      const q = await chrome.storage.local.get(null);
      for (const x in q) Y.set(x, q[x]);
      t = true;
    },
    get(k, q) {
      const x = Y.get(k);
      return x === void 0 ? q : x;
    },
    set(k, q) {
      return Y.set(k, q), chrome.storage.local.set({
        [k]: q
      }).catch(() => {}), q;
    },
    async getFresh(k, q) {
      try {
        const x = await chrome.storage.local.get(k), z = x[k];
        if (z !== void 0) Y.set(k, z);
        return z === void 0 ? q : z;
      } catch (L) {
        return this.get(k, q);
      }
    },
    async setAwait(k, q) {
      Y.set(k, q);
      try {
        return await chrome.storage.local.set({
          [k]: q
        }), true;
      } catch (x) {
        return false;
      }
    },
    del(k) {
      Y.delete(k), chrome.storage.local.remove(k).catch(() => {});
    },
    syncCache(k, q) {
      if (q === void 0) Y.delete(k); else Y.set(k, q);
    },
    async bytesInUse() {
      try {
        return await chrome.storage.local.getBytesInUse(null);
      } catch (k) {
        return 0;
      }
    }
  };
  self.GhostedStore = g;
})();
