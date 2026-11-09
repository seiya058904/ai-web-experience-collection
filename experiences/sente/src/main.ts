import './style.css';
import { boardFrom, coordOf, createPosition, emptyBoard, groupAt, indexOf, play } from './engine.ts';
import type { Board, Position } from './engine.ts';
import { attemptPuzzle, GROUP_BOARD, initialFor, p2Line, PUZZLES, TWO_EYES_BOARD } from './puzzles.ts';
import type { PuzzleId } from './puzzles.ts';
import { advanceReply, attempt, entriesFor, puzzleView, resetPuzzle, restoreSession, selectAttempt, serializeSession, undoPuzzle } from './session.ts';
import type { Session } from './session.ts';
import { BoardView, escapeXml } from './board-view.ts';
import type { BoardStyle } from './board-view.ts';
import { createObservationNote } from './note.ts';
import type { NotePanel } from './note.ts';
import { renderStory } from './story.ts';
import { StoryMotion } from './motion.ts';
import { StoneSound } from './sound.ts';

const STORAGE_KEY = 'sente-observations-v1';
const ids: PuzzleId[] = ['P1', 'P2', 'P3'];
const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const indices = (coords: readonly string[]) => coords.map(indexOf);
const setText = (id: string, text: string) => { const target = el(id); if (target.textContent !== text) target.textContent = text; };
const setHtml = (id: string, html: string) => { const target = el(id); if (target.innerHTML !== html) target.innerHTML = html; };
let stored: string | null = null;
try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* A private browser can still use the complete story. */ }
let state = restoreSession(stored);
let storageNotice = false;
let heroNotice = '';
let groupNotice = '';
const messages: Partial<Record<PuzzleId, string>> = {};
const rejected: Partial<Record<PuzzleId, number>> = {};
let notePanels: NotePanel[] = [];
let noteSignature = '';
const sound = new StoneSound();
// A remembered sound preference does not open an AudioContext without a gesture.
let audioActivated = false;

el('app').innerHTML = renderStory();
const boardViews = new Map<string, BoardView>();
function addBoard(id: string, label: string, onPoint?: (coord: string) => void, options: {bare?: boolean; diagram?: boolean; mode?: 'play'|'inspect'; color?: 'black'|'white'} = {}): BoardView {
  const view = new BoardView(el(id), id, { label, onPoint, ...options });
  boardViews.set(id, view);
  return view;
}
function paint(id: string, board: Board, style: BoardStyle = {}): void { boardViews.get(id)!.render(board, style); }
function positionOf(id: PuzzleId): Position { return puzzleView(state, id).position; }

