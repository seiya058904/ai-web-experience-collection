/** Local production-browser verification. Screenshots and metrics are observed,
 * not generated substitutes. Optional browser overrides support isolated CI. */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = Object.fromEntries(process.argv.slice(2).filter(arg => arg.startsWith('--')).map(arg => { const [key, ...value] = arg.slice(2).split('='); return [key, value.join('=') || 'true']; }));
const pad = value => String(value).padStart(2, '0');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const jsonEnv = (name, fallback) => process.env[name] ? JSON.parse(process.env[name]) : fallback;

export async function launchBrowser() {
  const { chromium } = require(process.env.PAPERSUN_PLAYWRIGHT_MODULE || 'playwright');
  const args = jsonEnv('PAPERSUN_BROWSER_ARGS', []);
  const extraEnv = jsonEnv('PAPERSUN_BROWSER_ENV', {});
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('PAPERSUN_BROWSER_ARGS must be a JSON array of strings.');
  if (!extraEnv || typeof extraEnv !== 'object' || Array.isArray(extraEnv)) throw new Error('PAPERSUN_BROWSER_ENV must be a JSON object.');
  return chromium.launch({ headless: true, executablePath: process.env.PAPERSUN_BROWSER_PATH || undefined, args, env: { ...process.env, ...extraEnv }, timeout: 30000 });
}

