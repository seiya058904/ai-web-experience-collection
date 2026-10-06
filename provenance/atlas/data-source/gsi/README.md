# GSI source crops for ATLAS

These are real geographic data and photographic pixels from the Geospatial
Information Authority of Japan (GSI). They contain no AI-generated terrain,
satellite pixels, aerial pixels, or invented high-resolution detail.

## Included source inputs

| Source crop | Source layer | Zoom | Intended area |
| --- | --- | --- | --- |
| `regional-dem.png` | `dem_png` (DEM10B) | 12 | Fuji and the Fuji Five Lakes region |
| `regional-satellite.png` | `seamlessphoto` (Landsat 8 mosaic at this zoom) | 13 | The same region |
| `city-dem.png` | `dem_png` (DEM10B) | 14 | Fujiyoshida / Katsura River detail |
| `city-aerial.png` | `seamlessphoto` (aerial orthophotography at this zoom) | 16 | The same city detail |

Each image is a minimal **lossless spatial crop** assembled from original GSI
tile pixels. The original imagery tiles were JPEG; saving this assembled source
crop as PNG prevents another lossy encoding at the input stage. Each adjacent
JSON records the target bounds, source pixel edges, original tile URLs and
SHA-256 hashes, retrieval time, and the source crop's hash. Original tile caches
are not part of the deliverable.

Regional WGS84 bounds are **west 138.54°, south 35.24°, east 138.99°, north
35.61°**. The detail bounds are **west 138.791°, south 35.474°, east 138.827°,
north 35.505°**. The persistent coordinate is **35.4875° N, 138.8079° E**.

Both elevations and imagery use the same EPSG:3857 (Web Mercator) footprint.
Coordinates increase eastwards and southwards in the exported raster arrays.
Textures use `u = 0` at the west, `u = 1` at the east, `v = 0` at the north,
and `v = 1` at the south. Latitude is not linearly interpolated: it must be
converted through the Web Mercator formula. See `public/data/terrain.json` and
`public/data/city-raster.json` for precise runtime dimensions and encoding.

## Rebuild the runtime assets without network access

From the project root, with Python 3.10 or newer:

```sh
python -m pip install -r scripts/data/requirements.txt
python scripts/data/build_rasters.py
```

The ordinary website `npm install`, `npm run build`, and `npm run preview`
do **not** require Python. All preprocessed runtime assets are included.

To intentionally refresh the source snapshot from GSI, with internet access:

```sh
python scripts/data/acquire_gsi.py
python scripts/data/build_rasters.py
```

The acquisition script makes bounded XYZ requests with at most eight concurrent
downloads. It uses a system temporary directory for the original tile cache;
no API token is needed. Refreshing sources can change content and hashes because
GSI updates its data. Rebuilding from the included source crops preserves the
snapshot; that is the reliable offline rebuild path.

## Data processing and limits

DEM10B elevations originate from GSI's approximately 10 m grid, derived from
1:25,000 topographic contours. The downloaded z12 regional tiles have a coarser
approximately 31 m sample spacing at the latitude of this project; z14 detail
tiles are approximately 8 m. A displayed mesh does not have greater survey
accuracy because it has more vertices. Binary runtime samples are metres,
32-bit little-endian floats, without an embedded header.

GSI encodes heights in RGB with centimetre increments; those increments are an
encoding resolution, not centimetre survey accuracy. Values are decoded and
bilinearly resampled. The renderer may exaggerate vertical scale for legibility;
no exaggeration is baked into these elevation files.

### Contours stay on the rendered terrain mesh

`contours-100m.json` is generated from the **513 × 513 desktop grid**;
`contours-mobile.json` is generated separately from the **257 × 257 mobile
grid**. Both contain 100 m contours with a 500 m major interval. The renderer may
show fewer minor levels on a small screen, while retaining the same geography.

The grid has a fixed diagonal in every cell: `a = northwest`, `b = northeast`,
`c = southwest`, `d = southeast`; its triangles are `[a,c,b]` and `[b,c,d]`.
`scripts/data/mesh_contours.py` intersects those exact triangles with each
nominal height plane. It connects segments using the shared mesh edge or an
exact-level vertex identifier. Every triangle bend is retained. Only duplicate
and zero-length segments are removed; no approximate simplification cuts across
the terrain. UV coordinates are rounded to nine decimals.

