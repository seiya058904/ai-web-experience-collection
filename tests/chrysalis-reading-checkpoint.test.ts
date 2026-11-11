import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadingCheckpointStore, READING_HISTORY_KEY } from '../experiences/chrysalis/src/reading-checkpoint.ts';
import { captureReadingPosition, restoreReadingPosition } from '../experiences/chrysalis/src/reading-position.ts';

const chapters = [{ id: 'ch-09', top: 22000, height: 1500 }, { id: 'ch-10', top: 25000, height: 1800 }];
const marker = { id: 'tr-09-10', from: 'ch-09', to: 'ch-10', top: 24100.765625, height: 360 };
const oldLayout = { viewportHeight: 900, chapters, transitions: [marker] };
const newLayout = { ...oldLayout, transitions: [{ ...marker, top: marker.top + 164 }] };

function hostFixture() {
  let historyValue: unknown = { unrelated: { retained: true } };
  let session: string | null = null;
  let now = 1;
  let rejectHistory = false;
  let route = '/#ch-08';
  const host = {
    route: () => route, now: () => now,
    getHistory: () => historyValue,
    replaceHistory: (value: Record<string, unknown>) => { if (rejectHistory) throw new Error('Document is no longer fully active'); historyValue = structuredClone(value); },
    getSession: () => session,
    setSession: (value: string) => { session = value; },
  };
  return { host, get history() { return historyValue; }, set history(value: unknown) { historyValue = value; },
    set now(value: number) { now = value; }, set rejectHistory(value: boolean) { rejectHistory = value; }, set route(value: string) { route = value; } };
}

test('an active-page checkpoint survives the history entry copied for reload and retains unrelated state', () => {
  const fixture = hostFixture();
  const position = captureReadingPosition({ ...oldLayout, scrollY: 24011 });
  const store = createReadingCheckpointStore(fixture.host);
  assert.deepEqual(store.save(position), { history: true, session: true });
  const copiedEntry = structuredClone(fixture.history) as Record<string, unknown>;
  assert.deepEqual(copiedEntry.unrelated, { retained: true });
  assert.ok(copiedEntry[READING_HISTORY_KEY]);
  const reloadStore = createReadingCheckpointStore({ ...fixture.host, getHistory: () => copiedEntry });
  const restored = reloadStore.read();
  assert.equal(restored?.source, 'history');
  assert.deepEqual(restored?.position, position);
  assert.equal(restoreReadingPosition(restored!.position, newLayout), 24175);
});

test('a later session checkpoint restores the latest pose when departure history writes are too late', () => {
  const fixture = hostFixture();const store = createReadingCheckpointStore(fixture.host);
  store.save(captureReadingPosition({ ...oldLayout, scrollY: 23831 }));
  const copiedEntry = structuredClone(fixture.history);
  fixture.now = 2;fixture.rejectHistory = true;
  const latest = captureReadingPosition({ ...oldLayout, scrollY: 24011 });
  assert.deepEqual(store.save(latest), { history: false, session: true });
  const reloadStore = createReadingCheckpointStore({ ...fixture.host, getHistory: () => copiedEntry });
  const restored = reloadStore.read();
  assert.equal(restored?.source, 'session');
  assert.deepEqual(restored?.position, latest);
  assert.equal(restoreReadingPosition(restored!.position, newLayout), 24175);
});

test('checkpoint backup preserves foreign history shapes and rejects a different route or malformed backup', () => {
  const fixture = hostFixture();fixture.history = ['another feature'];
  const store = createReadingCheckpointStore(fixture.host);
  const position = captureReadingPosition({ ...oldLayout, scrollY: 24011 });
  assert.deepEqual(store.save(position), { history: false, session: true });
  assert.deepEqual(fixture.history, ['another feature']);
  assert.equal(store.read()?.source, 'session');
  fixture.route = '/#ch-02';assert.equal(store.read(), null);
  const invalid = createReadingCheckpointStore({ ...fixture.host, getSession: () => '{bad json' });
  assert.equal(invalid.read(), null);
});
