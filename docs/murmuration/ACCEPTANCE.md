# MURMURATION — acceptance record

## Collection integration preview — 25 October 2026

- `npm test`: 451 passing, 0 failing (includes the ported suite below).
- `npm run build` and `npm run verify:build`: passed at `/` and at `--base=/ai-web-experience-collection/`; the verifier resolved 1232 HTML/CSS asset references with no escaped base or missing local file.
- Chromium 1248 via Playwright opened the project-path route `http://127.0.0.1:4175/ai-web-experience-collection/<route>/` at 1440×900 and 390×844. Local fonts loaded, no console error, page error or failed/4xx request occurred, and the document stayed within the viewport width at both sizes.
- The independent document survived a direct load and a reload at both sizes. The shared return control resolved to `/ai-web-experience-collection/#world-<route>` and the Collection restored focus to that entrance on arrival.
- A reduced-motion context at 1440×900 loaded the same route with no console error and no horizontal overflow.
- Not tested here: physical touch devices, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and assistive screen readers. The supplied upstream reports are provenance, not evidence for this integration.

## Work behaviour

- `tests/murmuration-model.test.mjs` passed (identical state for identical seeds/ticks, reversible recording samples, deterministic reconstruction, session and reduced-motion stepping). The upstream propagation check that read a QA artefact is not part of this suite.
- Chapter IV reached the live field with the recorded flight loaded; Hold changed to Resume and the status announced "Held in place. Change a rule, then Resume or Step." from the live session.
- Presets, sliders, ripple, reset, still mode and fieldprint export are unchanged; the recording and sky now resolve through namespaced, base-aware URLs.
