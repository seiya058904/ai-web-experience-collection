# RELAY — A Message Finds Its Way

A sentence travels through an uncertain world. Its fragments take different
routes, arrive out of order, disappear, and try again. You can change the route
and change the outcome.

RELAY is a six-chapter interactive artwork built with native SVG, live DOM
typography, Lenis, and GSAP / ScrollTrigger. Its transport sculpture is driven
by a deterministic local simulation: every moving orange plate and green
acknowledgement belongs to an actual model instance.

The opening is a **real paused delivery**, calculated from seed 9293. The
receiver has `Meet `, later blocks are buffered, and the missing block's second
attempt is at the fork. Press **Continue delivery** to move simulation time,
or scroll first to examine the same moment from another point of view.

## Run locally

Requirements: **Node.js 22.12.0 or newer**, npm, and a modern browser with SVG,
ES modules, native dialog and popover support. The included lockfile pins the
application and test dependencies.

From the extracted project directory:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local address printed by Vite, normally
`http://127.0.0.1:5173/`. The explicit host override keeps this preview on the
local machine. No account, API key, database or backend service is required.

To build and inspect the production files:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The production output is generated in `dist/`; Vite prints the preview URL,
normally `http://127.0.0.1:4173/`. Open the application through this local HTTP
preview rather than double-clicking `index.html`, because the project uses ES
modules and a build pipeline.

Dependency installation needs access to the npm registry. Once dependencies
are installed, the application can be built locally. Runtime fonts, scripts
and styles are bundled locally; no remote font service or image CDN is needed.

This delivery is a local source project. It contains no deployment command,
hosting account, publication credential, GitHub integration, or automatic
publishing step.

## How to use the sculpture

| Control | Actual effect |
| --- | --- |
| **Continue / Start delivery** | Advances simulation time. It becomes **Pause delivery** while running. |
| **Step** | Pauses playback and processes the next simulation timestamp, including all ordered events at that timestamp. |
| **Restart** | Explicitly starts a new round with the current message, scenario and seed. It resets routes and history and remains paused at time zero. |
| **Explore the route / Chapters** | Changes the observation point. Scrolling does not start delivery, rewind events or advance history. |
| **Open / Close upper or lower channel** | Changes real path availability for both data and the corresponding return route. A packet already admitted finishes its current hop. |
| **Lower passage speed** | Changes how quickly the lower queue admits instances. It does not alter the duration of an already entered hop. |
| **Lose one acknowledgement** | Arms one loss at the next eligible ACK hop completion. Repeated clicks while armed do not stack losses. |
| **A block, a gap, or Blocks** | Opens its identity, exact byte interval, hexadecimal payload, sends, receiver state and sender knowledge. The native selector keeps every block inspectable on narrow screens. |
| **Event strip** | Pauses and displays a real recorded snapshot. Use the event buttons or slider to inspect history. Mutating controls are disabled while reviewing. |
| **Return to current round** | Leaves review without changing live facts or resuming playback. |
| **Try a different route** | Opens the new-round dialog. Submitting it starts the new message, seed and scenario explicitly. |

Keyboard focus is visible. Native controls support keyboard operation; SVG
block and gate controls accept Enter or Space. Escape closes the block details,
recorded-moment view or new-round dialog as appropriate. Dialog and inspector
closure return focus to the invoking control.

The artwork is silent. Reduced-motion preference preserves all controls and
facts while shortening visual movement. Moving to a background tab pauses
delivery; returning does not catch up elapsed background time.

## Six views of one round

1. **The Gap** — the receiving prefix, missing interval and real approaching
   instance establish the problem.
2. **Keep a Copy** — a retained source block and a transport instance share the
   same data identity but remain different objects.
3. **Another Way Through** — change the two usable routes and one queue's
   admission rate.
4. **Arrival Is Not Order** — later blocks occupy their proper slots while the
   readable prefix waits at the first byte gap.
5. **Knowing It Arrived** — observe data travelling outward and
   acknowledgements taking an independent return path.
