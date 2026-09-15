# Unleash Focus

Chrome extension, Manifest V3, plain JS, no build step. Load the folder unpacked to test; reload the extension after changing `background.js` or `manifest.json`.

## Workflow

- Work on a branch, open a PR with a description, merge it with `gh pr merge --merge --delete-branch`, then sync local `main`.
- After merging a significant change (a user-visible fix or feature), ask whether to cut a release. Don't assume either way.

## Writing

- No em dashes anywhere: docs, store copy, popup text, commit messages, PR descriptions. Use a comma, a colon, or a new sentence instead.
- Plain language in anything a user reads: README, store listing, privacy policy, popup text. No jargon. Say what happens, not how it's built. Technical detail lives under the README's "For developers" heading.
- The README shows the screenshots from `store/`. When `store/render.sh` regenerates them, check the README still matches.

## Releasing

Every Chrome Web Store upload needs a higher `version` in `manifest.json`, so a release is:

1. Bump `version` in `manifest.json` (branch, PR, merge, as above).
2. Build the upload from a clean `main` with `sh scripts/package.sh`, which writes `dist/unleash-focus-<version>.zip`.
3. `gh release create v<version> dist/unleash-focus-<version>.zip --target main --title v<version> --notes "..."` with a short list of what changed. The store has no changelog field; GitHub Releases is the changelog.
4. If the change affects the store description, update `store/LISTING.md` too, and paste the new text into the developer dashboard when uploading.

The store zip is built with `git archive`; anything that shouldn't ship (docs, scripts, store assets, this file) is marked `export-ignore` in `.gitattributes`.
