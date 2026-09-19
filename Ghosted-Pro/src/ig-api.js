(function() {
  "use strict";
  const Y = o => new Promise(N => setTimeout(N, o)), t = o => o + Math.floor(Math.random() * o);
 /* Elige la MEJOR version del video. Antes ordenaba de menor a mayor y hacia find(width>=480), que devuelve la primera que pasa el umbral, o sea la mas pequena: Instagram sirve 480/720/1080 y siempre salia 480p. Por eso los videos se veian mal. Ahora coge la mayor. */  function g(o) {
    if (!o || !o.length) return "";
    const N = o.filter(B => B && B.url && B.width);
    if (!N.length) return o[0].url || "";
    const v = N.slice().sort((B, G) => (G.width || 0) - (B.width || 0));
    return v[0].url;
  }
  function k(o) {
    const N = document.cookie.match(new RegExp("(?:^|; )" + o + "=([^;]*)"));
    return N ? decodeURIComponent(N[1]) : null;
  }
  function q() {
    return k("ds_user_id");
  }
  class x extends Error {
    constructor(o, N, v, T) {
      super(o), this.kind = N, this.status = v || 0, this.reason = T || "";
    }
  }
  function z(o) {
    try {
      const N = JSON.parse(o || "{}");
      return String(N.message || N.error_type || N.status || N.error && (N.error.message || N.error.type) || "").slice(0, 160);
    } catch (v) {
      return "";
    }
  }
  function L(o, N, v, T) {
    T = T || {};
    const B = z(v), G = B.toLowerCase();
    if (o === 429 || /rate[_\x20]?limit|ratelimit|feedback_required|too many requests/.test(G) || (o < 200 || o >= 300) && /wait a few|few minutes|unos minutos|try again later|please try again|espera unos/.test(G)) throw new x("rate", "rate", o, B);
    if (/challenge|checkpoint|consent_required/.test(G)) throw new x("challenge", "challenge", o, B);
    if (o === 401 || o === 403 || /login_required|require_login|not logged in/.test(G)) throw new x("auth_" + o, "auth", o, B);
    if (o < 200 || o >= 300) throw new x("http_" + o, "http", o, B);
    if (String(N || "").toLowerCase().indexOf("application/json") === -1 && !F(v)) {
      if (T.htmlClass === "login") throw new x("login_html", "auth", o, "login");
      if (T.htmlClass === "challenge") throw new x("challenge_html", "challenge", o, "challenge");
      throw new x("html_shell", "transport", o, T.finalUrl || "shell");
    }
    try {
      return JSON.parse(v);
    } catch (I) {
      throw new x("not_json", "parse");
    }
  }
  const RLm = new Map;
  function RLkey(o) {
    try {
      return new URL(String(o), "https://www.instagram.com").pathname;
    } catch (e) {
      return String(o);
    }
  }
  function RLset(o) {
    RLm.set(RLkey(o), Date.now() + 3e5);
  }
  function RLchk(o) {
    const q = RLkey(o), t = RLm.get(q);
    if (!t) return;
    if (Date.now() < t) throw new x("rate", "rate", 429, "cooldown");
    RLm.delete(q);
  }
  function RLleft() {
    let m = 0;
    const n = Date.now();
    RLm.forEach(t => {
      if (t > n && t - n > m) m = t - n;
    });
    return m;
  }
  function O(o, N, v) {
    const T = "ghd_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    return new Promise((B, G) => {
      const I = setTimeout(() => {
        window.removeEventListener("message", Y0), document.removeEventListener("ghosted:page-result", Y1), 
        G(new x("page_timeout", "network"));
      }, 18e3);
      function W(Y3) {
        if (!Y3 || Y3.source !== "ghosted-page-fetch" || Y3.id !== T) return;
        clearTimeout(I), window.removeEventListener("message", Y0), document.removeEventListener("ghosted:page-result", Y1);
        if (Y3.error) return G(new x(Y3.error, "network"));
        try {
          B(L(Y3.status, Y3.contentType, Y3.text, Y3));
        } catch (Y4) {
          G(Y4);
        }
      }
      function Y0(Y3) {
        if (Y3.source !== window) return;
        W(Y3.data);
      }
      function Y1(Y3) {
        W(Y3.detail);
      }
      window.addEventListener("message", Y0), document.addEventListener("ghosted:page-result", Y1);
      const Y2 = {
        source: "ghosted-content-fetch",
        id: T,
        url: o,
        mode: N || "minimal"
      };
      v && v.method === "POST" && (Y2.method = "POST", Y2.body = v.body || "", Y2.csrf = v.csrf || ""), 
      window.postMessage(Y2, location.origin), document.dispatchEvent(new CustomEvent("ghosted:page-fetch", {
        detail: Y2
      }));
    });
  }
  async function X(o) {
    RLchk(o);
    let N;
    try {
      N = await chrome.runtime.sendMessage({
        type: "instagramRead",
        url: o
      });
    } catch (v) {
      throw new x("background_network", "network");
    }
    if (!N || N.error) throw new x(N && N.error || "background_network", "network");
    try {
      return L(N.status, N.contentType, N.text, N);
    } catch (v2) {
      if (v2 && v2.kind === "rate") RLset(o);
      throw v2;
    }
  }
  async function J(o) {
    RLchk(o);
    try {
      return await O(o, "minimal");
    } catch (N) {
      if (N && N.kind === "rate") {
        RLset(o);
        throw N;
      }
      if (!N || N.kind !== "network" && N.kind !== "transport") throw N;
    }
    return X(o);
  }
  function F(o) {
    const N = o.trim();
    return N.startsWith("{") || N.startsWith("[");
  }
  function l(o) {
    return {
      pk: String(o.pk || o.id || o.pk_id || ""),
      username: o.username || "",
      full_name: o.full_name || "",
      pic: o.profile_pic_url || "",
      picHd: o.profile_pic_url_hd || o.profile_pic_url || "",
      is_private: !!o.is_private,
      is_verified: !!o.is_verified
    };
  }
  function c(o) {
    const N = l(o || {});
    return N.bio = o && (o.biography || o.bio) || "", N;
  }
  async function S(o) {
    if (!o) throw new x("missing_user", "http");
    const N = await J("https://www.instagram.com/api/v1/users/" + encodeURIComponent(o) + "/info/");
    if (!N || !N.user) throw new x("profile_missing", "http");
    return c(N.user);
  }
  async function C(o) {
    const N = String(o || "").replace(/^@+/, "").trim();
    if (!N) throw new x("missing_username", "http");
    try {
      const v = "https://www.instagram.com/api/v1/users/web_profile_info/?username=" + encodeURIComponent(N), T = await J(v), B = T && T.data && T.data.user || T && T.user;
      if (!B) throw new x("profile_missing", "http");
      return c(B);
    } catch (G) {
      const I = await b(N).catch(() => []), W = I.find(Y0 => Y0.username.toLowerCase() === N.toLowerCase());
      if (!W || !W.pk) throw G;
      try {
        return await S(W.pk);
      } catch (G2) {
        return c({
          pk: W.pk,
          id: W.pk,
          username: W.username,
          full_name: W.full_name,
          profile_pic_url: W.pic,
          is_private: W.is_private,
          is_verified: W.is_verified
        });
      }
    }
  }
  let U = 0;
  function j(o, N, v) {
    let T = "https://www.instagram.com/api/v1/friendships/" + encodeURIComponent(o) + "/" + N + "/?";
    if (U === 0) {
      T += "count=100&query=";
      if (N === "followers") T += "&search_surface=follow_list_page";
    } else U === 1 ? T += "count=50&query=" : T += "count=12";
    if (v) T += "&max_id=" + encodeURIComponent(v);
    return T;
  }
  async function y(o, N, v) {
    while ([]) try {
      return await J(j(o, N, v));
    } catch (T) {
      const B = T && T.kind === "http" && (T.status === 404 || T.status === 400);
      if (B && U < 2) {
        U++;
        continue;
      }
      throw T;
    }
  }
  const H = {
    followers: "c76146de99bb02f6415203be841dd25a",
    following: "d04b0a864b4b54837c0d870b0e77e076"
  }, R = {
    followers: "edge_followed_by",
    following: "edge_follow"
  };
  async function h(o, N, v, T) {
    if (!o) throw new x("no_pk", "http");
    const B = H[N], G = R[N];
    if (!B) throw new x("bad_kind", "http");
    const I = T || 120, W = new Set, Y0 = [];
    let Y1 = null, Y2 = 0, Y3 = true;
    while ([]) {
      const Y4 = {
        id: String(o),
        first: 50
      };
      if (Y1) Y4.after = Y1;
      const Y5 = "https://www.instagram.com/graphql/query/?query_hash=" + B + "&variables=" + encodeURIComponent(JSON.stringify(Y4)), Y6 = await J(Y5), Y7 = Y6 && Y6.data && Y6.data.user, Y8 = Y7 && Y7[G];
      if (!Y8) throw new x("gql_no_edge", "parse");
      for (const YY of Y8.edges || []) {
        const Yt = YY && YY.node;
        if (!Yt) continue;
        const Yg = l({
          pk: Yt.id,
          username: Yt.username,
          full_name: Yt.full_name,
          profile_pic_url: Yt.profile_pic_url,
          is_private: Yt.is_private,
          is_verified: Yt.is_verified
        });
        if (!Yg.pk || W.has(Yg.pk)) continue;
        W.add(Yg.pk), Y0.push(Yg);
      }
      Y2++;
      if (v) v(Y0.length, Y0.slice());
      const Y9 = Y8.page_info || {};
      if (Y9.has_next_page && Y9.end_cursor) Y1 = Y9.end_cursor, await Y(t(650)); else break;
      if (Y2 >= I) {
        Y3 = false;
        break;
      }
    }
    return {
      users: Y0,
      complete: Y3
    };
  }
  async function K(o, N, v, T) {
    const B = [ "rest", "gql" ];
    let G = null;
    for (let I = 0; I < B.length; I++) try {
      const W = B[I] === "gql" ? await h(o, N, v, T) : await M(o, N, v, T);
      if (W && W.users && (W.users.length || W.complete)) return W;
      G = new x("empty_" + B[I], "http");
    } catch (Y0) {
      if (Y0 && Y0.kind === "rate") throw Y0;
      G = Y0;
    }
    throw G || new x("rel_all_failed", "http");
  }
  async function r(o, N) {
    const v = q();
    if (!v) throw new x("no_session", "auth");
    return K(v, o, N, 120);
  }
  async function Q(o) {
    const N = o || q();
    if (!N) return null;
    try {
      const v = await J("https://www.instagram.com/api/v1/users/" + N + "/info/");
      if (v && v.user && Number.isFinite(v.user.follower_count) && Number.isFinite(v.user.following_count)) return {
        followers: v.user.follower_count,
        following: v.user.following_count
      };
    } catch (T) {}
    return null;
  }
  async function Z() {
    const o = q();
    if (!o) throw new x("no_session", "auth");
    const N = await J("https://www.instagram.com/api/v1/feed/user/" + o + "/story/"), v = N.reel || N.reels && N.reels[o] || N, T = v && v.items || [];
    return T.map(B => {
      const G = B.image_versions2 && B.image_versions2.candidates || [], I = G.slice().sort((W, Y0) => W.width * W.height - Y0.width * Y0.height)[0];
      return {
        mediaId: String(B.pk || (B.id ? String(B.id).split("_")[0] : "")),
        fullId: B.id ? String(B.id) : null,
        takenAt: B.taken_at ? B.taken_at * 1e3 : Date.now(),
        isVideo: !(!B.video_versions || !B.video_versions.length),
        thumbUrl: I && I.url || null
      };
    }).filter(B => B.mediaId);
  }
  async function i(o, N) {
    const v = new Set, T = [];
    let B = null, G = 0;
    while ([]) {
      let I = "https://www.instagram.com/api/v1/media/" + o + "/list_reel_media_viewer/?supported_capabilities_new=%5B%5D";
      if (B) I += "&max_id=" + encodeURIComponent(B);
      let W;
      try {
        W = await J(I);
      } catch (Y1) {
        if (Y1.kind === "rate") throw Y1;
        break;
      }
      const Y0 = Array.isArray(W.viewers) && W.viewers.length ? W.viewers : (W.users || []).map(Y2 => ({
        user: Y2
      }));
      for (const Y2 of Y0) {
        const Y3 = l(Y2.user || Y2);
        if (!Y3.pk || v.has(Y3.pk)) continue;
        v.add(Y3.pk), Y3.hasLiked = !!Y2.has_liked, Y3.replyText = Y2.reply_text || null, 
        Y3.isSpamViewer = !!Y2.is_spam_viewer, T.push(Y3);
      }
      G++;
      if (N) N(T.length);
      if (W.next_max_id) B = W.next_max_id, await Y(t(500)); else break;
      if (G > 60) break;
    }
    return T;
  }
  async function f(o) {
    if (!o) return {
      active: false,
      latestTs: 0,
      count: 0
    };
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=" + encodeURIComponent(o));
    } catch (G) {
      if (G && G.kind === "rate") throw G;
      return {
        active: false,
        latestTs: 0,
        count: 0,
        error: true
      };
    }
    let v = null;
    if (Array.isArray(N.reels_media)) v = N.reels_media.find(I => String(I.id) === String(o)) || N.reels_media[0];
    if (!v && N.reels) v = N.reels[o] || Object.values(N.reels)[0];
    const T = v && v.items || [];
    let B = 0;
    if (v && v.latest_reel_media) B = v.latest_reel_media * 1e3; else if (T.length) B = Math.max.apply(null, T.map(I => (I.taken_at || 0) * 1e3));
    return {
      active: T.length > 0,
      latestTs: B,
      count: T.length
    };
  }
  async function s(o) {
    if (!o) return [];
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=" + encodeURIComponent(o));
    } catch (B) {
      if (B && B.kind === "rate") throw B;
      return [];
    }
    let v = null;
    if (Array.isArray(N.reels_media)) v = N.reels_media.find(G => String(G.id) === String(o)) || N.reels_media[0];
    if (!v && N.reels) v = N.reels[o] || Object.values(N.reels)[0];
    const T = v && v.items || [];
    return T.map(G => {
      const I = !(!G.video_versions || !G.video_versions.length), W = (G.image_versions2 && G.image_versions2.candidates || []).slice().sort((Y0, Y1) => (Y1.width || 0) - (Y0.width || 0));
      return {
        id: String(G.id || G.pk || "").split("_")[0],
        isVideo: I,
        url: I ? g(G.video_versions) : W[0] && W[0].url || "",
        img: W[0] && W[0].url || "",
        ts: (G.taken_at || 0) * 1e3
      };
    }).filter(G => G.url);
  }
  async function M(o, N, v, T) {
    if (!o) throw new x("no_pk", "http");
    const B = T || 80, G = new Set, I = [];
    let W = null, Y0 = 0, Y1 = true;
    while ([]) {
      let Y2;
      if (Y0 === 0) {
        let Y4 = null;
        for (let Y5 = 0; Y5 < 3 && !Y2; Y5++) try {
          Y2 = await y(o, N, W);
        } catch (Y6) {
          if (Y6 && Y6.kind === "rate") throw Y6;
          Y4 = Y6;
          if (Y5 < 2) await Y(400 + Y5 * 500);
        }
        if (!Y2) throw Y4;
      } else Y2 = await y(o, N, W);
      /* Primera pagina vacia y sin mas paginas: en la web del movil Instagram
         a veces contesta asi (200, users: []) a la forma de pedir la lista
         que usa la web de ordenador, en vez de dar error. Se prueba la
         siguiente forma, igual que cuando contesta 400. */
      if (Y0 === 0 && !(Y2.users || []).length && !Y2.next_max_id && U < 2) {
        U++;
        continue;
      }
      const Y3 = Y2.users || [];
      for (const Y7 of Y3) {
        const Y8 = l(Y7);
        if (!Y8.pk || G.has(Y8.pk)) continue;
        G.add(Y8.pk), I.push(Y8);
      }
      Y0++;
      if (v) v(I.length, I.slice());
      if (Y2.next_max_id) W = Y2.next_max_id, await Y(t(650)); else break;
      if (Y0 >= B) {
        Y1 = false;
        break;
      }
    }
    return {
      users: I,
      complete: Y1
    };
  }
  function d(o, N, v) {
    return K(o, "following", N, v || 80);
  }
  function w(o, N, v) {
    return K(o, "followers", N, v || 80);
  }
  async function b(o) {
    const N = String(o || "").replace(/^@+/, "").trim();
    if (N.length < 2) return [];
    const v = "https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=" + encodeURIComponent(N);
    let T;
    try {
      T = await J(v);
    } catch (I) {
      if (I && I.kind === "rate") throw I;
      return [];
    }
    const B = [], G = new Set;
    return (T.users || []).forEach(W => {
      const Y0 = l(W.user || W);
      if (!Y0.pk || !Y0.username || G.has(Y0.pk)) return;
      G.add(Y0.pk), B.push(Y0);
    }), B.slice(0, 12);
  }
  async function mFast(o, N) {
    const v = String(N || "").replace(/^@+/, "").trim().toLowerCase();
    if (!o || !v) throw new x("bad_args", "http");
    const T = await J("https://www.instagram.com/api/v1/friendships/" + encodeURIComponent(o) + "/following/?count=50&query=" + encodeURIComponent(v)), B = T.users || [];
    return {
      follows: B.some(G => String(G.username || "").toLowerCase() === v),
      complete: true
    };
  }
  /* La misma pregunta, mirada desde el otro lado.
     "¿A sigue a B?" se responde normalmente leyendo a quien sigue A. Si A es
     privada y no la sigues, esa lista no se puede leer... pero la respuesta
     tambien esta en los SEGUIDORES de B, y esa si se lee cuando B es publica
     o la sigues. Es la misma informacion por otra puerta. */
  async function mBy(o, N) {
    const v = String(N || "").replace(/^@+/, "").trim().toLowerCase();
    if (!o || !v) throw new x("bad_args", "http");
    if (U < 2) try {
      const G = "https://www.instagram.com/api/v1/friendships/" + encodeURIComponent(o) + "/followers/?count=50&query=" + encodeURIComponent(v);
      const W = (await J(G)).users || [];
      if (W.some(Y0 => String(Y0.username || "").toLowerCase() === v)) return {
        follows: true,
        complete: true
      };
    } catch (Y0) {
      if (Y0 && Y0.kind === "rate") throw Y0;
    }
    const T = await w(o), B = T.users.some(Y1 => String(Y1.username || "").toLowerCase() === v);
    return {
      follows: B,
      complete: T.complete
    };
  }

  async function m(o, N) {
    const v = String(N || "").replace(/^@+/, "").trim().toLowerCase();
    if (!o || !v) throw new x("bad_args", "http");
    if (U < 2) try {
      const G = "https://www.instagram.com/api/v1/friendships/" + encodeURIComponent(o) + "/following/?count=50&query=" + encodeURIComponent(v), I = await J(G), W = I.users || [];
      if (W.some(Y0 => String(Y0.username || "").toLowerCase() === v)) return {
        follows: true,
        complete: true
      };
    } catch (Y0) {
      if (Y0 && Y0.kind === "rate") throw Y0;
    }
    const T = await d(o), B = T.users.some(Y1 => String(Y1.username || "").toLowerCase() === v);
    return {
      follows: B,
      complete: T.complete
    };
  }
  async function Vweb(N) {
    const u = String(N || "").replace(/^@+/, "").trim();
    if (!u) return null;
    const r = await J("https://www.instagram.com/api/v1/users/web_profile_info/?username=" + encodeURIComponent(u));
    const w = r && r.data && r.data.user || r && r.user;
    if (!w) return null;
    return {
      pk: String(w.id || w.pk || ""),
      username: w.username || u,
      full_name: w.full_name || "",
      biography: w.biography || "",
      external_url: w.external_url || "",
      profile_pic_url: w.profile_pic_url || "",
      hd_profile_pic_url_info: w.profile_pic_url_hd ? {
        url: w.profile_pic_url_hd
      } : null,
      follower_count: w.edge_followed_by && w.edge_followed_by.count,
      following_count: w.edge_follow && w.edge_follow.count,
      media_count: w.edge_owner_to_timeline_media && w.edge_owner_to_timeline_media.count,
      is_private: !!w.is_private,
      is_verified: !!w.is_verified,
      is_business: !!w.is_business_account,
      is_professional_account: !!w.is_professional_account,
      category: w.category_name || w.business_category_name || "",
      public_email: w.business_email || "",
      has_highlight_reels: !!w.highlight_reel_count,
      fbid_v2: w.fbid || ""
    };
  }
  async function V(o, N) {
    if (!o && !N) throw new x("no_pk", "http");
    let v = null, vErr = null;
    if (o) try {
      v = await J("https://www.instagram.com/api/v1/users/" + encodeURIComponent(o) + "/info/");
    } catch (e1) {
      if (e1 && e1.kind === "rate") throw e1;
      vErr = e1;
    }
    let T = v && v.user || null;
    if ((!T || !T.username) && N) try {
      const alt = await Vweb(N);
      if (alt) T = alt;
    } catch (e2) {
      if (!vErr) vErr = e2;
    }
    if (!T) throw vErr || new x("profile_missing", "http");
    let B = T.profile_pic_url || "";
    const G = Array.isArray(T.hd_profile_pic_versions) ? T.hd_profile_pic_versions.filter(Y0 => Y0 && Y0.url) : [];
    if (G.length) G.sort((Y0, Y1) => (Y1.width || 0) - (Y0.width || 0)), B = G[0].url; else if (T.hd_profile_pic_url_info && T.hd_profile_pic_url_info.url) B = T.hd_profile_pic_url_info.url;
    let I = T.profile_pic_url || "";
    if ((!I || !B) && N) try {
      const Y0 = await C(N);
      Y0 && Y0.pic && (I = I || Y0.pic, B = B || Y0.picHd || Y0.pic);
    } catch (Y1) {}
    const W = (T.public_phone_country_code ? "+" + T.public_phone_country_code + " " : "") + (T.public_phone_number || "");
    return {
      pk: String(T.pk || T.id || o),
      username: T.username || N || "",
      full_name: T.full_name || "",
      bio: T.biography || "",
      bio_links: (T.bio_links || []).map(Y2 => Y2 && (Y2.url || Y2.lynx_url)).filter(Boolean),
      external_url: T.external_url || "",
      pic: I,
      pic_hd: B || I,
      followers: Number(T.follower_count || 0),
      following: Number(T.following_count || 0),
      posts: Number(T.media_count || 0),
      is_private: !!T.is_private,
      is_verified: !!T.is_verified,
      is_business: !!T.is_business,
      is_pro: !!T.is_professional_account,
      category: T.category || T.category_name || T.business_category_name || "",
      public_email: T.public_email || "",
      public_phone: W.trim(),
      contact_method: T.business_contact_method || "",
      address: [ T.address_street, T.city_name, T.zip ].filter(Boolean).join(", "),
      lat: T.latitude != null ? T.latitude : null,
      lng: T.longitude != null ? T.longitude : null,
      pronouns: Array.isArray(T.pronouns) ? T.pronouns.join("/") : T.pronouns || "",
      fbid: T.fbid_v2 || T.eimu_id || "",
      has_highlights: !!T.has_highlight_reels
    };
  }
  async function n(o) {
    if (!o) return [];
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/highlights/" + encodeURIComponent(o) + "/highlights_tray/");
    } catch (T) {
      if (T && T.kind === "rate") throw T;
      return [];
    }
    const v = N && N.tray || [];
    return v.map(B => {
      const G = B.cover_media || {}, I = [ G.media && G.media.image_versions2 && G.media.image_versions2.candidates, G.image_versions2 && G.image_versions2.candidates ], W = [];
      I.forEach(Y3 => {
        (Y3 || []).forEach(Y4 => {
          if (Y4 && Y4.url) W.push(Y4);
        });
      }), W.sort((Y3, Y4) => (Y4.width || 0) - (Y3.width || 0));
      const Y0 = [], Y1 = Y3 => {
        if (Y3 && Y0.indexOf(Y3) === -1) Y0.push(Y3);
      };
      if (G.full_image_version && G.full_image_version.url) Y1(G.full_image_version.url);
      W.forEach(Y3 => Y1(Y3.url));
      if (G.cropped_image_version && G.cropped_image_version.url) Y1(G.cropped_image_version.url);
      if (B.cover_media_cropped_thumbnail && B.cover_media_cropped_thumbnail.url) Y1(B.cover_media_cropped_thumbnail.url);
      const Y2 = String(G.media_id || G.media && (G.media.pk || G.media.id) || "").split("_")[0];
      return {
        id: String(B.id || ""),
        mediaId: Y2,
        title: String(B.title || ""),
        covers: Y0,
        full: Y0[0] || "",
        count: Number(B.media_count || 0)
      };
    }).filter(B => B.id);
  }
  function D(o) {
    const N = String(o || "").match(/\d{8,}/g) || [];
    let v = "";
    for (const T of N) if (T.length > v.length) v = T;
    return v;
  }
  async function P(o, N, v) {
    const T = String(o || "");
    if (!T) return "";
    let B;
    try {
      B = await J("https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=" + encodeURIComponent(T));
    } catch (Y3) {
      if (Y3 && Y3.kind === "rate") throw Y3;
      return "";
    }
    const G = B.reels && B.reels[T] || Array.isArray(B.reels_media) && B.reels_media[0] || null, I = G && G.items || [];
    if (!I.length) return "";
    const W = Y4 => {
      const Y5 = (Y4.image_versions2 && Y4.image_versions2.candidates || []).slice().sort((Y6, Y7) => (Y7.width || 0) - (Y6.width || 0));
      return Y5.length ? Y5[0].url : "";
    }, Y0 = G && G.cover_media || {};
    if (Y0.full_image_version && Y0.full_image_version.url) return Y0.full_image_version.url;
    const Y1 = (Y0.image_versions2 && Y0.image_versions2.candidates || Y0.media && Y0.media.image_versions2 && Y0.media.image_versions2.candidates || []).slice().sort((Y4, Y5) => (Y5.width || 0) - (Y4.width || 0));
    if (Y1.length && (Y1[0].width || 0) >= 320) return Y1[0].url;
    const Y2 = String(Y0.media_id || Y0.upload_id || Y0.media && (Y0.media.id || Y0.media.pk) || N || "").split("_")[0];
    if (Y2) {
      const Y4 = I.find(Y5 => String(Y5.id || "").split("_")[0] === Y2 || String(Y5.pk || "") === Y2);
      if (Y4) return W(Y4);
    }
    if (v) {
      const Y5 = I.find(Y6 => (Y6.image_versions2 && Y6.image_versions2.candidates || []).some(Y7 => String(Y7.url || "").indexOf(v) !== -1));
      if (Y5) return W(Y5);
    }
    return "";
  }
  async function a(o) {
    const N = String(o || "");
    if (!N) return [];
    let v;
    try {
      v = await J("https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=" + encodeURIComponent(N));
    } catch (G) {
      if (G && G.kind === "rate") throw G;
      return [];
    }
    const T = v.reels && v.reels[N] || Array.isArray(v.reels_media) && v.reels_media.find(I => String(I.id) === N) || Array.isArray(v.reels_media) && v.reels_media[0] || null, B = T && T.items || [];
    return B.map(I => {
      const W = !(!I.video_versions || !I.video_versions.length), Y0 = (I.image_versions2 && I.image_versions2.candidates || []).slice().sort((Y1, Y2) => (Y2.width || 0) - (Y1.width || 0));
      return {
        id: String(I.id || I.pk || "").split("_")[0],
        isVideo: W,
        url: W ? g(I.video_versions) : Y0[0] && Y0[0].url || "",
        img: Y0[0] && Y0[0].url || "",
        ts: (I.taken_at || 0) * 1e3
      };
    }).filter(I => I.url);
  }
  async function A(o, N) {
    const v = await E(o, N, null);
    return v.posts;
  }
  async function Eu(u, N) {
    const nm = String(u || "").replace(/^@+/, "").trim();
    if (!nm) return {
      posts: [],
      next: null
    };
    let B;
    try {
      B = await J("https://www.instagram.com/api/v1/feed/user/" + encodeURIComponent(nm) + "/username/?count=" + (N || 12));
    } catch (e) {
      if (e && e.kind === "rate") throw e;
      return {
        posts: [],
        next: null,
        err: e && e.kind + (e.status ? " " + e.status : "") || "error"
      };
    }
    return Emap(B);
  }
  function Emap(B) {
    const G = B.items || [], I = B.more_available && B.next_max_id ? String(B.next_max_id) : null, W = G.map(Y1 => {
      const Y2 = Y1.carousel_media && Y1.carousel_media[0] || Y1, Y3 = (Y2.image_versions2 && Y2.image_versions2.candidates || []).slice().sort((Y8, Y9) => (Y9.width || 0) - (Y8.width || 0)), Y4 = !(!Y2.video_versions || !Y2.video_versions.length), Y5 = Y3.find(Y8 => (Y8.width || 0) <= 640) || Y3[Y3.length - 1] || Y3[0], Y6 = Y1.carousel_media && Y1.carousel_media.length ? Y1.carousel_media : [ Y1 ], Y7 = Y6.map(Y8 => {
        const Y9 = (Y8.image_versions2 && Y8.image_versions2.candidates || []).slice().sort((Yg, Yk) => (Yk.width || 0) - (Yg.width || 0)), YY = !(!Y8.video_versions || !Y8.video_versions.length), Yt = Y9.find(Yg => (Yg.width || 0) <= 640) || Y9[Y9.length - 1] || Y9[0];
        return {
          isVideo: YY,
          thumb: Yt && Yt.url || "",
          full: Y9.length ? Y9[0].url : "",
          video: YY ? g(Y8.video_versions) : ""
        };
      });
      return {
        id: String(Y1.id || "").split("_")[0] || String(Y1.pk || ""),
        code: Y1.code || "",
        thumb: Y5 && Y5.url || "",
        thumbAlt: Y3.length ? Y3[0].url : "",
        full: Y3.length ? Y3[0].url : "",
        isVideo: Y4,
        video: Y4 ? g(Y2.video_versions) : "",
        media: Y7,
        likes: Number(Y1.like_count || 0),
        comments: Number(Y1.comment_count || 0),
        likesHidden: !!Y1.like_and_view_counts_disabled,
        ts: (Y1.taken_at || 0) * 1e3,
        multi: !!(Y1.carousel_media && Y1.carousel_media.length > 1),
        slides: Y1.carousel_media && Y1.carousel_media.length || 1
      };
    }).filter(Y1 => Y1.thumb || Y1.code);
    return {
      posts: W,
      next: I
    };
  }
  function Ewpm(o) {
    const c = (o.thumbnail_resources || []).slice().sort((a, b) => (b.config_width || 0) - (a.config_width || 0)), t = c.find(d => (d.config_width || 0) <= 640) || c[c.length - 1];
    return {
      isVideo: !!o.is_video,
      thumb: t && t.src || o.thumbnail_src || o.display_url || "",
      full: o.display_url || "",
      video: o.video_url || ""
    };
  }
  async function Ewp(N) {
    const u = String(N || "").replace(/^@+/, "").trim();
    if (!u) return {
      posts: [],
      next: null,
      err: "no_user"
    };
    const r = await J("https://www.instagram.com/api/v1/users/web_profile_info/?username=" + encodeURIComponent(u));
    const w = r && r.data && r.data.user || r && r.user;
    if (!w) return {
      posts: [],
      next: null,
      err: "no_user"
    };
    const T = w.edge_owner_to_timeline_media || {}, G = T.edges || [];
    const W = G.map(e => {
      const n = e.node || {}, k = n.edge_sidecar_to_children && n.edge_sidecar_to_children.edges || [], M = k.length ? k.map(z => Ewpm(z.node || {})) : [ Ewpm(n) ], L = n.edge_liked_by && n.edge_liked_by.count;
      return {
        id: String(n.id || ""),
        code: n.shortcode || "",
        thumb: M[0].thumb,
        thumbAlt: n.display_url || "",
        full: n.display_url || "",
        isVideo: !!n.is_video,
        video: n.video_url || "",
        media: M,
        likes: Number(L == null ? n.edge_media_preview_like && n.edge_media_preview_like.count || 0 : L),
        comments: Number(n.edge_media_to_comment && n.edge_media_to_comment.count || 0),
        likesHidden: !!n.like_and_view_counts_disabled,
        ts: (n.taken_at_timestamp || 0) * 1e3,
        multi: k.length > 1,
        slides: k.length || 1
      };
    }).filter(e => e.thumb || e.code);
    return {
      posts: W,
      next: null
    };
  }
  async function E(o, N, v, U) {
    const pk = String(o || ""), nm = String(U || "").replace(/^@+/, "").trim(), cnt = N || 12;
    const mx = v ? "&max_id=" + encodeURIComponent(v) : "";
    const tries = [];
    if (pk) {
      tries.push([ "www", "https://www.instagram.com/api/v1/feed/user/" + encodeURIComponent(pk) + "/?count=" + cnt + mx ]);
      tries.push([ "i", "https://i.instagram.com/api/v1/feed/user/" + encodeURIComponent(pk) + "/?count=" + cnt + mx ]);
    }
    if (nm) {
      tries.push([ "www", "https://www.instagram.com/api/v1/feed/user/" + encodeURIComponent(nm) + "/username/?count=" + cnt + mx ]);
      tries.push([ "i", "https://i.instagram.com/api/v1/feed/user/" + encodeURIComponent(nm) + "/username/?count=" + cnt + mx ]);
    }
    if (!tries.length && !nm) return {
      posts: [],
      next: null
    };
    let last = "";
    if (nm && !v) try {
      const r0 = await Ewp(nm);
      if (r0.posts.length) return r0;
    } catch (e0) {
      if (e0 && e0.kind === "rate") throw e0;
      last = e0 && e0.kind + (e0.status ? " " + e0.status : "") || "error";
    }
    if (!tries.length) return {
      posts: [],
      next: null,
      err: last || "empty"
    };
    for (const t2 of tries) {
      let r;
      try {
        const B = t2[0] === "i" ? await X(t2[1]) : await J(t2[1]);
        r = Emap(B);
      } catch (e) {
        if (e && e.kind === "rate") throw e;
        last = e && e.kind + (e.status ? " " + e.status : "") || "error";
        continue;
      }
      if (r && r.posts.length) return r;
    }
    return {
      posts: [],
      next: null,
      err: last || "empty"
    };
  }
  async function p(o) {
    if (!o) return [];
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/media/" + encodeURIComponent(o) + "/likers/");
    } catch (v) {
      if (v && v.kind === "rate") throw v;
      return [];
    }
    return (N.users || []).map(l).filter(T => T.pk);
  }
  async function e(o) {
    if (!o) return [];
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/media/" + encodeURIComponent(o) + "/comments/?permalink_enabled=false");
    } catch (v) {
      if (v && v.kind === "rate") throw v;
      return [];
    }
    return (N.comments || []).map(T => l(T && T.user)).filter(T => T.pk);
  }
