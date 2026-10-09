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
uniform float uRecoatMode;
uniform float uRecoat;
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
float square(float x){return x*x;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float field(vec2 p){return texture2D(uMaterialField,p).r;}
float softNoise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0)),f.x),f.y);
}
// The widest footprint is the polish front. Its padding also includes the
// bounded material-coordinate jitter, so a completed pass has no edge residue.
float sweepFront(float progress,float feather){
  float padding=max(.12,feather+.065);
  return mix(-padding,1.0+padding,unitClamp(progress));
}
float sweep(float progress,float coordinate,float feather){
  if(progress<=0.0)return 0.0;
  if(progress>=1.0)return 1.0;
  float front=sweepFront(progress,feather);
  return 1.0-smoothstep(front-feather,front+feather,coordinate);
}
float waveAttenuation(float phase){
  return exp(-.5*square(fwidth(phase)));
}
// Filtered values are only used for color/roughness, never differentiated
// again to construct a normal. GLSL does not define higher derivatives.
float filteredWave(float phase){return sin(phase)*waveAttenuation(phase);}
float filmEdge(float progress,float coordinate,float feather){
  float edge=exp(-square((coordinate-sweepFront(progress,feather))/.006));
  return edge*smoothstep(.015,.09,progress)*(1.0-smoothstep(.92,.99,progress));
}

// A fixed window and a dim secondary room wall. The reflection is sampled from
// a world-space reflected direction, never painted in screen space.
vec3 roomReflection(vec3 direction,float roughness){
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
  float sourceHalo=exp(-square((windowDistance-.14)/2.35));
  float longBox=.94*sourceCore+.065*sourceHalo;
  float ends=1.0-smoothstep(1.24,2.35,abs(q.x+.48));
  float brightness=.07+.93*exp(-square((q.x+.84)/.77))+.18*exp(-square((q.x+.38)/1.16));
  float rightEnd=1.0-smoothstep(.14,.56,q.x);
  // Coherent light is the reference. Film and charcoal alter its sampled
  // normal/roughness below; no cloudy noise is multiplied into the light.
  float main=longBox*ends*rightEnd*brightness*facing;
  float energy=mix(.17,1.0,pow(1.0-roughness,1.2));
  vec3 env=vec3(1.0,.895,.78)*main*4.40*energy;

  // A much softer wall is readable below the main strip. It gives black room
  // to hold space while leaving parts of the silhouette deliberately unlit.
  vec2 wallQ=r.xy/max(.10,r.z);
  float wall=exp(-square((wallQ.x+1.70)/(1.85+roughness*.7)))
             *(.35+.65*exp(-square((wallQ.y+.46)/2.20)))*smoothstep(.05,.30,r.z);
  env+=vec3(.92,.79,.62)*wall*.63;
  float lowerWall=exp(-square((wallQ.x+1.60)/2.60)-square((wallQ.y+1.75)/2.50))*smoothstep(.04,.27,r.z);
  env+=vec3(.58,.49,.37)*lowerWall*.16;
  float upperRoom=exp(-square((q.y+.013)/(.033+roughness*.15)))*exp(-square((q.x+.10)/1.50))*facing;
  env+=vec3(.82,.70,.56)*upperRoom*.095;
  env+=vec3(.15,.12,.085)*pow(max(dot(r,normalize(vec3(-.75,-.2,1.0))),0.0),10.0);
  float high=exp(-square((r.y-.91)/.11));
  env+=vec3(.30,.25,.19)*high*.16;
  env+=vec3(.051,.045,.038)*(max(r.y,0.0)*.40+.25);
  return env;
}

vec3 bumpNormal(vec3 normal,vec3 position,vec2 heightGradient){
  vec3 dpdx=dFdx(position),dpdy=dFdy(position);
  vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);
  float determinant=dot(dpdx,r1);
  vec3 gradient=(r1*heightGradient.x+r2*heightGradient.y)*sign(determinant)/max(abs(determinant),.00000001);
  return normalize(normal-gradient);
}

