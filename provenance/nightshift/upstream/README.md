# NIGHTSHIFT

**The city does not sleep at once.**

A complete English-language editorial website following one imagined city from midnight to first service. Eleven chapters observe food preparation, care, street maintenance, transit, utilities, and a market before opening. Original generated imagery, selectable text, restrained scroll transitions, and a revisitable ending carry the story.

Meridian City is fictional. Its people, streets, rooms and times are invented. The atlas and diagrams are editorial illustrations, not live services, technical instructions or a real timetable.

## Run locally

Use **Node.js 22.18.0 or later**; Node.js 24 is recommended. npm is required. The Node version matters because the build and verification scripts import TypeScript content through Node's native type stripping. Dependency versions are pinned in `package-lock.json`.

Extract the source ZIP to a regular folder. Open a terminal in the extracted project directory, where `package.json` is located.

On Windows, you may also double-click **`Start-Nightshift.cmd`**. It checks Node, installs locked dependencies if necessary, builds the site, and starts a private loopback preview. Open the address printed in its window. This convenience script is supplied for Windows; the portable commands below are the verified build path.

### Windows PowerShell

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite. Press `Ctrl+C` to stop it.

For a production build and preview:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`. If PowerShell blocks `npm.ps1`, use `npm.cmd` for the same commands, rather than changing a machine-wide execution policy.

### macOS or Linux

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Production build and preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

The source entry uses modules and should be served through Vite. Opening the source `index.html` directly with a `file:` URL is not the interactive run procedure. No API key, account, database or application server is needed. An internet connection is needed for the initial dependency installation; runtime imagery, fonts and scripts are local after building.

## The complete still edition

Visit **`/story.html`** on the local server to read the full experience without JavaScript, animation or sound. The edition includes all eleven chapters and both beats, all five category-route explanations, every before/after image state, conceptual diagram descriptions, and six morning traces with working chapter links.

`scripts/build-still.mjs` generates `public/story.html` from `src/content.ts`. The production build runs it automatically; use `npm run build:stills` after changing copy during development. The generated HTML uses only relative image paths and embedded CSS; its text and links remain usable when JavaScript is disabled. It contains no pretend controls: comparison states are presented side by side, route selections become explicit links, and disclosure content is already readable.

## Chapters and interactions

| Chapter | Observation |
| --- | --- |
| 01 · One Light Left On | A person and a warm window within a dark city |
| 02 · A Night of Many Routes | A fictional atlas with five selectable work categories |
| 03 · Before the Bread | The workbench before and after preparation |
| 04 · The Quiet Corridor | Water, linen and overnight attention without patient imagery |
| 05 · A Clean Start | The same curb before and after sweeping |
| 06 · Between Trains | A quiet inspection scene and a conceptual rail section |
| 07 · Water Below | A utility gallery and an explicitly illustrative diagram |
| 08 · Light on Duty | Ordinary lights and the attention behind them |
| 09 · Before the Market Opens | Sorting work between night and first light |
| 10 · First Service | A prepared platform meeting the morning |
| 11 · The City Is Awake | The original window in daylight and six revisitable traces |

Use normal scrolling or the chapter menu. Chapter links and hashes address real sections. The street comparison provides a labeled range input and Before, After and Reset controls. Motion can be reduced; sound starts off. Keyboard focus, Escape dismissal and focus return belong to the interaction verification matrix.

## Stack and source layout

The project uses Vite, TypeScript, Lenis and GSAP/ScrollTrigger. It keeps text and controls in the DOM, uses SVG for exact editorial diagrams, and uses local generated WebP art for cinematic scenes. It does not claim to be a fully rotatable 3D simulation.

| Path | Purpose |
| --- | --- |
| `src/content.ts` | Eleven chapter records, route filters, morning traces and About copy |
| `src/markup.ts` | Semantic chapter and control markup |
| `src/diagrams.ts` | Accessible, explicitly conceptual SVG diagrams |
| `src/story-state.ts` | Deterministic story and transition evaluation |
| `src/interactions.ts` | User-controlled interaction states |
| `src/styles.css` | Responsive typography, chapter layouts and motion alternatives |
| `public/media/` | Local production art |
| `public/media/fallback/` | Target-specific compact image fallbacks |
| `scripts/build-still.mjs` | Generates the no-JavaScript complete story |
| `scripts/audit-content.mjs` | Static content, language, links and media checks |
| `tests/story-state.test.ts` | Deterministic state checks |
| `VISUAL-BIBLE.md` | Chosen composition, palette and chapter treatments |
| `docs/sources.md` | Consulted primary sources and evidence boundaries |
| `docs/chapter-editorial.md` | Exact primary copy, two beats and interaction outcomes |
| `docs/transition-ledger.md` | Ten boundary contracts and their anchors |
| `docs/media-manifest.json` | Asset dimensions, sizes and retained paths |

The single scrolling clock and deterministic evaluator must remain coordinated when editing. Never add a second Lenis animation loop. A late-loaded asset must not change the identity of a newer active chapter. Keep the source chapter and destination chapter separate during opaque handoffs.

## Verification commands

```bash
npm test
npm run audit:content
npm run build
```

`npm test` exercises story-state logic. `npm run audit:content` checks eleven distinct chapter records, required headings and two beats, valid route/trace destinations, English-only authored text, generated still-edition content and anchors, local WebP presence, matching compact fallbacks, and explicitly labeled source form fields. It reports its static scope and does **not** claim browser verification.

### Actual verification and remaining limits

The complete production browser suite recorded **31 passing tests, zero failures and one intentional skip**: the supplemental viewport sweep runs once in the desktop project instead of being duplicated in the phone project. The pure-state suite recorded **16 passes**. Final static content checks, targeted fixes, build fingerprints and the separate ZIP rebuild are recorded in `evidence/records/` and `docs/requirements-evidence.md`.

Actual tests use Chromium 153.0.8010.0 in a headless virtualized Linux environment. The full main path ran at 1440 × 900 and 390 × 844 CSS pixels; supplemental checks covered the other required viewports, breakpoint neighbors and short landscape. The delivered evidence includes full-resolution chapter and transition captures, six hero states per main viewport, a short actual browser-frame recording, failure/recovery results, and measured startup/transition/memory data.

**True browser zoom, browser-native text finding, and actual background/return are explicit environment limits.** In this headless browser, the real zoom keyboard commands did not alter the viewport or device scale, native text finding failed even on a plain-page control, and opening another tab did not put the story into a hidden state. Corresponding CSS-viewport/DPR reflow checks and a separately labeled synthetic visibility-branch check passed, but do not establish those browser-level behaviors. This is not a claim of completed 125%, 150% and 200% browser-UI zoom testing or full H5/H6/H8 acceptance. Physical Windows/Android devices, Safari, assistive-technology applications and real 4K/high-refresh-rate hardware are not covered by the emulation results. The source is delivered with these limits visible; it is not labeled as having passed every strict acceptance condition.

For your own browser checks:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

The test runner starts a local production preview itself. If you already have a suitable Chromium binary, set `PLAYWRIGHT_EXECUTABLE_PATH` to that local executable. No browser binary or personal browser profile is packaged. The record explains the isolated local Chromium fallback used when the environment's standard browser download and shared preview were unsuitable.

Useful reproducible evidence scripts include `scripts/capture-evidence.mjs`, `scripts/capture-hero-states.mjs`, `scripts/targeted-regressions.mjs`, `scripts/measure-performance.mjs` and `scripts/capture-motion-and-zoom.mjs`. The motion-recording step additionally uses a locally installed FFmpeg executable. These scripts never deploy the site.

Read `docs/evidence-index.md` for the compact evidence map and `docs/known-limitations.md` for the precise boundaries of the claims. Earlier failed attempts remain distinguishable from successful retests; temporary trace caches and redundant working media are excluded from the source archive.

## Artwork, sources and rights

The scenes are AI-generated illustrations produced for this project. They do not depict documented shifts or identifiable patients. Prompts, selected/rejected decisions and retained files are recorded in the art provenance documents. The local copies of required assets are included for reproduction; remote generation services are not runtime dependencies.

Third-party packages and bundled fonts retain their own licenses. Review their included notices and installed package license files before redistribution. Public source links provide evidence for limited contextual or technical claims; they do not grant permission to reuse source photographs, logos or branding. This README makes no independent assertion about copyright exclusivity or a universal commercial-use license for generated images.

The source review is dated November 9, 2026. See `docs/sources.md` for exactly what DSNY, MTA, Lenis, GSAP, Playwright and W3C references support, including retrieval limitations and the distinction between factual context and fiction.

## Scope and release boundary

This is a local source delivery. No public deployment, published preview, Git push, pull request, tag, release or collection modification is part of the handoff. The package contains no account system, analytics, database or paid runtime API dependency.

Browser-emulated viewports do not establish real-device coverage. Accessibility features and tests do not by themselves constitute a claim of full WCAG conformance. Generated images may contain non-documentary approximations; editorial diagrams deliberately omit operational detail. Any remaining implementation issue belongs in the final evidence and known-limitations records, rather than being hidden behind an unqualified completion claim.
