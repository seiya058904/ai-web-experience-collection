// The still plates follow the same eleven authored material states as the live
// renderer. A request may finish in any order; only the latest prepared pair is
// eligible for the main animation clock to publish.
export const stillFiles = Object.freeze(['hero', 'core', 'coat', 'cure', 'abrade', 'layers', 'vermilion', 'polish', 'maki-e', 'reveal', 'depth']);

export function stillVariant(width, height) {
  if (width <= 700) return 'mobile';
  if (width <= 1100 && height >= width) return 'portrait';
  return 'wide';
}

export function stillPath(chapter, variant) {
  return `stills/${variant === 'wide' ? '' : `${variant}/`}${stillFiles[chapter]}.webp`;
}

export function createStillQueue({ initial, initialReady = true, prepare, onSettled = () => {} }) {
  let displayed = initialReady ? { ...initial } : null;
  let requested = { ...initial };
  let status = initialReady ? 'ready' : 'idle';
  let staged = null;
  let ticket = 0;
  let disposed = false;
  let completion = Promise.resolve();
  const same = (a, b) => a.chapter === b.chapter && a.variant === b.variant;

  return {
    request(chapter, variant) {
      if (disposed) return Promise.resolve();
      const next = { chapter, variant };
      if (same(next, requested) && status !== 'idle') return completion;
      const ownTicket = ++ticket;
      requested = next;
      staged = null;
      // Reversing to the image already on screen also cancels an older pending
      // request. No network reload or blank placeholder is needed.
      if (displayed && same(next, displayed)) {
        status = 'ready';
        completion = Promise.resolve();
        return completion;
      }
      status = 'pending';
      completion = Promise.resolve().then(() => prepare({ ...next })).then(image => {
        if (disposed || ownTicket !== ticket) return;
        staged = { ...next, image };
        status = 'prepared';
        onSettled();
      }, () => {
        if (disposed || ownTicket !== ticket) return;
        status = 'failed';
        onSettled();
      });
      return completion;
    },
    commit() {
      if (disposed || !staged) return null;
      const next = staged;
      staged = null;
      displayed = { chapter: next.chapter, variant: next.variant };
      status = 'ready';
      return next;
    },
    get state() {
      return { requested: { ...requested }, displayed: displayed ? { ...displayed } : null, status };
    },
    dispose() {
      disposed = true;
      ticket += 1;
      staged = null;
    },
  };
}
