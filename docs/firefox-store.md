# Firefox Add-ons submission guide

This document contains the release metadata and reviewer information for publishing s&box Enhanced on addons.mozilla.org (AMO).

## Release files

From a clean, committed worktree using Node.js 24 and pnpm 11.7.0, run:

```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm release:firefox
```

Upload these files for version 1.0.0:

- Extension: `build/firefox-mv3-prod.zip`
- Reviewer source: `build/sbox-enhanced-1.0.0-source.zip`

The release command builds Firefox MV3, verifies the generated Chromium and Firefox manifests, runs Mozilla's `web-ext` validator, and archives the committed source. It refuses to create a source archive from a dirty worktree.

The validation gate fails on every error and every warning except two narrowly checked validator cases: Firefox's desktop-only consent metadata is compared against Android's later version threshold, and React DOM's bundled implementation contains its guarded `dangerouslySetInnerHTML` assignment code even though this extension never uses that API. Any warning outside those exact generated contexts fails the release.

## AMO listing

- **Name:** s&box Enhanced
- **Summary:** Launch s&box games, open community trackers, and export creator stats from sbox.game.
- **Category:** Games & Entertainment
- **Platform:** Firefox for desktop
- **Minimum Firefox version:** 140.0
- **License:** MIT
- **Homepage:** https://github.com/TheLime1/sbox-enhanced
- **Support:** https://github.com/TheLime1/sbox-enhanced/issues
- **Privacy policy:** https://github.com/TheLime1/sbox-enhanced/blob/main/PRIVACY.md

### Description

s&box Enhanced makes game and creator-stat pages on sbox.game more useful.

On game pages, it adds a Play button that opens the package directly in s&box through Steam and a Track menu for opening community information on s&box watch or s&boxDB. The controls also work on the Changes, Forum, Reviews, and Metrics pages for games while staying hidden on other package types.

On creator stats pages, it adds local JSON and CSV exports for overview totals and aggregated player data. Filters and multi-page aggregation are processed in the browser, and exported data is never uploaded by the extension.

The extension contains no analytics, advertising, accounts, or background data collection.

### Screenshots

Use the existing browser-neutral images:

1. `assets/screenshots/game-page.png` — Play and Track controls on a game page.
2. `assets/screenshots/popup.png` — Extension popup and project links.

Use `assets/icon.png` as the listing icon if AMO does not extract the packaged 128-pixel icon automatically.

## Data collection declaration

Select **No, this extension does not collect or transmit personal data** wherever AMO asks about data practices. The Firefox manifest declares:

```json
{
  "data_collection_permissions": {
    "required": ["none"]
  }
}
```

This is consistent with [the privacy policy](../PRIVACY.md). Opening Steam, a tracker, GitHub, or another sbox.game page is always initiated by a user clicking a visible link.

## Reviewer notes

Use the following text in the AMO reviewer-notes field:

> The extension is a Plasmo/React Manifest V3 content-script extension. It runs only on https://sbox.game/* and requests no extension API permissions. It does not use browser storage, analytics, remote code, background network requests, or externally hosted runtime assets. Creator-stat exports read the currently displayed sbox.game DOM and create local Blob downloads. Steam, tracker, GitHub, and LimeStudio URLs open only after a user clicks the corresponding link. Firefox for Android is intentionally not declared because the Steam launch workflow targets desktop. Build with Node.js 24 and pnpm 11.7.0 by running `pnpm install --frozen-lockfile` followed by `pnpm package:firefox`; the submitted extension is `build/firefox-mv3-prod.zip`.

The build uses open-source packages distributed through npm. Direct runtime dependencies and versions are declared in `package.json`, while the complete dependency graph and integrity hashes are in `pnpm-lock.yaml`. No private repository or unpublished framework is required.

## Submission checklist

- Confirm the version in `package.json` is higher than the last AMO version.
- Commit all release changes and confirm `git status --short` is empty.
- Run `pnpm release:firefox` and keep its successful validator output.
- Upload the extension ZIP and the matching versioned source ZIP.
- Select Firefox desktop only and minimum version 140.0.
- Apply the listing copy, screenshots, MIT license, and privacy URL above.
- Confirm the AMO data-collection answers say that no data is collected or transmitted.
- Install the signed candidate and repeat the Firefox smoke test before publishing.
