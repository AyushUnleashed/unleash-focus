const SITES_RULE_ID = 1;
const SHORTS_RULE_ID = 2;
const DEFAULT_SITES = ["x.com", "instagram.com"];
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");

async function getState() {
  const { sites = [], locked = false, blockShorts = true } = await chrome.storage.local.get([
    "sites",
    "locked",
    "blockShorts",
  ]);
  return { sites, locked, blockShorts };
}

// What a URL is blocked as while locked: the site's hostname, "shorts", or null if it's allowed.
function blockedAs(url, { sites, blockShorts }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.protocol.startsWith("http")) return null;
  const host = parsed.hostname;
  if (sites.some((site) => host === site || host.endsWith("." + site))) return host;
  const onYouTube = host === "youtube.com" || host.endsWith(".youtube.com");
  if (blockShorts && onYouTube && /^\/shorts(\/|$)/.test(parsed.pathname)) return "shorts";
  return null;
}

function blockTabIfNeeded(tabId, url, state) {
  const label = url && blockedAs(url, state);
  if (label) chrome.tabs.update(tabId, { url: `${BLOCKED_URL}#${label}` });
}

// Rules only catch new navigations, so send tabs that are already open to the blocked page.
async function blockOpenTabs(state) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) blockTabIfNeeded(tab.id, tab.url, state);
}

async function applyState() {
  const state = await getState();
  const { sites, locked, blockShorts } = state;
  const rules = [];

  if (locked && sites.length) {
    rules.push({
      id: SITES_RULE_ID,
      priority: 1,
      // The capture group carries the hostname to the blocked page, e.g. blocked.html#www.instagram.com
      action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}#\\1` } },
      // requestDomains also matches subdomains (m.youtube.com, old.reddit.com, ...)
      condition: {
        requestDomains: sites,
        regexFilter: "^https?://([^/:?#]+)",
        resourceTypes: ["main_frame", "sub_frame"],
      },
    });
  }
  if (locked && blockShorts) {
    rules.push({
      id: SHORTS_RULE_ID,
      priority: 1,
      action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}#shorts` } },
      condition: {
        regexFilter: "^https?://([a-z0-9-]+\\.)*youtube\\.com/shorts([/?#]|$)",
        resourceTypes: ["main_frame"],
      },
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [SITES_RULE_ID, SHORTS_RULE_ID],
    addRules: rules,
  });

  // Toolbar icon mirrors the state: grey open padlock, or brass closed padlock on blue.
  const look = locked ? "locked" : "open";
  await chrome.action.setIcon({ path: { 16: `icons/${look}-16.png`, 32: `icons/${look}-32.png` } });
  await chrome.action.setTitle({ title: locked ? "Focus Lock: locked" : "Focus Lock: open" });

  if (rules.length) await blockOpenTabs(state);
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    const { sites } = await chrome.storage.local.get("sites");
    if (!sites) await chrome.storage.local.set({ sites: DEFAULT_SITES, locked: false });
  }
  await applyState();
});
chrome.runtime.onStartup.addListener(applyState);

// Sites with a service worker (x.com) load pages from cache without a network request,
// and YouTube opens Shorts without a page load, so the rules never see either.
// Catch those tabs as their URL changes instead.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url?.startsWith("http")) return;
  const state = await getState();
  if (state.locked) blockTabIfNeeded(tabId, changeInfo.url, state);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.sites || changes.locked || changes.blockShorts)) applyState();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-lock") return;
  const { locked } = await getState();
  await chrome.storage.local.set({ locked: !locked });
});
