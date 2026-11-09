/**
 * BERTH — canonical English story and interface-facing copy.
 * Times, places, characters, and dialogue are fictional.
 * Narrative facts live here; the visitor's saved opening belongs in user state.
 */

export const DEFAULT_OPENING = 'Good morning. I’m Shen Ning.';

export const OPENING_OPTIONS = [
  DEFAULT_OPENING,
  'Today, let’s begin with a question.',
  'It’s all right to write a little slowly.',
] as const;

export const LIN_NOTE = 'The first good morning doesn’t need notes.';
export const HANDOUT_TITLE = 'Lesson One: How to Ask a Good Question';
export const HANDOUT_OPENING_LABEL = 'Opening';
export const HANDOUT_REMINDER = 'Tomorrow: my first community writing class.';
export const ABANDONED_OPENINGS = [
  'Welcome, everyone, to this course.',
  'When we talk about writing, we must first…',
] as const;
export const CLOSING_LINE = 'The night didn’t write tomorrow for her. It only left her a first line.';

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
  | 'ch-10';

export interface Chapter {
  id: ChapterId;
  number: number;
  time: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  paragraphs: string[];
  quote?: { text: string; speaker: string };
  /** Two actual story changes; do not count atmosphere or navigation as a beat. */
  beats: [string, string];
  imageAlt: string;
}

