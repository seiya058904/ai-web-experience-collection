/** Scientific content reviewed on 2026-11-09. Artwork is illustrative. */
export const reviewedDate = '2026-11-09';

export const sources = [
  { id: 'fws', title: 'U.S. Fish & Wildlife Service — Monarch species profile', url: 'https://www.fws.gov/species/monarch-danaus-plexippus', reviewedDate, scope: 'Species identity, milkweed, life stages and habitat.' },
  { id: 'mjv-life', title: 'Monarch Joint Venture — Life Cycle', url: 'https://monarchjointventure.org/monarch-biology/life-cycle', reviewedDate, scope: 'Instar identification, late pigmentation and emergence.' },
  { id: 'mjv-growth', title: 'Monarch Joint Venture — Growth and Development', url: 'https://monarchjointventure.org/monarch-biology/growth-and-development', reviewedDate, scope: 'Molting, continuous development and environmental variation.' },
  { id: 'mjv-host', title: 'Monarch Joint Venture — Why Milkweed?', url: 'https://monarchjointventure.org/monarch-biology/why-milkweed', reviewedDate, scope: 'Specialized larval feeding on milkweed.' },
  { id: 'watch-biology', title: 'Monarch Watch — Monarch Biology', url: 'https://www.monarchwatch.org/biology/', reviewedDate, scope: 'Egg structure, larval anatomy and chrysalis attachment.' },
  { id: 'mjv-pupation', title: 'Monarch Joint Venture — Why do I not see many pupae?', url: 'https://monarchjointventure.org/faq/mowing-habitat-management/why-dont-i-see-many-pupae', reviewedDate, scope: 'Movement away from the feeding plant before pupation.' },
  { id: 'western-biology', title: 'Western Monarch Milkweed Mapper — Western Monarch Biology', url: 'https://www.monarchmilkweedmapper.org/western-monarch-biology/', reviewedDate, scope: 'Life cycle and temperature-dependent development.' },
];

export const hero = {
  title: 'Everything changes from here.',
  lead: 'Beneath a single milkweed leaf, a life begins in a form almost too small to see.',
  cta: 'Begin the transformation',
  alt: 'A ridged monarch butterfly egg attached to the underside of a green milkweed leaf, seen at intimate macro scale.',
};

