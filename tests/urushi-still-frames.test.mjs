import test from 'node:test';
import assert from 'node:assert/strict';
import { createStillQueue, stillVariant, stillPath } from '../experiences/urushi/src/still-frames.js';

function fixture() {
  const jobs = [];
  let notifications = 0;
  const queue = createStillQueue({
    initial: { chapter: 0, variant: 'wide' },
    prepare: request => new Promise((resolve, reject) => jobs.push({ ...request, resolve, reject })),
    onSettled: () => { notifications += 1; },
  });
  return { queue, jobs, get notifications() { return notifications; } };
}

test('A cold Hero is not a valid displayed plate before its image has been prepared', async () => {
  let resolve;
  let requests = 0;
  const queue = createStillQueue({
    initial: { chapter: 0, variant: 'mobile' },
    initialReady: false,
    prepare: () => { requests += 1; return new Promise(done => { resolve = done; }); },
  });
  assert.equal(queue.state.displayed, null);
  const preparation = queue.request(0, 'mobile');
  await Promise.resolve();
  assert.equal(requests, 1, 'matching the initial descriptor must still prepare its image');
  assert.equal(queue.state.status, 'pending');
  assert.equal(queue.commit(), null);
  resolve('prepared-mobile-hero');
  await preparation;
  assert.equal(queue.state.displayed, null, 'decoding alone does not publish a pair');
  assert.deepEqual(queue.commit(), { chapter: 0, variant: 'mobile', image: 'prepared-mobile-hero' });
  assert.deepEqual(queue.state.displayed, { chapter: 0, variant: 'mobile' });
});

test('Delayed and out-of-order photographs never publish a mismatched chapter', async () => {
  const f = fixture();
  const slow = f.queue.request(3, 'wide');
  await Promise.resolve();
  const latest = f.queue.request(10, 'wide');
  await Promise.resolve();
  f.jobs[1].resolve('depth-image');
  await latest;
  assert.deepEqual(f.queue.state.displayed, { chapter: 0, variant: 'wide' }, 'loading is not publication');
  assert.deepEqual(f.queue.commit(), { chapter: 10, variant: 'wide', image: 'depth-image' });
  f.jobs[0].resolve('cure-image');
  await slow;
  assert.equal(f.queue.commit(), null, 'the late earlier image may not replace Depth');
  assert.deepEqual(f.queue.state.displayed, { chapter: 10, variant: 'wide' });
});

test('A failed photograph keeps the valid pair, does not retry every frame, and can be revisited', async () => {
  const f = fixture();
  const failed = f.queue.request(4, 'wide');
  await Promise.resolve();
  f.jobs[0].reject(new Error('image unavailable'));
  await failed;
  assert.equal(f.queue.state.status, 'failed');
  assert.equal(f.queue.commit(), null);
  assert.deepEqual(f.queue.state.displayed, { chapter: 0, variant: 'wide' });
  await f.queue.request(4, 'wide');
  assert.equal(f.jobs.length, 1, 'a stationary failed chapter must not flood requests');
  await f.queue.request(0, 'wide');
  const retry = f.queue.request(4, 'wide');
  await Promise.resolve();
  f.jobs[1].resolve('abrade-image');
  await retry;
  assert.equal(f.queue.commit().chapter, 4);
});

test('Resize keeps the displayed image until the matching portrait plate is prepared', async () => {
  const f = fixture();
  const wide = f.queue.request(5, 'wide');
  await Promise.resolve();
  const portrait = f.queue.request(5, 'portrait');
  await Promise.resolve();
  f.jobs[0].resolve('wide-layers');
  await wide;
  assert.equal(f.queue.commit(), null);
  assert.deepEqual(f.queue.state.displayed, { chapter: 0, variant: 'wide' });
  f.jobs[1].resolve('portrait-layers');
  await portrait;
  assert.deepEqual(f.queue.commit(), { chapter: 5, variant: 'portrait', image: 'portrait-layers' });
});

test('A rapid reversal and terminal disposal invalidate pending image work', async () => {
  const f = fixture();
  const request = f.queue.request(6, 'wide');
  await Promise.resolve();
  await f.queue.request(0, 'wide');
  f.jobs[0].resolve('stale-vermilion');
  await request;
  assert.equal(f.queue.commit(), null);
  assert.equal(f.notifications, 0);
  const next = f.queue.request(9, 'mobile');
  await Promise.resolve();
  f.queue.dispose();
  f.jobs[1].resolve('late-reveal');
  await next;
  assert.equal(f.queue.commit(), null);
  assert.equal(f.notifications, 0);
  await f.queue.request(10, 'wide');
  assert.equal(f.jobs.length, 2);
});

test('Fallback variants use the same phone and portrait breakpoints as their picture sources', () => {
  const cases = [[390, 844, 'mobile'], [700, 390, 'mobile'], [701, 1024, 'portrait'], [768, 1024, 'portrait'], [844, 390, 'wide'], [1100, 1100, 'portrait'], [1101, 1400, 'wide'], [3840, 2160, 'wide']];
  for (const [width, height, expected] of cases) assert.equal(stillVariant(width, height), expected);
  assert.equal(stillPath(0, 'wide'), 'stills/hero.webp');
  assert.equal(stillPath(5, 'portrait'), 'stills/portrait/layers.webp');
  assert.equal(stillPath(10, 'mobile'), 'stills/mobile/depth.webp');
});