//#plus-off escritura: solicitudes pendientes, aprobar y rechazar
  async function pReq(o) {
    let N = "https://www.instagram.com/api/v1/friendships/pending/?";
    if (o) N += "max_id=" + encodeURIComponent(o);
    const v = await J(N);
    return {
      users: (v.users || []).map(l).filter(T => T.pk),
      next: v.next_max_id || null
    };
  }
  async function pAct(o, N) {
    const v = String(o == null ? "" : o).replace(/\D/g, "");
    if (!v) throw new x("bad_pk", "other");
    const T = k("csrftoken");
    if (!T) throw new x("no_csrf", "auth");
    const B = "https://www.instagram.com/api/v1/web/friendships/" + v + "/" + N + "/", G = await O(B, "minimal", {
      method: "POST",
      csrf: T,
      body: "container_module=follow_requests"
    });
    const I = String(G && G.status || "").toLowerCase(), W = String(G && (G.message || G.feedback_message) || "").slice(0, 160), Y0 = W.toLowerCase();
    if (I === "ok") return G;
    if (G && G.feedback_required || /wait|few minutes|rate|try\x20again\x20later|feedback_required|spam|limit/.test(Y0)) throw new x("rate", "rate", 0, W);
    if (/challenge|checkpoint|consent_required/.test(Y0)) throw new x("challenge", "challenge", 0, W);
    if (/login|not\x20logged/.test(Y0)) throw new x("auth", "auth", 0, W);
    throw new x("request_refused", "refused", 0, W);
  }
  function pOk(o) {
    return pAct(o, "approve");
  }
  function pNo(o) {
    return pAct(o, "ignore");
  }
