import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const provenance=JSON.parse(await readFile(path.join(root,'art/asset-provenance.json'),'utf8'));
const report={status:'PASS',observedAt:new Date().toISOString(),scope:'Retained distributable image files and production derivatives',generationCount:provenance.generationCount,assets:[]};
for(const asset of provenance.assets){
  const original=path.join(root,asset.retainedOriginal),production=path.join(root,asset.productionAsset);
  const [info,bytes]=await Promise.all([stat(original),readFile(production)]);
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(info.size,asset.originalBytes,asset.id+' original byte count');
  assert.equal(bytes.byteLength,asset.productionBytes,asset.id+' production byte count');
  assert.equal(hash,asset.productionSha256,asset.id+' production checksum');
  const shipped=await readFile(path.join(root,'dist/assets',path.basename(production)));
  assert.equal(createHash('sha256').update(shipped).digest('hex'),hash,asset.id+' built asset checksum');
  if(asset.fallbackAsset)await stat(path.join(root,asset.fallbackAsset));
  report.assets.push({id:asset.id,original:asset.retainedOriginal,production:asset.productionAsset,bytes:bytes.byteLength,sha256:hash});
}
assert.equal(report.assets.length,15);
await mkdir(path.join(root,'evidence'),{recursive:true});
await writeFile(path.join(root,'evidence/asset-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: 15 retained original files, 15 production checksums, 15 built copies, and declared fallbacks.');
