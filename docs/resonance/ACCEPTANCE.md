# RESONANCE — Collection intake acceptance

Audited and integrated on 2026-10-07. The supplied eight-act acoustic installation retains its graphite/ivory/amber identity, native scrolling, shared procedural field, one owned RAF, opt-in synthesis, capture/WAV/playback and reading edition. Three reproduced runtime defects were repaired. The checks below passed on the local production build; this record does not claim publication or physical-device acceptance.

## Delivery and source audit

| Item | Recorded result |
|---|---|
| Original archive | `D:/下载/RESONANCE-Sound-Made-Visible-v1.0.0.zip` |
| Size / entries | 108,140 bytes / 24 files / 214,253 uncompressed bytes |
| SHA-256 | `f3432ba9e1067d22b3ee56b34b2fd262777f3cc5ad57c3351f049393bf591513` |
| Modification time | `2026-10-07T00:34:30.922292` (local filesystem time) |
| Archive integrity | CRC passed; one `RESONANCE/` root; no absolute/traversing paths, symlinks or nested archives |
| Extraction | Fresh temporary directory outside the repository; original ZIP retained outside Git and deployment |
| Import boundary | Source, page, fonts/notices, docs and provenance relocated into the existing Collection directories |

The upstream `dist/` contains the sole editable native ES-module source, as its README and architecture explicitly describe; there is no separate generated source copy. Its source is integrated rather than an upstream compiled bundle. Standalone `package.json`, startup/server/validation scripts and `.gitignore` are omitted and remain available in the archive. No nested lockfile, runtime dependency or dependency update is introduced; the root lockfile is unchanged.

**CONFIRMED-STATIC:** no microphone input, runtime remote fetch, telemetry, uploads or third-party media assets were found in the supplied application. Audio is synthesized locally after an explicit gesture. External source/reference links are ordinary user-initiated links. **CONFIRMED-RUNTIME:** both standalone and integrated browser runs completed without external application requests; the integrated sound-off entrance created no AudioContext.

Font binaries are byte-identical to the delivery. Supplied Manrope and Cormorant Garamond notices were checked against their [Google Fonts Manrope](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt) and [Cormorant Garamond](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt) records. Readable OFL copies only remove trailing whitespace. The delivery contains no application-wide LICENSE; no MIT or other open-source grant is invented. User-supplied integration does not establish a separate redistribution license. See [the preserved asset record](../../provenance/resonance/ASSET_PROVENANCE.md) and [import mappings](../../provenance/resonance/IMPORT.json).

Scientific caveats remain in the interface and records: the visible time scale is slowed, the modal fields are qualitative, and the Chladni-inspired modes are not calibrated for a real plate's dimensions, material or constraints. The synthesized Hz value describes the actual tone fundamental. Sound-wave and nodal principles were checked against [OpenStax](https://openstax.org/books/university-physics-volume-1/pages/17-1-sound-waves) and [UNSW](https://www.phys.unsw.edu.au/~jw/guitar/guitarchladni_engl.html); this is an explanatory installation rather than an experimental acoustic measurement.

## Reproduced defects and repairs

| Classification | Before | Repair and verification |
|---|---|---|
| CONFIRMED-RUNTIME | At 768×1024, the bright nodal plate overlapped the resonance heading. | Portrait widths 761–900px reuse the supplied narrow composition in CSS and both renderers. All eight tablet scenes were captured again; heading and plate no longer overlap. Square portrait selection is covered by the renderer regression test; short landscape retains the original placement. |
| CONFIRMED-RUNTIME | If WebGL and Canvas both failed, initialization could finish without a renderer while keeping the fixed exhibition layout. | Renderer initialization now releases resources and throws into the existing reading fallback. Browser verification exposed all eight semantic acts; regression tests verify clone/listener cleanup. |
| CONFIRMED-RUNTIME | Keyboard chapter navigation attempted to focus a heading while descendant visibility was still hidden just after removing inert, then cleared the pending focus. The focus remained on the chapter rail. | The existing RAF retains pending focus until the heading is visible and actually focused. The original failure was reproduced; Enter on the final production build focuses `harmonics-title`. No extra clock or timer was added. |

Other upstream modules remain unchanged apart from import paths, base-aware resource/navigation wiring and Collection metadata/return. The gallery uses an actual runtime capture, not an invented concept image. Existing works' runtime source and established gallery rows are preserved.

## Executed engineering checks

