# RALLY — final partial acceptance record

**Overall status: partial acceptance.** The model/state tests, production builds, offline build, and independent extraction/rebuild passed. Real browser review covered desktop chapter entrances and many controls, plus part of the mobile journey. The full visual, transition, device, recovery, and download matrix was not completed. This record does not claim that the entire supplied brief passed.

**Status terms:** **Verified** refers only to the stated executed check; **Observed** records a specific browser result; **Partial** means the larger requirement remains incomplete; **Unverified** means the relevant check was not completed.

## Evidence and environment

| Field | Actual record |
| --- | --- |
| Date | 9 November 2026 |
| Build/test environment | Linux; Node.js 24.22.1; TypeScript 7.0.2; Vite 8.3.6 |
| Browser | Chrome 156 on Linux x86_64 |
| Desktop review | 1440×900 CSS viewport; all ten chapter entrances inspected in the browser session |
| Mobile simulation | 390×844 iframe CSS viewport; DPR 1; measured client width 375 px and scroll width 375 px |
| Physical devices | Windows, Android, physical phones and physical 4K hardware **Unverified** |
| Screenshots | [11 unaltered review screenshots and exact state notes](evidence/screenshots/README.md); these predate the last Hero/mobile/fallback refinements where noted |
| Reproduction evidence | [Sanitized command results and runtime hashes](evidence/reproduction-summary.json), with seven linked command-output excerpts |

The latest independently rebuilt version loaded in the browser with all **10 chapter elements**, **9 handoff elements**, and the new Hero relationship sentence present in the accessibility tree. A final screenshot attempt timed out. That load is not a complete interaction or visual retest of the final build.

### One measured layout/timing sample

At the recorded 390×844 iframe measurement, the heading/text/button horizontal-overflow check returned **0** and the failed-image check returned **0**. This is a specific snapshot, not a guarantee for every viewport, lazy image, or state.

One **warm local QA run** reported the custom `rally-interactive` marker at **198 ms** and `first-contentful-paint` at **416 ms**. These are not cold-start, controlled-network, FPS, Lighthouse, or physical-device benchmarks. No such benchmark is claimed.

## Model, explicit state, and source art

`npm test` passed **31 tests, 0 failed, 0 skipped** in the source project and again after clean extraction and `npm ci`. These are the same 31 tests run in two contexts, not 62 distinct tests. See [source test output](evidence/source-test.txt) and [clean test output](evidence/clean-test.txt).

| Risk | Executed evidence | Status |
| --- | --- | --- |
| Geometry and force direction | Singles dimensions, downward topspin in both directions, drag, same comparison origin/full velocity | Verified at model level |
| Comparison independence | No spin genuinely lands long; the immutable main topspin remains legal | Verified at model/state level |
| Main and rebound | Legal net/landing, deterministic sampling, immutability, half-step convergence, continuous B contact | Verified at model level |
| Both return branches | Legal A-side landings, different A movement/open space/response, four exact contacts | Verified at model level |
| Closing handbacks | Both start at the exact B stop, clear the net, and end at A's ready receiving point | Verified at model level |
| Seeking and ownership | 201 sample positions per branch, reverse seeks, terminal hold, floor/net interception, branch invalidation | Verified at model/state level |
| Persistence and playback state | Corrupt storage handling, bounded time, paused/muted restoration, no automatic catch-up | Verified at state level; audible/browser lifecycle behavior remains separate |

Eight distinct required image roles were generated and recorded: H-A, H-B, H-C, H-D, H-M, K-04, K-08, T-05-06. Three additional cutouts provide A, B, and the ball. H-M is an independent portrait composition. See [asset provenance](asset-provenance.md), [art direction](art-direction.md), and [the model contract](physics.md). Asset presence and source inspection do not certify final-page fidelity.

## Ten-chapter matrix

All desktop entrances were reviewed in-session. **Full entrance/two-beat/hold/exit acceptance for every chapter remains partial.** Some screenshot synchronization attempts failed; the retained evidence is identified below. Mobile review covered CH-01–07 and some control states, plus a CH-08 crosscourt screenshot in-session; mobile CH-09–10 were not completed.

