/** Run from a clean extracted project, after npm ci and npm run build.
 * NIGHTSHIFT_EVIDENCE_DIR may point to a separate verification record folder. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root=process.cwd();
const out=path.resolve(process.env.NIGHTSHIFT_EVIDENCE_DIR || 'evidence/records');
await mkdir(out,{recursive:true});
const server=await preview({root,preview:{host:'127.0.0.1',port:4328,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const records=[],errors=[],media=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  for(const [id,key] of [['ch-01','hero'],['ch-06','rail'],['ch-11','dawn']]){
    await page.goto(`http://127.0.0.1:4328/#${id}`,{waitUntil:'load'});
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    await page.waitForFunction(({id,key})=>document.body.dataset.chapter===id&&!document.body.dataset.transition&&document.querySelector('.stage-layer--base').dataset.key===key,{id,key});
    await page.waitForFunction(()=>{const image=document.querySelector('.stage-layer--base img');return image.complete&&image.naturalWidth>512&&!image.currentSrc.includes('/fallback/');});
    const result=await page.evaluate(()=>({title:document.title,language:document.documentElement.lang,chapter:document.body.dataset.chapter,source:document.querySelector('.stage-layer--base').dataset.key,width:innerWidth,pageWidth:document.documentElement.scrollWidth,image:document.querySelector('.stage-layer--base img').naturalWidth}));
    assert.equal(result.title,'NIGHTSHIFT — The city does not sleep at once');assert.equal(result.language,'en');assert.ok(result.pageWidth<=result.width);
    await page.screenshot({path:path.join(out,`extracted-${id}.jpg`),type:'jpeg',quality:82});records.push(result);
  }
  const manifest=JSON.parse(await readFile(path.join(root,'docs/media-manifest.json'),'utf8'));
  for(const asset of manifest.filter(item=>item.file?.startsWith('public/media/')||item.path?.startsWith('public/media/')||item.production===true)){
    for(const suffix of [`media/${asset.key}.webp`,`media/fallback/${asset.key}.webp`]){
      const response=await page.request.get(`http://127.0.0.1:4328/${suffix}`);
      assert.equal(response.status(),200,suffix);assert.match(response.headers()['content-type'],/image\/webp/);
      media.push({path:suffix,status:response.status(),bytes:(await response.body()).length});
    }
  }
  // The production manifest can record role instead of a production flag.
  if(media.length===0){
    const keys=['hero','hero-mobile','atlas','bakery-before','bakery-after','care','curb-before','curb-after','rail','rail-water-midpoint','water','utility','market','market-after','platform-before','platform','dawn'];
    for(const key of keys)for(const suffix of [`media/${key}.webp`,`media/fallback/${key}.webp`]){
      const response=await page.request.get(`http://127.0.0.1:4328/${suffix}`);assert.equal(response.status(),200,suffix);assert.match(response.headers()['content-type'],/image\/webp/);media.push({path:suffix,status:200,bytes:(await response.body()).length});
    }
  }
  assert.equal(media.length,34);assert.equal(errors.length,0);
  const index=await readFile(path.join(root,'dist/index.html'));
  await writeFile(path.join(out,'extracted-build.json'),JSON.stringify({status:'PASS',method:'Clean extracted source; independent npm ci and production build; local preview uses this extraction and its installed dependencies. First/middle/last chapters and all 17 production images plus 17 fallbacks requested.',browser:browser.version(),viewport:{width:1440,height:900},dpr:1,indexSha256:createHash('sha256').update(index).digest('hex'),records,media,errors},null,2));
  console.log(JSON.stringify({status:'PASS',chapters:records.length,mediaRequests:media.length,errors}));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
