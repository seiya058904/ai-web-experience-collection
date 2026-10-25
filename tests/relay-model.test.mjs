import test from 'node:test';
import assert from 'node:assert/strict';
import { RelaySimulation, createPausedDemo, DEFAULT_MESSAGE, decodeCompletePrefix, validateDataBlock } from '../experiences/relay/src/model/relay-simulation.js';

const evidence = [];
const encoder = new TextEncoder();
const finish = (simulation) => { simulation.advance(simulation.options.deadline + 1); return simulation.getSnapshot(); };
const sameBytes = (snapshot) => {
  assert.ok(snapshot.reassembledBytes, 'Receiver must have a complete byte array');
  assert.deepEqual(Uint8Array.from(snapshot.reassembledBytes), Uint8Array.from(snapshot.originalBytes));
};
function record(name, simulation, extra = {}) {
  const state = simulation.getSnapshot();
  evidence.push({ name, result: 'PASS', seed: state.seed, scenario: state.scenario, config: { ...state.config, message: state.message, deadline: state.deadline },
    operations: structuredClone(simulation.operations), final: { time: state.time, status: state.status, receiverStatus: state.receiverStatus, senderStatus: state.senderStatus,
      terminal: state.terminal, reason: state.reason, receivedBytes: state.receivedBytes, totalBytes: state.totalBytes, stats: state.stats },
    byteComparison: state.receiverComplete ? { equal: Buffer.from(state.originalBytes).equals(Buffer.from(state.reassembledBytes)), original: state.originalBytes, reassembled: state.reassembledBytes } : { equal: false, reason: 'Receiver incomplete', original: state.originalBytes, reassembled: null }, ...extra });
}

test('UTF-8 byte intervals split Chinese, accented letters and emoji, then reassemble exactly', () => {
  const message = '见面吧，café ☕️ 🚀 — naïve e\u0301.';
  const simulation = new RelaySimulation({ message, seed: 20261024, scenario: 'out-of-order', chunkSize: 5, windowSize: 4 });
  const state = finish(simulation);
  sameBytes(state);
  assert.deepEqual(Uint8Array.from(state.reassembledBytes), encoder.encode(message), 'Compare against original submitted input, not only the model copy');
  assert.equal(state.assembledMessage, message);
  assert.equal(state.status, 'Confirmed');
  assert.ok(state.chunks.some((chunk) => chunk.start > 0 && (chunk.bytes[0] & 0xc0) === 0x80), 'At least one chunk begins inside a multibyte sequence');
  for (const snapshot of simulation.history) {
    assert.ok(message.startsWith(snapshot.readablePrefix));
    assert.ok(!snapshot.readablePrefix.includes('\ufffd'), 'No replacement character is invented');
    assert.equal(snapshot.readablePrefix, decodeCompletePrefix(encoder.encode(message).slice(0, snapshot.contiguousBytes)));
  }
  record('UTF-8 split and exact recombination', simulation, { incompleteCharacterBoundaryObserved: simulation.history.some((snapshot) => encoder.encode(snapshot.readablePrefix).length < snapshot.contiguousBytes) });
});

test('out-of-order arrival is buffered behind the first missing interval', () => {
  const simulation = new RelaySimulation({ scenario: 'out-of-order', seed: 411 });
  finish(simulation);
  const moment = simulation.history.find((snapshot) => snapshot.chunks[0].received && !snapshot.chunks[1].received && snapshot.chunks[2].received);
  assert.ok(moment, 'A real out-of-order moment must exist');
  assert.equal(moment.readablePrefix, 'Meet ');
  assert.ok(moment.chunks[2].arrivedEarly);
  assert.equal(moment.assembledMessage, null);
  sameBytes(simulation.getSnapshot());
  record('Out-of-order buffer', simulation, { observedMoment: { time: moment.time, readablePrefix: moment.readablePrefix, missingBlock: moment.chunks[1].id, earlyBlock: moment.chunks[2].id } });
});

test('a leading UTF-8 BOM remains part of the submitted message and exact payload', () => {
  const message = '\uFEFF你好é🚀';
  const originalInputBytes = encoder.encode(message);
  const simulation = new RelaySimulation({ message, scenario: 'clear', seed: 9293 });
  assert.deepEqual(simulation.originalBytes, originalInputBytes);
  const state = finish(simulation);
  assert.equal(state.message, message);
  assert.equal(state.assembledMessage, message);
  assert.deepEqual(Uint8Array.from(state.reassembledBytes), originalInputBytes);
  assert.equal(state.totalBytes, 15);
  for (const snapshot of simulation.history) {
    assert.ok(message.startsWith(snapshot.readablePrefix));
    if (snapshot.contiguousBytes > 0) assert.ok(snapshot.readablePrefix.startsWith('\uFEFF'));
  }
  record('Original leading BOM preserved byte for byte', simulation, { originalInputBytes: Array.from(originalInputBytes) });
});

