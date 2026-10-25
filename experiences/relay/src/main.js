import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPausedDemo } from './model/relay-simulation.js';
import { Sculpture } from './view/sculpture.js';

gsap.registerPlugin(ScrollTrigger);

const byId = (id) => document.getElementById(id);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => { const x = clamp(value); return x * x * (3 - 2 * x); };
const pad = (number) => String(number).padStart(2, '0');
const encoder = new TextEncoder();
const abort = new AbortController();
const { signal } = abort;
const listen = (target, type, handler, options = {}) => target?.addEventListener(type, handler, { ...options, signal });
const text = (element, value) => { if (element && element.textContent !== String(value)) element.textContent = String(value); };

const elements = {
  story: byId('story'), scene: byId('scene'), svg: byId('sculpture'),
  heading: byId('scene-heading'), title: byId('scene-title'), deck: byId('scene-deck'),
  chapterNumber: byId('chapter-number'), chapterName: byId('chapter-name'), chapterProgress: byId('chapter-progress-bar'),
  caption: byId('scene-caption'), description: byId('scene-description'), explanation: byId('live-explanation'), endFacts: byId('end-facts'),
  receiverStatus: byId('receiver-status'), receivedMessage: byId('received-message'), originalMessage: byId('original-message'),
  gapFocus: byId('gap-focus'), gapLabel: byId('gap-label'), retainedLabel: byId('retained-label'), ackCaption: byId('ack-caption'),
  play: byId('play-pause'), playLabel: byId('play-label'), step: byId('step'), restart: byId('restart'),
  explore: byId('explore'), newRound: byId('new-round'), footerNewRound: byId('footer-new-round'),
  runState: byId('run-state'), clock: byId('sim-clock'),
  routeControls: byId('route-controls'), upper: byId('upper-toggle'), lower: byId('lower-toggle'),
  speed: byId('channel-speed'), speedValue: byId('speed-value'),
  ackControl: byId('ack-control'), loseAck: byId('lose-ack'), ackHelp: byId('ack-help'),
  selection: byId('selection'), selectionTitle: byId('selection-title'), selectionSummary: byId('selection-summary'), selectionFacts: byId('selection-facts'),
  closeSelection: byId('close-selection'), inspectBlocks: byId('inspect-blocks'), blockSelect: byId('selection-block-select'),
  historyToggle: byId('history-toggle'), historyPanel: byId('history-panel'), historyReturn: byId('history-return'),
  historyRange: byId('history-range'), eventStrip: byId('event-strip'), recordedTime: byId('recorded-time'),
  dialog: byId('round-dialog'), form: byId('round-form'), message: byId('message-input'), scenario: byId('scenario-input'), seed: byId('seed-input'),
  closeRound: byId('close-round'), byteCount: byId('byte-count'), formError: byId('form-error'), announcer: byId('announcer'),
  chapterMenu: byId('chapter-menu'), chapterMenuButton: byId('chapter-menu-button'),
};

const chapters = [
  { id: 'gap', name: 'The Gap', title: 'RELAY', deck: 'A message finds its way.', description: 'Some things arrive out of order.\nHelp this one find its way.' },
  { id: 'copy', name: 'Keep a Copy', title: 'Keep a Copy', deck: 'What leaves is never the only copy.', description: 'One block. Two different lives.' },
  { id: 'routes', name: 'Another Way Through', title: 'Another Way Through', deck: 'A closed path need not be the end.', description: 'Close a channel. Change what happens.' },
  { id: 'order', name: 'Arrival Is Not Order', title: 'Arrival Is Not Order', deck: 'First to arrive is not first to read.', description: 'The words wait for the missing piece.' },
  { id: 'knowing', name: 'Knowing It Arrived', title: 'Knowing It Arrived', deck: 'Arrival is a fact. Confirmation is knowledge.', description: 'A message can arrive before the sender knows.' },
  { id: 'sentence', name: 'A Whole Sentence', title: 'A Whole Sentence', deck: 'Every byte in its right place.', description: 'It made it.' },
];

const simulation = createPausedDemo();
let liveSnapshot = simulation.getSnapshot();
let displayedSnapshot = liveSnapshot;
let playing = false;
let reviewIndex = null;
let reviewEventIndex = null;
let selectedBlock = null;
let selectedRole = null;
let selectionReturnFocus = null;
let dialogReturnFocus = null;
let rawScrollProgress = 0;
let sceneProgress = 0;
let currentChapter = 0;
let dirty = true;
let disposed = false;
let lastTickTime = null;
let discardNextDelta = true;
let lastDOMKey = '';
let lastHistoryKey = '';
let lastBlockOptionsKey = '';
let refreshTask = null;
const revealState = { value: 0 };
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
const markDirty = () => { dirty = true; };
const announce = (message) => text(elements.announcer, message);
const isReviewing = () => reviewIndex !== null;

