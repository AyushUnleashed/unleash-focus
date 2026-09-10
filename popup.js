const stateEl = document.getElementById("state");
const summaryEl = document.getElementById("summary");
const lockBtn = document.getElementById("lock");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const form = document.getElementById("addForm");
const input = document.getElementById("siteInput");
const addCurrentBtn = document.getElementById("addCurrent");
const errorEl = document.getElementById("error");
const hintEl = document.getElementById("hint");
const soundBtn = document.getElementById("sound");

let state = { sites: [], locked: false, sound: true };
let shownLocked = null; // lock state currently on screen; null until first render
let currentSite = null;

hintEl.textContent = navigator.userAgent.includes("Mac") ? "Shortcut: Option+Shift+L" : "Shortcut: Alt+Shift+L";

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

// ["x.com"] -> "x.com", ["x.com", "instagram.com"] -> "x.com and instagram.com", 3+ -> "3 sites"
function nameSites(sites) {
  return sites.length <= 2 ? sites.join(" and ") : `${sites.length} sites`;
}

function describe({ sites, locked }) {
  if (locked) {
    const one = sites.length === 1;
    return `${nameSites(sites)} ${one ? "is" : "are"} blocked. Click the lock to open ${one ? "it" : "them"}.`;
  }
  return sites.length ? `Click the lock to block ${nameSites(sites)}.` : "Add a site below, then click the lock.";
}

function animateLock(locked) {
  document.body.classList.remove("just-locked");
  if (locked) {
    void document.body.offsetWidth; // restart the impact animation
    document.body.classList.add("just-locked");
  }
  if (state.sound) LockSounds.play(locked ? "lock" : "unlock");
}

function render() {
  const { sites, locked, sound } = state;

  if (shownLocked !== null && shownLocked !== locked) animateLock(locked);
  shownLocked = locked;

  document.body.dataset.state = locked ? "locked" : "open";
  stateEl.textContent = locked ? "Locked" : "Open";
  summaryEl.textContent = describe(state);

  lockBtn.setAttribute("aria-pressed", String(locked));
  lockBtn.setAttribute("aria-label", locked ? "Unlock sites" : "Lock sites");
  lockBtn.disabled = !locked && sites.length === 0;

  listEl.replaceChildren(
    ...sites.map((site) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = site;
      li.append(name);
      // No removing sites mid-focus; unlock first.
      if (!locked) {
        const remove = document.createElement("button");
        remove.className = "remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove ${site}`);
        remove.addEventListener("click", () => save({ sites: state.sites.filter((s) => s !== site) }));
        li.append(remove);
      }
      return li;
    })
  );
  listEl.hidden = sites.length === 0;
  emptyEl.hidden = sites.length > 0;

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
  save({ sites: [...state.sites, site] });
  return "";
}

lockBtn.addEventListener("click", () => save({ locked: !state.locked }));
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
  chrome.storage.local.get(["sites", "locked", "sound"]),
  chrome.tabs.query({ active: true, currentWindow: true }),
]).then(([{ sites = [], locked = false, sound = true }, [tab]]) => {
  state = { sites, locked, sound };
  if (tab?.url?.startsWith("http")) currentSite = normalize(tab.url);
  render();
  // Re-enable transitions once the saved state has painted.
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("instant")));
});

// Keep the popup in sync if the keyboard shortcut toggles while it's open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.sites) state.sites = changes.sites.newValue ?? [];
  if (changes.locked) state.locked = changes.locked.newValue ?? false;
  if (changes.sound) state.sound = changes.sound.newValue ?? true;
  render();
});
