import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {sanitizeConfig,makeTimeline,PRESET_LABELS,DEFAULT_CONFIG} from '../experiences/frame/src/timeline.ts';
import {exportFilename} from '../experiences/frame/src/export.ts';

test('prepared download links survive blocked automatic downloads, other exports and failed replacements', async () => {
  const main=await readFile(new URL('../experiences/frame/src/main.ts',import.meta.url),'utf8');
  const start=main.indexOf("type ExportKind='html'|'png';"),end=main.indexOf("$('#download-film').addEventListener",start);
  assert.ok(start>=0&&end>start,'exercise the actual production download handlers');
  const source=ts.transpileModule(main.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const classes=()=>({values:new Set(),add(value){this.values.add(value)},remove(value){this.values.delete(value)},contains(value){return this.values.has(value)}});
  const node=tag=>({tag,style:{},classList:classes(),children:[],attributes:{},hidden:false,
    setAttribute(name,value){this.attributes[name]=value},after(value){this.next=value},replaceChildren(...values){this.children=values},
    click(){throw new Error('Automatic download blocked by this test browser.');},
  });
  const status=node('p'),filmButton=node('button'),storyButton=node('button');
  const elements={'#download-status':status,'#download-film':filmButton,'#download-storyboard':storyButton};
  const history={current:DEFAULT_CONFIG},revoked=[];
  let created=0,failFilm=false;
  const environment={
    $:selector=>elements[selector],document:{body:{dataset:{}},createElement:node},history,
    pauseAll(){},sanitizeConfig,makeTimeline,PRESET_LABELS,exportFilename,assets:{},icon:()=>'',
    exportFilm:async()=>{if(failFilm)throw Error('The new film failed to prepare.');return new Blob(['film']);},
    exportStoryboard:async()=>new Blob(['storyboard']),
    URL:{createObjectURL(){return`blob:prepared-${++created}`},revokeObjectURL(url){revoked.push(url)}},
    setTimeout(){throw Error('Prepared links must not expire on a timer.');},
  };
  const api=new Function('environment',`
    const {${Object.keys(environment).join(',')}}=environment;
    ${source}
    return {download,preparedLinks};
  `)(environment);
  await api.download('html');
  assert.equal(api.preparedLinks.hidden,false);
  assert.equal(api.preparedLinks.children.length,2);
  const open=api.preparedLinks.children[0],download=api.preparedLinks.children[1];
  assert.equal(open.target,'_blank');assert.equal(open.rel,'noopener');
  assert.equal(open.href,'blob:prepared-1');assert.equal(download.href,open.href);
  assert.equal(download.download,'frame-even-00-00.html');
  assert.match(status.textContent,/prepared.*If the download did not start/);
  assert.equal(status.classList.contains('error'),false,'a blocked automatic click does not erase a successfully prepared file');
  assert.deepEqual(revoked,[]);
  await api.download('png');
  assert.equal(api.preparedLinks.children.length,3);
  assert.equal(api.preparedLinks.children[0].href,'blob:prepared-1');
  assert.equal(api.preparedLinks.children[2].href,'blob:prepared-2');
  assert.deepEqual(revoked,[],'preparing a different kind preserves both earlier film links');
  history.current={preset:'ease-in',hold6:12,hold18:12};
  await api.download('html');
  assert.deepEqual(revoked,['blob:prepared-1']);
  assert.equal(api.preparedLinks.children[0].href,'blob:prepared-3');
  assert.equal(api.preparedLinks.children[1].download,'frame-ease-in-12-12.html');
  assert.match(api.preparedLinks.children[0].title,/5\.00 seconds/);
  assert.equal(api.preparedLinks.children[2].href,'blob:prepared-2');
  failFilm=true;
  await api.download('html');
  assert.equal(api.preparedLinks.children[0].href,'blob:prepared-3');
  assert.deepEqual(revoked,['blob:prepared-1'],'a failed replacement does not revoke the usable prepared film');
  assert.equal(status.classList.contains('error'),true);
  assert.equal(filmButton.disabled,false);assert.equal(storyButton.disabled,false);
});
