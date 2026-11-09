/**
 * SILLAGE's English copy and shared vocabulary.
 * These are authored artistic descriptions, not scent measurements or a formula.
 * Keep site-authored copy in this module; render user titles as text, unchanged.
 */

export type VoiceId = 'brightness' | 'spice' | 'warmth';
export type PhaseId = 'arrival' | 'unfolding' | 'afterglow';
export type MemoryId = 'window' | 'note';

export interface ChapterCopy {
  id: string;
  number: string;
  navLabel: string;
  title: string;
  lead: string;
  body: string;
  note: string;
  beats: readonly [
    { title: string; body: string },
    { title: string; body: string },
  ];
  alt: string;
}

export const SITE = {
  name: 'SILLAGE',
  tagline: 'The shape of scent.',
  documentTitle: 'SILLAGE — The shape of scent',
  description:
    'An interactive visual essay in brightness, spice and warmth. Explore ten chapters, compose an impression and keep it as an image.',
  introduction:
    'Some things are invisible. Their presence changes how a place feels.',
  invitation: 'Follow one impression. Give it your own shape.',
  mediumNotice: 'An original visual interpretation. No scent is transmitted.',
  about:
    'SILLAGE gives three imagined scent qualities a visual language. Its colours, shapes, stages and memories are artistic choices. They do not describe a perfume formula or predict how a fragrance will behave.',
  defaultTitle: 'After the Open Window',
} as const;

export const LEXICON = [
  {
    id: 'brightness',
    index: 0,
    name: 'Brightness',
    association: 'Pomelo peel',
    colour: 'Apricot yellow',
    hex: '#E7B353',
    shape: 'A fine, sharp ridge',
    phrase: 'Bright, without sweetness.',
    description:
      'The sharp suggestion of freshly peeled pomelo becomes a thin edge that catches the light.',
    selected:
      'Brightness is highlighted: an apricot-yellow ridge with a fine, sharp edge.',
    absent:
      'Brightness is absent from this comparison. The yellow ridge and its sharp interruption have gone.',
    shareHelp: 'Changes the area and reach of the fine ridge.',
  },
  {
    id: 'spice',
    index: 1,
    name: 'Spice',
    association: 'A suggestion of pepper',
    colour: 'Aubergine',
    hex: '#594051',
    shape: 'A close, folded plane',
    phrase: 'A small tension, held close.',
    description:
      'A gentle pepper-like sharpness becomes a folded surface: compact, deliberate and slightly restless.',
    selected:
      'Spice is highlighted: an aubergine plane gathered into a close fold.',
    absent:
      'Spice is absent from this comparison. The close fold no longer holds tension between the other edges.',
    shareHelp: 'Changes the area and rhythm of the folded plane.',
  },
  {
    id: 'warmth',
    index: 2,
    name: 'Warmth',
    association: 'Dry wood',
    colour: 'Warm brown',
    hex: '#8A6750',
    shape: 'A low, porous plane',
    phrase: 'Warm, without weight.',
    description:
      'The quiet depth of dry wood becomes a low, finely porous surface: somewhere for the eye to rest.',
    selected:
      'Warmth is highlighted: a low, warm-brown plane with a fine, porous surface.',
    absent:
      'Warmth is absent from this comparison. The low brown plane no longer gives the composition a resting place.',
    shareHelp: 'Changes the area and depth of the low plane.',
  },
] as const;

export const PHASES = [
  {
    id: 'arrival',
    name: 'Arrival',
    description: 'The fine edge catches the eye. Every chosen part is already present.',
    announcement:
      'Arrival selected. The emphasis moves toward the fine ridge; the composition keeps every nonzero part.',
  },
  {
    id: 'unfolding',
    name: 'Unfolding',
    description: 'The fold comes forward. The parts begin to answer one another.',
    announcement:
      'Unfolding selected. The folded plane comes forward; the composition keeps every nonzero part.',
  },
  {
    id: 'afterglow',
    name: 'Trace',
    description: 'The low plane gives the eye a landing. The opening remains.',
    announcement:
      'Trace selected. The low plane becomes the resting point; the composition keeps every nonzero part.',
  },
] as const;

