# BERTH — implementation and verification record

Review date: 9 November 2026. This record distinguishes implementation, observed browser behaviour, automated checks and work that remains unverified. It is not a claim that the entire acceptance matrix passed.

## Status

The ten-chapter application, nine reversible transition sections, nineteen adopted scene assets, two principal interactions, accessibility alternatives, local audio and runnable source package are implemented. State tests, TypeScript checking, production builds and asset integrity checks passed. Final browser acceptance is **incomplete** because the shared managed preview address repeatedly served other projects during this session.

The latest production bundle, `index-D82Zvs8r.js` with `index-CJFXqW-Z.css`, was genuinely loaded from an independently extracted source archive. Initial desktop inspection found all 32 scene-image instances decoded, with no failed images or recovery previews. The desktop Hero screenshot is a valid full-art capture. Later viewport changes encountered failed image responses: the embedded Hero poster remained visible, but other scenes degraded. Complete desktop and phone forward reading paths and the latest text interactions were exercised in that degraded state. They establish usable reading and interaction, **not** normal full-art journey acceptance.

The latest TR-05 bed-rail repair has source/build and conservative geometry verification only. Full-resolution mobile art, nine five-position transition captures, continuous slow forward/reverse review and several accessibility/failure conditions remain open.

## Environment and evidence

| Item | Actual scope |
| --- | --- |
| Build | Linux; Node 24.22.1; npm 11.9.0 |
| Browser | Cloud Chrome 156.0.0.0 on Linux X11, through the supported browser UI API |
| Host viewport | Approximately 1363 × 936 CSS pixels; DPR 1 |
| Desktop | Same-origin 1440 × 900 iframe; earlier fit-to-host inspection and latest actual-size capture; content width 1425 with scrollbar |
| Phone | Same-origin 390 × 844 iframe; content width 375 with scrollbar |
| Device scope | CSS viewport simulation, not physical Android/iOS, Windows or 4K hardware |
| Resource condition | Warm art enabled for latest visual review; no controlled bandwidth/latency setting |
| Deployment | None; no repository push, PR, release, public hosting or collection change |

The Browser extension could not reach the managed internal preview, so the supported cloud browser was used. The shared preview subsequently returned unrelated HTML for image URLs and sometimes an unrelated application at the root URL. Repeated managed-preview restarts and the independent production build briefly restored BERTH, allowing the latest desktop capture. Later requests degraded again. Those responses are an environment failure, not proof of a BERTH layout defect. No unrelated page is counted as evidence or included in the package.

| File in `evidence/` | What it establishes |
| --- | --- |
| `desktop-1440-hero.jpg` | Latest full-art Hero: title, navigation, doorway, window, lamp, handout and traveller |
| `mobile-390-hero.jpg` | Latest portrait **recovery** Hero: readable DOM title/navigation and low-resolution same-composition poster, without broken-alt overlay; not high-resolution mobile acceptance |
| `mobile-390-context.jpg` | Uncropped host/harness context for the phone inspection |
| `desktop-1440-card-binding.jpg` | TR-08 near local 0.5003: real cards, current custom line and one wire clip |
| `mobile-390-card-binding.jpg` | TR-08 near local 0.4997: portrait cards and current line; surrounding art degraded |
| `mobile-390-ending-cards.jpg` | Ending copy feedback, Lin's note and revisit links; not a complete simultaneous view of both cards |
| `desktop-native-walk.json`, `mobile-native-walk.json` | Native wheel progression through chapters 1–10 with motion on and degraded art |
| `layout-geometry.json` | Ten viewport measurements of long-title/editor geometry |
| `runtime-observation.json` | One warmed, uncontrolled production-load timing sample and browser/resource state |
| `browser-observations.json` | Inspection metadata; counters were sampled during inspection, not atomically with every later screenshot crop |
| `interaction-observations.json` | Transcription of latest actual UI observations; not an automated trace |
| `reproduction.json` | Independent archive install/build results and source/runtime hashes |
| `impeccable-detect.json` | One mechanical detector pass returning `[]` |

