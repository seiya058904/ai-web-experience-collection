# ATLAS derived geographic optical data

These files are reproducible derivatives of the unchanged `../vectors/globe-land.geojson` Natural Earth dataset. The source is public domain; its legacy `50m` name means **map scale 1:50,000,000**, not 50-metre precision.

The canonical raw files and gzip transport copies represent identical raster/geometry data. `DERIVATION.json` records source, generator, kernel, raw and packaged gzip hashes, dimensions, encoding, and compression version. See `../../../docs/OPTICS-DERIVATION.md` in the source project for provenance and technical detail (the docs directory is supplied with source and is not a deployed URL).

From the source project root, `node --experimental-transform-types scripts/derive-optics.mjs --check` regenerates and verifies the canonical bytes. Without `--check`, it rewrites all derived resources and their manifest. The browser uses gzip asynchronously where supported, with full-precision raw fallback. gzip encodings may vary by zlib version; decoded raw bytes must remain exact.

Reconstructed after workspace loss. All three raw hashes match their recorded pre-loss identities. This proves resource identity, not recovery of lost test evidence. The original MIT-licensed numerical algorithm and its notice remain in `scripts/optics-kernel.ts`.
