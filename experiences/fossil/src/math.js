/* FOSSIL · deterministic scene math. No scroll or rendering side effects. */
(function (root) {
  'use strict';
  var clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function weights(position, count = 10) {
    return Array.from({ length: count }, (_, i) => {
      var enter = i === 0 ? 1 : smooth(i - 0.42, i + 0.06, position);
      var leave = i === count - 1 ? 1 : 1 - smooth(i + 0.58, i + 1.08, position);
      return clamp(enter * leave);
    });
  }
  function phase(p) {
    return { enter: smooth(0, 0.17, p), hold: smooth(0.17, 0.3, p) * (1 - smooth(0.67, 0.78, p)), handoff: smooth(0.68, 0.93, p), exit: smooth(0.9, 1, p) };
  }
  function mixColor(a, b, t) {
    var read = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    var aa = read(a), bb = read(b);
    return 'rgb(' + aa.map((v, i) => Math.round(lerp(v, bb[i], t))).join(',') + ')';
  }
  function seedRandom(seed) {
    var state = seed >>> 0;
    return function () { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  }
  root.FossilMath = Object.freeze({ clamp, lerp, smooth, weights, phase, mixColor, seedRandom });
})(typeof window !== 'undefined' ? window : globalThis);
