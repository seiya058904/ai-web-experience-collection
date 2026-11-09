# PAS verification record

**Status: source/rig checks, the complete rendered asset set, the scoped Chrome browser review, cold late-chapter entry regression and candidate-source reproduction are recorded below. The exact delivery ZIP identity and post-package command record are supplied separately as `PAS-source.sha256` and `PAS-verification.json`. Unverified environments and methods are explicitly listed; this is not an “all passed” declaration.**

The record separates source assertions, actual mesh/surface checks, offline rendered-image review, browser behavior and package reproduction. A generated direction image is not browser evidence. A valid body pose is not proof that an image loaded in the browser. A successful build is not a visual or accessibility audit.

## Tested environment and review routes

| Item | Observed value or scope |
| --- | --- |
| Platform | Linux workspace; no Windows runtime execution |
| Node / npm | 24.22.1 / 11.9.0 |
| Required project minimum | Node 22.12.0 or later; the minimum version itself was not separately exercised |
| TypeScript / Vite | 5.9.3 / 8.3.6 |
| Three.js / Lenis | 0.187.0 / 1.3.27 |
| Python | 3.12.14 |
| Native asset renderer | ModernGL 5.13.0, glcontext 3.1.0, NumPy 2.3.5, Pillow 13.0.0 |
| Rendering context | EGL, OpenGL 4.5, Mesa 25.2.8; llvmpipe software renderer |
| Browser used for recorded UI review | Cloud Chrome with CSS viewport simulation; exact Chrome version and device-pixel ratio were not recorded |
| Broad interaction review | HTTP-served packed reviewer output, using the authored image sequence |
| Separate production review | Built output from the independently extracted candidate, served beneath `/pas/index.html` |
| Browser WebGL | The available cloud browser could not create a WebGL context; the optional live route remains visually unverified |
| Network/performance method | No true network throttling, measured browser FPS, Lighthouse score or cold-start timing series; the fault tests used controlled resource/decode failure and delay |

The optional Python renderer's environment and commands are in [RENDERING.md](RENDERING.md). Native render timings are production measurements, not browser FPS measurements. The packed reviewer loads a binary media archive; the normal application loads separate resources lazily. Results for one route are not silently treated as performance measurements for the other.

## Stage gates

| Gate | Observed evidence | Status and boundary |
| --- | --- | --- |
| G0 · Environment | Brief read; isolated project; requirements/evidence plan; tool and asset probes; no deployment or publication | Recorded |
| G1 · Art direction | Eight genuine generated images, prompts and packaged PNG originals; desktop and separate portrait direction; CGI adaptation documented | Generation and provenance verified; photographic fidelity is not claimed for the runtime figures |
| G2 · Prototype | Actual Hero and chapter-two route inspected; difficult contact/body defects repaired through actual 3D proofs; final desktop, phone and tablet Hero views reviewed | Observed prototype/UI checks completed in the stated Chrome environment |
| G3 · Whole work | Ten chapters and nine transitions; actual forward/reverse wheel routes at 390×844 and 1440×900; 45 settled transition samples; named controls exercised; fresh late-chapter entries rechecked | Recorded checks completed in the stated browser environment |
| G4 · Refinement | Rig/cloth/contact/floor defects corrected; actual final render samples inspected; footer obstruction, heading overflow and fallback composition repaired and rechecked | Recorded visual and UI refinements completed |
| G5 · Acceptance | Scoped responsive, keyboard, reduced-motion, failure-order, production-route and cold-entry observations below | Recorded acceptance checks completed, with the stated limits; untested methods/environments remain explicitly UNVERIFIED |
| G6 · Packaging | Independent candidate extraction; locked install, TypeScript/Vite build, 18 tests, archive hashes, copied production media and actual subpath production route checked | Candidate checks completed; the exact delivery archive and fresh-extraction checks are identified in the separately supplied `PAS-verification.json` |

[REQUIREMENTS.md](REQUIREMENTS.md) contains the original evidence plan. Planned checks do not become verified merely because they appear in that file.

## Source freeze and numerical checks

The historical freeze JSON files retain the status notes written when the source was frozen. Later render completion and browser results are recorded in `render-assets.json` and this report.

The authoritative final pose packet is named `final-authored-score`. It contains **2,001 Unison samples** from `t=0` through `10` and **153 Echo alternatives** from `t=4` through `4.76`, all at a 0.005 narrative interval. The body, garment and prop geometry is unchanged between these timing modes.

