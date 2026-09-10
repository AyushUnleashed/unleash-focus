// Stands in for the chrome.* APIs so store/render.sh can screenshot the real popup with demo data.
// popup.html#open | #locked | #access  (access: one site still waiting for permission)
const mode = location.hash.slice(1) || "open";
const sites = ["x.com", "instagram.com", "reddit.com"];
if (mode === "access") sites.push("netflix.com");
const noop = { addListener() {} };

window.chrome = {
  storage: {
    local: { get: async () => ({ sites, locked: mode === "locked", blockShorts: true, sound: true }), set: async () => {} },
    onChanged: noop,
  },
  tabs: {
    query: async () => [{ url: mode === "access" ? "https://www.twitch.tv/" : "https://www.netflix.com/browse" }],
  },
  permissions: {
    contains: async ({ origins }) => !origins[0].includes("netflix.com"),
    request: async () => true,
    remove: async () => true,
    onAdded: noop,
    onRemoved: noop,
  },
};
