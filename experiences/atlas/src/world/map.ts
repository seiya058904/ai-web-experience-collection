import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { Geography, readJSON, smooth } from "../geo";
import type { StoryState } from "../story";
import { observationRadius, observationFragment } from "./observation.ts";

type Coord = [number, number];
type Feature = {
  geometry: { type: string; coordinates: any };
  properties?: Record<string, unknown>;
};
type Collection = { features: Feature[] };
function paths(f: Feature): Coord[][] {
  const { type, coordinates: c } = f.geometry;
  if (type === "LineString") return [c];
  if (type === "MultiLineString" || type === "Polygon") return c;
  if (type === "MultiPolygon") return c.flat();
  return [];
}
function resample(points: THREE.Vector3[], count: number) {
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(distances[i - 1] + points[i].distanceTo(points[i - 1]));
  const out: THREE.Vector3[] = [];
  let cursor = 1;
  for (let i = 0; i < count; i++) {
    const d = (i / (count - 1)) * distances.at(-1)!;
    while (cursor < points.length - 1 && distances[cursor] < d) cursor++;
    const t =
      (d - distances[cursor - 1]) /
      Math.max(1e-9, distances[cursor] - distances[cursor - 1]);
    out.push(points[cursor - 1].clone().lerp(points[cursor], t));
  }
  return out;
}
const mapVertex = /* glsl */ `
uniform float uLift;
uniform float uCurvature;
varying vec2 vMap;
void main(){
  vec3 p=position;vMap=p.xz;
  p.y=p.y*uLift+0.013;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const mapFragment = /* glsl */ `
