# BERTH

**One night. Ten quiet moments.**

An original, English-language night-train story told through ten chapters, cinematic compartment imagery, real text, and gentle scroll-driven transitions. Shen Ning is travelling to teach her first community writing class. In the lower berth, Ms. Lin is taking her first solo journey after retirement. Two blank cards and an orange-red paper clip travel through the night with them.

The story can be read from beginning to end without making a choice. You can also compare three reading-light settings in Chapter 3, leave a first sentence in Chapter 7, and find that sentence again on the cards in Chapters 9 and 10.

All people, times, places, and dialogue are fictional.

**Verification status:** this is a runnable implementation with partial browser verification. The latest full-art desktop Hero, text interactions, native forward paths and Hero recovery were observed. The shared preview route became unreliable; normal full-art mobile, the complete transition matrix and several responsive/failure gates remain open. Read [the verification record](docs/verification.md) before treating it as fully accepted.

## Run locally

Install **Node.js 24 or newer**, including npm, then extract the complete package into a folder. Keep `package-lock.json`, `public/`, and the source files together.

From that folder:

```sh
npm ci
npm run dev
```

Open the address printed by Vite, normally `http://localhost:5173/`. Use **Ctrl+C** in the terminal to stop the server.

`npm ci` needs access to the npm package registry. Once dependencies have been installed, ordinary development, testing, and production builds do not need an image-generation service, API key, account, database, or paid runtime service. The finished application serves its story, fonts, and prepared images from the local build.

### Windows shortcuts

- Double-click **`Start-BERTH.cmd`** to check Node, install missing dependencies with `npm ci`, and start the development server at `http://127.0.0.1:5173/`.
- Double-click **`Preview-BERTH.cmd`** to check dependencies, create a fresh production build, and preview it at `http://127.0.0.1:4173/`.

Both launchers resolve their own folder with quoted paths and stop with an error when an installation or build fails. Their fixed ports must be available; close another server using the same port before trying again. They have been inspected, but were not executed on Windows during this Linux-based verification session. They do not install Node, change machine settings, or publish the site.

**Do not open `index.html` or a built HTML file through `file://`.** This application uses JavaScript modules and fetched local resources and must be served over HTTP, as the commands above do.

## Test and build

```sh
npm test
npm run build
npm run preview
```

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency graph from `package-lock.json`. |
| `npm run dev` | Start the Vite development server. |
| `npm test` | Run the Node test suite, including narrative continuity, storage failure, Unicode, and reversible-state checks. |
| `npm run build` | Type-check the TypeScript source and produce the static application in `dist/`. |
| `npm run preview` | Serve the existing production build locally, normally on port 4173. |

The source package already contains the prepared WebP images used by the site. **No original generation folder is required for installation or a standard build.** `scripts/prepare-assets.mjs` is an optional asset-authoring utility; it is not a prerequisite for running BERTH. Its original-image paths are provenance information, not runtime dependencies.

A passing state test or successful build is not evidence that every image, transition, input method, or physical device has been visually verified. Read the [verification report](docs/verification.md) for the checks actually performed and their limits.

## Reading and controls

- **Chapters:** Open the chapter menu or use the links in the ending to jump, revisit, and read backwards. No timed waiting or forced playback is required.
- **Light comparison:** Reading, Soft, and Off change only the local experiment in Chapter 3. The next chapter returns to its own story lighting; coming back restores your comparison preference. The reading text stays available when the lamp is off.
- **Your first line:** Choose a suggestion, or edit the textarea and select **Keep this line**. Draft typing alone does not commit a change. Undo restores a previous committed line from the current visit; Restore returns to the default greeting.
- **Text limit:** At most 120 Unicode code points are accepted. A cut stops before a grapheme that would not fit, preserving emoji families, combining marks, and flag pairs. Nonblank text keeps its leading and trailing whitespace; an entirely blank result uses the default greeting.
- **Copy:** Copy your first line from either set of keepsake cards. If browser clipboard access is unavailable, the same location provides selectable text for manual copying.
- **Motion:** Pause motion uses native scrolling and static transition alternatives. Resume motion enables the gentle treatment again. A system reduced-motion preference always takes precedence.
- **Sound:** Sound starts muted on every load. Select the sound control to enable a quiet, original wheel-and-rail texture synthesised in the browser. It stops while the tab is hidden and can be muted at any time. Audio contains no exclusive story information.

