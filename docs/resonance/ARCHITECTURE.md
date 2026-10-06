# Architecture

> Collection integration, 2026-10-07: the standalone source described below has moved from upstream `dist/` to `experiences/resonance/src/`, `pages/resonance/` and `public/resonance/`. Use the root Collection commands and lockfile; no standalone manifest or server is imported. Intake repairs retain the one owned RAF: keyboard focus stays pending until the destination heading is visible and focused, portrait tablets reuse the narrow composition, and failure of both graphics contexts releases the renderer and exposes the full semantic reading edition. See [ACCEPTANCE.md](ACCEPTANCE.md). The following standalone development details describe the original delivery.

## Scope

RESONANCE is a static audiovisual experience implemented with browser ES modules. The authored front-end files live directly in `dist/`, which is also the directory served to the browser. There is no bundling step, framework runtime, remote API, or package installation requirement.

The local development scripts use Node.js 20 or newer. `npm start` serves the project at port 4173. `npm run check` and `npm run build` validate the supplied static files. Tests use the built-in Node test runner.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `index.html` | Eight semantic acts, persistent controls, chapter links, native modal index, status messages and explanatory text |
| `style.css` | Type system, fixed visual framing, viewport-dependent compositions, interaction states and reduced-motion styling |
| `scroll-state.js` | Pure mappings between page position, local act progress, renderer scene position and text visibility |
| `app.js` | State ownership, one requestAnimationFrame loop, measurements, navigation, input events, capture presentation and visibility lifecycle |
| `world.js` | Procedural geometry and visual interpretation of the current shared state; it is called by the application loop |
| `math.js` | Deterministic seeds, idealized nodal fields and gradients, node projection, and fixed-end damped string motion |
| `audio.js` | Opt-in Web Audio graph, damped excitation, tone capture, buffered playback, visibility suspension and PCM WAV export |

The renderer receives scene position, living time, pointer position, selected mode, frequency, phase, impulse age, capture progress, playback state, ending progress and the motion preference. It does not own page scrolling.

## Scroll as the narrative clock

The document contains eight real sections. Their measured offsets define the chapter intervals. Browser-native scrolling is authoritative; there is no virtual scrolling library or duplicate scroll manager.

Within each interval, normalized progress from **0 to 0.54** holds the scene's stable composition. Progress from **0.54 to 1** passes through a smoothstep curve and morphs into the next scene. Living motion continues during the hold, so a stopped scroll position remains responsive.

`locateScene()` depends on the current scroll position and measurements, not on previously visited scenes. Fast scrubbing, reverse scrolling and direct chapter entry therefore select the same narrative state. The last section maps its remaining scroll distance to a separate decay toward silence.

Text has a narrower visibility window than the geometry handoff. Inactive panels are hidden from accessibility navigation and made inert so their controls cannot be focused through another scene.

Hash routes are:

`#silence`, `#vibration`, `#propagation`, `#interference`, `#resonance`, `#harmonics`, `#memory`, and `#return`.

Chapter navigation updates the hash and moves to a measured section offset. Keyboard-initiated chapter navigation moves focus to the destination heading. Calm mode uses immediate chapter movement rather than smooth anchor travel.

Measurements refresh after resize, font readiness and page restoration. Width-changing resizes preserve normalized narrative progress against the new section offsets. The browser remains responsible for its native scroll restoration.

## Shared visual world

The visual architecture carries a source and an energy trace through eight interpretations. Geometry changes role rather than restarting a disconnected illustration on every section.

| Act | Role in the shared world |
| --- | --- |
| Silence | A suspended source holds the possibility of motion |
| Vibration | Displacement becomes an oscillating, decaying string |
| Propagation | The trace occupies space as traveling wave structure |
| Interference | Two contributions create a common field with cancellation and reinforcement |
| Resonance | The structure resolves into a nodal surface and particulate pattern |
| Harmonics | Repeated frequency relationships become layered line architecture |
| Memory | The signal is interpreted as an etched continuous trace |
| Return | A source re-radiates the stored signal and resolves toward stillness |

Three moments receive particular compositional emphasis: a local disturbance becoming space, a resonant field becoming particulate geometry, and a harmonic signal becoming a recording trace. These are rendered procedurally; the composition studies used in design are not scene backgrounds.

The geometry handoffs use shared scene state. Text opacity changes support those transformations but do not provide the sole transition mechanism.

The main renderer uses WebGL with shader-defined destinations for shared, seeded particles, filaments, source points and surfaces. A Canvas 2D counterpart retains the scene sequence and shared identities when WebGL is unavailable or its context is lost. Nodal destinations are computed from a qualitative modal field and its gradient rather than from a history-dependent grain simulation, keeping chapter entry reproducible.

