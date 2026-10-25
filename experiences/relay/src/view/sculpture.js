/** One geometric scene, six views. Every moving plate has a model instance ID. */
const NS = 'http://www.w3.org/2000/svg';
const ACTIVE = new Set(['in-transit', 'queued', 'waiting', 'stranded']);
const EDGES = [
  ['source', 'S', 'A'], ['upper', 'A', 'B'], ['upper-join', 'B', 'D'],
  ['lower', 'A', 'C'], ['lower-join', 'C', 'D'], ['delivery', 'D', 'R'],
];
const D = [
  {S:[.09,.56],A:[.30,.59],B:[.62,.43],C:[.57,.69],D:[.81,.57],R:[.90,.48]},
  {S:[.28,.51],A:[.48,.57],B:[.67,.45],C:[.65,.69],D:[.82,.59],R:[.92,.48]},
  {S:[.07,.51],A:[.25,.57],B:[.51,.44],C:[.54,.69],D:[.80,.58],R:[.93,.58]},
  {S:[.025,.43],A:[.14,.49],B:[.27,.41],C:[.25,.64],D:[.36,.59],R:[.43,.59]},
  {S:[.13,.46],A:[.28,.52],B:[.51,.43],C:[.51,.65],D:[.76,.59],R:[.89,.54]},
  {S:[.07,.69],A:[.23,.72],B:[.43,.69],C:[.45,.76],D:[.72,.71],R:[.92,.70]},
];
const M = [
  {S:[.5,.31],A:[.5,.39],B:[.21,.49],C:[.80,.51],D:[.5,.61],R:[.5,.68]},
  {S:[.5,.35],A:[.5,.43],B:[.20,.52],C:[.80,.54],D:[.5,.62],R:[.5,.69]},
  {S:[.12,.45],A:[.37,.46],B:[.18,.55],C:[.81,.56],D:[.5,.65],R:[.5,.70]},
  {S:[.15,.34],A:[.17,.41],B:[.35,.40],C:[.16,.55],D:[.35,.56],R:[.50,.60]},
  {S:[.5,.43],A:[.5,.48],B:[.18,.54],C:[.81,.57],D:[.5,.65],R:[.5,.70]},
  {S:[.12,.67],A:[.22,.70],B:[.39,.66],C:[.46,.73],D:[.73,.68],R:[.90,.70]},
];
const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
const lerp = (a,b,t) => a+(b-a)*t;
const blendAt = (p,index) => Math.max(0,1-Math.abs(p-index));
function textSize(value,maximum,width,budget,minimum){
  const units=Array.from(value).reduce((n,c)=>n+(/\p{Mark}/u.test(c)?0:/[\u2e80-\u9fff]|\p{Extended_Pictographic}/u.test(c)?1:.55),0);
  let size=maximum;
  while(size>minimum && Math.ceil(Math.max(1,units)*size/width)*size*1.12>budget)size*=.94;
  return Math.max(minimum,size);
}
const el = (name, attributes={}, parent) => {
  const node=document.createElementNS(NS,name);
  for (const [k,v] of Object.entries(attributes)) node.setAttribute(k,String(v));
  if(parent)parent.append(node);
  return node;
};
const attrs=(node,values)=>{for(const[k,v]of Object.entries(values))node.setAttribute(k,String(v));};
const text=(parent,content,props={})=>{const t=el('text',props,parent);t.textContent=content;return t;};
const pathString=p=>'M '+p[0][0]+' '+p[0][1]+' C '+p[1][0]+' '+p[1][1]+' '+p[2][0]+' '+p[2][1]+' '+p[3][0]+' '+p[3][1];
function bezier(p,t){
  const u=1-t;
  return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]];
}
function curve(a,b,mobile){
  const dx=b[0]-a[0],dy=b[1]-a[1];
  return mobile && Math.abs(dy)>Math.abs(dx)*.25
    ? [a,[a[0],a[1]+dy*.58],[b[0],b[1]-dy*.58],b]
    : [a,[a[0]+dx*.43,a[1]+dy*.06],[b[0]-dx*.40,b[1]-dy*.05],b];
}
function setPos(node,x,y,width){
  node.style.left=x+'px';node.style.top=y+'px';
  if(width!==undefined)node.style.width=width+'px';
}

