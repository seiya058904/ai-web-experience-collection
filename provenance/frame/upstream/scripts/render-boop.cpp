// FRAME — deterministic, offline digital-clay renderer.
// Original modelling and rendering code. No photos, online API or GPU required.
// Build: c++ -O3 -std=c++17 -fopenmp render-boop.cpp -o render-boop
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using std::max; using std::min;
constexpr double PI=3.14159265358979323846;
struct V { double x=0,y=0,z=0; V operator+(V b)const{return{x+b.x,y+b.y,z+b.z};}V operator-(V b)const{return{x-b.x,y-b.y,z-b.z};}V operator-()const{return{-x,-y,-z};}V operator*(double a)const{return{x*a,y*a,z*a};}V operator/(double a)const{return{x/a,y/a,z/a};}};
V mul(V a,V b){return{a.x*b.x,a.y*b.y,a.z*b.z};}double dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}V cross(V a,V b){return{a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};}double length(V v){return sqrt(dot(v,v));}V norm(V v){return v/max(length(v),1e-12);}V absV(V v){return{fabs(v.x),fabs(v.y),fabs(v.z)};}V maxV(V v,double a){return{max(v.x,a),max(v.y,a),max(v.z,a)};}double clamp(double a,double l=0,double h=1){return max(l,min(h,a));}double mix(double a,double b,double t){return a+(b-a)*t;}V mix(V a,V b,double t){return a+(b-a)*t;}double smoothstep(double a,double b,double t){t=clamp((t-a)/(b-a));return t*t*(3-2*t);}double smin(double a,double b,double k){double h=clamp(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1-h);}double smax(double a,double b,double k){return-smin(-a,-b,k);}
double box(V p,V b,double r){V q=absV(p)-b;return length(maxV(q,0))+min(max(q.x,max(q.y,q.z)),0.)-r;}
double capsule(V p,V a,V b,double r){V pa=p-a,ba=b-a;double h=clamp(dot(pa,ba)/dot(ba,ba));return length(pa-ba*h)-r;}
double ellipsoid(V p,V r){V a={p.x/r.x,p.y/r.y,p.z/r.z},b={p.x/(r.x*r.x),p.y/(r.y*r.y),p.z/(r.z*r.z)};double k0=length(a),k1=length(b);return k0*(k0-1)/max(k1,1e-7);}
double triangle(V p,V a,V b,V c){V ba=b-a,pa=p-a,cb=c-b,pb=p-b,ac=a-c,pc=p-c,n=cross(ba,ac);auto sign=[](double x){return x<0?-1.:1.;};double sum=sign(dot(cross(ba,n),pa))+sign(dot(cross(cb,n),pb))+sign(dot(cross(ac,n),pc));if(sum<2){V qa=ba*clamp(dot(ba,pa)/dot(ba,ba))-pa,qb=cb*clamp(dot(cb,pb)/dot(cb,cb))-pb,qc=ac*clamp(dot(ac,pc)/dot(ac,ac))-pc;return sqrt(min(dot(qa,qa),min(dot(qb,qb),dot(qc,qc))));}return fabs(dot(n,pa))/length(n);}
uint32_t hash(uint32_t x){x^=x>>16;x*=0x7feb352d;x^=x>>15;x*=0x846ca68b;x^=x>>16;return x;}double hash3(int x,int y,int z){return (hash(uint32_t(x)*0x9e3779b9u ^ uint32_t(y)*0x85ebca6bu ^ uint32_t(z)*0xc2b2ae35u)&0xffffff)/double(0xffffff);}
double tri2(V p,V a,V b,V c){p.z=a.z=b.z=c.z=0;V ba=b-a,cb=c-b,ac=a-c;V pa=p-a,pb=p-b,pc=p-c;double d=min(length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba))),min(length(pb-cb*clamp(dot(pb,cb)/dot(cb,cb))),length(pc-ac*clamp(dot(pc,ac)/dot(ac,ac)))));double e1=ba.x*pa.y-ba.y*pa.x,e2=cb.x*pb.y-cb.y*pb.x,e3=ac.x*pc.y-ac.y*pc.x;return ((e1>=0&&e2>=0&&e3>=0)||(e1<=0&&e2<=0&&e3<=0))?-d:d;}
struct Noise{double value;V grad;};
Noise noise(V p){int ix=int(floor(p.x)),iy=int(floor(p.y)),iz=int(floor(p.z));double x=p.x-ix,y=p.y-iy,z=p.z-iz;double sx=x*x*(3-2*x),sy=y*y*(3-2*y),sz=z*z*(3-2*z);double dx=6*x*(1-x),dy=6*y*(1-y),dz=6*z*(1-z);double a[2][2][2];for(int i=0;i<2;i++)for(int j=0;j<2;j++)for(int k=0;k<2;k++)a[i][j][k]=hash3(ix+i,iy+j,iz+k);double yz0=mix(mix(a[0][0][0],a[1][0][0],sx),mix(a[0][1][0],a[1][1][0],sx),sy),yz1=mix(mix(a[0][0][1],a[1][0][1],sx),mix(a[0][1][1],a[1][1][1],sx),sy);double gx=mix(mix(a[1][0][0]-a[0][0][0],a[1][1][0]-a[0][1][0],sy),mix(a[1][0][1]-a[0][0][1],a[1][1][1]-a[0][1][1],sy),sz)*dx;double gy=mix(mix(a[0][1][0]-a[0][0][0],a[1][1][0]-a[1][0][0],sx),mix(a[0][1][1]-a[0][0][1],a[1][1][1]-a[1][0][1],sx),sz)*dy;return{mix(yz0,yz1,sz),{gx,gy,(yz1-yz0)*dz}};}
struct Pose{std::string name;int frame;double bx,by,bpx,bpy,sx,sy,lean,fold,gx,gy,open,mouth;V lf,rf,lh,rh;double lr,rr;bool contact;};
struct Hit{double d;int m;};
struct Scene{
 Pose p;bool portrait=false,hero=false,heroPortrait=false;double c=1,s=0;V leftShoulder,rightShoulder,leftElbow,rightElbow,leftHand,rightHand,leftAnkle,rightAnkle;double target=1.35; 
 double bulge(double x,double y)const{return .045*clamp(1-(x/.76)*(x/.76))*clamp(1-(y/.85)*(y/.85));}
 V local(V q)const{q=q-V{p.bpx,p.bpy,0};return{(c*q.x+s*q.y)/p.sx,(-s*q.x+c*q.y)/p.sy,q.z};}
 V global(V q)const{q={q.x*p.sx,q.y*p.sy,q.z};return{c*q.x-s*q.y+p.bpx,s*q.x+c*q.y+p.bpy,q.z};}
 V localNormal(V q)const{return {c*q.x/p.sx-s*q.y/p.sy,s*q.x/p.sx+c*q.y/p.sy,q.z};}
 void setup(Pose po,bool port,bool resting=false,bool heroView=false,bool heroPortraitView=false){p=po;portrait=port;hero=heroView||heroPortraitView;heroPortrait=heroPortraitView;
 if(resting){p.bpx=-.18;p.bpy=.68;p.sy=.93;p.sx=1.04;p.lean=-.025;p.gx=.18;p.gy=.015;p.mouth=.48;p.open=.86;p.contact=false;p.lf={p.bpx-.28,0,.61};p.rf={p.bpx+.28,0,.50};}
if(port||hero){double travel=heroPortrait?.18:hero?.35:.58,stance=heroPortrait?.1968:hero?.156:.10,bodyOffset=heroPortrait?-1.025:hero?-.8125:-.525;double nb=target+(p.bx-target)*(hero&&p.bx>target?1.:travel),delta=nb-p.bx;p.bx=nb;p.bpx+=delta;p.lf.x=target+(p.lf.x-target)*travel+bodyOffset-stance;p.rf.x=target+(p.rf.x-target)*travel+bodyOffset+stance;p.lh.x+=delta;p.rh.x+=delta;}c=cos(p.lean);s=sin(p.lean);leftShoulder=global({.40,-.34,.29});rightShoulder=global({.46,-.07,-.18});leftHand=p.lh;rightHand=p.rh;if(p.contact){if(p.frame>=19&&p.frame<=22){leftHand.z+=.127;}else{leftHand.x-=.125;}rightHand.y+=.103;}else{leftHand.x-=.105;leftHand.z=.33;leftHand.y+=.075;rightHand.x=p.bpx+.76;rightHand.z=-.13;rightHand.y=max(.57,p.rh.y+.30);}if(resting){leftShoulder=global({.26,-.22,.30});leftHand=global({.31,-.49,.48});rightShoulder=global({.46,-.12,-.10});rightHand=global({.59,-.34,.28});}
 leftElbow=mix(leftShoulder,leftHand,.55)+V{.005,-.07,.075};rightElbow=mix(rightShoulder,rightHand,.55)+V{.005,.025,-.035};leftAnkle=global({clamp((p.lf.x-p.bpx)/p.sx,-.48,.48),-.60,.18});rightAnkle=global({clamp((p.rf.x-p.bpx)/p.sx,-.48,.48),-.60,.16});}
 double body(V q,bool detail)const{
  V w=q;w.x-=.115*q.y + .025*sin(q.y*4.5);w.y+=.025*q.x+.012*sin(q.x*5.0);w.z-=bulge(q.x,q.y);
  double d=box(w,{.47,.55,.16},.19); // purposefully irregular slab, not a rounded cube
  // The folded corner has a real diagonal crease and a thick triangular flap.
  double cut=(q.x+q.y-1.255)*.70710678;d=smax(d,cut,.045);
  double ft=clamp((.735-q.y)/.28);double fz=.262+.162*sin(ft*PI*.64)+p.fold*.45;
  double xy=tri2(q,{.335,.722,0},{.650,.475,0},{.455,.475,0});double zz=fabs(q.z-fz)-.018;
  double flap=(sqrt(max(xy,0.)*max(xy,0.)+max(zz,0.)*max(zz,0.))+min(max(xy,zz),0.)-.032)*.76;
  d=smin(d,flap,.026);
  // Permanent broad thumb dimple, attached to local coordinates.
  double dent=length(q-V{-.405,-.405,.539})-.192;d=smax(d,-dent,.012);
  if(q.z>.30&&fabs(q.x+.405)<.17&&fabs(q.y+.405)<.15){double dx=q.x+.405,dy=(q.y+.405)*1.10;double rr=sqrt(dx*dx+dy*dy);double a=atan2(dy,dx);double envelope=(1-smoothstep(.095,.151,rr))*smoothstep(.30,.34,q.z);d+=.0033*sin(rr*300+.65*sin(a)+.35*sin(a*3))*envelope;}

  if(detail&&q.z>.27&&fabs(q.x-.205)<.18&&fabs(q.y+.055)<.1){
   double md=1;for(int i=0;i<7;i++){double u0=-1.+i*2./7,u1=-1.+(i+1)*2./7;double cur=(p.mouth+.12)*.066;V a={.205+u0*.096,-.055+cur*u0*u0,.343},b={.205+u1*.096,-.055+cur*u1*u1,.343};a.z+=bulge(a.x,a.y);b.z+=bulge(b.x,b.y);md=min(md,capsule(q,a,b,.019));}d=max(d,-md);
  }
  return d*min(p.sx,p.sy);
 }
 Hit map(V v,bool details=true)const{
  Hit h={v.y,0};auto add=[&](double d,int m){if(d<h.d)h={d,m};};
  V bp=v-V{p.bx,p.by,0};add(box(bp,{.32,.28,.32},.08),2);
  // Low raised outline remains visible around the precisely aligned cube.
  if(fabs(v.x-target)<1.2&&fabs(v.z)<1.2&&v.y<1){double yy=.028,ed=.535;double r=.039;add(capsule(v,{target-ed,yy,-ed},{target+ed,yy,-ed},r),4);add(capsule(v,{target-ed,yy,ed},{target+ed,yy,ed},r),4);add(capsule(v,{target-ed,yy,-ed},{target-ed,yy,ed},r),4);add(capsule(v,{target+ed,yy,-ed},{target+ed,yy,ed},r),4);}
  V q=local(v);double bound=box(q,{.82,.86,.5},.12);if(bound<h.d+.12){
   add(body(q,details),1);
   if(details&&q.z>.20&&q.y>-.02&&q.y<.45){double ex=.025*p.gx,ey=.018*p.gy;add(ellipsoid(q-V{.085+ex,.165+ey,.356+bulge(.085+ex,.165+ey)},{.044,.046*p.open,.039}),3);add(ellipsoid(q-V{.347+ex,.178+ey,.352+bulge(.347+ex,.178+ey)},{.044,.046*p.open,.039}),3);}
  }
  add(smin(capsule(v,leftShoulder,leftElbow,.120),capsule(v,leftElbow,leftHand,.127),.08),1);
  add(smin(capsule(v,rightShoulder,rightElbow,.102),capsule(v,rightElbow,rightHand,.103),.07),1);
  // Feet retain authored support coordinates. Legs bend toward planted soles.
  V fl=p.lf+V{0,.105,.025},fr=p.rf+V{0,.105,0};
  add(ellipsoid(v-fl,{.225,.135,.255}),5);add(ellipsoid(v-fr,{.218,.135,.245}),5);
  add(capsule(v,leftAnkle,fl+V{.025,.055,-.025},.097),5);add(capsule(v,rightAnkle,fr+V{0,.055,0},.095),5);
  return h;
 }
 double dist(V v)const{return map(v,false).d;}
 V normal(V v)const{const double e=.0008;V a={1,-1,-1},b={-1,-1,1},c0={-1,1,-1},d={1,1,1};return norm(a*map(v+a*e).d+b*map(v+b*e).d+c0*map(v+c0*e).d+d*map(v+d*e).d);}
 double shadow(V ro,V rd)const{double res=1,t=.018;for(int i=0;i<48&&t<8;i++){double h=dist(ro+rd*t);if(h<.0005)return 0;res=min(res,3.1*h/t);t+=clamp(h,.025,.65);}return clamp(res);}
 double ao(V pos,V nor)const{double occ=0,sca=1;for(int i=1;i<=5;i++){double h=.025+i*.048;double d=dist(pos+nor*h);occ+=(h-d)*sca;sca*=.72;}return clamp(1-1.85*occ,.22,1);}
 V shade(V pos,V rd,int mat)const{
  V n=normal(pos),tex=pos;
  V base={.68235,.81569,.76863};double rough=.87;
  if(mat==1){base={.644,.552,.718};tex=local(pos);double u=(tex.x-.205)/.096;if(fabs(u)<1.12&&tex.z>.29){double my=-.055+(p.mouth+.12)*.066*u*u;double ink=1-smoothstep(.010,.024,fabs(tex.y-my));base=base*(1-.24*ink);}}
  if(mat==2){base={.839,.420,.400};tex=pos-V{p.bx,p.by,0};rough=.79;}
  if(mat==3){base={.029,.026,.034};rough=.23;}
  if(mat==4){base={.894,.847,.545};rough=.86;}
  if(mat==5){base={.918,.884,.745};tex=pos-V{p.bpx,0,0};rough=.92;}
  if(mat!=3){
   Noise micro=noise(tex*(mat==0?180:105)),broad=noise(tex*22);
   V gr=micro.grad*(mat==0?.035:.19)+broad.grad*.025;
   if(mat==1){
    // Concentric compressed ridges within the fixed thumb depression.
    double dx=tex.x+.405,dy=(tex.y+.405)*1.10;double rr=sqrt(dx*dx+dy*dy);double env=(1-smoothstep(.075,.150,rr))*smoothstep(.26,.33,tex.z);
    if(rr>.005&&env>0){double a=atan2(dy,dx),der=cos(rr*300+.65*sin(a)+.35*sin(a*3))*.025*env;gr.x+=dx/rr*der;gr.y+=dy/rr*der;}
    gr=localNormal(gr);
   }
   n=norm(n-gr+n*dot(gr,n));double tone=1+(micro.value-.5)*(mat==0?.013:.075)+(broad.value-.5)*.018;base=base*tone;
  }
  V light=norm({-3.4,6.0,4.6});double diffuse=max(0.,dot(n,light));double sh=shadow(pos+n*.008,light);double oc=ao(pos,n);
  double ambient=mat==1?(.51+.10*max(0.,n.y)+.025*max(0.,n.z)):(.59+.13*max(0.,n.y)+.055*max(0.,n.z));double illum=(ambient+(mat==1?.60:.42)*diffuse*sh)*(.65+.35*oc);
  // Broad, low intensity clay highlight; eyes keep a tiny glassy catchlight.
  V halfv=norm(light-rd);double exponent=mat==3?90:18;double spec=pow(max(0.,dot(n,halfv)),exponent)*(mat==3?.6:.012)*sh;
  V out={pow(base.x,2.2)*illum+spec,pow(base.y,2.2)*illum+spec,pow(base.z,2.2)*illum+spec};
  if(mat==0){double footOc=clamp(oc);out=out*(.77+.23*footOc);}
  return{pow(max(0.,out.x),1/2.2),pow(max(0.,out.y),1/2.2),pow(max(0.,out.z),1/2.2)};
 }
};
struct Camera{V origin,forward,right,up;double width;};
Camera cameraFor(const Scene&s,const std::string &mode,int w,int h){V target;V delta;double width;
 if(s.heroPortrait){target={.49,.82,.02};delta={-1.8,2.0,9};width=3.72;}
 else if(s.hero){target={.24,.78,.02};delta={-1.8,2.0,9};width=4.20;}
 else if(mode=="stage"){target=s.portrait?V{-.10,.72,0}:V{-.75,.72,0};delta=s.portrait?V{-3.2,3.0,9.0}:V{-2.25,2.75,9.0};width=s.portrait?4.9:7.05;}
 else if(mode=="overhead"){target={s.p.bx-.45,.35,0};delta={-1.5,7.2,4.4};width=s.portrait?3.8:4.4;}
 else if(mode=="preparation"||mode=="glance"){target={s.portrait?-1.161:-2.40,.82,.02};delta={-1.5,2.05,9};width=s.portrait?2.95:3.9;}
 else if(mode=="contact"||mode=="pushing"){target={s.portrait?-.80:-1.75,.78,.02};delta={-1.5,2.05,9};width=s.portrait?3.75:4.35;}
 else if(mode=="resting"){target={.48,.70,.04};delta={-1.5,2.05,9};width=s.portrait?3.30:3.9;}
 else{target={s.p.bpx+.45,.82,.02};delta={-1.5,2.05,9};width=s.portrait?2.95:3.9;}
 Camera c;c.origin=target+delta;c.forward=norm(-delta);c.right=norm(cross(c.forward,{0,1,0}));c.up=norm(cross(c.right,c.forward));c.width=width;return c;}
