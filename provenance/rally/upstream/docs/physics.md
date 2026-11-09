# RALLY — court, trajectories, and replay contract

## Scope

RALLY is an original, fictional practice exchange. Its trajectories are a deterministic educational model, not measured player tracking, an actual match replay, a coaching prescription, or a precise aerodynamic simulation. Slow playback changes screen time; it does not change the model's launch velocity. The two return options are authored presets, not an arbitrary shot solver offered to the visitor.

All positions, paths, ball contacts, court lines, and ground projections use the same metre-based coordinate system:

- `x` runs across the court.
- `y < 0` is A's original, near half; `y > 0` is B's original, far half.
- `z` is height above the court. A ball at rest on the surface has its **centre** at `COURT.ballRadius`, not at zero.
- Changing the camera never exchanges the identities of A and B.

## Verified geometric references

The official singles court is 23.77 m long and 8.23 m wide. Service lines lie 6.40 m from the net. The net is 0.914 m high at its centre and 1.07 m at its supports; singles net supports lie 0.914 m outside the singles sidelines. These dimensions were checked against [ITF, 2026 Rules of Tennis, Rule 1](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf) on 9 November 2026. Court dimensions are measured to the outside of the painted lines; render the line width inward from these boundary extents.

The [ITF tennis glossary](https://www.itftennis.com/en/about-us/organisation/tennis-glossary/) supplies the baseline, service-line, crosscourt, and down-the-line terminology. The singles lines, rather than doubles alleys, define the presets' first-bounce boundaries.

`COURT` is the single source of geometric constants in `src/physics.ts`. The cable's **parabolic sag between the official endpoint heights** is an authored rendering approximation. It is not specified as the exact net-cable shape by the ITF. The ball radius of 0.0335 m and 0.05 m line width are project choices.

## Flight assumptions

[Rod Cross, University of Sydney, “Ball Trajectories”](https://www.physics.usyd.edu.au/~cross/TRAJECTORIES/Trajectories.html), sections 2, 5, and 6, supports the causal structure: gravity acts downward, drag opposes velocity, and spin introduces a force perpendicular to the rotation axis and velocity. Forward-moving topspin can create a downward force. RALLY does not copy measured trajectory data, player statistics, or an RPM calibration from that source.

The implementation uses:

```text
a = (0, 0, -g) - kD |v| v + kM |v| (s × v)
```

`s` is a dimensionless unit topspin axis, or the zero vector for the no-spin comparison. For horizontal direction `(vx, vy)`, the topspin axis is `(-vy, vx, 0) / hypot(vx, vy)`. Consequently `s × v` points down for horizontal flight in either court direction. The Magnus component is perpendicular to the full velocity vector, including its vertical component. It is not a decorative trail.

| Parameter | Value | Status |
| --- | ---: | --- |
| Gravity `g` | 9.81 m/s² | Standard simplified near-surface value |
| Drag `kD` | 0.018 m⁻¹ | Authored demonstration coefficient |
| Magnus coefficient `kM` | 0.0075 m⁻¹ | Authored demonstration coefficient; no RPM claim |
| Integration step | 1/240 model second | Fixed-step fourth-order Runge–Kutta |
| Vertical rebound factor | 0.72 | Authored contact approximation |
| Horizontal rebound factor | 0.74 | Authored contact approximation |

The model has no wind, ball-wear variation, time-varying lift coefficient, spin decay, detailed clay deformation, or racket-string mechanics. A ground contact applies a velocity impulse: vertical velocity reverses and is reduced, while horizontal velocity is reduced. Contact compression shown by the renderer is an artistic illustration and must preserve the contact location.

The last integration step is interpolated to the floor, net, or designated receiving plane. Failed low flights stop at the net. All ordinary flight samples remain at or above the ball radius. The scene should draw the same sampled path that `samplePath` evaluates, so the ball cannot drift away from its trace.

## Immutable main exchange and independent comparison

The fixed main shot starts with A at `(-2.3, -10.7, 1.05)` and launch velocity `(5.5, 22, 6)` in model units. CH-04 computes both comparison paths from **exactly those same position and full velocity vectors**. Only the spin condition changes.

| Preset | First bounce `(x, y)` in metres | Net clearance below ball | Outcome |
| --- | --- | ---: | --- |
| Main / comparison topspin | `(2.475348, 8.401394)` | 1.222777 m | In B's singles half |
| Comparison no spin | `(3.438555, 12.254220)` | 1.685293 m | Long, beyond B's baseline |

These are outputs of this model, not observed tennis performance. The no-spin result is intentionally allowed to be out. The comparison UI must show that result honestly and continue to CH-05 using `mainTrajectory`, regardless of the saved comparison preference. Main inputs, trajectories, samples, and branches are frozen to prevent accidental mutation.

The main bounce connects continuously to `mainRebound`. B's fixed return contact is the end of that rebound at approximately `(3.215626, 11.362505, 0.940282)`. It is shared by both return choices. Neither branch may begin from a different position.

## The two B-to-A return branches

| Property | Crosscourt | Down the line |
| --- | --- | --- |
| B return first bounce | `(-2.288192, -7.817469)` | `(3.215626, -7.802246)` |
| Net clearance below ball | 1.036423 m | 0.922878 m |
| A's contact point | `(-3.172657, -10.899695, 0.903614)` | `(3.215626, -11.156370, 0.917882)` |
| A's authored travel distance to contact | 2.485294 m | 3.915631 m |
| Open side while A recovers | Right side of A's half | Left side of A's half |
| Full replay model duration | 2.322098 s | 2.369235 s |

Both presets clear the net and bounce inside A's half. A then returns the ball; B receives it at roughly 1.12 m above the ground, before another bounce. Each branch therefore has the same four contact events with its own independently computed timings:

1. `b-strike`: B sends the selected return.
2. `a-bounce`: the return contacts A's half of the court.
3. `a-return`: A meets the rebound and sends the ball back.
4. `b-stop`: B receives and stops the last ball.

The different movement, open space, response path, and duration are substantive branch differences. They do not imply that one direction is universally better. Player ground anchors interpolate between authored positions; these are editorial staging, not biomechanical measurements or coverage probabilities.

### The closing handback

`handbacks.crosscourt` and `.line` are separate CH-10 trajectories. Each starts exactly where B stopped its CH-09 branch, then follows a slower, high-arc, no-spin return to A. Gravity and the same drag coefficient remain active. The endpoint is a catch, not a ground landing, at approximately `(-0.70, -11.15, 1.10)`. With the same A racket-to-feet offset, the receiving feet coincide with `aReady = (-0.45, -11.55, 0)`. Both handbacks clear the net. Their duration is approximately 1.775 and 1.809 model seconds; their apex is approximately 4.98 and 5.14 m. They are a closing gesture after the replay and do not add a fifth contact to CH-09's four-event sequence.

## API used by the scene

| Export | Contract |
| --- | --- |
| `COURT`, `MODEL` | Frozen shared geometry and model assumptions |
| `mainRallyPreset`, `mainTrajectory` | Fixed A-to-B topspin inputs and flight |
| `comparisonTrajectories.topspin`, `.none` | Independent CH-04 comparison results |
| `mainRebound`, `bContact` | Main ground contact through B's shared return point |
| `aReady`, `bReady` | Initial ground anchors for subsequent scene staging |
| `branches.crosscourt`, `.line` | Return flight, rebound, A response, four events, movement and space metadata |
| `handbacks.crosscourt`, `.line`, `handbackReceiver` | Separate no-spin closing returns from B's stop to A's ready position |
| `samplePath(path, seconds)` | Interpolated path sample; **seconds**, not normalized progress |
| `sampleReplay(choice, seconds)` | One ball, A/B ground anchors, current event/phase, clamped time and progress |
| `getMetrics(path)` | Model clearance, landing and apex data |
| `switchBranch(state, choice)` | Resets the playhead, pauses playback, and increments a revision token |
| `shadowAt(ball)` | Ball's ground projection in the shared world coordinates |

`PathSample` contains `{ x, y, z, t, vx, vy, vz }`. A trajectory contains `samples`, `duration`, `origin`, `initialVelocity`, `spin`, `spinAxis`, `ending`, `landing`, `netCrossing`, and `metrics`. `landing` is null for a catch or racket contact; `metrics.landingIn === false` then means **no ground landing**, not an out call.

Branch `aContact`, `bContact`, `bStop`, and event `position` values are **ball/racket contact points**. `aContactFoot` and the `a`/`b` returned from `sampleReplay` are player ground anchors. Keep that distinction when placing bodies and rackets.

For chapter progress `u` from zero to one, use `samplePath(mainTrajectory, u * mainTrajectory.duration)`. For slow playback, advance model time at a reduced display rate. Do not rescale the underlying model or rewrite its arrays. Seeking, reverse viewing, and chapter jumps are pure evaluations and do not trigger a new rally.

`switchBranch` returns `{ choice, time: 0, playing: false, revision: oldRevision + 1 }`. The application should invalidate pending playback work with that revision and stop playback on chapter exit or document visibility loss. Sound should use real event crossings during active, visible, forward playback; seeks and restored background time must not generate catch-up sound.

## Verification performed

Executed in Node.js v24.22.1:

```bash
node --test tests/physics.test.ts
```

Result: **20 tests passed; 0 failed**, covering official dimensions, force direction, comparison isolation, deterministic reproduction, immutable data, halved-step convergence, main/rebound continuity, both legal return branches, all four exact contacts, forward and reverse seeks, branch differences, replay invalidation, endpoint clamping, failed-net interception, all-path floor/time invariants, and both continuous closing handbacks. Each branch was also sampled at 201 replay positions for coordinate, shadow, and identity checks.

This is the model-level evidence only. It does not claim browser composition, displayed copy, controls, audio timing, physical-device performance, or exported SVG fidelity. Those require the application's separate browser acceptance record. The physical model itself has not been validated against measured ball flight or a professional training system.
