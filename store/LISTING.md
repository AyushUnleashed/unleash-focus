# Chrome Web Store listing — Unleash Focus

Everything to paste into the developer dashboard, tab by tab. Images are in this folder; regenerate them with `store/render.sh`. Build the upload with `scripts/package.sh`.

## Package

- Upload `dist/unleash-focus-<version>.zip` (built from the last commit).

## Store listing tab

**Name** (from the manifest): Unleash Focus

**Summary** (from the manifest, 110/132 characters):
Lock distracting sites and YouTube Shorts with one click. Unlock when you're done. Nothing leaves your device.

**Description:**

```
Unleash Focus blocks the sites that pull you away, with one click, on your terms.

Put your distracting sites on a list. Click the padlock and they're blocked until you click it again. No schedules to set up and no timers to fight: lock when you start focusing, unlock when you're done.

Features
• One-click lock and unlock for your whole list.
• The padlock snaps shut with a satisfying clunk, and the toolbar icon shows at a glance whether you're locked.
• Blocks whole sites, including subdomains like m.facebook.com or old.reddit.com.
• Tabs already open on a blocked site switch to the locked page the moment you lock.
• YouTube Shorts switch: blocks Shorts and hides Shorts shelves while the rest of YouTube stays open for tutorials and long videos.
• No sneaking out mid-focus: sites can't be removed and Shorts can't be switched off while locked.
• Keyboard shortcut: Alt+Shift+L (Option+Shift+L on Mac).
• Sounds can be muted.

Privacy
• No account, no tracking, no ads, no servers.
• Your list and settings are stored only on your device.
• Chrome asks for access one site at a time, only for sites you add.
• Open source: github.com/AyushUnleashed/unleash-focus

Tip: to block sites in incognito windows too, open the extension's details in chrome://extensions and turn on "Allow in Incognito".
```

**Category:** Productivity › Workflow & Planning

**Language:** English

**Graphics:**

| Field | File |
| --- | --- |
| Store icon (128×128, 96×96 artwork) | `store-icon-128.png` |
| Screenshot 1 | `screenshot-1-lock.png` |
| Screenshot 2 | `screenshot-2-state.png` |
| Screenshot 3 | `screenshot-3-locked-page.png` |
| Screenshot 4 | `screenshot-4-shorts.png` |
| Screenshot 5 | `screenshot-5-private.png` |
| Small promo tile (440×280) | `promo-small-440x280.png` |
| Marquee promo tile (1400×560, optional) | `promo-marquee-1400x560.png` |

**Additional fields:**
- Mature content: No.
- Homepage URL: https://github.com/AyushUnleashed/unleash-focus
- Support URL: https://github.com/AyushUnleashed/unleash-focus/issues

## Privacy practices tab

**Single purpose:**
Unleash Focus blocks a list of websites the user chooses, and optionally YouTube Shorts, while the user has it locked, and unblocks them when the user unlocks it.

**Permission justifications:**

- **declarativeNetRequestWithHostAccess** — Redirects page requests for sites on the user's block list, and youtube.com/shorts pages, to the extension's own "locked" page while the user has it locked. Rules only act on hosts the user has granted access to.
- **storage** — Saves the user's block list, lock state and settings locally on the device.
- **activeTab** — When the user opens the popup, reads the current tab's address to offer "Add <site>", so they can add the site they're on to the block list with one click.
- **Host permission (\*://\*.youtube.com/\*)** — While locked, blocks youtube.com/shorts pages and uses a content script to hide Shorts shelves and links. The rest of YouTube is not affected, and page content is not read.
- **Optional host permissions (\*://\*/\*)** — Requested one site at a time, only when the user adds that site to their block list, so the extension can redirect it to the locked page. Never requested for sites the user didn't add, and released when the user removes a site.

**Remote code:** No, I am not using remote code.

**Data usage — collected data types:**
- ☑ **Web history** — the extension reads the addresses of pages the user opens on listed sites and on youtube.com, on the device, to decide whether to block them. Addresses are not stored, logged or transmitted.
- ☐ Everything else (personally identifiable information, health, financial, authentication, personal communications, location, user activity, website content).

**Certifications:** check all three —
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/AyushUnleashed/unleash-focus/blob/main/PRIVACY.md

## Test instructions tab

```
No account or login is needed.
1. Click the Unleash Focus padlock in the toolbar. x.com and instagram.com are on the list by default.
2. Click the padlock to lock. Chrome asks for access to those sites; allow it.
3. Open https://x.com — it redirects to the extension's "x.com is locked" page.
4. Open any youtube.com/shorts/ link — it redirects to "YouTube Shorts are locked"; regular YouTube videos still play.
5. Click the padlock again to unlock; the sites open normally.
```

## Distribution tab

- Free. All regions. Visibility: Public.
