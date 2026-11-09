#!/usr/bin/env node
/**
 * BERTH image preparation. Conversion and proportional downscaling only.
 * Requires Node 24, ffmpeg (with libwebp) and ffprobe.
 * Usage: node scripts/prepare-assets.mjs [--source-dir /original/png/directory]
 * The delivered WebP files are already prepared; originals are not required to run the site.
 */
import { readFile, writeFile, mkdir, stat, rename, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public/assets');
const conceptDir = path.join(root, 'docs/concepts');
const recordsPath = path.join(root, 'docs/asset-records.json');
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source-dir');
const sourceDirectory = sourceIndex >= 0 ? args[sourceIndex + 1] : null;
if (sourceIndex >= 0 && !sourceDirectory) throw new Error('--source-dir needs a directory.');
const quality = 84;
const previewMaximumLongEdge = 480;
const previewQuality = 80;
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

const purposes = {
  'hero-a': ['Hero route A / doorway concept', 'Chosen direction: clear fixed room, restrained neighbour presence and a usable title zone; refined as IMG-04.'],
  'hero-b': ['Hero route B / seated candidate', 'Retained alternative; not selected because the face and foreground handout compete with the initial spatial introduction.'],
  'hero-c': ['Hero route C / upper-berth candidate', 'Retained alternative; not selected for the opening because it introduces the upper-berth viewpoint before the ascent.'],
  hero: ['CH-01 desktop hero', 'Adopted refinement of the doorway composition, with a calmer midnight-blue title region and established bag placement.'],
  'hero-mobile': ['CH-01 mobile hero', 'Independent portrait composition; preserves the window, table, lower berth and near ladder without cutting a landscape frame.'],
  'night-talk': ['CH-05 shared conversation', 'Two characters and two distinct blank cards make the exchange and separate ownership legible.'],
  dawn: ['CH-08 dawn entry', 'The same room in cool daylight, with Ning’s manuscript and card still upstairs before the descent.'],
  'blue-hour': ['TR-07-08 intermediate light', 'Dedicated coherent pre-dawn frame; no photographic double exposure.'],
  'shared-light': ['CH-02 lamp gesture', 'The lamp shade and shared pool of light make a small considerate action visible.'],
  table: ['CH-03 handout and local lamp comparison', 'A distinct physical tabletop view supports the real DOM handout and explicit light controls.'],
  corridor: ['CH-04 passing station and water cup', 'A narrow connected corridor, ordinary station silhouettes and the carried cup extend the small world without inventing a new setting.'],
  sleep: ['CH-06 upper-berth night view', 'A genuine elevated viewpoint separates Ning’s upstairs paper from Lin’s face-down card and glasses on the table below.'],
  pillow: ['CH-07 pillow and writing card', 'An intimate card-and-cloth view provides a different scale for the first-line interaction while retaining an unlit night atmosphere.'],
  empty: ['CH-10 empty compartment', 'The original doorway composition returns in morning light with travellers and movable belongings removed; the fixed lamp remains.'],
  'morning-note': ['CH-08 second beat, after the descent', 'The separate daylight handoff follows Ning bringing her manuscript and own card downstairs; Lin’s card is a distinct second object.'],
  packing: ['CH-09 preparing to leave', 'Both travellers collect their separate bags after the manuscript and two cards are packed, closing the object sequence before departure.'],
  'night-talk-mobile': ['CH-05 independent portrait conversation', 'A separately generated vertical composition keeps both faces, the handoff, two cards and slippers visible on a phone.'],
  'dawn-mobile': ['CH-08 independent portrait dawn entry', 'The portrait layout preserves the early-morning room and the upstairs/table distinction without cropping a landscape image.'],
  'empty-mobile': ['CH-10 independent portrait empty room', 'A dedicated vertical ending retains the fixed compartment and a cleared table after the travellers leave.'],
  climb: ['TR-05-06 ladder ascent', 'A discrete frozen movement makes Ning’s ascent and the transfer of her manuscript and own card visible, using the fixed near-right ladder.'],
  'lin-departure': ['TR-09-10 first departure', 'Ms. Lin visibly crosses the doorway first while Ning remains inside with her bag, making the exit order explicit.'],
  'ning-departure': ['TR-09-10 second departure', 'Ning then crosses the same doorway after Ms. Lin has left; the room behind her is empty and the two cards travel with her.'],
};

async function dimensions(file) {
  const { stdout } = await exec('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',file]);
  const { width, height } = JSON.parse(stdout).streams[0];
  return { width, height };
}