const lenis = new Lenis({
  autoRaf: false,
  autoResize: true,
  smoothWheel: !reducedMotion,
  syncTouch: false,
  lerp: 0.1,
  anchors: false,
});

const renderer = new Sculpture(elements.svg, {
  onSelect: (index, role) => selectBlock(index, role),
  onToggle: (channelId) => toggleChannel(channelId),
});

function pause(message) {
  playing = false;
  discardNextDelta = true;
  if (message) announce(message);
  markDirty();
}

function syncModel() {
  const before = liveSnapshot;
  liveSnapshot = simulation.getSnapshot();
  if (!before.receiverComplete && liveSnapshot.receiverComplete) announce('Every byte has arrived. The receiver has the complete message.');
  if (!before.terminal && liveSnapshot.terminal) {
    playing = false;
    announce(liveSnapshot.allAcknowledged ? 'Delivery confirmed. Every acknowledgement returned.'
      : liveSnapshot.receiverComplete ? 'The receiver has the message. The sender is still missing confirmation.'
        : `Delivery incomplete. ${liveSnapshot.reason}`);
  }
  markDirty();
}

function toggleChannel(channelId) {
  if (isReviewing() || liveSnapshot.terminal) return;
  const edge = liveSnapshot.edges.find((item) => item.id === channelId);
  if (!edge) return;
  simulation.setEdgeEnabled(channelId, !edge.enabled);
  syncModel();
  announce(`${edge.label} ${edge.enabled ? 'closed' : 'opened'}. Already travelling blocks finish their current hop.`);
}

function selectBlock(index, role = 'received') {
  const state = isReviewing() ? simulation.getRecordedSnapshot(reviewIndex) : liveSnapshot;
  if (!Number.isInteger(index) || !state?.chunks[index]) return;
  if (selectedBlock === null) selectionReturnFocus = document.activeElement;
  selectedBlock = index;
  selectedRole = role;
  elements.selection.hidden = false;
  markDirty();
}

function closeSelection(restoreFocus = true) {
  selectedBlock = null;
  selectedRole = null;
  elements.selection.hidden = true;
  if (restoreFocus && selectionReturnFocus?.isConnected) selectionReturnFocus.focus({ preventScroll: true });
  selectionReturnFocus = null;
  markDirty();
}

function inspectCurrentBlock() {
  const state = isReviewing() ? simulation.getRecordedSnapshot(reviewIndex) : liveSnapshot;
  const block = state.chunks[selectedBlock] ?? state.chunks.find((item) => !item.received) ?? state.chunks[0];
  selectBlock(block.index, block.received ? 'received' : 'missing');
  elements.blockSelect?.focus({ preventScroll: true });
}

function historyIndexForEvent(eventIndex) {
  const index = simulation.history.findIndex((snapshot) => snapshot.eventIndex >= eventIndex);
  return index >= 0 ? index : simulation.history.length - 1;
}

function enterReview(index = simulation.history.length - 1, eventIndex = null) {
  pause();
  closeSelection(false);
  reviewIndex = clamp(Math.round(index), 0, simulation.history.length - 1);
  reviewEventIndex = eventIndex;
  elements.historyPanel.hidden = false;
  elements.historyToggle.setAttribute('aria-expanded', 'true');
  markDirty();
}

function leaveReview(restoreFocus = true) {
  reviewIndex = null;
  reviewEventIndex = null;
  playing = false;
  discardNextDelta = true;
  elements.historyPanel.hidden = true;
  elements.historyToggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) elements.historyToggle.focus({ preventScroll: true });
  announce('Returned to the current round. Delivery remains paused.');
  markDirty();
}

const eventLabels = {
  'round-started': 'A new round', sent: 'Data sent', retransmitted: 'Copy sent again',
  'data-lost': 'Data lost', 'data-received': 'Data received', 'duplicate-received': 'Duplicate ignored',
  'ack-created': 'Acknowledgement created', 'ack-received': 'Acknowledgement returned', 'ack-lost': 'Acknowledgement lost',
  timeout: 'Waiting timed out', 'retry-limit': 'Retry limit reached', 'channel-changed': 'Channel changed',
  'speed-changed': 'Queue speed changed', 'ack-loss-armed': 'One ACK loss armed',
  'message-received': 'The sentence is whole', 'round-finished': 'The round ended', 'demo-paused': 'A paused delivery',
  'delay-held': 'A block held at the fork', 'delay-released': 'The held block released',
};

