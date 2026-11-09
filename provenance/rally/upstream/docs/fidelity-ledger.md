# RALLY — Implementation Fidelity Ledger

## What this record establishes

This is a bounded source review against the supplied RALLY brief, [requirements ledger](requirements.md), and [README](../README.md). It describes the implementation actually present, including deliberate simplifications and source-visible limits. It is not a browser report. The [acceptance record](acceptance.md) remains the authority for executed screenshots, input checks, device emulation, production reproduction, and unverified environments.

## The delivered medium

| Area | Actual implementation | Boundary of the claim |
| --- | --- | --- |
| Application | Vite, TypeScript, semantic DOM, one Lenis instance and one application animation-frame loop | No framework, account, database, telemetry, remote runtime API or hosted deployment is required. |
| Court and routes | SVG geometry projected from the shared metre-based model | These are lightweight programmatic scenes, not a rigged Three.js world or a photographic tracking reconstruction. |
| People | Generated transparent photographic ready-pose cutouts placed at model positions | Position changes are explanatory. There is no skeletal rig, leg articulation, motion capture, or simulated human/racquet biomechanics. |
| Main ball | One programmatic marker in court/profile views; one generated cutout in enlarged contact/bounce/bridge views | Enlarged visible radius is an editorial aid. It must not be read as a measured on-court ball diameter. |
| Contact | SVG racquet frame and clipped strings; explicit before/contact/after states | Ball compression and local string deflection are authored illustrations, not a material solver. |
| Bounce | Shared main-flight landing and rebound origin, ground-anchored compression and persistent mark | The enlarged mark and close-up scale are explanatory; position is model-based. |
| Photographs | Single static scenes with their baked single ball | A second moving main ball is not placed over these photographs. They establish light and texture rather than authoritative coordinates. |
| Result | An SVG generated from the selected branch and selected viewpoint | The output is an actual vector document, not a screenshot of a decorative sample card. |

The model includes gravity, speed-dependent drag and a spin-dependent force. Its coefficients and movement presets are authored assumptions. The no-spin comparison changes only spin; it does not replace the legal fixed main flight. Both return branches have their own landing, A movement, response and four-event sequence. These causal rules are different from claims about photographic animation fidelity.

## Real image-generation roles

| Required role | Recorded source | Decision |
| --- | --- | --- |
| H-A | `art-assets/H-A.png` | Selected low-angle visual direction |
| H-B | `art-assets/H-B.png` | Complete-court candidate retained as reference; ball too small for the selected primary hero |
| H-C | `art-assets/H-C.png` | Sideline candidate used for preparation detail; weaker two-person relationship as the primary hero |
| H-D | `art-assets/H-D.png` | Desktop refinement of H-A |
| H-M | `art-assets/H-M.png` | Independently generated portrait composition |
| K-04 | `art-assets/K-04.png` | Giant felt-ball spin-comparison plate |
| K-08 | `art-assets/k08-court.png` | Overhead late-story photographic study |
| T-05-06 | `art-assets/t0506-bridge.png` | Net/descending-ball/ground/line midpoint study |

Player A, player B and the isolated ball are three additional transparent production assets. They do not count toward the eight required roles. Production images are locally packaged WebP derivatives; original PNGs and exact actual prompts remain in `art-assets/`. Seeds and parameters not supplied by the image tool are not invented. See [asset provenance](asset-provenance.md) for measured files, prompt records and distribution notes.

## Motion and handoffs

Nine dedicated SVG bridge panels have distinct anchors and five local interpolation key states. They can evaluate current progress directly rather than requiring a prior entrance event. The bridge panels sit between the full chapters in normal document flow; they are not one persistent camera continuously replacing every photographic pixel with a matching real-time object. Perceptual continuity across that medium change requires actual visual inspection.

TR-09 receives the paused CH-09 playhead and evaluates a bounded connection to B's final catch. It does not write that interpolated position back into the replay clock. CH-10 owns the separate modelled handback. Crosscourt remains a solid route and down-the-line remains dashed, independent of selection.

