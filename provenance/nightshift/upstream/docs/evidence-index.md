# NIGHTSHIFT evidence index

Reviewed **2026-11-09**. Paths below are relative to the project root unless linked. This index identifies actual evidence and its scope; it is not blanket H1–H9 acceptance. The strict environment and review limits are recorded in [known-limitations.md](known-limitations.md), with the full mapping in [requirements-evidence.md](requirements-evidence.md).

## Start here

| Question | Evidence | What it establishes |
| --- | --- | --- |
| What was built? | `README.md`, `VISUAL-BIBLE.md`, `docs/chapter-editorial.md`, `docs/transition-ledger.md` | Local setup, art choices, all 11 chapter functions/two beats and all 10 actual transition implementations. |
| Where did the images come from? | `ASSET-PROVENANCE.md`; `docs/core-art.json`, `supplemental-art.json`, `additional-art.json` | 21 actual image-generation outputs; 17 production and 4 compressed evidence images; exact submitted prompts, selected roles, portable paths and rights limits. |
| Which factual sources were consulted? | `docs/sources.md` | Six required primary sources reviewed on 2026-11-09, including redirects/retrieval limits; fiction and technical guidance kept separate. |
| Does the production source build? | `evidence/records/build.txt`, `unit-tests.txt`, `static-audit.txt` | Final production build, 16 passing pure-state tests and passing static audit. Exact audit count is in the log. |
| Do the interactions work? | `evidence/browser-results.json` | 31 passed, 0 failed, 0 flaky, 1 deliberate skip of a duplicate mobile viewport sweep. Full desktop/390px paths and a desktop-owned risk sweep. |
| Were later logic corrections checked? | `evidence/records/targeted-regressions.json` | 6 passing regressions, including CH-10 arrival at desktop/phone/4K, disclosure resizing, modal pending-scroll cancellation and variant-error recovery. |
| Were native inputs and no-JS tested? | `evidence/records/input-lifecycle.json` | 6 passes (five actual-browser groups plus one explicitly synthetic branch), 0 failures,3 environment blockers. Native keys, touch emulation, scrollbar drag and both no-JS viewports passed. |
| Was the source really unpacked? | `evidence/records/extracted-build.json`, `extracted-build.txt`, `extracted-unit-tests.txt`, `extracted-static-audit.txt` | Separate candidate extraction, 366 manifest hashes, independent `npm ci`/build, 16 state tests, first/middle/last rendered chapters and 34/34 image requests. The exact final ZIP is checked after documentation packaging. |

## Rendered and motion evidence

| Artifact | Recorded scope |
| --- | --- |
| [Desktop overview](../evidence/screenshots/desktop-overview.jpg), [phone overview](../evidence/screenshots/mobile-overview.jpg), [transition overview](../evidence/screenshots/transition-overview.jpg) | Quick view of the actual compositions; not substitutes for the native files. |
| `evidence/records/captures.json` and `evidence/screenshots/` | 122 captures: 22 chapter holds and 100 nominal transition stages at 0/25/50/75/100% on desktop and phone. No recorded page errors/overflow; 199 visible-stage image entries are full resolution. |
| `evidence/records/hero-states.json`; `{desktop,mobile}-hero-*.jpg` | 12 actual captures covering six hero states; first frame precedes delayed application JavaScript. |
| `evidence/records/reading-holds.json`; `*-ch-*-second-beat.jpg` | 22 second-beat holds plus three corrected phone inspection holds; 0 errors/overflow/faded beats. |
| [Independent visual review](independent-visual-review.md), `evidence/before-corrections/` and matching final captures | Seven material findings resolved; weakest initial scenes CH-03/08 and transition 07→08 corrected. Selected hero versus browser art compared separately from functionality. |
| [Actual transition movie](../evidence/recordings/high-risk-transitions.mp4) | 27.485-second, 1440×900 actual browser recording of 01→02, 05→06 and 06→07 forward/reverse. No motion interpolation. |
| [Motion contact sheet](../evidence/recordings/motion-contact-sheet.jpg), [adjacent midpoint frames](../evidence/recordings/midpoint-sequence-contact-sheet.jpg) | 30 progress samples and 43 adjacent encoded rail/water frames were inspected. These are actual captured/decoded frames. |
| `evidence/records/motion-zoom.json`, `motion-zoom-review.md` | Recording timing/counts/hash, inspected subset and capture-method correction; true zoom BLOCKED, equivalent reflow PASS. |
| [Equivalent-reflow sheet](../evidence/zoom/reflow-contact-sheet.jpg) |Nine screenshots at 1152×720/DPR1.25, 960×600/DPR1.5 and 720×450/DPR2. These are explicitly not true browser zoom. |

Native stage filenames are `{desktop,mobile}-tr-AA-BB-{000,025, 050,075,100}.jpg`. Chapter holds use `{desktop,mobile}-ch-NN.jpg`; second beats add `-second-beat`. Numeric suffixes name requested nominal stages; JSON retains actual pixel-rounded progress and scene identity.

## Performance and build identities

[performance-report.md](performance-report.md) summarizes `evidence/records/performance.json`; the original run is preserved separately in `performance-baseline.json`. The final measurement covers `index-DLeUPCK4.js` / `index-D0j9bzfP.css`, with stable before/after fingerprints. It includes three fresh contexts, one simulated slow-4G/4×CPU startup, actual rail/water callback intervals and three warmed JS-heap round trips. None is a physical-device FPS, INP or field-performance guarantee.

The main interaction suite covered `index-5ebL6gaK.js`. The six later logic regressions and motion/zoom evidence covered `index-BuBD98b4.js`. The last build changed the CH-08 phone panel placement; its 320/360/390px holds, native-input/no-JS checks and final performance use the final source. Records are not relabeled as one universal full-suite rerun. The final JavaScript content hash is unchanged from BuBD98b4; the final CSS/index hashes differ.

Machine-specific working-root and external browser-executable paths in the retained browser reports are replaced with `<project>` and `<external PLAYWRIGHT_EXECUTABLE_PATH>` placeholders. Test observations, statuses, counts and timings are unchanged.

## Reproduction and package scope

Use the README for Node 22.18+ installation and Windows PowerShell/POSIX commands. Main entry points are `npm ci`, `npm run build`, `npm test`, `npm run audit:content`, and `npm run test:e2e`. The purpose-specific scripts in `scripts/` capture scenes, hero states, reading holds, performance, motion/zoom, targeted regressions and input/lifecycle behavior. Motion encoding additionally needs FFmpeg/ffprobe; the optional luminance scan uses Python/Pillow. Browser executables can be supplied through `PLAYWRIGHT_EXECUTABLE_PATH` without an embedded private machine path.

The source package retains required production/fallback media, four compressed art-evidence images, final screenshots, the real movie/contact sheets, 30 selected motion samples, portable source, lockfile, notices and records. It excludes generated `dist`, dependencies, caches/browser profiles, original working art PNGs, unreferenced HTML-report data and the 43 redundant adjacent-frame JPEGs already represented by the movie/contact sheet. Capture records may retain working input filenames for provenance; they are not runtime asset dependencies. The actual final ZIP byte count and SHA-256 belong in the handoff; an archive cannot embed its own final hash without changing itself.

No public deployment, published preview, Git push/PR/release or collection modification was performed.