function updateHistory(state) {
  if (!isReviewing()) return;
  elements.historyRange.max = String(Math.max(0, simulation.history.length - 1));
  elements.historyRange.value = String(reviewIndex);
  elements.historyRange.setAttribute('aria-valuetext', `${state.time.toFixed(2)} demonstration seconds, ${state.receiverStatus}`);
  text(elements.recordedTime, `${state.time.toFixed(2)} s · ${state.receiverStatus}`);
  const key = `${liveSnapshot.roundId}:${simulation.events.length}`;
  if (key !== lastHistoryKey) {
    const fragment = document.createDocumentFragment();
    for (const event of simulation.events) {
      if (!Object.hasOwn(eventLabels, event.type)) continue;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.eventIndex = String(event.index);
      button.dataset.historyIndex = String(historyIndexForEvent(event.index));
      const time = document.createElement('span');
      const blockIndex = event.blockIndex ?? (event.blockId ? state.chunks.find((block) => block.id === event.blockId)?.index : undefined);
      time.textContent = `${event.time.toFixed(2)} s${blockIndex === undefined ? '' : ` · ${pad(blockIndex + 1)}`}`;
      const label = event.type === 'channel-changed' ? `${event.channelId === 'upper' ? 'Upper' : event.channelId === 'lower' ? 'Lower' : 'Channel'} ${event.enabled ? 'opened' : 'closed'}`
        : eventLabels[event.type];
      button.append(time, document.createTextNode(label));
      item.append(button);
      fragment.append(item);
    }
    elements.eventStrip.replaceChildren(fragment);
    lastHistoryKey = key;
  }
  const visibleEventIndex = reviewEventIndex ?? state.eventIndex;
  let nearest = null;
  for (const button of elements.eventStrip.querySelectorAll('button')) {
    button.removeAttribute('aria-current');
    if (Number(button.dataset.eventIndex) <= visibleEventIndex) nearest = button;
  }
  nearest?.setAttribute('aria-current', 'true');
}

function updateSelection(state) {
  if (selectedBlock === null || !state.chunks[selectedBlock]) {
    elements.selection.hidden = true;
    return;
  }
  const block = state.chunks[selectedBlock];
  elements.selection.hidden = false;
  text(elements.selectionTitle, `Block ${pad(block.number)}`);
  const key = `${state.roundId}:${state.chunks.length}`;
  if (elements.blockSelect && lastBlockOptionsKey !== key) {
    const fragment = document.createDocumentFragment();
    for (const candidate of state.chunks) {
      const option = document.createElement('option');
      option.value = String(candidate.index);
      option.textContent = `${pad(candidate.number)} · bytes ${candidate.start}–${candidate.byteEnd - 1}`;
      fragment.append(option);
    }
    elements.blockSelect.replaceChildren(fragment);
    lastBlockOptionsKey = key;
  }
  if (elements.blockSelect) elements.blockSelect.value = String(selectedBlock);
  let summary;
  if (selectedRole === 'copy' || selectedRole === 'retained') {
    summary = block.retained ? 'The sender keeps these exact bytes until an acknowledgement returns.' : 'Acknowledged. This source copy has been released.';
  } else if (selectedRole === 'ack') {
    summary = block.acknowledged ? 'This acknowledgement reached the sender. The retained copy can be released.' : 'The data arrived. Its acknowledgement has a separate journey back.';
  } else if (selectedRole === 'transit' || selectedRole === 'data') {
    const travelling = state.instances.filter((instance) => instance.kind === 'data' && instance.blockIndex === block.index && ['waiting', 'queued', 'in-transit', 'stranded'].includes(instance.status));
    const instance = travelling.at(-1);
    summary = instance ? `Attempt ${instance.attempt} is ${instance.status === 'in-transit' ? 'in transit' : instance.status}. It carries the same bytes in a separate instance.`
      : block.received ? 'This block has reached the receiver. Its exact bytes occupy their original interval.' : 'No data instance for this block is currently travelling.';
  } else {
    summary = block.received ? block.arrivedEarly ? 'Arrived early. The receiver kept it in its original byte position.' : 'Received. Repeats are acknowledged without appending the content again.'
      : 'Still missing. The readable prefix stops before the first missing byte interval.';
  }
  text(elements.selectionSummary, summary);
  const facts = [
    ['Identity', block.id],
    ['Byte range', `[${block.start}, ${block.byteEnd})`],
    ['Payload', block.bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')],
    ['Sends', `${block.attempts} / ${state.config.maxAttempts}`],
    ['Receiver', block.received ? 'Received' : 'Missing'],
    ['Sender', block.acknowledged ? 'Confirmed' : 'Copy retained'],
  ];
  const fragment = document.createDocumentFragment();
  for (const [term, value] of facts) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    fragment.append(dt, dd);
  }
  elements.selectionFacts.replaceChildren(fragment);
}