[source-freeze.json](source-freeze.json) records the source and packet SHA-256 hashes, the 18/18 motion test result, TypeScript success and the patch-isolation check. The final palm/crossing corrections preserve their boundary poses at `1.76`, `2.89`, `4.76` and `6.00`. A comparison of 1,529 outside-interval samples found exact equality of the unchanged pose, camera and contact state. The travelled-path history intentionally records the corrected route after the crossing.

The eighteen motion tests cover:

| Check | Freeze result |
| --- | --- |
| Direct, forward and reverse evaluation produce identical complete poses | Passed |
| Ten chapters and nine transition intervals have valid independent states | Passed |
| Measured arm, forearm, thigh and shin lengths remain fixed | Passed |
| Planted anchors stay fixed; swing feet stay above the floor; support remains | Passed |
| Palm exchange and its handovers avoid the rejected folded-wrist pose | Passed |
| Counterweight establishes a grasp and recovers weight before release | Passed |
| Echo differs from Unison inside the phrase and shares its endpoints | Passed |
| Timing choice does not change contact, walking, opening or ending chapters | Passed |
| Chapter, transition and phase boundaries are continuous | Passed |
| Dense sampling finds no joint flips or palm-basis singularities | Passed |
| Cheng yields in depth while both actors step and retain identity | Passed |
| Back contact lowers/rises with fixed supports | Passed |
| Chapter 8 is a distinct complete phrase with release and reconnection | Passed |
| Finger release follows recovery, with a subsequent response | Passed |
| Final fingertip contact uses the actual shipped finger measurements | Passed |
| Ending differs from the opening while retaining its relation | Passed |
| Degenerate or unreachable IK queries stay finite and preserve segment lengths | Passed |
| Invalid progress is bounded and optional breath does not move supports | Passed |

These tests establish the stated kinematic assertions in the sampled/generated states. They do not constitute a physics simulation, professional movement review, a browser test or a clinical assessment.

## Actual rig and surface checks

The checks use the actual subdivided, skinned MakeHuman-derived geometry and `createCharacter()` matrices, not a stick-figure replacement.

| Subject | Measured result and scope |
| --- | --- |
| Bone matrices | Every matrix for both actors' 163 bones was finite across all 2,154 final samples |
| Orientation continuity | No approximately 180° half-twist branch jumps remain; maximum sample step was 34.35° during a brief Echo turn; a 10× denser local check reduced that to 3.81° |
| Floor | Both renderers use `y=0`; sampled planted skin soles are about 0.639 mm above it for Cen and 0.168 mm for Cheng |
| Light palm contact, `t=2.35` | 51,490 facing-surface samples at 0.3 mm spacing: minimum clearance 0.7655 mm and no sampled penetration |
| Palm wrist angle, `t=2.35` | Approximately 16.94° Cen / 14.18° Cheng after correction; the rejected pose exceeded 110° |
| Counterweight | Actual proof render inspected after lowering the connecting elbows and using moderate finger curls |
| Crossing, `t=5.25…5.45` | All 41 rendered sample times checked: minimum nearest-vertex separation 16.829 mm and minimum upper-body projected depth separation 19.110 mm |
| Back contact, `t=6.55` | Central opposing shirt extents separated by approximately 6.13 mm; nearest sampled back vertices about 8.64 mm |
| Final fingertip contact, `t=7.98` | Nearest actual middle-fingertip skin vertices separated by approximately 1.020 mm |
| Texture files | All six runtime WebP textures decoded; hair retains alpha; bump map explicitly converted to RGB and validated on write |
| Resource ownership | Actor skeleton/prop disposal and shared asset disposal implemented; concurrent loading failures await sibling completion before cleanup |

[CHARACTER-VERIFICATION.md](CHARACTER-VERIFICATION.md) describes the surface methods and their limits. [rig-continuity.json](rig-continuity.json) contains the exact final matrix maxima and hashes. [render-camera-bounds.json](render-camera-bounds.json) records dense bone-head/tail camera checks with no clipped bone groups in either view or timing mode. That last result does **not** prove that every cloth/hair silhouette or browser crop is unclipped.

## Defects found and corrected before the final render

