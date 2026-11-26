---
name: collection-add-work
description: Use when integrating a new supplied website ZIP as an independent work in AI Web Experience Collection (inventory, import boundary, Vite/verify registration, gallery updates, provenance manifest, and project-path verification).
---

# Adding a Supplied Website ZIP

Keep the work's established identity, content, controls, motion, and accessibility behavior; integrate existing source rather than rebuilding.

1. **Inventory before extraction**: record ZIP byte length, SHA-256, entry count, and mtime. Check for single top-level directory, path traversal/absolute paths, nested archives, compiled duplicates, lockfiles, startup scripts, and attribution/license records. Extract only to a fresh directory outside the repository; never commit or deploy the original ZIP.
2. **Smallest import boundary**: place runtime source in `experiences/<route>/`, page in `pages/<route>/`, namespaced assets/fonts/licenses in `public/<route>/`, and docs/records in `docs/<route>/` and `provenance/<route>/`. Preserve byte-sensitive assets and upstream licenses. Never copy upstream `dist/` (note: legacy `resonance` upstream `dist/` was editable source), `node_modules/`, lockfiles, or standalone build configs; reuse the root lockfile (dependency changes require separate authorization).
3. **Navigation & runtime boundaries**: register the HTML input and sitemap URL in `vite.config.ts`; add route, title, canonical/social identity, and output/license assertions in `scripts/verify-build.mjs`. Keep base-aware links, shared Collection return control, and independent lifecycle/clock; Collection home must remain useful without JS and must not import work runtimes.
4. **Update all collection records together**: add one native-link gallery entrance (real work media or runtime capture), Index row, and spectrum strip in matching order (gallery layout follows the Collection design contract). Update homepage copy/social alt text, About/credits/license links, `README.md`, `PRODUCT.md`, `AGENTS.md` (if invariants change), Collection design contract, `ATTRIBUTION.md`, and work docs. Keep independent work names and honest illustrative disclosures.
5. **Provenance**: record ZIP hash and per-entry path/size/SHA-256 in `provenance/deliveries/import-manifest.json`; preserve prompts/sources/fonts/licenses under `provenance/` or `public/`; log omitted compiled duplicates and verify imported asset hashes. Never delete uncertain originals.
6. **Verify before closeout**: run focused work checks, `npm test`, `npm run build`, `npm run verify:build`, and `git diff --check`. Also build with `--base=/ai-web-experience-collection/`, re-run `npm run verify:build`, and verify in a real browser: home→work, direct load/refresh, return-to-Collection, local fonts/media, primary controls, desktop/mobile layout, reduced motion, resize, and tab recovery.
