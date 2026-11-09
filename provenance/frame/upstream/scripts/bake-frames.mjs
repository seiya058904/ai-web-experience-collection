/**
 * FRAME's optional offline asset-production entrypoint.
 * Website runtime never needs the renderer, a compiler, or Python.
 * Requirements: Node24+, C++17 compiler, Python3 + Pillow (WebP enabled).
 * Full production: node scripts/bake-frames.mjs --stills
 * One draft: node scripts/bake-frames.mjs --camera=landscape --only=even-06 --samples=1
 */
import { getPose, PRESETS } from '../src/timeline.ts';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const options = Object.fromEntries(process.argv.slice(2).filter(x => x.startsWith('--')).map(x => {
  const [k, ...v] = x.slice(2).split('='); return [k, v.join('=') || true];
}));
const cameras = options.camera ? [options.camera] : ['landscape', 'portrait'];
if (cameras.some(c => !['landscape', 'portrait', 'hero', 'hero-portrait'].includes(c))) throw Error('Unknown camera');
const mode = String(options.mode || 'stage');
const only = String(options.only || '');
if (only && !/^(even|ease-in|ease-out)-(0[1-9]|1[0-9]|2[0-4])$/.test(only)) throw Error('Invalid frame selector');
const samples = Number(options.samples || 4);
if (![1, 4].includes(samples)) throw Error('Samples must be 1 or 4');
if (mode !== 'stage' && !only) throw Error('A single-shot --mode requires --only');
for (const key of ['width', 'height']) if (options[key] !== undefined) { const value=Number(options[key]); if (!Number.isSafeInteger(value) || value < 64 || value > 4096) throw Error(`${key} must be an integer from 64 to 4096`); }
const work = await mkdtemp(join(tmpdir(), 'frame-bake-'));
const manifest = {
  version: 1, fps: 12, frames: 24,
  generatedBy: 'FRAME original deterministic digital-clay renderer',
  sourcePoseSha256: createHash('sha256').update(await readFile(join(root, 'src/timeline.ts'))).digest('hex'),
  cameras: { landscape: { width: 1280, height: 800 }, portrait: { width: 720, height: 800 } },
  portraitTravelScale: .58,
  takes: {}, assets: {},
};
function run(command, args) {
  const r = spawnSync(command, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw Error(`${command} failed with exit code ${r.status}`);
}
const py = process.env.FRAME_PYTHON || 'python3';
try {
  const values = [];
  for (const preset of PRESETS) {
    manifest.takes[preset] = {};
    for (let f = 1; f <= 24; f++) {
      const name = `${preset === 'even' || (f >= 8 && f <= 11) ? preset : 'even'}-${String(f).padStart(2, '0')}`;
      manifest.takes[preset][f] = name;
      if (preset !== 'even' && (f < 8 || f > 11)) continue;
      if (cameras.length === 1 && cameras[0].startsWith('hero') && preset !== 'even') continue;
      const p = getPose(f, preset);
      values.push([name, p.frame, p.blockX, p.blockY, p.boopX, p.bodyY, p.scaleX, p.scaleY,
        p.lean, p.fold, p.eyes.x, p.eyes.y, p.eyes.openness, p.mouth,
        p.leftFoot.x, p.leftFoot.y, p.leftFoot.z, p.rightFoot.x, p.rightFoot.y, p.rightFoot.z,
        p.leftHand.x, p.leftHand.y, p.leftHand.z, p.rightHand.x, p.rightHand.y, p.rightHand.z,
        p.leftFoot.rotation, p.rightFoot.rotation, p.contact ? 1 : 0].join('\t'));
    }
  }
  const poses = join(work, 'poses.tsv'); await writeFile(poses, values.join('\n') + '\n');
  const bin = join(work, process.platform === 'win32' ? 'render-boop.exe' : 'render-boop');
  run(process.env.FRAME_CXX || 'g++', ['-O3', '-std=c++17', '-fopenmp', join(root, 'scripts/render-boop.cpp'), '-o', bin]);
  async function shot(camera, shotMode, selector, width, height) {
    const out = join(work, camera, shotMode); await mkdir(out, { recursive: true });
    const args = ['--poses', poses, '--out', out, '--camera', camera, '--width', String(width),
      '--height', String(height), '--samples', String(samples), '--mode', shotMode];
    if (selector) args.push('--only', selector);
    run(bin, args);
    const dest = shotMode === 'stage' ? join(root, 'public/frames', camera) : join(root, 'public/stills');
    await mkdir(dest, { recursive: true });
    const encoder = `from PIL import Image\nfrom pathlib import Path\nsource=Path(${JSON.stringify(out)})\ndest=Path(${JSON.stringify(dest)})\nfor p in sorted(source.glob('*.ppm')):\n name=p.stem+'.webp' if ${JSON.stringify(shotMode)}=='stage' else ${JSON.stringify(shotMode + '-' + camera + '.webp')}\n Image.open(p).save(dest/name,'WEBP',quality=86,method=6)\n print(str(dest/name))\n`;
    run(py, ['-c', encoder]);
  }
  for (const camera of cameras) {
    const size = camera === 'hero-portrait' ? {width:720,height:800} : camera === 'hero' ? {width:1000,height:900} : manifest.cameras[camera];
    await shot(camera, mode, only, Number(options.width || size.width), Number(options.height || size.height));
  }
  for (const camera of cameras.filter(camera => camera.startsWith('hero'))) if (!only && mode === 'stage') {
    const mobile = camera === 'hero-portrait';
    const width=Number(options.width || (mobile ? 720 : 1000)),height=Number(options.height || (mobile ? 800 : 900));
    const heroManifest = { version:1, camera, purpose:`Compact ${mobile ? 'portrait' : 'desktop'} Hero preview, complete even take`, frames:24, width, height, approachTravelScale:mobile ? .18 : .35, overshootTravelScale:1, sourcePoseSha256:manifest.sourcePoseSha256, assets:{} };
    for (let frame=1;frame<=24;frame++) { const name=`even-${String(frame).padStart(2,'0')}.webp`; const data=await readFile(join(root,'public/frames',camera,name)); heroManifest.assets[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),width,height}; }
    await writeFile(join(root,'public/frames',camera,'manifest.json'),JSON.stringify(heroManifest,null,2)+'\n');
  }
  if (options.stills) {
    if(cameras.some(camera => camera.startsWith('hero'))) throw Error('Generate matched stills with landscape and portrait cameras.');
    const stills = [['glance', 'even-02'], ['preparation', 'even-06'], ['contact', 'even-06'],
      ['pushing', 'even-09'], ['overhead', 'even-18'], ['ending', 'even-24'], ['resting', 'even-24']];
    for (const camera of cameras) for (const [shotMode, frame] of stills) {
      const { width, height } = manifest.cameras[camera];
      await shot(camera, shotMode, frame, width, height);
    }
  }
  if (mode === 'stage' && !only && !options.width && !options.height && cameras.length === 2) {
    for (const camera of cameras) for (const name of new Set(Object.values(manifest.takes).flatMap(t => Object.values(t)))) {
      const key = `${camera}/${name}.webp`; const data = await readFile(join(root, 'public/frames', key));
      manifest.assets[key] = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), ...manifest.cameras[camera] };
    }
    await writeFile(join(root, 'public/frames/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Complete: ${Object.keys(manifest.assets).length} production frames${options.stills ? ' and 14 matched stills' : ''}.`);
  } else console.log('Partial render complete; full-production manifest left unchanged.');
} finally {
  await rm(work, { recursive: true, force: true }); // Only the temporary directory created by this invocation.
}
