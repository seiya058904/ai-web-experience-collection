import { TAU, clamp, hash01, plateGrain, chladni, dampedPluck } from './math.js';

const PARTICLES = 25800;
const MOBILE_PARTICLES = 8800;
const PATHS = 72;
const SEGMENTS = 512;
const STRIDE = 10;

const VERTEX = `
precision highp float;
attribute vec4 aSeed;
attribute vec4 aMode01;
attribute vec2 aMode2;
uniform float uScene, uTime, uPhase, uFrequency, uMode;
uniform float uImpulse, uImpulseAge, uEnding, uCapture, uPlaying;
uniform float uAspect, uDPR, uMobile, uReduced, uPointScale, uLift, uShortLandscape;
uniform mediump float uPass;
uniform vec2 uPointer;
varying mediump vec4 vColor;
varying mediump float vKind;
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

vec3 turn(vec3 p, float ax, float az) {
  float a = ax + uPointer.y * 0.042 * (1.0 - uReduced * 0.88);
  p.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * p.yz;
  float ay = uPointer.x * 0.065 * (1.0 - uReduced * 0.88);
  p.xz = mat2(cos(ay), -sin(ay), sin(ay), cos(ay)) * p.xz;
  p.xy = mat2(cos(az), sin(az), -sin(az), cos(az)) * p.xy;
  return p;
}
vec3 place(vec3 p, vec2 center, float scale) {
  float perspective = 1.0 / (1.0 + p.z * 0.075);
  return vec3((center.x * 2.0 - 1.0) + p.x * scale * 2.0 * perspective / uAspect,
              1.0 - center.y * 2.0 + p.y * scale * 2.0 * perspective, p.z);
}
float plate(float x, float y, float n, float m) {
  return cos(n*PI*x)*cos(m*PI*y)-cos(m*PI*x)*cos(n*PI*y);
}
float pluck(float s, float age, float shift) {
  float result = 0.0;
  float omega = TAU * (uFrequency / 110.0) * 0.37;
  for (int k = 1; k <= 7; k++) {
    float n = float(k);
    result += sin(n*PI*s)*sin(n*PI*0.43)*cos(n*omega*age + shift)
      * exp(-age*(0.38+n*n*0.032))/(n*n);
  }
  return result * uImpulse;
}
vec2 modePoint() {
  float mode = clamp(uMode, 0.0, 2.0);
  return mode < 1.0 ? mix(aMode01.xy, aMode01.zw, smoothstep(0.0,1.0,mode))
                   : mix(aMode01.zw, aMode2, smoothstep(0.0,1.0,mode-1.0));
}
vec2 perimeter(float s, float side) {
  if (side < 1.0) return vec2(s*2.0-1.0, -1.0);
  if (side < 2.0) return vec2(1.0, s*2.0-1.0);
  if (side < 3.0) return vec2(1.0-s*2.0, 1.0);
  return vec2(-1.0, 1.0-s*2.0);
}

vec3 form(float scene, out float alpha, out float warm, out float size) {
  float s = aSeed.x, q = aSeed.y, noise = aSeed.z, kind = aSeed.w;
  bool line = uPass > 0.5;
  bool skin = uPass > 1.5;
  bool edge = kind > 0.5 && kind < 1.5;
  bool dust = kind > 1.5 && kind < 2.5;
  bool source = kind > 2.5 && kind < 3.5;
  bool pin = kind > 3.5;
  float mobile = uMobile;
  float time = uTime * mix(1.0, 0.065, uReduced);
  float movement = mix(1.0, 0.18, uReduced);
  float radius, theta;
  vec3 p;
  alpha = line ? 0.18 : 0.40;
  warm = 0.14;
  size = 0.95 + noise * 1.15;
  if (scene < 0.5) {
    radius = line ? 0.025 + q*1.13 : sqrt((floor(s*108.0)+0.5)/108.0)*1.15;
    theta = line ? TAU*s : TAU*q;
    if (edge) radius = 1.175 + floor(q*4.0)*0.044;
    float z = (sin(radius*18.0-time*1.25)*0.049 + sin(theta*3.0+time*0.21)*0.019*radius) * movement;
    z += sin(radius*13.0-uImpulseAge*4.2)*exp(-uImpulseAge*0.58)*uImpulse*0.058;
    if (dust) { radius *= 1.16 + noise*0.16; z += (noise-0.5)*0.48; }
    if (pin) { radius = 1.10 + noise*0.18; theta = q*TAU; z += s*noise*0.16; }
    p = vec3(cos(theta)*radius, sin(theta)*radius, z);
    if (source) p = vec3(0.0);
    p = turn(p, 0.91, -0.40);
    alpha = line ? 0.09 + noise*0.07 : 0.28 + noise*0.50;
    alpha *= 0.66 + 0.34*sin(radius*18.0-time*1.25)*sin(radius*18.0-time*1.25);
    if (edge) alpha = 0.09;
    if (pin) alpha = 0.10;
    if (dust) alpha *= 0.38;
    warm = 0.09 + 0.36*exp(-radius*5.0);
    if (source) { alpha = s < 0.5 ? 0.98 : 0.0; warm=1.0; size=53.0; }
    return place(p, vec2(mix(0.70,0.50,mobile),mix(0.49,0.32,mobile)),
      mix(min(0.365,uAspect*0.26),min(0.182,uAspect*0.415),mobile));
  }
  if (scene < 1.5) {
    float strand = q - 0.5;
    float delay = strand * 0.24;
    float vibration = pluck(s,max(0.0,uImpulseAge+delay),strand*0.15);
    vibration += sin(PI*s)*sin(time*1.8)*0.022*movement;
    float y = vibration * mix(0.168,0.088,mobile) + strand*0.016*sin(PI*s);
    float xx = mix(0.055,0.945,s);
    if (edge) {
      xx = q < 0.5 ? 0.055 : 0.945;
      y = (s-0.5)*0.035;
    }
    if (pin) { y += (noise-0.5)*0.07; alpha=0.0; }
    if (dust) y += (noise-0.5)*0.09*sin(PI*s);
    if (source) {
      xx = s < 0.5 ? 0.055 : 0.945; y = 0.0;
      size=22.0; warm=0.72; alpha=0.72;
    } else {
      alpha = line ? 0.085 + exp(-strand*strand*180.0)*0.44 : 0.12+noise*0.24;
      alpha *= dust ? 0.2 : 1.0;
      warm = 0.08+exp(-pow((s-0.43)*8.0,2.0))*uImpulse*exp(-uImpulseAge)*0.56;
    }
    if (edge) alpha = 0.36;
    if (pin) alpha = 0.0;
    return vec3(xx*2.0-1.0,1.0-2.0*(mix(0.49,0.32,mobile)+y),0.0);
  }
  if (scene < 2.5) {
    float d = line ? q : s;
    theta = line ? TAU*s : TAU*q;
    if (edge) { d = q; theta = TAU*s; }
    if (pin) { d=q; theta=noise*TAU; }
    float k = 58.0 + (uFrequency/110.0)*12.0;
    float pressure = 0.5+0.5*cos(d*k-time*2.2);
    float local = d + sin(d*k-time*2.2)*0.010*movement;
    float lens = 1.0/(1.0+local*7.2);
    vec2 center = mix(vec2(0.21,0.62),vec2(0.99,0.14),1.0-lens);
    center = mix(center,mix(vec2(0.24,0.37),vec2(0.93,0.12),1.0-lens),mobile);
    radius = mix(0.51,min(0.195,uAspect*0.41),mobile)*lens;
    float spread = dust ? 1.10+noise*0.5 : 0.82+noise*0.18;
    if (line) spread=1.0;
    float px = cos(theta)*radius*0.77*spread;
    float py = sin(theta)*radius*spread;
    p = vec3((center.x*2.0-1.0)+px*2.0/uAspect,1.0-center.y*2.0+py*2.0,1.0-lens);
    alpha = (line ? 0.035 : 0.06) + pow(pressure,7.0)*(line ? 0.34 : 0.71);
    alpha *= (0.47+0.53*lens);
    if (dust) alpha*=0.40;
    if (pin) alpha=0.0;
    warm = 0.40+0.35*pressure;
    size = (0.70+noise*1.00)*mix(0.68,1.52,lens);
    if (source) { p=vec3(mix(-0.58,-0.52,mobile),1.0-mix(0.62,0.37,mobile)*2.0,0.0); alpha=s<0.5?0.7:0.0;size=26.0;warm=0.9; }
    return p;
  }
  if (scene < 3.5) {
    float x = (s*2.0-1.0)*1.20;
    float y = (q*2.0-1.0)*0.96;
    if (edge) { vec2 b=perimeter(s,floor(q*4.0));x=b.x*1.2;y=b.y*0.96; }
    float k=10.0+uFrequency/110.0;
    float d1=length(vec2(x+0.48,y)), d2=length(vec2(x-0.48,y));
    float wave=sin(k*d1-time*2.0)+sin(k*d2-time*2.0+uPhase);
    float envelope=abs(cos((k*(d1-d2)-uPhase)*0.5));
    float node=exp(-envelope*envelope*55.0);
    float z=wave*0.124*movement;
    if (dust) z+=(noise-0.5)*0.16;
    if (pin) z+=s*noise*0.09;
    p=vec3(x,y,z);
    if (source) p=vec3(s<0.5?-0.48:0.48,0.0,0.0);
    p=turn(p,0.81,-0.28);
    p.y*=mix(1.0,0.74,uShortLandscape);
    alpha = line ? 0.11+node*0.19 : 0.19+noise*0.26+node*0.20;
    if(dust)alpha*=0.38;
    if(edge)alpha=0.22;
    if(pin)alpha=0.025;
    warm=0.12+node*0.65;
    if(source){alpha=0.86;warm=0.95;size=36.0;}
    return place(p,vec2(mix(0.67,0.50,mobile),mix(0.51,0.32,mobile)),
      mix(min(0.42,uAspect*0.29),min(0.175,uAspect*0.335),mobile));
  }
  if (scene < 4.5) {
    vec2 xy = line ? vec2(s,q) : modePoint();
    float n=floor(uMode+0.5)+2.0;
    float field=plate(xy.x*2.0-1.0,xy.y*2.0-1.0,n,n+1.0);
    if(edge)xy=(perimeter(s,floor(q*4.0))+1.0)*0.5;
    float grain=sin(noise*TAU*4.0+time*1.1)*0.004*movement;
    p=vec3(xy*2.0-1.0,grain);
    if(dust){p.xy*=1.01+noise*0.06;p.z+=noise*0.018;}
    if(pin){p=vec3(perimeter(q,floor(noise*4.0)),s*noise*0.035);}
    if(source)p=vec3(0.0,0.0,0.002);
    // Rotate in the plane before tilting: a true three-quarter square plate.
    p.xy=mat2(0.70710678,0.70710678,-0.70710678,0.70710678)*p.xy;
    p=turn(p,0.85,-0.055);
    alpha=line ? 0.008+exp(-field*field*55.0)*0.076 : 0.32+noise*0.55;
    warm=0.54+noise*0.15;
    if(edge)alpha=0.48;
    if(dust)alpha*=0.38;
    if(pin)alpha=0.06;
    if(source){alpha=s<0.5?0.25:0.0;warm=0.95;size=32.0;}
    if(skin){alpha=0.022+0.024*pow(max(0.0,1.0-abs(xy.x-xy.y)),8.0);warm=0.52;}
    size=0.95+noise*1.38;
    if(source)size=32.0;
    return place(p,vec2(mix(0.632,0.50,mobile),mix(0.469,0.32,mobile)),
      mix(min(0.355,uAspect*0.27),min(0.145,uAspect*0.325),mobile));
  }
  if (scene < 5.5) {
    float lane=min(6.0,floor(q*7.0));
    float harmonic=lane+1.0;
    float ghost=fract(q*7.0)-0.5;
    float cycle=cos(harmonic*time*0.74*(uFrequency/110.0)+uPhase*0.2);
    bool envelope=abs(ghost)>0.31;
    float visiblePhase=envelope?sign(ghost):cycle;
    float wave=sin(harmonic*PI*s)*visiblePhase*0.20/sqrt(harmonic);
    float x=(s-0.5)*3.5+(lane-3.0)*0.035;
    float y=(lane-3.0)*0.16+wave+ghost*0.009;
    float z=-(lane-3.0)*0.145;
    if(edge){x=q<0.5?-1.85:1.85;y=(s-0.5)*1.08;z=-(s-0.5)*1.00;}
    if(dust)y+=(noise-0.5)*0.05;
    if(pin)alpha=0.0;
    p=vec3(x,y,z);
    if(source)p=vec3(s<0.5?-1.855:1.645,-0.48,0.435);
    p=turn(p,0.73,-0.08);
    p.xy*=vec2(mix(0.94,1.0,mobile),mix(0.82,1.0,mobile));
    p.y*=mix(1.0,0.63,uShortLandscape);
    alpha=line?0.10+exp(-ghost*ghost*90.0)*0.28:0.18+noise*0.24;
    if(dust)alpha*=0.18;
    if(edge)alpha=0.10;
    if(pin)alpha=0.0;
    if(envelope)alpha*=0.42;
    warm=lane<0.5?0.78:0.06+lane*0.043;
    if(source){alpha=0.61;size=25.0;warm=0.9;}
    return place(p,vec2(mix(0.493,0.50,mobile),mix(mix(0.382,0.32,mobile),0.32,uShortLandscape)),
      mix(min(0.37,uAspect*0.30),min(0.17,uAspect*0.255),mobile));
  }
  if (scene < 6.5) {
    float path=floor(q*72.0);
    radius=line?0.13+(path+s)/72.0*1.00:0.13+sqrt((floor(s*240.0)+0.5)/240.0)*1.00;
    theta=line?s*TAU:q*TAU;
    theta+=time*0.025;
    float cycles=17.0*(uFrequency/110.0);
    float signal=sin(theta*cycles+uPhase)*0.52+sin(theta*cycles*2.0+uMode)*0.24+sin(theta*cycles*3.0)*0.11;
    float highlight=line ? step(0.8,fract(path/19.0)) : 0.0;
    radius += signal*(0.0025+highlight*0.021);
    float z=0.007*sin(radius*210.0);
    if(edge)radius=1.13+floor(q*4.0)*0.007;
    if(dust){radius=0.93+sqrt(s)*0.27;z+=(noise-0.5)*0.20;}
    if(pin){radius=1.055+noise*0.11;theta=q*TAU;z=s*noise*0.11;}
    p=vec3(cos(theta)*radius,sin(theta)*radius,z);
    if(source){
      float headTheta=0.73-uCapture*TAU;
      float headRadius=1.095-uCapture*0.85;
      p=vec3(cos(headTheta)*headRadius,sin(headTheta)*headRadius,0.019);
    }
    p=turn(p,0.77,-0.13);
    alpha=line?0.09+highlight*0.50:0.07+noise*0.22;
    if(edge)alpha=0.24;
    if(dust)alpha=0.09+noise*0.24;
    if(pin)alpha=0.15;
    warm=line?0.17+highlight*0.29:0.19;
    if(dust||pin)warm=0.64;
    if(source){alpha=s<0.5?0.98:0.0;size=49.0;warm=1.0;}
    return place(p,vec2(mix(0.68,0.50,mobile),mix(0.49,0.32,mobile)),
      mix(min(0.46,uAspect*0.305),min(0.184,uAspect*0.409),mobile));
  }
  radius=line?0.03+q*1.28:sqrt((floor(s*120.0)+0.5)/120.0)*1.28;
  theta=line?TAU*s:TAU*q;
  if(edge)radius=1.30+floor(q*4.0)*0.08;
  float ripple=sin(radius*26.0-time*2.5*(uFrequency/110.0));
  float z=-max(0.0,0.84-radius)*0.27 + ripple*0.030*movement;
  z+=sin(time*2.1)*(0.018+uPlaying*0.042)*exp(-radius*radius*3.0)*movement;
  z+=uImpulse*exp(-uImpulseAge*0.72)*sin(radius*15.0-uImpulseAge*8.0)*0.085*movement;
  if(dust){radius*=1.12;z+=(noise-0.5)*0.10;}
  if(pin){radius=1.10+noise*0.26;theta=q*TAU;z+=s*noise*0.11;}
  p=vec3(cos(theta)*radius,sin(theta)*radius,z);
  p*=pow(1.0-uEnding,1.45);
  if(source)p=vec3(0.0);
  p=turn(p,0.57,-0.25);
  alpha=(line?0.16:0.18+noise*0.26)*(0.72+0.28*ripple*ripple)*pow(1.0-uEnding,3.4);
  if(dust)alpha*=0.30;
  if(pin)alpha*=0.35;
  warm=0.14+0.30*exp(-radius*3.0);
  if(source){alpha=s<0.5?0.92:0.0;warm=1.0;size=mix(39.0,23.0,uEnding);}
  return place(p,vec2(mix(0.68,0.50,mobile),mix(0.48,0.32,mobile)),
    mix(min(0.37,uAspect*0.26),min(0.175,uAspect*0.365),mobile));
}

void main() {
  float current=clamp(uScene,0.0,7.0);
  float a=floor(current), b=min(7.0,a+1.0), blend=fract(current);
  blend=blend*blend*(3.0-2.0*blend);
  float aa,aw,asz;
  vec3 pa=form(a,aa,aw,asz);
  float ba=aa,bw=aw,bsz=asz;
  vec3 pb=pa;
  if(blend>0.00001)pb=form(b,ba,bw,bsz);
  vec3 p=mix(pa,pb,blend);
  // Every particle and every connected filament has a destination. The small
  // perpendicular bend makes the handoff legible while preserving endpoints.
  vec2 delta=pb.xy-pa.xy;
  p.xy += vec2(-delta.y,delta.x)*sin(blend*PI)*(aSeed.z-0.5)*0.080;
  p.y += uLift;
  float alpha=mix(aa,ba,blend);
  if(uPass>1.5)alpha=(0.022+0.018*pow(max(0.0,1.0-abs(aSeed.x-aSeed.y)),8.0))*max(0.0,1.0-abs(current-4.0));
  vec3 silver=vec3(0.934,0.916,0.879), amber=vec3(0.839,0.710,0.486);
  vec3 color=mix(silver,amber,clamp(mix(aw,bw,blend),0.0,1.0));
  vColor=vec4(color,alpha);
  vKind=aSeed.w;
  gl_Position=vec4(p.xy,0.0,1.0);
  gl_PointSize=max(0.70,mix(asz,bsz,blend)*uDPR*uPointScale);
}
`;

