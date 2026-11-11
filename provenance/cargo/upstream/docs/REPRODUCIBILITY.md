# CARGO — Source extraction and rebuild

Verified on **9 November 2026**, using **Node.js 24.22.1** and **npm 11.9.0** on Linux x64.

## Actual reproduction

A source candidate was archived with one top-level `cargo/` directory, extracted into a separate empty verification directory, and rebuilt there. The archive excluded `node_modules`, `dist`, caches, browser profiles and temporary browser binaries. No installed dependency directory or compiled output was copied into the extracted project.

The following commands were executed from that extracted project:

```sh
npm ci
npm run build
npm test
node scripts/check-english.mjs
node scripts/check-assets.mjs
```

| Check | Actual result | Evidence |
| --- | --- | --- |
| Locked dependency installation | **PASS**; npm installed the lockfile dependencies. | [install.log](evidence/clean-rebuild/install.log) |
| Strict TypeScript and production build | **PASS**. | [build.log](evidence/clean-rebuild/build.log) |
| Source suite | **28 PASS; 0 FAIL**. | [unit-tests.log](evidence/clean-rebuild/unit-tests.log) |
| English guard | **PASS**; zero reported issues in the scanned authored files. | [english.log](evidence/clean-rebuild/english.log) |
| Local production assets | **PASS**; required media, production copies, entry references and font paths are present. | [asset-manifest.json](evidence/clean-rebuild/asset-manifest.json) |
| Source equality | Runtime source, assets, configuration, lockfile and test scripts match the rebuilt extraction by SHA-256. | [source-comparison.json](evidence/clean-rebuild/source-comparison.json) |
| Production browser preview and first/middle/last observed pages | **BLOCKED** by the documented preview/browser environment. Local file integrity is not a substitute for these observations. | [QA-REPORT.md](QA-REPORT.md) |

The final handoff also includes these reproduction records, the completed evidence ledger and the independent review. A final archive extraction is checked again after those documentation records are added. Evidence-only additions do not change the application source or its asset hashes.

## Local use on Windows

Extract `cargo-source.zip`, open PowerShell in its `cargo` folder, and use Node.js 24:

```powershell
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Keep the terminal running and stop it with **Ctrl+C** when finished. Use the same commands in a macOS or Linux terminal. Do not open the Vite entry file directly with `file://`.

For browser verification, a locally installed Edge or Chrome can be selected with `CARGO_BROWSER_CHANNEL` or `CARGO_BROWSER_EXECUTABLE`; see [browser-test-instructions.md](browser-test-instructions.md). This avoids depending on a successful additional browser download when a supported browser already exists locally. The optional browser checks still need to be actually run and visually reviewed before acceptance.

No private API key, environment secret, image-generation account, database, login or hosting service is needed to rebuild the application. The generated images and font notices are included. This reproduction verifies the source/build handoff; it does not declare the unobserved browser requirements passed.
