const stateEl = document.getElementById("state");
const summaryEl = document.getElementById("summary");
const lockBtn = document.getElementById("lock");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const shortsRow = document.getElementById("shortsRow");
const shortsToggle = document.getElementById("shortsToggle");
const form = document.getElementById("addForm");
const input = document.getElementById("siteInput");
const addCurrentBtn = document.getElementById("addCurrent");
const errorEl = document.getElementById("error");
const hintEl = document.getElementById("hint");
const soundBtn = document.getElementById("sound");

let state = { sites: [], locked: false, blockShorts: true, sound: true };
let allowed = new Set(); // sites the user has granted access to
let shownLocked = null; // lock state currently on screen; null until first render
let currentSite = null;

hintEl.textContent = navigator.userAgent.includes("Mac") ? "Shortcut: Option+Shift+L" : "Shortcut: Alt+Shift+L";

// Host permission pattern for a listed site; covers the site and its subdomains.
const originFor = (site) => `*://*.${site}/*`;

// "https://www.YouTube.com/watch?v=1" -> "youtube.com"
function normalize(raw) {
  let value = raw.trim().toLowerCase();
  if (!value) return null;
  if (!/^[a-z]+:\/\//.test(value)) value = "https://" + value;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

// ["a", "b", "c"] -> "a, b and c"
function joinNames(names) {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
}

// -> "x.com and instagram.com", "x.com, instagram.com and YouTube Shorts", "5 sites and YouTube Shorts"
function nameBlocked({ sites, blockShorts }) {
  const names = sites.length <= 2 ? [...sites] : [`${sites.length} sites`];
  if (blockShorts) names.push("YouTube Shorts");
  return joinNames(names);
}

function describe(s) {
  const count = s.sites.length + (s.blockShorts ? 1 : 0);
  if (!count) return "Add a site below, then click the lock.";
  if (!s.locked) return `Click the lock to block ${nameBlocked(s)}.`;
  const one = count === 1 && !s.blockShorts;
  const text = `${nameBlocked(s)} ${one ? "is" : "are"} blocked. Click the lock to open ${one ? "it" : "them"}.`;
  const waiting = s.sites.filter((site) => !allowed.has(site));
  if (!waiting.length) return text;
  return `${text} ${joinNames(waiting)} ${waiting.length === 1 ? "needs" : "need"} access first.`;
}

async function refreshAllowed() {
  const checks = await Promise.all(
    state.sites.map((site) => chrome.permissions.contains({ origins: [originFor(site)] }))
  );
  allowed = new Set(state.sites.filter((_, i) => checks[i]));
}

async function refreshAndRender() {
  await refreshAllowed();
  render();
}

// Call straight from a click: Chrome only shows the permission prompt for a user gesture.
function requestAccess(sites) {
  if (!sites.length) return;
  chrome.permissions.request({ origins: sites.map(originFor) }).then(refreshAndRender, () => {});
}

function animateLock(locked) {
  document.body.classList.remove("just-locked");
  if (locked) {
    void document.body.offsetWidth; // restart the impact animation
    document.body.classList.add("just-locked");
  }
  if (state.sound) LockSounds.play(locked ? "lock" : "unlock");
}

function siteRow(site, locked) {
  const li = document.createElement("li");
  const name = document.createElement("span");
  name.textContent = site;
  const actions = document.createElement("span");
  actions.className = "actions";

  if (!allowed.has(site)) {
    const access = document.createElement("button");
    access.className = "access";
    access.textContent = "Allow access";
    access.title = `Let Unleash Focus block ${site}`;
    access.addEventListener("click", () => requestAccess([site]));
    actions.append(access);
  }
  // No removing sites mid-focus; unlock first.
  if (!locked) {
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${site}`);
    remove.addEventListener("click", () => removeSite(site));
    actions.append(remove);
  }

  li.append(name, actions);
  return li;
}

function render() {
  const { sites, locked, blockShorts, sound } = state;

  if (shownLocked !== null && shownLocked !== locked) animateLock(locked);
  shownLocked = locked;

  document.body.dataset.state = locked ? "locked" : "open";
  stateEl.textContent = locked ? "Locked" : "Open";
  summaryEl.textContent = describe(state);

  lockBtn.setAttribute("aria-pressed", String(locked));
  lockBtn.setAttribute("aria-label", locked ? "Unlock sites" : "Lock sites");
  lockBtn.disabled = !locked && sites.length === 0 && !blockShorts;

  listEl.replaceChildren(...sites.map((site) => siteRow(site, locked)));
  listEl.hidden = sites.length === 0;
  emptyEl.hidden = sites.length > 0;

  // Same rule as the list: no switching Shorts off mid-focus.
  shortsToggle.checked = blockShorts;
  shortsToggle.disabled = locked;
  shortsRow.classList.toggle("is-locked", locked);
  shortsRow.title = locked ? "Unlock to change" : "";

  const canAddCurrent = currentSite && !sites.includes(currentSite);
  addCurrentBtn.hidden = !canAddCurrent;
  if (canAddCurrent) addCurrentBtn.textContent = `Add ${currentSite}`;

  soundBtn.textContent = sound ? "Mute sound" : "Turn sound on";
}

async function save(patch) {
  state = { ...state, ...patch };
  render();
  await chrome.storage.local.set(patch);
}

function addSite(raw) {
  const site = normalize(raw);
  if (!site) return "Enter a web address, like reddit.com.";
  if (state.sites.includes(site)) return `${site} is already on your list.`;
  requestAccess([site]);
  save({ sites: [...state.sites, site] });
  return "";
}

function removeSite(site) {
  save({ sites: state.sites.filter((s) => s !== site) });
  // Give back access the extension no longer needs.
  chrome.permissions.remove({ origins: [originFor(site)] }).catch(() => {});
}

lockBtn.addEventListener("click", () => {
  const locking = !state.locked;
  if (locking) requestAccess(state.sites.filter((site) => !allowed.has(site)));
  save({ locked: locking });
});
shortsToggle.addEventListener("change", () => save({ blockShorts: shortsToggle.checked }));
soundBtn.addEventListener("click", () => save({ sound: !state.sound }));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.textContent = addSite(input.value);
  if (!errorEl.textContent) input.value = "";
  input.focus();
});

input.addEventListener("input", () => {
  errorEl.textContent = "";
});

addCurrentBtn.addEventListener("click", () => {
  errorEl.textContent = addSite(currentSite);
});

Promise.all([
  chrome.storage.local.get(["sites", "locked", "blockShorts", "sound"]),
  chrome.tabs.query({ active: true, currentWindow: true }),
]).then(async ([{ sites = [], locked = false, blockShorts = true, sound = true }, [tab]]) => {
  state = { sites, locked, blockShorts, sound };
  // activeTab exposes the current tab's URL while the popup is open.
  if (tab?.url?.startsWith("http")) currentSite = normalize(tab.url);
  await refreshAndRender();
  // Re-enable transitions once the saved state has painted.
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("instant")));
});

chrome.permissions.onAdded.addListener(refreshAndRender);
chrome.permissions.onRemoved.addListener(refreshAndRender);

// Keep the popup in sync if the keyboard shortcut toggles while it's open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.sites) state.sites = changes.sites.newValue ?? [];
  if (changes.locked) state.locked = changes.locked.newValue ?? false;
  if (changes.blockShorts) state.blockShorts = changes.blockShorts.newValue ?? true;
  if (changes.sound) state.sound = changes.sound.newValue ?? true;
  refreshAndRender();
});
