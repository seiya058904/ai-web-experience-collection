#!/usr/bin/env node
/**
 * Behavioral and packaging invariants for the offline URUSHI artwork.
 * This check requires no browser, network, or development-only test package.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chapters, getStoryState, positionFromScroll } from '../src/story.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS  ${name}`); }
  catch (error) { failures.push({ name, message: error.message }); console.error(`FAIL  ${name}\n      ${error.message}`); }
}
async function filesIn(directory) {
  let entries;
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const result = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesIn(full));
    else result.push(full);
  }
  return result;
}

const masks = ['wood', 'ground', 'coat', 'cure', 'abrasion', 'abradeFront', 'layers', 'vermilion', 'polish', 'gold', 'goldVeil', 'goldReveal', 'chamber', 'section'];
const positions = Array.from({ length: 2201 }, (_, i) => i / 200);
const baseline = new Map(positions.map(p => [p, getStoryState(p)]));

await check('Every chapter has a unique anchor and complete English / Chinese copy', () => {
  assert.equal(chapters.length, 11);
  assert.equal(new Set(chapters.map(ch => ch.id)).size, chapters.length);
  for (const ch of chapters) {
    assert.match(ch.id, /^[a-z][a-z0-9-]+$/);
    for (const key of ['name', 'zh', 'title', 'titleZh', 'body', 'bodyZh', 'note', 'noteZh']) assert.ok(ch[key]?.trim(), `${ch.id}: missing ${key}`);
    assert.ok(Number.isFinite(ch.height) && ch.height > 1, `${ch.id}: invalid scroll extent`);
  }
});

await check('The complete journey has finite state and bounded material masks', () => {
  const seen = new Set();
  for (const [p, state] of baseline) {
    seen.add(state.chapter);
    for (const [name, value] of Object.entries(state)) assert.ok(Number.isFinite(value), `${name} is not finite at ${p}`);
    for (const name of masks) assert.ok(state[name] >= 0 && state[name] <= 1, `${name} is outside [0, 1] at ${p}`);
    assert.ok(state.local >= 0 && state.local <= 1, `invalid chapter progress at ${p}`);
    assert.ok(state.zoom > 0, `invalid camera scale at ${p}`);
  }
  assert.deepEqual([...seen], chapters.map((_, i) => i));
});

await check('Gold is exactly absent before deposition, including its boundary', () => {
  for (const [p, state] of baseline) if (p <= 8.03) assert.equal(state.gold, 0, `early gold at ${p}`);
  for (const p of [0, 7.99, 8, 8.029999999, 8.03]) assert.equal(getStoryState(p).gold, 0, `gold leaked at ${p}`);
  assert.ok(getStoryState(8.5).gold > 0, 'the deposition scene does not deposit gold');
  assert.equal(getStoryState(8.9).gold, 1, 'deposition never completes');
});

await check('Reverse scrolling and arbitrary chapter jumps have no material history', () => {
  for (const p of [...positions].reverse()) assert.deepEqual(getStoryState(p), baseline.get(p), `reverse scroll differs at ${p}`);
  // This coprime stride visits every sample once in a non-monotonic order.
  for (let i = 0; i < positions.length; i++) {
    const p = positions[(i * 997) % positions.length];
    assert.deepEqual(getStoryState(p), baseline.get(p), `chapter jump differs at ${p}`);
  }
  const returned = getStoryState(10.8);
  returned.gold = -999;
  assert.deepEqual(getStoryState(0), baseline.get(0), 'a later state contaminated the hero');
  assert.equal(getStoryState(10.8).gold, 1, 'returned state objects share mutable data');
});

await check('Material values join continuously across chapter handoffs', () => {
  const fields = Object.keys(getStoryState(0)).filter(key => !['phase', 'chapter', 'local'].includes(key));
  for (let p = 1; p <= 10; p++) {
    const before = getStoryState(p - 0.000001), after = getStoryState(p + 0.000001);
    for (const key of fields) assert.ok(Math.abs(after[key] - before[key]) < 0.0002, `${key} jumps at chapter ${p}`);
  }
});

await check('Invalid positions recover to the hero and endpoints clamp safely', () => {
  for (const p of [NaN, Infinity, -Infinity, undefined, null, 'bad-position']) assert.deepEqual(getStoryState(p), getStoryState(0));
  assert.deepEqual(getStoryState(-20), getStoryState(0));
  assert.deepEqual(getStoryState(300), getStoryState(11));
});

await check('Abrasion interrupts clarity; polish restores it before gold appears', () => {
  const core = getStoryState(1.1), abraded = getStoryState(4.9), polished = getStoryState(7.95);
  assert.equal(core.wood, 1);
  assert.equal(core.polish, 0);
  assert.ok(abraded.abrasion > 0.9 && abraded.polish < 0.1, 'abrasion does not materially interrupt polish');
  assert.ok(polished.polish > 0.99 && polished.abrasion < 0.01, 'polish does not restore clarity');
  assert.equal(polished.gold, 0);
});

await check('The humid chamber, layer section, vermilion turn, and gold reveal are reachable', () => {
  assert.ok(getStoryState(3.5).chamber > 0.99);
  assert.ok(getStoryState(5.45).section > 0.99);
  assert.equal(getStoryState(6.75).vermilion, 1);
  const hidden = getStoryState(9.4), revealed = getStoryState(9.95);
  assert.equal(hidden.gold, 1);
  assert.equal(hidden.goldVeil, 1);
  assert.equal(hidden.goldReveal, 0);
  assert.equal(revealed.goldReveal, 1);
  assert.equal(revealed.polish, 1);
});

await check('Scroll geometry reaches every scene and the last complete state at every target viewport', () => {
  for (const height of [844, 900, 2160]) {
    let top = 0;
    const sections = chapters.map(ch => {
      const section = { top, bottom: top + ch.height * height };
      top = section.bottom;
      return section;
    });
    assert.equal(positionFromScroll(-100, sections, height), 0);
    for (let i = 0; i < chapters.length; i++) {
      assert.equal(positionFromScroll(sections[i].top, sections, height), i);
      const end = i === chapters.length - 1 ? sections[i].bottom - height : sections[i+1].top;
      assert.ok(Math.abs(positionFromScroll((sections[i].top + end) / 2, sections, height) - (i + 0.5)) < 1e-10);
    }
    assert.equal(positionFromScroll(top - height, sections, height), 11);
    assert.equal(positionFromScroll(top + 1000, sections, height), 11);
  }
  assert.equal(positionFromScroll(0, [], 900), 0);
});

const publicFiles = await filesIn(path.join(root, 'public'));
const modelFiles = publicFiles.filter(file => /\.(?:glb|gltf|obj)$/i.test(file));
const textureFiles = publicFiles.filter(file => /(?:^|[\\/])textures(?:[\\/]).*\.(?:png|jpe?g|webp|hdr|exr)$/i.test(file));
await check('The shipped object model exists and has no external buffer or texture dependencies', async () => {
  assert.ok(modelFiles.length > 0, 'no local OBJ / GLB / glTF model found under public/');
  for (const file of modelFiles) {
    const data = await fs.readFile(file);
    let model;
    if (/\.obj$/i.test(file)) {
      const text = data.toString('utf8');
      const vertices = [...text.matchAll(/^v[ \t]+([^\n]+)/gm)];
      const faces = [...text.matchAll(/^f[ \t]+([^\n]+)/gm)];
      assert.ok(vertices.length >= 100 && faces.length >= 100, `${path.basename(file)}: no complete mesh`);
      for (const vertex of vertices) {
        const coordinates = vertex[1].trim().split(/\s+/).map(Number);
        assert.ok(coordinates.length >= 3 && coordinates.every(Number.isFinite), `${path.basename(file)}: invalid vertex`);
      }
      for (const match of text.matchAll(/^mtllib[ \t]+([^\n]+)/gm)) {
        assert.ok(!/^(?:https?:)?\/\//i.test(match[1]), `${path.basename(file)}: external material`);
        await fs.access(path.resolve(path.dirname(file), match[1].trim()));
      }
      continue;
    }
    if (/\.glb$/i.test(file)) {
      assert.equal(data.readUInt32LE(0), 0x46546c67, `${path.basename(file)}: invalid GLB magic`);
      assert.equal(data.readUInt32LE(4), 2, `${path.basename(file)}: unsupported GLB version`);
      assert.equal(data.readUInt32LE(8), data.length, `${path.basename(file)}: truncated GLB`);
      assert.equal(data.readUInt32LE(16), 0x4e4f534a, `${path.basename(file)}: missing JSON chunk`);
      model = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString('utf8').trim());
    } else model = JSON.parse(data.toString('utf8'));
    assert.ok(model.meshes?.length > 0, `${path.basename(file)}: model contains no mesh`);
    for (const resource of [...(model.buffers || []), ...(model.images || [])]) {
      if (!resource.uri || resource.uri.startsWith('data:')) continue;
      assert.ok(!/^(?:https?:)?\/\//i.test(resource.uri), `${path.basename(file)}: external resource ${resource.uri}`);
      await fs.access(path.resolve(path.dirname(file), resource.uri));
    }
  }
});
await check('Reusable material textures and AI studies are present', async () => {
  assert.ok(textureFiles.length > 0, 'no reusable local material textures found');
  const bible = await filesIn(path.join(root, 'docs', 'visual-bible'));
  assert.ok(bible.filter(file => /\.(?:png|jpe?g|webp)$/i.test(file)).length >= 4, 'the visual development studies are missing');
  assert.ok(bible.some(file => /\.prompt\.txt$/i.test(file)), 'AI prompt provenance is missing');
});
await check('Runtime source includes the authored shaders', async () => {
  const sourceFiles = await filesIn(path.join(root, 'src'));
  assert.ok(sourceFiles.some(file => /\.(?:glsl|vert|frag)$/i.test(file)), 'no authored shader source found');
});
await check('The local CJK subset covers every current UI character and retains its license', async () => {
  const directory = path.join(root, 'public', 'assets', 'fonts');
  const provenance = JSON.parse(await fs.readFile(path.join(directory, 'urushi-cjk.provenance.json'), 'utf8'));
  const font = await fs.readFile(path.join(directory, 'urushi-cjk.woff2'));
  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2', 'invalid WOFF2 signature');
  assert.equal(createHash('sha256').update(font).digest('hex'), provenance.sha256, 'font differs from its provenance record');
  const covered = new Set(provenance.codepoints.map(value => parseInt(value.slice(2), 16)));
  for (const filename of provenance.subset_from) {
    const source = await fs.readFile(path.join(root, filename), 'utf8');
    for (const char of source) if (char.codePointAt(0) >= 32) {
      assert.ok(covered.has(char.codePointAt(0)), `${filename}: the font subset is missing ${char} (U+${char.codePointAt(0).toString(16).toUpperCase()}); regenerate the subset after copy changes`);
    }
  }
  await fs.access(path.join(root, 'licenses', 'noto-serif-sc-OFL.txt'));
});
await check('The production entry exists and does not fetch third-party startup assets', async () => {
  const indexFile = path.join(root, 'dist', 'index.html');
  const html = await fs.readFile(indexFile, 'utf8');
  assert.match(html, /<title>[^<]*URUSHI/i);
  for (const match of html.matchAll(/<(?:script|link|img|source)\b[^>]*?\b(?:src|href|srcset)=["']([^"']+)/gi)) {
    assert.ok(!/^(?:https?:)?\/\//i.test(match[1]), `external startup resource: ${match[1]}`);
  }
  assert.ok(!/https?:\/\/.*(?:\.js|\.css)["']/i.test(html), 'remote script or stylesheet in production HTML');
});

console.log(`\n${passed} checks passed; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
