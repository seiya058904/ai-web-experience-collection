export const VERT = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;

const COMMON = `#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime,uExposure;
const float PI=3.14159265;
float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+7.1;a*=.5;}return s;}
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
vec3 starLayer(vec3 d,float scale,float rarity,float size){
  vec3 q=d*scale,id=floor(q),f=fract(q)-.5;
  float h=h13(id);
  if(h<rarity)return vec3(0.);
  float b=(h-rarity)/(1.-rarity);
  float tw=.82+.18*sin(uTime*(1.+h*5.)+h*90.);
  float s=b*b*smoothstep(size,0.,length(f))*tw;
  return s*mix(vec3(1.,.86,.72),vec3(.72,.84,1.),fract(h*37.));
}
vec3 starfield(vec3 d){
  vec3 s=starLayer(d,120.,.982,.26)*1.4+starLayer(d,260.,.975,.32)*.55;
  vec3 axis=normalize(vec3(.42,.5,.76));
  float band=exp(-pow(dot(d,axis)/.24,2.));
  s+=band*(.28+.72*fbm(d*5.5))*vec3(.020,.023,.034);
  return s;
}
vec3 tonemap(vec3 c){c*=uExposure;return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
vec4 finish(vec3 c){c=pow(tonemap(c),vec3(1./2.2));c+=(ign(gl_FragCoord.xy)-.5)/170.;return vec4(c,1.);}
`;