//#plus-on
//#plus-off escritura: dejar de seguir
  async function u(o) {
    const N = String(o == null ? "" : o).replace(/\D/g, "");
    if (!N) throw new x("bad_pk", "other");
    const v = k("csrftoken");
    if (!v) throw new x("no_csrf", "auth");
    const T = "https://www.instagram.com/api/v1/friendships/destroy/" + N + "/", B = await O(T, "minimal", {
      method: "POST",
      csrf: v,
      body: "container_module=profile"
    });
    const uf1 = B && B.friendship_status, uf2 = String(B && B.status || "").toLowerCase(), uf3 = String(B && (B.message || B.feedback_message) || "").slice(0, 160), uf4 = uf3.toLowerCase();
    if (uf1 && uf1.following === false) return B;
    if (uf1 && uf1.following === true) throw new x("still_following", "refused", 0, uf3);
    if (uf2 === "ok") return B;
    if (B && B.feedback_required || /wait|few minutes|rate|try\x20again\x20later|feedback_required|spam|limit/.test(uf4)) throw new x("rate", "rate", 0, uf3);
    if (/challenge|checkpoint|consent_required/.test(uf4)) throw new x("challenge", "challenge", 0, uf3);
    if (/login|not\x20logged/.test(uf4)) throw new x("auth", "auth", 0, uf3);
    throw new x("unfollow_refused", "refused", 0, uf3);
  }
