// Runs on Instagram with hide.js. Instagram only keeps a post's <video> while the post is on screen,
// so hiding "posts with a video" in CSS alone flickers: hidden, video removed, shown, video back, hidden.
// Instead, remember each post seen with a video (by its link) and mark it for reels.css to keep hidden.
(() => {
  const MARK = "data-unleash-focus-reel";
  const reelPosts = new Set();
  const postId = (article) => article.querySelector('a[href*="/p/"]')?.pathname.match(/\/p\/([^/]+)/)?.[1];

  function markReels() {
    if (!document.documentElement.hasAttribute("data-unleash-focus-reels")) return;
    for (const video of document.querySelectorAll("article video")) {
      const article = video.closest("article");
      article.setAttribute(MARK, "");
      const id = postId(article);
      if (id) reelPosts.add(id);
    }
    // Instagram redraws posts as you scroll; catch a known reel before its video comes back.
    for (const article of document.querySelectorAll(`article:not([${MARK}])`)) {
      if (reelPosts.has(postId(article))) article.setAttribute(MARK, "");
    }
  }

  // Runs on page changes, and when hide.js flags the page on lock.
  new MutationObserver(markReels).observe(document, {
    childList: true,
    subtree: true,
    attributeFilter: ["data-unleash-focus-reels"],
  });
})();
