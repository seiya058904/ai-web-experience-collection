import { clamp, lerp, smooth } from './model.js';

const INK='#262722',OCHRE='#9a5632';
const BODY=[1.25,0,.65,-.15,.40,-.21,-.57,-.15,-1.05,-.3,-.86,0,-1.05,.3,-.57,.15,.40,.21,.65,.15];
const WING=[.16,.12,-.12,.60,-.38,1.22,-.98,1.64,-.73,.76,-.38,.15];
export class Renderer {
  constructor(canvas,meta) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.meta=meta;
    this.width=1;this.height=1;this.ratio=1;
    this.sky=new Image();this.sky.src=import.meta.env.BASE_URL+'murmuration/sky.webp';
    this.projections=new Float32Array(meta.count*5);
    this.phase=new Float32Array(meta.count);
    this.sizes=new Float32Array(meta.count);
    for(let i=0;i<meta.count;i++){this.phase[i]=((i*2654435761)>>>0)/4294967296*Math.PI*2;this.sizes[i]=0.62+((i*1597334677)>>>0)/4294967296*0.64;}
    this.peers=new Set(meta.peers);
    this.cache=document.createElement('canvas');
    this.sky.onload=()=>{this.makeBackground();this.onBackgroundChange?.();};
  }
  resize(w,h) {
    this.width=w;this.height=h;this.ratio=Math.min(window.devicePixelRatio||1,w>2200?1:1.65);
    this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);
    this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
    this.makeBackground();
  }
  makeBackground() {
    const {width:w,height:h,ratio:r}=this;this.cache.width=Math.round(w*r);this.cache.height=Math.round(h*r);
    const c=this.cache.getContext('2d');c.setTransform(r,0,0,r,0,0);
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#e8e8e4');g.addColorStop(0.64,'#efede6');g.addColorStop(1,'#d9c5b3');c.fillStyle=g;c.fillRect(0,0,w,h);
    if(this.sky.complete&&this.sky.naturalWidth){
      const s=Math.max(w/this.sky.naturalWidth,h/this.sky.naturalHeight);
      c.drawImage(this.sky,(w-this.sky.naturalWidth*s)/2,h-this.sky.naturalHeight*s,this.sky.naturalWidth*s,this.sky.naturalHeight*s);
    }
  }
  camera(progress,data,{ending=false,rect=null}={}) {
    const w=rect?.w||this.width,h=rect?.h||this.height,portrait=w/h<0.83;
    const focus=smooth(.168,.235,progress)*(1-smooth(.435,.565,progress));
    const turn=smooth(.44,.615,progress),live=smooth(.6,.675,progress),end=ending?1:smooth(.812,.96,progress);
    const s=this.meta.selected*6;
    const wide={x:65,y:21,z:0};
    const angle=portrait?-.95:0;
    const co=Math.cos(angle),si=Math.sin(angle);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    if(live>0)for(let i=0;i<this.meta.count;i++){const j=i*6,x=data[j]*co-data[j+1]*si,y=data[j]*si+data[j+1]*co;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    const midX=live>0?(minX+maxX)/2:0,midY=live>0?(minY+maxY)/2:0;
    const groupX=lerp(lerp(wide.x,90,turn),midX*co+midY*si,live);
    const groupY=lerp(lerp(wide.y,18,turn),-midX*si+midY*co,live);
    const zoom=lerp(1,1.72,focus)*lerp(1,.85,end);
    const baseWide=(portrait?Math.min(w/176,h/280):Math.min(w/278,h/133))*lerp(1,.78,turn);
    // A continuous observing camera fits the actual saved state. Its extents
    // never feed back into the model or prescribe a shape to any agent.
    const spanX=live>0?Math.max(70,maxX-minX)*1.16:350,spanY=live>0?Math.max(55,maxY-minY)*1.16:174;
    const baseLive=portrait?Math.min((w-42)/spanX,h*.27/spanY):Math.min(w*.62/spanX,h*.53/spanY);
    const base=lerp(baseWide,baseLive,live);
    const centerX=portrait?0.53:lerp(lerp(.53,.58,turn),.63,focus);
    const centerY=portrait?lerp(.36,.28,focus):lerp(lerp(.37,.32,turn),.43,focus);
    return {x:lerp(groupX,data[s],focus),y:lerp(groupY,data[s+1],focus),
      zoom,scale:base*zoom,angle,depth:lerp(300,12,focus),
      cx:w*lerp(centerX,portrait?.50:.66,live)*(1-end*.04),
      cy:h*lerp(lerp(centerY,portrait?.24:.38,live),portrait?.25:.28,end),focus,portrait,w,h};
  }
  project(x,y,z,c) {
    const dx=x-c.x,dy=y-c.y,co=Math.cos(c.angle),si=Math.sin(c.angle),depth=clamp(c.depth/(c.depth-z),.4,3.4);
    return [c.cx+(dx*co-dy*si)*c.scale*depth,c.cy+(dx*si+dy*co)*c.scale*depth,depth];
  }
  background(ctx=this.ctx,rect=null) {
    const {width:w,height:h,ratio:r}=this;ctx.setTransform(r,0,0,r,0,0);
    if(rect){ctx.drawImage(this.cache,rect.x,rect.y,rect.w,rect.h);}else ctx.drawImage(this.cache,0,0,w,h);
  }
  draw(data,progress,time,{mark=0,rule=0,ripple=null,reduced=false,inset=null}={}) {
    const ctx=this.ctx,r=this.ratio;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.cache,0,0);
    ctx.setTransform(r,0,0,r,0,0);
    const camera=this.camera(progress,data);this.lastCamera=camera;
    this.drawFlock(ctx,data,camera,time,{mark,rule,reduced,annotation:1-smooth(.40,.44,progress)});
    if(ripple&&time-ripple.time<1.2){
      const pt=this.project(ripple.x,ripple.y,0,camera),t=(time-ripple.time)/1.2;
      ctx.beginPath();ctx.ellipse(pt[0],pt[1],14+50*t,10+34*t,0,0,Math.PI*2);ctx.strokeStyle=`rgba(154,86,50,${.45*(1-t)})`;ctx.lineWidth=1;ctx.stroke();
    }
    if(inset){
      const {x,y,w,h,amount}=inset;
      ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
      ctx.drawImage(this.cache,x,y,w,h);ctx.translate(x,y);
      const c=this.camera(.7,inset.data,{rect:{w,h}});this.drawFlock(ctx,inset.data,c,inset.time??time,{mark:0,rule:0,reduced});
      ctx.restore();ctx.strokeStyle=`rgba(38,39,34,${.35*(1-amount)})`;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
    }
  }
  drawFlock(ctx,data,c,time,{mark=0,rule=0,reduced=false,annotation=1}={}) {
    const pro=this.projections,selected=this.meta.selected;
    const co=Math.cos(c.angle),si=Math.sin(c.angle);
    const wingTime=reduced?0:time*.8;
    // Depth bins reduce state changes. Keep each bird's compound path small:
    // closing thousands of contours in one path is expensive in software Canvas.
    for(let bin=0;bin<5;bin++) {
      const opacity=(.62+bin*.08)*lerp(1,.35,c.focus*mark);
      ctx.fillStyle=`rgba(38,39,34,${opacity})`;
      for(let i=0;i<this.meta.count;i++) {
        const j=i*6,z=data[j+2];
        if(clamp(Math.floor((z+25)/10),0,4)!==bin || (mark>.05&&(i===selected||this.peers.has(i))))continue;
        const p=this.project(data[j],data[j+1],z,c);
        const vx=data[j+3]*co-data[j+4]*si,vy=data[j+3]*si+data[j+4]*co;
        const magnitude=Math.hypot(vx,vy)||1,dx=vx/magnitude,dy=vy/magnitude;
        const size=clamp(this.sizes[i]*c.scale*p[2]*.62, .65, c.portrait?13:20);
        pro[i*5]=p[0];pro[i*5+1]=p[1];pro[i*5+2]=dx;pro[i*5+3]=dy;pro[i*5+4]=size;
        if(p[0]<-35||p[0]>c.w+35||p[1]<-35||p[1]>c.h+35)continue;
        ctx.beginPath();this.birdPath(ctx,p[0],p[1],dx,dy,size,this.phase[i]+wingTime*(1+i%5*.045));ctx.fill();
      }
    }
    if(mark>.01) {
      const ids=[...this.peers,selected];
      for(const i of ids) {
        const j=i*6,p=this.project(data[j],data[j+1],data[j+2],c),vx=data[j+3]*co-data[j+4]*si,vy=data[j+3]*si+data[j+4]*co,l=Math.hypot(vx,vy)||1;
        const size=clamp(this.sizes[i]*c.scale*p[2]*.62,1,c.portrait?17:25);
        pro.set([p[0],p[1],vx/l,vy/l,size],i*5);
        ctx.beginPath();this.birdPath(ctx,p[0],p[1],vx/l,vy/l,size,this.phase[i]+wingTime);
        ctx.fillStyle=i===selected?OCHRE:INK;ctx.globalAlpha=lerp(.7,1,mark);ctx.fill();ctx.globalAlpha=1;
      }
      const j=selected*5,p=pro.subarray(j,j+5);
      if(c.focus>.5&&annotation>0){
        const alpha=smooth(.5,1,c.focus)*mark*annotation;
        ctx.strokeStyle=`rgba(154,86,50,${.6*alpha})`;ctx.lineWidth=1;ctx.setLineDash([3,6]);
        ctx.beginPath();ctx.ellipse(p[0],p[1],Math.max(30,p[4]*4.9),Math.max(22,p[4]*3.8),c.angle,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        // Only the current concept's single cue is present; no network mesh.
        let rx=0,ry=0;const subject=selected*6;
        for(const neighbor of this.peers){const at=neighbor*6,dx=data[at]-data[subject],dy=data[at+1]-data[subject+1],dz=data[at+2]-data[subject+2];
          if(rule===0){const inv=1/(dx*dx+dy*dy+dz*dz+.1);rx-=dx*inv;ry-=dy*inv;}
          else if(rule===1){rx+=data[at+3];ry+=data[at+4];}
          else{rx+=dx;ry+=dy;}
        }
        const angle=Math.atan2(rx*si+ry*co,rx*co-ry*si),length=28+16*c.focus;
        const ax=p[0]+Math.cos(angle)*p[4]*1.8,ay=p[1]+Math.sin(angle)*p[4]*1.8,bx=ax+Math.cos(angle)*length,by=ay+Math.sin(angle)*length;
        ctx.strokeStyle=`rgba(154,86,50,${.9*alpha})`;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.moveTo(bx-8*Math.cos(angle-.4),by-8*Math.sin(angle-.4));ctx.lineTo(bx,by);ctx.lineTo(bx-8*Math.cos(angle+.4),by-8*Math.sin(angle+.4));ctx.stroke();
      }
    }
  }
  birdPath(ctx,x,y,dx,dy,size,phase) {
    const flap=Math.sin(phase)*.55+.85;
    for(let k=0;k<BODY.length;k+=2){const a=BODY[k],b=BODY[k+1],px=x+(a*dx-b*dy)*size,py=y+(a*dy+b*dx)*size;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();
    for(let side=-1;side<=1;side+=2){for(let k=0;k<WING.length;k+=2){const a=WING[k],b=WING[k+1]*flap*side,px=x+(a*dx-b*dy)*size,py=y+(a*dy+b*dx)*size;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
  }
  worldPoint(x,y) {
    const c=this.lastCamera,dx=(x-c.cx)/c.scale,dy=(y-c.cy)/c.scale,co=Math.cos(c.angle),si=Math.sin(c.angle);
    return {x:c.x+dx*co+dy*si,y:c.y-dx*si+dy*co};
  }
  dispose(){this.sky.onload=null;this.onBackgroundChange=null;this.cache.width=1;this.canvas.width=1;}
}