| Defect | Observed evidence | Correction | Recheck |
| --- | --- | --- | --- |
| Skin through shirts and waist | Actual textured proof renders | Covered-skin mask and longer shirt overlap | Corrected proof renders inspected |
| Long source ponytail and oversized bun | Actual character silhouettes | Fitted scalp crop and smaller raised low bun | Updated silhouette inspected |
| Sand shirt rendered too dark | Source fabric map was mid-grey | Near-white fabric albedo retaining texture variation | Rust/sand palette inspected |
| Pinched elbows | Shared-low pose proof | Proximal elbow plane retained; wrist turn distributed through split forearm bones | Continuous elbow silhouette inspected |
| Quaternion midpoint flip | Full packet matrix scan | Fixed unwrapped half-twist branch for the authored score | Entire final packet checked |
| Raised counterweight elbow and crowded grip | Actual full-body handhold proof | Connecting-arm pole and moderate finger curls | Updated counterweight proof inspected |
| Folded light-contact wrists | True hand-camera proof and measured angles | Horizontal finger direction with opposed palm normals | Corrected oblique proof, surfaces and full handover matrices checked |
| Fingertip gap | Actual skin and distal-bone evaluation | Model-derived finger-pad offset | Approximately 1 mm skin clearance |
| Passing foot/arm overlap | Actual skinned positions and crossing proof | Temporary rearward route and passing foot-anchor adjustment | Dense 41-frame clearance check plus actual proof |
| 8 mm floor offset | Geometry/floor comparison | Floor moved from −0.008 to 0 | Foot minima and floor-zero proof checked |

A selected still proves only what it shows. The actual browser route and interaction observations are recorded separately below.

## Deliberate runtime adaptations and limitations

The default website uses an **authored pre-rendered sequence from the same deterministic rig**, selected directly by narrative position. It is not a recorded dance and does not use the generated concept images as animation frames. Unison and Echo are separately rendered where their timing differs.

The final figures are **illustrative CGI**. Their face fidelity, skin detail and cloth behavior do not match the photorealistic quality of the direction studies, including IMG-07. Clothing uses fitted linear blend skinning rather than fabric simulation, and balance/contact relationships are authored kinematics rather than a force-based balance solver.

The native sequence has one fixed main camera per wide/portrait layout, supplemented by detail views. It does not add idle breathing when narrative progress is paused. This preserves direct random access and the displayed pause state. The optional live WebGL route remains in source, but it could not receive browser visual verification in the available WebGL-disabled environment.

## Completed final render and media integrity

The uniform final render contains the accepted palm and crossing corrections, with the floor at `y=0` in every view. The finalizer fully decoded all **4,679 rendered WebP frames**, checked their dimensions and recorded their SHA-256 hashes. They occupy **89,270,614 bytes** before ZIP compression. It also generated **100 still aliases** and **20 chapter posters** from the current content timings.

| Render set | Frames | Dimensions |
| --- | ---: | --- |
| Wide Unison | 2,001 | 1200×900 |
| Portrait Unison | 2,001 | 720×960 |
| Wide Echo alternatives | 153 | 1200×900 |
| Portrait Echo alternatives | 153 | 720×960 |
| Foot detail | 153 | 800×600 |
| Hand details | 218 | 800×600 |

The narrative interval is 0.005, or density 200. This is not an asserted device playback rate. [render-assets.json](render-assets.json) contains every rendered frame's size/hash and the alias mappings. The packaging audit independently rechecked all 4,679 frame hashes against that record. The source manifest reports `complete`; five interrupted-render zero-byte partials were removed and excluded from packaging. The clean candidate and built production media contained no `.part` files.

## Actual Chrome browser observations

The results below describe actions and outcomes observed in the browser session. They do not assert coverage of untested browsers, hardware or assistive technologies. The principal structured records are [browser-observations.json](evidence/browser-observations.json), containing 61 route observations and 45 transition samples, and [the final review matrix](evidence/pas-final-review-matrix-1794193291159.json), containing viewport, manual reduced-motion and injected-fault observations.

### Main path, transitions and chapter controls

| Check | Observed result | Scope |
| --- | --- | --- |
| Complete portrait route | Actual wheel scrolling through all ten chapters forward and backward at 390×844; the authored sequence and chapter controls remained available | Packed reviewer; ordinary scroll input, separate from direct progress sampling |
| Complete wide route | Actual wheel scrolling through all ten chapters forward and backward at 1440×900 | Packed reviewer |
| Nine transition samples | All 45 samples at 0/25/50/75/100% of the nine handovers resolved to the matching 0.005-grid frame with `ready` state | Settled frame/state checks; continuous wheel traversal was observed separately |
| CH03 detail | Opened and closed the actual 800×600 same-rig hand detail | The detail is a separate rendered camera view, not a crop of the overview |
| CH04 counterweight | “Own weight” resolved to 2.89; shared weight to 3.42; Return to 3.90 | Real control actions and body states observed |
| CH05 timing | Unison and Echo showed visibly different bodies at 4.28 | The alternate sequence was visibly used |
| CH05 playback | Play, pause, resume, replay and reset exercised; PageDown took control back for document scrolling | Bounded playback/control interaction observed; no FPS measurement |
| Paths | Both path overlays appeared when requested | Two distinct displayed paths |
| CH07 steps | The three controls resolved to 6.07, 6.50 and 6.94 | Actual chapter step actions |
| CH08 phrase | Playback exercised; the late “Meet” control reached 7.98 after the footer-obstruction repair | Actual mouse activation after the layout fix |
| Ending comparison | Opening/ending comparison control exercised | The two states were visibly distinct |
| Keyboard and dialogs | Focus indicators visible; keyboard chapter menu worked; Escape closed dialogs and restored focus | Specific observed keyboard routes, not a full assistive-technology audit |
| Sound control | Sound UI switched on and off | Audibility and audio quality were not assessed |

