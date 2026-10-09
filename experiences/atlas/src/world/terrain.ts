import * as THREE from "three";
import {
  Geography,
  RasterMeta,
  readGrid,
  readJSON,
  registeredDetail,
  smooth,
} from "../geo";
import type { StoryState } from "../story";
import { createTerrainGeometry, createJoinedDetail } from "./terrain-geometry.ts";
import { observationRadius, observationFragment } from "./observation.ts";

interface Contours {
  lines: { elevation: number; major: boolean; points: [number, number][] }[];
}

const terrainVertex = /* glsl */ `
uniform float uLift;
uniform float uCurvature;
uniform float uRefine;
attribute float aCoarseHeight;
attribute float aDisplayOffset;
varying vec2 vUv;
varying vec3 vWorld;
varying float vHeight;
void main(){
  vUv=uv;
  vec3 p=position;
  // Subtraction leaves every zero-delta shared edge bit-identical for all states.
  p.y=aCoarseHeight+(p.y-aCoarseHeight)*uRefine;
  vHeight=p.y-aDisplayOffset*uRefine;
  p.y*=uLift;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vWorld=p;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const terrainFragment = /* glsl */ `
uniform sampler2D uImage;
uniform sampler2D uRegionImage;
uniform sampler2D uHeight;
uniform sampler2D uRegionHeight;
uniform vec3 uSun;
uniform vec3 uPaper;
uniform vec3 uStone;
uniform vec3 uInk;
uniform vec2 uSize;
uniform vec2 uTexel;
uniform vec2 uRegionSize;
uniform vec2 uRegionTexel;
uniform vec4 uRegionBounds;
uniform vec3 uFog;
uniform float uRefine;
uniform float uSpan;
uniform float uSurface;
uniform float uLift;
uniform float uDrape;
uniform float uContours;
uniform float uVisibility;
uniform float uNight;
uniform float uCity;
uniform float uDetail;
uniform float uImageReady;
uniform float uRegionImageReady;
uniform float uImageVisibility;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorld;
varying float vHeight;
${observationFragment}
// N samples are nodes including both geographic bounds, not N image cells.
vec2 nodeUV(vec2 p,vec2 texel){return clamp(p,0.0,1.0)*(1.0-texel)+texel*0.5;}
float sampleHeight(sampler2D field,vec2 p,vec2 texel){
  return texture2D(field,nodeUV(p,texel)).r;
}
vec3 heightField(sampler2D field,vec2 p,vec2 texel,vec2 size){
  vec2 stepUV=texel/(1.0-texel);
  float hL=sampleHeight(field,p-vec2(stepUV.x,0.0),texel);
  float hR=sampleHeight(field,p+vec2(stepUV.x,0.0),texel);
  float hN=sampleHeight(field,p+vec2(0.0,stepUV.y),texel);
  float hS=sampleHeight(field,p-vec2(0.0,stepUV.y),texel);
  return vec3((hL-hR)/(size.x*stepUV.x*2.0),
              (hN-hS)/(size.y*stepUV.y*2.0),
              sampleHeight(field,p,texel));
}
void main(){
  vec2 regionUV=vec2((vWorld.x-uRegionBounds.x)/uRegionBounds.z,
                    1.0-(vWorld.z-uRegionBounds.y)/uRegionBounds.w);
  float regionEdge=min(min(regionUV.x,1.0-regionUV.x),min(regionUV.y,1.0-regionUV.y));
  float alpha=uSurface*uVisibility*smoothstep(0.0,0.032,regionEdge);
  alpha*=observationExposure(vWorld.xz);
  if(alpha<0.003)discard;
  float detailEdge=min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y));
  // The same factual five-percent collar as registeredDetail, including images.
  float fineWeight=uDetail*uRefine*smoothstep(0.0,0.05,detailEdge);
  vec3 regionalField=heightField(uRegionHeight,regionUV,uRegionTexel,uRegionSize);
  vec3 field=regionalField;
  if(uDetail>0.5&&fineWeight>0.0)
    field=mix(regionalField,heightField(uHeight,vUv,uTexel,uSize),fineWeight);
  vec3 n=normalize(vec3(field.x*uLift,1.0,field.y*uLift));
  float sunlight=max(dot(n,uSun),0.0);
  float shadow=1.0;
  vec2 direction=normalize(vec2(uSun.x,-uSun.z));
  float slope=uSun.y/max(length(uSun.xz),0.01);
  if(uLift>0.1){
    for(int i=1;i<=9;i++){
      float dist=float(i)*float(i)*0.048;
      vec2 coord=regionUV+direction*dist/uRegionSize;
      float obstruction=(sampleHeight(uRegionHeight,coord,uRegionTexel)-field.z)*uLift-dist*slope;
      shadow=min(shadow,1.0-smoothstep(-0.035,0.035,obstruction)*0.58);
    }
  }
  // No Laplacian/cavity color boost: it amplified DEM sampling into false steps.
  float shade=(0.61+sunlight*0.53)*shadow;
  vec3 rock=mix(uStone,uPaper,smoothstep(2.8,3.77,field.z)*0.36);
  vec3 illumination=vec3(0.77,0.83,0.86)*0.52+
                    vec3(1.0,0.96,0.87)*(sunlight*0.73)*shadow;
  rock*=illumination;
  vec3 stone=mix(uPaper,rock,uLift);
  vec3 limestone=uPaper*(0.91+sunlight*0.075);
  stone=mix(stone,limestone,uCity);
  float band=abs(fract(field.z*10.0+0.5)-0.5);
  float fw=max(fwidth(field.z*10.0),0.002);
  float contour=1.0-smoothstep(fw*0.25,fw*1.2,band);
  stone=mix(stone,uInk,contour*uContours*0.30);

  // Missing regional imagery cannot be sampled into an otherwise valid DEM.
  vec3 im=stone;
  float regionReady=uDetail>0.5?uRegionImageReady:uImageReady;
  if(regionReady>0.5){
    if(uDetail>0.5)im=texture2D(uRegionImage,regionUV).rgb;
    else im=texture2D(uImage,regionUV).rgb;
  }
  float imageWeight=fineWeight*uImageReady;
  if(uDetail>0.5&&imageWeight>0.0){
    vec3 fineImage=texture2D(uImage,clamp(vUv,0.0,1.0)).rgb;
    im=regionReady>0.5?mix(im,fineImage,imageWeight):fineImage;
  }
  float luminance=dot(im,vec3(0.2126,0.7152,0.0722));
  im=mix(vec3(luminance),im,0.95);
  im*=0.77+shade*0.27;
  float front=regionUV.x*0.60+(1.0-regionUV.y)*0.30+regionalField.z*0.025;
  float regionalDrape=smoothstep(front-0.08,front+0.035,uDrape*1.16-0.09)*regionReady;
  float drape=mix(regionalDrape,1.0,imageWeight)*uImageVisibility;
  vec3 colour=mix(stone,im,drape);
  colour=mix(colour,stone,clamp(uCity,0.0,1.0)*0.96);
  float rim=(1.0-smoothstep(0.0,0.016,abs(front-(uDrape*1.16-0.09))))*
            step(0.03,uDrape)*(1.0-step(0.98,uDrape))*regionReady*uImageVisibility;
  colour+=vec3(0.05,0.05,0.025)*rim;
  vec3 nightRock=vec3(0.022,0.044,0.046)+colour*0.075;
  colour=mix(colour,nightRock,uNight);
  colour*=mix(vec3(1.0),vec3(1.17,0.88,0.64),sin(uNight*3.14159265)*0.56*uCity);
  float haze=smoothstep(uSpan*1.5,uSpan*4.0,distance(cameraPosition,vWorld))*uCity;
  colour=mix(colour,uFog,haze*0.985);
  gl_FragColor=vec4(colour,alpha);
  #include <colorspace_fragment>
}`;

const contourVertex = /* glsl */ `
attribute vec3 aGrid;
attribute float aIsGrid;
attribute float aT;
uniform float uMorph;
uniform float uLift;
uniform float uCurvature;
varying float vIsGrid;
varying float vT;
varying vec2 vMap;
void main(){
  vec3 p=mix(aGrid,position,uMorph);
  p.y=position.y*uLift+0.012;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vIsGrid=aIsGrid;vT=aT;vMap=position.xz;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const contourFragment = /* glsl */ `
uniform vec3 uColour;
uniform float uOpacity;
uniform float uMorph;
uniform float uReveal;
uniform float uIntro;
varying float vIsGrid;
varying float vT;
varying vec2 vMap;
${observationFragment}
void main(){
  float a=uOpacity*mix(vIsGrid,1.0,uMorph);
  a*=1.0-smoothstep(uReveal-0.1,uReveal+0.2,vT);
  float introMask=smoothstep(-3.0,8.0,vMap.x)*smoothstep(5.0,19.0,vMap.y);
  a=max(a,introMask*uIntro*0.09);
  a*=observationExposure(vMap);
  if(a<0.002)discard;
  gl_FragColor=vec4(uColour,a);
  #include <colorspace_fragment>
}`;

function gridTexture(data: Float32Array, size: number) {
  const out = new Float32Array(data.length);
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++)
      out[(size - 1 - row) * size + col] = data[row * size + col] / 1000;
  const texture = new THREE.DataTexture(
    out,
    size,
    size,
    THREE.RedFormat,
    THREE.FloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class TerrainLayer {
  group = new THREE.Group();
  geo: Geography;
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private contours: THREE.LineSegments[] = [];
  private detail?: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private grid: THREE.LineSegments;
  private textures: THREE.Texture[] = [];
  private detailReady = false;
  private imageryReady = false;
  private fullIndexCount = 0;
  private exteriorIndexCount = 0;
  private readonly nightFog = new THREE.Color("#111d1e");
  constructor(geo: Geography) {
    this.geo = geo;
    const height = gridTexture(geo.heights, geo.size);
    this.textures.push(height);
    this.material = this.makeMaterial(height, new THREE.Texture(), geo);
    this.mesh = new THREE.Mesh(createTerrainGeometry(geo), this.material);
    this.fullIndexCount = this.mesh.geometry.index!.count;
    this.exteriorIndexCount = this.fullIndexCount;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    const gridPoints: number[] = [];
    for (let x = -40; x <= 40; x += 4) gridPoints.push(x, 0, -40, x, 0, 40);
    for (let z = -40; z <= 40; z += 4) gridPoints.push(-40, 0, z, 40, 0, z);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(gridPoints, 3),
    );
    this.grid = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({
        color: 0x859087,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.grid.visible = false;
    this.group.add(this.grid);
  }
  private makeMaterial(
    height: THREE.Texture,
    image: THREE.Texture,
    geo: Geography,
  ) {
    return new THREE.ShaderMaterial({
      vertexShader: terrainVertex,
      fragmentShader: terrainFragment,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
      uniforms: {
        uLift: { value: 0 },
        uCurvature: { value: 0 },
        uImage: { value: image },
        uRegionImage: { value: image },
        uHeight: { value: height },
        uRegionHeight: { value: geo === this.geo ? height : this.material.uniforms.uHeight.value },
        uImageReady: { value: 0 },
        uRegionImageReady: { value: 0 },
        uImageVisibility: { value: 1 },
        uObservationRadius: { value: 50 },
        uSun: { value: new THREE.Vector3(-0.6, 0.72, -0.45).normalize() },
        uPaper: { value: new THREE.Color("#eeede6") },
        uStone: { value: new THREE.Color("#c5beac") },
        uInk: { value: new THREE.Color("#635842") },
        uSize: { value: new THREE.Vector2(geo.width, geo.depth) },
        uTexel: { value: new THREE.Vector2(1 / geo.size, 1 / geo.size) },
        uRegionSize: { value: new THREE.Vector2(this.geo.width, this.geo.depth) },
        uRegionTexel: { value: new THREE.Vector2(1 / this.geo.size, 1 / this.geo.size) },
        uRegionBounds: {
          value: new THREE.Vector4(
            -this.geo.meta.anchor.u * this.geo.width,
            -this.geo.meta.anchor.v * this.geo.depth,
            this.geo.width,
            this.geo.depth,
          ),
        },
        uFog: { value: new THREE.Color("#eeede6") },
        uSpan: { value: 42 },
        uRefine: { value: 1 },
        uSurface: { value: 0 },
        uDrape: { value: 0 },
        uContours: { value: 1 },
        uVisibility: { value: 1 },
        uNight: { value: 0 },
        uCity: { value: 0 },
        uDetail: { value: 0 },
        uTime: { value: 0 },
      },
    });
  }
  async loadContours(base: string, mobile: boolean) {
    const data = await readJSON<Contours>(
      base + (mobile ? "contours-mobile.json" : "contours-100m.json"),
    );
    const chosen = data.lines.filter(
      (l) => !mobile || l.major || l.elevation % 200 === 0,
    );
    const groups = [
      chosen.filter((l) => !l.major),
      chosen.filter((l) => l.major),
    ];
    for (let category = 0; category < groups.length; category++) {
      const positions: number[] = [],
        grids: number[] = [],
        isgrid: number[] = [],
        ts: number[] = [];
      groups[category].forEach((line, index) => {
        const points = line.points;
        const selected =
          index % Math.max(1, Math.round(groups[category].length / 14)) === 0;
        const row = ((index % 23) - 11) * 2.5;
        for (let i = 0; i < points.length - 1; i++)
          for (const n of [i, i + 1]) {
            const p = this.geo.pointUV(
              points[n][0],
              points[n][1],
              line.elevation,
            );
            positions.push(p.x, p.y, p.z);
            grids.push(-35 + (70 * n) / (points.length - 1), 0, row);
            isgrid.push(selected ? 1 : 0);
            ts.push(n / (points.length - 1));
          }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      g.setAttribute("aGrid", new THREE.Float32BufferAttribute(grids, 3));
      g.setAttribute("aIsGrid", new THREE.Float32BufferAttribute(isgrid, 1));
      g.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));
      const m = new THREE.ShaderMaterial({
        vertexShader: contourVertex,
        fragmentShader: contourFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMorph: { value: 0 },
          uLift: { value: 0 },
          uCurvature: { value: 0 },
          uColour: { value: new THREE.Color(category ? "#7e694d" : "#988d75") },
          uOpacity: { value: 0 },
          uReveal: { value: 0 },
          uIntro: { value: 0 },
          uObservationRadius: { value: 50 },
        },
      });
      const line = new THREE.LineSegments(g, m);
      line.frustumCulled = false;
      line.renderOrder = 3;
      line.visible = false;
      this.contours.push(line);
      this.group.add(line);
    }
  }
  async loadImagery(base: string, mobile: boolean) {
    const tex = await new THREE.TextureLoader().loadAsync(
      base + `satellite-${mobile ? 1024 : 2048}.webp`,
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.push(tex);
    this.material.uniforms.uImage.value = tex;
    this.imageryReady = true;
    this.material.uniforms.uImageReady.value = 1;
    this.material.uniforms.uRegionImage.value = tex;
    this.material.uniforms.uRegionImageReady.value = 1;
    if (this.detail) {
      this.detail.material.uniforms.uRegionImage.value = tex;
      this.detail.material.uniforms.uRegionImageReady.value = 1;
    }
  }
  async loadDetail(base: string, mobile: boolean) {
    const meta = await readJSON<RasterMeta>(base + "city-raster.json");
    const size = mobile ? 129 : 257;
    const [heights, tex] = await Promise.all([
      readGrid(base + `city-elevation-${size}.bin`, size),
      new THREE.TextureLoader().loadAsync(
        base + `city-aerial-${mobile ? 1024 : 2048}.webp`,
      ),
    ]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const detailGeo = registeredDetail(
        this.geo,
        new Geography(meta, heights, size),
      ),
      height = gridTexture(detailGeo.heights, size);
    this.textures.push(tex, height);
    const material = this.makeMaterial(height, tex, detailGeo);
    material.uniforms.uDetail.value = 1;
    material.uniforms.uRefine.value = 0;
    material.uniforms.uImageReady.value = 1;
    material.uniforms.uRegionImage.value = this.material.uniforms.uImage.value;
    material.uniforms.uRegionImageReady.value = this.imageryReady ? 1 : 0;
    const groundScale = this.geo.meta.groundScaleCosLatitude / 1000;
    material.uniforms.uSize.value.set(
      (meta.mercatorBounds.east - meta.mercatorBounds.west) * groundScale,
      (meta.mercatorBounds.north - meta.mercatorBounds.south) * groundScale,
    );
    const joined = createJoinedDetail(this.geo, detailGeo, this.mesh.geometry);
    this.fullIndexCount = joined.fullIndexCount;
    this.exteriorIndexCount = joined.exteriorIndexCount;
    this.detail = new THREE.Mesh(joined.geometry, material);
    this.detail.visible = false;
    this.detail.frustumCulled = false;
    this.detail.renderOrder = 1;
    this.group.add(this.detail);
    this.detailReady = true;
  }
  update(s: StoryState, time: number) {
    this.group.visible = s.terrainVisibility > 0.001;
    this.mesh.visible = s.surface > 0.001;
    const materials = [
      this.material,
      ...(this.detail ? [this.detail.material] : []),
    ];
    for (const mat of materials) {
      const u = mat.uniforms;
      u.uLift.value = s.lift;
      u.uCurvature.value = s.curvature;
      u.uDrape.value = s.drape;
      u.uImageVisibility.value = s.imageVisibility;
      u.uObservationRadius.value = observationRadius(s.p, s.baseSpan);
      u.uSurface.value = s.surface;
      u.uVisibility.value = s.terrainVisibility;
      u.uNight.value = s.night;
      u.uContours.value =
        (1 - s.surface * 0.6) * (1 - s.drape * 0.85) * (1 - s.city * 0.95);
      u.uCity.value = s.city * (1 - smooth(0.87, 0.91, s.p));
      u.uSpan.value = s.pose.span;
      u.uFog.value.set("#eeede6").lerp(this.nightFog, s.backdrop);
      u.uSun.value
        .set(
          -0.62 + Math.sin(time * 0.026) * 0.1,
          0.74 - s.night * 0.45,
          -0.4 + Math.cos(time * 0.02) * 0.07,
        )
        .normalize();
      u.uTime.value = time;
    }
    const detailActive = this.detailReady && s.p > 0.579;
    this.mesh.geometry.setDrawRange(0, detailActive ? this.exteriorIndexCount : this.fullIndexCount);
    if (this.detail) {
      this.detail.visible = detailActive;
      this.detail.material.uniforms.uRefine.value = s.aerial;
      this.detail.material.uniforms.uVisibility.value = s.terrainVisibility;
    }
    for (let i = 0; i < this.contours.length; i++) {
      const u = (this.contours[i].material as THREE.ShaderMaterial).uniforms;
      u.uMorph.value = s.morph;
      u.uLift.value = s.lift;
      u.uCurvature.value = s.curvature;
      u.uOpacity.value =
        s.lines *
        (i ? 0.78 : 0.38) *
        (1 - s.surface * 0.6) *
        (1 - s.city * 0.85);
      u.uReveal.value = smooth(0.018, 0.085, s.p) * 1.3;
      u.uIntro.value = 0;
      u.uObservationRadius.value = observationRadius(s.p, s.baseSpan);
      this.contours[i].visible = u.uOpacity.value > 0 || u.uIntro.value > 0;
    }
    this.grid.visible = s.grid > 0.001;
    (this.grid.material as THREE.LineBasicMaterial).opacity = s.grid * 0.16;
  }
  releaseFineAssets() {
    // Restore complete surface before the replacement mesh is removed.
    this.mesh.geometry.setDrawRange(0, this.fullIndexCount);
    this.exteriorIndexCount = this.fullIndexCount;
    const removeTexture = (texture: THREE.Texture) => {
      texture.dispose();
      this.textures = this.textures.filter((t) => t !== texture);
    };
    if (this.detail) {
      removeTexture(this.detail.material.uniforms.uImage.value);
      removeTexture(this.detail.material.uniforms.uHeight.value);
      this.detail.geometry.dispose();
      this.detail.material.dispose();
      this.group.remove(this.detail);
      this.detail = undefined;
      this.detailReady = false;
    }
    if (this.imageryReady) {
      removeTexture(this.material.uniforms.uImage.value);
      this.material.uniforms.uImage.value = new THREE.Texture();
      this.material.uniforms.uRegionImage.value = this.material.uniforms.uImage.value;
      this.material.uniforms.uImageReady.value = 0;
      this.material.uniforms.uRegionImageReady.value = 0;
      this.imageryReady = false;
    }
  }
  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.textures.forEach((t) => t.dispose());
  }
}
