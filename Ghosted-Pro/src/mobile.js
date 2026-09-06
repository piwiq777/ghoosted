(function(Y) {
  "use strict";
  var t = "https://ghoosted.net", g = "ghosted_mobile_pair";
  function k(l) {
    var c = "";
    for (var S = 0; S < l.length; S += 32768) c += String.fromCharCode.apply(null, l.subarray(S, S + 32768));
    return btoa(c);
  }
  function q(l) {
    return k(l).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function x(l) {
    l = String(l).replace(/-/g, "+").replace(/_/g, "/");
    while (l.length % 4) l += "=";
    var c = atob(l), S = new Uint8Array(c.length);
    for (var C = 0; C < c.length; C++) S[C] = c.charCodeAt(C);
    return S;
  }
  async function z() {
    try {
      var l = await chrome.storage.local.get(g), c = l && l[g];
      return c && c.channel && c.key ? c : null;
    } catch (S) {
      return null;
    }
  }
  async function L() {
    var l = await z();
    if (l) return l;
    var c = new Uint8Array(16), S = new Uint8Array(32);
    crypto.getRandomValues(c), crypto.getRandomValues(S);
    var C = {
      channel: q(c),
      key: q(S),
      createdAt: Date.now()
    };
    try {
      await chrome.storage.local.set({
        ["" + g]: C
      });
    } catch (U) {}
    return C;
  }
  async function O() {
    try {
      await chrome.storage.local.remove(g);
    } catch (l) {}
  }
  function X(l) {
    return t + "/m#" + l.channel + "~" + l.key;
  }
  async function J(l, c) {
    var S = await crypto.subtle.importKey("raw", x(l), {
      name: "AES-GCM"
    }, false, [ "encrypt" ]), C = crypto.getRandomValues(new Uint8Array(12)), U = (new TextEncoder).encode(JSON.stringify(c)), j = new Uint8Array(await crypto.subtle.encrypt({
      name: "AES-GCM",
      iv: C
    }, S, U)), y = new Uint8Array(C.length + j.length);
    return y.set(C, 0), y.set(j, C.length), k(y);
  }
  async function F(l) {
    try {
      var c = await z();
      if (!c) return false;
      var S = await J(c.key, l), C = await chrome.runtime.sendMessage({
        type: "mobilePush",
        channel: c.channel,
        blob: S
      });
      return !(!C || !C.ok);
    } catch (U) {
      return false;
    }
  }
  Y.GhostedMobile = {
    getPair: z,
    createPair: L,
    unpair: O,
    pairUrl: X,
    push: F,
    RELAY: t
  };
})(typeof self !== "undefined" ? self : this);
