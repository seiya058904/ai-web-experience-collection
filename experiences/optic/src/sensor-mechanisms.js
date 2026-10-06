import * as THREE from "three";

/*
 * OPTIC / original authored mechanical and micro-optical geometry.
 * Units: 25 mm per scene unit. Light arrives from +Z and travels toward -Z.
 * These factories deliberately own neither a renderer nor an animation clock.
 */

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ease = (n) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const SHUTTER_WIDTH = 1.48;
const SHUTTER_HEIGHT = 1;
const SENSOR_WIDTH = 1.44;
const SENSOR_HEIGHT = 0.96;

/**
 * A deterministic focal-plane shutter cycle.
 *
 * During the exposure (.12–.80), both curtain edges travel downwards across
 * the gate in `transit` seconds. The second curtain follows after `exposure`
 * seconds. Every row therefore receives the same exposure duration, including
 * exposures shorter than transit time. The preparation/reset intervals are
 * compressed for the scroll film and are not a real-time service simulation.
 *
 * `firstTravel`: 0 = first curtain covers the gate; 1 = stowed below it.
 * `secondTravel`: 0 = second curtain stowed above; 1 = covers the gate.
 * `openTop` and `openBottom` are positions in the 1-unit-tall gate.
 */
export function shutterState(phase, exposure = 1 / 125, transit = 0.004) {
  const p = clamp01(phase);
  const seconds =
    Number.isFinite(exposure) && exposure > 0 ? exposure : 1 / 125;
  const sweep = Number.isFinite(transit) && transit > 0 ? transit : 0.004;
  let firstTravel = 1;
  let secondTravel = 0;
  let physicalTime = null;
  let stage = "live-view";

  // Close, cock the first curtain, then return the second while the first
  // protects the sensor. Upwards movement occurs only during reset.
  if (p < 0.04) {
    secondTravel = ease(p / 0.04);
    stage = "pre-close";
  } else if (p < 0.08) {
    firstTravel = 1 - ease((p - 0.04) / 0.04);
    secondTravel = 1;
    stage = "cock-first";
  } else if (p < 0.12) {
    firstTravel = 0;
    secondTravel = 1 - ease((p - 0.08) / 0.04);
    stage = "cock-second";
  } else if (p <= 0.8) {
    physicalTime = ((p - 0.12) / 0.68) * (seconds + sweep);
    firstTravel = clamp01(physicalTime / sweep);
    secondTravel = clamp01((physicalTime - seconds) / sweep);
    stage = "exposure";
  } else if (p < 0.88) {
    firstTravel = 1 - ease((p - 0.8) / 0.08);
    secondTravel = 1;
    stage = "reset-first";
  } else if (p < 0.94) {
    firstTravel = 0;
    secondTravel = 1 - ease((p - 0.88) / 0.06);
    stage = "reset-second";
  } else {
    firstTravel = ease((p - 0.94) / 0.06);
    secondTravel = 0;
    stage = p === 1 ? "live-view" : "reopen";
  }

  const openFraction = Math.max(0, firstTravel - secondTravel);
  return {
    phase: p,
    stage,
    exposureSeconds: seconds,
    transitSeconds: sweep,
    physicalTime,
    firstTravel,
    secondTravel,
    firstEdgeY: SHUTTER_HEIGHT * (0.5 - firstTravel),
    secondEdgeY: SHUTTER_HEIGHT * (0.5 - secondTravel),
    openTop: SHUTTER_HEIGHT * (0.5 - secondTravel),
    openBottom: SHUTTER_HEIGHT * (0.5 - firstTravel),
    openFraction,
    openHeight: SHUTTER_HEIGHT * openFraction,
    fullyOpen: openFraction >= 1 - 1e-8,
  };
}

function roundedPath(path, width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  path.closePath();
  return path;
}

function bevelPlate(
  width,
  height,
  depth,
  radius = 0.02,
  bevel = 0.003,
  detail = 5,
) {
  const shape = roundedPath(new THREE.Shape(), width, height, radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel > 0,
    bevelSegments: detail <= 2 ? 1 : 2,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: detail,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function ringPlate(outerW, outerH, innerW, innerH, depth) {
  const shape = roundedPath(new THREE.Shape(), outerW, outerH, 0.075);
  shape.holes.push(roundedPath(new THREE.Path(), innerW, innerH, 0.009));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.005,
    bevelThickness: 0.005,
    curveSegments: 5,
    steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function mesh(geometry, material, parent, x = 0, y = 0, z = 0, name = "") {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.name = name;
  parent.add(item);
  return item;
}

function disposeGroup(group) {
  const geometries = new Set();
  const materials = new Set();
  const instances = new Set();
  group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.isInstancedMesh) instances.add(object);
    if (object.material) {
      for (const mat of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(mat);
      }
    }
  });
  for (const instance of instances) instance.dispose();
  for (const geo of geometries) geo.dispose();
  for (const mat of materials) mat.dispose();
  group.removeFromParent();
  group.clear();
}

