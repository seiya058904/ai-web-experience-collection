# Model, time and handoffs

## Model identity

`src/model.js` holds one deterministic flock. Each agent has six Float32 components, in stable ID order: `x, y, z, vx, vy, vz`. A seeded integer generator produces four overlapping scattered launch clouds and a small per-agent speed bias. After initialization there is no desired silhouette, moving global target, leader ID or per-agent choreographed route. The chosen opening is the result at tick 420 of seed 8419, selected for its irregular fold.

Each fixed step performs these operations:

1. Apply queued local velocity rotations. Pointer ripples have a radial falloff in the model's XY plane, through its shallow depth. They are local cylindrical interventions, not physical fluid simulation.
2. Rebuild spatial buckets and find up to seven nearby agents.
3. Combine short-range separation, alignment toward neighbor velocity, and cohesion toward neighbor position.
4. Add a disclosed soft environmental boundary and gentle vertical resistance.
5. Cap acceleration, keep individual speed within a bounded range, and integrate forward by `1/60`.

The separation interaction begins inside 4.5 model units. The three user weights multiply the corresponding steering terms; each spans 0–2.5. These are dimensionless art parameters. Model units are not calibrated meters, seconds of biological behavior, energy, or predictive accuracy.

| Preset | Keep Space | Match Heading | Stay Together |
| --- | ---: | ---: | ---: |
| Drift | 1.3 | 1.1 | 0.7 |
| Cohere | 0.7 | 1.8 | 1.6 |
| Scatter | 2.4 | 0.3 | 0.2 |

The soft boundary starts beyond absolute coordinates X=135, Y=57 and Z=20. Its force grows continuously with distance outside that broad box. It does not teleport agents or assign them a flock contour. Camera fitting is a separate read-only observation operation; its bounds never enter the steering equations.

## Approximate neighborhood, stated explicitly

The spatial grid uses 14-unit cells and examines adjacent buckets, with at most 112 candidates per agent and a 25-unit distance limit. It keeps the nearest seven among those candidates. The traversal order is deterministic. The bucket range and candidate cap mean this is **an approximate bounded local query**, not an exact global seven-nearest-neighbor computation and not a quantitative implementation of Ballerini's measured interaction network.

Refreshing on every model tick avoids a hidden temporal neighbor cache. Restoring a checkpoint and rebuilding the buckets therefore gives the same next state. The application creates no DOM node per bird and performs no full all-pairs traversal.

## Recorded observation

`npm run record` performs the actual experiment in `scripts/record.mjs`:

- 2,400 agents, seed 8419, 420 warmup ticks.
- Quantize the initial state so the network-failure reconstruction starts from exactly the shipped numbers.
- Keep selected identity 1092 and its initial local neighbors visible in the close observation.
- Turn the velocities of nearby agents within a 5.5-unit XY radius, using a maximum local angle of 1.85 radians with radial falloff.
- Run 480 further fixed ticks, recording every fourth tick: 121 frames across eight model seconds.

The record is an Int16 array in frame-major, agent-major order, with six values per agent. Position components use a factor of 64; velocity components use 512. `flight.bin.gz` stores that array with gzip compression. The initial full checkpoint and metadata are also included. The package does not require a precomputation service.

The sampler linearly interpolates position and velocity between adjacent recorded frames. Agent identity never changes. The maximum quantization error is half a unit of the corresponding quantization scale. The live simulation begins from the sampled quantized endpoint, so the narrative-to-live position/velocity boundary is exact in the shipped representation.

The worker fallback runs the same loop from the same included initial state. A test compares its reconstructed record with the shipped decoded bytes. It runs once when needed and terminates; arbitrary scroll jumps otherwise index the already available record directly.

### A causal check

The generation script also runs an unperturbed control from the same initial checkpoint. It counts agents whose velocity differs by more than 0.4 model units. The actual generated result is recorded in `evidence/recording-evidence.json`:

| Ticks after the local intervention | Changed headings by the stated velocity threshold |
| ---: | ---: |
| 1 | 15 |
| 30 | 37 |
| 60 | 41 |
| 120 | 52 |
| 240 | 117 |
| 480 | 384 |

These numbers describe this code and this chosen experiment. They are not measurements of a real flock. They establish that the response is initially local and spreads over time rather than rotating every agent in one frame.

## Shared scheduler

There is one Lenis instance with `autoRaf: false`. Lenis scroll updates notify ScrollTrigger. One GSAP ticker calls `lenis.raf(time * 1000)`, reads the shared progress, advances the separately owned live clock when active, and draws the Canvas. GSAP lag smoothing is disabled, while the model's own catch-up is deliberately bounded.