export const MEMORIES = [
  {
    id: 'window',
    title: 'At the new window',
    text:
      'The first evening after the move. Just-peeled pomelo rests on the sill. Nothing else has found its place.',
    titleSuggestion: 'The New Window',
    button: 'This feels closer',
    selected:
      'The new window is selected. The New Window is available as a title suggestion. Your visual shares have not changed.',
    alt:
      'A close view of fresh pomelo peel beside the edge of a windowsill, without a view of the room.',
  },
  {
    id: 'note',
    title: 'The unsent note',
    text:
      'An empty wooden drawer. A small note carries a date. It was never sent.',
    titleSuggestion: 'The Unsent Note',
    button: 'This feels closer',
    selected:
      'The unsent note is selected. The Unsent Note is available as a title suggestion. Your visual shares have not changed.',
    alt:
      'The corner of a paper note resting on the dry grain of an otherwise empty wooden drawer.',
  },
] as const;

export const CHAPTERS = [
  {
    id: 'ch-01',
    number: '01',
    navLabel: 'Before a name',
    title: 'Before a name',
    lead: 'An impression, before the words arrive.',
    body:
      'Three different edges hold one quiet opening. Stay with the whole for a moment. Then look at what gives it character.',
    note: SITE.mediumNotice,
    beats: [
      {
        title: 'Meet the whole',
        body: 'An uneven outline, a sheltered hollow and enough space to breathe.',
      },
      {
        title: 'Find the edges',
        body: 'A fine ridge. A close fold. A low, porous plane. Three ways to leave an impression.',
      },
    ],
    alt:
      'An asymmetrical impression in apricot yellow, aubergine and warm brown, with three distinct edges around one pale opening.',
  },
  {
    id: 'ch-02',
    number: '02',
    navLabel: 'The vocabulary',
    title: 'A vocabulary of edges',
    lead: 'A sharpness. A tension. A place to rest.',
    body:
      'Pomelo peel, a suggestion of pepper, dry wood. In this work, each association becomes a different kind of edge.',
    note: 'These are the descriptive choices of this work, not universal colours for scent.',
    beats: [
      {
        title: 'Begin with an association',
        body: 'Recall the sharpness of peel, the suggestion of pepper or the quiet depth of dry wood.',
      },
      {
        title: 'See its character',
        body: 'Choose a word to find its ridge, fold or low plane. Return to all three to see their relationship.',
      },
    ],
    alt:
      'Three distinct visual qualities: a thin yellow ridge for Brightness, an aubergine fold for Spice and a porous brown plane for Warmth.',
  },
  {
    id: 'ch-03',
    number: '03',
    navLabel: 'The stages',
    title: 'First, then, still',
    lead: 'Everything is here from the beginning.',
    body:
      'The emphasis moves across Arrival, Unfolding and Trace. Follow the same opening as different edges come forward.',
    note: 'An imagined time score, without a clock. These stages do not predict perfume evaporation.',
    beats: [
      {
        title: 'Together from the start',
        body: 'All three qualities belong to the original impression. None has to vanish for another to be seen.',
      },
      {
        title: 'A changing emphasis',
        body: 'Move between the three stages. Their balance changes while the same recognisable hollow remains.',
      },
    ],
    alt:
      'Arrival, Unfolding and Trace: three related impressions aligned to one baseline, with the same opening and a changing visual emphasis.',
  },
  {
    id: 'ch-04',
    number: '04',
    navLabel: 'The chord',
    title: 'One quiet chord',
    lead: 'Separate edges begin to make room for one another.',
    body:
      'The fine ridge turns around the fold. The low plane gives both a place to land. Together, they become After the Open Window.',
    note: 'A name for this original composition.',
    beats: [
      {
        title: 'Read the parts',
        body: 'Each quality holds a complete character when given room of its own.',
      },
      {
        title: 'Read the relationship',
        body: 'Bring the parts together. Their shared opening becomes as important as their surfaces.',
      },
    ],
    alt:
      'Three matte surfaces arranged into one chord: a yellow ridge turns around an aubergine fold above a low brown plane.',
  },
  {
    id: 'ch-05',
    number: '05',
    navLabel: 'Absence',
    title: 'The shape of absence',
    lead: 'Take one part away. Read what it was doing.',
    body:
      'Keep the complete impression beside a version with one quality absent. Compare their sharpness, tension and resting place.',
    note: 'A temporary visual comparison. Your personal composition stays unchanged.',
    beats: [
      {
        title: 'Make a space',
        body: 'Choose one quality to remove. Its place remains open; another quality does not fill it in.',
      },
      {
        title: 'Compare the whole',
        body: 'The complete version stays at the same scale. Restore all three whenever you want to begin again.',
      },
    ],
    alt:
      'Two impressions at the same scale: the complete composition and a comparison with one chosen surface removed.',
  },
  {
    id: 'ch-06',
    number: '06',
    navLabel: 'Distance',
    title: 'After you leave',
    lead: 'A presence becomes a trace.',
    body:
      'Look from three imagined distances. Fine details recede along the path, while the outline remains available to follow.',
    note: 'Visual distance only. There are no measured metres or diffusion estimates.',
    beats: [
      {
        title: 'Close enough for detail',
        body: 'At the near point, you can read the fine ridge, the tight fold and the small pores.',
      },
      {
        title: 'Far enough for structure',
        body: 'Follow the path outward. The impression grows quieter, but its familiar opening still leads the eye.',
      },
    ],
    alt:
      'A continuous pale path connects near, middle and far impressions; details recede while the recurring opening stays recognisable.',
  },
  {
    id: 'ch-07',
    number: '07',
    navLabel: 'Two memories',
    title: 'One impression. Two memories.',
    lead: 'The composition stays. The story around it changes.',
    body:
      'A new window. An unsent note. Two invented fragments can gather around the same three qualities.',
    note: 'Choose the fragment that feels closer, or leave both open. It suggests a title, not a personality.',
    beats: [
      { title: MEMORIES[0].title, body: MEMORIES[0].text },
      { title: MEMORIES[1].title, body: MEMORIES[1].text },
    ],
    alt:
      'Two intimate fragments, pomelo peel by a new window and an unsent note in a wooden drawer, share one unchanged impression.',
  },
  {
    id: 'ch-08',
    number: '08',
    navLabel: 'The whole trace',
    title: 'The whole of what remains',
    lead: 'Now the empty space becomes the path.',
    body:
      'Arrival, Unfolding and Trace meet along one unbroken opening. Follow the edge you already know as its relationships change.',
    note: 'Select a stage to see its place in the whole, then return to the complete view.',
    beats: [
      {
        title: 'Follow one opening',
        body: 'The pale path passes through three related impressions, carrying the eye from one emphasis to the next.',
      },
      {
        title: 'Take in the whole',
        body: 'From farther back, dense surfaces and open space become a single continuous composition.',
      },
    ],
    alt:
      'A long, layered composition in which one pale path threads through the Arrival, Unfolding and Trace impressions.',
  },
  {
    id: 'ch-09',
    number: '09',
    navLabel: 'Your version',
    title: 'Your version',
    lead: 'Give these three qualities a different balance.',
    body:
      'Shift the visual shares. Watch area, edge and depth respond, then see your impression across all three stages.',
    note: 'Visual parameters only. The three shares always total 100.',
    beats: [
      {
        title: 'Change the balance',
        body: 'Adjust one share. The other two divide the space that remains, keeping their existing proportion where possible.',
      },
      {
        title: 'Give it a name',
        body: 'Use a suggested title or write your own. Carry this same composition through Arrival, Unfolding and Trace.',
      },
    ],
    alt:
      'An editable impression whose surface areas, edge rhythms and depths respond to the Brightness, Spice and Warmth shares.',
  },
  {
    id: 'ch-10',
    number: '10',
    navLabel: 'What remains',
    title: 'What remains',
    lead: 'What remains is what you chose to leave.',
    body:
      'Set your impression beside the one we began with. Keep its title, its balance and its path as an image of your own.',
    note: 'The image includes your current title and visual shares.',
    beats: [
      {
        title: 'Look back',
        body: 'The first impression and your current version share a scale and a familiar opening.',
      },
      {
        title: 'Keep a trace',
        body: 'Save your composition as a PNG, return to a chapter or give it another shape.',
      },
    ],
    alt:
      'The initial and current impressions at the same scale, followed by a complete path of the current composition with its title and visual shares.',
  },
] as const satisfies readonly ChapterCopy[];