/** A vertical, two-curtain focal-plane shutter, with rigid stacking blades. */
export function createShutter() {
  const group = new THREE.Group();
  group.name = "focalPlaneShutter";
  group.userData = {
    opening: { width: SHUTTER_WIDTH, height: SHUTTER_HEIGHT, z: 0.27 },
    travelDirection: "-Y",
    transitSeconds: 0.004,
  };
  const W = SHUTTER_WIDTH;
  const H = SHUTTER_HEIGHT;
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x24292b,
    metalness: 0.88,
    roughness: 0.36,
  });
  const blackMetal = new THREE.MeshStandardMaterial({
    color: 0x101315,
    metalness: 0.68,
    roughness: 0.48,
  });
  const bladeMetal = new THREE.MeshStandardMaterial({
    color: 0x25282a,
    metalness: 0.78,
    roughness: 0.47,
  });
  const bladeBackMetal = new THREE.MeshStandardMaterial({
    color: 0x1a1d1f,
    metalness: 0.73,
    roughness: 0.43,
  });
  const brushedEdge = new THREE.MeshStandardMaterial({
    color: 0x626766,
    metalness: 0.93,
    roughness: 0.3,
  });
  const screwMetal = new THREE.MeshStandardMaterial({
    color: 0x3b4142,
    metalness: 0.86,
    roughness: 0.32,
  });

  mesh(
    ringPlate(2.08, 1.57, W, H, 0.065),
    graphite,
    group,
    0,
    0,
    0.242,
    "shutter-chassis",
  );
  mesh(
    ringPlate(1.67, 1.18, W + 0.006, H + 0.006, 0.018),
    blackMetal,
    group,
    0,
    0,
    0.313,
    "gate-lip",
  );

  // Actual blade cassettes hide the stowed, overlapping rigid slats.
  const cassetteGeometry = bevelPlate(W + 0.15, 0.174, 0.075, 0.018, 0.003);
  mesh(
    cassetteGeometry,
    blackMetal,
    group,
    0,
    H / 2 + 0.088,
    0.31,
    "upper-curtain-cassette",
  );
  mesh(
    cassetteGeometry,
    blackMetal,
    group,
    0,
    -H / 2 - 0.088,
    0.31,
    "lower-curtain-cassette",
  );
  const cassetteEdge = new THREE.BoxGeometry(W + 0.07, 0.006, 0.004);
  mesh(
    cassetteEdge,
    brushedEdge,
    group,
    0,
    H / 2 + 0.182,
    0.349,
    "upper-machined-edge",
  );
  mesh(
    cassetteEdge,
    brushedEdge,
    group,
    0,
    -H / 2 - 0.182,
    0.349,
    "lower-machined-edge",
  );

  const railGeometry = bevelPlate(0.036, H + 0.27, 0.044, 0.009, 0.002);
  for (const side of [-1, 1]) {
    mesh(
      railGeometry,
      brushedEdge,
      group,
      side * (W / 2 + 0.084),
      0,
      0.29,
      "blade-guide-rail",
    );
    mesh(
      new THREE.BoxGeometry(0.012, H + 0.19, 0.008),
      blackMetal,
      group,
      side * (W / 2 + 0.061),
      0,
      0.326,
      "guide-groove",
    );
  }

  const screwGeometry = new THREE.CylinderGeometry(0.023, 0.023, 0.011, 16);
  screwGeometry.rotateX(Math.PI / 2);
  const slotGeometry = new THREE.BoxGeometry(0.024, 0.004, 0.002);
  for (const x of [-0.94, 0.94]) {
    for (const y of [-0.655, 0.655]) {
      mesh(screwGeometry, screwMetal, group, x, y, 0.283, "chassis-fastener");
      const slot = mesh(
        slotGeometry,
        blackMetal,
        group,
        x,
        y,
        0.29,
        "fastener-slot",
      );
      slot.rotation.z = x * y > 0 ? 0.35 : -0.42;
    }
  }

  const bladeCount = 6;
  const pitch = H / bladeCount;
  const slatHeight = pitch + 0.017;
  const slatGeometry = new THREE.BoxGeometry(W + 0.065, slatHeight, 0.006);
  const seamGeometry = new THREE.BoxGeometry(W + 0.059, 0.0021, 0.001);
  const leadingGeometry = new THREE.BoxGeometry(W + 0.064, 0.005, 0.007);
  const jointGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12);
  jointGeometry.rotateX(Math.PI / 2);
  const armGeometry = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  function makeCurtain(name, material, z, which) {
    const curtain = new THREE.Group();
    curtain.name = name;
    curtain.userData.travel = which === "first" ? 1 : 0;
    group.add(curtain);
    const blades = new THREE.InstancedMesh(slatGeometry, material, bladeCount);
    const seams = new THREE.InstancedMesh(
      seamGeometry,
      brushedEdge,
      bladeCount,
    );
    blades.name = `${name}-rigid-blades`;
    seams.name = `${name}-blade-edges`;
    blades.frustumCulled = false;
    seams.frustumCulled = false;
    blades.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    seams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    curtain.add(blades, seams);
    const leading = mesh(
      leadingGeometry,
      brushedEdge,
      curtain,
      0,
      0,
      z + 0.009,
      `${name}-leading-edge`,
    );
    const side = which === "first" ? -1 : 1;
    const arms = [
      mesh(armGeometry, screwMetal, curtain),
      mesh(armGeometry, screwMetal, curtain),
    ];
    const joints = [
      mesh(jointGeometry, brushedEdge, curtain),
      mesh(jointGeometry, brushedEdge, curtain),
    ];

    function armBetween(arm, x1, y1, x2, y2, depth) {
      arm.position.set((x1 + x2) / 2, (y1 + y2) / 2, depth);
      arm.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      arm.scale.set(Math.hypot(x2 - x1, y2 - y1), 0.013, 0.01);
    }

    function setTravel(travel) {
      const t = clamp01(travel);
      const edge = H / 2 - t * H;
      curtain.userData.travel = t;
      for (let i = 0; i < bladeCount; i++) {
        // Slats remain rigid. Blades individually stack under a cassette
        // instead of scaling into a pair of implausible sliding doors.
        const edgeOfBlade =
          which === "first"
            ? Math.max(H / 2 - i * pitch - t * H, -H / 2 - i * 0.002)
            : Math.min(H / 2 - t * H + i * pitch, H / 2 + i * 0.002);
        const y =
          edgeOfBlade + (which === "first" ? -slatHeight / 2 : slatHeight / 2);
        const bladeZ = z - i * 0.0015;
        dummy.position.set(0, y, bladeZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        blades.setMatrixAt(i, dummy.matrix);
        dummy.position.set(
          0,
          edgeOfBlade + (which === "first" ? -0.003 : 0.003),
          bladeZ + 0.0038,
        );
        dummy.updateMatrix();
        seams.setMatrixAt(i, dummy.matrix);
      }
      blades.instanceMatrix.needsUpdate = true;
      seams.instanceMatrix.needsUpdate = true;
      leading.position.y = edge;
      const pivotX = side * (W / 2 + 0.141);
      const movableX = side * (W / 2 + 0.107 + Math.sin(t * Math.PI) * 0.008);
      const fixedY = which === "first" ? -0.443 : 0.443;
      const mobileY = Math.max(-0.515, Math.min(0.515, edge));
      const elbowX = side * (W / 2 + 0.173);
      const elbowY = (fixedY + mobileY) * 0.5;
      armBetween(arms[0], pivotX, fixedY, elbowX, elbowY, z - 0.002);
      armBetween(arms[1], elbowX, elbowY, movableX, mobileY, z - 0.001);
      joints[0].position.set(pivotX, fixedY, z + 0.005);
      joints[1].position.set(movableX, mobileY, z + 0.005);
    }
    return { curtain, setTravel };
  }

  const first = makeCurtain("firstCurtain", bladeMetal, 0.295, "first");
  const second = makeCurtain("secondCurtain", bladeBackMetal, 0.27, "second");
  let phase = 0;
  let exposureSeconds = 1 / 125;
  let disposed = false;
  function setPhase(t) {
    phase = clamp01(t);
    const state = shutterState(phase, exposureSeconds);
    first.setTravel(state.firstTravel);
    second.setTravel(state.secondTravel);
    group.userData.state = state;
    return state;
  }
  function setExposure(seconds) {
    if (Number.isFinite(seconds) && seconds > 0) {
      exposureSeconds = Math.max(1 / 32000, Math.min(30, seconds));
    }
    return setPhase(phase);
  }
  setPhase(0);

  return {
    group,
    firstCurtain: first.curtain,
    secondCurtain: second.curtain,
    setExposure,
    setPhase,
    getState: () => group.userData.state,
    dispose() {
      if (!disposed) {
        disposed = true;
        disposeGroup(group);
      }
    },
  };
}

