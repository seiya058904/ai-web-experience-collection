# CHRYSALIS — evidence index

Inventory reviewed **9 November 2026 (UTC)**. Paths below refer to existing project files. A test definition, design document, generated asset, or screenshot is evidence only for its stated scope. Read [QA results](qa-report.md) for interpretation and [the requirements ledger](../requirements-evidence.md) for open acceptance items.

## Executed checks and environment records

| Retained file | Provenance and result | Scope / freshness |
| --- | --- | --- |
| [final-build-and-tests.txt](../evidence/final-build-and-tests.txt) | Current production: 51 tests passed, 0 failed; English guard over 35 authored files; successful TypeScript/Vite build | Includes the phone J-plate containment correction. No whole-site or final-package acceptance is inferred. |
| [final-production-build.json](../evidence/final-production-build.json) | Recorded 08:45:36 UTC; entry SHA-256, script `./assets/index-CHOjqdUS.js`, CSS `./assets/index-ByIcPCHI.css` | Current production identity, also read from the actual final containment-test document. |
| [final-source-fingerprint.json](../evidence/final-source-fingerprint.json) | Current production maps sizes and hashes for 58 input paths | Build-input identity, not the source ZIP manifest or ZIP checksum. |
| [pose-build-and-tests.txt](../evidence/pose-build-and-tests.txt) | Archived B3 command output: 47 tests passed, 0 failed; English guard over 34 authored files; successful TypeScript/Vite build | Complete-pose and phone-study snapshot used by the 195-check affected run. |
| [pose-production-build.json](../evidence/pose-production-build.json) | Archived entry hash and script `./assets/index-B3o3QDo8.js`; CSS `./assets/index-BCuQmqec.css` | B3 identity, kept separate from CZ and later visual corrections. |
| [pose-source-fingerprint.json](../evidence/pose-source-fingerprint.json) | Recorded 08:09:25 UTC; 56 source, production-input and test-harness paths with sizes/hashes | Archived B3 input identity. |
| [build-and-unit-check.txt](../evidence/build-and-unit-check.txt) | Captured command output: 42/42 deterministic tests, English character guard over 30 authored files, successful TypeScript/Vite build | Historical source snapshot preserved alongside the separate 47- and 51-test records. |
| [mobile-anchor-regression.txt](../evidence/mobile-anchor-regression.txt) | Recorded targeted engine regression: 1 pass, 0 failures; type-check exit 0 | Portrait/desktop anchor evaluation, including 700/701px; explicitly no browser-rendering verdict. |
| [asset-audit.json](../evidence/asset-audit.json) | PASS, observed 07:34:34 UTC; 15 retained assets, 20 generation calls, production file sizes/hashes | Includes corrected AI-09; 1,491,734 production WebP bytes. File integrity and provenance only. |
| [matrix-before-fixes.json](../evidence/browser/matrix-before-fixes.json) | Actual Chrome 156 iframe run, 07:15–07:26 UTC: FAIL, 302 PASS / 8 FAIL / 310 total | Before later corrections. DPR 1, unthrottled, warmed images; exact CSS sizes and eight errors preserved. |
| [affected-route-interruption.json](../evidence/browser/affected-route-interruption.json) | Actual affected run, 07:51–07:52 UTC: STOPPED, 15 PASS / 8 FAIL / 23 total | Shared-route interruption; selected hero images unavailable. Does not supersede the full matrix. |
| [affected-pose-final.json](../evidence/browser/affected-pose-final.json) | B3 run, 08:16:31–08:24:57 UTC: PASS, 195 PASS / 0 FAIL | Real Chromium iframe DOM/state checks: responsive sources, recorded transition checkpoints, eleven-chapter layouts, controls, UI reduced motion, explicit fallback-font metrics and English/completeness. All eight main widths plus a 699px annotation check. No continuous-motion/anatomical or OS-preference verdict. |
| [refinements-before-containment.json](../evidence/browser/refinements-before-containment.json) | 08:41:31–08:45:12 UTC: FAIL, 96 PASS / 2 FAIL / 98 total; loaded module `index-81aSGw2Y.js` | Five CSS viewport sizes; TR-01 captions, TR-03 complete poses and mode boundaries, TR-05 plate bounds, TR-07/08 actual rendered wording. Two inherited-overscan bounds failures at 320/390px remain in this original record. |
| [hanging-containment-final.json](../evidence/browser/hanging-containment-final.json) | 08:46:28–08:46:35 UTC: PASS, 2 PASS / 0 FAIL; actual loaded `CHOjqdUS` / `ByIcPCHI` identity | Specific repeat of the two failed full-plate bounds assertions after disabling only phone TR-05 overscan. Assertions unchanged. Resolves those failures without relabeling the original 98-check run as passed. |
| [manual-input-observations.json](../evidence/browser/manual-input-observations.json) | Six actual browser-control input observations recorded at 07:54 UTC | Corrected-2 snapshot, 390×844 CSS iframe, before complete-pose/study refinements; wheel, selection, arrow, focus, Tab, Escape. |
| [direct-navigation-and-capability-observations.json](../evidence/browser/direct-navigation-and-capability-observations.json) | Recorded 08:05 UTC: fresh top-level `#ch-08` navigation PASS; actual browser zoom and background-tab restoration attempts BLOCKED | Corrected-2 before final refinements, Chrome 156, unthrottled/warm-cache context. Zoom inputs did not change 1355px document width; all inspected documents remained visible. No successful zoom or hidden-to-visible transition is claimed. |
| [recovery-before-final-fixes.json](../evidence/browser/recovery-before-final-fixes.json) | Actual retained-iframe recovery run, 07:53–07:57 UTC: FAIL, 6 PASS / 1 OBSERVED / 1 FAIL | Real 404/Retry, simulated stale callbacks, still view, resize, history and diagnostics. Reload retained scrollY but changed active chapter. Older transition captions identify the pre-correction presentation. Both requested 61-frame samples timed out with 24 and 22 observed frames; no FPS/performance pass. |
| [pose-recovery-before-lifecycle-fix.json](../evidence/browser/pose-recovery-before-lifecycle-fix.json) | B3 deeper run, updated 08:22:11 UTC: FAIL, 3 PASS / 2 FAIL / 1 BLOCKED | Semantic reload moved relative to its anchor after a 164px layout change; still-to-immersive restoration lost the chapter; real image Retry was blocked when the shared route served PULSE. Initial load, simulated stale callbacks and resize passed. |
| [reload-semantic-first-retest-failure.json](../evidence/browser/reload-semantic-first-retest-failure.json) | Earlier isolated B3 record: initial load PASS and semantic reload FAIL | The same reload failure later included in the deeper report. Do not count it as an independent rerun or rewrite it as passed. |
| [reload-checkpoint-pending-observation.json](../evidence/browser/reload-checkpoint-pending-observation.json) | CZ early record, updated 08:26:23 UTC: initial load PASS, strict reload assertion FAIL | Actual public restoration status was `pending-session` when geometry was asserted. The saved failure remains intact. |
| [checkpoint-application-observation.json](../evidence/browser/checkpoint-application-observation.json) | Later real DOM attributes on CZ: restoration `applied`, active chapter `ch-10`; artifact recorded 08:33:59 UTC | Exact observation timestamp was not separately retained. No later scrollY/fraction measurement; proves exit from pending only, not a geometry pass. |
| [lifecycle-still-retest.json](../evidence/browser/lifecycle-still-retest.json) | CZ record, updated 08:27:17 UTC: FAIL overall, 2 PASS / 1 FAIL | All eleven chapters/still-to-immersive restoration passed and selected CH-05 returned correctly. The earlier pending-session reload failure remains in this overlapping report. Do not sum component reports as independent coverage. |
| [recovery-final.json](../evidence/browser/recovery-final.json) | Created 08:37:32, updated 08:45:11 UTC: PARTIAL, 6 PASS / 1 BLOCKED / 0 FAIL | Initial load, actual changed/unchanged semantic reload, stills, history, real 404/fallback/Retry and resize passed. One earlier reload attempt blocked by the PULSE route remains. No new performance sample. |
| [recovery-final-production-identity.json](../evidence/browser/recovery-final-production-identity.json) | Actual recovery document: `./assets/index-t-phVWi2.js`, CSS `./assets/index-XL107Ink.css` | Later delivery changes only phone J-plate tag and overscan framing. The recovery run is not claimed to have loaded the current final module. |
| [package-candidate-before-containment.json](../evidence/package-candidate-before-containment.json) | Earlier separate extraction/install/build/asset-audit PASS; all three command exit codes 0 | Explicitly superseded by later containment CSS. Its then-current build-match flag and candidate checksum are not final archive verification. |
| [candidate-install-build.txt](../evidence/candidate-install-build.txt) | Actual `npm ci`, production build and asset-audit output from the independent candidate directory | Verifies 15 originals, 15 production checksums, 15 built copies and declared fallbacks for that candidate. Candidate browser verification was not performed in that record. |
| [playwright-environment.json](../evidence/prototype/playwright-environment.json) | BLOCKED: absent Chromium binaries; official installer received empty invalid archives | No navigation attempted, no captures, no passed browser checks. This is separate from the working cloud-browser method. |
| [environment-interruption.md](../evidence/environment-interruption.md) | Operator record of an earlier development-preview route replacement | Interrupted 11-check observation with no complete result recovered; not a matrix pass. |
| [design-detector.json](../evidence/design-detector.json) | Retained detector output is the empty array `[]` | No score, substantive finding, or visual acceptance is inferred. |
| [prototype-main.ts.txt](../evidence/prototype-main.ts.txt) | Preserved prototype source | Implementation history, not proof that a browser prototype gate passed. |

