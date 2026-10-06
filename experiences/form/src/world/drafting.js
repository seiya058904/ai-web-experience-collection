import * as THREE from 'three';

const TAU = Math.PI * 2;
const POINTS = 160;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const smooth = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const vector = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Drawing belongs to the objects: measures follow the chair, exploded guides
 * follow the real fixings, and one inherited contour becomes the next object.
 * No DOM, timers, independent animation loop, or screen-space guessing.
 */
export function createDrafting({ scene, chair, lamp, table }) {
  const group = new THREE.Group();
  group.name = 'FORM / object-derived drawing systems';
  if (scene) scene.add(group);
  const geometries = new Set();
  const materials = new Set();
  const lightInk = new THREE.Color('#7d756b');
  const darkInk = new THREE.Color('#ada89a');
  const inverse = new THREE.Matrix4();
  const temporary = new THREE.Vector3();
  const curveChair = new THREE.Matrix4();
  const curveLamp = new THREE.Matrix4();
  const curveTable = new THREE.Matrix4();

  function ownGeometry(geometry) {
    geometries.add(geometry);
    return geometry;
  }

  function ink(opacity, dashed = false) {
    const settings = { color: lightInk, transparent: true, opacity, depthTest: true, depthWrite: false };
    const material = dashed
      ? new THREE.LineDashedMaterial({ ...settings, dashSize: 0.009, gapSize: 0.007, scale: 1 })
      : new THREE.LineBasicMaterial(settings);
    materials.add(material);
    return material;
  }

  function lineSegments(name, segments, material, parent) {
    const positions = new Float32Array(segments.length * 6);
    for (let i = 0; i < segments.length; i += 1) {
      segments[i][0].toArray(positions, i * 6);
      segments[i][1].toArray(positions, i * 6 + 3);
    }
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const result = new THREE.LineSegments(geometry, material);
    result.name = name;
    result.frustumCulled = false;
    if (material.isLineDashedMaterial) result.computeLineDistances();
    parent.add(result);
    return result;
  }

  function objectDrawing(name) {
    const result = new THREE.Group();
    result.name = name;
    result.matrixAutoUpdate = false;
    group.add(result);
    return result;
  }

  const dimensions = objectDrawing('ARC / measured proportions');
  const chairGuides = objectDrawing('ARC / mounting alignment');
  const tableGuides = objectDrawing('PLANE / assembly alignment');
  const measurementInk = ink(0);
  const extensionInk = ink(0);
  const chairGuideInk = ink(0, true);
  const tableGuideInk = ink(0, true);

  // Nominal concept measures. The measured points themselves remain fixed in
  // the model's metre coordinate system, including all small diagonal ticks.
  const dimensionSegments = [
    [vector(-0.283, 0.910, -0.320), vector(0.283, 0.910, -0.320)],
    [vector(-0.400, 0.000, -0.320), vector(-0.400, 0.838, -0.320)],
    [vector(0.390, 0.000, 0.180), vector(0.390, 0.445, 0.180)],
  ];
  for (const endpoints of [...dimensionSegments]) {
    for (const point of endpoints) {
      dimensionSegments.push([
        point.clone().add(vector(-0.007, -0.010, 0)),
        point.clone().add(vector(0.007, 0.010, 0)),
      ]);
    }
  }
  const extensionSegments = [
    [vector(-0.283, 0.820, -0.320), vector(-0.283, 0.931, -0.320)],
    [vector(0.283, 0.820, -0.320), vector(0.283, 0.931, -0.320)],
    [vector(-0.284, 0, -0.320), vector(-0.422, 0, -0.320)],
    [vector(-0.235, 0.838, -0.320), vector(-0.422, 0.838, -0.320)],
    [vector(0.280, 0, 0.180), vector(0.410, 0, 0.180)],
    [vector(0.264, 0.445, 0.180), vector(0.410, 0.445, 0.180)],
  ];
  const dimensionLines = lineSegments('Width / height / seat height', dimensionSegments, measurementInk, dimensions);
  const extensionLines = lineSegments('Extension lines', extensionSegments, extensionInk, dimensions);
  const chairMounts = chair.parts.filter((part) => part.name.startsWith('mount-'));
  const chairGuideLines = lineSegments('Four bolt-axis guides', chairMounts.map(() => [vector(0, 0, 0), vector(0, 0, 0)]), chairGuideInk, chairGuides);
  const tableGuideLines = lineSegments('Leg / bracket / plane guides', Array.from({ length: 6 }, () => [vector(0, 0, 0), vector(0, 0, 0)]), tableGuideInk, tableGuides);

  // Read the actual shell mesh's perimeter, then sample it by distance. This
  // preserves its recognisable waterfall edge and seat-to-back S curvature.
  function shellPerimeter() {
    const surface = chair.surfaces[0];
    const position = surface.geometry.attributes.position;
    const normals = surface.geometry.attributes.normal;
    const columns = 72;
    const rows = 128;
    const points = [];
    function add(i, j) {
      const index = j * (columns + 1) + i;
      points.push(new THREE.Vector3().fromBufferAttribute(position, index)
        .addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, index), 0.0006));
    }
    // Start on the upper left. The initial visible stroke reaches from the
    // typography side, across the crown, and down the chair's outer curve.
    for (let i = 0; i < columns; i += 1) add(i, rows);
    for (let j = rows; j > 0; j -= 1) add(columns, j);
    for (let i = columns; i > 0; i -= 1) add(i, 0);
    for (let j = 0; j < rows; j += 1) add(0, j);
    points.push(points[0].clone());
    const distances = [0];
    for (let i = 1; i < points.length; i += 1) distances.push(distances[i - 1] + points[i].distanceTo(points[i - 1]));
    const total = distances.at(-1);
    let interval = 1;
    return Array.from({ length: POINTS }, (_, i) => {
      const distance = (i / (POINTS - 1)) * total;
      while (interval < points.length - 1 && distances[interval] < distance) interval += 1;
      const t = (distance - distances[interval - 1]) / Math.max(1e-9, distances[interval] - distances[interval - 1]);
      return points[interval - 1].clone().lerp(points[interval], t);
    });
  }

  const inheritedShell = shellPerimeter();
  const shellPositions = chair.surfaces[0].geometry.attributes.position;
  const shellNormals = chair.surfaces[0].geometry.attributes.normal;
  const frontNormal = new THREE.Vector3().fromBufferAttribute(shellNormals, 36);
  const frontEdgeAnchor = new THREE.Vector3().fromBufferAttribute(shellPositions, 36)
    .addScaledVector(frontNormal, -0.007)
    .addScaledVector(vector(0, -frontNormal.z, frontNormal.y).normalize(), 0.00125);
  const veneerAnchor = new THREE.Vector3().fromBufferAttribute(shellPositions, 92 * 73 + 22);
  const familyGeometry = ownGeometry(new THREE.BufferGeometry());
  const familyPositions = new Float32Array(POINTS * 3);
  familyGeometry.setAttribute('position', new THREE.BufferAttribute(familyPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const familyInk = new THREE.LineBasicMaterial({ color: '#9c543d', transparent: true, opacity: 0.52, depthTest: true, depthWrite: false });
  materials.add(familyInk);
  const familyCurve = new THREE.Line(familyGeometry, familyInk);
  familyCurve.name = 'One inherited edge / ARC → ORB → PLANE → space';
  familyCurve.frustumCulled = false;
  familyCurve.renderOrder = 2;
  group.add(familyCurve);
  const chairPoint = new THREE.Vector3();
  const lampPoint = new THREE.Vector3();
  const tablePoint = new THREE.Vector3();
  const floorPoint = new THREE.Vector3();
  const chairOrigin = new THREE.Vector3();
  const tableOrigin = new THREE.Vector3();
  const floorCentre = new THREE.Vector3();

  function drawDimensionSegments(line, segments, amount, ticks = false) {
    const attribute = line.geometry.attributes.position;
    for (let i = 0; i < segments.length; i += 1) {
      const a = segments[i][0];
      const b = segments[i][1];
      const grow = smooth(ticks && i > 2 ? 0.30 : 0.03, ticks && i > 2 ? 0.96 : 0.78, amount);
      temporary.copy(a).lerp(b, 0.5);
      attribute.setXYZ(i * 2,
        temporary.x + (a.x - temporary.x) * grow,
        temporary.y + (a.y - temporary.y) * grow,
        temporary.z + (a.z - temporary.z) * grow);
      attribute.setXYZ(i * 2 + 1,
        temporary.x + (b.x - temporary.x) * grow,
        temporary.y + (b.y - temporary.y) * grow,
        temporary.z + (b.z - temporary.z) * grow);
    }
    attribute.needsUpdate = true;
  }

  function writeGuide(attribute, index, a, b) {
    attribute.setXYZ(index * 2, a.x, a.y, a.z);
    attribute.setXYZ(index * 2 + 1, b.x, b.y, b.z);
  }

  function update(state) {
    const p = clamp(state.progress, 0, 8);
    chair.group.updateWorldMatrix(true, true);
    lamp.group.updateWorldMatrix(true, true);
    table.group.updateWorldMatrix(true, true);
    group.updateWorldMatrix(true, false);
    inverse.copy(group.matrixWorld).invert();
    dimensions.matrix.copy(inverse).multiply(chair.group.matrixWorld);
    chairGuides.matrix.copy(dimensions.matrix);
    tableGuides.matrix.copy(inverse).multiply(table.group.matrixWorld);
    for (const drawing of [dimensions, chairGuides, tableGuides]) drawing.matrixWorldNeedsUpdate = true;

    for (const material of [measurementInk, extensionInk, chairGuideInk, tableGuideInk]) material.color.copy(lightInk).lerp(darkInk, clamp(state.dark));
    const dimensionAmount = clamp(state.dimensions);
    measurementInk.opacity = dimensionAmount * 0.64;
    extensionInk.opacity = dimensionAmount * 0.39;
    dimensions.visible = dimensionAmount > 0.001;
    if (dimensions.visible) {
      drawDimensionSegments(dimensionLines, dimensionSegments, dimensionAmount, true);
      drawDimensionSegments(extensionLines, extensionSegments, dimensionAmount);
    }

    const chairAmount = clamp(state.structure) * smooth(0.08, 0.60, clamp(state.ce));
    chairGuideInk.opacity = chairAmount * 0.62;
    chairGuides.visible = chairAmount > 0.001;
    if (chairGuides.visible) {
      const attribute = chairGuideLines.geometry.attributes.position;
      for (let i = 0; i < chairMounts.length; i += 1) {
        const fixing = chairMounts[i];
        const start = temporary.copy(fixing.basePosition);
        start.y = 0.420;
        const end = fixing.basePosition.clone();
        end.y += chair.shell.position.y - 0.006;
        writeGuide(attribute, i, start, end);
      }
      attribute.needsUpdate = true;
      chairGuideLines.computeLineDistances();
    }

    const tableAmount = clamp(state.assembly) * smooth(0.02, 0.44, clamp(state.te));
    tableGuideInk.opacity = tableAmount * 0.60;
    tableGuides.visible = tableAmount > 0.001;
    if (tableGuides.visible) {
      const attribute = tableGuideLines.geometry.attributes.position;
      for (let i = 0; i < 3; i += 1) {
        const leg = table.parts.legs[i].position;
        const bracket = table.parts.brackets[i].position;
        const start = vector(leg.x, 0.399, leg.z);
        const angle = Math.PI / 6 + (i * TAU) / 3;
        const end = vector(Math.cos(angle) * 0.185, 0.430 + table.parts.top.position.y, Math.sin(angle) * 0.185);
        writeGuide(attribute, i * 2, start, bracket);
        writeGuide(attribute, i * 2 + 1, bracket, end);
      }
      attribute.needsUpdate = true;
      tableGuideLines.computeLineDistances();
    }

    curveChair.copy(inverse).multiply(chair.surfaces[0].matrixWorld);
    curveLamp.copy(inverse).multiply(lamp.parts.shade.matrixWorld);
    curveTable.copy(inverse).multiply(table.parts.top.matrixWorld);
    const chairToLamp = smooth(3.60, 4.18, p);
    const lampToTable = smooth(5.60, 6.18, p);
    const tableToSpace = smooth(6.82, 7.26, p);
    const loose = 1 - smooth(0.22, 0.90, p);
    chair.group.getWorldPosition(chairOrigin);
    table.group.getWorldPosition(tableOrigin);
    floorCentre.copy(chairOrigin).lerp(tableOrigin, 0.5);
    floorCentre.y = Math.min(chairOrigin.y, tableOrigin.y) + 0.003;
    floorCentre.z += 0.035;
    const floorRadiusX = Math.max(0.62, Math.hypot(chairOrigin.x - tableOrigin.x, chairOrigin.z - tableOrigin.z) * 0.50 + 0.38);

    for (let i = 0; i < POINTS; i += 1) {
      const t = i / (POINTS - 1);
      const angle = Math.PI + TAU * t;
      chairPoint.copy(inheritedShell[i]);
      // An unclosed, enlarged left crown is a restrained initial gesture. Its
      // points settle onto the very same physical perimeter before measuring.
      const sweep = Math.exp(-Math.pow((t - 0.025) / 0.125, 2));
      chairPoint.x -= loose * (0.40 * sweep);
      chairPoint.y += loose * (0.043 * sweep);
      chairPoint.applyMatrix4(curveChair);
      lampPoint.set(Math.cos(angle) * 0.1903, 0.26625, Math.sin(angle) * 0.1903).applyMatrix4(curveLamp);
      tablePoint.set(Math.cos(angle) * 0.2703, 0.415, Math.sin(angle) * 0.2703).applyMatrix4(curveTable);
      const floorAngle = Math.PI * 0.91 + t * Math.PI * 1.78;
      floorPoint.set(floorCentre.x + Math.cos(floorAngle) * floorRadiusX,
        floorCentre.y, floorCentre.z + Math.sin(floorAngle) * 0.42).applyMatrix4(inverse);
      temporary.copy(chairPoint).lerp(lampPoint, chairToLamp).lerp(tablePoint, lampToTable).lerp(floorPoint, tableToSpace);
      temporary.toArray(familyPositions, i * 3);
    }
    familyGeometry.attributes.position.needsUpdate = true;
    const handoff = Math.max(4 * chairToLamp * (1 - chairToLamp), 4 * lampToTable * (1 - lampToTable));
    familyInk.opacity = 0.42 + 0.20 * handoff + 0.10 * loose - 0.02 * clamp(state.final);
    familyGeometry.setDrawRange(0, p < 0.90 ? Math.max(2, Math.floor(POINTS * (0.42 + 0.58 * smooth(0, 0.73, p)))) : POINTS);
    group.updateWorldMatrix(true, true);
  }

  function world(object, local) {
    return object.localToWorld(local.clone());
  }

  function label(object, anchor, text, side, kind, opacity) {
    return { anchor: world(object, anchor), text, side, kind, opacity: clamp(opacity) };
  }

  function getAnnotations(state) {
    const stages = ['dimensions', 'structure', 'material', 'light', 'detail', 'assembly', 'final'];
    const active = stages.reduce((a, b) => clamp(state[a]) >= clamp(state[b]) ? a : b);
    const strength = clamp(state[active]);
    if (strength < 0.025) return [];
    const chairLabel = (anchor, text, side, opacity = strength) => label(chair.group, anchor, text, side, 'label', opacity);
    const lampLabel = (anchor, text, side, opacity = strength) => label(lamp.group, anchor, text, side, 'label', opacity);
    const tableLabel = (anchor, text, side, opacity = strength) => label(table.group, anchor, text, side, 'label', opacity);
    if (active === 'dimensions') return [
      label(chair.group, vector(0, 0.929, -0.320), '570 mm', 'right', 'dimension', strength),
      label(chair.group, vector(-0.418, 0.419, -0.320), '840 mm', 'left', 'dimension', strength),
      label(chair.group, vector(0.408, 0.2225, 0.180), '445 mm', 'right', 'dimension', strength),
    ];
    if (active === 'structure') {
      const frame = chair.parts.find((part) => part.name === 'right-frame');
      return [
        chairLabel(chair.anchors.shell.clone().add(chair.shell.position), 'Shell', 'right'),
        chairLabel(chair.anchors.frame.clone().add(frame.object.position), 'Frame', 'left'),
        chairLabel(chairMounts[2].object.position, 'Connection', 'right'),
      ];
    }
    if (active === 'material') return [
      { ...label(chair.surfaces[0], frontEdgeAnchor, 'Seven-ply edge', 'right', 'label', strength), lift: -34 },
      label(chair.surfaces[0], veneerAnchor, 'Continuous veneer', 'left', 'label', strength),
    ];
    if (active === 'light') return [
      lampLabel(vector(0.130, 0.351 + lamp.parts.shade.position.y, 0.070), 'Spun aluminium', 'right'),
      lampLabel(vector(-0.072, 0.267 + lamp.parts.diffuser.position.y, 0.146), 'Opal diffuser', 'left'),
    ];
    if (active === 'detail') {
      const cutX = 0.205 * (1 - clamp(state.cut));
      const cutZ = 0.050;
      const cutY = 0.26625 + 0.13375 * Math.sqrt(Math.max(0, 1 - (cutX * cutX + cutZ * cutZ) / (0.19 * 0.19)));
      return [
        lampLabel(vector(cutX, cutY + lamp.parts.shade.position.y, cutZ), '2.5 mm shell', 'right'),
        lampLabel(vector(-0.070, 0.270 + lamp.parts.diffuser.position.y, 0.130), 'Opal diffuser', 'left'),
        lampLabel(lamp.anchors.detail, 'Machined collar', 'right'),
      ];
    }
    if (active === 'assembly') return [
      tableLabel(vector(0.190, table.anchors.top.y, 0.120), 'Limestone plane', 'right'),
      { ...tableLabel(vector(0, 0.377, 0), 'Three-way support', 'left', strength * (0.35 + 0.65 * clamp(state.te))), mobileLift: 12 },
      tableLabel(table.anchors.detail, 'Captive fixing', 'right', strength * (0.35 + 0.65 * clamp(state.te))),
    ];
    return [
      chairLabel(chair.anchors.shell, 'ARC / Chair', 'left', strength * 0.86),
      lampLabel(vector(0.145, 0.343, 0.05), 'ORB / Lamp', 'right', strength * 0.86),
      tableLabel(vector(0.205, 0.427, 0.12), 'PLANE / Table', 'right', strength * 0.86),
    ];
  }

  function dispose() {
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    group.removeFromParent();
  }

  return { group, update, getAnnotations, dispose };
}
