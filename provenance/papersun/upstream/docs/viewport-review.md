# Responsive viewport review

## Final disposition

All 90 ordinary CSS viewport cases pass the measured checks after the targeted boundary correction. These comprise eight required sizes, nine breakpoint neighbors and one landscape size, with five states per size. The additional cold chapter landing and 390 × 844 sunrise checks also pass.

The full 104-case run is not an unqualified all-pass report. Its final disposition, after replacing the affected boundary cases with their actual corrective retakes, is **97 measured passes, one fallback-font review and six artificial CSS-content-zoom failures**. Browser UI zoom was not established by this suite. The retained CSS-zoom failures must not be reported as browser UI zoom results.

No measured pass is presented as a substitute for visual inspection. The test checks geometry, loaded artwork, chapter identity and actual assembly button state. It cannot decide whether paper, light, seams or text look convincing.

## Builds and evidence

| Evidence | Exact build | Recorded result | Role |
|---|---|---|---|
| `evidence/local-acceptance-viewport-results.json` | `index-B7PdE7OC.js`, `index-BPHFTYOi.css`; index SHA-256 `ea5a85e326c6930cf69e703118559fbefaf7004061af406b3a22f4a99223fc87` | 104 samples: 95 measured passes, one review, eight failures | Complete matrix before the final 501–700 px portrait correction. Two failures were real boundary framing defects; six were CSS-zoom diagnostics. |
| `evidence/local-boundary-final-viewport-results.json` | `index-DELhVtXL.js`, `index-7hykGXpd.css`; index SHA-256 `0dfe5f645e092c65791624404274fbcbb64467cfa150b3b832cd96063f13276e` | 30 samples: 30 measured passes, no reviews, failures or runner errors | Corrective retest at 699, 700 and 701 px, plus regressions at 320, 360 and 390 px. The final build also includes the independently tested TR08 physical-entry correction. |
| `evidence/local-safe-fit-viewport-results.json` | `index-BYpjvD2R.js`, `index-DdfpWGC1.css` | 24 measured passes | Intermediate proof of the fixed-control-safe desktop camera, superseded by the complete matrix. |

The complete matrix and targeted retest are separate evidence sets. The 104 cases were not all rerun against the last binary. The final camera/title change applies only from 501 through 700 CSS pixels; the 30-case retest covers that boundary and the adjacent layout. The final TR08-only change is covered by the separate continuity evidence.

Every sample has its own JSON measurement and actual JPEG capture. Filenames use `local-acceptance-vp-{profile}-{state}` or `local-boundary-final-vp-{profile}-{state}`. The completed full-run log records all 104 outcomes. Its aggregate later retained a 103-case checkpoint; the aggregate's `aggregateRecovery` field records reconstruction from the 104 already-written standalone sample JSON files. The checkpoint was preserved. No missing sample, timestamp or outcome was invented.

## Exact matrix

| Family | CSS viewport profiles | States |
|---|---|---|
| Required | 320 × 700; 360 × 640; 390 × 844; 768 × 1024; 1440 × 900; 1920 × 1080; 2560 × 1440; 3840 × 2160 | Hero, CH04 long heading, TR08–09 midpoint, CH09 after clicking A/B/C, CH11 ending |
| Breakpoint neighbors | 699 × 900; 700 × 900; 701 × 900; 1100 × 900; 1101 × 900; 1899 × 1080; 1900 × 1080; 2799 × 1440; 2800 × 1440 | Same five states |
| Landscape | 844 × 390 | Same five states |
| CSS content zoom | 125%, 150%, 200% at a 1440 × 900 CSS viewport | Hero, assembled CH09, ending |
| Fallback display font | Actual stylesheet override at 1440 × 900 | Hero, assembled CH09, ending |
| Additional risks | 390 × 844 CH10; fresh 1440 × 900 `#ch-04` launch | Sunrise; cold hash landing |

The cold hash sample lands at the actual chapter offset without corrective navigation. Assembly samples use the visible A, B and C controls and verify their pressed states. Navigation uses public hashes, document scrolling and UI actions; no application global or private state API is used.

## Corrections confirmed in the images