Mobile crops retain a small outer harness/scrollbar framing edge, identified in the context image. They are not pixel-perfect phone exports. Later resource observation recorded two decoded Hero previews and thirty failed image instances; earlier metadata had seven failures while other requests were pending.

## Requirement-to-implementation map

| Chapter | Independent progression and medium |
| --- | --- |
| 01 · 20:48 | Doorway; Ning enters; twelve-page handout has a real DOM opening blank; independent mobile portrait |
| 02 · 21:05 | Lin offers light; Ning moves her pages closer; shared-light art and dialogue |
| 03 · 21:32 | First writing class, two abandoned openings; real text and local Reading / Soft / Off experiment |
| 04 · 22:17 | Ning takes her cup into the corridor; passing station; Lin's unexplained line about the bell |
| 05 · 23:06 | First retirement day and sea journey; two cards from Ning's bag, one each; desktop and portrait night-talk art |
| 06 · 00:14 | Lin's glasses/card stay below; Ning takes manuscript and own card upstairs; climb and sleep art |
| 07 · 02:10 | Ning wakes without disturbing Lin; presets, labelled editor, explicit commit, undo and reset |
| 08 · 05:38 | Objects start in their night positions; Ning brings papers down before Lin hands over her note; dawn and handover art |
| 09 · 06:12 | One clip moves from manuscript to two live-text cards; each traveller packs her own bag |
| 10 · 06:37 | Lin leaves first, Ning follows; empty-room echo; current keepsakes, copy and three revisit links |

Each chapter has two canonical prose beats in `src/story.ts`. Authored captions, controls, labels, alternatives and fixed text are English. User input retains its language and formatting through `textContent`, with unspecified language and automatic text direction. No image-baked writing carries necessary story information.

| Transition | Implemented handover | Remaining visual gate |
| --- | --- | --- |
| 01 → 02 | Doorway to shared light, spatial edge and small drift | Five positions and continuous native forward/reverse review |
| 02 → 03 | Shared light to handout close view | Same |
| 03 → 04 | Comparison lighting returns to narrative light by local 0.5; reverse restores comparison | Same, all three lamp settings |
| 04 → 05 | Corridor to night conversation | Five positions and continuous review |
| 05 → 06 | Night talk → climb → sleep; first handover behind foreground bed rail | Latest repair, especially local 0.20–0.40 |
| 06 → 07 | Sleeping room to awake pillow/card view | Five positions and continuous reverse |
| 07 → 08 | Matching blue-hour/dawn space; manuscript remains upstairs | Five positions, mobile matching and late-resource takeover |
| 08 → 09 | Handover → two DOM cards/one moving SVG clip → packing | Midpoint and Before/After controls observed; full sequence, maximum-length text and normal surrounding art still open |
| 09 → 10 | Packing → Lin departure → Ning departure → empty room | Five positions and both directions |

Masks and object transforms derive from current local progress, not accumulated entry events. The nine five-position capture matrix is **not completed**. Pure state evaluation, native wheel walks and geometry checks do not replace visual review.

## Browser behaviour actually observed

### Latest production bundle

