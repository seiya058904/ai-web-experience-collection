import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/evidence');
const label = (process.env.PAPERSUN_QA_LABEL || 'local').replace(/[^a-zA-Z0-9_-]/g, '-');
const reportFile = path.join(output, `${label}-recovery-results.json`);
await mkdir(output, { recursive: true });
const port = Number(process.env.PAPERSUN_QA_PORT || 4190), base = `http://127.0.0.1:${port}`;
const results = [], errors = [], launchFailures = [];
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Preview exited ${code}`))); });
const launch = async (extra = {}) => {
  for (let attempt=1;attempt<=3;attempt++) {
    try { return await chromium.launch({ headless: true, executablePath: process.env.PAPERSUN_BROWSER_PATH || undefined, args: JSON.parse(process.env.PAPERSUN_BROWSER_ARGS || '[]'), env: { ...process.env, ...JSON.parse(process.env.PAPERSUN_BROWSER_ENV || '{}') }, ...extra }); }
    catch (error) { launchFailures.push({attempt,time:new Date().toISOString(),message:error.message.split('\n').slice(0,2).join(' ')}); if(attempt===3)throw error; await new Promise(resolve=>setTimeout(resolve,250)); }
  }
};
let browser;
try { browser = await launch(); }
catch (error) { server.kill(); throw error; }
const environment = { browser: browser.version(), playwright: require('playwright/package.json').version, mode: 'Isolated local headless browser against the actual production dist directory', renderer:JSON.parse(process.env.PAPERSUN_BROWSER_ARGS || '[]').includes('--disable-gpu')?'CPU rasterization':'Default browser rasterization', network: 'Local loopback; special failure and latency cases labelled individually', date: new Date().toISOString(),launchFailures };
const frame = p => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const snap = async (p, name) => { await p.evaluate(() => document.fonts.ready); await frame(p); await p.screenshot({ path: path.join(output, `${label}-${name}.jpg`), type: 'jpeg', quality: 82 }); };
const read = p => p.evaluate(() => ({ chapter: Number(document.documentElement.dataset.activeChapter), transition: document.documentElement.dataset.transition, motion: document.documentElement.dataset.motion, hash: location.hash, y: scrollY, count: document.querySelector('#piece-count')?.textContent, placed: document.querySelector('#journey-sun')?.dataset.placed, sunVisible: getComputedStyle(document.querySelector('#journey-sun')).display !== 'none', seams: document.querySelectorAll('#journey-sun .linen-stitch').length, sound: document.querySelector('#sound-control')?.textContent, images: [...document.querySelectorAll('.scene')].map(e => ({ scene: e.dataset.scene, ready: e.dataset.ready, src: e.querySelector('img')?.currentSrc })), chapters: document.querySelectorAll('.chapter').length, beats: document.querySelectorAll('.beats p').length, hidden: document.hidden, paused: document.documentElement.dataset.paused, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, english: document.documentElement.lang === 'en' && !/[\u3400-\u9fff]/u.test(document.body.innerText) }));
async function pageFor(options = {}) {
  if (!browser.isConnected()) browser = await launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', e => errors.push({ url: page.url(), message: e.message }));
  return { context, page };
}
async function go(page, number) {
  const id = `ch-${String(number).padStart(2, '0')}`;
  await page.getByRole('button', { name: 'Chapters', exact: true }).click();
  await page.locator(`#story-dialog a[href="#${id}"]`).click();
  await page.waitForFunction(id => Math.abs(scrollY - document.getElementById(id).offsetTop) < 2, id);
  await frame(page);
  assert.equal((await read(page)).chapter, number);
}
async function run(name, task) {
  if(process.env.PAPERSUN_QA_FILTER && !process.env.PAPERSUN_QA_FILTER.toLowerCase().split(',').some(part=>name.toLowerCase().includes(part.trim())))return;
  try { const evidence = await task(); const status=evidence?.status==='NOT TESTED'?'NOT TESTED':'PASS';results.push({ name, status, evidence }); console.log(`${status} ${name}`); }
  catch (error) { results.push({ name, status: 'FAIL', error: error.stack }); console.log(`FAIL ${name}: ${error.message}`); }
  finally { await browser.close().catch(() => undefined); }
  await writeFile(reportFile, JSON.stringify({ environment, results, errors }, null, 2));
}