void render(const Scene&s,const std::string&path,int w,int h,int spp,const std::string&mode){Camera cam=cameraFor(s,mode,w,h);std::vector<unsigned char>rgb(size_t(w)*h*3);static const double offsets[4][2]={{.25,.25},{.75,.25},{.25,.75},{.75,.75}};
#pragma omp parallel for schedule(dynamic,2)
 for(int y=0;y<h;y++)for(int x=0;x<w;x++){V color={0,0,0};for(int k=0;k<spp;k++){double ox=spp==1?.5:offsets[k][0],oy=spp==1?.5:offsets[k][1];V ro=cam.origin+cam.right*((x+ox-w*.5)/w*cam.width)+cam.up*((h*.5-y-oy)/w*cam.width);V rd=cam.forward;double t=0;Hit hit{10,0};for(int j=0;j<130&&t<40;j++){hit=s.map(ro+rd*t);if(hit.d<.0006)break;t+=max(hit.d*.88,.0005);}V col={.682,.816,.769};if(t<40)col=s.shade(ro+rd*t,rd,hit.m);color=color+col;}color=color/double(spp);int i=(y*w+x)*3;rgb[i]=int(clamp(color.x)*255+.5);rgb[i+1]=int(clamp(color.y)*255+.5);rgb[i+2]=int(clamp(color.z)*255+.5);}
 std::ofstream o(path,std::ios::binary);o<<"P6\n"<<w<<" "<<h<<"\n255\n";o.write((char*)rgb.data(),rgb.size());}
