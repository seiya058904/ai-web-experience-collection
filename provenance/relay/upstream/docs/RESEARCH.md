# RELAY — Research and implementation boundaries

Research checked on **24 October 2026 (Asia/Shanghai)**. These are primary sources, not a claim that RELAY implements an Internet protocol. The installed dependency versions are recorded by the project lockfile.

## 1. What is borrowed from networking

[RFC 9293, §2.2 — Key TCP Concepts](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2) describes an ordered, reliable byte stream. Sequence information and checksums support detecting missing or damaged transmission, while retransmission contributes to reliability. This supports the artwork's separation of order, receipt, and confirmation.

**Scope:** RELAY's chunk size, acknowledgement policy, graph, route selection, deadlines, retries, and timing are original demonstration rules. Its graph is a transport environment. Closing a drawn channel is not an illustration of TCP constructing or selecting real Internet routes. RELAY does not implement TCP, QUIC, BGP, Internet congestion control, handshakes, real sockets, or end-to-end networking.

## 2. What is borrowed from art

[Ryoji Ikeda — datamatics](https://www.ryojiikeda.com/project/datamatics/) presents data through audiovisual and spatial forms. The relevant creative principle is making otherwise intangible information perceptible.

**Scope:** no Ikeda imagery, video, music, code, installation layout, or flashing visual treatment is reused. RELAY's warm enamel fragments, broad graphite paths, readable sentence, interruption controls, and two possible endings are original. The generated concept images are project-specific references; authoritative interface text is rebuilt in DOM/SVG.

## 3. One scroll controller, one visual scheduler

[Lenis official README](https://github.com/darkroomengineering/lenis) was checked directly. Its examples currently name 1.3.27. The documented GSAP integration connects Lenis's scroll event to ScrollTrigger, passes ticker seconds to `lenis.raf` as milliseconds, and disables GSAP lag smoothing. `autoRaf` stays false when the ticker drives Lenis. Import the package stylesheet. `anchors` enables anchor handling; `data-lenis-prevent` lets an event strip or dialog scroll natively. The current README documents reduced-motion support and `destroy()` cleanup.

[GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) exposes a 0–1 progress value and geometry-based start/end positions. When pinning, transform a descendant rather than the pinned element. RELAY should compute chapter composition from the current progress, so reverse scrolling and jumps require no event replay. Avoid snap, nested pins, and scroll callbacks that advance the transport model.

[ScrollTrigger.refresh()](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/) recalculates positional measurements. Refresh after layout-affecting font readiness, resize/orientation, and restoration; do not invoke it every animation frame. [gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/) supports responsive/reduced-motion setup and cleanup.

**RELAY integration recommendation (project decision):** use one GSAP ticker to update Lenis, derive a visual pose from ScrollTrigger progress, advance the simulation only while explicit play is active, and render a snapshot. Simulation time and the read-only recorded-moment cursor remain separate values. Clamp ordinary frame deltas and discard hidden-page elapsed time. Do not create a second RAF for the same Lenis instance. Remove ticker callbacks and listeners during disposal.

## 4. Bytes, text, and background state

[WHATWG Encoding Standard — TextEncoder and TextDecoder](https://encoding.spec.whatwg.org/#interface-textdecoder) defines UTF-8 encoding/decoding APIs. RELAY encodes first, divides the resulting bytes, validates returned ranges and payload, and reconstructs by byte offset. A streaming decode can retain incomplete trailing UTF-8 bytes instead of inventing a replacement character. For an independently rendered prefix, decode only its contiguous bytes with a fresh decoder in streaming mode; decode the complete byte array normally after completion. Tests compare `Uint8Array` bytes, not visual text length. Unpaired UTF-16 surrogates are normalized by the encoding API; round-trip truth is the encoded byte stream.

[WHATWG HTML Standard — Page visibility](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility) defines document visibility state and the visibility-change event. RELAY's project rule is stronger than merely relying on browser timer throttling: hiding the document pauses playback; returning requires an explicit user action and does not catch up missed wall time.

## 5. Accessibility constraints

| Primary guidance | Application to RELAY |
| --- | --- |
| [W3C — Animation from Interactions, SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Respect the user's motion preference. Replace long interpolation and camera travel with restrained state changes; retain all actions and factual results. This criterion is Level AAA, not an assertion of overall certification. |
| [W3C — Target Size (Minimum), SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Its minimum is 24×24 CSS px subject to exceptions. RELAY targets about 44 CSS px for primary touch controls; native buttons expose channel, speed, and acknowledgement actions. |
| [W3C — Reflow, SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Recompose the artwork vertically at 320 CSS px, retain readable supporting text, and test enlarged type. Do not call a proportionally shrunken desktop diagram a mobile layout. |

Keyboard focus, labels, status text, and solid/outlined fragment roles accompany colour. The simulation is quiet by default. Accessibility observations in the test report are bounded checks, not a comprehensive WCAG audit.

## 6. Source and licensing disposition

- Research pages are cited by URL; no reference-site media is bundled.
- Lenis and GSAP are bundled through package dependencies, with license notices supplied in the project. Their exact installed versions and license text govern redistribution.
- Fonts must be local, with their original license notices included. No runtime font CDN is required.
- AI concept image generation is recorded separately in the Visual Bible and generation ledger. Those images are references unless explicitly marked as final assets.
- All message processing happens in local browser memory. Asset requests and navigation to a cited source are not message transport.
