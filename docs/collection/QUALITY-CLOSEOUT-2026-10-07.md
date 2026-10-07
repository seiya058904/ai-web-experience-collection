# Collection quality repairs and four supplied works — 2026-10-07

This follow-up repairs the confirmed audit findings from baseline `14ec0921c3424e615e3c19c2e9e2bfe57c12f89c`, adds the audited LUTHIER, CODEX, MAGMA and FOSSIL deliveries, and keeps the independent works' imagery, typography, controls and rendering paths. The preceding audit covered twenty works; this release contains twenty-four. It changes no dependency versions or lockfile.

## Repair scope

| Surface | Confirmed trigger | Result required for acceptance |
| --- | --- | --- |
| Collection / INTERVAL | Narrow desktop triptych clips the title | The full title fits at all six recorded viewport sizes |
| GLAZE | Chapter navigation followed by refresh returns to Celadon | Restore the actual current reading position |
| ORBITAL | Fresh `#mission-reading` stays on Earth | Show the reading edition on the initial document load |
| ORBITAL | Desktop Machine followed by refresh returns to Earth | Restore the real document position after layout is ready |
| CHRONOS | Initial chapter hash scrolls the internal stage | Keep the title clear of the header and retain subsequent navigation |
| FORM | Refresh after moving beyond a chapter target | Preserve the latest document stop rather than the chapter default |
| FORM | Light at 768×1024 | Keep the lamp in its intended complete composition |
| OPTIC | Native wheel scrolling lacks the required Lenis | One Lenis on the existing RAF, native touch/dialogs, reduced-motion bypass |
| OPTIC | Reduced-motion cold `#shutter` at 1440×900 resolves to Aperture | Resolve the chapter boundary to Shutter |
| FACET | Refresh after wheel movement restores stale `facetPosition` | Keep the latest read position |
| INKSCAPE | Index shows underlying artwork text | An opaque paper menu with readable chapter labels |
| SILICON / ATLAS / THRUST | JavaScript disabled, page return missing or obstructed | A working native Collection return in each fallback |

VEIL's Lenis CSS import now precedes its font-face rules, so PostCSS retains it. This resolves the build warning previously recorded separately from runtime failures. Development aliases explicitly map the two source directories outside the HTML root, fixing the observed local source-module 404 while retaining the production multipage build.

## Supplied work boundaries

LUTHIER is a nine-movement violin theatre: Presence, Wood, Craft, Inside, Tension, First Bow, Resonance, Sound as Space and Return. Its original narrative, procedural violin, local audio, generated material plates, controls and compatibility path are retained. The original ZIP stays at `D:/下载/LUTHIER.zip`. See [LUTHIER acceptance](../luthier/ACCEPTANCE.md) for its source, resource, license and browser evidence.

CODEX follows an original sewn case binding from paper through gathering, sewing, pressure and reading. MAGMA is a nine-movement material sculpture through heat, cooling and fracture. FOSSIL is a ten-movement exhibition through sediment, preservation, authored synthetic tomography and the archive. Their independent typography, geometry, materials, controls and rendering paths are preserved. The gallery uses captures of the actual works; supplied generated plates and original procedural/synthetic models retain their separate provenance.

All four original ZIPs stay at the exact user-specified `D:/下载/` paths. Each was inventoried and extracted to a fresh external directory before source review and runtime acceptance. Original entries, omitted tooling/compiled duplicates, import mappings and binary hashes remain reviewable in `provenance/deliveries/import-manifest.json` and scoped `provenance/` records. See [CODEX acceptance](../codex/ACCEPTANCE.md), [MAGMA acceptance](../magma/ACCEPTANCE.md) and [FOSSIL acceptance](../fossil/ACCEPTANCE.md). `D:/下载/Collection-source-archives/` remains an archive directory.

The adapters retain one Lenis and each work's existing clock, native dialog/touch behavior, reduced-motion bypass, immediate restoration and visibility/resource cleanup. FOSSIL's integrated mobile reduced-motion deep-link sizing was corrected; its narrow-tablet opening shade now keeps the original body text readable against light stone. Total Canvas rejection releases Lenis and leaves the original semantic ten-chapter exhibit and native Collection return usable. MAGMA's small stale-history refresh offset and missing host lifecycle cleanup were addressed during import.

## Verified cleanup

The old ignored `CHRONOS-complete-project.zip` was relocated to `D:/下载/Collection-source-archives/` outside the repository. Its 2,061,213 bytes and SHA-256 `9b71b309b4068d13f8faed8f4ac208766e8016388dbfaf6c1bd948674b60f446` were verified before and after relocation. Forty-six old generated `.playwright-cli` logs, snapshots and screenshots (563,036 bytes) were archived outside the repository with matching hashes; the resulting empty directory was removed.