## Historical desktop captures

Every file in this table is a **1341×921 JPEG of the visible region of a 1440px CSS iframe**. Host clipping prevents treating it as a complete 1440px viewport capture. These files precede the complete-pose and phone-study refinements. A screenshot proves only the visible still state.

| File | Captured subject | Review use and limit |
| --- | --- | --- |
| [desktop-1440-hero-visible1363.jpg](../evidence/browser/desktop-1440-hero-visible1363.jpg) | Stable hero | Selected art/text fidelity in the visible region. The filename's “1363” is not its raster width; no six-state/return verdict. |
| [desktop-1440-ch05-visible-region.jpg](../evidence/browser/desktop-1440-ch05-visible-region.jpg) | Instar introduction and Show-all study | Historical comparative scale/spacing evidence; lower study extent outside the capture. |
| [desktop-1440-ch08-visible-region.jpg](../evidence/browser/desktop-1440-ch08-visible-region.jpg) | Exterior chrysalis introduction | Visible support and explanation; not the inside state. |
| [desktop-1440-ch10-visible-region.jpg](../evidence/browser/desktop-1440-ch10-visible-region.jpg) | Emergence introduction | Text/art relationship; captured bottom edge does not prove full-body framing. |
| [desktop-1440-ch11-visible-region.jpg](../evidence/browser/desktop-1440-ch11-visible-region.jpg) | Resting adult finale | One visible adult at rest; no departure/return sequence proof. |
| [desktop-1440-tr06-p50-visible-region.jpg](../evidence/browser/desktop-1440-tr06-p50-visible-region.jpg) | TR-06-07 midpoint before correction | Independently reviewed FAIL: wipe joined incompatible larval and pupal body halves. Preserve as before-correction evidence. |
| [desktop-1440-tr09-p50-visible-region.jpg](../evidence/browser/desktop-1440-tr09-p50-visible-region.jpg) | TR-09-10 midpoint before correction | Historical late-pupa/emergence comparison; does not document the revised complete-pose mode. |

