import * as THREE from 'three';

/** Original authored profile. Order is bottom-left, bottom-right, top-right, top-left. */
export const MASTER_SPEC = Object.freeze({
  name: 'The Impossible Form',
  outer: [[-2.22, -3.2], [2.47, -3.2], [1.08, 3.40], [-1.55, 2.27]],
  inner: [[-0.70, -2.08], [1.05, -2.42], [0.70, 1.42], [-0.84, 1.81]],
  depth: 1.16,
  bevel: 0.022,
  sections: [4, 5, 4, 5],
  materials: ['Black polished basalt', 'Mirror-polished fracture', 'Ivory incision'],
});

const mixPoint = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const rayScales = [0.81, 1.12, 0.95, 1.29, 1.21, 0.74, 1.13, 0.91, 1.34, 0.72, 1.16, 0.88, 1.28, 1.05, 0.78, 1.23, 0.91, 1.11];

/** Serializable specifications are also included in the delivered model asset. */
export function createFragmentSpecs() {
  const fragments = [];
  let index = 0;
  for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4;
    const count = MASTER_SPEC.sections[side];
    for (let section = 0; section < count; section++) {
      const a = section / count;
      const b = (section + 1) / count;
      const polygon = [
        mixPoint(MASTER_SPEC.outer[side], MASTER_SPEC.outer[next], a),
        mixPoint(MASTER_SPEC.outer[side], MASTER_SPEC.outer[next], b),
        mixPoint(MASTER_SPEC.inner[side], MASTER_SPEC.inner[next], b),
        mixPoint(MASTER_SPEC.inner[side], MASTER_SPEC.inner[next], a),
      ];
      const center = polygon.reduce((sum, p) => [sum[0] + p[0] / 4, sum[1] + p[1] / 4], [0, 0]);
      const t = (a + b) / 2;
      const sideName = ['base', 'right', 'crown', 'left'][side];
      const horizontal = Math.sign(center[0] || 0.01);
      const explode = [
        horizontal * (0.08 + Math.abs(center[0]) * 0.075) + (section % 2 ? 0.10 : -0.06),
        center[1] * 0.095 + (side === 2 ? 0.12 : 0),
        ((index * 7) % 5 - 2) * 0.23,
      ];
      fragments.push({
        id: `form-${sideName}-${section + 1}`,
        index, side, sideName, section, t, polygon,
        center: [...center, 0],
        depth: MASTER_SPEC.depth,
        rayScale: rayScales[index],
        explode,
        rotation: [((index % 3) - 1) * 0.046, ((index % 4) - 1.5) * 0.052, horizontal * ((index % 3) - 1) * 0.025],
      });
      index++;
    }
  }
  return fragments;
}

function segmentDistance(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}

function fragmentGeometry(spec) {
  const shape = new THREE.Shape();
  spec.polygon.forEach((p, i) => i ? shape.lineTo(...p) : shape.moveTo(...p));
  shape.closePath();
  let geometry = new THREE.ExtrudeGeometry(shape, {
    depth: spec.depth - 2 * MASTER_SPEC.bevel,
    bevelEnabled: true,
    bevelThickness: MASTER_SPEC.bevel,
    bevelSize: MASTER_SPEC.bevel,
    bevelSegments: 2,
    curveSegments: 1,
    steps: 1,
  });
  if (geometry.index) geometry = geometry.toNonIndexed();
  geometry.translate(0, 0, -spec.depth / 2 + MASTER_SPEC.bevel);
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  geometry.clearGroups();
  let previousMaterial = -1, groupStart = 0;
  for (let i = 0; i < positions.count; i += 3) {
    const center = [
      (positions.getX(i) + positions.getX(i + 1) + positions.getX(i + 2)) / 3,
      (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3,
    ];
    const normalZ = (normals.getZ(i) + normals.getZ(i + 1) + normals.getZ(i + 2)) / 3;
    let materialIndex = 0;
    if (Math.abs(normalZ) < 0.32) {
      let nearestEdge = 0, nearestDistance = Infinity;
      for (let edge = 0; edge < 4; edge++) {
        const d = segmentDistance(center, spec.polygon[edge], spec.polygon[(edge + 1) % 4]);
        if (d < nearestDistance) { nearestEdge = edge; nearestDistance = d; }
      }
      // Only the exposed exterior side remains stone. The aperture and cuts are chrome.
      materialIndex = nearestEdge === 0 ? 0 : 1;
    }
    if (materialIndex !== previousMaterial) {
      if (previousMaterial !== -1) geometry.addGroup(groupStart, i - groupStart, previousMaterial);
      groupStart = i;
      previousMaterial = materialIndex;
    }
    for (let j = i; j < i + 3; j++) {
      // Face-aware projection avoids a constant U coordinate on deep sidewalls.
      const nx = Math.abs(normals.getX(j)), ny = Math.abs(normals.getY(j)), nz = Math.abs(normals.getZ(j));
      const x = positions.getX(j), y = positions.getY(j), z = positions.getZ(j);
      if (nz >= nx && nz >= ny) uv.setXY(j, x * 0.14 + 0.42, y * 0.14 + 0.46);
      else if (nx >= ny) uv.setXY(j, z * 0.14 + x * 0.043 + 0.4, y * 0.14 + 0.46);
      else uv.setXY(j, x * 0.14 + 0.42, z * 0.14 + y * 0.043 + 0.4);
    }
  }
  geometry.addGroup(groupStart, positions.count - groupStart, previousMaterial);
  // The inner aperture tightens through the depth. These slanted chrome faces
  // catch light on both sides, giving the hollow body its architectural facets.
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    if (segmentDistance([x, y], spec.polygon[2], spec.polygon[3]) < MASTER_SPEC.bevel * 2.2) {
      const rear = Math.max(0, Math.min(1, (spec.depth / 2 - z) / spec.depth));
      const fold = Math.sin(y * 1.28 + x * 0.8) * 0.09;
      positions.setXYZ(i, x + ((0.03 - x) * 0.38 + fold) * rear, y + (-0.24 - y) * 0.12 * rear, z);
    }
  }
  geometry.computeVertexNormals();
  geometry.translate(-spec.center[0], -spec.center[1], -spec.center[2]);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = `${spec.id}-beveled-prism`;
  return geometry;
}

