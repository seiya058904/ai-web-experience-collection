# ORBITAL Batch B — 2026-10-25

Scope: T14 navigation hierarchy, T15 Machine selection causality, and the explicitly authorized phone Moon/body overlap. Batch A destination labels, stable fragment identity, history restoration and mode behavior are retained. No dependency, asset, deployment or Git mutation is part of this change.

## Reproduced before editing

- At 1440×900 and 1440×600, three top chapter shortcuts, an eight-button right rail and an eight-button bottom timeline competed with Mission Index and the local study.
- Propulsion/Guidance screenshots of the reduced Machine hold showed substantially the same model; the original change was faint material emission plus copy.
- The Moon covered tabs/distance/body at 320×568, 390×844, 430×932 and 390×667. The short desktop frame also placed destination prose against its current-chapter caption.

`before.json` and `before-*.png` under the external evidence directory preserve these observations. The existing author model, imagery, chapter titles, scientific caveats and unique clock were the import boundary.

## Changes

The bottom timeline/compact phone progress is the sole persistent chapter navigation. Mission Index still exposes every chapter on demand. Machine has four visibly distinct model-registered functional diagrams and an explicit Whole vehicle reset. The same authored paths and offsets serve WebGL/Canvas; reduced motion keeps their meaning and controls. Phone Moon/model placement uses measured reading space. The current contract is recorded in [DESIGN.md](DESIGN.md).

The first implementation's propellant arrow extended too near the desktop timeline; its engine offset and terminal length were corrected. Initial short-desktop spacing probes also caught insufficient bounding-box separation; both 600px and 390px height cases were corrected and rerun. These were development findings, not final passes.

## Final browser verification

Browser plugin not available. Used the explicitly authorized existing Playwright runtime with installed Chrome1248, Chromium **156.0.8078.4**, SwiftShader, DPR 1. The final dev URL was `http://127.0.0.1:5183/orbital/`; 5173 had shown stale CSS for another work, so final checks assert the fresh server's stylesheet markers. Tests exercise real rendered controls, not source-only contracts.

| Gate | Actual result |
| --- | --- |
| Six required window sizes | PASS: Moon/Mars and five study choices at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 |
| Additional narrow/short windows | PASS: 320×568, 430×932, 390×667, 1440×600, 844×390; destination body clears progress; header/copy/controls remain available |
| Local study stability | PASS: selected button, unchanged document scroll and unchanged copy height for all five choices at each tested size |
| Text-masked causal result | PASS: desktop/phone WebGL and Canvas screenshots visibly differ for the four systems; returning Whole vehicle restored the exact static pixels (0 differing bytes under the comparison tolerance) |
| Normal / reduced / Canvas | PASS: all study controls and Moon selection on desktop/phone; shared diagram meaning remains available |
| Native context loss/recovery | PASS: native `WEBGL_lose_context` entered Canvas and restored WebGL while Guidance remained selected |
| Resize | PASS: retained Machine/Guidance; progress `4.3600 → 4.3605 → 4.3600 → 4.3600` across desktop/phone/short desktop |
| Full Index | PASS: all eight chapters reached through its on-demand controls |
| Early model input | PASS: selected Guidance before a deliberately delayed GLB resolved; selection remained active after the actual model arrived |
| Page health | PASS: no uncaught page errors. One ANGLE shader compiler precision warning was recorded after rendering/context activity; no associated failure or visible defect was observed |

Focused source checks cover engine/fairing registration, distinct finite paths, chapter gating, free-space lunar bounds, early system selection, existing audio intent and Batch A fragment precedence. TypeScript and scoped diff checks are part of final closeout. Parent integration owns full test/build/project-path production gates.

Final scoped closeout PASS: 20/20 ORBITAL source tests, `npx tsc --noEmit` and scoped `git diff --check`. A bounded fresh production check at `http://127.0.0.1:4175/ai-web-experience-collection/orbital/` passed Moon/copy separation and Propulsion→Guidance at 320×568, 390×844 and 1440×900; full Index entry and compact Previous/Next navigation; and Batch A saved reload/same-document Back with exact `6808 → 6808` restoration. No uncaught page errors. Saved production assertions and screenshots are `production-spot.json` and `production-*.png` in the same external directory. The first history harness assigned an already-current hash, which correctly emitted no hashchange; the corrected check establishes a different hash first. This was a harness correction, not an application defect.

Evidence: `C:\Users\admin\.codex\tmp\flagship-b-20261025\orbital\verification.json`, `final-*.png`, `blind-*.png`, the temporary `verify.mjs`, and the before records. Representative full frames were visually reviewed, including the phone Moon/body region and visible Guidance geometry. Masked-image pixel differences prove a changed rendering; the diagram meanings are also reviewed visually and documented explicitly rather than inferred from a difference count.

NOT RUN: physical touch/iPhone/iOS, Safari/Firefox, native 4K display, high-refresh hardware, GPU frame/energy measurement and deployed production. Window simulation and a software renderer are not device performance certification. Local production-path verification is distinguished from deployment.
