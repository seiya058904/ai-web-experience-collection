#!/usr/bin/env node
/**
 * Verify the bundled geographic snapshot without network or third-party modules.
 * This checks actual files and numeric geometry, not merely stored PASS labels.
 */
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buffers = new Map();
const hashes = new Map();
const references = new Map();
const parsed = new Map();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const same = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

function localPath(relative) {
  assert(
    typeof relative === "string" && relative.length > 0,
    "A data path is empty.",
  );
  const absolute = path.resolve(root, relative);
  const within = path.relative(root, absolute);
  assert(
    within !== ".." &&
      !within.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(within),
    `Path leaves the project: ${relative}`,
  );
  return absolute;
}

async function bytes(relative) {
  if (!buffers.has(relative))
    buffers.set(relative, await readFile(localPath(relative)));
  return buffers.get(relative);
}

async function json(relative) {
  if (!parsed.has(relative))
    parsed.set(relative, JSON.parse((await bytes(relative)).toString("utf8")));
  return parsed.get(relative);
}

async function sha256(relative) {
  if (!hashes.has(relative))
    hashes.set(
      relative,
      createHash("sha256")
        .update(await bytes(relative))
        .digest("hex"),
    );
  return hashes.get(relative);
}

function collectReferences(value, prefix = "") {
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, prefix));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.path === "string" && typeof value.sha256 === "string") {
    const relative = prefix + value.path;
    assert(
      /^[a-f0-9]{64}$/i.test(value.sha256),
      `Invalid SHA-256 in reference: ${relative}`,
    );
    const previous = references.get(relative);
    assert(
      !previous || previous.sha256 === value.sha256,
      `Conflicting provenance hashes: ${relative}`,
    );
    references.set(relative, value);
  }
  Object.values(value).forEach((item) => collectReferences(item, prefix));
}

async function verifyReference(relative, record) {
  const content = await bytes(relative);
  if (record.bytes !== undefined)
    assert(content.length === record.bytes, `Byte count mismatch: ${relative}`);
  assert(
    (await sha256(relative)) === record.sha256.toLowerCase(),
    `SHA-256 mismatch: ${relative}`,
  );
}

async function allFiles(directory) {
  const entries = await readdir(localPath(directory), { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) output.push(...(await allFiles(relative)));
    else if (entry.isFile()) output.push(relative);
  }
  return output.sort();
}

async function readHeightGrid(record) {
  const relative = `public/data/${record.file}`;
  const buffer = await bytes(relative);
  assert(
    Number.isInteger(record.size) && record.size >= 2,
    `Invalid grid size: ${relative}`,
  );
  assert(
    buffer.length === record.size * record.size * 4,
    `Float32 grid dimensions do not match bytes: ${relative}`,
  );
  assert(
    (await sha256(relative)) === record.sha256,
    `Grid metadata hash mismatch: ${relative}`,
  );
  const values = new Float32Array(record.size * record.size);
  let minimum = Infinity,
    maximum = -Infinity;
  for (let index = 0; index < values.length; index++) {
    const value = buffer.readFloatLE(index * 4);
    assert(
      Number.isFinite(value),
      `Nonfinite elevation: ${relative}, sample ${index}`,
    );
    values[index] = value;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  assert(
    same(minimum, record.minimumElevationM, 1e-4) &&
      same(maximum, record.maximumElevationM, 1e-4),
    `Elevation range differs from metadata: ${relative}`,
  );
  return { values, size: record.size, minimum, maximum, file: record.file };
}

function sampleTriangle(grid, u, v) {
  const n = grid.size;
  const x = Math.max(0, Math.min(1, u)) * (n - 1),
    y = Math.max(0, Math.min(1, v)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x)),
    j = Math.min(n - 2, Math.floor(y));
  const tx = x - i,
    ty = y - j,
    index = j * n + i,
    h = grid.values;
  const a = h[index],
    b = h[index + 1],
    c = h[index + n],
    d = h[index + n + 1];
  return tx + ty <= 1
    ? a * (1 - tx - ty) + b * tx + c * ty
    : d * (tx + ty - 1) + b * (1 - ty) + c * (1 - tx);
}

