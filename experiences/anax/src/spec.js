// Shared dimensions of the machine. Units are arbitrary; the body is about ten units long.
// Everything that has to agree between the model, the motion and the tests lives here.

// Wing stations along the body axis (+X is forward).
export const STATION = { fore: 0.62, hind: -0.62 };

// Crank-rocker flapping linkage, described in the transverse plane as (z, y) for the right side.
// crank centre -> crank pin -> connecting rod -> rocker lever -> hinge. The left side is its mirror.
const HINGE_Z = 0.7;
const HINGE_Y = 0.4;
const ARM = 0.32;
const CRANK_Z = 0.3;
const CRANK_Y = 0;
export const LINK = {
  cz: CRANK_Z,
  cy: CRANK_Y,
  r: 0.12,
  hz: HINGE_Z,
  hy: HINGE_Y,
  arm: ARM,
  // The rod is cut so the lever is level when the pin passes the crank centre height.
  rod: Math.hypot(HINGE_Z - ARM - CRANK_Z, HINGE_Y - CRANK_Y),
};

// Hind crank pins lead the fore pins, so the hind wings beat ahead of the fore wings.
export const HIND_LEAD = 1.75;

// Gear train. One module for every spur gear so pitch circles and centre distances are exact.
export const GEAR = {
  module: 0.02,
  sync: 30, // twin crankshaft timing gears, 1:1, counter-rotating
  driven: 26, // on the right crankshaft
  out: 21, // gearhead output gear
};
// Planetary gearhead between rotor and output gear: sun on the rotor, three planets, fixed ring.
// (sun + ring) / 3 is whole, so the three planets assemble evenly.
export const PLANET = { module: 0.012, sun: 12, planet: 9, ring: 30 };
export const HEAD_RATIO = 1 + PLANET.ring / PLANET.sun; // rotor turns per output turn
export const pitchRadius = (teeth) => (teeth * GEAR.module) / 2;

// The motor axis sits where its output gear meshes with the driven gear at exact centre distance.
const DRIVE_CENTRE = pitchRadius(GEAR.driven) + pitchRadius(GEAR.out);
export const MOTOR = { z: 0, y: CRANK_Y - Math.sqrt(DRIVE_CENTRE ** 2 - CRANK_Z ** 2) };

// Axial positions of the gear planes.
export const PLANE = { sync: 0.14, drive: -0.16 };

// Feathering gear at the wing root: servo pinion against a gear on the spar.
export const PITCH = { module: 0.0095, spar: 18, pinion: 8 };

// Wing geometry.
export const WING = {
  dihedral: 0.1, // resting rise of the wing above the rocker line, radians
  sweep: { fore: 0.07, hind: -0.085 },
  feather: 0.34, // feathering amplitude, radians
  rootOffset: 0.2, // spar exit, measured from the hinge along the span
};

// Disassembly stages on the 0..1 progress line.
export const STAGES = [
  { id: 'shell', label: 'Shell', from: 0, to: 0.3 },
  { id: 'assemblies', label: 'Assemblies', from: 0.3, to: 0.62 },
  { id: 'core', label: 'Core', from: 0.62, to: 1 },
];

// Crank speed in radians per second: hovering, and the slow demonstration used once parts separate.
export const SPEED = { hover: 9.6, demo: 1.5 };