The 45 transition checks establish target-frame correspondence at those positions. They do not measure every intermediate frame's decode latency or establish a stable browser frame rate. Source-level deterministic sampling and actual continuous wheel traversal are separate kinds of evidence.

### Responsive layout and visual review

The final geometry checks covered **320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160** CSS viewport presets. Document `clientWidth` and `scrollWidth` matched in all three checked phases: Counterweight, CH08 and the ending. Reading-panel content width was separately measured in Counterweight only, where its `clientWidth` and `scrollWidth` also matched. These checks found no measured horizontal overflow in their stated scope. The review harness's document width was approximately 10 CSS pixels below each preset width because of its scrollbar; both the preset and measured width are retained in the JSON.

The short landscape **844×390** case remained readable through the reading panel's internal scrolling. Breakpoint-adjacent widths **759, 760, 959 and 960**, each at height 900, were checked with the sequence ready. These are viewport simulations, not tests on physical mobile or 4K hardware.

Actual image inspection included the Hero at 1440, 390, 768 and 3840 CSS-pixel widths, the 320-pixel phone layout and the short landscape composition. The current packaged final screenshots include:

- [Desktop Hero](evidence/pas-final-hero-desktop-1794192006872.jpg), [phone Hero](evidence/pas-final-hero-phone-1794192006874.jpg) and [tablet Hero](evidence/pas-final-hero-tablet-1794192006873.jpg).
- [Counterweight](evidence/pas-final-counterweight-1794192260781.jpg) and [small-screen counterweight](evidence/pas-final-small-counterweight-1794193291160.jpg).
- [Current-chapter fallback](evidence/pas-final-fallback-1794193291161.jpg).

The `pas-final-` files document the later review state. A geometry check and a screenshot inspection are recorded separately rather than treated as interchangeable.

Keyboard zoom attempts did not produce a measured viewport change. **Actual 125%, 150% and 200% browser zoom remain UNVERIFIED.**

### Manual reduced motion and resource failures

| Condition | Observed result | Boundary |
| --- | --- | --- |
| Manual reduced-motion selection | All ten chapters reached `ready` with reduced mode selected and playback false; no unwanted autoplay observed | Actual operating-system preference changes were not tested |
| Step-by-step/reading control | Opened the notes/reading alternative; chapter controls remained available | A manual UI action, not an OS-level preference emulation |
| Frame-sequence failure in CH09 | Displayed the current chapter's portrait still at 720×960, with the correct English description | Injected failure, not a real network outage |
| All movement imagery failed | The movement image source was cleared to `null`; the English unavailable/current-chapter description and controls remained | The Hero image remained normal; the fault covered movement imagery, and no unrelated earlier chapter movement image was retained |
| Retry while the fault remained | Continued to show the appropriate fallback | Successful repair of an actual network connection was not separately exercised |
| Slow, out-of-order decode | Injected 850/300/40 ms delays while requesting 4.275 → 6.505 → 8.30; the display settled at 8.300 and stayed there after older requests completed | Controlled decode-delay test; no claim of network bandwidth/latency throttling |

Background visibility/return behavior was not validated. Cache growth, listener counts, memory use and sustained device performance were not benchmarked. Forward/reverse route completion does not establish those lifecycle or performance claims.

### Browser-discovered defects and rechecks

| Defect | Observed cause or condition | Repair | Observed recheck |
| --- | --- | --- | --- |
| Late CH08 “Meet” obstructed by footer | Expanded chapter content could extend beneath the fixed footer | Bounded the reading area and enabled internal vertical scrolling | Actual mouse activation reached 7.98; short-screen content remained readable |
| Long heading overflow | The Counterweight heading measured about 411 px within a 390 px reading column | Reduced the maximum chapter heading size from 64 px to 60 px | Final title/CH08/ending width matrix showed no horizontal overflow |
| Failure notice covered the stage/feet | Fallback messaging competed with the image composition | Moved the notice into the reading column and used the portrait chapter still on narrow layouts | CH09 failure showed the 720×960 current still; final fallback image inspected |
| Cold late-hash entry | Initial native-anchor rounding could override the intended restored narrative position | Capture the intended restore position and reassert it on the load/animation-frame settlement; actual input, history navigation or QA seeking prevents that restoration from taking over | Fresh `#let-go` opened CH09 at 8.07968 with frame 8.080 ready; fresh `#here-again` opened CH10 at 9.07982 with frame 9.080 ready |

