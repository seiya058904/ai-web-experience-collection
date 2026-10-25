# MURMURATION — integration architecture

`pages/murmuration/index.html` is the independent document; `experiences/murmuration/src/main.js` owns one Lenis instance with `autoRaf:false`, the GSAP ticker, chapter navigation, the field controls, reflection/export and dialogs. `model.js` is pure flock dynamics, `session.js` the reversible session, `recording.js` sampling and packing, `renderer.js` the Canvas 2D field, `record-worker.js` the reconstruction fallback.

- **Sources:** `experiences/murmuration/src/` plus `hero.json` (opening frame data).
- **Assets:** `public/murmuration/records/flight.bin.gz` and `meta.json`, `public/murmuration/sky.webp`, posters, fonts, `LICENSE.txt` and `THIRD_PARTY_NOTICES.md`.
- **Base awareness:** the recording fetch now resolves `import.meta.env.BASE_URL + 'murmuration/records/flight.bin.gz'`; the sky now resolves `import.meta.env.BASE_URL + 'murmuration/sky.webp'` instead of a source-relative `../public/` path; stylesheet font and sky URLs moved to `/murmuration/`.
- **Dependencies:** supplied `gsap 3.15.0` matches; `lenis 1.3.27` is replaced by the locked `1.3.26`.
- **Tests:** `tests/murmuration-model.test.mjs` keeps the supplied determinism, sampling, session and byte-for-byte reconstruction checks. The propagation check that read an upstream QA artefact is not part of this suite.
