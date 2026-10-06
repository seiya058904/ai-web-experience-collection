/** Native scroll is the sole narrative clock. These functions contain no history. */
export const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export function smoothstep(min,max,value){const t=clamp((value-min)/(max-min));return t*t*(3-2*t);}
export function locateScene(scrollY,offsets,viewportHeight,documentHeight){
  const count=offsets.length;
  if(count<2)return{raw:0,scene:0,act:0,blend:0,ending:0};
  const y=Math.max(0,Number.isFinite(scrollY)?scrollY:0);
  let index=0;
  while(index<count-1&&y>=offsets[index+1])index++;
  if(index===count-1){
    const tail=Math.max(1,documentHeight-viewportHeight-offsets[index]);
    const local=clamp((y-offsets[index])/tail);
    return{raw:index+local,scene:index,act:index,blend:0,ending:smoothstep(.35,.98,local)};
  }
  const local=clamp((y-offsets[index])/Math.max(1,offsets[index+1]-offsets[index]));
  const blend=smoothstep(.54,1,local);
  return{raw:index+local,scene:index+blend,act:Math.round(index+blend),blend,ending:0};
}
export function panelOpacity(scene,index){return 1-smoothstep(.06,.46,Math.abs(scene-index));}
export function scrollPositionFor(raw,offsets,viewportHeight,documentHeight){
  const index=Math.min(offsets.length-1,Math.floor(Math.max(0,raw)));
  const start=offsets[index];
  const end=offsets[index+1]??Math.max(start,documentHeight-viewportHeight);
  return start+clamp(raw-index)*(end-start);
}
