# Focused browser checks

These checks supplement the Node model/continuity tests and the HTML/CSS build verifier. They exercise production documents under the Pages subpath. They are not a complete acceptance pass of all 55 works or a physical-device certification.

```sh
npm ci
npx playwright install chromium
npm run build -- --base=/ai-web-experience-collection/
npm run verify:build
npm run test:browser
```

`playwright.config.mjs` starts and stops its own Vite preview on `127.0.0.1:4178`. It refuses an occupied port, so a stale dev server cannot silently substitute for the built site. Rebuild after source changes. Do not run a different build while these checks are using `dist/`.

## Coverage

- Desktop 1440×900 and phone-size 390×844 Chromium viewports, with normal and reduced motion.
- SILLAGE, ODDS and RALLY native directories: PageDown, backdrop wheel, an emulated OS motion-preference change while open, actual scrolling inside a 320px-high overflowing directory, Escape, focus restoration, resumed document scrolling and a chapter-link jump after closing.
- BERTH's native directory: a fitting menu lets wheel input continue the document; a short viewport lets the menu scroll internally; resizing back releases containment.
- ODDS fifth-chapter data: vertical scrolling over a fitting table; enlarged text at 320px creates genuine horizontal overflow; both input axes work independently; resizing back removes stale containment.
- Collection Index → SILLAGE → explicit Collection return: project base, source offset and focus. The native Index and entry also work in a JavaScript-disabled context.
- Collection font subsets: actual rendered text coverage and per-text-node geometry against the original fonts loaded into the same browser. Node tests check original/derivative/license hashes and copy coverage.

Tests use authored UI state, fonts and settled scroll positions. The bounded wait after negative input checks observes the native key/wheel animation before asserting that the document did not move. A test must not pass on the first frame before the browser starts its default action. No retries conceal an intermittent failure.

## Failure evidence and CI

The Verify workflow runs these checks after its project-path build and installs the matching Chromium with system dependencies. On failure, it uploads ignored `test-results/` artifacts (trace, screenshot and error context) for seven days. Locally, inspect a trace with `npx playwright show-trace <path-to-trace.zip>`.

Add a scenario when a real browser defect justifies it. Keep pure models in the fast Node suite. Full artistic/transition review, all six mandated frame sizes, real touch, Safari and GPU behavior remain separate acceptance work. There is no committed screenshot baseline.