## Historical portrait and run-context captures

The six portrait context JPEGs are **1363×936**. Their application frame is **390 CSS pixels wide**, positioned on the left; the surrounding QA host canvas is not part of the product. The separate hero crop is **390×844**. No physical-phone or touch-emulation claim applies.

| File | Raster / captured subject | Review use and limit |
| --- | --- | --- |
| [portrait-390-hero.jpg](../evidence/browser/portrait-390-hero.jpg) | 1363×936; portrait hero and QA context | Stable independent portrait composition. |
| [portrait-390-hero-crop.jpg](../evidence/browser/portrait-390-hero-crop.jpg) | 390×844; cropped hero frame | Direct hero framing/text inspection; still state only. |
| [portrait-390-ch05.jpg](../evidence/browser/portrait-390-ch05.jpg) | 1363×936; Show-all instars | Before-refinement evidence: one horizontal row made specimens too small. |
| [portrait-390-ch05-instar5.jpg](../evidence/browser/portrait-390-ch05-instar5.jpg) | 1363×936; selected Instar 5 | Actual selected-specimen view, also cited by the arrow-key observation. |
| [portrait-390-ch05-reading-beat.jpg](../evidence/browser/portrait-390-ch05-reading-beat.jpg) | 1363×936; lower CH-05 reading beat | Reading context only; not selected-specimen proof. An earlier misleading temporary name is not used here. |
| [portrait-390-ch08-inside.jpg](../evidence/browser/portrait-390-ch08-inside.jpg) | 1363×936; inside reconstruction | Before-refinement evidence: small subject within a wide panel; disclaimer visible. Does not establish registration onto the exterior art. |
| [portrait-390-ch10.jpg](../evidence/browser/portrait-390-ch10.jpg) | 1363×936; emergence introduction and upper art | Chapter continues below capture; the image does not demonstrate that the adult itself is cropped by the scene. |
| [matrix-in-progress.jpg](../evidence/browser/matrix-in-progress.jpg) | 1348×926; running QA context | Progress observation only. Use the saved JSON, not this still, for final counts. |

