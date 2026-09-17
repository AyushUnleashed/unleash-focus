const SITES_RULE_ID = 1;
const SHORTS_RULE_ID = 2;
const REELS_RULE_ID = 3;
// Instagram Reels are blocked with the same access the popup asks for when instagram.com is on the list.
const REELS_SITE = "instagram.com";
const DEFAULT_SITES = ["x.com", "instagram.com"];
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");
// Long enough for the popup's padlock animation and sound (popup.html, sounds.js) to finish.
const ANIMATION_MS = 700;

// Host permission pattern for a listed site; covers the site and its subdomains.
const originFor = (site) => `*://*.${site}/*`;

async function getState() {
  const {
    sites = [],
    locked = false,
    blockShorts = true,
    blockReels = false,
  } = await chrome.storage.local.get(["sites", "locked", "blockShorts", "blockReels"]);
  // Access is requested per site from the popup; only sites the user allowed can be blocked.
  const allowed = await Promise.all(
    [...sites, REELS_SITE].map((site) => chrome.permissions.contains({ origins: [originFor(site)] }))
  );
  return { sites: sites.filter((_, i) => allowed[i]), locked, blockShorts, blockReels: blockReels && allowed.at(-1) };
}

// What a URL is blocked as while locked: the site's hostname, "shorts", "reels", or null if it's allowed.
function blockedAs(url, { sites, blockShorts, blockReels }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.protocol.startsWith("http")) return null;
  const host = parsed.hostname;
  const isOn = (site) => host === site || host.endsWith("." + site);
  if (sites.some(isOn)) return host;
  if (blockShorts && isOn("youtube.com") && /^\/shorts(\/|$)/.test(parsed.pathname)) return "shorts";
  // /reels/ is the Reels feed, /reel/<id> a single reel.
  if (blockReels && isOn(REELS_SITE) && /^\/reels?(\/|$)/.test(parsed.pathname)) return "reels";
  return null;
}

// The blocked page names the site from the query and goes back to the URL in the hash on unlock.
function blockTabIfNeeded(tabId, url, state) {
  const label = url && blockedAs(url, state);
  if (label) chrome.tabs.update(tabId, { url: `${BLOCKED_URL}?${label}#${url}` });
}

// Rules only catch new navigations, so send tabs that are already open to the blocked page.
// Runs on a delay, so read the state again: the lock may have been opened since.
async function blockOpenTabs() {
  const state = await getState();
  if (!state.locked) return;
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) blockTabIfNeeded(tab.id, tab.url, state);
}

async function applyState() {
  const state = await getState();
  const { sites, locked, blockShorts, blockReels } = state;
  const rules = [];

  if (locked && sites.length) {
    rules.push({
      id: SITES_RULE_ID,
      // Wins over the Shorts and Reels rules, so the locked page names the whole site.
      priority: 2,
      // \1 is the hostname, \0 the whole URL: blocked.html?www.instagram.com#https://www.instagram.com/reels/abc
      // (Chrome replaces only the matched part of the URL, so the regex has to match all of it.)
      action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}?\\1#\\0` } },
      // requestDomains also matches subdomains (m.youtube.com, old.reddit.com, ...)
      condition: {
        requestDomains: sites,
        regexFilter: "^https?://([^/:?#]+).*",
        resourceTypes: ["main_frame", "sub_frame"],
      },
    });
  }
  if (locked && blockShorts) {
    rules.push({
      id: SHORTS_RULE_ID,
      priority: 1,
      action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}?shorts#\\0` } },
      condition: {
        regexFilter: "^https?://([a-z0-9-]+\\.)*youtube\\.com/shorts([/?#]|$).*",
        resourceTypes: ["main_frame"],
      },
    });
  }
  if (locked && blockReels) {
    rules.push({
      id: REELS_RULE_ID,
      priority: 1,
      action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}?reels#\\0` } },
      condition: {
        regexFilter: "^https?://([a-z0-9-]+\\.)*instagram\\.com/reels?([/?#]|$).*",
        resourceTypes: ["main_frame"],
      },
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [SITES_RULE_ID, SHORTS_RULE_ID, REELS_RULE_ID],
    addRules: rules,
  });

  // Toolbar icon mirrors the state: grey open padlock, or brass closed padlock on blue.
  const look = locked ? "locked" : "open";
  await chrome.action.setIcon({ path: { 16: `icons/${look}-16.png`, 32: `icons/${look}-32.png` } });
  await chrome.action.setTitle({ title: locked ? "Unleash Focus: locked" : "Unleash Focus: open" });

  // Redirecting the active tab closes the popup, so let its padlock animation play out first.
  if (rules.length) setTimeout(blockOpenTabs, ANIMATION_MS);
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    const { sites } = await chrome.storage.local.get("sites");
    if (!sites) await chrome.storage.local.set({ sites: DEFAULT_SITES, locked: false });
  }
  await applyState();
});
chrome.runtime.onStartup.addListener(applyState);

// Granting access from the popup (or revoking it in Chrome settings) changes what can be blocked.
chrome.permissions.onAdded.addListener(applyState);
chrome.permissions.onRemoved.addListener(applyState);

// Sites with a service worker (x.com) load pages from cache without a network request,
// and YouTube and Instagram open Shorts and Reels without a page load, so the rules never see them.
// Catch those tabs as their URL changes instead.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url?.startsWith("http")) return;
  const state = await getState();
  if (state.locked) blockTabIfNeeded(tabId, changeInfo.url, state);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.sites || changes.locked || changes.blockShorts || changes.blockReels)) applyState();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-lock") return;
  const { locked } = await chrome.storage.local.get("locked");
  await chrome.storage.local.set({ locked: !locked });
});
