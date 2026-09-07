(function() {
  "use strict";
  if (window.__ghostedLoaded) return;
  window.__ghostedLoaded = true;
  const Y = GhostedI18n.t, g = GhostedStore, k = GhostedIG, q = GhostedLicense, x = GhostedConfig, z = {
    intervalMin: 30,
    notify: true,
    followingEveryHours: 24,
    storyEveryMin: 30
  }, L = true, O = k.getUserId();
  if (!O) {
    console.info("[Ghoosted] No Instagram session — panel not shown.");
    return;
  }
  const X = "ghosted_" + O + "_", J = {
    followers: X + "followers",
    following: X + "following",
    events: X + "events",
    settings: X + "settings",
    lastCheck: X + "lastCheck",
    lastAttempt: X + "lastAttempt",
    lastFollowingTs: X + "lastFollowingTs",
    seen: X + "seenTs",
    counts: X + "counts",
    history: X + "history",
    storyStats: X + "storyStats",
    storyLog: X + "storyLog",
//#plus-off clave de una funcion que Plus no lleva
    storyRecent: X + "storyRecent",
//#plus-on
//#plus-off espectadores de historias: sin archivo que guardar
    storyArchive: X + "storyArchive",
//#plus-on
    lastStory: X + "lastStory",
    activity: X + "activity",
    profileSnapshots: X + "profileSnapshots",
    profileCursor: X + "profileCursor",
//#plus-off clave de una funcion que Plus no lleva
    watchedProfiles: X + "watchedProfiles",
//#plus-on
    storyWatch: X + "storyWatch",
    spyFollowing: X + "spyFollowing",
//#plus-off clave de una funcion que Plus no lleva
    watchStats: X + "watchStats",
//#plus-on
//#plus-off clave de una funcion que Plus no lleva
    spyCursor: X + "spyCursor",
//#plus-on
    spyCounts: X + "spyCounts",
    spyFollowers: X + "spyFollowers",
    photoArchive: X + "photoArchive",
    topInteractions: X + "topInteractions",
//#plus-off clave de una funcion que Plus no lleva
    watchCollapsed: X + "watchCollapsed",
//#plus-on
    light: X + "light",
//#plus-off clave de una funcion que Plus no lleva
    pairWatch: X + "pairWatch",
//#plus-on
//#plus-off clave de una funcion que Plus no lleva
    reqRule: X + "reqRule",
//#plus-on
//#plus-off clave de una funcion que Plus no lleva
    reqCollapsed: X + "reqCollapsed",
//#plus-on
    actCollapsed: X + "actCollapsed",
    updSeen: X + "updSeen"
  };
  let F = z, l = false, c = false, C = false, U = null, j = "unfollow", y = "", H = null, R = false;
  const h = new Set;
  let r = false, Q = null;
  const Z = gq => new Promise(gx => setTimeout(gx, gq));
  let i = "", f = "", M = null, d = false, w = null, b = null, nbQ = "", lvT = null, lvL = false, lvE = "", lvU = null, lvI = null, lvN = 0, lvW = false, m, V, n, D, P, a, A, E, p, e, u, o;
  function ghdVerCmp(gq, gx) {
    const gz = String(gq || "").split(".").map(Number), gL = String(gx || "").split(".").map(Number);
    for (let gO = 0; gO < 3; gO++) {
      const gX = gz[gO] || 0, gJ = gL[gO] || 0;
      if (gX !== gJ) return gX > gJ ? 1 : -1;
    }
    return 0;
  }
  function ghdBanner() {
    if (!m) return;
    const gq = m.querySelector("#ghd-upd");
    if (gq) gq.remove();
    const gx = ghdStatus;
    if (!gx) return;
    const gz = chrome.runtime.getManifest().version;
    const gL = gx.minimum && ghdVerCmp(gz, gx.minimum) < 0;
    const gO = gx.latest && ghdVerCmp(gx.latest, gz) > 0;
    const gX = gx.notice && gx.notice.id ? gx.notice : null;
    if (!gL && !gO && !gX) return;
    const gJ = gL ? "min:" + gx.minimum : gX ? "avi:" + gX.id : "ver:" + gx.latest;
    if (!gL && g.get(J.updSeen, "") === gJ) return;
    const gF = document.createElement("div");
    gF.id = "ghd-upd", gF.className = "ghd-upd" + (gL || gX && gX.level === "warn" ? " warn" : "");
    const gl = document.createElement("span");
    gl.className = "ghd-upd-tx";
    const gc = GhostedI18n && GhostedI18n.locale || "en";
    gl.textContent = gL ? Y("upd_forced") : gX ? String(gX.text && (gX.text[gc] || gX.text.en) || "") : Y("upd_new", String(gx.latest));
    gF.appendChild(gl);
    if (gL || gO) {
      const gS = document.createElement("a");
      gS.className = "ghd-upd-go", gS.textContent = Y("upd_get"), gS.href = x.buyUrl, 
      gS.target = "_blank", gS.rel = "noopener", gF.appendChild(gS);
    }
    if (!gL) {
      const gC = document.createElement("button");
      gC.type = "button", gC.className = "ghd-upd-x", gC.textContent = "×", gC.title = Y("upd_dismiss"), 
      gC.addEventListener("click", () => {
        g.set(J.updSeen, gJ), gF.remove();
      }), gF.appendChild(gC);
    }
    const gU = m.querySelector(".ghd-head");
    if (gU && gU.nextSibling) m.insertBefore(gF, gU.nextSibling); else m.appendChild(gF);
  }
  let ghdStatus = null;
  function ghdStatusLoad() {
    try {
      chrome.storage.local.get("ghosted_status", gq => {
        ghdStatus = gq && gq.ghosted_status || null;
        ghdBanner();
      });
    } catch (gq) {}
  }
  function ghdNorm(gq) {
    try {
      return String(gq == null ? "" : gq).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    } catch (gx) {
      return String(gq == null ? "" : gq).toLowerCase();
    }
  }
  function ghdMatch(gq, gx) {
    if (!gx) return true;
    const gz = ghdNorm(gq && gq.username), gL = ghdNorm(gq && gq.full_name);
    return gz.indexOf(gx) !== -1 || gL.indexOf(gx) !== -1;
  }
  function N(gq) {
    return q.feature(g, gq);
  }
  function v() {
    return q.isPro(g);
  }
  function T(gq) {
    const gx = new Date(gq);
    return gx.getFullYear() + "-" + (gx.getMonth() + 1) + "-" + gx.getDate();
  }
  function B(gq) {
    const gx = Math.floor((Date.now() - gq) / 1e3);
    if (gx < 60) return Y("ago_s", String(gx));
    const gz = Math.floor(gx / 60);
    if (gz < 60) return Y("ago_m", String(gz));
    const gL = Math.floor(gz / 60);
    if (gL < 24) return Y("ago_h", String(gL));
    const gO = Math.floor(gL / 24);
    if (gO < 7) return Y("ago_d", String(gO));
    const gX = Math.floor(gO / 7);
    if (gX < 5) return Y("ago_w", String(gX));
    const gJ = Math.floor(gO / 30);
    return Y("ago_mo", String(gJ));
  }
  function G(gq, gx) {
    if (!P) return;
    P.textContent = gq, P.className = "ghd-status" + (gx ? " " + gx : "");
  }
  function I(gq, gx, gz) {
    try {
      chrome.runtime.sendMessage({
        type: "notify",
        title: gq,
        text: gx,
        image: gz
      });
    } catch (gL) {}
  }
  function W(gq) {
    const gx = String(gq || "");
    if (!gx || /anonymous_profile|default_profile/i.test(gx)) return "";
    const gz = gx.match(/\/(\d{8,})_/);
    return gz ? gz[1] : "";
  }
  function Y0(gq, gx) {
    const gz = gq || {}, gL = {
      pk: String(gz.pk || ""),
      username: gz.username || "",
      full_name: gz.full_name || "",
      pic: gz.pic || "",
      picKey: W(gz.pic),
      is_private: !!gz.is_private,
      is_verified: !!gz.is_verified,
      checkedAt: Date.now()
    };
    if (gx || Object.prototype.hasOwnProperty.call(gz, "bio")) gL.bio = gz.bio || "";
    return gL;
  }
  function Y1(gq, gx, gz, gL) {
    if (!gx || !gz || !gz.pk) return null;
    const gO = gq === "photo" ? gz.picKey : gq === "bio" ? gz.bio : gz[gq === "name" ? "full_name" : "username"];
    if (gO === void 0 || gO === null) return null;
    const gX = gq + ":" + gz.pk + ":" + gO, gJ = g.get(J.activity, []);
    if (gJ.some(gl => gl.key === gX)) return null;
    const gF = Object.assign({
      type: gq,
      key: gX,
      ts: gL || Date.now()
    }, gz, {
      before: gq === "name" ? gx.full_name : gq === "username" ? gx.username : gq === "bio" ? gx.bio : gq === "photo" ? gx.pic || "" : "",
      after: gq === "name" ? gz.full_name : gq === "username" ? gz.username : gq === "bio" ? gz.bio : gq === "photo" ? gz.pic || "" : ""
    });
    return gJ.unshift(gF), g.set(J.activity, gJ.slice(0, 1e3)), gF;
  }
  function Y2(gq) {
    return typeof gq === "string" ? gq.replace(/\s+/g, " ").trim() : gq;
  }
  const Y3 = {
    photo: "picKey",
    name: "full_name",
    username: "username",
    bio: "bio"
  };
  function Y4(gq, gx, gz, gL) {
    const gO = Object.assign({}, gq, gx), gX = Object.assign({}, gq._pend || {}), gJ = [ "photo", "name", "username" ];
    if (gz) gJ.push("bio");
    return gJ.forEach(gF => {
      const gl = Y3[gF], gc = gF === "photo";
      gO[gl] = gq[gl];
      if (gc) gO.pic = gq.pic;
      const gS = gc ? gq.picKey : Y2(gq[gl]), gC = gc ? gx.picKey : Y2(gx[gl]), gU = gc ? gq.picKey && gx.picKey : gS && gC;
      if (!gU) {
        delete gX[gF];
        return;
      }
      if (gC === gS) {
        delete gX[gF];
        return;
      }
      if (gX[gF] === gC) {
        Y1(gF, gq, gx, gL), gO[gl] = gx[gl];
        if (gc) gO.pic = gx.pic;
        delete gX[gF];
      } else gX[gF] = gC;
    }), gO._pend = gX, gO;
  }
  function Y5(gq, gx, gz, gL) {
    if (!gq || !gq.pk) return;
    const gO = g.get(J.profileSnapshots, {}), gX = gO[gq.pk], gJ = Y0(gq, gx);
    if (gX) {
      if (!gx && typeof gX.bio === "string") gJ.bio = gX.bio;
      !gJ.picKey && gX.picKey && (gJ.picKey = gX.picKey, gJ.pic = gX.pic), gO[gq.pk] = Y4(gX, gJ, gx, gz);
    } else gO[gq.pk] = gJ;
    if (gL !== false) g.set(J.profileSnapshots, gO);
  }
//#plus-off punto de mira: lista de cuentas vigiladas
  function Y6() {
    const gq = g.get(J.watchedProfiles, []);
    return Array.isArray(gq) ? gq.filter(gx => gx && gx.pk && gx.username) : [];
  }
//#plus-on
//#plus-off punto de mira: conteo de seguidores de cuentas ajenas
  let Y7 = new Set;
  function Y8(gq) {
    const gx = g.get(J.watchStats, {}), gz = gx[gq];
    if (gz && Date.now() - gz.ts < 72e5) return;
    if (Y7.has(gq)) return;
    Y7.add(gq), k.fetchProfileCounts(gq).then(gL => {
      Y7.delete(gq);
      if (!gL) return;
      const gO = g.get(J.watchStats, {});
      gO[gq] = {
        followers: gL.followers,
        following: gL.following,
        ts: Date.now()
      }, g.set(J.watchStats, gO);
      if (j === "activity") gt();
    }).catch(() => {
      Y7.delete(gq);
    });
  }
//#plus-on
  function Y9(gq, gx) {
    const gz = g.get(J.activity, []), gL = [];
    for (const gO of gz) {
      if (gO.type === "follow_add" && gO.pk === gq && gO.target && gO.target.pk) gL.push(gO.target);
      if (gL.length >= gx) break;
    }
    return gL;
  }
  async function YY(gq, gx, gz) {
    const gL = new Map;
    (gq || []).forEach(gl => {
      if (gl && gl.pk) gL.set(gl.pk, gl);
    }), (gx || []).forEach(gl => {
      if (gl && gl.pk) gL.set(gl.pk, gl);
    });
//#plus-off punto de mira: los vigilados no entran en la mezcla
    Y6().forEach(gl => gL.set(gl.pk, gl));
//#plus-on
    const gO = Array.from(gL.values());
    if (!gO.length) return;
    const gX = gz ? 6 : 3;
    let gJ = Number(g.get(J.profileCursor, 0)) || 0;
    if (gJ >= gO.length) gJ = 0;
    const gF = gO.slice(gJ, gJ + gX);
    if (gF.length < gX && gO.length > gX) gF.push.apply(gF, gO.slice(0, gX - gF.length));
    g.set(J.profileCursor, (gJ + gF.length) % gO.length);
    for (const gl of gF) try {
      const gc = await k.fetchUserProfile(gl.pk);
      Y5(gc, true, Date.now());
      if (gc && gc.pk && (gc.picHd || gc.pic)) await tc(gc.pk, gc.picHd || gc.pic, "avatar", "@" + (gc.username || "")).catch(() => {});
      await new Promise(gS => setTimeout(gS, 450));
    } catch (gS) {
      if (gS && gS.kind === "rate") throw gS;
    }
  }
  function Yt(gq) {
    if (!gq || !gq.pk) return null;
    const gx = g.get(J.activity, []);
    if (gq.key && gx.some(gz => gz.key === gq.key)) return null;
    return gx.unshift(gq), g.set(J.activity, gx.slice(0, 1e3)), gq;
  }
//#plus-off punto de mira: filtros y rastreo periodico de cuentas ajenas
  function Yg(gq) {
    return gq && gq.watchStory !== false;
  }
  function Yk(gq) {
    return !(!gq || !gq.watchFollowing);
  }
  async function Yq() {
    const gq = Y6().filter(Yg);
    if (!gq.length) return;
    const gx = g.get(J.storyWatch, {});
    let gz = false;
    for (const gL of gq.slice(0, 25)) try {
      const gO = await k.getStoryMeta(gL.pk), gX = Number(gx[gL.pk] || 0);
      if (gO.active && gO.latestTs > gX) {
        gx[gL.pk] = gO.latestTs;
        const gJ = {
          type: "story",
          ts: gO.latestTs || Date.now(),
          pk: gL.pk,
          username: gL.username,
          full_name: gL.full_name,
          pic: gL.pic,
          is_verified: gL.is_verified,
          is_private: gL.is_private,
          key: "story:" + gL.pk + ":" + (gO.latestTs || 0)
        };
        if (Yt(gJ)) {
          gz = true;
          if (F.notify) I(Y("notif_story", "@" + gL.username), gL.full_name || "@" + gL.username, gL.pic);
        }
      }
      await new Promise(gF => setTimeout(gF, 350));
    } catch (gF) {
      if (gF && gF.kind === "rate") throw gF;
    }
    g.set(J.storyWatch, gx);
    if (gz) gt();
  }
  async function Yx() {
    const gq = Y6().filter(Yk).filter(t6).filter(gF => !gF.is_private);
    if (!gq.length) return;
    const gx = g.get(J.spyFollowing, {}), gz = 36e5, gL = 3;
    let gO = Number(g.get(J.spyCursor, 0)) || 0;
    if (gO >= gq.length) gO = 0;
    const gX = [];
    for (let gF = 0; gF < gq.length && gX.length < gL; gF++) {
      const gl = gq[(gO + gF) % gq.length], gc = gx[gl.pk];
      if (gc && Date.now() - gc.ts < gz) continue;
      gX.push(gl);
    }
    g.set(J.spyCursor, (gO + gL) % gq.length);
    if (!gX.length) return;
    let gJ = false;
    for (const gS of gX) {
      let gC;
      try {
        gC = await k.fetchFollowingOf(gS.pk);
      } catch (gb) {
        if (gb && gb.kind === "rate") throw gb;
        continue;
      }
      await new Promise(gm => setTimeout(gm, 500));
      const gU = gC.users.map(gm => ({
        pk: gm.pk,
        username: gm.username,
        full_name: gm.full_name,
        pic: gm.pic,
        is_verified: gm.is_verified,
        is_private: gm.is_private
      })), gj = gx[gS.pk];
      if (!gC.complete) {
        if (!gj) gx[gS.pk] = {
          ts: Date.now(),
          users: gU,
          complete: false
        };
        continue;
      }
      if (!gj || !gj.complete) {
        gx[gS.pk] = {
          ts: Date.now(),
          users: gU,
          complete: true
        };
        continue;
      }
      const gy = Date.now(), gH = new Set(gj.users.map(gm => gm.pk)), gR = new Set(gU.map(gm => gm.pk)), gh = gU.filter(gm => !gH.has(gm.pk)), gK = gj.users.filter(gm => !gR.has(gm.pk)), gr = gj.users.length >= 30 && gU.length < gj.users.length * .7;
      if (gr || gh.length + gK.length > 25) {
        gx[gS.pk] = {
          ts: Date.now(),
          users: gj.users,
          complete: true,
          pAdd: [],
          pRem: []
        };
        continue;
      }
      const gQ = new Set(gj.pAdd || []), gZ = new Set(gj.pRem || []), gi = gh.filter(gm => gQ.has(gm.pk)), gf = gK.filter(gm => gZ.has(gm.pk));
      let gs = 0, gM = 0;
      gi.forEach(gm => {
        const gV = {
          type: "follow_add",
          ts: gy,
          pk: gS.pk,
          username: gS.username,
          full_name: gS.full_name,
          pic: gS.pic,
          is_verified: gS.is_verified,
          is_private: gS.is_private,
          target: gm,
          key: "fadd:" + gS.pk + ":" + gm.pk + ":" + T(gy)
        };
        Yt(gV) && (gJ = true, gs++);
      }), gf.forEach(gm => {
        const gV = {
          type: "follow_rem",
          ts: gy,
          pk: gS.pk,
          username: gS.username,
          full_name: gS.full_name,
          pic: gS.pic,
          is_verified: gS.is_verified,
          is_private: gS.is_private,
          target: gm,
          key: "frem:" + gS.pk + ":" + gm.pk + ":" + T(gy)
        };
        Yt(gV) && (gJ = true, gM++);
      });
      if ((gs || gM) && F.notify) {
        const gm = [];
        if (gs) gm.push(Y("spy_added_c", String(gs)));
        if (gM) gm.push(Y("spy_removed_c", String(gM)));
        I(Y("notif_watch_changed", "@" + gS.username), gm.join(" · "), gS.pic);
      }
      const gd = new Set(gf.map(gV => gV.pk)), gw = gj.users.filter(gV => !gd.has(gV.pk)).concat(gi);
      gx[gS.pk] = {
        ts: gy,
        users: gw,
        complete: true,
        pAdd: gh.map(gV => gV.pk),
        pRem: gK.map(gV => gV.pk)
      };
    }
    g.set(J.spyFollowing, gx);
    if (gJ) gt();
  }
//#plus-on
  async function Yz() {
    if (C) return;
    C = true;
    try {
//#plus-off punto de mira: barrido de historias y seguidos de terceros
      try {
        await Yq();
      } catch (gq) {
        if (gq && gq.kind === "rate") {
          YX(gq);
          return;
        }
      }
      try {
        await Yx();
      } catch (gx) {
        if (gx && gx.kind === "rate") YX(gx);
      }
//#plus-on
    } finally {
      C = false;
    }
  }
  let ghdLoadEl = null, ghdLoadT0 = 0, ghdLoadFase = "";
  function ghdLoadEta(gq, gx) {
    if (!gx || !gq || gq < 2) return "";
    const gz = Date.now() - ghdLoadT0;
    if (gz < 2e3) return "";
    const gL = Math.round(gz / gq * (gx - gq) / 1e3);
    if (gL <= 0) return "";
    const gO = gL >= 60 ? Y("load_min", String(Math.round(gL / 60))) : Y("load_sec", String(gL));
    return Y("load_eta", gO);
  }
  function ghdLoadShow(gq, gx, gz) {
    if (!m) return;
    if (!ghdLoadEl) {
      ghdLoadEl = document.createElement("div"), ghdLoadEl.id = "ghd-loading";
      const gz = document.createElement("div");
      gz.className = "ghd-load-ghost", gz.innerHTML = Yr();
      const gL = document.createElement("div");
      gL.className = "ghd-load-lb", gL.textContent = Y("load_followers");
      const gO = document.createElement("div");
      gO.className = "ghd-load-n";
      const gOf = document.createElement("div");
      gOf.className = "ghd-load-of";
      const gX = document.createElement("div");
      gX.className = "ghd-load-sub", gX.textContent = Y("load_wait");
      const gSf = document.createElement("div");
      gSf.className = "ghd-load-safe";
      const gSt = document.createElement("b");
      gSt.textContent = Y("load_safe_t");
      const gSd = document.createElement("span");
      gSd.textContent = Y("load_safe_d");
      gSf.append(gSt, gSd);
      const gJ = document.createElement("div");
      gJ.className = "ghd-load-bar", gJ.appendChild(document.createElement("i"));
      ghdLoadEl.append(gz, gL, gO, gOf, gJ, gX, gSf), m.appendChild(ghdLoadEl);
    }
    const gHd = m.querySelector(".ghd-head");
    ghdLoadEl.style.top = (gHd ? gHd.offsetHeight : 0) + "px";
    const gF = ghdLoadEl.querySelector(".ghd-load-n");
    if (gF) gF.textContent = gq == null ? "" : Number(gq).toLocaleString();
    if (gz && gz !== ghdLoadFase) ghdLoadFase = gz, ghdLoadT0 = Date.now();
    if (!ghdLoadT0) ghdLoadT0 = Date.now();
    const gT = ghdLoadEl.querySelector(".ghd-load-lb");
    if (gT && gz) gT.textContent = Y(gz);
    const gSb = ghdLoadEl.querySelector(".ghd-load-sub");
    if (gSb) {
      const gEta = ghdLoadEta(gq, gx);
      gSb.textContent = gEta || Y("load_wait");
    }
    const gSg = ghdLoadEl.querySelector(".ghd-load-safe");
    if (gSg) gSg.style.display = gz === "load_unfollowing" || gz === "load_approving" ? "" : "none";
    const gD = ghdLoadEl.querySelector(".ghd-load-of");
    if (gD) gD.textContent = gx && gq != null ? Y("load_of", Number(gx).toLocaleString()) : "";
    const gB = ghdLoadEl.querySelector(".ghd-load-bar");
    if (gB) {
      const gI = gB.firstChild;
      if (gx && gq != null) {
        const gPc = Math.max(2, Math.min(100, Math.round(gq / gx * 100)));
        gB.classList.add("det"), gI.style.width = gPc + "%";
      } else gB.classList.remove("det"), gI.style.width = "";
    }
    ghdLoadEl.classList.add("show");
  }
  function ghdLoadHide() {
    ghdLoadFase = "", ghdLoadT0 = 0;
    if (ghdLoadEl) ghdLoadEl.classList.remove("show");
  }
  async function YL(gq) {
    if (!v()) {
      Ys();
      return;
    }
    if (l) return;
    // Las dos comprobaciones comparten la pantalla de carga, y la primera en
    // terminar se la quitaba a la otra: salia y desaparecia al instante. Ya
    // que ademas las dos piden datos a Instagram, no deben solaparse nunca.
    if (d) {
      if (gq) ghdToast(Y("busy_other"), "work");
      return;
    }
    l = true;
    let gx = null;
    if (A) A.disabled = true;
    G(Y("status_checking"), "work");
    try {
      let gz = null;
      try {
        gz = await chrome.runtime.sendMessage({
          type: "acquireScanLease",
          accountId: O
        });
      } catch (gh) {
        console.warn("[Ghoosted] scan lease unavailable, running without it", gh);
      }
      if (gz && !gz.granted) {
        G(Y("status_other_tab"), "work");
        return;
      }
      gx = gz && gz.token || null, g.set(J.lastAttempt, Date.now());
      const gL = g.get(J.followers, null);
      const gPant = !!gq || !gL;
      const gTotF = Number(g.get(J.counts, {}).followers) || (gL && gL.users ? gL.users.length : 0);
      if (gPant) ghdLoadShow(0, gTotF, "load_followers");
      const gO = await k.fetchList("followers", gK => {
        G(Y("status_loading_followers", String(gK)), "work");
        if (gPant) ghdLoadShow(gK, gTotF, "load_followers");
      }), gX = gO.users, gJ = Date.now();
      let gF = null;
      try {
        gF = await k.fetchProfileCounts();
        if (gF) g.set(J.counts, gF);
      } catch (gK) {}
      const gl = gL && gL.users ? gL.users : null, gc = gF && Number(gF.followers), gS = !gO.complete || Number.isFinite(gc) && gc > 0 && gX.length === 0 || gl && gl.length > 20 && gX.length < gl.length * .5;
      if (gS) {
        G(Y("status_partial"), "alert");
        return;
      }
      let gC = [], gU = [];
      if (gl && gl.length) {
        const gr = new Map(gX.map(gZ => [ gZ.pk, gZ ])), gQ = new Map(gl.map(gZ => [ gZ.pk, gZ ]));
        for (const [gZ, gi] of gQ) if (!gr.has(gZ)) gC.push(gi);
        for (const [gf, gs] of gr) if (!gQ.has(gf)) gU.push(gs);
      }
      g.set(J.followers, {
        ts: gJ,
        users: gX,
        complete: gO.complete
      }), g.set(J.lastCheck, gJ), YF(gX.length), gX.forEach(gM => Y5(gM, false, gJ, false));
      if (gC.length || gU.length) {
        const gM = g.get(J.events, []), gd = gm => gm.type + ":" + gm.pk + ":" + gm.ts, gw = new Set(gM.map(gd)), gb = [];
        gC.forEach(gm => gb.push(Object.assign({
          type: "unfollow",
          ts: gJ
        }, gm))), gU.forEach(gm => gb.push(Object.assign({
          type: "new",
          ts: gJ
        }, gm))), gb.forEach(gm => {
          if (!gw.has(gd(gm))) gM.unshift(gm);
        }), g.set(J.events, gM.slice(0, 3e3));
        ghdKeepFaces(gb);
      }
      if (gC.length && F.notify && N("instantAlerts")) YJ(gC);
//#plus-off punto de mira: aviso de cuenta vigilada
      if (gC.length && F.notify) {
        const gm = new Set(Y6().map(gV => gV.pk));
        gC.filter(gV => gm.has(gV.pk)).forEach(gV => {
          I(Y("notif_watch_unfollowed_you", "@" + gV.username), gV.full_name || "@" + gV.username, gV.pic);
        });
      }
//#plus-on
      const gj = g.get(J.lastFollowingTs, 0), gy = Date.now() - gj > F.followingEveryHours * 36e5;
      let gH = g.get(J.following, {
        users: []
      }).users || [];
      if (gq || !g.get(J.following, null) || gy) {
        G(Y("status_loading_following"), "work");
        const gTotG = Number(g.get(J.counts, {}).following) || gH.length || 0;
        if (gPant) ghdLoadShow(0, gTotG, "load_following");
        const gV = await k.fetchList("following", gn => {
          G(Y("status_loading_following_n", String(gn)), "work");
          if (gPant) ghdLoadShow(gn, gTotG, "load_following");
        });
        if (gV.complete || !g.get(J.following, null)) g.set(J.following, {
          ts: Date.now(),
          users: gV.users
        }), g.set(J.lastFollowingTs, Date.now()), gH = gV.users; else G(Y("status_following_partial"), "alert"), 
        ghdToast(Y("status_following_partial"), "alert");
      }
      if (gPant) ghdLoadShow(null, 0, "load_saving");
      gH.forEach(gn => Y5(gn, false, gJ, false)), g.set(J.profileSnapshots, g.get(J.profileSnapshots, {}));
      try {
        await YY(gX, gH, gq);
      } catch (gn) {
        console.warn("[Ghoosted] profile activity scan skipped", gn);
      }
      gt();
      if (!gl) G(Y("status_baseline"), "ok"); else if (gC.length && gU.length) G(Y("status_unfollowers", String(gC.length)) + " · " + Y("status_newfollowers", String(gU.length)), "alert"); else if (gC.length) G(Y("status_unfollowers", String(gC.length)), "alert"); else if (gU.length) G(Y("status_newfollowers", String(gU.length)), "ok"); else G(Y("status_nochanges"), "ok");
      await Yz();
      const gR = g.get(J.lastStory, 0);
//#plus-off espectadores de historias: refresco periodico
      Date.now() - gR > Math.max(15, F.storyEveryMin || 30) * 6e4 && await Yl(false, true).catch(() => {});
//#plus-on
//#plus-off parejas y solicitudes: ni rastreo ni escritura automatica
      ghdPairScan().catch(() => {});
      if (ghdReqRule() !== "manual") ghdReqRun(ghdReqRule()).catch(() => {});
//#plus-on
    } catch (gD) {
      YX(gD);
    } finally {
      ghdLoadHide();
      try {
        if (gx) chrome.runtime.sendMessage({
          type: "releaseScanLease",
          accountId: O,
          token: gx
        }).catch(() => {});
      } catch (gP) {}
      l = false;
      if (A) A.disabled = false;
      YR();
    }
  }
  function YO(gq) {
    const gx = (gq && (gq.message || gq.reason) || gq || "") + "";
    return /context invalidated|message port closed|could not establish connection|receiving end does not exist/i.test(gx);
  }
  function YX(gq) {
    console.warn("[Ghoosted]", gq);
    const gx = gq && gq.kind;
    if (gx === "rate") F.intervalMin = Math.min(180, F.intervalMin * 2), g.set(J.settings, F), 
    G(Y("status_rate", String(gq && gq.status || 429)), "alert"); else if (gx === "challenge") G(Y("status_challenge", String(gq && gq.status || "IG")), "alert"); else if (gx === "auth") G(Y("status_auth", String(gq && gq.status || "IG")), "alert"); else if (gx === "network") G(Y("status_network"), "alert"); else if (gx === "transport") G(Y("status_transport", String(gq && gq.status || "IG")), "alert"); else if (gx === "http") G(Y("status_http", String(gq && gq.status || "IG")), "alert"); else if (YO(gq)) G(Y("status_reload"), "alert"); else {
      const gz = gq && (gq.reason || gq.message);
      G(Y("status_error") + (gz ? " · " + String(gz).slice(0, 70) : ""), "alert");
    }
  }
  function YJ(gq) {
    const gx = gq.map(gO => "@" + gO.username).slice(0, 5).join(", "), gz = gq.length > 5 ? " +" + (gq.length - 5) : "", gL = gq.length === 1 ? Y("notif_one") : Y("notif_many", String(gq.length));
    I(gL, gx + gz, gq[0] && gq[0].pic || "");
  }
  function YF(gq) {
    const gx = g.get(J.history, []), gz = g.get(J.counts, null), gL = gx[gx.length - 1], gO = T(Date.now()), gX = {
      ts: Date.now(),
      followers: gz && gz.followers || gq,
      following: gz && gz.following || null
    };
    if (gL && T(gL.ts) === gO) gx[gx.length - 1] = gX; else gx.push(gX);
    g.set(J.history, gx.slice(-365));
  }
//#plus-off espectadores de historias: carga de la lista de quien te vio
  async function Yl(gq, gx) {
    if (!v()) {
      if (!gx) Ys();
      return;
    }
    if (c) return;
    if (!N("storyViewers")) {
      if (!gx) G(Y("status_pro_needed"), "alert");
      return;
    }
    c = true;
    if (!gx) G(Y("status_story_reading"), "work");
    try {
      const gz = await k.getMyStoryItems();
      if (!gz.length) {
        if (!gx) G(Y("status_story_none"), "ok");
        g.set(J.lastStory, Date.now());
        return;
      }
      const gL = new Map, gO = [];
      let gX = 0;
      for (let gF = 0; gF < gz.length; gF++) {
        if (!gx) G(Y("status_story_item", gF + 1 + "/" + gz.length), "work");
        const gl = await k.getStoryViewers(gz[gF].mediaId, gc => {
          if (!gx) G(Y("status_story_viewers", String(gX + gc)), "work");
        });
        gO.push({
          mediaId: gz[gF].mediaId,
          n: gF + 1,
          takenAt: gz[gF].takenAt,
          viewers: gl.length,
          likes: gl.filter(gc => gc.hasLiked).length
        }), await YC(gz[gF], gl), gl.forEach((gc, gS) => {
          const gC = gL.get(gc.pk) || {
            user: gc,
            itemsViewed: 0,
            bestPos: null,
            media: [],
            liked: [],
            replies: []
          };
          gC.itemsViewed += 1;
          if (gc.hasLiked) gC.liked.push(gz[gF].mediaId);
          if (gc.replyText && gC.replies.indexOf(gc.replyText) === -1) gC.replies.push(gc.replyText);
          gC.media.push(gz[gF].mediaId);
          const gU = gS + 1;
          if (gC.bestPos == null || gU < gC.bestPos) gC.bestPos = gU;
          gC.user = gc, gL.set(gc.pk, gC);
        }), gX += gl.length;
      }
      YU(gL, gz.length), g.set(J.storyRecent, {
        ts: Date.now(),
        stories: gO
      });
      const gJ = g.get(J.storyLog, []);
      gJ.unshift({
        ts: Date.now(),
        stories: gz.length,
        viewers: gL.size
      }), g.set(J.storyLog, gJ.slice(0, 500)), g.set(J.lastStory, Date.now()), gt();
      if (!gx) G(Y("status_story_done", String(gL.size)), "ok");
    } catch (gc) {
      if (!gx) YX(gc);
    } finally {
      c = false;
    }
  }
  let Yc = 0;
//#plus-on
//#plus-off espectadores de historias: refresco automatico
  function YS() {
    if (!v() || c) return;
    if (!N("storyViewers")) return;
    const gq = g.get(J.storyArchive, {}), gx = !Object.keys(gq).length, gz = Date.now() - g.get(J.lastStory, 0);
    if (Date.now() - Yc < 6e4 && !gx) return;
    (gx || gz > 6e4) && (Yc = Date.now(), Yl(false, true).catch(() => {}));
  }
//#plus-on
//#plus-off espectadores de historias: archivo de quien vio cada historia
  async function YC(gq, gx) {
    const gz = g.get(J.storyArchive, {}), gL = gz[gq.mediaId] || null, gO = {};
    if (gL && Array.isArray(gL.viewers)) gL.viewers.forEach(gc => {
      gO[gc.pk] = gc;
    });
    const gX = gx.map((gc, gS) => {
      const gC = gS + 1, gU = gO[gc.pk];
      let gj = gU ? gU.reopens || 0 : 0;
      const gy = gU ? gU.pos : null;
      if (gU && (gC <= 3 && gy > 3 || gC === 1 && gy !== 1)) gj += 1;
      return {
        pk: gc.pk,
        username: gc.username,
        full_name: gc.full_name,
        pic: gc.pic,
        is_private: gc.is_private,
        is_verified: gc.is_verified,
        hasLiked: !!gc.hasLiked,
        replyText: gc.replyText || null,
        pos: gC,
        reopens: gj
      };
    }), gJ = gL && gL.viewers && gL.viewers.length > gX.length ? gL.viewers : gX;
    let gF = gL && gL.thumb;
    if (!gF && gq.thumbUrl) gF = await Yb(gq.thumbUrl, 108);
    gz[gq.mediaId] = {
      mediaId: gq.mediaId,
      takenAt: gq.takenAt,
      isVideo: !!gq.isVideo,
      thumb: gF || null,
      capturedAt: Date.now(),
      viewerCount: gJ.length,
      likeCount: gJ.filter(gc => gc.hasLiked).length,
      viewers: gJ
    };
    const gl = Object.keys(gz).sort((gc, gS) => (gz[gS].takenAt || 0) - (gz[gc].takenAt || 0));
    if (gl.length > 60) gl.slice(60).forEach(gc => {
      delete gz[gc];
    });
    await g.setAwait(J.storyArchive, gz);
  }
//#plus-on
  function YU(gq, gx) {
    const gz = g.get(J.storyStats, {}), gL = Date.now(), gO = T(gL);
    for (const [gX, gJ] of gq) {
      const gF = gJ.user;
      let gl = gz[gX];
      !gl && (gl = {
        pk: gX,
        username: gF.username,
        full_name: gF.full_name,
        pic: gF.pic,
        is_private: gF.is_private,
        is_verified: gF.is_verified,
        captures: 0,
        slides: 0,
        firstSeen: gL,
        lastSeen: gL,
        days: [],
        media: []
      });
      gl.username = gF.username, gl.full_name = gF.full_name, gl.pic = gF.pic, gl.is_private = gF.is_private, 
      gl.is_verified = gF.is_verified;
      if (!Array.isArray(gl.media)) gl.media = [];
      let gc = 0;
      for (const gS of gJ.media || []) gl.media.indexOf(gS) === -1 && (gl.media.push(gS), 
      gc++);
      if (gl.media.length > 400) gl.media = gl.media.slice(-400);
      gl.slides += gc;
      if (gc > 0) gl.captures += 1;
      if (!Array.isArray(gl.likedMedia)) gl.likedMedia = [];
      for (const gC of gJ.liked || []) if (gl.likedMedia.indexOf(gC) === -1) gl.likedMedia.push(gC);
      if (gl.likedMedia.length > 400) gl.likedMedia = gl.likedMedia.slice(-400);
      gl.likes = gl.likedMedia.length, gl.lastLiked = (gJ.liked || []).length;
      if (gJ.replies && gJ.replies.length) gl.lastReply = gJ.replies[gJ.replies.length - 1];
      gl.lastSeen = gL, gl.lastSaw = gJ.itemsViewed, gl.lastOf = gx, gl.lastPos = gJ.bestPos;
      if (gl.bestPos == null || gJ.bestPos != null && gJ.bestPos < gl.bestPos) gl.bestPos = gJ.bestPos;
      if (gc > 0 && gl.days[gl.days.length - 1] !== gO) gl.days.push(gO);
      if (gl.days.length > 120) gl.days = gl.days.slice(-120);
      gz[gX] = gl;
    }
    g.set(J.storyStats, gz);
  }
  function Yj() {
    const gq = g.get(J.storyStats, {}), gx = gL => (gL.days || []).length, gz = gL => gL.likes || 0;
    return Object.values(gq).sort((gL, gO) => gx(gO) - gx(gL) || gz(gO) - gz(gL) || gO.slides - gL.slides || gO.lastSeen - gL.lastSeen);
  }
  let Yy = false;
  async function YH(gq) {
    if (Yy) return null;
    Yy = true;
    try {
      const gx = k.getUserId(), gz = await k.fetchUserPosts(gx, 12).catch(() => []), gL = new Map, gO = new Map, gX = new Map;
      for (let gl = 0; gl < gz.length; gl++) {
        if (gq) gq(gl + 1, gz.length);
        const gc = gz[gl].id;
        if (!gc) continue;
        try {
          const gS = await k.fetchPostLikers(gc);
          gS.forEach(gC => {
            gL.set(gC.pk, (gL.get(gC.pk) || 0) + 1), gX.set(gC.pk, gC);
          });
        } catch (gC) {
          if (gC && gC.kind === "rate") break;
        }
        await new Promise(gU => setTimeout(gU, 350));
        try {
          const gU = new Set, gj = await k.fetchPostComments(gc);
          gj.forEach(gy => {
            if (gU.has(gy.pk)) return;
            gU.add(gy.pk), gO.set(gy.pk, (gO.get(gy.pk) || 0) + 1), gX.set(gy.pk, gy);
          });
        } catch (gy) {
          if (gy && gy.kind === "rate") break;
        }
        await new Promise(gH => setTimeout(gH, 350));
      }
      const gJ = gH => Array.from(gH.entries()).map(gR => ({
        user: gX.get(gR[0]),
        n: gR[1]
      })).filter(gR => gR.user && gR.user.pk !== O).sort((gR, gh) => gh.n - gR.n).slice(0, 20), gF = {
        likers: gJ(gL),
        commenters: gJ(gO),
        posts: gz.length,
        ts: Date.now()
      };
      return g.set(J.topInteractions, gF), gF;
    } finally {
      Yy = false;
    }
  }
  function YR() {
    if (U) clearTimeout(U);
    const gq = Math.random() * 6e4, gx = Date.now() + Math.max(15, F.intervalMin) * 6e4 + gq, gz = Math.max(1e3, gx - Date.now());
    U = setTimeout(() => YL(false), gz), YK(gx);
  }
  function Yh() {
    const gq = Number(g.get(J.lastAttempt, g.get(J.lastCheck, 0))) || 0, gx = Date.now() - gq >= Math.max(15, F.intervalMin) * 6e4;
    if (gx) {
      YL(false);
      return;
    }
    if (v()) Yz().catch(() => {});
    YR();
  }
  function YK(gq) {
    if (!a) return;
    const gx = new Date(gq), gz = String(gx.getHours()).padStart(2, "0"), gL = String(gx.getMinutes()).padStart(2, "0");
    a.textContent = Y("next_review", gz + ":" + gL);
  }
  function Yr() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M5 10a7 7 0 0 1 14 0v9.4a.6.6 0 0 1-.95.49L16 18.2l-1.6 1.3a.6.6 0 0 1-.76 0L12 18.4l-1.64 1.1a.6.6 0 0 1-.76 0L8 18.2l-2.05 1.19A.6.6 0 0 1 5 18.9Z"/><ellipse cx="9.4" cy="11.2" rx="1.25" ry="1.6" fill="#2b1740"/><ellipse cx="14.6" cy="11.2" rx="1.25" ry="1.6" fill="#2b1740"/></svg>';
  }
  function YQ() {
    const gq = "M15.5 3h-3.1v12.3c0 1.4-1.15 2.5-2.55 2.5s-2.55-1.1-2.55-2.5 1.15-2.5 2.55-2.5c.28 0 .55.05.8.13V9.9a5.6 5.6 0 1 0 4.75 5.53V9.77c1.2.9 2.7 1.43 4.3 1.43V8.15c-2.1-.1-3.85-1.85-4.2-3.9Z";
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#000"/><path d="' + gq + '" fill="#25F4EE" transform="translate(-.6,-.35)"/><path d="' + gq + '" fill="#FE2C55" transform="translate(.6,.35)"/><path d="' + gq + '" fill="#fff"/></svg>';
  }
  function YZ() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>';
  }
  function Yi(gq) {
    gq.style.animation = "none", void gq.offsetWidth, gq.style.animation = "";
  }
  async function Yf(gq, gx, gz) {
    const gL = String(gq || "").trim();
    if (!gL) {
      gz.textContent = Y("unlock_enter_key");
      return;
    }
    gx.disabled = true, gz.textContent = Y("unlock_checking");
    try {
      const gO = await chrome.runtime.sendMessage({
        type: "verifyLicense",
        key: gL,
        accountId: O
      });
      gO && gO.valid ? (m.classList.remove("ghd-locked"), G(Y("unlock_active"), "ok"), 
      gt(), YL(true)) : gz.textContent = gO && gO.error === "bound" ? Y("unlock_bound") : gO && gO.error === "expired" ? Y("unlock_expired") : Y("unlock_invalid");
    } catch (gX) {
      gz.textContent = Y("unlock_network");
    } finally {
      gx.disabled = false;
    }
  }
  function Ys() {
    if (!m || !p) return;
    m.classList.add("ghd-locked"), p.innerHTML = "";
    const gq = document.createElement("section");
    gq.className = "ghd-unlock";
    const gx = document.createElement("h2");
    gx.textContent = Y("unlock_title");
    const gz = document.createElement("p");
    gz.textContent = Y("unlock_copy");
    const gL = document.createElement("a");
    gL.className = "ghd-unlock-buy", gL.href = x.buyUrl, gL.target = "_blank", gL.rel = "noopener", 
    gL.textContent = Y("unlock_buy");
    const gO = document.createElement("label");
    gO.className = "ghd-unlock-label", gO.textContent = Y("unlock_label");
    const gX = document.createElement("div");
    gX.className = "ghd-unlock-row";
    const gJ = document.createElement("input");
    gJ.className = "ghd-unlock-input", gJ.placeholder = "GHST-XXXX-XXXX-XXXX-XXXX", 
    gJ.autocomplete = "off", gJ.spellcheck = false;
    const gF = document.createElement("button");
    gF.type = "button", gF.className = "ghd-unlock-activate", gF.textContent = Y("unlock_activate");
    const gl = document.createElement("div");
    gl.className = "ghd-unlock-error";
    const gc = () => Yf(gJ.value, gF, gl);
    gF.addEventListener("click", gc), gJ.addEventListener("keydown", gS => {
      gS.key === "Enter" && (gS.preventDefault(), gc());
    }), gX.appendChild(gJ), gX.appendChild(gF), gq.append(gx, gz, gL, gO, gX, gl), p.appendChild(gq);
    if (A) A.textContent = Y("unlock_activate");
  }
  function ghdTheme() {
    try {
      const v = g.get(J.light, null);
      const on = v === null ? window.matchMedia("(prefers-color-scheme: light)").matches : !!v;
      if (m) m.classList.toggle("ghd-light", on);
      if (n) n.classList.toggle("ghd-light", on);
      return on;
    } catch (e) {
      return false;
    }
  }
  function YM() {
    n = document.createElement("div"), n.id = "ghd-backdrop", n.addEventListener("click", () => {
      if (m.classList.contains("ghd-big")) Yo();
    }), document.body.appendChild(n), V = document.createElement("button"), V.id = "ghd-fab", 
    V.title = "Ghoosted", V.innerHTML = Yr() + '<span id="ghd-badge">0</span>', V.addEventListener("click", () => {
      m.style.display === "flex" ? Yu() : Ye();
    }), document.body.appendChild(V), D = V.querySelector("#ghd-badge"), m = document.createElement("div");
    // Trozos opcionales de la plantilla. En Plus se quedan vacios y los
    // botones no llegan a existir; en Pro se rellenan justo aqui debajo.
    let ghdTabLive = '', ghdTabHist = '', ghdBtnMovil = '';
//#plus-off pestanas de espectadores de historias y boton del movil
    ghdTabLive = '<button class="ghd-tab ghd-pro-tab" data-tab="live">' + Y("tab_live") + ' <span class="ghd-lock">◆</span></button>';
    ghdTabHist = '<button class="ghd-tab ghd-pro-tab" data-tab="history">' + Y("tab_history") + ' <span class="ghd-lock">◆</span></button>';
    ghdBtnMovil = '<button class="ghd-reset ghd-mobile-btn" id="ghd-mobile">' + Y("settings_connect_mobile") + '</button>';
//#plus-on
    m.id = "ghd-panel", m.innerHTML = '<div class="ghd-head"><div class="ghd-logo">' + Yr() + '</div><div class="ghd-title">Ghoosted<small>' + Y("ui_subtitle") + '</small></div><button class="ghd-exp" title="' + Y("big_mode") + '">⤢</button><button class="ghd-x" title="' + Y("close") + '">×</button></div><div class="ghd-chips"><div class="ghd-chip"><b id="ghd-c-foll">–</b><span>' + Y("chip_followers") + '</span></div><div class="ghd-chip"><b id="ghd-c-fing">–</b><span>' + Y("chip_following") + '</span></div><div class="ghd-chip warn"><b id="ghd-c-nb">–</b><span>' + Y("chip_notback") + '</span></div></div><div class="ghd-tabs"><button class="ghd-tab active" data-tab="unfollow">' + Y("tab_unfollow") + ' <span class="cnt" id="ghd-t-unf">0</span></button><button class="ghd-tab" data-tab="new">' + Y("tab_new") + ' <span class="cnt" id="ghd-t-new">0</span></button><button class="ghd-tab" data-tab="notback">' + Y("tab_notback") + ' <span class="cnt" id="ghd-t-nb">0</span></button>' + ghdTabLive + '<button class="ghd-tab" data-tab="activity">' + Y("tab_activity") + ' <span class="cnt" id="ghd-t-act">0</span></button>' + ghdTabHist + '</div><div class="ghd-list" id="ghd-list"></div><div class="ghd-next" id="ghd-next"></div><div class="ghd-settings" id="ghd-settings"><div class="ghd-set-group"><div class="ghd-set-h">' + Y("settings") + '</div><div class="ghd-set-row ghd-lang-row"><span class="ghd-set-label">' + Y("settings_language") + '</span><div class="ghd-lang-wrap" id="ghd-lang-wrap"><button type="button" class="ghd-lang-btn" id="ghd-lang-btn"><span id="ghd-lang-cur">Auto</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="ghd-lang-menu" id="ghd-lang-menu"></div></div></div><div class="ghd-set-row"><span class="ghd-set-label">' + Y("settings_interval") + '</span><span class="ghd-num"><input type="number" id="ghd-int" min="15" max="180"><i>' + Y("unit_min") + '</i></span></div><label class="ghd-set-row"><span class="ghd-set-label">' + Y("settings_notify") + '</span><span class="ghd-switch"><input type="checkbox" id="ghd-notif"><i></i></span></label><label class="ghd-set-row"><span class="ghd-set-label">' + Y("settings_light") + '</span><span class="ghd-switch"><input type="checkbox" id="ghd-lightsw"><i></i></span></label></div><div class="ghd-set-group"><div class="ghd-set-h">' + Y("settings_data") + '</div>' + ghdBtnMovil + '<button class="ghd-reset" id="ghd-export">' + Y("settings_export") + '</button><button class="ghd-reset" id="ghd-reset">' + Y("settings_reset") + '</button></div><div class="ghd-set-danger"><button type="button" class="ghd-sub" id="ghd-clear-photos">' + Y("settings_clear_photos") + '</button><button type="button" class="ghd-sub" id="ghd-clear">' + Y("settings_clear") + '</button></div></div><div class="ghd-foot"><div class="ghd-status" id="ghd-status">' + Y("status_starting") + '</div><button class="ghd-gear" id="ghd-gear" title="' + Y("settings") + '">⚙</button><button class="ghd-btn" id="ghd-check">' + Y("btn_check") + "</button></div>", 
    document.body.appendChild(m), function() {
      const sw = m.querySelector("#ghd-lightsw");
      if (!sw) return;
      sw.checked = ghdTheme();
      sw.addEventListener("change", function() {
        g.set(J.light, sw.checked);
        ghdTheme();
      });
    }(), m.querySelector(".ghd-x").addEventListener("click", Yu), m.querySelector(".ghd-exp").addEventListener("click", Yo), 
    e = m.querySelector("#ghd-c-foll"), u = m.querySelector("#ghd-c-fing"), o = m.querySelector("#ghd-c-nb");
    const gq = m.querySelectorAll(".ghd-chips .ghd-chip");
    gq[0] && (gq[0].classList.add("clickable"), gq[0].addEventListener("click", () => tE("followers", {
      cached: g.get(J.followers, {
        users: []
      }).users || [],
      subtitle: Y("chip_followers")
    })));
    gq[1] && (gq[1].classList.add("clickable"), gq[1].addEventListener("click", () => tE("following", {
      cached: g.get(J.following, {
        users: []
      }).users || [],
      subtitle: Y("chip_following")
    })));
    P = m.querySelector("#ghd-status"), a = m.querySelector("#ghd-next"), p = m.querySelector("#ghd-list"), 
    A = m.querySelector("#ghd-check"), A.addEventListener("click", YE), E = m.querySelectorAll(".ghd-tab"), 
    function() {
      const tb = m.querySelector(".ghd-tabs");
      if (!tb) return;
      tb.addEventListener("wheel", function(ev) {
        if (tb.scrollWidth <= tb.clientWidth) return;
        const d = Math.abs(ev.deltaY) > Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
        if (!d) return;
        ev.preventDefault();
        tb.scrollLeft += d;
      }, {
        passive: false
      });
      const mark = function() {
        const max = tb.scrollWidth - tb.clientWidth;
        tb.classList.toggle("has-left", tb.scrollLeft > 4);
        tb.classList.toggle("has-right", tb.scrollLeft < max - 4);
      };
      tb.addEventListener("scroll", mark);
      setTimeout(mark, 0);
      m.querySelectorAll(".ghd-tab").forEach(function(b) {
        b.addEventListener("click", function() {
          try {
            b.scrollIntoView({
              inline: "nearest",
              block: "nearest",
              behavior: "smooth"
            });
          } catch (e) {}
          setTimeout(mark, 300);
        });
      });
    }(), E.forEach(gS => gS.addEventListener("click", () => {
      t9(), tP();
      var gSet = m.querySelector("#ghd-settings");
      if (gSet) gSet.classList.remove("show");
      j = gS.dataset.tab, nbQ = "", YN(), Yp(), g5();
//#plus-off espectadores de historias
      if (j === "history") YS();
//#plus-on
    }));
    const gx = m.querySelector("#ghd-gear"), gz = m.querySelector("#ghd-settings");
    gx.addEventListener("click", () => gz.classList.toggle("show"));
    const gL = m.querySelector("#ghd-lang-wrap"), gO = m.querySelector("#ghd-lang-btn"), gX = m.querySelector("#ghd-lang-cur"), gJ = m.querySelector("#ghd-lang-menu");
    gJ.innerHTML = GhostedI18n.LOCALES.map(gS => '<button type="button" class="ghd-lang-item" data-code="' + gS.code + '">' + gS.name + "</button>").join(""), 
    GhostedI18n.getLocale().then(gS => {
      const gC = GhostedI18n.LOCALES.find(gU => gU.code === gS) || GhostedI18n.LOCALES[0];
      gX.textContent = gC.name, gJ.querySelectorAll(".ghd-lang-item").forEach(gU => gU.classList.toggle("active", gU.dataset.code === gS));
    }), gO.addEventListener("click", gS => {
      gS.stopPropagation(), gL.classList.toggle("open");
    }), gJ.querySelectorAll(".ghd-lang-item").forEach(gS => {
      gS.addEventListener("click", async () => {
        gL.classList.remove("open"), await GhostedI18n.setLocale(gS.dataset.code), location.reload();
      });
    }), document.addEventListener("click", gS => {
      if (!gL.contains(gS.target)) gL.classList.remove("open");
    });
    const gF = m.querySelector("#ghd-int"), gl = m.querySelector("#ghd-notif");
    gF.value = F.intervalMin, gl.checked = F.notify, gF.addEventListener("change", () => {
      let gS = parseInt(gF.value, 10);
      if (isNaN(gS)) gS = 30;
      gS = Math.min(180, Math.max(15, gS)), gF.value = gS, F.intervalMin = gS, g.set(J.settings, F), 
      YR();
    }), gl.addEventListener("change", () => {
      F.notify = gl.checked, g.set(J.settings, F);
    }), m.querySelector("#ghd-reset").addEventListener("click", () => {
      confirm(Y("confirm_reset")) && (g.del(J.followers), g.del(J.following), g.del(J.lastCheck), 
      g.del(J.lastAttempt), g.del(J.lastFollowingTs), g.del(J.profileSnapshots), g.del(J.profileCursor), 
      gt(), YL(true));
    }), m.querySelector("#ghd-export").addEventListener("click", gg);
//#plus-off espejo del movil: el boton no existe en Plus
    const gc = m.querySelector("#ghd-mobile");
    if (gc) gc.addEventListener("click", YA);
//#plus-on
    m.querySelector("#ghd-clear").addEventListener("click", () => {
      confirm(Y("confirm_clear")) && (g.del(J.events), g.del(J.storyStats), g.del(J.storyLog), 
      g.del(J.activity), gt());
    }), m.querySelector("#ghd-clear-photos").addEventListener("click", () => {
      const gS = g.get(J.photoArchive, {}), gC = Object.keys(gS).reduce((gU, gj) => gU + (gS[gj] || []).length, 0);
      if (!gC) {
        G(Y("status_no_photos"), "ok");
        return;
      }
      confirm(Y("confirm_clear_photos", String(gC))) && (g.del(J.photoArchive), G(Y("status_photos_cleared"), "ok"));
    });
  }
  const Yd = new Map;
  function Yw(gq, gx) {
    return new Promise(gz => {
      try {
        const gL = new Image;
        gL.onload = () => {
          try {
            const gO = document.createElement("canvas");
            gO.width = gx, gO.height = gx;
            const gX = gO.getContext("2d"), gJ = Math.min(gL.naturalWidth, gL.naturalHeight) || gx, gF = (gL.naturalWidth - gJ) / 2, gl = (gL.naturalHeight - gJ) / 2;
            gX.drawImage(gL, gF, gl, gJ, gJ, 0, 0, gx, gx), gz(gO.toDataURL("image/jpeg", .55));
          } catch (gc) {
            gz(null);
          }
        }, gL.onerror = () => gz(null), gL.src = gq;
      } catch (gO) {
        gz(null);
      }
    });
  }
  async function Yb(gq, gx) {
    if (!gq) return null;
    const gz = gx || 108;
    let gL = null;
    try {
      const gO = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gq
      });
      gL = gO && gO.dataUrl;
    } catch (gX) {
      return null;
    }
    if (!gL) return null;
    return new Promise(gJ => {
      try {
        const gF = new Image;
        gF.onload = () => {
          try {
            const gl = gF.naturalHeight && gF.naturalWidth ? gF.naturalHeight / gF.naturalWidth : 1.78, gc = Math.round(gz * Math.min(2, Math.max(1, gl))), gS = document.createElement("canvas");
            gS.width = gz, gS.height = gc, gS.getContext("2d").drawImage(gF, 0, 0, gz, gc), 
            gJ(gS.toDataURL("image/jpeg", .5));
          } catch (gC) {
            gJ(null);
          }
        }, gF.onerror = () => gJ(null), gF.src = gL;
      } catch (gl) {
        gJ(null);
      }
    });
  }
  async function Ym(gq, gx) {
    if (!gq || !gx) return null;
    if (Yd.has(gq)) return Yd.get(gq);
    let gz = null;
    try {
      const gL = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gx
      });
      if (gL && gL.dataUrl) gz = await Yw(gL.dataUrl, 48);
    } catch (gO) {}
    return Yd.set(gq, gz), gz;
  }
  async function YV(gq, gx) {
    let gz = 0;
    for (const gL of gq) {
      if (gz >= gx) break;
      if (!gL.pk || !gL.pic) continue;
      const gO = await Ym(gL.pk, gL.pic);
      gO && (gL.picData = gO, delete gL.pic), gz++;
    }
    return gq;
  }
  async function Yn() {
    const gq = g.get(J.followers, {
      users: []
    }).users || [], gx = g.get(J.following, {
      users: []
    }).users || [], gz = new Set(gq.map(gj => gj.pk)), gL = gx.filter(gj => !gz.has(gj.pk)), gO = g.get(J.events, []), gX = g.get(J.activity, []), gJ = g.get(J.counts, null), gF = gJ && Number.isFinite(gJ.followers) && Number.isFinite(gJ.following) ? gJ : null, gl = gj => ({
      pk: gj.pk,
      username: gj.username,
      full_name: gj.full_name,
      pic: gj.pic,
      ts: gj.ts
    }), gc = gj => ({
      pk: gj.pk,
      username: gj.username,
      full_name: gj.full_name,
      pic: gj.pic
    }), gS = gj => ({
      pk: gj.pk,
      type: gj.type,
      username: gj.username,
      full_name: gj.full_name,
      pic: gj.pic,
      ts: gj.ts,
      target: gj.target ? {
        username: gj.target.username
      } : void 0
    }), gC = {
      unfollow: gO.filter(gj => gj.type === "unfollow").slice(0, 120).map(gl),
      new: gO.filter(gj => gj.type === "new").slice(0, 120).map(gl),
      notback: gL.slice(0, 200).map(gc),
      activity: gX.slice(0, 120).map(gS)
    };
    await YV(gC.activity, 12), await YV(gC.unfollow, 8), await YV(gC.new, 8), await YV(gC.notback, 8);
    const gU = {
      v: 1,
      ts: Date.now(),
      counts: {
        followers: gF ? gF.followers : gq.length,
        following: gF ? gF.following : gx.length,
        notback: gx.length ? gL.length : 0
      },
      tabs: gC
    };
    return YD(gU);
  }
  function YD(gq) {
    const gx = 28e4;
    if (JSON.stringify(gq).length <= gx) return gq;
    const gz = [ "notback", "activity", "new", "unfollow" ];
    for (let gL = 0; gL < gz.length && JSON.stringify(gq).length > gx; gL++) (gq.tabs[gz[gL]] || []).forEach(gO => {
      delete gO.picData, delete gO.pic;
    });
    while (JSON.stringify(gq).length > gx) {
      let gO = false;
      gz.forEach(gX => {
        const gJ = gq.tabs[gX];
        gJ && gJ.length > 15 && (gJ.length = Math.floor(gJ.length * .8), gO = true);
      });
      if (!gO) break;
    }
    return gq;
  }
  let YP = null;
  function Ya() {
    if (!self.GhostedMobile) return;
    clearTimeout(YP), YP = setTimeout(async () => {
      try {
        const gq = await GhostedMobile.getPair();
        if (!gq) return;
        await GhostedMobile.push(await Yn());
      } catch (gx) {}
    }, 1500);
  }
