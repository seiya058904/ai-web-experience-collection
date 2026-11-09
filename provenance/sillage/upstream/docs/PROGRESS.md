# SILLAGE — final production progress

**Record date:** 2026-11-09. The independent visual gate is **SHIP** for the reviewed local package. Full G5 acceptance remains partial because the limitations below are retained. See [TEST-REPORT.md](TEST-REPORT.md), [REQUIREMENTS.md](REQUIREMENTS.md) and [VISUAL-REVIEW.md](VISUAL-REVIEW.md).

| Stage | Final observed result | Status |
| --- | --- | --- |
| G0 · Environment/brief | Isolated project; ten English chapters, nine transitions and independent personal/demo state mapped to the brief. Node 24.22.1 / npm 11.9.0 observed. | Completed |
| G1 · Art | 12 genuine AI originals, including eight required outcomes; 14 WebPs total 1,415,236 bytes, about 1.35 MiB. Provenance and originals retained. | Recorded |
| G2–G3 · Application | Ten chapters, 90 main-layout transition states, real late-bridge controls, core native chapter controls, title/memory/persistence and real PNG preparation observed. | Implemented and observed |
| G4 · Refinement | CH02/CH04 image-height defect, TR08 missing controls and final mobile TR09 phase-label collision corrected and rechecked. All five final 390px TR09 poses and 320px CJK gallery/action recaptured. | Visual SHIP |
| Engineering | Final source 78/78; clean install/build 78/78. State coverage includes 5,151 valid triples and 92,718 edits. All 36 source/resource and 28 dist files match the independently rebuilt candidate. | Observed |
| Browser matrix | Main 1440×900 and 390×844 paths, plus 27 states at nine additional viewports. No reported horizontal/text overflow in the sampled matrix; visual collision was independently found and fixed. | Observed, scoped |
| Interaction/recovery | 27 additional native-control checks; history and real reload; image 404 three-phase/path fallback; missing-font 2400×1600 PNG preview; manual Still and preview invalidation. | Observed, scoped |
| G6 · Reproduction | Independent rebuilt page visited all ten chapters via real Index at 1363×936, DPR 1, with complete visible images/no fallback/no overflow. Returned to top/default shares. Actual final reload preserved 60/14/26 and “A quiet return”. | Source reproduction verified |
| Final archive | Documentation/evidence accompany the frozen application; candidate identity and final delivery identity remain separate. PACKAGE-INTEGRITY.json records the final package comparison/identity. | Final packaging record |

## Evidence and limits

The final corpus contains 160 raw screenshot/DOM pairs in `docs/evidence/raw/`, with 160 cropped views and 11 contact sheets in `docs/evidence/`. The main transition coverage is 90 states. G6's aggregate DOM/resource record supports the rebuilt ten-chapter path; rapid modal-lagged per-chapter native screenshots were excluded from presentation. Four TR06/07 midpoint records retain an offscreen Hero resource issue from preview interference, so no all-assets/all-frames claim is made. `final-mobile-panorama-selected` is a retained pre-fix failure diagnostic; `final-mobile-ch08` is the authoritative normal portrait view.

Download-to-disk remains unverified because the managed browser rejected Blob/Data protocols; no bypass was used. Native zoom attempts did not change viewport/DPR and remain unverified. OS preference changes, physical devices, Windows/macOS launcher execution, performance/Lighthouse, stress races, heap/leak behavior and broad lifecycle recovery are not certified. Explicit same-page retry was not isolated because restoring fixture files auto-reloaded the preview. Resources were warm/preloaded, not a cold-load benchmark.

The delivery is a local runnable source package; no deployment or publication was performed. Visual SHIP and reproducible source do not convert the remaining G5 limits into passes.
