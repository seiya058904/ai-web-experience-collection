/** The exact retained Image Gen outputs, served locally without a runtime API. */
export const assetNames = ['ai-04-hero','ai-02-host','ai-09-hatch','ai-10-feeding','ai-10-feeding','ai-11-j-hang','ai-06-jade','ai-06-jade','ai-08-pattern','ai-07-emergence','ai-12-adult'] as const;
export const alts = [
  'A ridged monarch butterfly egg attached to the underside of a green milkweed leaf, seen at intimate macro scale.',
  'Two milkweed leaves and their stem; one tiny monarch egg rests beneath the lower leaf. An illustration.',
  'A tiny pale, dark-headed monarch hatchling beside the opened ridged eggshell on a milkweed leaf. An illustration.',
  'A small monarch larva at a locally eaten milkweed leaf margin. An illustration.',
  'A young monarch caterpillar feeding on milkweed, shown as a reference beside the instar comparison.',
  'A mature striped monarch caterpillar hangs in a J shape from a silk pad beneath a stem. An illustration.',
  'An opaque jade monarch chrysalis with restrained gold markings, anchored to a visible silk pad. An illustration.',
  'The intact jade chrysalis used as an exterior reference for a separate developmental reconstruction.',
  'The same chrysalis later in development; orange-black wing pigmentation is visible beneath its retained surface. An illustration.',
  'A newly emerged monarch hangs from its empty chrysalis, with crumpled wings and a visible silk attachment. An illustration.',
  'A mature orange-and-black monarch on milkweed in the original illustrated habitat.',
] as const;
export const asset = (name:string) => `${import.meta.env.BASE_URL}chrysalis/assets/${name}.webp`;
export function escapeHTML(value:unknown):string { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
export function picture(index:number, className='', options:{name?:string;decorative?:boolean;eager?:boolean;mobile?:boolean;alt?:string}={}):string {
  const name=options.name??assetNames[index];
  const mobile=options.mobile && index===0 ? `<source media="(max-width: 700px)" srcset="${asset('ai-05-mobile')}">`:'';
  return `<picture class="scene-media ${className}" data-asset="${name}" data-chapter="${index}">${mobile}<img src="${asset(name)}" width="1659" height="948" ${options.eager?'loading="eager"':'loading="lazy"'} decoding="async" alt="${options.decorative?'':escapeHTML(options.alt??alts[index])}" ${options.decorative?'aria-hidden="true"':''}></picture>`;
}