function fitted(width, height, maximum, byWidth = false) {
  const factor = Math.min(1, maximum / (byWidth ? width : Math.max(width, height)));
  return { width: Math.round(width * factor), height: Math.round(height * factor) };
}

async function encode(source, destination, size, q = quality) {
  const temporary = destination.replace(/\.webp$/, '.pending.webp');
  await exec('ffmpeg', ['-v','error','-y','-i',source,'-vf',`scale=${size.width}:${size.height}:flags=lanczos`,'-c:v','libwebp','-quality',String(q),'-compression_level','6','-frames:v','1','-threads','1',temporary], { maxBuffer: 1024 * 1024 });
  await rename(temporary, destination);
}

async function fileInfo(file, relative) {
  const bytes = await readFile(file);
  return { path: relative, ...await dimensions(file), bytes: bytes.byteLength, sha256: hash(bytes) };
}

await mkdir(publicDir, { recursive: true });
await mkdir(conceptDir, { recursive: true });
const records = JSON.parse(await readFile(recordsPath, 'utf8'));
const generationRecords = new Map();
function collectGenerations(record) {
  if (record.generated && record.file) generationRecords.set(record.file, record);
  for (const priorRecord of record.revisions || []) collectGenerations(priorRecord);
}
for (const record of records) collectGenerations(record);
let previous = { assets: [] };
try { previous = JSON.parse(await readFile(path.join(publicDir,'manifest.json'),'utf8')); } catch {}
const prepared = [];
const conceptRecords = [];
const summaries = [];

for (const record of records) {
  if (!record.generated || !record.file) { summaries.push(`${record.id}: no generated source yet`); continue; }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.name)) throw new Error(`Unsafe asset name: ${record.name}`);
  const ordinal = Number(record.id.replace('IMG-', ''));
  const source = sourceDirectory ? path.join(sourceDirectory, path.basename(record.file)) : path.resolve(root, record.file);
  const fullPath = path.join(publicDir, `${record.name}.webp`);
  const smallPath = path.join(publicDir, `${record.name}-small.webp`);
  const tinyPath = path.join(publicDir, `${record.name}-preview.webp`);
  const conceptName = `${record.id.toLowerCase()}-${record.name}.webp`;
  const conceptPath = path.join(conceptDir, conceptName);
  const prior = previous.assets.find((item) => item.id === record.id && item.name === record.name);
  const runtimeAsset = record.runtime !== false && ordinal >= 4;
  const sourceAvailable = await exists(source);
  const sourceBytes = sourceAvailable ? await readFile(source) : null;
  const sourceHash = sourceBytes ? hash(sourceBytes) : prior?.sourceSha256;
  const sourceSize = sourceAvailable ? await dimensions(source) : prior?.sourceDimensions;
  if (!sourceAvailable && !(runtimeAsset && prior && await exists(fullPath) && await exists(smallPath))) {
    if (ordinal <= 8 && await exists(conceptPath)) {
      conceptRecords.push({ id: record.id, name: record.name, ...await fileInfo(conceptPath, `docs/concepts/${conceptName}`) });
      summaries.push(`${record.id}: existing concept retained; original PNG not available`);
      continue;
    }
    throw new Error(`Original source unavailable for ${record.id}. Supply --source-dir, or retain the already prepared assets.`);
  }
  const cacheMatches = prior?.sourceSha256 === sourceHash && prior?.quality === quality;
  if (runtimeAsset) {
    if (sourceAvailable && (!cacheMatches || !await exists(fullPath) || !await exists(smallPath))) {
      await encode(source, fullPath, fitted(sourceSize.width, sourceSize.height, 1672));
      const portrait = sourceSize.height > sourceSize.width;
      await encode(source, smallPath, fitted(sourceSize.width, sourceSize.height, portrait ? 600 : 840, true));
    }
    if (sourceAvailable && (!cacheMatches || prior?.previewMaximumLongEdge !== previewMaximumLongEdge || prior?.previewQuality !== previewQuality || !await exists(tinyPath))) {
      await encode(source, tinyPath, fitted(sourceSize.width, sourceSize.height, previewMaximumLongEdge), previewQuality);
    }
    const previewBytes = await exists(tinyPath) ? await readFile(tinyPath) : null;
    prepared.push({
      id: record.id,
      name: record.name,
      purpose: record.purpose || purposes[record.name]?.[0] || 'Additional narrative scene',
      sourceFilename: path.basename(record.file),
      sourceDimensions: sourceSize,
      sourceSha256: sourceHash,
      quality,
      previewMaximumLongEdge,
      previewQuality,
      full: await fileInfo(fullPath, `assets/${record.name}.webp`),
      small: await fileInfo(smallPath, `assets/${record.name}-small.webp`),
      preview: previewBytes ? await fileInfo(tinyPath, `assets/${record.name}-preview.webp`) : prior?.preview || null,
      previewDataUri: previewBytes ? `data:image/webp;base64,${previewBytes.toString('base64')}` : prior?.previewDataUri || null,
    });
  }
  if (ordinal <= 8) {
    // Original dimensions, with format compression only. These are documentary candidates,
    // distinct from the responsive runtime files, including the three real alternatives.
    if (sourceAvailable && (!cacheMatches || !await exists(conceptPath))) await encode(source, conceptPath, sourceSize);
    conceptRecords.push({ id: record.id, name: record.name, ...await fileInfo(conceptPath, `docs/concepts/${conceptName}`) });
  }
  summaries.push(`${record.id} ${record.name}: ${runtimeAsset ? 'runtime + ' : ''}${ordinal <= 8 ? 'concept prepared' : 'prepared'}`);
}

