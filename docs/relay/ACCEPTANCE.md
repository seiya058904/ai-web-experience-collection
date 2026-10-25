# RELAY — acceptance record

## Collection integration preview — 25 October 2026

- `npm test`: 451 passing, 0 failing (includes the ported suite below).
- `npm run build` and `npm run verify:build`: passed at `/` and at `--base=/ai-web-experience-collection/`; the verifier resolved 1232 HTML/CSS asset references with no escaped base or missing local file.
- Chromium 1248 via Playwright opened the project-path route `http://127.0.0.1:4175/ai-web-experience-collection/<route>/` at 1440×900 and 390×844. Local fonts loaded, no console error, page error or failed/4xx request occurred, and the document stayed within the viewport width at both sizes.
- The independent document survived a direct load and a reload at both sizes. The shared return control resolved to `/ai-web-experience-collection/#world-<route>` and the Collection restored focus to that entrance on arrival.
- A reduced-motion context at 1440×900 loaded the same route with no console error and no horizontal overflow.
- Not tested here: physical touch devices, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and assistive screen readers. The supplied upstream reports are provenance, not evidence for this integration.

## Work behaviour

- `tests/relay-model.test.mjs` passed (deterministic bytes, ordering, retransmission, loss, reset isolation, budgets, immutable history, BOM preservation).
- "Continue delivery" switched the control label to "Pause delivery" in the production preview at both viewports, and the receiver display updated from the same paused demonstration rather than a prepared animation.
- Chapter links, the Blocks selector, the event strip and the new-round dialog are the supplied controls; only the header gained the Collection return.
