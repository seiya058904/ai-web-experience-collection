import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import {
  Geography,
  type RasterMeta,
  clamp,
  readGrid,
  readJSON,
  registeredDetail,
  smooth,
} from "../geo";
import type { StoryState } from "../story";

type Coordinate = [number, number];
type Ring = Coordinate[];
type SurfaceTrace = (
  a: Coordinate,
  b: Coordinate,
  offset: number,
  maxLength?: number,
) => THREE.Vector3[];
interface Feature {
  type: string;
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
}
interface Collection {
  features: Feature[];
}
type CommonUniforms = {
  uReveal: { value: number };
  uExtrude: { value: number };
  uVisibility: { value: number };
  uNight: { value: number };
  uCurvature: { value: number };
  uTime: { value: number };
  uSun: { value: THREE.Vector3 };
  uFog: { value: THREE.Color };
  uSpan: { value: number };
  uFogStrength: { value: number };
};

// The same distance interval and colour as the registered terrain floor.
const cityFog = /* glsl */ `
uniform vec3 uFog;
uniform float uSpan;
uniform float uFogStrength;
float cityHaze(vec3 worldPosition){
  return smoothstep(uSpan*1.5,uSpan*4.0,distance(cameraPosition,worldPosition))*uFogStrength;
}`;

const buildingVertex = /* glsl */ `
attribute float aExtrusion;
attribute float aFace;
attribute float aTopDistance;
attribute float aSeed;
attribute float aReveal;
uniform float uExtrude;
uniform float uCurvature;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
varying float vFace;
varying float vTopDistance;
varying float vSeed;
varying float vReveal;
void main() {
  vec3 p=position;
  p.y+=aExtrusion*uExtrude;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vWorld=p;
  vNormal=normal;
  vUv=vec2(uv.x,uv.y*uExtrude);
  vTopDistance=aTopDistance*uExtrude;
  vFace=aFace;
  vSeed=aSeed;
  vReveal=aReveal;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const buildingFragment = /* glsl */ `
