# Unleash Focus Privacy Policy

_Effective 17 September 2026_

Unleash Focus is a Chrome extension that blocks a list of sites you choose, and optionally YouTube Shorts and Instagram Reels, while you lock it. This policy explains what it handles and what it doesn't.

## What it stores

- The list of sites you add.
- Whether the lock is on, whether YouTube Shorts and Instagram Reels blocking are on, and whether sounds are muted.

These are saved with Chrome's extension storage (`chrome.storage.local`) on your device. They are never sent anywhere.

## What it reads

- **Addresses of pages you open**, only on sites you've given it access to (including Instagram, if you turn on Reels blocking) and on YouTube. It compares the address with your list to decide whether to show the locked page. Addresses are checked in the moment and are not saved, logged or shared.
- **YouTube pages**, only to hide Shorts shelves and links while locked. It doesn't read what you watch or search for.
- **Instagram pages**, only if you turn on Reels blocking, to hide Reels and feed videos while locked. It doesn't read what you look at or your messages.

## What it doesn't do

- No servers, accounts, analytics, tracking, ads or cookies.
- Your data is not sold, shared, or transferred to anyone, and is not used for anything other than blocking the sites you chose.
- No remote code: everything the extension runs ships inside the extension.

## Permissions

| Permission | Why |
| --- | --- |
| Access to sites you add | Redirect those sites to the locked page while locked. Requested one site at a time, when you add it. |
| Access to youtube.com | Block Shorts and hide Shorts shelves while locked. |
| Access to instagram.com | Block Reels and hide them from your feed while locked. Requested when you lock with the Instagram Reels switch on (it starts on), and released when you turn it off. |
| `declarativeNetRequestWithHostAccess` | Redirect blocked pages before they load. |
| `scripting` | Hide Reels on Instagram, only after you allow access to instagram.com. |
| `storage` | Save your list and settings on your device. |
| `activeTab` | Offer "Add <site>" for the tab you're on when you open the popup. |

## Removing your data

Uninstalling the extension deletes everything it stored. You can also remove any site from the list while unlocked.

## Changes and contact

If this policy changes, the new version will be published at this same address with a new effective date. For questions, open an issue at https://github.com/AyushUnleashed/unleash-focus/issues. The source code is public in the same repository, so you can check exactly what the extension does.
