/**
 * Original closed profile geometry. This pure module is shared by the live
 * Three renderer and the OBJ exporter, so the archived model and live object
 * are the same form. It has no DOM or rendering-library dependency.
 */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function coordinate(points, index, axis) {
  if (index < 0) return 2 * points[0][axis] - points[1][axis];
  if (index >= points.length) return 2 * points.at(-1)[axis] - points.at(-2)[axis];
  return points[index][axis];
}

export function sampleProfile(profile, progress) {
  const points = profile.profileControlPoints;
  const scaled = clamp(progress) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const t = scaled - i;
  const value = [0, 0], derivative = [0, 0];
  for (let a = 0; a < 2; a++) {
    const p0 = coordinate(points, i - 1, a), p1 = coordinate(points, i, a);
    const p2 = coordinate(points, i + 1, a), p3 = coordinate(points, i + 2, a);
    // The very small seam stays shaped by its own points. Catmull-Rom is
    // otherwise C1 continuous, avoiding visible facets in the long reflection.
    const m1 = 0.5 * (p2 - p0), m2 = 0.5 * (p3 - p1);
    const t2 = t * t, t3 = t2 * t;
    value[a] = (2*t3-3*t2+1)*p1 + (t3-2*t2+t)*m1 + (-2*t3+3*t2)*p2 + (t3-t2)*m2;
    derivative[a] = (6*t2-6*t)*p1 + (3*t2-4*t+1)*m1 + (-6*t2+6*t)*p2 + (3*t2-2*t)*m2;
  }
  return { radius: Math.max(0, value[0]), y: value[1], dr: derivative[0], dy: derivative[1] };
}

export function sampleVesselSurface(profile, theta, progress) {
  const { radius, y, dr, dy } = sampleProfile(profile, progress);
  const [sx, sy, sz] = profile.scale;
  const c = Math.cos(theta), s = Math.sin(theta);
  const position = [radius*c*sx, y*sy, radius*s*sz];
  let normal;
  if (progress <= 0) normal = [0, -1, 0];
  else if (progress >= 1) normal = [0, 1, 0];
  else {
    normal = [dy*c/sx, -dr/sy, dy*s/sz];
    const length = Math.hypot(...normal) || 1;
    normal = normal.map(value => value/length);
  }
  return { position, normal };
}

export function createVesselData(profile, quality = 'high') {
  const radial = quality === 'low' ? 128 : profile.radialSegments;
  const vertical = (profile.profileControlPoints.length-1) * profile.profileSamplesPerSegment;
  const positions = new Float32Array((radial+1)*(vertical+1)*3);
  const normals = new Float32Array(positions.length);
  const uvs = new Float32Array((radial+1)*(vertical+1)*2);
  const index = [];
  for (let j = 0; j <= vertical; j++) {
    for (let i = 0; i <= radial; i++) {
      const vertex = j*(radial+1)+i;
      const surface = sampleVesselSurface(profile, i/radial*Math.PI*2, j/vertical);
      positions.set(surface.position, vertex*3);
      normals.set(surface.normal, vertex*3);
      uvs.set([i/radial, j/vertical], vertex*2);
      if (i < radial && j < vertical) {
        const a = vertex, b = a+1, c = a+radial+1, d = c+1;
        // Winding is outward for the bottom-to-top profile.
        if (j > 0) index.push(a, c, b);
        if (j < vertical-1) index.push(b, c, d);
      }
    }
  }
  return { positions, normals, uvs, indices: new Uint32Array(index), radialSegments: radial, profileSegments: vertical };
}

/** Height and normal on the upper surface at a local x/z point. */
export function pointOnLid(profile, x, z) {
  const [sx, , sz] = profile.scale;
  const r = Math.hypot(x/sx, z/sz);
  let lo = 12/(profile.profileControlPoints.length-1), hi = 1;
  for (let i = 0; i < 24; i++) {
    const t = (lo+hi)*0.5;
    if (sampleProfile(profile, t).radius > r) lo=t; else hi=t;
  }
  return sampleVesselSurface(profile, Math.atan2(z/sz, x/sx), (lo+hi)*0.5);
}

/** A point on the front of the upper cover, used by the deposited gold motif. */
export function pointOnFront(profile,x,y){
  let lo=11/(profile.profileControlPoints.length-1),hi=1;
  for(let i=0;i<25;i++){
    const t=(lo+hi)*.5;
    if(sampleProfile(profile,t).y<y)lo=t;else hi=t;
  }
  const progress=(lo+hi)*.5;
  const r=sampleProfile(profile,progress).radius;
  const cosine=x/(r*profile.scale[0]);
  if(Math.abs(cosine)>.98)return null;
  return sampleVesselSurface(profile,Math.acos(cosine),progress);
}