//#plus-off espejo del movil: ventana de emparejamiento
  async function YA() {
    if (!self.GhostedMobile || !self.GhostedQR) return;
    const gq = document.getElementById("ghd-mobile-ov");
    if (gq) gq.remove();
    const gx = await GhostedMobile.createPair(), gz = GhostedMobile.pairUrl(gx), gL = GhostedQR.svg(gz, {
      scale: 6,
      margin: 3,
      dark: "#0a0a0f",
      light: "#ffffff"
    });
    Yn().then(gJ => GhostedMobile.push(gJ)).catch(() => {});
    const gO = document.createElement("div");
    gO.className = "ghd-mobile-ov", gO.id = "ghd-mobile-ov", gO.innerHTML = '<div class="ghd-mobile-card"><button class="ghd-mobile-x" aria-label="' + Y("close") + '">&times;</button><div class="ghd-mobile-h">' + Y("mobile_title") + '</div><div class="ghd-mobile-qr">' + gL + '</div><div class="ghd-mobile-sub">' + Y("mobile_body") + '</div><a class="ghd-mobile-link" href="' + gz + '" target="_blank" rel="noopener">' + GhostedMobile.RELAY.replace(/^https?:\/\//, "") + '/m</a><button class="ghd-mobile-unpair" id="ghd-mobile-unpair">' + Y("mobile_unpair") + "</button></div>", 
    document.body.appendChild(gO);
    const gX = () => gO.remove();
    gO.querySelector(".ghd-mobile-x").addEventListener("click", gX), gO.addEventListener("click", gJ => {
      if (gJ.target === gO) gX();
    }), gO.querySelector("#ghd-mobile-unpair").addEventListener("click", async () => {
      await GhostedMobile.unpair(), gX();
    });
  }
//#plus-on
  function YE() {
    if (!v()) {
      const gq = m.querySelector(".ghd-unlock-input");
      if (gq) gq.focus();
      return;
    }
//#plus-off espectadores de historias
    if (j === "history") Yl(true); else
//#plus-on
    YL(true);
  }
  function Yp() {
    if (!A) return;
    if (!v()) {
      A.textContent = Y("unlock_activate");
      return;
    }
    A.textContent = j === "history" ? Y("btn_capture") : Y("btn_check");
  }
  function Ye() {
    m.style.display = "flex", Yi(m);
    if (m.classList.contains("ghd-big")) n.classList.add("show");
    g.set(J.seen, Date.now()), gY();
  }
  function Yu() {
    t9(), tP(), n.classList.remove("show"), m.classList.add("ghd-out"), setTimeout(() => {
      m.style.display = "none", m.classList.remove("ghd-out", "ghd-big");
    }, 180);
  }
  function Yo() {
    const gq = m.classList.toggle("ghd-big");
    gq ? n.classList.add("show") : n.classList.remove("show"), Yi(m), g5();
  }
  function YN() {
    E.forEach(gq => gq.classList.toggle("active", gq.dataset.tab === j));
  }
  function Yv(gq) {
    if (!gq) return false;
    const gx = Number((g.get(J.storyWatch, {}) || {})[gq] || 0);
    return gx > 0 && Date.now() - gx < 864e5;
  }
  function YTfallback(gq) {
    try {
      const arr = tl(gq && gq.pk) || [];
      for (let i = arr.length - 1; i >= 0; i--) {
        const e2 = arr[i];
        if (e2 && e2.kind === "avatar" && e2.dataUrl) return e2.dataUrl;
      }
      for (let i = arr.length - 1; i >= 0; i--) {
        const e3 = arr[i];
        if (e3 && e3.dataUrl) return e3.dataUrl;
      }
    } catch (e) {}
    return "";
  }
  const ghdFaceQ = [], ghdFaceSeen = new Set;
  let ghdFaceOn = false, ghdFaceLeft = 300;
  function ghdFaceWant(gq, gx) {
    if (!gq || !gx || ghdFaceLeft <= 0) return;
    if (ghdFaceSeen.has(gq)) {
      const gz = ghdFaceQ.find(gL => gL.pk === gq);
      if (gz) gz.av = gx;
      return;
    }
    ghdFaceSeen.add(gq), ghdFaceQ.push({
      pk: gq,
      av: gx
    });
    if (!ghdFaceOn) ghdFaceOn = true, setTimeout(ghdFaceRun, 2e3);
  }
  async function ghdFaceRun() {
    while (ghdFaceQ.length && ghdFaceLeft > 0) {
      const gq = ghdFaceQ.shift();
      try {
        const gx = await k.fetchUserProfile(gq.pk);
        const gz = gx && (gx.picHd || gx.pic);
        if (gz) {
          const gL = await tc(gq.pk, gz, "avatar", "@" + (gx.username || ""));
          const gO = gL && gL.dataUrl;
          if (gO && gq.av && gq.av.isConnected) {
            gq.av.textContent = "";
            const gX = document.createElement("img");
            gX.referrerPolicy = "no-referrer", gX.src = gO, gq.av.appendChild(gX);
          }
        }
      } catch (gJ) {
        if (gJ && gJ.kind === "rate") {
          ghdFaceQ.unshift(gq);
          const gF = k.rateLeftMs && k.rateLeftMs() || 3e5;
          await new Promise(gl => setTimeout(gl, gF + 5e3));
          continue;
        }
      }
      ghdFaceLeft--;
      await new Promise(gl => setTimeout(gl, 2e3));
    }
    ghdFaceOn = false;
  }
  function YT(gq, YTnoRec) {
    const gx = document.createElement("div");
    gx.className = "ghd-av" + (gq && gq.pk && Yv(gq.pk) ? " has-story" : "");
    const YTini = function() {
      gx.textContent = (gq.username || "?").slice(0, 1).toUpperCase();
      if (gq && gq.pk && !YTnoRec) ghdFaceWant(String(gq.pk), gx);
    };
    const YTimg = function(src, allowAlt) {
      const im = document.createElement("img");
      im.loading = "lazy", im.referrerPolicy = "no-referrer", im.onerror = function() {
        if (allowAlt && !im._bg && /cdninstagram|fbcdn/.test(String(src))) {
          im._bg = true;
          try {
            chrome.runtime.sendMessage({
              type: "fetchImage",
              url: src
            }, function(r) {
              if (r && r.dataUrl) im.src = r.dataUrl; else im.onerror();
            });
            return;
          } catch (e0) {}
        }
        const alt = allowAlt ? YTfallback(gq) : "";
        if (alt && im.src !== alt) {
          im.src = alt;
          return;
        }
        im.remove(), YTini();
      }, im.src = src, gx.appendChild(im);
    };
    if (gq.pic) YTimg(gq.pic, true); else {
      const alt2 = YTfallback(gq);
      if (alt2) YTimg(alt2, false); else YTini();
    }
    return gx;
  }
  function YB(gq, gx, gz) {
    gx = gx || {};
    const gL = document.createElement("a");
    gL.className = "ghd-row";
    if (typeof gz === "number") gL.style.animationDelay = Math.min(gz, 18) * 24 + "ms";
    gL.href = "https://www.instagram.com/" + gq.username + "/", gL.target = "_blank", 
    gL.rel = "noopener";
    if (gx.checkbox) {
      gL.classList.add("ghd-row-check");
      if (gx.selected) gL.classList.add("ghd-sel");
      const gl = document.createElement("span");
      gl.className = "ghd-check", gl.textContent = gx.selected ? "✓" : "", gL.appendChild(gl);
    }
    gL.appendChild(YT(gq));
    const gO = document.createElement("div");
    gO.className = "ghd-info";
    const gX = document.createElement("div");
    gX.className = "ghd-name", gX.appendChild(document.createTextNode(gq.full_name || gq.username));
    if (gq.is_verified) {
      const gc = document.createElement("span");
      gc.className = "ghd-ver", gc.textContent = "✓", gX.appendChild(gc);
    }
    if (gx.rank) {
      const gS = document.createElement("span");
      gS.className = "ghd-rank", gS.textContent = "#" + gx.rank, gX.appendChild(gS);
    }
    const gJ = document.createElement("div");
    gJ.className = "ghd-user", gJ.textContent = "@" + gq.username + (gq.is_private ? " · " + Y("private") : ""), 
    gO.appendChild(gX), gO.appendChild(gJ);
    if (gx.sub) {
      const gC = document.createElement("div");
      gC.className = "ghd-sub2", gC.textContent = gx.sub, gO.appendChild(gC);
    }
    gL.appendChild(gO);
    const gF = document.createElement("div");
    gF.className = "ghd-right";
    if (gx.time) {
      const gU = document.createElement("div");
      gU.className = "ghd-time", gU.dataset.ts = String(gx.time), gU.textContent = B(gx.time), 
      gF.appendChild(gU);
    }
    if (gx.tag) {
      const gj = document.createElement("span");
      gj.className = "ghd-tag " + (gx.tagClass || "gray"), gj.textContent = gx.tag, gF.appendChild(gj);
    }
    return gL.appendChild(gF), gx.onClick && (gL.classList.add("ghd-row-click"), gL.addEventListener("click", gy => {
      gy.preventDefault(), gy.stopPropagation(), gx.onClick();
    })), gL;
  }
  function YG(gq) {
    const gx = document.createElement("div");
    return gx.className = "ghd-empty", gx.innerHTML = gq, gx;
  }
  function YI() {
    const gq = document.createElement("div");
    return gq.className = "ghd-upsell", gq.innerHTML = '<div class="ghd-upsell-badge">◆ ' + Y("pro") + "</div><h3>" + Y("pro_title") + "</h3><p>" + Y("pro_desc") + '</p><a class="ghd-upsell-btn" href="' + x.buyUrl + '" target="_blank" rel="noopener">' + Y("pro_unlock") + '</a><div class="ghd-upsell-hint">' + Y("pro_havekey") + "</div>", 
    gq;
  }
  function YW(gq) {
//#plus-off solicitudes: Plus no aprueba, no hay que narrarlo
    if (gq.type === "req_ok") return Y("req_approved", "@" + (gq.username || "?"));
//#plus-on
    if (gq.type === "pair") return Y(gq.follows ? "activity_pair_follow" : "activity_pair_unfollow", [ "@" + (gq.pairA && gq.pairA.username || "?"), "@" + (gq.pairB && gq.pairB.username || "?") ]);
    if (gq.type === "story") return Y("activity_story");
    if (gq.type === "link") return Y("activity_link");
    if (gq.type === "followers_up") {
      if (gq.newFollowers && gq.newFollowers.length === 1) return Y("activity_new_follower", "@" + (gq.newFollowers[0].username || "?"));
      return Y("activity_followers_up", String(gq.delta || 1));
    }
    if (gq.type === "followers_down") {
      if (gq.lostFollowers && gq.lostFollowers.length === 1) return Y("activity_lost_follower", "@" + (gq.lostFollowers[0].username || "?"));
      return Y("activity_followers_down", String(gq.delta || 1));
    }
    if (gq.type === "follow_add") return Y("activity_follow_add", "@" + (gq.target && gq.target.username || "?"));
    if (gq.type === "follow_rem") return Y("activity_follow_rem", "@" + (gq.target && gq.target.username || "?"));
    if (gq.type === "photo") return Y("activity_changed_photo");
    if (gq.type === "bio") return Y("activity_changed_bio");
    if (gq.type === "name") return Y("activity_changed_name") + (gq.before ? " · " + gq.before + " → " + gq.after : "");
    if (gq.type === "username") return Y("activity_changed_username") + (gq.before ? " · @" + gq.before + " → @" + gq.after : "");
    return Y("activity_changed_profile");
  }
  function t0(gq) {
    return gq === "photo" ? "📷" : gq === "story" ? "📖" : gq === "follow_add" ? "➕" : gq === "follow_rem" ? "➖" : gq === "bio" ? "✏️" : gq === "name" ? "✏️" : gq === "username" ? "✏️" : gq === "link" ? "🔗" : gq === "followers_up" ? "📈" : gq === "followers_down" ? "📉" : "•";
  }
  function t1(gq) {
    try {
      return new Date(gq).toLocaleDateString(GhostedI18n.locale || "es", {
        day: "numeric",
        month: "short"
      });
    } catch (gx) {
      return T(gq);
    }
  }
//#plus-off punto de mira: alta, baja y ajustes de perfiles vigilados
  async function t2(gq) {
    const gx = await g.getFresh(J.watchedProfiles, []), gO = gx.find(gL => gL.pk === gq), gz = await g.setAwait(J.watchedProfiles, gx.filter(gL => gL.pk !== gq));
    gt();
    if (!gz) {
      G(Y("status_save_failed"), "alert"), ghdToast(Y("status_save_failed"), "alert");
      return;
    }
    if (gO) ghdToast(Y("toast_unwatched", "@" + gO.username));
  }
  async function t3(gq, gx) {
    const gz = String(gq || "").replace(/^@+/, "").trim();
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(gz)) {
      G(Y("status_watch_invalid"), "alert"), ghdToast(Y("status_watch_invalid"), "alert");
      return;
    }
    if (gx) gx.disabled = true;
    G(Y("status_watch_adding"), "work");
    try {
      const gL = await k.fetchUserByUsername(gz);
      Q = gL, g5(), G(Y("status_watch_found", "@" + gL.username), "ok");
    } catch (gO) {
      console.warn("[Ghoosted] unable to find watched profile", gO);
      const gK = gO && gO.kind;
      const gM2 = (gK === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : "") || (gK === "http" ? Y("status_watch_notfound") : Y("status_error"));
      G(gM2, "alert"), ghdToast(gM2, "alert");
    } finally {
      if (gx) gx.disabled = false;
    }
  }
  async function t4(gq, gx, gz) {
    const gL = await g.getFresh(J.watchedProfiles, []), gO = gL.find(gJ => gJ.pk === gq);
    if (!gO) return;
    gO[gx] = gz;
    const gX = await g.setAwait(J.watchedProfiles, gL);
    if (gx === "watchFollowing" && !gz) {
      const gJ = g.get(J.spyFollowing, {});
      delete gJ[gq], g.set(J.spyFollowing, gJ);
    }
    g5();
    if (!gX) G(Y("status_save_failed"), "alert");
  }