async function verifyContours(variant, grids) {
  const relative = `public/data/${variant.file}`;
  const data = await json(relative);
  await verifyReference(relative, variant);
  const grid = grids.get(data.sourceGridFile);
  assert(
    grid && grid.size === variant.gridSize && data.sourceGridSize === grid.size,
    `Contour LOD is not paired to its source grid: ${relative}`,
  );
  assert(
    data.sourceGridSha256 === (await sha256(`public/data/${grid.file}`)),
    `Contour source grid hash mismatch: ${relative}`,
  );
  assert(
    data.intervalMetres === 100 && data.majorIntervalMetres === 500,
    `Unexpected contour intervals: ${relative}`,
  );
  assert(
    Array.isArray(data.lines) && data.lines.length > 0,
    `Contours are empty: ${relative}`,
  );
  let points = 0,
    segments = 0,
    samples = 0,
    maximumError = 0;
  const check = (u, v, elevation) => {
    assert(
      Number.isFinite(u) &&
        Number.isFinite(v) &&
        u >= 0 &&
        u <= 1 &&
        v >= 0 &&
        v <= 1,
      `Contour coordinate outside normalized bounds: ${relative}`,
    );
    const error = Math.abs(sampleTriangle(grid, u, v) - elevation);
    maximumError = Math.max(maximumError, error);
    samples++;
    assert(
      error <= 0.001,
      `Contour floats off its matching triangle mesh: ${relative}, error ${error.toFixed(6)} m`,
    );
  };
  for (const line of data.lines) {
    assert(
      Number.isFinite(line.elevation) && line.elevation % 100 === 0,
      `Invalid contour height: ${relative}`,
    );
    assert(
      line.major === (line.elevation % 500 === 0),
      `Contour major/minor flag is incorrect: ${relative}`,
    );
    assert(
      Array.isArray(line.points) && line.points.length >= 2,
      `Contour has too few vertices: ${relative}`,
    );
    for (const point of line.points) check(point[0], point[1], line.elevation);
    for (let i = 0; i < line.points.length - 1; i++) {
      const a = line.points[i],
        b = line.points[i + 1];
      assert(
        a[0] !== b[0] || a[1] !== b[1],
        `Zero-length contour segment: ${relative}`,
      );
      for (const t of [0.25, 0.5, 0.75])
        check(
          a[0] * (1 - t) + b[0] * t,
          a[1] * (1 - t) + b[1] * t,
          line.elevation,
        );
    }
    points += line.points.length;
    segments += line.points.length - 1;
  }
  assert(
    data.polylineCount === data.lines.length &&
      data.pointCount === points &&
      data.segmentCount === segments,
    `Contour counts are stale: ${relative}`,
  );
  assert(
    data.verification.sampleCount === samples &&
      maximumError <= data.verification.maximumAbsoluteHeightErrorM + 1e-7,
    `Stored contour verification no longer agrees with numeric data: ${relative}`,
  );
  return { samples, maximumError, lines: data.lines.length };
}

function geometryRings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function geometryLines(geometry) {
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
}

function checkCoordinates(value, bounds, file) {
  assert(
    Array.isArray(value) && value.length > 0,
    `Empty or malformed coordinates: ${file}`,
  );
  if (typeof value[0] === "number") {
    assert(
      value.length >= 2 && value.every(Number.isFinite),
      `Nonfinite GeoJSON coordinate: ${file}`,
    );
    const [lon, lat] = value;
    assert(
      lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90,
      `Invalid WGS84 coordinate: ${file}`,
    );
    if (bounds)
      assert(
        lon >= bounds[0] - 1e-7 &&
          lon <= bounds[2] + 1e-7 &&
          lat >= bounds[1] - 1e-7 &&
          lat <= bounds[3] + 1e-7,
        `GeoJSON coordinate outside its registered extent: ${file}`,
      );
    return 1;
  }
  return value.reduce(
    (total, item) => total + checkCoordinates(item, bounds, file),
    0,
  );
}

