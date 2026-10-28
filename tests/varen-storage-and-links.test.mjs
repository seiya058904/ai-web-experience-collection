import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const requireRepo = createRequire(path.join(repo, 'package.json'));
const ts = requireRepo('typescript');
const src = path.join(repo, 'experiences/varen/src');
function evaluate(relative, requireFn, globals = {}) {
  const source = fs.readFileSync(path.join(src, relative), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: requireFn, ...globals }, { filename: relative });
  return module.exports;
}
const data = evaluate('data.ts', () => { throw new Error('unexpected data import'); });
const clone = value => JSON.parse(JSON.stringify(value));
const storageKey = 'varen:saved:v1';
const storage = new Map();
const savedNow = () => clone(data.looks.filter(look => storage.get(`${storageKey}:${look.id}`) === '1').map(look => look.id).sort());
const tabs = [];
const pendingStorageEvents = [];

function mountTab(name) {
  const states = [];
  const effects = [];
  const listeners = new Map();
  let cursor = 0;
  let effectCursor = 0;
  let afterRender = [];
  let current;
  const tab = { name, render, emit(event) {
    listeners.get('storage')?.(event);
    render();
  }, get value() { return clone(current.saved); }, toggle(id) {
    current.toggle(id);
    render();
  } };
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(effect, dependencies) {
      const index = effectCursor++;
      const previous = effects[index];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        afterRender.push(() => {
          previous?.cleanup?.();
          effects[index] = { dependencies: [...dependencies], cleanup: effect() };
        });
      }
    },
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) {
      const oldValue = storage.get(key) ?? null;
      storage.set(key, String(value));
      if (oldValue === String(value)) return;
      for (const other of tabs) if (other !== tab) pendingStorageEvents.push({ tab: other, event: { key, oldValue, newValue: String(value) } });
    },
  };
  const window = {
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type),
    // The unrelated 4-second toast timeout need not run in this schedule.
    setTimeout: () => 1,
  };
  const module = evaluate('hooks.ts', name => {
    if (name === 'react') return hooks;
    if (name === './data') return data;
    throw new Error(`unexpected hook import: ${name}`);
  }, { window, localStorage, clearTimeout() {} });
  function render() {
    cursor = effectCursor = 0;
    afterRender = [];
    current = module.useSavedLooks();
    for (const effect of afterRender) effect();
  }
  tabs.push(tab);
  render();
  return tab;
}

// Both windows have mounted the same initially empty selection. A storage event
// is asynchronous; this schedule holds delivery until each tab has made one edit.
const a = mountTab('A');
const b = mountTab('B');
a.toggle('slate-suit');
b.toggle('sand-jacket');
const beforeDelivery = { A: a.value, B: b.value, stored: savedNow() };
while (pendingStorageEvents.length) {
  const { tab, event } = pendingStorageEvents.shift();
  tab.emit(event);
}
const afterDelivery = { A: a.value, B: b.value, stored: savedNow() };
assert.deepEqual(afterDelivery.stored, ['sand-jacket','slate-suit']);
assert.deepEqual([...afterDelivery.A].sort(), afterDelivery.stored);
assert.deepEqual([...afterDelivery.B].sort(), afterDelivery.stored);
b.toggle('slate-suit');
while(pendingStorageEvents.length){ const {tab,event}=pendingStorageEvents.shift();tab.emit(event); }
assert.deepEqual(a.value,['sand-jacket']);
assert.deepEqual(b.value,['sand-jacket']);
// Old-array migration must not resurrect an explicitly removed look.
storage.set(storageKey, JSON.stringify(['slate-suit']));
a.emit({key:storageKey,newValue:JSON.stringify(['slate-suit'])});
assert.deepEqual(a.value,['sand-jacket']);

const { LookCard } = evaluate('components/Collection.tsx', name => {
  if (name === 'react' || name === 'react/jsx-runtime') return requireRepo(name);
  if (name === '../data') return data;
  if (name === '../use-gsap') return { useGSAP() {} };
  if (name === 'gsap') return {};
  if (name === './Primitives') return { Image() {}, SaveButton() {} };
  throw new Error(`unexpected component import: ${name}`);
});
const opened = [];
const card = LookCard({ look: data.looks[0], saved: false, onOpen: look => opened.push(look.id), onSave() {} });
const anchors = [];
function visit(node) {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== 'object') return;
  if (node.type === 'a') anchors.push(node);
  visit(node.props?.children);
}
visit(card);
assert.equal(anchors.length, 2);
const clickResults = [];
for (const anchor of anchors) for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey']) {
  const event = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    [modifier]: true, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  anchor.props.onClick(event);
  assert.equal(event.defaultPrevented, false);
  clickResults.push({ href: anchor.props.href, modifier, prevented: event.defaultPrevented });
}
assert.equal(opened.length, 0, 'modified clicks retain native navigation');
const plain={button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
anchors[0].props.onClick(plain);assert.equal(plain.defaultPrevented,true);assert.equal(opened.length,1);
console.log(JSON.stringify({ source: 'real hooks.ts + LookCard TSX, transpiled in memory',
  storageProbe: { scheduler: 'two edits before asynchronous storage-event delivery', beforeDelivery, afterDelivery },
  modifiedClicks: clickResults, modalOpenCalls: opened.length }, null, 2));
