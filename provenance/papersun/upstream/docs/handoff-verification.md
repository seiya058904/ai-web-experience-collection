# PAPERSUN — Recorded extracted-source verification

## Result and scope

**PASS for the actual candidate archive's clean extraction, integrity, prepared preview, locked dependency installation, source check/build and rebuilt browser preview.** These stages ran in a new extraction separate from the authoring project. The real reports, command logs and three browser screenshots are included in `evidence/handoff-candidate/`.

This record is incorporated into the final source package. Its candidate checksum is deliberately identified as historical evidence. The accompanying `papersun-verification.md` records a second independent extraction and audit of the exact delivered `papersun-source.zip`, including that final file's checksum. The candidate checksum below is not the final delivered checksum. Keeping the final checksum outside the ZIP avoids a circular self-hash.

The complete H1–H9 contract remains **NOT ACCEPTED** because native browser Find, actual browser UI zoom and real hidden-tab restoration remain blocked in the available environment. This successful source handoff does not change those browser capability results.

## Candidate identity

| Item | Actual recorded value |
| --- | --- |
| Candidate filename | `papersun-candidate.zip` |
| Bytes | 490,064,262 |
| SHA-256 | `e64a4dfb74691d6c49db19b60503cddd0bc1fcf8798a36bb60b8c41a9c833541` |
| Top-level root | `papersun/` |
| Ordinary ZIP entries | 5,346 |
| Manifest-listed files | 5,345, plus the manifest itself |
| Manifest SHA-256 | `1a438a6e3fdadacda7c6c00fdcdd33c5091412752442c391680dc15766e99805` |
| Application source fingerprint | `2c4f60e826d3c5e8b80702f02027b1eb791f7fd1953172e73276f86a938468fa` |
| Application inputs in fingerprint | 31 |
| Audit started | 2026-11-09T10:10:52.173705+00:00 |
| Audit completed | 2026-11-09T10:11:02.816393+00:00 |

The driver checked exact archive membership against the manifest inventory plus the manifest file. It rejected duplicate names, Windows-case ambiguities, traversal and symlinks. All entries extracted successfully with Python's end-of-entry CRC validation. Installed dependencies were absent before the first preview.

The source fingerprint is SHA-256 of sorted `path + NUL + recorded SHA-256 + newline` for all `src/` and `public/` files, root build manifests/configuration/index, and the local server/launcher scripts. It provides a precise application-input comparison with the final handoff audit. It does not stand in for the whole ZIP checksum.

## Executed stages

Environment: **Node v24.22.1, npm 11.9.0, Linux; isolated Chromium 153.0.8010.0 with CPU rasterization and corrected Fontconfig**. The browser had a new local profile. The owned preview server was bound to `127.0.0.1` and stopped after each verification stage.

| Actual stage | Result | Recorded duration |
| --- | --- | ---: |
| Node-only prepared preview before dependency installation | PASS | 1.361 seconds |
| `npm ci --no-audit --no-fund` in the new extraction | PASS | 0.994 seconds |
| `npm run check` in the new extraction | PASS | 3.223 seconds |
| Rebuilt integrity, HTTP and actual browser preview | PASS | 2.676 seconds |

These are command durations in this particular environment, including available package caches; they are not website performance or download benchmarks.

The prepared preview used `node scripts/verify-handoff.mjs --http-only` before any npm installation. This path imports only Node built-ins. It verified **all 5,345 manifest entries**, **41 contained build references**, and **20 actual HTTP resources** against their extracted bytes and expected content types. Those resources include the two pages, favicon, JavaScript, stylesheet, source map, eight production images and six local fonts. The text edition contains eleven distinct chapter sections.

Fresh dependency installation was followed by **10/10 passing tests**, the English-content check, strict TypeScript and a Vite production build. The rebuilt files are `index-Crm79syp.js` and `index-C8PaC5EY.css`. The verifier then rechecked the same manifest without any byte/hash mismatch, confirming that rebuilding preserved the prepared application and all other packaged files.

The browser stage opened three actual states from the rebuilt extraction at 1440 × 900 CSS pixels:

| State | Measured result | Active chapter | Chapters / beats |
| --- | --- | --- | --- |
| Opening | PASS | CH-01 | 11 / 22 |
| Direct `#tr-08-09@50` | PASS | CH-09 | 11 / 22 |
| Ending `#ch-11` | PASS | CH-11 | 11 / 22 |

There were **zero page/console errors, zero verifier failures and zero browser-launch retries**. Fonts and stage images were loaded, the requested chapter/transition identity matched, and no horizontal document overflow was detected.

## Actual screenshot inspection

The root reviewer opened all three full-resolution screenshots produced by this extraction. The opening has a complete, legible title, a single circular absence and intact paper-city composition. The direct midpoint shows the registered opaque blue arch, bridge/room connection, readable narration and available worktable controls with zero placements. The ending presents one stitched three-piece sun, readable final prose and usable revisit/restart controls. No missing lettering, blank stage, duplicate sun or unexpected clipping was observed in this scope.

This is a three-state extracted-build smoke check. The much broader interaction, transition, phone, failure, reduced-motion and viewport evidence is separately indexed in [the evidence index](evidence-index.md); the three screenshots do not replace it.

## Included evidence

- [Execution chain and archive identity](evidence/handoff-candidate/execution.json)
- [Prepared-preview command log](evidence/handoff-candidate/prepared-preview.log)
- [Fresh dependency installation log](evidence/handoff-candidate/npm-ci.log)
- [Extracted-source test and build log](evidence/handoff-candidate/source-check.log)
- [Rebuilt-preview command log](evidence/handoff-candidate/rebuilt-browser-preview.log)
- [Prepared integrity and HTTP report](evidence/handoff-candidate/prepared/handoff-http-2026-11-09T10-10-54-611Z.json)
- [Rebuilt integrity, HTTP and browser report](evidence/handoff-candidate/rebuilt/handoff-browser-2026-11-09T10-11-00-192Z.json)
- [Actual opening](evidence/handoff-candidate/rebuilt/handoff-browser-2026-11-09T10-11-00-192Z-first.jpg)
- [Actual transition midpoint](evidence/handoff-candidate/rebuilt/handoff-browser-2026-11-09T10-11-00-192Z-transition-midpoint.jpg)
- [Actual ending](evidence/handoff-candidate/rebuilt/handoff-browser-2026-11-09T10-11-00-192Z-ending.jpg)

The distributed report copies normalize machine-specific absolute paths to explicit placeholders. [The normalization audit](evidence/evidence-path-normalization.json) records each changed text file's before/after hash. Recorded results, measurements, failures, timestamps and screenshot pixels are unchanged. The original audit output was kept separate from the extracted source while verification ran.

## Repeating the portable checks

The project includes `scripts/verify-handoff.mjs`. Run it from an extracted project root with an absolute report directory outside that project:

```bash
node scripts/verify-handoff.mjs --http-only --out /absolute/external/report-directory
```

On Windows, supply an absolute Windows path such as `C:\papersun-audit`. The Node-only mode does not resolve Playwright. For the optional browser mode, install the locked development dependencies and a Playwright-compatible Chromium binary as described in the README, then omit `--http-only`. The verifier starts its own loopback server and accepts `--port`; it writes no source or existing evidence files.

Use the accompanying final verification report to identify the exact delivered ZIP and its second extraction result. The requirements ledger and known limitations retain the three blocked browser capabilities, six synthetic CSS-content-zoom failures and all explicit untested platforms.