function lines(element, value) {
  if (element.dataset.copy === value) return;
  const fragment = document.createDocumentFragment();
  value.split('\n').forEach((line, index) => {
    if (index) fragment.append(document.createElement('br'));
    fragment.append(document.createTextNode(line));
  });
  element.replaceChildren(fragment);
  element.dataset.copy = value;
}

function computePresentation() {
  const raw = clamp(rawScrollProgress) * 5;
  const segment = Math.min(5, Math.floor(raw));
  const transition = segment === 5 ? 0 : smooth((raw - segment - 0.55) / 0.45);
  sceneProgress = segment + transition;
  const chapter = segment === 5 ? 5 : transition < 0.5 ? segment : segment + 1;
  const headingOpacity = segment === 5 || transition === 0 ? 1
    : transition < 0.5 ? 1 - smooth(transition / 0.45) : smooth((transition - 0.55) / 0.45);
  const captionOpacity = segment === 5 || transition === 0 ? 1
    : transition < 0.5 ? 1 - smooth(transition / 0.3) : smooth((transition - 0.65) / 0.35);
  return { chapter, transition, headingOpacity, captionOpacity };
}

function updateCopy(state, pose) {
  currentChapter = pose.chapter;
  const chapter = chapters[currentChapter];
  elements.scene.dataset.chapter = String(currentChapter);
  elements.scene.dataset.progress = sceneProgress.toFixed(5);
  elements.scene.dataset.deliveryState = state.status;
  elements.scene.dataset.mode = isReviewing() ? 'recorded' : playing ? 'playing' : state.terminal ? 'ended' : 'paused';
  elements.scene.classList.toggle('is-playing', playing);
  elements.scene.classList.toggle('is-reviewing', isReviewing());
  text(elements.chapterNumber, pad(currentChapter + 1));
  text(elements.chapterName, chapter.name);
  elements.chapterProgress.style.width = `${rawScrollProgress * 100}%`;
  elements.heading.style.opacity = String(pose.headingOpacity * (0.78 + revealState.value * 0.22));
  elements.heading.style.transform = reducedMotion ? 'none' : `translateY(${(1 - pose.headingOpacity) * (pose.transition < 0.5 ? -9 : 9)}px)`;
  elements.caption.style.opacity = String(pose.captionOpacity);

  const missing = state.chunks.find((block) => !block.received);
  const retained = state.chunks.filter((block) => block.retained);
  const upper = state.edges.find((edge) => edge.id === 'upper');
  const lower = state.edges.find((edge) => edge.id === 'lower');
  let title = chapter.title;
  let deck = chapter.deck;
  let description = chapter.description;
  let explanation = '';
  if (currentChapter === 0) {
    explanation = `${state.receivedBytes} / ${state.totalBytes} bytes received${missing ? ` · block ${pad(missing.number)} is missing.` : state.allAcknowledged ? ' · every acknowledgement returned.' : ' · confirmation is still pending.'}`;
    if (state.terminal && !state.receiverComplete) description = 'Some things do not arrive.\nThere is another route to try.';
    else if (state.receiverComplete) description = state.allAcknowledged ? 'Every piece found its place.\nNow you know how it got here.' : 'Every piece has arrived.\nThe sender is still waiting to know.';
  } else if (currentChapter === 1) {
    explanation = retained.length ? `${retained.length} ${retained.length === 1 ? 'copy' : 'copies'} retained · ${state.stats.sends} sends so far.` : 'Every retained copy has been acknowledged.';
  } else if (currentChapter === 2) {
    const waiting = state.instances.filter((instance) => instance.kind === 'data' && ['queued', 'waiting'].includes(instance.status)).length;
    explanation = `Upper ${upper.enabled ? 'open' : 'closed'} · lower ${lower.enabled ? 'open' : 'closed'}${waiting ? ` · ${waiting} ${waiting === 1 ? 'instance waits' : 'instances wait'}.` : '.'}`;
    if (state.terminal) explanation += ' Start a new round to change the outcome.';
  } else if (currentChapter === 3) {
    explanation = `${state.contiguousBytes} contiguous bytes · ${state.receivedBytes - state.contiguousBytes} bytes buffered beyond the gap.`;
    if (state.receiverComplete) { description = 'Every interval now belongs.'; explanation = `${state.totalBytes} bytes in their original order · exact reassembly.`; }
  } else if (currentChapter === 4) {
    explanation = `Receiver: ${state.receiverStatus}. Sender: ${state.senderStatus}.`;
  } else {
    if (!state.receiverComplete) {
      title = state.terminal ? 'A Sentence, Unfinished' : 'A Sentence, Still Waiting';
      deck = state.terminal ? 'Some bytes did not make it through.' : 'There is still a place to fill.';
      description = state.terminal ? 'This route ended with a gap.' : 'The sentence is not complete yet.';
    } else if (!state.allAcknowledged) description = 'It arrived. Knowing takes a little longer.';
    explanation = state.terminal ? `${state.reason} ${state.receiverComplete ? `Receiver: Received. Sender: ${state.senderStatus}.` : `${state.totalBytes - state.receivedBytes} bytes are still missing.`}`
      : state.receiverComplete ? `Receiver: Received. Sender: ${state.senderStatus}.`
        : `${state.receivedBytes} / ${state.totalBytes} bytes received · ${state.remainingTime.toFixed(1)} demonstration seconds remain.`;
  }
  text(elements.title, title);
  text(elements.deck, deck);
  lines(elements.description, description);
  text(elements.explanation, explanation);
  elements.endFacts.hidden = currentChapter !== 5;
  text(elements.endFacts, `${state.stats.sends} sends · ${state.stats.duplicates} duplicate arrivals · ${state.stats.dataLost} data lost · ${state.stats.acknowledgementsLost} ACKs lost`);
  text(elements.receiverStatus, state.receiverStatus);
  text(elements.receivedMessage, state.receiverComplete ? state.assembledMessage : state.readablePrefix || 'Not yet.');
  elements.receivedMessage.dataset.placeholder = String(!state.receiverComplete && !state.readablePrefix);
  elements.receivedMessage.dataset.complete = String(state.receiverComplete);
  elements.receivedMessage.setAttribute('aria-label', !state.receiverComplete && !state.readablePrefix ? 'No complete message prefix has arrived.' : `Received text: ${state.receiverComplete ? state.assembledMessage : state.readablePrefix}`);
  text(elements.originalMessage, state.message);
  elements.gapFocus.hidden = !missing;
  if (missing) {
    text(elements.gapLabel, `Missing ${missing.start}–${missing.byteEnd - 1} B`);
    elements.gapFocus.setAttribute('aria-label', `Inspect missing block ${pad(missing.number)}, bytes ${missing.start} to ${missing.byteEnd - 1}`);
  }
  text(elements.retainedLabel, retained.length ? 'Copy kept' : 'Acknowledged · copies released');
  text(elements.ackCaption, state.allAcknowledged ? 'Every acknowledgement returned.' : 'Confirmation takes its own way back.');

  elements.routeControls.hidden = currentChapter !== 2 || pose.headingOpacity < 0.45;
  elements.ackControl.hidden = currentChapter !== 4 || pose.headingOpacity < 0.45;
  elements.explore.hidden = currentChapter !== 0 || isReviewing();
  elements.newRound.hidden = (currentChapter !== 5 && !liveSnapshot.terminal) || isReviewing();
  for (const [button, edge, name] of [[elements.upper, upper, 'upper'], [elements.lower, lower, 'lower']]) {
    button.setAttribute('aria-pressed', String(edge.enabled));
    text(button.lastElementChild, `${edge.enabled ? 'Close' : 'Open'} ${name} channel`);
    button.disabled = isReviewing() || liveSnapshot.terminal;
  }
  elements.speed.value = String(lower.speed);
  text(elements.speedValue, `${lower.speed.toFixed(2)}×`);
  elements.speed.setAttribute('aria-valuetext', `${lower.speed.toFixed(2)} times queue admission speed`);
  elements.speed.disabled = isReviewing() || liveSnapshot.terminal;
  elements.loseAck.disabled = isReviewing() || liveSnapshot.terminal || liveSnapshot.ackLossArmed;
  const ackLabel = state.ackLossArmed ? 'One acknowledgement will be lost ' : 'Lose one acknowledgement ';
  if (elements.loseAck.firstChild.nodeType === Node.TEXT_NODE) elements.loseAck.firstChild.nodeValue = ackLabel;
  text(elements.ackHelp, state.ackLossArmed ? 'Armed. The next eligible return hop discards one acknowledgement.' : state.terminal ? 'This round has ended. Start a new round to try another loss.' : 'The next acknowledgement is discarded. Its data can still arrive.');
  elements.play.disabled = isReviewing();
  elements.step.disabled = isReviewing() || liveSnapshot.terminal;
  elements.restart.disabled = isReviewing();
  elements.newRound.disabled = isReviewing();
  elements.footerNewRound.disabled = isReviewing();
  text(elements.playLabel, isReviewing() ? 'Recorded moment' : liveSnapshot.terminal ? 'Try another route' : playing ? 'Pause delivery' : liveSnapshot.time === 0 ? 'Start delivery' : 'Continue delivery');
  elements.play.setAttribute('aria-pressed', String(playing));
  text(elements.runState, isReviewing() ? 'Recorded moment' : playing ? 'Delivery in motion' : liveSnapshot.terminal ? liveSnapshot.allAcknowledged ? 'Delivery confirmed' : liveSnapshot.receiverComplete ? 'Received · confirmation pending' : 'Delivery incomplete' : 'A paused delivery');
  text(elements.clock, `${state.time.toFixed(2)} s`);
  updateSelection(state);
  updateHistory(state);
}