addBoard('hero-board', 'First-stone practice board', coord => {
  if (state.hero) {
    heroNotice = coord === state.hero ? `${coord} already holds your stone. Lift it before trying a different point.` : 'This opening holds one stone at a time. Lift your stone to try a different point.';
    updateHero(); return;
  }
  const result = play(createPosition(), coord);
  if (result.ok) { heroNotice = ''; commit({ ...state, hero: coord, heroLiberties: false }); boardViews.get('hero-board')!.animateMove(result.move.index); tap(); }
}, { bare: true });
addBoard('breathing-board', 'Single black stone and its liberties');
addBoard('group-board', 'Select a stone to inspect its connected string', coord => {
  if (!GROUP_BOARD[indexOf(coord)]) { groupNotice = `${coord} is empty. Select D3, D4, E4, or F5 to inspect a string.`; updateGroup(); return; }
  groupNotice = ''; commit({ ...state, groupPoint: coord as Session['groupPoint'] });
}, { mode: 'inspect' });
ids.forEach(id => addBoard(`${id}-board`, `${id}: ${PUZZLES[id].goal}`, coord => submitPuzzle(id, coord)));
addBoard('eyes-board', 'Two-eye example: try a white stone in C3 or E3', coord => {
  if (coord === 'C3' || coord === 'E3') commit({ ...state, eyesPoint: coord });
  else setText('eyes-feedback', `${coord} is ${TWO_EYES_BOARD[indexOf(coord)] ? 'occupied' : 'outside the two eyes'}. In this observation, try White at C3 or E3.`);
}, { color: 'white' });
addBoard('branch-A-board', 'P2 variation A: Black connects at D3');
addBoard('branch-B-board', 'P2 variation B: Black D4, then White D3');
addBoard('choice-take-board', 'Example: Black F6 then White C5; the marked black stones are captured');
addBoard('choice-keep-board', 'Example: Black C5 then White F6; the marked black stones remain');
addBoard('ko-board', 'K1: capture at D5, then try the immediate recapture at D4', coord => {
  if (state.koStage === 0 && coord === 'D5') { commit({ ...state, koStage: 1 }); boardViews.get('ko-board')!.animateMove(indexOf('D5'), [{index:indexOf('D4'),color:'white'}]); tap(); }
  else if (state.koStage > 0 && coord === 'D4') commit({ ...state, koStage: 2 });
  else {
    const result = play(koPosition(), coord);
    setText('ko-feedback', result.ok ? `This observation follows ${state.koStage === 0 ? 'Black D5' : 'White D4'}. Choose that point or use the labelled control.` : result.message);
  }
});
addBoard('ko-original-board', 'K1 exact initial position', undefined, { diagram: true });
addBoard('ko-hypothetical-board', 'Hypothetical white recapture, not a committed position', undefined, { diagram: true });
document.querySelectorAll<HTMLElement>('[data-transition-board]').forEach(target => {
  addBoard(target.id, target.dataset.transitionBoard!);
});

const motion = new StoryMotion(state.motion);

function tap(): void {
  if (state.sound && !audioActivated) { sound.setEnabled(true); audioActivated = true; }
  sound.play();
}

function commit(next: Session): void {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, serializeSession(state)); }
  catch {
    if (!storageNotice) { storageNotice = true; setText('download-feedback', 'This browser cannot save between visits. You can still keep your observations by downloading the note.'); }
  }
  render();
}

function submitPuzzle(id: PuzzleId, coord: string): void {
  const view = puzzleView(state, id);
  if (view.step > 0) {
    messages[id] = 'This is a one-move exercise. Undo to the starting position, or reset, before trying another black move.';
    updatePuzzle(id); return;
  }
  const result = attemptPuzzle(id, coord);
  messages[id] = result.ok ? '' : result.message;
  rejected[id] = result.ok ? undefined : indexOf(coord);
  commit(attempt(state, id, coord));
  if (result.ok) {
    boardViews.get(`${id}-board`)!.animateMove(result.first.move.index, result.first.captured.map(index => ({index,color:'white' as const})));
    if (id === 'P3' && state.autoReply && result.reply) boardViews.get(`${id}-board`)!.animateMove(result.reply.move.index, result.reply.captured.map(index => ({index,color:'black' as const})));
    tap();
  }
}

function heroBoard(): Board { return state.hero ? boardFrom([state.hero]) : emptyBoard(); }
function entryBoard(): Board { return boardFrom([state.hero ?? 'D4']); }
function breathingCoord(): string { return state.libertyExample === 'hero' ? state.hero ?? 'D4' : state.libertyExample; }

function updateHero(): void {
  const board = heroBoard();
  const group = state.hero ? groupAt(board, state.hero) : null;
  paint('hero-board', board, { liberties: state.heroLiberties ? group?.liberties : [], last: null });
  el<HTMLButtonElement>('hero-clear').disabled = !state.hero;
  el<HTMLButtonElement>('hero-liberties').disabled = !state.hero;
  el('hero-liberties').setAttribute('aria-pressed', String(state.heroLiberties));
  setText('hero-liberties', state.heroLiberties ? 'Hide liberties' : 'Show liberties');
  el('hero-try').innerHTML = `${state.hero ? 'Return to your stone' : 'Place your first stone'} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>`;
  setText('hero-position-label', state.hero ? `Your stone at ${state.hero}. ${group!.liberties.length} places to breathe.` : 'An empty board. An open beginning.');
  setText('hero-feedback', heroNotice || (state.hero ? state.heroLiberties ? `Its liberties are ${group!.liberties.map(coordOf).join(', ')}. Only neighbours along the lines count.` : 'Your stone stays here when you leave and return. Choose “Show liberties” to look closer.' : 'You may place one black stone on any empty intersection.'));
}

