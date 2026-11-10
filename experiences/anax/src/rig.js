// Camera rig: an orbit the viewer can take over at any moment, and that the piece drives when left alone.
// Every source of motion (the entrance, the slow turn, a focus move, the viewer's hand) writes to one goal,
// and the camera eases toward it, so handing control back and forth never produces a jump.
import * as THREE from 'three';
import { clamp, lerp, EASE } from './kinematics.js';

const TAU = Math.PI * 2;

export function createRig(camera, element, { reducedMotion = false } = {}) {
  const goal = { az: 0, pol: 1.1, zoom: 1, pan: new THREE.Vector3() };
  const now = { az: 0, pol: 1.1, zoom: 1, pan: new THREE.Vector3() };
  const frame = { centre: new THREE.Vector3(), radius: 8 }; // what "everything" is at the current progress
  const focus = { active: false, weight: 0, centre: new THREE.Vector3(), radius: 1, shown: new THREE.Vector3(), shownRadius: 1 };
  const home = { az: 0.66, pol: 1.13 };
  const shift = { x: 0, y: 0, nowX: 0, nowY: 0 };
  const intro = { active: false, time: 0, duration: 5.2, az: 0, pol: 0, zoom: 1 };
  const listeners = { tap: () => {}, hover: () => {}, input: () => {} };
  let lastInput = -1e9;
  let clock = 0;
  let drift = 0;
  let portrait = false;
  let size = { w: 1, h: 1 };
  let enabled = true;

  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  function setViewport(w, h) {
    size = { w, h };
    portrait = h > w * 1.08;
    camera.fov = portrait ? 34 : 26;
    home.az = portrait ? 0.3 : 0.66;
    home.pol = portrait ? 0.74 : 1.13;
  }

  function setFrame(centre, radius) {
    frame.centre.copy(centre);
    frame.radius = radius;
  }

  /** Shift the picture on screen (pixels) to clear interface panels. */
  function setShift(x, y) { shift.x = x; shift.y = y; }

  function fitDistance(radius) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    return radius / Math.sin(Math.min(v, h));
  }

  function touch() {
    lastInput = clock;
    drift = 0;
    if (intro.active) endIntro();
    listeners.input();
  }

  function endIntro() {
    if (!intro.active) return;
    intro.active = false;
    goal.az = now.az; goal.pol = now.pol; goal.zoom = now.zoom;
  }

  function startIntro() {
    goal.az = home.az; goal.pol = home.pol; goal.zoom = 1; goal.pan.set(0, 0, 0);
    if (reducedMotion) { snap(); return; }
    intro.active = true; intro.time = 0;
    intro.az = home.az + 1.25; intro.pol = 1.42; intro.zoom = 0.36;
    now.az = intro.az; now.pol = intro.pol; now.zoom = intro.zoom;
  }

  function snap() {
    now.az = goal.az; now.pol = goal.pol; now.zoom = goal.zoom; now.pan.copy(goal.pan);
    focus.weight = focus.active ? 1 : 0;
    shift.nowX = shift.x; shift.nowY = shift.y;
  }

  function reset() {
    endIntro();
    // Return by the short way round.
    const turns = Math.round((now.az - home.az) / TAU);
    goal.az = home.az + turns * TAU;
    goal.pol = home.pol; goal.zoom = 1; goal.pan.set(0, 0, 0);
    lastInput = clock - 2.5;
  }

  function focusOn(centre, radius, view) {
    endIntro();
    focus.active = true;
    focus.centre.copy(centre);
    focus.radius = radius;
    goal.pan.set(0, 0, 0);
    goal.zoom = 1;
    if (view) {
      const turns = Math.round((now.az - view.az) / TAU);
      goal.az = view.az + turns * TAU;
      goal.pol = view.pol;
    }
    lastInput = clock;
  }

  function clearFocus() {
    focus.active = false;
    goal.zoom = clamp(goal.zoom, 0.5, 1.4);
  }

  // --- pointer input -------------------------------------------------------------------------
  const pointers = new Map();
  let gesture = null;
  const local = (event) => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function onDown(event) {
    if (!enabled || (event.pointerType === 'mouse' && event.button > 2)) return;
    element.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { ...local(event), button: event.button });
    const list = [...pointers.values()];
    if (list.length === 1) {
      gesture = { kind: event.button === 2 || event.shiftKey ? 'pan' : 'orbit', startX: list[0].x, startY: list[0].y, moved: 0, time: performance.now(), type: event.pointerType };
    } else if (list.length === 2) {
      gesture = { kind: 'pinch', span: Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y), midX: (list[0].x + list[1].x) / 2, midY: (list[0].y + list[1].y) / 2, moved: 99 };
    }
    touch();
  }

  function panBy(dx, dy) {
    const scale = (distanceNow() * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * 2) / size.h;
    goal.pan.addScaledVector(right, -dx * scale).addScaledVector(up, dy * scale);
    const limit = frame.radius * 0.9;
    if (goal.pan.length() > limit) goal.pan.setLength(limit);
  }

  function onMove(event) {
    const point = local(event);
    if (!pointers.has(event.pointerId)) {
      if (event.pointerType === 'mouse') listeners.hover(point);
      return;
    }
    const previous = pointers.get(event.pointerId);
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    pointers.set(event.pointerId, { ...previous, ...point });
    if (!gesture) return;
    const list = [...pointers.values()];
    if (gesture.kind === 'pinch' && list.length >= 2) {
      const span = Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
      const midX = (list[0].x + list[1].x) / 2;
      const midY = (list[0].y + list[1].y) / 2;
      if (gesture.span > 0) goal.zoom = clamp(goal.zoom * (gesture.span / Math.max(span, 1)), 0.12, 1.9);
      panBy(midX - gesture.midX, midY - gesture.midY);
      gesture.span = span; gesture.midX = midX; gesture.midY = midY;
      touch();
      return;
    }
    gesture.moved += Math.abs(dx) + Math.abs(dy);
    if (gesture.moved < 5) return;
    if (gesture.kind === 'pan') panBy(dx, dy);
    else {
      const k = (portrait ? 5.2 : 4.2) / Math.min(size.w, size.h);
      goal.az += dx * k;
      goal.pol = clamp(goal.pol - dy * k, 0.16, 2.35);
    }
    touch();
  }

  function onUp(event) {
    if (!pointers.has(event.pointerId)) return;
    const point = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (gesture && gesture.kind !== 'pinch' && gesture.moved < 5 && performance.now() - gesture.time < 600 && event.type === 'pointerup' && point.button === 0) {
      listeners.tap(point, gesture.type);
    }
    if (pointers.size === 1) {
      const rest = [...pointers.values()][0];
      gesture = { kind: 'orbit', startX: rest.x, startY: rest.y, moved: 99, time: 0 };
    } else if (pointers.size === 0) gesture = null;
  }

  function onWheel(event) {
    if (!enabled) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 32 : 1;
    const amount = clamp(event.deltaY * unit, -240, 240);
    goal.zoom = clamp(goal.zoom * Math.exp(amount * 0.0012), 0.12, 1.9);
    touch();
  }

  const life = new AbortController();
  const options = { signal: life.signal };
  element.addEventListener('pointerdown', onDown, options);
  element.addEventListener('pointermove', onMove, options);
  element.addEventListener('pointerup', onUp, options);
  element.addEventListener('pointercancel', onUp, options);
  element.addEventListener('pointerleave', () => listeners.hover(null), options);
  element.addEventListener('wheel', onWheel, { signal: life.signal, passive: false });
  element.addEventListener('contextmenu', (event) => event.preventDefault(), options);

  function distanceNow() {
    const all = fitDistance(frame.radius) * now.zoom;
    const near = fitDistance(focus.shownRadius) * now.zoom;
    return lerp(all, near, EASE.inOut(focus.weight));
  }

  /** Advance the rig. Returns true while the camera is still moving. */
  function update(delta, { idleTurn = true } = {}) {
    clock += delta;
    const before = position.clone();
    if (intro.active) {
      intro.time += delta;
      const t = clamp(intro.time / intro.duration);
      const k = EASE.inOut(t);
      now.az = lerp(intro.az, goal.az, k);
      now.pol = lerp(intro.pol, goal.pol, k);
      now.zoom = lerp(intro.zoom, goal.zoom, EASE.inOut(clamp(t * 1.08)));
      if (t >= 1) intro.active = false;
    } else {
      // Left alone, the piece turns slowly. The turn eases in so taking your hand away is not abrupt.
      const idle = clock - lastInput;
      const wantTurn = idleTurn && !reducedMotion && idle > 3.2 && pointers.size === 0;
      drift = lerp(drift, wantTurn ? 1 : 0, 1 - Math.exp(-delta * (wantTurn ? 0.5 : 6)));
      goal.az += drift * delta * (focus.active ? 0.035 : 0.055);
      const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 7.5);
      now.az += (goal.az - now.az) * k;
      now.pol += (goal.pol - now.pol) * k;
      now.zoom += (goal.zoom - now.zoom) * k;
    }
    const slow = reducedMotion ? 1 : 1 - Math.exp(-delta * 4.2);
    now.pan.lerp(goal.pan, reducedMotion ? 1 : 1 - Math.exp(-delta * 7.5));
    focus.weight += ((focus.active ? 1 : 0) - focus.weight) * slow;
    if (focus.weight < 1e-4 && !focus.active) focus.weight = 0;
    if (focus.active) {
      // Moving between two focused parts glides rather than cutting.
      if (focus.weight < 0.02) { focus.shown.copy(focus.centre); focus.shownRadius = focus.radius; }
      focus.shown.lerp(focus.centre, slow);
      focus.shownRadius += (focus.radius - focus.shownRadius) * slow;
    }
    shift.nowX += (shift.x - shift.nowX) * slow;
    shift.nowY += (shift.y - shift.nowY) * slow;

    const w = EASE.inOut(focus.weight);
    target.copy(frame.centre).lerp(focus.shown, w).add(now.pan);
    const distance = distanceNow();
    const sp = Math.sin(now.pol);
    position.set(Math.cos(now.az) * sp, Math.cos(now.pol), Math.sin(now.az) * sp).multiplyScalar(distance).add(target);
    camera.position.copy(position);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.near = Math.max(0.05, distance * 0.02);
    camera.far = distance + 140;
    if (Math.abs(shift.nowX) > 0.5 || Math.abs(shift.nowY) > 0.5) camera.setViewOffset(size.w, size.h, -shift.nowX, -shift.nowY, size.w, size.h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    return before.distanceToSquared(position) > 1e-7;
  }

  return {
    goal, now, focus, home,
    setViewport, setFrame, setShift, startIntro, snap, reset, focusOn, clearFocus, update, touch,
    on(name, fn) { listeners[name] = fn; },
    get introActive() { return intro.active; },
    get azimuth() { return now.az; },
    get portrait() { return portrait; },
    set enabled(value) { enabled = value; },
    dispose() { life.abort(); },
  };
}