function render() {
  const pose = computePresentation();
  displayedSnapshot = isReviewing() ? simulation.getRecordedSnapshot(reviewIndex) ?? liveSnapshot : liveSnapshot;
  // A continuous scene pose comes from scroll, but the packet's progress comes
  // only from this actual live or recorded simulation snapshot.
  const key = `${displayedSnapshot.roundId}:${displayedSnapshot.eventCount}:${currentChapter}:${pose.chapter}:${pose.headingOpacity}:${pose.captionOpacity}:${sceneProgress}:${playing}:${reviewIndex}:${selectedBlock}:${selectedRole}:${revealState.value}`;
  if (key !== lastDOMKey) { updateCopy(displayedSnapshot, pose); lastDOMKey = key; }
  else text(elements.clock, `${displayedSnapshot.time.toFixed(2)} s`);
  renderer.render(displayedSnapshot, sceneProgress, {
    reducedMotion,
    selectedBlock,
    selectedRole,
    reveal: revealState.value,
  });
  elements.scene.dataset.ready = 'true';
  dirty = false;
}

const scrollTrigger = ScrollTrigger.create({
  trigger: elements.story,
  start: 'top top',
  end: 'bottom bottom',
  invalidateOnRefresh: true,
  onUpdate: (self) => { rawScrollProgress = self.progress; markDirty(); },
  onRefresh: (self) => { rawScrollProgress = self.progress; renderer.resize?.(); markDirty(); },
});

