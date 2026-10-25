/**
 * RELAY's deterministic, browser-local toy transport protocol.
 *
 * All times are demonstration seconds. This is not TCP, QUIC, or an Internet
 * routing implementation. Rendering, scrolling, and history inspection never
 * call this clock: only advance(), step(), and explicit input operations do.
 */

export const DEFAULT_MESSAGE = 'Meet me at the other end. ✦';
export const DEFAULT_SEED = 9293;
export const SCENARIOS = Object.freeze({
  detour: { label: 'A way around', description: 'The upper channel starts closed. One first attempt is lost; its retained copy can be sent again.' },
  'out-of-order': { label: 'Out of order', description: 'A slow first passage for block 02 lets later blocks arrive before it.' },
  'all-cut': { label: 'No way through', description: 'Both channels start closed. Reopen one within the remaining retry budget, or observe a real incomplete ending.' },
  'ack-loss': { label: 'Uncertain sender', description: 'Every acknowledgement is lost. Receiver truth and sender knowledge remain separate.' },
  clear: { label: 'An open route', description: 'Both channels are open; there is no deliberate loss.' },
});

const NODE_IDS = ['S', 'A', 'B', 'C', 'D', 'R'];
const NODE_NAMES = { S: 'Sender', A: 'Fork', B: 'Upper passage', C: 'Lower passage', D: 'Merge', R: 'Receiver' };
const CHANNELS = [
  ['source', 'S', 'A', 0.75, 0.55, 'Entry'],
  ['upper', 'A', 'B', 1.3, 0.65, 'Upper channel'],
  ['upper-join', 'B', 'D', 0.85, 0.55, 'Upper approach'],
  ['lower', 'A', 'C', 2.4, 1.35, 'Lower channel'],
  ['lower-join', 'C', 'D', 1.0, 0.7, 'Lower approach'],
  ['delivery', 'D', 'R', 0.65, 0.7, 'Arrival'],
];
const ACTIVE = new Set(['waiting', 'queued', 'in-transit']);
const encoder = new TextEncoder();
const clone = (value) => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundTime = (value) => Math.round(value * 1e9) / 1e9;

/** The PRNG is advanced only while scheduling transport events. */
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedNumber(value) {
  if (Number.isFinite(Number(value))) return Number(value) >>> 0;
  let n = 2166136261;
  for (const character of String(value)) n = Math.imul(n ^ character.codePointAt(0), 16777619);
  return n >>> 0;
}

/** Decode only complete UTF-8 characters before the first missing byte. */
export function decodeCompletePrefix(bytes) {
  // A fresh decoder means reading a snapshot never changes decoder state.
  // stream:true withholds an incomplete trailing multibyte character.
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes, { stream: true });
}

/** Check exact identity, range, length and byte payload before accepting data. */
export function validateDataBlock(packet, expected, roundId) {
  if (!packet || !expected) return { valid: false, reason: 'Unknown block' };
  if (packet.roundId !== roundId || packet.blockId !== expected.id) return { valid: false, reason: 'Wrong round or block identity' };
  if (!Number.isInteger(packet.start) || packet.start !== expected.start || packet.length !== expected.length) return { valid: false, reason: 'Invalid byte range' };
  if (!packet.bytes || packet.bytes.length !== expected.length) return { valid: false, reason: 'Invalid payload length' };
  for (let i = 0; i < expected.length; i += 1) {
    if (!Number.isInteger(packet.bytes[i]) || packet.bytes[i] < 0 || packet.bytes[i] > 255 || packet.bytes[i] !== expected.bytes[i]) {
      return { valid: false, reason: 'Payload mismatch' };
    }
  }
  return { valid: true, reason: null };
}