try {
  await run('Native wheel, arrow keys and long jump', async () => {
    const {context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});
    await page.mouse.move(700,400);await page.mouse.wheel(0,650);await page.waitForFunction(()=>scrollY>250);
    const wheel=await read(page);await page.keyboard.press('Home');await page.waitForFunction(()=>scrollY<2);
    await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>scrollY>5);const arrow=await read(page);
    await page.keyboard.press('End');await page.waitForFunction(()=>document.documentElement.dataset.activeChapter==='11');const end=await read(page);
    await page.keyboard.press('Home');await page.waitForFunction(()=>scrollY<2);await frame(page);
    await context.close();return{wheel,arrow,end,input:'Real Playwright wheel and keyboard events; page-navigation keys share the app scroll authority.'};
  });

  await run('Browser find API with a plain HTML capability control',async()=>{
    const{context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});await frame(page);const app=await page.evaluate(()=>({found:window.find('A Lamp for the Night',false,false,true),selection:window.getSelection()?.toString(),inert:document.querySelector('#ch-11 .reading-copy').inert}));
    const control=await context.newPage();await control.setContent('<!doctype html><html lang="en"><body><p>A Lamp for the Night</p></body></html>');await frame(control);const plain=await control.evaluate(()=>({found:window.find('A Lamp for the Night',false,false,true),selection:window.getSelection()?.toString()}));await context.close();
    if(!plain.found)return{status:'NOT TESTED',app,plain,note:'The same browser find API fails on a visible single-paragraph plain HTML control, so this runtime cannot establish find-in-page behavior. No DOM-text lookup is substituted for a successful find.'};
    assert.equal(app.found,true);return{app,plain,note:'Native browser find API selected the requested story text; browser toolbar UI was not used.'};
  });

  await run('Desktop discovery, reset, exact assembly, lift, home memory and restart', async () => {
    const { context, page } = await pageFor();
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.title(), 'PAPERSUN — A fable cut from light');
    assert.equal((await read(page)).sound, 'Sound: Off');
    await go(page, 2);
    await page.getByRole('button', { name: 'Inspect the desk', exact: true }).click();
    assert.equal(await page.locator('.tool-list > div').count(), 3);
    await page.getByRole('link', { name: 'Read the note', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.activeChapter === '3');
    await page.getByRole('button', { name: 'Preview the pieces', exact: true }).click();
    for(const [piece,destination]of[['A','The Lantern Market'],['B','The Wind Hill'],['C','Valley of Shadows']]){await page.locator(`button[data-action="preview-piece"][data-piece="${piece}"]`).click();assert.equal(await page.locator('.preview-destination').innerText(),destination);assert.equal((await read(page)).count,'0 / 3');}
    assert.equal((await read(page)).count, '0 / 3');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Preview the pieces');
    await go(page, 4); await page.getByRole('button', { name: 'Trace the route', exact: true }).click();
    assert.match(await page.locator('[data-feedback="3"]').innerText(), /three roof pins/);
    await page.locator('#ch-04 [data-action="reset-route"]').click();
    await go(page, 5); await page.getByRole('button', { name: 'Repair the lantern', exact: true }).click();
    assert.equal((await read(page)).count, '1 / 3');
    await page.locator('#ch-05 [data-action="reset-market"]').click(); assert.equal((await read(page)).count, '1 / 3');
    await page.getByRole('button', { name: 'Repair the lantern', exact: true }).click();
    await go(page, 6); await page.getByRole('button', { name: 'Steady the wheel', exact: true }).click();
    assert.equal((await read(page)).count, '2 / 3'); await snap(page, 'wind-found-b');
    await page.getByRole('button', { name: 'Release the wheel', exact: true }).click(); assert.equal((await read(page)).count, '2 / 3');
    await go(page, 7); await page.getByRole('button', { name: 'Lift the paper shade', exact: true }).click();
    assert.equal((await read(page)).count, '3 / 3'); await snap(page, 'valley-found-c');
    await page.getByRole('button', { name: 'Lower the paper shade', exact: true }).click(); assert.equal((await read(page)).count, '3 / 3');
    await page.locator('.experience-toolbar [data-action="inventory"]').click();
    assert.equal(await page.locator('.inventory-row.collected').count(), 3);
    await page.keyboard.press('Escape'); await go(page, 9);
    assert.equal(await page.getByRole('button', { name: 'Lift the sun', exact: true }).isEnabled(), false);
    assert.equal((await read(page)).seams, 0);
    for (const id of ['A', 'B', 'C']) { await page.locator(`button[data-action="place"][data-piece="${id}"]`).click(); await frame(page); }
    assert.equal((await read(page)).placed, 'ABC'); assert.ok((await read(page)).seams > 20);
    const paths = await page.locator('#journey-sun path[data-piece]').evaluateAll(nodes => nodes.map(n => n.getAttribute('d')));
    await page.locator('button[data-action="place"][data-piece="B"]').click(); await frame(page);
    assert.equal((await read(page)).placed, 'AC'); assert.equal(await page.locator('[data-action="lift"]').isEnabled(), false);
    await page.locator('button[data-action="place"][data-piece="B"]').click();
    await page.locator('[data-action="seams"]').click(); await frame(page); assert.equal((await read(page)).seams, 0);
    await page.locator('[data-action="seams"]').click(); await snap(page, 'completed-worktable');
    await page.getByRole('button', { name: 'Lift the sun', exact: true }).click();
    await page.waitForFunction(() => Math.abs(scrollY - document.querySelector('#ch-10').offsetTop) < 2); await frame(page);
    assert.deepEqual(await page.locator('#journey-sun path[data-piece]').evaluateAll(nodes => nodes.map(n => n.getAttribute('d'))), paths);
    await snap(page, 'completed-sun');
    await page.getByRole('button', { name: 'Night view', exact: true }).click(); assert.equal(await page.locator('[data-action="daylight"]').innerText(), 'Day view');
    await page.getByRole('button', { name: 'Day view', exact: true }).click();
    await page.getByRole('button', { name: 'Sound: Off', exact: true }).click(); assert.equal((await read(page)).sound, 'Sound: On');
    await page.getByRole('button', { name: 'Sound: On', exact: true }).click();
    await go(page, 1); assert.equal((await read(page)).sunVisible, true); assert.equal((await read(page)).placed, 'ABC'); await snap(page, 'repaired-opening');
    await go(page, 11); await page.getByRole('button', { name: 'Begin again', exact: true }).click();
    await page.waitForFunction(() => scrollY < 2); await frame(page);
    const final = await read(page); assert.equal(final.count, '0 / 3'); assert.equal(final.sunVisible, false);
    await context.close(); return { final, exactPathsPreserved: true, audio: 'Control and WebAudio enable/disable checked; audible output was not listened to.' };
  });

  await run('Touch-mobile collection and repair controls remain complete', async () => {
    const { context, page } = await pageFor({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    await page.goto(base, { waitUntil: 'networkidle' });
    for (const [number, label] of [[5,'Repair the lantern'],[6,'Steady the wheel'],[7,'Lift the paper shade']]) {
      await go(page, number); await page.getByRole('button', { name: label, exact: true }).tap(); await frame(page); await snap(page, `mobile-action-${number}`);
    }
    assert.equal((await read(page)).count, '3 / 3'); await go(page, 9);
    for (const id of ['A','B','C']) await page.locator(`button[data-action="place"][data-piece="${id}"]`).tap();
    await frame(page); assert.equal((await read(page)).placed, 'ABC'); await snap(page, 'mobile-complete-repair');
    await page.getByRole('button', { name: 'Lift the sun', exact: true }).tap();
    await page.waitForFunction(() => Math.abs(scrollY - document.querySelector('#ch-10').offsetTop) < 2); await snap(page, 'mobile-lift');
    const final = await read(page); assert.equal(final.chapter, 10); assert.equal(final.horizontalOverflow, false);
    await page.getByRole('button', { name: 'Chapters', exact: true }).tap();
    await page.locator('#story-dialog [data-action="about"]').tap(); assert.match(await page.locator('#dialog-body').innerText(), /Small things/);
    await page.keyboard.press('Escape');
    await context.close(); return { final, input: 'Playwright touchscreen tap emulation, not physical hardware' };
  });

  await run('Reduced motion retains all chapters, actions and direct midpoint identity', async () => {
    const { context, page } = await pageFor({ reducedMotion: 'reduce' }); await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal((await read(page)).motion, 'reduced'); const samples = [];
    for (let n=1;n<=11;n++) { await go(page,n); const state=await read(page); assert.equal(state.chapters,11); assert.equal(state.beats,22); samples.push(state); }
    for (let n=1;n<=10;n++) { await page.goto(`${base}/#tr-${String(n).padStart(2,'0')}-${String(n+1).padStart(2,'0')}@50`,{waitUntil:'networkidle'}); await frame(page); const s=await read(page); assert.equal(s.chapter,n+1); assert.equal(await page.locator('#transition-props > svg').count(),0); }
    for(const [number,name]of[[5,'Repair the lantern'],[6,'Steady the wheel'],[7,'Lift the paper shade']]){await go(page,number);await page.getByRole('button',{name,exact:true}).click();}
    assert.equal((await read(page)).count,'3 / 3');await go(page,9);for(const id of ['A','B','C'])await page.locator(`button[data-action="place"][data-piece="${id}"]`).click();await frame(page);assert.equal((await read(page)).placed,'ABC');await page.getByRole('button',{name:'Lift the sun',exact:true}).click();await frame(page);assert.equal((await read(page)).chapter,10);await snap(page,'reduced-motion-completed-sun');
    await context.close(); return samples;
  });

  await run('Hash reload, history, resize and keyboard navigation preserve identity', async () => {
    const { context, page } = await pageFor(); await page.goto(base,{waitUntil:'networkidle'});
    await go(page,5); await page.getByRole('button',{name:'Repair the lantern',exact:true}).click(); await go(page,7);
    await page.goBack(); await page.waitForFunction(()=>document.documentElement.dataset.activeChapter==='5');
    await page.goForward(); await page.waitForFunction(()=>document.documentElement.dataset.activeChapter==='7');
    await go(page,6); await page.setViewportSize({width:390,height:844}); await frame(page); assert.equal((await read(page)).chapter,6);
    await page.setViewportSize({width:1440,height:900}); await frame(page); assert.equal((await read(page)).chapter,6);
    const before=await page.evaluate(()=>scrollY); await page.keyboard.press('PageDown'); await page.waitForFunction(y=>scrollY>y+50,before); await page.keyboard.press('PageUp');
    await page.goto(`${base}/#tr-08-09@50`,{waitUntil:'networkidle'}); await frame(page); const mid=await read(page); assert.equal(mid.transition,'8:0.5000');
    await page.reload({waitUntil:'networkidle'}); await frame(page); const restored=await read(page); assert.equal(restored.transition,mid.transition); assert.equal(restored.count,'1 / 3'); assert.equal(restored.sound,'Sound: Off'); await snap(page,'midpoint-reload');
    await page.getByRole('button',{name:'Chapters',exact:true}).click();
    for(let i=0;i<16;i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement?.closest('dialog')?.id),'story-dialog'); }
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Chapters');
    await context.close(); return { mid, restored, keyboard:'PageDown/PageUp and dialog Tab/Escape exercised' };
  });

  await run('Real missing image responses preserve the full story and completed repair', async () => {
    const { context, page } = await pageFor({viewport:{width:390,height:844},hasTouch:true});
    await page.goto(`${base}/?test-assets=fail`,{waitUntil:'networkidle'}); const samples=[];
    for(let n=1;n<=11;n++){await go(page,n); await frame(page); const s=await read(page); assert.equal(s.chapters,11);assert.equal(s.beats,22);assert.equal(s.english,true);samples.push(s);}
    for(const [n,label] of [[5,'Repair the lantern'],[6,'Steady the wheel'],[7,'Lift the paper shade']]){await go(page,n);await page.getByRole('button',{name:label,exact:true}).click();}
    await go(page,9);for(const id of ['A','B','C'])await page.locator(`button[data-action="place"][data-piece="${id}"]`).click();await frame(page);
    assert.equal((await read(page)).placed,'ABC');await snap(page,'failed-art-completed-repair');await page.getByRole('button',{name:'Lift the sun',exact:true}).click();await page.waitForFunction(()=>Math.abs(scrollY-document.querySelector('#ch-10').offsetTop)<2);await frame(page);assert.equal((await read(page)).placed,'ABC');await snap(page,'failed-art-completed-sun');await go(page,9);
    await page.route('**/art/unavailable-*.webp',route=>route.continue({url:route.request().url().replace('/unavailable-','/')}));
    await page.getByRole('button',{name:'Retry',exact:true}).click();await page.waitForFunction(()=>[...document.querySelectorAll('.scene')].every(e=>e.dataset.ready==='true'));
    const restored=await read(page);assert.equal(restored.count,'3 / 3');assert.equal(restored.placed,'ABC');await snap(page,'retry-restored-art');
    await context.close();return{samples,restored,recoveryMethod:'Initial URLs returned actual HTTP404; retry routed those same requests to the packaged valid image path.'};
  });

  for (const profile of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true}]) {
    await run(`Target art failure at every transition midpoint — ${profile.name}`, async () => {
      const {name,...contextOptions}=profile;
      const {context,page}=await pageFor(contextOptions),samples=[],responses=[];
      page.on('response',response=>{if(response.url().includes('/art/unavailable-'))responses.push({path:new URL(response.url()).pathname,status:response.status()});});
      for(let n=1;n<=10;n++){
        const hash=`tr-${String(n).padStart(2,'0')}-${String(n+1).padStart(2,'0')}@50`;
        await page.goto(`${base}/?test-assets=fail#${hash}`,{waitUntil:'networkidle'});await frame(page);
        const state=await read(page);
        assert.equal(state.transition,`${n}:0.5000`);assert.equal(state.chapter,n+1);assert.equal(state.chapters,11);assert.equal(state.beats,22);assert.equal(state.english,true);assert.equal(state.horizontalOverflow,false);
        const target=await page.locator('#scene-to').evaluate(element=>{const fallback=element.querySelector('.scene-fallback'),svg=fallback?.querySelector('svg'),r=svg?.getBoundingClientRect();return{scene:element.dataset.scene,ready:element.dataset.ready,fallbackChapter:Number(svg?.getAttribute('class')?.match(/fallback-ch-(\d+)/)?.[1]),fallbackVisibility:fallback?getComputedStyle(fallback).visibility:null,svgPaths:svg?.querySelectorAll('path').length??0,width:r?.width??0,height:r?.height??0};});
        // The authored bridge midpoint is asset slot11; its fallback is CH09.
        assert.equal(target.scene,String(n===8?11:n));assert.equal(target.fallbackChapter,n+1);assert.equal(target.ready,'false');assert.equal(target.fallbackVisibility,'visible');assert.ok(target.svgPaths>0&&target.width>0&&target.height>0);
        const screenshot=`failed-midpoint-${name}-${String(n).padStart(2,'0')}`;await snap(page,screenshot);samples.push({transition:n,state,target,screenshot:`${label}-${screenshot}.jpg`});
      }
      const lateViews=[];
      for(const light of ['day','night']){
        await go(page,10);
        const desired=light==='day';
        if(await page.locator('#theatre').getAttribute('data-daylight')!==String(desired))await page.locator('#ch-10 [data-action="daylight"]').click();
        await frame(page);
        for(const chapter of [10,11]){
          if(chapter===11)await go(page,11);
          const state=await read(page),shade=await page.locator('.reading-shade').evaluate(element=>getComputedStyle(element).backgroundImage);
          assert.equal(state.chapter,chapter);assert.equal(await page.locator('#theatre').getAttribute('data-daylight'),String(desired));
          const screenshot=`failed-late-${name}-ch${chapter}-${light}`;await snap(page,screenshot);lateViews.push({chapter,light,state,shade,screenshot:`${label}-${screenshot}.jpg`});
        }
      }
      for(const [chapter,action]of[[5,'Repair the lantern'],[6,'Steady the wheel'],[7,'Lift the paper shade']]){
        await go(page,chapter);await page.getByRole('button',{name:action,exact:true}).click();
      }
      await frame(page);assert.equal((await read(page)).count,'3 / 3');
      const collectedFailureQuarters=[];
      for(const n of [5,6,7,8])for(const percent of [25,50,75]){
        const hash=`tr-${String(n).padStart(2,'0')}-${String(n+1).padStart(2,'0')}@${percent}`;
        await page.goto(`${base}/?test-assets=fail#${hash}`,{waitUntil:'networkidle'});await frame(page);
        const state=await read(page);assert.equal(state.transition,`${n}:${(percent/100).toFixed(4)}`);assert.equal(state.count,'3 / 3');assert.equal(state.chapters,11);assert.equal(state.beats,22);assert.equal(state.horizontalOverflow,false);
        const ownership=await page.evaluate(()=>{
          const pieces=[...document.querySelectorAll('#theatre [data-piece]')].map(element=>{
            const r=element.getBoundingClientRect(),style=getComputedStyle(element),chain=[];
            for(let parent=element;parent instanceof Element&&parent.id!=='theatre';parent=parent.parentElement)chain.push({tag:parent.tagName,opacity:Number(getComputedStyle(parent).opacity),visibility:getComputedStyle(parent).visibility,display:getComputedStyle(parent).display});
            return{id:element.getAttribute('data-piece'),scope:element.closest('.scene')?.id??(element.closest('#journey-sun')?'journey-sun':'transition'),inViewport:r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,visible:chain.every(s=>s.visibility==='visible'&&s.display!=='none'),fill:element.getAttribute('fill')??element.querySelector('path')?.getAttribute('fill'),chain};
          });
          return{pieces,method:'DOM ownership and ancestor-opacity observations; clipping/occlusion is inspected in the actual screenshot, so unmasked DOM counts are not treated as visible-object counts.'};
        });
        for(const piece of ownership.pieces.filter(piece=>piece.inViewport&&piece.visible&&piece.fill!=='transparent'))assert.ok(piece.chain.every(item=>item.opacity===0||item.opacity>=.999),`A canonical piece has a transparent ownership layer at ${hash}: ${piece.id}`);
        const screenshot=`collected-failed-${name}-tr${String(n).padStart(2,'0')}-${String(percent).padStart(3,'0')}`;await snap(page,screenshot);collectedFailureQuarters.push({transition:n,percent,state,ownership,screenshot:`${label}-${screenshot}.jpg`});
      }
      assert.ok(responses.length>0&&responses.every(response=>response.status===404));
      await context.close();return{profile:name,viewport:profile.viewport,samples,lateViews,collectedFailureQuarters,responses,method:'Direct 50% entry for all ten boundaries with actual HTTP404 art responses; day/night late holds; then actual UI collection of ABC and 25/50/75% failed-art visits across the four affected carried-piece boundaries. Target identity, full story, inventory and opaque canonical layers are asserted; actual occlusion is a separate visual review.'};
    });
  }

  await run('Delayed and out-of-order image responses cannot replace the newer target', async () => {
    const {context,page}=await pageFor();await page.goto(`${base}/?test-assets=slow#ch-02`,{waitUntil:'domcontentloaded'});await frame(page);
    await page.evaluate(()=>{location.hash='ch-06';});await frame(page);await page.evaluate(()=>{location.hash='ch-08';});await frame(page);
    await snap(page,'delayed-target-before-settle');await page.waitForLoadState('networkidle');await frame(page);
    const state=await read(page);assert.equal(state.chapter,8);assert.equal(state.images[1].scene,'7');assert.equal(state.images[1].ready,'true');
    const timings=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('qa-delay')).map(e=>({name:new URL(e.name).pathname+new URL(e.name).search,start:e.startTime,duration:e.duration,end:e.responseEnd})).sort((a,b)=>a.end-b.end));
    assert.ok(timings.some(e=>e.duration>3500));await snap(page,'delayed-target-after-settle');await context.close();return{state,timings,method:'Actual server-injected asynchronous response latency; not bandwidth or hardware emulation.'};
  });

  await run('Late fonts settle without losing the direct chapter', async () => {
    const {context,page}=await pageFor();await page.route('**/*.woff2',async route=>{await new Promise(r=>setTimeout(r,1400));await route.continue();});
    await page.goto(`${base}/#ch-06`,{waitUntil:'domcontentloaded'});await frame(page);const before=await read(page);const fontBefore=await page.evaluate(()=>document.fonts.status);await snap(page,'late-font-before');
    await page.evaluate(()=>document.fonts.ready);await frame(page);const after=await read(page);assert.equal(after.chapter,6);assert.equal(after.horizontalOverflow,false);assert.ok(await page.evaluate(()=>Math.abs(scrollY-document.querySelector('#ch-06').offsetTop)<2));await snap(page,'late-font-after');await context.close();return{before,after,fontBefore,fontAfter:'loaded',injectedDelayMs:1400};
  });

  await run('Early wheel input is not reset by the first font reflow', async()=>{
    const{context,page}=await pageFor();await page.route('**/*.woff2',async route=>{await new Promise(resolve=>setTimeout(resolve,1700));await route.continue();});await page.goto(`${base}/#ch-04`,{waitUntil:'domcontentloaded'});await frame(page);const before=await read(page);await page.mouse.move(700,450);await page.mouse.wheel(0,420);await page.waitForFunction(y=>scrollY>y+120,before.y);await page.evaluate(()=>document.fonts.ready);await frame(page);const after=await read(page);const relative=await page.evaluate(()=>scrollY-document.querySelector('#ch-04').offsetTop);assert.ok(relative>100,`Early reading position was reset: ${relative}px`);await snap(page,'early-scroll-font-settle');await context.close();return{before,after,relativeToChapter:relative,injectedFontDelayMs:1700};
  });

  await run('Browser bandwidth and latency throttling preserves a late target',async()=>{
    const{context,page}=await pageFor();const client=await context.newCDPSession(page);await client.send('Network.enable');await client.send('Network.setCacheDisabled',{cacheDisabled:true});const conditions={offline:false,latency:150,downloadThroughput:96*1024,uploadThroughput:48*1024,connectionType:'cellular3g'};await client.send('Network.emulateNetworkConditions',conditions);await page.goto(`${base}/#ch-06`,{waitUntil:'domcontentloaded',timeout:45000});await frame(page);const during=await read(page);await page.evaluate(()=>{location.hash='ch-08';});await page.waitForFunction(()=>document.documentElement.dataset.activeChapter==='8');await page.waitForFunction(()=>document.querySelector('#scene-to').dataset.scene==='7'&&document.querySelector('#scene-to').dataset.ready==='true',null,{timeout:45000});await frame(page);const after=await read(page);assert.equal(after.chapters,11);assert.equal(after.beats,22);assert.equal(after.chapter,8);assert.equal(after.horizontalOverflow,false);await snap(page,'bandwidth-limited-target');const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.initiatorType==='img').map(e=>({name:new URL(e.name).pathname,duration:e.duration,transferSize:e.transferSize})));await context.close();return{conditions,during,after,resources,method:'Actual Chromium network emulation against localhost with cache disabled; not a physical mobile network or performance benchmark.'};
  });

  await run('Blocked storage and corrupted saved data cannot remove the story', async () => {
    const {context,page}=await pageFor();await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked for test','SecurityError')}}));await page.goto(base,{waitUntil:'networkidle'});await go(page,5);await page.getByRole('button',{name:'Repair the lantern',exact:true}).click();const blocked=await read(page);assert.equal(blocked.count,'1 / 3');await context.close();
    await browser.close().catch(()=>undefined);browser=await launch();const second=await pageFor();await second.context.addInitScript(()=>localStorage.setItem('papersun:story:v1','{broken json'));await second.page.goto(base,{waitUntil:'networkidle'});const corrupt=await read(second.page);assert.equal(corrupt.count,'0 / 3');assert.equal(corrupt.chapters,11);await second.context.close();return{blocked,corrupt};
  });

  await run('Warmed pictures support the remaining story after connection loss', async()=>{
    const {context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});await context.setOffline(true);const samples=[];
    for(const n of [5,6,7,8,9,10,11]){await go(page,n);await frame(page);const s=await read(page);assert.equal(s.images[1].ready,'true');samples.push(s);}
    await snap(page,'offline-ending');await context.setOffline(false);await context.close();return{samples,note:'Same loaded document. Reloading a fully offline URL is not promised; no service worker is installed.'};
  });

  await run('No-JavaScript alternative includes all eleven two-beat chapters',async()=>{
    const{context,page}=await pageFor({javaScriptEnabled:false});await page.goto(base);await page.getByRole('link',{name:'Read all eleven chapters',exact:true}).click();const sections=await page.locator('section').count();assert.equal(sections,11);assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.screenshot({path:path.join(output,`${label}-no-javascript-story.jpg`),type:'jpeg',quality:82});const text=await page.locator('body').innerText();assert.ok(text.includes('Keep one light'));await context.close();return{sections,title:'Complete plain-text edition',english:true};
  });

  await run('Touch scroll gesture reaches ordinary story content',async()=>{
    const{context,page}=await pageFor({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await page.goto(base,{waitUntil:'networkidle'});const client=await context.newCDPSession(page);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:680}]});
    for(const y of[620,540,460,370,280]){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y}]});await new Promise(resolve=>setTimeout(resolve,32));}
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>scrollY>100);const state=await read(page);await snap(page,'touch-scroll');await context.close();return{state,input:'Chromium protocol touch start/move/end events; mobile browser emulation, not a physical touchscreen.'};
  });

  await run('Visible native scrollbar responds to pointer dragging',async()=>{
    await browser.close().catch(()=>undefined);browser=await launch({ignoreDefaultArgs:['--hide-scrollbars']});const{context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});const metrics=await page.evaluate(()=>({width:innerWidth,client:document.documentElement.clientWidth,height:innerHeight}));
    if(metrics.width===metrics.client){await context.close();return{status:'NOT TESTED',metrics,note:'This headless shell exposed no draggable scrollbar gutter.'};}
    const x=(metrics.width+metrics.client)/2;await page.mouse.move(x,20);await page.mouse.down();await page.mouse.move(x,metrics.height*.65,{steps:18});await page.mouse.up();await page.waitForFunction(()=>scrollY>150);const state=await read(page);await snap(page,'native-scrollbar-drag');await context.close();return{metrics,state,input:'Real pointer down/move/up on the visible browser scrollbar.'};
  });

  await run('Browser zoom key commands and exposed viewport geometry',async()=>{
    const{context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});const metric=()=>page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualScale:visualViewport?.scale}));const before=await metric(),samples=[];
    for(let n=1;n<=5;n++){await page.keyboard.press('Control+Equal');await frame(page);if([2,3,5].includes(n))samples.push({keyPresses:n,...await metric()});}
    await page.keyboard.press('Control+Digit0');await context.close();const changed=samples.some(s=>s.width!==before.width||s.dpr!==before.dpr);
    return{status:changed?'PASS':'NOT TESTED',before,samples,note:changed?'Browser-level key commands changed layout viewport/DPR.':'Headless shell has no browser zoom UI and ignored browser zoom commands. CSS zoom diagnostics are separately labelled and do not satisfy actual browser zoom.'};
  });

  await run('Browser lifecycle freeze and resume retains chapter identity',async()=>{
    const{context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});await go(page,6);const before=await read(page);const client=await context.newCDPSession(page);await client.send('Page.setWebLifecycleState',{state:'frozen'});await new Promise(resolve=>setTimeout(resolve,350));await client.send('Page.setWebLifecycleState',{state:'active'});await frame(page);const after=await read(page);assert.equal(after.chapter,before.chapter);assert.equal(after.hash,before.hash);assert.equal(after.horizontalOverflow,false);await snap(page,'lifecycle-resumed');await context.close();return{before,after,method:'Actual Chromium Page lifecycle frozen/active commands; not an OS background-tab switch.'};
  });

  await run('Background tab visibility and restoration',async()=>{
    const {context,page}=await pageFor();await page.goto(base,{waitUntil:'networkidle'});await go(page,6);const before=await read(page);const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();const hidden=await page.evaluate(()=>document.hidden);await page.bringToFront();await frame(page);const after=await read(page);await context.close();return{status:hidden&&after.chapter===before.chapter?'PASS':'NOT TESTED',hiddenWasObserved:hidden,before,after,note:hidden?'Actual visibility change observed.':'This headless shell did not expose a hidden-document state; no simulated visibility event is counted as real background coverage.'};
  });
} finally {
  await writeFile(reportFile,JSON.stringify({environment,results,errors},null,2));
  await browser.close();server.kill();
}
console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,untested:results.filter(r=>r.status==='NOT TESTED').length,uncaughtPageErrors:errors.length}));
if(results.some(r=>r.status==='FAIL')||errors.length)process.exitCode=1;
