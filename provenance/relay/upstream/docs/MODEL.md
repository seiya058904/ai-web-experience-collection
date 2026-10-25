# RELAY: the transport model

RELAY is a deterministic, entirely local toy protocol. Its six-node transport
environment is an original visual metaphor. It does **not** implement TCP,
QUIC, BGP, real Internet routing, TCP congestion control, or a network service.
No message is transmitted outside browser memory. Assets may load from the
same local website; they are unrelated to the message simulation.

The conceptual distinction comes from [RFC 9293, §2.2](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2):
reliable ordered data is an endpoint responsibility. RELAY borrows the ideas
of sequence, retained data, acknowledgements, and retransmission. Its topology,
fixed byte chunks, per-block ACKs, queue policy, finite budgets, and timing are
explicitly original demonstration rules.

## Three independent clocks

1. **Observation:** scrolling changes camera, composition and explanatory text.
2. **Simulation:** only explicit playback advancement or a step processes events.
3. **Review:** a recorded moment is a detached snapshot of an existing history
   entry. It cannot send, receive, retry, rewind or otherwise alter the live round.

The model never reads `Date.now()`, animation frames, scroll progress, a browser
clock, or a DOM layout. The application owns playback and must pause on
`visibilitychange` rather than advancing by the time spent in a background tab.
The same central application ticker can drive Lenis and rendering, while the
model receives elapsed time **only when playback is active**. The engine does
not own a second RAF, an interval, or an autonomous play loop.

## Bytes and identities

`TextEncoder` encodes the submitted string to UTF-8. Consecutive intervals of
five bytes become blocks. A five-byte interval can begin or end in the middle
of a Chinese character, accented letter, combining sequence, or emoji. This is
intentional: block boundaries are byte boundaries, not JavaScript character
indices. Input is limited to 120 UTF-8 bytes by the engine. A leading U+FEFF
is payload and is preserved; decoding explicitly sets `ignoreBOM: true`.

Each block has a round ID, block ID, index, start offset, byte length and byte
payload. Each transmission is a separate instance with its own instance ID,
attempt number, creation time, ordered hops, and current position. For example,
`r1:b1` can be retained at the sender while `r1:d10` transports its second
attempt. The retained source block and the moving instance are distinct things.
An ACK records `forInstanceId` and the received data instance's actual attempt
number, even if the sender has already created a newer retry.

The receiver validates round and block identity, exact range and length, and
each payload byte against the round's original block. It stores one validated
payload per block ID. A repeat increments the duplicate count, leaves output
unchanged, and produces a new ACK.

The visible prefix ends at the first missing block. A fresh streaming
`TextDecoder('utf-8', { fatal: true })` decodes that contiguous byte prefix,
withholding an incomplete final code point. No replacement character is
invented. Once all bytes exist, they are placed at their original offsets in
one `Uint8Array` and decoded as a whole. Tests compare this array byte for byte
with the original `TextEncoder` result.

## Transport environment

There are six nodes: sender `S`, fork `A`, upper passage `B`, lower passage `C`,
merge `D`, and receiver `R`.

| Physical channel | Forward edge | Forward propagation | Return edge | Return propagation |
| --- | --- | ---: | --- | ---: |
| `source` | S → A | 0.75 s | A → S | 0.55 s |
| `upper` | A → B | 1.30 s | B → A | 0.65 s |
| `upper-join` | B → D | 0.85 s | D → B | 0.55 s |
| `lower` | A → C | 2.40 s | C → A | 1.35 s |
| `lower-join` | C → D | 1.00 s | D → C | 0.70 s |
| `delivery` | D → R | 0.65 s | R → D | 0.70 s |

Each physical channel has two directed edges. The return edge ID appends
`-return`. Data uses forward edges; acknowledgements use return edges. Toggling
a physical channel changes both directed edges together. An acknowledgement
cannot enter a closed channel.

An enabled edge has a FIFO admission queue. At 1×, the minimum interval between
admissions is 0.34 demonstration seconds. Changing its speed changes this
interval to `0.34 / speed`. It changes queue throughput, not a physical
propagation speed and not TCP congestion control. The current hop's precomputed
arrival time is unchanged by a later speed edit.

At a node, a deterministic shortest-available-path calculation uses propagation
time and currently known queue delay. It belongs to this transport environment,
not to a real protocol. An instance at a fork can take an alternative channel;
an instance already beyond a fork cannot jump backwards to that fork. It waits
if its current node has no enabled route to the destination.

Closing a channel forbids new admission. Instances already admitted finish
their current hop. Queued instances return to their existing node and select an
available route, or wait there. Reopening a channel reroutes waiting instances.
No closing, opening, or speed edit teleports a packet.

## Loss and demonstration scenarios

| Scenario | Initial state and explicit rule |
| --- | --- |
| `detour` / A way around | Upper channel starts closed. Block 02's first attempt is dropped at the end of its `delivery` hop. Subsequent attempts can succeed. |
| `out-of-order` / Out of order | Both channels start open. Block 02's first attempt is held at fork A for 4.2 seconds, so later blocks can arrive first. This is a disclosed scenario holding gate. |
| `all-cut` / No way through | Both upper and lower channels start closed. Nothing is falsely delivered. A user can restore one while time and attempts remain. |
| `ack-loss` / Uncertain sender | All ACKs are dropped at their first completed return hop. Successfully delivered data remains received. |
| `clear` / An open route | Both channels start open, with no deliberate loss or holding gate. |

`Lose one acknowledgement` arms one loss at the next eligible ACK hop
completion. It can affect an ACK already travelling. Repeated clicks while
armed do not stack additional losses. If no eligible ACK completes, the loss
remains visibly armed. Starting a new round clears it.