| Chapter | Desktop 1440×900 evidence | Mobile 390×844 evidence | Control evidence / remaining limit |
| --- | --- | --- | --- |
| 01 | Entrance observed; [retained Hero](evidence/screenshots/desktop-1440-hero.jpg) precedes relationship-copy refinement | Opening reviewed | Final six-state visual timing incomplete |
| 02 | Entrance observed; [preparation](evidence/screenshots/desktop-ch02.jpg) | [Near-court clipping reproduced](evidence/screenshots/mobile-ch02-court-detail.jpg) | Source clipping fix included; final visual retest **Unverified** |
| 03 | All three contact states exercised; [contact screenshot](evidence/screenshots/desktop-contact.jpg) | [Pre-refinement composition](evidence/screenshots/mobile-ch03.jpg) reviewed | Mobile scene/control reordering included; final visual retest **Unverified** |
| 04 | Entrance and no-spin long result observed | [Macro-ball/comparison composition](evidence/screenshots/mobile-ch04.jpg) reviewed | No-spin preference survived CH-05 and revisit; full phone-state matrix incomplete |
| 05 | Entrance and all three flight-position buttons exercised; fixed main remained unchanged | [Main-path view](evidence/screenshots/mobile-ch05.jpg) reviewed | Mobile labels enlarged afterward; final legibility retest **Unverified** |
| 06 | All three bounce states exercised; [before-bounce view](evidence/screenshots/desktop-ch06.jpg) | [Contact state](evidence/screenshots/mobile-ch06.jpg) reviewed | Final mobile scene/control layout and induced SVG fallback **Unverified** |
| 07 | A/B views exercised; [B-side view](evidence/screenshots/desktop-view-b.jpg) retains identities | Chapter reviewed in partial mobile pass | Full camera-transition and touch-state matrix incomplete |
| 08 | Down-the-line choice exercised; chapter entrance reviewed | Crosscourt state screenshot reviewed in-session | Complete mobile branch selection→replay path **Unverified** |
| 09 | Play/pause, four event buttons, step, reset and keyboard seek exercised; [line branch at final B receive](evidence/screenshots/desktop-line-complete.jpg) | **Unverified** | Complete mobile replay and final-build interaction regression **Unverified** |
| 10 | Entrance and export UI action observed; return home retained line + no-spin preferences | **Unverified** | Saved SVG file capture, complete closing continuity and full mobile ending **Unverified** |

## Hero six-state matrix

| State / check | Desktop | Independent portrait | Wide screen |
| --- | --- | --- | --- |
| First meaningful frame under cold loading | Warm opening observed; cold loading **Unverified** | Opening observed; cold loading **Unverified** | **Unverified** |
| Reveal and early-scroll interruption | New relation copy present in final accessibility tree; visual timing/interruption **Unverified** | Final visual timing **Unverified** | **Unverified** |
| Complete composition against H-D/H-M | Earlier actual frame reviewed; final visual retest incomplete | Earlier actual portrait reviewed; final visual retest incomplete | **Unverified** |
| Long hold and optional position labels | **Unverified** as a complete state check | **Unverified** | **Unverified** |
| First-scroll scale/anchor continuity into CH-02 | **Unverified** as a continuous transition | **Unverified** | **Unverified** |
| Return to opening with saved choice | Observed: line and no-spin retained after returning home | Complete ending→home path **Unverified** | **Unverified** |

## Nine handoffs: all required frame cells retained

The latest build contained all nine handoff elements. The **45-frame matrix was not completed**. Element presence, an endpoint screenshot, or a passing physics test is not a transition pass. Continuous slow/fast/reverse input and phone continuity also remain unverified.

| Handoff | 0% | 25% | 50% | 75% | 100% | Slow / fast / reverse | Phone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01→02 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 02→03 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 03→04 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 04→05 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 05→06 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 06→07 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 07→08 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 08→09 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| 09→10 | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |

## Input and complete-path checks

