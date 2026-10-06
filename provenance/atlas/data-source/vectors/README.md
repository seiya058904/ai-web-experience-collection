# ATLAS vector source record

## Geographic extent

All exported GeoJSON coordinates use `[longitude, latitude]` in geographic
degrees (EPSG:4326 / GeoJSON order), decoded from the Web Mercator tile grid.
The website projects these through its shared geographic transform. No local
Cartesian coordinates are substituted for real geography in these files.

| Scope | West | South | East | North |
| --- | ---: | ---: | ---: | ---: |
| Fuji region | 138.54 | 35.24 | 138.99 | 35.61 |
| Fujiyoshida detail | 138.791 | 35.474 | 138.827 | 35.505 |

The persistent reference coordinate is `138.8079 E, 35.4875 N`, in the
Shimoyoshida area of Fujiyoshida. It is about 19 m north of the municipal-office
symbol in the source GSI tile; it is an exhibition anchor, not a survey marker.

## Sources and rights

### Geospatial Information Authority of Japan (GSI)

- Product: GSI Maps Vector, `experimental_bvmap`.
- Official specification and service record:
  <https://github.com/gsi-cyberjapan/gsimaps-vector-experiment>
- Tile URL: `https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf`
- 56 tiles at zoom 16 cover the city detail; 42 tiles at zoom 12 cover the region.
- The source repository states national coverage and a July 1, 2026 data update.
  Individual source features may represent older survey information.
- Acquired snapshot: October 6, 2026. Exact URLs, byte lengths and SHA-256 hashes
  of all 98 PBF files are in `sources.json`.
- Originals: `gsi/16/{x}/{y}.pbf` and `gsi/12/{x}/{y}.pbf` in this directory.
- Feature specification:
  <https://maps.gsi.go.jp/help/pdf/vector/dataspec.pdf>
- Attribute specification:
  <https://maps.gsi.go.jp/help/pdf/vector/attribute.pdf>

The current GSI content terms apply **Japan Public Data License 1.0 (PDL1.0)**
unless a particular dataset states otherwise. GSI requires source attribution
and identification of the processing performed by the downstream author.

- GSI terms, revised November 20, 2025:
  <https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html>
- PDL1.0 text:
  <https://www.digital.go.jp/resources/open_data/public_data_license_v1.0>

Suggested display credit:

> GSI Maps Vector · Processed by ATLAS. Building heights are schematic.

Suggested Japanese processing credit:

> 国土地理院の地理院地図Vectorを加工してATLASが作成。建物の高さは模式表現です。

These are GSI's own base-map vector layers. No OSM, Mapbox-hosted tiles,
commercial map API, access token, or live tile service is used by this export.
The Mapbox Vector Tile file format itself does not imply use of a Mapbox service.

### Natural Earth

- Product: Natural Earth **1:50 million land polygons**.
- Project: <https://www.naturalearthdata.com/>
- Official project repository:
  <https://github.com/nvkelso/natural-earth-vector>
- Original download:
  <https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson>
- Original retained as `natural-earth/ne_50m_land.geojson` in this directory.
- Original SHA-256:
  `e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b`
- License: **public domain**. Credit used: **Made with Natural Earth**.
- Terms: <https://www.naturalearthdata.com/about/terms-of-use/>

## Processing and interpretation

### Buildings

The source contains real mapped footprint polygons, including ordinary
buildings, robust buildings and open-sided structures. It does **not** provide
measured roof heights for this exhibit.

Buffered source-tile margins are removed first. The 19,492 remaining tile-core
polygon parts are repaired when clipping creates a zero-area connector, then
unioned at a `0.00000001°` precision grid. This produces 17,772 non-overlapping
mapped footprint components. Adjacent touching structures can share a component;
these counts must not be presented as an official building census.

The runtime uses two selections of those actual components:

- Desktop: 6,500 components, `city-buildings.geojson`.
- Mobile: 2,400 components, `city-buildings-mobile.geojson`.

Half of each selection follows the real-road route corridor. The remaining
budget is spread over a 24 by 24 geographic selection grid, with larger existing
footprints chosen first within each cell. This grid selects existing data and
never generates a building. The complete source is retained for other LODs.

Every exported component carries `schematic_height_m: 8` and
`height_is_schematic: true`. The 8 m value is a constant exhibition extrusion,
not a measurement or a claim about any individual structure. Merged component
IDs resolve to original tile feature IDs in `building-lineage.json.gz`.

### Roads and route

The road exports retain GSI road-centerline codes in the `2700–2799` range.
`major` and `bridge` flags derive from the source road attributes and codes.
Road edges and other duplicate cartographic representations are excluded.

`route.geojson` is an **authored exhibition traversal**, following real source
road geometry. It is not an observed journey or a recommended pedestrian route.
Its spherical-geodesic length is about **3,254.7 m**. The path runs from the
southwest part of the detail area through a mapped intersection near the anchor,
then toward the northeast. Already traversed edges are excluded to prevent a
visual U-turn.

Every output route segment has a corresponding source centerline feature ID in
`route-lineage.json`. The middle route intersection is about 28 m from the
persistent coordinate; the coordinate and authored route are distinct objects.
The route includes no synthesized connector over a building or water body.
Distance is calculated on the source geometry; no travel time is asserted.

### Rivers and lakes

The water exports retain actual GSI river centerlines, mapped water edges, lake
boundaries and water-area polygons. `properties.kind` distinguishes these
representations. Polygons may still be split at tile boundaries; all tile
buffers are removed, and invalid zero-area clipping connectors are repaired.
Feature geometry does not itself encode flow direction or hydraulic behavior.

The regional story must respect the actual watershed: the Katsura flows from
Lake Yamanaka through Oshino and Fujiyoshida. A surface river running directly
from Mount Fuji's summit must not be invented. Primary geographic context:

- Oshino Village: <https://www.vill.oshino.lg.jp/site/kanko/1598.html>
- Fujiyoshida City river description:
  <https://www.city.fujiyoshida.yamanashi.jp/uploaded/attachment/1967.pdf>

### Globe

The runtime keeps Natural Earth's 1,420 land features, using a modest `0.02°`
line simplification. A few narrow atoll rings use topology-preserving
simplification to avoid crossing their own shoreline. These are generalized
global coastlines appropriate to the orbit view, not local navigation geometry.
No generated image or invented land outline is used.

## Rebuilding the data

The ordinary website `install → build → preview` workflow uses the prepared
assets in `public/data/vectors`. It does not call these scripts or fetch tiles.

For an independent vector-preprocessing rebuild, install Python 3.10 or newer
and the small pinned optional geometry dependency, then run:

```sh
python -m pip install -r scripts/data/vectors/requirements.txt
python scripts/data/vectors/build.py
python scripts/data/vectors/validate.py
```

`build.py` reads the bundled originals, verifies their SHA-256 hashes, and
recreates the runtime vector assets without network access. Geometry merging
uses Shapely 2.1.2. The MVT format decoder in `mvt.py` is implemented using
Python's standard library.

To intentionally acquire a new upstream snapshot, separately run:

```sh
python scripts/data/vectors/fetch.py --refresh
python scripts/data/vectors/build.py
```

This refresh is optional. Upstream data and service availability can change;
the bundled source snapshot is the reproducible input for this edition.

`metadata.json` alongside the runtime assets records output counts and hashes.
`validation.json` in this source directory records geometry and lineage checks.
