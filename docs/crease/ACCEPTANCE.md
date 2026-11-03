# CREASE — acceptance record

## 4 November 2026

- `npm test`, `npm run build` and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- `tests/crease-model.test.mjs` covers rigid facets, shared edges, the single rectangular sheet, invisible stage changes, Kawasaki's condition, Maekawa's condition at every interior Miura vertex, the Miura closed form, the printable pattern and film continuity.
- Chrome through Playwright on the project-path build, with a hardware GPU:
  - Direct load, reload, return link and return to the Collection panel.
  - Keyboard moves one crease by 3° and the readout changes from "Fully closed" to "35° still open".
  - Fold changes the footprint from 65% to 21%. Dragging the corner moves the Pull slider, and the slider stays in sync with the keyboard.
  - Download at 6×5 and 60° produces `crease-miura-6x5-60deg.svg` with 66 lines and both line styles.
  - Notes dialog focus return, chapter navigation, hash deep link, reverse scrub, resize to 800×600.
  - A resting page issues no draw calls.
  - No console messages or failed requests.
- Reduced motion: chapter jumps are immediate, no errors.
- SVG edition with `--disable-3d-apis`: facets draw and controls work. three.js logs its expected context errors before the fallback takes over.
- No JavaScript: the still and note are shown.
- Phone emulation at 390×844: no overflow, panel inside the screen, sheet above the text.
- Frames reviewed at 390×844 and 1440×900.

## Not tested

Folding the printed pattern in real paper, integrated GPUs and real phones, physical touch dragging, iOS Safari, Firefox, high-refresh hardware, background-tab suspension and screen readers. Layer collisions are not modelled; see `RESEARCH.md`.
