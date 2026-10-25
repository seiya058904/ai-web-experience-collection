# Model verification

The deterministic model suite is executable without a browser or third-party
test framework:

```sh
node tests/model/relay-simulation.test.mjs
```

The actual run passed **23 tests**, with **24 recorded cases** because the
all-ACK-loss test uses both a short UTF-8 message and the default six-block
message. This file describes only model checks. It does not claim browser,
device, visual, performance, or accessibility coverage.

Every run writes `tests/model/model-results.json`, including its timestamp,
Node/platform information, SHA-256 of the tested model source, seeds,
configuration, timestamped user operations, final states, and exact original
and reassembled byte arrays where reception completed. Expected incomplete
cases explicitly report that no complete reassembled array exists.

## Actual assertions

| Test | What was checked |
| --- | --- |
| UTF-8 split and recombination | Chinese, accents, emoji and a combining mark cross five-byte boundaries; every observed prefix omits incomplete characters; complete `Uint8Array` equals the original byte for byte. |
| Leading BOM preservation | A submitted U+FEFF remains in the text and payload; original-input `TextEncoder` bytes equal received bytes, without normalisation loss. |
| ACK provenance | Under one-second retries, ACK instance metadata still names the specific received data instance and its attempt, even when newer attempts already exist. |
| Out-of-order buffering | Block 03 is actually received before missing block 02; prefix remains `Meet ` until the gap closes. |
| Loss and retransmission | First data instance is lost; timeout creates a different instance ID carrying the same block; final bytes match. |
| One ACK lost | Repeated arming is idempotent; exactly one ACK is dropped; retransmitted data is deduplicated and acknowledged again. |
| Receiver versus sender | A recorded moment has a complete receiver, a still-retained sender copy, and ACK transport in progress. |
| All ACKs lost | Short `已到é😀` and the full default sentence finish Received / Confirmation pending; bytes match; review does not mutate live truth. |
| Complete disconnection | With both channels closed, zero bytes are delivered and the deadline produces Incomplete. |
| Restore within budget | Opening upper at 6 seconds resumes the real waiting instances and yields Confirmed. |
| Close while travelling | A previously admitted upper hop completes at its original time; no later packet or ACK enters upper. |
| Queue speed | 0.1× source admission creates a 3.4-second headway while the current propagation endpoint remains unchanged. |
| Frame-rate independence | Large time advances and 83/17 ms subdivisions give identical events, operations and terminal snapshot for the same seed and edits. |
| Pure state/history reads | 900 reads and mutations to detached returned values leave live trace, clock and history count unchanged. |
| Real paused opening | The default helper has real lost data, a real timeout, an actual retry at the fork, the missing interval and buffered higher IDs. |
| Reset isolation | New round ID, bytes and scheduled queue exclude every old message event and instance. |
| Finite budgets | Every historical state respects the configured active block window and maximum sends per block. |
| Receiver validation | Seven malformed packets are rejected for wrong identity, range, length or payload. |
| ACK closure/recovery | Closed return routes leave the receiver complete and the sender uncertain; reopening resumes valid ACK transport. |
| Terminal control | Further advance/step/channel/speed/loss operations cannot silently restart a terminal round; explicit reset can. |
| Mid-hop deadline | Still-travelling data becomes visibly stranded with its real fractional progress; no arrival is fabricated. |
| Hop continuity | Every traversal begins where the previous one ended, after its completion time, with positive propagation duration. |
| Input validation | Byte-length limit, empty input, unknown scenario/channel, negative time and invalid speed are handled explicitly. |

## Representative seeded outcomes

With the default 29-byte message and seed 9293, the initial direct engine probe
produced these outcomes; the full test suite uses additional documented seeds.

| Scenario | Receiver | Sender | Final simulation time | Sends | Duplicates | Deliberate data losses |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `clear` | Received | Confirmed | 13.245454686 s | 6 | 0 | 0 |
| `detour` | Received | Confirmed | 19.366036014 s | 7 | 0 | 1 |
| `out-of-order` | Received | Confirmed | 13.597368819 s | 6 | 0 | 0 |
| `all-cut` | Incomplete | Confirmation pending | 64 s | 20 | 0 | 0 |
| `ack-loss` | Received | Confirmation pending | 64 s | 20 | 14 | 0 |

All completed receivers in this probe reconstruct the exact 29-byte original.
The all-ACK-loss probe drops 20 ACKs. Disconnection is recorded as waiting and
then stranded instances, so its data-loss counter correctly remains zero.

## Remaining application responsibilities

The engine cannot prove that a browser only advances time after an explicit
play command. The application tests must separately confirm that scroll,
history review, a hidden tab, resize, navigation and a double-click cannot
advance or duplicate the simulation. They must also compare SVG hit targets to
the same path geometry used for instance interpolation and check the actual
text rendered for each receiver/sender state.

This suite deliberately avoids full TCP conformance claims. Parameters are
educational demonstration values, and the holding gate and retirement rule
are disclosed original behaviour.
