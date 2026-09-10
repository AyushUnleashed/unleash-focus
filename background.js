const RULE_ID = 1;
const DEFAULT_SITES = ["x.com", "instagram.com"];
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");

async function getState() {
  const { sites = [], locked = false } = await chrome.storage.local.get(["sites", "locked"]);
  return { sites, locked };
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function matchesSite(host, sites) {
  return sites.some((site) => host === site || host.endsWith("." + site));
}

function blockTabIfNeeded(tabId, url, sites) {
  const host = url && hostOf(url);
  if (host && matchesSite(host, sites)) {
    chrome.tabs.update(tabId, { url: `${BLOCKED_URL}#${host}` });
  }
}

// Rules only catch new navigations, so send tabs that are already open to the blocked page.
async function blockOpenTabs(sites) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) blockTabIfNeeded(tab.id, tab.url, sites);
}

async function applyState() {
  const { sites, locked } = await getState();
  const active = locked && sites.length > 0;

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: active
      ? [
          {
            id: RULE_ID,
            priority: 1,
            // The capture group carries the hostname to the blocked page, e.g. blocked.html#www.instagram.com
            action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_URL}#\\1` } },
            // requestDomains also matches subdomains (m.youtube.com, old.reddit.com, ...)
            condition: {
              requestDomains: sites,
              regexFilter: "^https?://([^/:?#]+)",
              resourceTypes: ["main_frame", "sub_frame"],
            },
          },
        ]
      : [],
  });

  // Toolbar icon mirrors the state: grey open padlock, or brass closed padlock on blue.
  const look = locked ? "locked" : "open";
  await chrome.action.setIcon({ path: { 16: `icons/${look}-16.png`, 32: `icons/${look}-32.png` } });
  await chrome.action.setTitle({ title: locked ? "Focus Lock: locked" : "Focus Lock: open" });

  if (active) await blockOpenTabs(sites);
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
// so the rule never sees them. Catch those tabs as their URL changes instead.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url?.startsWith("http")) return;
  const { sites, locked } = await getState();
  if (locked) blockTabIfNeeded(tabId, changeInfo.url, sites);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.sites || changes.locked)) applyState();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-lock") return;
  const { locked } = await getState();
  await chrome.storage.local.set({ locked: !locked });
});