test('an ACK identifies the received data attempt even when newer retries already exist', () => {
  const simulation = new RelaySimulation({ message: 'HELLO', scenario: 'clear', seed: 991, timeout: 1, maxAttempts: 4 });
  const state = finish(simulation);
  const acknowledgements = state.instances.filter((instance) => instance.kind === 'ack');
  assert.ok(acknowledgements.length >= 3);
  for (const acknowledgement of acknowledgements) {
    const data = state.instances.find((instance) => instance.id === acknowledgement.forInstanceId);
    assert.ok(data);
    assert.equal(data.kind, 'data');
    assert.equal(acknowledgement.attempt, data.attempt);
    assert.equal(acknowledgement.blockId, data.blockId);
  }
  assert.equal(acknowledgements[0].attempt, 1);
  sameBytes(state);
  record('ACK provenance matches triggering data instance', simulation, { provenance: acknowledgements.map((ack) => ({ ack: ack.id, data: ack.forInstanceId, attempt: ack.attempt })) });
});

test('detour has an actual data loss, retained copy, timeout and separate retransmission instance', () => {
  const simulation = new RelaySimulation({ scenario: 'detour', seed: 9293 });
  const state = finish(simulation);
  const lost = simulation.events.find((event) => event.type === 'data-lost');
  const retried = simulation.events.find((event) => event.type === 'retransmitted' && event.blockId === lost?.blockId);
  assert.ok(lost && retried);
  assert.notEqual(lost.instanceId, retried.instanceId);
  assert.equal(retried.time, state.config.timeout);
  assert.equal(state.stats.dataLost, 1);
  assert.equal(state.stats.retransmissions, 1);
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('Loss and retransmission', simulation, { lostInstance: lost.instanceId, replacementInstance: retried.instanceId });
});

test('one lost acknowledgement causes a duplicate receive without duplicate output', () => {
  const simulation = new RelaySimulation({ message: 'Acknowledged. ✦', scenario: 'clear', seed: 561 });
  assert.equal(simulation.loseNextAck(), true);
  assert.equal(simulation.loseNextAck(), false, 'Arming twice cannot create two losses');
  const state = finish(simulation);
  assert.equal(state.stats.acknowledgementsLost, 1);
  assert.ok(state.stats.duplicates >= 1);
  assert.ok(state.stats.retransmissions >= 1);
  assert.equal(simulation.events.filter((event) => event.type === 'message-received').length, 1);
  assert.equal(state.assembledMessage, 'Acknowledged. ✦');
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('One ACK lost; duplicate deduplicated and re-acknowledged', simulation);
});

test('Received is independent of Confirmation pending while acknowledgements travel', () => {
  const simulation = new RelaySimulation({ message: '已到é😀', scenario: 'clear', seed: 1001 });
  finish(simulation);
  const moment = simulation.history.find((snapshot) => snapshot.receiverComplete && !snapshot.allAcknowledged);
  assert.ok(moment);
  assert.equal(moment.receiverStatus, 'Received');
  assert.equal(moment.senderStatus, 'Confirmation pending');
  assert.ok(moment.chunks.some((chunk) => chunk.retained));
  assert.ok(moment.instances.some((instance) => instance.kind === 'ack' && ['queued', 'in-transit'].includes(instance.status)));
  record('Receiver truth before sender knowledge', simulation, { observedMoment: { time: moment.time, receiverStatus: moment.receiverStatus, senderStatus: moment.senderStatus } });
});

test('all acknowledgements lost: complete receiver bytes and uncertain sender survive terminal state and review', () => {
  for (const [message, seed] of [['已到é😀', 7301], [DEFAULT_MESSAGE, 7302]]) {
    const simulation = new RelaySimulation({ message, scenario: 'ack-loss', seed });
    const state = finish(simulation);
    sameBytes(state);
    assert.equal(state.receiverStatus, 'Received');
    assert.equal(state.senderStatus, 'Confirmation pending');
    assert.equal(state.status, 'Confirmation pending');
    assert.ok(state.terminal);
    assert.equal(simulation.events.filter((event) => event.type === 'ack-received').length, 0);
    assert.ok(state.chunks.every((chunk) => chunk.retained));
    const before = JSON.stringify(simulation.exportTrace());
    const index = simulation.history.findIndex((snapshot) => snapshot.receiverComplete);
    const recorded = simulation.getRecordedSnapshot(index);
    assert.equal(recorded.isRecorded, true);
    assert.equal(recorded.receiverStatus, 'Received');
    assert.equal(recorded.senderStatus, 'Confirmation pending');
    sameBytes(recorded);
    assert.equal(JSON.stringify(simulation.exportTrace()), before, 'Review must not alter the live round');
    record('All ACKs lost; received remains received', simulation, { reviewedHistoryIndex: index, reviewReceiverStatus: recorded.receiverStatus, reviewSenderStatus: recorded.senderStatus });
  }
});

