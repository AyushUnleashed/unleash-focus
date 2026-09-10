# Focus Lock

A Chrome extension that locks and unlocks a list of distracting sites with one click.

Click the padlock to lock: the shackle drops shut with a clunk and every site on your list is blocked, including subdomains and embeds. Click it again to unlock. The toolbar icon shows the current state — brass and closed when locked, grey and open when not.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.
3. Pin Focus Lock from the puzzle-piece menu.
4. Optional: in the extension's **Details**, turn on **Allow in Incognito** so blocked sites don't open in incognito windows.

After changing the code, click the reload arrow on the extension's card.

## Use

- Add sites in the popup (or "Add <current site>"). `x.com` and `instagram.com` are there on first install.
- Click the lock, or press **Option+Shift+L** (Alt+Shift+L on Windows/Linux). Change the shortcut at `chrome://extensions/shortcuts`.
- While locked you can add sites but not remove them — unlock first.
- "Mute sound" in the popup footer turns the lock sounds off.

## How blocking works

- A `declarativeNetRequest` rule redirects requests to listed domains to `blocked.html`.
- Sites with a service worker (e.g. x.com) can load from cache without a network request, so `background.js` also watches tab URLs and redirects any tab that lands on a listed site.
- Locking also redirects tabs that are already open on listed sites.

Everything is stored locally in `chrome.storage`; nothing is sent anywhere. Sounds are synthesized with Web Audio (`sounds.js`). The Archivo font is bundled under the SIL Open Font License (`fonts/OFL.txt`).
