(function() {
  "use strict";
  const Y = {
    tab_activity: "Activity",
    status_watch_adding: "Adding profile to watchlist…",
    status_watch_added: "$1 added to watchlist ✓",
    status_watch_invalid: "Enter a valid username.",
    status_watch_notfound: "Couldn't find that Instagram profile.",
    status_watch_found: "$1 found. Confirm before watching it.",
    status_rate: "Instagram asked to slow down · code $1. Your data is still saved.",
    status_auth: "Instagram rejected the read · code $1. You can check again.",
    status_challenge: "Instagram requires a check on its website · code $1.",
    status_cooldown: "Ready to check Instagram.",
    status_transport: "Instagram returned its website instead of followers · code $1.",
    status_http: "Instagram rejected the request · code $1. Retrying another way.",
    status_reload: "The extension updated — reload this Instagram tab.",
    status_other_tab: "Another Instagram tab is already checking this account.",
    settings_connect_mobile: "📱 Connect phone",
    mobile_title: "Ghosted on your phone",
    mobile_body: "Scan this with your phone camera. Your phone mirrors the extension, read-only. It updates whenever your PC runs a check.",
    mobile_unpair: "Unpair this phone",
    empty_unfollow_load: "I could not load your followers yet.<br>Tap “Check now” to try again.",
    empty_activity: "No profile changes yet.<br>Ghosted will save avatar, name, username and bio changes from the first scan onward.",
    activity_title: "Profile activity",
    activity_desc: "Your followers and following are monitored automatically. Add any profile you want to watch too.",
    activity_desc_own: "Changes to your followers and following are recorded here: who arrives, who leaves and when. Checks run while you have Instagram open in a tab.",
    empty_unfollow_own: "Nobody has unfollowed you since the first check.<br>I'll tell you here and with a notification 👀",
    activity_watch_placeholder: "@username to watch",
    activity_watch_add: "Add",
    activity_watch_search: "Search",
    activity_watch_confirm: "Watch profile",
    activity_watch_cancel: "Cancel",
    activity_manual: "In the crosshairs · $1",
    activity_remove: "Stop watching",
    activity_changed_photo: "Changed their profile picture",
    activity_changed_bio: "Updated their bio",
    activity_changed_name: "Changed their name",
    activity_changed_username: "Changed their username",
    activity_changed_profile: "Updated their profile",
    activity_tag_photo: "photo",
    activity_tag_bio: "bio",
    activity_tag_profile: "profile",
    activity_tag_followers: "followers",
    unlock_title: "Activate Ghosted",
    unlock_copy: "One key activates Ghosted for this Instagram account — forever. Pay once.",
    unlock_price: "€5 · lifetime, single use",
    unlock_buy: "Buy · €5 once",
    unlock_label: "Already have a key?",
    unlock_activate: "Activate",
    unlock_enter_key: "Enter your product key.",
    unlock_checking: "Checking key…",
    unlock_active: "Ghosted activated for this account ✓",
    unlock_bound: "This key is already linked to a different Instagram account.",
    unlock_expired: "This key's 1-year period has ended. Buy a new one to keep using Ghosted.",
    unlock_invalid: "The key is invalid or has not been issued yet.",
    unlock_network: "Couldn't verify the key. Try again.",
    unlock_status: "Activate Ghosted to start.",
    activity_story: "Posted a story",
    activity_link: "Changed their link",
    activity_followers_up: "Gained $1 followers",
    activity_followers_down: "Lost $1 followers",
    activity_new_follower: "New follower: $1",
    new_followers_title: "New followers",
    activity_lost_follower: "$1 unfollowed them",
    lost_followers_title: "Unfollowed them",
    sel_investigate: "Ghosted — open this profile",
    dos_tiktok: "TikTok",
    dos_tiktok_search: "Search TikTok",
    dos_more: "Show more",
    dos_loading_more: "Loading…",
    dos_ghost: "👻 Stories",
    dos_ghost_hint: "Watch their stories without them seeing you did",
    dos_ghost_note: "Ghost mode · leaves no trace in “seen by”",
    dos_ghost_none: "No active stories right now.",
    dos_ghost_all: "⬇ Download all",
    dos_ghost_all_prog: "Downloading $1/$2…",
    dos_ghost_all_done: "$1 downloaded ✓",
    dos_filter_all: "All",
    activity_follow_add: "Started following $1",
    activity_follow_rem: "Unfollowed $1",
    activity_tag_story: "story",
    activity_tag_follow: "follows",
    activity_tag_unfollow2: "unfollowed",
    notif_story: "$1 posted a story 👀",
    notif_follow_add: "$1 followed someone new",
    notif_follow_rem: "$1 unfollowed someone",
    spy_now_follows: "Now follows $1",
    spy_unfollowed: "Unfollowed $1",
    notif_watch_unfollowed_you: "$1 unfollowed YOU 👀",
    notif_watch_changed: "$1 changed who they follow",
    spy_added_c: "+$1 following",
    spy_removed_c: "−$1 following",
    watch_toggle_story: "Alert me about their stories",
    watch_toggle_following: "Track who they follow",
    spy_check_title: "Do they follow each other?",
    spy_a_ph: "account A (@user)",
    spy_b_ph: "account B (@user)",
    spy_check_btn: "Check",
    spy_checking: "Checking…",
    spy_checking_dir: "Checking $1's following list… this can take a few seconds for large accounts",
    spy_need_two: "Enter both usernames.",
    spy_result_mutual: "$1 and $2 follow each other",
    spy_result_a: "$1 follows $2, but not the other way",
    spy_result_b: "$2 follows $1, but not the other way",
    spy_result_none: "Neither $1 nor $2 follow each other",
    spy_result_err: "Couldn't check (private or nonexistent account?)",
    spy_direction_yes: "$1 follows $2",
    spy_direction_no: "$1 doesn't follow $2",
    spy_direction_unknown: "Can't verify if $1 follows $2 — private account you don't follow",
    sugg_following: "you follow",
    spy_hint: "Works only on public accounts or accounts you already follow.",
    dos_open: "Detective — investigate profile",
    dos_loading: "Loading dossier…",
    dos_err: "Couldn't load this profile.",
    dos_err_auth: "Instagram rejected the read. Try again.",
    dos_download: "Download photo (HD)",
    dos_downloading: "Downloading…",
    dos_downloaded: "Saved ✓",
    dos_openpic: "Open photo",
    dos_copyid: "Copy ID",
    dos_watch: "🎯 Watch",
    dos_watching: "🎯 Watching ✓",
    dos_copied: "Copied ✓",
    dos_posts: "posts",
    dos_profile: "Profile",
    dos_web: "Website",
    dos_category: "Category",
    dos_contact: "Public contact",
    dos_address: "Address",
    dos_business: "Business",
    dos_highlights: "Featured stories",
    dos_save: "Save",
    dos_save_hint: "Save this cover to the photo history",
    dos_saving: "…",
    dos_saved: "Saved ✓",
    dos_saved_already: "Already saved",
    dos_photo_history: "Photo history",
    dos_posts_sec: "Posts",
    dos_engagement: "Engagement",
    dos_eng_avg: "Avg: $1 likes · $2 comments per post",
    eng_fire: "🔥 Insane",
    eng_good: "Great",
    eng_ok: "Average",
    eng_low: "Low · possibly fake",
    dos_relations: "Followers & following",
    dos_see_followers: "See followers",
    dos_see_following: "See following",
    dos_rel_hint: "Public accounts, or ones you follow. Shows a sample, not the whole list.",
    dos_rel_loading: "Loading…",
    dos_rel_empty: "Can't read this list (private account you don't follow).",
    dos_rel_more: "Showing the first $1. Open their profile for the full list.",
    dos_rel_search: "Search this list…",
    dos_rel_click_hint: "Tap the followers or following number above to see the list here.",
    dos_rel_nomatch: "No matches in the loaded list.",
    dos_history: "History",
    dos_history_empty: "No changes tracked yet for this account.",
    dos_graph_empty: "The follower graph builds up as you open this profile over time.",
    dos_since_tracking: "since tracking",
    dos_investigate: "Investigate",
    settings_language: "Language",
    nb_search: "Search by name or @username",
    nb_no_match: "No account matches that name.",
    gh_entry: "Live stories (ghost mode)",
    gh_note: "These people have a story up right now. Open it here and Instagram is never told — you will not show up in their viewer list.",
    gh_watch_note: "Ghost mode — Instagram is not told you watched this.",
    gh_refresh: "Refresh",
    gh_loading: "Looking for live stories…",
    gh_loading_one: "Loading their story…",
    gh_empty: "Nobody you follow has a story up right now.",
    gh_no_media: "Couldn't load their story.",
    gh_err: "Instagram did not return the list. Try again in a moment.",
    gh_err_rate: "Instagram asked to slow down. Wait a bit and try again.",
    gh_stories_n: "$1 stories",
    gh_story_1: "1 story",
    gh_unseen: "unseen",
    gh_slide: "$1 of $2",
    gh_play_all: "Play all $1",
    gh_person_of: "$1 of $2",
    gh_badge: "ghost mode",
    gh_pause: "Pause",
    gh_resume: "Resume",
    gh_close: "Close",
    gh_sound: "Sound",
    nb_failed: "Unfollowed $1. $2 failed — Instagram refused them."
  }, g = "ghosted_lang", k = [ {
    code: "auto",
    name: "Auto"
  }, {
    code: "en",
    name: "English"
  }, {
    code: "es",
    name: "Español"
  }, {
    code: "fr",
    name: "Français"
  }, {
    code: "de",
    name: "Deutsch"
  }, {
    code: "it",
    name: "Italiano"
  }, {
    code: "pt_BR",
    name: "Português (BR)"
  }, {
    code: "tr",
    name: "Türkçe"
  }, {
    code: "id",
    name: "Indonesia"
  }, {
    code: "hi",
    name: "हिन्दी"
  }, {
    code: "ru",
    name: "Русский"
  }, {
    code: "ar",
    name: "العربية"
  }, {
    code: "ja",
    name: "日本語"
  } ];
  let q = null;
  function x(F, l) {
    let c = F;
    const S = Array.isArray(l) ? l : [ l ];
    return S.forEach((C, U) => {
      c = c.replace("$" + (U + 1), C == null ? "" : String(C));
    }), c;
  }
  async function z() {
    let F = {};
    try {
      F = await chrome.storage.local.get(g);
    } catch (c) {}
    const l = F[g];
    if (!l || l === "auto") {
      q = null;
      return;
    }
    try {
      const S = await chrome.runtime.sendMessage({
        type: "getLocaleMessages",
        code: l
      });
      q = S && S.messages || null;
    } catch (C) {
      q = null;
    }
  }
  const L = z();
  async function O(F) {
    await chrome.storage.local.set({
      [g]: F
    });
  }
  async function X() {
    let F = {};
    try {
      F = await chrome.storage.local.get(g);
    } catch (l) {}
    return F[g] || "auto";
  }
  function J(F, l) {
    if (q && q[F] != null) return x(q[F], l);
    try {
      const c = chrome.i18n.getMessage(F, l);
      if (c) return c;
    } catch (S) {}
    return x(Y[F] || F, l);
  }
  self.GhostedI18n = {
    t: J,
    ready: L,
    setLocale: O,
    getLocale: X,
    LOCALES: k,
    locale: chrome.i18n.getUILanguage && chrome.i18n.getUILanguage() || "en"
  };
})();
