import * as THREE from 'three';

// Original objects for FORM. All dimensions are in metres; the floor is y = 0.
// Geometry owns its materials but deliberately does not own their shared textures.
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function makeMaterialSet(sources, names) {
  const materials = {};
  const states = [];
  for (const name of names) {
    if (!sources[name]?.isMaterial) throw new TypeError(`FORM: missing ${name} material.`);
    const source = sources[name];
    const material = source.clone();
    // Material.copy does not preserve custom compilation hooks.
    material.onBeforeCompile = source.onBeforeCompile;
    material.customProgramCacheKey = source.customProgramCacheKey;
    material.name = `FORM / ${name}`;
    materials[name] = material;
    states.push({ material, opacity: source.opacity, transparent: source.transparent, depthWrite: source.depthWrite });
  }
  return { materials, states };
}

function addMaterialState(states, material) {
  states.push({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
}

function reveal(group, states, value) {
  const amount = clamp01(value);
  group.visible = amount > 0.0001;
  for (const state of states) {
    const transparent = state.transparent || amount < 0.9999;
    if (state.material.transparent !== transparent) {
      state.material.transparent = transparent;
      state.material.needsUpdate = true;
    }
    state.material.opacity = state.opacity * amount;
    state.material.depthWrite = state.depthWrite && amount > 0.5;
  }
  return amount;
}

function mesh(name, geometry, material, parent) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = true;
  if (parent) parent.add(object);
  return object;
}

function subgroup(name, parent) {
  const object = new THREE.Group();
  object.name = name;
  if (parent) parent.add(object);
  return object;
}

/** Smooth analytic tangent in the increasing-u direction of a revolved mesh. */
function latheTangents(geometry, profileLength, segments) {
  const tangents = new Float32Array(geometry.attributes.position.count * 4);
  for (let ring = 0; ring <= segments; ring++) {
    const angle = ring / segments * TAU;
    const x = Math.cos(angle);
    const z = -Math.sin(angle);
    for (let point = 0; point < profileLength; point++) {
      const offset = (ring * profileLength + point) * 4;
      tangents[offset] = x;
      tangents[offset + 2] = z;
      tangents[offset + 3] = 1;
    }
  }
  geometry.setAttribute('tangent', new THREE.BufferAttribute(tangents, 4));
  return geometry;
}

/** A real revolved solid with softened edges, rather than stacked flat cylinders. */
function roundedDisk(radius, height, bevel = 0.001, segments = 96, planarUV = false, bore = 0) {
  const fillet = Math.min(bevel, height * 0.49, (radius - bore) * 0.49);
  const bottom = -height / 2;
  const top = height / 2;
  const points = [new THREE.Vector2(bore, bottom), new THREE.Vector2(radius - fillet, bottom)];
  for (let i = 1; i <= 6; i++) {
    const angle = -Math.PI / 2 + (Math.PI / 2) * (i / 6);
    points.push(new THREE.Vector2(radius - fillet + Math.cos(angle) * fillet, bottom + fillet + Math.sin(angle) * fillet));
  }
  points.push(new THREE.Vector2(radius, top - fillet));
  for (let i = 1; i <= 6; i++) {
    const angle = (Math.PI / 2) * (i / 6);
    points.push(new THREE.Vector2(radius - fillet + Math.cos(angle) * fillet, top - fillet + Math.sin(angle) * fillet));
  }
  points.push(new THREE.Vector2(bore, top));
  if (bore > 0) points.push(new THREE.Vector2(bore, bottom));
  const geometry = new THREE.LatheGeometry(points, segments);
  // LatheGeometry leaves its final-meridian normal at the length of the final
  // profile edge. With millimetre details that can be < 0.001; interpolating
  // those against unit normals introduces face-shaped highlights at the seam.
  geometry.normalizeNormals();
  if (!planarUV) latheTangents(geometry, points.length, segments);
  if (planarUV) {
    // Natural, uninterrupted stone grain across the disk. Cylindrical UVs on a
    // solid lathe would otherwise pull a material map into radial spokes.
    const positions = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      uv.setXY(i, 0.5 + positions.getX(i) / (radius * 2), 0.5 + positions.getZ(i) / (radius * 2));
    }
    uv.needsUpdate = true;
  }
  return geometry;
}

function cylinderBetween(name, start, end, radius, material, parent, segments = 28) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const object = mesh(name, roundedDisk(radius, length, Math.min(radius * 0.22, 0.001), segments), material, parent);
  object.position.copy(start).add(end).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(UP, direction.divideScalar(length));
  return object;
}