function updateBreathing(): void {
  const coord = breathingCoord();
  const board = boardFrom([coord]);
  const liberties = groupAt(board, coord)!.liberties;
  paint('breathing-board', board, { liberties });
  setText('liberty-count', String(liberties.length));
  setText('breathing-origin', state.libertyExample === 'hero' ? state.hero ? `Your first stone · ${coord}` : 'Default example · D4' : `Independent example · ${coord}`);
  setText('breathing-liberty-list', liberties.map(coordOf).join(' · '));
  setText('breathing-explanation', `At ${coord}, ${['zero', 'one', 'two', 'three', 'four'][liberties.length]} empty points touch the stone.${liberties.length < 4 ? ' The edge of the board changes the count.' : ' Each one is a liberty.'}`);
  document.querySelectorAll<HTMLElement>('[data-example]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.example === state.libertyExample)));
  setText('example-hero', state.hero ? 'Your stone' : 'Starting point');
}

function updateGroup(): void {
  const group = groupAt(GROUP_BOARD, state.groupPoint)!;
  paint('group-board', GROUP_BOARD, { outlined: group.stones, connection: group.stones, liberties: state.groupLiberties ? group.liberties : [] });
  setText('group-summary', `${group.stones.length} ${group.stones.length === 1 ? 'stone' : 'connected stones'} · ${group.liberties.length} distinct liberties`);
  el('group-liberties').setAttribute('aria-pressed', String(state.groupLiberties));
  el('group-outline').setAttribute('aria-pressed', String(!state.groupLiberties));
  setText('group-liberties', state.groupLiberties ? 'Hide shared liberties' : 'Show shared liberties');
  setText('group-feedback', groupNotice || (state.groupPoint === 'F5' ? 'F5 is its own string. The diagonal toward E4 does not connect them.' : state.groupLiberties ? `The shared liberties are ${group.liberties.map(coordOf).join(', ')}. Each empty point is counted once.` : 'D3, D4, and E4 form one string. F5 remains separate.'));
}

function updatePuzzle(id: PuzzleId): void {
  const view = puzzleView(state, id);
  const board = view.position.board;
  const hint = state.puzzles[id].hint;
  let liberties: number[] = [];
  if (hint) {
    const targetPoints = id === 'P1' ? ['D4'] : id === 'P2' ? ['B3', 'F3'] : ['C3', 'C4'];
    liberties = [...new Set(targetPoints.flatMap(coord => groupAt(board, coord)?.liberties ?? []))];
  }
  let connection: readonly number[] = [];
  if (id === 'P2' && view.complete) { const group = groupAt(board, 'B3')!; liberties = [...group.liberties]; connection = group.stones; }
  if (id === 'P3' && view.complete) connection = groupAt(board, 'C3')!.stones;
  paint(`${id}-board`, board, { marked: indices(PUZZLES[id].targets), liberties, connection, last: view.position.lastMove?.index, rejected: rejected[id] });
  el(`${id}-board`).dataset.step = String(view.step);
  el(`${id}-board`).dataset.solved = String(view.complete);
  el<HTMLButtonElement>(`${id}-undo`).disabled = view.step === 0;
  el(`${id}-hint`).setAttribute('aria-pressed', String(hint));
  setText(`${id}-hint`, hint ? 'Hide liberties' : 'Show liberties');
  const captures = view.position.captures;
  setText(`${id}-captures`, captures.black || captures.white ? `Black captured ${captures.black} · White captured ${captures.white}` : 'No stones captured');
  const feedback = el(`${id}-feedback`);
  feedback.classList.toggle('goal-met', view.complete);
  let heading = id === 'P1' ? 'Take a look first.' : id === 'P2' ? 'Two strings, for now.' : 'First, look at both possibilities.';
  let text = id === 'P1' ? 'Which empty point still touches the white stone?' : id === 'P2' ? 'Look for a point that touches both along the grid.' : 'You can capture the white stone near the right edge. What happens to the marked string next?';
  if (messages[id]) { heading = 'The board stays as it is.'; text = messages[id]!; }
  else if (view.attempt && !view.attempt.ok) { heading = 'That point is unavailable.'; text = view.attempt.message; }
  else if (view.step > 0 && view.attempt?.ok) {
    if (id === 'P3' && view.step === 1) {
      heading = 'Your black move is on the board.';
      text = `Black played ${view.attempt.first.move.coord}.${view.attempt.first.captured.length ? ' White F5 has been captured.' : ''} The stated reply is White ${view.attempt.reply!.move.coord}. Choose “Show the white reply” to see what follows.`;
    } else {
      heading = view.complete ? id === 'P1' ? 'A stone leaves. A point opens.' : id === 'P2' ? 'One string. Eight shared liberties.' : 'The marked string remains.' : id === 'P3' ? 'The marked string is captured.' : 'A legal move. The goal is still open.';
      text = view.attempt.explanation;
    }
  }
  setHtml(`${id}-feedback`, `<h3>${escapeXml(heading)}</h3><p>${escapeXml(text)}</p>`);
  if (id !== 'P3') {
    setHtml(`${id}-board-status`, `<strong>${escapeXml(heading)}</strong>${escapeXml(text)}`);
    el<HTMLButtonElement>(`${id}-board-undo`).disabled = view.step === 0;
  }
  const records = entriesFor(state, id);
  setText(`${id}-attempt-count`, `Your attempts · ${records.length ? records.length : 'none yet'}`);
  setHtml(`${id}-attempts`, records.map((record, i) => `<li><button type="button" data-revisit="${id}" data-attempt="${i}">${escapeXml(record.coord)}</button> — ${escapeXml(record.legal ? record.seen === 1 && id === 'P3' ? 'Black move viewed; reply pending.' : record.solved ? 'Local goal reached.' : 'Legal move; local goal not reached.' : 'Rejected; the board did not change.')}</li>`).join(''));
  if (id === 'P3') {
    el('P3-next').hidden = view.step !== 1;
    setText('P3-turn', view.step === 0 ? 'Black to play · then a stated reply' : view.step === 1 ? 'Black played · white reply pending' : 'Both moves viewed');
  }
}

function updateEyes(): void {
  const point = state.eyesPoint;
  paint('eyes-board', TWO_EYES_BOARD, { liberties: indices(['C3', 'E3']), connection: indices(['D2', 'D3', 'D4']), rejected: point ? indexOf(point) : null });
  setText('eyes-feedback', point ? (() => {
    const result = play(createPosition(TWO_EYES_BOARD, 'white'), point);
    return result.ok ? 'Unexpected legal move.' : `White at ${point} is not allowed. The black string still has the other eye, so nothing is captured. The new white stone would have no liberties. The board is unchanged.`;
  })() : 'Try either eye. An illegal attempt leaves the board exactly as it was.');
}

function updateBranches(): void {
  for (const branch of ['A', 'B'] as const) {
    const steps = p2Line(branch);
    const step = state.branchSteps[branch];
    const position = steps[step];
    paint(`branch-${branch}-board`, position.board, { last: position.lastMove?.index, connection: branch === 'A' && step === 1 ? groupAt(position.board, 'B3')!.stones : [], marked: indices(['B3', 'C3', 'E3', 'F3']) });
    setText(`${branch}-step-label`, step === 0 ? 'Starting position' : `Move ${step} of ${steps.length - 1}`);
    document.querySelector<HTMLButtonElement>(`[data-replay="${branch}-prev"]`)!.disabled = step === 0;
    document.querySelector<HTMLButtonElement>(`[data-replay="${branch}-next"]`)!.disabled = step === steps.length - 1;
    el(`branch-${branch}`).querySelectorAll('.move-list li').forEach((li, i) => li.classList.toggle('is-current', i === step));
    el(`branch-${branch}`).classList.toggle('is-hidden-mobile', state.branch !== branch);
  }
  document.querySelectorAll<HTMLElement>('[data-branch]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.branch === state.branch)));
  const take = attemptPuzzle('P3', 'F6'); const keep = attemptPuzzle('P3', 'C5');
  if (take.ok) paint('choice-take-board', take.position.board, { last: take.position.lastMove?.index });
  if (keep.ok) paint('choice-keep-board', keep.position.board, { marked: indices(['C3', 'C4']), connection: groupAt(keep.position.board, 'C3')!.stones, last: keep.position.lastMove?.index });
}

function koPosition(): Position {
  const initial = initialFor('K1');
  const capture = play(initial, 'D5');
  return state.koStage > 0 && capture.ok ? capture.position : initial;
}
function updateKo(): void {
  const position = koPosition();
  const initial = initialFor('K1');
  const capture = play(initial, 'D5');
  const recapture = capture.ok ? play(capture.position, 'D4') : null;
  paint('ko-board', position.board, { last: position.lastMove?.index, rejected: state.koStage === 2 ? indexOf('D4') : null, activeColor: state.koStage > 0 ? 'white' : 'black' });
  paint('ko-original-board', initial.board, { diagram: true });
  paint('ko-hypothetical-board', recapture && !recapture.ok && recapture.hypotheticalBoard ? recapture.hypotheticalBoard : initial.board, { diagram: true });
  el<HTMLButtonElement>('ko-capture').disabled = state.koStage > 0;
  el<HTMLButtonElement>('ko-recapture').disabled = state.koStage === 0;
  el('ko-board').dataset.stage = String(state.koStage);
  el('ko-match').closest('.ko-evidence')!.classList.toggle('repetition-shown', state.koStage === 2);
  setText('ko-state-label', state.koStage === 0 ? 'Before the capture' : 'Black D5 captured White D4');
  setText('ko-feedback', state.koStage === 0 ? 'First, make the capture. Then try the immediate recapture.' : state.koStage === 1 ? 'Black D5 is legal: White D4 is captured before Black’s own liberties are checked. Now try White D4.' : 'White D4 is rejected: it would capture Black D5 and recreate the exact previous board. Compare every point in the two diagrams. The live board is unchanged.');
}

function updateNote(): void {
  notePanels = ids.map(id => {
    const records = entriesFor(state, id);
    const latest = [...records].reverse().find(entry => entry.legal);
    const example = records.length === 0;
    const exampleResult = attemptPuzzle(id, PUZZLES[id].solution);
    const board = latest?.position.board ?? (example && exampleResult.ok ? exampleResult.position.board : initialFor(id).board);
    const caption = latest ? latest.explanation : example && exampleResult.ok ? `Example: ${exampleResult.explanation} You have not tried this exercise.` : 'Your attempts have not yet produced a legal move. This is the unchanged initial position.';
    return { id, title: id === 'P1' ? 'Capture' : id === 'P2' ? 'Connection' : 'Choice', board, example, caption, attempts: records.map(({ coord, legal, seen, solved, explanation }) => ({ coord, legal, seen, solved, explanation })) };
  });
  const signature = JSON.stringify(notePanels);
  if (signature === noteSignature) return;
  noteSignature = signature;
  const anchors = { P1: 'capture', P2: 'bridge', P3: 'choice' };
  el('note-panels').innerHTML = notePanels.map(panel => `<article class="note-panel"><div class="note-panel-heading"><h3>${panel.title}</h3><span>${panel.id} / 7 × 7</span></div><div id="note-${panel.id}-board"></div><p class="note-tag">${panel.example ? 'Example — not played' : 'Your observation'}</p><p class="note-caption">${escapeXml(panel.caption)}</p>${panel.attempts.length ? `<details class="note-attempts"><summary>All ${panel.attempts.length} ${panel.attempts.length === 1 ? 'attempt' : 'attempts'}, in order</summary><ol>${panel.attempts.map(item => `<li><strong>${escapeXml(item.coord)}</strong> · ${escapeXml(item.explanation)}</li>`).join('')}</ol></details>` : ''}<a class="inline-link" href="#${anchors[panel.id]}">Revisit this position <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a></article>`).join('');
  notePanels.forEach(panel => {
    const view = new BoardView(el(`note-${panel.id}-board`), `note-${panel.id}-board`, { label: `${panel.title}: ${panel.example ? 'unplayed example' : 'your last observed legal attempt'}`, diagram: true });
    view.render(panel.board, { diagram: true });
  });
}

function updateTransitions(): void {
  const one = entryBoard();
  const centre = boardFrom(['D4']);
  const pairs: [Board, Board][] = [
    [one, one], [centre, GROUP_BOARD], [GROUP_BOARD, positionOf('P1').board],
    [positionOf('P1').board, TWO_EYES_BOARD], [TWO_EYES_BOARD, positionOf('P2').board],
  ];
  pairs.forEach(([from, to], i) => {
    paint(`tr-${i + 1}-from`, from);
    paint(`tr-${i + 1}-to`, to, i === 0 ? { liberties: groupAt(to, state.hero ?? 'D4')!.liberties } : {});
  });
  setText('tr-1-from-identity', state.hero ? `Your first stone · ${state.hero}` : 'Default entry example · D4');

  paint('tr-6-from', positionOf('P2').board);
  for (const branch of ['A', 'B'] as const) {
    const step = state.branchSteps[branch];
    const position = p2Line(branch)[step];
    const style: BoardStyle = { last: position.lastMove?.index, marked: indices(['B3', 'C3', 'E3', 'F3']), connection: branch === 'A' && step === 1 ? groupAt(position.board, 'B3')!.stones : [] };
    const detail = step === 0 ? 'Shared P2 starting position' : branch === 'A' ? 'Black D3 · strings joined' : step === 1 ? 'Black D4 · gap still open' : 'White D3 · gap occupied';
    for (const prefix of ['tr-6-to', 'tr-7-from']) {
      paint(`${prefix}-${branch}`, position.board, style);
      setText(`${prefix}-${branch}-detail`, detail);
    }
  }
  paint('tr-7-to', positionOf('P3').board, { marked: indices(['C3', 'C4']) });

  // These labelled examples never become user attempts or alter the live P3 view.
  const take = attemptPuzzle('P3', 'F6');
  const keep = attemptPuzzle('P3', 'C5');
  if (take.ok) paint('tr-8-from-take', take.position.board, { last: take.position.lastMove?.index });
  if (keep.ok) paint('tr-8-from-keep', keep.position.board, { marked: indices(['C3', 'C4']), connection: groupAt(keep.position.board, 'C3')!.stones, last: keep.position.lastMove?.index });
  const ko = koPosition();
  paint('tr-8-to', ko.board, { last: ko.lastMove?.index });
  paint('tr-9-from', ko.board, { last: ko.lastMove?.index });
  setText('tr-9-from-identity', state.koStage === 0 ? 'K1 · before the capture' : 'K1 · after Black D5');
  notePanels.forEach(panel => {
    paint(`tr-9-to-${panel.id}`, panel.board, { diagram: true });
    setText(`tr-9-to-${panel.id}-detail`, panel.example ? 'Example · not played' : 'Your observation');
  });
}

function render(): void {
  updateHero(); updateBreathing(); updateGroup();
  ids.forEach(updatePuzzle);
  updateEyes(); updateBranches(); updateKo(); updateNote(); updateTransitions();
  el<HTMLInputElement>('auto-reply').checked = state.autoReply;
  el<HTMLSelectElement>('motion-select').value = state.motion;
  el('sound-toggle').setAttribute('aria-pressed', String(state.sound));
  el('sound-toggle').setAttribute('aria-label', state.sound ? 'Turn stone sounds off' : 'Turn stone sounds on');
  el('sound-toggle').querySelector('span')!.textContent = state.sound ? 'Sound on' : 'Sound off';
}

el('hero-try').addEventListener('click', () => boardViews.get('hero-board')!.focus(state.hero ?? 'D4'));
el('hero-clear').addEventListener('click', () => { heroNotice = ''; commit({ ...state, hero: null, heroLiberties: false }); el('hero-try').focus({ preventScroll: true }); });
el('hero-liberties').addEventListener('click', () => { heroNotice = ''; commit({ ...state, heroLiberties: !state.heroLiberties }); });
el('group-outline').addEventListener('click', () => { groupNotice = ''; commit({ ...state, groupPoint: 'D3', groupLiberties: false }); });
el('group-liberties').addEventListener('click', () => { groupNotice = ''; commit({ ...state, groupLiberties: !state.groupLiberties }); });
el('group-separate').addEventListener('click', () => { groupNotice = ''; commit({ ...state, groupPoint: 'F5' }); });
el('eye-c3').addEventListener('click', () => commit({ ...state, eyesPoint: 'C3' }));
el('eye-e3').addEventListener('click', () => commit({ ...state, eyesPoint: 'E3' }));
el('eyes-reset').addEventListener('click', () => commit({ ...state, eyesPoint: null }));
el('auto-reply').addEventListener('change', () => commit({ ...state, autoReply: el<HTMLInputElement>('auto-reply').checked }));
el('P3-next').addEventListener('click', () => { messages.P3 = ''; commit(advanceReply(state)); const result = puzzleView(state, 'P3').attempt; if (result?.ok && result.reply) boardViews.get('P3-board')!.animateMove(result.reply.move.index, result.reply.captured.map(index => ({index,color:'black' as const}))); el('P3-undo').focus({ preventScroll: true }); tap(); });
el('branches-reset').addEventListener('click', () => commit({ ...state, branchSteps: { A: 0, B: 0 } }));
el('branches-final').addEventListener('click', () => commit({ ...state, branchSteps: { A: 1, B: 2 } }));
el('compare-choice').addEventListener('click', () => {
  const panel = el('choice-comparison'); panel.hidden = !panel.hidden;
  el('compare-choice').setAttribute('aria-expanded', String(!panel.hidden));
});
el('ko-capture').addEventListener('click', () => { commit({ ...state, koStage: 1 }); boardViews.get('ko-board')!.animateMove(indexOf('D5'), [{index:indexOf('D4'),color:'white'}]); el('ko-recapture').focus({ preventScroll: true }); tap(); });
el('ko-recapture').addEventListener('click', () => commit({ ...state, koStage: 2 }));
el('ko-reset').addEventListener('click', () => commit({ ...state, koStage: 0 }));
el('sound-toggle').addEventListener('click', () => {
  const next = !state.sound; sound.setEnabled(next); audioActivated = true; commit({ ...state, sound: next });
  if (next) sound.play();
});
el('motion-select').addEventListener('change', () => {
  const preference = el<HTMLSelectElement>('motion-select').value as Session['motion'];
  commit({ ...state, motion: preference }); motion.setPreference(preference);
});
const menu = el<HTMLDialogElement>('chapter-menu');
let menuNavigation = false;
menu.setAttribute('data-lenis-prevent', '');
el('menu-open').addEventListener('click', () => menu.showModal());
el('menu-close').addEventListener('click', () => menu.close());
menu.addEventListener('close', () => { if (!menuNavigation) el('menu-open').focus({ preventScroll: true }); menuNavigation = false; });
menu.addEventListener('click', event => {
  if (event.target === menu) {
    const rect = menu.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) menu.close();
  }
});

document.addEventListener('click', event => {
  const target = event.target as Element;
  const example = target.closest<HTMLElement>('[data-example]');
  if (example) commit({ ...state, libertyExample: example.dataset.example as Session['libertyExample'] });
  const action = target.closest<HTMLElement>('[data-action]');
  if (action) {
    const id = action.dataset.puzzle as PuzzleId;
    messages[id] = ''; rejected[id] = undefined;
    if (action.dataset.action === 'undo') { commit(undoPuzzle(state, id)); if (action.matches(':disabled')) boardViews.get(`${id}-board`)!.focus(); }
    if (action.dataset.action === 'reset') commit(resetPuzzle(state, id));
    if (action.dataset.action === 'hint') commit({ ...state, puzzles: { ...state.puzzles, [id]: { ...state.puzzles[id], hint: !state.puzzles[id].hint } } });
  }
  const revisit = target.closest<HTMLElement>('[data-revisit]');
  if (revisit) { const id = revisit.dataset.revisit as PuzzleId; messages[id] = ''; rejected[id] = undefined; commit(selectAttempt(state, id, Number(revisit.dataset.attempt))); }
  const branch = target.closest<HTMLElement>('[data-branch]');
  if (branch) commit({ ...state, branch: branch.dataset.branch as 'A'|'B' });
  const replay = target.closest<HTMLElement>('[data-replay]');
  if (replay) {
    const [variation, direction] = replay.dataset.replay!.split('-') as ['A'|'B', 'prev'|'next'];
    const step = Math.max(0, Math.min(variation === 'A' ? 1 : 2, state.branchSteps[variation] + (direction === 'next' ? 1 : -1)));
    commit({ ...state, branchSteps: { ...state.branchSteps, [variation]: step } });
  }
  const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (link) {
    event.preventDefault();
    if (menu.open) { menuNavigation = true; menu.close(); }
    motion.navigate(link.getAttribute('href')!);
  }
});
document.querySelectorAll<HTMLFormElement>('[data-puzzle-form]').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const id = form.dataset.puzzleForm as PuzzleId;
  submitPuzzle(id, el<HTMLSelectElement>(`${id}-coordinate`).value);
}));

