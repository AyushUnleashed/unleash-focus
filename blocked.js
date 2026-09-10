const MIN_SIZE = 28;
const heading = document.getElementById("site");
const host = decodeURIComponent(location.hash.slice(1)).replace(/^www\./, "");

if (host === "shorts") {
  heading.textContent = "YouTube Shorts";
  document.querySelector(".lead").textContent = "are locked while you focus. The rest of YouTube is open.";
  document.title = "YouTube Shorts are locked";
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
