# PELAGIC — acceptance record

## Collection integration preview — 25 October 2026

- `npm test`: 451 passing, 0 failing (includes the ported suite below).
- `npm run build` and `npm run verify:build`: passed at `/` and at `--base=/ai-web-experience-collection/`; the verifier resolved 1232 HTML/CSS asset references with no escaped base or missing local file.
- Chromium 1248 via Playwright opened the project-path route `http://127.0.0.1:4175/ai-web-experience-collection/<route>/` at 1440×900 and 390×844. Local fonts loaded, no console error, page error or failed/4xx request occurred, and the document stayed within the viewport width at both sizes.
- The independent document survived a direct load and a reload at both sizes. The shared return control resolved to `/ai-web-experience-collection/#world-<route>` and the Collection restored focus to that entrance on arrival.
- A reduced-motion context at 1440×900 loaded the same route with no console error and no horizontal overflow.
- Not tested here: physical touch devices, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and assistive screen readers. The supplied upstream reports are provenance, not evidence for this integration.

## Work behaviour

- `tests/pelagic-state.test.ts` passed (manual light survives jumps and reversals, authored illumination is identical in both directions).
- "Change the light" advanced the exhibition to observation I (`#less-light` became the active chapter) at both viewports, and the canvas renderer reported ready with local artwork loaded.
- Survey light, encounter replay/scrub, chapter dialogs and the SVG edition are unchanged; only the art URL namespace and the header return are new.
