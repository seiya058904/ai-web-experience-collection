/** A deterministic, bounded, locally coupled flock. No target shapes or leader. */
export const STEP = 1 / 60;
export const DEFAULT_RULES = Object.freeze({ space: 1.3, heading: 1.1, together: 0.7 });
export const PRESETS = Object.freeze({
  Drift: DEFAULT_RULES,
  Cohere: { space: 0.7, heading: 1.8, together: 1.6 },
  Scatter: { space: 2.4, heading: 0.3, together: 0.2 },
});
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function random(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const CELL = 14;
const GX = 36, GY = 24, GZ = 10;
const ORIGIN = [252, 168, 70];
const NEIGHBORS = 7;
const RADIUS2 = 25 * 25;

export class Flock {
  constructor({ count = 2400, seed = 8419, state = null } = {}) {
    this.count = count; this.seed = seed; this.tick = 0;
    this.rules = { ...DEFAULT_RULES }; this.paused = false;
    this.pending = [];
    this.data = new Float32Array(count * 6);
    this.next = new Float32Array(count * 6);
    this.head = new Int32Array(GX * GY * GZ);
    this.links = new Int32Array(count);
    this.peers = new Int32Array(count * NEIGHBORS).fill(-1);
    this.distances = new Float32Array(NEIGHBORS);
    this.indices = new Int32Array(NEIGHBORS);
    this.speedBias = new Float32Array(count);
    const rng = random(seed);
    const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(6.283185307 * rng());
    // Overlapping scattered launch clouds, not a target outline. Only local
    // rules and a soft environmental boundary act on them after initialization.
    const clouds = [[-91,-20,0],[-42,0,-3],[15,13,5],[59,24,-4]];
    for (let i = 0; i < count; i++) {
      const j=i*6, c=clouds[Math.floor(rng()*clouds.length)];
      this.speedBias[i]=0.9+rng()*0.2;
      this.data[j]=c[0]+gaussian()*29;
      this.data[j+1]=c[1]+gaussian()*12;
      this.data[j+2]=c[2]+gaussian()*9;
      const heading=-0.18 + rng()*0.7;
      this.data[j+3]=Math.cos(heading)*17;
      this.data[j+4]=Math.sin(heading)*17;
      this.data[j+5]=gaussian()*0.8;
    }
    if (state) this.restore(state);
  }

  setRules(rules) {
    for(const key of Object.keys(DEFAULT_RULES)) if(Number.isFinite(rules[key])) this.rules[key]=clamp(rules[key],0,2.5);
  }

  snapshot() {
    return { version: 1, count: this.count, seed: this.seed, tick: this.tick,
      rules: { ...this.rules }, paused: this.paused, pending: this.pending.map(p=>({...p})),
      data: Array.from(this.data), speedBias: Array.from(this.speedBias), neighborhood: { count: NEIGHBORS, radius: 25, candidateCap: 112 } };
  }

  restore(state) {
    if(state.version !== 1 || state.count !== this.count || state.data.length !== this.data.length ||
      !state.data.every(Number.isFinite) || !Number.isSafeInteger(state.tick) || state.tick < 0)
      throw new Error('Invalid flock checkpoint');
    this.data.set(state.data); this.next.set(state.data);
    if(state.speedBias?.length===this.count&&state.speedBias.every(v=>Number.isFinite(v)&&v>.5&&v<1.5))this.speedBias.set(state.speedBias);
    this.seed=state.seed; this.tick=state.tick; this.setRules(state.rules);
    this.paused=Boolean(state.paused);
    this.pending=(state.pending||[]).filter(p=>[p.x,p.y,p.radius,p.turn].every(Number.isFinite)).slice(0,8).map(p=>({...p}));
    this.refreshNeighbors();
  }

  cell(x,y,z) {
    return clamp(Math.floor((x+ORIGIN[0])/CELL),0,GX-1) +
      clamp(Math.floor((y+ORIGIN[1])/CELL),0,GY-1)*GX +
      clamp(Math.floor((z+ORIGIN[2])/CELL),0,GZ-1)*GX*GY;
  }

  refreshNeighbors() {
    this.head.fill(-1);
    const d=this.data;
    for(let i=0;i<this.count;i++) { const j=i*6, c=this.cell(d[j],d[j+1],d[j+2]); this.links[i]=this.head[c]; this.head[c]=i; }
    for(let i=0;i<this.count;i++) {
      const j=i*6, x=d[j], y=d[j+1], z=d[j+2];
      const cx=clamp(Math.floor((x+ORIGIN[0])/CELL),1,GX-2), cy=clamp(Math.floor((y+ORIGIN[1])/CELL),1,GY-2), cz=clamp(Math.floor((z+ORIGIN[2])/CELL),1,GZ-2);
      this.distances.fill(Infinity); this.indices.fill(-1);
      let inspected=0;
      // Bounded approximate nearest-neighbor query in adjacent spatial buckets.
      // Traversal is deterministic. This is explicitly not a biological solver.
      for(let oz=-1;oz<=1;oz++) for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++) {
        let k=this.head[(cx+ox)+(cy+oy)*GX+(cz+oz)*GX*GY];
        while(k!==-1 && inspected<112) {
          if(k!==i) {
            inspected++;
            const q=k*6, dx=d[q]-x,dy=d[q+1]-y,dz=d[q+2]-z;
            const dist=dx*dx+dy*dy+dz*dz;
            if(dist<RADIUS2 && dist<this.distances[NEIGHBORS-1]) {
              let at=NEIGHBORS-1;
              while(at>0 && dist<this.distances[at-1]) {this.distances[at]=this.distances[at-1];this.indices[at]=this.indices[at-1];at--;}
              this.distances[at]=dist;this.indices[at]=k;
            }
          }
          k=this.links[k];
        }
      }
      this.peers.set(this.indices,i*NEIGHBORS);
    }
  }

  neighbors(id) { this.refreshNeighbors(); return Array.from(this.peers.subarray(id*NEIGHBORS,id*NEIGHBORS+NEIGHBORS)).filter(v=>v>=0); }

  queueRipple(x, y, radius=22, turn=1.3) {
    this.pending.push({x,y,radius,turn}); if(this.pending.length>8)this.pending.shift();
  }

  step() {
    const d=this.data,n=this.next,w=this.rules;
    for(const p of this.pending) for(let i=0;i<this.count;i++) {
      const j=i*6, dx=d[j]-p.x,dy=d[j+1]-p.y, distance=Math.hypot(dx,dy);
      if(distance<p.radius) {
        const a=p.turn*(1-distance/p.radius),c=Math.cos(a),s=Math.sin(a),vx=d[j+3],vy=d[j+4];
        d[j+3]=vx*c-vy*s; d[j+4]=vx*s+vy*c;
      }
    }
    this.pending.length=0;
    // Refresh every step: a restored checkpoint needs no hidden neighbor cache.
    this.refreshNeighbors();
    for(let i=0;i<this.count;i++) {
      const j=i*6, x=d[j],y=d[j+1],z=d[j+2], vx=d[j+3],vy=d[j+4],vz=d[j+5];
      let ax=0,ay=0,az=0, px=0,py=0,pz=0,hx=0,hy=0,hz=0,sx=0,sy=0,sz=0,kcount=0;
      for(let t=0;t<NEIGHBORS;t++) {
        const k=this.peers[i*NEIGHBORS+t]; if(k<0)break;
        const q=k*6, dx=d[q]-x,dy=d[q+1]-y,dz=d[q+2]-z, dist=dx*dx+dy*dy+dz*dz;
        px+=dx;py+=dy;pz+=dz;hx+=d[q+3];hy+=d[q+4];hz+=d[q+5];kcount++;
        if(dist<20.25 && dist>0.00001) { const f=(1-Math.sqrt(dist)/4.5)/(dist+0.12); sx-=dx*f;sy-=dy*f;sz-=dz*f; }
      }
      if(kcount) {
        ax=sx*w.space*17+(hx/kcount-vx)*w.heading*1.25+px/kcount*w.together*0.6;
        ay=sy*w.space*17+(hy/kcount-vy)*w.heading*1.25+py/kcount*w.together*0.6;
        az=sz*w.space*17+(hz/kcount-vz)*w.heading*1.25+pz/kcount*w.together*0.6;
      }
      // Published environmental constraint: a broad soft box, not a prescribed
      // flock contour or a moving global attractor. No teleporting at edges.
      const boundary=(v,start)=>Math.sign(v)*Math.pow(Math.max(0,Math.abs(v)-start),1.3)*0.38;
      ax-=boundary(x,135);ay-=boundary(y,57);az-=boundary(z,20);
      // Smooth vertical resistance keeps the observation volume shallow.
      az-=vz*0.15;
      const force=Math.hypot(ax,ay,az),cap=25;
      if(force>cap){ax*=cap/force;ay*=cap/force;az*=cap/force;}
      let ux=vx+ax*STEP,uy=vy+ay*STEP,uz=vz+az*STEP;
      const speed=Math.hypot(ux,uy,uz)||1, target=clamp(speed,13*this.speedBias[i],21*this.speedBias[i]);
      ux*=target/speed;uy*=target/speed;uz*=target/speed;
      n[j]=x+ux*STEP;n[j+1]=y+uy*STEP;n[j+2]=z+uz*STEP;
      n[j+3]=ux;n[j+4]=uy;n[j+5]=uz;
    }
    this.data=n;this.next=d;this.tick++;
  }
}

export function digest(data) {
  let hash=2166136261;
  for(let i=0;i<data.length;i++) { hash^=Math.round(data[i]*10000);hash=Math.imul(hash,16777619); }
  return (hash>>>0).toString(16).padStart(8,'0');
}