export const SKY_FRAG = `${COMMON}
uniform float uPitch,uYaw,uFocal,uDistance,uKp,uDip;
uniform vec3 uIso,uGlow;
uniform sampler2D uRibbon,uSkyline;
uniform int uSteps,uRibbons;
const float R=6371.;
const float SPAN=2400.;
const vec3 GREEN=vec3(.13,1.,.36);
const vec3 RED=vec3(1.,.07,.11);
const vec3 VIOLET=vec3(.30,.14,1.);
const vec3 PINK=vec3(1.,.16,.42);
// Light comes from gas at a height: green oxygen low, red oxygen high, violet nitrogen at the fringes.
vec3 emission(float h,vec4 c){
  float low=c.a*100.,top=c.b*100.;
  float rise=smoothstep(low-2.5,low+3.5,h);
  float fall=exp(-max(h-low,0.)/(24.+(top-120.)*.42));
  float cap=1.-smoothstep(top-20.,top+70.,h);
  float g=rise*fall*cap*(1.-smoothstep(150.,235.,h)*.92);
  float r=smoothstep(155.,235.,h)*exp(-max(h-235.,0.)/80.)*(.05+.028*uKp);
  float v=exp(-pow((h-low-1.)/6.,2.))*smoothstep(3.,7.,uKp)*.34+smoothstep(170.,270.,h)*exp(-max(h-270.,0.)/70.)*.006*uKp;
  float p=smoothstep(low-7.,low-2.,h)*(1.-smoothstep(low-2.,low+2.,h))*smoothstep(4.5,7.5,uKp);
  return g*uIso.x*GREEN+r*uIso.y*RED+v*uIso.z*VIOLET+p*uIso.x*PINK*.9;
}
// Marches the emitting shell. Each sheet is a thin Gaussian across the ray, integrated analytically
// between samples, so a razor-thin curtain never aliases however long the step becomes.
vec3 aurora(vec3 d,int steps){
  if(d.y<.0015)return vec3(0.);
  float b=R*d.y;
  float t0=-b+sqrt(b*b+85.*(2.*R+85.));
  float t1=-b+sqrt(b*b+340.*(2.*R+340.));
  float tPrev=t0;
  vec3 sum=vec3(0.);
  float prev[3];
  float uPrev=.5,hPrev=85.;
  float width=4.5+uKp*.55;
  for(int i=0;i<=steps;i++){
    // Samples crowd the sharp lower border, where the light changes fastest.
    float t=t0+(t1-t0)*pow(float(i)/float(steps),1.65);
    float L=max(t-tPrev,.001);
    tPrev=t;
    vec3 p=d*t;
    float rho=max(length(p.xz),.001);
    float gamma=atan(rho,R+p.y);
    float arc=R*gamma;
    float h=sqrt(rho*rho+(R+p.y)*(R+p.y))-R;
    float X=p.x/rho*arc;
    float Z=p.z/rho*arc-uDistance-(h-105.)*uDip;
    float u=X/SPAN+.5;
    for(int r=0;r<uRibbons;r++){
      float v=(float(r)+.5)/3.;
      vec4 c=texture(uRibbon,vec2(u,v));
      float s=Z-c.r*100.;
      if(i>0){
        float s0=prev[r];
        // A soft veil around each sheet, free of ray detail so long steps cannot weave a pattern.
        sum+=L*exp(-(s*s)/3600.)*.0012*(.14+.17*uKp)*emission(h,vec4(0.,0.,1.75,1.03));
        if(abs(s0)<width*3.||abs(s)<width*3.||s0*s<0.){
          float ds=s-s0;
          float a=abs(ds)<.02*width?L*exp(-(s*s)/(width*width)):L*(tanh(1.2025*s/width)-tanh(1.2025*s0/width))*(width*.8862)/ds;
          // Read colour and rays where the ray actually crosses the sheet, not at the step's end.
          float f=abs(ds)<1e-3?1.:clamp(s0/(s0-s),0.,1.);
          vec4 cc=texture(uRibbon,vec2(mix(uPrev,u,f),v));
          sum+=a*cc.g*emission(mix(hPrev,h,f),cc);
        }
      }
      prev[r]=s;
    }
    uPrev=u;
    hPrev=h;
  }
  return sum*.04*exp(-.085/max(d.y,.035));
}
vec3 sky(vec3 d,int steps){
  float up=max(d.y,0.);
  vec3 c=mix(vec3(.010,.019,.036),vec3(.0035,.006,.014),smoothstep(0.,.55,up));
  c+=vec3(.0035,.008,.006)*exp(-up*13.);
  c+=uGlow*.012*exp(-up*4.);
  c+=starfield(d)*smoothstep(0.,.1,up);
  return c+aurora(d,steps);
}
vec3 silhouettes(vec3 c,vec3 d,vec2 line,float aa){
  float e=asin(clamp(d.y,-1.,1.));
  vec3 far=vec3(.0026,.0042,.0078)+uGlow*.005;
  vec3 near=vec3(.0004,.0007,.0014)+uGlow*.0005;
  c=mix(c,far,smoothstep(line.x+aa,line.x-aa,e));
  return mix(c,near,smoothstep(line.y+aa,line.y-aa,e));
}
void main(){
  vec2 q=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 d=normalize(vec3(q,uFocal));
  float cp=cos(uPitch),sp=sin(uPitch);
  d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);
  float cy=cos(uYaw),sy=sin(uYaw);
  d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);
  float aa=2./(uRes.y*uFocal);
  vec3 c;
  if(d.y>=0.){
    float az=atan(d.x,d.z);
    vec2 line=texture(uSkyline,vec2(az/(2.*PI)+.5,.5)).rg;
    c=silhouettes(sky(d,uSteps),d,line,aa);
  }else{
    // A still lake: the mirrored sky, broken by slow ripples, stronger toward the horizon.
    vec2 w=d.xz/max(-d.y,.012);
    float n=vn(vec3(w*vec2(1.1,.32),uTime*.14))+.5*vn(vec3(w*vec2(3.,.9),uTime*.2));
    vec3 r=normalize(vec3(d.x+(n-.75)*.0035,max(-d.y+(n-.75)*.012,.001),d.z));
    float az=atan(r.x,r.z);
    vec2 line=texture(uSkyline,vec2(az/(2.*PI)+.5,.5)).rg;
    vec3 m=silhouettes(sky(r,max(uSteps*2/3,14)),r,line,aa*2.);
    float fresnel=mix(.32,.8,pow(1.-clamp(-d.y,0.,1.),7.));
    c=m*fresnel+vec3(.0005,.0009,.0018);
  }
  fragColor=finish(c);
}`;