The Canvas draw cadence is capped at approximately 33 draws per second. This is a ceiling, not a frame-rate guarantee. The live integrator can advance at most three ticks per scheduler call; sustained overload slows model time rather than creating a huge jump. A paused ending or held field has no ongoing expensive redraw unless an input or resize makes it dirty. Narrative wing motion has a separate display time and never advances recorded positions.

Font readiness, image arrival, resize, orientation changes and history restoration trigger the needed geometry updates. ScrollTrigger is not refreshed indiscriminately every frame. Modal notes stop Lenis while native dialog content remains scrollable. On close, the opener regains focus and the clock restarts without elapsed-time catch-up.

## Five acts and four boundaries

Progress below is normalized over the scroll track. The tested handoff span deliberately includes the text changes surrounding the camera operation.

| Boundary / test span | Shared anchor and layers | Outgoing / incoming order | Reverse behavior |
| --- | --- | --- | --- |
| I → II, 0.130–0.245 | Same initial recorded positions; selected ID 1092; unchanged sky | Hero text fades 0.115–0.165. Camera approach begins at 0.168 and reaches the local view by 0.235. Local text enters 0.205–0.245. | Same functions evaluate at the decreasing progress; no reseeding. |
| II → III, 0.407–0.505 | Same ID and actual recorded response | Annotation recedes 0.400–0.440; local text exits by 0.442. The response begins at 0.445. New text enters 0.465–0.505 as the camera pulls back. | Sampled positions and velocities return through the same record. |
| III → IV, 0.585–0.690 | Exact final record on first entry; explicit saved branch on later entries | Record reaches its endpoint at 0.615. The camera settles into the live framing by 0.675. Live copy enters 0.645–0.690. Simulation enters at 0.675 only after restoration. | The live state is saved first, then yields to the narrative through the labeled window. |
| IV → V, 0.812–0.925 | Same saved positions, velocities and identities | Live stepping stops beyond 0.805. Controls leave 0.812–0.849. Camera pulls back 0.812–0.960. Ending copy arrives 0.875–0.925. | Restore the preserved field before any new forward tick; no regeneration. |

A revisited live branch enters as a small framed observation from the right between 0.545 and 0.570. It grows continuously to take over by 0.675. Its label makes the change of time ownership explicit. The main recorded flock is never interpolated into the saved live flock, and no full-screen fade hides an incompatible state.

## Complete live checkpoint

A snapshot contains:

- Format version, agent count, seed and tick.
- Positions and velocities for every identity.
- Per-agent speed biases, which are required for exact continuation after restoration under a different constructor seed.
- Current three rule weights and paused state.
- Pending local ripples, including center, radius and turn.
- The versioned, fixed neighborhood configuration.

`FieldSession` owns the live flock, initial checkpoint, saved checkpoint and bounded time accumulator. Enter restores the saved snapshot and clears the accumulator before advancing. Leave captures the full snapshot and clears the accumulator. Reset restores the initial recorded live state and Drift rules while keeping the user's pause choice. A held slider edit changes only rules; it does not move positions until Resume or Step.

Session storage is a convenience, with an in-memory fallback. It is not a cloud save, durable cross-device replay or user-history log. The Fieldprint includes the actual image and selected parameters; it deliberately does not claim that a seed encodes all interventions.

## Rendering decisions

One Canvas 2D renderer keeps both the normal and no-WebGL paths on the same code. A directional body and two separate tapered wings make each bird recognizable. Velocity determines body orientation; stable per-ID phases vary wing posture. Five depth bands provide restrained atmospheric contrast.

Each bird uses a small compound path. Profiling showed that closing thousands of contours in a single giant path was very expensive in the test browser; independent paths removed that bottleneck while retaining the same geometry and model. The sky is cached at the actual output resolution. Pixel ratio is capped at 1.65, and at 1 above 2,200 CSS pixels of width. A 4K viewport therefore does not allocate a 2× or 3× 4K backing buffer.

The portrait view rotates the observing camera by −0.95 radians. It does not rotate, reinitialize or rearrange the model's coordinates. The live camera fits the current real bounds into a region separate from the controls. The ending applies only a continuous camera retreat to the same saved data.

## Cleanup and scope

HMR disposal removes the ticker callback, kills the ScrollTrigger, destroys Lenis, aborts listeners and an in-flight record fetch, terminates an active worker, releases image callbacks and shrinks offscreen buffers. Pending export URL timers are cleared and their object URLs revoked. Normal page unload also releases browser-owned resources; page lifecycle events persist the current checkpoint before leaving.

There is no WebGL context to lose or restore, no GPU model solver, no audio, and no backend. Floating-point continuation is deterministic within the tested JavaScript implementation. Cross-browser bitwise identity and physical biological validity are not claimed.