//#plus-on
  function ghdToast(gq, gx) {
    if (!m) return;
    const gz = m.querySelector("#ghd-toast");
    if (gz) gz.remove();
    const gL = document.createElement("div");
    gL.id = "ghd-toast", gL.className = "ghd-toast" + (gx ? " " + gx : "");
    const gO = document.createElement("i");
    gO.className = "ghd-toast-ic", gO.textContent = gx === "alert" ? "!" : "✓";
    const gX = document.createElement("span");
    gX.textContent = gq;
    gL.append(gO, gX), m.appendChild(gL);
    setTimeout(() => {
      gL.classList.add("out"), setTimeout(() => {
        if (gL.parentNode) gL.remove();
      }, 230);
    }, 3e3);
  }
  function ghdFlash(gq) {
    if (!m) return;
    setTimeout(() => {
      const gx = m.querySelector('.ghd-watch-card[data-pk="' + gq + '"]');
      if (!gx) return;
      gx.classList.add("ghd-just");
      try {
        gx.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      } catch (gz) {}
      setTimeout(() => gx.classList.remove("ghd-just"), 1800);
    }, 50);
  }
//#plus-off punto de mira: alta de perfil vigilado
  async function t5(gq) {
    if (!gq || !gq.pk) return;
    const gx = await g.getFresh(J.watchedProfiles, []);
    let gz = true;
    !gx.some(gL => gL.pk === gq.pk) && (gx.unshift(Object.assign({
      watchStory: true,
      watchFollowing: true
    }, gq)), gz = await g.setAwait(J.watchedProfiles, gx.slice(0, 100)));
    g.set(J.watchCollapsed, false), Q = null, gt();
    if (!gz) {
      G(Y("status_save_failed"), "alert"), ghdToast(Y("status_save_failed"), "alert");
      return;
    }
    Y5(gq, true, Date.now());
    if (gq.pic) tc(gq.pk, gq.pic, "avatar", "@" + gq.username).catch(() => {});
    G(Y("status_watch_added", "@" + gq.username), "ok"), ghdToast(Y("toast_watching", "@" + gq.username)), 
    ghdFlash(gq.pk);
  }
//#plus-on
  function t6(gq) {
    if (!gq) return false;
    if (!gq.is_private) return true;
    if (gq.pk === O) return true;
    const gx = new Set((g.get(J.following, {
      users: []
    }).users || []).map(gz => gz.pk));
    return gx.has(gq.pk);
  }
//#plus-off solicitudes de seguimiento y parejas vigiladas: Plus no escribe ni rastrea a terceros
  let ghdReqList = null, ghdReqBusy = false, ghdReqErr = "";
  function ghdReqRule() {
    const gq = g.get(J.reqRule, "manual");
    return gq === "following" || gq === "all" ? gq : "manual";
  }
  function ghdReqIFollow() {
    const gq = g.get(J.following, {
      users: []
    }).users || [];
    return new Set(gq.map(gx => String(gx.pk)));
  }
  async function ghdReqLoad(gq) {
    if (ghdReqList && !gq) return ghdReqList;
    try {
      const gx = await k.pendingRequests();
      ghdReqErr = "", ghdReqList = gx.users || [];
    } catch (gz) {
      ghdReqErr = gz && gz.kind === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : Y("req_load_err");
      ghdReqList = ghdReqList || [];
    }
    return ghdReqList;
  }
  async function ghdReqRun(gq, gVer) {
    if (ghdReqBusy) return 0;
    ghdReqBusy = true;
    let gx = 0;
    try {
      if (gVer) ghdLoadShow(0, 0, "load_approving");
      const gz = await ghdReqLoad(true);
      if (!gz.length) return 0;
      const gL = gq === "all" ? null : ghdReqIFollow();
      const gO = gz.filter(gX => !gL || gL.has(String(gX.pk))).slice(0, 20);
      if (gVer) ghdLoadShow(0, gO.length, "load_approving");
      for (const gX of gO) {
        try {
          await k.approveRequest(gX.pk);
          gx++;
          ghdReqList = (ghdReqList || []).filter(gJ => String(gJ.pk) !== String(gX.pk));
          Yt({
            type: "req_ok",
            ts: Date.now(),
            pk: gX.pk,
            username: gX.username || "",
            full_name: gX.full_name || "",
            pic: gX.pic || "",
            key: "req:" + gX.pk
          });
        } catch (gF) {
          if (gF && (gF.kind === "rate" || gF.kind === "challenge")) break;
        }
        if (gVer) ghdLoadShow(gx, gO.length, "load_approving");
        await new Promise(gl => setTimeout(gl, 2500));
      }
    } finally {
      ghdReqBusy = false;
      if (gVer) ghdLoadHide();
    }
    if (gx) g5();
    return gx;
  }
  async function ghdReqOne(gq, gx, gz) {
    if (gz) gz.disabled = true;
    try {
      await k[gx ? "approveRequest" : "ignoreRequest"](gq.pk);
      ghdReqList = (ghdReqList || []).filter(gL => String(gL.pk) !== String(gq.pk));
      ghdToast(Y(gx ? "req_approved" : "req_ignored", "@" + (gq.username || "")));
      if (gx) Yt({
        type: "req_ok",
        ts: Date.now(),
        pk: gq.pk,
        username: gq.username || "",
        full_name: gq.full_name || "",
        pic: gq.pic || "",
        key: "req:" + gq.pk
      });
      g5();
    } catch (gL) {
      const gO = gL && gL.kind === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : Y("status_error");
      ghdToast(gO, "alert");
      if (gz) gz.disabled = false;
    }
  }
  function ghdReqBlock(gq) {
    const gx = document.createElement("section");
    gx.className = "ghd-req";
    const gPle = !!g.get(J.reqCollapsed, false);
    const gz = document.createElement("button");
    gz.type = "button", gz.className = "ghd-req-h" + (gPle ? " collapsed" : ""), gz.setAttribute("aria-expanded", gPle ? "false" : "true");
    const gTit = document.createElement("span");
    gTit.className = "ghd-fold-tx", gTit.textContent = Y("req_title") + (ghdReqList && ghdReqList.length ? " · " + ghdReqList.length : "");
    const gCar = document.createElement("span");
    gCar.className = "ghd-fold-car", gCar.textContent = "‹";
    gz.append(gTit, gCar), gz.title = Y("fold_hint"), gx.appendChild(gz);
    const gCuerpo = document.createElement("div");
    gCuerpo.className = "ghd-req-body" + (gPle ? " collapsed" : "");
    gz.addEventListener("click", () => {
      const gN = !gCuerpo.classList.contains("collapsed");
      gCuerpo.classList.toggle("collapsed", gN), gz.classList.toggle("collapsed", gN), 
      gz.setAttribute("aria-expanded", gN ? "false" : "true"), g.set(J.reqCollapsed, gN);
    });
    gx.appendChild(gCuerpo);
    const gL = document.createElement("div");
    gL.className = "ghd-req-rules";
    const gO = document.createElement("span");
    gO.className = "ghd-req-rl", gO.textContent = Y("req_rule_label"), gL.appendChild(gO);
    const gX = ghdReqRule();
    [ [ "manual", "req_rule_manual" ], [ "following", "req_rule_following" ], [ "all", "req_rule_all" ] ].forEach(gJ => {
      const gF = document.createElement("button");
      gF.type = "button", gF.className = "ghd-req-rule" + (gX === gJ[0] ? " on" : ""), 
      gF.textContent = Y(gJ[1]), gF.addEventListener("click", () => {
        // Pasar a automatico se acepta a conciencia. Solo se pregunta al
        // cambiar, no en cada repintado, asi que no da la lata.
        if (gJ[0] !== "manual" && ghdReqRule() !== gJ[0]) {
          const gAviso = Y("req_auto_warn") + (gJ[0] === "all" ? "\n\n" + Y("req_auto_warn_all") : "")
            + "\n\n" + Y("req_auto_warn_end");
          if (!confirm(gAviso)) return;
        }
        g.set(J.reqRule, gJ[0]);
        g5();
      }), gL.appendChild(gF);
    });
    gCuerpo.appendChild(gL);
    if (gX === "all") {
      const gl = document.createElement("div");
      gl.className = "ghd-req-warn", gl.textContent = Y("req_rule_all_warn"), gCuerpo.appendChild(gl);
    }
    if (gX !== "manual") {
      const gc = document.createElement("button");
      gc.type = "button", gc.className = "ghd-req-run", gc.textContent = ghdReqBusy ? Y("req_running") : Y("req_run"), 
      gc.disabled = ghdReqBusy, gc.addEventListener("click", async () => {
        // Aprobar en lote es, junto con dejar de seguir, lo que mas dispara el
        // detector de Instagram. Se avisa antes, no despues.
        if (!confirm(Y("req_confirm"))) return;
        gc.disabled = true, gc.textContent = Y("req_running");
        const gS = await ghdReqRun(gX, true);
        ghdToast(Y("req_done", String(gS)));
        g5();
      }), gCuerpo.appendChild(gc);
    }
    const gC = document.createElement("div");
    gC.className = "ghd-req-list";
    gCuerpo.appendChild(gC);
    const gU = () => {
      gC.innerHTML = "";
      if (ghdReqErr) {
        const gj = document.createElement("div");
        gj.className = "dos-note", gj.textContent = ghdReqErr, gC.appendChild(gj);
        return;
      }
      if (!ghdReqList) {
        const gy = document.createElement("div");
        gy.className = "dos-note", gy.textContent = Y("dos_loading"), gC.appendChild(gy);
        return;
      }
      if (!ghdReqList.length) {
        const gH = document.createElement("div");
        gH.className = "dos-note", gH.textContent = Y("req_none"), gC.appendChild(gH);
        return;
      }
      ghdReqList.slice(0, 30).forEach(gR => {
        const gh = document.createElement("div");
        gh.className = "ghd-req-row";
        gh.appendChild(YT(gR, true));
        const gK = document.createElement("div");
        gK.className = "ghd-req-info";
        const gr = document.createElement("b");
        gr.textContent = gR.full_name || gR.username || "";
        const gQ = document.createElement("span");
        gQ.textContent = "@" + (gR.username || "");
        gK.append(gr, gQ), gh.appendChild(gK);
        const gZ = document.createElement("button");
        gZ.type = "button", gZ.className = "ghd-req-yes", gZ.textContent = Y("req_approve"), 
        gZ.addEventListener("click", () => ghdReqOne(gR, true, gZ));
        const gi = document.createElement("button");
        gi.type = "button", gi.className = "ghd-req-no", gi.textContent = Y("req_ignore"), 
        gi.addEventListener("click", () => ghdReqOne(gR, false, gi));
        gh.append(gZ, gi), gC.appendChild(gh);
      });
    };
    gU();
    if (!ghdReqList) ghdReqLoad().then(() => {
      if (gC.isConnected) g5();
    });
    return gq.appendChild(gx), gq;
  }
  function ghdPairs() {
    const gq = g.get(J.pairWatch, []);
    return Array.isArray(gq) ? gq : [];
  }
  function ghdPairId(gq, gx) {
    return String(gq) + ">" + String(gx);
  }
  function ghdPairHas(gq, gx) {
    const gz = ghdPairId(gq, gx);
    return ghdPairs().some(gL => gL.id === gz);
  }
  function ghdPairToggle(gq, gx, gz) {
    const gL = ghdPairs(), gO = ghdPairId(gq.pk, gx.pk), gX = gL.findIndex(gJ => gJ.id === gO);
    const gF = "@" + (gq.username || "") + " → @" + (gx.username || "");
    if (gX >= 0) gL.splice(gX, 1), g.set(J.pairWatch, gL), ghdToast(Y("pair_removed", gF)); else gL.unshift({
      id: gO,
      a: gq,
      b: gx,
      follows: gz === void 0 ? null : gz,
      ts: Date.now()
    }), g.set(J.pairWatch, gL.slice(0, 50)), ghdToast(Y("pair_added", gF));
    g5();
  }
  function ghdPairPerson(gq, gx, gz, gL) {
    return {
      pk: String(gq || ""),
      username: gx || "",
      full_name: gz || "",
      pic: gL || ""
    };
  }
  let ghdPairBusy = false;
  async function ghdPairScan() {
    if (ghdPairBusy) return;
    const gq = ghdPairs();
    if (!gq.length) return;
    ghdPairBusy = true;
    let gx = false;
    try {
      for (const gz of gq) {
        if (!gz.a || !gz.a.pk || !gz.b || !gz.b.username) continue;
        let gL = null;
        try {
          const gO = await k.checkFollowsFast(gz.a.pk, gz.b.username);
          gL = gO.follows;
        } catch (gX) {
          if (gX && gX.kind === "rate") return;
          continue;
        }
        if (gL === false && gz.follows === true) try {
          const gJ = await k.checkFollows(gz.a.pk, gz.b.username);
          gL = gJ.follows ? true : gJ.complete ? false : null;
        } catch (gF) {
          if (gF && gF.kind === "rate") return;
          gL = null;
        }
        if (gL === null) continue;
        if ((gz.follows === true || gz.follows === false) && gL !== gz.follows) {
          const gl = {
            type: "pair",
            ts: Date.now(),
            pk: gz.a.pk,
            username: gz.a.username || "",
            full_name: gz.a.full_name || "",
            pic: gz.a.pic || "",
            pairA: gz.a,
            pairB: gz.b,
            follows: gL,
            key: "pair:" + gz.id + ":" + (gL ? "1" : "0") + ":" + Date.now()
          };
          Yt(gl);
          if (F.notify) I(Y(gL ? "notif_pair_follow" : "notif_pair_unfollow", [ "@" + (gz.a.username || ""), "@" + (gz.b.username || "") ]), "Ghoosted", gz.a.pic || "");
        }
        if (gz.follows !== gL) gz.follows = gL, gz.ts = Date.now(), gx = true;
        await new Promise(gc => setTimeout(gc, 2e3));
      }
    } finally {
      ghdPairBusy = false;
      if (gx) g.set(J.pairWatch, ghdPairs().map(gS => {
        const gC = gq.find(gU => gU.id === gS.id);
        return gC || gS;
      }));
      if (gx) g5();
    }
  }