function roundedPlate(width, depth, thickness, radius = 0.006) {
  const x = -width / 2;
  const z = -depth / 2;
  const r = Math.min(radius, width / 2, depth / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, z);
  shape.lineTo(x + width - r, z);
  shape.quadraticCurveTo(x + width, z, x + width, z + r);
  shape.lineTo(x + width, z + depth - r);
  shape.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth);
  shape.lineTo(x + r, z + depth);
  shape.quadraticCurveTo(x, z + depth, x, z + depth - r);
  shape.lineTo(x, z + r);
  shape.quadraticCurveTo(x, z, x + r, z);
  const edge = Math.min(0.00075, thickness / 4);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - edge * 2,
    bevelEnabled: true,
    bevelThickness: edge,
    bevelSize: edge,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -(thickness - edge * 2) / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function disposeObject(group, materials) {
  const geometries = new Set();
  group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of new Set(materials)) material.dispose();
  group.removeFromParent();
}

/**
 * ORB / 02 — A spun aluminium shade, opal diffuser and weighted limestone base.
 *
 * setSection(0): complete object. setSection(1): remove its positive-x half.
 * The exposed edge is an actual thin ribbon of material, not a hollow sphere.
 * Call updateSectionPlane() after moving/rotating/scaling group or an ancestor.
 * Requires renderer.localClippingEnabled = true when using the section study.
 */
