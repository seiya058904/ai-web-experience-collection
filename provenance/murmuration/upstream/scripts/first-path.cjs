const {chromium}=require('@playwright/test');
const {serve}=require('./browser-fixture.cjs');
const path=require('node:path');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await serve(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://murmuration.test/');await page.waitForSelector('#scene[data-record="ready"]');
 await page.screenshot({path:path.resolve('docs/evidence/first-path-hero.png')});
 await page.getByRole('button',{name:'II — A Local World',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#scene').dataset.progress)-.29)<.002);
 await page.screenshot({path:path.resolve('docs/evidence/first-path-local.png')});
 const boxes=await page.locator('.local-copy h2, .local-copy .body-copy, .rule-list button').evaluateAll(es=>es.map(e=>({text:e.innerText,rect:e.getBoundingClientRect().toJSON()})));
 await page.getByRole('button',{name:'III — A Turn Travels',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#scene').dataset.progress)-.535)<.002);
 await page.screenshot({path:path.resolve('docs/evidence/first-path-turn.png')});
 fs.writeFileSync('docs/evidence/first-path.json',JSON.stringify({viewport:{width:1440,height:900},method:'Playwright Chromium; isolated production fixture after shared preview switched project',errors,boxes},null,2));
 console.log(JSON.stringify({errors,title:await page.title(),boxes}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