const onLenisScroll = () => ScrollTrigger.update();
lenis.on('scroll', onLenisScroll);

function scheduleRefresh() {
  if (disposed) return;
  refreshTask?.kill();
  refreshTask = gsap.delayedCall(0.12, () => {
    if (disposed) return;
    lenis.resize();
    renderer.resize?.();
    ScrollTrigger.refresh();
    markDirty();
  });
}

function navigate(hash, { immediate = false, record = true, focus = false } = {}) {
  const id = hash.replace(/^#/, '');
  const target = byId(id);
  if (!target) return;
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === id);
  const destination = chapterIndex >= 0 ? scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * chapterIndex / 5 : target;
  if (elements.chapterMenu.matches(':popover-open')) elements.chapterMenu.hidePopover();
  if (record && window.location.hash !== hash) history.pushState({ relayChapter: id }, '', hash);
  lenis.scrollTo(destination, {
    immediate: immediate || reducedMotion,
    duration: reducedMotion ? 0 : 1.05,
    offset: chapterIndex >= 0 ? 0 : -24,
    onComplete: () => {
      ScrollTrigger.update();
      if (focus && chapterIndex >= 0) { elements.title.tabIndex = -1; elements.title.focus({ preventScroll: true }); }
      markDirty();
    },
  });
  markDirty();
}

function updateByteCount() {
  const count = encoder.encode(elements.message.value).length;
  text(elements.byteCount, `${count} / 120 bytes`);
  const invalid = count < 1 || count > 120;
  elements.message.setAttribute('aria-invalid', String(invalid));
  elements.message.setCustomValidity(count > 120 ? 'Use 120 UTF-8 bytes or fewer.' : count < 1 ? 'Enter a message.' : '');
  return { count, valid: !invalid };
}