Optional seeded probabilistic losses are available to tests. They are disabled
in the normal scenarios. Each admitted hop receives seeded propagation jitter
between 0 and 0.11 seconds. All random decisions use the round's Mulberry32
generator. Reading or rendering a state never consumes randomness.

## Sender budgets and truthful endings

Defaults are four actively outstanding block IDs, an 11-second ACK timeout,
at most four sends per block, and a 64-second total deadline. These are
demonstration seconds chosen to make individual events observable.

An unacknowledged block retains its source bytes. Its timeout creates a
separate transmission instance. A late original can coexist with a retry;
receiver deduplication makes this harmless. The window counts actively
outstanding block IDs, so retries of the same block do not open new window
slots. When a block exhausts its attempt budget, it releases its active window
slot so later blocks can still be attempted. Its retained copy remains visible
until acknowledgement or the end of the round. This retirement rule is a toy
model decision and is not claimed to be TCP behaviour.

| Receiver state | Sender state | Meaning |
| --- | --- | --- |
| `Receiving` | `Confirmation pending` | At least one byte interval is still missing and the round can progress. |
| `Received` | `Confirmation pending` | The receiver has every exact byte; at least one ACK has not reached the sender. |
| `Received` | `Confirmed` | Every byte has arrived and every block has been acknowledged. |
| `Incomplete` | `Confirmation pending` | The round ended with at least one missing byte interval. |

The top-level `status` is `Receiving`, `Confirmation pending`, `Confirmed`, or
`Incomplete`; `receiverStatus` separately preserves the crucial `Received`
truth. A full message with all ACKs lost stays **Received / Confirmation
pending**, including after the retry budget or total deadline ends the round.

When all blocks are acknowledged, already existing transport instances may
finish their real journeys before the round becomes terminal. A round can also
end when attempts are exhausted and no active instance remains. The total
deadline always provides a finite upper bound. At the deadline, unfinished
instances become explicitly `stranded` at their actual last position. They are
not counted as received or silently reclassified as dropped data.

Operations on a terminal round return `false`. Only an explicit reset starts
a new round. Reset increments the round ID and discards all old scheduled
events, instances, operations and history. Previously obtained snapshots remain
detached values; they cannot contaminate the new round.

## Stable event queue

Each scheduled event has a simulation timestamp and a strictly increasing
insertion order. The queue sorts by `(time, order)`. The deadline is scheduled
first, so an arrival exactly at the deadline does not slip past the cutoff.
Input edits are recorded with their simulation timestamp. Replaying the same
seed and the same timestamped edits yields identical events and outcomes
regardless of frame rate, number of render reads, or scroll activity.

`advance(seconds)` processes all scheduled events up to the supplied target.
`step()` processes the next timestamp, including all stable-ordered events at
that timestamp. Neither method reads wall time. Time between events is used
only for a moving instance's `progress`; all receive, loss, retry and ACK facts
are discrete events.

## Actual opening state

`createPausedDemo()` starts seed 9293 in `detour`, executes actual events, and
stops with a missing block plus a real retransmission emerging from the fork.
For the default message it returns at 12.056370197 demonstration seconds:

- Original: `Meet me at the other end. ✦` — 29 UTF-8 bytes.
- Receiver: 15 bytes stored; contiguous readable prefix `Meet ` — 5 bytes.
- Missing interval: block 02, byte range `[5, 10)`.
- Later blocks 03 and 04 are already buffered.
- Block 02 attempt 1 was actually dropped; attempt 2 is 8.24% along the lower
  channel. It is a separate instance, not a decorative duplicate.
- All prior events and snapshots are retained. The final `demo-paused` event
  explains why this observation point was selected.

The constructor and this helper never start playback. The browser decides when
an explicit `Continue delivery` or single-step operation advances the model.

## Public API

```js
import { RelaySimulation, createPausedDemo } from './src/model/relay-simulation.js';

const simulation = createPausedDemo();
const state = simulation.getSnapshot();

simulation.advance(0.016);              // Seconds; call only during playback.
simulation.step();                      // One timestamp of scheduled events.
simulation.setEdgeEnabled('upper', true);
simulation.setEdgeSpeed('lower', 0.25);  // Admission throughput, not propagation.
simulation.loseNextAck();

const oldMoment = simulation.getRecordedSnapshot(12); // Pure detached read.
const eventMoment = simulation.getSnapshotAtEvent(30);

simulation.reset({ message: '你好, café 🚀', seed: 42, scenario: 'out-of-order' });
const reproducibleTrace = simulation.exportTrace();
```

`getSnapshot()` provides byte state, receiver/sender truth, chunks, instances,
directed edges, nodes, counts, terminal reason, and the next deadline. The
application reads `simulation.events` for the event strip and
`simulation.history` for its recorded-moment indices. These must be treated as
read-only collections. Public snapshot methods return detached values.

Render only actual active instances (`waiting`, `queued`, `in-transit`) as
moving data. Completed records remain available for review but must not be
animated as if still in transit. A `stranded` instance preserves
`previousStatus` and `progress` so an honest failure composition can retain its
last location. Retained source copies come from `chunks[].retained`, not from
invented transport instances. Exact edge IDs and their shared layout data
should drive both the SVG path and the moving packet's position.

## Scope of verification

Run `node tests/model/relay-simulation.test.mjs`. The companion
[MODEL-TESTS.md](MODEL-TESTS.md) describes the actual assertions and evidence.
This verifies the original toy rules, not protocol conformance or production
networking correctness. Browser timing, controls, reduced motion, visibility
handling, scene changes and visual layout require separate application tests.