| Check | Actual result |
|---|---|
| Supplied `node scripts/validate.mjs` in the external extraction | Passed syntax, modules, anchors and font checks |
| Supplied Node tests | 21/21 passed before integration |
| Collection `npm test` | 142/142 passed; includes 21 supplied audio/scroll tests and 3 renderer regressions |
| Root `npm run build` + `npm run verify:build` | Passed; 441 local HTML/CSS references checked |
| `npm run build -- --base=/ai-web-experience-collection/` + `npm run verify:build` | Passed; 441 local references checked |
| Provenance verification | All 24 archive entries and imported-file hashes checked; unchanged binaries match the originals |
| Final Git whitespace check | `git diff --cached --check` passed |

Runtime: Node.js 24.15.0, npm 11.12.1, Chromium 151.0.7922.34. Browser inspection used bundled Playwright because the Browser plugin was unavailable. Graphics were real WebGL output rendered through ANGLE/SwiftShader; this verifies behavior and composition, not hardware frame rate. The build emits an existing VEIL CSS `@import` ordering warning. It is outside this intake and did not fail either build. No dependency installation or asset regeneration script was run.

The final project-path build was left in `dist/` for preview. Both production license files, work attribution, both OFLs/fonts and the gallery image returned HTTP 200 under that base. Interactive runs reported zero page errors and zero failed resource requests.

## Production browser acceptance

All eight acts were inspected at **390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 and 844×390**: 56 complete scene frames plus entry, fallback and handoff captures. Contact sheets were visually reviewed. No horizontal overflow was found, and visible controls stayed within viewport bounds. The portrait-tablet repair was checked in the integrated build. These are simulated CSS viewports, not seven physical devices.

Passed flows:

- Desktop/mobile home → work → Collection, direct entry and refresh; local fonts/media, document identity, canonical/social URLs and native links retain the project base.
- Immediate-load “Disturb the silence”, pluck, phase 180°, all three modes, frequency 110–330Hz, capture, playback, mute, restart, Index, Escape, About disclosure and keyboard chapter focus.
- Sound-off capture exports a real 264,644-byte RIFF/WAVE file: 3 seconds, 44,100Hz, mono, 16-bit PCM. Capture remains distinct from later live frequency changes; actual playback-buffer samples retained 110Hz after live frequency moved to 330Hz.
- Fine, slow, normal, high-frequency, fast-down and fast-reverse wheel inputs. Arbitrary stops within propagation, resonance and memory handoffs retain coherent scene state. Resize desktop → phone and phone → desktop preserves the active chapter.
- System reduced motion, deliberate Calm preference, forced Canvas fallback and failure of both contexts. Disabled JavaScript exposes all eight readable acts and working entrance/return links.
- Forced WebGL context loss produces the Canvas counterpart; mode selection still works. Restoration removes the fallback clone and retains the resonance chapter.

### Real background and history evidence

The standard Playwright browser forces focus emulation; its tab-switch timeout was a test limitation, not evidence of a broken visibility handler. A separate native Chromium CDP run without that focus override verified actual `document.hidden` changes on the final build.

While capture was at 1/3 second, switching to another tab suspended AudioContext and stopped the owned RAF. Across 3.3 seconds hidden, frame count stayed **19**, audio time stayed **1.000 seconds**, and the capture status did not advance. Returning resumed the clock and completed the 110Hz capture. A controlled `pagehide`/`pageshow` check separately confirmed the same suspension behavior; that injected event check is not substituted for the actual tab result.

Native browser Back restored the memory chapter at **scrollY 7452**, reported `pageshow.persisted === true` (actual BFCache restoration), and retained the captured buffer. A Playwright-driven navigation instead created a fresh document (`persisted === false`): chapter position returned, but in-memory capture did not survive. Capture is not promised across reload or a new document. This counter-evidence remains distinct from the passed BFCache case.

In JavaScript-disabled contexts, Playwright's injected policy reports script preloads as `csp` failures. These intentional blocks are recorded separately; the same production URLs are present and load normally with JavaScript enabled.

## Evidence and remaining limits

Temporary browser drivers, JSON reports, downloaded WAVs and screenshots stay outside Git at `C:/Users/admin/AppData/Local/Temp/collection-resonance-intake-xysydw_y/`. `integrated-results.json` records the scene matrix and primary controls; `final-smoke-results.json` records final keyboard/wheel/native-link checks; `raw-lifecycle-results.json` records actual visibility, retained audio samples and BFCache. `integrated-<width>x<height>-contact.png` files contain the eight-scene visual evidence.

Physical touch, iOS/Safari, Firefox, Android devices, assistive-technology compatibility, high-refresh hardware, native-GPU performance, OS sleep/recovery and real speaker listening quality remain **unverified**. No 60 FPS or physical-acoustics certification is claimed. No remote push or deployment was performed as part of this local intake acceptance.
