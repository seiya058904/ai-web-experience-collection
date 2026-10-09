/** Pure camera choreography. The displayed road and registered terrain never move. */
export interface Point3 { x: number; y: number; z: number }
export interface CameraPose extends Point3 { span: number; pitch: number; yaw: number }
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function smoother(a: number, b: number, value: number) {
  const t = clamp((value - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export const scaleProgress = (a: number, b: number, span: number) =>
  smoother(Math.log(a), Math.log(b), Math.log(Math.max(span, 1e-9)));
const smooth = (a:number,b:number,v:number) => { const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
const length = (a: Point3, b: Point3) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const blend = (a: Point3,b: Point3,t: number): Point3 => ({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)});
export interface RouteGuide { readonly length: number; readonly sourceLength: number; readonly sampleCount: number; sample(fraction: number): Point3 }

/** 8 m resampling, a symmetric 40 m spatial filter, then a C2 cubic B-spline.
 * Five-point quadrature and Newton inversion give distance-based progression;
 * no prior frame, velocity accumulator, or time-based camera following is used.
 */
export function createRouteGuide(input: readonly Point3[]): RouteGuide {
  if (input.length < 2 || input.some(p => ![p.x,p.y,p.z].every(Number.isFinite))) throw new Error('ATLAS camera guide needs finite registered road points.');
  const points=input.map(p=>({x:p.x,y:p.y,z:p.z}));
  const distances=[0];
  for(let i=1;i<points.length;i++) distances.push(distances[i-1]+length(points[i],points[i-1]));
  const sourceLength=distances.at(-1)!;
  if(sourceLength<=0) throw new Error('ATLAS road has no measurable length.');
  const count=Math.ceil(sourceLength/.008)+1, step=sourceLength/(count-1);
  let cursor=1;
  const samples=Array.from({length:count},(_,i)=>{
    const d=i*step;
    while(cursor<points.length-1&&distances[cursor]<d)cursor++;
    return blend(points[cursor-1],points[cursor],(d-distances[cursor-1])/Math.max(1e-12,distances[cursor]-distances[cursor-1]));
  });
  const radius=Math.ceil(.12/step);
  const controls=samples.map((_,i)=>{
    const p={x:0,y:0,z:0};let sum=0;
    for(let j=-radius;j<=radius;j++){
      const weight=Math.exp(-.5*(j*step/.04)**2), q=samples[clamp(i+j,0,count-1)];
      p.x+=q.x*weight;p.y+=q.y*weight;p.z+=q.z*weight;sum+=weight;
    }
    p.x/=sum;p.y/=sum;p.z/=sum;return p;
  });
  function evaluate(u: number, derivative=false): Point3 {
    u=clamp(u,0,count-1);const k=Math.min(count-2,Math.floor(u)),t=u-k,t2=t*t,t3=t2*t;
    const w=derivative?[-.5*(1-t)**2,1.5*t2-2*t,-1.5*t2+t+.5,.5*t2]:[(1-3*t+3*t2-t3)/6,(4-6*t2+3*t3)/6,(1+3*t+3*t2-3*t3)/6,t3/6];
    const p={x:0,y:0,z:0};for(let j=0;j<4;j++){const q=controls[clamp(k+j-1,0,count-1)];p.x+=q.x*w[j];p.y+=q.y*w[j];p.z+=q.z*w[j];}return p;
  }
  const gx=[0,-.5384693101056831,.5384693101056831,-.906179845938664,.906179845938664];
  const gw=[.5688888888888889,.4786286704993665,.4786286704993665,.2369268850561891,.2369268850561891];
  function integrate(a:number,b:number){const half=(b-a)/2,mid=(a+b)/2;let sum=0;for(let i=0;i<5;i++){const v=evaluate(mid+half*gx[i],true);sum+=gw[i]*Math.hypot(v.x,v.y,v.z);}return half*sum;}
  const arc=[0];for(let i=0;i<count-1;i++)arc.push(arc[i]+integrate(i,i+1));
  const total=arc.at(-1)!;
  return {length:total,sourceLength,sampleCount:count,sample(fraction:number){
    const d=clamp(fraction)*total;let lo=0,hi=count-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(arc[mid]<=d)lo=mid;else hi=mid;}
    let u=lo+(d-arc[lo])/Math.max(1e-12,arc[hi]-arc[lo]);
    for(let i=0;i<5;i++){const v=evaluate(u,true),speed=Math.hypot(v.x,v.y,v.z);if(speed<1e-12)break;u=clamp(u-(arc[lo]+integrate(lo,u)-d)/speed,lo,hi);}
    return evaluate(u);
  }};
}

export function refineCamera(p:number, original:CameraPose, mobile:boolean, guide?:RouteGuide){
  const pose={...original};
  if(p>.735){
    const approach=smoother(.735,.787,p);
    pose.span=p<=.815?Math.exp(mix(Math.log(1.85),Math.log(.46),approach)):
      p<=.99?Math.exp(mix(Math.log(.46),Math.log(15000),smoother(.815,.99,p))):original.span;
    pose.pitch=p<=.825?mix(1.04,1.25,approach):p<.97?mix(1.25,.15,smoother(.825,.97,p)):original.pitch;
    pose.yaw=p<=.815?mix(-.38,-.2,approach):mix(-.2,.1,smoother(.815,.99,p));
    const regional=scaleProgress(3,100,pose.span),global=scaleProgress(800,15000,pose.span);
    pose.x=mix(mix(-.55,-8,regional),-2850,global);
    pose.y=mix(mix(.78,0,regional),-6371,global);
    pose.z=mix(mix(.08,4,regional),500,global);
  }
  const baseSpan=pose.span;
  if(mobile){
    const city=smooth(.6,.66,p)*(1-smooth(.875,.915,p)),globe=smooth(.95,.988,p);
    pose.span*=mix(1.23,2.45,globe);pose.x=mix(pose.x*.42,-200,globe);
    pose.x-=1.9*smooth(.505,.54,p)*(1-smooth(.582,.615,p));
    pose.z+=mix(2.4,.25,city)*(1-globe);pose.yaw*=.6;
  }
  if(guide&&p>.737&&p<.887){
    const follow=smoother(.737,.772,p)*(1-smoother(.845,.887,p));
    const q=guide.sample(mix(.24,.48,smoother(.749,.825,p)));
    const framing=pose.span/Math.sqrt(pose.span*pose.span+.83*.83);
    pose.x=mix(pose.x,q.x-(mobile?.04:.19)*framing,follow);
    pose.y=mix(pose.y,q.y,follow);pose.z=mix(pose.z,q.z,follow);
  }
  return {pose,baseSpan};
}
