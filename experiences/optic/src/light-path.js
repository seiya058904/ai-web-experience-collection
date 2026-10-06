import * as THREE from "three";
import { clamp } from "./story.js";

/** Snell refraction at the actual authored glass surface. No optical prescription claim. */
export function refract(
  direction,
  normal,
  n1,
  n2,
  target = new THREE.Vector3(),
) {
  const n = normal.clone();
  if (n.dot(direction) > 0) n.negate();
  const eta = n1 / n2;
  const cosine = -n.dot(direction);
  const discriminant = 1 - eta * eta * (1 - cosine * cosine);
  if (discriminant < 0) return null;
  return target
    .copy(direction)
    .multiplyScalar(eta)
    .addScaledVector(n, eta * cosine - Math.sqrt(discriminant))
    .normalize();
}

export function traceOpticalRay(optics, height = 0.32, slope = 0) {
  const front = optics.elements[0].position.z;
  let origin = new THREE.Vector3(0, height, front + 3.8);
  let direction = new THREE.Vector3(0, slope, -1).normalize();
  const points = [origin.clone()];
  for (let index = 0; index < optics.elements.length; index++) {
    const spec = optics.elementSpecs[index];
    for (const side of ["front", "back"]) {
      let distance =
        (optics.sampleSurface(index, Math.abs(origin.y), side) - origin.z) /
        direction.z;
      const point = new THREE.Vector3();
      for (let iteration = 0; iteration < 7; iteration++) {
        point.copy(origin).addScaledVector(direction, distance);
        const r = Math.hypot(point.x, point.y);
        const z = optics.sampleSurface(index, Math.min(r, spec.radius), side);
        const epsilon = 0.0001;
        const slopeZ =
          (optics.sampleSurface(
            index,
            Math.min(r + epsilon, spec.radius),
            side,
          ) -
            optics.sampleSurface(index, Math.max(0, r - epsilon), side)) /
          (2 * epsilon);
        const dr =
          r > 1e-7 ? (point.x * direction.x + point.y * direction.y) / r : 0;
        const derivative = direction.z - slopeZ * dr;
        if (Math.abs(derivative) < 1e-7) break;
        distance -= (point.z - z) / derivative;
      }
      point.copy(origin).addScaledVector(direction, distance);
      if (
        Math.hypot(point.x, point.y) > spec.radius * 0.995 ||
        !Number.isFinite(point.z)
      ) {
        points.push(
          origin.clone().addScaledVector(direction, Math.max(0.05, distance)),
        );
        return points;
      }
      points.push(point.clone());
      const normal = optics.surfaceNormal(index, point.x, point.y, side);
      const ior = spec.ior || 1.5;
      const next = refract(
        direction,
        normal,
        side === "front" ? 1 : ior,
        side === "front" ? ior : 1,
      );
      if (!next) return points;
      direction = next;
      origin = point.clone().addScaledVector(direction, 0.000001);
    }
  }
  const distance = -origin.z / direction.z;
  points.push(origin.clone().addScaledVector(direction, distance));
  return points;
}

export function createLightPath(optics) {
  const group = new THREE.Group();
  group.name = "The shared optical path";
  const lines = [],
    packets = [],
    paths = [];
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const ctx = glowCanvas.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "#fffef5");
  glow.addColorStop(0.12, "#ffefdccc");
  glow.addColorStop(0.28, "#ffdec74d");
  glow.addColorStop(1, "#ffdec700");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  for (let index = 0; index < 3; index++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(24 * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: 0xf1e7d6,
      transparent: true,
      opacity: index === 1 ? 0.68 : 0.28,
      depthWrite: false,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 4;
    lines.push(line);
    group.add(line);
    const packet = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffeee0,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    packet.scale.setScalar(index === 1 ? 0.18 : 0.09);
    packets.push(packet);
    group.add(packet);
  }
  let lastKey = "";
  let disposed = false;
  const desktopRayIndices = [0, 1, 2];
  const mobileRayIndices = [0, 2];
  function update(
    time,
    progress,
    intensity = 1,
    mobile = false,
    entrance = false,
  ) {
    const key = `${optics.explode.toFixed(4)}:${optics.focus.toFixed(4)}:${optics.fNumber.toFixed(3)}`;
    if (key !== lastKey) {
      lastKey = key;
      const h = Math.min(0.35, optics.apertureRadius * 0.66);
      for (let i = 0; i < 3; i++) {
        paths[i] = traceOpticalRay(optics, (i - 1) * h);
        const attr = lines[i].geometry.attributes.position;
        paths[i].forEach((point, k) =>
          attr.setXYZ(k, point.x, point.y, point.z),
        );
        lines[i].geometry.setDrawRange(0, paths[i].length);
        attr.needsUpdate = true;
      }
    }
    group.userData.visibleRayIndices = mobile
      ? mobileRayIndices
      : desktopRayIndices;
    for (let i = 0; i < 3; i++) {
      // Retain the two marginal rays on narrow screens. The axial ray cannot
      // reveal bending; these are the same Snell-traced paths used on desktop.
      lines[i].visible = packets[i].visible = !mobile || i !== 1;
      lines[i].material.opacity =
        (mobile ? (i === 0 ? 0.54 : 0.4) : i === 1 ? 0.65 : 0.25) * intensity;
      packets[i].scale.setScalar(mobile ? 0.105 : i === 1 ? 0.18 : 0.09);
      const path = paths[i];
      if (!path?.length) continue;
      const position =
        (((time * 0.12 + progress * 0.4 + i * 0.17) % 1) + 1) % 1;
      const segment = position * (path.length - 1);
      const index = Math.min(path.length - 2, Math.floor(segment));
      packets[i].position
        .copy(path[index])
        .lerp(path[index + 1], segment - index);
      packets[i].material.opacity = clamp(intensity) * (entrance ? 1 : 0.8);
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    lines.forEach((line) => {
      line.geometry.dispose();
      line.material.dispose();
    });
    packets.forEach((packet) => packet.material.dispose());
    glowTexture.dispose();
    group.clear();
    group.removeFromParent();
  }
  return { group, update, dispose, paths };
}
