/**
 * Editorial content for an imagined night in Meridian City.
 * All places, people and times are fictional. Times are narrative markers,
 * never service schedules. Image keys are resolved by the media loader.
 */

export type ChapterId =
  | 'ch-01'
  | 'ch-02'
  | 'ch-03'
  | 'ch-04'
  | 'ch-05'
  | 'ch-06'
  | 'ch-07'
  | 'ch-08'
  | 'ch-09'
  | 'ch-10'
  | 'ch-11';

export interface Chapter {
  id: ChapterId;
  number: string;
  name: string;
  time: string;
  heading: string;
  body: string;
  beatTitle: string;
  beatBody: string;
  image: string;
  alt: string;
  category: string;
}

export const chapters: readonly Chapter[] = [
  {
    id: 'ch-01',
    number: '01',
    name: 'One Light Left On',
    time: '00:07',
    heading: 'Someone is still awake.',
    body: 'One warm window is enough to reveal how many stories continue after dark.',
    beatTitle: 'A room within the night',
    beatBody: 'Most windows have gone dark. Behind this pane, a steady lamp and a small human silhouette hold the night a little longer.',
    image: 'hero',
    alt: 'A lone amber-lit room above a quiet night city, with wet streets and distant buildings fading into blue darkness.',
    category: 'City',
  },
  {
    id: 'ch-02',
    number: '02',
    name: 'A Night of Many Routes',
    time: '00:42',
    heading: 'Different places. One night.',
    body: 'No single room directs this city’s care. Many people begin before the rest of us notice.',
    beatTitle: 'Choose a point of light',
    beatBody: 'Follow one route to a place and a purpose. The other lights remain: separate tasks, sharing the same hours.',
    image: 'atlas',
    alt: 'A notebook and a hand-drawn fictional city plan on a quiet desk, with a warm reflected line of light.',
    category: 'Atlas',
  },
  {
    id: 'ch-03',
    number: '03',
    name: 'Before the Bread',
    time: '01:18',
    heading: 'The first loaf starts in darkness.',
    body: 'Long before a street smells of bread, a pair of hands has prepared the morning.',
    beatTitle: 'A place for the first bake',
    beatBody: 'Flour catches in the grain of the bench. Beside the warm oven edge, dough and tools are arranged for the work ahead.',
    image: 'bakery-before',
    alt: 'A dim bakery workbench with flour, dough and a warm oven edge, prepared before opening.',
    category: 'Bakery',
  },
  {
    id: 'ch-04',
    number: '04',
    name: 'The Quiet Corridor',
    time: '01:56',
    heading: 'Care has no closing hour.',
    body: 'In the gentlest rooms, small acts can carry the weight of an entire night.',
    beatTitle: 'Attention takes small forms',
    beatBody: 'A glass of water. A blanket folded within reach. The quiet station holds these preparations without revealing the people they are for.',
    image: 'care',
    alt: 'A softly lit care corridor and quiet station with water and folded linen; no patients or personal records are visible.',
    category: 'Care',
  },
  {
    id: 'ch-05',
    number: '05',
    name: 'A Clean Start',
    time: '02:34',
    heading: 'Morning has to be made.',
    body: 'A careful sweep changes the ground that thousands of footsteps will soon cross.',
    beatTitle: 'The same curb, after the work',
    beatBody: 'Leaves and grit give way to a clear street edge. The reflection was here all along; the changed ground makes it easier to see.',
    image: 'curb-before',
    alt: 'Leaves and grit collect beside a rain-wet curb, with a fixed street edge and narrow reflected light.',
    category: 'Streets',
  },
  {
    id: 'ch-06',
    number: '06',
    name: 'Between Trains',
    time: '03:10',
    heading: 'The interval belongs to the workers.',
    body: 'A quiet line is a chance to inspect what daily motion wears away.',
    beatTitle: 'An exercise in looking closely',
    beatBody: 'The long view gives way to a fastener, a sleeper, the material between them. In the distance, the brightest point is a work light.',
    image: 'rail',
    alt: 'Two rails recede through a quiet inspection tunnel, with track details in the foreground and distant work lights; no train approaches.',
    category: 'Transit',
  },
  {
    id: 'ch-07',
    number: '07',
    name: 'Water Below',
    time: '03:46',
    heading: 'The city carries water in silence.',
    body: 'Beyond the road lies a network of rooms and pipes maintained by human attention.',
    beatTitle: 'The room behind the ordinary',
    beatBody: 'Brackets hold the weight of a curved pipe. Further along the gallery, a worker pauses over a notebook. The morning above will give little sign of this room.',
    image: 'water',
    alt: 'A quiet utility gallery with substantial curved pipes, supporting brackets and a distant worker beside a notebook.',
    category: 'Utilities',
  },
  {
    id: 'ch-08',
    number: '08',
    name: 'Light on Duty',
    time: '04:22',
    heading: 'Continuity is a kind of care.',
    body: 'Even a steady streetlamp has a story of inspection behind it.',
    beatTitle: 'A familiar light, still there',
    beatBody: 'A task lamp rests above closed equipment. Beyond a pane of glass, another warm light waits over the market. Each belongs to its own place in the night.',
    image: 'utility',
    alt: 'A restrained utility room with closed equipment casings, a steady task lamp and soft light on worn surfaces.',
    category: 'Utilities',
  },
  {
    id: 'ch-09',
    number: '09',
    name: 'Before the Market Opens',
    time: '05:08',
    heading: 'Color arrives by hand.',
    body: 'Every stem and crate has been moved before the first conversation begins.',
    beatTitle: 'The first color of the morning',
    beatBody: 'Hands gather stems into a scuffed crate. Petals catch the light at their edges, while the pale opening at the end of the aisle grows clearer.',
    image: 'market',
    alt: 'Hands sort flower stems and produce crates beneath market canopy lamps before customers arrive, with pale dawn at the end of the aisle.',
    category: 'Market',
  },
  {
    id: 'ch-10',
    number: '10',
    name: 'First Service',
    time: '05:43',
    heading: 'The first passengers arrive.',
    body: 'The platform fills slowly with the work of a city already in motion.',
    beatTitle: 'For someone, the day begins here',
    beatBody: 'A prepared vehicle enters the frame. A door opens, and the first passengers arrive in a city whose morning has already been taking shape.',
    image: 'platform',
    alt: 'A prepared transit platform and vehicle in early dawn light, with the city visible beyond the station.',
    category: 'Transit',
  },
  {
    id: 'ch-11',
    number: '11',
    name: 'The City Is Awake',
    time: '06:12',
    heading: 'By morning, the traces remain.',
    body: 'The city appears ordinary because so much happened while it was quiet.',
    beatTitle: 'The window is still there',
    beatBody: 'Now it belongs to the day. Look again at six small traces of the night, or return to the people and places that prepared them.',
    image: 'dawn',
    alt: 'The opening city and its recognizable room window in pale morning light, with the same streets and building silhouettes.',
    category: 'Morning',
  },
];