## B3 revised-state captures

These **two desktop and nine portrait files** are retained captures of the B3 complete-pose and study corrections; their filenames retain the `final-` prefix. Both desktop images are **1341×921 visible-region rasters from a 1440px CSS iframe**. Every portrait image is a **1363×936 context raster containing the 390px CSS page on the left**. Neither group is a physical-device capture. The independent reviewer has marked the targeted earlier G4 defects resolved within these inspected compositions; [the art/interface review](independent-art-review.md) states the exact scope and separate new findings.

| File | Captured state | Scope |
| --- | --- | --- |
| [final-desktop-tr06-p50.jpg](../evidence/browser/final-desktop-tr06-p50.jpg) | Desktop TR-06-07 at 50% | Revised J-hang/chrysalis complete-pose comparison; visible region only. |
| [final-desktop-tr09-p50.jpg](../evidence/browser/final-desktop-tr09-p50.jpg) | Desktop TR-09-10 at 50% | Revised late-pupa/emergence complete-pose comparison; visible region only. |
| [final-portrait-tr06-p25.jpg](../evidence/browser/final-portrait-tr06-p25.jpg) | Portrait TR-06-07 at 25% | First retained quarter-point still of the revised comparison. |
| [final-portrait-tr06-p50.jpg](../evidence/browser/final-portrait-tr06-p50.jpg) | Portrait TR-06-07 at 50% | Revised midpoint still; compare with the historical spliced-body frame. |
| [final-portrait-tr06-p75.jpg](../evidence/browser/final-portrait-tr06-p75.jpg) | Portrait TR-06-07 at 75% | Retained three-quarter-point still. |
| [final-portrait-tr09-p25.jpg](../evidence/browser/final-portrait-tr09-p25.jpg) | Portrait TR-09-10 at 25% | First retained quarter-point still of the revised comparison. |
| [final-portrait-tr09-p50.jpg](../evidence/browser/final-portrait-tr09-p50.jpg) | Portrait TR-09-10 at 50% | Revised late-pupa/emergence midpoint still. |
| [final-portrait-tr09-p75.jpg](../evidence/browser/final-portrait-tr09-p75.jpg) | Portrait TR-09-10 at 75% | Retained three-quarter-point still. |
| [final-portrait-ch05-all-upper.jpg](../evidence/browser/final-portrait-ch05-all-upper.jpg) | Phone CH-05 Show-all, upper portion | One viewport portion of the revised comparative study; read with the lower capture. |
| [final-portrait-ch05-all-lower.jpg](../evidence/browser/final-portrait-ch05-all-lower.jpg) | Phone CH-05 Show-all, lower portion | Complementary viewport portion, not a single full-page capture. |
| [final-portrait-ch08-inside.jpg](../evidence/browser/final-portrait-ch08-inside.jpg) | Phone CH-08 illustrated inside | Revised explanatory study; a separate schematic, not evidence of physical registration onto the opaque exterior art. |

This set does not cover every chapter/control state, both endpoints and threshold neighbors for all ten boundaries, all six hero states, or continuous movement. Preserve the historical captures as the before-correction record.

## Additional boundary midpoint captures

All eight files below are **1363×936 context rasters of the 390×844 CSS page**. They cover midpoint compositions, not continuous travel or every threshold. The original TR-01/TR-03 failures remain preserved; their independently inspected replacements are indexed in the following section. Together with the revised TR-06/TR-09 captures, the independent review has now inspected every phone midpoint within its stated limits.

