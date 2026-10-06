import * as THREE from 'three';
import { smooth } from './journey.js';

/** The opening headline is genuinely behind the glass in the optical pass. */
export function createTypePlane(element) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const reveal = { value: 1 };
  const start = { value: .82 };
  const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: .001, depthWrite: false, transparent: true });
  material.onBeforeCompile = shader => {
    shader.uniforms.uTypeReveal = reveal;
    shader.uniforms.uTypeStart = start;
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTypeReveal; uniform float uTypeStart;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nif (vMapUv.x > uTypeReveal || vMapUv.x < uTypeStart) discard;');
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.userData.texture = texture;
  const forward = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let box = { left: 0, top: 0, width: 1, height: 1 };
  const padding = 10;

  function resize() {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const rootOffset = parseFloat(document.querySelector('#ui').style.getPropertyValue('--caption-offset')) || 0;
    box = { left: rect.left - rootOffset - padding, top: rect.top - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 };
    start.value = (rect.width * .82 + padding) / box.width;
    const scale = Math.min(2, 4096 / box.width);
    const nextWidth = Math.ceil(box.width * scale);
    const nextHeight = Math.ceil(box.height * scale);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      // WebGL 2 texture storage is immutable. Updating a larger canvas into
      // the old allocation can clip text and trigger an out-of-bounds upload.
      texture.dispose();
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      material.map = texture;
      mesh.userData.texture = texture;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, box.width, box.height);
    context.font = `${style.fontWeight} ${style.fontSize} Manrope, sans-serif`;
    context.letterSpacing = style.letterSpacing;
    context.fillStyle = '#171a1b';
    context.textBaseline = 'alphabetic';
    const metric = context.measureText('Hg');
    const line = parseFloat(style.lineHeight);
    const ascent = metric.fontBoundingBoxAscent;
    const descent = metric.fontBoundingBoxDescent;
    const baseline = (line - ascent - descent) * .5 + ascent;
    ['Light,', 'through', 'matter.'].forEach((text, i) => context.fillText(text, padding, padding + baseline + line * i));
    texture.needsUpdate = true;
  }

  function update(camera, view, width, height) {
    const local = view.progress * 6;
    reveal.value = view.from === 0 ? 1 - smooth(.71, .98, local) : 0;
    mesh.visible = reveal.value > .001 && width > 760;
    if (!mesh.visible) return;
    const distance = 20;
    const perPixel = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * .5)) / height;
    camera.getWorldDirection(forward);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const x = box.left + box.width * .5 - width * .5;
    const y = height * .5 - box.top - box.height * .5;
    mesh.position.copy(camera.position).addScaledVector(forward, distance).addScaledVector(right, x * perPixel).addScaledVector(up, y * perPixel);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.set(box.width * perPixel, box.height * perPixel, 1);
  }
  return { mesh, resize, update };
}
