import test from 'node:test';
import assert from 'node:assert/strict';
// On promotion to work/grid/tests, change this import to ../src/type-metrics.ts.
import { gridAdvanceEm, fitGridFontSize } from '../experiences/grid/src/type-metrics.ts';

// Independent constants: FontTools TTFont.getGlyphSet(location).width for G/R/I/D,
// from the supplied unchanged RobotoFlex-Latin.woff2 (UPM 2048), SHA
// 5107a806ba9bb123c5ff2d9465905d04b767c694d125fd58103b88048a38a613.
// These are advances of separate spans, not rotated/slanted ink bounds.
const close = (actual, expected, label) => assert.ok(
  Math.abs(actual - expected) <= 1e-10, `${label}: ${actual} != ${expected}`,
);

const ORACLE = [
  [{},2.23095703125],
  [{"opsz":8.0,"wght":100.0,"wdth":25.0,"slnt":-10.0},1.95068359375],
  [{"opsz":8.0,"wght":1000.0,"wdth":151.0,"slnt":0.0},2.890625],
  [{"opsz":144.0,"wght":100.0,"wdth":25.0,"slnt":0.0},0.40771484375],
  [{"opsz":144.0,"wght":1000.0,"wdth":25.0,"slnt":0.0},1.7822265625],
  [{"opsz":144.0,"wght":1000.0,"wdth":151.0,"slnt":0.0},3.337890625],
  [{"opsz":70,"wght":390,"wdth":105,"slnt":0},1.9111710639741695],
  [{"opsz":90,"wght":750,"wdth":100,"slnt":0},2.112886265505634],
  [{"opsz":17.06204532324751,"wght":903.3997653642722,"wdth":135.427081244787,"slnt":-2.445991971327601},2.615730221338393],
];

test('GRID span advances match independent font metrics at defaults, corners and an interior location', () => {
  for (const [axes, advanceEm] of ORACLE) close(gridAdvanceEm(axes), advanceEm, JSON.stringify(axes));
});

// The two nonlinear opsz avar knots, each with both adjacent locations.
const OPTICAL_ORACLE = [
  [36.0024634765625,2.4271521226494075],
  [36.0025634765625,2.4271520534800546],
  [36.0026634765625,2.4271520242218787],
  [83.998679296875,2.4131092654307773],
  [83.998779296875,2.413109236172601],
  [83.998879296875,2.413109233387883],
];
test('Optical-size advance follows both sides of the actual font avar knots', () => {
  for (const [opsz, advanceEm] of OPTICAL_ORACLE) {
    close(gridAdvanceEm({opsz,wght:811,wdth:113,slnt:-3.7}), advanceEm, `opsz ${opsz}`);
  }
});

test('Slant preserves the measured summed advance while four spans contribute four tracking intervals', () => {
  const upright = {opsz:144,wght:1000,wdth:151,slnt:0};
  // FontTools returns 6836 units for both slnt 0 and -10 at this location.
  close(gridAdvanceEm(upright), 3.337890625, 'upright font reference');
  close(gridAdvanceEm({...upright,slnt:-10}), 3.337890625, 'slanted font reference');
  close(gridAdvanceEm(upright,-.04), 3.177890625, 'four separate tracked spans');
});

test('Uniform composition fit preserves a nonoverflowing size and caps the known extreme advance', () => {
  const normal = {wght:390,wdth:105,slnt:0,opsz:70};
  const extreme = {wght:1000,wdth:151,slnt:0,opsz:144};
  assert.equal(fitGridFontSize(405,800,normal,-.04),405,'normal typography retains its authored size');
  const fit=fitGridFontSize(405,800,extreme,-.04);
  close(fit,800/3.177890625,'extreme uses the independently measured word advance');
  assert.ok(fit<405);
  close(fit*3.177890625,800,'the tracked word occupies the caller-supplied budget');
});
