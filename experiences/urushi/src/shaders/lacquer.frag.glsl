precision highp float;

varying vec3 vWorldPosition;
varying vec3 vObjectPosition;
varying vec3 vObjectNormal;
varying vec3 vWorldNormal;
varying vec2 vUv;

uniform sampler2D uMaterialField;
uniform float uWood;
uniform float uGround;
uniform float uCoat;
uniform float uCure;
uniform float uAbrasion;
uniform float uAbradeFront;
uniform float uLayers;
uniform float uVermilion;
uniform float uPolish;
uniform float uGold;
uniform float uGoldVeil;
uniform float uGoldReveal;
uniform float uChamber;
uniform float uSection;
uniform float uReflectionShift;
uniform float uTime;
uniform float uLight;
uniform vec2 uPointer;

float unitClamp(float x){return clamp(x,0.0,1.0);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float field(vec2 p){return texture2D(uMaterialField,p).r;}
float softNoise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0)),f.x),f.y);
}
float sweep(float progress,float coordinate,float feather){
  float front=mix(-.12,1.12,unitClamp(progress));
  return 1.0-smoothstep(front-feather,front+feather,coordinate);
}

// A fixed window and a dim secondary room wall. The reflection is sampled from
// a world-space reflected direction, never painted in screen space.
vec3 roomReflection(vec3 direction,float roughness,float continuity,vec3 p){
  vec3 r=normalize(direction);
  float steering=(uLight-.5)*.32+uReflectionShift+uPointer.x*.020;
  float ca=cos(steering),sa=sin(steering);
  r.xz=mat2(ca,-sa,sa,ca)*r.xz;
  float facing=smoothstep(.04,.26,-r.z);
  vec2 q=r.xy/max(.10,-r.z);
  float width=(.118+roughness*.39)*mix(1.12,.60,smoothstep(-.30,.56,q.x));
  float windowHeight=.55+q.x*.23+uPointer.y*.014;
  float windowDistance=(q.y-windowHeight)/width;
  // The outer edge retains the shape of a real softbox. The inner side rolls
  // into the black, with a much dimmer broad skirt from the room around it.
  float sourceCore=exp(-pow(abs(windowDistance)/(windowDistance<0.0?1.0:1.25),windowDistance<0.0?4.0:2.0));
  float sourceHalo=exp(-pow((windowDistance-.14)/2.35,2.0));
  float longBox=.94*sourceCore+.065*sourceHalo;
  float ends=1.0-smoothstep(1.24,2.35,abs(q.x+.48));
  float brightness=.07+.93*exp(-pow((q.x+.84)/.77,2.0))+.18*exp(-pow((q.x+.38)/1.16,2.0));
  float scars=softNoise(vec2(p.x*5.0,p.z*6.0))+field(p.xz*.18)*.28;
  float breaks=mix(.22+.78*smoothstep(.31,.76,scars),1.0,continuity);
  float rightEnd=1.0-smoothstep(.14,.56,q.x);
  float main=longBox*ends*rightEnd*brightness*facing*breaks;
  float energy=mix(.17,1.0,pow(1.0-roughness,1.2));
  vec3 env=vec3(1.0,.895,.78)*main*4.40*energy;

  // A much softer wall is readable below the main strip. It gives black room
  // to hold space while leaving parts of the silhouette deliberately unlit.
  vec2 wallQ=r.xy/max(.10,r.z);
  float wall=exp(-pow((wallQ.x+1.70)/(1.85+roughness*.7),2.0))
             *(.35+.65*exp(-pow((wallQ.y+.46)/2.20,2.0)))*smoothstep(.05,.30,r.z);
  env+=vec3(.92,.79,.62)*wall*.63;
  float lowerWall=exp(-pow((wallQ.x+1.60)/2.60,2.0)-pow((wallQ.y+1.75)/2.50,2.0))*smoothstep(.04,.27,r.z);
  env+=vec3(.58,.49,.37)*lowerWall*.16;
  float upperRoom=exp(-pow((q.y+.013)/(.033+roughness*.15),2.0))*exp(-pow((q.x+.10)/1.50,2.0))*facing;
  env+=vec3(.82,.70,.56)*upperRoom*.095;
  env+=vec3(.15,.12,.085)*pow(max(dot(r,normalize(vec3(-.75,-.2,1.0))),0.0),10.0);
  float high=exp(-pow((r.y-.91)/.11,2.0));
  env+=vec3(.30,.25,.19)*high*.16;
  env+=vec3(.051,.045,.038)*(max(r.y,0.0)*.40+.25);
  return env;
}

vec3 bumpNormal(vec3 normal,vec3 position,float height){
  vec3 dpdx=dFdx(position),dpdy=dFdy(position);
  vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);
  float determinant=dot(dpdx,r1);
  vec3 gradient=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),.00000001);
  return normalize(normal-gradient);
}