| Check | Actual observation | Status / limit |
| --- | --- | --- |
| Whole journey | Desktop chapter entrances and ending→home reviewed | Partial; full phone journey and every transition **Unverified** |
| Direct chapter entry | Chapter navigation used during review | Full direct-entry/reverse/history matrix **Unverified** |
| Comparison isolation | No spin showed LONG; CH-05 retained the fixed main; revisit retained no spin | Observed in browser; model/state tests also passed |
| Return branches | Crosscourt state and down-the-line selection observed | Complete end-to-end UI/export comparison of both branches **Unverified** |
| Replay | Playhead advanced from 0.0723 to 0.1446; pause, four event buttons, step, reset and keyboard seek exercised; line final receive retained | Observed actions; mobile and complete final-build regression **Unverified** |
| Mid-replay change or exit | Invalidation verified by state tests | Full browser ownership/exit/closing-continuity sequence **Unverified** |
| Camera view | A/B views exercised with fixed identities | Observed; complete transition/touch matrix **Unverified** |
| Audio | Default-off state and restore behavior tested in state module | Audible event timing, mute/unmute and background/seek catch-up **Unverified** |
| Keyboard/accessibility | Keyboard seek executed; named controls and final Hero copy available in accessibility observations | Full focus order, escape/return-focus and assistive-technology pass **Unverified** |
| SVG export | Actual export button clicked and final screen observed; source/model correspondence checked | **Saved-file completion and downloaded SVG inspection Unverified**; repeated download-event waits timed out |
| Persistence | Ending→home retained down-the-line and no-spin preferences | Observed; refresh, history, unavailable-storage and resize combinations **Unverified** |
| English language | Reviewed visible copy and controls were English | Exhaustive error/alternate-text/accessibility/export-language audit **Unverified** |

## Responsive and accessibility matrix

| CSS viewport / condition | Actual scope | Status |
| --- | --- | --- |
| 320×700 | No completed review | Unverified |
| 360×640 | No completed review | Unverified |
| 390×844, DPR 1 | CH-01–07 partial review and CH-08 crosscourt state; one 375/375 width measurement with 0 text/button overflow results | Partial; CH-09–10 and final visual fixes unverified |
| 768×1024 | No completed review | Unverified |
| 1440×900 | Ten entrances and the listed desktop controls | Partial; complete handoff/state matrix unverified |
| 1920×1080 | No completed review | Unverified |
| 2560×1440 | No completed review | Unverified |
| 3840×2160 | No completed review | Unverified |
| 844×390 | No completed short-landscape review | Unverified |
| CSS breakpoint ±1 px | No completed boundary review | Unverified |
| 125% / 150% / 200% zoom | No completed zoom review | Unverified |
| System reduced motion | Implementation and preference validation present | Full browser journey under the preference unverified |
| Live motion preference changes | Implementation present | State retention and loop/listener cleanup unverified in browser |

## Resource, lifecycle and performance matrix

| Check | Actual evidence | Status / limit |
| --- | --- | --- |
| Cold/slow resource loading | One warm local timing sample only | Cold/network-controlled loading **Unverified** |
| Failed HTML photographs | CH-06/08 photo failures occurred after the shared preview root changed; HTML fallback remained visible and controls worked | Observed accidental failure condition; systematic failure/recovery coverage **Unverified** |
| Failed SVG images/fonts | SVG image fallback refined in source; portable fonts/images embedded | Deliberately induced SVG/font failure **Unverified** |
| Out-of-order A→B→C resources | No controlled test | Unverified |
| WebGL/context loss | Current implementation uses DOM/SVG and does not require a WebGL renderer | WebGL context-loss case not applicable; general graphics failure not tested |
| Background / foreground | State-level bounded elapsed time verified | Audible and visual browser-resume behavior **Unverified** |
| Repeated round trips | No listener/resource soak completed | Unverified |
| Resize / orientation | Selected viewport reviews only | Continuous orientation/state-retention sequence **Unverified** |
| Resource/performance budget | Exact build byte sizes available; 198 ms / 416 ms warm timing sample | Controlled network, decode, CPU, FPS and Lighthouse benchmarks **Unverified** |
| Console/network sweep | Browser infrastructure failures recorded below | Complete production console/network acceptance **Unverified** |

## Observed defects and refinements

| Location / condition | Finding | Implemented correction | Retest status |
| --- | --- | --- | --- |
| Early model calibration | Down-the-line final B contact was approximately 0.147 m high | Adjusted A-response vertical launch; final stop approximately 1.122 m | Model tests passed; body/racket visual alignment separate |
| Mobile CH-02 | Old 220 px maximum height clipped near-side A; retained screenshot shows the defect | `max-height:none`, visible overflow and automatic SVG height | Included in both reproducible builds; final visual retest incomplete |
| Mobile CH-03 / CH-06 | Scene/control sequence needed improvement | Scene placed before controls; explicit mobile order | Build/source inclusion checked; final visual retest incomplete |
| Mobile CH-05 | Flight labels needed more readable sizing | Increased mobile label size | Final visual legibility retest incomplete |
| Hero relationship and image fallbacks | Opening relation copy and fallback behavior refined | Final Hero sentence and fallback source included | Sentence observed in final accessibility tree; complete six-state/failure retest incomplete |

