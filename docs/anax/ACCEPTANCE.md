# ANAX — acceptance record

## 10 November 2026

Tools: Chromium through Playwright (headless, Windows 11, hardware GPU, device pixel ratio 1). Dev server on port 5207 (`window.__anax` read for state), project-path production preview on port 4175 (`--base=/ai-web-experience-collection/`). The automated window throttles `requestAnimationFrame` hard (a few frames per second when the scene is idle), so intro, spring and journey timings were read as state, not judged by eye, and frame rate was not assessed. Screenshots were kept outside the repository.

### Automated

- `npm test` passes (854 tests, including the new `tests/anax-kinematics.test.mjs`: rod and lever length at 720 crank angles, lever peak rate, gear centre distances and planetary rule, mesh angle, track rest/sum/continuity, journey holds and inversion, stage tiling, crank speed).
- `npm run build` and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`. `git diff --check` is clean.

### Browser

1. **Load (dev, prod).** The loading veil fades out, fonts `/grid/fonts/RobotoFlex-Latin.woff2` and `IBMPlexMono-Regular.woff2` load, favicon and NOTICE return 200, no 404 and no console errors. Dev shows one ANGLE shader precision warning from three.js (X4122), no errors. Production has no `window.__anax`.
2. **View.** Drag turns, wheel zooms (zoom 1 → 0.75), Shift-drag and right-drag pan, Reset view returns to the home goal. After about 3 seconds idle the camera turns; a drag then takes over with small, continuous azimuth steps.
3. **Disassembly.** A full journey passes through holds at 0.30 and 0.62 and reaches 1. Pressing the button mid-journey reverses it. Slider scrubbing 70 → 20 → 95 → 10 → 45 → 0 returns to 0. Stage marks I/II/III set 0.30 / 0.62 / 1. Part motion was read as progress values; no frame-by-frame inspection for interpenetration was made.
4. **Exact rest (dev).** After scrubbing back to 0, after the stage marks and after a journey back from 100%, `model.parts.filter(p => p.node.position.distanceTo(p.rest) !== 0).length` is 0.
5. **Shell.** Solid, Glass and Section ease over several frames (Glass ghost 0.53 → 0.97, Section cut 0.22 → 0.95). In Section the crankshaft, rods and tail internals are visible; Glass was not reviewed by eye.
6. **Parts.** All 18 Index entries select, focus and open the card (dark, 66% black with blur, readable). Model click (hover hit-test), a callout click and the Index all select. The swap class `is-swapping` appears for about 200 ms while text changes. Escape and the card close button clear the selection. Selecting the motor while fully assembled frames the thorax; the motor itself is hidden behind the shell until the shell lifts.
7. **Switches.** Motion off stops the crank angle and back on resumes it; Labels off clears `state.labels` and back on restores it.
8. **Keyboard.** Tab reaches the skip link, Notes, Collection, all 18 Index entries, Disassemble, three stage marks, slider, shell radios, Motion, Labels and Reset view, each with a focus indicator. Space starts and reverses the journey, ArrowRight/ArrowLeft step the progress by 0.02 from the page and by 0.001 on the focused slider, R resets the view. Notes opens, Escape and Close dismiss it, and Space inside it does not start a journey.
9. **Collection.** The Collection link goes to `#world-anax`. The home gallery has the 50th panel (`50 / MECHANISM & FLIGHT`) with its preview loaded, Index row 50, strip entry `--i:49`, and all enter `/anax/`. Direct reload of `/anax/` works. The panel sits in the third column and the About & credits band follows full width. The first check at 1440 px showed the ANAX title clipped at the panel edge; its size was reduced (`--t:19`) and the title now fits at 390, 800, 1440 and 2560 px.
10. **Reduced motion (emulated).** No automatic crank run, no idle turn. Disassemble dips, changes and returns (progress jumps 0 → 1, no journey), the slider still sets progress. Edge case: a slider move made within the roughly 0.4 s dip is overridden by the pending jump. The dip took about 3 s in this throttled window.
11. **Sizes** (dev, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160): no horizontal overflow; canvas matches the viewport up to 2560×1440; at 3840×2160 the pixel budget lowers the ratio to 0.79 (3040×1710). Assembled and fully open frames reviewed at 390 and 1920 once settled: body inside the frame, text not overlapping. At 390 the open wing tips touch the screen edges. The phone-width Index button (open, and close by tapping the scene) was not exercised.
12. **Recovery.** Resizing 1440×900 → 900×700 resizes the canvas and the loop keeps running. A hidden-tab state was not reached in this tool (`document.hidden` stayed false), so suspension and resume are untested.
13. **Production at `/ai-web-experience-collection/anax/`.** Items 1, 3 (journey and slider), 6 (Index selection, Escape) and 9 (return link, panel, enter, reload) pass with no failed requests and no console errors.
14. **No WebGL.** With `getContext('webgl*')` forced to null the page shows the fallback: "This piece needs WebGL", the written description and the 1920-wide poster; controls hidden.

## Not tested

Physical touch, iOS Safari, Firefox, integrated GPUs and real phones, high-refresh displays, true background-tab suspension, screen readers, frame rate on a throttled window, and Glass shell by eye. Interpenetration during the journey was not inspected frame by frame.
