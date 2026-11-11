# Reproduce the browser review

This is a local verification workflow. It does not publish the website.

## Run the isolated production review

```bash
npm ci
npm run review
```

Open `/pulse-review.html` at the local address printed by the command. The review page embeds the complete production build, including artwork and fonts. Its iframe receives the selected **actual CSS viewport dimensions**. The surrounding review page scales that frame only to fit the available display. It does not emulate physical touch hardware, native browser zoom, a physical 4K panel or a different browser engine.

The normal application is at the printed root address. `/pulse-offline.html` serves the same self-contained edition as `preview/pulse.html`.

## Automated checks

Choose **Run browser suite**. The report checks all eleven chapters, twenty-two content beats, every selectable option and reset, dialogue focus, navigation, both main-path viewport sizes, all five stages of all ten boundaries, threshold neighbors, reverse/direct visits, artwork containment, reduced motion and required responsive widths. It measures horizontal overflow against the document's content width, excluding the scrollbar gutter.

Use **Download results** to save the browser-produced JSON. It includes the production snapshot's SHA-256, browser user agent, observation time and individual results. The summary row is not an additional test. `OBSERVED` rows describe state or measurements; they are not pass/fail assertions. The suite's coverage-limit row is deliberately `NOT TESTED`.

## Manual controls

- **Viewport**, **Chapter**, **Boundary** and **Stage** move through the same production DOM and native scroll position.
- **Inspect visible state** records current dimensions, focus, hash, chapter, motion mode and image readiness.
- **Fallback fonts** switches to real Georgia/Arial metrics. This checks font fallback layout; it is not a claim of a throttled network test.
- **Fail images** replaces embedded image data with invalid bytes before the application starts. The image elements emit actual decode failures. Navigate through the illustrated chapters and test their recovery notes, text and controls.
- **Read without JavaScript** reloads the complete static edition with its scripts removed. Read all chapters and expand the textual diagram alternatives.
- **Measure frame pacing** runs one 4.8-second native-scroll forward/reverse sweep across TR-06-07. Reported frame intervals and long tasks belong only to that browser run and its stated conditions. They are not field performance, a video recording or a hardware FPS guarantee.
- **Reload snapshot** restores the normal embedded build. It also resets test-only resource and font changes.

## Capture readiness

After choosing a boundary and stage, wait for the visible **Capture ready** indicator. The review checks at least two real iframe animation frames, actual scroll geometry, rendered progress within 0.005, and the exact quarter stage. The matching selector is `#status[data-capture="ready:4:25"]` for the fifth boundary at 25%. A new seek, resize, reload or suite run invalidates the prior ready state. A timeout remains **not ready**; it is not a valid capture.

This prevents an offscreen section that still reports stage zero from being mistaken for the current viewport. Inspect the resulting pixels as well as the progress metadata.

## Top-level native diagnostics

The isolated frame is useful for controlled CSS sizes. To check browser history, reload and top-level timing against the same production snapshot, build the separate diagnostic page:

```bash
npm run build:offline
node scripts/build-native-review.mjs
npm run preview -- --host 127.0.0.1
```

Open `/pulse-native-review.html`. A hideable test toolbar provides **Inspect state**, **Measure TR-06-07** and **Download log**. It records observed hero states, image readiness, native key/history events, supported paint/LCP/long-task entries and a bounded forward/reverse transition sweep. The generated file states the exact offline source hash. Its toolbar belongs only to this diagnostic page, not the normal website or the delivered offline edition.

The recorder marks measurements **OBSERVED**. Review the raw results before assigning any conclusion; no local timing is a field performance guarantee.

## Real HTTP Retry probe

Select a desktop viewport, then choose **HTTP recovery probe**. The opening image intentionally points at a local invalid image file while retaining its responsive `<picture>` structure. Its real decoding error should expose the authored fallback and Retry.

In a second terminal, run:

```bash
npm run review:recover
```

This replaces only the test fixture with the valid packaged hero image. Click **Retry** in the website. The real HTTP request should recover, remove the notice and preserve the picture's source/media/sizes rules. Change the viewport to 390 × 844: the independently generated portrait artwork should be selected. No network interceptor or fake load event is used.

Running `npm run review` again resets the intentionally broken fixture. The fixture is used only by this review control; it is not used by the ordinary website.

## Separate checks

Inspect screenshots independently from test assertions. Compare the first and last hearts, source-supported chamber orientation, valve families, gas directions and readable copy at the five boundary stages. The record in `evidence/independent-visual-review.md` states exactly which images were inspected by a separate reviewer.

Use a browser that exposes the required native controls for real zoom, wheel/trackpad, touch emulation, tab backgrounding, keyboard, browser history and recording. A missing capability remains `BLOCKED` or `NOT TESTED`; neither a narrower iframe nor a collection of still images substitutes for it. Consult `acceptance.md` for the delivered run's actual coverage.


## Optional neutral pacing control

To reproduce the one narrow timing comparison, run `node scripts/build-pacing-control.mjs` after building, then open `/pulse-pacing-control.html` on the local preview. It uses the unchanged native sampler on static HTML with the recorded production scroll geometry. Record actual viewport/DPR and focus/visibility for both runs. Use Measure TR-06-07 once and export its log before navigating away. Similar stalls in the control suggest an environment contribution; they do not certify smooth application motion.