function openRoundDialog() {
  if (isReviewing() || elements.dialog.open) return;
  pause();
  dialogReturnFocus = document.activeElement;
  elements.message.value = liveSnapshot.message;
  elements.scenario.value = liveSnapshot.scenario;
  elements.seed.value = String(liveSnapshot.seed);
  text(elements.formError, '');
  updateByteCount();
  elements.dialog.showModal();
  lenis.stop();
  elements.message.focus({ preventScroll: true });
}

function closeRoundDialog() {
  if (elements.dialog.open) {
    elements.dialog.close();
    // close is dispatched asynchronously; allow a submitted new round's
    // immediately following chapter navigation to start in this same turn.
    lenis.start();
  }
}

function startNewRound(options, { autoplay = false, navigateToStart = false } = {}) {
  pause();
  closeSelection(false);
  reviewIndex = null;
  reviewEventIndex = null;
  elements.historyPanel.hidden = true;
  elements.historyToggle.setAttribute('aria-expanded', 'false');
  simulation.reset(options);
  liveSnapshot = simulation.getSnapshot();
  lastHistoryKey = '';
  lastBlockOptionsKey = '';
  lastDOMKey = '';
  playing = autoplay;
  discardNextDelta = true;
  if (navigateToStart) navigate('#gap', { immediate: reducedMotion });
  announce(`New round started. ${autoplay ? 'Delivery is playing.' : 'Delivery is paused at the beginning.'}`);
  markDirty();
}

listen(elements.play, 'click', () => {
  if (isReviewing()) return;
  if (liveSnapshot.terminal) { openRoundDialog(); return; }
  if (playing) pause('Delivery paused.');
  else { playing = true; discardNextDelta = true; announce('Delivery continues.'); markDirty(); }
});
listen(elements.step, 'click', () => {
  if (isReviewing() || liveSnapshot.terminal) return;
  pause();
  simulation.step();
  syncModel();
  announce(`One event time advanced. ${liveSnapshot.receivedBytes} of ${liveSnapshot.totalBytes} bytes received.`);
});
listen(elements.restart, 'click', () => {
  if (isReviewing()) return;
  startNewRound({ message: liveSnapshot.message, seed: liveSnapshot.seed, scenario: liveSnapshot.scenario });
});
listen(elements.upper, 'click', () => toggleChannel('upper'));
listen(elements.lower, 'click', () => toggleChannel('lower'));
listen(elements.speed, 'input', () => {
  if (isReviewing() || liveSnapshot.terminal) return;
  simulation.setEdgeSpeed('lower', Number(elements.speed.value));
  syncModel();
});
listen(elements.loseAck, 'click', () => {
  if (isReviewing() || liveSnapshot.terminal) return;
  if (simulation.loseNextAck()) { syncModel(); announce('One acknowledgement loss is armed.'); }
});
listen(elements.gapFocus, 'click', () => {
  const gap = displayedSnapshot.chunks.find((block) => !block.received);
  if (gap) selectBlock(gap.index, 'missing');
});
listen(elements.closeSelection, 'click', () => closeSelection());
listen(elements.inspectBlocks, 'click', inspectCurrentBlock);
listen(elements.blockSelect, 'change', () => {
  const block = displayedSnapshot.chunks[Number(elements.blockSelect.value)];
  if (block) selectBlock(block.index, block.received ? 'received' : 'missing');
});
listen(elements.historyToggle, 'click', () => isReviewing() ? leaveReview() : enterReview());
listen(elements.historyReturn, 'click', () => leaveReview());
listen(elements.historyRange, 'input', () => enterReview(Number(elements.historyRange.value)));
listen(elements.eventStrip, 'click', (event) => {
  const button = event.target.closest('button[data-history-index]');
  if (button) enterReview(Number(button.dataset.historyIndex), Number(button.dataset.eventIndex));
});
listen(elements.newRound, 'click', openRoundDialog);
listen(elements.footerNewRound, 'click', openRoundDialog);
listen(elements.closeRound, 'click', closeRoundDialog);
listen(elements.message, 'input', () => { updateByteCount(); text(elements.formError, ''); });
listen(elements.dialog, 'close', () => {
  lenis.start();
  discardNextDelta = true;
  if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus({ preventScroll: true });
  dialogReturnFocus = null;
  markDirty();
});
listen(elements.form, 'submit', (event) => {
  event.preventDefault();
  const { valid } = updateByteCount();
  const seed = Number(elements.seed.value);
  if (!valid) { text(elements.formError, 'Use between 1 and 120 UTF-8 bytes.'); return; }
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) { text(elements.formError, 'Use a whole-number seed from 0 to 4294967295.'); return; }
  try {
    const options = { message: elements.message.value, scenario: elements.scenario.value, seed };
    closeRoundDialog();
    startNewRound(options, { autoplay: true, navigateToStart: true });
  } catch (error) { text(elements.formError, error.message || 'The new round could not start.'); }
});
listen(document, 'click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const hash = link.getAttribute('href');
  if (!byId(hash.slice(1))) return;
  if (hash === '#delivery-controls') return; // Keep the native accessible skip-link behaviour.
  event.preventDefault();
  navigate(hash, { focus: event.detail === 0 });
});
listen(document, 'keydown', (event) => {
  if (event.key === 'Escape' && !elements.dialog.open) {
    if (selectedBlock !== null) { closeSelection(); event.preventDefault(); }
    else if (isReviewing()) { leaveReview(); event.preventDefault(); }
  }
});
listen(document, 'visibilitychange', () => {
  if (document.hidden) pause('Delivery paused while this tab is away.');
  discardNextDelta = true;
  lastTickTime = null;
  if (!document.hidden) scheduleRefresh();
});
listen(window, 'popstate', () => navigate(location.hash || '#gap', { immediate: true, record: false }));
listen(window, 'hashchange', () => navigate(location.hash || '#gap', { immediate: true, record: false }));
listen(window, 'resize', scheduleRefresh, { passive: true });
listen(window, 'orientationchange', scheduleRefresh, { passive: true });
listen(window, 'pageshow', (event) => {
  if (event.persisted) { pause(); lenis.start(); lastTickTime = null; scheduleRefresh(); }
});
listen(motionPreference, 'change', (event) => {
  reducedMotion = event.matches;
  lenis.options.smoothWheel = !reducedMotion;
  if (reducedMotion) { intro.kill(); revealState.value = 1; }
  markDirty();
});