| File | Captured boundary | Retained finding / scope |
| --- | --- | --- |
| [boundary-01-p50.jpg](../evidence/browser/boundary-01-p50.jpg) | TR-01-02 at 50% | Historical FAIL: caption masks the egg/contact; replacement 320/390px midpoints independently resolved. |
| [boundary-02-p50.jpg](../evidence/browser/boundary-02-p50.jpg) | TR-02-03 at 50% | Retained midpoint observation; this index does not assign a pass. |
| [boundary-03-p50.jpg](../evidence/browser/boundary-03-p50.jpg) | TR-03-04 at 50% | Historical FAIL: shell/body splice; replacement complete-pose phone/desktop regions independently resolved. |
| [boundary-04-p50.jpg](../evidence/browser/boundary-04-p50.jpg) | TR-04-05 at 50% | Retained midpoint observation; this index does not assign a pass. |
| [boundary-05-p50.jpg](../evidence/browser/boundary-05-p50.jpg) | TR-05-06 at 50% | Retained midpoint observation; this index does not assign a pass. |
| [boundary-07-p50.jpg](../evidence/browser/boundary-07-p50.jpg) | TR-07-08 at 50% | Retained midpoint observation; this index does not assign a pass. |
| [boundary-08-p50.jpg](../evidence/browser/boundary-08-p50.jpg) | TR-08-09 at 50% | Retained midpoint observation; this index does not assign a pass. |
| [boundary-10-p50.jpg](../evidence/browser/boundary-10-p50.jpg) | TR-10-11 at 50% | Retained midpoint observation; this index does not assign a pass. |

## Replacement framing and current-wording captures

The desktop replacement is **1341×921**, showing the visible region of a 1440px CSS iframe. All phone context images below are **1363×936**; the filename identifies whether the retained page is 320px or 390px wide. These are real stills, not physical-device or continuous-motion evidence.

| File | State and review scope |
| --- | --- |
| [refined-portrait-01-p50-320.jpg](../evidence/browser/refined-portrait-01-p50-320.jpg) | TR-01-02 at 320×700: independently resolved caption/egg separation at this midpoint. |
| [refined-portrait-01-p50-390.jpg](../evidence/browser/refined-portrait-01-p50-390.jpg) | TR-01-02 at 390×844: independently resolved caption/egg separation. |
| [refined-portrait-03-p50-320.jpg](../evidence/browser/refined-portrait-03-p50-320.jpg) | TR-03-04 at 320×700: separately labeled complete hatching and feeding landscape plates; scoped independent resolution. |
| [refined-portrait-03-p50-390.jpg](../evidence/browser/refined-portrait-03-p50-390.jpg) | TR-03-04 at 390×844: full opened shell/tiny larva and full feeding head/body/contact/notch; scoped resolution. |
| [refined-desktop-03-p50.jpg](../evidence/browser/refined-desktop-03-p50.jpg) | TR-03-04 desktop midpoint visible region: separate complete observations side by side; scoped resolution. |
| [refined-portrait-05-p50-390-before-tag-shift.jpg](../evidence/browser/refined-portrait-05-p50-390-before-tag-shift.jpg) | Retained intermediate J-pose replacement before the tag was moved clear of the attachment. Not the final framing proof. |
| [refined-portrait-05-p50-390.jpg](../evidence/browser/refined-portrait-05-p50-390.jpg) | Complete J body/support and cleared tag at 390×844; directly inspected independent framing resolution, before the strict full-plate overscan correction. |
| [contained-portrait-05-p50-390.jpg](../evidence/browser/contained-portrait-05-p50-390.jpg) | Final J-pose framing after phone overscan removal; paired with the actual 2/2 containment result. |
| [contained-portrait-07-p50-390.jpg](../evidence/browser/contained-portrait-07-p50-390.jpg) | Rendered TR-07-08 wording: “A separate reconstruction introduces developing wing regions.” The actual caption check passed in the 98-check run. |
| [contained-portrait-08-p50-390.jpg](../evidence/browser/contained-portrait-08-p50-390.jpg) | Rendered TR-08-09 wording: “The late pattern returns to the exterior view.” The actual caption check passed in the 98-check run. |
| [ten-boundary-midpoint-contact-sheet.jpg](../evidence/browser/ten-boundary-midpoint-contact-sheet.jpg) | 1950×1848 sheet of ten actual 390×844 midpoint crops, arranged five columns/two rows. Build owner reviewed the assembled sheet with no further composition change requested. |
| [ten-boundary-midpoint-contact-sheet.json](../evidence/browser/ten-boundary-midpoint-contact-sheet.json) | Exact named originals and `[0,0,390,844]` crop rectangles. Mixed source snapshots are explicit; unchanged boundaries retain earlier frames. No synthetic frames, single-build full-path claim, or continuous-motion claim. |

