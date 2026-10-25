export const JOURNEY_PREFIX = 'collection-journey:';
export type CollectionJourney = { route: string; offset: number; created: number };

export function readJourney(token: string | null): CollectionJourney | null {
  if (!token || !/^[a-z0-9-]{8,80}$/.test(token)) return null;
  try {
    const record = JSON.parse(sessionStorage.getItem(JOURNEY_PREFIX + token) || 'null');
    if (!record || !/^[a-z0-9-]+$/.test(record.route) || !Number.isFinite(record.offset)
      || Math.abs(record.offset) > 10000 || !Number.isFinite(record.created)) return null;
    return record;
  } catch { return null; }
}

export function collectionReturnHref(): string {
  const home = new URL(import.meta.env.BASE_URL, location.origin);
  const route = location.pathname.slice(home.pathname.length).split('/')[0];
  if (!/^[a-z0-9-]+$/.test(route)) return home.href;
  home.hash = `world-${route}`;
  const token = new URL(location.href).searchParams.get('collection-journey');
  if (readJourney(token)?.route === route) home.searchParams.set('collection-return', token!);
  return home.href;
}

// Keep a native document link: modified clicks and context-menu opening work too.
function updateReturns() {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a.collection-return')) {
    link.href = collectionReturnHref();
  }
}
const lifecycle = new AbortController();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateReturns, { once: true, signal: lifecycle.signal });
else updateReturns();
// React resolves the same href when it renders its shared return component.
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a.collection-return') : null;
  if (target) target.href = collectionReturnHref();
}, { capture: true, signal: lifecycle.signal });
window.addEventListener('pageshow', updateReturns, { signal: lifecycle.signal });
import.meta.hot?.dispose(() => lifecycle.abort());
