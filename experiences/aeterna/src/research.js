/** Museum sources and interpretive notes for the AETERNA exhibition. */
export const sources = [
  {
    id: 'roman-verism',
    title: 'Roman Portrait Sculpture: The Stylistic Cycle',
    institution: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/essays/roman-portrait-sculpture-the-stylistic-cycle',
    note: 'Veristic and idealizing styles, heroic bodies, and the public meanings of portraiture.',
  },
  {
    id: 'imperial-portraits',
    title: 'Roman Portrait Sculpture: Republican through Constantinian',
    institution: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/essays/roman-portrait-sculpture-republican-through-constantinian',
    note: 'The circulation, use, removal, and recarving of Roman portraits.',
  },
  {
    id: 'contrapposto',
    title: 'Working with Sculpture',
    institution: 'J. Paul Getty Museum',
    url: 'https://www.getty.edu/education/teachers/classroom_resources/curricula/sculpture/background1.html',
    note: 'The human figure and the weight-bearing stance called contrapposto.',
  },
  {
    id: 'prima-porta',
    title: 'Augustus from Prima Porta',
    institution: 'Vatican Museums',
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/braccio-nuovo/Augusto-di-Prima-Porta.html',
    note: 'Early first-century CE statue, military address, cuirass relief, and Greek formal inheritance.',
  },
  {
    id: 'marcus-aurelius',
    title: 'Equestrian statue of Marcus Aurelius',
    institution: 'Musei Capitolini',
    url: 'https://museicapitolini.org/en/opera/statua-equestre-di-marco-aurelio?tema=1',
    note: 'Bronze, catalogued 161–180 CE; proposed erection in 176 or 180 CE, and later relocation.',
  },
  {
    id: 'ancient-colour',
    title: 'Polychromy of Roman Marble Sculpture',
    institution: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/essays/polychromy-of-roman-marble-sculpture',
    note: 'Ancient colour and surface treatments, surviving traces, and the limits of reconstruction.',
  },
  {
    id: 'restoration',
    title: 'Statue of an Emperor: A Conservation Partnership',
    institution: 'J. Paul Getty Museum',
    url: 'https://www.getty.edu/art/exhibitions/statue_emperor.html',
    note: 'A conservation example involving ancient fragments and later marble additions.',
  },
  {
    id: 'smk-cast',
    title: 'Landsdowne Heracles — KAS224',
    institution: 'SMK — Statens Museum for Kunst',
    url: 'https://open.smk.dk/en/artwork/image/KAS224',
    note: 'The museum plaster cast, acquired in 1897, and its freely reusable downloadable materials.',
  },
  {
    id: 'smk-metadata',
    title: 'Official collection record for KAS224',
    institution: 'SMK — Statens Museum for Kunst',
    url: 'https://api.smk.dk/api/v1/art/?object_number=KAS224',
    note: 'Object identity, cast material, acquisition, model downloads, and Public Domain Mark rights.',
  },
  {
    id: 'getty-herakles',
    title: 'Explore Statue of Hercules',
    institution: 'J. Paul Getty Museum',
    url: 'https://www.getty.edu/education/k-12-learning/explore-statue-of-hercules/',
    note: 'The ancient Roman Lansdowne Herakles, about 125 CE, now in the Getty collection.',
  },
  {
    id: 'met-wellhead',
    title: 'Puteal with Narcissus and Echo, and Hylas and the Nymphs',
    institution: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/art/collection/search/775805',
    note: 'Second-century Roman marble wellhead, accession 2019.7, with a Public Domain 3D download.',
  },
  {
    id: 'met-3d',
    title: 'Three-Dimensional Models of Works from The Met Collection',
    institution: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/press-releases/3-d-models-announcement-2026',
    note: 'The museum’s 2026 3D programme and its Open Access / CC0 downloads.',
  },
];