float arcSurfaceDistance(vec3 p,vec3 normal,float base,float height,float rise,float slope){
  vec3 gradient=vec3(-height*slope,1.0,0.0);
  float normalGradient=dot(gradient,normal);
  // Convert the implicit curve's height difference into distance along the
  // actual surface. A shallow crown must not stretch a thin line into a patch.
  float surfaceGradient=sqrt(max(dot(gradient,gradient)-normalGradient*normalGradient,.0025));
  return abs(p.y-(base+height*rise))/surfaceGradient;
}
float motifDistance(vec3 p){
  float t=unitClamp((p.x+1.00)/1.56);
  float rise=t*t*(3.0-2.0*t);
  float slope=6.0*t*(1.0-t)/1.56;
  vec3 normal=normalize(vObjectNormal);
  float a=arcSurfaceDistance(p,normal,.075,.300,rise,slope);
  float b=arcSurfaceDistance(p,normal,.097,.315,rise,slope);
  float c=arcSurfaceDistance(p,normal,.120,.330,rise,slope);
  return min(a,min(b,c));
}

void main(){
  vec3 p=vObjectPosition;
  vec3 N=normalize(vWorldNormal);
  vec3 V=normalize(cameraPosition-vWorldPosition);
  float coarse=softNoise(p.xz*4.5+vec2(p.y*.9));
  float tiny=field(p.xz*.51+vec2(p.y*.41));
  float xCoordinate=unitClamp((p.x+1.80)/3.60);
  float coatCoordinate=xCoordinate+(coarse-.5)*.045;
  float coating=sweep(uCoat,coatCoordinate,.044);
  float grounding=sweep(uGround,coatCoordinate,.065);
  float abraded=uAbrasion*sweep(uAbradeFront,xCoordinate+(coarse-.5)*.10,.09);
  float polished=sweep(uPolish*1.11,xCoordinate+(coarse-.5)*.06,.16);
  polished*=smoothstep(.005,.08,uPolish);

  // End-grain bends continuously over the lid and shoulder of the same form.
  vec2 grainSpace=vec2(p.x*.40+p.y*.08,p.z*.76+p.y*.26+1.35);
  float grainRadius=length(grainSpace);
  float grainFlow=grainRadius*83.0+softNoise(grainSpace*3.0)*7.5;
  float rings=sin(grainFlow)*.5+.5;
  float fine=sin(grainFlow*4.17+coarse*5.0)*.5+.5;
  float pore=smoothstep(.66,.91,field(vec2(grainRadius*1.20,p.y*.77+p.z*.13)));
  float woodPattern=.32+.50*rings+.18*fine-.21*pore;
  vec3 woodColor=mix(vec3(.29,.145,.058),vec3(.54,.345,.170),woodPattern);
  woodColor*=.88+.12*coarse;
  vec3 groundColor=mix(vec3(.028,.021,.014),vec3(.059,.047,.033),coarse*.63+tiny*.37);
  float groundGrain=(tiny-.5)*.013;
  vec3 lacquerColor=vec3(.0078,.0067,.0056)*(1.0+(coarse-.5)*.10);

  // Dense vermilion is a local, surface-bound field. At the end only a quiet
  // lower crescent remains. It never changes navigation or the room palette.
  float redFront=sweep(uVermilion,1.0-xCoordinate,.09);
  float redRegion=smoothstep(-.96,-.15,p.x+.15*sin(p.z*1.8));
  float vermilion=redFront*redRegion*smoothstep(.17,.55,uVermilion);
  float redFoot=(1.0-smoothstep(-.53,-.405,p.y))*uVermilion*.72;
  vermilion=max(vermilion,redFoot);
  float redPigment=.94+.06*coarse;
  vec3 redColor=vec3(.165,.013,.0085)*redPigment;
  lacquerColor=mix(lacquerColor,redColor,vermilion);
  vec3 base=mix(woodColor,groundColor,grounding);
  base=mix(base,lacquerColor,coating);

  // Actual microstructure retreats as ground and lacquer are built. Final
  // black contains no decorative speckling, metallic flake or orange peel.
  float grainHeight=(rings*.00085+fine*.00020-pore*.00020)*(1.0-grounding);
  grainHeight+=groundGrain*.024*grounding*(1.0-coating);
  float scratchWave=sin((p.z+p.y*.21)*155.0+softNoise(p.xz*7.0)*3.2);
  float scratches=pow(scratchWave*.5+.5,5.0)*(.35+.65*coarse);
  grainHeight+=scratches*.000055*abraded*coating*(1.0-polished*.93);
  grainHeight+=(tiny-.5)*mix(.000085,.000008,polished)*coating;
  float wet=unitClamp(1.0-uCure)*coating;
  grainHeight+=sin(p.x*7.0+p.z*3.3+uTime*.10)*.00010*wet*(1.0-uPolish);
  N=bumpNormal(N,vWorldPosition,grainHeight);

  float lacquerRoughness=mix(.255,.048,polished);
  lacquerRoughness=mix(lacquerRoughness,.57,abraded*(1.0-polished*.89));
  lacquerRoughness=mix(lacquerRoughness,.115,wet*.34);
  float roughness=mix(mix(.84,.73,grounding),lacquerRoughness,coating);
  roughness+=coating*abraded*(tiny-.5)*.065;
  roughness=clamp(roughness,.035,.93);
  float continuity=mix(.13,1.0,polished)*(1.0-abraded*.93);

  vec3 lightDirection=normalize(vec3(-1.35,2.55,1.10));
  float diffuse=.16+.84*max(dot(N,lightDirection),0.0);
  float nv=max(dot(N,V),0.0);
  // Dielectric Fresnel: lacquer is not a metal. Gold below has its own lobe.
  float fresnel=.042+.958*pow(1.0-nv,5.0);
  vec3 reflected=roomReflection(reflect(-V,N),roughness,continuity,p);
  vec3 color=base*diffuse;
  float jointReflection=smoothstep(.012,.038,abs(p.y-.034));
  color+=reflected*fresnel*mix(.19,1.0,coating)*jointReflection;
  color+=coating*vec3(.0018,.00125,.0008)*(1.0-nv)*uLayers;

  // A thin coating front is briefly liquid-looking, with no poured cascade.
  float frontAt=mix(-.12,1.12,uCoat);
  float coatingEdge=exp(-pow((coatCoordinate-frontAt)/.008,2.0));
  coatingEdge*=smoothstep(.015,.09,uCoat)*(1.0-smoothstep(.92,.99,uCoat));
  color+=coatingEdge*vec3(.047,.031,.017)*(.32+.68*max(dot(N,lightDirection),0.0));

  // The brief cross-section is a magnified material window on the shoulder,
  // not an exploded stack or a different object.
  float shoulder=1.0-smoothstep(.09,.14,abs(p.y+.12));
  float span=smoothstep(-1.15,-.98,p.x)*(1.0-smoothstep(.87,1.1,p.x));
  float frontFace=smoothstep(.10,.68,p.z);
  float section=uSection*shoulder*span*frontFace;
  float strata=fract((p.y+.26)*110.0+coarse*.12);
  vec3 stratum=mix(vec3(.017,.010,.006),vec3(.075,.031,.013),smoothstep(.18,.28,strata)*(1.0-smoothstep(.60,.72,strata)));
  stratum=mix(stratum,vec3(.014,.014,.012),smoothstep(.78,.83,strata));
  color=mix(color,stratum*diffuse,section*.93);

  // Original shoulder arcs. Real grains are seeded in local material coordinates.
  // They attach to the tacky motif, then may be buried and polished back out.
  float distanceToMotif=motifDistance(p);
  float onLid=smoothstep(.049,.068,p.y)*smoothstep(.10,.32,p.z)*(1.0-smoothstep(.350,.405,p.y));
  float endFade=smoothstep(-1.49,-1.30,p.x)*(1.0-smoothstep(.70,.95,p.x));
  float lineWidth=.00165;
  float line=1.0-smoothstep(lineWidth,lineWidth+max(fwidth(distanceToMotif)*1.2,.0010),distanceToMotif);
  vec2 cell=floor(vec2(p.x,p.y)*370.0);
  vec2 local=fract(vec2(p.x,p.y)*370.0)-.5;
  float random=hash(cell);
  vec2 offset=vec2(hash(cell+1.9),hash(cell+8.1))*.52-.26;
  float grain=1.0-smoothstep(.10,.28,length(local-offset));
  float dust=grain*smoothstep(.72,.95,random)*(1.0-smoothstep(.004,.026,distanceToMotif));
  float mask=max(line*.88,dust*.67)*onLid*endFade;
  float arrival=sweep(uGold,xCoordinate+(random-.5)*.12,.038);
  float veiled=sweep(uGoldVeil,xCoordinate+(coarse-.5)*.055,.055);
  float revealed=sweep(uGoldReveal,xCoordinate+(coarse-.5)*.07,.085);
  float visibility=arrival*(1.0-veiled*(1.0-revealed));
  float goldMask=mask*visibility;
  vec3 goldNormal=normalize(N+vec3((random-.5)*.027,0.0,(hash(cell+3.7)-.5)*.027));
  vec3 goldEnvironment=roomReflection(reflect(-V,goldNormal),.13,.95,p);
  vec3 goldFresnel=vec3(.84,.54,.20)+(vec3(1.0)-vec3(.84,.54,.20))*pow(1.0-max(dot(goldNormal,V),0.0),5.0);
  float goldAngle=.42+.58*pow(1.0-max(dot(goldNormal,V),0.0),.80);
  vec3 goldColor=vec3(.36,.195,.055)*(.12+.43*max(dot(goldNormal,lightDirection),0.0))*goldAngle;
  goldColor+=goldEnvironment*goldFresnel*.28;
  color=mix(color,goldColor,goldMask);

  // Seam belongs to the geometry and remains an almost invisible dark joint.
  float seam=1.0-smoothstep(.0030,.0080,abs(p.y-.034));
  color*=1.0-seam*.57;
  color*=1.0-uChamber*.065;
  color+=vec3((hash(gl_FragCoord.xy)-.5)*.00038);
  gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