test('complete disconnection produces a real incomplete ending with zero delivered bytes', () => {
  const simulation = new RelaySimulation({ scenario: 'all-cut', seed: 2718 });
  const state = finish(simulation);
  assert.equal(state.status, 'Incomplete');
  assert.equal(state.receiverStatus, 'Incomplete');
  assert.equal(state.receivedBytes, 0);
  assert.equal(state.assembledMessage, null);
  assert.ok(state.reason.includes('deadline'));
  assert.ok(state.chunks.every((chunk) => chunk.attempts <= state.config.maxAttempts));
  assert.equal(simulation.events.filter((event) => event.type === 'data-received').length, 0);
  assert.equal(simulation.events.filter((event) => event.type === 'departed' && ['upper', 'lower'].includes(event.edgeId)).length, 0);
  record('All paths closed: genuine failure', simulation);
});

test('reopening a path within the remaining budget resumes queued data and succeeds', () => {
  const simulation = new RelaySimulation({ scenario: 'all-cut', seed: 31415 });
  simulation.advance(6);
  assert.equal(simulation.getSnapshot().receivedBytes, 0);
  simulation.setEdgeEnabled('upper', true);
  const state = finish(simulation);
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('Recovery within budget', simulation);
});

test('closing an edge permits an already entered hop to finish and forbids later admission', () => {
  const simulation = new RelaySimulation({ scenario: 'clear', seed: 100, message: 'Four chunks in a queue.' });
  simulation.advance(1.1);
  const travelling = simulation.getSnapshot().instances.find((instance) => instance.edgeId === 'upper' && instance.status === 'in-transit');
  assert.ok(travelling);
  const closeTime = simulation.time;
  simulation.setEdgeEnabled('upper', false);
  const state = finish(simulation);
  const after = state.instances.find((instance) => instance.id === travelling.id);
  assert.ok(after.hops.find((hop) => hop.edgeId === 'upper')?.completed);
  assert.equal(simulation.events.filter((event) => event.type === 'departed' && ['upper', 'upper-return'].includes(event.edgeId) && event.time > closeTime).length, 0);
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('Closure semantics: finish current hop, block later admission', simulation, { inFlightAtClosure: travelling.id, scheduledHopEndUnchanged: after.hops.find((hop) => hop.edgeId === 'upper').endTime === travelling.endTime });
});

test('queue speed changes admission cadence while an in-flight propagation end remains fixed', () => {
  const simulation = new RelaySimulation({ scenario: 'clear', seed: 239 });
  simulation.advance(0.1);
  const first = simulation.getSnapshot().instances.find((instance) => instance.kind === 'data' && instance.blockIndex === 0);
  simulation.setEdgeSpeed('source', 0.1);
  simulation.advance(5);
  const admissions = simulation.events.filter((event) => event.type === 'departed' && event.edgeId === 'source');
  assert.ok(admissions.length >= 2);
  assert.ok(admissions[1].time - admissions[0].time >= 3.399999);
  const moved = simulation.getSnapshot().instances.find((instance) => instance.id === first.id);
  assert.equal(moved.hops[0].endTime, first.endTime);
  record('Admission speed affects real queue timing', simulation, { firstAdmissions: admissions.slice(0, 2).map((event) => event.time), firstHopEnd: first.endTime });
});

test('same seed and operations give byte-for-byte identical events under different render cadence', () => {
  const operations = [
    [0.8, (simulation) => simulation.setEdgeEnabled('upper', false)],
    [2, (simulation) => simulation.setEdgeSpeed('lower', 0.25)],
    [5, (simulation) => simulation.loseNextAck()],
    [7, (simulation) => simulation.setEdgeEnabled('upper', true)],
    [9, (simulation) => simulation.setEdgeSpeed('lower', 1.2)],
  ];
  const run = (fragmented) => {
    const simulation = new RelaySimulation({ scenario: 'clear', seed: 987654 });
    for (const [target, operation] of operations) {
      while (fragmented && simulation.time + 0.083 < target) simulation.advance(0.083);
      simulation.advance(target - simulation.time);
      operation(simulation);
    }
    if (fragmented) while (!simulation.terminal) simulation.advance(0.017);
    else finish(simulation);
    return simulation;
  };
  const a = run(false);
  const b = run(true);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.operations, b.operations);
  assert.deepEqual(a.getSnapshot(), b.getSnapshot());
  record('Frame-rate independence', a, { comparedCadences: ['large explicit advances', '83 ms then 17 ms advances'], identicalEvents: true });
});

