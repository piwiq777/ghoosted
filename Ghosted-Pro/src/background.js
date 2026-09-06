// build flags (FREE_MODE / PRODUCT) — see src/build.js. Side-effect import:
// build.js assigns onto globalThis so the same file also works as a
// classic content script.
import "./build.js";

const LICENSE_API_BASE = "https://ghoosted.net/api/license", STATUS_API = "https://ghoosted.net/api/status", LICENSE_KEY = "ghosted_license", scanLeases = new Map;

chrome.runtime.onInstalled.addListener(async () => {
  const {ghosted_installed_at: Y} = await chrome.storage.local.get("ghosted_installed_at");
  if (!Y) chrome.storage.local.set({
    ghosted_installed_at: Date.now()
  });
  chrome.alarms.create("ghosted-tick", {
    periodInMinutes: 15
  }), chrome.alarms.create("ghosted-relicense", {
    periodInMinutes: 4320
  }), chrome.alarms.create("ghosted-status", {
    periodInMinutes: 360
  });
  checkStatus();
}), chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("ghosted-tick", {
    periodInMinutes: 15
  }), chrome.alarms.create("ghosted-status", {
    periodInMinutes: 360
  });
  checkStatus();
}), chrome.alarms.onAlarm.addListener(async Y => {
  if (Y.name === "ghosted-tick") {
    const t = await chrome.tabs.query({
      url: "https://www.instagram.com/*"
    }), g = t.find(k => k.active) || t[0];
    if (g) chrome.tabs.sendMessage(g.id, {
      type: "runCheck"
    }).catch(() => {});
  } else if (Y.name === "ghosted-status") checkStatus(); else if (Y.name === "ghosted-relicense") {
    const {[LICENSE_KEY]: k} = await chrome.storage.local.get(LICENSE_KEY);
    if (k && k.key && k.accountId) verifyLicense(k.key, k.accountId, "verify").catch(() => {});
  }
}), chrome.runtime.onMessage.addListener((Y, t, g) => {
  if (!Y) return;
  if (Y.type === "notify") {
    const k = {
      type: "basic",
      iconUrl: Y.image || chrome.runtime.getURL("icons/icon-128.png"),
      title: Y.title || "Ghosted",
      message: Y.text || "",
      priority: 2
    };
    chrome.notifications.create("", k, () => {
      chrome.runtime.lastError && (k.iconUrl = chrome.runtime.getURL("icons/icon-128.png"), 
      chrome.notifications.create("", k, () => {}));
    });
    return;
  }
  if (Y.type === "verifyLicense") return verifyLicense(Y.key, Y.accountId, "activate").then(g), 
  true;
  if (Y.type === "clearLicense") return chrome.storage.local.remove(LICENSE_KEY).then(() => g({
    ok: true
  })), true;
  if (Y.type === "acquireScanLease") {
    const q = String(Y.accountId || ""), x = Date.now(), z = scanLeases.get(q);
    if (z && z.expiresAt > x) {
      g({
        granted: false,
        expiresAt: z.expiresAt
      });
      return;
    }
    const L = crypto.randomUUID();
    scanLeases.set(q, {
      token: L,
      expiresAt: x + 18e4
    }), g({
      granted: true,
      token: L
    });
    return;
  }
  if (Y.type === "releaseScanLease") {
    const O = String(Y.accountId || ""), X = scanLeases.get(O);
    if (X && X.token === Y.token) scanLeases.delete(O);
    g({
      ok: true
    });
    return;
  }
  if (Y.type === "instagramRead") return instagramRead(Y.url, t).then(g), true;
//#plus-off descargas de medios
  if (Y.type === "downloadMedia") return downloadMedia(Y.url, Y.name).then(g), true;
//#plus-on
  if (Y.type === "fetchImage") return fetchImageAsDataUrl(Y.url).then(g), true;
  if (Y.type === "getLocaleMessages") return getLocaleMessages(Y.code).then(g), true;
//#plus-off espejo del movil
  if (Y.type === "mobilePush") return mobilePush(Y.channel, Y.blob).then(g), true;
//#plus-on
});

async function checkStatus() {
  try {
    const r = await fetch(STATUS_API, {
      cache: "no-store"
    });
    if (!r.ok) return;
    const j = await r.json();
    if (!j) return;
    await chrome.storage.local.set({
      ghosted_status: {
        latest: String(j.latest || ""),
        minimum: String(j.minimum || ""),
        notice: j.notice && j.notice.id ? j.notice : null,
        ts: Date.now()
      }
    });
  } catch (e) {}
}

