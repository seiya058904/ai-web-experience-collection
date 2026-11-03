import {
  BackSide, BufferAttribute, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide, FrontSide, HemisphereLight, Mesh,
  MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Scene, ShadowMaterial, Vector3, WebGLRenderer,
} from 'three';
import { SHEET } from './model.js';

const COBALT = '#1c39c9';
const PAPER = '#f4f5f6';
const INK = '#0d1433';
const rad = (d) => (d * Math.PI) / 180;

// Washi-like fibres: faint marks that catch the light and never read as a pattern.
function fiberTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, size, size);
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 2600; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const a = random() * Math.PI * 2;
    const l = 8 + random() * 34;
    c.strokeStyle = `rgba(${random() < 0.5 ? '0,0,20' : '255,255,255'},${0.03 + random() * 0.06})`;
    c.lineWidth = 0.5 + random() * 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (random() - 0.5) * 12, y + Math.sin(a) * l * 0.5 + (random() - 0.5) * 12, x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class SheetRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.kind = 'webgl';
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    this.renderer = renderer;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(30, 1, 0.1, 40);
    this.camera.up.set(0, 0, 1);

    this.scene.add(new HemisphereLight('#ffffff', '#a4afca', 1.75));
    const key = new DirectionalLight('#ffffff', 2.15);
    key.position.set(-2.4, -1.6, 4.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -2.6;
    key.shadow.camera.right = 2.6;
    key.shadow.camera.top = 2.6;
    key.shadow.camera.bottom = -2.6;
    key.shadow.camera.far = 12;
    key.shadow.radius = 5;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.008;
    this.scene.add(key);

    const ground = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ color: INK, opacity: 0.2 }));
    ground.position.z = -0.002;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.creaseCanvas = document.createElement('canvas');
    this.creaseCanvas.width = 2048;
    this.creaseCanvas.height = Math.round(2048 / (SHEET.width / SHEET.height));
    this.creaseTexture = new CanvasTexture(this.creaseCanvas);
    this.creaseTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.uniforms = { uCrease: { value: this.creaseTexture }, uReveal: { value: 0 }, uLineAlpha: { value: 1 } };

    const fiber = fiberTexture();
    fiber.wrapS = RepeatWrapping;
    fiber.wrapT = RepeatWrapping;
    this.geometry = new BufferGeometry();
    this.capacity = 0;
    this.ensure(600);
    const material = (color, line, side) => {
      const m = new MeshStandardMaterial({ color, roughness: 0.84, metalness: 0, map: fiber, side, shadowSide: DoubleSide });
      m.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, this.uniforms);
        shader.uniforms.uLine = { value: new Color(line) };
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform sampler2D uCrease;uniform float uReveal,uLineAlpha;uniform vec3 uLine;')
          .replace('#include <map_fragment>', `#include <map_fragment>
            float creaseMark=texture2D(uCrease,vMapUv).a;
            float creaseWipe=smoothstep(uReveal*1.05,uReveal*1.05-.08,length((vMapUv-.5)*vec2(1.,.71)));
            diffuseColor.rgb=mix(diffuseColor.rgb,uLine,creaseMark*creaseWipe*uLineAlpha);`);
      };
      return m;
    };
    this.front = new Mesh(this.geometry, material(COBALT, '#ffffff', FrontSide));
    this.back = new Mesh(this.geometry, material(PAPER, COBALT, BackSide));
    for (const mesh of [this.front, this.back]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
    this.back.castShadow = false;
    this.target = new Vector3(0, 0, 0.06);
  }

  ensure(triangles) {
    if (triangles <= this.capacity) return;
    this.capacity = Math.max(triangles, this.capacity * 2);
    const size = this.capacity * 3;
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(size * 3), 3));
    this.geometry.setAttribute('normal', new BufferAttribute(new Float32Array(size * 3), 3));
    this.geometry.setAttribute('uv', new BufferAttribute(new Float32Array(size * 2), 2));
  }

  // The pattern is printed on the paper itself, so it folds with the facets and needs no line geometry.
  setCreases(creases) {
    const { width, height } = this.creaseCanvas;
    const c = this.creaseCanvas.getContext('2d');
    c.clearRect(0, 0, width, height);
    c.strokeStyle = '#fff';
    c.lineWidth = 4.2;
    c.lineCap = 'butt';
    const scale = width / SHEET.width;
    const x = (v) => (v + SHEET.width / 2) * scale;
    const y = (v) => (SHEET.height / 2 - v) * scale;
    for (const crease of creases) {
      c.setLineDash(crease.type === 'M' ? [26, 8, 4, 8] : [13, 10]);
      c.beginPath();
      c.moveTo(x(crease.a[0]), y(crease.a[1]));
      c.lineTo(x(crease.b[0]), y(crease.b[1]));
      c.stroke();
    }
    this.creaseTexture.needsUpdate = true;
  }

  setFacets(result) {
    let triangles = 0;
    for (const facet of result.facets) triangles += facet.points.length - 2;
    this.ensure(triangles);
    const positions = this.geometry.attributes.position.array;
    const normals = this.geometry.attributes.normal.array;
    const uvs = this.geometry.attributes.uv.array;
    let v = 0;
    const put = (p, f, n) => {
      positions.set(p, v * 3);
      normals.set(n, v * 3);
      uvs[v * 2] = (f[0] + SHEET.width / 2) / SHEET.width;
      uvs[v * 2 + 1] = (f[1] + SHEET.height / 2) / SHEET.height;
      v += 1;
    };
    for (const { points: p, flat } of result.facets) {
      // Newell's method: exact for any planar polygon, including small clipped ones.
      let nx = 0;
      let ny = 0;
      let nz = 0;
      for (let i = 0; i < p.length; i += 1) {
        const a = p[i];
        const b = p[(i + 1) % p.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]);
        ny += (a[2] - b[2]) * (a[0] + b[0]);
        nz += (a[0] - b[0]) * (a[1] + b[1]);
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      const n = [nx / l, ny / l, nz / l];
      for (let i = 1; i < p.length - 1; i += 1) {
        put(p[0], flat[0], n);
        put(p[i], flat[i], n);
        put(p[i + 1], flat[i + 1], n);
      }
    }
    this.geometry.setDrawRange(0, v);
    for (const name of ['position', 'normal', 'uv']) this.geometry.attributes[name].needsUpdate = true;
  }

  setView({ elevation, azimuth, distance, shiftX, shiftY, targetZ, reveal, lineAlpha }) {
    this.target.z = targetZ;
    const e = rad(elevation);
    const a = rad(azimuth);
    const cam = this.camera;
    cam.position.set(distance * Math.cos(e) * Math.sin(a), -distance * Math.cos(e) * Math.cos(a), distance * Math.sin(e) + this.target.z);
    cam.lookAt(this.target);
    cam.setViewOffset(this.width, this.height, -shiftX * this.width, -shiftY * this.height, this.width, this.height);
    this.uniforms.uReveal.value = reveal;
    this.uniforms.uLineAlpha.value = lineAlpha;
  }

  project(point) {
    const v = new Vector3(point[0], point[1], point[2]).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.width, y: ((1 - v.y) / 2) * this.height };
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.geometry.dispose();
    this.creaseTexture.dispose();
    this.renderer.dispose();
  }
}