export async function startServer(port = 4189) {
  const logs = [];
  const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: ROOT, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', bytes => logs.push(bytes.toString()));
  server.stderr.on('data', bytes => logs.push(bytes.toString()));
  const base = `http://127.0.0.1:${port}/index.html`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview server exited: ${logs.join('').slice(-1800)}`);
    if (logs.some(line => line.includes('PAPERSUN production preview:'))) {
      try { const response = await fetch(base); if (response.ok) return { server, base, logs }; } catch { /* Wait for this owned local server. */ }
    }
    await delay(100);
  }
  server.kill('SIGTERM');
  throw new Error(`Preview server did not become ready: ${logs.join('').slice(-1800)}`);
}

export async function afterFrames(page, count = 3) {
  await page.evaluate(count => new Promise(resolve => { function tick() { if (--count <= 0) resolve(); else requestAnimationFrame(tick); } requestAnimationFrame(tick); }), count);
}

export async function readAudit(page) {
  return page.evaluate(() => {
    const box = element => { if (!element) return null; const r = element.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; };
    const text = element => element?.textContent.trim().replace(/\s+/g, ' ').slice(0, 120) ?? '';
    const visible = element => {
      if (!element || element.closest('[hidden],dialog:not([open]),.sr-only')) return false;
      const r = element.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false;
      for (let parent = element; parent instanceof Element; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .02) return false;
      }
      return true;
    };
    const intersect = (a,b) => { if (!a || !b) return null; const width=Math.min(a.right,b.right)-Math.max(a.x,b.x),height=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y); return width>.75&&height>.75?{width,height,area:width*height}:null; };
    const textBoxes = element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT), boxes = []; let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) boxes.push({x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom});
      }
      return boxes;
    };
    const sections = [...document.querySelectorAll('.chapter')], active = Number(document.documentElement.dataset.activeChapter), section = sections[active - 1];
    const headings = [...document.querySelectorAll('.chapter h1,.chapter h2')].filter(visible);
    const body = [...document.querySelectorAll('.chapter .lead,.chapter .hero-lead,.chapter .beats p,.chapter .scene-feedback,.chapter .end-note')].filter(visible);
    const footer = box(document.querySelector('.experience-toolbar'));
    const pairs = headings.flatMap(heading => body.map(paragraph => ({ heading:text(heading), body:text(paragraph), overlap:intersect(box(heading),box(paragraph)) })).filter(pair => pair.overlap));
    const allText = [...headings, ...body];
    const scenes = [...document.querySelectorAll('.scene')].map(element => { const image=element.querySelector('img'); return { index:element.dataset.scene, ready:element.dataset.ready, visibility:getComputedStyle(element).visibility, clip:getComputedStyle(element).clipPath, transform:getComputedStyle(element).transform, planeTransform:element.querySelector('.art-plane')?.style.transform ?? '', image:image?.currentSrc?.split('/').at(-1) ?? '', imageComplete:image?.complete ?? false, naturalWidth:image?.naturalWidth ?? 0 }; });
    const lastBeat = section?.querySelector('.beats p:last-child'), sun = document.querySelector('#journey-sun');
    let storyMemory;try{storyMemory=JSON.parse(localStorage.getItem('papersun:story:v1')||'null');}catch{storyMemory={storageUnavailable:true};}
    const mark = { activeChapter:active, transition:document.documentElement.dataset.transition ?? null, targetChapter:document.querySelector('#theatre')?.dataset.chapter, scenes, storyMemory,
      sun:{visible:visible(sun),rect:box(sun),placed:sun?.dataset.placed,lift:sun?.dataset.lift,opacity:sun?getComputedStyle(sun).opacity:null,clip:sun?getComputedStyle(sun).clipPath:null},
      actors:[...document.querySelectorAll('.mira-stage-position')].filter(visible).map(actor=>({scene:actor.closest('.scene')?.dataset.scene??'transition',rect:box(actor),support:actor.closest('.journey-handoff')?.getAttribute('data-support')??null})),
      pieceVisibility:{method:'DOM/CSS/viewport eligibility only; SVG clips and physical foreground occlusion require the retained image. This is not a pixel-level visible-piece count.',pieces:[...document.querySelectorAll('.source-discovery-piece,.canonical-carrier-piece')].map(piece=>({id:piece.getAttribute('data-discovery-piece')||piece.getAttribute('data-carrier-piece'),scene:piece.closest('.scene')?.dataset.scene??'transition',eligible:visible(piece),rect:box(piece),support:piece.closest('.journey-handoff')?.getAttribute('data-support')??null}))},
    };
    return {
      time:new Date().toISOString(), url:location.href, hash:location.hash, scrollY, viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,hasTouch:navigator.maxTouchPoints>0}, userAgent:navigator.userAgent,
      markers:mark, documentWidth:document.documentElement.scrollWidth, horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      headingBodyOverlaps:pairs, footerIndicators:allText.map(element=>({text:text(element),overlap:intersect(box(element),footer)})).filter(item=>item.overlap),
      lastBeat:{text:text(lastBeat),rect:box(lastBeat),footerOverlap:intersect(box(lastBeat),footer)},
      chapterCount:sections.length,beats:sections.map(element=>element.querySelectorAll('.beats p').length), language:document.documentElement.lang,
      fonts:{status:document.fonts.status,faces:[...document.fonts].map(font=>({family:font.family,weight:font.weight,status:font.status}))},
      motion:document.documentElement.dataset.motion,paused:document.documentElement.dataset.paused ?? null,
      visibleText:allText.map(element=>({tag:element.tagName,text:text(element),rect:box(element),ranges:textBoxes(element),font:getComputedStyle(element).fontSize,family:getComputedStyle(element).fontFamily})),
      media:[...document.querySelectorAll('.scene-image,.paper-props,.paper-fallback,#journey-sun')].map(element=>({className:element.getAttribute('class')??element.id,visible:visible(element),rect:box(element)})),
      performance:{method:'Read-only local browser Navigation/Resource/Paint Timing; not Lighthouse or a throttled-network score.',navigation:performance.getEntriesByType('navigation').map(entry=>({type:entry.type,duration:entry.duration,responseEnd:entry.responseEnd,domContentLoadedEventEnd:entry.domContentLoadedEventEnd,loadEventEnd:entry.loadEventEnd})),paint:performance.getEntriesByType('paint').map(entry=>({name:entry.name,startTime:entry.startTime})),resources:performance.getEntriesByType('resource').map(entry=>({name:entry.name.split('/').at(-1),type:entry.initiatorType,duration:entry.duration,transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize}))},
    };
  });
}

function assertions(audit, expected = {}) {
  const failures = [];
  if (audit.fonts.faces.some(face=>face.status==='error')) failures.push('A normal-baseline font face failed to load; these screenshots are not accepted as normal-font evidence.');
  if (audit.horizontalOverflow) failures.push(`Horizontal overflow: ${audit.documentWidth}px in ${audit.viewport.width}px viewport.`);
  if (audit.headingBodyOverlaps.length) failures.push(`${audit.headingBodyOverlaps.length} visible heading/body overlap(s).`);
  if (expected.hash && audit.hash !== expected.hash) failures.push(`Stale hash: wanted ${expected.hash}, observed ${audit.hash}.`);
  if (expected.chapter && audit.markers.activeChapter !== expected.chapter) failures.push(`Stale chapter: wanted ${expected.chapter}, observed ${audit.markers.activeChapter}.`);
  if (expected.transition !== undefined) {
    const [index, progress] = String(audit.markers.transition).split(':').map(Number);
    if (index !== expected.transition || Math.abs(progress - expected.progress) > .002) failures.push(`Transition marker differs: wanted ${expected.transition}:${expected.progress}, observed ${audit.markers.transition}.`);
  }
  return failures;
}
function signature(audit) {
  const round = n => Math.round(n*10)/10;
  return { chapter:audit.markers.activeChapter,transition:audit.markers.transition,target:audit.markers.targetChapter,
    scenes:audit.markers.scenes.map(scene=>({index:scene.index,ready:scene.ready,visibility:scene.visibility,clip:scene.clip,planeTransform:scene.planeTransform,image:scene.image})),
    // A hidden shared sun may retain cached markup from a previously visited
    // chapter. Compare its appearance only when it participates in the scene.
    sun:audit.markers.sun.visible?{...audit.markers.sun,rect:audit.markers.sun.rect?Object.fromEntries(Object.entries(audit.markers.sun.rect).map(([key,value])=>[key,round(value)])):null}:{visible:false},
    actors:audit.markers.actors.map(actor=>actor.scene),
  };
}

export async function runLayout() {
  const suite = options.suite || 'layout';
  if (suite !== 'layout') throw new Error('This runner implements --suite=layout. Run interaction/recovery checks separately.');
  if (options.profile && !['desktop','mobile','both'].includes(options.profile)) throw new Error('--profile must be desktop, mobile or both.');
  const selectedTransitions=options['only-transitions']?options['only-transitions'].split(',').map(Number):null;
  if(selectedTransitions&&(selectedTransitions.some(value=>!Number.isInteger(value)||value<1||value>10)||new Set(selectedTransitions).size!==selectedTransitions.length))throw new Error('--only-transitions must contain unique transition numbers from 1 to 10.');
  const port = Number(options.port || process.env.PAPERSUN_QA_PORT || 4189), label=(options.label||'local').replace(/[^a-zA-Z0-9_-]/g,'-');
  const out = path.resolve(ROOT, options.out || 'docs/evidence'); await mkdir(out,{recursive:true});
  const runId = new Date().toISOString().replace(/[:.]/g,'-');
  const report = { suite,runId,started:new Date().toISOString(),scope:'Actual Chromium desktop and touch-mobile layout, authored quarter states, threshold neighbors and direct/reverse state checks. Automated PASS does not award aesthetic or accessibility conformance.',conditions:{server:'loopback production build',network:'No bandwidth or CPU throttle',browserPathOverride:!!process.env.PAPERSUN_BROWSER_PATH,browserArguments:jsonEnv('PAPERSUN_BROWSER_ARGS',[]),selectedTransitions},profiles:[],cases:[],failures:[] };
  let browser, owned;
  try {
    owned = await startServer(port);
    const profiles=[{name:'desktop',viewport:{width:1440,height:900},hasTouch:false,isMobile:false},{name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true}].filter(profile=>!options.profile||options.profile==='both'||options.profile===profile.name);
    for (const profile of profiles) {
      console.log(`[layout] ${profile.name} ${profile.viewport.width}×${profile.viewport.height}`);
      browser = await launchBrowser(); report.browserVersion=browser.version();
      const context=await browser.newContext({viewport:profile.viewport,hasTouch:profile.hasTouch,isMobile:profile.isMobile,deviceScaleFactor:1,reducedMotion:'no-preference'});
      await context.clearCookies();
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message}));
      page.on('console',message=>{if(message.type()==='error')errors.push({kind:'console',message:message.text()});});
      page.setDefaultTimeout(5000);
      const profileRecord={name:profile.name,...profile,errors}; report.profiles.push(profileRecord);
      let errorCursor=0;
      async function settle() {
        await afterFrames(page,3);
        try { await page.waitForFunction(()=>[...document.querySelectorAll('.scene')].filter(scene=>getComputedStyle(scene).visibility!=='hidden').every(scene=>scene.dataset.ready==='true'),{},{timeout:1800}); } catch { /* Preserve the readiness observation in evidence. */ }
        await afterFrames(page,2);
      }
      async function go(hash) { await page.goto(owned.base+hash,{waitUntil:'domcontentloaded'}); await settle(); }
      async function capture(id, expected={}, screenshot=true, operation) {
        const record={id:`${profile.name}-${id}`,status:'IN PROGRESS',requested:expected};
        try {
          if(operation) await operation();
          await settle();
          const audit=await readAudit(page); record.audit=audit; record.failures=assertions(audit,expected);
          const freshErrors=errors.slice(errorCursor);errorCursor=errors.length;
          if(freshErrors.length){record.errors=freshErrors;record.failures.push(...freshErrors.map(error=>`${error.kind}: ${error.message}`));}
          if(screenshot){const filename=`${label}-${profile.name}-${id}.jpg`;await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:78,fullPage:false,animations:'allow',timeout:20000});record.screenshot=filename;}
          record.status=record.failures.length?'FAIL':'PASS';
          await writeFile(path.join(out,`${label}-${profile.name}-${id}.json`),JSON.stringify(record,null,2)+'\n');
        } catch(error){record.status='FAIL';record.failures=[error.message];record.exception=String(error.stack).split('\n').slice(0,5).join('\n');try{const filename=`${label}-${profile.name}-${id}-failure.jpg`;await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:72});record.screenshot=filename;}catch{/* Browser failure itself is already recorded. */}}
        report.cases.push(record);if(record.status==='FAIL'){report.failures.push({id:record.id,failures:record.failures});console.log(`[FAIL] ${record.id}: ${record.failures.join(' | ')}`);}return record;
      }
      try {
        await page.goto(owned.base,{waitUntil:'domcontentloaded'});
        await page.evaluate(()=>{try{localStorage.clear();sessionStorage.clear();}catch{/* Optional browser storage. */}});
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForSelector('.chapter');await page.evaluate(()=>document.fonts.ready);await settle();
        const openingAudit=await readAudit(page);
        if(!openingAudit.visibleText.some(item=>item.ranges.some(range=>range.width>1&&range.height>1))) throw new Error('The browser produced no visible text ranges after fonts.ready. Check its font runtime before accepting screenshots.');
        for(let chapter=1;!selectedTransitions&&chapter<=11;chapter++){
          const hash=`#ch-${pad(chapter)}`;
          await capture(`ch${pad(chapter)}`,{hash,chapter},true,()=>go(hash));
          await capture(`ch${pad(chapter)}-lastbeat`,{hash,chapter},true,async()=>{await page.locator(`#ch-${pad(chapter)} .beats p`).last().evaluate(element=>element.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'}));});
          console.log(`[layout] ${profile.name} chapter ${pad(chapter)}/11 captured with final narrative beat.`);
        }
        for(const transition of selectedTransitions??Array.from({length:10},(_,index)=>index+1)){
          const hashes=percent=>`#tr-${pad(transition)}-${pad(transition+1)}@${percent}`;
          const baseline=new Map();
          for(const percent of [0,25,50,75,100]){
            const record=await capture(`tr${pad(transition)}-${String(percent).padStart(3,'0')}`,{hash:hashes(percent),chapter:percent<50?transition:transition+1,transition,progress:percent/100},true,()=>go(hashes(percent)));
            if(record.audit)baseline.set(percent,signature(record.audit));
          }
          for(const percent of [75,50,25,0]){
            const record=await capture(`tr${pad(transition)}-reverse-${String(percent).padStart(3,'0')}`,{hash:hashes(percent),chapter:percent<50?transition:transition+1,transition,progress:percent/100},false,()=>go(hashes(percent)));
            if(record.audit&&baseline.has(percent)&&JSON.stringify(signature(record.audit))!==JSON.stringify(baseline.get(percent))){record.status='FAIL';record.failures.push('Reverse revisit changed deterministic scene markers.');record.deterministicComparison={expected:baseline.get(percent),actual:signature(record.audit)};report.failures.push({id:record.id,failures:record.failures});await writeFile(path.join(out,`${label}-${record.id}.json`),JSON.stringify(record,null,2)+'\n');console.log(`[FAIL] ${record.id}: reverse marker comparison.`);}
          }
          const direct=await capture(`tr${pad(transition)}-direct-050`,{hash:hashes(50),chapter:transition+1,transition,progress:.5},false,async()=>{await page.goto(owned.base+hashes(50),{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);});
          if(direct.audit&&baseline.has(50)&&JSON.stringify(signature(direct.audit))!==JSON.stringify(baseline.get(50))){direct.status='FAIL';direct.failures.push('Direct midpoint reload changed deterministic scene markers.');direct.deterministicComparison={expected:baseline.get(50),actual:signature(direct.audit)};report.failures.push({id:direct.id,failures:direct.failures});await writeFile(path.join(out,`${label}-${direct.id}.json`),JSON.stringify(direct,null,2)+'\n');console.log(`[FAIL] ${direct.id}: direct midpoint comparison.`);}
          for(const [boundary,percent] of [['start',0],['end',100]]){
            await go(hashes(percent));
            const at=await page.evaluate(()=>scrollY);
            for(const delta of [-2,2]) await capture(`tr${pad(transition)}-${boundary}-${delta<0?'before':'after'}`,{hash:hashes(percent),chapter:percent===0?transition:transition+1,scrollOffset:delta},true,async()=>{await page.evaluate(y=>scrollTo(0,y),at+delta);});
          }
          console.log(`[layout] ${profile.name} transition ${pad(transition)}/10: five frames, four neighbors, reverse/direct checks.`);
          await writeFile(path.join(out,`${label}-layout-${runId}.json`),JSON.stringify(report,null,2)+'\n');
        }
      } catch(error){report.failures.push({id:`${profile.name}-suite`,failures:[error.message]});profileRecord.exception=String(error.stack);console.log(`[FAIL] ${profile.name} suite: ${error.message}`);}
      finally{await context.close().catch(()=>{});await browser?.close().catch(()=>{});browser=undefined;}
    }
  } catch(error){report.failures.push({id:'environment',failures:[error.message]});report.environmentError=String(error.stack);}
  finally{
    await browser?.close().catch(()=>{});
    if(owned?.server){owned.server.kill('SIGTERM');await delay(150);if(owned.server.exitCode===null)owned.server.kill('SIGKILL');}
    report.finished=new Date().toISOString();report.status=report.failures.length?'FAIL':'PASS';
    report.summary={cases:report.cases.length,passed:report.cases.filter(item=>item.status==='PASS').length,failed:report.cases.filter(item=>item.status==='FAIL').length,failures:report.failures.length};
    const filename=path.join(out,`${label}-layout-${runId}.json`);await writeFile(filename,JSON.stringify(report,null,2)+'\n');
    console.log(`[layout] ${report.status}: ${report.summary.passed}/${report.summary.cases} cases passed; ${report.failures.length} failure records. Evidence: ${path.relative(ROOT,filename)}`);
  }
  return report;
}

