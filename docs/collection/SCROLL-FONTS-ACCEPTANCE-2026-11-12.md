# Scroll ownership and Collection font acceptance — 12 November 2026

## Scope and confirmed causes

- SILLAGE's directory stopped Lenis, but its CSS import followed font-face declarations and was discarded. PageDown moved the underlying document by 700px in the baseline reproduction. ODDS, RALLY and BERTH had the same misplaced import. All four now import Lenis CSS from their existing TypeScript entrypoints.
- SILLAGE, ODDS and RALLY lock the root while a native modal is open, including reduced motion where there is no Lenis. Lenis pauses for a modal and resumes on close; a chapter-link click resumes synchronously before navigation because the native close event is queued. Recreating Lenis after a motion-preference change respects an already-open modal.
- ODDS applied unconditional containment and `data-lenis-prevent` to tables with no vertical height cap. A fitting table swallowed vertical wheel input. It now keeps vertical input on the document and only guards native horizontal scrolling when an open table actually overflows horizontally.
- Restoring the Lenis stylesheet exposed BERTH's fitting-directory guard. Its existing measurement/RAF now enables containment only for actual vertical overflow, including after opening, resizing and font load. The existing binding-text overflow guard remains intact.

No interpolation constants, narrative timing, artwork, work font files or animation clocks changed.

## Collection font result

Four text subsets serve seven gallery entrances; independent works keep the original files. Derivative family names, complete license links, source/output/license hashes, coverage, tool versions and all original variable-axis ranges are recorded in the manifest and [generation guide](FONT-SUBSETS.md).

| Measurement | Original | With subsets |
| --- | ---: | ---: |
| Four selected WOFF2 files | 769,544 bytes | 217,756 bytes |
| Cold homepage font response bodies at 390×844 | 1,526,812 bytes | 975,024 bytes |
| Font requests | 32 | 32 |

The reduction is 551,788 bytes: 71.7% of these four files and 36.1% of the measured cold homepage font bodies. This is a byte measurement, not a load-time claim. A warm visitor who already cached the original work fonts has a different tradeoff.

For the before/after browser comparison, original font bytes were routed into the same built page at the subset URLs. Chromium at DPR 1 and reduced motion rendered the seven affected title groups at all six required sizes. All 42 title-group comparisons had zero changed pixel channels. Full Collection opening frames and INKSCAPE/MEND gallery frames were also inspected. Later cached font measurements were excluded from the cold-byte comparison.

The pinned external Python 3.12.10 environment regenerated all four subsets and the manifest byte-for-byte with `--check`. Python/fontTools are generation tools only; normal builds and CI do not install them.

## Validation performed

- `npm run verify`: 1,017 Node tests passed, TypeScript/root production build passed, 2,094 HTML/CSS references verified at `/`.
- Project-path build and `npm run verify:build`: passed, 2,094 references verified under `/ai-web-experience-collection/`.
- `npm run test:browser`: 28 Chromium checks passed, desktop 1440×900 and phone-size 390×844, normal and reduced motion. [Coverage and commands](BROWSER-CHECKS.md).
- Real keyboard/wheel checks reproduce the original failures before the fix and pass afterwards. The suite covers modal background lock, internal scrolling, Escape/focus, chapter navigation, motion-preference changes while open, ODDS independent input axes, BERTH overflow/resize behavior, Collection entry/return offset and focus, JavaScript-disabled native entry, and font text geometry/coverage. No application console errors were recorded across the input/navigation journeys.
- Ego Browser complete-frame review at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160: SILLAGE directory, ODDS expanded comparison tables, RALLY directory and BERTH directory. These frames use reduced motion to inspect stable compositions. All 24 frames had no document horizontal overflow and no failed visible images. Menus remained readable and controls visible. VERDANT's unchanged opening was also inspected at 1920×700 after fonts loaded.
- `git diff --check`: passed. Screenshots, temporary browser drivers, logs and generated build outputs stay outside version control.

The Verify workflow now runs the browser suite after its project-path build and retains failed traces/screenshots for seven days. Only the root lockfile was changed; the new development packages are Playwright and its matching test/core packages, with existing dependency versions retained.

## Limits and remaining observations

Local validation used Windows Chromium. Phone dimensions emulate a viewport; they do not certify physical touch devices. Safari/iOS, Firefox, real OS preference changes, assistive technology, high-refresh hardware, throttled networks and long sessions were not tested. This was a focused regression pass, not an exhaustive reacceptance of every interaction in all 55 works. The updated GitHub workflow has not yet run remotely.

Existing build warnings remain: CHRYSALIS has a redundant late CSS import (its TypeScript scroll controller already imports Lenis CSS), some pre-existing base-prefixed material/font URLs resolve at runtime and the build reports large chunks/plugin timing. Both build-reference checks passed; these unrelated warnings were not expanded into this change.
