/** Authored English story content. Factual boundaries: docs/SOURCES.md. */
export type ChapterMedia = 'hero' | 'warehouse' | 'road' | 'rail' | 'yard' | 'lift' | 'sea' | 'shore';
export type ChapterTheme = 'light' | 'dark';
export type ChapterKind = 'photo' | 'technical';

export interface Chapter {
  id: string;
  number: number;
  name: string;
  heading: string;
  lead: string;
  beatTitle: string;
  beatBody: string;
  detail: string;
  media: ChapterMedia;
  theme: ChapterTheme;
  kind: ChapterKind;
  actionLabel: string;
  alt: string;
}

export const chapters: readonly Chapter[] = [
  {
    id: 'ch-01',
    number: 1,
    name: 'One Box',
    heading: 'One box. Many worlds.',
    lead: 'A steel rectangle will cross roads, rails, ports and open water without changing its shape.',
    beatTitle: 'An object made to travel.',
    beatBody: 'Find the worn red paint, the corner fittings and a small scratch beside the doors. These are the details to follow. Everything around them is about to change.',
    detail: 'CARGO / BOX-001 · Fictional exhibit ID · 20-foot standard general-purpose container.',
    media: 'hero',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Identify BOX-001',
    alt: 'One worn red freight container beneath immense steel port-crane structures, with fog and stacked cargo in the distance.',
  },
  {
    id: 'ch-02',
    number: 2,
    name: 'Within the Walls',
    heading: 'A room with a destination.',
    lead: 'Every shipment begins with what can actually fit inside the container.',
    beatTitle: 'The outside is only the beginning.',
    beatBody: 'Beyond the doorframe, the floor and corrugated walls enclose a finite space. Switch between empty and packed to see one arrangement of cargo inside the same shell.',
    detail: 'Illustrative packing. The blocks represent authored cargo, not a loading plan or a capacity calculation.',
    media: 'warehouse',
    theme: 'light',
    kind: 'technical',
    actionLabel: 'Empty / Packed',
    alt: 'An open red container with a defined floor, thick doorframe and selectable empty or packed interior.',
  },
  {
    id: 'ch-03',
    number: 3,
    name: 'Closed and Recorded',
    heading: 'A journey begins with a closure.',
    lead: 'The steel doors close. The container remains the same object as responsibility changes hands.',
    beatTitle: 'A familiar pair of doors.',
    beatBody: 'The hinges turn, the opening closes and the locking bars return to view. A small illustrated seal marks a custody moment in this fictional journey.',
    detail: 'Illustrative seal. This exhibit makes no security guarantee and carries no real approval or registration plate.',
    media: 'warehouse',
    theme: 'light',
    kind: 'technical',
    actionLabel: 'Open / Closed',
    alt: 'The same container doors and locking bars, with the upper-right scratch retained through open and closed states.',
  },
  {
    id: 'ch-04',
    number: 4,
    name: 'Overland',
    heading: 'A road carries the shape.',
    lead: 'The vehicle changes. The box does not.',
    beatTitle: 'Two objects. One departure.',
    beatBody: 'Look beneath the red walls: a separate chassis supports the container above the road. The lower corners are the meeting points between the box and its carrier.',
    detail: 'A conceptual view of the support interface. The vehicle and route are fictional.',
    media: 'road',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'See the connection',
    alt: 'A red freight container resting on a road chassis, with grounded wheels and its support interface visible.',
  },
  {
    id: 'ch-05',
    number: 5,
    name: 'Intermodal',
    heading: 'Transfer the carrier. Keep the cargo.',
    lead: 'Standardized external geometry makes transport handoffs possible even as the vehicles change.',
    beatTitle: 'The interface stays familiar.',
    beatBody: 'Compare the road chassis with the rail wagon. The supports are different; the container keeps its dimensions, its closed doors and the cargo within.',
    detail: 'Conceptual transfer. Carrier views explain an interface; they are not an operational loading procedure.',
    media: 'rail',
    theme: 'light',
    kind: 'technical',
    actionLabel: 'Compare supports',
    alt: 'Matched road and rail support diagrams showing one unchanged red container seated on each selected carrier.',
  },
  {
    id: 'ch-06',
    number: 6,
    name: 'Across the Land',
    heading: 'The same corrugations pass a new horizon.',
    lead: 'On rail, the steel walls stay recognizable even as the landscape changes around them.',
    beatTitle: 'A small mark in a long rhythm.',
    beatBody: 'Wagons repeat along the rails. Pull your attention back to BOX-001: the red side, the corner and the scratch still belong to the same object.',
    detail: 'An illustrative rail journey. No real itinerary, distance or travel time is implied.',
    media: 'rail',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Find BOX-001',
    alt: 'Freight wagons following parallel rails through a broad landscape, carrying the selected red container.',
  },
  {
    id: 'ch-07',
    number: 7,
    name: 'The Yard',
    heading: 'A pattern the size of a city block.',
    lead: 'From above, a landscape of rectangles resolves into lanes, stacks and individual steel objects.',
    beatTitle: 'One box inside the pattern.',
    beatBody: 'Follow the arrival lane into the yard. Among the grounded stacks, our red container waits below the lifting equipment, its top corners ready to become the next point of contact.',
    detail: 'Illustrative terminal. Locate the container to return to its marked position in the composition.',
    media: 'yard',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Locate the container',
    alt: 'An orderly fictional port yard with grounded container stacks and a single selected red box beneath a gantry.',
  },
  {
    id: 'ch-08',
    number: 8,
    name: 'The Lift',
    heading: 'A few meters of steel. An immense machine.',
    lead: 'A spreader meets the top corners. A container leaves the ground without ceasing to be itself.',
    beatTitle: 'Contact before movement.',
    beatBody: 'The spreader aligns with the box. Once the two meet, the suspended assembly rises together toward the vessel. Inspect the cable, spreader and corner relationship in a still view.',
    detail: 'Schematic mechanism. The illustration is not a lifting instruction or a statement of certified equipment compatibility.',
    media: 'lift',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Inspect the lift',
    alt: 'A crane spreader engaged with the red container at its top corners, with lifting cables above and a ship beside the dock.',
  },
  {
    id: 'ch-09',
    number: 9,
    name: 'Open Water',
    heading: 'At sea, the rectangle becomes tiny.',
    lead: 'The same box is carried across immense open water with no need to redraw its identity.',
    beatTitle: 'The deck becomes the ground.',
    beatBody: 'First find the red box among the shipboard stacks. Then take in the vessel and the water around it. The change is one of scale and surroundings; the cargo remains within the same walls.',
    detail: 'A fictional ocean crossing. The marker identifies a place in the illustration, not a live position.',
    media: 'sea',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Find the red box',
    alt: 'A container ship on a calm gray-blue sea, carrying one selected red container among aligned deck stacks.',
  },
  {
    id: 'ch-10',
    number: 10,
    name: 'Another Shore',
    heading: 'The shore changes. The box does not.',
    lead: 'A new port receives the same steel object and sends it onward again.',
    beatTitle: 'New light. Familiar doors.',
    beatBody: 'The horizon gives way to a berth, then a receiving yard. Compare the two ports before following the closed doors toward a final warehouse.',
    detail: 'Illustrative locations. Both ports and the route between them are fictional.',
    media: 'shore',
    theme: 'dark',
    kind: 'photo',
    actionLabel: 'Compare ports',
    alt: 'A different fictional coastline and receiving terminal, with the same red container moving toward its destination warehouse.',
  },
  {
    id: 'ch-11',
    number: 11,
    name: 'Open Again',
    heading: 'The journey ends when the doors open.',
    lead: 'The walls have crossed the world. Now the same doors release what was packed at the beginning.',
    beatTitle: 'What changed was everything around it.',
    beatBody: 'The scratch is still beside the doors. Open them to find the original arrangement of cargo, then revisit any chapter of the journey. One box has held the story together.',
    detail: 'The same fictional container and cargo return. Explore the chapters again in any order.',
    media: 'warehouse',
    theme: 'light',
    kind: 'technical',
    actionLabel: 'Replay the journey',
    alt: 'The original red container open at a destination warehouse, revealing the same packing blocks seen at departure.',
  },
];

