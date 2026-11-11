import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('evidence/screenshots');
await mkdir(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4325, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const records = [], errors = [];

async function settled(page) {
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.waitForFunction(() => [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).every(img => img.complete && img.naturalWidth > 512 && !img.currentSrc.includes('/fallback/')));
  await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).map(img => img.decode())); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
}

async function shot(page, name, kind) {
  await settled(page);
  const observation = await page.evaluate(() => {
    const chapter = document.body.dataset.chapter;
    const element = document.getElementById(chapter);
    const beat = element?.querySelector('[data-beat="2"]');
    const copy = element?.querySelector('.chapter-copy');
    return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollY, pageWidth: document.documentElement.scrollWidth,
      chapter, transition: document.body.dataset.transition, chapterOpacity: element && getComputedStyle(element).opacity,
      beat: beat ? { text: beat.textContent, box: beat.getBoundingClientRect().toJSON() } : null,
      copy: copy?.getBoundingClientRect().toJSON(),
      images: [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).map(img => ({src:new URL(img.currentSrc).pathname,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight})),
    };
  });
  await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 84 });
  records.push({ name, kind, ...observation });
}

try {
  for (const [device, viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
    const context = await browser.newContext({viewport,deviceScaleFactor:1,isMobile:device==='mobile',hasTouch:device==='mobile'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push({device,message:e.message}));
    for(let i=1;i<=11;i++){
      const id=`ch-${String(i).padStart(2,'0')}`;
      await page.goto(`http://127.0.0.1:4325/#${id}`,{waitUntil:'load'});await settled(page);
      await page.evaluate(id=>{
        const chapter=document.getElementById(id), beat=chapter.querySelector('[data-beat="2"]');
        const top=chapter.getBoundingClientRect().top+scrollY;
        scrollTo(0,Math.max(top,beat.getBoundingClientRect().bottom+scrollY-innerHeight*.72));
      },id);
      await page.waitForFunction(id=>document.body.dataset.chapter===id,id);
      await shot(page,`${device}-${id}-second-beat`,'second-beat');
    }
    await context.close();
  }
  for(const viewport of [{width:320,height:700},{width:360,height:640},{width:390,height:844}]){
    const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push({device:`phone-${viewport.width}`,message:e.message}));
    await page.goto('http://127.0.0.1:4325/#ch-08',{waitUntil:'load'});
    await shot(page,viewport.width===390?'mobile-ch-08':`phone-${viewport.width}-ch-08`,'corrected-inspection-hold');
    await context.close();
  }
  await writeFile('evidence/records/reading-holds.json',JSON.stringify({browser:browser.version(),method:'Final production build; full-image decode; actual native scroll; second beat positioned at 72% viewport bottom to retain its reading hold.',records,errors},null,2));
  // Preserve the full capture manifest while replacing this one corrected frame.
  const capturePath='evidence/records/captures.json';const prior=JSON.parse(await readFile(capturePath,'utf8'));
  const corrected=records.find(r=>r.name==='mobile-ch-08');
  prior.records=prior.records.map(r=>{ if(r.name!=='mobile-ch-08') return r; const {headings,...previous}=r; return {...previous,...corrected,correction:'Final phone inspection panel placed below the work.'}; });
  prior.finalCorrection='Phone CH08 corrected on final build; all other images remain from the unchanged scene layouts.';
  await writeFile(capturePath,JSON.stringify(prior,null,2));
  console.log(JSON.stringify({captures:records.length,errors,overflow:records.filter(r=>r.pageWidth>r.width).map(r=>r.name),fadedBeats:records.filter(r=>r.kind==='second-beat'&&Number(r.chapterOpacity)<.99).map(r=>r.name)}));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