| Check | Observed result |
| --- | --- |
| Desktop initial art | All 32 scene-image instances decoded; no failures/previews; ten chapters; full-art Hero saved |
| Recovery after resize | Embedded portrait Hero remained readable without broken-alt overlay; other failed scenes retained their text alternatives |
| Native forward paths | Wheel reached all ten chapters at both primary sizes with motion on. Phone reached bottom; desktop reached chapter 10 and was 19 pixels short of bottom when sampled. Art was degraded. |
| Explicit custom commit | Exact 51-code-point synthetic text, including Chinese, newline, surrounding spaces, quotes, ampersand and literal HTML-like text, committed successfully |
| Binding and injection resistance | All three `[data-user-line]` holders exactly matched the line; each had zero child elements |
| Blank / undo / restore | Whitespace-only input selected default; Undo restored custom line; Restore returned to default |
| Ending copy | Clipboard exactly matched custom line; adjacent feedback said “Your opening was copied.” |
| Outside menu click | Native Sound-control click closed menu and retained focus on that control; activated then muted again |
| Low-motion cards | Pause exposed native Before/After radios. Before showed clip on manuscript; After selected joined cards. Resume restored motion. No saved low-motion screenshot is included. |
| Revisit | Actual ending “Read from the beginning” link returned to chapter 1; opening handout stayed blank |
| Scrollbar | Native scrollbar dragging from phone Hero reached chapter 10 |
| History | Back returned to `#ch-03`, Forward to `#ch-01`; committed default remained intact |
| Final preferences | Default opening, Soft light, motion enabled, sound muted |

The synthetic test line was `  早上好，大家。` followed by a newline and `Let’s begin <b>slowly</b> & "together".  `. The two leading and two trailing spaces were retained. These operations used the real production UI, not a mock state implementation. Interaction evidence does not establish full scene quality while requests fail.

### Earlier observations relevant to unchanged interactions

Reading and Off changed actual scene brightness and paper treatment, not just button state. Draft typing alone did not change committed cards. The third preset propagated to keepsakes. A 118-code-point prefix followed by a family emoji stopped before the entire emoji. Enter opened the menu; Escape closed it and restored trigger focus. Reload restored light, committed preset and motion preference, while audio reset to muted. Audio activation/mute were exercised; audible hardware quality was not measured.

One locator click in a scaled iframe hit the wrong physical location. Fresh observation and native click/keyboard activation then confirmed submission. The coordinate issue was not counted as a successful product action before its result appeared.

## Responsive geometry and timing

With motion enabled and degraded art, the long-title/editor chapter retained ten chapter sections and had no horizontal document overflow at 320 × 700, 360 × 640, 390 × 844, 768 × 1024, 719 × 900, 721 × 900, 844 × 390, 1920 × 1080, 2560 × 1440 and 3840 × 2160. The heading was “Something Simple to Begin With.” Exact dimensions are in `layout-geometry.json`.

These are **geometry checks of that state**, not Hero/transition/ending visual certification at every size. The editor was narrow just above the 720-pixel breakpoint (146 pixels at the measured 721-pixel viewport); normal-resource visual/keyboard review remains necessary despite no document overflow. Browser zoom and physical mobile keyboard effects were not tested.

One warmed production navigation recorded:

| Metric | Value | Meaning and limit |
| --- | --- | --- |
| `berth:interactive` | 115 ms | Application controls-ready mark |
| `berth:hero-ready` | 116 ms | Resource-ready event, not proof of painted complete art |
| First paint / first contentful paint | 180 ms | Browser paint entries for this navigation |
| `berth:meaningful-visual` | 185 ms | Embedded-poster decode plus animation-frame mark |

The sample was read after viewport changes on a warmed, uncontrolled connection, with art subsequently degraded. Mark ordering does not mean complete art appeared before first paint. No repeatable cold-start, Lighthouse, FPS, energy or long-run memory result is claimed.

## Material repairs

| Defect | Cause and repair | Verification |
| --- | --- | --- |
| Count briefly reached 11 | Generic query included root state attribute; now section-only query and `data-current-chapter` on root | Latest browser retained ten sections/correct counter |
| Phone progress differed from sticky position | Read rendered sticky top | Latest TR-08 midpoint measured; full boundary matrix pending |
| Distant copy failure feedback | Adjacent card-specific feedback and selectable fallback | Success path observed; failure fixture unexecuted |
| Input formatting / emoji boundary | Preserve nonblank whitespace; truncate only whole graphemes within 120 code points | Unit suite and actual editor |
| Repeated closing line | Remove duplicate, retain standalone ending | Updated DOM observed |
| Recovery could hang | Failed small image reassigned to itself; now skip, hide broken image, bound waits, validate manifest, guard request generations | Latest real failure recovery observed; controlled slow/reordered request matrix pending |
| Hero alt over navigation | Keep same-composition embedded poster without generic failure text over title | Latest phone recovery capture |
| TR-05 duplicate Lin | Top-to-bottom reveal behind opaque bed rail; contained actor geometry | Conservative face-region geometry/build only; no visual approval |
| Missing concrete card-binding action | Two DOM cards, current line, one moving SVG clip, native Before/After | Latest midpoint images, exact text and radios checked; full-art sequence pending |
| Outside click stole focus | Preserve focus on clicked control | Latest native Sound-control click observed |

