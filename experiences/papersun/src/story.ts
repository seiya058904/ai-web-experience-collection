/** Original fiction. All visible copy remains selectable English text. */
export const HERO = {
  title: 'The sky has lost its sun.',
  lead: 'Three pieces of light are scattered across a city made of paper. One little lamp is still awake.',
  action: 'Follow the red thread',
  alt: 'Layered blue paper rooftops beneath a circular gap in the night sky, with one small amber-lit attic window.',
} as const;

export interface Chapter {
  id: string;
  number: number;
  title: string;
  heading: string;
  lead: string;
  beats: readonly [string, string];
  detail: string;
  action: string;
  palette: string;
  incoming: string;
  outgoing: string;
  scene: string;
  readingNote: string;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'ch-01', number: 1, title: 'The Missing Circle', heading: 'The sky is missing a piece.',
    lead: 'When the paper sun broke, the city kept its lamps burning through the long blue night.',
    beats: [
      'Above the roofs, a round absence held its place in the sky. The sun had fallen into three pieces, and the city had forgotten the hour.',
      'But beneath one crooked roof, an amber window stayed awake. Someone was still making small things whole.',
    ],
    detail: 'A clean circular edge. A thickness of blue paper. There is no moon here, only the place where light belongs.',
    action: 'Look closer', palette: 'night', incoming: 'The opening theatre and the circular aperture.',
    outgoing: 'The single amber attic lamp and the red thread.', scene: 'city',
    readingNote: 'Hold the city wide enough to read the absence, then notice the one awake window.',
  },
  {
    id: 'ch-02', number: 2, title: 'The Last Warm Room', heading: 'One lamp, one repairer.',
    lead: 'Mira knows how to mend lanterns. She has never been asked to mend the sky.',
    beats: [
      'Her desk held scissors, a needle, and a spool of red linen. She repaired torn shades so their light could fall gently again.',
      'That night, she found a note pinned beneath an old lamp. Its three crooked outlines were the shape of an enormous request.',
    ],
    detail: 'Scissors free a tangled wick. The needle joins what is torn. Red linen marks a way home as faithfully as it holds a seam.',
    action: 'Inspect the desk', palette: 'amber', incoming: 'The very same lamp seen through the city roof.',
    outgoing: 'The corner of the pinned note, carrying three drawn contours.', scene: 'attic',
    readingNote: 'Keep the lamp, practical tools and Mira in one intimate paper room.',
  },
  {
    id: 'ch-03', number: 3, title: 'Three Pieces of Light', heading: 'Three pieces. One circle.',
    lead: 'The note shows three jagged pieces, each waiting beyond a different part of the sleeping city.',
    beats: [
      'One curved piece had fallen among lanterns. Another was caught where the wind would not rest. The last lay where even lamplight hesitated.',
      'Their edges were strange alone, but exact together. Mira tied the end of her red thread to the note and packed her needle.',
    ],
    detail: 'These are the same three outlines you will find, carry and repair. Previewing a piece helps you recognize it; it does not collect it.',
    action: 'Preview the pieces', palette: 'paper', incoming: 'The pinned note from Mira’s worktable.',
    outgoing: 'The red route passing through a pin at the note’s edge.', scene: 'map',
    readingNote: 'A readable paper note with three large, distinct shapes and their named destinations.',
  },
  {
    id: 'ch-04', number: 4, title: 'A Thread Across Roofs', heading: 'Follow what the light can reach.',
    lead: 'A red thread crosses the rooftops, pulling a little courage into the wide night.',
    beats: [
      'Mira fixed the thread to her attic sill. From nail to chimney, across narrow paper walkways, she carried its loose end into the blue.',
      'Far below, the lantern market slept beneath a striped awning. One unsteady light was still asking to be noticed.',
    ],
    detail: 'Three roof pins keep the thread above the roofs. The path follows a real walkway; its little bridges make every gap crossable.',
    action: 'Trace the route', palette: 'blue', incoming: 'The red thread leaving the paper map.',
    outgoing: 'The same thread running beneath the market awning.', scene: 'roofs',
    readingNote: 'Follow visible anchor points; give the journey its first broad breath.',
  },
  {
    id: 'ch-05', number: 5, title: 'The Lantern Market', heading: 'A light found among lanterns.',
    lead: 'In the quiet market, Mira repairs one failed lantern and finds the first piece of the sun.',
    beats: [
      'Rows of paper lanterns hung like sleeping fruit. In the smallest stall, a torn shade had trapped its wick, letting the light catch and fail.',
      'Mira loosened the torn edge and set the wick upright. Behind the shade, a familiar golden notch shone back at her: the first piece.',
    ],
    detail: 'Piece A belongs to the lantern market. Its curved outside and stepped inside will keep their shape all the way home.',
    action: 'Repair the lantern', palette: 'market', incoming: 'The roof thread passing under the thick paper canopy.',
    outgoing: 'Piece A beside the red thread as the market banner yields to the hill.', scene: 'market',
    readingNote: 'See the failed lantern first. Let the repair, rather than scrolling alone, reveal A.',
  },
  {
    id: 'ch-06', number: 6, title: 'The Wind Hill', heading: 'The wind keeps its own hours.',
    lead: 'At the hill, the second piece turns beyond a paper wind-wheel that will not rest.',
    beats: [
      'The grass rose in soft, cut-paper waves. Above it, a little wheel turned around a bright pin, hiding a gold edge with every passing blade.',
      'Mira waited, then steadied the wheel. The second piece rested behind the axle, patient as something that had never been lost.',
    ],
    detail: 'The wheel pivots on its visible pin. Steady it to reveal Piece B; release it or reset the scene whenever you wish.',
    action: 'Steady the wheel', palette: 'periwinkle', incoming: 'The carried first piece and red thread emerging past a market banner.',
    outgoing: 'The wheel’s silhouette framing an indigo valley arch.', scene: 'hill',
    readingNote: 'Give the hillside a generous landscape hold. The wheel is a physical prop, not a loading spinner.',
  },
  {
    id: 'ch-07', number: 7, title: 'Valley of Shadows', heading: 'Not every shadow is empty.',
    lead: 'Where sunlight has not reached, the last piece waits beneath a deep blue paper arch.',
    beats: [
      'The thread led down into the folds of the valley. Mira lowered her lamp. Narrow shafts of light showed where one paper layer ended and another began.',
      'Beneath an arch, a pinned shade sheltered the last piece. She lifted it gently. The dark had not stolen the light; it had kept it safe.',
    ],
    detail: 'Piece C waits behind the hinged paper shade. Its left-hand curve closes the circle without creating a fourth piece.',
    action: 'Lift the paper shade', palette: 'violet', incoming: 'The wheel silhouette handing the foreground to a dark paper arch.',
    outgoing: 'Three separate, uniquely edged fragments gathered beside the red thread.', scene: 'valley',
    readingNote: 'The valley should feel protective as well as deep; keep the tiny warm reveal deliberate.',
  },
  {
    id: 'ch-08', number: 8, title: 'The Blue Bridge', heading: 'The road back is blue.',
    lead: 'Three pieces ride beside a red thread as Mira crosses the narrow paper bridge toward her lamp.',
    beats: [
      'Mira wrapped each piece in its own corner of cloth. They travelled close together, still separate: a market, a hillside, a valley.',
      'The bridge bent across the dark like a blue ribbon. At its far end, the same small attic window waited. The thread had remembered the way.',
    ],
    detail: 'Review the three pieces to recall their places. If you skipped a stop, you can return to it or continue to the repair table.',
    action: 'Review pieces', palette: 'bridge', incoming: 'The valley arch and three separate fragments.',
    outgoing: 'The bridge’s blue arc and red thread meeting the attic worktable border.', scene: 'bridge',
    readingNote: 'The bridge has a solid walking surface and a visible far anchor. Carrying is not assembling.',
  },
  {
    id: 'ch-09', number: 9, title: 'Mending the Sun', heading: 'Let the seams remain.',
    lead: 'Mira fits the three pieces together and stitches light across the cracks instead of hiding them.',
    beats: [
      'Back at the desk, she set the three pieces inside the circle from the note. Every notch found its neighbor. Nothing needed to be cut away.',
      'Then the needle followed the cracks. Red linen crossed gold paper, leaving small, visible stitches. A repaired thing could remember its journey.',
    ],
    detail: 'Place A, B and C in any order. Their shared edges fit exactly. The same three paths and their seams will rise into the sky.',
    action: 'Place piece A', palette: 'linen', incoming: 'The red thread ending at the curved repair table behind an opaque blue arch.',
    outgoing: 'The joined disc and red thread rigging, with all three seam paths visible.', scene: 'repair',
    readingNote: 'The exact geometry is the climax of the repair. Keep the target circle, shapes and controls readable together.',
  },
  {
    id: 'ch-10', number: 10, title: 'The First Light', heading: 'Light learns its way home.',
    lead: 'Mira lifts the repaired paper sun. The city changes under a light made from its own seams.',
    beats: [
      'She passed the red thread through the waiting rig and raised the sun. It crossed the attic window without losing a stitch or changing its shape.',
      'High above the roofs, the circle fitted its old place. Warmth moved slowly across the paper city. Even the seams belonged to the morning.',
    ],
    detail: 'Day and night are two views of the same stage. The opening, three-piece disc, stitched edges and little attic lamp keep their identities.',
    action: 'Day / Night view', palette: 'daylight', incoming: 'The precise repaired disc rising on its red thread rig.',
    outgoing: 'New warm shadows across the original roofs; the little lamp still lit.', scene: 'sunrise',
    readingNote: 'Resolve the original absence at the original scale. Change the light gently; never replace the object.',
  },
  {
    id: 'ch-11', number: 11, title: 'A Lamp for the Night', heading: 'Keep one light for the dark.',
    lead: 'The sun belongs to the sky. The little lamp stays for anyone who still needs the night.',
    beats: [
      'The city woke. Stalls opened, the hill turned its wheel, and the valley kept its quiet shade. Mira went back to the small work that she loved.',
      'She left her amber lamp in the window. Some journeys begin after sunset. Some things need a gentler light to find their way home.',
    ],
    detail: 'A lantern mended. A wheel steadied. A shadow lifted. Three small acts, held together by a thread.',
    action: 'Explore the chapters again', palette: 'morning', incoming: 'The same roofline and repaired circular opening in morning light.',
    outgoing: 'The original amber lamp, and an invitation to begin again.', scene: 'ending',
    readingNote: 'Give the ending a full scene, two story beats, and a quiet return to the lamp. It is not a credits card.',
  },
];