6. **A Whole Sentence** — the actual received result takes priority. A waiting
   or incomplete round retains its real prefix, gaps and reason instead of
   displaying a prewritten success.

All six chapters read the current round. A phenomenon that has already passed
can be inspected through its recorded history. A scroll transition never
creates data, loses an acknowledgement, chooses a route or completes a message.

## Scenarios and boundaries

| Starting conditions | Rule |
| --- | --- |
| **A way around** | Upper starts closed. Block 02's first data attempt is lost at its final delivery hop; its retained copy can be sent again. |
| **Out of order** | Block 02's first attempt waits at the fork for 4.2 demonstration seconds, allowing later blocks to arrive first. |
| **No way through** | Both branches start closed. Reopen one within the remaining budget or observe an actual incomplete ending. |
| **Uncertain sender** | Every acknowledgement is lost. Received data remains received even when the sender never learns that it arrived. |
| **An open route** | Both paths start open, with no deliberate data loss or holding gate. |

The model encodes the message with `TextEncoder`, then splits the **UTF-8
bytes** into five-byte blocks. The input limit is **120 bytes**, not 120
characters; Chinese and emoji can use several bytes each. The receiver
displays only complete characters before the first missing interval and
reconstructs the final byte array in its original order. Leading U+FEFF payload
bytes are preserved. Data repeats are acknowledged again without appending
duplicate text.

Default budgets are four actively outstanding block IDs, an 11-second ACK
timeout, up to four sends per block, and a 64-second round deadline. These are
demonstration seconds. Exhausted blocks release an active window position so
later blocks can still be attempted; their retained copies remain until ACK or
round end. Existing instances can finish or remain stranded at the deadline.

**Receiver truth and sender knowledge are separate.** A complete receiver can
read **Received** while the sender reads **Confirmation pending**. An ended
round with missing bytes reads **Incomplete**. There is no guaranteed-success
animation.

This is an original toy protocol, not an implementation of TCP, QUIC, BGP,
Internet routing or TCP congestion control. The message remains in browser
memory. It is not sent by HTTP, WebSocket, email or another communications
service, and it is not saved to local storage. Reloading begins a fresh seeded
demonstration. See [the full model specification](docs/MODEL.md) for queue,
closure, timing, validation, deduplication and history rules.

## Test and verify

### Model tests

```sh
npm test
```

The model suite checks exact original-input/reassembled UTF-8 bytes, out-of-order
buffering, retransmission, duplicate reception, lost acknowledgements,
disconnection and recovery, reset isolation, finite budgets, immutable history
reads, ACK provenance, BOM preservation and frame-rate-independent event order.
It writes reproducible results to `tests/model/model-results.json`, including
the tested source hash, seeds, operations and byte comparisons.

### Browser tests

Build before running the browser suite. Install Playwright's Chromium once if
a compatible executable is not already available:

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

The default runner fulfills an isolated test origin with the actual unmodified
`dist/` files. It does not start a web server or publish the project. It uses
real controls for mutations; the `window.__RELAY__` diagnostic API provides only
detached, read-only snapshots, presentation state, history and trace data.

| Environment variable | Purpose |
| --- | --- |
| `RELAY_BROWSER_EXECUTABLE` | Optional absolute path to an existing Chromium/Chrome executable. Without it, Playwright uses its installed Chromium. |
| `RELAY_QA_SCOPE` | `all` by default; use `smoke`, `matrix`, `handoffs`, `interaction` or `resilience` for a focused rerun. |
| `RELAY_EVIDENCE_DIR` | Absolute or relative evidence output directory; default is `qa-output/browser`. |
| `RELAY_QA_BASE_URL` | Optional existing local preview URL. Without it, the runner uses its isolated production-file fixture. It never starts or stops a supplied preview server. |

For an installed browser and focused interaction run in Windows PowerShell:

```powershell
$env:RELAY_BROWSER_EXECUTABLE = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:RELAY_QA_SCOPE = 'interaction'
npm run test:browser
```

Use the actual executable path on your machine. To return to the full scope,
set `RELAY_QA_SCOPE` to `all` or remove the variable.

On macOS or Linux, the equivalent environment-variable syntax is:

```sh
RELAY_BROWSER_EXECUTABLE=/absolute/path/to/chromium RELAY_QA_SCOPE=interaction npm run test:browser
```

The runner writes `results.json` and screenshot evidence to its output
directory. Its report distinguishes PASS, FAIL and NOT_TESTED and exits
unsuccessfully for critical failures. It covers the requested viewport matrix,
stable scenes, forward/reverse handoffs, real interactions, touch emulation,
font/resource failure, reduced motion, resize and other documented resilience
checks. Read the actual results rather than inferring acceptance from the
existence of a script.

Saved production verification evidence is under `docs/evidence/`. Model review
is documented in [MODEL-TESTS.md](docs/MODEL-TESTS.md) and
[ENGINE-REVIEW.md](docs/ENGINE-REVIEW.md). Art review is separate in
[VISUAL-REVIEW.md](docs/VISUAL-REVIEW.md). These records identify the tested
environment and remaining coverage limits. Emulated viewport/touch results do
not imply physical-device, Safari, Firefox or Windows GPU coverage.

Start with [ACCEPTANCE.md](docs/ACCEPTANCE.md) for the final results and
[KNOWN-LIMITATIONS.md](docs/KNOWN-LIMITATIONS.md) for their boundaries.
The extra forced-inline-font stress tests deliberately override responsive
font rules; their three noncritical overflow findings remain reported as
failures. Actual native browser zoom at 125%, 150% and 200% passed in a separate
headed-browser run. Native tab background recovery and genuine HTTP-cache
signals were also verified separately. See
[the native browser review](docs/NATIVE-BROWSER-REVIEW.md) and
[browser runner instructions](tests/browser/README.md) to reproduce those
checks. A NOT_TESTED item in one harness is not silently converted into a pass;
the supplement identifies the distinct successful test.

## Project map

| Path | Responsibility |
| --- | --- |
| `index.html` | Semantic page structure, local font references and initial native SVG fallback. |
| `src/main.js` | One animation ticker, scroll composition, playback controls, accessibility, review and lifecycle. |
| `src/model/relay-simulation.js` | Seeded event queue, bytes, routing, queues, losses, retries, ACKs and snapshots. |
| `src/view/sculpture.js` | Shared SVG route geometry, native instance positioning, slots and responsive sculpture views. |
| `src/style.css` | Typography, safe zones, responsive page layout, controls and reduced-motion styling. |
| `public/fonts/` | Local Archivo and IBM Plex Mono font files. |
| `tests/model/` | Executable deterministic assertions and their reproducible JSON evidence. |
| `tests/browser/verify.mjs` | Actual production-browser interaction, geometry and resilience verification. |
| `docs/concepts/` | Genuine AI-generated visual studies and their generation/selection record. |
| `docs/VISUAL-BIBLE.md` | Accepted art direction, materials, typography, scene continuity and mobile composition. |
| `docs/RESEARCH.md` | Primary research sources, scope and implementation decisions. |
| `docs/licenses/` | Bundled third-party notices. |

No generated concept image is used as a fake interactive transport movie.
Production text is native DOM/SVG; packet identities and states come from the
model. Fonts are local and their SIL Open Font License notices are included.
Lenis and GSAP retain their respective upstream terms; dependency versions and
integrity hashes are recorded in `package-lock.json`.

## Research and credits

- [RFC 9293, §2.2](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2):
  ordering, detection and retransmission concepts. RELAY's topology, timing,
  block-ACK strategy and finite budgets are its own rules.
- [Ryoji Ikeda — datamatics](https://www.ryojiikeda.com/project/datamatics/):
  a methodological reference for making data perceptible. No artwork image,
  audio or source code is reused.
- [Lenis](https://github.com/darkroomengineering/lenis) and
  [GSAP / ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/):
  coordinated scroll observation and presentation.
- Archivo and IBM Plex Mono: locally bundled, with their included notices.

The generated study prompts, files and adopted/rejected decisions are recorded
in `docs/concepts/generation-record.json`. The browser implementation and its
actual test evidence remain separate from those concept images.
