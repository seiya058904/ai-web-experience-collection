import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
let compiled;

function compiledSources() {
  if (compiled) return compiled;
  const directory = mkdtempSync(join(tmpdir(), 'imago-source-tests-'));
  try {
    // TypeScript 7 has no legacy transpileModule API. Emit the actual source
    // with the installed compiler; no application algorithms are copied here.
    execFileSync(process.execPath, [
      join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig',
      '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler',
      '--lib', 'ES2022,DOM,DOM.Iterable', '--strict', '--skipLibCheck',
      '--types', 'vite/client', '--outDir', directory,
      'src/state.ts', 'src/engine.ts',
    ], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    compiled = Object.fromEntries(['state', 'engine'].map(name => [
      name, readFileSync(join(directory, `${name}.js`), 'utf8'),
    ]));
    return compiled;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function load(name, globals = {}, dependencies = {}) {
  let source = compiledSources()[name];
  const names = Array.from(source.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([\w$]+)/gm), match => match[1]);
  if (name === 'engine') {
    const imports = [
      /^import Lenis from ['"]lenis['"];\r?\n/m,
      /^import ['"]lenis\/dist\/lenis\.css['"];\r?\n/m,
      /^import \{ readObservationState, updateObservationState \} from ['"]\.\/state['"];\r?\n/m,
    ];
    for (const statement of imports) {
      if (!statement.test(source)) throw new Error('Update the test dependency adapter for changed engine imports.');
      source = source.replace(statement, '');
    }
    source = 'const { Lenis, readObservationState, updateObservationState } = dependencies;\n' + source;
  }
  source = source.replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|class))/gm, '');
  if (/^\s*(import|export)\b/m.test(source)) throw new Error('Unsupported module binding in source test adapter.');
  const module = { exports: {} };
  const context = createContext({ ...globals, dependencies, module });
  new Script(`${source}\nmodule.exports = { ${names.join(', ')} };`, {
    filename: join(root, `src/${name}.ts`),
  }).runInContext(context);
  return module.exports;
}

export function loadState(globals = {}) {
  return load('state', globals);
}

export function loadNarrativeEvaluator() {
  const unexpected = () => { throw new Error('Pure narrative evaluation accessed an imperative dependency.'); };
  return load('engine', {}, {
    Lenis: class { constructor() { unexpected(); } },
    readObservationState: unexpected,
    updateObservationState: unexpected,
  }).evaluateNarrativeFrame;
}

export const plain = value => structuredClone(value);
