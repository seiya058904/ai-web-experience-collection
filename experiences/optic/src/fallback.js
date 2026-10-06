import { shutterState } from "./sensor-mechanisms.js";

/*
 * OPTIC's deliberately authored Canvas2D optical study. This is the graceful
 * alternative to the WebGL film, with the same story, controls and one clock.
 * No listeners, RAF, DOM overlays, network requests or external drawing assets.
 */
const TAU = Math.PI * 2;
const clamp = (v, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const COLORS = {
  background: "#090b0d",
  graphite: "#202629",
  metal: "#6c7576",
  edge: "#adb4ad",
  sage: "#8eaaa0",
  light: "#d7c49d",
  copper: "#907449",
  red: "#88594f",
  green: "#526f5d",
  blue: "#48677c",
};

export function createFallback(canvas, photoImage) {
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx)
    throw new Error(
      "OPTIC fallback requires a fresh canvas with a 2D context.",
    );
  let width = 1;
  let height = 1;
  let dpr = 1;
  let mobile = false;
  let unit = 1;
  let clock = 0;
  let disposed = false;
  let currentScale = 1;

  function rounded(x, y, w, h, r = 0.015) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function line(points, color = COLORS.metal, pixels = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = pixels / currentScale;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i][0], points[i][1]);
      else ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    ctx.restore();
  }
  function circle(x, y, r, fill, stroke = null, pixels = 1) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.00001, r), 0, TAU);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = pixels / currentScale;
      ctx.stroke();
    }
  }
  function plate(x, y, w, h, fill, stroke = null, radius = 0.018, pixels = 1) {
    rounded(x, y, w, h, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = pixels / currentScale;
      ctx.stroke();
    }
  }
  function gradient(x0, y0, x1, y1, stops) {
    const value = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [position, color] of stops) value.addColorStop(position, color);
    return value;
  }
  function technical(text, x, y, align = "center", opacity = 0.65) {
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.font = `${10.5 / currentScale}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    ctx.fillStyle = "#b2b5ac";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function screw(x, y, r = 0.009) {
    circle(x, y, r, "#23292c", "#6e7879", 0.7);
    line(
      [
        [x - r * 0.48, y + r * 0.22],
        [x + r * 0.48, y - r * 0.22],
      ],
      "#7c8382",
      0.7,
      0.8,
    );
  }
  function polygon(radius, count, phase = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = phase + (i * TAU) / count;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  function axis(from = -0.65, to = 0.65, y = 0) {
    ctx.save();
    ctx.setLineDash([3 / currentScale, 8 / currentScale]);
    line(
      [
        [from, y],
        [to, y],
      ],
      "#687574",
      0.75,
      0.35,
    );
    ctx.restore();
  }
  function ray(points, intensity = 1, seed = 0) {
    line(points, COLORS.light, 1.15, intensity * 0.74);
    const lengths = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const length = Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      );
      lengths.push(length);
      total += length;
    }
    let distance = ((((clock * 0.16 + seed) % 1) + 1) % 1) * total;
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1) {
        const t = lengths[i] > 0 ? distance / lengths[i] : 0;
        ctx.save();
        ctx.globalAlpha *= intensity;
        circle(
          mix(points[i][0], points[i + 1][0], t),
          mix(points[i][1], points[i + 1][1], t),
          1.7 / currentScale,
          "#f0dfbb",
        );
        ctx.restore();
        break;
      }
      distance -= lengths[i];
    }
  }
  function cropPhoto(x, y, w, h, opacity = 1, filter = "none") {
    const imageWidth = photoImage?.naturalWidth || photoImage?.videoWidth || 0;
    const imageHeight =
      photoImage?.naturalHeight || photoImage?.videoHeight || 0;
    if (!imageWidth || !imageHeight) {
      ctx.fillStyle = gradient(x, y, x + w, y + h, [
        [0, "#252a2b"],
        [0.48, "#53574c"],
        [0.5, "#303b38"],
        [1, "#171e21"],
      ]);
      ctx.fillRect(x, y, w, h);
      return;
    }
    const sourceRatio = imageWidth / imageHeight;
    const targetRatio = w / h;
    const sw =
      sourceRatio > targetRatio ? imageHeight * targetRatio : imageWidth;
    const sh =
      sourceRatio > targetRatio ? imageHeight : imageWidth / targetRatio;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.filter = filter;
    ctx.drawImage(
      photoImage,
      (imageWidth - sw) / 2,
      (imageHeight - sh) / 2,
      sw,
      sh,
      x,
      y,
      w,
      h,
    );
    ctx.restore();
  }

  function lensRing(x, y, radius, depth = 0.055, glass = true) {
    for (let i = 5; i >= 0; i--) {
      const z = i / 5;
      const edge = gradient(x - radius, y - radius, x + radius, y + radius, [
        [0, "#6d7471"],
        [0.15, "#272e31"],
        [0.4, "#101517"],
        [0.72, "#343b3e"],
        [1, "#7f8580"],
      ]);
      circle(
        x - depth * z,
        y - depth * z * 0.35,
        radius,
        edge,
        i === 0 ? "#858d86" : "#252c2d",
        i === 0 ? 1 : 0.7,
      );
    }
    circle(x, y, radius * 0.925, "#0c1012", "#4c5655", 1);
    circle(x, y, radius * 0.84, "#1b2225", "#3d4748", 0.7);
    for (let i = 0; i < 48; i++) {
      const a = (i * TAU) / 48;
      line(
        [
          [x + Math.cos(a) * radius * 0.932, y + Math.sin(a) * radius * 0.932],
          [x + Math.cos(a) * radius * 0.979, y + Math.sin(a) * radius * 0.979],
        ],
        "#9a9f95",
        0.65,
        0.26,
      );
    }
    if (!glass) return;
    const coating = ctx.createRadialGradient(
      x - radius * 0.31,
      y - radius * 0.4,
      radius * 0.03,
      x,
      y,
      radius * 0.84,
    );
    coating.addColorStop(0, "#6b8282");
    coating.addColorStop(0.23, "#293a41");
    coating.addColorStop(0.42, "#292934");
    coating.addColorStop(0.66, "#101b21");
    coating.addColorStop(1, "#030607");
    circle(x, y, radius * 0.79, coating, "#617472", 0.75);
    ctx.save();
    ctx.globalAlpha *= 0.46;
    ctx.strokeStyle = "#c4d4c3";
    ctx.lineWidth = 1.15 / currentScale;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.73, 3.65 + Math.sin(clock * 0.15) * 0.045, 4.8);
    ctx.stroke();
    ctx.globalAlpha *= 0.3;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.57, 0.28, 1.8);
    ctx.stroke();
    ctx.restore();
    circle(x, y, radius * 0.24, "#030606", "#243131", 0.6);
  }

  function camera(local) {
    const breathe = Math.sin(clock * 0.18) * 0.003;
    ctx.translate(0, breathe);
    const bodyGradient = gradient(-0.45, -0.34, 0.45, 0.34, [
      [0, "#555c5c"],
      [0.09, "#272e30"],
      [0.36, "#111719"],
      [0.73, "#1b2326"],
      [1, "#434c4d"],
    ]);
    ctx.beginPath();
    ctx.moveTo(-0.44, -0.22);
    ctx.lineTo(-0.21, -0.23);
    ctx.lineTo(-0.16, -0.32);
    ctx.lineTo(0.035, -0.32);
    ctx.lineTo(0.095, -0.23);
    ctx.lineTo(0.35, -0.23);
    ctx.quadraticCurveTo(0.46, -0.22, 0.47, -0.13);
    ctx.lineTo(0.47, 0.225);
    ctx.quadraticCurveTo(0.465, 0.28, 0.4, 0.28);
    ctx.lineTo(-0.435, 0.28);
    ctx.quadraticCurveTo(-0.48, 0.275, -0.48, 0.23);
    ctx.lineTo(-0.48, -0.18);
    ctx.quadraticCurveTo(-0.48, -0.215, -0.44, -0.22);
    ctx.closePath();
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.strokeStyle = "#6d7977";
    ctx.lineWidth = 1.05 / currentScale;
    ctx.stroke();
    plate(
      0.283,
      -0.175,
      0.16,
      0.413,
      gradient(0.27, 0, 0.445, 0, [
        [0, "#12191c"],
        [0.7, "#242d30"],
        [1, "#384246"],
      ]),
      "#353e40",
      0.052,
      0.7,
    );
    for (let i = 0; i < 29; i++) {
      const y = -0.128 + i * 0.0105;
      line(
        [
          [0.331, y],
          [0.417, y - 0.006],
        ],
        "#758080",
        0.5,
        0.12,
      );
    }
    plate(-0.145, -0.304, 0.175, 0.044, "#11181b", "#66706d", 0.011, 0.7);
    for (const x of [-0.348, 0.273]) {
      ctx.beginPath();
      ctx.ellipse(x, -0.245, 0.055, 0.017, 0, 0, TAU);
      ctx.fillStyle = "#343e41";
      ctx.fill();
      ctx.strokeStyle = "#78847f";
      ctx.lineWidth = 0.8 / currentScale;
      ctx.stroke();
      for (let i = -4; i <= 4; i++)
        line(
          [
            [x + i * 0.01, -0.259],
            [x + i * 0.01, -0.24],
          ],
          "#8d9691",
          0.65,
          0.45,
        );
    }
    circle(0.374, -0.195, 0.025, "#606b6b", "#a7aaa1", 0.7);
    screw(-0.437, 0.243, 0.007);
    screw(0.434, 0.239, 0.007);
    lensRing(-0.045, 0.03, 0.274, 0.048);
    line(
      [
        [-0.184, -0.202],
        [-0.142, -0.202],
      ],
      "#ded6bd",
      1.2,
      0.9,
    );
    const subjectX = mobile ? -0.6 : -0.68;
    ray(
      [
        [subjectX, -0.23],
        [-0.287, -0.09],
        [-0.045, 0.03],
      ],
      0.43 + local * 0.23,
      0.19,
    );
    technical("36 × 24 mm", 0.268, 0.33, "center", 0.48);
  }

  function curvedElement(x, halfH, thickness, front, back, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    ctx.moveTo(x - thickness / 2, -halfH);
    ctx.bezierCurveTo(
      x - thickness / 2 - front,
      -halfH * 0.5,
      x - thickness / 2 - front,
      halfH * 0.5,
      x - thickness / 2,
      halfH,
    );
    ctx.lineTo(x + thickness / 2, halfH);
    ctx.bezierCurveTo(
      x + thickness / 2 + back,
      halfH * 0.5,
      x + thickness / 2 + back,
      -halfH * 0.5,
      x + thickness / 2,
      -halfH,
    );
    ctx.closePath();
    ctx.fillStyle = gradient(x - 0.035, -halfH, x + 0.035, halfH, [
      [0, "rgba(157,187,174,0.40)"],
      [0.27, "rgba(63,85,88,0.14)"],
      [0.58, "rgba(85,74,107,0.18)"],
      [1, "rgba(146,175,172,0.36)"],
    ]);
    ctx.fill();
    ctx.strokeStyle = "#9cafaa";
    ctx.lineWidth = 0.85 / currentScale;
    ctx.stroke();
    line(
      [
        [x - thickness / 2, -halfH],
        [x + thickness / 2, -halfH],
      ],
      "#d8dcd2",
      1,
      0.65,
    );
    line(
      [
        [x - thickness / 2, halfH],
        [x + thickness / 2, halfH],
      ],
      "#7e928d",
      0.7,
      0.6,
    );
    ctx.restore();
  }

  function optics(local) {
    ctx.save();
    if (mobile) {
      ctx.scale(0.86, 0.86);
      ctx.rotate(Math.PI / 2);
    }
    const separation = mix(0.66, 1, smooth(0.08, 0.38, local));
    const xs = [-0.43, -0.33, -0.22, -0.09, 0.025, 0.12, 0.225, 0.33].map(
      (x) => x * separation,
    );
    const heights = [0.215, 0.195, 0.181, 0.168, 0.156, 0.153, 0.15, 0.135];
    const powers = [0.82, -0.45, 0.9, 0.5, -0.35, 0.82, 0.63, 1.25];
    axis(-0.65, 0.65);
    line(
      [
        [xs[0] - 0.032, -0.263],
        [xs.at(-1) + 0.031, -0.263],
      ],
      "#778884",
      0.7,
      0.28,
    );
    for (let i = 0; i < xs.length; i++) {
      line(
        [
          [xs[i], -heights[i] - 0.015],
          [xs[i], -0.265],
        ],
        "#879793",
        0.6,
        0.36,
      );
      curvedElement(
        xs[i],
        heights[i],
        i === 0 ? 0.027 : 0.018,
        powers[i] < 0 ? -0.016 : 0.034,
        powers[i] < 0 ? -0.01 : 0.025,
      );
      plate(
        xs[i] - 0.02,
        heights[i] + 0.009,
        0.04,
        0.009,
        "#333e40",
        "#737f7d",
        0.001,
        0.6,
      );
    }
    for (const incoming of [-0.145, -0.073, 0, 0.073, 0.145]) {
      const points = [[-0.66, incoming]];
      let y = incoming,
        slope = 0,
        lastX = -0.66;
      for (let i = 0; i < xs.length; i++) {
        y += slope * (xs[i] - lastX);
        points.push([xs[i], y]);
        slope -= powers[i] * 0.5313 * y;
        lastX = xs[i];
      }
      points.push([0.62, y + slope * (0.62 - lastX)]);
      ray(points, incoming === 0 ? 0.3 : 0.76, incoming + 0.53);
    }
    line(
      [
        [0.62, -0.17],
        [0.62, 0.17],
      ],
      "#879c96",
      1.25,
      0.66,
    );
    if (!mobile) {
      technical("OPTICAL AXIS", -0.43, 0.31, "left", 0.42);
      technical("IMAGE PLANE", 0.62, 0.235, "center", 0.52);
    }
    ctx.restore();
  }

  function focus(local, controls) {
    const amount = clamp(controls.focus ?? 0.5);
    const lensX = mix(0.035, -0.025, amount);
    const focusX = mix(0.205, 0.355, amount);
    const sensorX = 0.355;
    axis(-0.58, 0.52);
    // A thin-lens construction: parallel rays refract toward the adjustable
    // focal point; the fixed image plane shows their changing circle of blur.
    curvedElement(lensX, 0.245, 0.018, 0.032, 0.032, 0.95);
    for (const h of [-0.185, -0.0925, 0.0925, 0.185]) {
      const slope = -h / (focusX - lensX);
      const endY = h + slope * (sensorX - lensX);
      ray(
        [
          [-0.57, h],
          [lensX, h],
          [focusX, 0],
          [sensorX, endY],
        ],
        0.77,
        h + 0.5,
      );
    }
    line(
      [
        [sensorX, -0.27],
        [sensorX, 0.27],
      ],
      "#97aba3",
      1.45,
      0.75,
    );
    const blur = Math.abs(0.185 * (1 - (sensorX - lensX) / (focusX - lensX)));
    if (blur > 0.004)
      line(
        [
          [sensorX, -Math.min(blur, 0.24)],
          [sensorX, Math.min(blur, 0.24)],
        ],
        "#d2bb88",
        3.3,
        0.54,
      );
    circle(focusX, 0, 0.0045, "#d6c69f");
    line(
      [
        [focusX, 0.03],
        [focusX, 0.303],
      ],
      "#8d9c93",
      0.7,
      0.31,
    );
    technical("FOCAL POINT", focusX, 0.33, "center", 0.59);
    technical("SENSOR", sensorX + 0.012, -0.3, "center", 0.57);
    // A physical travel rail belongs to the focusing group.
    line(
      [
        [-0.055, -0.28],
        [0.07, -0.28],
      ],
      "#798883",
      1,
      0.48,
    );
    plate(lensX - 0.016, -0.29, 0.032, 0.021, "#77877e", "#9ea99d", 0.003, 0.5);
  }

  function aperture(local, controls) {
    const f = clamp(controls.aperture ?? 2.8, 1.4, 16);
    const hole = (0.305 * 1.4) / f;
    const phase = 0.075 + Math.log(f / 1.4) * 0.033;
    const outer = gradient(-0.43, -0.48, 0.41, 0.45, [
      [0, "#adb2a5"],
      [0.08, "#434e50"],
      [0.28, "#151c20"],
      [0.7, "#252e31"],
      [0.95, "#646d69"],
      [1, "#292f30"],
    ]);
    circle(0, 0, 0.447, outer, "#89928a", 1);
    circle(0, 0, 0.422, "#111719", "#65706b", 0.85);
    circle(0, 0, 0.386, "#292f31", "#525f5e", 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 0.385, 0, TAU);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      const a = phase + (i * TAU) / 9;
      const b = a + TAU / 9;
      const innerR = hole / Math.cos(Math.PI / 9);
      const p0 = [Math.cos(a) * innerR, Math.sin(a) * innerR];
      const p1 = [Math.cos(b) * innerR, Math.sin(b) * innerR];
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.bezierCurveTo(
        Math.cos(b + 0.55) * 0.27,
        Math.sin(b + 0.55) * 0.27,
        Math.cos(b + 0.5) * 0.48,
        Math.sin(b + 0.5) * 0.48,
        Math.cos(b + 0.3) * 0.55,
        Math.sin(b + 0.3) * 0.55,
      );
      ctx.arc(0, 0, 0.55, b + 0.3, a + 0.1, true);
      ctx.bezierCurveTo(
        Math.cos(a + 0.02) * 0.4,
        Math.sin(a + 0.02) * 0.4,
        Math.cos(a + 0.17) * 0.23,
        Math.sin(a + 0.17) * 0.23,
        ...p0,
      );
      ctx.closePath();
      ctx.fillStyle = gradient(-0.2, -0.4, 0.3, 0.4, [
        [0, i % 2 ? "#515a5b" : "#485254"],
        [0.53, "#272f32"],
        [1, "#161e21"],
      ]);
      ctx.fill();
      ctx.strokeStyle = "#7c8987";
      ctx.lineWidth = 0.68 / currentScale;
      ctx.stroke();
    }
    ctx.restore();
    // A nine-sided opening always follows the chosen entrance-pupil diameter.
    polygon(hole / Math.cos(Math.PI / 9), 9, phase);
    ctx.fillStyle = "#050808";
    ctx.fill();
    ctx.strokeStyle = "#b2b8a8";
    ctx.lineWidth = 0.65 / currentScale;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const light = ctx.createRadialGradient(
      -hole * 0.3,
      -hole * 0.2,
      0,
      0,
      0,
      hole * 1.8,
    );
    light.addColorStop(0, "rgba(219,204,166,0.37)");
    light.addColorStop(0.48, "rgba(146,155,124,0.12)");
    light.addColorStop(1, "rgba(18,28,29,0)");
    ctx.fillStyle = light;
    ctx.fillRect(-hole * 1.8, -hole * 1.8, hole * 3.6, hole * 3.6);
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const a = (i * TAU) / 9 + 0.1;
      screw(Math.cos(a) * 0.403, Math.sin(a) * 0.403, 0.007);
    }
    for (let i = 0; i < 72; i++) {
      const a = (i * TAU) / 72;
      line(
        [
          [Math.cos(a) * 0.431, Math.sin(a) * 0.431],
          [Math.cos(a) * 0.438, Math.sin(a) * 0.438],
        ],
        "#c2c9b9",
        0.65,
        i % 6 === 0 ? 0.55 : 0.2,
      );
    }
    technical("9 BLADES", -0.35, 0.475, "left", 0.46);
    technical(
      `f/${f < 4 ? f.toFixed(1) : f.toFixed(0)}`,
      0.35,
      0.475,
      "right",
      0.66,
    );
  }

  function shutter(local, controls) {
    const denominator = Math.max(1, controls.shutter || 125);
    const state = shutterState(
      clamp(controls.shutterPhase ?? local),
      1 / denominator,
    );
    const w = 0.74,
      h = 0.5,
      left = -w / 2,
      top = -h / 2;
    plate(
      -0.485,
      -0.367,
      0.97,
      0.734,
      gradient(-0.45, -0.4, 0.43, 0.4, [
        [0, "#626c6a"],
        [0.08, "#293235"],
        [0.48, "#182125"],
        [1, "#414d50"],
      ]),
      "#6f7d78",
      0.035,
      0.9,
    );
    plate(
      left - 0.027,
      top - 0.028,
      w + 0.054,
      h + 0.056,
      "#080c0e",
      "#55625f",
      0.004,
      0.75,
    );
    ctx.save();
    rounded(left, top, w, h, 0.002);
    ctx.clip();
    ctx.fillStyle = gradient(left, top, -left, -top, [
      [0, "#394c4c"],
      [0.24, "#243640"],
      [0.62, "#302b3c"],
      [1, "#12272c"],
    ]);
    ctx.fillRect(left, top, w, h);
    for (let i = 0; i < 24; i++)
      line(
        [
          [left + (i * w) / 24, top],
          [left + (i * w) / 24, -top],
        ],
        "#7f9390",
        0.5,
        0.11,
      );
    const firstY = top + h * state.firstTravel;
    const secondY = top + h * state.secondTravel;
    ctx.fillStyle = "#202629";
    ctx.fillRect(left, firstY, w, Math.max(0, -top - firstY));
    ctx.fillStyle = "#151b1e";
    ctx.fillRect(left, top, w, Math.max(0, secondY - top));
    for (let i = 0; i < 6; i++) {
      const firstSeam = firstY + (i * h) / 6;
      if (firstSeam >= firstY && firstSeam <= -top)
        line(
          [
            [left, firstSeam],
            [-left, firstSeam],
          ],
          "#6b7675",
          0.8,
          0.75,
        );
      const secondSeam = secondY - (i * h) / 6;
      if (secondSeam <= secondY && secondSeam >= top)
        line(
          [
            [left, secondSeam],
            [-left, secondSeam],
          ],
          "#556460",
          0.8,
          0.7,
        );
    }
    line(
      [
        [left, firstY],
        [-left, firstY],
      ],
      "#b8bca9",
      1.1,
      0.9,
    );
    line(
      [
        [left, secondY],
        [-left, secondY],
      ],
      "#a5b0a6",
      1.05,
      0.8,
    );
    if (state.openFraction > 0) {
      const slit = gradient(0, secondY, 0, firstY, [
        [0, "rgba(224,209,168,0.18)"],
        [0.5, "rgba(207,194,156,0.035)"],
        [1, "rgba(224,209,168,0.18)"],
      ]);
      ctx.fillStyle = slit;
      ctx.fillRect(left, secondY, w, firstY - secondY);
    }
    ctx.restore();
    for (const side of [-1, 1]) {
      plate(
        side * 0.41 - 0.007,
        -0.29,
        0.014,
        0.58,
        "#6b7775",
        "#929e95",
        0.004,
        0.5,
      );
      for (const y of [-0.327, 0.327]) screw(side * 0.444, y, 0.009);
    }
    for (const y of [-0.306, 0.306])
      plate(-0.385, y - 0.024, 0.77, 0.048, "#11181b", "#65706a", 0.006, 0.7);
    technical("VERTICAL-TRAVEL CURTAINS", 0, 0.412, "center", 0.49);
  }

  function sensor(local) {
    const spread = smooth(0.13, 0.69, local);
    const cols = mobile ? 18 : 24,
      rows = mobile ? 12 : 16;
    const pitch = 0.82 / cols;
    const w = cols * pitch,
      h = rows * pitch;
    const rearX = -0.031 * spread,
      rearY = 0.068 * spread;
    const filterX = 0.075 * spread,
      filterY = -0.05 * spread;
    const lensX = 0.114 * spread,
      lensY = -0.131 * spread;
    ctx.translate(-0.035, 0.035);
    plate(
      -0.477 + rearX,
      -0.329 + rearY,
      0.954,
      0.658,
      gradient(-0.45, -0.3, 0.45, 0.3, [
        [0, "#606b67"],
        [0.04, "#2b3538"],
        [0.52, "#111a1d"],
        [1, "#434e4e"],
      ]),
      "#89958c",
      0.018,
      0.8,
    );
    for (let row = 0; row < rows; row++) {
      const y = -h / 2 + (row + 0.5) * pitch + rearY;
      line(
        [
          [-0.445 + rearX, y],
          [0.438 + rearX, y],
          [0.453 + rearX, y + 0.016],
          [0.453 + rearX, 0.313 + rearY],
        ],
        "#a88c51",
        0.65,
        0.38,
      );
    }
    const scanY = -h / 2 + ((clock * 0.13) % 1) * h + rearY;
    line(
      [
        [-0.446 + rearX, scanY],
        [0.45 + rearX, scanY],
      ],
      "#c8ac70",
      1,
      0.55,
    );
    // Photodiodes and copper contacts are distinct from the CFA layer.
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const x = -w / 2 + col * pitch,
          y = -h / 2 + row * pitch;
        ctx.fillStyle = "#796b4e";
        ctx.fillRect(
          x + pitch * 0.07,
          y + pitch * 0.07,
          pitch * 0.86,
          pitch * 0.86,
        );
        ctx.fillStyle = "#1a272c";
        ctx.fillRect(
          x + pitch * 0.16,
          y + pitch * 0.16,
          pitch * 0.68,
          pitch * 0.68,
        );
      }
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const x = -w / 2 + col * pitch + filterX,
          y = -h / 2 + row * pitch + filterY;
        const color =
          row % 2 === 0
            ? col % 2 === 0
              ? COLORS.red
              : COLORS.green
            : col % 2 === 0
              ? COLORS.green
              : COLORS.blue;
        ctx.fillStyle = "#111a1d";
        ctx.fillRect(
          x + pitch * 0.035,
          y + pitch * 0.13,
          pitch * 0.9,
          pitch * 0.91,
        );
        ctx.fillStyle = color;
        ctx.fillRect(
          x + pitch * 0.07,
          y + pitch * 0.07,
          pitch * 0.86,
          pitch * 0.82,
        );
        line(
          [
            [x + pitch * 0.11, y + pitch * 0.11],
            [x + pitch * 0.81, y + pitch * 0.11],
          ],
          "#c3c8ae",
          0.55,
          0.27,
        );
      }
    ctx.save();
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = "#bed0bc";
    ctx.lineWidth = 0.75 / currentScale;
    ctx.beginPath();
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const x = -w / 2 + (col + 0.5) * pitch + lensX,
          y = -h / 2 + (row + 0.5) * pitch + lensY;
        ctx.moveTo(x - pitch * 0.34, y);
        ctx.ellipse(x, y, pitch * 0.35, pitch * 0.31, -0.08, 3.18, 5.95);
      }
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 7; i++) {
      const col = (i * 7 + 3) % cols,
        row = (i * 5 + 3) % rows;
      const x = -w / 2 + (col + 0.5) * pitch,
        y = -h / 2 + (row + 0.5) * pitch;
      const p = (((clock * 0.21 + i * 0.139) % 1) + 1) % 1;
      if (p < 0.86) {
        const q = p / 0.86;
        const px = mix(x + lensX + 0.026, x, q),
          py = mix(y + lensY - 0.15, y, q);
        line(
          [
            [px, py],
            [px + 0.005, py - 0.021 * (1 - q)],
          ],
          "#ded5ac",
          1,
          0.68,
        );
      }
    }
    technical("RGGB / 2 × GREEN", -0.45, 0.4, "left", 0.52);
    technical("LIGHT → CHARGE", 0.47, 0.4, "right", 0.52);
  }

  function stability(local, controls) {
    const active = controls.stabilization !== false;
    const sx = Math.sin(clock * 2.31) * 0.014 + Math.sin(clock * 5.2) * 0.006;
    const sy = Math.cos(clock * 2.03) * 0.01 + Math.sin(clock * 4.31) * 0.004;
    const roll = Math.sin(clock * 1.71) * 0.009;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(roll);
    plate(
      -0.47,
      -0.343,
      0.94,
      0.686,
      gradient(-0.45, -0.34, 0.45, 0.34, [
        [0, "#7a847e"],
        [0.1, "#313d40"],
        [0.6, "#1a2629"],
        [1, "#576360"],
      ]),
      "#8c9990",
      0.039,
      0.9,
    );
    plate(-0.414, -0.286, 0.828, 0.572, "#080d10", "#536461", 0.019, 0.8);
    for (const x of [-0.441, 0.441])
      for (const y of [-0.31, 0.31]) screw(x, y, 0.008);
    for (let i = 0; i < 8; i++) {
      const q = -0.113 + i * 0.028;
      line(
        [
          [-0.452, q],
          [-0.419, q],
        ],
        "#b99b5e",
        1.3,
        0.53,
      );
      line(
        [
          [0.419, q],
          [0.452, q],
        ],
        "#b99b5e",
        1.3,
        0.53,
      );
    }
    ctx.restore();
    // The housing shakes. With compensation enabled the sensitive image plane
    // stays in a fixed screen-space pose; otherwise it follows the housing.
    ctx.save();
    if (!active) {
      ctx.translate(sx, sy);
      ctx.rotate(roll);
    }
    plate(-0.379, -0.257, 0.758, 0.514, "#83938e", "#bcc3ac", 0.01, 0.7);
    ctx.save();
    rounded(-0.36, -0.24, 0.72, 0.48, 0.004);
    ctx.clip();
    cropPhoto(-0.36, -0.24, 0.72, 0.48, 0.8, "saturate(0.48) brightness(0.78)");
    ctx.restore();
    // Four unobtrusive crop marks belong to the sensor, never to a fake HUD.
    for (const x of [-1, 1])
      for (const y of [-1, 1]) {
        line(
          [
            [x * 0.328, y * 0.187],
            [x * 0.328, y * 0.211],
            [x * 0.304, y * 0.211],
          ],
          "#d5dac4",
          0.85,
          0.55,
        );
      }
    ctx.restore();
    for (const y of [-0.22, 0.22]) {
      line(
        [
          [-0.42 + sx, y + sy],
          [-0.388, y],
        ],
        "#9cad9e",
        1.25,
        0.63,
      );
      line(
        [
          [0.388, y],
          [0.42 + sx, y + sy],
        ],
        "#9cad9e",
        1.25,
        0.63,
      );
    }
    technical(
      active ? "SENSOR-SHIFT / COMPENSATING" : "SENSOR-SHIFT / DISABLED",
      0,
      0.4,
      "center",
      0.55,
    );
  }

  function machine(local) {
    const explode = smooth(0.12, 0.4, local) * (1 - smooth(0.69, 0.94, local));
    if (explode < 0.08) {
      ctx.save();
      ctx.scale(0.91, 0.91);
      camera(local);
      ctx.restore();
      return;
    }
    ctx.save();
    if (mobile) ctx.scale(0.87, 0.87);
    const direction = mobile ? [0.105, -0.78] : [1.0, -0.25];
    const location = (index) => {
      const z = (index - 4.1) * 0.131 * explode;
      return [z * direction[0], z * direction[1]];
    };
    const start = location(-0.6),
      end = location(9.3);
    line([start, end], "#9ba99b", 0.8, 0.34);
    // Back-to-front painting follows the actual assembly stack.
    for (let i = 8; i >= 0; i--) {
      const [x, y] = location(i);
      ctx.save();
      ctx.translate(x, y);
      if (i < 2) {
        // Separate front and rear lens groups on the common optical axis.
        const radius = i === 0 ? 0.182 : 0.156;
        lensRing(0, 0, radius, 0.021, true);
      } else if (i === 2) {
        plate(
          -0.224,
          -0.181,
          0.448,
          0.362,
          "rgba(32,42,46,0.9)",
          "#899992",
          0.031,
          0.95,
        );
        circle(0, 0, 0.152, "#090f13", "#8c9993", 1.1);
        circle(0, 0, 0.135, "#111c20", "#506462", 0.7);
        for (const sx of [-0.196, 0.196])
          for (const sy of [-0.154, 0.154]) screw(sx, sy, 0.006);
      } else if (i === 3) {
        plate(
          -0.21,
          -0.162,
          0.42,
          0.324,
          "rgba(102,117,114,0.22)",
          "#abb3a4",
          0.019,
          1,
        );
        plate(
          -0.185,
          -0.136,
          0.37,
          0.272,
          "rgba(11,20,24,0.86)",
          "#727f7c",
          0.012,
          0.7,
        );
      } else if (i === 4) {
        plate(-0.179, -0.132, 0.358, 0.264, "#263237", "#8c9b8f", 0.012, 0.8);
        plate(-0.147, -0.1, 0.294, 0.2, "#10191e", "#566866", 0.002, 0.65);
        for (let slat = 0; slat < 6; slat++)
          line(
            [
              [-0.147, -0.1 + slat * 0.0333],
              [0.147, -0.1 + slat * 0.0333],
            ],
            "#77847e",
            0.55,
            0.7,
          );
      } else if (i === 5) {
        plate(-0.17, -0.12, 0.34, 0.24, "#6f817a", "#acb6a1", 0.006, 0.8);
        plate(
          -0.145,
          -0.0967,
          0.29,
          0.1934,
          gradient(-0.145, -0.096, 0.145, 0.096, [
            [0, "#506f70"],
            [0.36, "#304859"],
            [0.64, "#50404f"],
            [1, "#253f43"],
          ]),
          "#809788",
          0.002,
          0.65,
        );
      } else if (i === 6) {
        plate(
          -0.19,
          -0.144,
          0.38,
          0.288,
          "rgba(55,74,77,0.82)",
          "#98a79a",
          0.022,
          0.85,
        );
        plate(-0.151, -0.104, 0.302, 0.208, "#0a151a", "#5c7470", 0.007, 0.65);
        for (let k = 0; k < 5; k++) {
          line(
            [
              [-0.18, -0.066 + k * 0.031],
              [-0.155, -0.066 + k * 0.031],
            ],
            "#c0a366",
            1.1,
            0.65,
          );
          line(
            [
              [0.155, -0.066 + k * 0.031],
              [0.18, -0.066 + k * 0.031],
            ],
            "#c0a366",
            1.1,
            0.65,
          );
        }
      } else if (i === 7) {
        plate(-0.222, -0.177, 0.444, 0.354, "#253c3a", "#719387", 0.021, 0.8);
        plate(-0.068, -0.061, 0.136, 0.122, "#0d171c", "#a19c75", 0.004, 0.7);
        for (let k = 0; k < 9; k++) {
          const yy = -0.126 + k * 0.029;
          line(
            [
              [-0.203, yy],
              [-0.112, yy],
              [-0.086, yy * 0.4],
            ],
            "#a18f56",
            0.7,
            0.59,
          );
          line(
            [
              [0.086, yy * 0.4],
              [0.122, yy],
              [0.208, yy],
            ],
            "#a18f56",
            0.7,
            0.59,
          );
        }
      } else {
        plate(-0.237, -0.19, 0.474, 0.38, "#253137", "#7e938a", 0.028, 0.85);
        plate(-0.189, -0.14, 0.355, 0.265, "#0b171d", "#576e65", 0.013, 0.7);
        circle(0.2, -0.076, 0.014, "#394b4e", "#72887d", 0.7);
        circle(0.2, 0.035, 0.014, "#394b4e", "#72887d", 0.7);
      }
      if (!mobile && [0, 4, 5, 7].includes(i) && explode > 0.75) {
        const labelY = i % 2 === 0 ? 0.283 : -0.273;
        line(
          [
            [0, Math.sign(labelY) * 0.192],
            [0, labelY - Math.sign(labelY) * 0.024],
          ],
          "#7d8f83",
          0.6,
          0.5,
        );
        technical(
          { 0: "OPTICS", 4: "SHUTTER", 5: "SENSOR", 7: "PROCESSOR" }[i],
          0,
          labelY,
          "center",
          0.58,
        );
      }
      ctx.restore();
    }
    ray([start, end], 0.48, 0.4);
    ctx.restore();
  }

  const drawScenes = [
    camera,
    optics,
    focus,
    aperture,
    shutter,
    sensor,
    stability,
    machine,
  ];

  function resize(nextWidth, nextHeight) {
    if (disposed) return;
    width = Math.max(1, Math.round(Number.isFinite(nextWidth) ? nextWidth : 1));
    height = Math.max(
      1,
      Math.round(Number.isFinite(nextHeight) ? nextHeight : 1),
    );
    dpr = Math.min(1.5, Math.max(1, Number(globalThis.devicePixelRatio) || 1));
    mobile = width <= 900 && width < height;
    unit = Math.min(
      width * (mobile ? 0.9 : 0.54),
      height * (mobile ? 0.53 : 0.69),
    );
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  function render(frame, controls = {}, elapsedSeconds = 0) {
    if (disposed) return;
    if (
      !controls.paused &&
      !controls.reduced &&
      Number.isFinite(elapsedSeconds)
    )
      clock = elapsedSeconds;
    if (controls.reduced) clock = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const weights =
      frame?.weights ||
      Array.from({ length: 9 }, (_, index) =>
        index === (frame?.active || 0) ? 1 : 0,
      );
    const imageWeight = clamp(weights[8] || 0);
    const machineWeight = 1 - imageWeight;
    if (machineWeight <= 0.0001) return; // The final photograph belongs to DOM.
    ctx.save();
    ctx.globalAlpha = machineWeight;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    const centerX = width * (mobile ? 0.5 : 0.64);
    const centerY = height * (mobile ? 0.52 : 0.5);
    const atmosphere = ctx.createRadialGradient(
      centerX,
      centerY - unit * 0.1,
      unit * 0.09,
      centerX,
      centerY,
      unit * 0.75,
    );
    atmosphere.addColorStop(0, "#1b2529");
    atmosphere.addColorStop(0.45, "#10171b");
    atmosphere.addColorStop(1, "#090b0d");
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    for (let index = 0; index < drawScenes.length; index++) {
      const weight = clamp(weights[index] || 0);
      if (weight < 0.001) continue;
      let x = centerX,
        y = centerY,
        scale = unit;
      if (index === 2) {
        x = width * (mobile ? 0.5 : 0.26);
        y = height * (mobile ? 0.35 : 0.51);
        scale = Math.min(
          width * (mobile ? 0.85 : 0.39),
          height * (mobile ? 0.4 : 0.55),
        );
      }
      if (index === 3) {
        scale *= mobile ? 0.91 : 0.93;
        if (mobile) {
          y = height * 0.455;
          if (height <= 700) {
            y = height * 0.397;
            scale = Math.min(width * 0.55, height * 0.315);
          }
        }
      }
      if (index === 5) scale *= mobile ? 0.91 : 0.94;
      ctx.save();
      ctx.globalAlpha = weight;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      currentScale = scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawScenes[index](
        clamp(frame?.locals?.[index] ?? frame?.local ?? 0),
        controls,
      );
      ctx.restore();
    }
  }

  return {
    resize,
    render,
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      photoImage = null;
    },
  };
}
