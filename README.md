# Unleash Focus

A Chrome extension that locks and unlocks a list of distracting sites — and YouTube Shorts — with one click.

Click the padlock to lock: the shackle drops shut with a clunk and every site on your list is blocked, including subdomains and embeds. Click it again to unlock. The toolbar icon shows the current state — brass and closed when locked, grey and open when not.

## Install (development)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.
3. Pin Unleash Focus from the puzzle-piece menu.
4. Optional: in the extension's **Details**, turn on **Allow in Incognito** so blocked sites don't open in incognito windows.

After changing the code, click the reload arrow on the extension's card.

## Use

- Add sites in the popup (or "Add <current site>"). `x.com` and `instagram.com` are there on first install.
- Chrome asks for access to each site when you add it (or when you first lock). A site without access shows **Allow access** and isn't blocked until you allow it.
- Click the lock, or press **Option+Shift+L** (Alt+Shift+L on Windows/Linux). Change the shortcut at `chrome://extensions/shortcuts`.
- While locked you can add sites but not remove them — unlock first.
- "Mute sound" in the popup footer turns the lock sounds off.

## YouTube Shorts

The **YouTube Shorts** switch (on by default) blocks Shorts without blocking YouTube, so tutorials and long videos stay available. While locked:

- `youtube.com/shorts/…` redirects to the locked page, including Shorts opened from inside YouTube.
- `shorts.css` hides Shorts shelves on home, search, channel and watch pages, the channel Shorts tab, and the Shorts sidebar entry.

Like the site list, the switch can't be turned off while locked. YouTube renames its elements from time to time; if Shorts shelves reappear, the selectors in `shorts.css` need updating.

## How blocking works

- Permissions are minimal: `declarativeNetRequestWithHostAccess` (no install warning), `storage`, `activeTab`, fixed access to youtube.com, and optional access to other sites requested one site at a time.
- A `declarativeNetRequest` rule redirects requests to listed (and allowed) domains to `blocked.html`.
- Sites with a service worker (e.g. x.com) can load from cache without a network request, so `background.js` also watches tab URLs and redirects any tab that lands on a listed site.
- Locking also redirects tabs that are already open on listed sites.

Everything is stored locally in `chrome.storage`; nothing is sent anywhere. See [PRIVACY.md](PRIVACY.md). Sounds are synthesized with Web Audio (`sounds.js`). The Archivo font is bundled under the SIL Open Font License (`fonts/OFL.txt`).

## Publishing

- `scripts/package.sh` builds `dist/unleash-focus-<version>.zip` from the last commit, leaving out docs, scripts and store assets.
- `store/` holds the Chrome Web Store listing copy, privacy answers, icon, screenshots and promo tiles.
- Bump `version` in `manifest.json` for every store update.
