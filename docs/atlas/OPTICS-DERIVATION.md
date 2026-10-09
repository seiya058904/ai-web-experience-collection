# Geographic optical resources

ATLAS prepares its globe land raster, Japanese coastline distance field, and coast-line vertex buffer before the browser runs. The browser asynchronously loads three compact gzip resources, then creates the same Three.js textures and geometry. It no longer parses the source GeoJSON or runs the full polygon raster and distance calculations during the scroll transition.

This implementation was reconstructed after a transient workspace loss. Its three uncompressed outputs match the canonical SHA-256 identities recorded before that loss. The original numerical functions were re-extracted from frozen upstream commit `186381f8da01aa8cf23771eb1514834d32b4d95c`. Matching derived bytes proves the data identity; it does not restore unavailable screenshots, browser measurements, or the exact previous generator source. Browser acceptance belongs to the current reconstructed build.

## Geographic source and precision

The preserved input is `public/data/vectors/globe-land.geojson`, from Natural Earth, public domain. Its SHA-256 is `658908cec877ace15313918399ff7172a090aaa1f10ff7b920e418382a6aa007`. Natural Earth's legacy `50m` label refers to **map scale 1:50,000,000**, not 50-metre precision. No coastline coordinates, polygon holes, tessellation rules, local anchor, or sphere dimensions were moved or simplified.

The offline kernel retains the original numeric bodies of `readPolygons`, `makeLandMask`, `makeRegionalCoast`, `appendSurfaceSegment`, `makeCoastlines`, and `geoToSphere`. The upstream `globe.ts` SHA-256 is `bcfb713f56fddf2fa32fd8f50799ce3e66d9ed3ce94337d82b6d4c5a8d4b9d6e`. Its MIT notice is retained in `scripts/optics-kernel.ts`.

| Resource | Encoding | Uncompressed size | Canonical SHA-256 |
|---|---|---:|---|
| `globe-land-mask-4096x2048.bin` | 4096 × 2048, red uint8 | 8,388,608 bytes | `b7bc4bbce8c68ef66f2b168570ae74fe1c9479667a543683c99ceaefa2250397` |
| `japan-coast-distance-2048x2048.bin` | 2048 × 2048, red uint8 signed-distance encoding | 4,194,304 bytes | `06db90e5a4bfd5c2ac118deecba89463393702ea4a9199d57466196c7cdd041f` |
| `globe-coastlines-f32le.bin` | 218,616 IEEE754 float32 values, little-endian XYZ | 874,464 bytes | `ee867d4fb499d39e01d88703933ff4c4de9ecf182733dcf3d159bc5f5122eba5` |

Raster row zero is south. The regional bounds remain west 120°, south 24°, east 148°, north 49°, and the encoded distance band remains 8 texels. Coastlines contain 72,872 vertices, in the original east/up/south tangent frame, kilometres, with the original 1.5 km display altitude. Runtime reads the float bytes explicitly as little-endian, including on hosts whose native byte order differs.

The original red texture format, unsigned-byte type, linear magnification, trilinear mipmapped minification, wrapping, mipmap generation, unpack alignment, and colour space are preserved. The globe surface and atmosphere shaders, sphere geometry, graticule, lighting, and geographic projection remain unchanged by this optimization.

## Rebuild and verify

From the project root after installing the locked dependencies:

```sh
node --experimental-transform-types scripts/derive-optics.mjs
node --experimental-transform-types scripts/derive-optics.mjs --check
node --experimental-transform-types --test tests/optics.test.mjs
```

The first command regenerates raw and gzip files plus `DERIVATION.json`. An optional `--output /some/directory` writes a comparison set outside the production resources. The second command reruns the original math and checks canonical raw bytes, source/kernel/generator hashes, packaged gzip hashes, and exact inflated equality.

Raw content is canonical. gzip container bytes can legitimately differ with zlib versions or compressor settings. Verification accepts different gzip encodings when each packaged gzip agrees with its recorded hash and decompresses to the canonical raw data. It never requires a newly generated gzip container to equal a container made by another zlib version. `DERIVATION.json` records the generator's Node and zlib versions and hashes the actual packaged copies.

## Runtime failure behavior and verification boundary

`loadOpticsBytes` prefers `*.bin.gz` when `DecompressionStream('gzip')` is available. A missing decompressor, failed gzip request, invalid gzip stream, missing stream body, or decoded byte-count mismatch falls back to the matching full-precision raw file. Cancellation propagates without starting a raw retry. A raw file with an incorrect length is rejected. Runtime performs byte-count checks and finite float checks; the generator, `--check`, and tests perform the content-hash verification.

The scoped tests exercise regeneration, valid alternative gzip encodings, corrupt package detection, every fallback branch, cancellation, endian decoding, actual `GlobeLayer` loading and texture parameters, visibility reversal, deduplicated concurrent load, and disposal during load. These CPU tests do not claim WebGL rendering, device-specific GPU performance, or complete site acceptance.
