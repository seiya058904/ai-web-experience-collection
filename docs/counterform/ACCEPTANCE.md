# COUNTERFORM — acceptance record

## Local production preview — 2026-10-12

- Project-path production build and `verify:build` passed at `/ai-web-experience-collection/`.
- Chromium opened the direct route at `http://127.0.0.1:4173/ai-web-experience-collection/counterform/`; Fraunces upright/italic, Roboto Flex and the 900×600 material Canvas loaded. The live opening was captured for the Collection poster and social image.
- Repeated real wheel input crossed all seven scenes from beginning to end and back. Each scene became active in order; overlapping visibility occurred at a chapter handoff, no blank frame appeared, and the final reverse returned to `space`. No browser errors were reported during the page and motion review.
- Index opened with focus inside, Escape closed it, and the motion control toggled. Changing the weight axis from 650 to 900 updated the live value after the owned animation frame. At 390×844 the body width remained 390px and all three local fonts loaded.

Upstream QA records are provenance only and do not certify this integration.

## Collection return regression — 2026-10-24

- Reproduced audit A09 before the change: the Collection exit was hidden at 390×844, 850×900 and 1440×600; 851×900 and 1440×900 exposed it.
- Moved the existing base-aware exit outside the collapsible chapter navigation and retained the authored font with a minimum 44×44px target; no chapter, font-control or motion logic changed.
- Chromium production previews passed at both `/` and `/ai-web-experience-collection/` for 320×844, 390×844, 768×1024, 850×900, 851×900, 1440×600, 1440×900, 1920×1080, 2560×1440 and 3840×2160: one visible exit, no header overlap, actual click and Tab/Enter returning to the Collection, Index/Escape, meaningful page content and no page errors or HTTP failures.
- A 390×844 reduced-motion context also passed chapter navigation, live text and weight controls, refresh and return. The probe waits for the authored animation-frame update before checking the weight output; an initial immediate assertion ran too early.
- `npm test` passed all 345 tests; root and project-path production builds and `verify:build` passed. Desktop/mobile screenshots were reviewed. Browser plugin was unavailable; the checks reused installed Playwright 1.64.1 with Chromium build 1248. Simulated viewports do not certify physical phones or Safari/Firefox.

## Local print specimen — 2026-10-25

- Installed Chromium 156 produced actual PDFs at six required viewport sizes plus 1440×600. Button and Enter wiring were separately checked with a print-call spy; the spy does not certify a native dialog. PDF page count and rasterized output were checked separately with Poppler.
- Words and weight/width/optical-size values (867/133/112) match the final page and survive reload. Print media contains no navigation controls. Literal HTML stays text; blank input uses the existing default; 72-character Latin and Chinese strings fit. Chinese glyphs use system fallback, as on screen.
- Initial 48pt printing failed at 72 W characters with weight 1000 / width 151 / optical size 144: two pages. The rejected PDF is retained externally. Final 40pt output passes that combination and the other three weight/optical endpoint combinations at width 151.
- Print media initially collapsed the screen document and lost reading position. Recovery now uses the existing RAF after screen layout returns. 1440×600 restored Y5550 exactly; a 390×844 storage-denied context restored Y10677 exactly. The final seven-size run also asserts position preservation across PDF generation. Missing Roboto Flex disables the action.
- This is local Chromium/PDF evidence, not physical printer, phone, iOS, Safari or Firefox acceptance. Final gates and evidence: [Batch D](../audits/2026-10-25-batch-d.md).
