// Runs on YouTube: flags the page so shorts.css hides Shorts while locked with Shorts blocking on.
const state = { locked: false, blockShorts: true };

function apply() {
  document.documentElement.toggleAttribute("data-focus-lock-shorts", state.locked && state.blockShorts);
}

chrome.storage.local.get(["locked", "blockShorts"]).then(({ locked = false, blockShorts = true }) => {
  Object.assign(state, { locked, blockShorts });
  apply();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.locked) state.locked = changes.locked.newValue ?? false;
  if (changes.blockShorts) state.blockShorts = changes.blockShorts.newValue ?? true;
  apply();
});