const resizeObserver = new ResizeObserver(scheduleRefresh);
resizeObserver.observe(elements.scene);
resizeObserver.observe(elements.story);
document.fonts?.ready.then(() => { if (!disposed) scheduleRefresh(); });

const intro = gsap.to(revealState, {
  value: 1,
  duration: reducedMotion ? 0 : 1.15,
  ease: 'power2.out',
  onUpdate: markDirty,
});

function tick(time) {
  if (disposed) return;
  lenis.raf(time * 1000);
  const elapsed = lastTickTime === null || discardNextDelta ? 0 : Math.max(0, time - lastTickTime);
  lastTickTime = time;
  discardNextDelta = false;
  if (playing && !isReviewing() && !document.hidden && !elements.dialog.open && elapsed > 0) {
    simulation.advance(elapsed);
    syncModel();
  }
  if (dirty) render();
}

gsap.ticker.lagSmoothing(0);
gsap.ticker.add(tick);
elements.historyToggle.setAttribute('aria-expanded', 'false');
elements.historyToggle.setAttribute('aria-controls', 'history-panel');
elements.svg.setAttribute('role', 'group');
render();

const qaAPI = Object.freeze({
  getSnapshot: () => simulation.getSnapshot(),
  exportTrace: () => simulation.exportTrace(),
  getHistory: () => structuredClone(simulation.history),
  getPresentation: () => ({
    ready: elements.scene.dataset.ready === 'true', playing, reviewing: isReviewing(), reviewIndex,
    selectedBlock, selectedRole, reducedMotion, reveal: revealState.value,
    scrollProgress: rawScrollProgress, sceneProgress, chapter: currentChapter,
    displayedTime: displayedSnapshot.time, displayedReceiverStatus: displayedSnapshot.receiverStatus,
    displayedSenderStatus: displayedSnapshot.senderStatus,
    scrollStart: scrollTrigger.start, scrollEnd: scrollTrigger.end,
    dialogOpen: elements.dialog.open,
  }),
});
Object.defineProperty(window, '__RELAY__', { configurable: true, writable: false, value: qaAPI });
window.dispatchEvent(new CustomEvent('relay:ready'));

function dispose() {
  if (disposed) return;
  disposed = true;
  playing = false;
  intro.kill();
  refreshTask?.kill();
  resizeObserver.disconnect();
  abort.abort();
  gsap.ticker.remove(tick);
  scrollTrigger.kill();
  lenis.off('scroll', onLenisScroll);
  lenis.destroy();
  renderer.destroy?.();
  if (window.__RELAY__ === qaAPI) delete window.__RELAY__;
}

listen(window, 'pagehide', (event) => { pause(); if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