export function createLamp(sources) {
  const { materials, states } = makeMaterialSet(sources, ['metal', 'darkMetal', 'stone', 'diffuser', 'rubber']);
  const group = subgroup('ORB / lamp');
  group.userData.identity = 'ORB';
  group.userData.dimensions = { diameter: 0.38, height: 0.4, wallThickness: 0.0025 };

  const baseAssembly = subgroup('Weighted limestone base', group);
  const stemAssembly = subgroup('Stem and internal support', group);
  const shadeAssembly = subgroup('Spun shell', group);
  const diffuserAssembly = subgroup('Diffuser and retaining ring', group);

  const base = mesh('Limestone base / softly dressed edge', roundedDisk(0.09, 0.037, 0.0023, 112, true), materials.stone, baseAssembly);
  base.position.y = 0.0185;
  const baseFerrule = mesh('Inset stem ferrule', roundedDisk(0.013, 0.003, 0.00065, 48), materials.metal, baseAssembly);
  baseFerrule.position.y = 0.038;
  const stem = mesh('Brushed aluminium stem / 18 mm', roundedDisk(0.009, 0.236, 0.0008, 64), materials.metal, stemAssembly);
  stem.position.y = 0.155;

  const collar = mesh('Machined diffuser collar', roundedDisk(0.0145, 0.019, 0.001, 64, false, 0.0042), materials.metal, stemAssembly);
  collar.position.y = 0.2775;
  const collarSeam = mesh('Collar gasket', roundedDisk(0.0146, 0.0008, 0.00015, 48, false, 0.0042), materials.darkMetal, stemAssembly);
  collarSeam.position.y = 0.2818;
  const locknut = mesh('Retaining locknut', roundedDisk(0.0085, 0.005, 0.0007, 6, false, 0.0042), materials.darkMetal, stemAssembly);
  locknut.position.y = 0.2895;
  const tieRod = mesh('Concealed shade tie rod', roundedDisk(0.004, 0.119, 0.00035, 36), materials.metal, stemAssembly);
  tieRod.position.y = 0.3355;
  const crownSocket = mesh('Internal crown socket', roundedDisk(0.0105, 0.008, 0.001, 48, false, 0.004), materials.darkMetal, shadeAssembly);
  crownSocket.position.y = 0.391;

  const shellRadius = 0.19;
  const shellBase = 0.26625;
  const shellRise = 0.4 - shellBase;
  const wall = 0.0025;
  const shellProfile = [];
  // Exterior rises from the lip to the crown.
  for (let i = 0; i <= 56; i++) {
    const angle = (i / 56) * Math.PI / 2;
    shellProfile.push(new THREE.Vector2(shellRadius * Math.cos(angle), shellBase + shellRise * Math.sin(angle)));
  }
  // The reverse interior is a true offset along the ellipsoid normal. The
  // thickness therefore stays approximately 2.5 mm at crown, shoulder and rim.
  for (let i = 56; i >= 0; i--) {
    const angle = (i / 56) * Math.PI / 2;
    const nx = Math.cos(angle) / shellRadius;
    const ny = Math.sin(angle) / shellRise;
    const scale = wall / Math.hypot(nx, ny);
    shellProfile.push(new THREE.Vector2(Math.max(0, shellRadius * Math.cos(angle) - nx * scale), shellBase + shellRise * Math.sin(angle) - ny * scale));
  }
  // A rounded return seals the spun edge. No open-ended hemisphere or duplicate
  // torus overlaps are used to fake its wall thickness.
  for (let i = 1; i <= 8; i++) {
    const angle = Math.PI + (i / 8) * Math.PI;
    shellProfile.push(new THREE.Vector2(shellRadius - wall / 2 + Math.cos(angle) * wall / 2, shellBase + Math.sin(angle) * wall / 2));
  }

  const localSectionPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.205);
  const sectionPlane = localSectionPlane.clone();
  const shellMaterial = materials.metal.clone();
  shellMaterial.onBeforeCompile = materials.metal.onBeforeCompile;
  shellMaterial.customProgramCacheKey = materials.metal.customProgramCacheKey;
  shellMaterial.name = 'ORB / spun shell';
  shellMaterial.roughness = .62;
  shellMaterial.clippingPlanes = [sectionPlane];
  shellMaterial.clipShadows = true;
  materials.shade = shellMaterial;
  addMaterialState(states, shellMaterial);
  const shellGeometry = new THREE.LatheGeometry(shellProfile, 144);
  // Exact surface normals avoid profile-edge weighting and the zero-area
  // axial return. Tangents also prevent the anisotropic shader from deriving a
  // slightly different frame in each UV triangle of this non-spherical dome.
  const shellNormals = shellGeometry.attributes.normal;
  for (let ring = 0; ring <= 144; ring++) {
    const azimuth = ring / 144 * TAU;
    for (let profile = 0; profile < shellProfile.length; profile++) {
      let radial;
      let vertical;
      if (profile <= 56) {
        const angle = profile / 56 * Math.PI / 2;
        radial = Math.cos(angle) / shellRadius;
        vertical = Math.sin(angle) / shellRise;
      } else if (profile <= 113) {
        const angle = (113 - profile) / 56 * Math.PI / 2;
        radial = -Math.cos(angle) / shellRadius;
        vertical = -Math.sin(angle) / shellRise;
      } else {
        const angle = Math.PI + (profile - 113) / 8 * Math.PI;
        radial = Math.cos(angle);
        vertical = Math.sin(angle);
      }
      const length = Math.hypot(radial, vertical);
      shellNormals.setXYZ(ring * shellProfile.length + profile,
        Math.sin(azimuth) * radial / length,
        vertical / length,
        Math.cos(azimuth) * radial / length);
    }
  }
  shellGeometry.normalizeNormals();
  latheTangents(shellGeometry, shellProfile.length, 144);
  const shade = mesh('Closed spun-aluminium shade / 2.5 mm wall', shellGeometry, shellMaterial, shadeAssembly);

  const diffuserMaterial = materials.diffuser;
  diffuserMaterial.clippingPlanes = [sectionPlane];
  diffuserMaterial.clipShadows = true;
  const diffuser = mesh('Recessed opal diffuser', roundedDisk(0.1844, 0.003, 0.0006, 128, true, 0.0148), diffuserMaterial, diffuserAssembly);
  diffuser.position.y = 0.270;
  // The diffuser emits/receives light without casting an opaque disc shadow
  // across the spotlight beneath it.
  diffuser.castShadow = false;

  const rimMaterial = shellMaterial.clone();
  rimMaterial.onBeforeCompile = shellMaterial.onBeforeCompile;
  rimMaterial.customProgramCacheKey = shellMaterial.customProgramCacheKey;
  rimMaterial.clippingPlanes = [sectionPlane];
  materials.rim = rimMaterial;
  addMaterialState(states, rimMaterial);
  const retainingRing = mesh('Recessed machined retaining rim', roundedDisk(0.1869, 0.0018, 0.00035, 128, false, 0.1808), rimMaterial, diffuserAssembly);
  retainingRing.position.y = 0.2685;

  for (let i = 0; i < 3; i++) {
    const angle = Math.PI / 6 + i * TAU / 3;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const inside = direction.clone().multiplyScalar(0.014);
    inside.y = 0.275;
    const outside = direction.clone().multiplyScalar(0.174);
    outside.y = 0.275;
    cylinderBetween(`Internal carrier / ${i + 1}`, inside, outside, 0.0018, materials.darkMetal, stemAssembly, 20);
    const screw = mesh(`Diffuser captive screw / ${i + 1}`, roundedDisk(0.0021, 0.0014, 0.0003, 32), rimMaterial, diffuserAssembly);
    screw.position.set(Math.cos(angle) * 0.1833, 0.268, Math.sin(angle) * 0.1833);
  }

  // A separate section-edge ribbon seals the 2.5 mm cut. Its vertices update
  // deterministically with the clipping plane, including intermediate cuts.
  const sectionSegments = 72;
  const cutGeometry = new THREE.BufferGeometry();
  const cutPositions = new Float32Array((sectionSegments + 1) * 2 * 3);
  const cutNormals = new Float32Array(cutPositions.length);
  const cutUVs = new Float32Array((sectionSegments + 1) * 2 * 2);
  const cutIndices = [];
  for (let i = 0; i <= sectionSegments; i++) {
    for (let edge = 0; edge < 2; edge++) {
      cutNormals[(i * 2 + edge) * 3] = 1;
      cutUVs[(i * 2 + edge) * 2] = i / sectionSegments;
      cutUVs[(i * 2 + edge) * 2 + 1] = edge;
    }
    if (i < sectionSegments) {
      const a = i * 2;
      cutIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  cutGeometry.setAttribute('position', new THREE.BufferAttribute(cutPositions, 3).setUsage(THREE.DynamicDrawUsage));
  cutGeometry.setAttribute('normal', new THREE.BufferAttribute(cutNormals, 3));
  cutGeometry.setAttribute('uv', new THREE.BufferAttribute(cutUVs, 2));
  cutGeometry.setIndex(cutIndices);
  const cutMaterial = materials.metal.clone();
  cutMaterial.onBeforeCompile = materials.metal.onBeforeCompile;
  cutMaterial.customProgramCacheKey = materials.metal.customProgramCacheKey;
  cutMaterial.side = THREE.DoubleSide;
  // The freshly cut section has its own even machined finish; the shell's
  // wrapped brushing and anisotropy do not apply to this narrow planar wall.
  cutMaterial.anisotropy = 0;
  cutMaterial.roughness = 0.48;
  cutMaterial.roughnessMap = null;
  cutMaterial.bumpMap = null;
  cutMaterial.bumpScale = 0;
  materials.cutEdge = cutMaterial;
  addMaterialState(states, cutMaterial);
  const cutEdge = mesh('Visible section / material thickness', cutGeometry, cutMaterial, shadeAssembly);
  cutEdge.visible = false;
  cutEdge.frustumCulled = false;

  const cable = subgroup('Power lead / rear', group);
  const grommet = mesh('Rubber strain relief', roundedDisk(0.0052, 0.009, 0.001, 32), materials.rubber, cable);
  grommet.rotation.x = Math.PI / 2;
  grommet.position.set(0, 0.013, -0.087);
  const cablePath = new THREE.CurvePath();
  cablePath.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0.013, -0.092), new THREE.Vector3(0, 0.013, -0.108),
    new THREE.Vector3(0.02, 0.0022, -0.13), new THREE.Vector3(0.062, 0.0022, -0.14),
  ));
  cablePath.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.062, 0.0022, -0.14), new THREE.Vector3(0.17, 0.0022, -0.163),
    new THREE.Vector3(0.29, 0.0022, -0.164), new THREE.Vector3(0.40, 0.0022, -0.218),
  ));
  mesh('Continuous rubber cable', new THREE.TubeGeometry(cablePath, 80, 0.00175, 10, false), materials.rubber, cable);

  const anchors = {
    origin: new THREE.Vector3(),
    base: new THREE.Vector3(0, 0.0185, 0),
    top: new THREE.Vector3(0, 0.4, 0),
    shade: new THREE.Vector3(0, 0.325, 0),
    diffuser: new THREE.Vector3(0, 0.2685, 0),
    detail: new THREE.Vector3(0.0145, 0.2775, 0),
    widthLeft: new THREE.Vector3(-0.19, 0.265, 0),
    widthRight: new THREE.Vector3(0.19, 0.265, 0),
    heightTop: new THREE.Vector3(0.19, 0.4, 0),
    heightBottom: new THREE.Vector3(0.19, 0, 0),
  };

  function updateSectionPlane() {
    group.updateWorldMatrix(true, false);
    sectionPlane.copy(localSectionPlane).applyMatrix4(group.matrixWorld);
  }

  let lastSectionAmount = -1;
  function setSection(value) {
    const amount = clamp01(value);
    if (amount === lastSectionAmount) return;
    lastSectionAmount = amount;
    const distance = 0.205 * (1 - amount);
    localSectionPlane.constant = distance;
    cutEdge.visible = distance < shellRadius - 0.00001;
    if (cutEdge.visible) {
      const outerScale = Math.sqrt(Math.max(0, 1 - (distance / shellRadius) ** 2));
      const innerRadius = shellRadius - wall;
      // Invert the actual offset meridian, rather than approximating the inner
      // surface with a second ellipsoid. This keeps the cut edge joined to the
      // shell even in a close, grazing view.
      let lowerAngle = 0;
      let upperAngle = Math.PI / 2;
      if (distance < innerRadius) {
        for (let i = 0; i < 28; i++) {
          const angle = (lowerAngle + upperAngle) / 2;
          const nx = Math.cos(angle) / shellRadius;
          const ny = Math.sin(angle) / shellRise;
          const radius = shellRadius * Math.cos(angle) - wall * nx / Math.hypot(nx, ny);
          if (radius > distance) lowerAngle = angle;
          else upperAngle = angle;
        }
      } else {
        upperAngle = 0;
      }
      const innerAngleScale = Math.sin(upperAngle);
      for (let i = 0; i <= sectionSegments; i++) {
        const angle = (i / sectionSegments) * Math.PI;
        const baseIndex = i * 6;
        cutPositions[baseIndex] = distance;
        cutPositions[baseIndex + 1] = shellBase + shellRise * outerScale * Math.sin(angle);
        cutPositions[baseIndex + 2] = shellRadius * outerScale * Math.cos(angle);
        cutPositions[baseIndex + 3] = distance;
        const innerAngle = Math.asin(Math.min(1, innerAngleScale * Math.sin(angle)));
        const nx = Math.cos(innerAngle) / shellRadius;
        const ny = Math.sin(innerAngle) / shellRise;
        const offset = wall / Math.hypot(nx, ny);
        const radius = shellRadius * Math.cos(innerAngle) - nx * offset;
        cutPositions[baseIndex + 4] = shellBase + shellRise * Math.sin(innerAngle) - ny * offset;
        cutPositions[baseIndex + 5] = Math.sign(Math.cos(angle)) * Math.sqrt(Math.max(0, radius * radius - distance * distance));
      }
      cutGeometry.attributes.position.needsUpdate = true;
      cutGeometry.computeBoundingSphere();
    }
    updateSectionPlane();
  }

  function setExplode(value) {
    const amount = clamp01(value);
    shadeAssembly.position.y = amount * 0.12;
    diffuserAssembly.position.y = amount * 0.04;
    anchors.top.y = 0.4 + amount * 0.12;
    anchors.shade.y = 0.325 + amount * 0.12;
    anchors.diffuser.y = 0.2685 + amount * 0.04;
    anchors.widthLeft.y = anchors.widthRight.y = 0.265 + amount * 0.12;
    anchors.heightTop.y = anchors.top.y;
  }

  setSection(0);
  return {
    group, materials, shade, diffuser, cable, sectionPlane, anchors,
    parts: { base: baseAssembly, stem: stemAssembly, shade: shadeAssembly, diffuser: diffuserAssembly, cable },
    setExplode, setSection, updateSectionPlane,
    setReveal: (amount) => reveal(group, states, amount),
    dispose: () => disposeObject(group, states.map((state) => state.material)),
  };
}