## Automated and asset checks

- `npm test`: **22 passed, 0 failed**; story invariants, explicit state, reversible evaluation, malformed/blocked storage, Unicode limits and text preservation. This is not a visual test suite.
- `npm run build`: TypeScript and Vite production build passed after latest runtime changes and in an independently extracted archive.
- `node scripts/check-assets.mjs`: 65 WebP files, 19 embedded recovery previews and two critical Hero exports match recorded signatures, bytes and SHA-256.
- Provenance records 22 distinct current image roles, 32 successful original image-tool outputs and 10 superseded corrections. Responsive resizes are not counted as generations.
- Runtime full-size images total 1,671,894 bytes; small variants 667,986; recovery WebPs 219,116. These are file sizes, not network/performance scores.
- One mechanical Impeccable detector run returned `[]`; this is not visual approval.

Standard build needs neither originals nor ffmpeg. Prepared WebPs, previews, fonts, metadata and license notices are included. Dependencies, build output, browser profiles, private upload helpers and unrelated projects are excluded from the archive.

## Controlled failure fixtures

After building, `node scripts/prepare-qa.mjs` generates separate QA pages that reuse production JS/CSS and block images by CSP, block fonts by CSP, or force storage/clipboard errors. Ordinary app assets remain unchanged.

Fixtures were generated successfully but **not browser-executed**. Real shared-preview failures do not replace these controlled cases or establish offline behaviour, private-browser policy, permission UI or slow-network recovery.

## Unverified conditions and acceptance still owed

- Complete normal-resource desktop/phone visual journeys; continuous slow reverse and fast boundary traversal.
- Nine boundaries at local 0 / 25 / 50 / 75 / 100 percent and either side of each handover, especially repaired TR-05.
- Full-resolution phone Hero, night talk, dawn and ending; multi-scene visual checks at specified sizes and near 720 pixels.
- Browser zoom 125 / 150 / 200 percent; system reduced-motion switching; physical mobile keyboard, touch and address-bar changes.
- Browser clipboard rejection/storage denial; all fault fixtures; cold/slow load, A → B → C response reordering and network recovery.
- Physical Android/iOS, Windows launcher execution, Safari, Firefox, screen reader, audible audio quality and physical 4K hardware.
- Lighthouse, FPS, energy, long-run heap/listener profiling and repeatable cold timings.
- Full finish approval. Desktop Hero comparison is now possible; mobile and transition evidence remains insufficient. See `docs/finish-review.md` for the independent scoped judgment.

DOM/CSS/SVG rendering has no WebGL dependency, so context loss is not a relevant renderer gate. This architectural fact does not establish other conditions above.

## Reproduction

An actual source ZIP was extracted to a fresh directory. `npm ci`, `npm test`, `npm run build` and `node scripts/check-assets.mjs` passed there. Its production preview supplied the latest bundle genuinely inspected above. A preview-only script adjustment in that extracted checkout was restored; the delivered source keeps ordinary development/preview commands.

`evidence/reproduction.json` records that candidate-archive check and exact runtime hashes. Later documentation/screenshots do not alter runtime files. The final archive is independently extracted and checked again after packaging; its result and SHA-256 are provided alongside the ZIP, avoiding a self-referential hash inside itself.

This is a runnable implementation with documented partial verification. It must not be labelled “all acceptance checks passed.”