The control-state selector was also restricted to real buttons; its source marker was verified in the reproduction snapshot. Focused chapter refinements were implemented, but the required weakest-handoff visual refinement review remains **Unverified**. No source correction is presented as a completed visual retest.

### Browser infrastructure limits

The review session repeatedly returned `Input.dispatchMouseEvent` timeouts, CDP preparation timeouts, and `superseded by browser recovery`. Shared preview content also switched to unrelated projects. These are recorded tool/session conditions, **not a diagnosis of application errors**. The single-file build was used to avoid dependence on the changing preview root. Repeated download-event timeouts prevented confirmation of a saved SVG file, and later screenshot attempts also failed. The browser review ended with the final tab left for inspection.

## Production and independent package reproduction

The source project ran `npm test`, `npm run build`, and `npm run build:portable`. A provisional source ZIP was CRC-checked, extracted into a previously nonexistent directory, and all extracted file hashes matched the packaged bytes. The extraction then ran `npm ci`, `npm test`, `npm run build`, and `npm run build:portable`. **All seven commands exited 0.** No browser or preview server was launched by this reproduction gate.

| Check | Actual result / evidence |
| --- | --- |
| Whole-application production build | Verified; [source build excerpt](evidence/source-build.txt) |
| Single-file offline build | Verified; [source portable excerpt](evidence/source-portable.txt); 10 images, 12 font files, favicon and notices embedded; static runtime-reference checks passed |
| Provisional archive | 98 files, 28,116,385 bytes; CRC and extraction byte comparisons passed; **not the final delivery archive identity** |
| Packaging exclusions | Explicit content allowlist excluded `node_modules`, build caches, `qa.html` and unrelated debug material |
| Production assets and notices | Required source art, production art, fonts, license notices, `dist`, portable file and project source included in the tested archive |
| Clean dependency installation | Verified; [npm ci excerpt](evidence/clean-install.txt) |
| Clean tests | 31/31 passed; [test excerpt](evidence/clean-test.txt) |
| Clean production and portable rebuilds | Verified; [production excerpt](evidence/clean-build.txt), [portable excerpt](evidence/clean-portable.txt) |
| Runtime reproducibility | JS/CSS names, bytes and SHA-256 values matched; portable bytes and SHA-256 matched exactly |
| Final clean-build browser load | Ten chapters, nine bridges and new Hero copy observed; **full clean-build interactions not completed** |
| Ordinary preview/subdirectory serving | `base: './'` configured; controlled final production-preview/subdirectory acceptance **Unverified** |
| Windows scripts | Static checks completed; actual Windows execution **Unverified** |
| Final delivery ZIP | Final archive creation, its exact-archive recheck and final checksums are recorded separately in the delivery report; the provisional gate hash above is not the final ZIP identity |

The reproduction gate confirmed the latest Hero relation, unclipped mini-court rule, mobile controls order and button-only selection marker. Final changes to this acceptance record and its evidence are documentation-only. Runtime hashes still matched the gate when these records were written.

| Reproduced runtime file | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/assets/index-DYj54EWK.css` | 40,091 | `77550943978d98e5cd007e9e5b318bf19da7d4189a1d12a3d8e84d278f32950f` |
| `dist/assets/index-FdqBWMui.js` | 100,484 | `f9994b2fde71fc766a0fcf952f9a3f5e09a913d0fc4516c0656b3cd5096dc91a` |
| `portable/RALLY.html` | 2,220,684 | `17e059157256ef51988f1fb4f990fabbebb8c6c479a0e5fc927ef7978ebf556f` |

## Remaining acceptance limits

The complete 45-frame handoff matrix, final Hero retiming, full mobile CH-09–10 path, final visual retests of mobile fixes, saved SVG capture, other widths, zoom, physical devices, slow-resource recovery, audible timing and listener/resource soak remain **Unverified**. The simplified model is internally checked but is not calibrated against measured professional tennis footage. The delivered work is therefore reproducibly built with partial browser acceptance, not a full-pass claim.