No source, legal notice, unique historical record, active dependency installation or uncertain original delivery was deleted. Temporary browser drivers and evidence remain outside the repository. The generated `dist/` stays ignored and is the validated preview/deployment input.

## Validation

`npm test` passed all 181 model/continuity/rendering tests with zero skipped items. New regression coverage projects the real FORM lamp meshes in narrow desktop/portrait cameras and checks OPTIC chapter-boundary rounding. Supplied LUTHIER model/renderer invariants and MAGMA material/seam geometry are checked against the imported production modules.

The early repair group passed 92 assertions in twelve fresh full/reduced desktop/phone contexts. The middle repair group passed its focused model suite and directed runtime checks for restoration, all optical chapters/controls, fallback, early input, reversal, resize and readable INKSCAPE Index. These are development checks; final production-path acceptance is recorded separately after source freeze.

Both the root and `/ai-web-experience-collection/` production builds passed TypeScript, Vite and the strict output verifier: twenty-four work documents plus home/credits, with 653 HTML/CSS resource references. The project-path build remains the preview/deployment candidate. Production verification first caught nine MAGMA inline fallback-image URLs resolving relative to the work document; all now use `%BASE_URL%`, with no change to the owned renderer. No reference assertion was weakened. FOSSIL's preserved classic `fossil-volume.js` intentionally remains public data rather than an ESM bundle; its unbundled-script warning is retained, and its actual HTTP bytes and imaging initialization are checked separately.

The final project-path home passed 144 decoded gallery images across 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160. INTERVAL and all four new titles fit; home and credits have no horizontal overflow or failed resources. SILICON, ATLAS and THRUST passed six actual JavaScript-disabled native returns. VEIL showed intermediate-to-settled wheel interpolation at both phone/desktop sizes, a locked background behind its natively scrolling Index, and resumed input after Escape.

Raw CDP recorded genuine document hiding and restoration for ORBITAL, GLAZE, CHRONOS, FORM, VEIL, OPTIC, INKSCAPE, FACET and all four new works. All twelve retained their hidden scroll position and stopped advancing render frames, resumed input, and returned through actual BFCache (`pageshow.persisted=true`) to the preceding position. All sixty recorded lifecycle predicates passed, with no JavaScript exceptions. Pending GSAP bookkeeping is not counted as a second application clock.

All twenty-four final production documents passed native home→work→Collection entry flows at desktop/phone sizes with full and OS reduced motion: 96 flows, no JavaScript exceptions or HTTP resource failures. Every full-motion route had Lenis present and an observed intermediate wheel position before the settled position. Three existing ORBITAL/GLASSHOUSE shader compiler warning logs remain recorded; the directed LUTHIER Craft check also logged an upstream precision warning while its actual mesh rendered correctly. These warnings are not reported as zero or as confirmed rendering failures.

The early production repairs repeated all 92 assertions in twelve fresh contexts. CODEX passed 179 production browser assertions covering ten chapters, controls, restoration, seven viewports including 844×390, late-resource early input, fallback and two real no-JavaScript returns; its external pure-model suite passed six checks. LUTHIER passed 28 main production groups and FOSSIL 58, with 26 shared addon checks, twelve six-size composition groups and twelve exact HTTP comparisons covering their hero/font/model/density/notice resources. Their complete chapter and fallback frames were viewed, and synthetic FOSSIL imaging initialized correctly. Scoped acceptance records retain the actual results and driver counter-evidence.

The middle production checks passed fifteen directed records: all three viewport sizes of FORM, FACET, OPTIC and INKSCAPE retained actual stops after reload/document Back, with zero pixel restoration error and maximum normalized resize error below 0.000038. OPTIC's eighteen desktop/phone WebGL chapter frames and nine phone Canvas frames were viewed; all controls, pause/resume, all nine fresh reduced-motion hashes and early input before delayed imagery passed. Native same-document hash Back retains its original semantic-anchor behavior, which is distinct from arbitrary-stop document Back. MAGMA passed all nine normal desktop/phone states and controls, four additional viewport sizes, all nine reduced and image-edition states, zero-offset refresh, and eighteen correctly based no-JavaScript background requests. Its final frames were viewed without page exceptions or missing resources.

The unrestricted staged `git diff --check` reports 1,708 original formatting findings in eighteen supplied document/license files: Markdown hard breaks, original EOF spacing, and legal-notice whitespace/CRLF. Every reported line was checked against the original ZIP entry and its recorded SHA-256; byte-sensitive notices remain exactly unchanged. The strict check of all remaining authored files passed. These source-format findings are preserved and reported rather than rewriting legal originals or changing the checker configuration.

The Browser plugin is unavailable in this session; browser checks use the installed Playwright and real Chromium. Viewport emulation is not physical-device acceptance. Physical touch, iOS/Safari, high-refresh hardware, speaker listening quality and prolonged memory/FPS certification remain unverified.
