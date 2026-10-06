/**
 * Four persistent paper surfaces, composed directly in CSS 3D.
 *
 * Scroll is the sole source of the composition and hinge angles. No tweens,
 * scroll listeners, layout reads, or private animation loop are created here.
 * `time` is in seconds; pointer x/y (or nx/ny) are normalized to -1 … 1.
 */

const SHEET_WIDTH = 1000;
const SHEET_HEIGHT = 750;
const DEG = Math.PI / 180;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const mix = (a, b, amount) => a + (b - a) * amount;
const smooth = (start, end, value) => {
  const x = clamp((value - start) / (end - start));
  return x * x * (3 - 2 * x);
};
const fmt = value => finite(value).toFixed(3);
const cssUrl = value => `url(${JSON.stringify(String(value))})`;

const WINDOWS = Object.freeze({
  paper: { enter: 1.72, built: 2.20, release: 2.72, exit: 3.06 },
  space: { enter: 4.72, built: 5.20, release: 5.72, exit: 6.08 },
  final: { enter: 6.80, built: 7.20, release: Infinity, exit: Infinity },
});

function phaseWindow(phase, window) {
  const enter = smooth(window.enter, window.built, phase);
  const exit = Number.isFinite(window.exit)
    ? smooth(window.release, window.exit, phase)
    : 0;
  return { enter, exit, opacity: enter * (1 - exit) };
}

/**
 * @param {HTMLElement} container An absolute, full-viewport decorative host.
 * @param {{paperUrl:string, washUrl:string, bloomUrl:string}} assets Local URLs.
 */
export class PaperTheatre {
  constructor(container, assets = {}) {
    if (!container || typeof container.append !== 'function') {
      throw new TypeError('PaperTheatre requires a container element.');
    }

    this.container = container;
    this.width = 1;
    this.height = 1;
    this.visible = false;
    this.destroyed = false;
    this.mode = '';
    this.clock = 0;
    this.lastTime = null;

    this.root = document.createElement('div');
    this.root.className = 'ink-paper-theatre';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.style.setProperty('--pt-paper', cssUrl(assets.paperUrl || './art/paper-sheet.webp'));
    this.root.style.setProperty('--pt-wash', cssUrl(assets.washUrl || './art/ink-wash.webp'));
    this.root.style.setProperty('--pt-bloom', cssUrl(assets.bloomUrl || './art/ink-bloom.webp'));

    this.world = document.createElement('div');
    this.world.className = 'ink-paper-theatre__world';
    this.root.append(this.world);

    this.ground = document.createElement('div');
    this.ground.className = 'ink-paper-theatre__ground';
    this.world.append(this.ground);

    this.planes = Array.from({ length: 4 }, (_, index) => {
      const plane = document.createElement('div');
      plane.className = `ink-paper-theatre__plane ink-paper-theatre__plane--${index}`;

      const caster = document.createElement('div');
      caster.className = 'ink-paper-theatre__caster';

      const sheet = document.createElement('div');
      sheet.className = 'ink-paper-theatre__sheet';

      const ink = document.createElement('div');
      ink.className = `ink-paper-theatre__ink ink-paper-theatre__ink--${index === 1 ? 'bloom' : 'wash'}`;

      const light = document.createElement('div');
      light.className = 'ink-paper-theatre__light';

      const crease = document.createElement('div');
      crease.className = 'ink-paper-theatre__crease';

      sheet.append(ink, light, crease);
      caster.append(sheet);
      plane.append(caster);
      this.world.append(plane);
      return { plane, ink, light, crease, style: {} };
    });

    container.append(this.root);
  }

