/** Normal served assets, or the same bytes embedded in the optional offline file. */
type EmbeddedAsset = { type: string; data: string };
let embedded: Record<string, EmbeddedAsset> | null | undefined;
const urls = new Map<string, string>();
let pack: ArrayBuffer | null = null;
let packIndex: Record<string, { type: string; start: number; length: number }> = {};
let packLoading: Promise<void> | null = null;
export function prepareAssets(): Promise<void> {
  const descriptor = document.getElementById('pas-pack');
  if (!descriptor) return Promise.resolve();
  if (packLoading) return packLoading;
  packLoading = (async () => {
    const response = await fetch(descriptor.getAttribute('data-src')!);
    if (!response.ok) throw new Error('The local movement package could not load.');
    const bytes = await response.arrayBuffer();
    const headerLength = new DataView(bytes).getUint32(0, true);
    const index = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 4, headerLength)));
    pack = bytes; packIndex = index;
  })().catch(error => { packLoading = null; pack = null; packIndex = {}; throw error; });
  return packLoading;
}
export function asset(path: string): string {
  if (embedded === undefined) {
    const element = document.getElementById('pas-assets');
    embedded = element ? JSON.parse(element.textContent ?? '{}') as Record<string, EmbeddedAsset> : null;
    element?.remove();
  }
  const packed = packIndex[path];
  if (pack && packed) {
    const existing = urls.get(path); if (existing) return existing;
    const url = URL.createObjectURL(new Blob([new Uint8Array(pack, packed.start, packed.length)], { type: packed.type }));
    urls.set(path, url); return url;
  }
  const item = embedded?.[path];
  if (!item) return `${import.meta.env.BASE_URL}pas/${path}`;
  const existing = urls.get(path); if (existing) return existing;
  const decoded = atob(item.data); const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: item.type }));
  urls.set(path, url); return url;
}