const manifest = {
  format: 'berth-assets-v1',
  conversion: 'ffmpeg libwebp; full/small quality 84; 480px recovery previews quality 80; proportional Lanczos downscaling; no crops, overlays or content edits',
  generationCounts: {
    currentDistinctRoles: records.filter((record) => record.generated && record.file).length,
    distinctSuccessfulOutputFiles: generationRecords.size,
    recordedSuccessfulImageToolCalls: generationRecords.size,
    supersededOutputFiles: generationRecords.size - records.filter((record) => record.generated && record.file).length,
    note: 'Counts deduplicate original tool output filenames; WebP variants and copied concepts never count as new generated images. Failed or unrecorded tool calls are not counted.',
  },
  assets: prepared,
  concepts: conceptRecords,
};
const heroPreview = prepared.find((asset) => asset.name === 'hero')?.previewDataUri;
const heroMobilePreview = prepared.find((asset) => asset.name === 'hero-mobile')?.previewDataUri;
if (!heroPreview || !heroMobilePreview) throw new Error('Both Hero recovery previews are required for critical-art.ts.');
const criticalArt = `/** Generated by scripts/prepare-assets.mjs. Same-composition Hero previews; no network or source-PNG dependency. */\nexport const heroPreview = ${JSON.stringify(heroPreview)};\nexport const heroMobilePreview = ${JSON.stringify(heroMobilePreview)};\n`;
await writeFile(path.join(root, 'src/critical-art.ts'), criticalArt);
manifest.criticalArt = { path: 'src/critical-art.ts', bytes: Buffer.byteLength(criticalArt), sha256: hash(Buffer.from(criticalArt)), sources: ['hero', 'hero-mobile'] };
await writeFile(path.join(publicDir,'manifest.json'), JSON.stringify(manifest,null,2)+'\n');