const pointKey = (point) =>
  `${Number(point[0]).toFixed(8)},${Number(point[1]).toFixed(8)}`;
function edgeKey(a, b) {
  const first = pointKey(a),
    second = pointKey(b);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function greatCircleMetres(a, b) {
  const radians = Math.PI / 180,
    latA = a[1] * radians,
    latB = b[1] * radians;
  const dLat = latB - latA,
    dLon = (b[0] - a[0]) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) ** 2;
  return (
    6371008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
  );
}

async function verifyVectors(provenance) {
  const metadata = await json("public/data/vectors/metadata.json");
  let coordinates = 0,
    features = 0,
    buildings = 0;
  const collections = new Map();
  for (const record of metadata.files) {
    const relative = `public/data/vectors/${record.file}`;
    await verifyReference(relative, record);
    const collection = await json(relative);
    assert(
      collection.type === "FeatureCollection" &&
        Array.isArray(collection.features),
      `Invalid GeoJSON collection: ${relative}`,
    );
    assert(
      collection.features.length === record.features,
      `GeoJSON feature count mismatch: ${relative}`,
    );
    const bounds =
      record.file.startsWith("city-") || record.file === "route.geojson"
        ? metadata.city_bounds
        : record.file.startsWith("region-")
          ? metadata.region_bounds
          : undefined;
    const ids = new Set();
    for (const feature of collection.features) {
      assert(
        feature.type === "Feature" && feature.geometry,
        `Empty GeoJSON feature: ${relative}`,
      );
      assert(
        [
          "Point",
          "MultiPoint",
          "LineString",
          "MultiLineString",
          "Polygon",
          "MultiPolygon",
        ].includes(feature.geometry.type),
        `Unsupported GeoJSON geometry: ${relative}`,
      );
      if (feature.id !== undefined) {
        assert(!ids.has(feature.id), `Duplicate feature ID: ${relative}`);
        ids.add(feature.id);
      }
      coordinates += checkCoordinates(
        feature.geometry.coordinates,
        bounds,
        relative,
      );
      for (const ring of geometryRings(feature.geometry)) {
        assert(
          ring.length >= 4 && pointKey(ring[0]) === pointKey(ring.at(-1)),
          `Unclosed polygon ring: ${relative}`,
        );
      }
      for (const line of geometryLines(feature.geometry))
        assert(line.length >= 2, `LineString has too few points: ${relative}`);
      if (record.file.startsWith("city-buildings")) {
        assert(
          ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
          `Building is not a mapped polygon: ${relative}`,
        );
        assert(
          feature.properties?.height_is_schematic === true &&
            feature.properties?.schematic_height_m === 8,
          `A building height is not explicitly schematic 8 m: ${relative}`,
        );
        buildings++;
      }
    }
    features += collection.features.length;
    collections.set(record.file, collection);
  }
  const routeCollection = collections.get("route.geojson");
  assert(
    routeCollection?.features.length === 1,
    "There must be one registered exhibition route.",
  );
  const route = routeCollection.features[0],
    routePoints = route.geometry.coordinates;
  assert(
    route.geometry.type === "LineString" &&
      route.properties.road_aligned === true &&
      route.properties.measured_route === false,
    "Route geographic interpretation is incorrect.",
  );
  const lineage = await json("data-source/vectors/route-lineage.json");
  assert(
    routePoints.length - 1 === lineage.segment_source_ids.length &&
      routePoints.length - 1 === provenance.route.source_segment_count,
    "Route segment lineage/count mismatch.",
  );
  const sourceEdges = new Map();
  for (const road of collections.get("city-roads.geojson").features) {
    const edges = new Set();
    for (const line of geometryLines(road.geometry))
      for (let i = 0; i < line.length - 1; i++)
        edges.add(edgeKey(line[i], line[i + 1]));
    sourceEdges.set(road.id, edges);
  }
  const traversed = new Set();
  let length = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const key = edgeKey(routePoints[i], routePoints[i + 1]);
    assert(
      sourceEdges.get(lineage.segment_source_ids[i])?.has(key),
      `Route segment ${i} does not follow its recorded GSI road.`,
    );
    assert(!traversed.has(key), `Route retraces segment ${i}.`);
    traversed.add(key);
    length += greatCircleMetres(routePoints[i], routePoints[i + 1]);
  }
  assert(
    same(length, lineage.distance_m, 0.051) &&
      same(length, provenance.route.length_metres, 0.051),
    "Route horizontal length does not match its source metadata.",
  );
  return {
    coordinates,
    features,
    buildings,
    collections: collections.size,
    routeSegments: traversed.size,
    routeMetres: length,
  };
}