function normalizedOptions(options = {}) {
  const message = String(options.message ?? DEFAULT_MESSAGE);
  const bytes = encoder.encode(message);
  const maxBytes = options.maxBytes ?? 120;
  if (!bytes.length) throw new RangeError('Enter at least one UTF-8 byte.');
  if (bytes.length > maxBytes) throw new RangeError(`The message exceeds the ${maxBytes}-byte limit.`);
  const scenario = options.scenario ?? 'detour';
  if (!Object.hasOwn(SCENARIOS, scenario)) throw new RangeError(`Unknown scenario: ${scenario}`);
  const positive = (name, value, fallback, min, max) => {
    const result = value ?? fallback;
    if (!Number.isFinite(result) || result < min || result > max) throw new RangeError(`Invalid ${name}.`);
    return result;
  };
  return {
    message: new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes),
    seed: seedNumber(options.seed ?? DEFAULT_SEED),
    scenario,
    chunkSize: Math.floor(positive('chunk size', options.chunkSize, 5, 1, 24)),
    windowSize: Math.floor(positive('window size', options.windowSize, 4, 1, 12)),
    timeout: positive('timeout', options.timeout, 11, 0.1, 120),
    maxAttempts: Math.floor(positive('attempt limit', options.maxAttempts, 4, 1, 12)),
    deadline: positive('deadline', options.deadline, 64, 0.1, 600),
    maxBytes,
    dropAllAcks: options.dropAllAcks ?? scenario === 'ack-loss',
    lossProbability: clamp(Number(options.lossProbability ?? 0), 0, 1),
    ackLossProbability: clamp(Number(options.ackLossProbability ?? 0), 0, 1),
    propagationJitter: positive('propagation jitter', options.propagationJitter, 0.11, 0, 2),
  };
}

export class RelaySimulation {
  constructor(options = {}) {
    this.generation = 0;
    this.reset(options, { initial: true });
  }

  /** Start an explicitly new round. Old events, queues, and history are discarded. */
  reset(options = {}, { initial = false } = {}) {
    const nextOptions = normalizedOptions({ ...(this.options ?? {}), ...options });
    // A scenario change should not inherit an all-ACK-loss switch accidentally.
    if (Object.hasOwn(options, 'scenario') && !Object.hasOwn(options, 'dropAllAcks')) {
      nextOptions.dropAllAcks = options.scenario === 'ack-loss';
    }
    this.options = nextOptions;
    this.generation += 1;
    this.roundId = `r${this.generation}`;
    this.time = 0;
    this.terminal = false;
    this.reason = null;
    this.events = [];
    this.operations = [];
    this.history = [];
    this._queue = [];
    this._eventOrder = 0;
    this._instanceOrder = 0;
    this._historyOrder = 0;
    this._random = mulberry32(this.options.seed);
    this._loseNextAck = false;
    this._presetLossUsed = false;
    this._presetDelayUsed = false;
    this._buffer = new Map();
    this._instances = new Map();
    this._edges = new Map();
    this.originalBytes = encoder.encode(this.options.message);
    this.stats = { sends: 0, retransmissions: 0, dataArrivals: 0, duplicates: 0, dataLost: 0, acknowledgements: 0, acknowledgementsLost: 0, invalidData: 0 };
    this.chunks = [];
    for (let start = 0, index = 0; start < this.originalBytes.length; start += this.options.chunkSize, index += 1) {
      const bytes = this.originalBytes.slice(start, start + this.options.chunkSize);
      this.chunks.push({
        id: `${this.roundId}:b${index}`, blockId: `${this.roundId}:b${index}`, roundId: this.roundId,
        index, number: index + 1, start, length: bytes.length, bytes: Array.from(bytes),
        attempts: 0, acknowledged: false, exhausted: false, firstSentAt: null,
        lastSentAt: null, receivedAt: null, acknowledgedAt: null, arrivedEarly: false,
      });
    }
    for (const [id, from, to, delay, returnDelay, label] of CHANNELS) {
      for (const direction of ['forward', 'return']) {
        const isReturn = direction === 'return';
        const edgeId = isReturn ? `${id}-return` : id;
        this._edges.set(edgeId, {
          id: edgeId, channelId: id, label, from: isReturn ? to : from, to: isReturn ? from : to,
          direction, enabled: true, delay: isReturn ? returnDelay : delay,
          speed: 1, serviceInterval: 0.34, nextAvailable: 0, lastAdmission: -Infinity,
          queue: [], scheduled: false, version: 0,
        });
      }
    }
    if (this.options.scenario === 'detour' || this.options.scenario === 'all-cut') this._setChannel('upper', false);
    if (this.options.scenario === 'all-cut') this._setChannel('lower', false);
    this._log('round-started', { message: this.options.message, seed: this.options.seed, scenario: this.options.scenario, bytes: this.originalBytes.length });
    this._schedule(this.options.deadline, 'deadline', {});
    this._fillWindow();
    this._record(initial ? 'initial' : 'reset');
    return this.getSnapshot();
  }

