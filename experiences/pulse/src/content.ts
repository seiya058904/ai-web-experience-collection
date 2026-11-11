/**
 * PULSE editorial content.
 * Source review: 2026-11-09. Educational reconstructions, not patient data.
 * The source list supports factual copy; it does not license source artwork.
 */
export interface Source {
  id: string;
  title: string;
  organization: string;
  url: string;
  scope: string;
  reviewed: string;
}

export interface ContentBeat {
  title: string;
  body: string;
}

export interface InteractionOption {
  value: string;
  label: string;
  result: string;
}

export interface Chapter {
  id: string;
  number: number;
  slug: string;
  shortTitle: string;
  title: string;
  lead: string;
  beats: [ContentBeat, ContentBeat];
  sourceIds: string[];
  diagramNote: string;
  interaction: {
    title: string;
    description: string;
    options: InteractionOption[];
    initialValue: string;
    resetLabel: string;
  };
}

export const sources: Source[] = [
  {
    id: 'nhlbi-anatomy',
    title: 'What the Heart Looks Like',
    organization: 'NIH / NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/heart/anatomy',
    scope: 'Chambers, septum, myocardium and the location of the heart.',
    reviewed: '2026-11-09',
  },
  {
    id: 'nhlbi-flow',
    title: 'How Blood Flows through the Heart',
    organization: 'NIH / NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow',
    scope: 'Valves, venae cavae, pulmonary and systemic circulation.',
    reviewed: '2026-11-09',
  },
  {
    id: 'nhlbi-beat',
    title: 'How the Heart Beats',
    organization: 'NIH / NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/heart/heart-beats',
    scope: 'SA node, AV node, contraction sequence and heart sounds.',
    reviewed: '2026-11-09',
  },
  {
    id: 'aha-heart',
    title: 'How the Healthy Heart Works',
    organization: 'American Heart Association',
    url: 'https://www.heart.org/en/health-topics/congenital-heart-defects/about-congenital-heart-defects/how-the-healthy-heart-works',
    scope: 'Four chambers, four valves and the order of the circulation.',
    reviewed: '2026-11-09',
  },
  {
    id: 'nhlbi-lungs',
    title: 'What Breathing Does for the Body',
    organization: 'NIH / NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/lungs/breathing-benefits',
    scope: 'Oxygen and carbon dioxide move across the alveolar-capillary interface.',
    reviewed: '2026-11-09',
  },
  {
    id: 'aha-valves',
    title: 'Heart Valve Anatomy',
    organization: 'American Heart Association',
    url: 'https://watchlearnlive.heart.org/index.php?moduleSelect=anatom',
    scope: 'Atrioventricular and semilunar valves; chordae and papillary muscles.',
    reviewed: '2026-11-09',
  },
  {
    id: 'nci-structure',
    title: 'Structure of the Heart',
    organization: 'NIH / National Cancer Institute',
    url: 'https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html',
    scope: 'Muscular wall, chamber roles and valve attachment relationships.',
    reviewed: '2026-11-09',
  },
  {
    id: 'nci-vessels',
    title: 'Classification & Structure of Blood Vessels',
    organization: 'NIH / National Cancer Institute',
    url: 'https://training.seer.cancer.gov/anatomy/cardiovascular/blood/classification.html',
    scope: 'Arteries lead away from the heart; veins return; capillaries connect them.',
    reviewed: '2026-11-09',
  },
  {
    id: 'ventricular-review',
    title: 'The Right Ventricle: From Embryologic Development to RV Failure',
    organization: 'Current Heart Failure Reports / PubMed Central',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9818027/',
    scope: 'Normal right and left ventricular structural differences; qualitative wall comparison only.',
    reviewed: '2026-11-09',
  },
  {
    id: 'blood-color',
    title: 'Measurement of Oxygen',
    organization: 'Clinical Methods / NCBI Bookshelf',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK54107/',
    scope: 'Oxygenated blood is bright red; deoxygenated blood is a deeper red.',
    reviewed: '2026-11-09',
  },
];