async function main() {
  const provenance = await json("PROVENANCE.json");
  collectReferences(provenance);
  const sourceIndex = await json("data-source/vectors/sources.json");
  collectReferences(sourceIndex, "data-source/vectors/");
  assert(references.size > 0, "No provenance checksum references found.");
  for (const [relative, record] of references)
    await verifyReference(relative, record);
  const inventory = new Map(
    provenance.runtime_assets.map((record) => [record.path, record]),
  );
  const actual = await allFiles("public/data");
  assert(
    actual.length === inventory.size &&
      actual.every((file) => inventory.has(file)),
    "PROVENANCE runtime inventory does not cover exactly the bundled data files.",
  );
  const datasetIds = new Set(provenance.datasets.map((dataset) => dataset.id));
  for (const record of inventory.values())
    assert(
      record.source_ids?.length &&
        record.source_ids.every((id) => datasetIds.has(id)),
      `Missing data lineage: ${record.path}`,
    );
  const grids = new Map();
  let heightSamples = 0;
  const terrain = await json("public/data/terrain.json");
  for (const filename of ["terrain.json", "city-raster.json"]) {
    const metadata = await json(`public/data/${filename}`);
    for (const record of metadata.grids) {
      const grid = await readHeightGrid(record);
      grids.set(record.file, grid);
      heightSamples += grid.values.length;
    }
    for (const record of metadata.imagery.variants)
      await verifyReference(`public/data/${record.file}`, record);
  }
  assert(
    terrain.contours.variants?.length === 2,
    "Desktop/mobile contours must have separate matching grid variants.",
  );
  let contourSamples = 0,
    contourError = 0,
    contourLines = 0;
  for (const variant of terrain.contours.variants) {
    const result = await verifyContours(variant, grids);
    contourSamples += result.samples;
    contourLines += result.lines;
    contourError = Math.max(contourError, result.maximumError);
  }
  const vectors = await verifyVectors(provenance);
  console.log("Data verification PASS");
  console.log(
    `SHA-256: ${references.size} local provenance/source files; ${actual.length} runtime assets covered.`,
  );
  console.log(
    `Terrain: ${grids.size} grids, ${heightSamples.toLocaleString("en-US")} finite heights. Contours: ${contourLines} polylines, ${contourSamples.toLocaleString("en-US")} mesh checks, max error ${contourError.toFixed(8)} m.`,
  );
  console.log(
    `Vectors: ${vectors.collections} collections, ${vectors.features.toLocaleString("en-US")} features, ${vectors.coordinates.toLocaleString("en-US")} valid coordinates; ${vectors.buildings.toLocaleString("en-US")} explicitly schematic footprints.`,
  );
  console.log(
    `Route: ${vectors.routeSegments}/${vectors.routeSegments} segments match recorded real roads; ${vectors.routeMetres.toFixed(1)} m; no retraced segments.`,
  );
}

main().catch((error) => {
  console.error(`Data verification failed: ${error.message}`);
  process.exitCode = 1;
});
