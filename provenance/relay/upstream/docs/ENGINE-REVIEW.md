# Independent engine and semantic review

Reviewed **24 October 2026 (Asia/Shanghai)** from a separate engineering perspective. This review did not author the engine and did not modify it. Browser rendering and screen-reader behaviour are outside this record; see the browser acceptance record for those results.

## Scope and method

Read the complete `src/model/relay-simulation.js`, the 21-test model suite, `docs/MODEL.md`, the initial `index.html` / `src/style.css`, and the first complete `src/view/sculpture.js` implementation. Examined event ordering, edge admission/closure, rerouting, ACK independence, byte validation, duplicate handling, budgets, reset, snapshot detachment, and event-history semantics.

Additional checks actually ran with **Node v24.22.1 on Linux** against engine SHA-256:

`fb314ae185cfe5d3ca91766a7bc0119e3ca6d6c662ccd1239ef022801dbbdb60`

These were targeted additional checks, not a claim of exhaustive protocol certification. The existing suite's earlier pass was inspected; it was not re-described as a new independent browser test.

## Additional adversarial runs: PASS

Twenty runs used seeds 1–20, alternating messages:

- Odd seeds: `这是一次独立审查。café 🚀` (37 UTF-8 bytes).
- Even seeds: `Independent message delivery.` (29 UTF-8 bytes).

Scenarios cycled through `clear`, `detour`, `out-of-order`, `all-cut`, `ack-loss`. Data-hop loss probability was 0.12 for seeds divisible by four, otherwise zero. ACK-hop loss probability was 0.15 for seeds divisible by three, otherwise zero. Propagation jitter was 0.11; other settings used the documented defaults.

Every run applied exactly these simulation-time operations, then advanced to termination/deadline:

| Time | Operation |
| ---: | --- |
| 1.75 s | Close upper channel. |
| 3.50 s | Set lower queue throughput to 0.25×. |
| 5.25 s | Arm one lost acknowledgement. |
| 8.125 s | Reopen upper channel. |
| 9.75 s | Set lower queue throughput to 1.50×. |

Across **3,651 actual recorded snapshots**, assertions checked monotonic received-byte count; per-block attempt limits; confirmed sender implies complete receiver; unique queue membership; no queued admission on a disabled edge; every queued instance belongs to the matching edge; continuous hop endpoints and monotonically ordered hop times; and **exact original/reassembled byte equality whenever the receiver was complete**.

Each exported operation trace was replayed in a fresh engine with its exact configuration. All **20 event arrays and final snapshots matched exactly**. The runs produced both successful and incomplete outcomes, rather than forcing success:

| Seed | Scenario | Final combined status | Exact received bytes |
| ---: | --- | --- | ---: |
| 1 | clear | Confirmed | 37 / 37 |
| 2 | detour | Confirmed | 29 / 29 |
| 3 | out-of-order | Confirmation pending | 37 / 37 |
| 4 | all-cut | Incomplete | 24 / 29 |
| 5 | ack-loss | Confirmation pending | 37 / 37 |
| 6 | clear | Confirmation pending | 29 / 29 |
| 7 | detour | Confirmed | 37 / 37 |
| 8 | out-of-order | Confirmed | 29 / 29 |
| 9 | all-cut | Confirmation pending | 37 / 37 |
| 10 | ack-loss | Confirmation pending | 29 / 29 |
| 11 | clear | Confirmed | 37 / 37 |
| 12 | detour | Incomplete | 25 / 29 |
| 13 | out-of-order | Confirmed | 37 / 37 |
| 14 | all-cut | Confirmed | 29 / 29 |
| 15 | ack-loss | Confirmation pending | 37 / 37 |
| 16 | clear | Confirmed | 29 / 29 |
| 17 | detour | Confirmed | 37 / 37 |
| 18 | out-of-order | Confirmed | 29 / 29 |
| 19 | all-cut | Confirmed | 37 / 37 |
| 20 | ack-loss | Confirmation pending | 29 / 29 |

The two incomplete outputs have no reassembled byte array and are **expected outcomes**, not failed equality assertions. All complete outputs matched source bytes. A confirmation-pending status with complete received bytes preserves receiver truth independently of the sender.

## Concrete defect E01 — ACK provenance

**Original finding:** `_receiveData()` called `_newInstance('ack', block, 'R')`, and the shared constructor copied the block's current attempt count. If an original data instance arrived after a retry had already been sent, its ACK metadata incorrectly described the newest send attempt.

**Reproduction:** `{message:'HELLO', scenario:'clear', seed:991, timeout:1, maxAttempts:4}` followed by `advance(64)`.