export interface Transition {
  id: string;
  from: number;
  to: number;
  anchor: string;
  occluder: string;
  stages: readonly [string, string, string, string, string];
  mobile: string;
  fallback: string;
}
export const TRANSITIONS: readonly Transition[] = [
  { id: 'tr-01-02', from: 0, to: 1, anchor: 'Amber attic lamp and cut rooftop edge', occluder: 'Paper window frame',
    stages: ['Missing circle and city hold.', 'The attic lamp grows; sky remains present.', 'The window frame masks the foreground; the desk appears beyond.', 'Mira and the tools take the stage; city recedes through the window.', 'The warm room and original lamp hold.'],
    mobile: 'Two framed room and city states retain the aperture silhouette.', fallback: 'Attic composition with the same lamp and window.' },
  { id: 'tr-02-03', from: 1, to: 2, anchor: 'Note corner and linen pin', occluder: 'Opaque paper note',
    stages: ['The workbench is complete.', 'The pinned note rises.', 'The note fills the reading plane; the first exact contour appears.', 'The other two contours enter; desk props frame the sheet.', 'The complete three-piece map holds.'],
    mobile: 'Two note-opening states with all three shapes available.', fallback: 'The complete readable note and exact three contours.' },
  { id: 'tr-03-04', from: 2, to: 3, anchor: 'Red thread pinned through the map edge', occluder: 'Map edge meeting roof walkway',
    stages: ['The map and three outlines hold.', 'The red route leaves the page toward its desk pin.', 'The map edge aligns with the attic roof walkway.', 'Roof planes take depth; Mira steps outside.', 'The connected night roof path holds.'],
    mobile: 'A door-to-roof pair, connected by visible thread.', fallback: 'A complete roof path with anchored red thread.' },
  { id: 'tr-04-05', from: 3, to: 4, anchor: 'Red thread and warm paper lantern silhouette', occluder: 'Thick market canopy edge',
    stages: ['Rooftops and thread remain legible.', 'Canopy edges enter the distance.', 'One lamp aligns with a roof slit behind opaque paper.', 'Market layers and the unlit lantern become primary.', 'The repairable lantern stage holds.'],
    mobile: 'A single foreground stall reveal with spacious copy.', fallback: 'The complete market stall and red thread.' },
  { id: 'tr-05-06', from: 4, to: 5, anchor: 'Piece A’s notch and the red thread', occluder: 'Opaque market banner',
    stages: ['The market repair scene holds.', 'The exact outline of Piece A remains stable.', 'The banner veils the location handoff; thread continues.', 'Curved hill layers replace the stalls.', 'The hill and pinned wind-wheel hold.'],
    mobile: 'Market and hill still states with the same carried piece.', fallback: 'The hill composition and carried Piece A.' },
  { id: 'tr-06-07', from: 5, to: 6, anchor: 'Pinned wheel outline and red thread', occluder: 'Wheel silhouette, then valley arch',
    stages: ['Aligned wheel and Piece B hold.', 'The view passes the wheel on a fixed path.', 'The wheel becomes near occlusion as the valley arch enters.', 'Indigo paper planes develop valley depth.', 'The third-fragment valley stage holds.'],
    mobile: 'Wheel silhouette and valley still pair.', fallback: 'The complete valley arch and red thread.' },
  { id: 'tr-07-08', from: 6, to: 7, anchor: 'Three distinct pieces and the valley arch', occluder: 'Opaque blue bridge arch',
    stages: ['Piece C holds beneath the arch.', 'All three separate pieces remain identifiable.', 'Thread traces toward a blue bridge contour.', 'The bridge edge covers the valley as Mira enters.', 'The homeward bridge stage holds.'],
    mobile: 'A readable found-pieces strip beside the bridge.', fallback: 'The complete bridge with three separate pieces.' },
  { id: 'tr-08-09', from: 7, to: 8, anchor: 'Blue arc and red guide thread', occluder: 'Opaque blue arch matched to curved desk support',
    stages: ['Bridge, Mira and separate pieces hold.', 'The thread guides across the last span.', 'The opaque arch aligns with the curved attic work surface.', 'Room props take over; all pieces remain separate.', 'The repair table and disc outline hold.'],
    mobile: 'Two stage views with the same thread termination.', fallback: 'The prepared repair table with all three distinct shapes.' },
  { id: 'tr-09-10', from: 8, to: 9, anchor: 'Exact repaired disc and red thread rig', occluder: 'Registered attic window edge',
    stages: ['The stitched circle rests on the table.', 'The rig lifts it without changing local piece coordinates.', 'The disc passes the window on a registered vertical path.', 'The original sky opening appears at matching scale.', 'The disc reaches the aperture; warm light begins.'],
    mobile: 'Staged lift stills preserve the exact disc and its three seams.', fallback: 'A sunrise composition with the same repaired sun.' },
  { id: 'tr-10-11', from: 9, to: 10, anchor: 'Repaired circle and original attic lamp', occluder: 'Foreground paper roof reveal',
    stages: ['The returned sun and warm light hold.', 'The view withdraws to reveal the roofs and new shadows.', 'The amber attic lamp remains visible beneath its roof.', 'The city panorama and captions become quiet.', 'The lamp closes the story.'],
    mobile: 'Two stable panorama and lamp-detail states.', fallback: 'The complete ending, repaired sun and amber lamp.' },
];

export const TOOLS = [
  { name: 'Scissors', purpose: 'Free the tangled wick in the lantern market.' },
  { name: 'Needle', purpose: 'Stitch the three pieces without hiding their seams.' },
  { name: 'Red linen', purpose: 'Mark the way home, hold the repair, and raise the sun.' },
] as const;

export const INTERFACE = {
  chapters: 'Chapters', about: 'About this experience', motionOn: 'Motion: On',
  motionReduced: 'Motion: Reduced', soundOff: 'Sound: Off', soundOn: 'Sound: On',
  back: 'Back to beginning', continue: 'Continue', close: 'Close', retry: 'Retry',
  stills: 'View as stills', loading: 'Preparing the next scene…',
  error: 'This scene could not load. The story remains available in still view.',
  noAudio: 'Audio is unavailable in this version.', inventory: 'Review pieces',
  reset: 'Reset scene', beginAgain: 'Begin again', lift: 'Lift the sun', seams: 'Show the seams',
} as const;
