// The component index: what each selectable part is and what it does.
// Figures are read from the model's own dimensions, so they describe this machine rather than decorate it.
import { GEAR, PLANET, HEAD_RATIO, LINK, HIND_LEAD, PITCH } from './spec.js';
import { rocker } from './kinematics.js';

function strokeDegrees() {
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i < 720; i += 1) {
    const beta = rocker((i / 720) * Math.PI * 2).beta;
    lo = Math.min(lo, beta); hi = Math.max(hi, beta);
  }
  return ((hi - lo) * 180) / Math.PI;
}

const reduction = HEAD_RATIO * (GEAR.driven / GEAR.out);
const fix = (v, digits = 1) => v.toFixed(digits);

// `show` is the span of disassembly progress over which the part's callout may appear.
// `view` is the heading and elevation the camera takes when the part is selected.
export const COMPONENTS = [
  {
    id: 'eye', name: 'Compound eye', role: 'Vision',
    text: 'Three hundred and thirty coated lenses on each side, set on an even spiral so no direction is favoured. A clear dome keeps the field clean.',
    specs: [['Lenses per eye', '330'], ['Field', 'Near-spherical'], ['Layers', 'Dome, lens field, bed']],
    show: [0, 1], view: { az: 0.5, pol: 1.25 }, rank: 9,
  },
  {
    id: 'head', name: 'Head and neck joint', role: 'Gaze',
    text: 'The head rides on a steel ball and is steered by two push rods. It turns in short, exact steps while the body holds still, the way a dragonfly tracks prey.',
    specs: [['Joint', 'Ball, two push rods'], ['Sensors', 'Three ocelli, two antennae']],
    show: [0.34, 1], view: { az: 0.2, pol: 1.3 }, rank: 4,
  },
  {
    id: 'shell', name: 'Carapace', role: 'Outer shell',
    text: 'Five titanium panels close the thorax. Each is held by socket screws that back out before the panel lifts. The panels are cut away around the wing roots so the hinges work in the open.',
    specs: [['Panels', '5'], ['Fasteners', '30'], ['Finish', 'Brushed and satin titanium']],
    show: [0.1, 1], view: { az: 0.7, pol: 0.95 }, rank: 6,
  },
  {
    id: 'forewing', name: 'Forewing', role: 'Lift',
    text: 'A film a few hundred nanometres thick over drawn veins. Its colour is interference, not pigment, and it shifts with the angle of view. The dark cell near the tip damps flutter.',
    specs: [['Sweep', 'Forward'], ['Stroke', `${fix(strokeDegrees(), 0)}°`], ['Structure', 'Costa, nodus, pterostigma']],
    show: [0, 1], view: { az: 1.0, pol: 0.7 }, rank: 8,
  },
  {
    id: 'hindwing', name: 'Hindwing', role: 'Lift and thrust',
    text: `Broader at the root than the forewing and set back. Its crank pins lead the forewing by ${fix((HIND_LEAD * 180) / Math.PI, 0)}°, so the hindwing always beats ahead.`,
    specs: [['Phase lead', `${fix((HIND_LEAD * 180) / Math.PI, 0)}°`], ['Sweep', 'Rearward']],
    show: [0.3, 1], view: { az: 2.0, pol: 0.7 }, rank: 5,
  },
  {
    id: 'hinge', name: 'Wing-root hinge', role: 'Flapping joint',
    text: 'A rocker turns on a pin held in bronze bushes. The connecting rod lifts the short inboard arm; the wing, on the far side of the pin, moves the other way.',
    specs: [['Lever arm', `${fix(LINK.arm, 2)} u`], ['Bearing', 'Bronze bushes, steel pin'], ['Per machine', '4']],
    show: [0, 1], view: { az: 0.95, pol: 0.9 }, rank: 10,
  },
  {
    id: 'servo', name: 'Feathering servo', role: 'Wing pitch',
    text: 'A pinion on the servo shaft turns a gear on the wing spar. It twists the blade through each stroke: leading edge down as the wing falls, up as it rises.',
    specs: [['Gear pair', `${PITCH.pinion} : ${PITCH.spar}`], ['Per machine', '4']],
    show: [0.5, 1], view: { az: 0.95, pol: 0.8 }, rank: 5,
  },
  {
    id: 'rod', name: 'Connecting rod', role: 'Crank to rocker',
    text: 'Four rods turn rotation into beat. Each runs from a crank pin to a rocker arm and is cut to a length that leaves the wing level at mid-stroke.',
    specs: [['Length', `${fix(LINK.rod, 3)} u`], ['Crank throw', `${fix(LINK.r, 2)} u`], ['Per machine', '4']],
    show: [0.36, 1], view: { az: 0.6, pol: 1.1 }, rank: 7,
  },
  {
    id: 'crank', name: 'Twin crankshafts', role: 'Transmission',
    text: 'Two shafts geared one-to-one turn in opposite directions, which keeps the left and right wings in mirror image. Each carries a fore and a hind crank.',
    specs: [['Timing gears', `${GEAR.sync} : ${GEAR.sync}`], ['Driven gear', `${GEAR.driven} teeth`], ['Cranks', '4']],
    show: [0.22, 1], view: { az: 0.9, pol: 1.0 }, rank: 8,
  },
  {
    id: 'motor', name: 'Motor and gearhead', role: 'Drive',
    text: `One brushless motor beats all four wings. A planetary stage and a spur pair bring the rotor down ${fix(reduction, 2)} to 1 before the crankshafts.`,
    specs: [['Planetary', `${PLANET.sun} / ${PLANET.planet} / ${PLANET.ring}`], ['Output pair', `${GEAR.out} : ${GEAR.driven}`], ['Reduction', `${fix(reduction, 2)} : 1`]],
    show: [0.22, 1], view: { az: 2.3, pol: 1.25 }, rank: 8,
  },
  {
    id: 'core', name: 'Core capsule', role: 'Control and power',
    text: 'Flight computer, inertial sensors and the main cell, stacked on three brass posts inside a glass sleeve. Every wire in the machine starts here.',
    specs: [['Boards', '5'], ['Sleeve', 'Glass, two end caps']],
    show: [0.22, 1], view: { az: 0.8, pol: 1.35 }, rank: 9,
  },
  {
    id: 'frame', name: 'Airframe', role: 'Structure',
    text: 'Two lightened side plates, two bulkheads and three carbon rails. The plates carry the wing hinges on their top edge; the bulkheads seat the crankshaft bearings.',
    specs: [['Plates', '2'], ['Bulkheads', '2'], ['Rails', '3, carbon']],
    show: [0.3, 1], view: { az: 1.0, pol: 1.05 }, rank: 5,
  },
  {
    id: 'loom', name: 'Wiring loom', role: 'Signal and power',
    text: 'Sheathed runs from the capsule to the motor, to each wing servo by way of the spine rail, forward to the head and back along the abdomen.',
    specs: [['Runs', '8'], ['Routing', 'Clipped to the rails']],
    show: [0.64, 1], view: { az: 1.1, pol: 0.9 }, rank: 2,
  },
  {
    id: 'leg', name: 'Legs', role: 'Perching and capture',
    text: 'Six legs hang forward in a loose basket. Each has four links and its own actuator rod; the spines along the tibia close the basket.',
    specs: [['Legs', '6'], ['Links per leg', '4']],
    show: [0, 1], view: { az: 0.5, pol: 1.6 }, rank: 6,
  },
  {
    id: 'abdomen', name: 'Abdominal plates', role: 'Balance and trim',
    text: 'Ten overlapping segments. Each has a dorsal plate and a ventral strip that lift away from the spine. The whole tail bends to trim the machine in flight.',
    specs: [['Segments', '10'], ['Plates', '20']],
    show: [0, 1], view: { az: 2.2, pol: 1.0 }, rank: 7,
  },
  {
    id: 'cells', name: 'Power cells', role: 'Energy',
    text: 'Twelve cells in the three segments behind the thorax, four around the spine in each, close to the centre of lift.',
    specs: [['Cells', '12'], ['Segments', '2 to 4']],
    show: [0.72, 1], view: { az: 2.2, pol: 1.0 }, rank: 6,
  },
  {
    id: 'spine', name: 'Spine and tendon coils', role: 'Tail actuation',
    text: 'A carbon spine with four tendons run through every vertebra. Shape-memory coils in the middle segments shorten when warmed and pull the tail toward them.',
    specs: [['Tendons', '4'], ['Coils', '16']],
    show: [0.72, 1], view: { az: 2.4, pol: 1.0 }, rank: 6,
  },
  {
    id: 'tail', name: 'Claspers', role: 'Tail',
    text: 'A rear-facing sensor between two polished claspers closes the last segment.',
    specs: [['Sensor', '1, rear-facing']],
    show: [0, 1], view: { az: 2.7, pol: 1.1 }, rank: 3,
  },
].map((component, index) => ({ ...component, number: String(index + 1).padStart(2, '0') }));

export const COMPONENT_BY_ID = new Map(COMPONENTS.map((component) => [component.id, component]));