uniform vec3 uColour;
uniform float uOpacity;
varying vec2 vMap;
${observationFragment}
void main(){
  float alpha=uOpacity*observationExposure(vMap);
  if(alpha<=0.0)discard;
  gl_FragColor=vec4(uColour,alpha);
  #include <colorspace_fragment>
}`;

export class MapLayer {
  group = new THREE.Group();
  private materials: THREE.ShaderMaterial[] = [];
  private water?: THREE.LineSegments;
  private roads?: THREE.LineSegments;
  private waterMesh?: THREE.Mesh;
  private shared?: Line2;
  private contourPoints: THREE.Vector3[] = [];
  private riverPoints: THREE.Vector3[] = [];
  private sharedPositions = new Float32Array(256 * 3);
  private previousMorph = -1;
  private previousLift = -1;
  private width = 1920;
  private height = 1080;
  constructor(private geo: Geography) {}
  private material(colour: string) {
    const m = new THREE.ShaderMaterial({
      vertexShader: mapVertex,
      fragmentShader: mapFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColour: { value: new THREE.Color(colour) },
        uOpacity: { value: 0 },
        uLift: { value: 0 },
        uCurvature: { value: 0 },
        uObservationRadius: { value: 50 },
      },
    });
    this.materials.push(m);
    return m;
  }
  async load(base: string, mobile = false) {
    const [water, roads, contours] = await Promise.all([
      readJSON<Collection>(base + "vectors/region-water.geojson"),
      readJSON<Collection>(base + "vectors/region-roads.geojson"),
      readJSON<{ lines: { elevation: number; points: [number, number][] }[] }>(
        base + (mobile ? "contours-mobile.json" : "contours-100m.json"),
      ),
    ]);
    const waterVertices: number[] = [],
      roadVertices: number[] = [],
      fillVertices: number[] = [];
    const rivers: THREE.Vector3[][] = [];
    const addLines = (f: Feature, out: number[]) => {
      for (const path of paths(f)) {
        const pts = path.map((c) => this.geo.project(...c));
        for (let i = 0; i < pts.length - 1; i++)
          out.push(...pts[i].toArray(), ...pts[i + 1].toArray());
        if (
          f.geometry.type === "LineString" &&
          f.properties?.kind === "river_centerline" &&
          pts.length > 8
        )
          rivers.push(pts);
      }
    };
    for (const f of water.features) {
      addLines(f, waterVertices);
      if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
        const polygons =
          f.geometry.type === "Polygon"
            ? [f.geometry.coordinates]
            : f.geometry.coordinates;
        for (const poly of polygons) {
          if (!poly[0] || poly[0].length < 4) continue;
          const rings = poly.map((r: Coord[]) =>
            r.slice(0, -1).map((c) => this.geo.project(...c)),
          );
          const contour = rings[0].map(
            (p: THREE.Vector3) => new THREE.Vector2(p.x, p.z),
          );
          const holes = rings
            .slice(1)
            .map((r: THREE.Vector3[]) =>
              r.map((p) => new THREE.Vector2(p.x, p.z)),
            );
          const flat = rings.flat();
          const tris = THREE.ShapeUtils.triangulateShape(contour, holes);
          for (const triangle of tris)
            for (const i of triangle) fillVertices.push(...flat[i].toArray());
        }
      }
    }
    for (const f of roads.features) addLines(f, roadVertices);
    const makeLines = (points: number[], colour: string) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const l = new THREE.LineSegments(g, this.material(colour));
      l.frustumCulled = false;
      l.visible = false;
      this.group.add(l);
      return l;
    };
    this.water = makeLines(waterVertices, "#345c5e");
    this.roads = makeLines(roadVertices, "#838471");
    const fill = new THREE.BufferGeometry();
    fill.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(fillVertices, 3),
    );
    this.waterMesh = new THREE.Mesh(fill, this.material("#37595a"));
    this.waterMesh.renderOrder = 2;
    this.waterMesh.visible = false;
    this.group.add(this.waterMesh);
    const chosen = contours.lines
      .filter((l) => l.elevation === 1500)
      .sort((a, b) => b.points.length - a.points.length)[0];
    if (chosen) {
      this.contourPoints = resample(
        chosen.points.map((p) =>
          this.geo.pointUV(p[0], p[1], chosen.elevation),
        ),
        256,
      );
    }
    // Preserve factual geometry at both ends of the graphic handoff.
    // This is a change of layer identity, never a claim that a contour is runoff.
    const nearAnchor = (r: THREE.Vector3[]) =>
      Math.min(...r.map((p) => Math.hypot(p.x, p.z)));
    const localRiver = rivers
      .filter((r) => nearAnchor(r) < 5)
      .sort((a, b) => nearAnchor(a) - nearAnchor(b))[0];
    if (localRiver) this.riverPoints = resample(localRiver, 256);
    if (this.contourPoints.length) {
      const g = new LineGeometry();
      g.setPositions(this.contourPoints.flatMap((p) => p.toArray()));
      const m = new LineMaterial({
        color: "#b9633d",
        linewidth: 1.7,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
      });
      m.resolution.set(this.width, this.height);
      this.shared = new Line2(g, m);
      this.shared.frustumCulled = false;
      this.shared.visible = false;
      this.shared.renderOrder = 5;
      this.group.add(this.shared);
    }
  }
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.shared)
      (this.shared.material as LineMaterial).resolution.set(width, height);
  }
  update(s: StoryState) {
    this.group.visible = s.p > 0.1 && s.p < 0.954;
    for (const m of this.materials) {
      m.uniforms.uLift.value = s.lift;
      m.uniforms.uCurvature.value = s.curvature;
      m.uniforms.uObservationRadius.value = observationRadius(s.p, s.baseSpan);
    }
    if (this.water)
      (this.water.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
        (0.12 * smooth(0.13, 0.18, s.p) + s.water * 0.63) *
        (1 - s.aerial * 0.9) *
        s.terrainVisibility;
    if (this.waterMesh)
      (
        this.waterMesh.material as THREE.ShaderMaterial
      ).uniforms.uOpacity.value =
        s.water *
        0.88 *
        (1 - s.drape * 0.72) *
        (1 - s.aerial) *
        s.terrainVisibility;
    if (this.roads)
      (this.roads.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
        smooth(0.155, 0.205, s.p) * 0.16 * (1 - s.aerial) * s.terrainVisibility;
    // Cull only zero contribution. Water retains its real residual opacity.
    for (const object of [this.water, this.waterMesh, this.roads]) {
      if (object) object.visible = (object.material as THREE.ShaderMaterial).uniforms.uOpacity.value > 0;
    }
    if (this.shared && this.group.visible) {
      const morph = smooth(0.425, 0.466, s.p),
        draw = smooth(0.128, 0.203, s.p);
      if (morph !== this.previousMorph || s.lift !== this.previousLift) {
        for (let i = 0; i < 256; i++) {
          const a = this.contourPoints[i],
            b = this.riverPoints[i] || a;
          this.sharedPositions[i * 3] = THREE.MathUtils.lerp(a.x, b.x, morph);
          this.sharedPositions[i * 3 + 2] = THREE.MathUtils.lerp(
            a.z,
            b.z,
            morph,
          );
          this.sharedPositions[i * 3 + 1] =
            THREE.MathUtils.lerp(a.y, b.y, morph) * s.lift + 0.02;
        }
        const attribute = this.shared.geometry.getAttribute(
          "instanceStart",
        ) as THREE.InterleavedBufferAttribute;
        const segments = attribute.data.array;
        for (let i = 0; i < 255; i++)
          for (let c = 0; c < 3; c++) {
            segments[i * 6 + c] = this.sharedPositions[i * 3 + c];
            segments[i * 6 + 3 + c] = this.sharedPositions[(i + 1) * 3 + c];
          }
        attribute.data.needsUpdate = true;
        this.previousMorph = morph;
        this.previousLift = s.lift;
      }
      (this.shared.material as LineMaterial).opacity =
        draw * 0.9 * (1 - smooth(0.545, 0.625, s.p));
      this.shared.visible = (this.shared.material as LineMaterial).opacity > 0;
    } else if (this.shared) {
      this.shared.visible = false;
    }
  }
  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}