function incisionBetween(a, b, material, width) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, direction.length(), width * 1.15), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function createMasterModel({ stoneMap = null } = {}) {
  const group = new THREE.Group();
  group.name = 'THE_IMPOSSIBLE_FORM';
  const stone = new THREE.MeshPhysicalMaterial({
    name: 'Polished black basalt', color: stoneMap ? 0x929aa2 : 0x181a1b,
    roughness: 0.29, metalness: 0.02, clearcoat: 0.30, clearcoatRoughness: 0.20,
    map: stoneMap, bumpMap: stoneMap, bumpScale: 0.0016, envMapIntensity: 0.18,
  });
  const chrome = new THREE.MeshPhysicalMaterial({
    name: 'Polished chrome cut faces', color: 0xe0e6ed,
    metalness: 1, roughness: 0.065, envMapIntensity: 1.1,
    iridescence: 0, iridescenceIOR: 1.32, iridescenceThicknessRange: [220, 430],
  });
  stone.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      float mineralLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(vec3(mineralLuminance), diffuseColor.rgb, 0.10) * 0.78;
    `);
  };
  stone.customProgramCacheKey = () => 'parallax-polished-neutral-basalt-v2';
  const slitMaterial = new THREE.MeshBasicMaterial({ name: 'Ivory incision', color: 0xfff0d3, toneMapped: false });
  const glowMaterial = new THREE.MeshBasicMaterial({
    name: 'Incision penumbra', color: 0xffdca5, transparent: true,
    opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    name: 'Perceptual boundary', color: 0xfff0d3,
    transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  });
  const specs = createFragmentSpecs();
  const fragments = specs.map(spec => {
    const geometry = fragmentGeometry(spec);
    const mesh = new THREE.Mesh(geometry, [stone, chrome]);
    mesh.name = spec.id;
    mesh.position.fromArray(spec.center);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { fragmentId: spec.id, spec, restPosition: [...spec.center], originalGeometry: geometry.uuid };
    // The halo follows only the outer silhouette and aperture, never fracture seams.
    const outline = [];
    for (const [from, to] of [[0, 1], [2, 3]]) {
      for (const point of [spec.polygon[from], spec.polygon[to]]) {
        outline.push(point[0] - spec.center[0], point[1] - spec.center[1], spec.depth / 2 + 0.026);
      }
    }
    const boundaryGeometry = new THREE.BufferGeometry();
    boundaryGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outline, 3));
    const boundary = new THREE.LineSegments(boundaryGeometry, edgeMaterial);
    boundary.name = `${spec.id}-boundary`;
    boundary.renderOrder = 2;
    mesh.add(boundary);
    group.add(mesh);
    return mesh;
  });

  // One slit across the crown, attached to its fragment so identity survives every state.
  const slitOwner = fragments.find(fragment => fragment.userData.spec.side === 2 && fragment.userData.spec.section === 0);
  const slitSpec = slitOwner.userData.spec;
  const slitT = 0.075;
  const a2 = mixPoint(MASTER_SPEC.outer[2], MASTER_SPEC.outer[3], slitT);
  const b2 = mixPoint(MASTER_SPEC.inner[2], MASTER_SPEC.inner[3], slitT);
  const a = new THREE.Vector3(a2[0] - slitSpec.center[0], a2[1] - slitSpec.center[1], MASTER_SPEC.depth / 2 + 0.018);
  const b = new THREE.Vector3(b2[0] - slitSpec.center[0], b2[1] - slitSpec.center[1], MASTER_SPEC.depth / 2 + 0.018);
  const slit = incisionBetween(a, b, slitMaterial, 0.012);
  slit.name = 'The one luminous incision';
  const slitGlow = incisionBetween(a, b, glowMaterial, 0.045);
  slitOwner.add(slit, slitGlow);
  group.userData = { originalDesign: true, masterSpec: MASTER_SPEC, fragmentCount: fragments.length };

  return {
    group, fragments, specs,
    materials: { stone, chrome, slit: slitMaterial, glow: glowMaterial, edge: edgeMaterial },
    setStoneTexture(texture) {
      stone.map = texture;
      stone.bumpMap = texture;
      stone.color.setHex(texture ? 0x929aa2 : 0x181a1b);
      stone.needsUpdate = true;
    },
    dispose() {
      group.traverse(object => { if (object.geometry) object.geometry.dispose(); });
      for (const material of [stone, chrome, slitMaterial, glowMaterial, edgeMaterial]) material.dispose();
    },
  };
}