export const heroCopy = {
  brand: 'PULSE',
  subtitle: 'An atlas of one heartbeat',
  title: 'Every beat has a direction.',
  lead: 'A guided journey through the chambers, signals and pathways that keep blood moving.',
  cta: 'Enter the heart',
  alt: 'An anatomical human heart in a dark museum setting, with muscle walls, vessels and a carefully illustrated partial section.',
  metaDescription: 'Explore the human heart through an illustrated anatomical journey across chambers, valves, signals and blood circulation.',
};

export const sharedNotes = {
  orientation: 'Anterior view. Anatomical right appears on your left; anatomical left appears on your right.',
  illustration: 'An authored anatomical illustration, not a patient scan.',
  diagram: 'Schematic anatomy. Shapes and distances are simplified for explanation.',
  bloodColor: 'Oxygen-poor blood is dark red. Slate blue is a diagram convention, not the color of blood.',
  timing: 'The route explains where blood travels. It does not show a complete circulation in one heartbeat.',
  electrical: 'Electrical activation coordinates contraction. It follows heart tissue, not the blood vessels.',
  sound: 'An original sound illustration inspired by valve closure. It is not a recording, measurement or diagnostic signal.',
  scope: 'An educational anatomy exhibition. It does not measure your heart or provide a personal health assessment.',
  review: 'Factual sources reviewed on November 9, 2026. The illustrations have not undergone independent clinical validation.',
};

export const chamberDescriptions: Record<string, string> = {
  ra: 'The right atrium receives oxygen-poor blood returning from the body through the venae cavae.',
  rv: 'The right ventricle sends blood through the pulmonary valve toward the lungs.',
  la: 'The left atrium receives oxygen-rich blood returning from the lungs through the pulmonary veins.',
  lv: 'The left ventricle sends blood through the aortic valve into the systemic circulation.',
  all: 'Two atria receive blood. Two ventricles send it onward. The septum separates the right and left sides.',
};

