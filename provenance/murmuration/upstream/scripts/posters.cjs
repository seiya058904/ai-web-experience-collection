// Precompute the initial Canvas frame. These are model-derived fallbacks,
// not image-generated birds. Run after a build, then build again to package.
const {chromium}=require('@playwright/test');
const {serve}=require('./browser-fixture.cjs');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 for(const [name,width,height] of [['wide',1440,900],['landscape',1920,1080],['portrait',390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
  await serve(page);await page.goto('http://murmuration.test/');await page.waitForSelector('#scene.ready[data-record="ready"]');await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(100);
  const encoded=await page.locator('#scene').evaluate(canvas=>canvas.toDataURL('image/webp',.9).split(',')[1]);
  const file=path.resolve(`public/poster-${name}.webp`);fs.writeFileSync(file,Buffer.from(encoded,'base64'));console.log(JSON.stringify({poster:`poster-${name}.webp`,width,height,bytes:fs.statSync(file).size}));await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
