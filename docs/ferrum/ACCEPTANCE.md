# FERRUM — acceptance record

## Local production preview — 2026-10-12

- Project-path production build and `verify:build` passed at `/ai-web-experience-collection/`.
- Chromium opened the direct route at `http://127.0.0.1:4173/ai-web-experience-collection/ferrum/`; Antonio, Barlow Condensed and Manrope loaded, `stage is-ready` rendered the WebGL scene, and the supplied still was available. No browser errors were reported during the page and motion review.
- Real wheel input reached all six act indices in order, updated the matching hash, and reversed through all six to index 0. The complete document remained within the 1440px desktop width.
- Sound started with `aria-pressed=false`; activating and deactivating the control changed it to true then back to false. Journey and About dialogs opened. Reduced motion and still quality selections activated the supplied fallback at 390×844; the body remained 390px wide.

Upstream unit/browser reports are preserved as provenance and are not evidence for this integration.
# Batch B still reliability and explicit navigation — 2026-10-25

Before editing, delaying a requested still emptied the visible image; aborting it left `naturalWidth=0`. After editing, delayed Act 5 retains decoded Act 0; reversing to Act 1 rejects the late Act 5; aborting Act 4 keeps decoded Act 1 and names it in the status; completing Act 5 commits its decoded image. Both 390×844 and 1440×900 passed. User-selected still mode and forced unavailable WebGL were tested separately. Forced fallback visited all six acts at all six required viewports, with complete Edge frames reviewed, no horizontal overflow and no page errors.

Before navigation changes, actual first→last and Replay recordings showed unreadable intermediate chapters; Replay crossed all six acts in approximately 0.56 seconds on both tested viewports. After the scoped distant-selection cut, recordings at 390×844 and 1440×900 show only origin/destination for first→last and Replay. Adjacent selection still traverses its authored transition. A subsequent reverse wheel input changes position normally. These sampled traces/videos establish visible navigation behavior, not FPS or a refresh-rate benchmark.

Focused PARALLAX/ATLAS/FERRUM tests: 92 passed; TypeScript passed. External evidence: `flagship-b-20261025/modes/{before.json,after-checks.json,additional-checks.json,ferrum-navigation.json,ferrum-navigation-after.json}`, complete PNG frames and videos. Graphics/image aborts are deliberate failure probes; no claim of physical touch, iOS or high-refresh hardware verification is made. Root integration owns final build/project-path verification; no dependencies or publication changed.