export type TransitionOccluder = 'doorframe' | 'door' | 'chassis' | 'girder' | 'track' | 'stack' | 'crane' | 'hull' | 'horizon' | 'warehouse';

export interface StoryTransition {
  id: string;
  from: string;
  to: string;
  name: string;
  anchor: string;
  stages: readonly [string, string, string, string, string];
  occluder: TransitionOccluder;
}

/** Stages map to 0%, 25%, 50%, 75% and 100% of each local transition. */
export const transitions: readonly StoryTransition[] = [
  {
    id: 'tr-01-02', from: 'ch-01', to: 'ch-02',
    name: 'Outside / Inside',
    anchor: 'Upper corner fitting and corrugated wall',
    stages: ['The box holds beneath the gantry.', 'A familiar corner leads toward the doors.', 'The doorframe reveals an inner floor.', 'The interior fills the view; the walls retain their thickness.', 'The empty room settles into view.'],
    occluder: 'doorframe',
  },
  {
    id: 'tr-02-03', from: 'ch-02', to: 'ch-03',
    name: 'Within / Closed',
    anchor: 'Door hinge and locking bar',
    stages: ['The packed interior remains visible.', 'Both doors turn from their hinges.', 'The narrowing opening frames the same cargo.', 'The closed bars and seal area come into focus.', 'Closed doors and the fictional transfer record hold.'],
    occluder: 'door',
  },
  {
    id: 'tr-03-04', from: 'ch-03', to: 'ch-04',
    name: 'Floor / Carrier',
    anchor: 'Lower corner fitting and carrier support',
    stages: ['The closed box rests on the facility floor.', 'Road support enters at a matched scale.', 'An opaque support detail bridges the transfer.', 'The box is seated on its chassis with a contact shadow.', 'The road departure holds.'],
    occluder: 'chassis',
  },
  {
    id: 'tr-04-05', from: 'ch-04', to: 'ch-05',
    name: 'Road / Rail',
    anchor: 'Unchanged lower corner fitting',
    stages: ['The road carrier supports the closed box.', 'The view selects a lower corner.', 'A transfer-frame detail conceals the carrier change.', 'Rail support emerges beneath the same corner.', 'The box rests on the wagon.'],
    occluder: 'girder',
  },
  {
    id: 'tr-05-06', from: 'ch-05', to: 'ch-06',
    name: 'Interface / Landscape',
    anchor: 'Wagon side and red corrugation',
    stages: ['The box is seated on the rail wagon.', 'The view follows its marked side.', 'Rails lead toward the landscape beneath the same box.', 'A wider horizon reveals the train.', 'The long rail composition holds.'],
    occluder: 'track',
  },
  {
    id: 'tr-06-07', from: 'ch-06', to: 'ch-07',
    name: 'Rail / Yard',
    anchor: 'Red corrugation and terminal lane lines',
    stages: ['The rail arrival and selected box remain clear.', 'Ground lines lead toward the terminal.', 'A foreground stack conceals the change of location.', 'The receiving lane and selected stack position emerge.', 'The grounded port-yard view settles.'],
    occluder: 'stack',
  },
  {
    id: 'tr-07-08', from: 'ch-07', to: 'ch-08',
    name: 'Ground / Lift',
    anchor: 'Top corner fittings and spreader beam',
    stages: ['The selected box rests in the yard.', 'The spreader aligns directly above its top corners.', 'Spreader and corners meet behind an opaque crane beam.', 'Box and spreader rise as one suspended assembly.', 'The controlled lift holds beside the vessel.'],
    occluder: 'crane',
  },
  {
    id: 'tr-08-09', from: 'ch-08', to: 'ch-09',
    name: 'Lift / Deck',
    anchor: 'Container bottom edge and receiving deck cells',
    stages: ['The engaged lift hangs beside the vessel.', 'The ship-side structure enters the view.', 'The box aligns with its receiving deck position.', 'The box is seated as the crane yields to the horizon.', 'The selected box rests among the vessel stacks.'],
    occluder: 'hull',
  },
  {
    id: 'tr-09-10', from: 'ch-09', to: 'ch-10',
    name: 'Horizon / Shore',
    anchor: 'Shared horizon and selected deck position',
    stages: ['The ship holds in open water.', 'The long horizon fills more of the view.', 'A destination coast appears beneath the same cloud band.', 'A berth enters in a matched perspective.', 'The new shore and identified box hold.'],
    occluder: 'horizon',
  },
  {
    id: 'tr-10-11', from: 'ch-10', to: 'ch-11',
    name: 'Arrival / Opening',
    anchor: 'Rear locking bars and signature scratch',
    stages: ['The destination approach remains grounded.', 'The familiar door end becomes prominent.', 'A warehouse frame aligns with the rear bars.', 'The doors turn to reveal the original packing blocks.', 'The destination interior and route recap hold.'],
    occluder: 'warehouse',
  },
];