  /**
   * All geometry comes from the supplied phase. The small idle clock only
   * breathes the already established composition and cannot move a hinge
   * across a scroll phase. Hidden-tab deltas are capped at 50 ms.
   */
  render({ scene = 0, local = 0, time = 0, pointer = null, reducedMotion = false, width, height } = {}) {
    if (this.destroyed) return;

    const w = Math.max(1, finite(width, this.width));
    const h = Math.max(1, finite(height, this.height));
    if (w !== this.width || h !== this.height) {
      this.width = w;
      this.height = h;
      this.world.style.setProperty('--pt-perspective', `${fmt(Math.max(w * 1.25, h * 1.5))}px`);
    }

    const seconds = finite(time);
    if (this.lastTime !== null && !reducedMotion && this.visible) {
      this.clock = (this.clock + clamp(seconds - this.lastTime, 0, 0.05)) % 3600;
    }
    this.lastTime = seconds;

    const phase = clamp(finite(scene) + finite(local), 0, 8);
    const paper = phaseWindow(phase, WINDOWS.paper);
    const space = phaseWindow(phase, WINDOWS.space);
    const final = phaseWindow(phase, WINDOWS.final);

    let mode;
    let window;
    if (paper.opacity > 0.0001) {
      mode = 'paper';
      window = paper;
    } else if (space.opacity > 0.0001) {
      mode = 'space';
      window = space;
    } else if (final.opacity > 0.0001) {
      mode = 'final';
      window = final;
    } else {
      if (this.visible) {
        this.root.style.opacity = '0';
        this.root.style.visibility = 'hidden';
      }
      this.visible = false;
      return;
    }

    if (mode !== this.mode) {
      this.mode = mode;
      this.root.dataset.mode = mode;
    }
    if (!this.visible) this.root.style.visibility = 'visible';
    this.visible = true;
    this.root.style.opacity = fmt(window.opacity);

    const mobile = w < 700;
    const motion = reducedMotion ? 0 : 1;
    const px = motion * clamp(finite(pointer?.nx, finite(pointer?.x)), -1, 1);
    const py = motion * clamp(finite(pointer?.ny, finite(pointer?.y)), -1, 1);
    const breath = motion * Math.sin(this.clock * 0.27);
    const drift = motion * Math.sin(this.clock * 0.19 + 1.7);
    const state = { w, h, mobile, motion, px, py, breath, drift, phase, window };

    if (mode === 'paper') this._renderPaper(state);
    else if (mode === 'space') this._renderSpace(state);
    else this._renderFinal(state);
  }

  _renderPaper({ w, h, mobile, motion, px, py, breath, drift, phase, window }) {
    const width = w * (mobile ? 1.19 : 0.655);
    const height = width * 0.75;
    const cx = w * (mobile ? 0.435 : 0.25);
    const cy = h * (mobile ? 0.655 : 0.465);
    const opening = motion ? 1 - window.enter : 0;
    const release = motion ? window.exit : 0;
    const hold = smooth(2.20, 2.72, phase);
    const travel = Math.min(w, h) * 0.0035;

    const composition = [
      { x: 0.036, y: 0.066, z: -34, rx: 10, ry: 5, rz: 9, scale: 1.00, ink: 0.08, shade: 0.52 },
      { x: -0.023, y: 0.010, z: 0, rx: 10, ry: -3, rz: -7, scale: 0.986, ink: 0.11, shade: 0.31 },
      { x: 0.006, y: -0.035, z: 31, rx: 10, ry: -5, rz: 2, scale: 0.964, ink: 0.74, shade: 0.17 },
    ];

    for (let i = 0; i < 3; i += 1) {
      const pose = composition[i];
      const layer = i - 1;
      const entryX = opening * width * (0.08 + i * 0.04);
      const entryY = opening * height * (0.12 - i * 0.075);
      const exitX = -release * width * (0.05 + i * 0.024);
      const exitY = release * height * 0.06;
      const breatheX = drift * travel * layer + px * travel * (i + 1) * 0.65;
      const breatheY = breath * travel * (0.8 + i * 0.28) + py * travel * layer;
      const turn = pose.rz + layer * opening * 12 + release * (i - 2) * 3.2 + breath * 0.15;
      const scale = pose.scale * (1 + hold * 0.009 + release * 0.025);
      const transform = [
        `translate3d(${fmt(cx + width * pose.x + entryX + exitX + breatheX)}px,${fmt(cy + height * pose.y + entryY + exitY + breatheY)}px,${fmt(pose.z * width / 1000)}px)`,
        `rotateX(${fmt(pose.rx + py * 0.55)}deg)`,
        `rotateY(${fmt(pose.ry + px * 0.7)}deg)`,
        `rotateZ(${fmt(turn)}deg)`,
        `scale3d(${fmt(width / SHEET_WIDTH * scale)},${fmt(height / SHEET_HEIGHT * scale)},1)`,
        'translate(-50%,-50%)',
      ].join(' ');
      this._apply(i, transform, 1, pose.ink, pose.shade, 0);
    }

    this._apply(3, 'translate3d(-2000px,-2000px,0)', 0, 0, 0, 0);
    this.ground.style.opacity = '0';
  }

