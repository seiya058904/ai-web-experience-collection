import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEFORE_BLOCK_PROGRESS,
  MAX_TRIAL_DELTA_MS,
  TRIAL_DURATION_MS,
  advanceTrial,
  createInitialState,
  getRepairView,
  pauseTrial,
  resetPlan,
  resetTrial,
  selectPlan,
  serializeSavedState,
  setComparison,
  setFocus,
  startTrial,
  type AppState,
} from '../experiences/mend/src/state.ts';

function playFor(state: AppState, milliseconds: number): AppState {
  let result = state;
  let remaining = milliseconds;
  while (remaining > 0) {
    const delta = Math.min(50, remaining);
    result = advanceTrial(result, delta, true, true);
    remaining -= delta;
  }
  return result;
}

test('saved choices restore only valid own data, never interaction results or prototypes', () => {
  const initial = createInitialState();
  for (const invalid of [undefined, null, true, 7, 'B', [], { repairPlan: 'C', choiceExplicit: true }]) {
    assert.deepEqual(createInitialState(invalid), initial);
  }

  const restored = createInitialState({
    version: 1,
    repairPlan: 'B',
    choiceExplicit: true,
    trialCompleted: true,
    trialProgress: 1,
    trialStatus: 'complete',
    inspectionFocus: 'paint',
    compareState: 'before',
  });
  assert.deepEqual(restored, { ...initial, repairPlan: 'B', choiceExplicit: true });
  assert.deepEqual(createInitialState(Object.create({ repairPlan: 'B', choiceExplicit: true })), initial);
  assert.equal(createInitialState({ repairPlan: 'B', choiceExplicit: 'true' }).choiceExplicit, false);

  let getterRead = false;
  const accessor = Object.defineProperty({}, 'repairPlan', {
    get() { getterRead = true; throw new Error('must not execute'); },
  });
  assert.deepEqual(createInitialState(accessor), initial);
  assert.equal(getterRead, false);

  const nullPrototype = Object.assign(Object.create(null), { repairPlan: 'B', choiceExplicit: true });
  assert.equal(createInitialState(nullPrototype).repairPlan, 'B');
  assert.equal(createInitialState(nullPrototype).choiceExplicit, true);
});

test('saving contains only the versioned choice, and never restores a previous trial as evidence', () => {
  const completed = startTrial(selectPlan(createInitialState(), 'B'), 'repaired', true);
  const saved = serializeSavedState(completed);
  assert.deepEqual(saved, { version: 1, repairPlan: 'B', choiceExplicit: true });

  const restored = createInitialState(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.repairPlan, 'B');
  assert.equal(restored.choiceExplicit, true);
  assert.equal(restored.trialCompleted, false);
  assert.equal(restored.trialStatus, 'idle');
});

test('all chapter views obey A/B wheel and return-bag truth without changing the saved choice', () => {
  for (const plan of ['A', 'B'] as const) {
    const state = Object.freeze(selectPlan(createInitialState(), plan));
    for (let chapter = 1; chapter <= 10; chapter += 1) {
      const view = getRepairView(state, chapter);
      assert.equal(view.damaged, chapter <= 5);
      assert.equal(view.repaired, chapter >= 6);
      assert.equal(view.fittedSleeve, plan === 'A' && chapter >= 6);
      assert.equal(view.returnedOriginalWheel, plan === 'B' && chapter >= 6);
      assert.equal(view.mountedWheel, plan === 'B' && chapter >= 6 ? 'new' : 'original');
    }
    assert.equal(state.repairPlan, plan);
  }

  const chosenB = selectPlan(createInitialState(), 'B');
  assert.equal(getRepairView(chosenB, 10).mountedWheel, 'new');
  assert.equal(getRepairView(chosenB, 1).mountedWheel, 'original');
  assert.equal(getRepairView(chosenB, 10).mountedWheel, 'new');
  assert.equal(chosenB.repairPlan, 'B');
});

test('changing plans clears stale playback and success; reselecting the same plan preserves both', () => {
  const running = Object.freeze(playFor(startTrial(createInitialState(), 'repaired'), 900));
  const same = selectPlan(running, 'A');
  assert.equal(same.choiceExplicit, true);
  assert.equal(same.trialProgress, running.trialProgress);
  assert.equal(same.trialStatus, 'running');
  assert.equal(running.choiceExplicit, false);

  const changed = selectPlan(running, 'B');
  assert.equal(changed.repairPlan, 'B');
  assert.equal(changed.trialStatus, 'idle');
  assert.equal(changed.trialProgress, 0);
  assert.equal(changed.trialCompleted, false);
  assert.equal(running.repairPlan, 'A');
  assert.ok(running.trialProgress > 0);

  const completed = startTrial(changed, 'repaired', true);
  assert.equal(selectPlan(completed, 'B').trialCompleted, true);
  assert.equal(selectPlan(completed, 'A').trialCompleted, false);
});