export class Sculpture {
  constructor(svg,{onSelect=()=>{},onToggle=()=>{}}={}){
    this.svg=svg;this.onSelect=onSelect;this.onToggle=onToggle;
    this.packetNodes=new Map();this.copyNodes=new Map();this.slotNodes=new Map();
    this.lastGeometry='';this.width=0;this.height=0;
    this.receiver=document.querySelector('#receiver-display');
    this.sender=document.querySelector('#sender-message');
    this.retainedLabel=document.querySelector('#retained-label');
    this.bufferLabel=document.querySelector('#buffer-label');
    this.ackCaption=document.querySelector('#ack-caption');
    svg.innerHTML='<defs>'+
      '<linearGradient id="track-top" x1="0" x2="0" y1="150" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#565750"/><stop offset="1" stop-color="#3b3d36"/></linearGradient>'+
      '<linearGradient id="enamel" x1="0" x2=".2" y1="0" y2="1"><stop stop-color="#ed7852"/><stop offset=".22" stop-color="#dd5632"/><stop offset="1" stop-color="#c34325"/></linearGradient>'+
      '<linearGradient id="stone" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e5dece"/><stop offset="1" stop-color="#c9c2b3"/></linearGradient>'+
      '<linearGradient id="retained-face" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#f8f3e7"/><stop offset="1" stop-color="#e5decc"/></linearGradient>'+
      '<filter id="track-shadow" x="-30%" y="-80%" width="170%" height="280%"><feDropShadow dx="2" dy="12" stdDeviation="9" flood-color="#38352c" flood-opacity=".19"/></filter>'+
      '<filter id="plate-shadow" x="-40%" y="-50%" width="200%" height="220%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#201e18" flood-opacity=".24"/></filter>'+
      '</defs>';
    this.supports=el('g',{'aria-hidden':'true'},svg);
    this.stationBacks=el('g',{'aria-hidden':'true'},svg);
    this.sourceBox=this.makeStation(this.stationBacks);
    this.receiverBox=this.makeStation(this.stationBacks);
    this.trackGroup=el('g',{'aria-hidden':'true'},svg);
    const shadowLayer=el('g',{},this.trackGroup);
    const sideLayer=el('g',{},this.trackGroup);
    const topLayer=el('g',{},this.trackGroup);
    const detailLayer=el('g',{},this.trackGroup);
    this.returnGroup=el('g',{'aria-hidden':'true'},svg);
    this.tracks=new Map();this.curves=new Map();this.returns=new Map();this.pillars=new Map();
    for(const[id]of EDGES){
      const g=el('g',{},topLayer);
      const shadow=el('path',{fill:'none',stroke:'#292b29','stroke-linecap':'round',filter:'url(#track-shadow)'},shadowLayer);
      const side=el('path',{fill:'none',stroke:'#292b25','stroke-linecap':'round'},sideLayer);
      const top=el('path',{fill:'none',stroke:'url(#track-top)','stroke-linecap':'round'},g);
      const edge=el('path',{fill:'none',stroke:'#a5a496','stroke-opacity':'.35'},detailLayer);
      const line=el('path',{fill:'none',stroke:'#73756b','stroke-opacity':'.16'},detailLayer);
      const back=el('path',{fill:'none',stroke:'#526056','stroke-opacity':'.52'},this.returnGroup);
      const pillar=el('rect',{fill:'url(#track-top)',rx:'6'},this.supports);
      this.tracks.set(id,{g,shadow,side,top,edge,line,back});
      this.pillars.set(id,pillar);
    }
    this.racks=el('g',{},svg);
    this.copyBase=el('rect',{fill:'url(#track-top)',rx:'3',filter:'url(#plate-shadow)'},this.racks);
    this.slotBase=el('rect',{fill:'url(#track-top)',rx:'3',filter:'url(#plate-shadow)'},this.racks);
    this.copyGroup=el('g',{'aria-label':'Copies kept at the sender'},this.racks);
    this.slotGroup=el('g',{'aria-label':'Received blocks in original byte order'},this.racks);
    this.packetGroup=el('g',{},svg);
    this.gateGroup=el('g',{},svg);this.gates=new Map();
    for(const id of ['upper','lower']){
      const g=el('g',{class:'track-hit',role:'button',tabindex:'0','data-channel':id},this.gateGroup);
      const ring=el('rect',{class:'gate-ring',fill:'#f1ebdd',stroke:'#777a70','stroke-width':'1',rx:'3'},g);
      const bar=el('path',{fill:'none',stroke:'#292b29','stroke-width':'2','stroke-linecap':'square'},g);
      const label=text(g,'',{fill:'#292b29','font-family':'Plex Mono, monospace','text-anchor':'middle'});
      const state=text(g,'',{fill:'#625f55','font-family':'Plex Mono, monospace','text-anchor':'middle'});
      g.addEventListener('click',()=>this.onToggle(id));
      g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onToggle(id);}});
      this.gates.set(id,{g,ring,bar,label,state});
    }
    this.sourceCaption=text(svg,'SENDER',{fill:'#292b29','font-family':'Plex Mono, monospace','letter-spacing':'2'});
    this.ackDirection=text(svg,'ACKNOWLEDGEMENTS RETURN',{fill:'#55766a','font-family':'Plex Mono, monospace','letter-spacing':'1.2'});
    this.resize();
  }
  makeStation(parent){
    const g=el('g',{},parent);
    const shadow=el('rect',{fill:'#292b29',opacity:'.08',rx:'7'},g);
    const side=el('path',{fill:'#b7b09f'},g);
    const top=el('path',{fill:'#ece6d8'},g);
    const face=el('rect',{fill:'url(#stone)',rx:'2'},g);
    const inset=el('rect',{fill:'#383a33',rx:'2'},g);
    return {g,shadow,side,top,face,inset};
  }
  station(box,x,y,w,h,depth,insetY,insetW){
    const d=depth;
    attrs(box.shadow,{x:x+5,y:y+13,width:w+d,height:h});
    attrs(box.side,{d:'M '+(x+w)+' '+y+' l '+d+' '+(-d*.6)+' v '+h+' l '+(-d)+' '+(d*.6)+' Z'});
    attrs(box.top,{d:'M '+x+' '+y+' l '+d+' '+(-d*.6)+' h '+w+' l '+(-d)+' '+(d*.6)+' Z'});
    attrs(box.face,{x,y,width:w,height:h});
    attrs(box.inset,{x:x+(w-insetW)/2,y:insetY,width:insetW,height:Math.min(h*.23,50)});
  }
  resize(){
    const r=this.svg.getBoundingClientRect();
    this.width=r.width||1440;this.height=r.height||900;
    attrs(this.svg,{viewBox:'0 0 '+this.width+' '+this.height});
    this.lastGeometry='';
  }
  selectablePlate(parent,index,role){
    const g=el('g',{class:'packet',role:'button',tabindex:'0','data-block-index':index,'data-role':role},parent);
    const foot=el('rect',{fill:'#20231e',rx:'2'},g);
    const side=el('path',{fill:'#af3b21'},g);
    const face=el('rect',{class:'packet-face',rx:'3','stroke-width':'1.15'},g);
    const shine=el('path',{fill:'none',stroke:'#f9c89a','stroke-opacity':'.65','stroke-width':'1'},g);
    const label=text(g,'',{fill:'#f7efdf','font-family':'Plex Mono, monospace'});
    const sub=text(g,'',{fill:'#f7efdf','font-family':'Plex Mono, monospace'});
    const arrow=el('path',{fill:'none',stroke:'#f7efdf','stroke-width':'1.1'},g);
    g.addEventListener('click',()=>this.onSelect(index,role));
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onSelect(index,role);}});
    return {g,foot,side,face,shine,label,sub,arrow};
  }
  updatePlate(node,{x,y,w,h,number,fill,role,selected=false,received=false,attempt=1,large=false,missing=false,sub='',ack=false}){
    const d=Math.max(2,w*.07);
    attrs(node.g,{transform:'translate('+x+' '+y+')'});
    attrs(node.foot,{x:-3,y:h-1,width:w+8,height:Math.max(4,h*.15)});
    attrs(node.face,{width:w,height:h,fill,stroke:selected?'#a63620':missing?'#a63620':role==='copy'?'#77776b':'#eaba95','stroke-width':selected?2.5:missing?1.8:1,'stroke-dasharray':missing?'5 4':'none'});
    attrs(node.side,{d:'M '+w+' 1 l '+d+' '+(-d*.45)+' v '+h+' l '+(-d)+' '+(d*.45)+' Z',fill:ack?'#3f5b50':role==='copy'||missing?'#c4bba9':received?'#bdb5a4':'#9c341d'});
    attrs(node.shine,{d:'M 2 1 L '+(w-1)+' 1',opacity:missing?0:1});
    const dark=role==='copy'||received||missing;
    attrs(node.label,{x:w*.14,y:large?h*.39:h*.65,'font-size':large?h*.24:h*(attempt>1?.30:.38),fill:dark?'#292b29':'#fff2d9'});
    node.label.textContent=String(number).padStart(2,'0')+(attempt>1?'·'+attempt:'');
    attrs(node.sub,{x:w*.12,y:h*.78,'font-size':h*.18,fill:dark?'#625f55':'#fff2d9',opacity:large?1:0});
    node.sub.textContent=sub;
    attrs(node.arrow,{d:ack?'M '+(w*.82)+' '+(h*.5)+' h '+(-w*.20)+' m '+(w*.07)+' '+(-h*.10)+' l '+(-w*.07)+' '+(h*.10)+' '+(w*.07)+' '+(h*.10):'M '+(w*.68)+' '+(h*.5)+' h '+(w*.18)+' m '+(-w*.06)+' '+(-h*.10)+' l '+(w*.06)+' '+(h*.10)+' '+(-w*.06)+' '+(h*.10),stroke:dark?'#292b29':'#fff2d9',opacity:large||role==='copy'||received?0:1});
  }
  render(snapshot,progress,{reducedMotion=false,selectedBlock=null,selectedRole=null,reveal=1}={}){
    const w=this.width,h=this.height,compact=w>600&&h<620,mobile=w<=760&&!compact;
    const s=mobile?clamp(w/390,.76,1.9):clamp(w/1440,.6,2.75);
    const p=clamp(progress,0,5),from=Math.floor(p),to=Math.min(5,from+1),t=p-from,poses=mobile?M:D;
    const points={};
    for(const name of ['S','A','B','C','D','R'])points[name]=[lerp(poses[from][name][0],poses[to][name][0],t)*w,lerp(poses[from][name][1],poses[to][name][1],t)*h];
    const copy=blendAt(p,1),buffer=blendAt(p,3),ack=blendAt(p,4),end=blendAt(p,5);
    const reviewing=Boolean(snapshot.isRecorded);
    const hero=blendAt(p,0),route=blendAt(p,2);
    if(mobile){
      // Finish the rail above the receiver typography, then dock into its top.
      const targetR=h-330;
      const baseS=Math.max(224,h*.31);
      const verticalPos=(start,end)=>({S:start,A:lerp(start,end,.22),B:lerp(start,end,.50),C:lerp(start,end,.59),D:lerp(start,end,.80),R:end});
      const ordinary=verticalPos(baseS+copy*30,Math.max(baseS+75,targetR));
      const top=this.svg.getBoundingClientRect().top;
      const routeControl=document.querySelector('#route-controls'),ackControl=document.querySelector('#ack-control');
      const routeBottom=routeControl.hidden?0:routeControl.getBoundingClientRect().bottom-top;
      const ackBottom=ackControl.hidden?0:ackControl.getBoundingClientRect().bottom-top;
      const routeStart=Math.max(h*.27+118,baseS+35,routeBottom+33*s);
      const ackStart=Math.max(280,h*.31+55,ackBottom+34*s);
      const compactRoute=verticalPos(routeStart,Math.max(targetR,routeStart+8*s));
      const compactAck=verticalPos(ackStart,Math.max(targetR,ackStart+8*s));
      const bufferPoints={S:[.10*w,.36*h],A:[.16*w,.43*h],B:[.27*w,.40*h],C:[.17*w,.55*h],D:[.34*w,.57*h],R:[.40*w,.59*h]};
      for(const name of Object.keys(points)){
        let y=ordinary[name];
        y=lerp(y,compactRoute[name],route);y=lerp(y,compactAck[name],ack);
        points[name][1]=lerp(y,bufferPoints[name][1],buffer);
        points[name][0]=lerp(points[name][0],bufferPoints[name][0],buffer);
      }
    }
    const captionBox=document.querySelector('#scene-caption').getBoundingClientRect();
    const sceneBox=this.svg.getBoundingClientRect();
    const captionTop=captionBox.top-sceneBox.top;
    const endingY=Math.max(h*(reviewing?.39:.49),Math.min(h*.65,captionTop-(mobile?45:65)*s));
    const finalOffsets={S:-7,A:0,B:-9,C:12,D:1,R:-4};
    for(const name of Object.keys(points))points[name][1]=lerp(points[name][1],endingY+finalOffsets[name]*s,end);
    const thickness=mobile?lerp(22*s,5*s,end):lerp(48*s,8*s,end);
    const depth=mobile?7*s:19*s;
    const returnOffset=(mobile?12:32)*s;
    const geometryKey=[w,h,p.toFixed(5),reveal.toFixed(3),captionTop.toFixed(1),snapshot.message,snapshot.readablePrefix,snapshot.receiverStatus,snapshot.edges.map(e=>e.enabled?'1':'0').join('')].join(':');
    const geometryChanged=geometryKey!==this.lastGeometry;
    if(geometryChanged){
      this.lastGeometry=geometryKey;
      for(const[id,a,b]of EDGES){
        const pts=curve(points[a],points[b],mobile);this.curves.set(id,pts);
        const ret=pts.map(([x,y])=>mobile?[x+returnOffset,y]:[x,y+returnOffset]);
        this.returns.set(id,ret);
        const tr=this.tracks.get(id),d=pathString(pts);
        const isEnabled=snapshot.edges.find(e=>e.id===id)?.enabled!==false;
        const opacity=1;
        attrs(tr.g,{opacity});
        attrs(tr.shadow,{d,'stroke-width':thickness+2,transform:'translate(0 '+(depth+3*s)+')',opacity:.64});
        attrs(tr.side,{d,'stroke-width':thickness,transform:'translate(0 '+depth+')'});
        attrs(tr.top,{d,'stroke-width':thickness,transform:'translate(0 '+((1-reveal)*6*s)+')'});
        attrs(tr.edge,{d,'stroke-width':1.5*s,transform:'translate(0 '+(-thickness*.43)+')',opacity:1-end*.7});
        attrs(tr.line,{d,'stroke-width':1*s,transform:'translate(0 '+(thickness*.15)+')',opacity:1-end*.7});
        attrs(tr.back,{d:pathString(ret),'stroke-width':Math.max(2,thickness*.12),opacity:lerp(.55,.9,ack)*(isEnabled?1:.35)});
        const mid=bezier(pts,.58),pillar=this.pillars.get(id);
        attrs(pillar,{x:mid[0]-11*s,y:mid[1]+depth,width:22*s,height:mobile?12*s:(26+35*(id==='lower'?1:.55))*s,opacity:(mobile?.28:.46)*(1-end)});
      }
      let sourceW=mobile?lerp(116*s,255*s,copy):(lerp(175*s,440*s,copy));
      let sourceH=mobile?lerp(44*s,58*s,copy):lerp(155*s,90*s,copy);
      sourceW=lerp(sourceW,80*s,buffer);
      sourceH=lerp(sourceH,42*s,buffer);
      sourceH=lerp(sourceH,(mobile?29:75)*s,ack);
      sourceH=lerp(sourceH,(mobile?28:155)*s,route);
      const sourceX=points.S[0]-sourceW*(mobile?.5:.60),sourceY=points.S[1]-sourceH+depth;
      this.station(this.sourceBox,sourceX,sourceY,sourceW,sourceH,depth,points.S[1]-thickness*.65,thickness*1.5);
      this.sourceBox.g.setAttribute('opacity',String((1-end)*lerp(1,.45,buffer)));
      const rw=mobile?lerp(210*s,250*s,copy):(270*s),rh=mobile?68*s:270*s;
      const rx=mobile?points.R[0]-rw/2:Math.min(points.R[0]-94*s,w-280*s),ry=mobile?points.R[1]+18*s:points.R[1]-198*s;
      this.station(this.receiverBox,rx,ry,rw,rh,depth,points.R[1]-thickness*.4,thickness*1.4);
      this.receiverBox.g.setAttribute('opacity',String((1-buffer)*(1-end)));
      attrs(this.sourceCaption,{x:sourceX+15*s,y:sourceY+(mobile?16:lerp(32,-12,ack))*s,'font-size':(mobile?8:10)*s,opacity:(1-clamp(copy*2))*(1-end)*lerp(1,.5,buffer)});
      attrs(this.ackDirection,{opacity:0});

      // Typography is native DOM. Positions share the station layout, not a screenshot.
      let display={x:rx+22*s,y:ry+31*s,width:rw-44*s,size:46*s,label:10*s,gap:22*s};
      if(mobile)display={x:rx+15*s,y:ry+8*s,width:rw-30*s,size:23*s,label:7.5*s,gap:5*s};
      const bufDisplay=mobile?{x:w*.46,y:h*.36,width:w*.49,size:36*s,label:8*s,gap:8*s}:{x:w*.40,y:h*.34,width:w*.53,size:77*s,label:11*s,gap:13*s};
      const endDisplay=mobile?{x:w*.07,y:h*(reviewing?.24:.37),width:w*.86,size:43*s,label:9*s,gap:16*s}:{x:w*.095,y:h*(reviewing?.25:compact?.29:.355),width:w*.81,size:(compact?50:90)*s,label:12*s,gap:(compact?15:21)*s};
      for(const k of Object.keys(display)){display[k]=lerp(display[k],bufDisplay[k],buffer);display[k]=lerp(display[k],endDisplay[k],end);}
      const shownText=snapshot.receiverComplete?snapshot.assembledMessage:(snapshot.readablePrefix||'Not yet.')+'  □';
      const messageBudget=mobile?lerp(42*s,Math.max(70,endingY-display.y-65*s),Math.max(buffer,end)):lerp(110*s,Math.max(90,endingY-display.y-80*s),Math.max(buffer,end));
      display.size=textSize(shownText,display.size,display.width,messageBudget,mobile?13:18);
      setPos(this.receiver,display.x,display.y,display.width);
      this.receiver.style.setProperty('--message-size',display.size+'px');
      this.receiver.style.setProperty('--label-size',display.label+'px');
      this.receiver.style.setProperty('--message-gap',display.gap+'px');
      this.receiver.style.setProperty('--gap-size',Math.max(8,9*s)+'px');
      this.receiver.style.opacity=String(lerp(1,.78,copy));
      // The source sentence takes the text area only after the outgoing chapter
      // has vacated it, and leaves before the next chapter title returns.
      const copyTextOpacity=clamp((copy-.55)/.3);
      this.sender.hidden=copyTextOpacity<=0;
      setPos(this.sender,mobile?w*.09:w*.065,mobile?points.S[1]-115*s:h*(compact?.28:.335),mobile?w*.82:w*.36);
      this.sender.style.opacity=String(copyTextOpacity);
      this.sender.style.setProperty('--source-size',textSize(snapshot.message,(mobile?17:32)*s,mobile?w*.82:w*.36,(mobile?55:65)*s,mobile?12:16)+'px');
      this.sender.style.setProperty('--label-size',(mobile?8:10)*s+'px');
      this.retainedLabel.hidden=copyTextOpacity<=0;
      setPos(this.retainedLabel,sourceX+8*s,points.S[1]+35*s);
      this.retainedLabel.style.opacity=String(copyTextOpacity);this.retainedLabel.style.fontSize=Math.max(8,10*s)+'px';
      this.bufferLabel.hidden=buffer<.05;
      setPos(this.bufferLabel,mobile?w*.07:w*.39,mobile?Math.min(h*.65,captionTop-72*s)+62*s:h*.81);
      this.bufferLabel.style.opacity=String(buffer);this.bufferLabel.style.fontSize=Math.max(8,10*s)+'px';
      this.ackCaption.hidden=ack<.05;
      const headingBottom=document.querySelector('#scene-heading').getBoundingClientRect().bottom-sceneBox.top;
      setPos(this.ackCaption,mobile?w*.052:w*.56,mobile?headingBottom+6:h*.76);
      this.ackCaption.style.opacity=String(ack);this.ackCaption.style.fontSize=Math.max(8,10*s)+'px';
      this.receiver.querySelector('.gap-focus').style.display=buffer>.8||end>.8?'flex':'';
    }
    // Both shelves map exactly to block IDs. Count never comes from artwork.
    const count=snapshot.chunks.length;
    const copyWidth=mobile?lerp(108*s,238*s,copy):lerp(146*s,405*s,copy);
    const cw=Math.min(copyWidth/count-4*s,copy>0.5?60*s:25*s);
    const ch=lerp(mobile?20*s:31*s,mobile?43*s:70*s,copy);
    const startCopyX=points.S[0]-copyWidth*(mobile?.5:.57),copyY=points.S[1]-ch-(mobile?4:14)*s;
    attrs(this.copyBase,{x:startCopyX-6*s,y:copyY+ch-2*s,width:copyWidth+8*s,height:10*s,opacity:1-end});
    this.copyGroup.setAttribute('opacity',String((1-end)*lerp(1,.35,buffer)));
    let slotX=mobile?points.R[0]-90*s:Math.min(points.R[0]-68*s,w-230*s);
    let slotY=mobile?points.R[1]+100*s:points.R[1]-2*s;
    let slotWidth=mobile?180*s:210*s;
    let slotH=mobile?23*s:32*s;
    slotX=lerp(slotX,mobile?w*.07:w*.39,buffer);
    slotY=lerp(slotY,mobile?Math.min(h*.65,captionTop-72*s):h*.67,buffer);
    slotWidth=lerp(slotWidth,mobile?w*.86:w*.56,buffer);
    slotH=lerp(slotH,mobile?47*s:92*s,buffer);
    slotX=lerp(slotX,mobile?w*.09:w*.12,end);
    slotY=lerp(slotY,endingY-(mobile?42:50)*s,end);
    slotWidth=lerp(slotWidth,mobile?w*.82:w*.76,end);
    slotH=lerp(slotH,mobile?23*s:37*s,end);
    const sw=Math.min((slotWidth-(count-1)*5*s)/count,buffer>.5?150*s:70*s);
    const actualSlotWidth=(sw+5*s)*count-5*s;
    attrs(this.slotBase,{x:slotX-7*s,y:slotY+slotH-3*s,width:actualSlotWidth+14*s,height:(buffer>0.3?20:8)*s,opacity:1-end*.35});
    const visibleBlocks=new Set();
    for(const block of snapshot.chunks){
      visibleBlocks.add(block.id);
      let c=this.copyNodes.get(block.id),r=this.slotNodes.get(block.id);
      if(!c){c=this.selectablePlate(this.copyGroup,block.index,'copy');this.copyNodes.set(block.id,c);}
      if(!r){r=this.selectablePlate(this.slotGroup,block.index,'received');this.slotNodes.set(block.id,r);}
      c.g.hidden=false;r.g.hidden=false;
      c.g.style.display='';r.g.style.display='';
      attrs(c.g,{'aria-label':'Block '+block.number+', '+(block.retained?'retained copy':'copy released after acknowledgement')+', bytes '+block.start+' to '+block.byteEnd+', sent '+block.attempts+' times'});
      attrs(r.g,{'aria-label':'Block '+block.number+', '+(block.received?(block.arrivedEarly?'arrived early':'received'):'still missing')+', bytes '+block.start+' to '+block.byteEnd});
      this.updatePlate(c,{x:startCopyX+block.index*(copyWidth/count),y:copyY,w:Math.max(6,cw),h:ch,number:block.number,fill:block.retained?'url(#retained-face)':'#d4ccbb',role:'copy',large:copy>.4,selected:selectedBlock===block.index&&selectedRole==='copy',sub:block.start+'–'+block.byteEnd});
      c.g.setAttribute('opacity',block.retained?'1':'.24');
      c.g.setAttribute('tabindex',copy>.25?'0':'-1');
      this.updatePlate(r,{x:slotX+block.index*(sw+5*s),y:slotY,w:Math.max(6,sw),h:slotH,number:block.number,fill:block.received?'url(#retained-face)':'#e5dece',role:'received',received:true,large:buffer>.4,missing:!block.received,selected:selectedBlock===block.index&&selectedRole==='received',sub:block.start+'–'+block.byteEnd});
      r.g.setAttribute('data-received',String(block.received));
      r.g.setAttribute('data-block-id',block.id);
      if(cw<22*s){c.label.setAttribute('opacity','0');c.sub.setAttribute('opacity','0');c.g.setAttribute('tabindex','-1');}
      else c.label.setAttribute('opacity','1');
      if(sw<22*s){r.label.setAttribute('opacity','0');r.sub.setAttribute('opacity','0');r.g.setAttribute('tabindex','-1');}
      else {r.label.setAttribute('opacity','1');r.g.setAttribute('tabindex','0');}
    }
    for(const[key,n]of this.copyNodes)if(!visibleBlocks.has(key)){n.g.remove();this.copyNodes.delete(key);}
    for(const[key,n]of this.slotNodes)if(!visibleBlocks.has(key)){n.g.remove();this.slotNodes.delete(key);}

    const shown=new Set(),queueOffsets=new Map();
    for(const instance of snapshot.instances){
      if(!ACTIVE.has(instance.status))continue;
      shown.add(instance.id);
      const isAck=instance.kind==='ack';
      let n=this.packetNodes.get(instance.id);
      if(!n){n=this.selectablePlate(this.packetGroup,instance.blockIndex,isAck?'ack':'transit');this.packetNodes.set(instance.id,n);}
      const edgeBase=instance.edgeId?.replace(/-return$/,'');
      let pos,frac=instance.progress;
      if(reducedMotion)frac=Math.floor(frac*3)/3;
      if((instance.status==='in-transit'||instance.status==='stranded')&&this.curves.has(edgeBase)){
        const pts=isAck?this.returns.get(edgeBase):this.curves.get(edgeBase);
        pos=bezier(pts,isAck?1-frac:frac);
      }else{
        const key=instance.node+':'+instance.kind;
        const offset=queueOffsets.get(key)||0;queueOffsets.set(key,offset+1);
        const at=points[instance.node]||points.S;
        pos=[at[0]+(mobile?offset*7*s:-offset*17*s),at[1]+(mobile?offset*8*s:-offset*4*s)+(isAck?returnOffset:0)];
      }
      const pw=(mobile?42:72)*s*(isAck?.8:1)*(1-end*.25),ph=(mobile?26:44)*s*(isAck?.72:1)*(1-end*.25);
      this.updatePlate(n,{x:pos[0]-pw*.5,y:pos[1]-ph-thickness*.10,w:pw,h:ph,number:instance.blockIndex+1,fill:isAck?'#55766a':'url(#enamel)',role:'transit',ack:isAck,attempt:isAck?1:instance.attempt,selected:selectedBlock===instance.blockIndex&&selectedRole==='transit'});
      attrs(n.g,{'data-instance-id':instance.id,'data-kind':instance.kind,'data-edge':instance.edgeId||'', 'data-progress':instance.progress.toFixed(6),'data-status':instance.status,filter:'url(#plate-shadow)','aria-label':(isAck?'Acknowledgement':'Data')+' for block '+String(instance.blockIndex+1).padStart(2,'0')+', attempt '+instance.attempt+', '+instance.status+(instance.edgeId?' on '+instance.edgeId:'')});
      n.g.setAttribute('opacity',instance.status==='stranded'?'.64':'1');
    }
    for(const[key,n]of this.packetNodes)if(!shown.has(key)){n.g.remove();this.packetNodes.delete(key);}
    for(const[id,gate]of this.gates){
      const edge=snapshot.edges.find(e=>e.id===id),pts=this.curves.get(id),at=bezier(pts,mobile?.68:.48);
      const radius=mobile?19*s:24*s,gx=at[0],gy=at[1]+(mobile?24:45)*s;
      const gateOpacity=Math.max(.2,1-end)*(1-buffer*.8);
      attrs(gate.g,{transform:'translate('+gx+' '+gy+')',opacity:gateOpacity,'aria-label':(edge.enabled?'Close ':'Open ')+id+' channel','aria-pressed':edge.enabled,'aria-disabled':snapshot.terminal||snapshot.isRecorded?'true':'false',tabindex:end>.8||buffer>.9?'-1':'0'});
      attrs(gate.ring,{x:-radius,y:-radius,width:radius*2,height:radius*2,rx:mobile?radius:4*s,fill:edge.enabled?'#e9e3d6':'#f1ebdd',stroke:edge.enabled?'#7a7d72':'#a63620'});
      attrs(gate.bar,{d:edge.enabled?'M '+(-radius*.4)+' 0 H '+radius*.4:'M '+(-radius*.35)+' '+(-radius*.35)+' L '+radius*.35+' '+radius*.35+' M '+radius*.35+' '+(-radius*.35)+' L '+(-radius*.35)+' '+radius*.35,stroke:edge.enabled?'#292b29':'#a63620'});
      attrs(gate.label,{y:radius+14*s,'font-size':(mobile?7:8)*s,opacity:route>.2?1:.6});
      gate.label.textContent=mobile?(id==='upper'?'A':'B'):(id==='upper'?'CHANNEL A':'CHANNEL B');
      attrs(gate.state,{y:radius+26*s,'font-size':8*s,opacity:mobile?0:route});
      gate.state.textContent=edge.enabled?'OPEN':'CLOSED';
    }
    this.svg.setAttribute('aria-label','Transport sculpture. Receiver: '+snapshot.receiverStatus+'. Sender: '+snapshot.senderStatus+'. '+snapshot.receivedBytes+' of '+snapshot.totalBytes+' bytes received. '+(snapshot.isRecorded?'Recorded moment.':'Current round.'));
  }
  destroy(){this.svg.replaceChildren();this.packetNodes.clear();this.copyNodes.clear();this.slotNodes.clear();}
}
