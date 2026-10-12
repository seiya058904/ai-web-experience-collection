import * as THREE from 'three';

// Both representations occupy the same moving frame while their material changes.
// The frame is sampled directly from scroll, so stops and reversals have no history.
export function createHandoff() {
  const fromPosition = new THREE.Vector3(), toPosition = new THREE.Vector3();
  const fromScale = new THREE.Vector3(), toScale = new THREE.Vector3();
  const fromRotation = new THREE.Quaternion(), toRotation = new THREE.Quaternion();
  const frame = new THREE.Matrix4(), local = new THREE.Matrix4();
  return (source, destination, progress) => {
    source.updateWorldMatrix(true, false);
    destination.updateWorldMatrix(true, false);
    source.matrixWorld.decompose(fromPosition, fromRotation, fromScale);
    destination.matrixWorld.decompose(toPosition, toRotation, toScale);
    fromPosition.lerp(toPosition, progress);
    fromRotation.slerp(toRotation, progress);
    fromScale.lerp(toScale, progress);
    frame.compose(fromPosition, fromRotation, fromScale);
    for (const object of [source, destination]) {
      local.copy(object.parent.matrixWorld).invert().multiply(frame);
      local.decompose(object.position, object.quaternion, object.scale);
      object.updateWorldMatrix(false, true);
    }
  };
}

export function lightingForState(scene, transition) {
  const next = Math.min(6, scene + 1);
  const intensity = i => i === 4 ? 2.6 : i === 5 ? 1.8 : 1.65;
  const rim = i => i === 5 ? 1.45 : 1.1;
  const mix = (a, b) => a + (b - a) * transition;
  return {
    macro: mix(scene === 4 ? 1 : 0, next === 4 ? 1 : 0),
    key: mix(intensity(scene), intensity(next)),
    rim: mix(rim(scene), rim(next)),
  };
}