| Data instance | Actual data attempt | Created ACK | Original ACK attempt field | Time |
| --- | ---: | --- | ---: | ---: |
| r1:d1 | 1 | r1:a5 | 4 | 3.704909833 s |
| r1:d2 | 2 | r1:a6 | 4 | 4.832634885 s |
| r1:d3 | 3 | r1:a7 | 4 | 5.695178147 s |

Byte delivery remained correct, but inspectors/accessibility labels could misidentify which transmission caused an ACK. The proposed repair records the received instance's attempt plus an explicit `forInstanceId` on the ACK. This finding was sent to the engine owner; the repair and focused regression result are recorded below once verified.

**Repair verified:** the engine owner changed ACK creation to retain the triggering data attempt and `forInstanceId`. The independent reviewer reran the same seed/short-timeout reproduction and checked all **four ACK objects** against their source data instances: **PASS**. The accompanying implementation suite now includes a focused regression.

## Concrete defect E02 — A valid leading UTF-8 BOM was stripped

**Original finding:** `normalizedOptions()` encoded the input, then passed it through a default `TextDecoder` and later re-encoded the result. A default UTF-8 decoder consumes a leading BOM. Consequently a literal leading `U+FEFF` in the user's message was removed before the model established its own “original” bytes. Comparing only the model's original and reconstructed arrays could therefore pass despite altered input.

**Reproduction:** input `\uFEFF你好é🚀`, `scenario:'clear'`, `seed:9293`, then `advance(64)`. The actual `TextEncoder` input has **15 bytes**, starting `239, 187, 191`; the original implementation stored and reconstructed only **12 bytes**. Its message length also changed from six to five UTF-16 code units.

**Required repair:** preserve the BOM as message payload by setting `ignoreBOM:true` on the normalization, complete-prefix, and final-message UTF-8 decoders. Keep fatal validation where appropriate. Add a regression comparing reconstructed bytes directly to `new TextEncoder().encode(originalInput)`, including an intentionally split BOM. This preserves encoded input without changing the disclosed handling of unpaired UTF-16 surrogates.

**Repair verified:** all three decoding paths now use `ignoreBOM:true`. The independent reviewer reran the exact original input with **two-byte chunks**, deliberately splitting the three-byte BOM, in the out-of-order scenario. Original and reassembled arrays both retain all **15 bytes**, final text matches the submitted string, and all **134 recorded prefixes** are valid prefixes of that string: **PASS**.

The verified post-repair engine SHA-256 is:

`d0a15758acc720bfe03a9fd9d6a64f7bd115616d762d22b98a8891e4094863bd`

## Frontend observations sent for repair / browser verification

These were source-level findings, not invented screenshot failures.

| ID | Location and cause | Required resolution |
| --- | --- | --- |
| F01 | The initial `.receiver-display` is absolutely positioned without fallback top/left/width. Before JS geometry runs, its visible text can occupy the static origin while fallback SVG already labels the receiver elsewhere. | Supply matching initial desktop/mobile geometry or an equivalent complete static receiver, then check delayed/failed-module first paint. |
| F02 | Outer SVG has `role="img"`, while generated descendants are interactive `role="button"` nodes. An atomic image role is inappropriate for a compound interactive sculpture. | Use a suitable grouping role and confirm accessible names/controls; retain the textual status alternative. |
| F03 | Copy-plate accessible labels always say “retained copy”, including `block.retained === false` faded slots. | Label released/acknowledged copies accurately. |
| F04 | At 320px with a 120-byte message, 24 source blocks get a step of roughly 3.7px but are clamped to widths of at least 6px; labels and hit targets overlap. Receiver slots also become too small. | Emphasize a chosen block and provide an expandable/native list or another readable compact arrangement. Preserve access to every block's facts. Test this long-input case on mobile. |

## Decisions checked and accepted

- Closing a channel allows its already-admitted hop to finish; later admission is blocked. Directed return paths obey the same physical closure.
- Queue speed changes admission spacing, not propagation duration. This is clearly disclosed.
- A block with exhausted attempts can release its active window slot while keeping its source copy. This is an explicit toy-rule, so later blocks may still be attempted.
- Existing waiting/in-flight attempts may remain until the total deadline even after new attempts are exhausted. At the deadline their last positions become stranded; they do not become fabricated arrivals.
- Complete receiver bytes with every ACK lost remain `Received / Confirmation pending` at the terminal state.
- History snapshots occur after a scheduled event transaction, so several log entries at the same timestamp can map to the same factual snapshot. Review does not replay or alter the current simulation.
- Default messages and optional custom input are UTF-8-byte bounded. Rendering reads do not consume randomness.

## Limits

This review did not run a browser, screen reader, mobile device, performance benchmark, or network fault emulator. It did not verify current viewport composition, SVG pointer hitboxes, visual polish, or animation handoffs. Those are separate acceptance responsibilities. No dependency was installed and no site was published by this review.
