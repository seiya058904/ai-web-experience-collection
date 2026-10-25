# Verification, 2026-10-25

Production preview: `http://127.0.0.1:4173/` during acceptance. React / Vite production bundle, installed Playwright with Chromium 1248. Browser plugin was not available; no browser dependency was added to this project.

## Results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript and production build | PASS | `npm run typecheck`, `npm run build` |
| Browser acceptance | PASS | 42 checks in `verification.json` |
| Runtime exceptions / failed requests | PASS | Empty error arrays in `verification.json` |
| Six responsive widths | PASS | 320, 390, 768, 1280, 1440, 1920; no horizontal overflow |
| Hero fold | PASS | Heading and CTA visible at 1280 × 800, 1440 × 900, 1920 × 1080 |
| Filters, history, details, saved state | PASS | Production UI interactions, reload, Back / Forward, direct-linked detail |
| Keyboard focus / background locking | PASS | Forward and reverse Tab, Escape, focus restoration, wheel lock, scroll restoration |
| Mobile / reduced motion / no script | PASS | Chromium mobile emulation; disabled JavaScript and reduced-motion contexts |
| Storage failure | PASS | Blocked Storage.setItem; honest visit-only notice |
| Lenis lifecycle | PASS | One Lenis ticker, one ScrollTrigger; stable after five menu cycles |
| Color contrast | PASS | Body 13.19:1, secondary 5.65:1, dark secondary 7.47:1, focus 6.04:1 |
| Impeccable detector | PASS | Empty findings array |
| Hallmark static | PASS | 0 FAIL, 0 WARN, 3 WAIVED short lede measures within the stated one-sentence exception |
| Hallmark built-in render | NOT_RUN | puppeteer-core is absent; separate Playwright visual checks completed |
| Physical touchpad / real phone scroll feel | NOT_RUN | Synthetic wheel and mobile emulation only |
| Real display FPS | NOT RELIABLY MEASURED | Headless rAF intervals are not monitor FPS |
| Deployment | NOT_RUN | Local-only delivery as requested |

## Scroll evidence

`scroll-trace.zip` is a Playwright trace; open with Playwright Trace Viewer. `scroll-performance.json` records synthetic wheel bursts, small deltas, and reverse scrolling. The sample contains 786 rAF callbacks across about 2.47 seconds, zero recorded long tasks and no callback gap over 34 ms. The unusual headless callback cadence is diagnostic only and must not be reported as physical screen FPS. `scroll-demo.webm` records a separate browser walkthrough and is not the performance sample.

## Visual fidelity ledger

| Point | Design evidence | Implemented result |
| --- | --- | --- |
| Modernity correction | `design/previews/hero-modern.png` | Modern sans wordmark and contemporary stone/glass setting replace classical imagery |
| Hero copy and hierarchy | Approved headline, sentence and outlined CTA | Exact visible copy retained; mobile word spacing and desktop head crop corrected |
| Palette and type | Warm ivory, umber, cool slate; light serif / modern sans | Tokenized OKLCH palette, local Sentient and Hanken Grotesk |
| Garment collection | Open three-column editorial collection | Six planned looks; own production images; two columns on mobile |
| Product truth | Separate visual concepts, no prices or certification claims | Actual charcoal look used for Slate Suit; close-up is the same garment image, avoiding an unrelated brown lapel |
| Detail UI | Full-height side panel with image and text | Live dialog, zoom controls, real saved state and independently scrollable content |
| Responsive continuation | `design/previews/mobile.png` | Real planned item names replace the generated mockup's unapproved wool/merino labels; all six looks retained |
| Closing system | Wardrobe switcher and large wordmark | Occasion changes real look; sans footer wordmark follows the requested modernity correction |
| Image treatment | Untinted architectural imagery, square corners | Standalone generated production images; no screenshot used as UI |

Hallmark theme draw / Atelier scaffold could not parse the installed theme header. The custom scaffold was used and the approved palette and typography were specified directly. No skill files were modified. Review was performed in-thread; no subagents were used.