export const chapters: Chapter[] = [
  {
    id: 'CH-01', number: 1, slug: 'living-form', shortTitle: 'The Living Form',
    title: 'Not a symbol. An organ.',
    lead: 'Behind the familiar rhythm is a living structure with walls, vessels and a very specific shape.',
    beats: [
      { title: 'A muscle with an architecture', body: 'The heart sits between the lungs, with much of its mass left of the body\'s midline. Its irregular outline belongs to a muscular pump: receiving chambers above, pumping chambers below, and great vessels at the crown.' },
      { title: 'A surface with an inside', body: 'The myocardium forms the working muscle. A cutaway lets us look past the outer contour into the chambers while keeping the organ\'s orientation fixed. The shape is an illustration; the chamber relationships are the guide.' },
    ],
    sourceIds: ['nhlbi-anatomy', 'nci-structure'],
    diagramNote: 'Anterior orientation stays fixed throughout the heart plates. The section is an explanatory reconstruction.',
    interaction: {
      title: 'Orientation', description: 'Locate the person\'s right and left without rotating the organ.',
      initialValue: 'all', resetLabel: 'Reset view',
      options: [
        { value: 'right', label: 'Anatomical right', result: 'The person\'s right appears on your left in this anterior view.' },
        { value: 'left', label: 'Anatomical left', result: 'The person\'s left appears on your right in this anterior view.' },
      ],
    },
  },
  {
    id: 'CH-02', number: 2, slug: 'four-chambers', shortTitle: 'Four Chambers',
    title: 'Four rooms, two directions.',
    lead: 'The atria receive blood. The ventricles send it onward. A septum separates the sides.',
    beats: [
      { title: 'Receive above. Send below.', body: 'The right atrium receives the body\'s returning blood; the left atrium receives blood from the lungs. Each leads to the ventricle below it. The right ventricle serves the lungs, while the left serves the body.' },
      { title: 'A dividing wall', body: 'The atrial and ventricular septa keep the right and left sides separate in a healthy heart. The ventricular walls are muscular; the left ventricular wall is thicker than the right. The section makes these relationships visible without reversing them.' },
    ],
    sourceIds: ['nhlbi-anatomy', 'aha-heart', 'ventricular-review'],
    diagramNote: 'Anterior cutaway. Chamber depth and size are simplified; the septum remains visible.',
    interaction: {
      title: 'Name the chambers', description: 'Select a chamber to reveal its position and job.',
      initialValue: 'all', resetLabel: 'Reset view',
      options: [
        { value: 'ra', label: 'Right atrium', result: chamberDescriptions.ra },
        { value: 'rv', label: 'Right ventricle', result: chamberDescriptions.rv },
        { value: 'la', label: 'Left atrium', result: chamberDescriptions.la },
        { value: 'lv', label: 'Left ventricle', result: chamberDescriptions.lv },
      ],
    },
  },
  {
    id: 'CH-03', number: 3, slug: 'the-signal', shortTitle: 'The Signal',
    title: 'Before the push, a signal.',
    lead: 'An electrical pattern coordinates atria and ventricles; it is not the path the blood takes.',
    beats: [
      { title: 'Begin in the right atrium', body: 'A normal electrical impulse begins in the sinoatrial node, in the right atrium. Activation spreads through the atria and helps coordinate their contraction. These marks describe electrical activity in tissue, not a stream of blood.' },
      { title: 'A pause before the ventricles', body: 'Conduction slows at the atrioventricular node, allowing time for ventricular filling. The signal then travels through the ventricular conduction system so the ventricles can contract. This sequence and the circulation route have different meanings and timescales.' },
    ],
    sourceIds: ['nhlbi-beat'],
    diagramNote: 'Gold dotted marks show electrical activation. Arrowed routes show circulation. The timing is explanatory, not an ECG.',
    interaction: {
      title: 'Two different pathways', description: 'Compare electrical activation with blood transport.',
      initialValue: 'electrical', resetLabel: 'Reset view',
      options: [
        { value: 'electrical', label: 'Electrical sequence', result: 'SA node → atrial activation → AV-node delay → ventricular conduction. This is a tissue signal.' },
        { value: 'blood', label: 'Blood pathway', result: 'Blood enters chambers and leaves through vessels. It does not travel through the conduction nodes.' },
        { value: 'both', label: 'Both', result: 'The dotted signal and the arrowed blood route are separate overlays. They are not one shared clock.' },
      ],
    },
  },
  {
    id: 'CH-04', number: 4, slug: 'the-return', shortTitle: 'The Return',
    title: 'A return from the body.',
    lead: 'Blood returning from tissues enters the right atrium through large veins.',
    beats: [
      { title: 'Two major entrances', body: 'The superior vena cava returns blood from the upper body. The inferior vena cava returns blood from below. Both enter the right atrium. After supplying tissues, this returning blood contains less oxygen; it is still red.' },
      { title: 'Through the tricuspid valve', body: 'Blood passes from the right atrium through the tricuspid valve into the right ventricle. The valve sits at this chamber boundary. Its position matters: it is neither a passage to the left heart nor the outlet to the lungs.' },
    ],
    sourceIds: ['nhlbi-flow', 'aha-heart', 'blood-color'],
    diagramNote: 'Arrowheads indicate direction. Slate accents identify the oxygen-poor route; actual blood is dark red.',
    interaction: {
      title: 'Trace the return', description: 'Follow the successive landmarks from the body into the right ventricle.',
      initialValue: 'body', resetLabel: 'Reset',
      options: [
        { value: 'body', label: 'From the body', result: 'Systemic veins collect blood after exchange in the body\'s tissues.' },
        { value: 'cavae', label: 'Venae cavae', result: 'The superior and inferior vena cava both open into the right atrium.' },
        { value: 'ra', label: 'Right atrium', result: 'The receiving chamber leads to the tricuspid valve.' },
        { value: 'rv', label: 'Right ventricle', result: 'Blood crosses the tricuspid valve to enter the right ventricle.' },
      ],
    },
  },
  {
    id: 'CH-05', number: 5, slug: 'one-way-gates', shortTitle: 'One-Way Gates',
    title: 'Doors that answer to pressure.',
    lead: 'Four valves open and close with changing pressure, keeping the circulation moving forward.',
    beats: [
      { title: 'Between receiving and pumping', body: 'The tricuspid valve lies between the right atrium and ventricle; the mitral lies between the left pair. Their leaflets are supported by chordae attached to papillary muscles. These supports help keep the leaflets from turning back into the atria.' },
      { title: 'At the two exits', body: 'The pulmonary valve guards the right ventricular outlet; the aortic valve guards the left. Their pocketlike semilunar cusps close against returning blood. The inlet and outlet groups work at different phases; the four valves are not all open together.' },
    ],
    sourceIds: ['nhlbi-flow', 'aha-valves', 'nci-structure'],
    diagramNote: 'Comparative valve plates show structure, not simultaneous opening. Outflow valves have no chordae.',
    interaction: {
      title: 'Compare the valve families', description: 'Switch between the chamber entrances and ventricular exits.',
      initialValue: 'av', resetLabel: 'Reset',
      options: [
        { value: 'av', label: 'Atrioventricular valves', result: 'Tricuspid: right atrium → right ventricle. Mitral: left atrium → left ventricle. Chordae support the leaflets.' },
        { value: 'outflow', label: 'Outflow valves', result: 'Pulmonary: right ventricle → pulmonary trunk. Aortic: left ventricle → aorta. Three pocketlike cusps guard each normal outlet.' },
      ],
    },
  },
  {
    id: 'CH-06', number: 6, slug: 'toward-the-lungs', shortTitle: 'Toward the Lungs',
    title: 'The short journey outward.',
    lead: 'From the right ventricle, blood crosses the pulmonary valve and travels to the lungs.',
    beats: [
      { title: 'One outlet, two lungs', body: 'The right ventricle sends blood through the pulmonary valve into the pulmonary trunk. The route branches toward the right and left lungs. The vessel is an artery because it carries blood away from the heart.' },
      { title: 'Toward a smaller scale', body: 'Within the lungs, the branches lead to capillaries surrounding tiny air sacs. At the next plate we change scale deliberately: a magnified diagram shows the blood vessel beside the alveolus, while keeping blood and air in separate spaces.' },
    ],
    sourceIds: ['nhlbi-flow', 'nhlbi-lungs', 'nci-vessels'],
    diagramNote: 'Schematic pulmonary route. This is oxygen-poor blood traveling away from the heart.',
    interaction: {
      title: 'Follow this branch', description: 'Highlight either pulmonary branch without changing flow direction.',
      initialValue: 'both', resetLabel: 'Reset',
      options: [
        { value: 'right-lung', label: 'To the right lung', result: 'Right ventricle → pulmonary valve → pulmonary trunk → right pulmonary artery.' },
        { value: 'left-lung', label: 'To the left lung', result: 'Right ventricle → pulmonary valve → pulmonary trunk → left pulmonary artery.' },
        { value: 'both', label: 'Show both', result: 'Both pulmonary arterial branches carry oxygen-poor blood toward the lungs.' },
      ],
    },
  },
  {
    id: 'CH-07', number: 7, slug: 'exchange', shortTitle: 'Exchange',
    title: 'Where air meets blood—across a barrier.',
    lead: 'Oxygen and carbon dioxide move between alveolar air and the blood through thin tissue layers.',
    beats: [
      { title: 'Close, but separate', body: 'An alveolus contains air. The adjacent capillary contains blood. Their thin tissue barrier allows gases to diffuse between these compartments. Red blood cells remain inside the capillary; the alveolar space is not a blood vessel.' },
      { title: 'Two opposing directions', body: 'Oxygen moves from alveolar air into the blood, where hemoglobin carries it. Carbon dioxide moves from blood toward the air to be breathed out. The arrows show these net directions, not visible particles or a measured rate of exchange.' },
    ],
    sourceIds: ['nhlbi-lungs'],
    diagramNote: 'Schematic scale. The membrane is enlarged for legibility. This is an illustration, not microscopy.',
    interaction: {
      title: 'Gas-exchange direction', description: 'Read each arrow across the same tissue barrier.',
      initialValue: 'both', resetLabel: 'Reset',
      options: [
        { value: 'oxygen', label: 'Oxygen into blood', result: 'Oxygen: alveolar air → tissue barrier → capillary blood.' },
        { value: 'carbon', label: 'Carbon dioxide toward air', result: 'Carbon dioxide: capillary blood → tissue barrier → alveolar air.' },
        { value: 'both', label: 'Show both', result: 'Oxygen enters blood while carbon dioxide moves toward air. Blood and air remain physically separate.' },
      ],
    },
  },
  {
    id: 'CH-08', number: 8, slug: 'the-way-back', shortTitle: 'The Way Back',
    title: 'The return is different now.',
    lead: 'From the lungs, pulmonary veins carry oxygen-rich blood into the left side of the heart.',
    beats: [
      { title: 'A vein can carry oxygen-rich blood', body: 'After exchange in the lung capillaries, blood collects into pulmonary veins and returns to the left atrium. A vein is named for its direction toward the heart, not for how much oxygen its blood contains.' },
      { title: 'The left-sided entrance', body: 'Blood moves from the left atrium through the mitral valve into the left ventricle. The two returns have different destinations: systemic veins enter the right atrium, pulmonary veins the left. The septum keeps these sides distinct.' },
    ],
    sourceIds: ['nhlbi-flow', 'aha-heart', 'nci-vessels'],
    diagramNote: 'Anterior cutaway. Pulmonary veins enter the left atrium posteriorly; their connections are exposed schematically.',
    interaction: {
      title: 'Compare the two returns', description: 'Keep the same orientation while comparing the receiving chambers.',
      initialValue: 'pulmonary', resetLabel: 'Reset',
      options: [
        { value: 'systemic', label: 'From body', result: 'Body tissues → systemic veins → venae cavae → right atrium. This return is oxygen-poor.' },
        { value: 'pulmonary', label: 'From lungs', result: 'Lung capillaries → pulmonary veins → left atrium → mitral valve → left ventricle. This return is oxygen-rich.' },
        { value: 'both', label: 'Show both returns', result: 'Both routes return blood to the heart. They enter different atria and carry different oxygen contents.' },
      ],
    },
  },
  {
    id: 'CH-09', number: 9, slug: 'the-stronger-wall', shortTitle: 'The Stronger Wall',
    title: 'The wall built for distance.',
    lead: 'The left ventricle has a thick muscular wall to move blood into the systemic circulation.',
    beats: [
      { title: 'Different work, different walls', body: 'The normal left ventricle has a thicker muscular wall than the right. It develops the pressure needed for the systemic circulation. The right ventricle serves the pulmonary circulation. This comparison is qualitative, not a measurement of any person\'s heart.' },
      { title: 'Enter through one valve. Leave through another.', body: 'The mitral valve is the inlet from the left atrium. The aortic valve is a distinct outlet into the aorta. During ventricular ejection, the mitral valve closes against backflow as blood leaves through the aortic outlet.' },
    ],
    sourceIds: ['nhlbi-flow', 'aha-valves', 'ventricular-review'],
    diagramNote: 'Illustrated wall comparison. No scale bar, thickness ratio or diagnostic threshold is implied.',
    interaction: {
      title: 'Compare walls', description: 'Locate the two ventricular walls and then read the outlet.',
      initialValue: 'left', resetLabel: 'Reset',
      options: [
        { value: 'right', label: 'Right ventricular wall', result: 'The right ventricular wall is thinner in the normal heart and pumps toward the lungs.' },
        { value: 'left', label: 'Left ventricular wall', result: 'The thicker left ventricular wall supports pumping into the systemic circulation.' },
        { value: 'outflow', label: 'Aortic outflow', result: 'Left ventricle → aortic valve → aorta. The mitral inlet remains a separate structure.' },
      ],
    },
  },
  {
    id: 'CH-10', number: 10, slug: 'around-the-body', shortTitle: 'Around the Body',
    title: 'One beat, many destinations.',
    lead: 'From the aorta, branching arteries reach tissues; blood eventually returns through veins.',
    beats: [
      { title: 'A branching distribution', body: 'The aorta receives blood from the left ventricle. Arteries and smaller branches distribute it to the body\'s tissues. Capillaries provide the exchange interface; the map condenses many branches into a readable route.' },
      { title: 'A return without a shortcut', body: 'Blood leaves tissue capillaries through small veins that join larger venous routes back to the right atrium. This completes the conceptual systemic circuit. Following the route here does not mean a blood cell crosses the whole body in one beat.' },
    ],
    sourceIds: ['nhlbi-flow', 'nci-vessels'],
    diagramNote: 'Schematic route, not a complete vascular atlas. Arrows indicate direction, not travel time.',
    interaction: {
      title: 'The systemic circuit', description: 'Compare outward distribution with the return to the heart.',
      initialValue: 'both', resetLabel: 'Reset',
      options: [
        { value: 'arterial', label: 'Arterial path', result: 'Left ventricle → aorta → systemic arteries → tissue capillaries.' },
        { value: 'venous', label: 'Venous path', result: 'Tissue capillaries → systemic veins → venae cavae → right atrium.' },
        { value: 'both', label: 'Show both', result: 'Arteries and veins connect through tissue capillaries. There is no direct aorta-to-vein shortcut in this normal circuit.' },
      ],
    },
  },
  {
    id: 'CH-11', number: 11, slug: 'beat-again', shortTitle: 'Beat Again',
    title: 'The story has no final beat.',
    lead: 'Two connected circuits and a repeating electrical pattern keep a living system moving.',
    beats: [
      { title: 'Two circuits, one continuous route', body: 'The pulmonary circuit connects the right ventricle to the lungs and back to the left atrium. The systemic circuit connects the left ventricle to the body and back to the right atrium. The chambers and valves join these routes in order.' },
      { title: 'Structure carries. The signal coordinates.', body: 'Return to the same organ and choose either layer. The blood route describes where transport occurs; the electrical sequence describes how contraction is coordinated. Together they explain a heartbeat without reducing the circulation to a single moment.' },
    ],
    sourceIds: ['nhlbi-flow', 'nhlbi-beat', 'nci-vessels'],
    diagramNote: 'The original orientation returns. Electrical and circulation overlays keep distinct meanings and timescales.',
    interaction: {
      title: 'Read the atlas again', description: 'Choose the layer you want to follow, then revisit any chapter.',
      initialValue: 'both', resetLabel: 'Reset view',
      options: [
        { value: 'electrical', label: 'Electrical sequence', result: 'The signal starts in the right atrium, pauses at the AV node and coordinates ventricular contraction.' },
        { value: 'blood', label: 'Blood pathway', result: 'Body → right heart → lungs → left heart → body. This is a route, not a one-beat transit time.' },
        { value: 'both', label: 'Both', result: 'Dotted electrical marks and arrowed circulation paths remain separate. Neither overlay measures your heart.' },
      ],
    },
  },
];
