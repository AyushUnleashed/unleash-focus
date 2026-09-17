const MIN_SIZE = 28;
// Long enough for the popup's padlock animation and sound (popup.html, sounds.js) to finish.
const ANIMATION_MS = 700;
const heading = document.getElementById("site");
// blocked.html?<hostname, "shorts" or "reels">#<the URL that was blocked>
const host = location.search.slice(1).replace(/^www\./, "");
const from = location.hash.slice(1);
// What's locked, and the site that stays open around it.
const part = new Map([
  ["shorts", ["YouTube Shorts", "YouTube"]],
  ["reels", ["Instagram Reels", "Instagram"]],
]).get(host);

if (part) {
  heading.textContent = part[0];
  document.querySelector(".lead").textContent = `are locked while you focus. The rest of ${part[1]} is open.`;
  document.title = `${part[0]} are locked`;
} else if (host) {
  heading.textContent = host;
  document.title = `${host} is locked`;
}

// Shrink the domain until it fits on one line; wrap only if it would get smaller than MIN_SIZE.
function fit() {
  heading.style.fontSize = "";
  heading.style.whiteSpace = "";
  const ratio = heading.clientWidth / heading.scrollWidth;
  if (ratio >= 1) return;
  const size = parseFloat(getComputedStyle(heading).fontSize) * ratio;
  heading.style.fontSize = `${Math.max(size, MIN_SIZE)}px`;
  if (size < MIN_SIZE) heading.style.whiteSpace = "normal";
}

document.fonts.ready.then(fit);
addEventListener("resize", fit);

// Unlocking sends the tab back where it was, once the popup's padlock has swung open.
// Only http(s): any page can open blocked.html with a hash of its choosing.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.locked || changes.locked.newValue) return;
  if (/^https?:\/\//.test(from)) setTimeout(() => location.replace(from), ANIMATION_MS);
});