Reduced motion disables Lenis smoothing and continuous scene travel, retains the complete chapter sequence, and provides explicit contact/replay observation controls. Meaningful choices remain explicit user actions. Backgrounding pauses replay; restoration does not auto-enable sound or play back a large elapsed gap.

### Hero refinement: implemented states and remaining limits

The Hero now has explicit, scoped CSS and DOM behavior for all six states. It uses the existing desktop/portrait photographs; it adds no duplicate ball, player or replacement image. This is an implementation record, **not a final six-state browser pass**.

| State | Actual source behavior |
| --- | --- |
| First view | The meaningful photograph, English title, introductory copy and controls are present immediately. Only the later relationship sentence waits for the reveal; the title never waits for an animation. |
| Reveal | The sentence “Where you send it changes what comes next” appears with a short, restrained optical light adjustment over the existing photograph. |
| Composed | The desktop crop settles into its observation framing and the relationship sentence remains readable. |
| Hold | The photograph and copy settle; there is no looping rotation, continuous camera movement or fake speed effect. |
| First scroll | The desktop photograph widens subtly and the copy shifts upward slightly. The independently composed portrait photograph keeps its fixed crop. The following dedicated SVG bridge provides the explanatory ball-scale retreat. |
| Return | The composed observation frame and relationship copy return immediately, without repeating the opening reveal. The footer reads “Your choice stays with this rally”; the existing story state retains that choice. |

Reduced-motion rules reveal the relationship copy immediately and disable the optical changes, transforms and transitions. Additional scoped rules accommodate narrow and short-height layouts. These source changes passed the TypeScript check. The final browser retest was interrupted during input/recovery, so final Hero composition, timing, mobile spacing and early-scroll behavior remain subject to the executed evidence in [acceptance.md](acceptance.md).

**Photographic fidelity limits remain explicit.** B's body and the ball's seam are baked into one still photograph. The refinement does not animate B into a new preparation pose or provide a separately tracked seam-light reveal. A general photographic light adjustment is not evidence of either feature. The nine handoffs remain dedicated SVG bridge panels in normal page flow, rather than an exact photographic-pixel-to-live-object camera takeover. Neither six state labels nor the added CSS establishes that all of the brief's photographic fidelity requirements have passed. No complete 45-frame handoff visual pass is claimed here.

## What the sound is

Audio is synthesized locally with Web Audio: a short triangle-oscillator tone, a seeded noise burst, filtering and authored gain envelopes. Racquet, clay and catch cues use different parameters. There are no recorded match samples, shoe recordings, voice narration, music tracks or continuous environmental ambience in the source.

Audio starts off, requires a user action to enable, and fires for actual forward replay contact events. Seeking and stepping do not replay missed sounds. Noise and tone nodes have separate end-of-life cleanup, so the short noise buffer does not prematurely disconnect the longer tone envelope. This describes scheduling and source structure; listening quality and browser audio behavior need their own acceptance evidence.

## Resource and delivery boundaries

The primary workflow is the source project over a local HTTP server. Node/npm requirements, exact installation/build/preview commands, Windows launchers and the lockfile are present. The Windows scripts contain actual CRLF line endings; their existence and static readability are not a claim of execution on Windows.

The optional portable build embeds the same application, production images, fonts and notices in one HTML file. It is a separately generated artifact and must be rebuilt after final source changes. A portable build or production directory must not be assumed current merely because it already exists.

The final source archive should contain the editable modules, configuration, lockfile, formal assets, prompts, notices, documentation and tests. Exclude installed dependencies, `.build` intermediates, temporary QA pages, browser state and unrelated workspace files. Clean extraction, installation, production build, local preview and checksums remain packaging evidence, not assumptions made by this ledger.

## Remaining visual obligations

The browser review must establish readable people and labels on phones, alignment of sprite feet and shadows, the ball/racquet contact relationship, the photographic-to-SVG scale changes, five frames of every handoff with motion enabled, stable reverse/fast/skip navigation, real branch/export correspondence, and all resource-failure alternatives. No FPS, Lighthouse score, physical Android/Windows behavior, real 4K hardware result, or complete six-state Hero fidelity follows from this source review alone.