export const chapters = [
  {
    id: 'ch-01', number: 1, title: 'An Egg in the Green',
    heading: 'The smallest beginning.', kicker: '01 / Egg',
    lead: 'A monarch begins as a tiny egg, placed on milkweed where the next stage can feed.',
    beats: [
      { title: 'A world beneath a leaf', body: 'Look for the point where the pearl-colored egg meets the leaf. The plant is already part of this life.' },
      { title: 'A surface with structure', body: 'The ridged casing is called the chorion. Its small, raised lines belong to an eggshell, not a smooth glass sphere.' },
    ],
    notes: 'Danaus plexippus · Monarch butterfly. The view is enlarged; no measurement is implied.',
    sources: ['fws', 'watch-biology'],
    illustrationNote: 'AI-assisted natural-history illustration. This is an imagined individual, not a photograph or a recorded observation.',
  },
  {
    id: 'ch-02', number: 2, title: 'Milkweed, the Host',
    heading: 'The plant is part of the story.', kicker: '02 / Habitat',
    lead: 'Milkweed is not background decoration: it is the food plant for monarch caterpillars.',
    beats: [
      { title: 'Follow the vein', body: 'The same marked leaf leads into the larger plant. What looked like a vast green landscape is a small part of the habitat.' },
      { title: 'A place to begin', body: 'Milkweed supports the larval stage. Later, the adult will seek nectar from flowers: one habitat must serve different needs.' },
    ],
    notes: 'The illustrated milkweed is a habitat reference, not a plant-identification guide.',
    sources: ['fws', 'mjv-host'],
    illustrationNote: 'A composed botanical setting. Leaf geometry and scale changes guide the story.',
  },
  {
    id: 'ch-03', number: 3, title: 'The Shell Opens',
    heading: 'A first opening.', kicker: '03 / Hatching',
    lead: 'The casing that protected the egg is left behind as the caterpillar enters the leaf world.',
    beats: [
      { title: 'The edge gives way', body: 'Observe the opening in the shell before looking for the animal. The leaf stays fixed while the first small movement changes the scene.' },
      { title: 'A larva, newly here', body: 'The hatchling remains tiny beside the casing. A young monarch also eats its eggshell before continuing to its host plant.' },
    ],
    notes: 'Three selected illustrated poses describe an event; they do not measure its duration.',
    sources: ['watch-biology'],
    illustrationNote: 'Hatching is shown as an authored sequence of distinct poses, not recorded time-lapse footage.',
  },
  {
    id: 'ch-04', number: 4, title: 'The First Meal',
    heading: 'The first bite of a new life.', kicker: '04 / Feeding',
    lead: 'Growth is built from the leaf the young caterpillar is adapted to eat.',
    beats: [
      { title: 'At the mouth', body: 'Find the feeding point beside the head. The altered leaf margin records a local action, not damage scattered across the scene.' },
      { title: 'A small absence', body: 'Compare the two views. The same leaf and young larva remain; a crescent of missing tissue makes the feeding visible.' },
    ],
    notes: 'The comparison illustrates feeding. It does not represent a measured meal or a fixed feeding rate.',
    sources: ['mjv-life', 'mjv-host'],
    illustrationNote: 'The before-and-after leaf edge is a controlled illustration; it is not a behavioral experiment.',
  },
  {
    id: 'ch-05', number: 5, title: 'Five Instars',
    heading: 'Growth has five chapters of its own.', kicker: '05 / Growth',
    lead: 'Between molts the caterpillar changes proportions and markings, becoming more capable of feeding.',
    beats: [
      { title: 'Growth between molts', body: 'An instar is a larval stage between molts. Monarchs pass through five; shedding the old cuticle allows growth to continue.' },
      { title: 'Look beyond size', body: 'Compare the head, bands and filaments. Select each specimen to see the differences, then bring all five back into view.' },
    ],
    notes: 'Comparative illustrations show identifying features. Their display sizes are not a measured scale.',
    sources: ['mjv-growth', 'mjv-life'],
    illustrationNote: 'Five separately drawn specimens represent the same species at different instars. They are not five copies of one scaled image.',
  },
  {
    id: 'ch-06', number: 6, title: 'A Place to Hang',
    heading: 'The body chooses a still point.', kicker: '06 / Preparation',
    lead: 'Before becoming a chrysalis, the caterpillar secures itself and hangs in a characteristic J shape.',
    beats: [
      { title: 'A new place', body: 'A mature larva usually leaves its feeding milkweed to find a pupation site. Here, a nearby support keeps the habitat in view.' },
      { title: 'The point of contact', body: 'The attachment matters as much as the pose. A silk pad supports the hanging animal; the plant, pad and gravity stay aligned.' },
    ],
    notes: 'Observe wild larvae and pupae without moving or handling them.',
    sources: ['mjv-pupation', 'watch-biology'],
    illustrationNote: 'The nearby support is a narrative setting. Remaining beside the original milkweed is not a claim about every monarch.',
  },
  {
    id: 'ch-07', number: 7, title: 'The Jade Vessel',
    heading: 'A new surface appears.', kicker: '07 / Pupation',
    lead: 'As the larval skin is shed, a chrysalis becomes the visible shelter for the next stage.',
    beats: [
      { title: 'The final larval skin', body: 'The chrysalis emerges from beneath the shed larval skin. The two surfaces are distinct, though the hanging support stays in place.' },
      { title: 'Still attached', body: 'The cremaster, a small structure at the rear of the pupa, anchors it to the silk. Green and gold now define the exterior.' },
    ],
    notes: 'Chrysalis means the butterfly pupa. This is not a spun cocoon.',
    sources: ['watch-biology', 'fws'],
    illustrationNote: 'Selected pupation poses simplify a complex physical event. The gold marks are natural details, not ornaments.',
  },
  {
    id: 'ch-08', number: 8, title: 'Inside the Change',
    heading: 'The change is continuous.', kicker: '08 / Development',
    lead: 'The adult develops through real living tissue; the cutaway is an explanatory reconstruction.',
    beats: [
      { title: 'An exterior reference', body: 'Begin with the intact chrysalis. Keep its outline and attachment in mind before switching to the explanatory view.' },
      { title: 'Development already under way', body: 'Adult structures begin developing during larval life. Wing growth and flight-muscle development continue in the pupa; the animal does not simply dissolve into nothing.' },
    ],
    notes: 'Illustrative reconstruction · simplified structures, not microscopy, dissection or a complete anatomical map.',
    sources: ['mjv-growth'],
    illustrationNote: 'The cutaway deliberately reveals an explanatory drawing. Transparency belongs to the illustration, not to a claim of direct observation.',
  },
  {
    id: 'ch-09', number: 9, title: 'A Pattern Beneath',
    heading: 'The pattern begins to show.', kicker: '09 / Maturation',
    lead: 'Late in the pupal stage, the darkening surface hints at the wings held inside.',
    beats: [
      { title: 'Hold the outline', body: 'Compare early and late appearances at the same attachment. The casing remains present as the color beneath it changes.' },
      { title: 'Color, coming into view', body: 'Late wing-scale pigmentation makes the pattern visible through the covering. The chrysalis has not become an empty glass vessel.' },
    ],
    notes: 'Temperature and other conditions affect development. This scene supplies no universal countdown.',
    sources: ['mjv-life', 'western-biology'],
    illustrationNote: 'Matched illustrations describe the change in appearance; they are not a diagnostic guide for a living pupa.',
  },
  {
    id: 'ch-10', number: 10, title: 'Emergence',
    heading: 'The first time the wings unfold.', kicker: '10 / Emergence',
    lead: 'The adult leaves the chrysalis; its wings must expand and settle before flight.',
    beats: [
      { title: 'Free of the casing', body: 'First, follow the adult leaving the shell. Hanging beneath the spent casing is a separate moment from being ready to fly.' },
      { title: 'Room for the wings', body: 'Fluid expands the wings after emergence. The new adult remains hanging while they unfold and dry.' },
    ],
    notes: 'Leaving the shell · Wings unfolding · Ready for flight. These are selected stages, not equal time intervals.',
    sources: ['mjv-life'],
    illustrationNote: 'The emergence sequence uses authored poses. Wing shape changes are explanatory and do not reproduce a measured time-lapse.',
  },
  {
    id: 'ch-11', number: 11, title: 'First Flight',
    heading: 'The leaf remains.', kicker: '11 / Continuation',
    lead: 'What began beneath one leaf can now cross the meadow; the cycle continues beyond this one butterfly.',
    beats: [
      { title: 'A different way to move', body: 'The settled wings carry the individual beyond the frame. The original plant remains, linking the adult to its beginning.' },
      { title: 'Four stages, one life cycle', body: 'Egg. Larva. Pupa. Adult. Return to any chapter to compare the forms and the different needs each stage brings to a habitat.' },
    ],
    notes: 'This ending follows one imagined monarch. It makes no claim about a migration route or a particular generation.',
    sources: ['fws', 'mjv-host'],
    illustrationNote: 'The departure is a quiet narrative resolution in an illustrative habitat, not documentary footage.',
  },
];