test('reads, recorded snapshots and hypothetical scroll callbacks never advance facts', () => {
  const simulation = createPausedDemo();
  const before = JSON.stringify(simulation.exportTrace());
  const historyLength = simulation.history.length;
  for (let i = 0; i < 300; i += 1) {
    const snapshot = simulation.getSnapshot();
    snapshot.chunks[0].bytes[0] = 0;
    snapshot.instances[0].hops[0].endTime = 999;
    const historical = simulation.getRecordedSnapshot(i % historyLength);
    historical.stats.sends = 999;
    simulation.getSnapshotAtEvent(i % simulation.events.length);
  }
  assert.equal(JSON.stringify(simulation.exportTrace()), before);
  assert.equal(simulation.history.length, historyLength);
  record('Pure snapshot/history reads; paused state stays fixed', simulation, { readCount: 900, historyLength });
});

test('opening state is genuinely computed, partial, paused, and contains the missing block retransmission', () => {
  const simulation = createPausedDemo();
  const state = simulation.getSnapshot();
  assert.equal(state.readablePrefix, 'Meet ');
  assert.equal(state.receivedBytes, 15);
  assert.equal(state.chunks[1].received, false);
  assert.equal(state.chunks[2].received, true);
  assert.ok(state.instances.some((instance) => instance.blockIndex === 1 && instance.attempt === 2 && instance.status === 'in-transit' && instance.from === 'A'));
  assert.ok(simulation.events.some((event) => event.type === 'data-lost'));
  assert.ok(simulation.events.some((event) => event.type === 'timeout'));
  assert.equal(simulation.events.at(-1).type, 'demo-paused');
  record('Real paused Hero state', simulation, { time: state.time, fullEventCount: simulation.events.length });
});

test('reset invalidates every old scheduled event and isolates new message bytes', () => {
  const simulation = new RelaySimulation({ message: 'OLD MESSAGE MUST GO', scenario: 'clear', seed: 88 });
  simulation.advance(3);
  const oldRound = simulation.roundId;
  simulation.reset({ message: '新的é🚀', scenario: 'clear', seed: 89 });
  const state = finish(simulation);
  assert.notEqual(state.roundId, oldRound);
  assert.ok(simulation.events.every((event) => event.roundId === state.roundId));
  assert.ok(state.instances.every((instance) => instance.roundId === state.roundId));
  assert.equal(state.assembledMessage, '新的é🚀');
  sameBytes(state);
  record('Reset isolates round and pending event queue', simulation, { oldRound });
});

test('sender window and per-block retry budget remain finite in every recorded state', () => {
  const simulation = new RelaySimulation({ message: 'A finite window must hold even when nothing returns. 中文🚀', scenario: 'ack-loss', seed: 61, windowSize: 3, maxAttempts: 3 });
  finish(simulation);
  for (const snapshot of simulation.history) {
    const outstanding = snapshot.chunks.filter((block) => block.attempts > 0 && !block.acknowledged && !block.exhausted);
    assert.ok(outstanding.length <= 3);
    assert.ok(snapshot.chunks.every((block) => block.attempts <= 3));
  }
  record('Finite window and retry limits', simulation, { inspectedSnapshots: simulation.history.length });
});

test('byte validation rejects foreign rounds, wrong ranges, truncation and changed payloads', () => {
  const simulation = new RelaySimulation({ scenario: 'clear', seed: 90 });
  const state = simulation.getSnapshot();
  const block = state.chunks[0];
  const valid = { roundId: state.roundId, blockId: block.id, start: block.start, length: block.length, bytes: block.bytes };
  assert.equal(validateDataBlock(valid, block, state.roundId).valid, true);
  const malformed = [
    { ...valid, roundId: 'r-old' }, { ...valid, blockId: 'r1:b999' },
    { ...valid, start: 1 }, { ...valid, length: 4 }, { ...valid, bytes: block.bytes.slice(1) },
    { ...valid, bytes: [0, ...block.bytes.slice(1)] }, { ...valid, bytes: [256, ...block.bytes.slice(1)] },
  ];
  for (const packet of malformed) assert.equal(validateDataBlock(packet, block, state.roundId).valid, false);
  record('Receiver byte identity/range/payload validation', simulation, { rejectedMalformedPackets: malformed.length });
});

