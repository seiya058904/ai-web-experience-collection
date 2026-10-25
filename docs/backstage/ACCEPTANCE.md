# BACKSTAGE — acceptance record

## Collection integration preview — 25 October 2026

- `npm test`: 451 passing, 0 failing (includes the ported suite below).
- `npm run build` and `npm run verify:build`: passed at `/` and at `--base=/ai-web-experience-collection/`; the verifier resolved 1232 HTML/CSS asset references with no escaped base or missing local file.
- Chromium 1248 via Playwright opened the project-path route `http://127.0.0.1:4175/ai-web-experience-collection/<route>/` at 1440×900 and 390×844. Local fonts loaded, no console error, page error or failed/4xx request occurred, and the document stayed within the viewport width at both sizes.
- The independent document survived a direct load and a reload at both sizes. The shared return control resolved to `/ai-web-experience-collection/#world-<route>` and the Collection restored focus to that entrance on arrival.
- A reduced-motion context at 1440×900 loaded the same route with no console error and no horizontal overflow.
- Not tested here: physical touch devices, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and assistive screen readers. The supplied upstream reports are provenance, not evidence for this integration.

## Work behaviour

- `tests/backstage-state.test.mjs`, `backstage-geometry.test.mjs` and `backstage-clearance.test.mjs` passed against the same geometry plan that builds the meshes.
- In the production preview the header cue reached Act IV ("IV · Call the Cue"), the scene control changed NIGHT → SEA (`aria-pressed` false → true, caption "SEA · Audience view", status "Changing to sea…"), and the View/Light sliders reported "55 percent toward the wings" and "80 percent, high sidelight".
- The narrow-phone masthead repair was verified at 390×844: "Call the cue" and the five-act footer now sit inside the gutter, and no width in 320–2560px overflows.
