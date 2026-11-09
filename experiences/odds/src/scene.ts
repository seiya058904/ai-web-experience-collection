import { binomialCoefficients, enumeratePaths, prefixExperiment, expectedCounts, type Experiment, type SamplePath } from './engine.ts';
import { currentPersonal, heroDemo, teachingRounds, type AppState } from './state.ts';
import { traySVG, histogramSVG, paintPortrait, type Dot, type ChartBox } from './charts.ts';
import { clamp, smoothstep, transitionSnapshot, type NarrativeFrame } from './narrative.ts';

export interface PlaybackView { section: number; mode: 'path' | 'round'; progress: number; round: Experiment }
export interface SceneOptions { mobile: boolean; endpoint: number | null; prefix: string; route: string | null; playback: PlaybackView | null; canvasAvailable: boolean; branchIndex?: number }
export interface SceneResult { label: string; foot: string; dots: Dot[]; canvasActive: boolean }

const f = (v: number) => Number(v.toFixed(3));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const xml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const allFour = enumeratePaths(4);
const coefficients = binomialCoefficients(8);
export const sharedPortraitMax = Math.max(...teachingRounds.flatMap(r => r.counts), ...expectedCounts(8,.5,256));
export const portraitBox: ChartBox = { x: 92, y: 230, width: 816, height: 415 };

const defs = `<defs>
<linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4268CD"/><stop offset=".38" stop-color="#2C54BA"/><stop offset="1" stop-color="#1C3E9F"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#264695"/><stop offset=".7" stop-color="#18347D"/><stop offset="1" stop-color="#112B70"/></linearGradient>
<linearGradient id="tray" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4B6DC5"/><stop offset=".5" stop-color="#244AB8"/><stop offset="1" stop-color="#17398F"/></linearGradient>
<linearGradient id="slot" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#11295E"/><stop offset=".45" stop-color="#17367F"/><stop offset="1" stop-color="#2D55AE"/></linearGradient>
<linearGradient id="peg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7792E0"/><stop offset=".3" stop-color="#4E73CE"/><stop offset="1" stop-color="#1D3C87"/></linearGradient>
<radialGradient id="ball" cx="32%" cy="27%" r="75%"><stop stop-color="#F9AA70"/><stop offset=".45" stop-color="#E87942"/><stop offset="1" stop-color="#A8421E"/></radialGradient>
<filter id="board-shadow" x="-30%" y="-30%" width="170%" height="175%"><feDropShadow dx="18" dy="26" stdDeviation="18" flood-color="#4D4535" flood-opacity=".22"/></filter>
<filter id="soft-shadow" x="-30%" y="-90%" width="180%" height="300%"><feDropShadow dx="8" dy="12" stdDeviation="8" flood-color="#403E31" flood-opacity=".17"/></filter>
<filter id="peg-shadow" x="-100%" y="-100%" width="350%" height="400%"><feDropShadow dx="4" dy="7" stdDeviation="3" flood-color="#102153" flood-opacity=".42"/></filter>
<pattern id="material" width="180" height="180" patternUnits="userSpaceOnUse"><image href="${import.meta.env.BASE_URL}odds/art/material.webp" width="180" height="180"/></pattern>
</defs>`;