//#plus-on
  async function gtray() {
    const o = await J("https://www.instagram.com/api/v1/feed/reels_tray/");
    const N = Array.isArray(o && o.tray) ? o.tray : [], v = q();
    return N.map(T => {
      const B = T.user || {}, G = Object.assign(l(B), {
        reelId: String(T.id || B.pk || ""),
        count: Number(T.media_count || (T.items || []).length || 0),
        latestTs: Number(T.latest_reel_media || 0) * 1e3,
        seenTs: Number(T.seen || 0) * 1e3
      });
      G.unseen = G.latestTs > 0 && G.seenTs < G.latestTs;
      return G;
    }).filter(T => T.pk && String(T.pk) !== String(v) && T.count > 0).sort((T, B) => B.latestTs - T.latestTs);
  }
 /* Un solo viaje para MUCHOS reels. `s()` pide un reel_ids por usuario, asi que una bandeja de 20 personas costaba 20 peticiones en serie -- esa era la lentitud real del modo fantasma, no el pintado. reels_media acepta el parametro repetido. */  function smap(G) {
    const I = !(!G.video_versions || !G.video_versions.length), W = (G.image_versions2 && G.image_versions2.candidates || []).slice().sort((a, b) => (b.width || 0) - (a.width || 0));
    return {
      id: String(G.id || G.pk || "").split("_")[0],
      isVideo: I,
      url: I ? g(G.video_versions) : W[0] && W[0].url || "",
      img: W[0] && W[0].url || "",
      ts: (G.taken_at || 0) * 1e3
    };
  }
  async function sMany(ids) {
    const out = {};
    const list = (ids || []).map(String).filter(Boolean);
    if (!list.length) return out;
    const qs = list.map(id => "reel_ids=" + encodeURIComponent(id)).join("&");
    let N;
    try {
      N = await J("https://www.instagram.com/api/v1/feed/reels_media/?" + qs);
    } catch (e) {
      if (e && e.kind === "rate") throw e;
      return out;
    }
    const reels = [];
    if (Array.isArray(N.reels_media)) N.reels_media.forEach(r => reels.push(r));
    if (N.reels) Object.keys(N.reels).forEach(k2 => {
      const r = N.reels[k2];
      if (r && reels.indexOf(r) === -1) reels.push(r);
    });
    reels.forEach(r => {
      if (!r) return;
      const key = String(r.id || r.user && r.user.pk || "");
      if (!key) return;
      out[key] = (r.items || []).map(smap).filter(it => it.url);
    });
    return out;
  }
  self.GhostedIG = {
    getUserId: q,
    fetchReelsTray: gtray,
//#plus-off escritura: Plus no expone ninguna accion que modifique la cuenta
    unfollow: u,
    pendingRequests: pReq,
    approveRequest: pOk,
    ignoreRequest: pNo,
//#plus-on
    fetchList: r,
    fetchProfileCounts: Q,
    fetchUserProfile: S,
    fetchUserByUsername: C,
    getMyStoryItems: Z,
    getStoryViewers: i,
    getStoryMeta: f,
    fetchFollowingOf: d,
    checkFollows: m,
    checkFollowedBy: mBy,
    searchUsers: b,
    fetchDossier: V,
    fetchHighlights: n,
    fetchHighlightFull: P,
    fetchHighlightStories: a,
    fetchUserPosts: A,
    fetchUserPostsPage: E,
    fetchUserPostsByName: Eu,
    fetchStories: s,
    fetchStoriesMany: sMany,
    fetchPostLikers: p,
    fetchPostComments: e,
    fetchFollowersOf: w,
    mediaSig: D,
    IgError: x,
    rateLeftMs: RLleft,
    checkFollowsFast: mFast
  };
})();