export const UI = {
  navigation: {
    label: 'Chapter navigation',
    open: 'Chapters',
    close: 'Close chapters',
    skip: 'Skip to the essay',
    begin: 'Meet the three qualities',
    compose: 'Make your version',
    top: 'Return to the beginning',
    next: 'Next chapter',
    previous: 'Previous chapter',
  },
  legend: {
    label: 'Explore the visual vocabulary',
    all: 'Show all three',
    restored: 'All three qualities are visible together.',
  },
  chord: {
    label: 'View the chord',
    apart: 'Apart',
    together: 'Together',
    apartResult: 'Three distinct surfaces, with room between them. The visual shares are unchanged.',
    togetherResult: 'Three edges now frame one opening. The visual shares are unchanged.',
  },
  subtraction: {
    label: 'Temporarily remove one quality',
    complete: 'Complete',
    comparison: 'One part absent',
    restore: 'Restore all three',
    restored: 'The complete comparison is restored. Your personal composition has not changed.',
  },
  distance: {
    label: 'Choose a visual distance',
    near: 'Near',
    middle: 'Middle',
    far: 'Far',
    nearResult: 'Near view selected. Fine edges, folds and pores are most distinct.',
    middleResult: 'Middle view selected. Local detail recedes while the outline remains.',
    farResult: 'Far view selected. The structure and its opening carry the impression.',
  },
  memories: {
    label: 'Choose an optional memory fragment',
    clear: 'Leave both open',
    cleared: 'No memory is selected. Your visual shares are unchanged.',
    ratioNote: 'Same impression. Same visual shares.',
    suggestionLabel: 'Suggested title',
    useSuggestion: 'Use this title',
  },
  panorama: {
    label: 'Explore the whole trace',
    all: 'The whole trace',
    restored: 'The complete view is restored. All three stages share one path.',
  },
  editor: {
    label: 'Compose your visual impression',
    proportions: 'Visual shares',
    percentage: 'Percent',
    total: 'Total',
    presetLabel: 'Starting points',
    reset: 'Restore the original',
    resetResult: 'The original composition is restored: Brightness 45%, Spice 20%, Warmth 35%.',
    titleLabel: 'Name your impression',
    titlePlaceholder: 'After the Open Window',
    titleHelp: 'A short title of your own, up to 64 characters.',
    rangeHelp: 'Choose a whole number from 0 to 100. The other two shares adjust to keep the total at 100.',
    original: 'Where we began',
    current: 'Your impression',
    stageLabel: 'See your composition in each stage',
    revisit: 'Compose again',
  },
  export: {
    button: 'Save PNG',
    working: 'Preparing your image…',
    ready: 'Your PNG is ready to download.',
    failed: 'The image could not be prepared. Please try again.',
    subtitle: 'An original visual interpretation',
    shares: 'Visual shares',
    untitled: 'Your impression',
  },
  motion: {
    still: 'Use still mode',
    animate: 'Use gentle motion',
    paused: 'Still mode is on. All chapters and controls remain available.',
    resumed: 'Gentle motion is on.',
  },
  resources: {
    imageFallback: 'The artwork is shown in its simplified form while the detailed image is unavailable.',
    fontFallback: 'The page is using its built-in font fallback.',
    storageUnavailable: 'Your composition works here, but this browser could not save it for your next visit.',
  },
  about: {
    title: 'About this work',
    sources: 'Concept sources',
    close: 'Close about this work',
  },
} as const;

export const SOURCE_LINKS = [
  {
    label: 'NIDCD',
    title: 'The Journey of Smell to the Brain',
    url: 'https://www.nidcd.nih.gov/news/multimedia/journey-of-smell-to-brain-text-version',
    scope: 'Background on biological smell; no visual-to-scent equivalence is claimed.',
  },
  {
    label: 'Fragonard',
    title: 'One example of top, heart and base note grouping',
    url: 'https://www.fragonard.com/en-int/fragonard/fragonard-p-2906-o-1492.htm',
    scope: 'A reference for grouping qualities; the product and its ingredients are not reproduced.',
  },
] as const;

/** Use this as a text alternative or an aria-live result after a deliberate edit. */
export function shareSummary(shares: readonly [number, number, number]): string {
  return `Brightness ${shares[0]}%, Spice ${shares[1]}%, Warmth ${shares[2]}%.`;
}
