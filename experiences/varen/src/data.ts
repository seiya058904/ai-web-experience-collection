export const categories = ['All', 'Tailoring', 'Jackets', 'Shirting', 'Outerwear'] as const;
export type Category = typeof categories[number];

export interface Look {
  id: string;
  title: string;
  category: Exclude<Category, 'All'>;
  image: string;
  detail: string;
  description: string;
  colour: string;
  silhouette: string;
  occasion: string;
  alt: string;
}

export const looks: Look[] = [
  { id: 'slate-suit', title: 'The Slate Suit', category: 'Tailoring', image: 'slate', detail: 'lapel', description: 'A composed silhouette for the moments that matter.', colour: 'Charcoal', silhouette: 'Structured', occasion: 'The meeting', alt: 'A charcoal suit with an ivory shirt and dark tie in a warm stone interior' },
  { id: 'sand-jacket', title: 'The Sand Jacket', category: 'Jackets', image: 'sand', detail: 'sand', description: 'Relaxed proportions. An assured point of view.', colour: 'Warm taupe', silhouette: 'Relaxed', occasion: 'Everyday', alt: 'A taupe blazer over a chocolate knit with tailored trousers' },
  { id: 'ivory-shirt', title: 'The Ivory Shirt', category: 'Shirting', image: 'ivory', detail: 'ivory', description: 'An open collar. A clean line. Space to make it your own.', colour: 'Ivory', silhouette: 'Easy, straight', occasion: 'Everyday', alt: 'An ivory open-collar shirt with charcoal tailored trousers' },
  { id: 'evening-suit', title: 'The Evening Suit', category: 'Tailoring', image: 'evening', detail: 'evening', description: 'Deep tones and an uninterrupted line, from dusk onwards.', colour: 'Espresso', silhouette: 'Considered, close', occasion: 'After hours', alt: 'An espresso suit with a tonal dark knit in contemporary architecture' },
  { id: 'tobacco-coat', title: 'The Tobacco Coat', category: 'Outerwear', image: 'coat', detail: 'texture', description: 'A longer line. A little more presence.', colour: 'Tobacco', silhouette: 'Long, relaxed', occasion: 'Everyday', alt: 'A long tobacco overcoat over a stone knit and charcoal trousers' },
  { id: 'graphite-coat', title: 'The Graphite Coat', category: 'Outerwear', image: 'graphite', detail: 'graphite', description: 'Architectural in shape. Understated in everything else.', colour: 'Graphite', silhouette: 'Clean, straight', occasion: 'After hours', alt: 'A graphite overcoat styled with dark knitwear and tailored trousers' },
];

export const occasions = [
  { name: 'Everyday', heading: 'Room to move.', description: 'Relaxed proportions. An assured point of view.', lookId: 'sand-jacket' },
  { name: 'The meeting', heading: 'A clear intention.', description: 'A composed silhouette for the moments that matter.', lookId: 'slate-suit' },
  { name: 'After hours', heading: 'Into the evening.', description: 'Deep tones. An uninterrupted line.', lookId: 'evening-suit' },
] as const;

export const detailChapters = [
  { name: 'Lapel', image: 'lapel', title: 'A closer consideration.', text: 'Where a clean edge meets a softer line.', alt: 'A chocolate suit lapel against an open ivory shirt' },
  { name: 'Texture', image: 'texture', title: 'Character, in the detail.', text: 'Light across the surface. Depth in every fold.', alt: 'A close view of brown woven suiting and sleeve buttons' },
  { name: 'Line', image: 'hero', title: 'The whole, considered.', text: 'Each detail finds its place in the silhouette.', alt: 'The complete chocolate suit silhouette in architectural daylight' },
];