**Phones.** The repaired disc now clears the controls above and the result below. The result gap is calculated from the same native disc geometry as the artwork and the single sun. Short phones use compact titles, and late-city prose/actions have a continuous navy reading backing. Actual 320 × 700, 360 × 640 and 390 × 844 assembly/ending captures show all three pieces, a complete rim, separated titles and readable controls. The amber window and resident remain visible. CH10 at 390 × 844 is also clear in the sampled settled state.

**Desktop and tablet.** Non-phone artwork is uniformly contained between the fixed control bands. This preserves the upper aperture, full final circle and lower paper foreground. Aspect-ratio differences become navy wings, with a restrained edge fade. The header and footer stay opaque through their text baselines so scrolling prose cannot form a second text layer behind them. The hero uses the left reading shade, preserving its CTA over the foreground chimney.

The first contained-frame attempt used the whole viewport and passed viewport-bound calculations, but its upper rim remained behind the fixed header. Actual 1440/1920 screenshots exposed this. The final camera reserves the control bands, and the runner now measures the real circular outline against both viewport and fixed controls. It does not mistake the sun SVG's transparent viewBox padding for the painted circle.

**Wide phone boundary.** At 699–700 × 900, a width-cover portrait frame enlarged the aperture behind the header and cropped the attic below the viewport. The final 501–700 px rule caps portrait scale around its authored aperture-to-attic span. Hero and CH04 title widths are bounded beside that stage. Actual final 700 px hero/ending and 699 px CH04 captures show a complete aperture or restored disc, visible lamp and resident, and separated title/actions. The final 30-case retest passes throughout this boundary and at the three narrower regression sizes.

## Independent image inspection scope

Inspection included the six phone assembly/ending views; the three 768 × 1024 critical views; 1440, 1920, 2560 and 3840 hero/ending composition contact sheets; full-size 1440 hero, 1920 ending, 768 assembly, 844 × 390 assembly/ending and fallback-font hero; and the final corrected 699/700 px views. Contact sheets are supplementary thumbnails of actual screenshots, not replacement evidence. Their names are `local-acceptance-inspection-phones.jpg`, `-tablet.jpg` and `-wide.jpg`.

The landscape captures preserve the important art and readable title. Prose and controls may continue below the initial viewport and remain reachable by scrolling. Footer intersections are therefore review indicators rather than automatic whole-page failures. This is a scrolling narrative; the test does not require every paragraph and control to fit in a single short landscape frame.

## Retained limitations

- Artificial CSS zoom produces six failures: assembly and ending at 125%, 150% and 200%. The document zoom and scroll/stage coordinate assumptions disagree; assembly can resolve to the wrong chapter and the sun can leave the viewport. These samples are retained as failed diagnostics. They are not equivalent to browser UI zoom.
- The fallback-font hero is marked `LAYOUT_REVIEW` because its deliberately unbroken title extends beyond its nominal text container. The actual capture shows no viewport overflow, title/body overlap or aperture collision. Assembly and ending pass the fallback-font checks. This runtime resolves the requested Georgia fallback through installed fontconfig fonts; it does not establish actual Georgia rendering on Windows.
- The test uses Chromium 153.0.8010.0 with Playwright 1.62.1, Linux, a corrected private font configuration and CPU rendering. The original serverless GPU setup intermittently omitted glyphs/SVG sectors. Those earlier outputs are invalid for visual acceptance and are not combined with the final evidence.
- Every context uses device scale factor 1, `isMobile:false` and `hasTouch:false`. These are real browser CSS viewport samples, not physical phone, touch, native browser UI zoom, Safari, Firefox or physical 4K monitor certification.
- No synthetic performance score, unmeasured device capability or unobserved visual pass is claimed.

## Reproduction

Build the site, then run `node scripts/qa-viewports.mjs` with an installed Playwright browser. Optional `PAPERSUN_BROWSER_PATH`, JSON `PAPERSUN_BROWSER_ARGS`, and JSON `PAPERSUN_BROWSER_ENV` select an existing runtime. `PAPERSUN_QA_LABEL` gives each run distinct evidence filenames. `PAPERSUN_VP_FILTER` and `PAPERSUN_VP_STATES` select targeted retakes; omitting them runs the complete matrix. The runner starts its own production server at `127.0.0.1:4191`, waits for fonts and current artwork, and uses a fresh browser process per profile.