export const SPACE_FRAG = `${COMMON}
uniform vec3 uPos,uRight,uUp,uFwd;
uniform float uFocal,uR0,uAlpha,uBow,uDiagram,uOpen,uKp,uOvalEq,uObserver,uRing,uHasEarth,uWind,uLc;
uniform mat3 uGeo;
uniform sampler2D uEarth;
float sphere(vec3 ro,vec3 rd,float r){float b=dot(ro,rd),c=dot(ro,ro)-r*r,h=b*b-c;return h<0.?-1.:-b-sqrt(h);}
float lineOf(float f){float w=fwidth(f)+1e-5;return 1.-smoothstep(0.,1.3,abs(f)/w);}
float cycleLine(float g){float w=fwidth(g)+1e-5;return 1.-smoothstep(0.,1.15,abs(fract(g+.5)-.5)/w);}
vec3 meridian(vec2 P){
  vec3 c=vec3(0.);
  float r=length(P),az=abs(P.y);
  float th=atan(az,P.x);
  float rb=uR0*pow(2./(1.+cos(min(th,3.03))),uAlpha);
  float fm=r-rb;
  float inside=smoothstep(.25,-.25,fm);
  c+=vec3(.012,.026,.05)*inside*.28;
  // Solar wind as potential flow around a blunt body: exact, straight upstream, deflected at the shock.
  float sinc=th<.002?1.:th/sin(min(th,3.12));
  float bowR=uBow*sinc;
  float outside=smoothstep(bowR-.2,bowR+.2,r);
  float flow=uR0*1.04;
  float psi=az-flow*th;
  float g=psi*.56;
  float id=floor(g+.5);
  float phi=-P.x+flow*log(max(r,1.));
  float ph=fract(phi*.17-uTime*uWind*1.4+fract(id*.618)*5.);
  float dash=smoothstep(0.,.05,ph)*(1.-smoothstep(.05,.42,ph));
  float sheath=1.+.9*(1.-outside);
  c+=vec3(.72,.8,.9)*cycleLine(g)*dash*.4*sheath*smoothstep(0.,.5,fm)*smoothstep(26.,10.,psi);
  c+=vec3(.42,.5,.62)*lineOf(r-bowR)*.5*smoothstep(3.03,1.9,th);
  c+=vec3(.86,.94,1.)*lineOf(fm)*.95*smoothstep(3.03,2.5,th);
  // Earth's dipole, stretched downwind into the tail. Field lines stop at the boundary.
  float xs=P.x<0.?P.x/(1.+.075*abs(P.x)):P.x;
  float r2=length(vec2(xs,P.y));
  float cl=abs(xs)/max(r2,1e-3);
  float shell=r2/max(cl*cl,1e-3);
  float lg=log(shell)/log(1.42);
  float dayOpen=P.x>0.?mix(1.,smoothstep(rb*.97,rb*.58,r),uOpen):1.;
  c+=vec3(.42,.6,.82)*cycleLine(lg)*inside*smoothstep(1.,1.5,r)*smoothstep(60.,6.,shell)*dayOpen*.2;
  // Where the fields join: at the nose, and again far down the tail.
  vec2 nose=vec2(uR0,0.);
  vec2 tail=vec2(-uR0*2.3,0.);
  float pulse=.7+.3*sin(uTime*2.1);
  c+=vec3(.75,.9,1.)*uOpen*(.2/(1.+dot(P-nose,P-nose)*5.)+.16*pulse/(1.+dot(P-tail,P-tail)*3.2));
  // Stored energy falls along the shell that maps to the oval, on the night side only.
  float lgc=log(uLc)/log(1.42);
  float near=1.-smoothstep(0.,.16,abs(lg-lgc));
  float lat=atan(az,abs(xs));
  float fall=fract(lat*7.-uTime*(.7+uKp*.22));
  float drop=smoothstep(.0,.08,fall)*(1.-smoothstep(.08,.4,fall));
  c+=vec3(.45,1.,.62)*near*drop*inside*smoothstep(.5,-1.5,P.x)*smoothstep(1.,1.25,r)*uKp*.11;
  return c;
}
// The oval on a thin shell, in Sun-fixed magnetic coordinates. Earth turns beneath it.
vec3 oval(vec3 p,vec3 rd,float gain){
  float lat=asin(clamp(abs(p.z)/length(p),0.,1.))*180./PI;
  float cl=max(length(p.xy),1e-3);
  float phase=.5*(1.+p.x/cl);
  float eq=uOvalEq+10.*phase;
  float w=(4.+.7*uKp)*(1.-.55*phase);
  float band=smoothstep(eq-1.1,eq+.7,lat)*(1.-smoothstep(eq+w-1.8,eq+w+1.2,lat));
  float a=atan(p.y,-p.x);
  float arcs=.42+.58*vn(vec3(cos(a)*7.,sin(a)*7.,uTime*.05+lat*.34));
  float rays=.62+.55*vn(vec3(cos(a)*46.,sin(a)*46.,uTime*.4));
  float slant=1./max(abs(dot(normalize(p),rd)),.18);
  float night=mix(1.,.2,phase);
  vec3 tone=mix(vec3(.14,1.,.38),vec3(1.,.14,.17),smoothstep(.45,1.,(lat-eq)/w)*smoothstep(3.,8.,uKp)*.55);
  return tone*band*arcs*rays*night*slant*gain*(.22+.2*uKp);
}
void main(){
  vec2 q=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 rd=normalize(uFwd*uFocal+uRight*q.x+uUp*q.y);
  vec3 ro=uPos;
  vec3 c=starfield(rd)*.8;
  // The Sun is out of frame to the left. Its light arrives before anything else.
  c+=vec3(1.,.82,.62)*.03*exp(-max(q.x+uRes.x/uRes.y,0.)*3.2)*uDiagram;
  float te=sphere(ro,rd,1.);
  const vec3 SUN=vec3(1.,0.,0.);
  float glowT=-dot(ro,rd);
  float closest=length(ro+rd*max(glowT,0.));
  if(te<0.){
    float lim=smoothstep(1.075,1.,closest);
    vec3 pa=ro+rd*max(glowT,0.);
    float day=smoothstep(-.35,.5,dot(normalize(pa),SUN));
    c+=vec3(.20,.42,1.)*lim*lim*day*.55;
  }
  if(uDiagram>.002&&te<0.&&abs(rd.y)>1e-3){
    float t=-ro.y/rd.y;
    if(t>0.){vec3 P=ro+rd*t;c+=meridian(P.xz)*uDiagram;}
  }
  if(te>0.){
    vec3 p=ro+rd*te;
    vec3 g=uGeo*p;
    float lon=atan(g.y,g.x),la=asin(clamp(g.z,-1.,1.));
    vec2 uv=vec2(lon/(2.*PI)+.5,.5-la/PI);
    vec3 alb=uHasEarth>.5?pow(textureLod(uEarth,uv,clamp(log2(326./(.5*uRes.y*uFocal/max(te,.01))),0.,7.)).rgb,vec3(2.2)):vec3(.02,.05,.11);
    float sun=dot(p,SUN);
    float lit=smoothstep(.0,.3,sun);
    c=alb*lit*.8+alb*.0035;
    float fres=pow(1.-max(dot(p,-rd),0.),4.);
    c+=vec3(.22,.45,1.)*fres*smoothstep(-.3,.45,sun)*.75;
    if(uRing>.002){
      float lat=asin(clamp(p.z,-1.,1.))*180./PI;
      float grat=max(max(lineOf(lat-50.),lineOf(lat-60.)),max(lineOf(lat-70.),lineOf(lat-80.)));
      c+=vec3(.5,.6,.72)*grat*.16*uRing;
      float a=atan(p.y,-p.x);
      float dashes=step(.5,fract(a*18./PI));
      c+=vec3(1.)*lineOf(lat-uObserver)*dashes*.85*uRing;
    }
  }
  // Three shells give the light height, so the oval lifts off the limb.
  float s1=sphere(ro,rd,1.016);
  if(s1>0.)c+=oval(ro+rd*s1,rd,.09);
  float s2=sphere(ro,rd,1.032);
  if(s2>0.)c+=oval(ro+rd*s2,rd,.05);
  fragColor=finish(c);
}`;
