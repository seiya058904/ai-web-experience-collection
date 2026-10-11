import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { CHAPTERS, SUBSYSTEMS, SOURCES } from '../experiences/orbital/lib/orbital/mission.ts';

const source = fs.readFileSync(new URL('../experiences/orbital/components/orbital/Experience.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source.replaceAll('import.meta.env.BASE_URL', "'/ai-web-experience-collection/'"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;

// Execute the actual owner handlers/effect, with deterministic hook scheduling and module readiness.
// Actual React rendering, controller integration and browser lifecycle are separate browser gates.
function owner(systemReduced = false) {
  const hooks = [], effects = [], states = [];
  let cursor = 0, tree, cleanup, resolveModule;
  const ready = new Promise(resolve => { resolveModule = resolve; });
  const mission = { created: 0, destroyed: 0, soundRequests: [], locked: false, reduced: false };
  const react = {
    useRef(value) { const index = cursor++; return hooks[index] ??= { current: value }; },
    useState(value) {
      const index = cursor++; if (!(index in hooks)) hooks[index] = value;
      return [hooks[index], next => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; states.push(index); }];
    },
    useEffect(effect) { const index = cursor++; if (!(index in hooks)) { hooks[index] = true; effects.push(effect); } },
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name.endsWith('/mission')) return { CHAPTERS, SUBSYSTEMS, SOURCES };
    if (name.endsWith('/controller')) return ready;
    return Object.fromEntries(['CollectionReturn', 'Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle',
      'SheetDescription', 'SheetTrigger', 'Dialog', 'DialogContent', 'DialogTitle', 'DialogDescription',
      'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'OrbitMark', 'SoundIcon', 'MenuIcon', 'ReplayIcon',
      'ScrollIcon', 'EngineeringOverlay'].map(key => [key, key]));
  }, module, module.exports);
  function render() {
    cursor = 0; tree = module.exports.default();
    tree.props.ref.current ??= { setAttribute() {} };
    while (effects.length) cleanup = effects.shift()();
    return tree;
  }
  function find(predicate, item) {
    if (!item || typeof item !== 'object') return null;
    if (Array.isArray(item)) return item.map(value => find(predicate, value)).find(Boolean);
    if (predicate(item)) return item;
    return find(predicate, item.props?.children);
  }
  const button = className => find(item => item.type === 'button' && item.props.className === className, tree);
  const sheet = () => find(item => item.type === 'Sheet', tree);
  render();
  return {
    mission, render, states,
    motion: () => button('motion-option').props.onClick(),
    sound: () => button('sound-button').props.onClick(),
    openIndex: value => sheet().props.onOpenChange(value),
    soundPressed: () => button('sound-button').props['aria-pressed'],
    motionOn: () => button('motion-option').props.children[1].props.children === 'ON',
    unmount() { cleanup(); tree.props.ref.current = null; },
    async load() {
      resolveModule({ createMission(_root, _chapter, onReduced, initial = {}) {
        mission.created++; mission.initial = initial;
        mission.reduced = initial.reduced ?? systemReduced;
        mission.locked = initial.locked ?? false;
        onReduced(mission.reduced);
        return { setLocked(value) { mission.locked = value; },
          setReduced(value) { mission.reduced = value; onReduced(value); },
          setDestination() {}, setSubsystem() {}, goTo() {}, destroy() { mission.destroyed++; },
          toggleSound() { return new Promise(resolve => mission.soundRequests.push(resolve)); } };
      } });
      await new Promise(resolve => setImmediate(resolve));
      render();
    },
  };
}

test('ORBITAL owner retains user motion selected before lazy controller readiness', async () => {
  const ui = owner(); ui.openIndex(true); ui.render(); ui.motion(); ui.render();
  assert.equal(ui.motionOn(), true);
  await ui.load();
  assert.equal(ui.motionOn(), true);
  assert.equal(ui.mission.reduced, true);
  assert.equal(ui.mission.locked, true);
  ui.openIndex(false); assert.equal(ui.mission.locked, false); ui.unmount();
});

test('ORBITAL two same-render motion gestures retain final off intent despite system reduce', async () => {
  const ui = owner(true); ui.openIndex(true); ui.render(); ui.motion(); ui.motion(); ui.render();
  assert.equal(ui.motionOn(), false);
  await ui.load();
  assert.equal(ui.mission.reduced, false);
  ui.unmount();
});

test('ORBITAL retains the system reduced-motion default when no user override exists', async () => {
  const ui = owner(true); await ui.load();
  ui.openIndex(true); ui.render();
  assert.equal(ui.motionOn(), true); assert.equal(ui.mission.reduced, true); ui.unmount();
});

test('ORBITAL unmount before module readiness never creates a controller', async () => {
  const ui = owner(); ui.unmount(); await ui.load();
  assert.equal(ui.mission.created, 0);
});

test('ORBITAL owner ignores late sound result after a newer sound request', async () => {
  const ui = owner(); await ui.load();
  const first = ui.sound(), second = ui.sound();
  ui.mission.soundRequests[1](true); await second; ui.render();
  assert.equal(ui.soundPressed(), true);
  ui.mission.soundRequests[0](false); await first; ui.render();
  assert.equal(ui.soundPressed(), true); ui.unmount();
});

test('ORBITAL owner does not write React state after pending sound completes on unmount', async () => {
  const ui = owner(); await ui.load();
  const pending = ui.sound(); ui.unmount(); const stateWrites = ui.states.length;
  ui.mission.soundRequests[0](true); await pending;
  assert.equal(ui.states.length, stateWrites);
});