export const instars = [
  { number: 1, label: 'Instar 1', title: 'A pale beginning', description: 'Pale body, dark head and scarcely visible filaments.' },
  { number: 2, label: 'Instar 2', title: 'Bands emerge', description: 'Clearer banding; a yellow head triangle becomes recognizable.' },
  { number: 3, label: 'Instar 3', title: 'A stronger pattern', description: 'Darker abdominal bands and longer filaments.' },
  { number: 4, label: 'Instar 4', title: 'More definition', description: 'Distinct thoracic bands and more conspicuous proleg spots.' },
  { number: 5, label: 'Instar 5', title: 'The final larval stage', description: 'A plumper body with broad black bands and clear white proleg dots.' },
];

export const emergenceStages = [
  { id: 'leaving', label: 'Leaving the shell', description: 'The adult pulls free; the wings remain folded close to the body.' },
  { id: 'unfolding', label: 'Wings unfolding', description: 'The adult hangs as its wings expand, keeping the empty casing above.' },
  { id: 'ready', label: 'Ready for flight', description: 'The wings have expanded and settled. The next scene widens into the habitat.' },
];

export const aboutText = 'CHRYSALIS follows one imagined monarch through a researched life cycle. AI-assisted artwork and authored diagrams interpret the biology; they are not photographs, microscopy or measured time-lapse records. The recurring leaf and support are a composed habitat. Development varies with conditions. Sources were reviewed on 9 November 2026.';