int main(int argc,char**argv){std::string poseFile,out,camera="landscape",only,mode="stage";int w=1280,h=800,spp=4;for(int i=1;i<argc;i++){std::string a=argv[i];auto val=[&](){if(i+1>=argc)throw std::runtime_error("Missing argument");return std::string(argv[++i]);};if(a=="--poses")poseFile=val();else if(a=="--out")out=val();else if(a=="--camera")camera=val();else if(a=="--only")only=val();else if(a=="--mode")mode=val();else if(a=="--width")w=stoi(val());else if(a=="--height")h=stoi(val());else if(a=="--samples")spp=stoi(val());}
 if(poseFile.empty()||out.empty()||(spp!=1&&spp!=4)){std::cerr<<"Usage: --poses TSV --out DIR [--camera landscape|portrait --only even-01 --mode stage --width1280 --height800 --samples4]\n";return 2;}std::filesystem::create_directories(out);std::ifstream input(poseFile);std::string line;int count=0;while(getline(input,line)){if(line.empty())continue;std::istringstream r(line);Pose p;int contact;r>>p.name>>p.frame>>p.bx>>p.by>>p.bpx>>p.bpy>>p.sx>>p.sy>>p.lean>>p.fold>>p.gx>>p.gy>>p.open>>p.mouth>>p.lf.x>>p.lf.y>>p.lf.z>>p.rf.x>>p.rf.y>>p.rf.z>>p.lh.x>>p.lh.y>>p.lh.z>>p.rh.x>>p.rh.y>>p.rh.z>>p.lr>>p.rr>>contact;p.contact=contact;if(!r){std::cerr<<"Invalid pose line\n";return 3;}if(!only.empty()&&p.name!=only)continue;if((camera=="hero"||camera=="hero-portrait")&&p.name.rfind("even-",0)!=0)continue;Scene s;s.setup(p,camera=="portrait",mode=="resting",camera=="hero",camera=="hero-portrait");auto start=std::chrono::steady_clock::now();render(s,out+"/"+p.name+".ppm",w,h,spp,mode);double elapsed=std::chrono::duration<double>(std::chrono::steady_clock::now()-start).count();std::cout<<p.name<<" "<<w<<"x"<<h<<" "<<elapsed<<"s\n"<<std::flush;count++;}return count?0:4;}