## Review, art, and reproduction sources

| Existing path | Purpose | Evidence boundary |
| --- | --- | --- |
| [independent-art-review.md](independent-art-review.md) | Independent source-image/scientific-interface review and scoped production screenshot findings | AI-09, G4 targets and later captured-midpoint corrections resolved. Every phone midpoint directly inspected; exact composition/caption-source limits remain stated. No whole-site acceptance. |
| [asset-provenance.json](../art/asset-provenance.json) | Exact retained prompts, exposed arguments, references, selection/revision rationale, actual dimensions and hashes | 20 actual generation calls / 15 retained outputs. No inferred seed, hidden model setting, deterministic regeneration, or exclusive-rights guarantee. |
| [asset-manifest.md](asset-manifest.md), [asset-production.md](asset-production.md), [generated originals](../art/generated/) | Production role mapping, conversion method, retained image outputs | Project illustrations, not measured biology or documentary footage. Original dimensions are documented; no native 4K claim. |
| [transition-ledger.md](transition-ledger.md) | Ten boundary contracts, current complete-pose exceptions, deterministic engine history | Implementation contract and unit scope; final visual continuity remains separately reviewable. |
| [recovery-test-method.md](recovery-test-method.md) | Actual intended console operations and diagnostic metric definitions | Method description alone is not an executed result. Simulated late callbacks are distinguished from network reordering. |
| [cloud-qa.html](../tests/cloud-qa.html), [recovery-qa.html](../tests/recovery-qa.html), [browser.mjs](../tests/browser.mjs) | Reproducible browser harness/test source | Recovery waits at most 10 seconds for public pending restoration before unchanged strict assertions; actual completed outcomes are in `recovery-final.json`. Private QA surfaces are excluded from production output. |

## Known capability and coverage limits

Actual zoom and background-restoration attempts are **BLOCKED** at the scope recorded in the capability JSON above. B3 UI-selected reduced motion and explicit fallback-font metric exercises passed at their stated scopes; OS motion-preference emulation and actual late/missing font requests remain **NOT TESTED**. Native touch, physical devices, full accessibility review, slow-network coverage, and bfcache are also not established. No completed continuous scroll recording is retained; the used browser-control surface did not expose a recording API. A later result should replace only the limitation it actually exercises.

## Package and extracted-copy evidence

| Existing path | Actual result and scope |
| --- | --- |
| [package-verification.json](../evidence/package-verification.json) | Post-containment validation candidate `chrysalis-preflight.zip`: integrity/exclusions PASS, separate locked install/build/media audit PASS, 58 application/configuration/test fingerprints match, final built index matches. Its recorded archive hash is the candidate's hash, not the final delivery hash. |
| [extracted-install-build.txt](../evidence/extracted-install-build.txt) | Actual independent `npm ci`, `npm run build`, and media-audit output; all exit codes 0, 15 original/production/built assets verified. |
| [extracted-copy-observations.json](../evidence/browser/extracted-copy-observations.json) | Actual extracted build in top-level cloud Chromium: first/middle/last chapter and departure/return controls PASS. Raw report remains PARTIAL, 4 PASS / 1 FAIL: the managed preview's injected refresh script failed a zero-script live-response assertion. No JavaScript-disabled browser claim. |
| [reading-edition-source-audit.json](../evidence/reading-edition-source-audit.json) | Actual extracted reading-page bytes have 0 scripts, 11 chapter sections, 18 SVG studies, and all 17 local resource references present. Separates deliverable bytes from preview-service injection. |
| [extracted-desktop-hero.jpg](../evidence/browser/extracted-desktop-hero.jpg) | Native full top-level opening-page screenshot of the independently rebuilt final application, not a generated concept or CSS iframe crop. |

The final `chrysalis-source.zip` contains this completed evidence and documentation with the same fingerprinted application. Its final checksum, byte count, clean extraction/build/media results, and exact-copy first/middle/last browser observations are retained in the accompanying **`chrysalis-verification.json`** outside the ZIP. That placement identifies the immutable delivery archive without attempting to embed its own final hash. The preflight evidence remains accurately named and scoped; it is not rewritten as if it had been collected from the final archive.