The chapter menu supports Escape. Chapter links have real fragment destinations, and necessary text and controls remain semantic HTML rather than being baked into the images.

## What is saved

BERTH saves the committed first line, the Chapter 3 light preference, and the motion preference in `localStorage`, under `berth.user.v1`. There is no account, upload, external text processing, or cross-device synchronisation.

Storage belongs to the browser profile and exact origin. For example, `localhost:5173`, `127.0.0.1:5173`, and `127.0.0.1:4173` have separate saved choices. Clearing this site's browser data removes its saved choices.

If storage is blocked or full, the interactions still apply for the current visit and the interface says that it could not save them for later. Audio activation, draft edits, and the undo history are not persisted across reloads.

## CSS viewport inspection

`tests/viewport.html` is the source inspection harness. Its matching public copy is `public/qa/viewport.html`; Vite copies the public directory into `dist/` during the normal build. The production preview serves the harness at:

```text
http://localhost:4173/qa/viewport.html
```

During development, the public copy is available at `/qa/viewport.html` and the source harness at `/tests/viewport.html`. If you edit the harness, keep the source and public copies in sync.

The harness renders the real app in an iframe with selectable **CSS viewport dimensions**, offers chapter and transition-position shortcuts, and can display the frame at actual size or scale it to fit the host window. “Actual pixels” changes only that display scaling.

Enabling **Warm art** starts desktop and mobile image requests in advance. Those runs count only as **warmed visual inspections**; they must not be reported as cold-load, first-request, or on-demand loading/performance checks.

This is **not real-device emulation**. It does not reproduce a physical phone, its touch hardware, mobile browser chrome, soft keyboard, device pixel ratio, performance, network conditions, or browser engine. A 3840 × 2160 CSS frame is not proof of testing on a physical 4K display. Use the harness for layout inspection; validate device-specific behaviour separately.

## Project guide

| Location | Contents |
| --- | --- |
| `src/story.ts` | Canonical English chapter copy and fixed dialogue. |
| `src/state.ts` | User preferences, safe local persistence, and pure chapter/progress narrative evaluation. |
| `src/render.ts` | Semantic story markup, image sources, and native controls. |
| `src/scroll.ts` | Coordinated Lenis/native scrolling, chapter navigation, and transition progress. |
| `src/interactions.ts` | Light, sentence editing, undo, copy, motion, and menu bindings. |
| `src/ambient.ts` | Gesture-enabled local audio synthesis and lifecycle cleanup. |
| `src/main.ts` | Application assembly and per-picture resource recovery. |
| `src/styles.css` | The visual system, responsive composition, and reduced-motion alternatives. |
| `public/assets/` | Ready-to-use scene images, responsive sizes, previews, and their manifest. |
| `tests/` | State regressions and the CSS viewport inspection harness. |
| `docs/` | Architecture, story continuity, generation provenance, and concept records. |
| `third-party/` | Verbatim license and notice files for the retained third-party packages. |

Read the [architecture guide](docs/architecture.md), [story and continuity ledger](docs/story-and-continuity.md), [image-generation record](docs/image-generation.md), and [sources and license notices](docs/sources-and-licenses.md) for implementation, art, and third-party provenance.

## Pinned tools

| Package | Version |
| --- | --- |
| Vite | `8.3.6` |
| TypeScript | `7.0.2` |
| Lenis | `1.3.27` |
| `@fontsource/cormorant-garamond` | `5.3.0` |
| `@fontsource/dm-sans` | `5.3.0` |

These versions are declared in `package.json`; the complete transitive dependency graph is in `package-lock.json`. Use `npm ci` for a reproducible installation. The experience targets modern browsers with ES2022 support; optional audio and clipboard access have interface fallbacks. Long-input truncation uses the browser's `Intl.Segmenter` implementation.

## Delivery boundary

This is a local, runnable source package. No deployment, repository push, pull request, release, or addition to an existing website collection is part of the package's launch process.