float arcSurfaceSignedDistance(vec3 p,vec3 normal,float base,float height,float rise,float slope){
  vec3 gradient=vec3(-height*slope,1.0,0.0);
  float normalGradient=dot(gradient,normal);
  // Convert the implicit curve's height difference into distance along the
  // actual surface. A shallow crown must not stretch a thin line into a patch.
  float surfaceGradient=sqrt(max(dot(gradient,gradient)-normalGradient*normalGradient,.0025));
  return (p.y-(base+height*rise))/surfaceGradient;
}
vec3 motifSignedDistances(vec3 p){
  float t=unitClamp((p.x+1.00)/1.56);
  float rise=t*t*(3.0-2.0*t);
  float slope=6.0*t*(1.0-t)/1.56;
  vec3 normal=normalize(vObjectNormal);
  float a=arcSurfaceSignedDistance(p,normal,.075,.300,rise,slope);
  float b=arcSurfaceSignedDistance(p,normal,.097,.315,rise,slope);
  float c=arcSurfaceSignedDistance(p,normal,.120,.330,rise,slope);
  return vec3(a,b,c);
}
float thinBandCoverage(float distance,float halfWidth){
  // Integrate each signed thin band before combining the arcs. Differencing
  // the minimum absolute distance can cancel across a line and leave dashes.
  float footprint=max(fwidth(distance),.00016);
  float lower=max(-halfWidth,distance-footprint*.5);
  float upper=min(halfWidth,distance+footprint*.5);
  return unitClamp((upper-lower)/footprint);
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
  float freshFilm=sweep(uRecoat,coatCoordinate,.044);
  float currentAbrasion=uAbrasion*sweep(uAbradeFront,xCoordinate+(coarse-.5)*.10,.09);
  // Between cycles, old lacquer stays cured and abraded until the new film
  // reaches it. At both reset endpoints effective abrasion is exactly .82.
  float repeatedAbrasion=.82*(1.0-freshFilm)+currentAbrasion*freshFilm;
  float abraded=mix(currentAbrasion,repeatedAbrasion,unitClamp(uRecoatMode));
  float polished=sweep(uPolish*1.11,xCoordinate+(coarse-.5)*.06,.16);
  polished*=smoothstep(.005,.08,uPolish);
  float veiled=sweep(uGoldVeil,xCoordinate+(coarse-.5)*.055,.055);
  float revealed=sweep(uGoldReveal,xCoordinate+(coarse-.5)*.07,.085);
  float buried=veiled*(1.0-revealed);
  polished*=1.0-buried;

  // End-grain bends continuously over the lid and shoulder of the same form.
  vec2 grainSpace=vec2(p.x*.40+p.y*.08,p.z*.76+p.y*.26+1.35);
  float grainRadius=length(grainSpace);
  float grainFlow=grainRadius*74.0+softNoise(grainSpace*2.8)*10.5+softNoise(grainSpace*7.6)*2.1;
  float finePhase=grainFlow*3.57+coarse*5.0;
  float rings=pow(unitClamp(filteredWave(grainFlow)*.5+.5),1.8);
  float fine=filteredWave(finePhase)*.5+.5;
  float pore=smoothstep(.66,.91,field(vec2(grainRadius*1.20,p.y*.77+p.z*.13)));
  float woodPattern=.43+.34*rings+.14*fine-.14*pore;
  vec3 woodColor=mix(vec3(.30,.165,.076),vec3(.51,.325,.163),woodPattern);
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
  float wet=unitClamp(1.0-uCure)*coating*mix(1.0,freshFilm,unitClamp(uRecoatMode));
  wet=max(wet,buried*4.0*unitClamp(uGoldVeil)*(1.0-unitClamp(uGoldVeil)));
  float skinRelief=mix(.000028,.000008,polished)*mix(1.0,.48,wet);
  float grainHeight=-pore*.00020*(1.0-grounding);
  grainHeight+=groundGrain*.024*grounding*(1.0-coating);
  grainHeight+=(tiny-.5)*skinRelief*coating;
  grainHeight+=(sin(p.x*7.0+p.z*3.3+uTime*.075)+.35*sin(p.z*11.0-p.x*2.0-uTime*.04))*.00070*wet*(1.0-polished);
  vec2 heightGradient=vec2(dFdx(grainHeight),dFdy(grainHeight));
  // Take first derivatives of raw height, then attenuate their contribution
  // at the pixel footprint. No derivative ever consumes a filtered value.
  float ringHeight=pow(unitClamp(sin(grainFlow)*.5+.5),1.8)*.00085*(1.0-grounding);
  float fineHeight=(sin(finePhase)*.5+.5)*.00020*(1.0-grounding);
  heightGradient+=vec2(dFdx(ringHeight),dFdy(ringHeight))*waveAttenuation(grainFlow);
  heightGradient+=vec2(dFdx(fineHeight),dFdy(fineHeight))*waveAttenuation(finePhase);
  // Charcoal passes are fine, directional and surface-bound. Their oscillation
  // is filtered at the pixel footprint; unresolved marks retain roughness,
  // rather than turning into a coarse cloudy pattern or shimmering lines.
  float strokeCoordinate=p.z+p.y*.22+sin(p.x*1.2)*.009;
  float strokePhaseA=strokeCoordinate*690.0+softNoise(p.xz*3.4)*2.0;
  float strokePhaseB=strokeCoordinate*1190.0+p.x*.8;
  float strokeA=filteredWave(strokePhaseA)*.5+.5;
  float working=abraded*coating*(1.0-polished*.96);
  float workedShoulder=smoothstep(.055,.18,p.y);
  float fineWork=working*workedShoulder;
  float scratchHeightA=pow(unitClamp(sin(strokePhaseA)*.5+.5),6.0)*.76*.000040*fineWork;
  float scratchHeightB=pow(unitClamp(sin(strokePhaseB)*.5+.5),4.0)*.24*.000040*fineWork;
  heightGradient+=vec2(dFdx(scratchHeightA),dFdy(scratchHeightA))*waveAttenuation(strokePhaseA*1.8);
  heightGradient+=vec2(dFdx(scratchHeightB),dFdy(scratchHeightB))*waveAttenuation(strokePhaseB*1.8);
  N=bumpNormal(N,vWorldPosition,heightGradient);

  float lacquerRoughness=mix(.18,.048,polished);
  lacquerRoughness=mix(lacquerRoughness,.54,abraded*(1.0-polished*.94));
  lacquerRoughness=mix(lacquerRoughness,.095,wet*.72);
  float roughness=mix(mix(.84,.73,grounding),lacquerRoughness,coating);
  roughness+=fineWork*((strokeA-.5)*.030+(tiny-.5)*.006);
  roughness=clamp(roughness,.035,.93);

  vec3 lightDirection=normalize(vec3(-1.35,2.55,1.10));
  float diffuse=.16+.84*max(dot(N,lightDirection),0.0);
  float nv=unitClamp(dot(N,V));
  // Dielectric Fresnel: lacquer is not a metal. Gold below has its own lobe.
  float fresnel=.042+.958*pow(1.0-nv,5.0);
  vec3 reflected=roomReflection(reflect(-V,N),roughness);
  vec3 color=base*diffuse;
  float jointReflection=smoothstep(.012,.038,abs(p.y-.034));
  color+=reflected*fresnel*mix(.19,1.0,coating)*jointReflection;
  color+=coating*vec3(.0018,.00125,.0008)*(1.0-nv)*uLayers;

  // A thin coating front is briefly liquid-looking, with no poured cascade.
  float coatingEdge=filmEdge(uCoat,coatCoordinate,.044);
  coatingEdge+=filmEdge(uRecoat,coatCoordinate,.044)*uRecoatMode*coating;
  coatingEdge+=filmEdge(uGoldVeil,xCoordinate+(coarse-.5)*.055,.055)*(1.0-revealed)*.75;
  color+=coatingEdge*vec3(.047,.031,.017)*(.32+.68*max(dot(N,lightDirection),0.0));

  // The brief cross-section is a magnified material window on the shoulder,
  // not an exploded stack or a different object.
  float shoulder=1.0-smoothstep(.0585,.0675,abs(p.y+.0425));
  float span=smoothstep(-1.20,-.80,p.x)*(1.0-smoothstep(.58,.90,p.x));
  float frontFace=smoothstep(.22,.80,p.z);
  float section=uSection*shoulder*span*frontFace;
  float retained=1.0+3.0*unitClamp((uLayers-.22)/.78);
  float sectionY=p.y+(coarse-.5)*.0018;
  float sectionAA=max(fwidth(sectionY),.00035);
  vec3 stratum=vec3(.016,.010,.006);
  stratum=mix(stratum,vec3(.062,.038,.020)*(.88+.12*tiny),1.0-smoothstep(-.102,-.089,sectionY));
  // One existing coat and three retained additions. Artistic thickness is
  // enlarged for reading, with a fixed seat for every layer on reversal.
  for(int i=0;i<4;i++){
    float portion=unitClamp(retained-float(i));
    float bottom=-.090+float(i)*.028;
    float top=bottom+.022*portion;
    float present=smoothstep(.0,.06,portion);
    float band=smoothstep(bottom-sectionAA,bottom+sectionAA,sectionY)*(1.0-smoothstep(top-sectionAA,top+sectionAA,sectionY))*present;
    vec3 layerColor=mix(vec3(.047,.029,.016),vec3(.064,.037,.018),float(i)*.25)*(.94+.06*coarse);
    stratum=mix(stratum,layerColor,band);
    stratum+=vec3(.024,.014,.007)*exp(-square((sectionY-top)/max(.0010,sectionAA)))*present;
  }
  float sectionLight=.28+.72*max(dot(N,lightDirection),0.0);
  color=mix(color,stratum*sectionLight,section*.96);

  // Original shoulder arcs. Real grains are seeded in local material coordinates.
  // They attach to the tacky motif, then may be buried and polished back out.
  vec3 signedMotif=motifSignedDistances(p);
  vec3 arcDistances=abs(signedMotif);
  float distanceToMotif=min(arcDistances.x,min(arcDistances.y,arcDistances.z));
  float onLid=smoothstep(.049,.068,p.y)*smoothstep(.10,.32,p.z)*(1.0-smoothstep(.350,.405,p.y));
  float endFade=smoothstep(-1.49,-1.30,p.x)*(1.0-smoothstep(.70,.95,p.x));
  vec2 widthFootprint=fwidth(p.xy*96.0);
  float widthResolved=1.0-smoothstep(.40,1.0,max(widthFootprint.x,widthFootprint.y));
  float lineWidth=.0019+(softNoise(p.xy*96.0)-.5)*.00065*widthResolved;
  float line=max(thinBandCoverage(signedMotif.x,lineWidth),max(thinBandCoverage(signedMotif.y,lineWidth),thinBandCoverage(signedMotif.z,lineWidth)));
  vec2 goldSpace=vec2(p.x*315.0,p.y*455.0);
  vec2 cell=floor(goldSpace);
  vec2 local=fract(goldSpace)-.5;
  float random=hash(cell);
  vec2 offset=vec2(hash(cell+1.9),hash(cell+8.1))*.46-.23;
  vec2 footprint=fwidth(goldSpace);
  float resolved=1.0-smoothstep(.60,1.35,max(footprint.x,footprint.y));
  float grainAA=max(.025,length(footprint)*.45);
  float grainRadiusGold=mix(.15,.29,hash(cell+4.3));
  float grain=1.0-smoothstep(grainRadiusGold-grainAA,grainRadiusGold+grainAA,length(local-offset));
  grain*=smoothstep(.14,.30,random);
  float grainCoverage=mix(.19,grain,resolved);
  float dustOccupancy=mix(.12,smoothstep(.80,.96,random),resolved);
  float dust=grainCoverage*dustOccupancy*(1.0-smoothstep(.004,.013,distanceToMotif));
  float mask=max(line*(.48+.52*grainCoverage),dust*.42)*onLid*endFade;
  float arrival=sweep(uGold,xCoordinate+(random-.5)*.12,.038);
  float visibility=arrival*(1.0-buried);
  float goldMask=mask*visibility;
  // Once revealed, the same grains sit flush in the polished film. Their
  // normals lose the deposited relief; their surface coordinates never move.
  float relief=mix(.036,.007,revealed)*resolved;
  vec3 goldNormal=normalize(N+vec3((random-.5)*relief,0.0,(hash(cell+3.7)-.5)*relief));
  vec3 goldEnvironment=roomReflection(reflect(-V,goldNormal),mix(.18,.10,revealed));
  float goldNV=unitClamp(dot(goldNormal,V));
  vec3 goldFresnel=vec3(.84,.54,.20)+(vec3(1.0)-vec3(.84,.54,.20))*pow(1.0-goldNV,5.0);
  float goldAngle=.42+.58*pow(1.0-goldNV,.80);
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