export const collectionObjects = [
  {
    id: 'herakles',
    title: 'Lansdowne Herakles — SMK plaster cast',
    period: 'Cast acquired in 1897; Roman original c. 125 CE',
    medium: 'Plaster cast; digitized as a three-dimensional mesh',
    institution: 'SMK — Statens Museum for Kunst, Royal Cast Collection',
    accession: 'KAS224',
    license: 'Public Domain Mark 1.0',
    url: 'https://open.smk.dk/en/artwork/image/KAS224',
    credit: 'SMK — Statens Museum for Kunst, Royal Cast Collection, KAS224. Public Domain.',
    interpretation: 'Derived from a scan of the museum’s plaster cast, not a direct scan of the excavated Roman marble. Its 36 digital pieces, simplified surfaces, new interior cuts, display material, and lighting are artistic treatments.',
  },
  {
    id: 'wellhead',
    title: 'Puteal (wellhead) with Narcissus and Echo, and Hylas and the Nymphs',
    period: 'Roman, 2nd century CE',
    medium: 'Marble; digitized as a three-dimensional mesh',
    institution: 'The Metropolitan Museum of Art',
    accession: '2019.7',
    license: 'CC0 1.0 — The Met Open Access',
    url: 'https://www.metmuseum.org/art/collection/search/775805',
    credit: 'The Metropolitan Museum of Art, 2019.7. Open Access 3D scan, CC0.',
    interpretation: 'Derived from the museum’s scan of the Roman wellhead. The exhibition changes viewpoint and lighting to reveal its form. The imagined procession image that introduces the room is a separate composition.',
  },
];

export const curatorialSections = [
  {
    title: 'Likeness and verism',
    text: 'Roman veristic portraits could emphasize age, wrinkles, and bodily imperfections to suggest experience and civic virtue. These features communicated a chosen public identity. Realistic heads could also be joined to idealized heroic bodies.',
    sourceIds: ['roman-verism'],
  },
  {
    title: 'The imperial image',
    text: 'Imperial portrait types circulated through sculpture and coins, making a ruler recognizable across the empire. Idealization and family resemblance helped express continuity. Damaged or recarved portraits show that an image’s political meaning could change.',
    sourceIds: ['imperial-portraits', 'roman-verism'],
  },
  {
    title: 'A body in balance',
    text: 'Contrapposto places most of a standing figure’s weight on one leg. The hips, shoulders, and limbs adjust in response. Roman sculpture adapted Greek bodily ideals; the Herakles shown here reaches us through a later museum cast.',
    sourceIds: ['contrapposto', 'getty-herakles', 'smk-cast'],
  },
  {
    title: 'Relief and myth',
    text: 'The Roman wellhead combines the water-related stories of Narcissus and Echo, and Hylas with the nymphs. Carved figures turn a functional object into a setting for myth.',
    sourceIds: ['met-wellhead'],
  },
  {
    title: 'Ancient colour',
    text: 'Ancient stone sculpture was often painted. Roman marble could receive selective colour, extensive paint, gilding, or inlay. AETERNA’s ivory presentation evokes a modern encounter with surviving sculpture. The historical notes acknowledge fragmentary pigment evidence and the uncertainty of exact reconstruction.',
    sourceIds: ['ancient-colour'],
  },
  {
    title: 'Fragments and restoration',
    text: 'Surviving sculpture may combine ancient material with later repairs or additions. Historical restoration has sometimes changed the form we inherit. AETERNA’s disassembly is an artistic simulation; its fragment boundaries do not document ancient damage, an excavation sequence, or a conservation treatment.',
    sourceIds: ['restoration'],
  },
  {
    title: 'Scans, casts, and imagined images',
    text: 'The anatomical model derives from SMK’s public-domain plaster cast of the Lansdowne Herakles, acquired in 1897. The wellhead derives from a Met Open Access scan of the Roman object. Generated portrait images are imagined studies without an assigned historical identity. Altered lighting, materials, and motion belong to this digital interpretation.',
    sourceIds: ['smk-cast', 'smk-metadata', 'met-wellhead', 'met-3d'],
  },
];
