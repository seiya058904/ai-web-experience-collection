const asciiSpace = /[\t\n\f\r ]/;

/** Refresh network requests without changing embedded or local resource bytes. */
export function mediaRetryUrl(candidate: string, attempt: number, baseUrl: string): string {
  let url: URL;
  try { url = new URL(candidate, baseUrl); } catch { return candidate; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return candidate;

  // Keep the original query encoding and every unrelated parameter. In
  // particular, do not discard image variants, signed values, or fragments.
  const query = url.search ? url.search.slice(1).split('&') : [];
  const retained = query.filter(part => {
    try { return decodeURIComponent(part.split('=', 1)[0].replace(/\+/g, ' ')) !== 'retry'; }
    catch { return true; }
  });
  retained.push(`retry=${encodeURIComponent(String(attempt))}`);
  url.search = retained.join('&');
  return url.href;
}

export function sameMediaUrl(candidate: string, selected: string, baseUrl: string): boolean {
  if (candidate === selected) return true;
  try { return new URL(candidate, baseUrl).href === new URL(selected, baseUrl).href; }
  catch { return false; }
}

/**
 * Rewrite only the selected URL, preserving candidate descriptors and spacing.
 * Srcset URLs end at ASCII whitespace, not at every comma: embedded data URLs
 * contain commas. A trailing comma ends a descriptor-free candidate; otherwise
 * the comma after its descriptor separates it from the next candidate.
 */
export function retrySrcset(
  srcset: string,
  selected: string,
  attempt: number,
  baseUrl: string,
): { value: string; matches: number } {
  const replacements: { start: number; end: number; value: string }[] = [];
  let position = 0;
  while (position < srcset.length) {
    while (position < srcset.length && (asciiSpace.test(srcset[position]) || srcset[position] === ',')) position++;
    const start = position;
    while (position < srcset.length && !asciiSpace.test(srcset[position])) position++;
    let end = position;
    while (end > start && srcset[end - 1] === ',') end--;
    const candidate = srcset.slice(start, end);
    if (candidate && sameMediaUrl(candidate, selected, baseUrl)) {
      replacements.push({ start, end, value: mediaRetryUrl(candidate, attempt, baseUrl) });
    }
    if (end < position) continue;

    // Preserve descriptor text verbatim, including any parenthesized content.
    let parentheses = 0;
    while (position < srcset.length) {
      const char = srcset[position++];
      if (char === '(') parentheses++;
      else if (char === ')' && parentheses > 0) parentheses--;
      else if (char === ',' && parentheses === 0) break;
    }
  }
  let value = srcset;
  for (const replacement of replacements.reverse()) {
    value = value.slice(0, replacement.start) + replacement.value + value.slice(replacement.end);
  }
  return { value, matches: replacements.length };
}
