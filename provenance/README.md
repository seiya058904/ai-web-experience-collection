# Source material and provenance

This directory is excluded from the website build. It preserves unique material and source/rights evidence, not caches or intermediate builds.

- `f1/`: five original image masters, prompts, font/circuit sources and design metadata. Local branded concept references are ignored.
- `glaze/`: original image-generation attribution, final image dimensions and SHA-256. Runtime files are under `public/glaze/`.
- `kage/`: the unique supplied offline edition and the provenance of its actual FRAME screenshot used by the gallery.
- `chronos/`: original image/technical attribution and design metadata; runtime art/Cormorant fonts and licenses live in `public/chronos/`; identical DM Sans fonts are shared with VERDANT in `public/shared/fonts/`.
- `deliveries/`: legacy import notes and the entry-by-entry SHA-256 manifest of the GLAZE, KAGE and CHRONOS deliveries.

The GLAZE/KAGE delivery ZIPs, extracted intermediate directories, compiled duplicates and standalone configs/startup scripts were removed after verified import. CHRONOS was imported and verified the same way; its external extraction was removed, while the ignored local root ZIP remains because final deletion was blocked by execution policy. All original entry hashes remain in `deliveries/import-manifest.json`.

The older VERDANT/ORBITAL ZIPs remain locally under ignored `deliveries/`. VERDANT contains unique original PNGs and design references absent from runtime source. ORBITAL preserves the original complete delivery, including unreconciled historical assets and font variants. These are not submitted or deployed; they have not been proven entirely disposable.

The supplied `kage/KAGE-VOID.html` retains its embedded licenses and historical offline behavior. Collection builds do not regenerate it; current workflow is in the [root README](../README.md).