//#plus-on
  async function t7() {
    const gq = String(i || "").replace(/^@+/, "").trim(), gx = String(f || "").replace(/^@+/, "").trim();
    if (!gq || !gx) {
      M = {
        err: Y("spy_need_two")
      }, g5();
      return;
    }
    if (l) {
      M = {
        err: Y("busy_other")
      }, g5();
      return;
    }
    d = true, M = null, g5();
    // Pantalla de carga como en el resto: la comprobacion son cuatro peticiones
    // y con listas grandes tarda. Sin ella parece que no pasa nada.
    ghdLoadShow(null, 0, "load_pair");
    try {
      const gz = await k.fetchUserByUsername(gq), gL = await k.fetchUserByUsername(gx);
      // "¿A sigue a B?" se responde de dos maneras: leyendo a quien sigue A, o
      // buscando a A entre los seguidores de B. La segunda salva el caso de que
      // A sea privada y no la sigas, que antes se rendia con un "no se puede
      // comprobar" aunque la respuesta estuviera perfectamente a la vista.
      // Devuelve {v, via}: la respuesta y POR DONDE se supo. La via importa
      // para contarsela al usuario: si no sigue a una cuenta privada, un "no
      // sigue" seco parece inventado. Diciendo "no aparece entre los
      // seguidores de @fulana" se entiende de donde sale.
      const ghdSigue = async function(gDe, gA) {
        if (t6(gDe)) try {
          G(Y("spy_checking_dir", "@" + gDe.username), "work");
          const gR = await k.checkFollows(gDe.pk, gA.username);
          if (gR.follows) return { v: true, via: "d" };
          if (gR.complete) return { v: false, via: "d" };
        } catch (gE) {
          if (gE && gE.kind === "rate") throw gE;
        }
        // Por la otra puerta: ¿esta gDe entre los seguidores de gA?
        if (t6(gA)) try {
          G(Y("spy_checking_rev", "@" + gA.username), "work");
          const gR2 = await k.checkFollowedBy(gA.pk, gDe.username);
          if (gR2.follows) return { v: true, via: "i", quien: gA.username };
          if (gR2.complete) return { v: false, via: "i", quien: gA.username };
        } catch (gE2) {
          if (gE2 && gE2.kind === "rate") throw gE2;
        }
        return { v: null, via: null };
      };
      const gAB = await ghdSigue(gz, gL), gBA = await ghdSigue(gL, gz);
      const gO = gAB.v, gX = gBA.v;
      M = {
        aUser: gz.username,
        bUser: gL.username,
        aFollowsB: gO,
        bFollowsA: gX,
        aVia: gAB,
        bVia: gBA,
//#plus-off parejas: no se guarda a quien se comparo
        a: ghdPairPerson(gz.pk, gz.username, gz.full_name, gz.pic),
        b: ghdPairPerson(gL.pk, gL.username, gL.full_name, gL.pic)
//#plus-on
      };
    } catch (gS) {
      M = {
        err: gS && gS.kind === "http" ? Y("spy_result_err") : Y("status_error")
      };
    } finally {
      ghdLoadHide();
      d = false, G(Y("status_upto", B(g.get(J.lastCheck, Date.now()))), "ok"), g5();
    }
  }
  function t8() {
    if (b) return;
    b = document.createElement("div"), b.id = "ghd-dossier", m.appendChild(b);
  }
  function t9() {
    b && (b.classList.remove("show"), b.innerHTML = ""), [ "ghd-stories", "ghd-posts-view", "ghd-hl-view", "ghd-cover-view" ].forEach(gq => {
      const gx = document.getElementById(gq);
      if (gx) {
        if (gx._stop) gx._stop();
        gx.classList.remove("show");
      }
    });
  }
  function tY(gq) {
    let gx = 1, gz = 0, gL = 0, gO = false, gX = false, gJ = 0, gF = 0;
    const gl = () => gq.querySelector("img"), gc = () => {
      const gC = gl();
      if (!gC) return;
      gC.style.transform = "translate(" + gz + "px," + gL + "px) scale(" + gx + ")", gC.style.cursor = gx > 1 ? "grab" : "zoom-in";
    }, gS = () => {
      gx = 1, gz = 0, gL = 0, gX = false;
      const gC = gl();
      gC && (gC.style.transform = "", gC.style.cursor = "zoom-in");
    };
    return gq.addEventListener("wheel", gC => {
      const gU = gl();
      if (!gU) return;
      gC.preventDefault();
      const gj = gx;
      gx = Math.min(4, Math.max(1, gx + .4 * (gC.deltaY < 0 ? 1 : -1)));
      if (gx === 1) gz = 0, gL = 0; else if (gx !== gj) {
        const gy = gq.getBoundingClientRect(), gH = gC.clientX - gy.left - gy.width / 2, gR = gC.clientY - gy.top - gy.height / 2, gh = gx / gj - 1;
        gz -= gH * gh, gL -= gR * gh;
      }
      gc();
    }, {
      passive: false
    }), gq.addEventListener("mousedown", gC => {
      if (gx <= 1) return;
      gO = true, gX = false, gJ = gC.clientX - gz, gF = gC.clientY - gL;
      const gU = gl();
      if (gU) gU.style.cursor = "grabbing";
    }), document.addEventListener("mousemove", gC => {
      if (!gO) return;
      if (!(gC.buttons & 1)) {
        gO = false, gc();
        return;
      }
      gX = true, gz = gC.clientX - gJ, gL = gC.clientY - gF, gc();
    }), document.addEventListener("mouseup", () => {
      gO && (gO = false, gc());
    }), gq.addEventListener("dblclick", gC => {
      gC.stopPropagation(), gS();
    }), {
      reset: gS,
      active: () => gx > 1 || gX
    };
  }
  function tt(gq) {
    if (!gq) return;
    if (gq.isVideo) {
      const gx = gq.video || gq.url;
      if (!gx) return;
      const gz = document.createElement("video");
      gz.preload = "auto", gz.muted = true, gz.style.display = "none", gz.src = gx, document.body.appendChild(gz), 
      setTimeout(() => gz.remove(), 2e4);
    } else {
      const gL = gq.full || gq.url || gq.thumb || gq.img;
      if (gL) {
        const gO = new Image;
        gO.referrerPolicy = "no-referrer", gO.src = gL;
      }
    }
  }
//#plus-off modo fantasma: ver historias sin dejar rastro
  function tg(gq) {
    if (!gq || !gq.pk) return;
    let gx = document.getElementById("ghd-stories");
    !gx && (gx = document.createElement("div"), gx.id = "ghd-stories", m.appendChild(gx)), 
    gx.classList.add("show"), gx.innerHTML = '<div class="dos-loading">' + Y("dos_loading") + "</div>", 
    k.fetchStories(gq.pk).then(gz => {
      gx.innerHTML = "";
      const gL = document.createElement("div");
      gL.className = "ghst-head";
      const gO = document.createElement("div");
      gO.className = "ghst-ti", gO.innerHTML = "<b>@" + g7(gq.username || "") + "</b><small>" + g7(Y("dos_ghost_note")) + "</small>";
      const gX = document.createElement("button");
      gX.type = "button", gX.className = "ghst-all", gX.textContent = Y("dos_ghost_all");
      const gJ = document.createElement("button");
      gJ.className = "dos-x", gJ.textContent = "×", gJ.title = Y("close"), gJ.onclick = () => gx.classList.remove("show"), 
      gL.append(gO, gX, gJ), gx.appendChild(gL);
      if (!gz.length) {
        const gK = document.createElement("div");
        gK.className = "dos-loading", gK.textContent = Y("dos_ghost_none"), gx.appendChild(gK), 
        gX.remove();
        return;
      }
      gX.onclick = () => tq(gz, gq.username, gX);
      const gF = document.createElement("div");
      gF.className = "ghst-bars", gz.forEach(() => gF.appendChild(document.createElement("span")));
      const gl = document.createElement("div");
      gl.className = "ghst-stage";
      const gc = document.createElement("button");
      gc.className = "ghst-nav prev", gc.textContent = "‹";
      const gS = document.createElement("button");
      gS.className = "ghst-nav next", gS.textContent = "›";
      const gC = document.createElement("div");
      gC.className = "ghst-media";
      const gU = document.createElement("button");
      gU.type = "button", gU.className = "ghst-dl", gU.textContent = Y("dos_download"), 
      gl.append(gF, gc, gC, gS, gU), gx.appendChild(gl);
      let gj = 0;
      const gy = tY(gC), gH = () => {
        const gr = gC.querySelector("video");
        if (gr) try {
          gr.pause(), gr.muted = true, gr.removeAttribute("src"), gr.load();
        } catch (gQ) {}
      }, gR = () => {
        gH(), gx.classList.remove("show"), document.removeEventListener("keydown", gx._key);
      }, gh = gr => {
        gj = (gr + gz.length) % gz.length;
        const gQ = gz[gj];
        gH(), gC.innerHTML = "";
        if (gQ.isVideo) {
          const gZ = document.createElement("video");
          gZ.src = gQ.url, gZ.poster = gQ.img || "", gZ.preload = "auto", gZ.controls = true, 
          gZ.autoplay = true, gZ.playsInline = true, gC.appendChild(gZ);
        } else {
          const gi = document.createElement("img");
          gi.referrerPolicy = "no-referrer", ti(gi, [ gQ.url, gQ.img ], () => {}), gC.appendChild(gi);
        }
        gy.reset(), gF.querySelectorAll("span").forEach((gf, gs) => gf.className = gs < gj ? "done" : gs === gj ? "active" : ""), 
        gU.onclick = () => tk(gQ, gU, gq.username, gj + 1), gc.style.visibility = gj === 0 ? "hidden" : "", 
        gS.style.visibility = gj === gz.length - 1 ? "hidden" : "", tt(gz[gj + 1]), tt(gz[gj - 1]);
      };
      gc.onclick = gr => {
        gr.stopPropagation(), gh(gj - 1);
      }, gS.onclick = gr => {
        gr.stopPropagation(), gh(gj + 1);
      }, gC.onclick = gr => {
        if (gy.active()) return;
        const gQ = gC.getBoundingClientRect();
        if (gr.clientX < gQ.left + gQ.width * .35) gh(gj - 1); else if (gr.clientX > gQ.left + gQ.width * .65) gh(gj + 1);
      }, gx._key = gr => {
        if (gr.key === "ArrowRight") gh(gj + 1); else if (gr.key === "ArrowLeft") gh(gj - 1); else if (gr.key === "Escape") gR();
      }, document.addEventListener("keydown", gx._key), gx._stop = gH, gJ.onclick = gR, 
      gh(0);
    }).catch(() => {
      gx.innerHTML = "";
      const gz = document.createElement("div");
      gz.className = "dos-loading", gz.textContent = Y("dos_ghost_none"), gx.appendChild(gz);
    });
  }
//#plus-on
//#plus-off descargas: guardar la historia o la publicacion abierta
  async function tk(gq, gx, gz, gL) {
    const gO = gq && gq.url;
    if (!gO) return;
    if (gq.isVideo) {
      window.open(gO, "_blank", "noopener");
      return;
    }
    const gX = gx.textContent;
    gx.disabled = true, gx.textContent = "…";
    try {
      const gJ = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gO
      });
      if (gJ && gJ.dataUrl) {
        const gF = document.createElement("a");
        gF.href = gJ.dataUrl, gF.download = "story_" + (gz || "ig") + "_" + gL + ".jpg", 
        gF.click(), gx.textContent = Y("dos_downloaded");
      } else window.open(gO, "_blank", "noopener"), gx.textContent = gX;
    } catch (gl) {
      window.open(gO, "_blank", "noopener"), gx.textContent = gX;
    } finally {
      gx.disabled = false, setTimeout(() => {
        if (gx) gx.textContent = gX;
      }, 2e3);
    }
  }
//#plus-on
//#plus-off modo fantasma: ver todas las historias de golpe
  async function tq(gq, gx, gz) {
    if (!gq || !gq.length) return;
    const gL = gz.textContent;
    gz.disabled = true;
    let gO = 0;
    for (let gX = 0; gX < gq.length; gX++) {
      const gJ = gq[gX];
      gz.textContent = Y("dos_ghost_all_prog", [ String(gX + 1), String(gq.length) ]);
      try {
        if (gJ.isVideo) window.open(gJ.url, "_blank", "noopener"), gO++; else {
          const gF = await chrome.runtime.sendMessage({
            type: "fetchImage",
            url: gJ.url
          });
          if (gF && gF.dataUrl) {
            const gl = document.createElement("a");
            gl.href = gF.dataUrl, gl.download = "story_" + (gx || "ig") + "_" + (gX + 1) + ".jpg", 
            gl.click(), gO++;
          }
        }
      } catch (gc) {}
      await new Promise(gS => setTimeout(gS, 500));
    }
    gz.textContent = Y("dos_ghost_all_done", String(gO)), gz.disabled = false, setTimeout(() => {
      if (gz) gz.textContent = gL;
    }, 2500);
  }
//#plus-on
  function tx(gq, gx) {
    if (!gq || !gq.posts_list || !gq.posts_list.length) return;
    let gz = document.getElementById("ghd-posts-view");
    !gz && (gz = document.createElement("div"), gz.id = "ghd-posts-view", m.appendChild(gz));
    gz.classList.add("show"), gz.innerHTML = "";
    const gL = document.createElement("div");
    gL.className = "ghst-head";
    const gO = document.createElement("div");
    gO.className = "ghst-ti", gO.innerHTML = "<b>@" + g7(gq.username || "") + "</b><small>" + g7(Y("dos_posts_sec")) + "</small>";
    const gX = document.createElement("span");
    gX.className = "ghst-cnt";
    const gJ = document.createElement("button");
    gJ.className = "dos-x", gJ.textContent = "×", gJ.title = Y("close"), gL.append(gO, gX, gJ), 
    gz.appendChild(gL);
    const gF = document.createElement("div");
    gF.className = "ghst-stage";
    const gl = document.createElement("button");
    gl.className = "ghst-nav prev", gl.textContent = "‹";
    const gc = document.createElement("button");
    gc.className = "ghst-nav next", gc.textContent = "›";
    const gS = document.createElement("div");
    gS.className = "ghst-media";
    const gC = document.createElement("div");
    gC.className = "ghst-slide-dots";
    const gU = document.createElement("div");
    gU.className = "ghst-cap";
//#plus-off descargas: se puede ver la publicacion, no guardarla
    const gj = document.createElement("button");
    gj.type = "button", gj.className = "ghst-dl", gj.textContent = Y("dos_download"), 
    gF.append(gl, gS, gc, gC, gU, gj), gz.appendChild(gF);
//#plus-on
    gF.append(gl, gS, gc, gC, gU), gz.appendChild(gF);
    let gy = Math.max(0, Math.min(gx || 0, gq.posts_list.length - 1)), gH = 0, gR = false;
    const gh = tY(gS), gK = gM => gM.media && gM.media.length ? gM.media : [ {
      isVideo: gM.isVideo,
      full: gM.full,
      thumb: gM.thumb,
      video: gM.video
    } ], gr = () => {
      const gM = gS.querySelector("video");
      if (gM) try {
        gM.pause(), gM.muted = true, gM.removeAttribute("src"), gM.load();
      } catch (gd) {}
    }, gQ = () => {
      gr(), gz.classList.remove("show"), document.removeEventListener("keydown", gz._key);
    };
    gz._stop = gr;
    async function gZ(gM) {
      while (gM >= gq.posts_list.length && gq.posts_next && !gR) {
        gR = true;
        try {
          const gd = await k.fetchUserPostsPage(gq.pk, 24, gq.posts_next);
          gq.posts_list = gq.posts_list.concat(gd.posts || []), gq.posts_next = gd.next;
        } catch (gw) {
          break;
        }
        gR = false;
      }
    }
    async function gi(gM, gd) {
      if (gM < 0) gM = 0;
      await gZ(gM);
      if (gM >= gq.posts_list.length) gM = gq.posts_list.length - 1;
      gy = gM;
      const gw = gq.posts_list[gy], gb = gK(gw);
      gH = Math.max(0, Math.min(gd == null ? 0 : gd, gb.length - 1));
      const gm = gb[gH];
      gr(), gS.innerHTML = "";
      if (gm.isVideo && gm.video) {
        const gD = document.createElement("video");
        gD.src = gm.video, gD.poster = gm.thumb || "", gD.preload = "auto", gD.controls = true, 
        gD.autoplay = true, gD.playsInline = true, gS.appendChild(gD);
      } else {
        const gP = document.createElement("img");
        gP.referrerPolicy = "no-referrer", ti(gP, [ gm.full, gm.thumb ], () => {}), gS.appendChild(gP);
      }
      gh.reset();
      gb.length > 1 ? (gC.style.display = "flex", gC.innerHTML = gb.map((ga, gA) => '<span class="' + (gA === gH ? "active" : "") + '"></span>').join("")) : (gC.style.display = "none", 
      gC.innerHTML = "");
      gU.textContent = (gw.likesHidden ? "♥ —" : "♥ " + Number(gw.likes || 0).toLocaleString()) + "   💬 " + Number(gw.comments || 0).toLocaleString(), 
      gX.textContent = gy + 1 + " / " + gq.posts_list.length + (gq.posts_next ? "+" : ""), 
//#plus-off descargas: el boton de guardar la publicacion no existe en Plus
      gj.onclick = () => td(gw, gj, gm),
//#plus-on
      gl.style.visibility = gy === 0 && gH === 0 ? "hidden" : "", 
      gc.style.visibility = gy === gq.posts_list.length - 1 && !gq.posts_next && gH === gb.length - 1 ? "hidden" : "";
      const gV = gb[gH + 1] || (gq.posts_list[gy + 1] ? gK(gq.posts_list[gy + 1])[0] : null), gn = gb[gH - 1] || (gy > 0 ? gK(gq.posts_list[gy - 1]).slice(-1)[0] : null);
      tt(gV), tt(gn);
    }
    function gf() {
      const gM = gK(gq.posts_list[gy]);
      if (gH < gM.length - 1) gi(gy, gH + 1); else gi(gy + 1, 0);
    }
    function gs() {
      if (gH > 0) {
        gi(gy, gH - 1);
        return;
      }
      if (gy === 0) return;
      const gM = gK(gq.posts_list[gy - 1]);
      gi(gy - 1, gM.length - 1);
    }
    gl.onclick = gM => {
      gM.stopPropagation(), gs();
    }, gc.onclick = gM => {
      gM.stopPropagation(), gf();
    }, gS.onclick = gM => {
      if (gh.active()) return;
      const gd = gS.getBoundingClientRect();
      if (gM.clientX < gd.left + gd.width * .35) gs(); else if (gM.clientX > gd.left + gd.width * .65) gf();
    }, gz._key = gM => {
      if (gM.key === "ArrowRight") gf(); else if (gM.key === "ArrowLeft") gs(); else if (gM.key === "Escape") gQ();
    }, document.addEventListener("keydown", gz._key), gJ.onclick = gQ, gi(gy, 0);
  }
  function tz(gq, gx, gz) {
    if (!gq || !gx || !gx.id) return;
    let gL = document.getElementById("ghd-hl-view");
    !gL && (gL = document.createElement("div"), gL.id = "ghd-hl-view", m.appendChild(gL)), 
    gL.classList.add("show"), gL.innerHTML = '<div class="dos-loading">' + Y("dos_loading") + "</div>", 
    k.fetchHighlightStories(gx.id).then(gO => {
      if (!gO.length) {
        gL.classList.remove("show");
        if (gz) gz();
        return;
      }
      gL.innerHTML = "";
      const gX = document.createElement("div");
      gX.className = "ghst-head";
      const gJ = document.createElement("div");
      gJ.className = "ghst-ti", gJ.innerHTML = "<b>@" + g7(gq.username || "") + "</b><small>" + g7(gx.title || Y("dos_highlights")) + "</small>";
      const gF = document.createElement("span");
      gF.className = "ghst-cnt";
      const gl = document.createElement("button");
      gl.className = "dos-x", gl.textContent = "×", gl.title = Y("close"), gX.append(gJ, gF, gl), 
      gL.appendChild(gX);
      const gc = document.createElement("div");
      gc.className = "ghst-stage";
      const gS = document.createElement("button");
      gS.className = "ghst-nav prev", gS.textContent = "‹";
      const gC = document.createElement("button");
      gC.className = "ghst-nav next", gC.textContent = "›";
      const gU = document.createElement("div");
      gU.className = "ghst-media";
      const gj = document.createElement("div");
      gj.className = "ghst-slide-dots";
//#plus-off descargas: se puede ver, no guardar
      const gy = document.createElement("button");
      gy.type = "button", gy.className = "ghst-dl", gy.textContent = Y("dos_download"), 
      gc.append(gS, gU, gC, gj, gy), gL.appendChild(gc);
//#plus-on
      gc.append(gS, gU, gC, gj), gL.appendChild(gc);
      let gH = 0;
      const gR = tY(gU), gh = () => {
        const gQ = gU.querySelector("video");
        if (gQ) try {
          gQ.pause(), gQ.muted = true, gQ.removeAttribute("src"), gQ.load();
        } catch (gZ) {}
      }, gK = () => {
        gh(), gL.classList.remove("show"), document.removeEventListener("keydown", gL._key);
      };
      gL._stop = gh;
      const gr = gQ => {
        gH = (gQ + gO.length) % gO.length;
        const gZ = gO[gH];
        gh(), gU.innerHTML = "";
        if (gZ.isVideo) {
          const gi = document.createElement("video");
          gi.src = gZ.url, gi.poster = gZ.img || "", gi.preload = "auto", gi.controls = true, 
          gi.autoplay = true, gi.playsInline = true, gU.appendChild(gi);
        } else {
          const gf = document.createElement("img");
          gf.referrerPolicy = "no-referrer", ti(gf, [ gZ.url, gZ.img ], () => {}), gU.appendChild(gf);
        }
        gR.reset(), gO.length > 1 ? (gj.style.display = "flex", gj.innerHTML = gO.map((gs, gM) => '<span class="' + (gM === gH ? "active" : "") + '"></span>').join("")) : (gj.style.display = "none", 
        gj.innerHTML = ""), gF.textContent = gH + 1 + " / " + gO.length,
//#plus-off descargas: el boton de guardar no existe en Plus
        gy.onclick = () => tk(gZ, gy, gq.username, gH + 1),
//#plus-on

        gS.style.visibility = gH === 0 ? "hidden" : "", gC.style.visibility = gH === gO.length - 1 ? "hidden" : "", 
        tt(gO[gH + 1]), tt(gO[gH - 1]);
      };
      gS.onclick = gQ => {
        gQ.stopPropagation(), gr(gH - 1);
      }, gC.onclick = gQ => {
        gQ.stopPropagation(), gr(gH + 1);
      }, gU.onclick = gQ => {
        if (gR.active()) return;
        const gZ = gU.getBoundingClientRect();
        if (gQ.clientX < gZ.left + gZ.width * .35) gr(gH - 1); else if (gQ.clientX > gZ.left + gZ.width * .65) gr(gH + 1);
      }, gL._key = gQ => {
        if (gQ.key === "ArrowRight") gr(gH + 1); else if (gQ.key === "ArrowLeft") gr(gH - 1); else if (gQ.key === "Escape") gK();
      }, document.addEventListener("keydown", gL._key), gl.onclick = gK, gr(0);
    }).catch(() => {
      gL.classList.remove("show");
      if (gz) gz();
    });
  }
//#plus-off descarga de portadas de destacados
  function tL(gq, gx, gz) {
    if (!gz) return;
    let gL = document.getElementById("ghd-cover-view");
    !gL && (gL = document.createElement("div"), gL.id = "ghd-cover-view", m.appendChild(gL));
    gL.classList.add("show"), gL.innerHTML = "";
    const gO = document.createElement("div");
    gO.className = "ghst-head";
    const gX = document.createElement("div");
    gX.className = "ghst-ti", gX.innerHTML = "<b>@" + g7(gq.username || "") + "</b><small>" + g7(gx && gx.title || Y("dos_highlights")) + "</small>";
    const gJ = document.createElement("button");
    gJ.className = "dos-x", gJ.textContent = "×", gJ.title = Y("close"), gO.append(gX, gJ), 
    gL.appendChild(gO);
    const gF = document.createElement("div");
    gF.className = "ghst-stage";
    const gl = document.createElement("div");
    gl.className = "ghst-media";
    const gc = document.createElement("img");
    gc.src = gz, gl.appendChild(gc);
    const gS = document.createElement("a");
    gS.className = "ghst-dl", gS.textContent = Y("dos_download"), gS.href = gz, gS.download = "highlight_" + (gq.username || "ig") + "_" + (gx && gx.title || "cover").replace(/[^a-z0-9]+/gi, "_") + ".jpg", 
    gF.append(gl, gS), gL.appendChild(gF), tY(gl);
    const gC = () => {
      gL.classList.remove("show"), document.removeEventListener("keydown", gL._key);
    };
    gL._key = gU => {
      if (gU.key === "Escape") gC();
    }, document.addEventListener("keydown", gL._key), gJ.onclick = gC;
  }