function ball(x:number,y:number,r=14):string { return `<g><ellipse cx="${f(x+r*.25)}" cy="${f(y+r*.8)}" rx="${f(r*1.05)}" ry="${f(r*.5)}" fill="#172855" opacity=".22"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#ball)"/></g>`; }
function text(x:number,y:number,value:string,size=16,fill='#5D635B',anchor='middle'):string { const kind=value.length>55?'fine':value.length>28?'caption':'number';return `<text class="scene-${kind}" x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${xml(value)}</text>`; }
function group(inner:string, x=0,y=0,s=1,opacity=1):string {return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" opacity="${f(clamp(opacity))}">${inner}</g>`;}
function pathPoints(directions:readonly string[],x:number,y:number,dx:number,dy:number):[number,number][] { let k=0;return [[x,y],...directions.map((d,i)=>{k+=d==='R'?1:0;return [x+(k-(i+1)/2)*dx,y+(i+1)*dy] as [number,number];})]; }
function pathD(points:[number,number][]):string{return points.map(([x,y],i)=>`${i?'L':'M'}${f(x)} ${f(y)}`).join(' ');}
function atPath(points:[number,number][],progress:number):[number,number] {const s=clamp(progress)*(points.length-1),i=Math.min(points.length-2,Math.floor(s)),t=s-i;return [lerp(points[i][0],points[i+1][0],t),lerp(points[i][1],points[i+1][1],t)];}

/** One exact node geometry drives pegs, branch lines, path, and slot centers. */
function board(round:Experiment,opts:{mobile?:boolean;pathProgress?:number;frameOpacity?:number;focus?:number;showReady?:boolean;showTheory?:boolean;aggregateResults?:boolean;omitResults?:boolean}={}):string {
  const n=round.n, lane=710/(n+1), dx=lane, dy=440/n, y0=187, x0=500;
  const focus=opts.focus??0, s=smoothstep(focus), frameOpacity=(opts.frameOpacity??1)*(1-s);
  const last=round.paths.at(-1), progress=opts.pathProgress??1;
  const inFlight=!!last && progress<1 && focus===0;
  const projection=opts.mobile?'':`transform="matrix(${f(lerp(.96,1,s))} ${f(lerp(.024,0,s))} ${f(lerp(-.055,0,s))} ${f(lerp(.97,1,s))} ${f(lerp(54,0,s))} ${f(lerp(6,0,s))})"`;
  const plate=`<g opacity="${f(frameOpacity)}"><ellipse cx="528" cy="834" rx="354" ry="32" fill="#958A71" opacity=".12"/><rect x="135" y="76" width="746" height="730" rx="43" fill="url(#edge)" filter="url(#board-shadow)"/><rect x="119" y="57" width="746" height="730" rx="42" fill="url(#face)" stroke="#5F7FCE" stroke-width="1.3"/><rect x="122" y="60" width="740" height="724" rx="40" fill="url(#material)" opacity=".14" style="mix-blend-mode:soft-light"/><path d="M163 65H821Q857 65 857 105" stroke="#91A5DB" stroke-opacity=".45" fill="none" stroke-width="1.5"/><path d="M452 59V96Q453 125 477 136L483 159Q500 167 517 159L523 136Q547 124 548 96V59" fill="url(#slot)" stroke="#5679CA" stroke-width="1.2"/>${text(778,108,`n = ${n}`,16,'#D0DBF5')}${text(778,135,`p = ${round.p.toFixed(2)}`,14,'#D0DBF5')}</g>`;
  let structure='';
  const fx=lerp(x0,500,s),fy=lerp(y0,280,s),fdx=lerp(dx,460,s),fdy=lerp(dy,260,s);
  for(let r=0;r<n;r++) for(let k=0;k<=r;k++){
    const x=fx+(k-r/2)*fdx,y=fy+r*fdy,opacity=r===0?1:1-s;
    const left=[x-fdx/2,y+fdy],right=[x+fdx/2,y+fdy];
    structure+=`<g opacity="${f(opacity)}"><path d="M${f(left[0])} ${f(left[1])} L${f(x)} ${f(y)} L${f(right[0])} ${f(right[1])}" fill="none" stroke="${s>.7?'#244AB8':'#85A0E3'}" stroke-opacity="${f(lerp(.2,1,s))}" stroke-width="${f(lerp(1.1,40,s))}" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y+13)}" r="${f(lerp(Math.max(6,12-n*.35),14,s))}" fill="url(#peg)" filter="url(#peg-shadow)"/></g>`;
  }
  let slots='';
  const theory=expectedCounts(round.n,round.p,round.N);
  const max=Math.max(1,...round.counts,...(opts.showTheory?theory:[]));
  round.counts.forEach((count,k)=>{const cx=500+(k-n/2)*lane,w=lane-8,x=cx-w/2;
    slots+=`<g data-board-slot="${k}" data-count="${count}"><rect x="${f(x)}" y="661" width="${f(w)}" height="105" rx="10" fill="url(#slot)" stroke="#5072C2" stroke-width="1"/>`;
    if(!opts.omitResults){
      const visibleCount=count-(inFlight&&last?.k===k?1:0);
      if(round.N<=24&&!opts.aggregateResults){const residents=round.paths.filter(p=>p.k===k&&(!inFlight||p.id!==last?.id));for(let j=0;j<visibleCount;j++){const rp=Math.min(11,w/6),cx2=cx+([0,-1,1][j%3])*rp*2.1;slots+=`<g data-resting-sample="${xml(residents[j].id)}">${ball(cx2,752-Math.floor(j/3)*rp*2.1,rp)}</g>`;}}
      else{const h=visibleCount/max*65;slots+=`<rect data-board-observed="${k}" x="${f(cx-w*.26)}" y="${f(752-h)}" width="${f(w*.52)}" height="${f(h)}" rx="3" fill="#E87942"/>`;}
    }
    if(opts.showTheory){const ty=752-theory[k]/max*65;slots+=`<line x1="${f(x+4)}" x2="${f(x+w-4)}" y1="${f(ty)}" y2="${f(ty)}" stroke="#C4D6B7" stroke-width="2" stroke-dasharray="4 3"/>`;}
    slots+=text(cx,833,String(k),16,'#244AB8')+(opts.omitResults?'':text(cx,648,String(count),13,'#E6EAF7'))+'</g>';
  });
  let trail='';
  if(last){
    const pts=pathPoints(last.directions,fx,fy,fdx,fdy);
    trail=`<path d="${pathD(pts)}" fill="none" stroke="#F1AC79" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${f(.9*(1-s))}"/>`;
    if(inFlight){
      const slotX=500+(last.k-n/2)*lane,ordinal=round.counts[last.k]-1,rp=Math.min(11,(lane-8)/6);
      const discrete=round.N<=24&&!opts.aggregateResults;
      const endX=discrete?slotX+([0,-1,1][ordinal%3])*rp*2.1:slotX;
      const endY=discrete?752-Math.floor(ordinal/3)*rp*2.1:752-round.counts[last.k]/max*65;
      const animationPoints:[[number,number],...[number,number][]]=[[500,109],...pts,[endX,endY]];
      const [x,y]=atPath(animationPoints,progress);trail+=`<g data-moving-sample="${xml(last.id)}">${ball(x,y,lerp(17,rp,progress))}</g>`;
    }
  }
  const ready = (!last || opts.showReady!==false) && progress>=1 ? ball(500,109,17):'';
  const approaching=s>0?`<g opacity="${f(s)}"><path d="M500 185V280" stroke="url(#tray)" stroke-width="40" stroke-linecap="round"/>${ball(500,lerp(109,205,s),lerp(17,28,s))}${text(270,624,'Left',25,'#244AB8')}${text(270,659,'p = 0.50',17)}${text(730,624,'Right',25,'#244AB8')}${text(730,659,'p = 0.50',17)}</g>`:'';
  return `<g ${projection}>${plate}${structure}<g opacity="${f(1-s)}">${slots}${ready}</g>${trail}${approaching}</g>`;
}

function fork(state:AppState,index=3):string{
  const last=state.branch.paths[index]?.directions[0]??'R';
  return `<g><path d="M500 185V280M270 540L500 280L730 540" fill="none" stroke="#182F77" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" transform="translate(6 8)" opacity=".17"/><path d="M500 185V280M270 540L500 280L730 540" fill="none" stroke="url(#tray)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/><circle cx="500" cy="293" r="14" fill="url(#peg)" filter="url(#peg-shadow)"/>${ball(500,205,28)}${text(270,624,'Left',25,'#244AB8')}${text(270,659,'p = 0.50',17)}${text(730,624,'Right',25,'#244AB8')}${text(730,659,'p = 0.50',17)}${text(500,771,`Choice ${index+1}: ${last==='L'?'left':'right'}`,16)}<circle cx="${last==='L'?270:730}" cy="540" r="9" fill="#E87942"/></g>`;
}

/** Partial layer construction retains the first four levels as a prefix. */
function tree(layers:number,options:{endpoint?:number|null;prefix?:string;route?:string|null;fromLayers?:number;reveal?:number}={}):string{
  const from=options.fromLayers??layers, reveal=options.reveal??1;
  const firstFork=from===1;
  const eased=smoothstep(reveal);
  const dx=lerp(firstFork?460:620/(from+1),620/(layers+1),eased),dy=lerp(firstFork?260:430/from,430/layers,eased);
  const visible=lerp(from,layers,reveal), x0=500,y0=lerp(firstFork?280:160,160,eased), lines:string[]=[];
  for(let r=0;r<layers;r++){
    const opacity=clamp(visible-r);
    if(opacity<=0)continue;
    for(let k=0;k<=r;k++){const x=x0+(k-r/2)*dx,y=y0+r*dy;lines.push(`<g opacity="${f(opacity)}"><path d="M${f(x-dx/2)} ${f(y+dy)} L${f(x)} ${f(y)} L${f(x+dx/2)} ${f(y+dy)}" fill="none" stroke="${firstFork&&r===0?'url(#tray)':'#A6B5CD'}" stroke-width="${f(firstFork&&r===0?lerp(40,1.2,eased):1.2)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f(x)}" cy="${f(y)}" r="6" fill="url(#peg)"/></g>`);}
  }
  let routes='';
  if(layers===4&&reveal===1){const filtered=allFour.filter(p=>(options.endpoint==null||p.k===options.endpoint)&&(!options.prefix||p.directions.join('').startsWith(options.prefix)));filtered.forEach(p=>{const selected=!options.route||options.route===p.directions.join('');routes+=`<path d="${pathD(pathPoints(p.directions,x0,y0,dx,dy))}" fill="none" stroke="${selected?'#244AB8':'#AAB9D3'}" opacity="${selected?.7:.2}" stroke-width="${options.route&&selected?4:1.9}"/>`;});}
  const endpoints=[];
  const completed=reveal===1;
  if(completed){for(let k=0;k<=layers;k++){const x=x0+(k-layers/2)*dx,y=y0+layers*dy;endpoints.push(`<rect x="${f(x-26)}" y="${f(y+13)}" width="52" height="49" rx="8" fill="url(#tray)" filter="url(#soft-shadow)"/>${text(x,y+45,String(k),16,'#F2EDDF')}`);}}
  const headline=completed?`${layers} choices · ${2**layers} possible paths`:`Extending the structure · ${from} to ${layers} choices`;
  return `<g>${text(500,90,headline,20,'#244AB8')}${firstFork?`<path d="M500 ${f(lerp(185,148,eased))}V${f(y0)}" stroke="url(#tray)" stroke-width="${f(40*(1-eased))}" stroke-linecap="round"/>`:''}${lines.join('')}${routes}${ball(500,lerp(firstFork?205:148,148,eased),lerp(firstFork?28:13,13,eased))}${endpoints.join('')}${text(500,758,completed?'Endpoint = number of right turns':'Earlier endpoints become intermediate nodes.',14)}</g>`;
}

function weightRelief(unit:'paths'|'probability'|'balls'='paths'):string{
  const x=113,y=683,width=774,lane=width/9;
  let lines='',columns='';
  coefficients.forEach((count,k)=>{
    const cx=x+(k+.5)*lane,h=count/70*330,dy=y-h;
    for(let j=0;j<count;j++){const offset=(j-(count-1)/2)*.62;lines+=`<path d="M500 148 C${f(500+offset)} 294 ${f(cx+offset)} ${f(dy-80)} ${f(cx+offset)} ${f(dy)}" fill="none" stroke="#244AB8" stroke-width=".75" opacity=".35"/>`;}
    const value=unit==='paths'?String(count):unit==='probability'?`${(count/256*100).toFixed(2)}%`:(16*count/256).toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
    columns+=`<g data-weight="${count}"><path d="M${f(cx-25)} ${f(dy)}L${f(cx+27)} ${f(dy)}L${f(cx+36)} ${f(dy+11)}V${y+18}H${f(cx-15)}L${f(cx-25)} ${y}Z" fill="#183985"/><rect x="${f(cx-25)}" y="${f(dy)}" width="52" height="${f(h)}" rx="3" fill="url(#tray)"/><path d="M${f(cx-25)} ${f(dy)}H${f(cx+27)}L${f(cx+36)} ${f(dy+11)}H${f(cx-16)}Z" fill="#5F7ED1"/>${text(cx,y+53,value,unit==='paths'?19:12,'#244AB8')}${text(cx,y+84,String(k),12)}</g>`;
  });
  const label=unit==='paths'?'Exact path counts · total 256':unit==='probability'?'Probability · each count ÷ 256':'Expected balls · 16 × probability';
  return `${text(500,80,label,20,'#244AB8')}<circle cx="500" cy="145" r="10" fill="url(#peg)"/>${lines}<g filter="url(#soft-shadow)">${columns}</g>${text(500,835,unit==='paths'?'Possible sequences, before any balls are sampled.':unit==='probability'?'The nine probabilities sum to one.':'The middle expects 4.375 balls. No integer outcome is promised.',14)}`;
}

function pair(state:AppState):string{const max=Math.max(...state.small.flatMap(r=>r.counts),...expectedCounts(8,.5,16));return traySVG(state.small[0],{x:126,y:190,width:748,height:175,maxCount:max,label:'Round A · 16 balls'})+traySVG(state.small[1],{x:126,y:535,width:748,height:175,maxCount:max,label:'Round B · 16 balls'});}
function trio(state:AppState,progress=0,mobile=false):string{
  const t=smoothstep(progress),n=state.comparisonN;let out='';
  for(let i=0;i<3;i++){
    const selected=i===1, offset=(i-1)*285;
    const origin:ChartBox=mobile?{x:140,y:100+i*260,width:720,height:138}:{x:95+i*285,y:290,width:250,height:290};
    const box:ChartBox=selected?{x:lerp(origin.x,portraitBox.x,t),y:lerp(origin.y,portraitBox.y,t),width:lerp(origin.width,portraitBox.width,t),height:lerp(origin.height,portraitBox.height,t)}:mobile?{...origin,y:origin.y+(i-1)*t*290}:{x:origin.x+offset*t*2,y:290+t*95,width:250*(1-t*.7),height:290*(1-t*.7)};
    const N=selected&&progress>.5?transitionSnapshot(6,progress,n).revealedSamples!:n;
    const r=prefixExperiment(teachingRounds[i],N);
    out+=traySVG(r,{...box,maxCount:sharedPortraitMax,label:selected&&progress>0?`The middle evening · ${N} balls`:`Evening ${['I','II','III'][i]} · ${n}`,opacity:selected?1:1-t,showTheory:progress<.9});
  }
  return out+text(500,mobile?858:785,progress>0?'The side rounds remain separate. Only the middle continues.':'Same n = 8 · same p = 0.50 · one shared count scale',14);
}

function personalHistogram(round:Experiment,label:string,omitBars=false):string{
  return `<g><rect x="77" y="144" width="846" height="574" rx="13" fill="#F8F5EB"/><path d="M99 165H901" stroke="#E0DDCF"/>${text(120,208,'ODDS / EXPERIMENT',12,'#5D635B','start')}${text(880,208,`n ${round.n}  ·  p ${round.p.toFixed(2)}  ·  N ${round.N}`,14,'#244AB8','end')}${histogramSVG(round,{x:135,y:310,width:730,height:288,label,omitBars})}${text(500,755,`Seed: ${round.seed}`,11)}${text(500,782,'Ideal independent model · replayable pseudorandom sample',12)}</g>`;
}

/** A single owner carries every observed column from the chart back to the board. */
function returnToBoard(round:Experiment,progress:number,mobile:boolean):string{
  const s=smoothstep(progress),expected=expectedCounts(round.n,round.p,round.N);
  const ceiling=Math.max(1,Math.ceil(Math.max(1,...round.counts,...expected)/4))*4;
  const sourceLane=730/(round.n+1),sourceWidth=Math.min(52,sourceLane*.6),targetLane=710/(round.n+1),targetWidth=(targetLane-8)*.52,max=Math.max(1,...round.counts);
  const project=([x,y]:[number,number]):[number,number]=>mobile?[x,y]:[.96*x-.055*y+54,.024*x+.97*y+6];
  const color=(start:number[],end:number[])=>`rgb(${start.map((v,i)=>Math.round(lerp(v,end[i],s))).join(' ')})`;
  let columns='';
  round.counts.forEach((count,k)=>{
    const sx=135+(k+.5)*sourceLane,sy=598-288*count/ceiling,tx=500+(k-round.n/2)*targetLane,ty=752-count/max*65;
    const start:[number,number][]=[[sx-sourceWidth/2,sy],[sx+sourceWidth/2,sy],[sx+sourceWidth/2,598],[sx-sourceWidth/2,598]];
    const end:[number,number][]=[[tx-targetWidth/2,ty],[tx+targetWidth/2,ty],[tx+targetWidth/2,752],[tx-targetWidth/2,752]];
    const points=start.map((a,i)=>{const b=project(end[i]);return [lerp(a[0],b[0],s),lerp(a[1],b[1],s)] as [number,number];});
    const labelTarget=project([tx,648]);
    columns+=`<g data-return-slot="${k}" data-observed="${count}"><path d="${pathD(points)}Z" fill="${k===round.paths.at(-1)?.k?'#E87942':color([36,74,184],[232,121,66])}"/>${text(lerp(sx,labelTarget[0],s),lerp(sy-10,labelTarget[1],s),String(count),13,color([37,40,39],[230,234,247]))}</g>`;
  });
  const title=round.seed.startsWith('odds-workbench-demo')?'Demonstration result':'Your observed result';
  const chartOpacity=1-smoothstep(progress/.4),boardOpacity=smoothstep((progress-.15)/.65);
  return group(personalHistogram(round,title,true),0,0,1,chartOpacity)+group(board(round,{mobile,omitResults:true,aggregateResults:true}),0,0,1,boardOpacity)+`<g class="return-observed" data-N="${round.N}" data-units="number of balls">${columns}</g>`;
}

function selectedReceipt(state:AppState,y=100):string{
  const p=teachingRounds[1].paths[state.selectedBall];
  return `<g>${text(500,y,`Ball ${state.selectedBall+1} · endpoint ${p.k}`,17,'#244AB8')}${text(500,y+30,p.directions.join('   '),18,'#4F5C4F')}</g>`;
}

const writtenScene=new WeakMap<SVGSVGElement,string>();
export function renderScene(svg:SVGSVGElement,canvas:HTMLCanvasElement,state:AppState,frame:NarrativeFrame,opts:SceneOptions):SceneResult{
  let inner='',label='',foot='',dots:Dot[]=[],canvasActive=false;
  const current=frame.chapter,t=frame.transition===null?0:frame.progress,s=smoothstep(t),personal=currentPersonal(state),hero=state.hero??heroDemo;
  const playback=opts.playback;
  function stable(chapter:number):string{
    switch(chapter){
      case 0:label='Eight choices. Nine places to land.';foot=`${state.hero?'Your entrance round':'Demonstration sample'} · ${hero.N} ${hero.N===1?'ball':'balls'}`;return board(hero,{mobile:opts.mobile,pathProgress:playback?.section===0?playback.progress:1,showReady:true});
      case 1:label='One choice has no memory.';foot='Independent one-step demonstration · p = 0.50';return fork(state,opts.branchIndex);
      case 2:label='A different route. The same arrival.';foot='Exact enumeration · n = 4 · no sampled balls';return tree(4,{endpoint:opts.endpoint,prefix:opts.prefix,route:opts.route});
      case 3:label='The architecture of possibility.';foot='Exact combinations · 256 sequences · 9 endpoints';return weightRelief();
      case 4:label='The same rules can leave different shapes.';foot='Two separate rounds · n = 8 · p = 0.50';return pair(state);
      case 5:label='Change a chance, not a promise.';foot=`New 64-ball round · n = 8 · p = ${state.bias.p.toFixed(2)}`;return board(state.bias,{mobile:opts.mobile,showTheory:true})+text(500,865,'Solid: observed balls. Dashed: expected count, on the same scale.',13);
      case 6:label='Three evenings. One set of rules.';foot=`Separate teaching rounds · ${state.comparisonN} balls each`;return trio(state,0,opts.mobile);
      case 7:{
        label='One portrait. 256 particular journeys.';foot='Middle teaching round · 256 unique sample IDs';const round=teachingRounds[1],id=round.paths[state.selectedBall].id;
        if(opts.canvasAvailable){try{dots=paintPortrait(canvas,round,{box:portraitBox,maxCount:sharedPortraitMax,selectedId:id,dpr:Math.min(2,window.devicePixelRatio)});canvasActive=true;}catch{canvasActive=false;}}
        return selectedReceipt(state,130)+traySVG(round,{...portraitBox,maxCount:sharedPortraitMax,label:'The middle evening',selectedId:id,showTheory:false,omitDots:canvasActive})+text(500,790,'Every sphere is one saved sample. Select any ball to follow its path.',14);
      }
      case 8:{label='A result that belongs to its rules.';foot=`${personal.seed.startsWith('odds-workbench-demo')?'Labelled demonstration continuation':'Your saved round'} · ${personal.N} balls`;const replay=playback?.section===8&&playback.mode==='round';const r=replay?prefixExperiment(personal,Math.floor(personal.N*playback.progress)):personal;return personalHistogram(r,replay?`Replay · ${r.N} of ${personal.N} shown`:personal.seed.startsWith('odds-workbench-demo')?'Demonstration result':'Your observed result');}
      default:label='The next one is still an open question.';foot=`${personal.seed.startsWith('odds-workbench-demo')?'Demonstration continuation':'Your round'} · n = ${personal.n} · p = ${personal.p.toFixed(2)} · N = ${personal.N}`;return board(personal,{mobile:opts.mobile,pathProgress:playback?.section===9?playback.progress:1,aggregateResults:true})+text(500,877,'Same rules. One more possibility.',14);
    }
  }
  if(frame.transition===null){inner=stable(current);}
  else{
    const snap=transitionSnapshot(current,t,state.comparisonN);
    label=['Closer to the first fork.','One branch becomes four choices.','Four more layers of possibility.','From paths to probabilities to expected balls.','The previous pair stays saved.','A separate, fair teaching comparison.','Stay with the middle evening.','One journey becomes a result ticket.','Your whole round comes with you.'][current];
    foot=snap.unit==='structure'?'Structure changes; saved results stay the same.':current===6?`${snap.revealedSamples} of 256 saved middle-round samples revealed`:snap.unit==='probability'?'Probability = path count ÷ 256':snap.unit==='paths'?'Unit: possible direction sequences':'Unit: number of balls';
    switch(current){
      case 0:inner=board(hero,{mobile:opts.mobile,focus:t,pathProgress:1});break;
      case 1:inner=tree(4,{fromLayers:1,reveal:t});break;
      case 2:inner=t<.75?tree(8,{fromLayers:4,reveal:t/.75}):group(tree(8),0,0,1,1-smoothstep((t-.75)/.25))+group(weightRelief(),0,0,1,smoothstep((t-.75)/.25));break;
      case 3:{if(t<.5)inner=weightRelief(t<.25?'paths':'probability');else{const u=smoothstep((t-.5)*2);inner=group(weightRelief('balls'),0,-u*80,1-u*.1,1-u)+group(pair(state),0,(1-u)*120,1,u);}break;}
      case 4:inner=group(pair(state),-s*330,-s*150,1-s*.65,1-s)+group(board(state.bias,{mobile:opts.mobile,showTheory:true}),s===0?0:0,(1-s)*125,lerp(.7,1,s),s);break;
      case 5:inner=group(board(state.bias,{mobile:opts.mobile,showTheory:true}),-s*310,-s*180,1-s*.7,1-s)+group(trio(state,0,opts.mobile),0,(1-s)*110,lerp(.7,1,s),s);break;
      case 6:inner=trio(state,t,opts.mobile);break;
      case 7:{const id=teachingRounds[1].paths[state.selectedBall].id;inner=group(selectedReceipt(state,130)+traySVG(teachingRounds[1],{...portraitBox,maxCount:sharedPortraitMax,selectedId:id,showTheory:false}),0,-s*140,1-s*.12,1-s)+group(personalHistogram(personal,personal.seed.startsWith('odds-workbench-demo')?'Demonstration result':'Your observed result'),0,(1-s)*140,lerp(.9,1,s),s);break;}
      default:inner=returnToBoard(personal,t,opts.mobile);break;
    }
  }
  // Rebuild the scene only when its markup changes; a resting chapter costs nothing.
  const markup=defs+inner;if(writtenScene.get(svg)!==markup){writtenScene.set(svg,markup);svg.innerHTML=markup;}
  svg.dataset.chapter=String(current+1);svg.dataset.transition=frame.transition===null?'none':transitionSnapshot(current,t).id;svg.dataset.progress=f(t).toString();
  return {label,foot,dots,canvasActive};
}