let noteObjectUrl: string | null = null;
el('download-note').addEventListener('click', () => {
  try {
    const svg = createObservationNote(notePanels);
    if (noteObjectUrl) URL.revokeObjectURL(noteObjectUrl);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    noteObjectUrl = url;
    const link = el<HTMLAnchorElement>('note-save-link');
    link.href = url;
    el<HTMLAnchorElement>('note-preview-link').href = url;
    el('note-file-links').hidden = false;
    link.click();
    setText('download-feedback', 'Your observation note is ready. The file includes the positions and attempts shown above.');
  } catch {
    setText('download-feedback', 'The note could not be created. Your observations are still here; please try again.');
  }
});
window.addEventListener('pagehide', event => { if (!event.persisted && noteObjectUrl) URL.revokeObjectURL(noteObjectUrl); });

const heroImage = el<HTMLImageElement>('hero-image');
heroImage.addEventListener('error', () => el('before').classList.add('asset-failed'));
if (heroImage.complete && heroImage.naturalWidth === 0) el('before').classList.add('asset-failed');
render();
performance.mark('sente-interactive');
Promise.allSettled([document.fonts.ready, heroImage.decode()]).then(() => { performance.mark('sente-hero-settled'); });
if (import.meta.hot) import.meta.hot.dispose(() => { motion.destroy(); sound.destroy(); });
