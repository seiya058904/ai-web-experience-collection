import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const directory = path.join(root, 'standalone-dist');
let html = await readFile(path.join(directory, 'index.html'), 'utf8');
const js = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
const css = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/)?.[1];
if (!js || !css) throw new Error('Expected one bundled script and stylesheet.');
const script = await readFile(path.resolve(directory, js), 'utf8');
const style = await readFile(path.resolve(directory, css), 'utf8');
const entries=[];
async function embed(folder) {
  for (const entry of await readdir(path.join(root, 'public', folder), { withFileTypes: true })) {
    const name = `${folder}/${entry.name}`;
    if (entry.isDirectory()) await embed(name);
    else if (!entry.name.includes('.part') && /\.(webp|json)$/.test(entry.name)) {
      const data = await readFile(path.join(root, 'public', name));
      entries.push({name,data,type:entry.name.endsWith('.webp')?'image/webp':'application/json'});
    }
  }
}
await embed('frames'); await embed('stills');
let headerLength=0,index,header;
for(let pass=0;pass<8;pass++){
 let offset=4+headerLength;index={};
 for(const item of entries){index[item.name]={type:item.type,start:offset,length:item.data.length};offset+=item.data.length;}
 header=Buffer.from(JSON.stringify(index));
 if(header.length===headerLength)break;headerLength=header.length;
}
const length=Buffer.alloc(4);length.writeUInt32LE(header.length);
const binary=Buffer.concat([length,header,...entries.map(x=>x.data)]);
const assets={};
for (const name of ['art/img-04.webp', 'art/img-05.webp']) assets[name] = { type:'image/webp', data:(await readFile(path.join(root,'public',name))).toString('base64') };
html=html.replace(/<link[^>]*rel="(?:preload|icon)"[^>]*>/g,'');
html=html.replace(/<link[^>]*href="[^"]+\.css"[^>]*>/,()=>`<style>${style}</style>`);
html=html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,()=>'');
html=html.replace('</body>',()=>`<script type="application/json" id="pas-assets">${JSON.stringify(assets)}</script><meta id="pas-pack" data-src="./PAS-assets.bin?v=${createHash('sha256').update(binary).digest('hex').slice(0,12)}"><script type="module">${script.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await mkdir(path.join(root,'offline'),{recursive:true});
await writeFile(path.join(root,'offline','PAS-preview.html'),html);
await writeFile(path.join(root,'offline','PAS-assets.bin'),binary);
console.log(JSON.stringify({file:'offline/PAS-preview.html',assets:entries.length,htmlBytes:Buffer.byteLength(html),packBytes:binary.length}));