/** Nominal exterior dimensions are sourced; identity and contents are authored. */
export const BOX_SPEC = {
  id: 'BOX-001',
  mark: 'CARGO / BOX-001',
  fictional: true,
  type: '20-foot standard general-purpose container',
  units: 'm',
  length: 6.058,
  width: 2.438,
  height: 2.591,
  paint: '#A64B3B',
  axes: { x: 'Length', y: 'Up', z: 'Width', rearDoors: 'Positive x end' },
  scratch: {
    id: 'upper-right-door-scratch',
    location: 'Upper-right area of the right rear door, viewed from outside',
    doorSide: 'Negative z',
    description: 'One short diagonal rust scratch, retained through every chapter.',
  },
  cargo: {
    id: 'packing-blocks-v1',
    description: 'Authored packing blocks, reused with the same arrangement at departure and destination.',
    blockCount: 6,
    arrangement: 'Two rows of three equal illustrative timber blocks.',
    xCenters: [-2.12, -0.80, 0.52],
    zCenters: [-0.56, 0.55],
    blockDimensions: { length: 1.13, width: 0.91, height: 0.96 },
    floorTop: 0.21,
    status: 'Illustrative cargo; not a loading plan or capacity calculation.',
  },
  sourceNote: 'Nominal external envelope: Hapag-Lloyd specification and BIC size/type guide, reviewed 2026-11-09. See docs/SOURCES.md.',
} as const;