test('trial reset preserves the choice, while plan reset restores the unchosen A example', () => {
  const completed = setFocus(startTrial(selectPlan(createInitialState(), 'B'), 'repaired', true), 'ear');
  const trialReset = resetTrial(completed);
  assert.equal(trialReset.repairPlan, 'B');
  assert.equal(trialReset.choiceExplicit, true);
  assert.equal(trialReset.trialStatus, 'idle');
  assert.equal(trialReset.trialProgress, 0);
  assert.equal(trialReset.trialCompleted, false);

  const planReset = resetPlan(completed);
  assert.equal(planReset.repairPlan, 'A');
  assert.equal(planReset.choiceExplicit, false);
  assert.equal(planReset.trialStatus, 'idle');
  assert.equal(planReset.trialCompleted, false);
  assert.equal(planReset.inspectionFocus, 'ear');
});

test('normal trial reaches the endpoint in 2800 ms and wheel position can be derived from progress', () => {
  const initial = startTrial(createInitialState(), 'repaired');
  assert.equal(initial.trialProgress, 0);
  assert.equal(initial.trialCompleted, false);
  const midpoint = playFor(initial, TRIAL_DURATION_MS / 2);
  assert.ok(Math.abs(midpoint.trialProgress - 0.5) < 1e-12);
  assert.equal(midpoint.trialStatus, 'running');
  const completed = playFor(midpoint, TRIAL_DURATION_MS / 2);
  assert.equal(completed.trialProgress, 1);
  assert.equal(completed.trialStatus, 'complete');
  assert.equal(completed.trialCompleted, true);
  assert.deepEqual(playFor(completed, 3000), completed);
});

test('before demonstration stops at the obstruction and cannot claim repaired success', () => {
  const previouslyComplete = startTrial(createInitialState(), 'repaired', true);
  const before = startTrial(previouslyComplete, 'before');
  assert.equal(before.trialCompleted, false);
  const blocked = playFor(before, TRIAL_DURATION_MS);
  assert.equal(blocked.trialProgress, BEFORE_BLOCK_PROGRESS);
  assert.equal(blocked.trialStatus, 'blocked');
  assert.equal(blocked.trialCompleted, false);
  assert.deepEqual(playFor(blocked, 3000), blocked);
});

test('leaving the chapter or hiding the page freezes the current pose without hidden-time catch-up', () => {
  const midpoint = playFor(startTrial(createInitialState(), 'repaired'), TRIAL_DURATION_MS / 2);
  for (const [active, visible] of [[false, true], [true, false], [false, false]]) {
    const paused = advanceTrial(midpoint, 50000, active, visible);
    assert.equal(paused.trialStatus, 'paused');
    assert.equal(paused.trialProgress, midpoint.trialProgress);
    assert.equal(paused.trialCompleted, false);
    assert.deepEqual(advanceTrial(paused, 50000, true, true), paused);
    assert.equal(startTrial(paused, 'repaired').trialProgress, 0);
  }
  assert.equal(pauseTrial(midpoint).trialProgress, midpoint.trialProgress);
  assert.equal(pauseTrial(createInitialState()).trialStatus, 'idle');
});

test('large, negative, and nonfinite frame deltas cannot cause runaway movement', () => {
  const running = Object.freeze(startTrial(createInitialState(), 'repaired'));
  const capped = advanceTrial(running, 50000, true, true);
  assert.equal(capped.trialProgress, MAX_TRIAL_DELTA_MS / TRIAL_DURATION_MS);
  assert.equal(capped.trialStatus, 'running');
  for (const invalidDelta of [0, -10, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.deepEqual(advanceTrial(running, invalidDelta, true, true), running);
  }
  assert.equal(running.trialProgress, 0);
});

test('reduced motion provides stable before/after outcomes only after the user starts a trial', () => {
  const state = createInitialState();
  assert.equal(state.trialCompleted, false);
  const repaired = startTrial(state, 'repaired', true);
  assert.equal(repaired.trialProgress, 1);
  assert.equal(repaired.trialStatus, 'complete');
  assert.equal(repaired.trialCompleted, true);

  const before = startTrial(repaired, 'before', true);
  assert.equal(before.trialProgress, BEFORE_BLOCK_PROGRESS);
  assert.equal(before.trialStatus, 'blocked');
  assert.equal(before.trialCompleted, false);
  assert.equal(before.repairPlan, state.repairPlan);
});

test('inspection and comparison remain independent from repair and trial state', () => {
  const running = Object.freeze(playFor(startTrial(selectPlan(createInitialState(), 'B'), 'repaired'), 500));
  const inspected = setFocus(running, 'paint');
  const compared = setComparison(inspected, 'before');
  assert.equal(compared.inspectionFocus, 'paint');
  assert.equal(compared.compareState, 'before');
  assert.equal(compared.repairPlan, 'B');
  assert.equal(compared.trialProgress, running.trialProgress);
  assert.equal(compared.trialStatus, 'running');
  assert.equal(running.inspectionFocus, 'wheel');
  assert.equal(running.compareState, 'after');
});
