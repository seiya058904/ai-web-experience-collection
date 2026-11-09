import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { FilmPlayer } from '../experiences/frame/src/player.ts';

test('the production RAF loop retains one scheduled callback when playback publishes during a tick', async () => {
  const main = await readFile(new URL('../experiences/frame/src/main.ts', import.meta.url), 'utf8');
  const start = main.indexOf('function loop(time:number){');
  const end = main.indexOf("window.addEventListener('scroll'", start);
  assert.ok(start >= 0 && end > start, 'the production scheduler is available to exercise');
  const schedulerCode = ts.transpileModule(main.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const queue = new Map();
  let nextId = 0, scheduler, tickCount = 0;
  const player = new FilmPlayer(() => scheduler.requestLoop());
  const environment = {
    document: { hidden: false },
    // The real application keeps Lenis active after a film ends.
    lenis: { raf() { tickCount += 1; } },
    players: { editor: player, premiere: player },
    requestAnimationFrame(callback) { const id = ++nextId; queue.set(id, callback); return id; },
  };
  scheduler = new Function('environment', `
    let raf=0,scrollDirty=true,disposed=false;
    const {document,lenis,players,requestAnimationFrame}=environment;
    const updateScroll=()=>{};
    ${schedulerCode}
    return {requestLoop};
  `)(environment);
  player.play({ restart: true });
  scheduler.requestLoop();
  assert.equal(queue.size, 1);
  for (let frame = 0; frame <= 240; frame += 1) {
    const scheduled = [...queue.values()];
    queue.clear();
    for (const callback of scheduled) callback(frame * 1000 / 60);
    assert.equal(queue.size, 1, `one callback remains after display frame ${frame}`);
  }
  assert.equal(player.state.complete, true);
  assert.equal(player.state.frame, 24);
  assert.equal(tickCount, 241, 'playback completion must not leave parallel animation loops running');
});
