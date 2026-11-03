# AURORA — acceptance record

## 4 November 2026

- `npm test`, `npm run build` and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- `tests/aurora-model.test.mjs` covers the Shue boundary, coupling direction, Kp table, horizon geometry, film continuity and reversibility, camera orientation, the Earth rotation and ribbon determinism.
- Chrome through Playwright on the project-path build, with a hardware GPU (RTX 3070, 165 frames per second headless at 1440×900):
  - Direct load, reload, return link and return to the Collection panel.
  - Chapter navigation, hash deep link, reverse scrub, resize to 800×600 and 390×844.
  - Storm preset moves the boundary from 9.3 to 5.8 Earth radii. Keyboard moves the field direction and the state reading follows.
  - Emission isolation, computed ruler, Sources dialog focus return, dark-sky wording at low latitude and in the canvas label, Save this sky download, Hold still.
  - No console errors, page errors or failed requests.
- Reduced motion: starts held still, chapter jumps are immediate, no errors.
- Canvas 2D path with `--disable-3d-apis`: sky, wind and oval scenes render and controls work.
- No JavaScript: poster and note are shown.
- Phone emulation at 390×844: no overflow, 44px return target, panel inside the screen with the subject above it.
- Frames reviewed at 390×844, 768×1024, 1440×900 and 1920×1080, including storm, calm and low-latitude states.

## Not tested

Integrated GPUs and real phones (dynamic resolution is untested there), physical touch, iOS Safari, Firefox, high-refresh hardware, real background-tab suspension and screen readers. Context-loss recovery is implemented and was not exercised.
