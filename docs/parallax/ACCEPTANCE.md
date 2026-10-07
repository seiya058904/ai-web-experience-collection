# PARALLAX — Collection intake acceptance

Audited and integrated on 2026-10-07. The supplied ten-perspective exhibition retains its original ivory gallery, Bodoni Moda/Manrope typography, black-stone sculpture, 18 persistent fragments, live optical passes and controls. The source did not include Lenis. The Collection adds its already locked Lenis dependency on the existing on-demand RAF, with no second scene-progress easing or dependency change. These are current local checks; publication identity is verified separately after authorized deployment.

## Delivery and import boundary

| Item | Current result |
|---|---|
| Original ZIP | `D:/下载/PARALLAX-The-Museum-of-Impossible-Forms.zip`, retained outside Git and deployment |
| Archive | 46,316,092 bytes; 73 entries; 50,442,942 uncompressed bytes |
| SHA-256 | `72768646c6de27b10f99e7ef7de2233e3c6c7a157661aae491084147051937f0` |
| Modification time | `2026-10-07T11:13:09.725709`, local filesystem time |
| Integrity | All entries read with CRC validation; one `PARALLAX/` root; no traversing/absolute paths, symlinks, duplicate names or nested archives |
| Extraction | Fresh temporary directory outside the repository, before source/runtime audit |
| Supplied asset record | All 29 recorded image/vector/font/vendor/license/model file hashes matched |
| Prepared output | All 19 `dist/` files match editable source/public/vendor byte-for-byte; compiled copies omitted |
| Dependencies | Delivered Three.js core, module and Reflector match existing root 0.186.1 byte-for-byte; reuse locked Three.js and Lenis 1.3.26 |

Runtime source lives in `experiences/parallax/src/`, its document in `pages/parallax/`, production resources/notices in `public/parallax/`, and design/source history in scoped docs/provenance. Standalone manifests, build/server/startup tooling and duplicate vendor modules are omitted. The historical model exporter remains provenance, not an executable Collection command. The Vite development alias resolves this work's source outside the HTML root without embedding a machine path in the page. Existing works retain their source and runtime behavior.

**CONFIRMED-STATIC:** inspected application source has no remote runtime service, analytics, uploads, audio input or dynamically evaluated code. Its dynamic import is the fixed local spatial module; textures use the configured deployment base. Source/font/generated-image rights remain distinct. The delivery declares no application-wide open-source grant. No grant for custom code or generated artwork is inferred from Three.js/Lenis MIT. Font OFL and Three MIT notices retain complete original text. Graph freshness was incomplete for existing integration files and the new delivery was outside the index; relevant source was read directly and graph absence was not treated as proof.

**CONFIRMED-RUNTIME:** normal original and integrated runs made no external application requests, reported no page errors and had no failed resource responses. Deliberately delayed resources and disabled WebGL are separate compatibility probes. Original launchers were inspected but not executed; the original prepared output was served with a standard loopback-only static server.

## Original work and required scroll adaptation

The original source's seven projection/timeline tests passed. Twenty original frames cover all ten chapters at 1440×900 and 390×844. Every chapter kept the same 18 fragment identities. Exact Align view projection error was below `1e-8` pixels; moving the range to 0.65 produced approximately 53.68 desktop / 18.64 phone pixels of projected separation, then reset to the reference. Mirrors and membrane used live render passes, with no replacement model.

Lenis is configured with `lerp: .105`, native touch, `autoRaf: false`, and explicit sizing. Its clock advances on the existing RAF before sampling document progress and stops when scrolling/pointer response settles. Reduced motion disables smoothing and uses the supplied complete chapter poses. Index stops background movement and retains native inner scrolling; close resumes synchronously before a chapter destination starts. Reverse wheel input cancels the old destination. Resize preserves normalized progress and rebases an active chapter target. History restoration is immediate. Hidden tabs discard old inertia; BFCache retains the cached instance; final exits/HMR release Lenis, listeners and GPU resources.

## Current Collection checks

- `npm test`: **152 passed**, including the seven imported projection/timeline tests.
- Root and `/ai-web-experience-collection/` builds: TypeScript/Vite passed; **515 HTML/CSS references** and all route/canonical/social/resource/notice assertions passed for each base.
- **60 production work frames**, all ten chapters at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160; six gallery captures reviewed. No horizontal overflow. Home/work/return links use actual documents and the homepage loads no work engine.
- Desktop/phone: all ten Index links, Align view, range/keyboard input, Focus artwork/Show labels, native dialog wheel/Escape, Reduced motion and Begin again passed. System reduced motion and intentionally unavailable WebGL retained composed, readable chapter content.
- Normal 600px wheel input traversed intermediate document positions before settling exactly; at 120ms the captured position was 364px. Fine/high-frequency 8×30px input accumulated correctly; fast 1800px input reversed promptly with -600px. Slow 30px input at 140ms intervals, keyboard Home/End and manual interruption of chapter navigation passed.
- Twenty-six arbitrary forward/reverse stops covered hero handoff, Rift entry/exit, optical transitions and museum arrival. Chapter progress remained direct, bounded and reversible; stopped frames retained their scene composition.
- Fractional-position reload, resize preservation, resize during an Index destination and idle drawing suspension passed. Raw Chromium/CDP verified actual hidden-tab suspension: zero pending application RAF and no frame/position changes while hidden. Foreground input resumed; application RAF concurrency stayed at one. Browser Back used real BFCache (`pageshow.persisted=true`), restored 1200px and retained Lenis.
- Source diagnostics verified persistent fragment UUIDs, live mirror/membrane captures and exact viewpoint reset in desktop and phone touch emulation. A simulated phone at DPR 3 retained range selection and the 1.75 rendering cap. Actual WebGL context loss and restoration rebuilt the current pose on both compositions.
- Delaying the stone texture by 2200ms preserved visible, gradual wheel response before stage readiness; normal rendering recovered at the same document position.
- JavaScript-disabled home/work/return navigation and all ten semantic chapters passed.
- Production asset and imported binary hashes are checked against scoped delivery records. `git diff --check` and scoped final review are required at closeout.

Browser: Chromium 151.0.7922.34 on Windows, normal ANGLE AMD Radeon RX 7900 XT / D3D11 rendering. Browser plugin unavailable; bundled Playwright was used, plus raw CDP for real visibility/BFCache checks. Temporary drivers, state reports and screenshots stay outside the repository; only the actual gallery/social capture is production media.

## Known observations and limits

The same AMD shader compiler **X4122 floating-point precision warning** occurs in the unmodified original and integrated work. It reports tiny environment-lighting sums; it did not produce shader failure, missing geometry, page errors or a failed optical pass in these runs. It remains recorded, rather than being suppressed or used as a reason to redesign supplied materials. The unrelated pre-existing VEIL `@import` ordering warning remains in root builds.

Viewport/touch emulation does not certify physical touch, iOS Safari, Firefox, macOS or high-refresh performance. No FPS benchmark, GPU-independent performance guarantee, external glTF validator or native launcher acceptance is claimed. Both original initialization-context-loss timing permutations were not separately rerun; this intake exercised delayed initial assets and active-scene context recovery. Generated imagery retains its source raster dimensions even when the live geometry/text render at 4K.