//#plus-on
  function tO(gq) {
    if (!gq || !gq.pk) return;
    const gx = g.get(J.spyCounts, {}), gz = gx[gq.pk] || [], gL = gz[gz.length - 1], gO = {
      ts: Date.now(),
      followers: gq.followers,
      following: gq.following,
      posts: gq.posts
    };
    (!gL || gL.followers !== gO.followers || gL.following !== gO.following || Date.now() - gL.ts > 216e5) && (gz.push(gO), 
    gx[gq.pk] = gz.slice(-180), g.set(J.spyCounts, gx));
  }
  const tX = 1500;
  async function tJ(gq) {
    if (!gq || !gq.pk) return {
      gained: [],
      lost: []
    };
    const gx = g.get(J.spyFollowers, {}), gz = gx[gq.pk];
    if (gz && Date.now() - gz.ts < 12e5) return {
      gained: [],
      lost: []
    };
    const gL = Number(gq.followers || 0), gO = gL > 0 && gL <= tX;
    let gX;
    try {
      gX = await k.fetchFollowersOf(gq.pk, null, gO ? 15 : 3);
    } catch (gj) {
      return {
        gained: [],
        lost: []
      };
    }
    const gJ = (gX.users || []).map(gy => ({
      pk: gy.pk,
      username: gy.username,
      full_name: gy.full_name,
      pic: gy.pic,
      is_private: gy.is_private,
      is_verified: gy.is_verified
    }));
    if (!gJ.length) return {
      gained: [],
      lost: []
    };
    const gF = gO && gX.complete, gl = g.get(J.spyFollowers, {}), gc = gl[gq.pk], gS = gc ? new Set((gc.users || []).map(gy => gy.pk)) : null;
    gl[gq.pk] = {
      ts: Date.now(),
      users: gJ.slice(0, 1600),
      full: gF
    }, g.set(J.spyFollowers, gl);
    if (!gS) return {
      gained: [],
      lost: []
    };
    const gC = gJ.filter(gy => !gS.has(gy.pk));
    let gU = [];
    if (gF && gc.full) {
      const gy = new Set(gJ.map(gH => gH.pk));
      gU = gc.users.filter(gH => !gy.has(gH.pk));
    }
    return {
      gained: gC.length > 40 ? [] : gC.slice(0, 50),
      lost: gU.length > 40 ? [] : gU.slice(0, 50),
      unlisted: !gO
    };
  }
  async function tF(gq, gx) {
    try {
      const gz = await tJ(gq), gL = typeof gx === "number" && gx !== gq.followers, gO = gL ? gq.followers - gx : 0;
      let gX = false;
      if (gz.gained.length || gz.unlisted && gO > 0) {
        const gJ = gz.gained.length || Math.max(1, gO), gF = {
          type: "followers_up",
          ts: Date.now(),
          pk: gq.pk,
          username: gq.username || "",
          full_name: gq.full_name || "",
          pic: gq.pic || "",
          delta: gJ,
          key: "fup:" + gq.pk + ":" + gq.followers
        };
        if (gz.gained.length) gF.newFollowers = gz.gained;
        if (Yt(gF)) gX = true;
      }
      if (gz.lost.length) {
        const gl = {
          type: "followers_down",
          ts: Date.now(),
          pk: gq.pk,
          username: gq.username || "",
          full_name: gq.full_name || "",
          pic: gq.pic || "",
          delta: gz.lost.length,
          key: "fdn:" + gq.pk + ":" + gq.followers
        };
        gl.lostFollowers = gz.lost;
        if (Yt(gl)) gX = true;
      }
      if (gX) gt();
    } catch (gc) {}
  }
  function tl(gq) {
    const gx = g.get(J.photoArchive, {});
    return gx[gq] || [];
  }
  async function ghdKeepFaces(gq) {
    const gx = g.get(J.photoArchive, {});
    const gz = (gq || []).filter(gL => gL && gL.pk && gL.pic && !(gx[gL.pk] || []).some(gO => gO.kind === "avatar" && gO.dataUrl)).slice(0, 40);
    for (const gL of gz) {
      try {
        await tc(gL.pk, gL.pic, "avatar", "@" + (gL.username || ""));
      } catch (gO) {}
      await new Promise(gO => setTimeout(gO, 150));
    }
  }
  async function tc(gq, gx, gz, gL) {
    if (!gq || !gx) return {
      ok: false,
      dataUrl: ""
    };
    const gO = k.mediaSig(gx) || String(gx).split("?")[0], gX = g.get(J.photoArchive, {}), gJ = gX[gq] || [], gF = gJ.findIndex(gc => gc.sig === gO);
    if (gF >= 0 && gJ[gF].dataUrl) return {
      ok: false,
      dataUrl: gJ[gF].dataUrl
    };
    let gl = "";
    try {
      const gc = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gx
      });
      if (gc && gc.dataUrl) gl = gc.dataUrl;
    } catch (gS) {}
    if (!gl) return {
      ok: false,
      dataUrl: gF >= 0 ? gJ[gF].dataUrl || "" : ""
    };
    if (gF >= 0) return gl.length > (gJ[gF].dataUrl || "").length + 500 && (gJ[gF].dataUrl = gl, 
    gX[gq] = gJ, g.set(J.photoArchive, gX)), {
      ok: false,
      dataUrl: gJ[gF].dataUrl || gl
    };
    return gJ.push({
      ts: Date.now(),
      dataUrl: gl,
      sig: gO,
      kind: gz || "avatar",
      label: gL || ""
    }), gX[gq] = gJ.slice(-40), g.set(J.photoArchive, gX), {
      ok: true,
      dataUrl: gl
    };
  }
  function tS(gq) {
    const gx = document.createElement("section");
    gx.className = "dos-sec";
    const gz = document.createElement("div");
    return gz.className = "dos-sec-h", gz.textContent = gq, gx.appendChild(gz), gx;
  }
  function tC(gq, gx) {
    const gz = document.createElement("a");
    return gz.className = "dos-link", gz.href = gq, gz.target = "_blank", gz.rel = "noopener", 
    gz.textContent = gx, gz;
  }
  function tU(gq, gx) {
    const gz = document.createElement("a");
    return gz.className = "dos-act tiktok", gz.href = gq, gz.target = "_blank", gz.rel = "noopener", 
    gz.innerHTML = YQ(), gz.appendChild(document.createTextNode(gx)), gz;
  }
  function tj(gq, gx, gz) {
    const gL = document.createElement("div");
    gL.className = "dos-stat";
    const gO = document.createElement("b");
    gO.textContent = Number(gq || 0).toLocaleString();
    const gX = document.createElement("span");
    return gX.textContent = gx, gL.append(gO, gX), gz && (gL.classList.add("clickable"), 
    gL.addEventListener("click", gz)), gL;
  }
  function ty(gq, gx) {
    if (!b) return;
    tV(gq, gx);
    const gz = b.querySelector(".dos-rel-sec");
    if (gz && gz.scrollIntoView) gz.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
  function tH(gq, gx) {
    const gz = document.createElement("div");
    gz.className = "dos-row";
    const gL = document.createElement("span");
    gL.className = "dos-k", gL.textContent = gq;
    const gO = document.createElement("span");
    gO.className = "dos-val";
    if (typeof gx === "string") gO.textContent = gx; else gO.appendChild(gx);
    return gz.append(gL, gO), gz;
  }
  function tR(gq) {
    const gx = document.createElement("span");
    return String(gq || "").split(/(\s+)/).forEach(gz => {
      if (/^https?:\/\/\S+/i.test(gz) || /^www\.\S+/i.test(gz)) gx.appendChild(tC(gz.startsWith("http") ? gz : "https://" + gz, gz)); else if (/^@[\w.]+/.test(gz)) {
        const gL = gz.match(/^@([\w.]+)(.*)$/);
        gx.appendChild(tC("https://www.instagram.com/" + gL[1] + "/", "@" + gL[1]));
        if (gL[2]) gx.appendChild(document.createTextNode(gL[2]));
      } else if (/^#[\w.]+/.test(gz)) {
        const gO = gz.match(/^#([\w.]+)(.*)$/);
        gx.appendChild(tC("https://www.instagram.com/explore/tags/" + gO[1] + "/", "#" + gO[1]));
        if (gO[2]) gx.appendChild(document.createTextNode(gO[2]));
      } else gx.appendChild(document.createTextNode(gz));
    }), gx;
  }
  function th(gq, gx) {
    const gz = g.get(J.spyCounts, {})[gq] || [], gL = document.createElement("div");
    gL.className = "dos-graph";
    const gO = document.createElement("div");
    gO.className = "dos-graph-head", gO.innerHTML = "<b>" + Number(gx.followers).toLocaleString() + "</b> " + Y("chip_followers"), 
    gL.appendChild(gO);
    const gSp = gz.length >= 2 ? gz[gz.length - 1].ts - gz[0].ts : 0;
    if (gz.length >= 2 && gSp >= 432e5) {
      const gX = gz.slice(-60).map(gh => gh.followers), gJ = Math.min.apply(null, gX), gF = Math.max.apply(null, gX), gl = Math.max(1, gF - gJ), gc = 300, gS = 64, gC = 4, gU = (gc - gC * 2) / (gX.length - 1);
      let gj = "";
      gX.forEach((gh, gK) => {
        const gr = gC + gK * gU, gQ = gC + (gS - gC * 2) * (1 - (gh - gJ) / gl);
        gj += (gK ? "L" : "M") + gr.toFixed(1) + " " + gQ.toFixed(1) + " ";
      });
      const gy = gX[gX.length - 1] - gX[0], gH = gy > 0 ? "+" : "", gR = document.createElement("div");
      gR.className = "dos-graph-delta " + (gy >= 0 ? "up" : "down"), gR.textContent = gH + gy + " " + Y("dos_since_from", new Date(gz[0].ts).toLocaleDateString(void 0, {
        day: "numeric",
        month: "short"
      })), gL.appendChild(gR), gL.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 ' + gc + " " + gS + '" class="dos-spark" preserveAspectRatio="none"><path d="' + gj + '" fill="none" stroke="url(#ghdg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="ghdg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs></svg>');
    } else {
      const gh = document.createElement("div");
      gh.className = "dos-note", gh.textContent = gz.length >= 2 ? Y("dos_graph_soon") : Y("dos_graph_empty"), 
      gL.appendChild(gh);
    }
    return gL;
  }
  function tK(gq) {
    const gx = new Set, gz = [];
    return [ gq.pic_row, gq.pic_hd, gq.pic ].forEach(gL => {
      gL && !gx.has(gL) && (gx.add(gL), gz.push(gL));
    }), gz;
  }
  function tr(gq) {
    const gx = new Set, gz = [];
    return [ gq.pic_hd, gq.pic_row, gq.pic ].forEach(gL => {
      gL && !gx.has(gL) && (gx.add(gL), gz.push(gL));
    }), gz;
  }
  function tQ(gq) {
    const gx = document.createElement("div");
    gx.className = "dos-av" + (gq && gq.pk && Yv(gq.pk) ? " has-story" : "");
    const gz = tK(gq), gL = () => {
      gx.textContent = (gq.username || "?").slice(0, 1).toUpperCase();
    };
    if (!gz.length) return console.warn("[Ghoosted] no avatar URL at all for @" + gq.username, gq), 
    gL(), gx;
    const gO = document.createElement("img");
    gO.referrerPolicy = "no-referrer", gO.loading = "eager";
    let gX = 0;
    const gJ = async () => {
      for (const gF of gz) try {
        const gl = await chrome.runtime.sendMessage({
          type: "fetchImage",
          url: gF
        });
        if (gl && gl.dataUrl) {
          gO.onerror = () => {
            gO.remove(), gL();
          }, gO.src = gl.dataUrl;
          return;
        }
      } catch (gc) {}
      console.warn("[Ghoosted] avatar unreachable even via worker for @" + gq.username, gz[0]), 
      gO.remove(), gL();
    };
    return gO.onerror = () => {
      gX++;
      if (gX < gz.length) gO.src = gz[gX]; else gJ();
    }, gO.src = gz[0], gx.appendChild(gO), gx;
  }
  function tZ(gq, gx, gz) {
    const gL = () => {
      gq.textContent = String(gz || "?").slice(0, 1).toUpperCase();
    };
    if (!gx || !gx.length) {
      gL();
      return;
    }
    const gO = document.createElement("img");
    gO.referrerPolicy = "no-referrer", gO.loading = "lazy", gq.appendChild(gO);
    let gX = 0;
    const gJ = async () => {
      for (const gF of gx) try {
        const gl = await chrome.runtime.sendMessage({
          type: "fetchImage",
          url: gF
        });
        if (gl && gl.dataUrl) {
          gO.onerror = () => {
            gO.remove(), gL();
          }, gO.src = gl.dataUrl;
          return;
        }
      } catch (gc) {}
      console.warn("[Ghoosted] highlight cover unreachable even via worker", gx[0]), gO.remove(), 
      gL();
    };
    gO.onerror = () => {
      gX++;
      if (gX < gx.length) gO.src = gx[gX]; else gJ();
    }, gO.src = gx[0];
  }
  function ti(gq, gx, gz) {
    const gL = (gx || []).filter(Boolean);
    if (!gL.length) {
      if (gz) gz();
      return;
    }
    let gO = 0;
    const gX = async () => {
      for (const gJ of gL) try {
        const gF = await chrome.runtime.sendMessage({
          type: "fetchImage",
          url: gJ
        });
        if (gF && gF.dataUrl) {
          gq.onerror = () => {
            if (gz) gz();
          }, gq.src = gF.dataUrl;
          return;
        }
      } catch (gl) {}
      if (gz) gz();
    };
    gq.onerror = () => {
      gO++;
      if (gO < gL.length) gq.src = gL[gO]; else gX();
    }, gq.src = gL[0];
  }
//#plus-off descargas: guardar la foto de perfil de otra persona
  async function tf(gq, gx) {
    const gz = tr(gq);
    if (!gz.length) return;
    gx.disabled = true;
    const gL = gx.textContent;
    gx.textContent = Y("dos_downloading");
    try {
      let gO = null;
      for (const gX of gz) {
        gO = await chrome.runtime.sendMessage({
          type: "fetchImage",
          url: gX
        });
        if (gO && gO.dataUrl) break;
      }
      if (gO && gO.dataUrl) {
        const gJ = document.createElement("a");
        gJ.href = gO.dataUrl, gJ.download = "ig_" + gq.username + ".jpg", gJ.click(), gx.textContent = Y("dos_downloaded");
      } else window.open(gz[gz.length - 1], "_blank", "noopener"), gx.textContent = gL;
    } catch (gF) {
      window.open(gz[0], "_blank", "noopener"), gx.textContent = gL;
    } finally {
      gx.disabled = false, setTimeout(() => {
        if (gx) gx.textContent = gL;
      }, 2500);
    }
  }
//#plus-on
  async function ts(gq) {
    if (!gq) return;
    const gx = window.open("", "_blank");
    try {
      const gz = await (await fetch(gq)).blob(), gL = URL.createObjectURL(gz);
      if (gx) gx.location.href = gL; else window.open(gL, "_blank", "noopener");
    } catch (gO) {
      if (gx) gx.location.href = gq; else window.open(gq, "_blank", "noopener");
    }
  }
  async function tM(gq) {
    const gx = tr(gq);
    if (!gx.length) return;
    const gz = window.open("", "_blank"), gL = gO => {
      if (gz) gz.location.href = gO; else window.open(gO, "_blank", "noopener");
    };
    for (const gO of gx) try {
      const gX = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gO
      });
      if (gX && gX.dataUrl) {
        try {
          const gJ = await (await fetch(gX.dataUrl)).blob();
          gL(URL.createObjectURL(gJ));
        } catch (gF) {
          gL(gX.dataUrl);
        }
        return;
      }
    } catch (gl) {}
    gL(gx[0]);
  }
//#plus-off descargas: guardar la publicacion en el disco
  async function td(gq, gx, gz) {
    const gL = gz || {
      isVideo: gq.isVideo,
      full: gq.full,
      video: gq.video
    }, gO = gL.isVideo ? gL.video : gL.full;
    if (!gO) {
      if (gq.code) window.open("https://www.instagram.com/p/" + gq.code + "/", "_blank", "noopener");
      return;
    }
    if (gL.isVideo) {
      window.open(gO, "_blank", "noopener");
      return;
    }
    gx.disabled = true;
    const gX = gx.textContent;
    gx.textContent = "…";
    try {
      const gJ = await chrome.runtime.sendMessage({
        type: "fetchImage",
        url: gO
      });
      if (gJ && gJ.dataUrl) {
        const gF = document.createElement("a");
        gF.href = gJ.dataUrl, gF.download = "ig_post_" + (gq.code || "x") + ".jpg", gF.click(), 
        gx.textContent = "✓";
      } else window.open(gO, "_blank", "noopener"), gx.textContent = gX;
    } catch (gl) {
      window.open(gO, "_blank", "noopener"), gx.textContent = gX;
    } finally {
      gx.disabled = false, setTimeout(() => {
        if (gx) gx.textContent = gX;
      }, 1800);
    }
  }
//#plus-on
  function tw(gq) {
    const gx = document.createElement("a");
    gx.className = "dos-rel-row", gx.href = "https://www.instagram.com/" + gq.username + "/", 
    gx.target = "_blank", gx.rel = "noopener", gx.appendChild(YT(gq));
    const gz = document.createElement("div");
    gz.className = "ghd-info";
    const gL = document.createElement("div");
    gL.className = "ghd-name", gL.textContent = gq.full_name || gq.username;
    if (gq.is_verified) {
      const gX = document.createElement("span");
      gX.className = "ghd-ver", gX.textContent = " ✓", gL.appendChild(gX);
    }
    const gO = document.createElement("div");
    return gO.className = "ghd-user", gO.textContent = "@" + gq.username + (gq.is_private ? " · " + Y("private") : ""), 
    gz.append(gL, gO), gx.appendChild(gz), gx;
  }
  function tb(gq, gx) {
    const gz = gq._users || [], gL = ghdNorm(String(gx || "").replace(/^@+/, "").trim()), gO = gL ? gz.filter(gX => ghdMatch(gX, gL)) : gz;
    gq.innerHTML = "";
    if (!gO.length) {
      const gX = document.createElement("div");
      gX.className = "dos-note", gX.textContent = Y("dos_rel_nomatch"), gq.appendChild(gX);
      return;
    }
    gO.forEach(gJ => gq.appendChild(tw(gJ)));
    if (!gL && gq._incomplete) {
      const gJ = document.createElement("div");
      gJ.className = "dos-note", gJ.textContent = Y("dos_rel_more", String(gz.length)), 
      gq.appendChild(gJ);
    }
  }
  function tm(gq, gx) {
    if (gq && gq._users) tb(gq, gx);
  }
  async function tV(gq, gx) {
    const gz = b && b.querySelector(".dos-rel-sec");
    if (!gz) return;
    const gL = gz.querySelector(".dos-rel-list"), gO = gz.querySelector(".dos-rel-search"), gX = gz.querySelector(".dos-rel-hint");
    if (gX) gX.style.display = "none";
    if (gO) gO.style.display = "none";
    gL._users = null, gL.innerHTML = "";
    const gJ = document.createElement("div");
    gJ.className = "dos-note", gJ.textContent = Y("dos_rel_loading"), gL.appendChild(gJ);
    const gF = gz.querySelector(".dos-sec-h");
    if (gF) gF.textContent = gx === "followers" ? Y("dos_see_followers") : Y("dos_see_following");
    try {
      const gl = gx === "followers" ? await k.fetchFollowersOf(gq.pk, null, 3) : await k.fetchFollowingOf(gq.pk, null, 3), gc = gl.users || [];
      if (!gc.length) {
        gL.innerHTML = "";
        const gS = document.createElement("div");
        gS.className = "dos-note", gS.textContent = Y("dos_rel_empty"), gL.appendChild(gS);
        return;
      }
      gL._users = gc, gL._incomplete = !gl.complete, tb(gL, ""), gO && (gO.style.display = "block", 
      gO.value = "");
    } catch (gC) {
      gL.innerHTML = "";
      const gU = document.createElement("div");
      gU.className = "dos-note", gU.textContent = gC && (gC.kind === "auth" || gC.kind === "http") ? Y("dos_rel_empty") : Y("dos_err"), 
      gL.appendChild(gU);
    }
  }
  let tn = null;
  function tD() {
    if (tn) return;
    tn = document.createElement("div"), tn.id = "ghd-relview", m.appendChild(tn);
  }
  function tP() {
    tn && (tn.classList.remove("show"), tn.innerHTML = "");
  }
  function ghdPhotoPair(gq) {
    const gx = g.get(J.photoArchive, {})[gq.pk] || [];
    const gz = gx.filter(gO => gO.kind === "avatar" && gO.dataUrl);
    const gX = gz.filter(gJ => gJ.ts < gq.ts - 1e4);
    const gF = gz.filter(gl => gl.ts >= gq.ts - 1e4);
    const gO2 = gX.length ? gX[gX.length - 1].dataUrl : gq.before || "";
    const gL = gF.length ? gF[0].dataUrl : gq.after || gq.pic || "";
    return {
      antes: gO2,
      ahora: gL
    };
  }
  function ghdPhotoView(gq) {
    const gx = ghdPhotoPair(gq);
    if (!gx.antes && !gx.ahora) return;
    tD();
    tn.classList.add("show");
    tn.innerHTML = "";
    const gz = document.createElement("div");
    gz.className = "ghd-cmp-head";
    gz.textContent = "@" + (gq.username || "");
    tn.appendChild(gz);
    const gL = document.createElement("div");
    gL.className = "ghd-cmp";
    const gNone = () => {
      const gS = document.createElement("div");
      gS.className = "ghd-cmp-none", gS.textContent = "—";
      return gS;
    };
    const gO = (gX, gJ) => {
      const gF = document.createElement("div");
      gF.className = "ghd-cmp-side";
      const gl = document.createElement("span");
      gl.className = "ghd-cmp-lb", gl.textContent = gJ;
      if (gX) {
        const gc = document.createElement("img");
        gc.referrerPolicy = "no-referrer";
        gc.onerror = function() {
          if (!gc._bg && /cdninstagram|fbcdn/.test(String(gX))) {
            gc._bg = true;
            tc(gq.pk, gX, "avatar", "@" + (gq.username || "")).then(function(gR) {
              if (gR && gR.dataUrl) gc.src = gR.dataUrl; else gc.onerror();
            }).catch(function() {
              gc.onerror();
            });
            return;
          }
          gc.remove(), gF.insertBefore(gNone(), gF.firstChild);
        };
        gc.addEventListener("click", () => ts(gc.src || gX)), gc.src = gX, gF.appendChild(gc);
      } else gF.appendChild(gNone());
      return gF.appendChild(gl), gF;
    };
    gL.append(gO(gx.antes, Y("cmp_before")), gO(gx.ahora, Y("cmp_after"))), tn.appendChild(gL);
    const gC = document.createElement("button");
    gC.className = "dos-close-btn", gC.textContent = Y("close"), gC.addEventListener("click", tP), 
    tn.appendChild(gC);
  }
  function ta(gq) {
    gq && gq.newFollowers && gq.newFollowers.length ? tE("followers", {
      pk: gq.pk,
      cached: gq.newFollowers,
      title: Y("new_followers_title"),
      subtitle: "@" + (gq.username || "")
    }) : tE("followers", {
      pk: gq.pk,
      subtitle: "@" + (gq.username || "")
    });
  }
  function tA(gq) {
    gq && gq.lostFollowers && gq.lostFollowers.length ? tE("followers", {
      pk: gq.pk,
      cached: gq.lostFollowers,
      title: Y("lost_followers_title"),
      subtitle: "@" + (gq.username || "")
    }) : tE("followers", {
      pk: gq.pk,
      subtitle: "@" + (gq.username || "")
    });
  }
  async function tE(gq, gx) {
    gx = gx || {}, tD(), tn.classList.add("show"), tn.innerHTML = "";
    const gz = document.createElement("div");
    gz.className = "dos-head";
    const gL = document.createElement("div");
    gL.className = "dos-hi";
    const gO = document.createElement("div");
    gO.className = "dos-name", gO.textContent = gx.title || (gq === "followers" ? Y("dos_see_followers") : Y("dos_see_following"));
    const gX = document.createElement("div");
    gX.className = "dos-user", gX.textContent = gx.subtitle || "", gL.append(gO, gX);
    const gJ = document.createElement("button");
    gJ.className = "dos-x", gJ.textContent = "×", gJ.title = Y("close"), gJ.onclick = tP, 
    gz.append(gL, gJ);
    const gF = document.createElement("input");
    gF.className = "dos-rel-search", gF.placeholder = Y("dos_rel_search"), gF.autocomplete = "off", 
    gF.spellcheck = false;
    const gl = document.createElement("div");
    gl.className = "dos-rel-list", gF.addEventListener("input", () => tb(gl, gF.value)), 
    tn.append(gz, gF, gl);
    let gc = gx.cached, gS = false;
    if (!gc) {
      gF.style.display = "none";
      const gC = document.createElement("div");
      gC.className = "dos-note", gC.textContent = Y("dos_rel_loading"), gl.appendChild(gC);
      try {
        const gU = await (gq === "followers" ? k.fetchFollowersOf : k.fetchFollowingOf)(gx.pk, function(n, us) {
          if (!us || !us.length) return;
          gF.style.display = "";
          gl._users = us;
          gl._incomplete = true;
          tb(gl, gF.value);
        }, 6);
        gc = gU.users || [], gS = !gU.complete;
      } catch (gj) {
        gl.innerHTML = "";
        const gy = document.createElement("div");
        gy.className = "dos-note", gy.textContent = gj && (gj.kind === "auth" || gj.kind === "http") ? Y("dos_rel_empty") : Y("dos_err"), 
        gl.appendChild(gy);
        return;
      }
      gF.style.display = "";
    }
    if (!gc.length) {
      gl.innerHTML = "";
      const gH = document.createElement("div");
      gH.className = "dos-note", gH.textContent = Y("dos_rel_empty"), gl.appendChild(gH), 
      gF.style.display = "none";
      return;
    }
    gl._users = gc, gl._incomplete = gS, tb(gl, "");
    try {
      gF.focus();
    } catch (gR) {}
  }
  function tp(gq) {
    b.innerHTML = "";
    const gx = document.createElement("div");
    gx.className = "dos-head";
    const gz = tQ(gq);
    gz.style.cursor = "pointer", gz.title = Y("dos_openpic"), gz.addEventListener("click", () => tM(gq));
    const gL = document.createElement("div");
    gL.className = "dos-hi";
    const gO = document.createElement("div");
    gO.className = "dos-name", gO.textContent = gq.full_name || gq.username;
    if (gq.is_verified) {
      const gQ = document.createElement("span");
      gQ.className = "ghd-ver", gQ.textContent = " ✓", gO.appendChild(gQ);
    }
    const gX = tC("https://www.instagram.com/" + gq.username + "/", "@" + gq.username + (gq.is_private ? " · " + Y("private") : ""));
    gX.className = "dos-user";
    const gJ = document.createElement("div");
    gJ.className = "dos-tags";
    if (gq.is_business || gq.is_pro) {
      const gZ = document.createElement("span");
      gZ.className = "dos-badge", gZ.textContent = gq.category || Y("dos_business"), gJ.appendChild(gZ);
    }
    if (gq.pronouns) {
      const gi = document.createElement("span");
      gi.className = "dos-badge gray", gi.textContent = gq.pronouns, gJ.appendChild(gi);
    }
    gL.append(gO, gX, gJ);
    const gF = document.createElement("button");
    gF.className = "dos-exp", gF.textContent = "⤢", gF.title = Y("big_mode"), gF.onclick = Yo;
    const gl = document.createElement("button");
    gl.className = "dos-x", gl.textContent = "×", gl.title = Y("close"), gl.onclick = t9, 
    gx.append(gz, gL, gF, gl), b.appendChild(gx);
    const gc = document.createElement("div");
    gc.className = "dos-actions";
//#plus-off descargas: sin "descargar foto". El boton se crea AQUI DENTRO:
//          dejarlo fuera lo pintaba igual, vacio y sin estilo, como un
//          rectangulo gris al principio de la fila.
    const gS = document.createElement("button");
    gS.className = "dos-act primary", gS.textContent = Y("dos_download"), gS.onclick = () => tf(gq, gS);
//#plus-on
    const gC = document.createElement("button");
    gC.className = "dos-act", gC.textContent = Y("dos_openpic"), gC.onclick = () => tM(gq);
    const gU = document.createElement("button");
    gU.className = "dos-act", gU.textContent = Y("dos_copyid"), gU.onclick = () => {
      navigator.clipboard.writeText(gq.pk).then(() => {
        gU.textContent = Y("dos_copied");
      }).catch(() => {});
    };
//#plus-off modo fantasma: boton del expediente
    const gj = document.createElement("button");
    gj.className = "dos-act ghost", gj.textContent = Y("dos_ghost"), gj.title = Y("dos_ghost_hint"), 
    gj.onclick = () => tg(gq), gc.append(gS, gC, gU, gj);
//#plus-on
    gc.append(gC, gU);
//#plus-off punto de mira: boton de vigilar en el expediente
    if (gq.pk && gq.pk !== O) {
      const gf = document.createElement("button");
      gf.className = "dos-act";
      const gs = () => {
        const gM = Y6().some(gd => gd.pk === gq.pk);
        gf.classList.toggle("watching", gM), gf.textContent = gM ? Y("dos_watching") : Y("dos_watch");
      };
      gf.onclick = async () => {
        if (gf.disabled) return;
        gf.disabled = true;
        try {
          if (Y6().some(gM => gM.pk === gq.pk)) await t2(gq.pk); else await t5({
            pk: gq.pk,
            username: gq.username,
            full_name: gq.full_name,
            pic: gq.pic,
            is_private: gq.is_private,
            is_verified: gq.is_verified
          });
        } finally {
          gf.disabled = false;
          gs();
        }
      }, gs(), gc.appendChild(gf);
    }
//#plus-on
    if (gq.username) {
      const gM = tU("https://www.tiktok.com/@" + encodeURIComponent(gq.username), Y("dos_tiktok"));
      gc.appendChild(gM);
      const gd = tU("https://www.tiktok.com/search/user?q=" + encodeURIComponent(gq.username), Y("dos_tiktok_search"));
      gc.appendChild(gd);
    }
    b.appendChild(gc);
    const gy = document.createElement("div");
    gy.className = "dos-stats", gy.append(tj(gq.posts, Y("dos_posts")), tj(gq.followers, Y("chip_followers"), () => tE("followers", {
      pk: gq.pk,
      subtitle: "@" + (gq.username || "")
    })), tj(gq.following, Y("chip_following"), () => tE("following", {
      pk: gq.pk,
      subtitle: "@" + (gq.username || "")
    }))), b.appendChild(gy);
    const gH = document.createElement("div");
    gH.className = "dos-body";
    const gR = tS(Y("dos_profile"));
    if (gq.bio) {
      const gw = document.createElement("div");
      gw.className = "dos-bio", gw.appendChild(tR(gq.bio)), gR.appendChild(gw);
    }
    if (gq.external_url) gR.appendChild(tH(Y("dos_web"), tC(gq.external_url, gq.external_url)));
    (gq.bio_links || []).forEach(gb => {
      if (gb !== gq.external_url) gR.appendChild(tH(Y("dos_link"), tC(gb, gb)));
    }), gR.appendChild(tH(Y("dos_id"), gq.pk));
    if (gq.category) gR.appendChild(tH(Y("dos_category"), gq.category));
    gH.appendChild(gR);
    if (gq.public_email || gq.public_phone || gq.address) {
      const gb = tS(Y("dos_contact"));
      if (gq.public_email) gb.appendChild(tH(Y("dos_email"), tC("mailto:" + gq.public_email, gq.public_email)));
      if (gq.public_phone) gb.appendChild(tH(Y("dos_tel"), tC("tel:" + gq.public_phone.replace(/\s/g, ""), gq.public_phone)));
      if (gq.address) {
        const gm = gq.lat && gq.lng ? tC("https://maps.google.com/?q=" + gq.lat + "," + gq.lng, gq.address) : gq.address;
        gb.appendChild(tH(Y("dos_address"), gm));
      }
      gH.appendChild(gb);
    }
    if (gq.highlights && gq.highlights.length) {
      const gV = tS(Y("dos_highlights")), gn = document.createElement("div");
      gn.className = "dos-hl-strip", gn.addEventListener("wheel", gD => {
        if (gn.scrollWidth <= gn.clientWidth) return;
        gD.preventDefault(), gn.scrollLeft += gD.deltaY || gD.deltaX;
      }, {
        passive: false
      }), gq.highlights.forEach(gD => {
        const gP = gD.covers && gD.covers.length ? gD.covers : gD.cover ? [ gD.cover ] : [], ga = k.mediaSig(gP[0] || ""), gA = "https://www.instagram.com/stories/highlights/" + String(gD.id).replace("highlight:", "") + "/", gE = document.createElement("div");
        gE.className = "dos-hl-item";
        const gp = () => {
          const gN = window.open("", "_blank"), gv = gT => {
            if (gN) gN.location.href = gT; else window.open(gT, "_blank", "noopener");
          };
          (async () => {
            try {
              const gB = await k.fetchHighlightFull(gD.id, gD.mediaId, ga);
              if (gB) {
                gv(gB);
                return;
              }
            } catch (gG) {}
            const gT = gP[0];
            if (gT) {
              const gI = gT.replace(/s\d{2,4}x\d{2,4}/g, "s1080x1080");
              if (gI !== gT) try {
                const gW = await chrome.runtime.sendMessage({
                  type: "fetchImage",
                  url: gI
                });
                if (gW && gW.dataUrl) {
                  gv(gW.dataUrl);
                  return;
                }
              } catch (k0) {}
              gv(gT);
              return;
            }
            gv(gA);
          })();
        }, ge = document.createElement("div");
        ge.className = "dos-hl-av", ge.style.cursor = "pointer", ge.addEventListener("click", () => tz(gq, gD, gp)), 
        tZ(ge, gP, gD.title);
        const gu = document.createElement("span");
        gu.className = "dos-hl-label", gu.textContent = gD.title || "";
        const go = document.createElement("button");
        go.type = "button", go.className = "dos-hl-save", go.textContent = Y("dos_save"), 
        go.title = Y("dos_save_hint"), go.addEventListener("click", async () => {
          go.disabled = true, go.textContent = Y("dos_saving");
          const gN = [];
          try {
            const gT = await k.fetchHighlightFull(gD.id, gD.mediaId, ga);
            if (gT) gN.push(gT);
          } catch (gB) {}
          if (gP[0]) {
            const gG = gP[0].replace(/s\d{2,4}x\d{2,4}/g, "s1080x1080");
            if (gG !== gP[0]) gN.push(gG);
            gN.push(gP[0]);
          }
          let gv = {
            ok: false,
            dataUrl: ""
          };
          for (const gI of gN) {
            gv = await tc(gq.pk, gI, "highlight", gD.title || Y("dos_highlights"));
            if (gv.dataUrl) break;
          }
          go.textContent = gv.ok ? Y("dos_saved") : Y("dos_saved_already"), go.disabled = false;
//#plus-off descargas: no se abre la portada para guardarla
          if (gv.dataUrl) tL(gq, gD, gv.dataUrl); else gp();
//#plus-on
          gp();
        }), gE.append(ge, gu, go), gn.appendChild(gE);
      }), gV.appendChild(gn), gH.appendChild(gV);
    }
    const gh = tl(gq.pk);
    if (gh.length) {
      const gD = tS(Y("dos_photo_history")), gP = document.createElement("div");
      gP.className = "dos-arch-grid", gh.slice().reverse().forEach(ga => {
        const gA = document.createElement("div");
        gA.className = "dos-arch", gA.style.cursor = "pointer";
        const gE = document.createElement("img");
        gE.src = ga.dataUrl, gA.appendChild(gE);
        const gp = document.createElement("span");
        gp.className = "dos-arch-cap", gp.textContent = T(ga.ts), gA.appendChild(gp);
        if (ga.kind === "highlight") {
          const ge = document.createElement("span");
          ge.className = "dos-arch-tag", ge.textContent = "★", ge.title = ga.label || "", 
          gA.appendChild(ge);
        }
        gA.addEventListener("click", () => ts(ga.dataUrl)), gP.appendChild(gA);
      }), gD.appendChild(gP), gH.appendChild(gD);
    }
    if (gq.posts_list && gq.posts_list.length && Number(gq.followers) > 0) {
      const ga = gq.posts_list.filter(gA => typeof gA.likes === "number");
      if (ga.length >= 3) {
        const gA = tS(Y("dos_engagement")), gE = document.createElement("div");
        gE.className = "dos-eng";
        const gp = document.createElement("div");
        gp.className = "dos-eng-top";
        const ge = document.createElement("div");
        ge.className = "dos-eng-sub";
        if (ga.some(gu => gu.likesHidden)) gp.innerHTML = '<span class="dos-eng-lvl hidden">' + g7(Y("eng_hidden")) + "</span>", 
        ge.textContent = Y("eng_hidden_sub"); else {
          const gu = Math.round(ga.reduce((gT, gB) => gT + (gB.likes || 0), 0) / ga.length), go = Math.round(ga.reduce((gT, gB) => gT + (gB.comments || 0), 0) / ga.length), gN = (gu + go) / Number(gq.followers) * 100, gv = gN >= 6 ? "fire" : gN >= 3 ? "good" : gN >= 1 ? "ok" : "low";
          gp.innerHTML = "<b>" + gN.toFixed(1) + '%</b><span class="dos-eng-lvl ' + gv + '">' + g7(Y("eng_" + gv)) + "</span>", 
          ge.textContent = Y("dos_eng_avg", [ gu.toLocaleString(), go.toLocaleString() ]);
        }
        gE.append(gp, ge), gA.appendChild(gE), gH.appendChild(gA);
      }
    }
    if (!gq.posts_list || !gq.posts_list.length) {
      const gT0 = tS(Y("dos_posts_sec"));
      const gN0 = document.createElement("div");
      gN0.className = "dos-note";
      gN0.textContent = gq.posts_pending ? Y("dos_loading") : gq.posts_err ? gq.posts_err : Y("dos_posts_none") + (gq.is_private ? " · " + Y("private") : "");
      gT0.appendChild(gN0);
      gH.appendChild(gT0);
    }
    if (gq.posts_list && gq.posts_list.length) {
      const gT = tS(Y("dos_posts_sec")), gB = document.createElement("div");
      gB.className = "dos-post-grid";
      const gG = gI => {
        const gW = document.createElement("div");
        gW.className = "dos-post";
        const k0 = document.createElement("img");
        k0.referrerPolicy = "no-referrer", k0.loading = "lazy", gW.appendChild(k0), ti(k0, [ gI.thumb, gI.thumbAlt, gI.full ], () => {
          k0.remove(), gW.classList.add("dos-post-empty");
        });
        if (gI.isVideo) {
          const k3 = document.createElement("span");
          k3.className = "dos-post-badge", k3.textContent = "▶", gW.appendChild(k3);
        } else if (gI.multi) {
          const k4 = document.createElement("span");
          k4.className = "dos-post-badge", k4.textContent = "▦", gW.appendChild(k4);
        }
        const k1 = document.createElement("div");
        k1.className = "dos-post-meta", k1.textContent = (gI.likesHidden ? "♥ —" : "♥ " + Number(gI.likes).toLocaleString()) + "   💬 " + Number(gI.comments).toLocaleString(), 
        gW.appendChild(k1);
//#plus-off descargas: se ve la publicacion, no se baja
        const k2 = document.createElement("button");
        k2.type = "button", k2.className = "dos-post-dl", k2.textContent = "⭳", k2.title = Y("dos_download"), 
        k2.addEventListener("click", k5 => {
          k5.stopPropagation(), td(gI, k2);
        }), gW.appendChild(k2),
//#plus-on
        gW.addEventListener("click", () => tx(gq, gq.posts_list.indexOf(gI))), 
        gB.appendChild(gW);
      };
      gq.posts_list.forEach(gG), gT.appendChild(gB);
      if (gq.posts_next) {
        const gI = document.createElement("button");
        gI.type = "button", gI.className = "dos-more", gI.textContent = Y("dos_more"), gI.addEventListener("click", async () => {
          if (!gq.posts_next) {
            gI.remove();
            return;
          }
          gI.disabled = true, gI.textContent = Y("dos_loading_more");
          try {
            const gW = await k.fetchUserPostsPage(gq.pk, 24, gq.posts_next);
            (gW.posts || []).forEach(gG), gq.posts_list = gq.posts_list.concat(gW.posts || []), 
            gq.posts_next = gW.next;
          } catch (k0) {}
          gI.disabled = false;
          if (gq.posts_next) gI.textContent = Y("dos_more"); else gI.remove();
        }), gT.appendChild(gI);
      }
      gH.appendChild(gT);
    }
    const gK = tS(Y("dos_history"));
    gK.appendChild(th(gq.pk, gq));
    const gr = g.get(J.activity, []).filter(gW => gW.pk === gq.pk);
    if (gr.length) {
      const gW = [ {
        key: "all",
        label: Y("dos_filter_all"),
        types: null
      }, {
        key: "media",
        label: "📷",
        types: [ "photo" ]
      }, {
        key: "story",
        label: "📖",
        types: [ "story" ]
      }, {
        key: "follows",
        label: "➕➖",
        types: [ "follow_add", "follow_rem" ]
      }, {
        key: "followers",
        label: "📈📉",
        types: [ "followers_up", "followers_down" ]
      }, {
        key: "profile",
        label: "✏️",
        types: [ "bio", "name", "username", "link" ]
      } ], k0 = document.createElement("div");
      k0.className = "dos-tl-filters";
      const k1 = document.createElement("div");
      k1.className = "dos-timeline";
      const k2 = k3 => {
        k1.innerHTML = "";
        const k4 = gr.filter(k6 => !k3.types || k3.types.indexOf(k6.type) !== -1).slice(0, 60);
        if (!k4.length) {
          const k6 = document.createElement("div");
          k6.className = "dos-note", k6.textContent = Y("dos_history_empty"), k1.appendChild(k6);
          return;
        }
        let k5 = "";
        k4.forEach(k7 => {
          const k8 = t1(k7.ts);
          if (k8 !== k5) {
            const kg = document.createElement("div");
            kg.className = "dos-tl-day", kg.textContent = k8, k1.appendChild(kg), k5 = k8;
          }
          const k9 = document.createElement("div");
          k9.className = "dos-tl-row";
          const kY = document.createElement("span");
          kY.className = "dos-tl-ic", kY.textContent = t0(k7.type);
          const kt = document.createElement("span");
          kt.className = "dos-tl-tx", kt.textContent = YW(k7), k9.append(kY, kt);
          if (k7.type === "followers_up") k9.classList.add("dos-tl-click"), k9.addEventListener("click", () => ta(k7)); else if (k7.type === "followers_down") k9.classList.add("dos-tl-click"), 
          k9.addEventListener("click", () => tA(k7)); else (k7.type === "follow_add" || k7.type === "follow_rem") && k7.target && k7.target.pk && (k9.classList.add("dos-tl-click"), 
          k9.addEventListener("click", () => te(k7.target)));
          k1.appendChild(k9);
        });
      };
      gW.forEach((k3, k4) => {
        if (k3.types && !gr.some(k6 => k3.types.indexOf(k6.type) !== -1)) return;
        const k5 = document.createElement("button");
        k5.type = "button", k5.className = "dos-tl-filter", k5.textContent = k3.label;
        if (k4 === 0) k5.classList.add("active");
        k5.addEventListener("click", () => {
          k0.querySelectorAll(".dos-tl-filter").forEach(k6 => k6.classList.remove("active")), 
          k5.classList.add("active"), k2(k3);
        }), k0.appendChild(k5);
      }), k2(gW[0]), gK.append(k0, k1);
    } else {
      const k3 = document.createElement("div");
      k3.className = "dos-note", k3.textContent = Y("dos_history_empty"), gK.appendChild(k3);
    }
    gH.appendChild(gK), b.appendChild(gH);
  }
  async function te(gq) {
    if (!L || !gq || !gq.pk) return;
    t8(), b.classList.add("show"), b.innerHTML = '<div class="dos-loading">' + Y("dos_loading") + "</div>";
    try {
      let gx = null, gz = null;
      for (let gJ = 0; gJ < 3; gJ++) try {
        gx = await k.fetchDossier(gq.pk, gq.username);
        break;
      } catch (gF) {
        if (gF && gF.kind === "rate") throw gF;
        gz = gF, await new Promise(gl => setTimeout(gl, 400 + gJ * 500));
      }
      if (!gx) throw gz || new Error("dossier_failed");
      gx.pic_row = gq.pic || "";
      if (!gx.username && gq.username) gx.username = gq.username;
      if (!gx.full_name && gq.full_name) gx.full_name = gq.full_name;
      gx.highlights = [];
      gx.posts_list = [];
      gx.posts_next = null;
      gx.posts_err = "";
      gx.posts_pending = true;
      tp(gx);
      const gPar = await Promise.all([ k.fetchHighlights(gq.pk).catch(() => []), k.fetchUserPostsPage(gq.pk, 12, null, gx.username || gq.username).catch(gEp => {
        console.warn("[Ghoosted] publicaciones:", gEp);
        const gEk = gEp && gEp.kind || "";
        const gEw = gEk === "rate" && k.rateLeftMs ? Math.ceil(k.rateLeftMs() / 6e4) : 0;
        const gEm = gEk === "rate" ? gEw ? Y("err_rate_wait", String(gEw)) : Y("gh_err_rate") : gEk === "auth" ? Y("dos_err_auth") : gEk === "challenge" ? Y("status_challenge", String(gEp.status || "")) : gEk ? gEk + (gEp.status ? " " + gEp.status : "") : "error";
        return {
          posts: [],
          next: null,
          err: gEm
        };
      }) ]);
      if (!b || !b.classList.contains("show")) return;
      gx.highlights = gPar[0];
      const gL = gPar[1];
      gx.posts_err = gL && gL.err || "";
      gx.posts_list = gL.posts, gx.posts_next = gL.next;
      gx.posts_pending = false;
      const gO = g.get(J.spyCounts, {})[gx.pk] || [], gX = gO.length ? gO[gO.length - 1].followers : null;
      tO(gx), tc(gx.pk, gx.pic_hd || gx.pic || gq.pic, "avatar", "@" + (gx.username || "")).catch(() => {});
      setTimeout(function() {
        try {
          tF(gx, gX);
        } catch (e) {}
      }, 4e3);
      try {
        const gl = g.get(J.profileSnapshots, {}), gc = gl[gx.pk] || {}, gS = gx.external_url || "";
        typeof gc.ext_url === "string" && gc.ext_url !== gS && gS && Yt({
          type: "link",
          ts: Date.now(),
          pk: gx.pk,
          username: gx.username || "",
          full_name: gx.full_name || "",
          pic: gx.pic || "",
          key: "link:" + gx.pk + ":" + gS
        }), gc.ext_url = gS, gl[gx.pk] = gc, g.set(J.profileSnapshots, gl);
      } catch (gC) {}
      tp(gx);
    } catch (gU) {
      b.innerHTML = "";
      const gj = document.createElement("div");
      gj.className = "dos-loading", gj.textContent = gU && gU.kind === "auth" ? Y("dos_err_auth") : Y("dos_err");
      try {
        console.error("[Ghoosted] expediente", gU);
      } catch (e0) {}
      if (gU) {
        const gDbg = document.createElement("div");
        gDbg.className = "dos-note dos-dbg";
        const gSt = String(gU.stack || "").split("\n").slice(1, 2).join("").trim().slice(0, 120);
        gDbg.textContent = [ gU.kind, gU.status ? "HTTP " + gU.status : "", gU.name && gU.name !== "Error" ? gU.name : "", String(gU.message || gU.reason || "").slice(0, 120), gSt ].filter(Boolean).join(" · ");
        b.appendChild(gDbg);
      }
      const gy = document.createElement("button");
      gy.className = "dos-close-btn", gy.textContent = Y("close"), gy.onclick = t9, b.append(gj, gy);
    }
  }
  function tu() {
    const gq = document.createElement("button");
    gq.id = "ghd-sel-fab", gq.title = Y("sel_investigate"), gq.innerHTML = Yr(), gq.style.display = "none", 
    document.body.appendChild(gq);
    let gx = "", gT = 0;
    const gz = () => {
      clearTimeout(gT), gq.style.display = "none", gx = "";
    };
    gq.addEventListener("mousedown", gO => {
      gO.preventDefault(), gO.stopPropagation();
    }), gq.addEventListener("click", gO => {
      gO.preventDefault(), gO.stopPropagation();
      const gX = gx;
      gz();
      if (gX) to(gX);
    });
    function gL() {
      const gO = window.getSelection();
      if (!gO || gO.isCollapsed || !gO.rangeCount) {
        gz();
        return;
      }
      const gX = gO.anchorNode, gJ = gX && (gX.nodeType === 1 ? gX : gX.parentElement);
      if (gJ && gJ.closest && gJ.closest("#ghd-panel, #ghd-sel-fab, input, textarea")) {
        gz();
        return;
      }
      const gF = gO.toString().trim().match(/^@?([a-zA-Z0-9._]{2,30})$/);
      if (!gF) {
        gz();
        return;
      }
      gx = gF[1];
      try {
        const gl = gO.getRangeAt(0).getBoundingClientRect();
        if (!gl.width && !gl.height) {
          gz();
          return;
        }
        if (!document.body.contains(gq)) document.body.appendChild(gq);
        gq.style.display = "flex", gq.style.left = Math.min(window.innerWidth - 46, Math.max(6, gl.right + 6)) + "px", 
        gq.style.top = Math.max(6, gl.top - 8) + "px";
      } catch (gc) {
        gz();
      }
    }
    const gR = () => {
      clearTimeout(gT), gT = setTimeout(gL, 80);
    };
    document.addEventListener("mouseup", gR, true), document.addEventListener("keyup", gR, true), 
    document.addEventListener("selectionchange", gR), window.addEventListener("scroll", gL, true);
  }
  async function to(gq) {
    const gx = String(gq || "").replace(/^@+/, "").trim();
    if (!gx) return;
    Ye(), t8(), b.classList.add("show"), b.innerHTML = '<div class="dos-loading">' + Y("dos_loading") + "</div>";
    try {
      const gz = await k.fetchUserByUsername(gx);
      te(gz);
    } catch (gL) {
      b.innerHTML = "";
      const gO = document.createElement("div");
      const gK = gL && gL.kind;
      gO.className = "dos-loading", gO.textContent = gK === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : gK === "auth" ? Y("dos_err_auth") : gK === "challenge" ? Y("status_challenge", String(gL.status || "")) : gK === "http" ? Y("status_watch_notfound") : Y("dos_err");
      const gX = document.createElement("button");
      gX.className = "dos-close-btn", gX.textContent = Y("close"), gX.onclick = t9, b.append(gO, gX);
    }
  }
  function ghdSugg(inp, onPick) {
    const box = document.createElement("div");
    box.className = "ghd-sugg";
    const mount = function() {
      if (box.parentElement) return true;
      const row = inp.parentElement;
      if (!row) return false;
      row.insertAdjacentElement("afterend", box);
      return true;
    };
    let tm = null, seq = 0;
    const hide = function() {
      box.innerHTML = "";
      box.classList.remove("show");
    };
    inp.addEventListener("input", function() {
      if (!mount()) return;
      const q = String(inp.value || "").replace(/^@+/, "").trim();
      clearTimeout(tm);
      if (q.length < 2) {
        hide();
        return;
      }
      const my = ++seq;
      const note = function(txt) {
        box.innerHTML = "";
        const nd = document.createElement("div");
        nd.className = "ghd-sugg-note";
        nd.textContent = txt;
        box.appendChild(nd);
        box.classList.add("show");
      };
      note(Y("sugg_searching"));
      tm = setTimeout(async function() {
        let us = [], er = "";
        try {
          us = await k.searchUsers(q);
        } catch (e) {
          us = [];
          er = e && e.kind === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : "";
        }
        if (my !== seq) return;
        if (!us.length) {
          note(er || Y("sugg_none"));
          return;
        }
        box.innerHTML = "";
        box.classList.add("show");
        us.slice(0, 6).forEach(function(u) {
          const it = document.createElement("button");
          it.type = "button";
          it.className = "ghd-sugg-it";
          it.appendChild(YT(u, true));
          const inf = document.createElement("span");
          inf.className = "ghd-sugg-info";
          const b1 = document.createElement("b");
          b1.textContent = u.full_name || u.username;
          const s1 = document.createElement("span");
          s1.textContent = "@" + u.username + (u.is_private ? " · " + Y("private") : "");
          inf.append(b1, s1);
          it.appendChild(inf);
          it.addEventListener("click", function() {
            inp.value = "@" + u.username;
            onPick("@" + u.username, u);
            hide();
          });
          box.appendChild(it);
        });
      }, 260);
    });
    inp.addEventListener("keydown", function(ev) {
      if (ev.key === "Escape") hide();
    });
  }
  function tN() {
    const gq = document.createElement("section");
    gq.className = "ghd-activity-head";
    const gFoldAct = !!g.get(J.actCollapsed, false);
    const gHd = document.createElement("button");
    gHd.type = "button", gHd.className = "ghd-fold-h" + (gFoldAct ? " collapsed" : ""), 
    gHd.title = Y("fold_hint"), gHd.setAttribute("aria-expanded", gFoldAct ? "false" : "true");
    const gHt = document.createElement("span");
    gHt.className = "ghd-fold-tx", gHt.textContent = Y("activity_title");
    const gHc = document.createElement("span");
    gHc.className = "ghd-fold-car", gHc.textContent = "‹";
    gHd.append(gHt, gHc), gq.appendChild(gHd);
    const gx = document.createElement("div");
    gx.className = "ghd-act-body" + (gFoldAct ? " collapsed" : "");
    gHd.addEventListener("click", () => {
      const gN = !gx.classList.contains("collapsed");
      gx.classList.toggle("collapsed", gN), gHd.classList.toggle("collapsed", gN), gHd.setAttribute("aria-expanded", gN ? "false" : "true"), 
      g.set(J.actCollapsed, gN);
    });
    const gL = document.createElement("p");
    // El texto por defecto habla solo de TU cuenta, que es lo unico que hace
    // Plus. Pro lo sustituye por el largo, que menciona vigilar a terceros.
    let gDesc = Y("activity_desc_own");
//#plus-off punto de mira: la version que invita a anadir cuentas ajenas
    gDesc = Y("activity_desc");
//#plus-on
    gL.textContent = gDesc, gx.appendChild(gL), gq.appendChild(gx);
    if (g.get(J.activity, []).length) {
      const gCl = document.createElement("button");
      gCl.type = "button", gCl.className = "ghd-act-clear", gCl.textContent = Y("activity_clear");
      gCl.addEventListener("click", () => {
        if (gCl.dataset.armed) {
          g.set(J.activity, []), ghdToast(Y("activity_cleared")), g5();
          return;
        }
        gCl.dataset.armed = "1", gCl.classList.add("armed"), gCl.textContent = Y("activity_clear_confirm");
        setTimeout(() => {
          if (!gCl.isConnected) return;
          delete gCl.dataset.armed, gCl.classList.remove("armed"), gCl.textContent = Y("activity_clear");
        }, 3e3);
      }), gx.appendChild(gCl);
    }
//#plus-off punto de mira: buscador y lista de cuentas vigiladas
    const gO = document.createElement("div");
    gO.className = "ghd-watch-form";
    const gX = document.createElement("input");
    gX.className = "ghd-watch-input", gX.maxLength = 30, gX.autocomplete = "off", gX.spellcheck = false, 
    gX.placeholder = Y("activity_watch_placeholder"), gX.setAttribute("aria-label", Y("activity_watch_placeholder"));
    const gJ = document.createElement("button");
    gJ.className = "ghd-watch-btn", gJ.type = "button", gJ.textContent = Y("activity_watch_search");
    const gF = () => t3(gX.value, gJ);
    gJ.addEventListener("click", gF);
    const gl = document.createElement("div");
    gl.className = "ghd-sugg";
    const gc = new Set((g.get(J.following, {
      users: []
    }).users || []).map(gQ => gQ.pk));
    function gS(gQ) {
      gl.innerHTML = "";
      if (!gQ.length) {
        gl.classList.remove("show");
        return;
      }
      gl.classList.add("show"), gQ.forEach(gZ => {
        const gi = document.createElement("button");
        gi.type = "button", gi.className = "ghd-sugg-it", gi.appendChild(YT(gZ, true));
        const gf = document.createElement("span");
        gf.className = "ghd-sugg-info";
        const gs = document.createElement("b");
        gs.textContent = gZ.full_name || gZ.username;
        const gM = document.createElement("span");
        gM.textContent = "@" + gZ.username + (gZ.is_private ? " · " + Y("private") : ""), 
        gf.append(gs, gM), gi.appendChild(gf);
        if (gc.has(gZ.pk)) {
          const gd = document.createElement("span");
          gd.className = "ghd-sugg-badge", gd.textContent = Y("sugg_following"), gi.appendChild(gd);
        }
        gi.addEventListener("click", () => {
          gX.value = "@" + gZ.username, gl.innerHTML = "", gl.classList.remove("show"), Q = gZ, 
          g5();
        }), gl.appendChild(gi);
      });
    }
    function gNote(gQ) {
      gl.innerHTML = "";
      const gZ = document.createElement("div");
      gZ.className = "ghd-sugg-note", gZ.textContent = gQ, gl.appendChild(gZ), gl.classList.add("show");
    }
    async function gC() {
      const gQ = ghdNorm(gX.value.replace(/^@+/, "").trim());
      if (gQ.length < 2) {
        gS([]);
        return;
      }
      const gZ = g.get(J.following, {
        users: []
      }).users || [], gi = gZ.filter(gM => ghdMatch(gM, gQ)).slice(0, 6);
      gS(gi);
      if (!gi.length) gNote(Y("sugg_searching"));
      let gf = [], gEr = "";
      try {
        gf = await k.searchUsers(gQ);
      } catch (gM) {
        const gK = gM && gM.kind;
        gEr = gK === "rate" ? k.rateLeftMs && k.rateLeftMs() ? Y("err_rate_wait", String(Math.ceil(k.rateLeftMs() / 6e4))) : Y("gh_err_rate") : "";
      }
      if (gX.value.replace(/^@+/, "").trim().toLowerCase() !== gQ) return;
      const gs = new Set(gi.map(gd => gd.pk)), gAll = gi.concat(gf.filter(gd => !gs.has(gd.pk))).slice(0, 10);
      if (!gAll.length) {
        gNote(gEr || Y("sugg_none"));
        return;
      }
      gS(gAll);
    }
    gX.addEventListener("input", () => {
      clearTimeout(w), w = setTimeout(gC, 280);
    }), gX.addEventListener("keydown", gQ => {
      gQ.key === "Enter" && (gQ.preventDefault(), gl.classList.remove("show"), gF());
    }), gO.appendChild(gX), gO.appendChild(gJ), gx.appendChild(gO), gx.appendChild(gl);
    if (Q) {
      const gQ = document.createElement("div");
      gQ.className = "ghd-watch-preview", gQ.appendChild(YT(Q));
      const gZ = document.createElement("div");
      gZ.className = "ghd-watch-preview-info";
      const gi = document.createElement("b");
      gi.textContent = Q.full_name || Q.username;
      const gf = document.createElement("span");
      gf.textContent = "@" + Q.username + (Q.is_private ? " · " + Y("private") : ""), 
      gZ.append(gi, gf), gQ.appendChild(gZ);
      const gs = document.createElement("div");
      gs.className = "ghd-watch-preview-actions";
      const gM = document.createElement("button");
      gM.type = "button", gM.className = "ghd-watch-cancel", gM.textContent = Y("activity_watch_cancel"), 
      gM.addEventListener("click", () => {
        Q = null, g5();
      });
      const gd = document.createElement("button");
      gd.type = "button", gd.className = "ghd-watch-confirm", gd.textContent = Y("activity_watch_confirm"), 
      gd.addEventListener("click", () => t5(Q)), gs.append(gM, gd);
      if (L) {
        const gw = document.createElement("button");
        gw.type = "button", gw.className = "ghd-watch-cancel", gw.textContent = Y("dos_investigate"), 
        gw.addEventListener("click", () => te(Q)), gs.appendChild(gw);
      }
      gQ.appendChild(gs), gq.appendChild(gQ);
    }
    const gU = Y6();
    if (gU.length) {
      const gb = document.createElement("div");
      gb.className = "ghd-watch-list";
      const gm = !!g.get(J.watchCollapsed, false), gV = document.createElement("button");
      gV.type = "button", gV.className = "ghd-watch-label" + (gm ? " collapsed" : ""), 
      gV.setAttribute("aria-expanded", gm ? "false" : "true");
      const gn = document.createElement("span");
      gn.className = "ghd-watch-caret", gn.textContent = "▾";
      const gD = document.createElement("span");
      gD.className = "ghd-watch-label-tx", gD.textContent = Y("activity_manual", String(gU.length)), 
      gV.append(gn, gD);
      const gP = document.createElement("div");
      gP.className = "ghd-watch-cards" + (gm ? " collapsed" : ""), gV.addEventListener("click", () => {
        const ga = !gP.classList.contains("collapsed");
        gP.classList.toggle("collapsed", ga), gV.classList.toggle("collapsed", ga), gV.setAttribute("aria-expanded", ga ? "false" : "true"), 
        g.set(J.watchCollapsed, ga);
      }), gb.appendChild(gV), gU.forEach(ga => {
        const gA = document.createElement("div");
        gA.className = "ghd-watch-card", gA.dataset.pk = ga.pk;
        const gE = document.createElement("div");
        gE.className = "ghd-wc-top";
        const gp = document.createElement("a");
        gp.className = "ghd-watch-profile", gp.href = "https://www.instagram.com/" + encodeURIComponent(ga.username) + "/", 
        gp.target = "_blank", gp.rel = "noopener", gp.appendChild(YT(ga));
        const ge = document.createElement("span");
        ge.className = "ghd-watch-card-info";
        const gu = document.createElement("b");
        gu.textContent = ga.full_name || ga.username;
        const go = document.createElement("small");
        go.textContent = "@" + ga.username + (ga.is_private ? " · " + Y("private") : ""), 
        ge.append(gu, go), gp.appendChild(ge), gE.appendChild(gp);
        const gN = (g.get(J.spyFollowing, {}) || {})[ga.pk], gv = (g.get(J.watchStats, {}) || {})[ga.pk];
        if (gN && gN.ts) {
          const gW = document.createElement("span");
          gW.className = "ghd-wc-ago", gW.textContent = Y("wprof_updated", B(gN.ts)), gE.appendChild(gW);
        }
        const gT = document.createElement("button");
        gT.type = "button", gT.className = "ghd-watch-remove", gT.textContent = "×", gT.title = Y("activity_remove"), 
        gT.setAttribute("aria-label", Y("activity_remove") + " @" + ga.username), gT.addEventListener("click", () => t2(ga.pk)), 
        gE.appendChild(gT), gA.appendChild(gE);
        if (Yk(ga)) {
          if (gv) {
            const k1 = document.createElement("div");
            k1.className = "ghd-wc-stats";
            const k2 = (k3, k4) => {
              const k5 = document.createElement("div");
              k5.className = "ghd-wc-stat";
              const k6 = document.createElement("b");
              k6.textContent = Number.isFinite(k3) ? k3.toLocaleString() : "–";
              const k7 = document.createElement("span");
              return k7.textContent = k4, k5.append(k6, k7), k5;
            };
            k1.appendChild(k2(gv.followers, Y("wprof_followers"))), k1.appendChild(k2(gv.following, Y("wprof_following"))), 
            gA.appendChild(k1);
          } else Y8(ga.pk);
          const k0 = Y9(ga.pk, 8);
          if (k0.length) {
            const k3 = document.createElement("div");
            k3.className = "ghd-wc-recent";
            const k4 = document.createElement("div");
            k4.className = "ghd-wc-recent-label", k4.textContent = Y("wprof_recent"), k3.appendChild(k4);
            const k5 = document.createElement("div");
            k5.className = "ghd-wc-recent-row", k0.slice(0, 3).forEach(k6 => {
              const k7 = document.createElement("a");
              k7.className = "ghd-wc-recent-av", k7.href = "https://www.instagram.com/" + encodeURIComponent(k6.username) + "/", 
              k7.target = "_blank", k7.rel = "noopener", k7.title = "@" + k6.username, k7.appendChild(YT(k6)), 
              k5.appendChild(k7);
            });
            if (k0.length > 3) {
              const k6 = document.createElement("div");
              k6.className = "ghd-wc-recent-more", k6.textContent = "+" + (k0.length - 3), k5.appendChild(k6);
            }
            k3.appendChild(k5), gA.appendChild(k3);
          } else {
            const k7 = document.createElement("div");
            k7.className = "ghd-wc-hint", k7.textContent = Y("wprof_recent_none"), gA.appendChild(k7);
          }
        } else {
          const k8 = document.createElement("div");
          k8.className = "ghd-wc-hint", k8.textContent = Y("wprof_track_hint"), gA.appendChild(k8);
        }
        const gB = document.createElement("div");
        gB.className = "ghd-watch-toggles";
        const gG = document.createElement("button");
        gG.type = "button", gG.className = "ghd-wt" + (Yg(ga) ? " on" : ""), gG.textContent = Y("wt_story"), 
        gG.title = Y("watch_toggle_story"), gG.setAttribute("aria-pressed", Yg(ga) ? "true" : "false"), 
        gG.addEventListener("click", () => t4(ga.pk, "watchStory", !Yg(ga)));
        const gI = document.createElement("button");
        gI.type = "button", gI.className = "ghd-wt" + (Yk(ga) ? " on" : ""), gI.textContent = Y("wt_following"), 
        gI.title = Y("watch_toggle_following"), gI.setAttribute("aria-pressed", Yk(ga) ? "true" : "false"), 
        gI.addEventListener("click", () => t4(ga.pk, "watchFollowing", !Yk(ga))), gB.append(gG, gI);
        if (L) {
          const k9 = document.createElement("button");
          k9.type = "button", k9.className = "ghd-wt det on", k9.textContent = Y("wt_profile"), 
          k9.title = Y("dos_open"), k9.addEventListener("click", () => te(ga)), gB.appendChild(k9);
        }
        gA.appendChild(gB), gP.appendChild(gA);
      }), gb.appendChild(gP), gq.appendChild(gb);
    }
//#plus-on
    const gj = document.createElement("div");
    gj.className = "ghd-mutual";
    const gy = document.createElement("div");
    gy.className = "ghd-mutual-head", gy.textContent = Y("spy_check_title");
    const gH = document.createElement("div");
    gH.className = "ghd-mutual-row";
    const gR = document.createElement("input");
    gR.className = "ghd-mutual-in", gR.placeholder = Y("spy_a_ph"), gR.value = i, gR.maxLength = 30, 
    gR.autocomplete = "off", gR.spellcheck = false, gR.addEventListener("input", () => {
      i = gR.value;
    }), ghdSugg(gR, function(v) {
      i = v;
    }), gR.addEventListener("keydown", ga => {
      ga.key === "Enter" && (ga.preventDefault(), t7());
    });
    const gh = document.createElement("input");
    gh.className = "ghd-mutual-in", gh.placeholder = Y("spy_b_ph"), gh.value = f, gh.maxLength = 30, 
    gh.autocomplete = "off", gh.spellcheck = false, gh.addEventListener("input", () => {
      f = gh.value;
    }), ghdSugg(gh, function(v) {
      f = v;
    }), gh.addEventListener("keydown", ga => {
      ga.key === "Enter" && (ga.preventDefault(), t7());
    });
    const gK = document.createElement("button");
    gK.type = "button", gK.className = "ghd-mutual-btn", gK.textContent = d ? Y("spy_checking") : Y("spy_check_btn"), 
    gK.disabled = d, gK.addEventListener("click", t7), gH.append(gR, gh, gK);
    const gr = document.createElement("div");
    gr.className = "ghd-mutual-hint", gr.textContent = Y("spy_hint"), gj.append(gy, gr, gH);
    if (M) {
      const ga = document.createElement("div");
      ga.className = "ghd-mutual-result";
      if (M.err) ga.textContent = M.err, ga.classList.add("err"); else {
        const gA = "@" + M.aUser, gE = "@" + M.bUser, gp = (gu, go, gN, gW1, gW2, gVia) => {
          const gv = gN === true ? "spy_direction_yes" : gN === false ? "spy_direction_no" : "spy_direction_unknown", gT = document.createElement("div");
          gT.className = "dos-mutual-line";
          const gTx = document.createElement("span");
          gTx.textContent = Y(gv, [ gu, go ]), gT.appendChild(gTx);
          // Si la respuesta salio por la lista de seguidores del otro, se dice.
          if (gVia && gVia.via === "i" && gVia.v !== null) {
            const gVn = document.createElement("span");
            gVn.className = "ghd-mutual-via";
            gVn.textContent = Y("spy_via_followers", "@" + gVia.quien);
            gT.appendChild(gVn);
          }
//#plus-off parejas: boton de vigilar la relacion entre dos terceros
          if (gW1 && gW1.pk && gW2 && gW2.pk) {
            const gB = document.createElement("button");
            gB.type = "button";
            const gOn = ghdPairHas(gW1.pk, gW2.pk);
            gB.className = "ghd-pair-btn" + (gOn ? " on" : ""), gB.textContent = gOn ? Y("pair_watching") : Y("pair_watch_btn"), 
            gB.addEventListener("click", () => ghdPairToggle(gW1, gW2, gN)), gT.appendChild(gB);
          }
//#plus-on
          return gT;
        };
        ga.appendChild(gp(gA, gE, M.aFollowsB, M.a, M.b, M.aVia)), ga.appendChild(gp(gE, gA, M.bFollowsA, M.b, M.a, M.bVia));
        let ge;
        if (M.aFollowsB === null || M.bFollowsA === null) ge = "unknown"; else if (M.aFollowsB && M.bFollowsA) ge = "ok"; else if (M.aFollowsB || M.bFollowsA) ge = "half"; else ge = "no";
        ga.classList.add(ge);
      }
      gj.appendChild(ga);
    }
//#plus-off parejas: lista de relaciones ajenas vigiladas
    const gPl = ghdPairs();
    if (gPl.length) {
      const gPw = document.createElement("div");
      gPw.className = "ghd-pair-list";
      const gPh = document.createElement("div");
      gPh.className = "ghd-pair-h", gPh.textContent = Y("pair_list_title"), gPw.appendChild(gPh);
      gPl.forEach(gPi => {
        const gPr = document.createElement("div");
        gPr.className = "ghd-pair-row";
        const gPt = document.createElement("span");
        gPt.className = "ghd-pair-tx", gPt.textContent = "@" + (gPi.a.username || "") + " → @" + (gPi.b.username || "");
        const gPs = document.createElement("span");
        gPs.className = "ghd-pair-st " + (gPi.follows === true ? "yes" : gPi.follows === false ? "no" : "unk"), 
        gPs.textContent = gPi.follows === true ? "✓" : gPi.follows === false ? "✕" : "—";
        const gPx = document.createElement("button");
        gPx.type = "button", gPx.className = "ghd-pair-x", gPx.textContent = "×", gPx.title = Y("activity_remove"), 
        gPx.addEventListener("click", () => ghdPairToggle(gPi.a, gPi.b));
        gPr.append(gPt, gPs, gPx), gPw.appendChild(gPr);
      });
      gj.appendChild(gPw);
    }
//#plus-on
    return gq.appendChild(gj), gq;
  }
  function tv() {
    const gq = g.get(J.history, []), gx = document.createElement("div");
    gx.className = "ghd-chart";
    if (gq.length < 2) return gx.appendChild(YG(Y("empty_history"))), gx;
    const gz = gq.slice(-90), gL = gz.map(gR => gR.followers), gO = Math.min.apply(null, gL), gX = Math.max.apply(null, gL), gJ = Math.max(1, gX - gO), gF = 320, gl = 90, gc = 6, gS = (gF - gc * 2) / (gz.length - 1);
    let gC = "";
    gz.forEach((gR, gh) => {
      const gK = gc + gh * gS, gr = gc + (gl - gc * 2) * (1 - (gR.followers - gO) / gJ);
      gC += (gh ? "L" : "M") + gK.toFixed(1) + " " + gr.toFixed(1) + " ";
    });
    const gU = gL[0], gj = gL[gL.length - 1], gy = gj - gU, gH = gy > 0 ? "+" : "";
    return gx.innerHTML = '<div class="ghd-chart-head"><b>' + gj.toLocaleString() + "</b> " + Y("chip_followers") + ' <span class="ghd-delta ' + (gy >= 0 ? "up" : "down") + '">' + gH + gy + '</span></div><svg viewBox="0 0 ' + gF + " " + gl + '" class="ghd-spark" preserveAspectRatio="none"><path d="' + gC + '" fill="none" stroke="url(#ghdg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="ghdg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs></svg>', 
    gx;
  }
  function tT(gq) {
    const gx = new Date(gq);
    return ("0" + gx.getHours()).slice(-2) + ":" + ("0" + gx.getMinutes()).slice(-2);
  }
  function tB(gq) {
    const gx = new Date(gq);
    return ("0" + gx.getDate()).slice(-2) + "/" + ("0" + (gx.getMonth() + 1)).slice(-2);
  }
  function tG(gq) {
    const gx = document.createElement("button");
    gx.className = "ghd-story-tile";
    const gz = document.createElement("div");
    gz.className = "ghd-tile-thumb";
    if (gq.thumb) {
      const gU = document.createElement("img");
      gU.src = gq.thumb, gU.loading = "lazy", gz.appendChild(gU);
    } else {
      const gj = document.createElement("div");
      gj.className = "ghd-tile-ph", gj.textContent = gq.isVideo ? "🎬" : "🖼️", gz.appendChild(gj);
    }
    const gL = new Date(gq.takenAt), gO = document.createElement("div");
    gO.className = "ghd-tile-date";
    const gX = document.createElement("b");
    gX.textContent = String(gL.getDate());
    const gJ = document.createElement("span");
    let gF;
    try {
      gF = gL.toLocaleDateString(void 0, {
        month: "short"
      });
    } catch (gy) {
      gF = String(gL.getMonth() + 1);
    }
    gJ.textContent = gF;
    const gl = document.createElement("span");
    gl.textContent = String(gL.getFullYear()), gO.appendChild(gX), gO.appendChild(gJ), 
    gO.appendChild(gl), gz.appendChild(gO);
    if (gq.isVideo) {
      const gH = document.createElement("div");
      gH.className = "ghd-tile-vid", gH.textContent = "▶", gz.appendChild(gH);
    }
    const gc = document.createElement("div");
    gc.className = "ghd-tile-meta";
    const gS = document.createElement("span");
    gS.textContent = "👁 " + (gq.viewerCount || 0);
    const gC = document.createElement("span");
    return gC.textContent = "♥ " + (gq.likeCount || 0), gc.appendChild(gS), gc.appendChild(gC), 
    gz.appendChild(gc), gx.appendChild(gz), gx.addEventListener("click", () => {
      H = gq.mediaId, y = "", g5();
//#plus-off espectadores de historias
      YS();
//#plus-on
    }), gx;
  }
//#plus-off espectadores de historias: cabecera del detalle
  function tI(gq) {
    const gx = document.createElement("div");
    gx.className = "ghd-detail-head";
    const gz = document.createElement("div");
    gz.className = "ghd-detail-thumb";
    if (gq.thumb) {
      const gJ = document.createElement("img");
      gJ.src = gq.thumb, gz.appendChild(gJ);
    } else gz.textContent = gq.isVideo ? "🎬" : "🖼️";
    const gL = document.createElement("div");
    gL.className = "ghd-detail-info";
    const gO = document.createElement("div");
    gO.className = "ghd-detail-title", gO.textContent = Y(gq.isVideo ? "gs_video" : "gs_photo") + " · " + tB(gq.takenAt) + " " + tT(gq.takenAt);
    const gX = document.createElement("div");
    return gX.className = "ghd-detail-sub", gX.textContent = Y("gs_detail_meta", [ String(gq.viewerCount || 0), String(gq.likeCount || 0) ]), 
    gL.appendChild(gO), gL.appendChild(gX), gx.appendChild(gz), gx.appendChild(gL), 
    gx;
  }
//#plus-on
//#plus-off espectadores de historias: buscador y vista de top fans
  function tW(gq, gx, gz) {
    const gL = document.createElement("div");
    gL.className = "ghd-story-search";
    const gO = document.createElement("input");
    gO.type = "text", gO.className = "ghd-story-search-in", gO.placeholder = Y("gs_search"), 
    gO.value = y, gL.appendChild(gO), gq.appendChild(gL);
    const gX = document.createElement("div");
    gX.className = "ghd-vrows", gq.appendChild(gX);
    const gJ = () => {
      gX.innerHTML = "";
      const gF = ghdNorm(y.trim()), gl = !gF ? gx : gx.filter(gc => ghdMatch(gc.s || gc, gF));
      if (!gl.length) {
        gX.appendChild(YG(Y("gs_no_match")));
        return;
      }
      gl.forEach((gc, gS) => gX.appendChild(gz(gc, gS)));
    };
    gO.addEventListener("input", () => {
      y = gO.value, gJ();
    }), gJ();
  }
  function g0(gq) {
    const gx = Yj(), gz = document.createElement("div");
    gz.className = "ghd-top-note", gz.textContent = Y("gs_note"), gq.appendChild(gz);
    if (!gx.length) {
      gq.appendChild(YG(Y("empty_ghosted")));
      return;
    }
    const gL = gx.map((gO, gX) => ({
      s: gO,
      rank: gX
    }));
    tW(gq, gL, ({s: gO, rank: gX}) => {
      const gJ = [], gF = typeof gO.lastSaw === "number" && typeof gO.lastOf === "number" && gO.lastOf > 0;
      if (gF) gJ.push(Y("gs_saw", [ String(gO.lastSaw), String(gO.lastOf) ]));
      if (typeof gO.slides === "number" && (!gF || gO.slides > gO.lastSaw)) gJ.push(Y("gs_alltime", String(gO.slides)));
      const gl = (gO.days || []).length;
      if (gl) gJ.push(Y(gl === 1 ? "gs_days_one" : "gs_days_many", String(gl)));
      if ((gO.likes || 0) > 0) gJ.push(Y("gs_liked", String(gO.likes)));
      const gc = {
        time: gO.lastSeen,
        sub: gJ.join(" · "),
        rank: gX + 1
      };
      if (gX === 0) gc.tag = Y("tag_fan"), gc.tagClass = "fan"; else (gO.likes || 0) > 0 && (gc.tag = "♥", 
      gc.tagClass = "fan");
      return YB(gO, gc, gX);
    });
  }
//#plus-on
  function g1(gq) {
    const gx = g.get(J.following, null);
    if (gx && Array.isArray(gx.users)) {
      const gz = gx.users.filter(gL => gL.pk !== gq);
      if (gz.length !== gx.users.length) g.set(J.following, Object.assign({}, gx, {
        users: gz
      }));
    }
  }
  // Cuantas se consideran "muchas de golpe". No es un numero de Instagram —
  // ellos no lo publican — sino el punto donde la experiencia dice que empiezan
  // los avisos. Por encima se pide una confirmacion aparte y mas seria.
  const GHD_LOTE_GRANDE = 50;

  async function g2(gq) {
    if (r || !gq.length) return;
    if (!confirm(Y("nb_confirm", String(gq.length)))) return;
    // Segundo aviso solo para lotes grandes: el primero se acepta sin leer.
    if (gq.length > GHD_LOTE_GRANDE && !confirm(Y("nb_confirm_big", [String(gq.length), String(GHD_LOTE_GRANDE)]))) return;
    r = true;
    let gx = 0, gU = 0, gj = 0, gy = "";
    gt();
    ghdLoadShow(0, gq.length, "load_unfollowing");
    for (let gz = 0; gz < gq.length; gz++) {
      G(Y("nb_progress", [ String(gz + 1), String(gq.length) ]), "work");
      ghdLoadShow(gz, gq.length, "load_unfollowing");
      try {
        await k.unfollow(gq[gz]), gx++, gj = 0, g1(gq[gz]), h.delete(gq[gz]);
      } catch (gL) {
        if (gL && (gL.kind === "rate" || gL.kind === "challenge")) {
          r = false, ghdLoadHide(), G(Y("nb_blocked", String(gx)), "alert"), ghdToast(Y("nb_blocked", String(gx)), "alert"), 
          gt();
          return;
        }
        gU++, gj++;
        if (!gy) gy = gL && (gL.reason || gL.kind) || "";
        if (gj >= 3) {
          r = false, ghdLoadHide();
          const gEm = Y("nb_failed", [ String(gx), String(gU) ]) + (gy ? " · " + gy : "");
          G(gEm, "alert"), ghdToast(gEm, "alert"), gt();
          return;
        }
      }
      if (gz < gq.length - 1) await Z(5e3 + Math.floor(Math.random() * 6e3));
    }
    r = false;
    ghdLoadHide();
    if (!h.size) R = false;
    if (gU) {
      const gEm = Y("nb_failed", [ String(gx), String(gU) ]) + (gy ? " · " + gy : "");
      G(gEm, "alert"), ghdToast(gEm, "alert");
    } else G(Y("nb_done", String(gx)), "ok"), ghdToast(Y("nb_done", String(gx)));
    gt();
  }
//#plus-off visor de historias y modo fantasma: fuera de Plus
  let gvEl = null, gvList = [], gvIdx = 0, gvItems = null, gvPos = 0, gvPaused = false, gvHold = null, gvHeld = false, gvRun = 0, gvMute = true, gvTok = 0;
  const gvCache = {}, gvPre = {};
  async function lvLoad(gq) {
    if (lvL) return;
    if (lvT && !gq) return;
    lvL = true, lvE = "", g5();
    try {
      lvT = await k.fetchReelsTray();
    } catch (gE) {
      lvE = gE && gE.kind === "rate" ? Y("gh_err_rate") : Y("gh_err"), lvT = lvT || [];
    }
    lvL = false, g5();
    gvWarm(lvT);
  }
  async function gvWarm(gt) {
    try {
      if (!gt || !gt.length || !k.fetchStoriesMany) return;
      const pend = gt.map(u => String(u.pk)).filter(pk => pk && !gvCache[pk]);
      if (!pend.length) return;
      const CH = 8, jobs = [];
      for (let i = 0; i < pend.length; i += CH) {
        const part = pend.slice(i, i + CH);
        jobs.push(k.fetchStoriesMany(part).then(function(map) {
          part.forEach(function(pk) {
            const items = map[pk] || [];
            gvCache[pk] = items;
          });
          part.forEach(function(pk) {
            if (gvCache[pk] && gvCache[pk].length) gvPreload(gvCache[pk]);
          });
        }).catch(function() {}));
      }
      await Promise.all(jobs);
    } catch (e) {}
  }
  let lvQ = "";
  function lvBack() {
    lvU = null, lvI = null, lvN = 0, lvE = "";
  }
  function lvView(gq) {
    const gx = document.createElement("div");
    gx.className = "ghd-top-note", gx.textContent = Y("gh_note"), gq.appendChild(gx);
    if (lvE) {
      const gz = document.createElement("div");
      gz.className = "ghd-gh-err", gz.textContent = lvE, gq.appendChild(gz);
    }
    const gL = document.createElement("button");
    gL.className = "ghd-refresh-btn" + (lvL ? " is-busy" : ""), gL.textContent = Y("gh_refresh"), 
    gL.disabled = lvL, gL.addEventListener("click", () => {
      lvLoad(true);
    });
    if (lvL && !lvT) {
      gq.appendChild(YG(Y("gh_loading")));
      return;
    }
    if (!lvT || !lvT.length) {
      gq.appendChild(YG(Y("gh_empty")));
      return;
    }
    const gO = document.createElement("button");
    gO.className = "ghd-fans-entry ghd-play-all", gO.textContent = Y("gh_play_all", String(lvT.length)), 
    gO.addEventListener("click", () => gvStart(lvT, 0));
    const gTray = document.createElement("div");
    gTray.className = "ghd-tray";
    const gFi = document.createElement("input");
    gFi.className = "ghd-tray-filter", gFi.type = "search", gFi.placeholder = Y("stories_filter"), 
    gFi.autocomplete = "off", gFi.spellcheck = false, gFi.value = lvQ || "";
    const gFn = document.createElement("div");
    gFn.className = "ghd-tray-none", gFn.textContent = Y("stories_filter_none"), gFn.style.display = "none";
    const gFf = () => {
      const q = ghdNorm(String(gFi.value || "").replace(/^@+/, "").trim());
      lvQ = gFi.value;
      let vis = 0;
      gTray.querySelectorAll(".ghd-tray-item").forEach(el => {
        const hit = !q || String(el.dataset.q || "").indexOf(q) !== -1;
        el.style.display = hit ? "" : "none";
        if (hit) vis++;
      });
      gFn.style.display = vis ? "none" : "block";
    };
    gFi.addEventListener("input", gFf);
    if (lvT.length > 8) gq.appendChild(gFi);
    lvT.forEach((gX, gJ) => {
      const it = document.createElement("button");
      it.className = "ghd-tray-item";
      it.title = "@" + (gX.username || ""), it.dataset.q = ghdNorm((gX.username || "") + " " + (gX.full_name || ""));
      const ring = document.createElement("span");
      ring.className = "ghd-tray-ring" + (gX.unseen ? " unseen" : " seen");
      const av = document.createElement("span");
      av.className = "ghd-tray-av";
      if (gX.pic) {
        const im = document.createElement("img");
        im.loading = "lazy";
        im.decoding = "async";
        im.referrerPolicy = "no-referrer";
        im.src = gX.pic;
        av.appendChild(im);
      } else av.textContent = (gX.username || "?").charAt(0).toUpperCase();
      ring.appendChild(av);
      it.appendChild(ring);
      if (gX.count > 1) {
        const c = document.createElement("span");
        c.className = "ghd-tray-count";
        c.textContent = gX.count;
        it.appendChild(c);
      }
      const nm = document.createElement("span");
      nm.className = "ghd-tray-name";
      nm.textContent = gX.username || "";
      it.appendChild(nm);
      it.addEventListener("click", () => gvStart(lvT, gJ));
      gTray.appendChild(it);
    });
    gq.appendChild(gTray), gq.appendChild(gFn);
    if (lvQ) gFf();
    const gBar = document.createElement("div");
    gBar.className = "ghd-actions ghd-tray-actions";
    gBar.appendChild(gO);
    gBar.appendChild(gL);
    gq.appendChild(gBar);
  }
  function gvClose() {
    gvRun++;
    if (gvEl) {
      gvEl.remove();
      gvEl = null;
    }
    document.removeEventListener("keydown", gvKey, true);
    try {
      document.documentElement.style.overflow = gvPrevOv;
    } catch (gq) {}
    gvList = [], gvIdx = 0, gvItems = null, gvPos = 0, gvPaused = false, gvHeld = false;
    if (gvHold) {
      clearTimeout(gvHold);
      gvHold = null;
    }
  }
  let gvPrevOv = "";
  function gvKey(gq) {
    if (!gvEl) return;
    if (gq.key === "Escape") {
      gq.preventDefault(), gq.stopPropagation(), gvClose();
      return;
    }
    if (gq.key === "ArrowRight") {
      gq.preventDefault(), gq.stopPropagation(), gvNext();
      return;
    }
    if (gq.key === "ArrowLeft") {
      gq.preventDefault(), gq.stopPropagation(), gvPrev();
      return;
    }
    if (gq.key === " ") gq.preventDefault(), gq.stopPropagation(), gvToggle();
  }
  function gvPreload(gx) {
    try {
      (gx || []).forEach(function(it) {
        if (!it || !it.url) return;
        if (gvPre[it.url]) return;
        gvPre[it.url] = 1;
        if (it.isVideo) {
          var l = document.createElement("link");
          l.rel = "prefetch";
          l.as = "video";
          l.href = it.url;
          document.head.appendChild(l);
          if (it.img) {
            var i2 = new Image;
            i2.src = it.img;
          }
        } else {
          var i = new Image;
          i.decoding = "async";
          i.src = it.url;
        }
      });
    } catch (e) {}
  }
  async function gvItemsOf(gq) {
    if (gvCache[gq]) return gvCache[gq];
    let gx = [];
    try {
      gx = await k.fetchStories(gq) || [];
    } catch (gz) {
      gx = [];
    }
    gvCache[gq] = gx;
    gvPreload(gx);
    return gx;
  }
  async function gvStart(gq, gx) {
    if (!gq || !gq.length) return;
    gvClose();
    gvList = gq.slice(), gvIdx = Math.max(0, Math.min(gx || 0, gvList.length - 1));
    gvEl = document.createElement("div"), gvEl.className = "ghd-gv";
    gvEl.addEventListener("click", gz => {
      if (gz.target === gvEl) gvClose();
    });
    try {
      gvPrevOv = document.documentElement.style.overflow, document.documentElement.style.overflow = "hidden";
    } catch (gz) {}
    document.documentElement.appendChild(gvEl);
    document.addEventListener("keydown", gvKey, true);
    await gvUser(gvIdx, 1);
  }
  async function gvUser(gq, gx) {
    if (!gvEl) return;
    if (gq < 0 || gq >= gvList.length) {
      gvClose();
      return;
    }
    const gz = ++gvRun;
    const gvPk = gvList[gq].pk, gvHit = gvCache[gvPk];
    if (gvHit && gvHit.length) {
      gvIdx = gq, gvPos = gx < 0 ? gvHit.length - 1 : 0, gvPaused = false, gvItems = gvHit, 
      gvPaint();
      if (gvList[gq + 1]) gvItemsOf(gvList[gq + 1].pk);
      if (gvList[gq + 2]) gvItemsOf(gvList[gq + 2].pk);
      return;
    }
    gvIdx = gq, gvItems = null, gvPos = 0, gvPaused = false, gvPaint();
    const gL = await gvItemsOf(gvPk);
    if (!gvEl || gz !== gvRun) return;
    if (!gL.length) {
      if (gq + gx < 0 || gq + gx >= gvList.length) {
        gvClose();
        return;
      }
      return gvUser(gq + gx, gx);
    }
    gvItems = gL, gvPos = gx < 0 ? gL.length - 1 : 0, gvPaint();
    if (gvList[gq + 1]) gvItemsOf(gvList[gq + 1].pk);
    if (gvList[gq + 2]) gvItemsOf(gvList[gq + 2].pk);
  }
  function gvNext() {
    if (!gvEl) return;
    if (gvItems && gvPos < gvItems.length - 1) {
      gvPos++, gvPaused = false, gvPaint();
      return;
    }
    gvUser(gvIdx + 1, 1);
  }
  function gvPrev() {
    if (!gvEl) return;
    if (gvItems && gvPos > 0) {
      gvPos--, gvPaused = false, gvPaint();
      return;
    }
    gvUser(gvIdx - 1, -1);
  }
  function gvToggle(gq) {
    if (!gvEl || !gvItems) return;
    gvPaused = typeof gq === "boolean" ? gq : !gvPaused;
    const gx = gvEl.querySelector(".ghd-gv-fill-live"), gz = gvEl.querySelector(".ghd-gv-stage video"), gL = gvEl.querySelector(".ghd-gv-pause");
    if (gx) gx.style.animationPlayState = gvPaused ? "paused" : "running";
    if (gz) if (gvPaused) gz.pause(); else gz.play().catch(() => {});
    if (gL) gL.textContent = gvPaused ? "▶" : "❚❚", gL.setAttribute("aria-label", Y(gvPaused ? "gh_resume" : "gh_pause"));
  }
  function gvPaint() {
    if (!gvEl) return;
    gvTok++;
    const gq = gvList[gvIdx] || {};
    gvEl.innerHTML = "";
    const gx = document.createElement("div");
    gx.className = "ghd-gv-in";
    const gz = document.createElement("div");
    gz.className = "ghd-gv-bars";
    const gL = gvItems ? gvItems.length : 1;
    for (let gJ = 0; gJ < gL; gJ++) {
      const gF = document.createElement("span");
      gF.className = "ghd-gv-bar";
      const gl = document.createElement("i");
      gl.className = "ghd-gv-fill" + (gvItems && gJ < gvPos ? " done" : "") + (gvItems && gJ === gvPos ? " ghd-gv-fill-live" : "");
      gF.appendChild(gl), gz.appendChild(gF);
    }
    gx.appendChild(gz);
    const gO = document.createElement("div");
    gO.className = "ghd-gv-top";
    gO.appendChild(YT(gq));
    const gX = document.createElement("div");
    gX.className = "ghd-gv-who";
    const gS = document.createElement("b");
    gS.textContent = gq.username || "";
    const gC = document.createElement("span");
    gC.textContent = (gvItems && gvItems[gvPos] && gvItems[gvPos].ts ? B(gvItems[gvPos].ts) + " · " : "") + Y("gh_badge");
    gX.appendChild(gS), gX.appendChild(gC), gO.appendChild(gX);
    const gU = document.createElement("button");
    gU.className = "ghd-gv-btn ghd-gv-pause", gU.textContent = gvPaused ? "▶" : "❚❚", 
    gU.setAttribute("aria-label", Y(gvPaused ? "gh_resume" : "gh_pause")), gU.setAttribute("data-tip", Y(gvPaused ? "gh_resume" : "gh_pause"));
    gU.addEventListener("click", gJ => {
      gJ.stopPropagation(), gvToggle();
    }), gO.appendChild(gU);
    const gj = document.createElement("button");
    const gvName = function(it, who, idx) {
      const d = new Date(it.ts || Date.now());
      const p2 = function(n) {
        return (n < 10 ? "0" : "") + n;
      };
      return (who || "ig") + "_" + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "_" + (idx + 1) + (it.isVideo ? ".mp4" : ".jpg");
    };
    const gvGrab = function(it, who, idx) {
      return new Promise(function(res) {
        try {
          chrome.runtime.sendMessage({
            type: "downloadMedia",
            url: it.url,
            name: gvName(it, who, idx)
          }, function(r) {
            res(!(!r || !r.ok));
          });
        } catch (e) {
          res(false);
        }
      });
    };
    const gDl = document.createElement("button");
    gDl.className = "ghd-gv-btn ghd-gv-dl", gDl.textContent = "↓", gDl.setAttribute("aria-label", Y("gh_download")), 
    gDl.setAttribute("data-tip", Y("gh_download"));
    gDl.addEventListener("click", async function(ev) {
      ev.stopPropagation();
      if (!gvItems || !gvItems[gvPos]) return;
      gDl.disabled = true, gDl.classList.add("busy");
      const who = (gvList[gvIdx] || {}).username || "";
      const ok = await gvGrab(gvItems[gvPos], who, gvPos);
      gDl.classList.remove("busy"), gDl.classList.add(ok ? "done" : "fail"), gDl.textContent = ok ? "✓" : "!";
      setTimeout(function() {
        gDl.disabled = false, gDl.classList.remove("done", "fail"), gDl.textContent = "↓";
      }, 1500);
    }), gO.appendChild(gDl);
    if (gvItems && gvItems.length > 1) {
      const gAll = document.createElement("button");
      gAll.className = "ghd-gv-btn ghd-gv-dlall", gAll.textContent = String(gvItems.length) + "↓", 
      gAll.setAttribute("aria-label", Y("gh_download_all")), gAll.setAttribute("data-tip", Y("gh_download_all") + " (" + gvItems.length + ")");
      gAll.addEventListener("click", async function(ev) {
        ev.stopPropagation();
        gAll.disabled = true, gAll.classList.add("busy");
        const who = (gvList[gvIdx] || {}).username || "";
        let n = 0;
        for (let i2 = 0; i2 < gvItems.length; i2++) {
          if (await gvGrab(gvItems[i2], who, i2)) n++;
          await Z(200);
        }
        gAll.classList.remove("busy"), gAll.classList.add(n ? "done" : "fail"), gAll.textContent = n ? "✓" : "!";
        setTimeout(function() {
          gAll.disabled = false, gAll.classList.remove("done", "fail"), gAll.textContent = String(gvItems.length) + "↓";
        }, 1500);
      }), gO.appendChild(gAll);
    }
    gj.className = "ghd-gv-btn", gj.textContent = "✕", gj.setAttribute("aria-label", Y("gh_close")), 
    gj.setAttribute("data-tip", Y("gh_close"));
    gj.addEventListener("click", gJ => {
      gJ.stopPropagation(), gvClose();
    }), gO.appendChild(gj);
    gx.appendChild(gO);
    const gy = document.createElement("div");
    gy.className = "ghd-gv-stage";
    if (!gvItems) gy.appendChild(YG(Y("gh_loading_one"))); else {
      const gJ = gvItems[gvPos];
      if (gJ.isVideo) {
        const gF = document.createElement("video"), gT = gvTok;
        const gA = () => {
          if (gT === gvTok) gvNext();
        };
        gF.muted = gvMute, gF.autoplay = true, gF.playsInline = true, gF.setAttribute("playsinline", ""), 
        gF.preload = "auto", gF.setAttribute("fetchpriority", "high"), gF.poster = gJ.img || "", 
        gF.src = gJ.url;
        gF.addEventListener("loadedmetadata", () => {
          const gl = gvEl && gvEl.querySelector(".ghd-gv-fill-live");
          if (gl && gF.duration && isFinite(gF.duration)) gl.style.animationDuration = gF.duration + "s";
        });
        gF.addEventListener("ended", gA), gF.addEventListener("error", gA);
        gy.appendChild(gF);
        const gP2 = () => gF.play().catch(() => {
          if (!gF.muted) gvMute = true, gF.muted = true, gc.textContent = "🔇", gF.play().catch(() => {});
        });
        let gW2 = 0;
        const gI2 = setInterval(() => {
          if (gT !== gvTok || !gvEl) {
            clearInterval(gI2);
            return;
          }
          if (gF.ended) {
            clearInterval(gI2);
            return;
          }
          if (gvPaused) return;
          if (gF.paused || gF.currentTime === 0) {
            if (++gW2 >= 6) clearInterval(gI2), gA();
          } else gW2 = 0;
        }, 1e3);
        const gc = document.createElement("button");
        gc.className = "ghd-gv-sound", gc.textContent = gvMute ? "🔇" : "🔊", gc.setAttribute("aria-label", Y("gh_sound")), 
        gc.setAttribute("data-tip", Y("gh_sound"));
        gc.addEventListener("click", gS2 => {
          gS2.stopPropagation(), gvMute = !gvMute, gF.muted = gvMute, gc.textContent = gvMute ? "🔇" : "🔊", 
          gF.play().catch(() => {});
        });
        gy.appendChild(gc), gP2();
      } else {
        const gF = document.createElement("img");
        gF.decoding = "async", gF.setAttribute("fetchpriority", "high"), gF.src = gJ.url, 
        gF.alt = "", gF.addEventListener("error", () => gvNext()), gy.appendChild(gF);
      }
      const gl = gz.querySelector(".ghd-gv-fill-live");
      if (gl) {
        const gT2 = gvTok;
        gl.addEventListener("animationend", () => {
          if (gT2 !== gvTok) return;
          const gv2 = gvEl && gvEl.querySelector(".ghd-gv-stage video");
          if (gv2 && !gv2.ended && !gv2.paused) return;
          gvNext();
        });
      }
      [ "left", "right" ].forEach(gc => {
        const gS2 = document.createElement("div");
        gS2.className = "ghd-gv-zone " + gc;
        gS2.addEventListener("pointerdown", () => {
          gvHeld = false;
          gvHold = setTimeout(() => {
            gvHeld = true, gvToggle(true);
          }, 250);
        });
        gS2.addEventListener("pointerup", () => {
          if (gvHold) {
            clearTimeout(gvHold);
            gvHold = null;
          }
          if (gvHeld) {
            gvHeld = false, gvToggle(false);
            return;
          }
          gc === "left" ? gvPrev() : gvNext();
        });
        gS2.addEventListener("pointercancel", () => {
          if (gvHold) {
            clearTimeout(gvHold);
            gvHold = null;
          }
          if (gvHeld) gvHeld = false, gvToggle(false);
        });
        gy.appendChild(gS2);
      });
    }
    gx.appendChild(gy);
    const gH = document.createElement("div");
    gH.className = "ghd-gv-foot", gH.textContent = Y("gh_person_of", [ String(gvIdx + 1), String(gvList.length) ]);
    gx.appendChild(gH), gvEl.appendChild(gx);
    if (gvPaused) gvToggle(true);
  }
//#plus-on
  function g3(gq) {
    const gx = document.activeElement;
    if (!gx || !gq.contains(gx) || gx.tagName !== "INPUT" && gx.tagName !== "TEXTAREA") return null;
    const gz = (gx.className || "").trim();
    if (!gz) return null;
    const gL = "." + gz.split(/\s+/).join("."), gO = Array.from(gq.querySelectorAll(gL)), gX = gO.indexOf(gx);
    if (gX === -1) return null;
    return {
      sel: gL,
      idx: gX,
      value: gx.value,
      selStart: gx.selectionStart,
      selEnd: gx.selectionEnd
    };
  }
  function g4(gq, gx) {
    if (!gx) return;
    const gz = Array.from(gq.querySelectorAll(gx.sel)), gL = gz[gx.idx];
    if (!gL) return;
    gL.value = gx.value, gL.focus();
    try {
      gL.setSelectionRange(gx.selStart, gx.selEnd);
    } catch (gO) {}
  }
  function g5() {
    if (!p) return;
    const gq = g3(p);
    p.innerHTML = "";
    try {
      const gx = g.get(J.events, []);
      if (j === "unfollow") {
        if (!g.get(J.followers, null)) return void p.appendChild(YG(Y("empty_unfollow_load")));
        const gz = gx.filter(gL => gL.type === "unfollow");
        let gVac = Y("empty_unfollow_own");
//#plus-off punto de mira: el texto largo habla de "vigilar"
        gVac = Y("empty_unfollow");
//#plus-on
        if (!gz.length) return void p.appendChild(YG(gVac));
        gz.forEach((gL, gO) => p.appendChild(YB(gL, {
          time: gL.ts,
          tag: Y("tag_unfollow"),
          tagClass: "red"
        }, gO)));
      } else if (j === "new") {
        const gL = gx.filter(gO => gO.type === "new");
        if (!gL.length) return void p.appendChild(YG(Y("empty_new")));
        gL.forEach((gO, gX) => p.appendChild(YB(gO, {
          time: gO.ts,
          tag: Y("tag_new"),
          tagClass: "green"
        }, gX)));
      } else if (j === "notback") {
        const gO = g.get(J.followers, {
          users: []
        }).users || [], gX = g.get(J.following, {
          users: []
        }).users || [], gJ = new Set(gO.map(gS => gS.pk)), gF = gX.filter(gS => !gJ.has(gS.pk)).sort((gS, gC) => gS.username.localeCompare(gC.username));
        if (!gX.length) return void p.appendChild(YG(Y("empty_notback_load")));
        if (!gF.length) return void p.appendChild(YG(Y("empty_notback_none")));
        const gl = new Set(gF.map(gS => gS.pk));
        [ ...h ].forEach(gS => {
          if (!gl.has(gS)) h.delete(gS);
        });
        const gV = () => {
          const gv = ghdNorm(nbQ.trim());
          return !gv ? gF : gF.filter(gk => ghdMatch(gk, gv));
        };
        const gEd = Number(g.get(J.lastFollowingTs, 0)) || 0;
        if (gEd && Date.now() - gEd > 72e5) {
          const gEn = document.createElement("div");
          gEn.className = "ghd-top-note ghd-sec-note", gEn.textContent = Y("nb_stale", B(gEd)), 
          p.appendChild(gEn);
        }
        const gc = document.createElement("div");
        gc.className = "ghd-nb-bar";
        let gU = null, gj = null;
        if (!R) {
          const gS = document.createElement("button");
          gS.className = "ghd-nb-btn", gS.textContent = "☑ " + Y("nb_select"), gS.disabled = r, 
          gS.addEventListener("click", () => {
            R = true, g5();
          }), gc.appendChild(gS);
        } else {
          gU = document.createElement("button");
          gU.className = "ghd-nb-btn", gU.disabled = r, gU.addEventListener("click", () => {
            const gE = gV(), gK = gE.length > 0 && gE.every(gk => h.has(gk.pk));
            gE.forEach(gk => {
              if (gK) h.delete(gk.pk); else h.add(gk.pk);
            }), g5();
          }), gc.appendChild(gU);
          gj = document.createElement("button");
          gj.className = "ghd-nb-btn danger", gj.disabled = r || !h.size, gj.addEventListener("click", () => g2([ ...h ])), 
          gc.appendChild(gj);
          const gy = document.createElement("button");
          gy.className = "ghd-nb-btn ghost", gy.textContent = Y("nb_cancel"), gy.disabled = r, 
          gy.addEventListener("click", () => {
            R = false, h.clear(), nbQ = "", g5();
          }), gc.appendChild(gy);
        }
        p.appendChild(gc);
        if (R) {
          const gH = document.createElement("div");
          gH.className = "ghd-top-note", gH.textContent = Y("nb_hint"), p.appendChild(gH);
        }
        const gN = document.createElement("div");
        gN.className = "ghd-nb-search";
        const gW = document.createElement("input");
        gW.type = "text", gW.className = "ghd-nb-search-in", gW.placeholder = Y("nb_search"), 
        gW.value = nbQ, gW.autocomplete = "off", gW.spellcheck = false, gW.setAttribute("aria-label", Y("nb_search")), 
        gN.appendChild(gW), p.appendChild(gN);
        const gP = document.createElement("div");
        gP.className = "ghd-nb-rows";
        p.appendChild(gP);
        const gT = () => {
          gP.innerHTML = "";
          const gE = gV();
          if (gU) {
            const gK = gE.length > 0 && gE.every(gk => h.has(gk.pk));
            gU.textContent = gK ? Y("nb_none") : Y("nb_all"), gU.disabled = r || !gE.length;
          }
          if (gj) gj.textContent = (r ? "⏳ " : "") + Y("nb_unfollow_n", String(h.size)), gj.disabled = r || !h.size;
          if (!gE.length) {
            gP.appendChild(YG(Y("nb_no_match")));
            return;
          }
          gE.forEach((gR, gh) => {
            if (R) {
              const gK = h.has(gR.pk);
              gP.appendChild(YB(gR, {
                checkbox: true,
                selected: gK,
                tag: Y("tag_notfollowing"),
                tagClass: "gray",
                onClick: r ? null : () => {
                  if (h.has(gR.pk)) h.delete(gR.pk); else h.add(gR.pk);
                  g5();
                }
              }, gh));
            } else gP.appendChild(YB(gR, {
              tag: Y("tag_notfollowing"),
              tagClass: "gray"
            }, gh));
          });
        };
        gW.addEventListener("input", () => {
          nbQ = gW.value, gT();
        }), gT();
      } else {
//#plus-off pestanas de espectadores de historias: fuera de Plus
        if (j === "live") {
          if (!N("storyViewers")) return void p.appendChild(YI());
          const gLv = document.createElement("div");
          gLv.className = "ghd-gview";
          p.appendChild(gLv);
          lvView(gLv);
          if (!lvT && !lvL) lvLoad(false);
          return;
        }
        if (j === "history") {
          if (!N("storyViewers")) return void p.appendChild(YI());
          const gR = g.get(J.storyArchive, {}), gh = Object.values(gR).sort((gf, gs) => (gs.takenAt || 0) - (gf.takenAt || 0)), gK = g.get(J.lastStory, 0), gr = document.createElement("div");
          gr.className = "ghd-gview", p.appendChild(gr);
          if (H) {
            const gf = document.createElement("div");
            gf.className = "ghd-detail-bar";
            const gs = document.createElement("button");
            gs.className = "ghd-back", gs.textContent = "‹ " + Y("gs_back"), gs.addEventListener("click", () => {
              H = null, lvBack(), y = "", g5();
            }), gf.appendChild(gs);
            if (H !== "__fans__" && H !== "__live__") {
              const gM = document.createElement("button");
              gM.className = "ghd-refresh-sm" + (c ? " is-busy" : ""), gM.textContent = Y("gs_refresh"), 
              gM.disabled = c, gM.addEventListener("click", () => {
                Yl(true);
              }), gf.appendChild(gM);
            }
            gr.appendChild(gf);
            if (H === "__fans__") g0(gr); else if (H === "__live__") lvView(gr); else if (gR[H]) {
              const gd = gR[H];
              gr.appendChild(tI(gd));
              const gw = document.createElement("div");
              gw.className = "ghd-top-note", gw.textContent = Y("gs_order_note"), gr.appendChild(gw);
              const gb = gd.viewers || [];
              !gb.length ? gr.appendChild(YG(Y("gs_no_viewers"))) : tW(gr, gb, (gm, gV) => {
                const gn = [];
                if (gm.reopens > 0) gn.push(Y("gs_reopen", String(gm.reopens)));
                if (gm.replyText) gn.push("«" + gm.replyText + "»");
                const gD = {
                  sub: gn.join(" · "),
                  rank: gm.pos || gV + 1
                };
                if (gm.reopens > 0) gD.tag = "🔁 " + gm.reopens, gD.tagClass = "fan"; else gm.hasLiked && (gD.tag = "♥", 
                gD.tagClass = "fan");
                return YB(gm, gD, gV);
              });
            } else return H = null, void g5();
            return;
          }
          const gArc = g6("stories", Y("gs_archive_title"));
          const gQ = document.createElement("div");
          gQ.className = "ghd-archive-sub", gQ.textContent = Y("gs_archive_sub"), gArc.appendChild(gQ);
          const gZ = document.createElement("button");
          gZ.className = "ghd-refresh-btn" + (c ? " is-busy" : ""), gZ.textContent = Y("gs_refresh"), 
          gZ.disabled = c, gZ.addEventListener("click", () => {
            Yl(true);
          });
          const gAct = document.createElement("div");
          gAct.className = "ghd-actions";
          gAct.appendChild(gZ);
          gArc.appendChild(gAct);
          if (Object.keys(g.get(J.storyStats, {})).length) {
            const gm = document.createElement("button");
            gm.className = "ghd-fans-entry", gm.textContent = "⭐ " + Y("gs_all_fans"), gm.addEventListener("click", () => {
              H = "__fans__", y = "", g5();
            }), gArc.appendChild(gm);
          }
          if (!gh.length) gArc.appendChild(YG(c ? Y("gs_capturing") : Y("gs_empty_archive"))); else {
            const gV = document.createElement("div");
            gV.className = "ghd-story-grid", gh.forEach(gn => gV.appendChild(tG(gn))), gArc.appendChild(gV);
          }
          gr.appendChild(gArc);
          const gi = document.createElement("div");
          gi.className = "ghd-top-note ghd-sec-note", gi.textContent = Y("gs_note"), gr.appendChild(gi), 
          g9(gr), ghdHistExtras(gr);
          return;
        }
//#plus-on
        // Cadena partida a proposito: cada pestana comprueba su propio valor.
        // Encadenadas con else-if no se podia quitar la de historias en Plus
        // sin dejar un else sin su if.
        if (j === "activity") {
//#plus-off solicitudes: Plus no aprueba nada
          ghdReqBlock(p);
//#plus-on
          p.appendChild(tN());
          const gn = g.get(J.activity, []);
          if (!gn.length) {
            p.appendChild(YG(Y("empty_activity")));
            return;
          }
          gn.forEach((gD, gP) => {
            let ga, gA = "gray";
            const gE = {
              time: gD.ts,
              sub: YW(gD)
            };
            if (gD.type === "story") ga = Y("activity_tag_story"), gA = "red"; else if (gD.type === "follow_add") {
              ga = Y("activity_tag_follow"), gA = "green";
              if (gD.target && gD.target.pk) gE.onClick = () => te(gD.target);
            } else if (gD.type === "follow_rem") {
              ga = Y("activity_tag_unfollow2"), gA = "red";
              if (gD.target && gD.target.pk) gE.onClick = () => te(gD.target);
            } else
//#plus-off solicitudes y parejas: esas entradas no se generan en Plus
            if (gD.type === "req_ok") ga = Y("req_title"), gA = "green"; else if (gD.type === "pair") ga = Y("activity_tag_pair"), 
            gA = gD.follows ? "green" : "red"; else
//#plus-on
            if (gD.type === "followers_up") ga = Y("activity_tag_followers"), 
            gA = "green", gE.onClick = () => ta(gD); else if (gD.type === "followers_down") ga = Y("activity_tag_followers"), 
            gA = "red", gE.onClick = () => tA(gD); else if (gD.type === "photo") {
              ga = Y("activity_tag_photo");
              const gPp = ghdPhotoPair(gD);
              if (gPp.antes || gPp.ahora) gE.onClick = () => ghdPhotoView(gD);
            } else if (gD.type === "bio") ga = Y("activity_tag_bio"); else ga = Y("activity_tag_profile");
            gE.tag = ga, gE.tagClass = gA, p.appendChild(YB(gD, gE, gP));
          });
        } else if (j === "__merged__") {
          if (!N("history")) return void p.appendChild(YI());
          p.appendChild(tv());
          const gD = g.get(J.storyLog, []);
          if (gD.length) {
            const gP = document.createElement("div");
            gP.className = "ghd-loghead", gP.textContent = Y("history_captures"), p.appendChild(gP), 
            gD.slice(0, 30).forEach(ga => {
              const gA = document.createElement("div");
              gA.className = "ghd-logrow", gA.innerHTML = "<span>" + B(ga.ts) + "</span><b>" + Y("history_viewers", String(ga.viewers)) + "</b>", 
              p.appendChild(gA);
            });
          }
        }
      }
    } finally {
      g4(p, gq);
    }
  }
  function g6(gq, gx) {
    const gz = document.createElement("div");
    gz.className = "ghd-top-sec";
    const gL = document.createElement("div");
    return gL.className = "ghd-top-h is-" + gq, gL.textContent = gx, gz.appendChild(gL), 
    gz;
  }
  function g7(gq) {
    return String(gq == null ? "" : gq).replace(/[&<>]/g, gx => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    }[gx]));
  }
  function g8(gq, gx, gz, gL) {
    if (!gx || !gx.length) {
      const gO = document.createElement("div");
      gO.className = "ghd-empty", gO.innerHTML = Y(gL), gq.appendChild(gO);
      return;
    }
    gx.slice(0, 10).forEach((gX, gJ) => {
      const gF = gX.user || gX;
      gq.appendChild(YB(gF, {
        rank: gJ + 1,
        tag: gz(gX),
        tagClass: "gray"
      }, gJ));
    });
  }
  function ghdHistExtras(gP) {
    gP.appendChild(tv());
    const gL = g.get(J.storyLog, []);
    if (!gL.length) return;
    const gh = document.createElement("div");
    gh.className = "ghd-loghead", gh.textContent = Y("history_captures"), gP.appendChild(gh);
    gL.slice(0, 30).forEach(function(ge) {
      const gr2 = document.createElement("div");
      gr2.className = "ghd-logrow", gr2.innerHTML = "<span>" + B(ge.ts) + "</span><b>" + Y("history_viewers", String(ge.viewers)) + "</b>", 
      gP.appendChild(gr2);
    });
  }
  function g9(gq) {
    gq = gq || p;
    const gx = g6("likes", Y("top_likes")), gz = g6("comments", Y("top_comments")), gL = g.get(J.topInteractions, null), gInt = g6("calc", Y("top_section")), gO = document.createElement("div");
    gO.className = "ghd-top-calc";
    const gX = document.createElement("button");
    gX.className = "ghd-btn", gX.textContent = Yy ? Y("top_calculating") : gL ? Y("top_recalc") : Y("top_calc"), 
    gX.disabled = Yy;
    const gJ = document.createElement("div");
    gJ.className = "ghd-top-note", gJ.textContent = gL && gL.posts > 0 ? Y("top_from", String(gL.posts)) : Y("top_calc_hint"), 
    gX.addEventListener("click", async () => {
      gX.disabled = true;
      try {
        await YH((gc, gS) => {
          gJ.textContent = Y("top_progress", [ String(gc), String(gS) ]);
        });
      } catch (gc) {}
      if (j === "history") g5();
    }), gO.append(gX, gJ), gInt.appendChild(gO), gq.appendChild(gInt);
    if (gL) g8(gx, gL.likers, gc => Y("top_likes_n", String(gc.n)), "top_empty"), g8(gz, gL.commenters, gc => Y("top_cmts_n", String(gc.n)), "top_empty"); else {
      const gc = document.createElement("div");
      gc.className = "ghd-empty", gc.textContent = Y("top_calc_hint"), gx.appendChild(gc);
    }
    const gF = g6("growth", Y("top_growth")), gl = g.get(J.events, []).filter(gS => gS.type === "new").slice(0, 10);
    if (gl.length) gl.forEach((gS, gC) => gF.appendChild(YB(gS, {
      time: gS.ts,
      tag: Y("tag_new"),
      tagClass: "green"
    }, gC))); else {
      const gS = document.createElement("div");
      gS.className = "ghd-empty", gS.textContent = Y("top_growth_empty"), gF.appendChild(gS);
    }
    gq.appendChild(gx), gq.appendChild(gz), gq.appendChild(gF);
  }
  function gY() {
    const gq = g.get(J.events, []), gx = g.get(J.seen, 0), gz = gq.filter(gL => gL.type === "unfollow" && gL.ts > gx).length;
    gz > 0 && m.style.display !== "flex" ? (D.style.display = "block", D.textContent = gz > 99 ? "99+" : gz) : D.style.display = "none";
  }
  function gt() {
    if (!v()) {
      Ys();
      return;
    }
    m.classList.remove("ghd-locked");
    const gq = g.get(J.followers, {
      users: []
    }).users || [], gx = g.get(J.following, {
      users: []
    }).users || [], gz = new Set(gq.map(gl => gl.pk)), gL = gx.filter(gl => !gz.has(gl.pk)), gO = g.get(J.events, []), gX = g.get(J.counts, null), gJ = gX && Number.isFinite(gX.followers) && Number.isFinite(gX.following) ? gX : null;
    if (e) e.textContent = gJ ? gJ.followers.toLocaleString() : gq.length || "–";
    if (u) u.textContent = gJ ? gJ.following.toLocaleString() : gx.length || "–";
    if (o) o.textContent = gx.length ? gL.length : "–";
    const gF = gl => m.querySelector(gl);
    if (gF("#ghd-t-unf")) gF("#ghd-t-unf").textContent = gO.filter(gl => gl.type === "unfollow").length;
    if (gF("#ghd-t-new")) gF("#ghd-t-new").textContent = gO.filter(gl => gl.type === "new").length;
    if (gF("#ghd-t-nb")) gF("#ghd-t-nb").textContent = gx.length ? gL.length : 0;
    if (gF("#ghd-t-act")) gF("#ghd-t-act").textContent = g.get(J.activity, []).length;
//#plus-off pestanas de espectadores: en Plus no existen
    m.querySelectorAll(".ghd-pro-tab").forEach(gl => {
      const gc = gl.dataset.tab === "live" ? "storyViewers" : "history";
      gl.classList.toggle("unlocked", N(gc));
    });
//#plus-on
    YN(), Yp(), g5(), gY(), Ya();
  }
  function gg() {
    const gq = {
      exportedAt: (new Date).toISOString(),
      account: O,
      followers: g.get(J.followers, null),
      following: g.get(J.following, null),
      events: g.get(J.events, []),
      activity: g.get(J.activity, []),
//#plus-off punto de mira: nada que exportar
      watchedProfiles: Y6(),
//#plus-on
      storyStats: g.get(J.storyStats, {}),
      history: g.get(J.history, [])
    }, gx = new Blob([ JSON.stringify(gq, null, 2) ], {
      type: "application/json"
    }), gz = document.createElement("a");
    gz.href = URL.createObjectURL(gx), gz.download = "ghosted-" + T(Date.now()) + ".json", 
    gz.click(), setTimeout(() => URL.revokeObjectURL(gz.href), 4e3);
  }
  async function gk() {
    await GhostedI18n.ready, await g.hydrate(), F = Object.assign({}, z, g.get(J.settings, {})), 
    g.del(X + "cooldownUntil");
    !g.get(X + "photoFixV2", false) && (g.set(J.activity, g.get(J.activity, []).filter(gO => gO.type !== "photo")), 
    g.del(J.profileSnapshots), g.del(J.profileCursor), g.set(X + "photoFixV2", true));
//#plus-off punto de mira: migracion de la lista de vigilados
    if (!g.get(X + "spyDefaultV2", false)) {
      const gO = Y6();
      gO.length && (gO.forEach(gX => {
        gX.watchFollowing = true;
      }), g.set(J.watchedProfiles, gO)), g.set(X + "spyDefaultV2", true);
    }
//#plus-on
    !g.get(X + "spyCleanV1", false) && (g.set(J.activity, g.get(J.activity, []).filter(gX => gX.type !== "follow_add" && gX.type !== "follow_rem")), 
    g.del(J.spyFollowing), g.set(X + "spyCleanV1", true));
    !g.get(X + "spyCleanV2", false) && (g.set(J.activity, g.get(J.activity, []).filter(gX => {
      if (gX.type !== "followers_up" && gX.type !== "followers_down") return true;
      return gX.newFollowers && gX.newFollowers.length || gX.lostFollowers && gX.lostFollowers.length;
    })), g.del(J.spyFollowers), g.set(X + "spyCleanV2", true));
    !g.get(X + "photoFixV3", false) && (g.set(J.activity, g.get(J.activity, []).filter(gX => gX.type !== "photo")), 
    g.del(J.profileSnapshots), g.del(J.profileCursor), g.set(X + "photoFixV3", true));
    !g.get(X + "spyCleanV3", false) && (g.set(J.activity, g.get(J.activity, []).filter(gX => gX.type !== "follow_add" && gX.type !== "follow_rem")), 
    g.del(J.spyFollowing), g.set(X + "spyCleanV3", true));
    !g.get(X + "spyCleanV4", false) && (g.set(J.activity, g.get(J.activity, []).filter(gX => gX.type !== "followers_down" || gX.lostFollowers && gX.lostFollowers.length)), 
    g.set(X + "spyCleanV4", true));
    if (!g.get(q.INSTALL_KEY, 0)) g.set(q.INSTALL_KEY, Date.now());
    YM(), gt(), ghdStatusLoad();
    if (L) tu();
    let gq = null;
    chrome.storage.onChanged.addListener((gX, gJ) => {
      if (gJ !== "local") return;
      let gF = false;
      for (const gl in gX) g.syncCache(gl, gX[gl].newValue), gF = true;
      if (gF) {
        if (gq) clearTimeout(gq);
        gq = setTimeout(() => {
          gq = null, gt();
        }, 400);
        if (v() && !l && !g.get(J.followers, null)) YL(true);
      }
    }), chrome.runtime.onMessage.addListener(gX => {
      if (gX && gX.type === "runCheck") Yh();
      if (gX && gX.type === "openPanel") Ye();
      if (gX && gX.type === "getAccountId") return Promise.resolve({
        accountId: O
      });
    });
    if (!v()) {
      G(Y("unlock_status"), "alert");
      return;
    }
    const gx = g.get(J.lastCheck, 0), gz = g.get(J.lastAttempt, gx), gL = Date.now() - gz > Math.max(15, F.intervalMin) * 6e4;
    !g.get(J.followers, null) || gL ? (G(Y("status_first"), "work"), setTimeout(() => YL(false), 3500)) : (G(Y("status_upto", B(gx)), "ok"), 
    YR(), setTimeout(() => {
      if (v()) Yz().catch(() => {});
    }, 9e3)), setInterval(() => {
      if (!m || m.style.display !== "flex") return;
      m.querySelectorAll(".ghd-time[data-ts]").forEach(gX => {
        gX.textContent = B(Number(gX.dataset.ts));
      });
    }, 3e4);
//#plus-off punto de mira: el temporizador que rastrea cuentas ajenas
    setInterval(() => {
      if (!v() || l || C) return;
      C = true, Yq().catch(() => {}).finally(() => {
        C = false;
      });
    }, 3e5);
//#plus-on
  }
  if (document.body) gk(); else window.addEventListener("DOMContentLoaded", gk);
})();