uniform float uReveal;
uniform float uExtrude;
uniform float uVisibility;
uniform float uNight;
uniform vec3 uSun;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
varying float vFace;
varying float vTopDistance;
varying float vSeed;
varying float vReveal;
${cityFog}
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7))+vSeed*81.77)*43758.5453); }
void main() {
  float reveal=smoothstep(vReveal-0.06,vReveal+0.20,uReveal);
  float alpha=reveal*uVisibility;
  if(alpha<0.005) discard;
  float wall=step(0.5,vFace);
  vec3 n=normalize(vNormal);
  float light=max(0.0,dot(n,uSun));
  float variation=mix(0.94,1.06,vSeed);
  vec3 limestone=mix(vec3(0.57,0.565,0.525),vec3(0.73,0.705,0.635),1.0-wall);
  float shade=0.56+light*0.51;
  float grounded=mix(0.65,1.0,smoothstep(0.0,2.6,vUv.y));
  shade*=mix(1.0,grounded,wall);
  vec3 day=limestone*shade*variation;
  // A restrained roof lip gives the true footprint a readable, tangible edge.
  // Attach the roof lip to the actual level roof, including sloping foundations.
  float topBand=(1.0-smoothstep(0.5,1.2,vTopDistance))*smoothstep(0.0,0.25,vTopDistance);
  day+=wall*topBand*0.024;
  vec3 night=vec3(0.023,0.034,0.036)+limestone*(0.028+light*0.036);
  vec3 colour=mix(day,night,uNight);
  float golden=sin(uNight*3.14159265);
  colour*=mix(vec3(1.0),vec3(1.20,0.87,0.62),golden*0.60);
  // Windows are an explicitly schematic lighting treatment, not surveyed facades.
  vec2 windowUV=vUv/vec2(3.05,3.0);
  vec2 footprint=fwidth(windowUV);
  vec2 cell=fract(windowUV);
  vec2 aa=max(footprint,vec2(0.005));
  vec2 pane=smoothstep(vec2(0.20)-aa,vec2(0.20)+aa,cell)
            *(1.0-smoothstep(vec2(0.76)-aa,vec2(0.76)+aa,cell));
  float occupied=step(0.35,hash(floor(windowUV)));
  // At less than one pixel per cell, integrate area and occupancy rather
  // than allowing a binary window hash to sparkle under subpixel motion.
  float unresolved=smoothstep(0.25,0.85,max(footprint.x,footprint.y));
  float windows=mix(pane.x*pane.y*occupied,0.56*0.56*0.65,unresolved);
  float windowLight=windows*wall*step(1.0,vUv.y)*step(0.6,vTopDistance);
  colour+=vec3(0.88,0.46,0.14)*windowLight*uNight*smoothstep(0.25,0.95,uExtrude)*0.82;
  colour=mix(colour,uFog,cityHaze(vWorld)*0.985);
  gl_FragColor=vec4(colour,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const edgeVertex = /* glsl */ `
attribute float aExtrusion;
attribute float aReveal;
attribute float aTrace;
uniform float uExtrude;
uniform float uCurvature;
varying float vReveal;
varying float vTrace;
varying vec3 vWorld;
void main(){
  vec3 p=position;
  p.y+=aExtrusion*uExtrude;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vReveal=aReveal;
  vTrace=aTrace;
  vWorld=p;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const edgeFragment = /* glsl */ `
uniform float uReveal;
uniform float uVisibility;
uniform float uNight;
uniform float uExtrude;
varying float vReveal;
varying float vTrace;
varying vec3 vWorld;
${cityFog}
void main(){
  float local=clamp((uReveal-vReveal+0.08)/0.25,0.0,1.05);
  float trace=1.0-smoothstep(local-0.02,local+0.02,vTrace);
  float alpha=trace*uVisibility*mix(0.54,0.37,uExtrude);
  alpha*=1.0-cityHaze(vWorld);
  if(alpha<0.003)discard;
  vec3 day=vec3(0.12,0.13,0.105);
  vec3 night=vec3(0.14,0.19,0.17);
  gl_FragColor=vec4(mix(day,night,uNight),alpha);
  #include <colorspace_fragment>
}`;

const groundVertex = /* glsl */ `
uniform float uCurvature;
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vec3 p=position;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vUv=uv;
  vWorld=p;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const shadowFragment = /* glsl */ `
uniform float uReveal;
uniform float uExtrude;
uniform float uVisibility;
uniform float uNight;
varying vec2 vUv;
varying vec3 vWorld;
${cityFog}
void main(){
  float alpha=(1.0-smoothstep(0.0,1.0,vUv.y))*0.19*uExtrude*uVisibility
             *smoothstep(0.15,0.75,uReveal)*(1.0-uNight*0.55);
  alpha*=1.0-cityHaze(vWorld);
  gl_FragColor=vec4(0.025,0.028,0.022,alpha);
}`;

const waterFragment = /* glsl */ `
uniform float uReveal;
uniform float uVisibility;
uniform float uNight;
uniform float uTime;
varying vec3 vWorld;
${cityFog}
void main(){
  float drift=sin(vWorld.x*135.0+vWorld.z*87.0-uTime*0.22)*0.007;
  vec3 day=vec3(0.055,0.12,0.135)+drift;
  vec3 night=vec3(0.014,0.033,0.044);
  float alpha=smoothstep(0.0,0.45,uReveal)*uVisibility*0.57*(1.0-cityHaze(vWorld));
  gl_FragColor=vec4(mix(day,night,uNight),alpha);
  #include <colorspace_fragment>
}`;

const roadVertex = /* glsl */ `
attribute float aMajor;
uniform float uCurvature;
varying float vMajor;
varying vec3 vWorld;
void main(){
  vec3 p=position;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vMajor=aMajor;
  vWorld=p;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const roadFragment = /* glsl */ `
uniform float uReveal;
uniform float uVisibility;
uniform float uNight;
varying float vMajor;
varying vec3 vWorld;
${cityFog}
void main(){
  float alpha=smoothstep(0.02,0.68,uReveal)*uVisibility*mix(0.39,0.76,vMajor);
  alpha*=1.0-cityHaze(vWorld);
  vec3 day=mix(vec3(0.24,0.26,0.23),vec3(0.22,0.235,0.20),vMajor);
  vec3 night=mix(vec3(0.15,0.18,0.16),vec3(0.42,0.31,0.16),vMajor);
  gl_FragColor=vec4(mix(day,night,uNight),alpha);
  #include <colorspace_fragment>
}`;

function polygons(geometry: NonNullable<Feature["geometry"]>): Ring[][] {
  if (geometry.type === "Polygon") return [geometry.coordinates as Ring[]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates as Ring[][];
  return [];
}

function lines(geometry: NonNullable<Feature["geometry"]>): Ring[] {
  if (geometry.type === "LineString") return [geometry.coordinates as Ring];
  if (geometry.type === "MultiLineString")
    return geometry.coordinates as Ring[];
  return [];
}

function openRing(ring: Ring): Ring {
  const out: Ring = [];
  for (const p of ring) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  if (
    out.length > 2 &&
    out[0][0] === out.at(-1)![0] &&
    out[0][1] === out.at(-1)![1]
  )
    out.pop();
  return out;
}

/**
 * Split a mapped segment at every edge of the registered terrain triangles.
 * The three edge families are x=k, z=k, and x+z=k in DEM grid coordinates.
 * Linear interpolation between the resulting points therefore stays on the
 * displayed surface, including its shared edge collar, without raising roads.
 */
function surfaceSegment(
  a: THREE.Vector3,
  b: THREE.Vector3,
  from: Coordinate,
  to: Coordinate,
  surface: Geography,
  offset: number,
  maxLength = Infinity,
): THREE.Vector3[] {
  const scale = surface.size - 1;
  const x0 = from[0] * scale,
    z0 = from[1] * scale;
  const x1 = to[0] * scale,
    z1 = to[1] * scale;
  const cuts = [0, 1];
  for (const [start, end] of [
    [x0, x1],
    [z0, z1],
    [x0 + z0, x1 + z1],
  ]) {
    const delta = end - start;
    if (Math.abs(delta) < 1e-10) continue;
    const lower = Math.min(start, end),
      upper = Math.max(start, end);
    for (let edge = Math.floor(lower) + 1; edge < upper; edge++) {
      const t = (edge - start) / delta;
      if (t > 1e-9 && t < 1 - 1e-9) cuts.push(t);
    }
  }
  if (Number.isFinite(maxLength)) {
    const pieces = Math.max(1, Math.ceil(a.distanceTo(b) / maxLength));
    for (let i = 1; i < pieces; i++) cuts.push(i / pieces);
  }
  cuts.sort((left, right) => left - right);
  const points: THREE.Vector3[] = [];
  let previous = -1;
  for (const t of cuts) {
    if (t - previous < 1e-9) continue;
    const u = from[0] + (to[0] - from[0]) * t;
    const v = from[1] + (to[1] - from[1]) * t;
    points.push(
      new THREE.Vector3(
        a.x + (b.x - a.x) * t,
        surface.sampleMeshUV(u, v) / 1000 + offset,
        a.z + (b.z - a.z) * t,
      ),
    );
    previous = t;
  }
  return points;
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * A single registered city, built from real GSI footprints and centerlines.
 * All coordinates are local kilometres, east / up / south, using regional geo.
 * Building heights, facade lighting, and contact shade are exhibition treatments.
 * This class owns resources, not rendering, scrolling, RAFs, or DOM controls.
 */
export class CityLayer {
  readonly group = new THREE.Group();
  ready = false;
  readonly bounds = new THREE.Box3();
  readonly routeBounds = new THREE.Box3();
  readonly routeCenter = new THREE.Vector3();
  routeLength = 0;
  buildingCount = 0;

  private generation = 0;
  private readonly uniforms: CommonUniforms = {
    uReveal: { value: 0 },
    uExtrude: { value: 0 },
    uVisibility: { value: 0 },
    uNight: { value: 0 },
    uCurvature: { value: 0 },
    uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(-0.62, 0.74, -0.4).normalize() },
    uFog: { value: new THREE.Color("#eeede6") },
    uSpan: { value: 42 },
    uFogStrength: { value: 0 },
  };
  private readonly nightFog = new THREE.Color("#111d1e");
  private routePoints: THREE.Vector3[] = [];
  private routeDistances: number[] = [];
  private readonly routeDayColour = new THREE.Color(0xb9633d);
  private readonly routeNightColour = new THREE.Color(0xffca79);
  private routeLayers: {
    mesh: Line2;
    material: LineMaterial;
    kind: "context" | "glow" | "trace";
  }[] = [];
  private endpoint?: THREE.Group;
  private startpoint?: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private endpointMaterials: THREE.MeshBasicMaterial[] = [];
  private contactShade?: THREE.Mesh;
  private groundRoads?: THREE.LineSegments;
  private groundWater: (THREE.Mesh | THREE.LineSegments)[] = [];

  constructor() {
    this.group.name = "ATLAS / Fujiyoshida — registered city";
    this.group.visible = false;
  }

  async load(baseUrl: string, geo: Geography, mobile: boolean): Promise<void> {
    const token = ++this.generation;
    const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const size = mobile ? 129 : 257;
    const [meta, elevations, buildings, roads, water, route] =
      await Promise.all([
        readJSON<RasterMeta>(`${base}city-raster.json`),
        readGrid(`${base}city-elevation-${size}.bin`, size),
        readJSON<Collection>(
          `${base}vectors/city-buildings${mobile ? "-mobile" : ""}.geojson`,
        ),
        readJSON<Collection>(`${base}vectors/city-roads.geojson`),
        readJSON<Collection>(`${base}vectors/city-water.geojson`),
        readJSON<Collection>(`${base}vectors/route.geojson`),
      ]);
    if (token !== this.generation) return;
    this.clear();
    const detail = registeredDetail(geo, new Geography(meta, elevations, size));
    // The shared terrain floor has a 0.4 m display offset for depth separation.
    const project = (p: Coordinate, offset = 0.00065) =>
      geo
        .project(p[0], p[1], detail.height(p[0], p[1]))
        .add(new THREE.Vector3(0, offset, 0));
    const trace: SurfaceTrace = (a, b, offset, maxLength) =>
      surfaceSegment(
        project(a, offset),
        project(b, offset),
        detail.uv(...a),
        detail.uv(...b),
        detail,
        offset,
        maxLength,
      );
    this.bounds.setFromPoints([
      project([meta.west, meta.south]),
      project([meta.east, meta.north]),
    ]);
    // Sample expanded contact shade in the unchanged reference projection.
    const groundScale = geo.meta.groundScaleCosLatitude / 1000;
    const groundAt = (x: number, z: number) => {
      const mx = geo.anchorMercator[0] + x / groundScale;
      const my = geo.anchorMercator[1] - z / groundScale;
      const b = meta.mercatorBounds;
      return detail.sampleMeshUV((mx - b.west) / (b.east - b.west),
        (b.north - my) / (b.north - b.south)) / 1000 + 0.00065;
    };
    await this.buildBuildings(buildings, project, mobile, token, groundAt);
    if (token !== this.generation) return;
    this.buildRoads(roads, project, trace, mobile);
    this.buildWater(water, project, trace);
    this.buildRoute(route, project, trace, mobile);
    this.ready = true;
  }

  private material(
    vertexShader: string,
    fragmentShader: string,
    depthWrite = false,
  ) {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite,
      side: THREE.DoubleSide,
      forceSinglePass: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  private async buildBuildings(
    data: Collection,
    project: (p: Coordinate, offset?: number) => THREE.Vector3,
    mobile: boolean,
    token: number,
    groundAt: (x: number, z: number) => number,
  ) {
    const positions: number[] = [],
      normals: number[] = [],
      extrusion: number[] = [];
    const surfaceUV: number[] = [],
      faces: number[] = [],
      seeds: number[] = [],
      reveal: number[] = [],
      topDistances: number[] = [];
    const edgePositions: number[] = [],
      edgeExtrusion: number[] = [],
      edgeReveal: number[] = [],
      edgeTrace: number[] = [];
    const shadePositions: number[] = [],
      shadeUV: number[] = [];
    const append = (
      p: THREE.Vector3,
      n: THREE.Vector3,
      rise: number,
      u: number,
      v: number,
      face: number,
      seed: number,
      threshold: number,
      topDistance = 0,
    ) => {
      topDistances.push(topDistance);
      positions.push(p.x, p.y, p.z);
      normals.push(n.x, n.y, n.z);
      extrusion.push(rise);
      surfaceUV.push(u, v);
      faces.push(face);
      seeds.push(seed);
      reveal.push(threshold);
    };
    const appendEdge = (
      p: THREE.Vector3,
      rise: number,
      threshold: number,
      trace: number,
    ) => {
      edgePositions.push(p.x, p.y + 0.00045, p.z);
      edgeExtrusion.push(rise);
      edgeReveal.push(threshold);
      edgeTrace.push(trace);
    };
    const up = new THREE.Vector3(0, 1, 0);
    for (
      let featureIndex = 0;
      featureIndex < data.features.length;
      featureIndex++
    ) {
      const feature = data.features[featureIndex];
      if (!feature.geometry) continue;
      for (const polygon of polygons(feature.geometry)) {
        const rings = polygon.map(openRing).filter((r) => r.length >= 3);
        if (!rings.length) continue;
        const worldRings = rings.map((r) => r.map((p) => project(p)));
        const rings2D = worldRings.map((r) =>
          r.map((p) => new THREE.Vector2(p.x, p.z)),
        );
        const triangles = THREE.ShapeUtils.triangulateShape(
          rings2D[0],
          rings2D.slice(1),
        );
        if (!triangles.length) continue;
        const all = worldRings.flat();
        let cx = 0,
          cz = 0,
          base = -Infinity;
        for (const p of worldRings[0]) {
          cx += p.x;
          cz += p.z;
          base = Math.max(base, p.y);
        }
        cx /= worldRings[0].length;
        cz /= worldRings[0].length;
        const height =
          Number(feature.properties?.schematic_height_m ?? 8) / 1000;
        // The same upper footprint rises to a level schematic roof, retaining
        // actual DEM ground at each foundation vertex on sloping streets.
        const roof = base + clamp(height, 0.004, 0.016);
        const seed =
          (((Math.sin(cx * 113.7 + cz * 73.1) * 43758.5453) % 1) + 1) % 1;
        const threshold = clamp(Math.hypot(cx, cz) / 3.5, 0, 0.75);
        for (const triangle of triangles) {
          const [a, b, c] = triangle.map((i) => all[i]);
          for (const p of [a, b, c])
            append(
              p,
              up,
              roof - p.y,
              p.x * 1000,
              p.z * 1000,
              0,
              seed,
              threshold,
            );
        }
        for (let ringIndex = 0; ringIndex < worldRings.length; ringIndex++) {
          const ring = worldRings[ringIndex];
          const clockwise = THREE.ShapeUtils.isClockWise(rings2D[ringIndex]);
          const outward = (clockwise ? -1 : 1) * (ringIndex ? -1 : 1);
          let perimeter = 0;
          const lengths = ring.map((p, i) => {
            const d = p.distanceTo(ring[(i + 1) % ring.length]);
            perimeter += d;
            return d;
          });
          let travelled = 0;
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i],
              b = ring[(i + 1) % ring.length];
            const dx = b.x - a.x,
              dz = b.z - a.z,
              length = Math.hypot(dx, dz);
            if (length < 0.0001) continue;
            const normal = new THREE.Vector3(
              (dz * outward) / length,
              0,
              (-dx * outward) / length,
            );
            const ra = roof - a.y,
              rb = roof - b.y,
              wallLength = length * 1000;
            for (const [p, rise, u, v] of [
              [a, 0, 0, 0],
              [b, 0, wallLength, 0],
              [a, ra, 0, ra * 1000],
              [a, ra, 0, ra * 1000],
              [b, 0, wallLength, 0],
              [b, rb, wallLength, rb * 1000],
            ] as [THREE.Vector3, number, number, number][])
              append(p, normal, rise, u, v, 1, seed, threshold, (roof - p.y - rise) * 1000);
            appendEdge(a, ra, threshold, travelled / perimeter);
            appendEdge(b, rb, threshold, (travelled + lengths[i]) / perimeter);
            if (!mobile || i % 2 === 0) {
              appendEdge(a, 0, threshold, travelled / perimeter);
              appendEdge(a, ra, threshold, travelled / perimeter);
            }
            // Merged contact shade follows each real outline, rather than
            // rendering a separate shadow object for every building.
            const spread = 0.0018;
            const aa = new THREE.Vector3(
              a.x + normal.x * spread,
              groundAt(a.x + normal.x * spread, a.z + normal.z * spread) - 0.00006,
              a.z + normal.z * spread,
            );
            const bb = new THREE.Vector3(
              b.x + normal.x * spread,
              groundAt(b.x + normal.x * spread, b.z + normal.z * spread) - 0.00006,
              b.z + normal.z * spread,
            );
            for (const [p, uv] of [
              [a, [0, 0]],
              [b, [1, 0]],
              [aa, [0, 1]],
              [aa, [0, 1]],
              [b, [1, 0]],
              [bb, [1, 1]],
            ] as [THREE.Vector3, number[]][]) {
              shadePositions.push(p.x, p.y - 0.0001, p.z);
              shadeUV.push(...uv);
            }
            travelled += lengths[i];
          }
        }
        this.buildingCount++;
      }
      if (featureIndex > 0 && featureIndex % 800 === 0) {
        await tick();
        if (token !== this.generation) return;
      }
    }
    if (!this.buildingCount)
      throw new Error("The city footprint data is empty.");
    const geometry = new THREE.BufferGeometry();
    for (const [name, values, itemSize] of [
      ["position", positions, 3],
      ["normal", normals, 3],
      ["uv", surfaceUV, 2],
      ["aExtrusion", extrusion, 1],
      ["aFace", faces, 1],
      ["aTopDistance", topDistances, 1],
      ["aSeed", seeds, 1],
      ["aReveal", reveal, 1],
    ] as [string, number[], number][])
      geometry.setAttribute(
        name,
        new THREE.Float32BufferAttribute(values, itemSize),
      );
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(
      geometry,
      this.material(buildingVertex, buildingFragment, true),
    );
    mesh.name = "Real GSI footprints / schematic 8 m extrusion";
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    this.group.add(mesh);
    const edgeGeometry = new THREE.BufferGeometry();
    for (const [name, values, itemSize] of [
      ["position", edgePositions, 3],
      ["aExtrusion", edgeExtrusion, 1],
      ["aReveal", edgeReveal, 1],
      ["aTrace", edgeTrace, 1],
    ] as [string, number[], number][])
      edgeGeometry.setAttribute(
        name,
        new THREE.Float32BufferAttribute(values, itemSize),
      );
    const edges = new THREE.LineSegments(
      edgeGeometry,
      this.material(edgeVertex, edgeFragment),
    );
    edges.name = "Traced footprint → roof edges";
    edges.frustumCulled = false;
    edges.renderOrder = 6;
    this.group.add(edges);
    const shadeGeometry = new THREE.BufferGeometry();
    shadeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(shadePositions, 3),
    );
    shadeGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(shadeUV, 2),
    );
    const shade = new THREE.Mesh(
      shadeGeometry,
      this.material(groundVertex, shadowFragment),
    );
    shade.name = "Footprint contact shade";
    this.contactShade = shade;
    shade.visible = false;
    shade.renderOrder = 3;
    this.group.add(shade);
  }

  private buildRoads(
    data: Collection,
    project: (p: Coordinate, offset?: number) => THREE.Vector3,
    trace: SurfaceTrace,
    mobile: boolean,
  ) {
    const positions: number[] = [],
      major: number[] = [];
    for (const feature of data.features) {
      if (!feature.geometry) continue;
      const important =
        feature.properties?.major === true ||
        feature.properties?.bridge === true;
      for (const coordinates of lines(feature.geometry)) {
        for (let i = 0; i < coordinates.length - 1; i++) {
          const a = project(coordinates[i], 0.00085),
            b = project(coordinates[i + 1], 0.00085);
          if (
            mobile &&
            !important &&
            Math.min(Math.hypot(a.x, a.z), Math.hypot(b.x, b.z)) > 1.5
          )
            continue;
          const points = trace(coordinates[i], coordinates[i + 1], 0.00085);
          for (let j = 1; j < points.length; j++) {
            positions.push(...points[j - 1].toArray(), ...points[j].toArray());
            major.push(important ? 1 : 0, important ? 1 : 0);
          }
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("aMajor", new THREE.Float32BufferAttribute(major, 1));
    const roads = new THREE.LineSegments(
      geometry,
      this.material(roadVertex, roadFragment),
    );
    roads.name = "Registered GSI road centerlines";
    this.groundRoads = roads;
    roads.visible = false;
    roads.renderOrder = 4;
    this.group.add(roads);
  }

  private buildWater(
    data: Collection,
    project: (p: Coordinate, offset?: number) => THREE.Vector3,
    trace: SurfaceTrace,
  ) {
    const fill: number[] = [],
      outline: number[] = [];
    for (const feature of data.features) {
      if (!feature.geometry) continue;
      for (const polygon of polygons(feature.geometry)) {
        const rings = polygon
          .map(openRing)
          .filter((r) => r.length >= 3)
          .map((r) => r.map((p) => project(p, 0.00095)));
        if (!rings.length) continue;
        const flat = rings.flat(),
          r2 = rings.map((r) => r.map((p) => new THREE.Vector2(p.x, p.z)));
        for (const face of THREE.ShapeUtils.triangulateShape(
          r2[0],
          r2.slice(1),
        ))
          for (const index of face) {
            const p = flat[index];
            fill.push(p.x, p.y, p.z);
          }
      }
      for (const coordinates of lines(feature.geometry))
        for (let i = 0; i < coordinates.length - 1; i++) {
          const points = trace(coordinates[i], coordinates[i + 1], 0.001);
          for (let j = 1; j < points.length; j++)
            outline.push(...points[j - 1].toArray(), ...points[j].toArray());
        }
    }
    const material = this.material(groundVertex, waterFragment);
    for (const [positions, kind] of [
      [fill, "fill"],
      [outline, "line"],
    ] as [number[], string][]) {
      if (!positions.length) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
          new Float32Array((positions.length / 3) * 2),
          2,
        ),
      );
      const object =
        kind === "fill"
          ? new THREE.Mesh(geometry, material)
          : new THREE.LineSegments(geometry, material);
      object.name = `Registered GSI city water / ${kind}`;
      object.visible = false;
      this.groundWater.push(object);
      object.renderOrder = 3;
      this.group.add(object);
    }
  }

  private buildRoute(
    data: Collection,
    project: (p: Coordinate, offset?: number) => THREE.Vector3,
    trace: SurfaceTrace,
    mobile: boolean,
  ) {
    const feature = data.features.find(
      (f) => f.geometry?.type === "LineString",
    );
    if (!feature?.geometry)
      throw new Error("The registered route data is missing.");
    const source = feature.geometry.coordinates as Ring;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < source.length - 1; i++) {
      const segment = trace(source[i], source[i + 1], 0.00135, 0.008);
      points.push(...segment.slice(0, -1));
    }
    points.push(project(source.at(-1)!, 0.00135));
    this.routePoints = points;
    this.routeDistances = [0];
    for (let i = 1; i < points.length; i++)
      this.routeDistances.push(
        this.routeDistances[i - 1] + points[i - 1].distanceTo(points[i]),
      );
    this.routeLength = this.routeDistances.at(-1)!;
    this.routeBounds.setFromPoints(points);
    this.routeBounds.getCenter(this.routeCenter);
    const positions = points.flatMap((p) => [p.x, p.y, p.z]);
    const starts = this.routeDistances
      .slice(0, -1)
      .map((d) => d / this.routeLength);
    const ends = this.routeDistances.slice(1).map((d) => d / this.routeLength);
    for (const kind of ["context", "glow", "trace"] as const) {
      const geometry = new LineGeometry().setPositions(positions);
      geometry.setAttribute(
        "aRouteStart",
        new THREE.InstancedBufferAttribute(new Float32Array(starts), 1),
      );
      geometry.setAttribute(
        "aRouteEnd",
        new THREE.InstancedBufferAttribute(new Float32Array(ends), 1),
      );
      const material = new LineMaterial({
        color: kind === "context" ? 0xb29b72 : 0xdeb36a,
        linewidth:
          kind === "context" ? 1.25 : kind === "glow" ? (mobile ? 6 : 8) : 3,
        worldUnits: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
      });
      material.uniforms.uRouteProgress = { value: kind === "context" ? 1 : 0 };
      material.uniforms.uFog = this.uniforms.uFog;
      material.uniforms.uSpan = this.uniforms.uSpan;
      material.uniforms.uFogStrength = this.uniforms.uFogStrength;
      material.vertexShader = material.vertexShader.replace(
        "void main() {",
        `
        attribute float aRouteStart;
        attribute float aRouteEnd;
        varying float vRouteProgress;
        varying vec3 vRouteWorld;
        void main() {
          vRouteProgress=(position.y<0.5)?aRouteStart:aRouteEnd;
          vRouteWorld=(modelMatrix*vec4((position.y<0.5)?instanceStart:instanceEnd,1.0)).xyz;
      `,
      );
      material.fragmentShader = material.fragmentShader.replace(
        "void main() {",
        `
        uniform float uRouteProgress;
        varying float vRouteProgress;
        varying vec3 vRouteWorld;
        ${cityFog}
        void main() {
          if(vRouteProgress>uRouteProgress) discard;
      `,
      );
      material.fragmentShader = material.fragmentShader.replace(
        "gl_FragColor = vec4( diffuseColor.rgb, alpha );",
        "gl_FragColor = vec4( diffuseColor.rgb, alpha*(1.0-cityHaze(vRouteWorld)) );",
      );
      const mesh = new Line2(geometry, material);
      mesh.name = `Road-aligned exhibition route / ${kind}`;
      mesh.frustumCulled = false;
      mesh.renderOrder = kind === "context" ? 7 : kind === "glow" ? 8 : 9;
      this.group.add(mesh);
      this.routeLayers.push({ mesh, material, kind });
    }
    this.endpoint = new THREE.Group();
    this.endpoint.name = "Moving route endpoint";
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe9c17d,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffedc8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 40), ringMat);
    halo.rotation.x = -Math.PI / 2;
    halo.renderOrder = 11;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), coreMat);
    core.renderOrder = 11;
    this.endpoint.add(halo, core);
    this.group.add(this.endpoint);
    this.endpointMaterials = [ringMat, coreMat];
    const startMat = new THREE.MeshBasicMaterial({
      color: 0xcfb37e,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.startpoint = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1, 32),
      startMat,
    );
    this.startpoint.name = "Registered route start";
    this.startpoint.visible = false;
    this.startpoint.rotation.x = -Math.PI / 2;
    this.startpoint.position.copy(points[0]);
    this.startpoint.position.y += 0.0004;
    this.startpoint.renderOrder = 10;
    this.group.add(this.startpoint);
  }

  /** Arc-length interpolation from the southern start toward the northern end. */
  getRoutePoint(t: number): THREE.Vector3 | undefined {
    if (this.routePoints.length < 2) return undefined;
    const distance = clamp(t) * this.routeLength;
    let low = 0,
      high = this.routeDistances.length - 1;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (this.routeDistances[mid] <= distance) low = mid;
      else high = mid;
    }
    const fraction =
      (distance - this.routeDistances[low]) /
      Math.max(1e-10, this.routeDistances[high] - this.routeDistances[low]);
    return this.routePoints[low].clone().lerp(this.routePoints[high], fraction);
  }

  update(state: StoryState, time: number): void {
    this.group.visible = this.ready && state.cityVisibility > 0.001;
    if (!this.group.visible) return;
    const u = this.uniforms;
    u.uReveal.value = state.city;
    u.uExtrude.value = state.extrude;
    u.uVisibility.value = state.cityVisibility;
    u.uNight.value = state.night;
    u.uTime.value = time;
    u.uCurvature.value = state.curvature;
    u.uSpan.value = state.pose.span;
    u.uFogStrength.value = state.city * (1 - smooth(0.87, 0.91, state.p));
    u.uFog.value.set("#eeede6").lerp(this.nightFog, state.backdrop);
    u.uSun.value
      .set(
        -0.62 + Math.sin(time * 0.026) * 0.1,
        0.74 - state.night * 0.45,
        -0.4 + Math.cos(time * 0.02) * 0.07,
      )
      .normalize();
    // Cull only exactly zero shader contributions. Flat footprint roofs are
    // retained before extrusion, and each object is restored on reverse.
    if (this.contactShade)
      this.contactShade.visible = state.extrude > 0 && state.cityVisibility > 0 && smooth(0.15, 0.75, state.city) > 0;
    if (this.groundRoads)
      this.groundRoads.visible = state.cityVisibility > 0 && smooth(0.02, 0.68, state.city) > 0;
    for (const object of this.groundWater)
      object.visible = state.cityVisibility > 0 && smooth(0, 0.45, state.city) > 0;
    const traceVisibility =
      smooth(0, 0.015, state.route) * state.cityVisibility;
    for (const layer of this.routeLayers) {
      layer.material.uniforms.uRouteProgress.value =
        layer.kind === "context" ? 1 : state.route;
      layer.material.opacity =
        layer.kind === "context"
          ? state.cityVisibility * 0.15
          : layer.kind === "glow"
            ? traceVisibility * (0.12 + state.night * 0.1)
            : traceVisibility * 0.96;
      layer.mesh.visible = layer.material.opacity > 0.001;
      if (layer.kind !== "context")
        layer.material.color
          .copy(this.routeDayColour)
          .lerp(this.routeNightColour, state.night);
    }
    if (this.endpoint) {
      const position = this.getRoutePoint(state.route);
      if (position) {
        position.y += 0.001;
        this.endpoint.position.copy(position);
      }
      const radius = clamp(state.pose.span * 0.0047, 0.0038, 0.014);
      this.endpoint.scale.setScalar(radius * (1 + 0.05 * Math.sin(time * 1.6)));
      this.endpoint.visible = traceVisibility > 0.005;
      this.endpointMaterials.forEach((m) => {
        m.opacity = traceVisibility * 0.94;
      });
    }
    if (this.startpoint) {
      this.startpoint.scale.setScalar(
        clamp(state.pose.span * 0.0035, 0.003, 0.011),
      );
      this.startpoint.material.opacity = traceVisibility * 0.7;
      this.startpoint.visible = this.startpoint.material.opacity > 0;
    }
  }

  private clear(): void {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    this.group.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.LineSegments
      ) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.group.clear();
    this.routeLayers = [];
    this.routePoints = [];
    this.routeDistances = [];
    this.endpoint = undefined;
    this.startpoint = undefined;
    this.endpointMaterials = [];
    this.contactShade = undefined;
    this.groundRoads = undefined;
    this.groundWater = [];
    this.routeLength = 0;
    this.buildingCount = 0;
    this.ready = false;
    this.bounds.makeEmpty();
    this.routeBounds.makeEmpty();
    this.routeCenter.set(0, 0, 0);
  }

  dispose(): void {
    this.generation++;
    this.clear();
    this.group.visible = false;
  }
}