/**
 * Short, continuous optical handoff across the shutter gate to the sensor.
 * Pass the same shutterState used by the mechanical curtains. Rays terminate
 * on the first obstructing curtain; only an unobstructed ray reaches a diode.
 * The caller controls visibility with intensity and supplies the shared clock.
 */
export function createCaptureLight() {
  const group = new THREE.Group();
  group.name = "shutter-to-sensor-light";
  const count = 3;
  const rayGeometry = new THREE.BufferGeometry();
  rayGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 6), 3),
  );
  const rayMaterial = new THREE.LineBasicMaterial({
    color: 0xe3d5b6,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    toneMapped: false,
  });
  const rays = new THREE.LineSegments(rayGeometry, rayMaterial);
  rays.frustumCulled = false;
  rays.name = "curtain-gated-short-rays";
  group.add(rays);
  const packetGeometry = new THREE.SphereGeometry(1, 8, 5);
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: 0xf0e3c7,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    toneMapped: false,
  });
  const packets = new THREE.InstancedMesh(
    packetGeometry,
    packetMaterial,
    count,
  );
  packets.name = "short-optical-packets";
  packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  packets.frustumCulled = false;
  const chargeMaterial = new THREE.MeshBasicMaterial({
    color: 0xbba373,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    toneMapped: false,
  });
  const arrivals = new THREE.InstancedMesh(
    packetGeometry,
    chargeMaterial,
    count,
  );
  arrivals.name = "charge-endpoints";
  arrivals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  arrivals.frustumCulled = false;
  group.add(packets, arrivals);
  const dummy = new THREE.Object3D();
  const source = new THREE.Vector3();
  const diode = new THREE.Vector3();
  const end = new THREE.Vector3();
  const point = new THREE.Vector3();
  const beamRows = [-0.21, 0.03, 0.21];
  const states = Array.from({ length: count }, () => ({
    blocked: false,
    blocker: null,
    endZ: 0.02,
  }));
  let disposed = false;

  function update(elapsedSeconds, state, intensity = 1, options = {}) {
    if (disposed) return states;
    const time = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
    const strength = clamp01(intensity);
    const mobile = options.mobile === true;
    const gateOffset = Number.isFinite(options.shutterOffsetZ)
      ? options.shutterOffsetZ
      : 0;
    const sensorZ = Number.isFinite(options.sensorZ) ? options.sensorZ : 0.02;
    const sourceZ = Math.max(
      sensorZ + 0.35,
      Number.isFinite(options.sourceZ) ? options.sourceZ : 1.05,
    );
    const firstZ = 0.302 + gateOffset;
    const secondZ = 0.277 + gateOffset;
    const curtainState = state || shutterState(1);
    group.visible = strength > 0.001;
    rayMaterial.opacity = 0.36 * strength;
    packetMaterial.opacity = 0.82 * strength;
    chargeMaterial.opacity = 0.26 * strength;
    const positions = rayGeometry.attributes.position;
    for (let i = 0; i < count; i++) {
      // These coordinates land on actual centers of the 24 × 16 crop.
      diode.set(0.03, beamRows[i], sensorZ);
      source.set(diode.x - 0.045, diode.y + 0.045, sourceZ);
      end.copy(diode);
      let blocker = null;
      const atPlane = (z) => {
        const t = clamp01((source.z - z) / Math.max(0.001, source.z - diode.z));
        return point.copy(source).lerp(diode, t);
      };
      if (
        firstZ > sensorZ &&
        atPlane(firstZ).y <= curtainState.firstEdgeY + 0.0003
      ) {
        end.copy(point);
        blocker = "firstCurtain";
      } else if (
        secondZ > sensorZ &&
        atPlane(secondZ).y >= curtainState.secondEdgeY - 0.0003
      ) {
        end.copy(point);
        blocker = "secondCurtain";
      }
      const visible = !mobile || i === 1;
      positions.setXYZ(i * 2, source.x, source.y, source.z);
      positions.setXYZ(
        i * 2 + 1,
        visible ? end.x : source.x,
        visible ? end.y : source.y,
        visible ? end.z : source.z,
      );
      const phase = (((time * 0.43 + i * 0.227) % 1) + 1) % 1;
      const travel = clamp01(phase / 0.84);
      dummy.position.copy(source).lerp(end, travel);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(visible && phase < 0.84 ? 0.006 : 0);
      dummy.updateMatrix();
      packets.setMatrixAt(i, dummy.matrix);
      const arrival =
        visible && !blocker && phase > 0.84 && phase < 0.97
          ? Math.sin(((phase - 0.84) / 0.13) * Math.PI)
          : 0;
      dummy.position.copy(diode);
      dummy.scale.set(arrival * 0.011, arrival * 0.011, arrival * 0.002);
      dummy.updateMatrix();
      arrivals.setMatrixAt(i, dummy.matrix);
      states[i].blocked = Boolean(blocker);
      states[i].blocker = blocker;
      states[i].endZ = end.z;
    }
    positions.needsUpdate = true;
    packets.instanceMatrix.needsUpdate = true;
    arrivals.instanceMatrix.needsUpdate = true;
    group.userData.rays = states;
    return states;
  }
  update(0, shutterState(1), 0);
  return {
    group,
    update,
    dispose() {
      if (!disposed) {
        disposed = true;
        disposeGroup(group);
      }
    },
  };
}

