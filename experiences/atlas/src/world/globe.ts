import * as THREE from "three";
import { loadOpticsBytes, decodeFloat32LE } from "./optics-loader.ts";

/** Kilometres, in the same east / up / south tangent frame as the local terrain. */
export const EARTH_RADIUS_KM = 6371;
const ANCHOR_LONGITUDE = 138.8079;
const ANCHOR_LATITUDE = 35.4875;
const DEG = Math.PI / 180;
const ANCHOR_SIN = Math.sin(ANCHOR_LATITUDE * DEG);
const ANCHOR_COS = Math.cos(ANCHOR_LATITUDE * DEG);
const MASK_WIDTH = 4096;
const MASK_HEIGHT = 2048;
const DETAIL_BOUNDS = { west: 120, south: 24, east: 148, north: 49 };

/**
 * Geographic coordinates → anchor-relative spherical coordinates.
 * The anchor at sea level is (0, 0, 0); Earth's centre is (0, -6371, 0).
 * Increasing longitude points east (+x), increasing latitude points north (-z).
 */
export function geoToSphere(
  lon: number,
  lat: number,
  altKm = 0,
): THREE.Vector3 {
  const latitude = lat * DEG;
  const deltaLongitude = (lon - ANCHOR_LONGITUDE) * DEG;
  const radius = EARTH_RADIUS_KM + altKm;
  const cosLatitude = Math.cos(latitude);
  const sinLatitude = Math.sin(latitude);
  const cosDelta = Math.cos(deltaLongitude);
  return new THREE.Vector3(
    radius * cosLatitude * Math.sin(deltaLongitude),
    radius * (ANCHOR_SIN * sinLatitude + ANCHOR_COS * cosLatitude * cosDelta) -
      EARTH_RADIUS_KM,
    radius * (ANCHOR_SIN * cosLatitude * cosDelta - ANCHOR_COS * sinLatitude),
  );
}

type Position = [number, number];
export interface GlobeState {
  /** Root choreography enables this above the regional scale (about 150 km). */
  visibility: number;
  /** An authored lighting progression, not observational night imagery. */
  night: number;
  /** Seconds from the shared render loop. This layer never owns a RAF. */
  time: number;
}

const surfaceVertexShader = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vUv;
  varying vec3 vSurfaceNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vSurfaceNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    #include <logdepthbuf_vertex>
  }