//#plus-off espejo del movil: Plus no tiene canal de moviles
async function mobilePush(Y, t) {
  try {
    if (!Y || !t) return {
      ok: false
    };
    const g = await fetch("https://ghoosted.net/api/m/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel: Y,
        blob: t
      })
    });
    return {
      ok: g.ok,
      status: g.status
    };
  } catch (k) {
    return {
      ok: false,
      error: String(k && k.message || k)
    };
  }
}
//#plus-on

const localeCache = new Map;

async function getLocaleMessages(Y) {
  const t = String(Y || "").replace(/[^a-zA-Z_-]/g, "");
  if (!t) return {
    messages: null
  };
  if (localeCache.has(t)) return {
    messages: localeCache.get(t)
  };
  try {
    const g = await fetch(chrome.runtime.getURL("_locales/" + t + "/messages.json"));
    if (!g.ok) return {
      messages: null
    };
    const q = await g.json(), x = {};
    for (const z in q) x[z] = q[z] && q[z].message;
    return localeCache.set(t, x), {
      messages: x
    };
  } catch (L) {
    return {
      messages: null
    };
  }
}

//#plus-off descargas: Plus no guarda medios de nadie en el disco
async function downloadMedia(Y, t) {
  try {
    const g = new URL(String(Y || ""));
    if (!/(^|\.)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(g.hostname)) return {
      ok: false,
      error: "bad_host"
    };
    const k = String(t || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const q = await chrome.downloads.download({
      url: g.href,
      filename: "Ghosted/" + k,
      saveAs: false
    });
    return {
      ok: !!q,
      id: q
    };
  } catch (x) {
    return {
      ok: false,
      error: String(x && x.message || x)
    };
  }
}
//#plus-on

async function fetchImageAsDataUrl(Y) {
  try {
    const t = new URL(String(Y || ""));
    if (!/(^|\.)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(t.hostname)) return {
      error: "bad_host"
    };
    const g = await fetch(t.href, {
      credentials: "omit"
    });
    if (!g.ok) return {
      error: "http_" + g.status
    };
    const k = await g.blob(), q = await k.arrayBuffer(), x = new Uint8Array(q);
    let z = "";
    for (let L = 0; L < x.length; L++) z += String.fromCharCode(x[L]);
    return {
      dataUrl: "data:" + (k.type || "image/jpeg") + ";base64," + btoa(z)
    };
  } catch (O) {
    return {
      error: "network"
    };
  }
}

 // The claim IG hands out via `x-ig-set-www-claim` on a response — and
// expects echoed back via `x-ig-www-claim` on every later request. Cached in
// chrome.storage.session (in-memory, survives a service-worker restart but
// not a browser restart) since this file has no other durable per-session
// state. Starts at '0' (an unclaimed session), same as a fresh IG page load.
async function getWwwClaim() {
  try {
    const {ghosted_www_claim: Y} = await chrome.storage.session.get("ghosted_www_claim");
    return Y || "0";
  } catch (Y) {
    return "0";
  }
}

async function setWwwClaim(Y) {
  if (!Y) return;
  try {
    await chrome.storage.session.set({
      ghosted_www_claim: Y
    });
  } catch (t) {}
}

async function instagramRead(Y, t) {
  try {
    const g = String(t && t.url || t && t.tab && t.tab.url || "");
    if (!t || !t.tab || !g.startsWith("https://www.instagram.com/")) return {
      error: "bad_sender"
    };
    const k = new URL(String(Y || ""));
    if (k.origin === "https://i.instagram.com" && k.pathname.startsWith("/api/v1/")) {
      const zi = async O => {
        const X = await fetch(O, {
          method: "GET",
          credentials: "include",
          headers: {
            "x-ig-app-id": "936619743392459",
            "x-asbd-id": "359341",
            "x-requested-with": "XMLHttpRequest"
          }
        }), J = X.headers.get("content-type") || "", F = await X.text(), l = J.toLowerCase().includes("application/json") || /^\s*[\[{]/.test(F);
        return {
          status: X.status,
          contentType: J,
          text: l ? F : "",
          finalUrl: X.url || O,
          htmlClass: l ? "" : "shell"
        };
      };
      return await zi(k.href);
    }
    if (k.origin !== "https://www.instagram.com" || !k.pathname.startsWith("/api/v1/") && !k.pathname.startsWith("/graphql/query")) return {
      error: "bad_url"
    };
    const claim = await getWwwClaim(), q = await chrome.scripting.executeScript({
      target: {
        tabId: t.tab.id
      },
      world: "MAIN",
      func: async (O, claim0) => {
        const X = y => {
          const H = document.cookie.match(new RegExp("(?:^|; )" + y + "=([^;]*)"));
          return H ? decodeURIComponent(H[1]) : "";
        }, J = {
          "x-ig-app-id": "936619743392459",
          "x-asbd-id": "359341",
          "x-ig-www-claim": claim0 || "0"
        }, F = X("csrftoken");
        if (F) J["x-csrftoken"] = F;
        const l = await fetch(O, {
          method: "GET",
          credentials: "include",
          headers: J,
          redirect: "follow"
        }), c = l.headers.get("content-type") || "", S = await l.text(), C = c.toLowerCase().includes("application/json") || /^\s*[\[{]/.test(S), U = l.url || O, newClaim = l.headers.get("x-ig-set-www-claim") || "";
        let j = "";
        if (!C) {
          const y = S.slice(0, 4e3).toLowerCase();
          if (U.includes("/accounts/login") || y.includes("loginform")) j = "login"; else if (/\/(challenge|checkpoint)\//.test(U) || y.includes("checkpoint")) j = "challenge"; else j = "shell";
        }
        return {
          status: l.status,
          contentType: c,
          text: C ? S : "",
          finalUrl: U,
          htmlClass: j,
          newClaim: newClaim
        };
      },
      args: [ k.pathname + k.search, claim ]
    }), x = q && q[0] && q[0].result || null;
    if (x && x.newClaim) setWwwClaim(x.newClaim).catch(() => {});
    if (x && x.htmlClass !== "shell") return x;
    const z = async O => {
      const X = await fetch(O, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-ig-app-id": "936619743392459",
          "x-requested-with": "XMLHttpRequest"
        }
      }), J = X.headers.get("content-type") || "", F = await X.text(), l = J.toLowerCase().includes("application/json") || /^\s*[\[{]/.test(F), c = X.url || O;
      let S = "";
      if (!l) {
        const C = F.slice(0, 4e3).toLowerCase();
        if (c.includes("/accounts/login") || C.includes("loginform")) S = "login"; else if (/\/(challenge|checkpoint)\//.test(c) || C.includes("checkpoint")) S = "challenge"; else S = "shell";
      }
      return {
        status: X.status,
        contentType: J,
        text: l ? F : "",
        finalUrl: c,
        htmlClass: S
      };
    }, L = await z(k.href);
    if (L.htmlClass !== "shell") return L;
    return z("https://i.instagram.com" + k.pathname + k.search);
  } catch (O) {
    return {
      error: "network"
    };
  }
}

chrome.notifications.onClicked.addListener(async () => {
  const Y = await chrome.tabs.query({
    url: "https://www.instagram.com/*"
  });
  Y[0] ? (chrome.tabs.update(Y[0].id, {
    active: true
  }), chrome.windows.update(Y[0].windowId, {
    focused: true
  }), chrome.tabs.sendMessage(Y[0].id, {
    type: "openPanel"
  }).catch(() => {})) : chrome.tabs.create({
    url: "https://www.instagram.com/"
  });
});

function validAccountId(Y) {
  return /^\d{1,30}$/.test(String(Y || ""));
}

async function verifyLicense(Y, t, g) {
  const k = String(Y || "").trim().toUpperCase(), q = String(t || "").trim();
  if (!k) return {
    valid: false,
    error: "empty"
  };
  if (!validAccountId(q)) return {
    valid: false,
    error: "account"
  };
  try {
    const x = await fetch(LICENSE_API_BASE + "/" + g, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key: k,
        accountId: q,
        product: globalThis.GhostedBuild && globalThis.GhostedBuild.PRODUCT || "pro"
      })
    }), z = await x.json().catch(() => ({})), L = {
      valid: !(!x.ok || !z.valid),
      key: k,
      accountId: q,
      verifiedAt: Date.now(),
      revoked: !!z.revoked,
      expiresAt: z.expiresAt || null,
      error: z.error || (!x.ok ? "invalid" : null)
    }, O = L.valid || [ "expired", "revoked", "bound", "invalid", "unbound", "account" ].indexOf(L.error) !== -1;
    if (g === "activate" || O) await chrome.storage.local.set({
      [LICENSE_KEY]: L
    });
    return L;
  } catch (X) {
    return {
      valid: false,
      error: "network"
    };
  }
}