/** PLANE / 03 — Limestone plane, three slender legs and a legible Y load path. */
export function createTable(sources) {
  const { materials, states } = makeMaterialSet(sources, ['metal', 'darkMetal', 'stone', 'rubber']);
  const group = subgroup('PLANE / occasional table');
  group.userData.identity = 'PLANE';
  group.userData.dimensions = { diameter: 0.54, height: 0.43, topThickness: 0.03 };

  const topAssembly = subgroup('Dressed limestone tabletop', group);
  const top = mesh('Continuous limestone disk / 30 mm', roundedDisk(0.27, 0.03, 0.0024, 144, true), materials.stone, topAssembly);
  top.position.y = 0.415;
  const underframe = subgroup('Three-way underframe', group);
  const hub = mesh('Machined central hub', roundedDisk(0.025, 0.012, 0.0018, 64), materials.metal, underframe);
  hub.position.y = 0.377;
  const hubFastener = mesh('Recessed hub fastener', roundedDisk(0.0055, 0.002, 0.00035, 6), materials.darkMetal, underframe);
  hubFastener.position.y = 0.3705;

  const legs = [];
  const brackets = [];
  const directions = [];
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI / 6 + i * TAU / 3;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    directions.push(direction);
    const leg = subgroup(`Leg ${i + 1} / aluminium and elastomer`, group);
    leg.position.copy(direction).multiplyScalar(0.185);
    const column = mesh(`Leg ${i + 1} / 20 mm tube`, roundedDisk(0.01, 0.395, 0.00085, 48), materials.metal, leg);
    column.position.y = 0.2025;
    const foot = mesh(`Leg ${i + 1} / fitted floor glide`, roundedDisk(0.0106, 0.005, 0.001, 40), materials.rubber, leg);
    foot.position.y = 0.0025;
    const socket = mesh(`Leg ${i + 1} / upper sleeve`, roundedDisk(0.0122, 0.018, 0.0008, 48), materials.metal, leg);
    socket.position.y = 0.389;
    const sleeveSeam = mesh(`Leg ${i + 1} / sleeve joint`, roundedDisk(0.01223, 0.0006, 0.0001, 40), materials.darkMetal, leg);
    sleeveSeam.position.y = 0.3804;
    legs.push(leg);

    const armStart = direction.clone().multiplyScalar(0.016);
    armStart.y = 0.378;
    const armEnd = direction.clone().multiplyScalar(0.184);
    armEnd.y = 0.388;
    cylinderBetween(`Y support / branch ${i + 1}`, armStart, armEnd, 0.006, materials.metal, underframe, 32);

    const bracket = subgroup(`Mounting plate ${i + 1}`, group);
    bracket.position.copy(direction).multiplyScalar(0.185);
    bracket.position.y = 0.3975;
    bracket.rotation.y = -angle;
    mesh(`Saddle ${i + 1} / rounded mounting plate`, roundedPlate(0.050, 0.029, 0.0045, 0.005), materials.metal, bracket);
    for (const side of [-1, 1]) {
      const shaft = mesh(`Mounting stud ${i + 1}.${side > 0 ? 2 : 1}`, roundedDisk(0.00165, 0.013, 0.0002, 24), materials.darkMetal, bracket);
      shaft.position.set(side * 0.017, 0.0065, 0);
      const screwHead = mesh(`Captive fixing ${i + 1}.${side > 0 ? 2 : 1}`, roundedDisk(0.0026, 0.0014, 0.00025, 32), materials.darkMetal, bracket);
      screwHead.position.set(side * 0.017, -0.003, 0);
      // A physical straight screwdriver recess remains legible in the detail
      // and assembly views without texture decals or floating graphics.
      const slot = mesh(`Fixing slot ${i + 1}.${side > 0 ? 2 : 1}`, new THREE.BoxGeometry(0.0031, 0.00012, 0.0005), materials.rubber, bracket);
      slot.position.set(side * 0.017, -0.00376, 0);
    }
    brackets.push(bracket);
  }

  const anchors = {
    origin: new THREE.Vector3(),
    top: new THREE.Vector3(0, 0.43, 0),
    center: new THREE.Vector3(0, 0.215, 0),
    detail: new THREE.Vector3(Math.cos(Math.PI / 6) * 0.185, 0.3975, Math.sin(Math.PI / 6) * 0.185),
    widthLeft: new THREE.Vector3(-0.27, 0.415, 0),
    widthRight: new THREE.Vector3(0.27, 0.415, 0),
    heightTop: new THREE.Vector3(0.27, 0.43, 0),
    heightBottom: new THREE.Vector3(0.27, 0, 0),
  };

  function setExplode(value) {
    const amount = clamp01(value);
    topAssembly.position.y = amount * 0.16;
    for (let i = 0; i < legs.length; i++) {
      legs[i].position.copy(directions[i]).multiplyScalar(0.185 + amount * 0.1);
      brackets[i].position.copy(directions[i]).multiplyScalar(0.185 + amount * 0.04);
      brackets[i].position.y = 0.3975 + amount * 0.05;
    }
    anchors.top.y = 0.43 + amount * 0.16;
    anchors.widthLeft.y = anchors.widthRight.y = 0.415 + amount * 0.16;
    anchors.heightTop.y = anchors.top.y;
    anchors.detail.copy(brackets[0].position);
  }

  return {
    group, materials, top, anchors,
    parts: { top: topAssembly, underframe, legs, brackets },
    setExplode,
    setReveal: (amount) => reveal(group, states, amount),
    dispose: () => disposeObject(group, states.map((state) => state.material)),
  };
}