`;

const surfaceFragmentShader = /* glsl */ `
  #include <logdepthbuf_pars_fragment>
  uniform sampler2D uLandMask;
  uniform sampler2D uRegionalCoast;
  uniform vec2 uTexel;
  uniform vec4 uRegionalBounds;
  uniform vec3 uOcean;
  uniform vec3 uLand;
  uniform vec3 uCoast;
  uniform vec3 uSunDirection;
  uniform float uVisibility;
  uniform float uNight;
  varying vec2 vUv;
  varying vec3 vSurfaceNormal;
  varying vec3 vWorldPosition;

  void main() {
    #include <logdepthbuf_fragment>
    vec2 uv = vec2(fract(vUv.x), clamp(vUv.y, 0.001, 0.999));
    float centre = texture2D(uLandMask, uv).r;
    float land = smoothstep(0.22, 0.78, centre);
    // The pale coastal margin is derived from the real land mask, never noise.
    float west = texture2D(uLandMask, uv - vec2(uTexel.x, 0.0)).r;
    float east = texture2D(uLandMask, uv + vec2(uTexel.x, 0.0)).r;
    float south = texture2D(uLandMask, uv - vec2(0.0, uTexel.y)).r;
    float north = texture2D(uLandMask, uv + vec2(0.0, uTexel.y)).r;
    float margin = clamp(max(max(west, east), max(south, north))
      - min(min(west, east), min(south, north)), 0.0, 1.0);

    // A narrow-band signed distance field of the actual NE edges replaces
    // magnified binary texels only while Japan is viewed at regional scale.
    vec2 detailUv = (uv - uRegionalBounds.xy) / uRegionalBounds.zw;
    float border = min(min(detailUv.x, detailUv.y), min(1.0 - detailUv.x, 1.0 - detailUv.y));
    float altitude = max(0.0, length(cameraPosition - vec3(0.0, -6371.0, 0.0)) - 6371.0);
    float detailWeight = smoothstep(0.0, 0.05, border) * (1.0 - smoothstep(2200.0, 6500.0, altitude));
    vec2 detailPixels = detailUv * 2048.0;
    float footprint = max(length(dFdx(detailPixels)), length(dFdy(detailPixels)));
    if (detailWeight > 0.001) {
      float distanceToCoast = (texture2D(uRegionalCoast, detailUv).r - 0.5) * 16.0;
      float antialias = max(0.035, footprint * 0.55);
      float exactLand = smoothstep(-antialias, antialias, distanceToCoast);
      float fineMargin = 1.0 - smoothstep(antialias * 0.55, antialias * 1.8, abs(distanceToCoast));
      land = mix(land, exactLand, detailWeight);
      margin = mix(margin, fineMargin, detailWeight);
    }

    vec3 normal = normalize(vSurfaceNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float sunlight = dot(normal, normalize(uSunDirection));
    float terminator = smoothstep(-0.24, 0.22, sunlight);
    float diffuse = pow(max(sunlight, 0.0), 0.62);
    float illumination = 0.18 + 0.70 * diffuse + 0.12 * terminator;
    vec3 colour = mix(uOcean, uLand, land) * illumination;
    colour = mix(colour, uCoast * (0.30 + 0.64 * diffuse), margin * 0.20);

    float specular = pow(max(dot(reflect(-normalize(uSunDirection), normal), viewDirection), 0.0), 110.0);
    colour += vec3(0.13, 0.16, 0.14) * specular * (1.0 - land) * terminator;
    float limb = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.5);
    colour += vec3(0.055, 0.11, 0.13) * limb * (0.20 + 0.80 * terminator);
    colour *= mix(1.0, 0.84, uNight);
    gl_FragColor = vec4(colour, uVisibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereVertexShader = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vSurfaceNormal;
  varying vec3 vWorldPosition;
  void main() {
    // A 38 km shell: a thin cartographic limb, with no cloud or star layer.
    vec3 expanded = position + normal * 38.0;
    vec4 worldPosition = modelMatrix * vec4(expanded, 1.0);
    vWorldPosition = worldPosition.xyz;
    vSurfaceNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    #include <logdepthbuf_vertex>
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  #include <logdepthbuf_pars_fragment>
  uniform float uVisibility;
  uniform vec3 uSunDirection;
  varying vec3 vSurfaceNormal;
  varying vec3 vWorldPosition;
  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vSurfaceNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normal, viewDirection)), 3.4);
    float daylight = 0.28 + 0.72 * smoothstep(-0.4, 0.65, dot(normal, uSunDirection));
    gl_FragColor = vec4(vec3(0.27, 0.48, 0.54), rim * daylight * uVisibility * 0.24);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Sphere positions are authored directly in the shared tangent frame, avoiding UV rotation guesses. */
