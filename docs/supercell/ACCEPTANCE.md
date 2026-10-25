# SUPERCELL — acceptance record

## Collection integration preview — 25 October 2026

- `npm test`: 451 passing, 0 failing (includes the ported suite below).
- `npm run build` and `npm run verify:build`: passed at `/` and at `--base=/ai-web-experience-collection/`; the verifier resolved 1232 HTML/CSS asset references with no escaped base or missing local file.
- Chromium 1248 via Playwright opened the project-path route `http://127.0.0.1:4175/ai-web-experience-collection/<route>/` at 1440×900 and 390×844. Local fonts loaded, no console error, page error or failed/4xx request occurred, and the document stayed within the viewport width at both sizes.
- The independent document survived a direct load and a reload at both sizes. The shared return control resolved to `/ai-web-experience-collection/#world-<route>` and the Collection restored focus to that entrance on arrival.
- A reduced-motion context at 1440×900 loaded the same route with no console error and no horizontal overflow.
- Not tested here: physical touch devices, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and assistive screen readers. The supplied upstream reports are provenance, not evidence for this integration.

## Work behaviour

- `tests/supercell-field.test.ts` and `tests/supercell-volume.test.ts` passed (bounded density, one height→plane mapping, shear response, fixed horizon, deterministic contours and flow).
- The Index control opened the supplied native dialog in the production preview at both viewports; Escape closed it.
- The section and shear controls, poster swap and opt-in sound are unchanged from the delivery; the runtime poster request resolves under `/supercell/assets/`.
