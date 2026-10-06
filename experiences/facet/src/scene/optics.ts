import { Vector3, Vector4 } from 'three';

export interface RayPath { points: Vector3[]; exited: boolean; direction: Vector3; internalReflections: number }
const EPS = 1e-5;
/** Snell's law. The supplied normal faces into the incident medium. */
export function refractRay(direction: Vector3, normal: Vector3, eta: number): Vector3 | null {
  const dot = direction.dot(normal);
  const k = 1 - eta * eta * (1 - dot * dot);
  if (k < 0) return null;
  return direction.clone().multiplyScalar(eta).addScaledVector(normal, -eta * dot - Math.sqrt(k)).normalize();
}
/** Dominant ray through the actual convex hull. Scene rays use the same boundary as the optical material. */
export function traceConvexRay(origin: Vector3, direction: Vector3, planes: readonly Vector4[], ior: number, maxBounces = 8): RayPath {
  const points = [origin.clone()];
  let tNear = -Infinity, tFar = Infinity;
  let entryNormal = new Vector3();
  const d = direction.clone().normalize();
  for (const p of planes) {
    const normal = new Vector3(p.x, p.y, p.z);
    const denominator = normal.dot(d);
    const distance = p.w - normal.dot(origin);
    if (Math.abs(denominator) < EPS) {
      if (distance < 0) return {points, exited:false, direction:d, internalReflections:0};
      continue;
    }
    const t = distance / denominator;
    if (denominator < 0 && t > tNear) { tNear = t; entryNormal.copy(normal); }
    if (denominator > 0) tFar = Math.min(tFar, t);
  }
  if (tNear > tFar || tFar < 0 || !Number.isFinite(tNear)) return {points, exited:false, direction:d, internalReflections:0};
  const entry = origin.clone().addScaledVector(d, Math.max(0,tNear));
  points.push(entry.clone());
  let ray = refractRay(d,entryNormal,1/ior) ?? d;
  let current = entry.clone().addScaledVector(ray,EPS);
  let reflections = 0;
  for (let bounce=0; bounce<maxBounces; bounce++) {
    let distance=Infinity;
    let hitNormal = new Vector3();
    for(const p of planes){
      const normal=new Vector3(p.x,p.y,p.z);
      const denominator=normal.dot(ray);
      if(denominator<=EPS)continue;
      const t=(p.w-normal.dot(current))/denominator;
      if(t>EPS*.1 && t<distance){distance=t;hitNormal=normal;}
    }
    if(!Number.isFinite(distance))break;
    current.addScaledVector(ray,distance);
    points.push(current.clone());
    const exit=refractRay(ray,hitNormal.clone().negate(),ior);
    if(exit){return {points,exited:true,direction:exit,internalReflections:reflections};}
    ray.reflect(hitNormal).normalize();
    current.addScaledVector(ray,EPS);
    reflections++;
  }
  return {points,exited:false,direction:ray,internalReflections:reflections};
}
