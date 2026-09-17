// Runs on YouTube and Instagram: flags the page so shorts.css and reels.css hide Shorts and Reels while locked.
// Wrapped in a function because background.js can inject it into an Instagram tab that already runs it.
(() => {
  const state = { locked: false, blockShorts: true, blockReels: true };

  function apply() {
    const root = document.documentElement;
    root.toggleAttribute("data-unleash-focus-shorts", state.locked && state.blockShorts);
    root.toggleAttribute("data-unleash-focus-reels", state.locked && state.blockReels);
  }

  chrome.storage.local.get(Object.keys(state)).then((saved) => {
    Object.assign(state, saved);
    apply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.locked) state.locked = changes.locked.newValue ?? false;
    if (changes.blockShorts) state.blockShorts = changes.blockShorts.newValue ?? true;
    if (changes.blockReels) state.blockReels = changes.blockReels.newValue ?? true;
    apply();
  });
})();
