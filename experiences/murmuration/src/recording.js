import { clamp, lerp } from './model.js';
export const POSITION_SCALE=64, VELOCITY_SCALE=512;
export function pack(data,out,offset=0) {
  for(let i=0;i<data.length;i++) out[offset+i]=Math.round(data[i]*(i%6<3?POSITION_SCALE:VELOCITY_SCALE));
}
export function unpack(data,out,offset=0) {
  for(let i=0;i<out.length;i++) out[i]=data[offset+i]/(i%6<3?POSITION_SCALE:VELOCITY_SCALE);
  return out;
}
export function sampleRecord(record,meta,progress,out) {
  const cursor=clamp(progress,0,1)*(meta.frames-1),a=Math.floor(cursor),b=Math.min(meta.frames-1,a+1),t=cursor-a, length=meta.count*6;
  for(let i=0;i<length;i++) out[i]=lerp(record[a*length+i],record[b*length+i],t)/(i%6<3?POSITION_SCALE:VELOCITY_SCALE);
  return out;
}
