// Callouts that follow their parts. Each one is hidden when its part is behind something else,
// off screen, or when a more important callout already occupies that piece of the frame.
import * as THREE from 'three';
import { smooth } from './kinematics.js';

export function createLabels(layer, components, { onPick }) {
  const items = components.map((component) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'callout';
    el.tabIndex = -1;
    el.innerHTML = `<i></i><span><b>${component.number}</b>${component.name}</span>`;
    el.addEventListener('click', () => onPick(component.id));
    layer.append(el);
    return { component, el, width: 0, height: 0, clear: 1, shown: 0, x: 0, y: 0, flip: false, visible: false, placed: false };
  });
  const sphere = new THREE.Sphere();
  const point = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  let cursor = 0;
  let measured = false;

  function measure() {
    for (const item of items) {
      const rect = item.el.querySelector('span').getBoundingClientRect();
      item.width = rect.width; item.height = rect.height;
    }
    measured = true;
  }

  /**
   * `targets` are the meshes that can hide a part; `ignore(mesh)` skips ones that are see-through.
   */
  function update({ model, camera, width, height, progress, enabled, selected, targets, ignore, delta, safe }) {
    if (!measured) measure();
    const placed = [];
    // One occlusion test per frame, taken in turn. Cheap, and quick enough to keep up with an orbit.
    const probe = items[cursor % items.length];
    cursor += 1;

    for (const item of items) {
      const { component } = item;
      const [from, to] = component.show;
      const inRange = smooth(from - 0.02, from + 0.04, progress) * (1 - smooth(to + 0.001, to + 0.04, progress));
      const want = enabled && (inRange > 0.5 || selected === component.id);
      item.visible = false;
      if (!want || !model.boundsOf(component.id, sphere)) continue;
      point.copy(sphere.center).project(camera);
      if (point.z > 1 || point.z < -1) continue;
      item.x = (point.x * 0.5 + 0.5) * width;
      item.y = (-point.y * 0.5 + 0.5) * height;
      if (item.x < safe.left || item.x > width - safe.right || item.y < safe.top || item.y > height - safe.bottom) continue;
      item.visible = true;

      if (item === probe) {
        direction.copy(sphere.center).sub(camera.position);
        const distance = direction.length();
        ray.set(camera.position, direction.normalize());
        ray.near = camera.near; ray.far = distance - Math.max(0.12, sphere.radius * 0.7);
        let blocked = false;
        if (ray.far > ray.near) {
          for (const hit of ray.intersectObjects(targets, false)) {
            if (hit.object.userData.comp === component.id || ignore(hit.object, hit.point)) continue;
            blocked = true;
            break;
          }
        }
        item.blocked = blocked;
      }
    }

    // Place by rank; a callout that would overlap one already placed waits its turn.
    const order = items.filter((item) => item.visible).sort((a, b) => (b.component.id === selected) - (a.component.id === selected) || b.component.rank - a.component.rank);
    for (const item of order) {
      item.flip = item.x < width * 0.5;
      const pad = item.placed ? 2 : 10;
      const left = item.flip ? item.x - item.width - 16 : item.x - 6;
      const rect = { l: left - pad, r: left + item.width + 22 + pad, t: item.y - item.height / 2 - pad, b: item.y + item.height / 2 + pad };
      const clash = placed.some((o) => rect.l < o.r && rect.r > o.l && rect.t < o.b && rect.b > o.t);
      const fits = rect.l > 4 && rect.r < width - 4;
      item.placed = !clash && fits && (!item.blocked || item.component.id === selected);
      if (item.placed) placed.push(rect);
    }

    for (const item of items) {
      const goal = item.visible && item.placed ? 1 : 0;
      item.shown += (goal - item.shown) * Math.min(1, delta * (goal ? 5 : 9));
      if (item.shown < 0.01 && !goal) {
        if (item.el.style.visibility !== 'hidden') item.el.style.visibility = 'hidden';
        item.placed = false;
        continue;
      }
      item.el.style.visibility = 'visible';
      item.el.style.opacity = item.shown.toFixed(3);
      item.el.style.transform = `translate3d(${item.x.toFixed(1)}px,${item.y.toFixed(1)}px,0)`;
      item.el.classList.toggle('is-flipped', item.flip);
      item.el.classList.toggle('is-selected', item.component.id === selected);
    }
  }

  return { update, measure };
}