The scene must pair each contour file with its matching terrain LOD and set a
line vertex's height to the recorded `elevation` in metres. Reusing desktop
contours on a coarser mesh, or re-sampling contour vertices with a different
interpolation rule, can create visible floating lines and is not supported.

At exact-height vertices, a `height >= contour level` superlevel boundary rule
resolves ties. Flat triangles at the level are omitted; a shared level edge is
emitted once. Graph junctions become polyline endpoints rather than an invented
join through a saddle or plateau.

The preprocessing pipeline verifies every exported point and every segment at
its quarter, midpoint and three-quarter positions with an independent
barycentric sampler of the matching mesh. The maximum height departures in the
included snapshot are **0.00003392 m for desktop** and **0.00002542 m for mobile**
(rounding error, not survey accuracy). The contour files and `terrain.json`
record source grid hashes, counts, output hashes and verification results.

The final contour algorithm uses NumPy directly; contourpy is not required.

The DEM is ground elevation and does not include building heights. Water
surface elevations can be less reliable than terrain; the processing metadata
records any no-data pixels and any nearest-valid fill. The acquisition refuses
to fabricate a large missing area. The included regional DEM has no missing
samples.

`seamlessphoto` is scale-dependent: **the regional texture is satellite imagery,
and the detail texture is aerial photography**. They are multi-date mosaics,
not a single exposure and not a live view. Their seam colors, snow, forests,
roads and land patterns remain those of the actual source pixels. ATLAS changes
lighting artistically during its time sequence; this is a visual simulation,
not a time series or a claim about actual illumination at a stated date.

## Attribution and license

The current GSI content terms, revised 20 November 2025, apply **Public Data
License 1.0 (PDL1.0)** unless an individual item states otherwise. This license
allows reuse including editing and commercial reuse, subject to its conditions.
It requires source attribution and identification of processing, and is
compatible with CC BY 4.0. The GSI tile catalog places DEM and these imagery
tiles in its section for material usable with source attribution. No logo is
included. These assets remain separately licensed from ATLAS source code.

Keep the following geographic credit in the site's credits and redistributions:

> Source: Geospatial Information Authority of Japan (GSI), GSI Tiles.
> Cropped, resampled, and rendered for ATLAS. PDL1.0.

For the regional Landsat mosaic retain the catalog's additional credit:

> Landsat8 imagery (GSI, TSIC, GEO Grid/AIST); Landsat8 imagery courtesy of the
> U.S. Geological Survey; bathymetry (GEBCO).

The Japanese catalog wording is:

> データソース：Landsat8画像（GSI,TSIC,GEO Grid/AIST）, Landsat8画像（courtesy of the U.S. Geological Survey）, 海底地形（GEBCO）

The GRUS/Axelspace exception documented for a distant southern island does not
intersect either included Fuji-area crop; no GRUS data is used here.

## Authoritative documentation

- Tile catalog and layer-specific credits: <https://maps.gsi.go.jp/help/use.html>
- GSI terms and required processing notice: <https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html>
- Full PDL1.0 terms: <https://www.digital.go.jp/resources/open_data/public_data_license_v1.0>
- PNG elevation decoding: <https://maps.gsi.go.jp/development/demtile.html>
- DEM lineage and resampling: <https://maps.gsi.go.jp/development/hyokochi.html>
- XYZ tile grid: <https://maps.gsi.go.jp/development/siyou.html>

These pages were checked on 6 October 2026. This document describes the included
snapshot and preprocessing; it does not imply that GSI endorses ATLAS.

## Geographic interpretation used in the scenes

The 1,025-node regional grid's highest sample is approximately 3,764.57 m,
at 35.36051° N, 138.72721° E. This is a sampled and resampled mesh maximum,
not a revised summit measurement. GSI's published Mount Fuji reference height
remains 3,776 m; the artwork may identify that reference separately from the
sampled terrain. Source:
<https://web1.gsi.go.jp/WNEW/PRESS-RELEASE/keikaku61003.html>.

The Katsura River is connected to Lake Yamanaka and Oshino's springs and flows
through Fujiyoshida. A visual water handoff must follow the actual watercourse;
it should not invent a surface river descending directly from Fuji's summit.
The city's geographic account documents this relationship:
<https://www.city.fujiyoshida.yamanashi.jp/uploaded/attachment/5294.pdf> and
<https://www.city.fujiyoshida.yamanashi.jp/uploaded/attachment/1967.pdf>.