## Candidate reproduction and separate production browser route

[package-reproduction.json](package-reproduction.json) and [package-reproduction.md](package-reproduction.md) record a new directory extracted from the source candidate, initially without dependencies or prior build output. In that copy:

- `npm ci` completed with exit 0 and installed 29 packages from the lockfile.
- `npm run build` completed with exit 0, including TypeScript's no-emit check and the Vite production build.
- `npm test` completed with **18/18 passing tests**.
- The browser-discovered layout/fallback repairs were copied to the candidate and rebuilt successfully; the report records the exact revisions and hashes.
- ZIP integrity and extracted-file hashes matched; all **4,819 public assets** copied byte-for-byte into the production output, including the complete sequence, aliases, posters, art and character resources.
- The production build included eight local WOFF/WOFF2 resources. The source candidate included the eight original PNGs, font archive, source model data and license notices.

The installed npm environment had an available cache. This was not an empty-cache or disconnected-install test, and it was not a Windows execution.

The **extracted production `dist`** was also served at **`/pas/index.html`**, independently of the packed reviewer. Sixteen actual wheel steps traversed all ten chapters with the renderer ready. Browser history returned to CH03, forward navigation returned to CH05, and reloading the already established CH08 location restored frame 7.08.

After the cold-entry correction, the extracted production output was rebuilt with `index-CWzb26nb.js`. A fresh tab at `#let-go` resolved to CH09, narrative position **8.07968**, displayed frame **8.080**, and `ready`. A separate fresh tab at `#here-again` resolved to CH10, narrative position **9.07982**, displayed frame **9.080**, and `ready`. These are actual fresh-entry results, separate from the earlier reload/history observations. The restoration strategy was also reviewed against user-input and navigation takeover.

Final production controls were checked against the separate local assets: the ground overlay displayed **four SVG ellipses**; Echo at **4.28** loaded **`/pas/frames/echo-wide/0856.webp`** with natural width **1200**, and Reset returned to Unison. These observations confirm use of the alternate production resource, beyond the packed-review comparison.

In the captured production console record, 21 errors were identified as extension metadata errors; **zero application warnings or errors were captured in that observation window**. This classification is not a claim that every console message in every session or failure condition was examined.

The packed reviewer output was actually built and opened over HTTP as the HTML/binary-pack pair. It is a developer review route, not a double-click `file://` guarantee. Its broad interaction matrix is identified separately above because its media-loading behavior differs from the normal lazy-resource build.

### Delivery archive record

The delivered archive is named **`PAS-source.zip`**. Its exact SHA-256 is supplied in **`PAS-source.sha256`**. The separate **`PAS-verification.json`** identifies that archive by checksum and records its final CRC, extraction/file equivalence and clean-install/build commands. These external records avoid making an archive contain its own checksum.

`package-reproduction.json` identifies the earlier candidate and its documented source refreshes. It is retained as provenance and must not be confused with the final archive checksum. All final runtime, tests, pinned package inputs and media are compared against the reproduced source before delivery. Build output, installed dependencies and interrupted-render partials are excluded from the source ZIP.

The final production observation is recorded in [the production browser record](evidence/pas-production-verification-1794194026505.json); [the production Counterweight screenshot](evidence/pas-production-counterweight-1794194026501.jpg) shows the actual extracted application.

## Explicitly unverified scope

The following were **UNVERIFIED**, rather than silently treated as passed: Safari and Firefox; real iOS/Android devices or physical 4K hardware; touch hardware; Windows runtime/starter execution; the optional live WebGL view; actual 125/150/200% browser zoom; a live operating-system reduced-motion preference change; background visibility/return; screen-reader behavior and a comprehensive accessibility audit; true network throttling; cold-start timing; browser FPS, Lighthouse, memory or listener-growth benchmarks. Exact browser version and DPR were not recorded.

The photographic-to-CGI adaptation, fixed main cameras, absent paused idle breathing and authored kinematic contact limits described above also remain material characteristics of the delivered work. Completion of the observed checks does not remove those limits or establish professional dance, biomechanical or clinical validation.
