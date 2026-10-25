# VAREN integration acceptance — 25 October 2026

## Scope and import audit

The supplied contemporary tailoring catalogue is integrated as the thirty-eighth independent document at `/varen/`. Existing work runtimes were not edited. Collection entrance/index, credits, canonical/social identity, sitemap, build assertions and collection records are updated together.

Source: `D:/下载/VAREN-source.zip`, 51,265,033 bytes, modified 2026-10-25T17:38:11.804988, SHA-256 `cf82a43eef3782b093736056c50995dca3857f9e097c095accb8f576e64a7ee4`. All 98 entries were inventoried before extraction to a fresh external temporary directory. One `varen/` top-level tree, no traversal or absolute paths. The nested `qa/scroll-trace.zip` is QA evidence and was not extracted or imported. No generated dist/node_modules copies were present. Supplied startup tooling was not executed. All entries in DELIVERY-MANIFEST.json match their supplied bytes/hashes.

Runtime media, font binaries and font license texts were compared byte-for-byte with the archive. Original PNGs, image prompts, design previews, source/design/product records, package version claims (PACKAGE-CLAIMS.json) and historical JSON/Markdown QA evidence remain under `provenance/varen/upstream/`; source ZIP, lockfile, startup command, build configuration and QA raster/video/trace files remain outside the integration. Every archive entry is hashed in the shared import manifest. Upstream documents are source history, not task authorization or current validation.

## Adaptations

- Existing React catalogue retained: six looks, filters, URL-selected details, image closeup, native modal/focus management, saved selection, wardrobe tabs, pinned garment chapter and no-JavaScript content.
- Namespaced media/fonts and base-aware runtime URLs; the shared Collection exit preserves the entrance journey token. Static HTML includes an accessible visible exit as well.
- Root React/React DOM 19.2.6, GSAP 3.15.0 and Lenis 1.3.26 retained. The supplied @gsap/react import is replaced by a small local React layout-effect/gsap.context adapter for exactly the scoped effects used by the supplied components. Dependency versions and the root lockfile are unchanged.
- One Lenis instance, supplied lerp 0.1, syncTouch false and autoRaf false; GSAP ticker owns updates. Hidden documents skip Lenis updates. Reduced motion removes smoothing and pinning. Scoped animation effects revert on cleanup.
- `.gitattributes` preserves VAREN public resource bytes across hosts; only the supplied Hanken OFL has a line-end whitespace exception, retaining its original license bytes.
- AI-generated imagery and not-for-sale statements preserved. No overall application license is inferred; supplied Sentient ITF license and Hanken Grotesk OFL are deployed and linked from credits.

## Validation

| Gate | Result |
| --- | --- |
| Archive manifest and imported asset/font/license byte parity | PASS |
| `npm test` | 451 passed, 0 failed |
| TypeScript and root `npm run build` | PASS |
| Root `npm run verify:build` | PASS, 1,279 HTML/CSS references |
| `npm run build -- --base=/ai-web-experience-collection/` | PASS |
| Project-path `npm run verify:build` | PASS, 1,279 HTML/CSS references |
| `git diff --check` and staged diff check | PASS; original Hanken OFL line-end space retained via a file-specific attribute |

Browser plugin not available. Used installed Playwright CLI 0.1.22 and Chromium against production preview `http://127.0.0.1:4174/ai-web-experience-collection/`. No browser/project dependencies were installed. Target flow: native gallery entrance → VAREN catalogue → filter/detail/save/menu/wardrobe controls → native return to the originating Collection panel.

Browser evidence and temporary automation scripts are outside Git under the local temporary directory. Actual viewport sizes: 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160 (CSS pixels, DPR 1). Initial VAREN frames and the Collection entrance were captured at all six sizes; no horizontal overflow or header/title clipping was measured. The supplied 1440px maximum canvas is intentionally retained on larger screens.

Passed in the browser:

- Correct title, meaningful rendered content, no framework error overlay, no relevant console warnings/errors and no failed resource responses during the complete journey. Local fonts loaded; all six detail images rendered.
- Every category and its expected count; all six garment details; Full look/Detail; all three garment chapter controls; all occasion tabs and keyboard wrap.
- Saving, reload persistence, selection display, removing the last saved look, empty state and explicit visit-only notice when browser storage writes fail.
- Native modal open/Escape close, Tab containment and restoration to the originating garment link. Five menu open/close cycles retain a single pin. Menu-to-wardrobe navigation settles at its authored offset.
- URL-filter Back/Forward, direct `?category=Outerwear&look=tobacco-coat` loading and refresh, reduced-motion no-Lenis/no-pin state, manual reduced-motion chapter selection.
- Simulated fine/normal/large wheel input, fast reversal and arbitrary stops; resize across the six viewports; Chromium lifecycle freeze/reactivation followed by resumed scrolling. These checks do not establish hardware frame-rate performance.
- Home → work → Collection journey token/anchor; no-JavaScript six-look catalogue, visible native Collection exit and native homepage entrance.

During review, the static fallback header was adjusted so the shared exit remains visible on narrow screens. Automation selector ambiguity was resolved by scoping save controls to the open dialog; scroll-destination assertions wait for Lenis to settle rather than using a fixed one-second delay.

## Limits and closeout

Real touch, iOS/Safari, Firefox, physical touchpads and high-refresh displays were not tested. No changes were made to VERDANT or other existing work layouts; the wider historical whole-collection device matrix was not re-run. At integration acceptance, the release/deployment workflow and live production byte comparisons had not been run. Subsequent Git push and workflow status are reported separately in the task closeout.