  _log(type, details = {}) {
    const event = { index: this.events.length, time: this.time, order: this.events.length, roundId: this.roundId, ...details, type };
    this.events.push(event);
    return event;
  }

  _schedule(time, type, details) {
    const event = { time: roundTime(Math.max(time, this.time)), order: this._eventOrder++, roundId: this.roundId, type, details };
    // The stable (time, order) key is independent of rendering frequency.
    let low = 0;
    let high = this._queue.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const other = this._queue[middle];
      if (other.time < event.time || (other.time === event.time && other.order < event.order)) low = middle + 1;
      else high = middle;
    }
    this._queue.splice(low, 0, event);
  }

  /** Advance only by the explicitly supplied duration; never reads wall time. */
  advance(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('advance() requires a non-negative number of seconds.');
    if (this.terminal || dt === 0) return this.getSnapshot();
    const target = roundTime(Math.min(this.time + dt, this.options.deadline));
    let processed = 0;
    while (!this.terminal && this._queue.length && this._queue[0].time <= target) {
      const event = this._queue.shift();
      if (event.roundId !== this.roundId) continue;
      this.time = event.time;
      this._handle(event);
      this._completeIfDone();
      this._record(event.type);
      if (++processed > 100000) throw new Error('Event budget exceeded; the event queue is not converging.');
    }
    if (!this.terminal) this.time = target;
    return this.getSnapshot();
  }

  /** Process the next timestamp, including every stable-ordered event at it. */
  step() {
    if (this.terminal || !this._queue.length) return this.getSnapshot();
    const nextTime = this._queue[0].time;
    let processed = 0;
    while (!this.terminal && this._queue.length && this._queue[0].time === nextTime) {
      const event = this._queue.shift();
      if (event.roundId !== this.roundId) continue;
      this.time = event.time;
      this._handle(event);
      this._completeIfDone();
      this._record(event.type);
      if (++processed > 10000) throw new Error('Same-time event budget exceeded.');
    }
    return this.getSnapshot();
  }

  _handle(event) {
    const detail = event.details;
    switch (event.type) {
      case 'admit': this._admit(detail.edgeId, detail.version); break;
      case 'arrive': this._arrive(detail.instanceId, detail.hop); break;
      case 'timeout': this._timeout(detail.blockId, detail.attempt); break;
      case 'release-delay': {
        const instance = this._instances.get(detail.instanceId);
        if (instance?.status === 'waiting' && instance.delayedUntil === this.time) {
          instance.delayedUntil = null;
          this._log('delay-released', { instanceId: instance.id, blockId: instance.blockId, node: instance.node });
          this._route(instance);
        }
        break;
      }
      case 'deadline': this._finish('Total demonstration deadline reached.'); break;
      default: throw new Error(`Unknown scheduled event: ${event.type}`);
    }
  }

  _fillWindow() {
    if (this.terminal) return;
    let outstanding = this.chunks.filter((block) => block.attempts > 0 && !block.acknowledged && !block.exhausted).length;
    for (const block of this.chunks) {
      if (outstanding >= this.options.windowSize) break;
      if (block.attempts === 0) { this._send(block); outstanding += 1; }
    }
  }

  _send(block) {
    if (this.terminal || block.acknowledged || this.time >= this.options.deadline) return;
    block.attempts += 1;
    block.lastSentAt = this.time;
    block.firstSentAt ??= this.time;
    this.stats.sends += 1;
    if (block.attempts > 1) this.stats.retransmissions += 1;
    const instance = this._newInstance('data', block, 'S');
    this._log(block.attempts === 1 ? 'sent' : 'retransmitted', { blockId: block.id, blockIndex: block.index, instanceId: instance.id, attempt: block.attempts, start: block.start, length: block.length });
    this._schedule(this.time + this.options.timeout, 'timeout', { blockId: block.id, attempt: block.attempts });
    this._route(instance);
  }

  _newInstance(kind, block, node) {
    const instance = {
      id: `${this.roundId}:${kind === 'data' ? 'd' : 'a'}${++this._instanceOrder}`,
      roundId: this.roundId, kind, blockId: block.id, blockIndex: block.index,
      attempt: block.attempts, start: block.start, length: block.length, bytes: [...block.bytes],
      status: 'waiting', node, edgeId: null, createdAt: this.time,
      startTime: null, endTime: null, completedAt: null, delayedUntil: null,
      hops: [], hop: 0, lossReason: null,
    };
    this._instances.set(instance.id, instance);
    return instance;
  }

  _timeout(blockId, attempt) {
    const block = this.chunks.find((item) => item.id === blockId);
    if (!block || block.acknowledged || attempt !== block.attempts || block.exhausted) return;
    this._log('timeout', { blockId, blockIndex: block.index, attempt });
    if (block.attempts < this.options.maxAttempts) this._send(block);
    else {
      block.exhausted = true;
      this._log('retry-limit', { blockId, blockIndex: block.index, attempts: block.attempts });
      this._fillWindow();
    }
  }

  _shortestPath(start, destination, direction) {
    const distance = new Map(NODE_IDS.map((id) => [id, Infinity]));
    const previous = new Map();
    const unvisited = new Set(NODE_IDS);
    distance.set(start, 0);
    while (unvisited.size) {
      let node = null;
      let best = Infinity;
      for (const candidate of NODE_IDS) {
        if (unvisited.has(candidate) && distance.get(candidate) < best) { node = candidate; best = distance.get(candidate); }
      }
      if (node === null) break;
      if (node === destination) break;
      unvisited.delete(node);
      for (const edge of this._edges.values()) {
        if (!edge.enabled || edge.direction !== direction || edge.from !== node || !unvisited.has(edge.to)) continue;
        const wait = Math.max(0, edge.nextAvailable - this.time) + edge.queue.length * edge.serviceInterval / edge.speed;
        const proposed = best + edge.delay + wait;
        if (proposed < distance.get(edge.to)) { distance.set(edge.to, proposed); previous.set(edge.to, edge); }
      }
    }
    if (!Number.isFinite(distance.get(destination))) return null;
    const path = [];
    for (let node = destination; node !== start;) {
      const edge = previous.get(node);
      if (!edge) return null;
      path.unshift(edge.id);
      node = edge.from;
    }
    return path;
  }

  _route(instance) {
    if (this.terminal || !ACTIVE.has(instance.status) || instance.delayedUntil !== null) return;
    const destination = instance.kind === 'data' ? 'R' : 'S';
    if (instance.node === destination) {
      if (instance.kind === 'data') this._receiveData(instance);
      else this._receiveAck(instance);
      return;
    }
    const path = this._shortestPath(instance.node, destination, instance.kind === 'data' ? 'forward' : 'return');
    if (!path?.length) {
      instance.status = 'waiting';
      instance.edgeId = null;
      instance.startTime = null;
      instance.endTime = null;
      this._log('waiting', { instanceId: instance.id, blockId: instance.blockId, kind: instance.kind, node: instance.node, reason: 'No enabled route' });
      return;
    }
    const edge = this._edges.get(path[0]);
    instance.status = 'queued';
    instance.edgeId = edge.id;
    instance.startTime = null;
    instance.endTime = null;
    edge.queue.push(instance.id);
    this._log('queued', { instanceId: instance.id, blockId: instance.blockId, kind: instance.kind, edgeId: edge.id, node: instance.node, queuePosition: edge.queue.length - 1 });
    this._pump(edge);
  }

  _pump(edge) {
    if (!edge.enabled || edge.scheduled || !edge.queue.length || this.terminal) return;
    edge.scheduled = true;
    this._schedule(Math.max(this.time, edge.nextAvailable), 'admit', { edgeId: edge.id, version: edge.version });
  }

  _admit(edgeId, version) {
    const edge = this._edges.get(edgeId);
    if (!edge || edge.version !== version) return;
    edge.scheduled = false;
    if (!edge.enabled) return;
    let instance;
    while (edge.queue.length && !instance) {
      const candidate = this._instances.get(edge.queue.shift());
      if (candidate?.status === 'queued' && candidate.edgeId === edge.id) instance = candidate;
    }
    if (!instance) return;
    instance.status = 'in-transit';
    instance.startTime = this.time;
    instance.endTime = roundTime(this.time + edge.delay + this._random() * this.options.propagationJitter);
    instance.hop += 1;
    instance.hops.push({ edgeId: edge.id, from: edge.from, to: edge.to, startTime: this.time, endTime: instance.endTime, completed: false });
    edge.lastAdmission = this.time;
    edge.nextAvailable = roundTime(this.time + edge.serviceInterval / edge.speed);
    this._log('departed', { instanceId: instance.id, blockId: instance.blockId, kind: instance.kind, edgeId: edge.id, from: edge.from, to: edge.to, endTime: instance.endTime });
    this._schedule(instance.endTime, 'arrive', { instanceId: instance.id, hop: instance.hop });
    this._pump(edge);
  }

  _arrive(instanceId, hop) {
    const instance = this._instances.get(instanceId);
    if (!instance || instance.status !== 'in-transit' || instance.hop !== hop) return;
    const edge = this._edges.get(instance.edgeId);
    const traversal = instance.hops.at(-1);
    traversal.completed = true;
    instance.node = edge.to;
    instance.status = 'waiting';
    instance.edgeId = null;
    instance.startTime = null;
    instance.endTime = null;
    this._log('hop-complete', { instanceId, blockId: instance.blockId, kind: instance.kind, edgeId: edge.id, node: instance.node });
    if (this._shouldDrop(instance, edge)) return;
    // A documented one-off holding gate, independent of layout and frame rate.
    if (this.options.scenario === 'out-of-order' && instance.kind === 'data' && instance.blockIndex === 1 && instance.attempt === 1 && instance.node === 'A' && !this._presetDelayUsed) {
      this._presetDelayUsed = true;
      instance.delayedUntil = roundTime(this.time + 4.2);
      this._log('delay-held', { instanceId, blockId: instance.blockId, node: 'A', until: instance.delayedUntil, reason: 'Scenario holding gate' });
      this._schedule(instance.delayedUntil, 'release-delay', { instanceId });
      return;
    }
    this._route(instance);
  }

  _shouldDrop(instance, edge) {
    let reason = null;
    if (instance.kind === 'ack' && this._loseNextAck) { this._loseNextAck = false; reason = 'One acknowledgement deliberately lost'; }
    else if (instance.kind === 'ack' && this.options.dropAllAcks) reason = 'All-acknowledgement-loss scenario';
    else if (instance.kind === 'data' && this.options.scenario === 'detour' && instance.blockIndex === 1 && instance.attempt === 1 && edge.channelId === 'delivery' && !this._presetLossUsed) {
      this._presetLossUsed = true;
      reason = 'One first data attempt lost in the demonstration';
    } else {
      const probability = instance.kind === 'data' ? this.options.lossProbability : this.options.ackLossProbability;
      if (probability > 0 && this._random() < probability) reason = 'Seeded transport loss';
    }
    if (reason === null) return false;
    instance.status = 'lost';
    instance.completedAt = this.time;
    instance.lossReason = reason;
    if (instance.kind === 'data') this.stats.dataLost += 1;
    else this.stats.acknowledgementsLost += 1;
    this._log(instance.kind === 'data' ? 'data-lost' : 'ack-lost', { instanceId: instance.id, blockId: instance.blockId, blockIndex: instance.blockIndex, edgeId: edge.id, reason });
    return true;
  }

  _receiveData(instance) {
    const block = this.chunks[instance.blockIndex];
    const validation = validateDataBlock(instance, block, this.roundId);
    instance.completedAt = this.time;
    if (!validation.valid) {
      instance.status = 'invalid';
      this.stats.invalidData += 1;
      this._log('invalid-data', { instanceId: instance.id, blockId: instance.blockId, reason: validation.reason });
      return;
    }
    const duplicate = this._buffer.has(block.id);
    instance.status = duplicate ? 'duplicate' : 'received';
    this.stats.dataArrivals += 1;
    if (duplicate) this.stats.duplicates += 1;
    else {
      block.arrivedEarly = this.chunks.slice(0, block.index).some((earlier) => !this._buffer.has(earlier.id));
      block.receivedAt = this.time;
      this._buffer.set(block.id, Uint8Array.from(instance.bytes));
    }
    this._log(duplicate ? 'duplicate-received' : 'data-received', { instanceId: instance.id, blockId: block.id, blockIndex: block.index, start: block.start, length: block.length, arrivedEarly: block.arrivedEarly });
    const ack = this._newInstance('ack', block, 'R');
    ack.attempt = instance.attempt;
    ack.forInstanceId = instance.id;
    this.stats.acknowledgements += 1;
    this._log('ack-created', { instanceId: ack.id, blockId: block.id, forInstanceId: instance.id, duplicate });
    this._route(ack);
    if (!duplicate && this._buffer.size === this.chunks.length) this._log('message-received', { bytes: this.originalBytes.length, message: this.options.message });
  }

  _receiveAck(instance) {
    const block = this.chunks.find((item) => item.id === instance.blockId);
    instance.status = 'acknowledged';
    instance.completedAt = this.time;
    if (!block || instance.roundId !== this.roundId || !this._buffer.has(block.id)) {
      instance.status = 'invalid';
      this._log('invalid-ack', { instanceId: instance.id, blockId: instance.blockId });
      return;
    }
    const duplicate = block.acknowledged;
    block.acknowledged = true;
    block.acknowledgedAt ??= this.time;
    this._log(duplicate ? 'duplicate-ack' : 'ack-received', { instanceId: instance.id, blockId: block.id, blockIndex: block.index });
    this._fillWindow();
  }

  _completeIfDone() {
    if (this.terminal) return;
    const active = [...this._instances.values()].filter((instance) => ACTIVE.has(instance.status));
    const allAcknowledged = this.chunks.every((block) => block.acknowledged);
    if (allAcknowledged && active.length === 0) { this._finish('Every block has been received and acknowledged.'); return; }
    const noMoreAttempts = this.chunks.every((block) => block.acknowledged || block.exhausted);
    if (noMoreAttempts && active.length === 0) this._finish('The retry budget is exhausted.');
  }

  _finish(reason) {
    this.terminal = true;
    this.reason = reason;
    this._queue = [];
    // Preserve last positions. Active instances become explicitly stranded at
    // the deadline, never silently counted as lost or received.
    for (const instance of this._instances.values()) {
      if (ACTIVE.has(instance.status)) {
        instance.finalProgress = instance.status === 'in-transit' ? clamp((this.time - instance.startTime) / (instance.endTime - instance.startTime), 0, 1) : 0;
        instance.previousStatus = instance.status;
        instance.status = 'stranded';
      }
    }
    for (const edge of this._edges.values()) { edge.scheduled = false; edge.queue = []; }
    const received = this._buffer.size === this.chunks.length;
    const confirmed = this.chunks.every((block) => block.acknowledged);
    this._log('round-finished', { receiverStatus: received ? 'Received' : 'Incomplete', senderStatus: confirmed ? 'Confirmed' : 'Confirmation pending', reason });
  }

  _setChannel(id, enabled) {
    const channelId = id.endsWith('-return') ? id.slice(0, -7) : id;
    const edges = [...this._edges.values()].filter((edge) => edge.channelId === channelId);
    if (!edges.length) throw new RangeError(`Unknown channel: ${id}`);
    for (const edge of edges) edge.enabled = enabled;
    return edges;
  }

  /** Toggle the two directed edges of one physical channel together. */
  setEdgeEnabled(id, enabled) {
    if (this.terminal) return false;
    if (typeof enabled !== 'boolean') throw new TypeError('Channel state must be boolean.');
    const edges = this._setChannel(id, enabled);
    const operation = { type: 'channel', time: this.time, channelId: edges[0].channelId, enabled };
    this.operations.push(operation);
    this._log('channel-changed', operation);
    const displaced = [];
    for (const edge of edges) {
      edge.version += 1;
      edge.scheduled = false;
      if (!enabled) {
        for (const instanceId of edge.queue.splice(0)) {
          const instance = this._instances.get(instanceId);
          if (instance?.status === 'queued' && instance.edgeId === edge.id) {
            instance.status = 'waiting'; instance.edgeId = null;
            displaced.push(instance);
          }
        }
      } else this._pump(edge);
    }
    for (const instance of displaced) this._route(instance);
    if (enabled) {
      for (const instance of this._instances.values()) if (instance.status === 'waiting' && instance.delayedUntil === null) this._route(instance);
    }
    this._record('channel-operation');
    return true;
  }

  /** Change queue admission rate; an already admitted hop keeps its end time. */
  setEdgeSpeed(id, speed) {
    if (this.terminal) return false;
    if (!Number.isFinite(speed) || speed < 0.1 || speed > 3) throw new RangeError('Channel speed must be between 0.1× and 3×.');
    const channelId = id.endsWith('-return') ? id.slice(0, -7) : id;
    const edges = [...this._edges.values()].filter((edge) => edge.channelId === channelId);
    if (!edges.length) throw new RangeError(`Unknown channel: ${id}`);
    for (const edge of edges) {
      edge.speed = speed;
      edge.nextAvailable = roundTime(Math.max(this.time, edge.lastAdmission + edge.serviceInterval / speed));
      edge.version += 1;
      edge.scheduled = false;
      this._pump(edge);
    }
    const operation = { type: 'speed', time: this.time, channelId, speed };
    this.operations.push(operation);
    this._log('speed-changed', operation);
    this._record('speed-operation');
    return true;
  }

  /** Arm exactly one loss at the next eligible acknowledgement hop completion. */
  loseNextAck() {
    if (this.terminal || this._loseNextAck) return false;
    this._loseNextAck = true;
    const operation = { type: 'lose-next-ack', time: this.time };
    this.operations.push(operation);
    this._log('ack-loss-armed', operation);
    this._record('ack-loss-operation');
    return true;
  }

  _byteState() {
    const bytes = new Uint8Array(this.originalBytes.length);
    let contiguousBytes = 0;
    let receivedBytes = 0;
    let gap = false;
    for (const block of this.chunks) {
      const payload = this._buffer.get(block.id);
      if (payload) {
        bytes.set(payload, block.start);
        receivedBytes += block.length;
        if (!gap) contiguousBytes += block.length;
      } else gap = true;
    }
    const complete = receivedBytes === this.originalBytes.length;
    return { bytes, contiguousBytes, receivedBytes, complete, readablePrefix: decodeCompletePrefix(bytes.slice(0, contiguousBytes)) };
  }

  _snapshot() {
    const byteState = this._byteState();
    const allAcknowledged = this.chunks.every((block) => block.acknowledged);
    const receiverStatus = byteState.complete ? 'Received' : this.terminal ? 'Incomplete' : 'Receiving';
    const senderStatus = allAcknowledged ? 'Confirmed' : 'Confirmation pending';
    const status = allAcknowledged ? 'Confirmed' : byteState.complete ? 'Confirmation pending' : this.terminal ? 'Incomplete' : 'Receiving';
    return {
      roundId: this.roundId, seed: this.options.seed, scenario: this.options.scenario,
      time: this.time, deadline: this.options.deadline, remainingTime: Math.max(0, this.options.deadline - this.time),
      message: this.options.message, originalBytes: Array.from(this.originalBytes), totalBytes: this.originalBytes.length,
      receivedBytes: byteState.receivedBytes, contiguousBytes: byteState.contiguousBytes,
      readablePrefix: byteState.readablePrefix, assembledMessage: byteState.complete ? new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(byteState.bytes) : null,
      reassembledBytes: byteState.complete ? Array.from(byteState.bytes) : null,
      receiverComplete: byteState.complete, allAcknowledged, receiverStatus, senderStatus, status,
      terminal: this.terminal, reason: this.reason, ackLossArmed: this._loseNextAck,
      config: { chunkSize: this.options.chunkSize, windowSize: this.options.windowSize, timeout: this.options.timeout, maxAttempts: this.options.maxAttempts, maxBytes: this.options.maxBytes },
      nodes: NODE_IDS.map((id) => ({ id, label: NODE_NAMES[id] })),
      edges: [...this._edges.values()].map((edge) => ({
        id: edge.id, channelId: edge.channelId, label: edge.label, from: edge.from, to: edge.to, direction: edge.direction,
        enabled: edge.enabled, delay: edge.delay, speed: edge.speed, serviceInterval: edge.serviceInterval,
        queue: [...edge.queue], queuedCount: edge.queue.length,
      })),
      chunks: this.chunks.map((block) => ({ ...block, bytes: [...block.bytes], received: this._buffer.has(block.id), retained: !block.acknowledged, byteEnd: block.start + block.length, retriesLeft: Math.max(0, this.options.maxAttempts - block.attempts) })),
      instances: [...this._instances.values()].map((instance) => {
        const edge = instance.edgeId ? this._edges.get(instance.edgeId) : null;
        const progress = instance.status === 'in-transit'
          ? clamp((this.time - instance.startTime) / (instance.endTime - instance.startTime), 0, 1)
          : instance.status === 'stranded' ? (instance.finalProgress ?? 0) : 0;
        return { ...instance, bytes: [...instance.bytes], hops: instance.hops.map((hop) => ({ ...hop })),
          from: edge?.from ?? instance.node, to: edge?.to ?? instance.node, progress,
          queuePosition: instance.status === 'queued' ? (edge?.queue.indexOf(instance.id) ?? -1) : -1,
          retransmission: instance.kind === 'data' && instance.attempt > 1 };
      }),
      stats: { ...this.stats }, eventCount: this.events.length, lastEvent: this.events.length ? { ...this.events.at(-1) } : null,
      pendingEventCount: this._queue.length,
    };
  }

  /** A detached value; mutating it cannot change the model. */
  getSnapshot() { return this._snapshot(); }

  _record(reason) {
    this.history.push({ ...this._snapshot(), historyIndex: this._historyOrder++, eventIndex: this.events.length - 1, recordedReason: reason });
  }

  getRecordedSnapshot(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.history.length) return null;
    return { ...clone(this.history[index]), isRecorded: true };
  }

  getSnapshotAtEvent(eventIndex) {
    if (!Number.isInteger(eventIndex) || eventIndex < 0 || eventIndex >= this.events.length) return null;
    let selected = 0;
    for (let index = 0; index < this.history.length; index += 1) {
      if (this.history[index].eventIndex >= eventIndex) { selected = index; break; }
      selected = index;
    }
    return this.getRecordedSnapshot(selected);
  }

  exportTrace() {
    return { version: 1, model: 'RELAY toy transport', config: clone(this.options), operations: clone(this.operations), events: clone(this.events), final: this.getSnapshot() };
  }
}

/** Compute, rather than fabricate, the opening partial delivery and its history. */
export function createPausedDemo(options = {}) {
  const simulation = new RelaySimulation({ message: DEFAULT_MESSAGE, seed: DEFAULT_SEED, scenario: 'detour', ...options });
  let guard = 0;
  while (!simulation.terminal && guard++ < 10000) {
    const snapshot = simulation.step();
    const gap = snapshot.chunks[1];
    const rerun = snapshot.instances.find((instance) => instance.kind === 'data' && instance.blockIndex === 1 && instance.attempt > 1 && instance.status === 'in-transit' && instance.from === 'A');
    if (gap && !gap.received && snapshot.chunks[0].received && snapshot.chunks.some((block) => block.index > 1 && block.received) && rerun) {
      simulation.advance(0.2);
      simulation.demoPauseTime = simulation.time;
      simulation._log('demo-paused', { reason: 'A real missing block, buffered later data, and a retransmission at the fork' });
      simulation._record('demo-paused');
      return simulation;
    }
  }
  // Custom messages with fewer than three chunks need no fabricated gap.
  simulation.demoPauseTime = simulation.time;
  return simulation;
}

export const initialPausedDemo = createPausedDemo;
