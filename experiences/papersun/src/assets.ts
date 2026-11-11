export const ASSETS = [
  'hero', 'attic', 'attic', 'hero', 'market', 'wind', 'valley', 'bridge', 'attic', 'hero', 'hero', 'transition-midpoint',
] as const;

export function artUrl(index: number, mobile: boolean): string {
  const key = ASSETS[index] ?? 'hero';
  const file = key === 'hero' && mobile ? 'hero-mobile' : key;
  const testMode = new URLSearchParams(location.search).get('test-assets');
  const fail = testMode === 'fail';
  // The local preview server can introduce real response latency for recovery
  // checks. Normal production URLs never contain this QA-only parameter.
  const delays: Record<string, number> = { hero: 2800, 'hero-mobile': 2800, attic: 4200, market: 3800, wind: 300, valley: 500, bridge: 100, 'transition-midpoint': 3600 };
  const query = testMode === 'slow' ? `?qa-delay=${delays[file] ?? 2000}` : '';
  return `${import.meta.env.BASE_URL}papersun/art/${fail ? 'unavailable-' : ''}${file}.webp${query}`;
}

const loading = new Map<string, Promise<HTMLImageElement>>();
export function loadArt(url: string, retry = false): Promise<HTMLImageElement> {
  if (retry) loading.delete(url);
  if (!loading.has(url)) {
    loading.set(url, new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => image.decode().catch(() => undefined).then(() => resolve(image));
      image.onerror = () => reject(new Error('Scene artwork unavailable'));
      image.src = url;
    }));
  }
  return loading.get(url)!;
}

export function warmNeighbours(index: number, mobile: boolean): void {
  for (const i of [index - 1, index, index + 1]) {
    if (i >= 0 && i < ASSETS.length) void loadArt(artUrl(i, mobile)).catch(() => undefined);
  }
}

/** Eight bounded local pictures. Defer the full reading cache until idle so
 * later chapters still work after a connection drops or a local server closes.
 * Failed entries remain retryable through the visible recovery control. */
export function warmReadingCache(): void {
  const urls = new Set(ASSETS.map((_, index) => artUrl(index, false)));
  urls.add(artUrl(0, true));
  for (const url of urls) void loadArt(url).catch(() => undefined);
}