test('acknowledgements use available return edges and wait when their routes are closed', () => {
  const simulation = new RelaySimulation({ message: 'ACK.', scenario: 'clear', seed: 119 });
  let guard = 0;
  while (!simulation.getSnapshot().receiverComplete && guard++ < 200) simulation.step();
  const closeTime = simulation.time;
  simulation.setEdgeEnabled('upper', false);
  simulation.setEdgeEnabled('lower', false);
  simulation.advance(8);
  const blocked = simulation.getSnapshot();
  assert.equal(blocked.receiverStatus, 'Received');
  assert.equal(blocked.senderStatus, 'Confirmation pending');
  assert.ok(blocked.instances.some((instance) => instance.kind === 'ack' && instance.status === 'waiting'));
  assert.equal(simulation.events.filter((event) => event.type === 'departed' && ['upper-return', 'lower-return'].includes(event.edgeId) && event.time > closeTime).length, 0);
  simulation.setEdgeEnabled('upper', true);
  const state = finish(simulation);
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('ACK respects channel closure and recovery', simulation, { closedAt: closeTime, blockedReceiverStatus: blocked.receiverStatus, blockedSenderStatus: blocked.senderStatus });
});

test('terminal rounds cannot silently resume, and explicit reset can start a new one', () => {
  const simulation = new RelaySimulation({ scenario: 'all-cut', seed: 42 });
  finish(simulation);
  const before = JSON.stringify(simulation.exportTrace());
  assert.equal(simulation.setEdgeEnabled('upper', true), false);
  assert.equal(simulation.setEdgeSpeed('lower', 2), false);
  assert.equal(simulation.loseNextAck(), false);
  simulation.advance(500);
  simulation.step();
  assert.equal(JSON.stringify(simulation.exportTrace()), before);
  simulation.reset({ scenario: 'clear' });
  const state = finish(simulation);
  assert.equal(state.status, 'Confirmed');
  sameBytes(state);
  record('Terminal is immutable until explicit new round', simulation);
});

test('a deadline in the middle of a hop strands it rather than inventing an arrival', () => {
  const simulation = new RelaySimulation({ message: 'Still in flight.', scenario: 'clear', seed: 110, deadline: 1.5 });
  const state = finish(simulation);
  assert.equal(state.status, 'Incomplete');
  assert.equal(state.receivedBytes, 0);
  assert.ok(state.instances.some((instance) => instance.status === 'stranded' && instance.previousStatus === 'in-transit' && instance.progress > 0 && instance.progress < 1));
  record('Mid-hop deadline preserves an honest stranded position', simulation);
});

test('all data traversals are continuous edge-by-edge and never teleport between nodes', () => {
  const simulation = new RelaySimulation({ scenario: 'clear', seed: 963 });
  simulation.advance(1.4);
  simulation.setEdgeEnabled('upper', false);
  simulation.advance(2);
  simulation.setEdgeSpeed('lower', 0.4);
  finish(simulation);
  for (const instance of simulation.getSnapshot().instances) {
    let node = instance.kind === 'data' ? 'S' : 'R';
    let earliest = instance.createdAt;
    for (const hop of instance.hops) {
      assert.equal(hop.from, node);
      assert.ok(hop.startTime >= earliest);
      assert.ok(hop.endTime > hop.startTime);
      node = hop.to;
      earliest = hop.endTime;
    }
  }
  sameBytes(simulation.getSnapshot());
  record('Continuous traversal identity and geometry inputs', simulation);
});

test('input limits measure UTF-8 bytes, and invalid temporal controls are rejected', () => {
  assert.throws(() => new RelaySimulation({ message: '' }), /at least one/);
  assert.throws(() => new RelaySimulation({ message: '你'.repeat(41) }), /120-byte/);
  assert.throws(() => new RelaySimulation({ scenario: 'invented' }), /Unknown scenario/);
  const simulation = new RelaySimulation({ message: '你'.repeat(40), scenario: 'clear', seed: 12 });
  assert.equal(simulation.originalBytes.length, 120);
  assert.throws(() => simulation.advance(-1), /non-negative/);
  assert.throws(() => simulation.setEdgeSpeed('lower', 0), /0.1/);
  assert.throws(() => simulation.setEdgeEnabled('missing', false), /Unknown channel/);
  record('UTF-8 input and operation validation', simulation);
});
