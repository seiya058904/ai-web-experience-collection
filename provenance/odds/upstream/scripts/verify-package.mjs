import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const html=readFileSync(resolve(dist,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
const styles=[...html.matchAll(/<link[^>]*href="([^"]+)"/g)].map(m=>m[1]);
const dependencies=[...scripts,...styles];
for(const path of dependencies){
  assert(!path.startsWith('/'),'Build must support a nested base path');
  assert(!/^https?:/.test(path),'Runtime dependency must be local');
  assert(existsSync(resolve(dist,path)), 'Missing '+path);
}
const cssPath=styles.find(p=>p.endsWith('.css'));
assert(cssPath);
const css=readFileSync(resolve(dist,cssPath),'utf8');
for(const match of css.matchAll(/url\(([^)]+)\)/g)){
  const path=match[1].replaceAll('"','').replaceAll("'",'');
  if(!path.startsWith('data:'))assert(existsSync(resolve(dirname(resolve(dist,cssPath)),path)),'Missing font '+path);
}
const js=readFileSync(resolve(dist,scripts[0]),'utf8');
assert(js.includes('./art/material.webp'));
assert(existsSync(resolve(dist,'art/material.webp')));
const offline=readFileSync(resolve(root,'ODDS-Offline.html'),'utf8');
assert(!/<script[^>]*\ssrc=/.test(offline),'Offline application must have inline scripts');
assert(!/<link[^>]*rel="stylesheet"/.test(offline),'Offline styles must be inline');
assert(offline.includes('data:font/woff2;base64,'));
assert(offline.includes('data:image/webp;base64,'));
assert(offline.includes('data:image/svg+xml;base64,'));
assert(!offline.includes('./art/material.webp'),'Offline material must be embedded');
assert(offline.includes('SIL OPEN FONT LICENSE')&&offline.includes('MIT License'),'Redistributed resources retain notices');
assert(!offline.includes('/workspace/'),'No absolute workspace dependency');
assert.equal(readdirSync(resolve(root,'artwork')).filter(p=>/^img-\d\d\.webp$/.test(p)).length,8);
console.log(JSON.stringify({status:'PASS',buildDependencies:dependencies.length,relativeBase:true,offlineBytes:Buffer.byteLength(offline),embeddedFonts:true,embeddedMaterial:true,embeddedNotices:true,independentArtRoles:8},null,2));