const FRAGMENT = `
precision mediump float;
uniform mediump float uPass;
varying mediump vec4 vColor;
varying mediump float vKind;
void main() {
  if(uPass>0.5){gl_FragColor=vColor;return;}
  vec2 p=gl_PointCoord-0.5;
  float d=length(p)*2.0;
  if(d>1.0)discard;
  if(vKind>2.5&&vKind<3.5){
    float light=exp(-d*15.0)*0.94+exp(-d*6.0)*0.19+exp(-d*d*7.0)*0.018;
    vec3 core=mix(vColor.rgb,vec3(1.0,0.97,0.90),exp(-d*18.0));
    gl_FragColor=vec4(core,vColor.a*light);
  }else{
    float core=1.0-smoothstep(0.18,1.0,d);
    gl_FragColor=vec4(vColor.rgb,vColor.a*core);
  }
}
`;

function vertex(u, v, random, kind = 0, index = -1) {
  const values = [u, v, random, kind, u, v, u, v, u, v];
  if (index >= 0) {
    for (let mode = 0; mode < 3; mode++) {
      const target = plateGrain(index, mode);
      values[4 + mode * 2] = target[0];
      values[5 + mode * 2] = target[1];
    }
  }
  return values;
}

function createGeometry() {
  const particles = new Float32Array(PARTICLES * STRIDE);
  for (let i = 0; i < PARTICLES; i++) {
    // A low-discrepancy disk remains evenly populated at either quality budget.
    const u = ((i + 0.5) * 0.618033988749895) % 1;
    const v = ((i + 0.5) * 0.754877666246693 + hash01(i + 472) * 0.003) % 1;
    particles.set(vertex(u, v, hash01(i + 910), i % 41 === 0 ? 2 : 0, i), i * STRIDE);
  }
  const lines = [];
  for (let path = 0; path < PATHS; path++) {
    const q = (path + 0.5) / PATHS;
    const steps = path % 19 >= 16 ? 2048 : SEGMENTS;
    for (let step = 0; step < steps; step++) {
      const noise = hash01(path + 179);
      lines.push(...vertex(step / steps, q, noise), ...vertex((step + 1) / steps, q, noise));
    }
  }
  for (let side = 0; side < 4; side++) {
    for (let step = 0; step < SEGMENTS; step++) {
      lines.push(...vertex(step / SEGMENTS, (side + 0.5) / 4, 0.6, 1),
        ...vertex((step + 1) / SEGMENTS, (side + 0.5) / 4, 0.6, 1));
    }
  }
  for (let pin = 0; pin < 240; pin++) {
    const q = pin / 240, random = hash01(pin + 614);
    lines.push(...vertex(0, q, random, 4), ...vertex(1, q, random, 4));
  }
  const skin = [];
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const p = [[x,y],[x+1,y],[x,y+1],[x+1,y],[x+1,y+1],[x,y+1]];
      for (const [px,py] of p) skin.push(...vertex(px / 24, py / 24, 0.5));
    }
  }
  return {
    particles,
    lines: new Float32Array(lines),
    skin: new Float32Array(skin),
    sources: new Float32Array([...vertex(0,0,0.5,3), ...vertex(1,0,0.5,3)]),
  };
}

