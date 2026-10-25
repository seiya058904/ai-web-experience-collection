import { POSES, MOBILE, COMPACT, type Pose } from './poses';
import { chapterVisibility, clamp, sceneBlend, smooth, type Destination, type Subsystem } from './mission';
import type { FlightScene } from './flight-scene';
import { engineeringStudy, mobileMachine, mobileMoon, studyAmount, type SceneLayout } from './study';

/** Asset-based rendering preserves the mission on browsers without WebGL. */
export function createRasterFlightScene(canvas:HTMLCanvasElement,onStatus:(status:string)=>void):FlightScene|null{
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx){onStatus('fallback');return null;}
  const names=['booster','interstage','upperstage','fairing','engines','earth','moon'];
  const assets:Record<string,HTMLImageElement>={};const highlights:Record<string,HTMLCanvasElement>={};let disposed=false;
  names.forEach(name=>{const img=new Image();img.decoding='async';img.src=(import.meta.env.BASE_URL + 'orbital/media/rendered/')+name+'.png';img.onload=()=>{if(disposed)return;if(!['earth','moon'].includes(name)){const highlight=document.createElement('canvas');highlight.width=img.naturalWidth;highlight.height=img.naturalHeight;const hc=highlight.getContext('2d');if(hc){hc.drawImage(img,0,0);hc.globalCompositeOperation='source-in';hc.fillStyle='#82d5f4';hc.fillRect(0,0,highlight.width,highlight.height);highlights[name]=highlight;}}onStatus('canvas');};assets[name]=img;});
  let width=1,height=1,mobile=false,pixelRatio=1,lastTime=0,destinationMix=0;
  let seed=471;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  const stars=Array.from({length:700},()=>({x:random(),y:random(),r:.3+random()*.72,a:.12+random()*.5,depth:.3+random()*.7}));
  const worldH=2*Math.tan(Math.PI/10)*26;
  const renderWidth=320,renderHeight=1600,renderPPU=121.2121212121,originX=160,originY=800;
  function resize(w:number,h:number){width=w;height=h;mobile=w<=760;pixelRatio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(3500000/(w*h)));canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);}
  function imageReady(img:HTMLImageElement){return img.complete&&img.naturalWidth>0;}
  function render(progress:number,time:number,reduced:boolean,destination:Destination,subsystem:Subsystem,layout?:SceneLayout){
    if(disposed)return;const c=ctx!;c.setTransform(pixelRatio,0,0,pixelRatio,0,0);c.clearRect(0,0,width,height);
    const b=sceneBlend(progress);const from={...POSES[b.from],...(mobile?MOBILE[b.from]:height<500?COMPACT[b.from]:{})};const to={...POSES[b.to],...(mobile?MOBILE[b.to]:height<500?COMPACT[b.to]:{})};const p={} as Pose;
    for(const k of Object.keys(from) as (keyof Pose)[])p[k]=from[k]+(to[k]-from[k])*b.mix;
    if(mobile){const fit=mobileMachine(width,height,worldH,layout),amount=chapterVisibility(progress,4);p.y+=(fit.y-p.y)*amount;p.scale+=(fit.scale-p.scale)*amount;}
    const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;const factor=mobile?1:Math.min(1.3,(width/height)/1.776);const unit=height/worldH;
    const mapX=(x:number)=>width/2+x*unit;const mapY=(y:number)=>height/2-y*unit;
    const ambient=reduced?0:time;
    c.fillStyle='#d6e8ff';for(let i=0;i<(mobile?360:stars.length);i++){const star=stars[i];const sx=((star.x+progress*.008*star.depth+(reduced?0:ambient*.000035))%1)*width;const sy=((star.y-progress*.004*star.depth+1)%1)*height;c.globalAlpha=star.a*p.star;c.beginPath();c.arc(sx,sy,star.r,0,Math.PI*2);c.fill();}c.globalAlpha=1;
    const earthX=mapX(p.ex*factor),earthY=mapY(p.ey),earthR=p.er*unit;
    function orbits(front:boolean){if(p.orbit<.005)return;c.save();c.translate(earthX,earthY);for(let i=0;i<3;i++){c.save();c.rotate(-.28-i*.5);c.strokeStyle=i===0?'#d4e6ed':'#679bb2';c.lineWidth=.7;c.globalAlpha=p.orbit*(i===0?.65:.27);c.beginPath();c.ellipse(0,0,earthR*(1.30+i*.07),earthR*(.32+i*.03),0,front?0:Math.PI,front?Math.PI:Math.PI*2);c.stroke();c.restore();}c.restore();c.globalAlpha=1;}
    orbits(false);
    if(p.earth>.003&&imageReady(assets.earth)){c.globalAlpha=p.earth;c.drawImage(assets.earth,earthX-earthR*1.07,earthY-earthR*1.07,earthR*2.14,earthR*2.14);c.globalAlpha=1;}
    orbits(true);
    const target=destination==='moon'?1:0;destinationMix=reduced?target:destinationMix+(target-destinationMix)*(1-Math.exp(-dt*7));
    const destWindow=smooth((progress-5.74)/.45)*(1-smooth((progress-6.72)/.46));
    if(destWindow*destinationMix>.001&&imageReady(assets.moon)){const fit=mobile?mobileMoon(width,height,layout):{x:mapX(6.1*factor),y:mapY(0),radius:5.25*unit};c.globalAlpha=destWindow*destinationMix;c.drawImage(assets.moon,fit.x-fit.radius,fit.y-fit.radius,fit.radius*2,fit.radius*2);c.globalAlpha=1;}
    if(progress>6.75){c.globalAlpha=smooth((progress-6.75)/.5)*.25;c.strokeStyle='#8fa9ba';c.lineWidth=.8;c.beginPath();c.moveTo(mapX(-8),mapY(2.6));c.quadraticCurveTo(mapX(1),mapY(2.5),mapX(7),mapY(-1.5));c.stroke();c.globalAlpha=1;}
    let vx=p.x*factor,vy=p.y+(reduced?0:Math.sin(ambient*.24)*.035),rz=p.rz;
    const orbital=smooth((progress-4.95)/.33)*(1-smooth((progress-5.76)/.55));
    if(orbital>0){const a=(progress-5)*2+(mobile?-2.95:-.15);vx=vx+((p.ex+Math.cos(a)*p.er*1.26)*factor-vx)*orbital;vy=vy+(p.ey-Math.sin(a)*p.er*.47-vy)*orbital;rz=rz+(-a-1.85-rz)*orbital;}
    const upper=smooth((progress-4.72)/.55);const selection=studyAmount(progress,subsystem);const selected=subsystem==='propulsion'?'engines':subsystem==='structure'?'booster':subsystem==='guidance'?'interstage':subsystem==='payload'?'fairing':'';
    c.save();c.translate(mapX(vx),mapY(vy));c.rotate(-rz);c.scale(p.scale*unit/renderPPU,p.scale*unit/renderPPU);
    // All five assets share a camera and origin. Staging is geometry-coherent.
    const parts=[['upperstage',p.split*.8,1],['booster',-p.split*1.1,1-upper],['interstage',-p.split*.4,1-upper],['engines',-p.split*1.6,1-upper],['fairing',p.split*1.55,1]] as const;
    for(const [name,offset,alpha] of parts){const img=assets[name];if(!imageReady(img)||alpha<.002)continue;const chosen=name===selected||subsystem==='structure'&&name==='upperstage';c.save();c.globalAlpha=alpha*(chosen?1:1-selection*.2);const dx=(name==='booster'||name==='engines')?-p.split*.25*(1-upper):0;c.translate(dx*renderPPU,-(offset-upper*2.6)*renderPPU);c.drawImage(img,-originX,-originY,renderWidth,renderHeight);if(chosen&&selection>.001&&highlights[name]){c.globalCompositeOperation='screen';c.globalAlpha=alpha*selection*.32;c.drawImage(highlights[name],-originX,-originY,renderWidth,renderHeight);}c.restore();}
    if(p.flame>.006){const y=(upper>.5?2.05:6+p.split*1.6)*renderPPU;const length=(upper>.5?1.5:3.5)*renderPPU*(1+(reduced?0:Math.sin(ambient*13)*.035));const radius=(upper>.5?.13:.35)*renderPPU;
      c.save();c.globalCompositeOperation='screen';const g=c.createLinearGradient(0,y,0,y+length);g.addColorStop(0,'rgba(208,232,255,'+p.flame+')');g.addColorStop(.12,'rgba(255,244,214,'+p.flame*.9+')');g.addColorStop(.48,'rgba(255,111,27,'+p.flame*.67+')');g.addColorStop(1,'rgba(255,59,8,0)');c.fillStyle=g;c.beginPath();c.moveTo(-radius,y);c.bezierCurveTo(-radius*.9,y+length*.3,-radius*.23,y+length*.7,0,y+length);c.bezierCurveTo(radius*.23,y+length*.7,radius*.9,y+length*.3,radius,y);c.closePath();c.fill();
      const glow=c.createRadialGradient(0,y,0,0,y,radius*3);glow.addColorStop(0,'rgba(255,210,130,'+p.flame*.3+')');glow.addColorStop(1,'rgba(255,91,12,0)');c.fillStyle=glow;c.fillRect(-radius*3,y-radius*3,radius*6,radius*6);c.restore();}
    if(selection>.001&&['booster','interstage','upperstage','fairing','engines'].every(name=>imageReady(assets[name]))){c.lineWidth=1.5/(p.scale*unit/renderPPU);c.lineJoin='round';for(const path of engineeringStudy(subsystem,p.split)){c.strokeStyle=path.role==='action'?'#ff6838':'#a6dbea';c.globalAlpha=selection*(path.role==='action'?1:.75);c.beginPath();path.points.forEach((point,i)=>{const x=point[0]*renderPPU,y=-point[1]*renderPPU;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();}}
    c.restore();c.globalAlpha=1;
  }
  onStatus('canvas');return{render,resize,destroy(){disposed=true;Object.values(assets).forEach(i=>{i.onload=null;});},stats:()=>({drawCalls:0,triangles:0,dpr:pixelRatio})};
}