export const chapters: Chapter[] = [
  {
    id: 'ch-01',
    number: 1,
    time: '20:48',
    title: 'Compartment Seven',
    shortTitle: 'All aboard',
    subtitle: 'A small room. A whole night ahead.',
    paragraphs: [
      'Shen Ning eases her grey-green canvas bag through the doorway. At twenty-nine, she has taken night trains before. She has never taken one to teach her first class. The upper berth is hers; the woman on the lower one moves her travel bag just enough to make room.',
      'Ning sets twelve pages on the little table beneath the window. An orange-red paper clip holds them together. Lesson One: How to Ask a Good Question. Under the word “Opening”, there is a line she has not filled in. Outside, the platform begins to move.',
    ],
    beats: [
      'Ning enters and settles her canvas bag beside her assigned upper berth.',
      'The prepared handout is revealed, with its opening line still blank.',
    ],
    imageAlt: 'A compact sleeper compartment at dusk: a rounded window and small table ahead, two fixed berths on the right, and a ladder beside the doorway. Ms. Lin sits on the lower berth. A warm lamp falls across Ning’s clipped handout.',
  },
  {
    id: 'ch-02',
    number: 2,
    time: '21:05',
    title: 'A Little of the Light',
    shortTitle: 'The light',
    subtitle: 'Enough room for two quiet lives.',
    paragraphs: [
      'The woman on the lower berth looks up. Her silver-grey hair is tucked behind one ear; her glasses catch the lamp. She introduces herself as Ms. Lin, then notices the pages just beyond the pool of light.',
      'Ning nods. Ms. Lin tips the shade a little towards the paper, and Ning draws her handout closer. “Thank you.” For a while, that is all they need to say. The lamp stays where it is. The light has made a little more room.',
    ],
    quote: { text: 'Shall I turn the light towards you?', speaker: 'Ms. Lin' },
    beats: [
      'The two travellers introduce themselves without pressing for a life story.',
      'Ms. Lin tilts the shade towards Ning; Ning moves her pages into the shared light.',
    ],
    imageAlt: 'Ms. Lin, silver-haired and wearing a dark blue top and fine-framed glasses, gently tilts the lamp shade towards Ning’s handout. Ning, in a cream cardigan, draws the pages closer.',
  },
  {
    id: 'ch-03',
    number: 3,
    time: '21:32',
    title: 'Twelve Pages, One Blank Line',
    shortTitle: 'The small table',
    subtitle: 'She has prepared everything after hello.',
    paragraphs: [
      'Tomorrow morning, in Linwan, Ning will lead a community writing class for the first time. The exercises are ready. So are the examples, the spare pencils, and a question for anyone who thinks they have nothing to write about. A note in the margin says: “Tomorrow: my first community writing class.”',
      'She crosses out “Welcome, everyone, to this course.” Beneath it, “When we talk about writing, we must first…” also gets a thin line through it. Neither sounds like her. Twelve pages, and only the first sentence missing. She tries the shape of “Good morning” in the margin, then rests her pen.',
    ],
    beats: [
      'The handout establishes Ning’s first community writing class in Linwan.',
      'She crosses out two formal openings and tries the beginnings of a simple greeting.',
    ],
    imageAlt: 'The small wooden table, a warm reading lamp, and twelve pages held by one orange-red paper clip. Two formal opening drafts are crossed out, while the actual opening line is still unfinished.',
  },
  {
    id: 'ch-04',
    number: 4,
    time: '22:17',
    title: 'A Station We Don’t Stop At',
    shortTitle: 'Passing through',
    subtitle: 'Other people’s evenings pass the glass.',
    paragraphs: [
      'Ning takes her cup into the corridor for water. Through a narrow window, a small station slips past: a lit waiting room, two people under a clock, someone folding a newspaper. Their evening continues without this train.',
      'She comes back with the warm cup in her hands. From the lower berth, Ms. Lin says something almost to herself. Ning pauses in the doorway, then sets the cup beside her pages. She does not ask which bell.',
    ],
    quote: { text: 'Tomorrow, I won’t have to hurry for the bell.', speaker: 'Ms. Lin' },
    beats: [
      'Ning leaves the compartment to fill her cup and watches an ordinary station pass.',
      'She returns carrying the cup and hears Ms. Lin’s unexplained remark about the bell.',
    ],
    imageAlt: 'A narrow train corridor at night. A modest station and its lit waiting room pass the window while Ning holds a cup of water near the compartment doorway.',
  },
  {
    id: 'ch-05',
    number: 5,
    time: '23:06',
    title: 'Two Kinds of First Time',
    shortTitle: 'Two firsts',
    subtitle: 'One is going to a classroom. One is going to the sea.',
    paragraphs: [
      '“Today was my first day of retirement,” Ms. Lin says. She is sixty-one. She opens her plain travel bag and finds a pair of sandals, clean enough to still hold their shape. Tomorrow she is going to the sea. It will be her first trip there on her own. Ning tells her about the class.',
      'Ning takes two small blank cards from her canvas bag. “May I borrow one? Just to write something down,” Ms. Lin asks. Ning passes her one and keeps the other beside her own hand. The cup sits between them. Neither tries to explain the other person’s tomorrow.',
    ],
    quote: { text: 'Today was my first day of retirement. I’m going to see the sea.', speaker: 'Ms. Lin' },
    beats: [
      'Ms. Lin reveals her retirement and first solo trip to the sea, showing her unworn sandals.',
      'Ning takes out two distinct cards, lends one to Ms. Lin, and keeps the other.',
    ],
    imageAlt: 'Ning and Ms. Lin sit naturally at the same small table. A pair of unused seaside sandals is visible in Ms. Lin’s open bag. Ning passes one blank card to Ms. Lin; a second card remains beside Ning’s hand.',
  },
  {
    id: 'ch-06',
    number: 6,
    time: '00:14',
    title: 'The Compartment Goes Quiet',
    shortTitle: 'Lights down',
    subtitle: 'A few small things, put in their places.',
    paragraphs: [
      'Ms. Lin puts the sandals away, writes a short note, and leaves her card face down at the edge of the table. Her glasses go beside it. The words are hers for now. Ning gathers her handout, still held by the orange-red clip, and the second, unwritten card.',
      'She takes both up the fixed ladder. The pages rest along the edge of her upper berth; the card lies beside her pillow. Below, Ms. Lin settles into the lower berth and turns down the lamp. A few lights pass beyond the window. The two women stop talking.',
    ],
    beats: [
      'Ms. Lin leaves her written card face down beside her glasses on the table.',
      'Ning carries the clipped handout and her own card upstairs; the lamp dims as both settle to sleep.',
    ],
    imageAlt: 'From the upper berth, a small part of the table and rounded window remains visible. Ning’s clipped handout rests at the bed edge and her blank card lies near the pillow. Below, Ms. Lin’s face-down card and glasses remain together on the table.',
  },
  {
    id: 'ch-07',
    number: 7,
    time: '02:10',
    title: 'Something Simple to Begin With',
    shortTitle: 'The first line',
    subtitle: 'A sentence can be small enough to say aloud.',
    paragraphs: [
      'Ning wakes for a moment. The train is still moving; Ms. Lin is still asleep below. Tomorrow returns before the rest of the room does. Ning finds the card beside her pillow and thinks of a room full of people waiting for her to start.',
      'She does not need to fill the silence with a perfect sentence. A name would do. A question, perhaps. There is room on this card for one short beginning. You can leave one for her, or let the simple greeting stay.',
    ],
    beats: [
      'Ning briefly wakes and returns to her worry without waking her neighbour.',
      'Her own card receives the visitor’s chosen or written opening, with a complete default path.',
    ],
    imageAlt: 'Ning’s own small card lies beside the upper-berth pillow, near her clipped handout. The distant window remains deep blue; Ms. Lin sleeps below and her separate card stays on the table.',
  },
  {
    id: 'ch-08',
    number: 8,
    time: '05:38',
    title: 'Morning Finds the Same Room',
    shortTitle: 'First light',
    subtitle: 'Nothing has moved while the light was changing.',
    paragraphs: [
      'The window turns from deep blue to grey. Low roofs begin to pass outside. Ms. Lin’s glasses and face-down card are still on the table; Ning’s pages and her own card are still upstairs. Ning climbs down the same ladder, carrying them, and sets them on her side of the little table.',
      'Only then does Ms. Lin pick up the card she wrote the night before. She turns it over and hands it to Ning. The two cards meet beside the cup. Ning reads the note once, then once more. She is still nervous about the class.',
    ],
    quote: { text: LIN_NOTE, speaker: 'The note Ms. Lin wrote in the night' },
    beats: [
      'Dawn reveals the unchanged object positions; Ning then descends with her pages and card.',
      'Ms. Lin turns over her own card and gives Ning the note she wrote during the night.',
    ],
    imageAlt: 'Cool morning light enters the same compact sleeper. At first Ms. Lin’s glasses and face-down card remain on the table while Ning’s pages and card are upstairs. Ning brings them down before Ms. Lin passes her written note across the table.',
  },
  {
    id: 'ch-09',
    number: 9,
    time: '06:12',
    title: 'Two Cards, One Paper Clip',
    shortTitle: 'Before we arrive',
    subtitle: 'A small thing to take into the day.',
    paragraphs: [
      'Ning slides the orange-red paper clip off her handout. She places her opening beside Ms. Lin’s note, then clips the two cards together. The pages go into her canvas bag first; the cards follow in the inside pocket. Ms. Lin puts on her glasses and closes her travel bag.',
      '“The sea first?” Ning asks. “Yes. No bell today.” Ning checks the address of the community room. Ms. Lin checks that she has her sandals. When the train slows, they stand on their own sides of the small aisle and lift their bags.',
    ],
    quote: { text: 'Yes. No bell today.', speaker: 'Ms. Lin' },
    beats: [
      'Ning removes the single clip from her handout and uses it to join the two cards.',
      'They pack their belongings and say their separate next steps: the class and the sea.',
    ],
    imageAlt: 'Two small cards, Ning’s opening and Ms. Lin’s note, are held together by the orange-red clip removed from the handout. Behind them, the two travellers gather their separate bags in the morning compartment.',
  },
  {
    id: 'ch-10',
    number: 10,
    time: '06:37',
    title: 'The Light They Leave Behind',
    shortTitle: 'A first line',
    subtitle: 'The room is empty. The words have gone with her.',
    paragraphs: [
      'Ms. Lin goes through the doorway first, travel bag in hand. Ning follows with her canvas bag, her pages, and both cards. Their footsteps turn in different directions on the platform. The class is still ahead of Ning. The sea is still ahead of Ms. Lin.',
      'From the doorway, the compartment looks much as it did last night: the rounded window, the fixed berths, the little table. Now there is daylight on the wood. The unlit lamp is the only thing left on the table.',
    ],
    beats: [
      'Ms. Lin and Ning leave through the actual doorway in sequence with all their belongings.',
      'The opening viewpoint returns in daylight; the visitor may revisit the two cards Ning took with her.',
    ],
    imageAlt: 'The empty sleeper compartment seen from the original doorway in morning light. The rounded window, right-hand berths, ladder, and small table keep their original positions. The table is clear: both women have taken their belongings.',
  },
];

export const STORY_LABELS = {
  title: 'BERTH',
  subtitle: 'One night. Ten quiet moments.',
  fiction: 'A fictional night-train story.',
  begin: 'Begin this night',
  chapters: 'Chapters',
  lampExperiment: 'Observe different lighting',
  lampExplanation: 'A small lighting study for this table. The rest of the story keeps its own light.',
  lampModes: { reading: 'Reading', soft: 'Soft', off: 'Off' },
  returnToStory: 'Back to this night',
  writeLabel: 'A first line for Shen Ning',
  localOnly: 'Kept in this browser. Never sent anywhere.',
  undo: 'Undo',
  reset: 'Restore the simple greeting',
  copy: 'Copy your first line',
  copied: 'First line copied.',
  copyFailed: 'Copy is unavailable. Select the sentence below and copy it yourself.',
  replayConversation: 'Return to the night conversation',
  replayMorning: 'Return to first light',
  replayBeginning: 'Read from the beginning',
  keptNotes: 'The cards she took with her',
  ningCard: 'Ning’s first line',
  linCard: 'Ms. Lin’s note',
  optionalAside: 'One is about to stand in front of a class for the first time. The other no longer has to hurry to one.',
} as const;