export type RouteId = 'all' | 'bakery' | 'care' | 'streets' | 'transit' | 'utilities';

export interface AtlasPoint {
  x: number;
  y: number;
  label: string;
}

export interface Route {
  id: RouteId;
  label: string;
  chapterIds: readonly ChapterId[];
  sentence: string;
  chapterId: ChapterId;
  points: readonly AtlasPoint[];
}

/** An editorial plan in a 1000 × 650 coordinate space, not real geography. */
export const routes: readonly Route[] = [
  {
    id: 'all',
    label: 'All routes',
    chapterIds: ['ch-03', 'ch-04', 'ch-05', 'ch-06', 'ch-07', 'ch-08', 'ch-09', 'ch-10'],
    sentence: 'Separate tasks leave their traces in the same morning.',
    chapterId: 'ch-02',
    points: [
      { x: 240, y: 235, label: 'The bakery' },
      { x: 565, y: 140, label: 'The quiet corridor' },
      { x: 395, y: 390, label: 'The cleared curb' },
      { x: 720, y: 330, label: 'Between trains' },
      { x: 840, y: 470, label: 'First service' },
      { x: 500, y: 535, label: 'Water below' },
      { x: 775, y: 170, label: 'Light on duty' },
      { x: 235, y: 510, label: 'The market' },
    ],
  },
  {
    id: 'bakery',
    label: 'Bakery',
    chapterIds: ['ch-03'],
    sentence: 'At the back of a quiet shop, hands prepare what the first customers will find.',
    chapterId: 'ch-03',
    points: [{ x: 240, y: 235, label: 'The bakery' }],
  },
  {
    id: 'care',
    label: 'Care',
    chapterIds: ['ch-04'],
    sentence: 'A lit corridor holds the small preparations that continue through the night.',
    chapterId: 'ch-04',
    points: [{ x: 565, y: 140, label: 'The quiet corridor' }],
  },
  {
    id: 'streets',
    label: 'Streets',
    chapterIds: ['ch-05'],
    sentence: 'At the curb, a cleared edge will be the most ordinary thing by daylight.',
    chapterId: 'ch-05',
    points: [{ x: 395, y: 390, label: 'The cleared curb' }],
  },
  {
    id: 'transit',
    label: 'Transit',
    chapterIds: ['ch-06', 'ch-10'],
    sentence: 'Between journeys, the line becomes a place for patient attention.',
    chapterId: 'ch-06',
    points: [
      { x: 720, y: 330, label: 'Between trains' },
      { x: 840, y: 470, label: 'First service' },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    chapterIds: ['ch-07', 'ch-08'],
    sentence: 'Beyond the road, workers attend to the rooms that morning rarely reveals.',
    chapterId: 'ch-07',
    points: [
      { x: 500, y: 535, label: 'Water below' },
      { x: 775, y: 170, label: 'Light on duty' },
    ],
  },
];

export interface MorningTrace {
  id: 'bakery' | 'care' | 'streets' | 'transit' | 'water' | 'market';
  label: string;
  before: string;
  after: string;
  chapterId: ChapterId;
  image: string;
}

export const morningTraces: readonly MorningTrace[] = [
  {
    id: 'bakery',
    label: 'The bakery',
    before: 'Hands prepare the bench and first dough.',
    after: 'A first loaf waits at the counter.',
    chapterId: 'ch-03',
    image: 'bakery-before',
  },
  {
    id: 'care',
    label: 'The quiet corridor',
    before: 'Water and linen are arranged within reach.',
    after: 'Small preparations are ready when needed.',
    chapterId: 'ch-04',
    image: 'care',
  },
  {
    id: 'streets',
    label: 'The curb',
    before: 'Leaves and grit are swept from a fixed street edge.',
    after: 'The curb meets the morning’s footsteps.',
    chapterId: 'ch-05',
    image: 'curb-before',
  },
  {
    id: 'transit',
    label: 'The first service',
    before: 'A quiet interval gives the line a moment of attention.',
    after: 'A platform receives its first passengers.',
    chapterId: 'ch-06',
    image: 'rail',
  },
  {
    id: 'water',
    label: 'The rooms below',
    before: 'A worker attends to an unseen utility room.',
    after: 'An ordinary tap belongs to the ordinary morning.',
    chapterId: 'ch-07',
    image: 'water',
  },
  {
    id: 'market',
    label: 'The market',
    before: 'Stems and crates are sorted before opening.',
    after: 'The first stall is ready for its conversations.',
    chapterId: 'ch-09',
    image: 'market',
  },
];

export const aboutCopy: readonly string[] = [
  'Meridian City is an original fictional composite. Its streets, people and times are invented. The scenes illustrate an imagined night; they are not records of a real shift.',
  'This is a portrait of quiet preparation, told through rooms, surfaces and gestures. The atlas and diagrams are editorial illustrations, not live services or operational instructions.',
  'The amber line is a way of looking from one scene to the next. It does not join these workers into a single system. Each place keeps its own purpose, and each person remains more than the task we glimpse.',
];