## Frame and visibility lifecycle

`app.js` owns the application's requestAnimationFrame loop. Each frame updates active elapsed time, maps the current scroll position, eases interactive mode and pointer changes, updates the interface, and asks the visual renderer to draw.

Analytic motion uses actual elapsed foreground time, so a slow frame does not lengthen the capture timer. Hiding the tab cancels the visual loop and requests audio suspension. Resuming clears the previous frame timestamp before continuing. `pagehide` and `pageshow` handle the corresponding page lifecycle. Opening the Index pauses canvas drawing while interface timers continue.

Capture presentation and temporary status notices use the application's active time. They pause with the hidden tab. A short cancellable audio timeout allows gain fades to finish before suspending the AudioContext; it is not a second rendering loop.

The visual renderer is supplied a capped pixel ratio. Responsive layouts recompose the sculpture and copy for narrow screens rather than preserving desktop placement at a smaller scale. Device-dependent visual quality is an implementation budget, not a universal frame-rate guarantee.

## Audio and captured memory

Audio starts only from an explicit sound-toggle or playback gesture. It uses a local AudioContext and synthesized harmonic components. No microphone, prerecorded song, streaming service or audio download is involved.

The fundamental is constrained to **110–330 Hz**. Harmonic amplitudes are normalized before synthesis. Parameter changes and mute transitions use short gain ramps. A pluck adds a brief attack and a decaying excitation.

In the interference act, each harmonic combines two coherent contributions. A phase offset of φ at the fundamental is represented as nφ at harmonic n. Consequently, a 180-degree fundamental offset cancels odd harmonics while even components may remain. The phase control is not a promise of complete silence for a complex tone.

Capture snapshots the current frequency and harmonic parameters, then generates **three seconds of mono samples at 44,100 samples per second** in memory. The three-second etching animation is a presentation of that synthesized capture, not a microphone recording or measurement of real-time speaker output.

The saved artifact is a standard RIFF/WAVE file with a mono **16-bit signed PCM** data chunk. Captured samples remain unchanged when the live controls change. A new capture replaces the previous in-memory capture; a downloaded WAV persists independently of the page.

Playback uses the retained buffer. If the user requests playback before capturing, the application creates a capture from the current parameters. Audio is muted and suspended while the page is hidden, and can resume only within the existing user-authorized audio state.

## Scientific interpretation

The experience uses physical relationships as an organizing principle:

- Lightly damped oscillation loses amplitude over time.
- In air, local particle motion is longitudinal while the disturbance travels.
- Signed wave contributions can reinforce or cancel.
- Standing-wave nodes remain stationary in the represented field.
- Particles on a Chladni-style surface reveal low-displacement nodal regions.
- Integer harmonics describe the ideal fixed string used for the harmonic study.
- A time-varying signal can be represented, stored and replayed.

The renderer is not a calibrated acoustics solver. Visual displacement and time are adjusted for legibility. The audible frequency and the much slower visible oscillation must not be interpreted as the same time scale.

The Chladni-inspired modes are idealized. They do not establish resonant frequencies for a particular plate material, thickness, size, mounting position or boundary condition. The recording groove is an artistic representation of signal storage, not a fabrication-ready cutting path. Scientific and historical references are listed in [ASSET_PROVENANCE.md](../../provenance/resonance/ASSET_PROVENANCE.md).

## Accessibility and fallback

The HTML retains the full scene order and meaningful headings. Controls use native buttons, ranges and links. The chapter index uses a native modal dialog, and keyboard navigation has explicit focus destinations. Status messages are announced through live regions.

The first visit follows `prefers-reduced-motion`; a deliberate Calm motion choice takes precedence and is saved locally when storage is available. The calmer rendering retains structure and interactive meaning with reduced autonomous motion.

The renderer falls back from WebGL to Canvas 2D when needed. If visual initialization throws, the application releases the fixed-scene presentation so the semantic exhibition remains readable. If Web Audio is unavailable, visual interaction remains available and the user receives a concise status message.

## Validation boundaries

The automated checks and static validation scripts are reproducible entry points. Their presence does not establish that every browser, device, accessibility technology or graphics driver has passed.

Meaningful browser acceptance includes arbitrary stops in all eight acts, rapid forward scrubbing, immediate reverse, chapter links, a mid-page refresh, a width-changing resize, tab visibility changes during capture and playback, Calm motion, keyboard navigation, narrow layouts, audio opt-in, and inspection of the downloaded WAV. Browser results should be reported only after those checks have actually run.