/** A genuinely magnified 4 × 4 crop, with readable solid layer geometry. */
function createCellStudy(sourceMaterials, filterColors) {
  const group = new THREE.Group();
  group.name = "four-by-four-cell-study";
  group.userData = {
    columns: 4,
    rows: 4,
    pitch: 0.21,
    physicalPitchMicrometers: 6,
    carrierWidth: 1.4,
    carrierHeight: 1.0,
    activeWidth: 0.84,
    activeHeight: 0.84,
    pattern: "RGGB",
    illustrativeCrop: true,
    exaggeratedLayerThickness: true,
    lightDirection: "-Z",
  };
  const layers = {};
  for (const name of [
    "substrate",
    "readout",
    "photodiodes",
    "filters",
    "microlenses",
    "interconnects",
    "photons",
  ]) {
    const layer = new THREE.Group();
    layer.name = `cell-study-${name}`;
    layers[name] = layer;
    group.add(layer);
  }
  const silicon = sourceMaterials.silicon.clone();
  silicon.color.set(0x142126);
  silicon.roughness = 0.36;
  const edge = sourceMaterials.edge.clone();
  edge.color.set(0x52605d);
  edge.roughness = 0.3;
  const copper = sourceMaterials.copper.clone();
  copper.color.set(0x8d7348);
  copper.roughness = 0.32;
  const diode = sourceMaterials.diode.clone();
  diode.color.set(0x192d37);
  diode.roughness = 0.21;
  diode.envMapIntensity = 0.92;
  const filters = sourceMaterials.filters.map((mat) => {
    const value = mat.clone();
    value.roughness = 0.27;
    value.clearcoat = 0.62;
    value.clearcoatRoughness = 0.18;
    return value;
  });
  const glass = sourceMaterials.glass.clone();
  glass.color.set(0x9cb5b2);
  glass.opacity = 0.68;
  glass.roughness = 0.055;
  glass.clearcoat = 1;
  glass.clearcoatRoughness = 0.04;
  glass.envMapIntensity = 1.05;
  glass.specularIntensity = 1;
  // Curved glass reads through Fresnel reflections and a fine edge highlight;
  // the center remains clear, without a full-frame transmission render pass.
  glass.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      float cellFresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
      diffuseColor.a *= 0.16 + 0.84 * cellFresnel;
      #include <opaque_fragment>
    `,
    );
  };
  glass.customProgramCacheKey = () => "optic-cell-glass-fresnel-v1";
  const glassEdge = edge.clone();
  glassEdge.color.set(0x849e96);
  glassEdge.transparent = true;
  glassEdge.opacity = 0.43;
  glassEdge.depthWrite = false;
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xf3e5c5,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    toneMapped: false,
  });
  const chargeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc7a66c,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    toneMapped: false,
  });

  mesh(
    bevelPlate(1.4, 1.0, 0.039, 0.022, 0.003, 3),
    silicon,
    layers.substrate,
    0,
    0,
    0,
    "cell-study-silicon-carrier",
  );
  // The readout side remains deliberately exposed to the right of the crop.
  const edgeStrip = new THREE.BoxGeometry(1.354, 0.005, 0.005);
  mesh(edgeStrip, edge, layers.substrate, 0, 0.485, 0.0215, "silicon-cut-edge");
  mesh(
    edgeStrip,
    edge,
    layers.substrate,
    0,
    -0.485,
    0.0215,
    "silicon-cut-edge",
  );

  const wellShape = roundedPath(new THREE.Shape(), 0.19, 0.19, 0.006);
  wellShape.holes.push(roundedPath(new THREE.Path(), 0.144, 0.144, 0.004));
  const wellGeometry = new THREE.ExtrudeGeometry(wellShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
    curveSegments: 2,
    steps: 1,
  });
  wellGeometry.translate(0, 0, -0.029);
  const wellMesh = new THREE.InstancedMesh(wellGeometry, silicon, 16);
  wellMesh.name = "cell-study-open-photodiode-wells";
  const floorGeometry = bevelPlate(0.135, 0.135, 0.005, 0.002, 0.0007, 2);
  const floorMesh = new THREE.InstancedMesh(floorGeometry, diode, 16);
  floorMesh.name = "cell-study-photodiode-floors";
  const contactGeometry = new THREE.BoxGeometry(0.01, 0.042, 0.005);
  const contacts = new THREE.InstancedMesh(contactGeometry, copper, 32);
  contacts.name = "cell-study-well-contacts";
  layers.photodiodes.add(wellMesh, floorMesh, contacts);

  const filterGeometry = bevelPlate(0.184, 0.184, 0.012, 0.002, 0.0012, 2);
  const filterMeshes = [4, 8, 4].map(
    (count, i) => new THREE.InstancedMesh(filterGeometry, filters[i], count),
  );
  filterMeshes.forEach((object, i) => {
    object.name = [
      "cell-study-red-filters",
      "cell-study-green-filters",
      "cell-study-blue-filters",
    ][i];
    layers.filters.add(object);
  });

  // A solid plano-convex cap: finite underside, curved spherical surface and
  // a 55-milliscene-unit sag. Sixteen caps can support a real macro silhouette.
  const radius = 0.094,
    sag = 0.055,
    edgeThickness = 0.008;
  const sphereR = (radius * radius + sag * sag) / (2 * sag);
  const edgeHeight = Math.sqrt(sphereR * sphereR - radius * radius);
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius, 0),
    new THREE.Vector2(radius, edgeThickness),
  ];
  for (let step = 1; step <= 10; step++) {
    const r = radius * (1 - step / 10);
    profile.push(
      new THREE.Vector2(
        r,
        edgeThickness + Math.sqrt(sphereR * sphereR - r * r) - edgeHeight,
      ),
    );
  }
  const capGeometry = new THREE.LatheGeometry(profile, 24);
  capGeometry.rotateX(Math.PI / 2);
  const caps = new THREE.InstancedMesh(capGeometry, glass, 16);
  caps.name = "cell-study-curved-microlenses";
  const rimGeometry = new THREE.TorusGeometry(radius, 0.00135, 4, 24);
  const capRims = new THREE.InstancedMesh(rimGeometry, glassEdge, 16);
  capRims.name = "cell-study-microlens-edges";
  layers.microlenses.add(caps, capRims);

  const cells = [];
  const dummy = new THREE.Object3D();
  const filterIndices = [0, 0, 0];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const index = row * 4 + col;
      const color =
        row % 2 === 0 ? (col % 2 === 0 ? 0 : 1) : col % 2 === 0 ? 1 : 2;
      const x = -0.085 + (col - 1.5) * 0.21;
      const y = (1.5 - row) * 0.21;
      cells.push({ x, y, row, col, color });
      dummy.position.set(x, y, 0);
      dummy.updateMatrix();
      wellMesh.setMatrixAt(index, dummy.matrix);
      filterMeshes[color].setMatrixAt(filterIndices[color]++, dummy.matrix);
      caps.setMatrixAt(index, dummy.matrix);
      capRims.setMatrixAt(index, dummy.matrix);
      dummy.position.z = -0.025;
      dummy.updateMatrix();
      floorMesh.setMatrixAt(index, dummy.matrix);
      for (let side = 0; side < 2; side++) {
        dummy.position.set(x + (side ? 0.08 : -0.08), y - 0.043, -0.013);
        dummy.updateMatrix();
        contacts.setMatrixAt(index * 2 + side, dummy.matrix);
      }
    }
  for (const instance of [
    wellMesh,
    floorMesh,
    contacts,
    ...filterMeshes,
    caps,
    capRims,
  ]) {
    instance.instanceMatrix.needsUpdate = true;
    instance.frustumCulled = false;
  }

  // The bus is physically behind the wells, with copper vias joining the
  // sensitive die to rear row-readout wiring. No electrical lines cross glass.
  const viaGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
  const vias = new THREE.InstancedMesh(viaGeometry, copper, 16);
  vias.name = "cell-study-rear-copper-vias";
  vias.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  vias.frustumCulled = false;
  layers.interconnects.add(vias);
  const trackSegments = [];
  function track(a, b) {
    trackSegments.push([a, b]);
  }
  for (const cell of cells) {
    const x = cell.x + 0.08,
      y = cell.y - 0.043;
    const busY = cell.y - 0.061 - cell.col * 0.012;
    const xTurn = 0.407 + cell.col * 0.022;
    track([x, y], [x, busY]);
    track([x, busY], [xTurn, busY]);
    track([xTurn, busY], [0.552, cell.y - 0.06 - cell.col * 0.01]);
  }
  for (let row = 0; row < 4; row++) {
    const y = (1.5 - row) * 0.21 - 0.074;
    track([0.589, y], [0.651, y]);
    track([0.651, y], [0.663, y - 0.022]);
  }
  const trackGeometry = new THREE.BoxGeometry(1, 1, 1);
  const tracks = new THREE.InstancedMesh(
    trackGeometry,
    copper,
    trackSegments.length,
  );
  tracks.name = "cell-study-copper-row-readout";
  trackSegments.forEach(([a, b], i) => {
    dummy.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.004);
    dummy.rotation.set(0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]));
    dummy.scale.set(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.0035, 0.0025);
    dummy.updateMatrix();
    tracks.setMatrixAt(i, dummy.matrix);
  });
  tracks.instanceMatrix.needsUpdate = true;
  tracks.frustumCulled = false;
  layers.readout.add(tracks);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(1, 1, 1);
  const readoutGeometry = bevelPlate(0.054, 0.128, 0.014, 0.003, 0.001, 2);
  for (let row = 0; row < 4; row++) {
    mesh(
      readoutGeometry,
      diode,
      layers.readout,
      0.581,
      (1.5 - row) * 0.21 - 0.065,
      0.009,
      "cell-study-row-amplifier",
    );
  }
  const padGeometry = bevelPlate(0.016, 0.043, 0.006, 0.002, 0.0006, 1);
  const terminals = new THREE.InstancedMesh(padGeometry, copper, 16);
  terminals.name = "cell-study-readout-contact-pads";
  for (let i = 0; i < 16; i++) {
    dummy.position.set(0.675, 0.414 - i * 0.055, 0.007);
    dummy.rotation.z = Math.PI / 2;
    dummy.updateMatrix();
    terminals.setMatrixAt(i, dummy.matrix);
  }
  terminals.instanceMatrix.needsUpdate = true;
  layers.readout.add(terminals);
  dummy.rotation.set(0, 0, 0);

  const anchors = {};
  function anchor(name, parent, x, y, z) {
    const object = new THREE.Object3D();
    object.name = `cell-study-anchor-${name}`;
    object.position.set(x, y, z);
    parent.add(object);
    anchors[name] = object;
  }
  anchor("microlens", layers.microlenses, 0.23, -0.315, 0.047);
  anchor("filter", layers.filters, 0.23, -0.315, 0.007);
  anchor("photodiode", layers.photodiodes, 0.23, -0.315, -0.022);
  anchor("readout", layers.readout, 0.58, -0.285, 0.009);
  anchor("center", group, -0.07, 0, 0.2);

  const chosen = [cells[0], cells[3], cells[12], cells[15]];
  const paths = chosen.map(() =>
    Array.from({ length: 4 }, () => new THREE.Vector3()),
  );
  const pathGeometry = new THREE.BufferGeometry();
  pathGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(4 * 3 * 6), 3),
  );
  pathGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(4 * 3 * 6), 3),
  );
  const pathMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
    toneMapped: false,
  });
  const pathLines = new THREE.LineSegments(pathGeometry, pathMaterial);
  pathLines.name = "cell-study-microlens-refraction-paths";
  pathLines.frustumCulled = false;
  layers.photons.add(pathLines);
  const packetGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
  const packets = new THREE.InstancedMesh(packetGeometry, lightMaterial, 4);
  packets.name = "cell-study-optical-packets";
  packets.frustumCulled = false;
  packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const chargeGeometry = new THREE.SphereGeometry(1, 8, 5);
  const arrivals = new THREE.InstancedMesh(chargeGeometry, chargeMaterial, 4);
  arrivals.name = "cell-study-photodiode-charge";
  arrivals.frustumCulled = false;
  arrivals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const electrons = new THREE.InstancedMesh(chargeGeometry, chargeMaterial, 4);
  electrons.name = "cell-study-rear-electrical-packets";
  electrons.frustumCulled = false;
  electrons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  layers.photons.add(packets, arrivals, electrons);
  const white = new THREE.Color(0xe7d9b6);
  const photonColor = new THREE.Color();
  const direction = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const electricPaths = chosen.map(() =>
    Array.from({ length: 6 }, () => new THREE.Vector3()),
  );
  const states = chosen.map(() => ({
    opticalArrived: false,
    electricalActive: false,
  }));
  const materialStates = new Map();
  group.traverse((object) => {
    const list = object.material
      ? Array.isArray(object.material)
        ? object.material
        : [object.material]
      : [];
    for (const material of list)
      if (!materialStates.has(material))
        materialStates.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        });
  });

  function layout(magnification, overviewLayers) {
    const m = clamp01(magnification),
      e = ease(m);
    const scale = lerp(2 / 7, 1, ease(clamp01(m / 0.85)));
    group.scale.setScalar(scale);
    // At q=0, the cap centers coincide with the same central 4 × 4 old cells.
    group.position.set(0.085 * scale * (1 - e), 0, 0);
    const targetZ = {
      substrate: -0.26,
      readout: -0.231,
      photodiodes: 0.012,
      filters: 0.255,
      microlenses: 0.515,
    };
    for (const name of Object.keys(targetZ)) {
      layers[name].position.z =
        lerp(overviewLayers[name].position.z, targetZ[name], e) / scale;
    }
    const alpha = ease(clamp01((m - 0.025) / 0.23));
    group.visible = alpha > 0.001;
    for (const [material, base] of materialStates) {
      material.opacity = base.opacity * alpha;
      const transparent = base.transparent || alpha < 0.999;
      if (transparent !== material.transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.depthWrite = base.depthWrite && alpha > 0.8;
    }
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const top = layers.photodiodes.position.z - 0.018;
      const bottom = layers.readout.position.z + 0.006;
      dummy.position.set(cell.x + 0.08, cell.y - 0.043, (top + bottom) / 2);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(0.0031, Math.max(0.003, top - bottom), 0.0031);
      dummy.updateMatrix();
      vias.setMatrixAt(i, dummy.matrix);
    }
    vias.instanceMatrix.needsUpdate = true;
    const attributes = pathGeometry.attributes;
    for (let i = 0; i < chosen.length; i++) {
      const cell = chosen[i],
        path = paths[i];
      path[0].set(
        cell.x - 0.035,
        cell.y + 0.024,
        layers.microlenses.position.z + 0.32,
      );
      path[1].set(
        cell.x - 0.035,
        cell.y + 0.024,
        layers.microlenses.position.z + 0.055,
      );
      path[3].set(cell.x, cell.y, layers.photodiodes.position.z - 0.022);
      const filterZ = layers.filters.position.z + 0.007;
      const portion = clamp01((path[1].z - filterZ) / (path[1].z - path[3].z));
      path[2].copy(path[1]).lerp(path[3], portion);
      for (let segment = 0; segment < 3; segment++) {
        const offset = (i * 3 + segment) * 2;
        attributes.position.setXYZ(offset, ...path[segment].toArray());
        attributes.position.setXYZ(offset + 1, ...path[segment + 1].toArray());
        const tint = segment < 2 ? white : filterColors[cell.color];
        attributes.color.setXYZ(offset, tint.r, tint.g, tint.b);
        attributes.color.setXYZ(offset + 1, tint.r, tint.g, tint.b);
      }
      const route = electricPaths[i];
      route[0].copy(path[3]);
      route[1].set(
        cell.x + 0.08,
        cell.y - 0.043,
        layers.photodiodes.position.z - 0.025,
      );
      route[2].set(
        cell.x + 0.08,
        cell.y - 0.043,
        layers.readout.position.z + 0.008,
      );
      const busY = cell.y - 0.061 - cell.col * 0.012;
      route[3].set(cell.x + 0.08, busY, layers.readout.position.z + 0.008);
      route[4].set(
        0.407 + cell.col * 0.022,
        busY,
        layers.readout.position.z + 0.008,
      );
      route[5].set(
        0.552,
        cell.y - 0.06 - cell.col * 0.01,
        layers.readout.position.z + 0.008,
      );
    }
    attributes.position.needsUpdate = true;
    attributes.color.needsUpdate = true;
    group.userData.magnification = m;
  }

  function along(path, t, out, tangent) {
    const lengths = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      lengths.push(path[i].distanceTo(path[i + 1]));
      total += lengths[i];
    }
    let distance = clamp01(t) * total;
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1) {
        out
          .copy(path[i])
          .lerp(path[i + 1], lengths[i] > 0 ? distance / lengths[i] : 0);
        if (tangent)
          tangent
            .copy(path[i + 1])
            .sub(path[i])
            .normalize();
        return;
      }
      distance -= lengths[i];
    }
  }

  function update(time) {
    for (let i = 0; i < chosen.length; i++) {
      const cell = chosen[i],
        path = paths[i];
      const phase = (((time * 0.34 + i * 0.237) % 1) + 1) % 1;
      const arrived = phase >= 0.82;
      along(path, phase / 0.82, position, direction);
      dummy.position.copy(position);
      dummy.quaternion.setFromUnitVectors(yAxis, direction);
      const distanceLeft = position.distanceTo(path[3]);
      dummy.scale.set(
        arrived ? 0 : 0.0038,
        arrived ? 0 : Math.min(0.032, distanceLeft * 0.85),
        arrived ? 0 : 0.0038,
      );
      dummy.updateMatrix();
      packets.setMatrixAt(i, dummy.matrix);
      photonColor.copy(
        position.z > layers.filters.position.z + 0.007
          ? white
          : filterColors[cell.color],
      );
      packets.setColorAt(i, photonColor);
      const arrival =
        phase > 0.82 && phase < 0.9
          ? Math.sin(((phase - 0.82) / 0.08) * Math.PI)
          : 0;
      dummy.position.copy(path[3]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(arrival * 0.014, arrival * 0.014, arrival * 0.003);
      dummy.updateMatrix();
      arrivals.setMatrixAt(i, dummy.matrix);
      const electronic = phase >= 0.9;
      along(electricPaths[i], (phase - 0.9) / 0.1, position);
      dummy.position.copy(position);
      dummy.scale.setScalar(electronic ? 0.0055 : 0);
      dummy.updateMatrix();
      electrons.setMatrixAt(i, dummy.matrix);
      states[i].opticalArrived = arrived;
      states[i].electricalActive = electronic;
    }
    packets.instanceMatrix.needsUpdate = true;
    if (packets.instanceColor) packets.instanceColor.needsUpdate = true;
    arrivals.instanceMatrix.needsUpdate = true;
    electrons.instanceMatrix.needsUpdate = true;
    group.userData.packetStates = states;
  }
  return { group, layers, anchors, layout, update };
}

/**
 * RGGB sensor macro: glass microlenses > color filters > photodiodes > readout.
 * Layer thicknesses/separation are exaggerated for a legible scientific view.
 * The 24 × 16 grid is an illustrative crop, not the camera's pixel count.
 */
export function createSensorMicro() {
  const group = new THREE.Group();
  group.name = "sensorMicrostructure";
  group.userData = {
    activeWidth: SENSOR_WIDTH,
    activeHeight: SENSOR_HEIGHT,
    columns: 24,
    rows: 16,
    pattern: "RGGB",
    lightDirection: "-Z",
    illustrativeCrop: true,
    exaggeratedLayerThickness: true,
  };
  const cols = 24;
  const rows = 16;
  const count = cols * rows;
  const pitch = SENSOR_WIDTH / cols;
  const dummy = new THREE.Object3D();
  const layers = {
    substrate: new THREE.Group(),
    readout: new THREE.Group(),
    photodiodes: new THREE.Group(),
    filters: new THREE.Group(),
    microlenses: new THREE.Group(),
    photons: new THREE.Group(),
  };
  for (const [name, layer] of Object.entries(layers)) {
    layer.name = name;
    group.add(layer);
  }

  const silicon = new THREE.MeshStandardMaterial({
    color: 0x151b1e,
    metalness: 0.7,
    roughness: 0.37,
  });
  const edgeMetal = new THREE.MeshStandardMaterial({
    color: 0x3d4647,
    metalness: 0.87,
    roughness: 0.32,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: 0x655538,
    metalness: 0.88,
    roughness: 0.39,
  });
  const diodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x101a20,
    metalness: 0.72,
    roughness: 0.28,
    envMapIntensity: 0.7,
  });
  const filterColors = [
    new THREE.Color(0x8b4f43),
    new THREE.Color(0x42664e),
    new THREE.Color(0x3d586c),
  ];
  const filterMaterials = filterColors.map(
    (color) =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.05,
        roughness: 0.43,
        clearcoat: 0.36,
        clearcoatRoughness: 0.28,
        envMapIntensity: 0.65,
      }),
  );
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x95a8a2,
    metalness: 0,
    roughness: 0.1,
    clearcoat: 0.7,
    clearcoatRoughness: 0.065,
    transparent: true,
    opacity: 0.115,
    depthWrite: false,
    ior: 1.48,
    specularIntensity: 0.95,
    envMapIntensity: 0.62,
  });

  mesh(
    bevelPlate(1.565, 1.085, 0.055, 0.022, 0.005),
    silicon,
    layers.substrate,
    0,
    0,
    0,
    "silicon-substrate",
  );
  mesh(
    ringPlate(1.59, 1.11, 1.485, 1.005, 0.025),
    edgeMetal,
    layers.substrate,
    0,
    0,
    0.009,
    "die-edge",
  );
  // Flat lithographic layers with minute chamfers avoid a plastic-keycap look.
  // One curve/bevel segment is sufficient at this scale and saves geometry.
  const padGeometry = bevelPlate(
    pitch * 0.91,
    pitch * 0.91,
    0.006,
    0.0012,
    0.0005,
    1,
  );
  const diodeGeometry = bevelPlate(
    pitch * 0.8,
    pitch * 0.8,
    0.006,
    0.001,
    0.0004,
    1,
  );
  const filterGeometry = bevelPlate(
    pitch * 0.94,
    pitch * 0.94,
    0.01,
    0.0009,
    0.0006,
    1,
  );
  const padMesh = new THREE.InstancedMesh(padGeometry, copper, count);
  const diodeMesh = new THREE.InstancedMesh(
    diodeGeometry,
    diodeMaterial,
    count,
  );
  const filterMeshes = [
    new THREE.InstancedMesh(filterGeometry, filterMaterials[0], count / 4),
    new THREE.InstancedMesh(filterGeometry, filterMaterials[1], count / 2),
    new THREE.InstancedMesh(filterGeometry, filterMaterials[2], count / 4),
  ];
  padMesh.name = "photodiode-contacts";
  diodeMesh.name = "photodiode-wells";
  filterMeshes.forEach((item, i) => {
    item.name = ["red-filters", "green-filters", "blue-filters"][i];
    layers.filters.add(item);
  });
  layers.photodiodes.add(padMesh, diodeMesh);
  // A flattened, curved hemisphere is the visible surface of each microlens.
  const lensGeometry = new THREE.SphereGeometry(
    pitch * 0.45,
    8,
    4,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  lensGeometry.rotateX(Math.PI / 2);
  lensGeometry.scale(1, 1, 0.42);
  const lenses = new THREE.InstancedMesh(lensGeometry, lensMaterial, count);
  lenses.name = "individual-glass-microlenses";
  layers.microlenses.add(lenses);
  const indexes = [0, 0, 0];
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      // Viewed from +Z, the upper-left 2 × 2 tile is R G / G B.
      const color =
        row % 2 === 0 ? (col % 2 === 0 ? 0 : 1) : col % 2 === 0 ? 1 : 2;
      const x = -SENSOR_WIDTH / 2 + (col + 0.5) * pitch;
      const y = SENSOR_HEIGHT / 2 - (row + 0.5) * pitch;
      cells.push({ x, y, color, row, col });
      dummy.position.set(x, y, -0.004);
      dummy.updateMatrix();
      padMesh.setMatrixAt(index, dummy.matrix);
      dummy.position.z = 0.002;
      dummy.updateMatrix();
      diodeMesh.setMatrixAt(index, dummy.matrix);
      dummy.position.z = 0;
      dummy.updateMatrix();
      filterMeshes[color].setMatrixAt(indexes[color]++, dummy.matrix);
      lenses.setMatrixAt(index, dummy.matrix);
    }
  }
  for (const item of [padMesh, diodeMesh, ...filterMeshes, lenses]) {
    item.instanceMatrix.needsUpdate = true;
    item.frustumCulled = false;
  }

  // Small die contacts, deliberately restrained; these are material geometry.
  const terminalGeometry = bevelPlate(0.015, 0.043, 0.007, 0.0015, 0.0006, 1);
  const terminals = new THREE.InstancedMesh(
    terminalGeometry,
    copper,
    2 * cols + 2 * rows,
  );
  terminals.name = "gold-die-contacts";
  let terminalIndex = 0;
  for (const sign of [-1, 1]) {
    for (let col = 0; col < cols; col++) {
      dummy.position.set(
        -SENSOR_WIDTH / 2 + (col + 0.5) * pitch,
        sign * 0.517,
        0.033,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      terminals.setMatrixAt(terminalIndex++, dummy.matrix);
    }
    for (let row = 0; row < rows; row++) {
      dummy.position.set(
        sign * 0.754,
        -SENSOR_HEIGHT / 2 + (row + 0.5) * pitch,
        0.033,
      );
      dummy.rotation.z = Math.PI / 2;
      dummy.updateMatrix();
      terminals.setMatrixAt(terminalIndex++, dummy.matrix);
    }
  }
  terminals.instanceMatrix.needsUpdate = true;
  layers.substrate.add(terminals);
  dummy.rotation.set(0, 0, 0);

  // Readout conductors live BEHIND the sensitive layer. This is a restrained
  // microscopic wiring abstraction, not an overlay floating in front of it.
  const tracePositions = [];
  const traceDistances = [];
  function addTrace(points, rowPhase) {
    let distance = rowPhase;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      tracePositions.push(a[0], a[1], 0, b[0], b[1], 0);
      traceDistances.push(distance, distance + length);
      distance += length;
    }
  }
  for (let row = 0; row < rows; row++) {
    const y = SENSOR_HEIGHT / 2 - (row + 0.5) * pitch;
    const exitX = 0.749 + (row % 4) * 0.004;
    addTrace(
      [
        [-0.714, y],
        [0.708, y],
        [exitX, y - 0.013],
        [exitX, -0.526],
      ],
      row * 0.034,
    );
  }
  for (let col = 0; col < cols; col++) {
    const x = -SENSOR_WIDTH / 2 + (col + 0.5) * pitch;
    addTrace(
      [
        [x, 0.475],
        [x, -0.478],
        [x + 0.012, -0.518],
      ],
      col * 0.037 + 0.23,
    );
  }
  const traceGeometry = new THREE.BufferGeometry();
  traceGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(tracePositions, 3),
  );
  traceGeometry.setAttribute(
    "aDistance",
    new THREE.Float32BufferAttribute(traceDistances, 1),
  );
  const traceMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSeparation: { value: 0 },
      uMagnificationAlpha: { value: 1 },
    },
    vertexShader: `
      attribute float aDistance;
      varying float vDistance;
      varying float vY;
      void main() {
        vDistance = aDistance;
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uSeparation;
      uniform float uMagnificationAlpha;
      varying float vDistance;
      varying float vY;
      void main() {
        float packet = 1.0 - smoothstep(0.0, 0.105, abs(fract(vDistance * 0.63 - uTime * 0.19) - 0.5));
        float row = mod(uTime * 0.145, 1.08) - 0.54;
        float scan = 1.0 - smoothstep(0.009, 0.039, abs(vY - row));
        vec3 color = mix(vec3(0.20, 0.155, 0.09), vec3(0.69, 0.51, 0.27), packet * 0.47 + scan * 0.36);
        gl_FragColor = vec4(color, (0.5 + uSeparation * 0.26) * uMagnificationAlpha);
      }
    `,
  });
  const traces = new THREE.LineSegments(traceGeometry, traceMaterial);
  traces.name = "rear-row-readout-conductors";
  layers.readout.add(traces);

  // A modest number of moving packets makes the optical / electrical handoff
  // visible without a transparent-volume stack or per-pixel draw calls.
  const photonCount = 14;
  const photonGeometry = new THREE.CylinderGeometry(1, 1, 1, 5, 1);
  const photonMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const photons = new THREE.InstancedMesh(
    photonGeometry,
    photonMaterial,
    photonCount,
  );
  photons.name = "incoming-optical-packets";
  photons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  photons.frustumCulled = false;
  const impactGeometry = new THREE.SphereGeometry(1, 7, 5);
  const impactMaterial = new THREE.MeshBasicMaterial({
    color: 0xd2be93,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const impacts = new THREE.InstancedMesh(
    impactGeometry,
    impactMaterial,
    photonCount,
  );
  impacts.name = "photodiode-charge-arrivals";
  impacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  impacts.frustumCulled = false;
  layers.photons.add(photons, impacts);
  const selected = Array.from(
    { length: photonCount },
    (_, i) => cells[(i * 53 + 127) % count],
  );
  const white = new THREE.Color(0xe0d7bd);
  const photonColor = new THREE.Color();
  const overviewGroup = new THREE.Group();
  overviewGroup.name = "twenty-four-by-sixteen-sensor-overview";
  group.add(overviewGroup);
  Object.values(layers).forEach((layer) => overviewGroup.add(layer));
  const overviewMaterialStates = new Map();
  overviewGroup.traverse((object) => {
    const list = object.material
      ? Array.isArray(object.material)
        ? object.material
        : [object.material]
      : [];
    for (const material of list)
      if (!overviewMaterialStates.has(material))
        overviewMaterialStates.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        });
  });
  const detail = createCellStudy(
    {
      silicon,
      edge: edgeMetal,
      copper,
      diode: diodeMaterial,
      filters: filterMaterials,
      glass: lensMaterial,
    },
    filterColors,
  );
  group.add(detail.group);
  let progress = 0;
  let magnification = 0;
  let time = 0;
  let disposed = false;

  function applyMagnification() {
    const amount = ease(magnification);
    const alpha = 1 - ease(clamp01((magnification - 0.04) / 0.39));
    overviewGroup.scale.setScalar(1 - amount * 0.35);
    overviewGroup.position.z = -0.36 * amount;
    overviewGroup.visible = alpha > 0.001;
    for (const [material, base] of overviewMaterialStates) {
      material.opacity = base.opacity * alpha;
      const transparent = base.transparent || alpha < 0.999;
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.depthWrite = base.depthWrite && alpha > 0.8;
    }
    traceMaterial.uniforms.uMagnificationAlpha.value = alpha;
    detail.layout(magnification, layers);
    group.userData.magnification = magnification;
  }

  function setMagnification(q) {
    magnification = clamp01(q);
    applyMagnification();
    update(time);
    return magnification;
  }

  function setProgress(t) {
    progress = ease(t);
    layers.substrate.position.z = -0.036 - progress * 0.106;
    // Expose the readout metallization on the substrate's front, still behind
    // every photodiode. Putting it behind the opaque substrate hides it.
    layers.readout.position.z = -0.001 - progress * 0.106;
    layers.photodiodes.position.z = 0.011;
    layers.filters.position.z = 0.032 + progress * 0.174;
    layers.microlenses.position.z = 0.045 + progress * 0.338;
    traceMaterial.uniforms.uSeparation.value = progress;
    group.userData.separation = progress;
    applyMagnification();
    update(time);
  }

  function update(elapsedSeconds) {
    time = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
    traceMaterial.uniforms.uTime.value = time;
    const launchZ = layers.microlenses.position.z + 0.48;
    const endZ = layers.photodiodes.position.z + 0.009;
    const lensZ = layers.microlenses.position.z;
    const filterZ = layers.filters.position.z;
    for (let i = 0; i < photonCount; i++) {
      const cell = selected[i];
      const phase = (((time * 0.34 + i * 0.0713) % 1) + 1) % 1;
      const q = clamp01(phase / 0.82);
      const z = lerp(launchZ, endZ, q);
      const offset = pitch * (i % 2 === 0 ? 0.13 : -0.13);
      const convergence = clamp01((lensZ - z) / Math.max(0.01, lensZ - endZ));
      const x = cell.x + offset * (1 - convergence);
      const y = cell.y - offset * 0.45 * (1 - convergence);
      const active = phase < 0.82;
      const length = active ? Math.min(0.051, Math.max(0, z - endZ) * 0.75) : 0;
      dummy.position.set(x, y, z + length / 2);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(active ? 0.0017 : 0, length, active ? 0.0017 : 0);
      dummy.updateMatrix();
      photons.setMatrixAt(i, dummy.matrix);
      photonColor.copy(z > filterZ ? white : filterColors[cell.color]);
      photons.setColorAt(i, photonColor);
      const arrival =
        phase > 0.82 && phase < 0.91
          ? Math.sin(((phase - 0.82) / 0.09) * Math.PI)
          : 0;
      dummy.position.set(cell.x, cell.y, endZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(arrival * 0.008);
      dummy.updateMatrix();
      impacts.setMatrixAt(i, dummy.matrix);
    }
    photons.instanceMatrix.needsUpdate = true;
    if (photons.instanceColor) photons.instanceColor.needsUpdate = true;
    impacts.instanceMatrix.needsUpdate = true;
    detail.update(time);
  }
  setProgress(0);

  return {
    group,
    layers,
    overviewGroup,
    detailGroup: detail.group,
    detailLayers: detail.layers,
    anchors: detail.anchors,
    setProgress,
    setMagnification,
    update,
    dispose() {
      if (!disposed) {
        disposed = true;
        disposeGroup(group);
      }
    },
  };
}