function makeSphereGeometry(): THREE.BufferGeometry {
  const columns = 160;
  const rows = 96;
  const vertexCount = (columns + 1) * (rows + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];
  let vertex = 0;

  for (let row = 0; row <= rows; row++) {
    const latitude = 90 - (row / rows) * 180;
    for (let column = 0; column <= columns; column++) {
      const longitude = -180 + (column / columns) * 360;
      const point = geoToSphere(longitude, latitude);
      positions.set([point.x, point.y, point.z], vertex * 3);
      normals.set(
        [
          point.x / EARTH_RADIUS_KM,
          (point.y + EARTH_RADIUS_KM) / EARTH_RADIUS_KM,
          point.z / EARTH_RADIUS_KM,
        ],
        vertex * 3,
      );
      uvs.set([column / columns, 1 - row / rows], vertex * 2);
      vertex++;
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      if (row > 0) indices.push(a, c, b);
      if (row < rows - 1) indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function appendSurfaceSegment(
  target: number[],
  a: Position,
  b: Position,
  altitude: number,
): void {
  let deltaLongitude = b[0] - a[0];
  while (deltaLongitude > 180) deltaLongitude -= 360;
  while (deltaLongitude < -180) deltaLongitude += 360;
  const deltaLatitude = b[1] - a[1];
  // Subdivision keeps each chord above the sphere at this small surface offset.
  const parts = Math.max(
    1,
    Math.ceil(
      Math.max(Math.abs(deltaLongitude), Math.abs(deltaLatitude)) / 0.6,
    ),
  );
  let previous = geoToSphere(a[0], a[1], altitude);
  for (let part = 1; part <= parts; part++) {
    const t = part / parts;
    const next = geoToSphere(
      a[0] + deltaLongitude * t,
      a[1] + deltaLatitude * t,
      altitude,
    );
    target.push(previous.x, previous.y, previous.z, next.x, next.y, next.z);
    previous = next;
  }
}

function makeGraticule(): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let longitude = -180; longitude < 180; longitude += 15) {
    for (let latitude = -89; latitude < 89; latitude += 2) {
      appendSurfaceSegment(
        positions,
        [longitude, latitude],
        [longitude, Math.min(latitude + 2, 89)],
        2,
      );
    }
  }
  for (let latitude = -75; latitude <= 75; latitude += 15) {
    for (let longitude = -180; longitude < 180; longitude += 2) {
      appendSurfaceSegment(
        positions,
        [longitude, latitude],
        [longitude + 2, latitude],
        2,
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeBoundingSphere();
  return geometry;
}

/** The exact original mask/SDF texture formats and sampling settings. */
function makeOpticalTexture(bytes: Uint8Array, width: number, height: number, wrapped: boolean): THREE.DataTexture {
  const texture = new THREE.DataTexture(bytes, width, height, THREE.RedFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = wrapped ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A passive layer for the shared renderer. No camera, RAF, input, or DOM ownership.
 * Geography is exclusively the bundled, public-domain Natural Earth land GeoJSON.
 */
export class GlobeLayer {
  readonly group = new THREE.Group();
  private readonly sphereGeometry = makeSphereGeometry();
  private readonly surfaceMaterial: THREE.ShaderMaterial;
  private readonly atmosphereMaterial: THREE.ShaderMaterial;
  private readonly coastlineMaterial: THREE.LineBasicMaterial;
  private readonly graticuleMaterial: THREE.LineBasicMaterial;
  private readonly graticuleGeometry = makeGraticule();
  private coastlineGeometry: THREE.BufferGeometry | null = null;
  private landMask: THREE.DataTexture;
  private regionalCoast: THREE.DataTexture;
  private readonly sunDirection = new THREE.Vector3(
    -0.52,
    0.78,
    -0.35,
  ).normalize();
  private readonly abortController = new AbortController();
  private loadPromise: Promise<void> | null = null;
  private loaded = false;
  private disposed = false;

  constructor() {
    this.group.name = "ATLAS — geographic globe";
    this.group.visible = false;
    this.landMask = new THREE.DataTexture(
      new Uint8Array([0]),
      1,
      1,
      THREE.RedFormat,
    );
    this.landMask.needsUpdate = true;
    this.regionalCoast = new THREE.DataTexture(
      new Uint8Array([0]),
      1,
      1,
      THREE.RedFormat,
    );
    this.regionalCoast.needsUpdate = true;
    this.surfaceMaterial = new THREE.ShaderMaterial({
      name: "Mineral ocean and Natural Earth land",
      vertexShader: surfaceVertexShader,
      fragmentShader: surfaceFragmentShader,
      uniforms: {
        uLandMask: { value: this.landMask },
        uRegionalCoast: { value: this.regionalCoast },
        uTexel: { value: new THREE.Vector2(1 / MASK_WIDTH, 1 / MASK_HEIGHT) },
        uRegionalBounds: {
          value: new THREE.Vector4(
            (DETAIL_BOUNDS.west + 180) / 360,
            (DETAIL_BOUNDS.south + 90) / 180,
            (DETAIL_BOUNDS.east - DETAIL_BOUNDS.west) / 360,
            (DETAIL_BOUNDS.north - DETAIL_BOUNDS.south) / 180,
          ),
        },
        uOcean: { value: new THREE.Color("#325965") },
        uLand: { value: new THREE.Color("#c5c6a9") },
        uCoast: { value: new THREE.Color("#dde1c3") },
        uSunDirection: { value: this.sunDirection },
        uVisibility: { value: 0 },
        uNight: { value: 0 },
      },
      transparent: true,
      depthWrite: true,
    });
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      name: "Thin atmospheric limb",
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uVisibility: { value: 0 },
        uSunDirection: { value: this.sunDirection },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    this.coastlineMaterial = new THREE.LineBasicMaterial({
      color: "#dae1c9",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.graticuleMaterial = new THREE.LineBasicMaterial({
      color: "#becfc6",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const surface = new THREE.Mesh(this.sphereGeometry, this.surfaceMaterial);
    surface.name = "Earth — same tangent origin as Fujiyoshida";
    surface.renderOrder = -30;
    const graticule = new THREE.LineSegments(
      this.graticuleGeometry,
      this.graticuleMaterial,
    );
    graticule.name = "15 degree graticule";
    graticule.renderOrder = -27;
    const atmosphere = new THREE.Mesh(
      this.sphereGeometry,
      this.atmosphereMaterial,
    );
    atmosphere.name = "38 km atmospheric shell";
    atmosphere.renderOrder = -26;
    this.group.add(surface, graticule, atmosphere);
  }

  async load(baseUrl: string): Promise<void> {
    if (this.disposed)
      throw new Error("ATLAS globe: cannot load a disposed layer.");
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;
    const prefix = baseUrl ? `${baseUrl.replace(/\/$/, "")}/` : "./";
    this.loadPromise = this.loadLand(`${prefix}data/optics/`);
    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async loadLand(url: string): Promise<void> {
    // Same source geometry and optical precision, prepared before runtime.
    // Reconstructed after workspace loss; canonical bytes are independently hashed.
    const [maskBytes, regionalBytes, coastlineBytes] = await Promise.all([
      loadOpticsBytes(url, "globe-land-mask-4096x2048.bin", 8388608, this.abortController.signal),
      loadOpticsBytes(url, "japan-coast-distance-2048x2048.bin", 4194304, this.abortController.signal),
      loadOpticsBytes(url, "globe-coastlines-f32le.bin", 874464, this.abortController.signal),
    ]);
    if (this.disposed) return;
    const coastlinePositions = decodeFloat32LE(coastlineBytes);
    const mask = makeOpticalTexture(maskBytes, MASK_WIDTH, MASK_HEIGHT, true);
    mask.name = "Natural Earth 1:50,000,000 land — real polygon raster";
    const regionalCoast = makeOpticalTexture(regionalBytes, 2048, 2048, false);
    regionalCoast.name = "Natural Earth — Japan true-edge distance detail";
    const coastlines = new THREE.BufferGeometry();
    coastlines.setAttribute("position", new THREE.BufferAttribute(coastlinePositions, 3));
    coastlines.computeBoundingSphere();
    if (this.disposed) {
      mask.dispose();
      regionalCoast.dispose();
      coastlines.dispose();
      return;
    }
    this.landMask.dispose();
    this.landMask = mask;
    this.regionalCoast.dispose();
    this.regionalCoast = regionalCoast;
    this.surfaceMaterial.uniforms.uLandMask.value = mask;
    this.surfaceMaterial.uniforms.uRegionalCoast.value = regionalCoast;
    this.coastlineGeometry = coastlines;
    const coastline = new THREE.LineSegments(
      coastlines,
      this.coastlineMaterial,
    );
    coastline.name = "Natural Earth 1:50,000,000 coastline (map scale)";
    coastline.renderOrder = -28;
    this.group.add(coastline);
    this.loaded = true;
  }

  update(state: GlobeState): void {
    if (this.disposed) return;
    const visibility = THREE.MathUtils.clamp(
      Number.isFinite(state.visibility) ? state.visibility : 0,
      0,
      1,
    );
    const night = THREE.MathUtils.clamp(
      Number.isFinite(state.night) ? state.night : 0,
      0,
      1,
    );
    const time = Number.isFinite(state.time) ? state.time : 0;
    this.group.visible = this.loaded && visibility > 0.001;
    this.surfaceMaterial.uniforms.uVisibility.value = visibility;
    this.surfaceMaterial.uniforms.uNight.value = night;
    this.atmosphereMaterial.uniforms.uVisibility.value = visibility;
    this.coastlineMaterial.opacity = visibility * 0.4;
    this.graticuleMaterial.opacity = visibility * 0.13;
    // Small living hold: the geography is fixed; only the authored light drifts.
    this.sunDirection
      .set(-0.52 + Math.sin(time * 0.015) * 0.025, 0.78, -0.35)
      .normalize();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abortController.abort();
    this.group.visible = false;
    this.group.clear();
    this.sphereGeometry.dispose();
    this.graticuleGeometry.dispose();
    this.coastlineGeometry?.dispose();
    this.landMask.dispose();
    this.regionalCoast.dispose();
    this.surfaceMaterial.dispose();
    this.atmosphereMaterial.dispose();
    this.coastlineMaterial.dispose();
    this.graticuleMaterial.dispose();
  }
}