  _renderSpace({ w, h, mobile, motion, px, py, breath, drift, phase, window }) {
    const unit = mobile ? Math.min(w * 0.84, h * 0.48) : Math.min(w * 0.54, h * 0.74);
    const cx = w * (mobile ? 0.50 : 0.755);
    const cy = h * (mobile ? 0.66 : 0.505);
    const folded = motion ? 1 - window.enter : 0;
    const release = motion ? window.exit : 0;
    const hold = smooth(5.20, 5.72, phase);
    const depth = unit * (mobile ? 0.80 : 0.90);

    // A continuous four-face strip: every face starts at the previous
    // face's endpoint, and every hinge shares the same depth direction.
    // The opening is a real gap between the sloped faces, never a mask.
    const lengths = [0.78, 0.30, 0.84, 0.38];
    const resting = [-68, -12, 70, 16];
    const foldedAngles = [-8, -167, -7, -164];
    const ink = [0.46, 0.025, 0.17, 0.28];
    const shade = [0.83, 0.16, 0.44, 0.68];
    let x = -0.39 * unit;
    let y = 0.35 * unit;

    const camera = [
      `translate3d(${fmt(cx + folded * unit * 0.18 + release * unit * 0.15 + px * 2.1)}px,${fmt(cy + folded * unit * 0.18 + release * unit * 0.12 + breath * 1.5)}px,0)`,
      `rotateX(${fmt(-17 + py * 0.75)}deg)`,
      `rotateY(${fmt(-35 + px * 0.9 + hold * 1.25)}deg)`,
      `rotateZ(${fmt(2.5 + drift * 0.12)}deg)`,
    ].join(' ');

    for (let i = 0; i < 4; i += 1) {
      const angle = mix(resting[i], foldedAngles[i], folded)
        + release * (i % 2 ? 12 : -8)
        + (i === 1 ? breath * 0.16 : 0);
      const length = lengths[i] * unit;
      const transform = [
        camera,
        `translate3d(${fmt(x)}px,${fmt(y)}px,${fmt(-depth * 0.46)}px)`,
        `rotateZ(${fmt(angle)}deg)`,
        'rotateX(90deg)',
        `scale3d(${fmt(length / SHEET_WIDTH)},${fmt(depth / SHEET_HEIGHT)},1)`,
      ].join(' ');
      this._apply(i, transform, 1, ink[i], shade[i], i > 0 ? 0.38 : 0);
      x += Math.cos(angle * DEG) * length;
      y += Math.sin(angle * DEG) * length;
    }

    this.ground.style.opacity = fmt(0.13 * (1 - folded * 0.4));
    this.ground.style.transform = [
      `translate3d(${fmt(cx + unit * 0.04 + drift * 1.2)}px,${fmt(cy + unit * 0.35 + breath * 0.9)}px,-90px)`,
      'rotateX(67deg) rotateZ(4deg)',
      `scale3d(${fmt(unit * 0.96 / SHEET_WIDTH)},${fmt(unit * 0.32 / SHEET_HEIGHT)},1)`,
      'translate(-50%,-50%)',
    ].join(' ');
  }

  _renderFinal({ w, h, mobile, motion, px, py, breath, drift, window }) {
    const width = w * (mobile ? 0.64 : 0.365);
    const height = width * 0.75;
    const cx = w * (mobile ? 0.985 : 0.945);
    const cy = h * (mobile ? 0.115 : 0.095);
    const opening = motion ? 1 - window.enter : 0;
    const poses = [
      { i: 0, dx: -0.026, dy: 0.115, rx: 14, ry: -8, rz: 15, z: -24, shade: 0.43 },
      { i: 2, dx: 0.032, dy: -0.040, rx: 7, ry: 7, rz: -9, z: 19, shade: 0.13 },
    ];

    for (const pose of poses) {
      const direction = pose.i === 0 ? -1 : 1;
      const transform = [
        `translate3d(${fmt(cx + width * pose.dx + opening * width * 0.16 + direction * drift * 1.4 + px * 0.7)}px,${fmt(cy + height * pose.dy - opening * height * 0.12 + direction * breath * 1.2 + py * 0.6)}px,${fmt(pose.z * width / 650)}px)`,
        `rotateX(${fmt(pose.rx + py * 0.2)}deg)`,
        `rotateY(${fmt(pose.ry + direction * breath * 0.25)}deg)`,
        `rotateZ(${fmt(pose.rz + direction * drift * 0.17 + opening * 7)}deg)`,
        `scale3d(${fmt(width / SHEET_WIDTH)},${fmt(height / SHEET_HEIGHT)},1)`,
        'translate(-50%,-50%)',
      ].join(' ');
      this._apply(pose.i, transform, 1, 0, pose.shade, 0);
    }

    this._apply(1, 'translate3d(-2000px,-2000px,0)', 0, 0, 0, 0);
    this._apply(3, 'translate3d(-2000px,-2000px,0)', 0, 0, 0, 0);
    this.ground.style.opacity = '0';
  }

  _apply(index, transform, opacity, ink, shade, crease) {
    const item = this.planes[index];
    const next = {
      transform,
      opacity: fmt(opacity),
      ink: fmt(ink),
      shade: fmt(shade),
      crease: fmt(crease),
    };
    if (next.transform !== item.style.transform) item.plane.style.transform = next.transform;
    if (next.opacity !== item.style.opacity) item.plane.style.opacity = next.opacity;
    if (next.ink !== item.style.ink) item.ink.style.opacity = next.ink;
    if (next.shade !== item.style.shade) item.light.style.opacity = next.shade;
    if (next.crease !== item.style.crease) item.crease.style.opacity = next.crease;
    item.style = next;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.visible = false;
    this.root.remove();
    this.planes.length = 0;
    this.container = null;
  }
}