const table = records.map((record) => {
  const ordinal = Number(record.id.replace('IMG-', ''));
  const usage = record.purpose || purposes[record.name]?.[0] || 'Additional narrative scene';
  const runtimePath = ordinal >= 4 && record.runtime !== false ? `public/assets/${record.name}.webp` : 'Concept only';
  return `| ${record.id} | ${record.name} | ${usage} | ${runtimePath} |`;
}).join('\n');
const entries = records.map((record) => {
  const purpose = record.purpose || purposes[record.name]?.[0] || 'Additional narrative scene';
  const rationale = record.rationale || purposes[record.name]?.[1] || 'Prepared for the chapter-specific narrative use; visual acceptance remains a separate browser-review task.';
  const reference = record.refs?.length ? record.refs.map((file) => path.basename(file)).join('; ') : record.ref ? path.basename(record.ref) : ['IMG-04','IMG-05','IMG-06','IMG-07'].includes(record.id) ? 'exec-91c97f4e-e43f-4841-88bb-096dee44f5c4.png (IMG-01)' : 'No input reference path recorded for this original request.';
  const revisions = record.revisions ? `\n### Revision history as recorded\n\nThe following preserves the prior-generation records supplied in the asset ledger. It does not imply that superseded files are used by the website.\n\n\`\`\`json\n${JSON.stringify(record.revisions, null, 2)}\n\`\`\`\n` : '';
  return `## ${record.id} — ${record.name}\n\n- Tool: \`${record.tool || 'image_gen.imagegen'}\`.\n- Actual selected source filename: \`${path.basename(record.file || 'not-yet-generated')}\`.\n- Reference: \`${reference}\`.\n- Intended use: ${purpose}.\n- Selection rationale: ${rationale}\n- Seed, model revision and hidden generation settings: **not supplied by the tool; not invented**.\n\n### Exact submitted prompt for the selected file\n\n\`\`\`text\n${record.prompt}\n\`\`\`\n${revisions}`;
}).join('\n');
const doc = `# BERTH — real image-generation and adoption record\n\nThese are original images actually generated during this task with the built-in image tool. The filenames below identify actual returned PNGs. They are not downloaded railway photographs. The first eight image IDs are distinct required outputs, not multiple uses of one image. This record documents asset production; it does not certify the live site's composition, continuity, interaction or browser tests.\n\n## Image inventory\n\n| ID | Asset name | Intended use | Runtime artifact |\n| --- | --- | --- | --- |\n${table}\n\n## Prepared formats\n\n- Required IMG-01–IMG-08 concept evidence is preserved at its original dimensions in \`docs/concepts/\` as WebP. The three opening candidates are retained even though only route A was adopted.\n- Adopted runtime images have a full variant (long edge no greater than 1672 pixels) and a small variant (840 pixels wide for landscape; 600 pixels wide for portrait), without cropping.\n- Full and small variants use WebP quality 84. Recovery previews are 480 pixels on the long edge at quality 80, retaining recognisable scene detail during a failed image request. They are proportional downsizes, not new artworks, and do not count as additional generated images.\n- \`public/assets/manifest.json\` records actual dimensions, bytes and SHA-256 for the prepared variants. Embedded previews contain no external URL.\n- The pipeline only converts format and downsizes proportionally with ffmpeg. It does not redraw, retouch, add words, change a character or invent a new composition.\n- The site loads bundled local assets. Original generation workspace paths are documentary provenance and are never runtime dependencies.\n\n## Reproduce format preparation\n\nThe delivered WebP files are already ready to use. To re-encode original generated PNGs, install ffmpeg/ffprobe and run:\n\n\`\`\`sh\nnode scripts/prepare-assets.mjs --source-dir /path/to/original-generated-pngs\n\`\`\`\n\nThe source directory must contain the source filenames recorded below. Re-running with existing delivered files and no source PNGs retains the prepared images. No image-generation seed was exposed, so regeneration is not presented as byte-reproducible.\n\n## Scope and rights\n\nThe images were newly AI-generated for this original fictional work. No official railway photographs, logos or commercial train branding were used as final assets. The Nightjet page informed the plausibility of compact sleeper facilities, not a reproduction of its photos or a real service promise. The images are supplied as part of this commissioned project subject to applicable provider terms; no additional third-party stock license is asserted.\n\n${entries}`;
const countSummary = `## Recorded generation counts\n\n- Current distinct image roles: **${manifest.generationCounts.currentDistinctRoles}**.\n- Distinct successful original image-tool output files, including superseded correction versions: **${manifest.generationCounts.distinctSuccessfulOutputFiles}**.\n- Superseded original output files retained in provenance: **${manifest.generationCounts.supersededOutputFiles}**.\n- Current runtime assets: **${prepared.length}**; required conceptual outputs retained: **${conceptRecords.length}**.\n- Each recorded output was produced by an individual image-tool request in this workflow; orchestration batches are not image requests. Failed or unrecorded requests are not included. Resized WebP variants and copied concept files are not additional AI-generated images.\n\n## Image inventory`;
await writeFile(path.join(root,'docs/image-generation.md'),doc.replace('## Image inventory', countSummary));
console.log(JSON.stringify({ preparedAssets: prepared.length, preservedConcepts: conceptRecords.length, fullBytes: prepared.reduce((sum,item)=>sum+item.full.bytes,0), smallBytes: prepared.reduce((sum,item)=>sum+item.small.bytes,0), previewBytes: prepared.reduce((sum,item)=>sum+(item.preview?.bytes || 0),0), manifestBytes: (await stat(path.join(publicDir,'manifest.json'))).size, summaries },null,2));