/** Real compositor frames and browser-clock samples. These observations are
 * deliberately labelled CAPTURED, never an automatic aesthetic PASS. */
export async function runContinuity() {
  if(options.profile&&!['desktop','mobile','both'].includes(options.profile))throw new Error('--profile must be desktop, mobile or both.');
  const boundaries=options.boundaries==='all'?Array.from({length:10},(_,index)=>index+1):options.boundaries?options.boundaries.split(',').map(Number):[1,8,9];
  if(!boundaries.length||boundaries.some(value=>!Number.isInteger(value)||value<1||value>10)||new Set(boundaries).size!==boundaries.length)throw new Error('--boundaries must be all or unique comma-separated transition numbers from 1 to 10.');
  const heroCycles=options['hero-cycles']===undefined?3:Number(options['hero-cycles']);
  if(!Number.isInteger(heroCycles)||heroCycles<0||heroCycles>3)throw new Error('--hero-cycles must be 0, 1, 2 or 3. The default full continuity suite records 3.');
  if(options.collected!==undefined&&!['true','false'].includes(options.collected))throw new Error('--collected must be true or false.');
  const collected=options.collected==='true';
  const repairReturn=options['repair-return']==='true';
  if(repairReturn&&(!collected||!boundaries.includes(8)))throw new Error('--repair-return requires --collected and boundary8.');
  const out=path.resolve(ROOT,options.out||'docs/evidence'),label=(options.label||'local').replace(/[^a-zA-Z0-9_-]/g,'-');
  await mkdir(out,{recursive:true});
  const runId=new Date().toISOString().replace(/[:.]/g,'-');
  const report={suite:'continuity',runId,started:new Date().toISOString(),method:'Actual Chromium compositor JPEGs via CDP Page.startScreencast, every second compositor frame; browser rAF timestamps and native scrollTo. Animated WebP uses only those retained JPEGs and their observed capture intervals. Hero pauses additionally have independent page screenshots after three settled animation frames. No synthetic frames, CPU/network throttle, Lighthouse score, or 60fps claim.',conditions:{server:'loopback production build',cache:'Fresh browser and context per profile; browser cache starts empty, operating-system disk cache is uncontrolled.',browserArguments:jsonEnv('PAPERSUN_BROWSER_ARGS',[]),boundaries,heroCycles,collected,repairReturn},profiles:[],sequences:[],failures:[]};
  let browser,owned;
  const save=()=>writeFile(path.join(out,`${label}-continuity-${runId}.json`),JSON.stringify(report,null,2)+'\n');
  const memory=page=>page.evaluate(()=>performance.memory?{method:'Chromium-only performance.memory estimate, possibly rounded; not whole-process memory or proof of no leak. No forced GC.',usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize,jsHeapSizeLimit:performance.memory.jsHeapSizeLimit}:null);
  try{
    owned=await startServer(Number(options.port||process.env.PAPERSUN_QA_PORT||4189));
    const profiles=[{name:'desktop',viewport:{width:1440,height:900},hasTouch:false,isMobile:false},{name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true}].filter(profile=>!options.profile||options.profile==='both'||options.profile===profile.name);
    for(const profile of profiles){
      browser=await launchBrowser();
      const context=await browser.newContext({viewport:profile.viewport,hasTouch:profile.hasTouch,isMobile:profile.isMobile,deviceScaleFactor:1,reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      await page.addInitScript(()=>{
        window.__papersunMeasurement={timeOrigin:performance.timeOrigin,longTasks:[],lcp:[],marks:{}};
        for(const type of ['longtask','largest-contentful-paint'])try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__papersunMeasurement[type==='longtask'?'longTasks':'lcp'].push({name:entry.name,startTime:entry.startTime,duration:entry.duration,size:entry.size??null});}).observe({type,buffered:true});}catch{/* Browser support is reported by an empty list. */}
        addEventListener('DOMContentLoaded',()=>{
          const check=()=>{const root=document.documentElement,first=document.querySelector('.scene-image'),m=window.__papersunMeasurement;
            if(first?.complete&&first.naturalWidth&&!m.marks.firstArtReady)m.marks.firstArtReady=performance.now();
            if(m.marks.firstArtReady&&document.fonts.status==='loaded'&&document.querySelector('#ch-01 h1')?.getBoundingClientRect().height>0&&!m.marks.heroReady)m.marks.heroReady=performance.now();
            if(root.dataset.heroState==='living-hold'&&!m.marks.heroLivingHold)m.marks.heroLivingHold=performance.now();
            if(!m.marks.heroLivingHold)requestAnimationFrame(check);
          };requestAnimationFrame(check);
        });
      });
      const profileRecord={...profile,browserVersion:browser.version(),errors};report.profiles.push(profileRecord);
      try{
        let coldClient,coldListener;
        const coldWrites=[],coldFrames=[],coldDirectory=`${label}-${profile.name}-cold-hero-frames`;
        if(options['cold-hero']==='true'){
          await mkdir(path.join(out,coldDirectory),{recursive:true});coldClient=await context.newCDPSession(page);
          coldListener=event=>{const index=coldFrames.length,file=`${coldDirectory}/${String(index).padStart(4,'0')}.jpg`,item={index,file,metadata:event.metadata};coldFrames.push(item);coldWrites.push(writeFile(path.join(out,file),Buffer.from(event.data,'base64')));coldWrites.push(page.evaluate(()=>({observedAt:performance.now(),timeOrigin:performance.timeOrigin,heroState:document.documentElement.dataset.heroState??null,fontStatus:document.fonts.status,scenes:[...document.querySelectorAll('.scene')].map(scene=>({ready:scene.dataset.ready,index:scene.dataset.scene})),heading:document.querySelector('#ch-01 h1')?.getBoundingClientRect().height??0})).then(state=>{item.observedState=state;}).catch(()=>{item.observedState={navigationInProgress:true};}));coldClient.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});};
          coldClient.on('Page.screencastFrame',coldListener);await coldClient.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:profile.viewport.width,maxHeight:profile.viewport.height,everyNthFrame:2});
        }
        await context.clearCookies();await page.goto(owned.base,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await afterFrames(page,3);
        const initial=await readAudit(page);if(initial.fonts.faces.some(face=>face.status==='error')||!initial.visibleText.length)throw new Error('Font/text preflight failed; compositor captures would not be valid normal-font evidence.');
        if(coldClient){
          await page.waitForFunction(()=>document.documentElement.dataset.heroState==='living-hold',{},{timeout:5000});await delay(300);await coldClient.send('Page.stopScreencast');coldClient.off('Page.screencastFrame',coldListener);await Promise.all(coldWrites);await coldClient.detach();
          const cold={method:'Actual compositor frames from before initial navigation through the first living hold. No artificial asset delay. State observations have their own browser timestamps and may follow compositor metadata by a small interval; they are not fabricated render states.',frames:coldFrames,audit:await readAudit(page)};
          profileRecord.coldHero={file:`${label}-${profile.name}-cold-hero.json`,frames:coldFrames.length};await writeFile(path.join(out,profileRecord.coldHero.file),JSON.stringify(cold,null,2)+'\n');console.log(`[continuity] ${profile.name} cold hero: ${coldFrames.length} actual early/reveal/living frames.`);
        }
        // A real control click establishes first-interaction response independently of scroll setup.
        const clickStart=await page.evaluate(()=>performance.now());await page.locator('[data-action="chapters"]').first().click();await page.waitForSelector('dialog[open]');
        profileRecord.firstInteraction={action:'Open Chapters with a real click',startedAt:clickStart,respondedAt:await page.evaluate(()=>performance.now()),method:'Browser performance.now before Playwright click through observed open dialog; includes automation dispatch.'};
        await page.keyboard.press('Escape');await afterFrames(page,2);
        try{await page.waitForFunction(()=>document.documentElement.dataset.heroState==='living-hold',{},{timeout:3000});}catch{/* Preserve readiness timing rather than inventing it. */}
        profileRecord.cold=await page.evaluate(()=>({measurement:window.__papersunMeasurement,navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),paint:performance.getEntriesByType('paint').map(e=>e.toJSON())}));
        profileRecord.memoryBefore=await memory(page);
        if(collected){
          const setup={method:'Real visible UI clicks discover A at the market, B at the wheel and C under the shade. The first arrival keeps all pieces unplaced. Storage is only read to assert the resulting state; it is never seeded. Actual placement happens only before TR09 or the explicitly labelled repaired-return case; Lift the sun is not clicked.',steps:[]};
          for(const [chapter,action]of[[5,'repair'],[6,'wheel'],[7,'shade']]){
            await page.goto(owned.base+`#ch-${pad(chapter)}`,{waitUntil:'domcontentloaded'});await afterFrames(page,3);
            await page.locator(`#ch-${pad(chapter)} [data-action="${action}"]`).click();await afterFrames(page,3);
            setup.steps.push({chapter,action,audit:await readAudit(page)});
          }
          await page.goto(owned.base+'#ch-09',{waitUntil:'domcontentloaded'});await afterFrames(page,3);
          setup.result=await page.evaluate(()=>({memory:JSON.parse(localStorage.getItem('papersun:story:v1')||'null'),count:document.querySelector('#piece-count')?.textContent.trim(),pressed:[...document.querySelectorAll('#ch-09 [data-action="place"][aria-pressed="true"]')].map(button=>button.dataset.piece).join(''),sunPlaced:document.querySelector('#journey-sun')?.dataset.placed}));
          if(setup.result.memory?.found?.join('')!=='ABC'||setup.result.memory?.placed?.length!==0||!setup.result.memory.marketRepaired||!setup.result.memory.wheelSteady||!setup.result.memory.shadeLifted||setup.result.memory.sunLifted||setup.result.pressed!=='')throw new Error(`Collected UI setup did not reach found ABC with no pieces placed: ${JSON.stringify(setup.result)}`);
          setup.file=`${label}-${profile.name}-collected-unplaced-table.jpg`;await page.screenshot({path:path.join(out,setup.file),type:'jpeg',quality:84,fullPage:false});
          setup.audit=await readAudit(page);profileRecord.collection=setup;await save();console.log(`[continuity] ${profile.name}: real UI setup verified found ABC / placed empty; first arrival remains unassembled.`);
        }
        async function placeRepair(){
          if(profileRecord.repair)return;
          await page.goto(owned.base+'#ch-09',{waitUntil:'domcontentloaded'});await afterFrames(page,3);
          for(const piece of['A','B','C']){const button=page.locator(`#ch-09 [data-action="place"][data-piece="${piece}"]`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await afterFrames(page,3);}
          const audit=await readAudit(page),state=audit.markers.storyMemory;
          if(state?.found?.join('')!=='ABC'||state?.placed?.join('')!=='ABC'||state?.sunLifted||audit.markers.sun.placed!=='ABC')throw new Error('Actual repair UI did not establish foundABC/placedABC without lifting.');
          const file=`${label}-${profile.name}-repaired-table.jpg`;await page.screenshot({path:path.join(out,file),type:'jpeg',quality:84,fullPage:false});
          profileRecord.repair={method:'Real Place A/B/C button clicks after first-arrival recordings; no memory injection and no Lift click.',audit,file};await save();
        }
        const client=await context.newCDPSession(page);
        async function animate(start,end,duration){
          return page.evaluate(({start,end,duration})=>new Promise(resolve=>{const samples=[],begin=performance.now();function tick(now){const p=Math.min(1,(now-begin)/duration);scrollTo(0,start+(end-start)*p);samples.push({time:now,scrollY,transition:document.documentElement.dataset.transition,chapter:document.documentElement.dataset.activeChapter});if(p<1)requestAnimationFrame(tick);else requestAnimationFrame(()=>resolve({begin,end:performance.now(),samples}));}requestAnimationFrame(tick);}),{start,end,duration});
        }
        async function sequence(id,segments){
          const directory=`${label}-${profile.name}-${id}-frames`;await mkdir(path.join(out,directory),{recursive:true});
          const record={id:`${profile.name}-${id}`,status:'CAPTURING',frames:[],segments:[],holdFrames:[],errors:[]},writes=[];
          const listener=event=>{const index=record.frames.length,filename=`${String(index).padStart(4,'0')}.jpg`;record.frames.push({index,file:`${directory}/${filename}`,metadata:event.metadata,receivedAt:new Date().toISOString()});writes.push(writeFile(path.join(out,directory,filename),Buffer.from(event.data,'base64')).catch(error=>record.errors.push(error.message)));client.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(error=>record.errors.push(error.message));};
          try{
            await page.evaluate(y=>scrollTo(0,y),segments[0].from);await afterFrames(page,3);record.before=await readAudit(page);
            client.on('Page.screencastFrame',listener);await client.send('Page.startScreencast',{format:'jpeg',quality:76,maxWidth:profile.viewport.width,maxHeight:profile.viewport.height,everyNthFrame:2});
            await delay(100);
            for(const segment of segments){
              const observed=await animate(segment.from,segment.to,segment.duration);record.segments.push({...segment,observed});
              if(segment.hold){
                await afterFrames(page,3);const audit=await readAudit(page);record.segments.at(-1).holdAudit=audit;
                const direction=segment.to>=segment.from?'forward':'reverse',percent=Math.round(Number(String(audit.markers.transition).split(':')[1])*100),file=`${label}-${profile.name}-${id}-pause-${direction}-${String(percent).padStart(3,'0')}.jpg`;
                await page.screenshot({path:path.join(out,file),type:'jpeg',quality:84,fullPage:false});
                record.holdFrames.push({method:'Independent actual page screenshot after at least three settled animation frames, before the recorded pause delay.',direction,percent,file,audit});
                await delay(segment.hold);
              }
            }
            await afterFrames(page,3);await delay(120);await client.send('Page.stopScreencast');client.off('Page.screencastFrame',listener);await Promise.all(writes);record.after=await readAudit(page);
            if(record.frames.length<3)record.errors.push(`Only ${record.frames.length} compositor frames were delivered.`);
            const intervals=record.segments.flatMap(segment=>segment.observed.samples.slice(1).map((sample,index)=>sample.time-segment.observed.samples[index].time)).sort((a,b)=>a-b);
            record.framePacing={method:'rAF callback intervals during the observed native scroll; compositor capture itself adds overhead.',count:intervals.length,medianMs:intervals[Math.floor(intervals.length*.5)]??null,p95Ms:intervals[Math.floor(intervals.length*.95)]??null,maxMs:intervals.at(-1)??null,over50ms:intervals.filter(value=>value>50).length};
            if(record.holdFrames.length){
              record.settledComparisons=[25,50,75].map(percent=>{const forward=record.holdFrames.find(frame=>frame.direction==='forward'&&frame.percent===percent),reverse=record.holdFrames.find(frame=>frame.direction==='reverse'&&frame.percent===percent),same=Boolean(forward&&reverse&&JSON.stringify(signature(forward.audit))===JSON.stringify(signature(reverse.audit)));return{percent,same,forward:forward?.file,reverse:reverse?.file};});
              for(const comparison of record.settledComparisons)if(!comparison.same)record.errors.push(`Settled hero geometry differs between forward and reverse at ${comparison.percent}%. Review the separately captured page screenshots and audits.`);
            }
            if(record.frames.length>=3){
              const webp=`${label}-${profile.name}-${id}.webp`,args=[];
              for(let index=0;index<record.frames.length;index++){const current=record.frames[index],next=record.frames[index+1],seconds=next?.metadata.timestamp-current.metadata.timestamp;args.push('-delay',String(Number.isFinite(seconds)?Math.max(2,Math.min(100,Math.round(seconds*100))):10),path.join(out,current.file));}
              args.push('-resize','960x960>','-quality','76','-loop','0',path.join(out,webp));
              await new Promise((resolve,reject)=>{const command=spawn('convert',args,{stdio:['ignore','ignore','pipe']}),messages=[];command.stderr.on('data',data=>messages.push(data.toString()));command.on('error',reject);command.on('close',code=>code===0?resolve():reject(new Error(`Animated WebP encoding exited ${code}: ${messages.join('').slice(-700)}`)));});record.animation=webp;
            }
            record.status=record.errors.length?'FAIL':'CAPTURED';
          }catch(error){record.status='FAIL';record.errors.push(error.message);await client.send('Page.stopScreencast').catch(()=>{});client.off('Page.screencastFrame',listener);await Promise.all(writes);}
          await writeFile(path.join(out,`${label}-${record.id}.json`),JSON.stringify(record,null,2)+'\n');report.sequences.push(record);if(record.status==='FAIL')report.failures.push({id:record.id,errors:record.errors});await save();console.log(`[continuity] ${record.id}: ${record.status}, ${record.frames.length} real frames.`);
        }
        async function stateStills(transition,variant=collected?'-collected':'-empty'){
          if(options.quarters!=='true')return;
          report.stateStills??=[];
          const bounds=await page.evaluate(number=>{const next=document.querySelectorAll('.chapter')[number];return{start:next.offsetTop-innerHeight,end:next.offsetTop};},transition);
          const cases=[...[0,25,50,75,100].map(percent=>({name:String(percent).padStart(3,'0'),percent})),{name:'start-before',y:bounds.start-2},{name:'start-after',y:bounds.start+2},{name:'end-before',y:bounds.end-2},{name:'end-after',y:bounds.end+2}];
          for(const item of cases){
            if(item.percent!==undefined)await page.goto(owned.base+`#tr-${pad(transition)}-${pad(transition+1)}@${item.percent}`,{waitUntil:'domcontentloaded'});
            else await page.evaluate(y=>scrollTo(0,y),item.y);
            await afterFrames(page,3);const audit=await readAudit(page),errors=assertions(audit),stem=`${label}-${profile.name}-tr${pad(transition)}${variant}-${item.name}`,file=stem+'.jpg';
            await page.screenshot({path:path.join(out,file),type:'jpeg',quality:84,fullPage:false});
            const record={id:stem,status:errors.length?'FAIL':'PASS',method:'Actual held quarter or native threshold-neighbor page screenshot; state and overlap audits accompany the pixels.',file,audit,errors};
            await writeFile(path.join(out,stem+'.json'),JSON.stringify(record,null,2)+'\n');report.stateStills.push(record);if(errors.length)report.failures.push({id:stem,errors});
          }
          await save();
        }
        async function unassembledLift(){
          if(!collected||!boundaries.includes(9)||profileRecord.unassembledLift)return;
          const placed=await page.evaluate(()=>JSON.parse(localStorage.getItem('papersun:story:v1')||'null')?.placed);
          if(!Array.isArray(placed)||placed.length)throw new Error('The unassembled lift check requires the real foundABC / placed-empty state.');
          await page.goto(owned.base+'#tr-09-10@0',{waitUntil:'domcontentloaded'});await afterFrames(page,3);
          const bounds=await page.evaluate(()=>{const next=document.querySelectorAll('.chapter')[9];return{start:next.offsetTop-innerHeight,end:next.offsetTop};});
          await stateStills(9,'-unassembled');
          for(const direction of['forward','reverse']){const from=direction==='forward'?bounds.start-2:bounds.end+2,to=direction==='forward'?bounds.end+2:bounds.start-2;await sequence(`tr09-unassembled-slow-${direction}`,[{from,to,duration:2400}]);}
          profileRecord.unassembledLift={method:'Actual unassembled TR09 forward and reverse before Place A/B/C; confirms narrative rendering does not grant found/placed memory.',state:await page.evaluate(()=>JSON.parse(localStorage.getItem('papersun:story:v1')||'null'))};
          if(profileRecord.unassembledLift.state?.placed?.length!==0)throw new Error('Narrative lift mutated the stored placement state.');
        }
        for(const transition of boundaries){
          if(collected&&transition===9){await unassembledLift();await placeRepair();}
          await page.goto(owned.base+`#tr-${pad(transition)}-${pad(transition+1)}@0`,{waitUntil:'domcontentloaded'});await afterFrames(page,3);
          const bounds=await page.evaluate(number=>{const next=document.querySelectorAll('.chapter')[number];return{start:next.offsetTop-innerHeight,end:next.offsetTop};},transition);
          await stateStills(transition);
          for(const [speed,duration]of[['slow',2400],['fast',650]])for(const direction of ['forward','reverse']){const from=direction==='forward'?bounds.start-2:bounds.end+2,to=direction==='forward'?bounds.end+2:bounds.start-2;await sequence(`tr${pad(transition)}-${speed}-${direction}`,[{from,to,duration}]);}
          if(transition===8&&repairReturn){
            await unassembledLift();
            await placeRepair();
            await stateStills(8,'-repaired');
            for(const [speed,duration]of[['slow',2400],['fast',650]])for(const direction of['forward','reverse']){const from=direction==='forward'?bounds.start-2:bounds.end+2,to=direction==='forward'?bounds.end+2:bounds.start-2;await sequence(`tr08-repaired-${speed}-${direction}`,[{from,to,duration}]);}
          }
        }
        const heroBounds=await page.evaluate(()=>({start:document.querySelectorAll('.chapter')[1].offsetTop-innerHeight,end:document.querySelectorAll('.chapter')[1].offsetTop,height:innerHeight}));
        for(let cycle=1;cycle<=heroCycles;cycle++){
          await page.goto(owned.base+'#ch-01',{waitUntil:'domcontentloaded'});await afterFrames(page,3);
          const points=[0,heroBounds.start,...[.25,.5,.75,1].map(p=>heroBounds.start+heroBounds.height*p),heroBounds.start+heroBounds.height*.75,heroBounds.start+heroBounds.height*.5,heroBounds.start+heroBounds.height*.25,heroBounds.start,0];
          await sequence(`hero-cycle-${cycle}`,points.slice(1).map((to,index)=>({from:points[index],to,duration:320,hold:index>=1&&index<=3||index>=5&&index<=7?240:0})));
        }
        profileRecord.memoryAfter=await memory(page);profileRecord.performance=await page.evaluate(()=>window.__papersunMeasurement);await client.detach();
        if(errors.length)report.failures.push({id:`${profile.name}-browser-errors`,errors});
      }catch(error){report.failures.push({id:`${profile.name}-continuity`,errors:[error.message]});profileRecord.exception=String(error.stack);}
      finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});browser=undefined;await save();}
    }
  }catch(error){report.failures.push({id:'environment',errors:[error.message]});}
  finally{await browser?.close().catch(()=>{});if(owned?.server)owned.server.kill('SIGTERM');report.finished=new Date().toISOString();report.status=report.failures.length?'FAIL':'CAPTURED';await save();console.log(`[continuity] ${report.status}: ${report.sequences.length} sequences; ${report.failures.length} failure records.`);}
  return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await(options.suite==='continuity'?runContinuity():runLayout());process.exitCode=report.status==='FAIL'?1:0;
}
