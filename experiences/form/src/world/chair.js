import * as THREE from 'three';

/**
 * S—01. A continuous, moulded plywood shell on two bent aluminium sleds.
 * All measurements are metres. The front of the chair faces +Z.
 *
 * No model or image is loaded here: the shell, its thickness, veneers, bent
 * tubes, isolation pads and mounting hardware are actual, original geometry.
 */
export function createChair(materials) {
  const group = new THREE.Group();
  group.name = 'S—01 / continuous shell chair';
  const parts = [];
  const geometries = new Set();
  const revealMeshes = [];
  const outlinePairs = [];
  const finishMeshes = [];
  const edgeMeshes = [];
  const clamp = THREE.MathUtils.clamp;
  const smoothstep = THREE.MathUtils.smoothstep;
  const Y = new THREE.Vector3(0, 1, 0);
  const thickness = 0.014;
  const halfThickness = thickness / 2;
  const bevel = 0.00125;

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0x655448,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    depthTest: true,
  });
  const outlines = new THREE.Group();
  outlines.name = 'S—01 / construction contours';
  outlines.userData.material = outlineMaterial;
  outlines.userData.lineMaterial = outlineMaterial;
  outlines.renderOrder = 5;
  group.add(outlines);

  // The spine is sampled by arc length. Grain therefore travels continuously
  // from the waterfall edge, across the seat, and up the reclined back.
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.438, 0.315),
    new THREE.Vector3(0, 0.445, 0.260),
    new THREE.Vector3(0, 0.438, 0.110),
    new THREE.Vector3(0, 0.440, -0.065),
    new THREE.Vector3(0, 0.458, -0.165),
    new THREE.Vector3(0, 0.492, -0.215),
    new THREE.Vector3(0, 0.568, -0.251),
    new THREE.Vector3(0, 0.700, -0.300),
    new THREE.Vector3(0, 0.829, -0.342),
  ], false, 'centripetal');
  spine.arcLengthDivisions = 520;
  spine.updateArcLengths();
  const spineLength = spine.getLength();

  const halfWidth = (t) => 0.273 - 0.006 * Math.sin(Math.PI * t)
    + 0.009 * smoothstep(t, 0.63, 1);

  function naturalPoint(u, t) {
    const p = spine.getPointAt(clamp(t, 0, 1));
    const tangent = spine.getTangentAt(clamp(t, 0, 1));
    const n = new THREE.Vector3(0, -tangent.z, tangent.y).normalize();
    const cup = (0.019 + 0.009 * smoothstep(t, 0.42, 0.94))
      * (0.77 * u * u + 0.23 * u ** 4);
    p.x = u * halfWidth(t);
    return p.addScaledVector(n, cup);
  }

  function surfaceNormal(u, t) {
    const e = 0.00008;
    const du = naturalPoint(u + e, t).sub(naturalPoint(u - e, t));
    const ta = Math.max(0, t - e);
    const tb = Math.min(1, t + e);
    const dt = naturalPoint(u, tb).sub(naturalPoint(u, ta));
    return du.cross(dt).normalize();
  }

  // Trim each end with a continuous round corner in the shell's own surface.
  // This avoids the pinched vertices and square corners of a bent plane.
  function surfaceCoordinates(u, v) {
    const q = clamp((Math.abs(u) - 0.84) / 0.16, 0, 1);
    const corner = 1 - Math.sqrt(Math.max(0, 1 - q * q));
    const start = (0.042 / spineLength) * corner;
    const end = 1 - (0.046 / spineLength) * corner;
    return { u, t: start + (end - start) * v };
  }

  function surfacePoint(u, v) {
    const uv = surfaceCoordinates(u, v);
    return { p: naturalPoint(uv.u, uv.t), n: surfaceNormal(uv.u, uv.t), t: uv.t };
  }

  function registerGeometry(geometry) {
    geometries.add(geometry);
    return geometry;
  }

  function mesh(geometry, material, name, phase = [0, 1]) {
    registerGeometry(geometry);
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.revealPhase = phase;
    object.userData.fullIndexCount = geometry.index?.count ?? geometry.attributes.position.count;
    revealMeshes.push(object);
    return object;
  }

  function surfaceGeometry(side) {
    const cols = 72;
    const rows = 128;
    const positions = [];
    const normals = [];
    const uv = [];
    const index = [];
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        const u = (i / cols) * 2 - 1;
        const s = surfacePoint(u, j / rows);
        const p = s.p.addScaledVector(s.n, side * halfThickness);
        positions.push(p.x, p.y, p.z);
        normals.push(s.n.x * side, s.n.y * side, s.n.z * side);
        uv.push((u + 1) / 2, s.t);
      }
    }
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const a = j * (cols + 1) + i;
        const b = a + 1;
        const c = a + cols + 1;
        const d = c + 1;
        if (side > 0) index.push(a, b, d, a, d, c);
        else index.push(a, d, b, a, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(index);
    geometry.computeBoundingSphere();
    return geometry;
  }

  const shell = new THREE.Group();
  shell.name = '01 / seven-ply continuous shell';
  const face = mesh(surfaceGeometry(1), materials.wood, 'Continuous walnut face', [0.08, 0.83]);
  const reverse = mesh(surfaceGeometry(-1), materials.wood, 'Continuous walnut reverse', [0.08, 0.83]);
  finishMeshes.push(face, reverse);
  shell.add(face, reverse);

  // Perimeter records, kept in winding order, describe the actual laminated
  // thickness rather than a line painted along the edge of a zero-depth plane.
  const boundary = [];
  const edgeCols = 72;
  const edgeRows = 128;
  for (let i = 0; i < edgeCols; i += 1) boundary.push(surfacePoint(-1 + (2 * i) / edgeCols, 0));
  for (let j = 0; j < edgeRows; j += 1) boundary.push(surfacePoint(1, j / edgeRows));
  for (let i = 0; i < edgeCols; i += 1) boundary.push(surfacePoint(1 - (2 * i) / edgeCols, 1));
  for (let j = 0; j < edgeRows; j += 1) boundary.push(surfacePoint(-1, 1 - j / edgeRows));
  const perimeterLengths = [0];
  for (let i = 0; i < boundary.length; i += 1) {
    const prev = boundary[(i - 1 + boundary.length) % boundary.length].p;
    const next = boundary[(i + 1) % boundary.length].p;
    boundary[i].outward = next.clone().sub(prev).normalize().cross(boundary[i].n).normalize();
    if (i) perimeterLengths.push(perimeterLengths[i - 1] + boundary[i].p.distanceTo(boundary[i - 1].p));
  }
  const perimeterLength = perimeterLengths.at(-1) + boundary.at(-1).p.distanceTo(boundary[0].p);

  function edgeProfile(h) {
    const d = Math.abs(h) - (halfThickness - bevel);
    if (d <= 0) return { bulge: bevel, side: 1, normal: 0 };
    const normalized = clamp(d / bevel, 0, 1);
    const side = Math.sqrt(Math.max(0, 1 - normalized * normalized));
    return { bulge: bevel * side, side, normal: Math.sign(h) * normalized };
  }

  // Seven physical veneer bands; the fine edge roll gets extra subdivisions.
  for (let layer = 0; layer < 7; layer += 1) {
    const positions = [];
    const normals = [];
    const uv = [];
    const indices = [];
    const divisions = layer === 0 || layer === 6 ? 7 : 1;
    for (let j = 0; j <= divisions; j += 1) {
      const h = halfThickness - ((layer + j / divisions) / 7) * thickness;
      const profile = edgeProfile(h);
      for (let i = 0; i <= boundary.length; i += 1) {
        const b = boundary[i % boundary.length];
        const p = b.p.clone().addScaledVector(b.n, h).addScaledVector(b.outward, profile.bulge);
        const n = b.outward.clone().multiplyScalar(profile.side).addScaledVector(b.n, profile.normal).normalize();
        positions.push(p.x, p.y, p.z);
        normals.push(n.x, n.y, n.z);
        uv.push((i === boundary.length ? perimeterLength : perimeterLengths[i]) / 0.55, (halfThickness - h) / thickness);
      }
    }
    for (let j = 0; j < divisions; j += 1) {
      for (let i = 0; i < boundary.length; i += 1) {
        const a = j * (boundary.length + 1) + i;
        const b = a + 1;
        const c = a + boundary.length + 1;
        const d = c + 1;
        indices.push(a, c, d, a, d, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeBoundingSphere();
    const veneer = mesh(g, layer % 2 ? materials.wood : materials.woodEdge, `Veneer ${layer + 1} / rounded ply edge`, [0.16, 0.86]);
    veneer.userData.noOutline = true;
    edgeMeshes.push(veneer);
    shell.add(veneer);
  }

  function addPart(name, object, offset) {
    group.add(object);
    const part = {
      name,
      object,
      basePosition: object.position.clone(),
      explodeOffset: offset.clone(),
    };
    parts.push(part);
    return part;
  }
  addPart('shell', shell, new THREE.Vector3(0, 0.23, 0));

  function roundedClosedPath(vertices, radii) {
    const path = new THREE.CurvePath();
    const corners = vertices.map((p, i) => {
      const previous = vertices[(i - 1 + vertices.length) % vertices.length];
      const next = vertices[(i + 1) % vertices.length];
      const amount = Math.min(radii[i], p.distanceTo(previous) * 0.35, p.distanceTo(next) * 0.35);
      return {
        p,
        in: p.clone().add(previous.clone().sub(p).normalize().multiplyScalar(amount)),
        out: p.clone().add(next.clone().sub(p).normalize().multiplyScalar(amount)),
      };
    });
    for (let i = 0; i < corners.length; i += 1) {
      const current = corners[i];
      const next = corners[(i + 1) % corners.length];
      path.add(new THREE.QuadraticBezierCurve3(current.in, current.p, current.out));
      path.add(new THREE.LineCurve3(current.out, next.in));
    }
    return path;
  }

  function roundedProfile(outerRadius, innerRadius, height, chamfer = 0.0004) {
    const c = Math.min(chamfer, height / 4);
    const geometry = new THREE.LatheGeometry([
      new THREE.Vector2(innerRadius, -height / 2),
      new THREE.Vector2(outerRadius - c, -height / 2),
      new THREE.Vector2(outerRadius, -height / 2 + c),
      new THREE.Vector2(outerRadius, height / 2 - c),
      new THREE.Vector2(outerRadius - c, height / 2),
      new THREE.Vector2(innerRadius, height / 2),
      new THREE.Vector2(innerRadius, -height / 2),
    ], 28);
    // LatheGeometry retains the final meridian's unnormalised edge vector.
    // Normalise it explicitly because these millimetre-sized parts magnify it.
    geometry.normalizeNormals();
    return geometry;
  }

  function cylinder(radius, height, material, name, segments = 28, phase = [0.38, 0.98]) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, segments, 1), material, name, phase);
  }

  function tubeBetween(a, b, radius, material, name, phase = [0.25, 0.92]) {
    const tube = cylinder(radius, a.distanceTo(b), material, name, 20, phase);
    tube.position.copy(a).add(b).multiplyScalar(0.5);
    tube.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize());
    return tube;
  }

  const mountZ = [0.186, -0.114];
  const frameX = 0.268;
  const frames = [];
  for (const side of [-1, 1]) {
    const frame = new THREE.Group();
    frame.name = side < 0 ? '02 / left bent sled' : '03 / right bent sled';
    const x = side * frameX;
    const rail = roundedClosedPath([
      new THREE.Vector3(x, 0.416, 0.251),
      new THREE.Vector3(x, 0.022, 0.331),
      new THREE.Vector3(x, 0.022, -0.310),
      new THREE.Vector3(x, 0.416, -0.207),
    ], [0.047, 0.050, 0.047, 0.045]);
    const tubular = mesh(new THREE.TubeGeometry(rail, 164, 0.011, 16, true), materials.metal, 'Ø22 continuous bent aluminium tube', [0.20, 0.89]);
    tubular.userData.outlineCurve = rail;
    tubular.userData.noEdgeOutline = true;
    frame.add(tubular);

    // Welded tabs reach inward to the four shell fixings; the shell itself is
    // never balanced on a tube or pierced by a decorative floating bolt.
    for (const z of mountZ) {
      const tab = mesh(new THREE.BoxGeometry(0.069, 0.005, 0.029), materials.metal, 'Welded shell support tab', [0.44, 0.97]);
      tab.position.set(side * 0.239, 0.427, z);
      frame.add(tab);
      const weld = new THREE.TorusGeometry(0.0098, 0.0007, 5, 24, Math.PI);
      const weldMesh = mesh(weld, materials.metal, 'Restrained welded seam', [0.58, 1]);
      weldMesh.rotation.x = Math.PI / 2;
      weldMesh.position.set(x, 0.426, z);
      weldMesh.userData.noOutline = true;
      frame.add(weldMesh);
    }

    for (const z of [0.230, -0.225]) {
      const foot = mesh(new THREE.CapsuleGeometry(0.0125, 0.020, 3, 12), materials.rubber, 'Replaceable floor glide', [0.38, 0.96]);
      foot.rotation.x = Math.PI / 2;
      foot.scale.y = 1.15;
      foot.scale.z = 0.5;
      foot.position.set(x, 0.00625, z);
      foot.userData.noOutline = true;
      frame.add(foot);
    }
    frames.push(frame);
    addPart(side < 0 ? 'left-frame' : 'right-frame', frame, new THREE.Vector3(side * 0.075, 0, 0));
  }

  // A pair of detachable transverse rods provides the lateral rigidity. They
  // remain centred when the one-piece side frames are separated for inspection.
  const ties = new THREE.Group();
  ties.name = 'Transverse under-seat tie rods';
  for (const z of mountZ) {
    ties.add(tubeBetween(
      new THREE.Vector3(-0.259, 0.408, z),
      new THREE.Vector3(0.259, 0.408, z),
      0.008, materials.metal, 'Ø16 transverse tie rod', [0.28, 0.93],
    ));
    for (const side of [-1, 1]) {
      const sleeve = cylinder(0.011, 0.018, materials.metal, 'Tie rod end sleeve', 24);
      sleeve.quaternion.setFromUnitVectors(Y, new THREE.Vector3(1, 0, 0));
      sleeve.position.set(side * 0.249, 0.408, z);
      ties.add(sleeve);
    }
  }
  group.add(ties);

  function pointAtXZ(x, z) {
    let lo = 0;
    let hi = 0.70;
    for (let i = 0; i < 30; i += 1) {
      const t = (lo + hi) / 2;
      if (naturalPoint(x / halfWidth(t), t).z > z) lo = t;
      else hi = t;
    }
    const t = (lo + hi) / 2;
    const u = x / halfWidth(t);
    return { p: naturalPoint(u, t), n: surfaceNormal(u, t), t, u };
  }

  const hardwareDetails = [];
  const mountPoints = [];
  let mountIndex = 0;
  for (const side of [-1, 1]) {
    for (const z of mountZ) {
      const location = pointAtXZ(side * 0.210, z);
      mountPoints.push(location.p.clone());
      const hardware = new THREE.Group();
      hardware.name = `0${4 + mountIndex} / M5 isolated shell mounting`;
      hardware.position.copy(location.p);
      const shellSurfaceHeight = location.n.y * halfThickness;
      const top = shellSurfaceHeight + 0.0010;
      const plateBottom = 0.4245 - location.p.y;
      const boltBottom = plateBottom - 0.013;
      const shaft = cylinder(0.00245, top - boltBottom, materials.metal, 'M5 through bolt', 20, [0.68, 1]);
      shaft.position.y = (top + boltBottom) / 2;
      hardware.add(shaft);

      const head = mesh(roundedProfile(0.0056, 0, 0.0018, 0.00035), materials.metal, 'Flush machined bolt head', [0.65, 1]);
      head.position.y = top;
      head.quaternion.setFromUnitVectors(Y, location.n);
      hardware.add(head);
      const socket = cylinder(0.0019, 0.00016, materials.darkMetal, 'Recessed hex key socket', 6, [0.65, 1]);
      socket.position.copy(head.position).addScaledVector(location.n, 0.00097);
      socket.quaternion.copy(head.quaternion);
      socket.rotateY(Math.PI / 6);
      socket.userData.noOutline = true;
      hardware.add(socket);

      const padTop = -shellSurfaceHeight;
      const padBottom = 0.4302 - location.p.y;
      const padHeight = Math.max(0.004, padTop - padBottom);
      const pad = mesh(roundedProfile(0.0125, 0.0027, padHeight, 0.0008), materials.rubber, 'Elastomer shell isolation pad', [0.58, 1]);
      pad.position.y = (padTop + padBottom) / 2;
      hardware.add(pad);

      const washer = mesh(roundedProfile(0.0077, 0.0027, 0.0012, 0.00025), materials.metal, 'Bored underside washer', [0.63, 1]);
      washer.position.y = plateBottom - 0.0008;
      hardware.add(washer);
      const nut = cylinder(0.0052, 0.0042, materials.metal, 'M5 hexagonal lock nut', 6, [0.67, 1]);
      nut.position.y = plateBottom - 0.0036;
      hardware.add(nut);

      class FineThread extends THREE.Curve {
        getPoint(t, target = new THREE.Vector3()) {
          const angle = t * Math.PI * 2 * 4;
          return target.set(Math.cos(angle) * 0.00247, boltBottom + 0.001 + t * 0.006, Math.sin(angle) * 0.00247);
        }
      }
      const thread = mesh(new THREE.TubeGeometry(new FineThread(), 60, 0.00020, 5, false), materials.metal, 'Visible fine bolt thread', [0.72, 1]);
      thread.userData.noOutline = true;
      hardware.add(thread);
      hardwareDetails.push({ washer, nut, washerY: washer.position.y, nutY: nut.position.y });
      addPart(`mount-${mountIndex + 1}`, hardware, new THREE.Vector3(0, 0.105, 0));
      mountIndex += 1;
    }
  }

  // The outline tree follows precisely the same parts as the solid object.
  // It contains perimeter and structural contours, never triangle wireframes.
  function makeOutlineTree(source) {
    const target = new THREE.Group();
    target.name = `${source.name} / outline`;
    target.position.copy(source.position);
    target.quaternion.copy(source.quaternion);
    target.scale.copy(source.scale);
    outlinePairs.push({ source, target });
    if (source.isMesh && !source.userData.noOutline) {
      if (!source.userData.noEdgeOutline) {
        const line = new THREE.LineSegments(registerGeometry(new THREE.EdgesGeometry(source.geometry, 32)), outlineMaterial);
        line.renderOrder = 5;
        target.add(line);
      }
      if (source.userData.outlineCurve) {
        const geometry = registerGeometry(new THREE.BufferGeometry().setFromPoints(source.userData.outlineCurve.getPoints(220)));
        const line = new THREE.Line(geometry, outlineMaterial);
        line.renderOrder = 5;
        target.add(line);
      }
    }
    for (const child of source.children) target.add(makeOutlineTree(child));
    return target;
  }
  for (const part of parts) outlines.add(makeOutlineTree(part.object));
  outlines.add(makeOutlineTree(ties));

  const anchors = {
    shell: new THREE.Vector3(0.16, 0.706, -0.280),
    back: new THREE.Vector3(0, 0.735, -0.298),
    frame: new THREE.Vector3(0.268, 0.224, 0.294),
    connection: mountPoints[2].clone(),
    connectionRear: mountPoints[3].clone(),
    edge: naturalPoint(1, 0.34),
    seat: new THREE.Vector3(0, 0.447, 0.120),
    centre: new THREE.Vector3(0, 0.435, -0.017),
    widthA: new THREE.Vector3(-0.282, 0.066, 0.388),
    widthB: new THREE.Vector3(0.282, 0.066, 0.388),
    heightA: new THREE.Vector3(0.366, 0.006, -0.342),
    heightB: new THREE.Vector3(0.366, 0.840, -0.342),
    depthA: new THREE.Vector3(-0.356, 0.006, -0.350),
    depthB: new THREE.Vector3(-0.356, 0.006, 0.331),
    seatHeightA: new THREE.Vector3(0.345, 0.006, 0.227),
    seatHeightB: new THREE.Vector3(0.345, 0.451, 0.227),
    floor: new THREE.Vector3(0, 0, 0),
  };

  function setExplode(amount) {
    const a = clamp(amount, 0, 1);
    for (const part of parts) part.object.position.copy(part.basePosition).addScaledVector(part.explodeOffset, a);
    ties.position.y = -0.022 * a;
    for (const detail of hardwareDetails) {
      detail.washer.position.y = detail.washerY - a * 0.010;
      detail.nut.position.y = detail.nutY - a * 0.023;
    }
    for (const { source, target } of outlinePairs) {
      target.position.copy(source.position);
      target.quaternion.copy(source.quaternion);
      target.scale.copy(source.scale);
    }
  }

  function setReveal(amount) {
    const a = clamp(amount, 0, 1);
    for (const object of revealMeshes) {
      const [start, end] = object.userData.revealPhase;
      const fraction = clamp((a - start) / (end - start), 0, 1);
      const count = object.userData.fullIndexCount;
      object.geometry.setDrawRange(0, fraction >= 1 ? count : Math.floor((count * fraction) / 3) * 3);
      object.visible = fraction > 0;
    }
    outlineMaterial.opacity = 0.68 * (1 - smoothstep(a, 0.12, 0.96));
    outlines.visible = outlineMaterial.opacity > 0.001;
  }

  function setFinish(index) {
    const finish = materials.finishes?.[index];
    if (!finish) return;
    const surfaceMaterial = finish.isMaterial ? finish : finish.wood;
    if (surfaceMaterial) for (const object of finishMeshes) object.material = surfaceMaterial;
    if (finish.woodEdge) {
      for (let i = 0; i < edgeMeshes.length; i += 1) {
        edgeMeshes[i].material = i % 2 && surfaceMaterial ? surfaceMaterial : finish.woodEdge;
      }
    }
  }

  function dispose() {
    for (const geometry of geometries) geometry.dispose();
    outlineMaterial.dispose();
  }

  setExplode(0);
  setReveal(1);
  group.updateMatrixWorld(true);
  return {
    group, parts, shell, outlines, anchors,
    outlineMaterial,
    surfaces: finishMeshes,
    edgeMeshes,
    frames,
    ties,
    setExplode, setReveal, setFinish, dispose,
  };
}