/** A deterministic GPU sculpture. Scrolling, time and RAF belong to its owner. */
export class WaveWorld {
  constructor(canvas, { onFallback } = {}) {
    this.canvas = canvas;
    this.onFallback = onFallback;
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.liftPixels = 0;
    this.shortLandscape = false;
    this.destroyed = false;
    this.geometry = createGeometry();
    this._onLost = event => {
      event.preventDefault();
      this.lost = true;
      this._fallback('context-lost');
    };
    this._onRestored = () => {
      if (this.destroyed) return;
      this.lost = false;
      try {
        this._initGL();
        this.fallbackCanvas?.remove();
        this.fallbackCanvas = null;
        this.ctx = null;
        this.canvas.style.visibility = '';
        this.resize(this.width, this.height, this.requestedDpr);
      } catch { this._fallback('context-restore'); }
    };
    canvas.addEventListener('webglcontextlost', this._onLost, false);
    canvas.addEventListener('webglcontextrestored', this._onRestored, false);
    try {
      this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!this.gl) throw new Error('WebGL unavailable');
      this._initGL();
    } catch { this._fallback('unavailable'); }
    if (!this.ctx && this._renderer !== 'WebGL') {
      this.destroy();
      throw new Error('No visual renderer is available.');
    }
  }

  _shader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const detail = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(detail || 'Shader compilation failed');
    }
    return shader;
  }

  _initGL() {
    const gl = this.gl;
    if (!gl) throw new Error('WebGL unavailable');
    const vs = this._shader(gl.VERTEX_SHADER, VERTEX);
    const fs = this._shader(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Renderer link failed');
    this.program = program;
    gl.useProgram(program);
    this.attributes = {
      seed: gl.getAttribLocation(program, 'aSeed'),
      mode01: gl.getAttribLocation(program, 'aMode01'),
      mode2: gl.getAttribLocation(program, 'aMode2'),
    };
    this.uniforms = {};
    for (const name of ['Scene','Time','Phase','Frequency','Mode','Impulse','ImpulseAge','Ending','Capture','Playing','Aspect','DPR','Mobile','Reduced','Pass','PointScale','Pointer','Lift','ShortLandscape']) {
      this.uniforms[name] = gl.getUniformLocation(program, `u${name}`);
    }
    this.buffers = {};
    for (const [name, data] of Object.entries(this.geometry)) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      this.buffers[name] = { buffer, count: data.length / STRIDE };
    }
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(11 / 255, 13 / 255, 13 / 255, 1);
    this._renderer = 'WebGL';
  }

  _fallback(reason) {
    if (this.destroyed || this.ctx) return;
    let target = this.canvas;
    let ctx = null;
    if (!this.gl) ctx = target.getContext('2d', { alpha: true });
    if (!ctx) {
      target = this.canvas.cloneNode(false);
      target.removeAttribute('id');
      target.setAttribute('aria-hidden', 'true');
      target.dataset.rendererFallback = 'true';
      Object.assign(target.style, { position:'fixed', inset:'0', width:'100%', height:'100%', display:'block', pointerEvents:'none', zIndex:'0' });
      this.canvas.insertAdjacentElement('afterend', target);
      this.canvas.style.visibility = 'hidden';
      this.fallbackCanvas = target;
      ctx = target.getContext('2d', { alpha: true });
    }
    this.ctx = ctx;
    this._renderer = 'Canvas 2D';
    this.resize(this.width, this.height, this.requestedDpr || 1);
    this.onFallback?.(reason);
  }

  resize(width, height, dpr = 1) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.requestedDpr = dpr;
    this.mobile = width <= 760 || (width <= 900 && height >= width);
    this.liftPixels = width <= 760 && height <= 740 ? 24 : 0;
    this.shortLandscape = width > 760 && height <= 500;
    const pixelBudget = this.mobile ? 2200000 : 6700000;
    this.dpr = Math.max(0.65, Math.min(dpr || 1, 1.75, Math.sqrt(pixelBudget / (width * height))));
    for (const canvas of [this.canvas, this.fallbackCanvas].filter(Boolean)) {
      const pw = Math.round(this.width * this.dpr), ph = Math.round(this.height * this.dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
    }
    if (this.gl && !this.lost) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(state = {}) {
    if (this.destroyed) return;
    const safe = {
      time: Number.isFinite(state.time) ? state.time : 0,
      scene: clamp(Number.isFinite(state.scene) ? state.scene : 0, 0, 7),
      phase: Number.isFinite(state.phase) ? state.phase : 0,
      frequency: clamp(Number.isFinite(state.frequency) ? state.frequency : 110, 55, 880),
      mode: clamp(Number.isFinite(state.mode) ? state.mode : 1, 0, 2),
      impulse: clamp(Number.isFinite(state.impulse) ? state.impulse : 0, 0, 1),
      impulseAge: clamp(Number.isFinite(state.impulseAge) ? state.impulseAge : 40, 0, 100),
      ending: clamp(Number.isFinite(state.ending) ? state.ending : 0, 0, 1),
      captureProgress: clamp(Number.isFinite(state.captureProgress) ? state.captureProgress : 0, 0, 1),
      reducedMotion: Boolean(state.reducedMotion),
      playing: Boolean(state.playing),
      pointer: state.pointer || { x: 0, y: 0 },
    };
    this.lastState = safe;
    if (this.ctx || this.lost || !this.gl) { this._renderCanvas(safe); return; }
    const gl = this.gl, uniforms = this.uniforms;
    gl.useProgram(this.program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const values = {
      Scene: safe.scene, Time: safe.time, Phase: safe.phase, Frequency: safe.frequency,
      Mode: safe.mode, Impulse: safe.impulse, ImpulseAge: safe.impulseAge,
      Ending: safe.ending, Capture: safe.captureProgress, Playing: safe.playing ? 1 : 0, Aspect: this.width / this.height,
      DPR: this.dpr, Mobile: this.mobile ? 1 : 0, Reduced: safe.reducedMotion ? 1 : 0,
      Lift: this.liftPixels * 2 / this.height, ShortLandscape: this.shortLandscape ? 1 : 0,
      PointScale: this.width >= 2560 ? 1.13 : 1,
    };
    for (const [name, value] of Object.entries(values)) gl.uniform1f(uniforms[name], value);
    gl.uniform2f(uniforms.Pointer, clamp(Number(safe.pointer.x) || 0,-1,1), clamp(Number(safe.pointer.y) || 0,-1,1));
    if(safe.scene>3&&safe.scene<5)this._draw('skin', gl.TRIANGLES, 2);
    this._draw('lines', gl.LINES, 1);
    this._draw('particles', gl.POINTS, 0, this.mobile ? MOBILE_PARTICLES : PARTICLES);
    this._draw('sources', gl.POINTS, 0);
  }

  _draw(name, primitive, pass, count) {
    const gl = this.gl, data = this.buffers[name];
    gl.uniform1f(this.uniforms.Pass, pass);
    gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
    const stride = STRIDE * 4;
    for (const [location,size,offset] of [[this.attributes.seed,4,0],[this.attributes.mode01,4,16],[this.attributes.mode2,2,32]]) {
      if (location < 0) continue;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    }
    gl.drawArrays(primitive, 0, count || data.count);
  }

  // CPU counterpart for devices without a usable WebGL context. It retains the
  // same physical relationships, shared particle identities and scene morphs.
  _cpuPoint(scene, u, v, noise, state, line = false, index = 0) {
    const mobile = this.mobile, aspect = this.width / this.height;
    const t = state.time * (state.reducedMotion ? 0.065 : 1);
    const movement = state.reducedMotion ? 0.18 : 1;
    let x, y, z = 0, r, a, alpha = line ? 0.20 : 0.44;
    let cx = mobile ? 0.5 : 0.69, cy = mobile ? 0.32 : 0.49;
    let scale = mobile ? Math.min(0.18,aspect*0.41) : Math.min(0.365,aspect*0.26);
    let ax = 0.91, az = -0.40, warm = 0.15;
    if (scene === 0) {
      r = line ? 0.025+v*1.13 : Math.sqrt((Math.floor(u*108)+0.5)/108)*1.15; a=(line?u:v)*TAU;
      x=Math.cos(a)*r;y=Math.sin(a)*r;
      z=(Math.sin(r*18-t*1.25)*0.049+Math.sin(a*3+t*0.21)*0.019*r)*movement;
      alpha=line?0.13:0.24+noise*0.4;
    } else if (scene === 1) {
      const wave=dampedPluck(u,state.impulseAge+(v-0.5)*0.24,state.frequency,state.impulse);
      x=(0.055+u*0.89)*this.width;
      y=(cy+wave*(mobile?0.088:0.168)+(v-0.5)*0.016*Math.sin(Math.PI*u))*this.height;
      return [x,y,line?0.20:0.32,0.16];
    } else if (scene === 2) {
      const d=line?v:u,k=58+state.frequency/110*12;
      const pressure=0.5+0.5*Math.cos(d*k-t*2.2);
      const lens=1/(1+(d+Math.sin(d*k-t*2.2)*0.010*movement)*7.2);
      a=(line?u:v)*TAU;
      cx=(mobile?0.24:0.21)+(mobile?0.69:0.78)*(1-lens);
      cy=(mobile?0.37:0.62)-(mobile?0.25:0.48)*(1-lens);
      r=(mobile?Math.min(0.195,aspect*0.41):0.51)*lens;
      x=cx*this.width+Math.cos(a)*r*this.height*0.77;
      y=cy*this.height-Math.sin(a)*r*this.height;
      return [x,y,(line?0.035:0.06)+Math.pow(pressure,7)*(line?0.34:0.71),0.55];
    } else if (scene === 3) {
      x=(u*2-1)*1.2;y=(v*2-1)*0.96;
      const k=10+state.frequency/110,d1=Math.hypot(x+0.48,y),d2=Math.hypot(x-0.48,y);
      z=(Math.sin(k*d1-t*2)+Math.sin(k*d2-t*2+state.phase))*0.124*movement;
      ax=0.81;az=-0.28;cx=mobile?0.5:0.67;cy=mobile?0.32:0.51;
      scale=mobile?Math.min(0.175,aspect*0.335):Math.min(0.42,aspect*0.29);
      warm=Math.exp(-Math.pow(Math.cos((k*(d1-d2)-state.phase)/2),2)*55)*0.6;
    } else if (scene === 4) {
      let px=u,py=v;
      if(!line){
        const low=Math.floor(state.mode),high=Math.min(2,low+1),blend=state.mode-low;
        const start=index*STRIDE+4;
        px=this.geometry.particles[start+low*2]*(1-blend)+this.geometry.particles[start+high*2]*blend;
        py=this.geometry.particles[start+low*2+1]*(1-blend)+this.geometry.particles[start+high*2+1]*blend;
      }
      x=px*2-1;y=py*2-1;
      const rotatedX=(x-y)*Math.SQRT1_2;y=(x+y)*Math.SQRT1_2;x=rotatedX;
      ax=0.85;az=-0.055;cx=mobile?0.5:0.632;cy=mobile?0.32:0.469;
      scale=mobile?Math.min(0.145,aspect*0.325):Math.min(0.355,aspect*0.27);
      alpha=line?0.008+Math.exp(-Math.pow(chladni(px*2-1,py*2-1,Math.round(state.mode)+2,Math.round(state.mode)+3),2)*55)*0.076:0.25+noise*0.50;
      warm=0.62;
    } else if (scene === 5) {
      const lane=Math.min(6,Math.floor(v*7)),n=lane+1;
      const ghost=(v*7)%1-0.5,envelope=Math.abs(ghost)>0.31;
      const cycle=envelope?Math.sign(ghost):Math.cos(n*t*0.74*(state.frequency/110)+state.phase*0.2);
      x=(u-0.5)*3.5+(lane-3)*0.035;
      y=(lane-3)*0.16+Math.sin(n*Math.PI*u)*cycle*0.20/Math.sqrt(n);
      z=-(lane-3)*0.145;ax=0.73;az=-0.08;cx=mobile?0.5:0.493;cy=mobile?0.32:0.382;
      if(this.shortLandscape)cy=0.32;
      scale=mobile?Math.min(0.17,aspect*0.255):Math.min(0.37,aspect*0.30);
      if(envelope)alpha*=0.42;
      warm=lane===0?0.78:0.1;
    } else if (scene === 6) {
      const path=Math.floor(v*72);
      r=line?0.13+(path+u)/72:0.13+Math.sqrt((Math.floor(u*240)+0.5)/240);
      a=(line?u:v)*TAU+t*0.025;
      const bright=line&&(path%19>=16);
      const cycles=17*(state.frequency/110);
      r+=(Math.sin(a*cycles+state.phase)*0.52+Math.sin(a*cycles*2+state.mode)*0.24+Math.sin(a*cycles*3)*0.11)*(bright?0.0235:0.0025);
      x=Math.cos(a)*r;y=Math.sin(a)*r;
      ax=0.77;az=-0.13;cx=mobile?0.5:0.68;
      scale=mobile?Math.min(0.184,aspect*0.409):Math.min(0.46,aspect*0.305);
      alpha=line?(bright?0.59:0.15):0.1+noise*0.24;warm=bright?0.46:0.19;
    } else {
      r=line?0.03+v*1.28:Math.sqrt((Math.floor(u*120)+0.5)/120)*1.28;a=(line?u:v)*TAU;
      const collapse=Math.pow(1-state.ending,1.45);
      x=Math.cos(a)*r*collapse;y=Math.sin(a)*r*collapse;
      z=(-Math.max(0,0.84-r)*0.27+Math.sin(r*26-t*2.5*(state.frequency/110))*0.03*movement)*collapse;
      z+=(state.impulse*Math.exp(-state.impulseAge*0.72)*Math.sin(r*15-state.impulseAge*8)*0.085+Math.sin(t*2.1)*(state.playing?0.06:0.018)*Math.exp(-r*r*3))*movement*collapse;
      ax=0.57;az=-0.25;cx=mobile?0.5:0.68;cy=mobile?0.32:0.48;
      scale=mobile?Math.min(0.175,aspect*0.365):Math.min(0.37,aspect*0.26);
      alpha*=Math.pow(1-state.ending,3.4);
    }
    const ry=y*Math.cos(ax)-z*Math.sin(ax),rz=y*Math.sin(ax)+z*Math.cos(ax);
    const rx=x*Math.cos(az)-ry*Math.sin(az),yy=x*Math.sin(az)+ry*Math.cos(az);
    const perspective=1/(1+rz*0.075);
    const horizontal=scene===5&&!mobile?0.94:1;
    let vertical=scene===5&&!mobile?0.82:1;
    if(this.shortLandscape&&scene===5)vertical*=0.63;
    if(this.shortLandscape&&scene===3)vertical*=0.74;
    return [(cx+rx*horizontal*scale*perspective/aspect)*this.width,(cy-yy*vertical*scale*perspective)*this.height,alpha,warm];
  }

  _renderCanvas(state) {
    const ctx=this.ctx;
    if (!ctx) return;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,this.width,this.height);
    ctx.globalCompositeOperation='lighter';
    const a=Math.floor(state.scene),b=Math.min(7,a+1),q=state.scene-a;
    const blend=q*q*(3-2*q);
    const point=(u,v,n,line,index=0)=>{
      const start=this._cpuPoint(a,u,v,n,state,line,index);
      if(blend===0){start[1]-=this.liftPixels;return start;}
      const end=this._cpuPoint(b,u,v,n,state,line,index);
      const result=start.map((value,i)=>value+(end[i]-value)*blend);
      result[1]-=this.liftPixels;
      return result;
    };
    const color=(warm,alpha)=>`rgba(${Math.round(238-24*warm)},${Math.round(234-53*warm)},${Math.round(224-100*warm)},${clamp(alpha,0,1).toFixed(3)})`;
    ctx.lineWidth=0.58;
    const paths=this.mobile?35:56,steps=this.mobile?96:144;
    for(let path=0;path<paths;path++){
      const v=(path+0.5)/paths;
      let prior=point(0,v,0.5,true);
      for(let step=1;step<=steps;step++){
        const p=point(step/steps,v,0.5,true);
        ctx.strokeStyle=color(p[3],p[2]);
        ctx.beginPath();ctx.moveTo(prior[0],prior[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();prior=p;
      }
    }
    const count=this.mobile?2800:6200;
    for(let i=0;i<count;i++){
      const k=i*STRIDE,g=this.geometry.particles;
      const p=point(g[k],g[k+1],g[k+2],false,i);
      ctx.fillStyle=color(p[3],p[2]);
      const size=0.58+g[k+2]*0.75;
      ctx.fillRect(p[0],p[1],size,size);
    }
    if(a===0||a===7){
      const x=(this.mobile?0.5:a===0?0.7:0.68)*this.width,y=(this.mobile?0.32:a===0?0.49:0.48)*this.height-this.liftPixels;
      const halo=ctx.createRadialGradient(x,y,0,x,y,24);
      halo.addColorStop(0,'rgba(247,217,170,.82)');halo.addColorStop(0.1,'rgba(231,194,135,.25)');halo.addColorStop(1,'rgba(214,181,124,0)');
      ctx.fillStyle=halo;ctx.fillRect(x-24,y-24,48,48);
    }
    ctx.globalCompositeOperation='source-over';
  }

  get quality() {
    return { renderer:this._renderer, particles:this.ctx?(this.mobile?2800:6200):(this.mobile?MOBILE_PARTICLES:PARTICLES), dpr:this.dpr, pixelBudget:this.canvas.width*this.canvas.height };
  }

  destroy() {
    if(this.destroyed)return;
    this.destroyed=true;
    this.canvas.removeEventListener('webglcontextlost',this._onLost);
    this.canvas.removeEventListener('webglcontextrestored',this._onRestored);
    if(this.gl&&!this.lost){
      for(const item of Object.values(this.buffers||{}))this.gl.deleteBuffer(item.buffer);
      if(this.program)this.gl.deleteProgram(this.program);
    }
    this.fallbackCanvas?.remove();
    this.canvas.style.visibility='';
    this.geometry=null;
    this.ctx=null;
  }
}
