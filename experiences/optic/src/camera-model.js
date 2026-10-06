import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * OPTIC's original camera. Local +Z faces the subject; light travels toward -Z.
 * 1 unit represents approximately 25 mm. The 36 × 24 mm active sensor is
 * 1.44 × 0.96 units at z=0. No branded mesh, texture or optical prescription.
 * This module owns geometry/materials only: no renderer, listeners, or clocks.
 */
export function createCameraBody() {
  const group = new THREE.Group();
  group.name = "OPTIC / original camera";
  const parts = {};
  const textures = new Set();
  const materials = new Set();
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mat = (options, physical = false) => {
    const material = physical
      ? new THREE.MeshPhysicalMaterial(options)
      : new THREE.MeshStandardMaterial(options);
    materials.add(material);
    return material;
  };
  const black = mat({ color: 0x23272a, roughness: 0.4, metalness: 0.72 });
  const shellBlack = mat({ color: 0x1b1e20, roughness: 0.48, metalness: 0.6 });
  const darkEdge = mat({ color: 0x393d40, roughness: 0.26, metalness: 0.9 });
  const graphite = mat({ color: 0x222729, roughness: 0.53, metalness: 0.48 });
  const magnesium = mat({ color: 0x72797c, roughness: 0.37, metalness: 0.88 });
  const steel = mat({ color: 0xb3b7b8, roughness: 0.22, metalness: 0.96 });
  const darkSteel = mat({ color: 0x52585b, roughness: 0.27, metalness: 0.94 });
  const gold = mat({ color: 0xa58a48, roughness: 0.34, metalness: 0.86 });
  const contactGold = mat({
    color: 0xc1a263,
    roughness: 0.23,
    metalness: 0.93,
  });
  const copper = mat({ color: 0x8f5e2f, roughness: 0.43, metalness: 0.78 });
  const epoxy = mat({ color: 0x171a1b, roughness: 0.7, metalness: 0.13 });
  const ceramic = mat({ color: 0x827b69, roughness: 0.72, metalness: 0.2 });
  const recess = mat({ color: 0x060809, roughness: 0.77, metalness: 0.08 });
  const silk = mat({ color: 0x9c9f98, roughness: 0.75, metalness: 0.08 });

  function seeded(seed = 419) {
    let n = seed >>> 0;
    return () => {
      n = (1664525 * n + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }

  function canvasTexture(width, height, paint, color = false) {
    // The DataTexture fallback also allows geometry validation without a DOM.
    let texture;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        paint(ctx, width, height);
        texture = new THREE.CanvasTexture(canvas);
      }
    }
    if (!texture) {
      const random = seeded();
      const pixels = new Uint8Array(64 * 64 * 4);
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 115 + random() * 32;
        pixels[i + 3] = 255;
      }
      texture = new THREE.DataTexture(pixels, 64, 64);
      texture.needsUpdate = true;
    }
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = 4;
    textures.add(texture);
    return texture;
  }

  const rubberMap = canvasTexture(256, 256, (ctx, w, h) => {
    const random = seeded(846);
    const pixels = ctx.createImageData(w, h);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const v = 78 + random() * 73;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    for (let i = 0; i < 1900; i++) {
      const x = random() * w,
        y = random() * h,
        r = 0.35 + random() * 1.1;
      ctx.fillStyle = `rgba(15,15,15,${0.2 + random() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.65, r, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  rubberMap.wrapS = rubberMap.wrapT = THREE.RepeatWrapping;
  rubberMap.repeat.set(4.5, 4.5);
  // Bump grain must not also multiply roughness down to polished-metal levels.
  const rubber = mat({
    color: 0x191c1e,
    roughness: 0.91,
    metalness: 0.015,
    bumpMap: rubberMap,
    bumpScale: 0.016,
  });

  const brushMap = canvasTexture(256, 128, (ctx, w, h) => {
    const random = seeded(99);
    ctx.fillStyle = "#959595";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const v = 105 + random() * 56;
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  });
  brushMap.wrapS = brushMap.wrapT = THREE.RepeatWrapping;
  brushMap.repeat.set(2, 9);
  const brushed = mat({
    color: 0x81878b,
    roughness: 0.42,
    metalness: 0.9,
    roughnessMap: brushMap,
    bumpMap: brushMap,
    bumpScale: 0.0018,
  });

  function mesh(geometry, material, parent, x = 0, y = 0, z = 0, name) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    if (name) object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, w, h, d, x, y, z, material, radius = 0.03) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 3, h / 3, d / 3)),
      material,
      parent,
      x,
      y,
      z,
    );
  }

  function roundShape(w, h, r, cx = 0, cy = 0) {
    const s = new THREE.Shape(),
      l = cx - w / 2,
      b = cy - h / 2;
    s.moveTo(l + r, b);
    s.lineTo(l + w - r, b);
    s.quadraticCurveTo(l + w, b, l + w, b + r);
    s.lineTo(l + w, b + h - r);
    s.quadraticCurveTo(l + w, b + h, l + w - r, b + h);
    s.lineTo(l + r, b + h);
    s.quadraticCurveTo(l, b + h, l, b + h - r);
    s.lineTo(l, b + r);
    s.quadraticCurveTo(l, b, l + r, b);
    return s;
  }

  function circularHole(shape, radius, x = 0, y = 0) {
    const hole = new THREE.Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  }

  function rectangularHole(shape, w, h, r, x = 0, y = 0) {
    const points = roundShape(w, h, r, x, y).getPoints(12).reverse();
    shape.holes.push(new THREE.Path(points));
  }

  function extrude(parent, shape, depth, z, material, bevel = 0.025) {
    return mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        steps: 1,
        curveSegments: 20,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3,
      }),
      material,
      parent,
      0,
      0,
      z,
    );
  }

  function frame(
    parent,
    w,
    h,
    openingW,
    openingH,
    z,
    depth,
    material,
    r = 0.09,
  ) {
    const shape = roundShape(w, h, r);
    rectangularHole(shape, openingW, openingH, Math.min(r * 0.7, 0.045));
    return extrude(
      parent,
      shape,
      depth,
      z,
      material,
      Math.min(0.018, depth * 0.18),
    );
  }

  function ring(parent, profile, material, z = 0) {
    const geometry = new THREE.LatheGeometry(
      profile.map(([r, h]) => new THREE.Vector2(r, h)),
      96,
    );
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, material, parent, 0, 0, z);
  }

  function instances(parent, geometry, material, transforms, name) {
    const object = new THREE.InstancedMesh(
      geometry,
      material,
      transforms.length,
    );
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(...(t.p || [0, 0, 0]));
      dummy.rotation.set(...(t.r || [0, 0, 0]));
      dummy.scale.set(...(t.s || [1, 1, 1]));
      dummy.updateMatrix();
      object.setMatrixAt(i, dummy.matrix);
    });
    object.name = name || "machined repeated detail";
    object.castShadow = object.receiveShadow = true;
    object.instanceMatrix.needsUpdate = true;
    parent.add(object);
    return object;
  }

  function screws(parent, points, radius = 0.039, facing = 1) {
    const g = new THREE.CylinderGeometry(radius, radius * 0.88, 0.018, 12);
    g.rotateX(Math.PI / 2);
    instances(
      parent,
      g,
      darkSteel,
      points.map((p) => ({ p })),
      "recessed screw heads",
    );
    const slots = points.flatMap(([x, y, z], i) =>
      [0, Math.PI / 2].map((a) => ({
        p: [x, y, z + facing * 0.0105],
        r: [0, 0, a + i * 0.39],
      })),
    );
    instances(
      parent,
      new THREE.BoxGeometry(radius * 1.19, radius * 0.18, 0.0025),
      recess,
      slots,
      "cross-head screw slots",
    );
  }

  function wireRibbon(parent, points, width = 0.13, material = gold) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const vertices = [],
      uv = [],
      indices = [];
    const segments = 36;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments,
        p = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      let side = new THREE.Vector3(1, 0, 0);
      if (Math.abs(tangent.dot(side)) > 0.85) side.set(0, 1, 0);
      side
        .addScaledVector(tangent, -side.dot(tangent))
        .normalize()
        .multiplyScalar(width / 2);
      vertices.push(
        p.x - side.x,
        p.y - side.y,
        p.z - side.z,
        p.x + side.x,
        p.y + side.y,
        p.z + side.z,
      );
      uv.push(0, t, 1, t);
      if (i < segments) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const object = mesh(geometry, material, parent);
    object.name = "flexible polyimide ribbon";
    object.castShadow = false;
    return object;
  }

  const flexMaterial = mat({
    color: 0xb58337,
    roughness: 0.48,
    metalness: 0.55,
    side: THREE.DoubleSide,
  });

  function bodyContour() {
    const s = new THREE.Shape();
    s.moveTo(-2.28, -1.48);
    s.bezierCurveTo(-2.56, -1.48, -2.64, -1.36, -2.64, -1.08);
    s.lineTo(-2.64, 0.89);
    s.bezierCurveTo(-2.63, 1.22, -2.49, 1.43, -2.2, 1.45);
    s.bezierCurveTo(-1.94, 1.47, -1.69, 1.39, -1.48, 1.34);
    s.bezierCurveTo(-0.85, 1.3, -0.74, 1.29, -0.48, 1.29);
    s.lineTo(2.26, 1.29);
    s.bezierCurveTo(2.55, 1.29, 2.69, 1.16, 2.7, 0.89);
    s.lineTo(2.7, -1.1);
    s.bezierCurveTo(2.7, -1.37, 2.57, -1.48, 2.31, -1.48);
    s.lineTo(-2.28, -1.48);
    return s;
  }

  function addPart(name, x, y, z) {
    const part = new THREE.Group();
    part.name = name;
    part.position.set(x, y, z);
    part.userData.assembledPosition = [x, y, z];
    group.add(part);
    parts[name] = part;
    return part;
  }

  // 01 — An actual hollow shell, with a separate circular front face.
  const frontShell = addPart("frontShell", 0, 0, 0.7);
  const sleeve = bodyContour();
  rectangularHole(sleeve, 4.57, 2.4, 0.26, 0.025, -0.075);
  extrude(frontShell, sleeve, 1.35, -1.33, shellBlack, 0.045);
  const frontFace = bodyContour();
  circularHole(frontFace, 1.016);
  extrude(frontShell, frontFace, 0.082, 0.036, black, 0.033);

  const gripShape = new THREE.Shape();
  gripShape.moveTo(-2.42, -1.36);
  gripShape.bezierCurveTo(-2.54, -1.34, -2.57, -1.22, -2.57, -1.02);
  gripShape.lineTo(-2.57, 0.78);
  gripShape.bezierCurveTo(-2.55, 1.08, -2.34, 1.21, -2.06, 1.15);
  gripShape.bezierCurveTo(-1.84, 1.1, -1.7, 0.88, -1.65, 0.59);
  gripShape.bezierCurveTo(-1.59, 0.27, -1.61, -0.12, -1.66, -0.49);
  gripShape.lineTo(-1.68, -1.35);
  gripShape.quadraticCurveTo(-2.07, -1.41, -2.42, -1.36);
  extrude(frontShell, gripShape, 0.025, 0.118, rubber, 0.018);

  // A tessellated convex palm surface follows the actual grip outline. Unlike
  // a flat extruded patch, it catches a gradual highlight across its volume.
  const gripContour = gripShape.getPoints(60);
  const gripMinY = Math.min(...gripContour.map((p) => p.y));
  const gripMaxY = Math.max(...gripContour.map((p) => p.y));
  const gripVertices = [],
    gripUVs = [],
    gripIndices = [];
  const gripRows = 36,
    gripColumns = 22;
  for (let row = 0; row <= gripRows; row++) {
    const t = row / gripRows;
    const y = gripMinY + 0.0001 + (gripMaxY - gripMinY - 0.0002) * t;
    const intersections = [];
    for (let i = 0; i < gripContour.length - 1; i++) {
      const a = gripContour[i],
        b = gripContour[i + 1];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        intersections.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
      }
    }
    const left = Math.min(...intersections),
      right = Math.max(...intersections);
    for (let column = 0; column <= gripColumns; column++) {
      const u = column / gripColumns;
      const crown =
        0.255 *
        Math.pow(Math.sin(Math.PI * u), 0.86) *
        Math.pow(Math.sin(Math.PI * t), 0.45);
      gripVertices.push(left + (right - left) * u, y, crown);
      gripUVs.push(u, t * 2.5);
      if (row < gripRows && column < gripColumns) {
        const n = row * (gripColumns + 1) + column,
          upper = n + gripColumns + 1;
        gripIndices.push(n, n + 1, upper, n + 1, upper + 1, upper);
      }
    }
  }
  const gripSurfaceGeometry = new THREE.BufferGeometry();
  gripSurfaceGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(gripVertices, 3),
  );
  gripSurfaceGeometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(gripUVs, 2),
  );
  gripSurfaceGeometry.setIndex(gripIndices);
  gripSurfaceGeometry.computeVertexNormals();
  mesh(
    gripSurfaceGeometry,
    rubber,
    frontShell,
    0,
    0,
    0.148,
    "sculpted convex palm grip",
  );
  box(frontShell, 0.32, 2.03, 1.18, -2.53, -0.2, -0.57, rubber, 0.105);
  box(frontShell, 0.15, 1.89, 1.14, 2.62, -0.22, -0.57, rubber, 0.05);
  box(frontShell, 0.081, 1.73, 0.76, 2.706, -0.26, -0.63, recess, 0.023);
  box(frontShell, 0.055, 1.64, 0.665, 2.733, -0.26, -0.63, shellBlack, 0.021);
  box(frontShell, 0.009, 0.028, 0.22, 2.765, 0.38, -0.63, darkEdge, 0.004);

  // Chamfered concentric metal mount with bayonet tangs and electrical contacts.
  ring(
    frontShell,
    [
      [1.022, 0.074],
      [1.1, 0.074],
      [1.15, 0.109],
      [1.15, 0.153],
      [1.126, 0.172],
      [1.034, 0.172],
      [1.017, 0.15],
      [1.022, 0.074],
    ],
    steel,
  );
  ring(
    frontShell,
    [
      [0.955, 0.038],
      [1.034, 0.038],
      [1.034, 0.136],
      [1.01, 0.149],
      [0.955, 0.149],
      [0.955, 0.038],
    ],
    recess,
  );
  ring(
    frontShell,
    [
      [1.153, 0.08],
      [1.189, 0.08],
      [1.192, 0.102],
      [1.153, 0.116],
      [1.153, 0.08],
    ],
    darkEdge,
  );
  const tangs = [];
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + 0.24;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 1.018, a, a + 0.46, false);
    shape.absarc(0, 0, 0.963, a + 0.46, a, true);
    shape.closePath();
    tangs.push(extrude(frontShell, shape, 0.027, 0.147, darkSteel, 0.005));
  }
  const mountContacts = Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI / 2 + (i - 5) * 0.074;
    return {
      p: [Math.cos(a) * 0.988, Math.sin(a) * 0.988, 0.15],
      r: [0, 0, a - Math.PI / 2],
    };
  });
  instances(
    frontShell,
    new RoundedBoxGeometry(0.041, 0.107, 0.016, 2, 0.006),
    contactGold,
    mountContacts,
    "eleven spring lens contacts",
  );
  screws(
    frontShell,
    [0.57, 2.14, 3.7, 5.28].map((a) => [
      Math.cos(a) * 1.092,
      Math.sin(a) * 1.092,
      0.18,
    ]),
    0.034,
  );
  screws(
    frontShell,
    [
      [-2.43, 1.26, 0.138],
      [2.43, 1.1, 0.137],
      [-2.43, -1.27, 0.138],
      [2.47, -1.25, 0.138],
    ],
    0.034,
  );
  const release = mesh(
    new THREE.CylinderGeometry(0.101, 0.112, 0.057, 32),
    graphite,
    frontShell,
    1.41,
    -0.59,
    0.148,
  );
  release.rotation.x = Math.PI / 2;
  mesh(
    new THREE.SphereGeometry(0.035, 16, 8),
    contactGold,
    frontShell,
    0.81,
    0.87,
    0.176,
  );
  box(frontShell, 0.064, 0.018, 0.01, 0, 1.174, 0.16, silk, 0.004);
  for (const x of [-2.72, 2.79]) {
    const lug = mesh(
      new THREE.TorusGeometry(0.093, 0.025, 7, 20),
      darkSteel,
      frontShell,
      x,
      1.01,
      -0.4,
    );
    lug.scale.y = 1.48;
    lug.rotation.y = Math.PI / 2;
    box(frontShell, 0.093, 0.13, 0.17, x * 0.976, 1.01, -0.4, black, 0.025);
  }

  // 02 — A cast magnesium cage, with real openings and local structural ribs.
  const chassis = addPart("chassis", 0, 0, 0.36);
  const cage = roundShape(4.54, 2.57, 0.2, 0.02, -0.04);
  circularHole(cage, 1.028);
  rectangularHole(cage, 0.51, 1.43, 0.08, -1.78, -0.02);
  rectangularHole(cage, 0.54, 0.57, 0.075, 1.78, 0.67);
  rectangularHole(cage, 0.55, 0.73, 0.075, 1.78, -0.5);
  extrude(chassis, cage, 0.115, -0.055, magnesium, 0.033);
  const rails = [
    { p: [0, 1.18, -0.16], s: [3.59, 0.105, 0.3] },
    { p: [0, -1.24, -0.16], s: [3.96, 0.12, 0.3] },
    { p: [-2.13, -0.035, -0.17], s: [0.105, 2.12, 0.33] },
    { p: [2.13, -0.035, -0.17], s: [0.105, 2.12, 0.33] },
    { p: [-1.26, 0.02, -0.15], s: [0.095, 2.08, 0.28] },
    { p: [1.23, 0.02, -0.15], s: [0.095, 2.08, 0.28] },
  ];
  instances(
    chassis,
    new RoundedBoxGeometry(1, 1, 1, 2, 0.045),
    magnesium,
    rails,
    "cast cage ribs",
  );
  const cageScrews = [
    [-2.09, 1.08, 0.084],
    [2.13, 1.08, 0.084],
    [-2.09, -1.16, 0.084],
    [2.13, -1.16, 0.084],
    [-1.23, 0.92, 0.084],
    [1.23, 0.91, 0.084],
    [-1.24, -0.94, 0.084],
    [1.24, -0.94, 0.084],
  ];
  const bossGeometry = new THREE.CylinderGeometry(0.079, 0.079, 0.04, 16);
  bossGeometry.rotateX(Math.PI / 2);
  instances(
    chassis,
    bossGeometry,
    brushed,
    cageScrews.map((p) => ({ p: [p[0], p[1], p[2] - 0.03] })),
    "machined mounting bosses",
  );
  screws(chassis, cageScrews, 0.034);

  // 03 — Focal-plane shutter carrier. Curtains are supplied by the optical module.
  const shutterFrame = addPart("shutterFrame", 0, 0, 0.26);
  frame(shutterFrame, 1.94, 1.54, 1.48, 1.0, -0.031, 0.061, graphite, 0.07);
  frame(shutterFrame, 1.6, 1.11, 1.48, 1.0, 0.037, 0.016, darkSteel, 0.025);
  box(shutterFrame, 1.68, 0.105, 0.116, 0, 0.673, -0.02, black, 0.025);
  box(shutterFrame, 1.68, 0.075, 0.102, 0, -0.674, -0.027, black, 0.02);
  screws(
    shutterFrame,
    [
      [-0.876, 0.645, 0.044],
      [0.876, 0.645, 0.044],
      [-0.876, -0.645, 0.044],
      [0.876, -0.645, 0.044],
    ],
    0.026,
  );
  shutterFrame.userData.gate = { width: 1.48, height: 1.0, z: 0.26 };
  wireRibbon(
    shutterFrame,
    [
      [0.79, -0.56, 0],
      [0.83, -0.8, -0.11],
      [0.8, -0.94, -0.34],
      [0.67, -0.98, -0.38],
    ],
    0.14,
    flexMaterial,
  );

  // 04 — A stationary IBIS cradle and a nested, independently moving sensor.
  const ibis = addPart("ibis", 0, 0, -0.065);
  frame(ibis, 2.16, 1.75, 1.75, 1.27, -0.035, 0.083, darkSteel, 0.11);
  frame(ibis, 1.96, 1.5, 1.71, 1.21, 0.053, 0.024, magnesium, 0.075);
  const guideGeometry = new THREE.CylinderGeometry(0.018, 0.018, 1.32, 12);
  const guideTransforms = [
    { p: [-0.97, 0, 0.095] },
    { p: [0.97, 0, 0.095] },
    { p: [0, -0.774, 0.095], r: [0, 0, Math.PI / 2], s: [1, 1.28, 1] },
  ];
  instances(
    ibis,
    guideGeometry,
    steel,
    guideTransforms,
    "precision IBIS guide rails",
  );
  const magnets = [
    [-0.996, 0.02, 0.069],
    [0.996, 0.02, 0.069],
    [0, -0.792, 0.069],
  ];
  const windings = [];
  magnets.forEach(([x, y, z], axis) => {
    const horizontal = axis === 2;
    box(
      ibis,
      horizontal ? 0.58 : 0.14,
      horizontal ? 0.13 : 0.58,
      0.12,
      x,
      y,
      z,
      epoxy,
      0.015,
    );
    for (let k = 0; k < 21; k++)
      windings.push({
        p: [
          x + (horizontal ? (k - 10) * 0.025 : 0),
          y + (horizontal ? 0 : (k - 10) * 0.025),
          z + 0.07,
        ],
        s: horizontal ? [0.014, 0.124, 0.028] : [0.124, 0.014, 0.028],
      });
  });
  instances(
    ibis,
    new THREE.BoxGeometry(1, 1, 1),
    copper,
    windings,
    "copper voice-coil windings",
  );
  instances(
    ibis,
    new THREE.SphereGeometry(0.044, 12, 8),
    steel,
    [
      [-0.82, 0.64, 0.091],
      [0.82, 0.64, 0.091],
      [-0.82, -0.64, 0.091],
      [0.82, -0.64, 0.091],
    ].map((p) => ({ p })),
    "IBIS bearing points",
  );
  screws(
    ibis,
    [
      [-1.012, 0.748, 0.067],
      [1.012, 0.748, 0.067],
      [-1.012, -0.748, 0.067],
      [1.012, -0.748, 0.067],
    ],
    0.028,
  );

  const sensor = new THREE.Group();
  sensor.name = "sensor";
  sensor.position.z = 0.065;
  sensor.userData.assembledPosition = [0, 0, 0.065];
  ibis.add(sensor);
  parts.sensor = sensor;
  box(sensor, 1.75, 1.28, 0.078, 0, 0, -0.051, graphite, 0.023);
  box(sensor, 1.68, 1.2, 0.055, 0, 0, -0.014, gold, 0.017);
  frame(sensor, 1.57, 1.085, 1.444, 0.964, 0.018, 0.012, recess, 0.02);

  const sensorMap = canvasTexture(
    768,
    512,
    (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, h, w, 0);
      gradient.addColorStop(0, "#333e54");
      gradient.addColorStop(0.37, "#626080");
      gradient.addColorStop(0.66, "#716583");
      gradient.addColorStop(1, "#465064");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.045;
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = y % 2 ? "#c1b9c6" : "#151a20";
        ctx.fillRect(0, y, w, 1);
      }
      ctx.globalAlpha = 0.035;
      for (let x = 0; x < w; x += 3) {
        ctx.fillStyle = "#c0c7cf";
        ctx.fillRect(x, 0, 1, h);
      }
      ctx.globalAlpha = 1;
    },
    true,
  );
  const sensorMaterial = mat(
    {
      color: 0xa6a2af,
      map: sensorMap,
      roughness: 0.18,
      metalness: 0.68,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      iridescence: 0.4,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [180, 380],
      envMapIntensity: 1.3,
    },
    true,
  );
  const activePlane = mesh(
    new THREE.PlaneGeometry(1.44, 0.96),
    sensorMaterial,
    sensor,
    0,
    0,
    0,
    "36 × 24 mm Bayer CMOS active plane",
  );
  // The active plane is the defining z=0 surface. Recess the frame behind it.
  sensor.children.forEach((child) => {
    if (child !== activePlane) child.position.z -= 0.04;
  });
  sensor.userData.activePlane = activePlane;
  sensor.userData.activeBounds = { width: 1.44, height: 0.96, localZ: 0 };
  parts.sensorSurface = activePlane;
  screws(
    sensor,
    [
      [-0.78, 0.538, 0.002],
      [0.78, 0.538, 0.002],
      [-0.78, -0.538, 0.002],
      [0.78, -0.538, 0.002],
    ],
    0.021,
  );
  wireRibbon(
    sensor,
    [
      [-0.58, 0.52, -0.045],
      [-0.59, 0.81, -0.075],
      [-0.59, 0.92, -0.26],
      [-0.62, 0.75, -0.43],
      [-0.7, 0.55, -0.47],
    ],
    0.19,
    flexMaterial,
  );

  // 05 — Original board routing, real packages, connectors and thermal plate.
  const pcb = addPart("pcb", 0, 0, -0.38);
  const boardMap = canvasTexture(
    1280,
    768,
    (ctx, w, h) => {
      const random = seeded(5811);
      ctx.fillStyle = "#17312b";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 190; i++) {
        const x = 26 + Math.floor((random() * (w - 52)) / 16) * 16;
        const y = 22 + Math.floor((random() * (h - 44)) / 16) * 16;
        const dx =
          (random() > 0.5 ? 1 : -1) * (30 + Math.floor(random() * 10) * 16);
        const dy =
          (random() > 0.5 ? 1 : -1) * (16 + Math.floor(random() * 7) * 16);
        ctx.strokeStyle =
          i % 4 ? "rgba(130,145,103,0.23)" : "rgba(181,160,104,0.42)";
        ctx.lineWidth = i % 11 ? 1.15 : 2.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * 0.44, y);
        ctx.lineTo(x + dx * 0.7, y + dy * 0.54);
        ctx.lineTo(x + dx * 0.7, y + dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
        ctx.fillStyle = "#8b8c60";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#10231f";
        ctx.beginPath();
        ctx.arc(x, y, 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(190,199,163,0.28)";
      ctx.lineWidth = 2;
      [
        [128, 109, 151, 98],
        [471, 454, 134, 109],
        [935, 245, 191, 93],
        [137, 530, 196, 95],
        [915, 525, 250, 97],
      ].forEach(([x, y, sw, sh]) => ctx.strokeRect(x, y, sw, sh));
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = "#858d61";
        ctx.fillRect(30 + i * 10, h - 27, 4, 13);
      }
    },
    true,
  );
  const pcbMaterial = mat({
    color: 0xe2eadb,
    map: boardMap,
    roughness: 0.61,
    metalness: 0.25,
  });
  const boardShape = roundShape(4.26, 2.44, 0.13, 0.02, -0.03);
  [
    [-1.98, -1.1],
    [2.02, -1.1],
    [-1.98, 1.04],
    [2.02, 1.04],
  ].forEach(([x, y]) => circularHole(boardShape, 0.055, x, y));
  const board = extrude(pcb, boardShape, 0.045, -0.022, pcbMaterial, 0.01);
  const boardPositions = board.geometry.attributes.position,
    boardUV = board.geometry.attributes.uv;
  for (let i = 0; i < boardPositions.count; i++)
    boardUV.setXY(
      i,
      (boardPositions.getX(i) + 2.11) / 4.26,
      (boardPositions.getY(i) + 1.25) / 2.44,
    );
  boardUV.needsUpdate = true;
  box(pcb, 1.075, 0.965, 0.068, 0.28, 0.12, 0.068, darkSteel, 0.024);
  box(pcb, 0.955, 0.845, 0.095, 0.28, 0.12, 0.137, epoxy, 0.018);
  box(pcb, 0.71, 0.6, 0.01, 0.28, 0.12, 0.189, graphite, 0.008);
  const chipTransforms = [
    { p: [1.4, 0.63, 0.081], s: [0.58, 0.27, 0.095] },
    { p: [1.4, 0.18, 0.081], s: [0.58, 0.27, 0.095] },
    { p: [1.39, -0.32, 0.073], s: [0.47, 0.3, 0.08] },
    { p: [-0.93, 0.71, 0.073], s: [0.43, 0.3, 0.08] },
    { p: [-1.19, -0.26, 0.071], s: [0.48, 0.39, 0.09] },
    { p: [-0.65, -0.76, 0.067], s: [0.36, 0.26, 0.074] },
    { p: [0.4, -0.86, 0.067], s: [0.41, 0.24, 0.074] },
  ];
  instances(
    pcb,
    new RoundedBoxGeometry(1, 1, 1, 2, 0.055),
    epoxy,
    chipTransforms,
    "memory and control packages",
  );
  const leads = [];
  chipTransforms.forEach(({ p, s }) => {
    for (const side of [-1, 1])
      for (let k = 0; k < 9; k++)
        leads.push({
          p: [
            p[0] + ((k - 4) * s[0]) / 10,
            p[1] + side * (s[1] / 2 + 0.017),
            0.057,
          ],
          s: [0.018, 0.05, 0.016],
        });
  });
  instances(pcb, new THREE.BoxGeometry(1, 1, 1), steel, leads, "IC leads");
  const random = seeded(778),
    passives = [],
    passiveSolder = [];
  for (let i = 0; i < 57; i++) {
    const x = -1.8 + (i % 7) * 0.55 + (random() - 0.5) * 0.1;
    const y = -0.91 + Math.floor(i / 7) * 0.24;
    if (x > -0.31 && x < 0.92 && y > -0.43 && y < 0.73) continue;
    if (x > 1.1 && y > -0.53 && y < 0.87) continue;
    passives.push({ p: [x, y, 0.059], s: [0.074, 0.029, 0.041] });
    passiveSolder.push(
      { p: [x - 0.043, y, 0.048], s: [0.025, 0.038, 0.016] },
      { p: [x + 0.043, y, 0.048], s: [0.025, 0.038, 0.016] },
    );
  }
  instances(
    pcb,
    new THREE.BoxGeometry(1, 1, 1),
    ceramic,
    passives,
    "surface mount passives",
  );
  instances(
    pcb,
    new THREE.BoxGeometry(1, 1, 1),
    steel,
    passiveSolder,
    "passive solder pads",
  );
  [
    [-1.48, 0.16, 0.47],
    [1.38, -0.88, 0.7],
    [-0.84, 1.0, 0.52],
  ].forEach(([x, y, w]) => {
    box(pcb, w, 0.105, 0.115, x, y, 0.083, epoxy, 0.012);
    const pins = Array.from({ length: 14 }, (_, k) => ({
      p: [x - w * 0.43 + (k * w * 0.86) / 13, y, 0.145],
      s: [0.012, 0.073, 0.005],
    }));
    instances(
      pcb,
      new THREE.BoxGeometry(1, 1, 1),
      contactGold,
      pins,
      "flex connector contacts",
    );
  });
  const capacitors = [
    [-1.7, -0.68, 0.1],
    [-1.48, -0.7, 0.1],
    [-1.71, -0.95, 0.1],
  ];
  const capGeometry = new THREE.CylinderGeometry(0.065, 0.065, 0.125, 16);
  capGeometry.rotateX(Math.PI / 2);
  instances(
    pcb,
    capGeometry,
    magnesium,
    capacitors.map((p) => ({ p })),
    "power capacitors",
  );
  screws(
    pcb,
    [
      [-1.98, -1.1, 0.046],
      [2.02, -1.1, 0.046],
      [-1.98, 1.04, 0.046],
      [2.02, 1.04, 0.046],
    ],
    0.034,
  );
  const spreader = box(
    pcb,
    2.37,
    1.65,
    0.079,
    0.35,
    -0.1,
    -0.09,
    brushed,
    0.07,
  );
  spreader.name = "passive thermal spreader";
  wireRibbon(
    pcb,
    [
      [1.19, -0.88, 0.145],
      [1.19, -1.11, 0.12],
      [1.25, -1.24, -0.07],
      [1.32, -1.03, -0.35],
    ],
    0.35,
    flexMaterial,
  );

  // 06 — Rear enclosure, display glass and restrained tactile controls.
  const rearShell = addPart("rearShell", 0, 0, -0.91);
  const rearShape = bodyContour();
  rectangularHole(rearShape, 3.64, 2.13, 0.095, 0.31, -0.085);
  extrude(rearShell, rearShape, 0.107, -0.023, shellBlack, 0.037);
  const displayFrame = frame(
    rearShell,
    3.7,
    2.21,
    3.38,
    1.91,
    -0.074,
    0.069,
    graphite,
    0.11,
  );
  displayFrame.position.set(0.31, -0.085, 0);
  const displayGlass = mat(
    {
      color: 0x11181c,
      roughness: 0.12,
      metalness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.5,
    },
    true,
  );
  const screen = box(
    rearShell,
    3.38,
    1.91,
    0.038,
    0.31,
    -0.085,
    -0.091,
    displayGlass,
    0.047,
  );
  screen.name = "rear display cover glass";
  box(rearShell, 0.76, 1.85, 0.075, -2.09, -0.06, -0.078, rubber, 0.023);
  const rearButtons = [
    [-2.07, 0.66, -0.134],
    [-2.07, -0.69, -0.134],
    [-1.86, -0.99, -0.134],
    [-2.31, -0.99, -0.134],
  ];
  const rearButtonGeometry = new THREE.CylinderGeometry(
    0.091,
    0.099,
    0.039,
    24,
  );
  rearButtonGeometry.rotateX(Math.PI / 2);
  instances(
    rearShell,
    rearButtonGeometry,
    darkEdge,
    rearButtons.map((p) => ({ p })),
    "rear tactile buttons",
  );
  const rearWheel = mesh(
    new THREE.CylinderGeometry(0.257, 0.268, 0.041, 48),
    black,
    rearShell,
    -2.07,
    -0.08,
    -0.139,
  );
  rearWheel.rotation.x = Math.PI / 2;
  const wheelCenter = mesh(
    new THREE.CylinderGeometry(0.116, 0.116, 0.052, 24),
    darkSteel,
    rearShell,
    -2.07,
    -0.08,
    -0.15,
  );
  wheelCenter.rotation.x = Math.PI / 2;
  instances(
    rearShell,
    new THREE.BoxGeometry(0.012, 0.044, 0.018),
    darkEdge,
    Array.from({ length: 40 }, (_, i) => {
      const a = (i * Math.PI * 2) / 40;
      return {
        p: [-2.07 + Math.cos(a) * 0.255, -0.08 + Math.sin(a) * 0.255, -0.157],
        r: [0, 0, a + Math.PI / 2],
      };
    }),
    "rear wheel fine knurl",
  );
  screws(
    rearShell,
    [
      [-2.43, 1.22, -0.073],
      [2.45, 1.1, -0.073],
      [-2.44, -1.26, -0.073],
      [2.45, -1.26, -0.073],
    ],
    0.033,
    -1,
  );

  // 07 — The entire top assembly lifts as one, including EVF and machined dials.
  const controls = addPart("controls", 0, 1.34, -0.11);
  // The top follows the grip shoulder and body outline instead of reading as
  // a rectangular slab perched on the housing. Shape Y becomes negative Z.
  const topPlan = new THREE.Shape();
  topPlan.moveTo(-2.32, -0.78);
  topPlan.bezierCurveTo(-2.1, -0.8, -1.89, -0.73, -1.65, -0.66);
  topPlan.quadraticCurveTo(-1.1, -0.59, -0.55, -0.61);
  topPlan.lineTo(2.25, -0.61);
  topPlan.quadraticCurveTo(2.49, -0.61, 2.51, -0.39);
  topPlan.lineTo(2.51, 0.49);
  topPlan.quadraticCurveTo(2.49, 0.7, 2.26, 0.7);
  topPlan.lineTo(-2.25, 0.7);
  topPlan.quadraticCurveTo(-2.5, 0.7, -2.51, 0.46);
  topPlan.lineTo(-2.51, -0.49);
  topPlan.quadraticCurveTo(-2.5, -0.74, -2.32, -0.78);
  const topGeometry = new THREE.ExtrudeGeometry(topPlan, {
    depth: 0.094,
    steps: 1,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.027,
    bevelSegments: 3,
  });
  topGeometry.rotateX(-Math.PI / 2);
  mesh(
    topGeometry,
    shellBlack,
    controls,
    0,
    -0.034,
    0,
    "sculpted top shoulder plate",
  );
  const evfShape = new THREE.Shape();
  evfShape.moveTo(-0.65, -0.025);
  evfShape.lineTo(-0.53, 0.37);
  evfShape.quadraticCurveTo(-0.44, 0.67, -0.3, 0.69);
  evfShape.lineTo(0.34, 0.69);
  evfShape.quadraticCurveTo(0.48, 0.67, 0.55, 0.38);
  evfShape.lineTo(0.68, -0.025);
  evfShape.closePath();
  extrude(controls, evfShape, 0.87, -0.43, shellBlack, 0.043);
  const eyecup = frame(
    controls,
    0.91,
    0.56,
    0.58,
    0.35,
    -0.554,
    0.097,
    rubber,
    0.12,
  );
  eyecup.position.y = 0.34;
  const evfGlass = mat(
    {
      color: 0x1f2432,
      roughness: 0.13,
      metalness: 0.38,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 0.25,
      iridescenceThicknessRange: [180, 290],
    },
    true,
  );
  const ocular = box(
    controls,
    0.57,
    0.35,
    0.058,
    0,
    0.34,
    -0.49,
    evfGlass,
    0.064,
  );
  ocular.name = "electronic viewfinder ocular";
  box(controls, 0.58, 0.026, 0.44, 0.02, 0.744, 0.025, recess, 0.01);
  box(controls, 0.057, 0.034, 0.44, -0.26, 0.764, 0.025, steel, 0.01);
  box(controls, 0.057, 0.034, 0.44, 0.3, 0.764, 0.025, steel, 0.01);
  box(controls, 0.43, 0.017, 0.055, 0.02, 0.764, 0.217, darkSteel, 0.008);

  function topDial(x, z, radius, height) {
    const dial = new THREE.Group();
    dial.position.set(x, 0.15, z);
    controls.add(dial);
    mesh(
      new THREE.CylinderGeometry(radius * 0.9, radius * 0.91, 0.083, 64),
      darkSteel,
      dial,
      0,
      -0.043,
      0,
    );
    mesh(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      black,
      dial,
      0,
      height * 0.36,
      0,
    );
    mesh(
      new THREE.CylinderGeometry(radius * 0.91, radius * 0.97, 0.027, 64),
      brushed,
      dial,
      0,
      height * 0.89,
      0,
    );
    mesh(
      new THREE.CylinderGeometry(radius * 0.865, radius * 0.865, 0.014, 64),
      black,
      dial,
      0,
      height * 0.97,
      0,
    );
    instances(
      dial,
      new THREE.BoxGeometry(0.018, height * 0.72, 0.022),
      darkEdge,
      Array.from({ length: 80 }, (_, i) => {
        const a = (i * Math.PI * 2) / 80;
        return {
          p: [Math.cos(a) * radius, height * 0.37, Math.sin(a) * radius],
          r: [0, -a, 0],
        };
      }),
      "dial eighty-rib machined knurl",
    );
    instances(
      dial,
      new THREE.BoxGeometry(0.007, 0.003, 0.048),
      silk,
      Array.from({ length: 20 }, (_, i) => {
        const a = (i * Math.PI * 2) / 20;
        return {
          p: [
            Math.cos(a) * radius * 0.75,
            height * 1.016,
            Math.sin(a) * radius * 0.75,
          ],
          r: [0, Math.PI / 2 - a, 0],
          s: [1, 1, i % 5 ? 0.6 : 1],
        };
      }),
      "dial engraved index marks",
    );
    return dial;
  }
  topDial(-1.78, -0.025, 0.36, 0.175);
  topDial(1.89, -0.04, 0.328, 0.15);
  const releaseBase = mesh(
    new THREE.CylinderGeometry(0.153, 0.157, 0.038, 32),
    darkSteel,
    controls,
    -2.205,
    0.102,
    0.47,
  );
  releaseBase.rotation.z = 0.11;
  const shutterButton = mesh(
    new THREE.CylinderGeometry(0.119, 0.125, 0.057, 32),
    black,
    controls,
    -2.21,
    0.137,
    0.47,
  );
  shutterButton.rotation.z = 0.11;
  box(controls, 0.25, 0.073, 0.088, 1.11, 0.097, -0.19, graphite, 0.022);

  // 08 — Separate battery, seated in the grip in the assembled camera.
  const battery = addPart("battery", -2.01, -0.26, -0.18);
  box(battery, 0.67, 1.75, 0.73, 0, 0, 0, epoxy, 0.063);
  box(battery, 0.59, 0.1, 0.66, 0, 0.859, 0, graphite, 0.026);
  instances(
    battery,
    new THREE.BoxGeometry(0.062, 0.018, 0.125),
    contactGold,
    Array.from({ length: 5 }, (_, i) => ({
      p: [(i - 2) * 0.101, 0.916, 0.18],
    })),
    "battery spring contacts",
  );
  box(battery, 0.44, 0.021, 0.023, 0, -0.57, 0.371, darkEdge, 0.006);
  box(battery, 0.22, 0.021, 0.023, -0.11, -0.63, 0.371, darkEdge, 0.006);

  let exploded = 0;
  function setExplode(amount, { portrait = false } = {}) {
    exploded = clamp(Number.isFinite(amount) ? amount : 0, 0, 1);
    const shell = smooth(0.0, 0.47, exploded);
    const inner = smooth(0.2, 0.93, exploded);
    const sensorRelease = smooth(0.42, 0.98, exploded);
    // A portrait inspection fans the already detached layers into readable
    // lanes. Depth ordering and the nested sensor/IBIS assembly stay intact.
    // These lateral offsets finish returning before the final optical handoff.
    const lane = portrait ? smooth(0.34, 0.96, exploded) : 0;
    // First release along the mount axis; then move the empty enclosure away
    // from the inspection sightline. The optical assembly keeps its own axis.
    const shellClearance = smooth(0.34, 0.83, exploded);
    frontShell.position.set(
      (portrait ? -2.1 : -2.25) * shellClearance,
      (portrait ? 2.55 : 2.3) * shellClearance,
      0.7 + shell * 2.3,
    );
    rearShell.position.set(0.32 * lane, 1.44 * lane, -0.91 - shell * 4.25);
    controls.position.set(
      -0.42 * lane,
      1.34 + shell * 1.02 + 0.55 * lane,
      -0.11 - shell * 0.2,
    );
    battery.position.set(
      -2.01 - shell * 0.34 - 0.25 * lane,
      -0.26 - shell * 0.4 - 0.6 * lane,
      -0.18 - shell * 0.68,
    );
    chassis.position.set(-0.72 * lane, -1.48 * lane, 0.36 + inner * 1.04);
    shutterFrame.position.set(-0.7 * lane, -0.28 * lane, 0.26 + inner * 0.085);
    ibis.position.set(1.12 * lane, -0.08 * lane, -0.065 - inner * 1.32);
    sensor.position.z = 0.065 + sensorRelease * 0.35;
    pcb.position.set(1.1 * lane, 0.78 * lane, -0.38 - inner * 2.55);
    group.userData.explode = exploded;
    group.userData.portraitExplode = portrait && exploded > 0;
  }

  function setIBIS({ x = 0, y = 0, roll = 0 } = {}) {
    // Five camera-motion classes are corrected by planar sensor displacement;
    // the sensor does not tip dramatically out of the focal plane.
    sensor.position.x = clamp(Number.isFinite(x) ? x : 0, -0.16, 0.16);
    sensor.position.y = clamp(Number.isFinite(y) ? y : 0, -0.12, 0.12);
    sensor.rotation.z = clamp(Number.isFinite(roll) ? roll : 0, -0.09, 0.09);
  }

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.isInstancedMesh) object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    group.removeFromParent();
    group.clear();
  }

  group.userData.sensorBounds = { width: 1.44, height: 0.96, z: 0 };
  group.userData.opticalAxis = "+Z → -Z";
  group.userData.mount = { outerRadius: 1.15, clearRadius: 0.955, z: 0.85 };
  setExplode(0);
  setIBIS();
  return {
    group,
    parts,
    sensorSurface: activePlane,
    setExplode,
    setIBIS,
    dispose,
  };
}
