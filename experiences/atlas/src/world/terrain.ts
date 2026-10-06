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

interface Contours {
  lines: { elevation: number; major: boolean; points: [number, number][] }[];
}

const terrainVertex = /* glsl */ `
uniform float uLift;
uniform float uCurvature;
uniform float uRefine;
attribute float aCoarseHeight;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
void main(){
  vUv=uv;
  vec3 p=position;
  p.y=mix(aCoarseHeight,p.y,uRefine);
  vHeight=p.y;
  p.y*=uLift;
  p.y-=uCurvature*dot(p.xz,p.xz)/12742.0;
  vWorld=p;
  vNormal=normalize(vec3(normal.x*uLift,normal.y,normal.z*uLift));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const terrainFragment = /* glsl */ `
uniform sampler2D uImage;
uniform sampler2D uRegionImage;
uniform sampler2D uHeight;
uniform vec3 uSun;
uniform vec3 uPaper;
uniform vec3 uStone;
uniform vec3 uInk;
uniform vec2 uSize;
uniform vec2 uTexel;
uniform vec4 uDetailRect;
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
uniform float uDetailHole;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
float readHeight(vec2 p){return texture2D(uHeight,clamp(p,0.0,1.0)).r;}
void main(){
  float edge=min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y));
  float alpha=uSurface*uVisibility;
  if(uDetail<0.5){
    alpha*=smoothstep(0.0,0.032,edge);
    float inDetail=step(uDetailRect.x,vWorld.x)*step(vWorld.x,uDetailRect.z)*step(uDetailRect.y,vWorld.z)*step(vWorld.z,uDetailRect.w);
    if(inDetail>0.5&&uDetailHole>0.5)discard;
  }
  if(alpha<0.003)discard;
  float hL=readHeight(vUv-vec2(uTexel.x,0.0));
  float hR=readHeight(vUv+vec2(uTexel.x,0.0));
  float hN=readHeight(vUv+vec2(0.0,uTexel.y));
  float hS=readHeight(vUv-vec2(0.0,uTexel.y));
  vec3 n=normalize(vec3((hL-hR)*uLift/(uSize.x*uTexel.x*2.0),1.0,(hN-hS)*uLift/(uSize.y*uTexel.y*2.0)));
  n=normalize(mix(vNormal,n,0.6));
  float sunlight=max(dot(n,uSun),0.0);
  float shadow=1.0;
  vec2 direction=normalize(vec2(uSun.x,-uSun.z));
  float slope=uSun.y/max(length(uSun.xz),0.01);
  if(uDetail<0.5&&uLift>0.1){
    for(int i=1;i<=9;i++){
      float dist=float(i)*float(i)*0.048;
      vec2 coord=vUv+direction*dist/uSize;
      float obstruction=(readHeight(coord)-vHeight)*uLift-dist*slope;
      shadow=min(shadow,1.0-smoothstep(-0.035,0.035,obstruction)*0.58);
    }
  }
  float cavity=clamp((vHeight*4.0-hL-hR-hN-hS)*16.0,-0.15,0.12);
  float shade=(0.61+sunlight*0.53)*shadow+cavity;
  vec3 rock=mix(uStone,uPaper,smoothstep(2.8,3.77,vHeight)*0.4);
  rock*=shade;
  vec3 stone=mix(uPaper,rock,uLift);
  vec3 limestone=uPaper*(0.91+sunlight*0.075);
  stone=mix(stone,limestone,uCity);
  float band=abs(fract(vHeight*10.0+0.5)-0.5);
  float fw=max(fwidth(vHeight*10.0),0.002);
  float contour=1.0-smoothstep(fw*0.25,fw*1.2,band);
  stone=mix(stone,uInk,contour*uContours*0.30);
  vec3 im=texture2D(uImage,vUv).rgb;
  if(uDetail>0.5){
    vec2 regionUV=vec2((vWorld.x-uRegionBounds.x)/uRegionBounds.z,1.0-(vWorld.z-uRegionBounds.y)/uRegionBounds.w);
    im=mix(texture2D(uRegionImage,regionUV).rgb,im,uRefine);
  }
  float luminance=dot(im,vec3(0.2126,0.7152,0.0722));
  im=mix(vec3(luminance),im,0.95);
  im*=0.77+shade*0.27;
  float front=vUv.x*0.60+(1.0-vUv.y)*0.30+vHeight*0.025;
  float drape=smoothstep(front-0.08,front+0.035,uDrape*1.16-0.09);
  if(uDetail>0.5)drape=1.0;
  vec3 colour=mix(stone,im,drape);
  colour=mix(colour,stone,clamp(uCity,0.0,1.0)*0.96);
  float rim=(1.0-smoothstep(0.0,0.016,abs(front-(uDrape*1.16-0.09))))*step(0.03,uDrape)*(1.0-step(0.98,uDrape));
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
void main(){
  float a=uOpacity*mix(vIsGrid,1.0,uMorph);
  a*=1.0-smoothstep(uReveal-0.1,uReveal+0.2,vT);
  float introMask=smoothstep(-3.0,8.0,vMap.x)*smoothstep(5.0,19.0,vMap.y);
  a=max(a,introMask*uIntro*0.09);
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

function geometryFor(geo: Geography, reference?: Geography) {
  const n = geo.size,
    positions = new Float32Array(n * n * 3),
    coarse = new Float32Array(n * n),
    uv = new Float32Array(n * n * 2),
    indices = new Uint32Array((n - 1) * (n - 1) * 6);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1),
        v = j / (n - 1),
        id = j * n + i;
      let point = geo.pointUV(u, v);
      if (reference) {
        const b = geo.meta.mercatorBounds;
        const mx = b.west + u * (b.east - b.west),
          my = b.north - v * (b.north - b.south),
          c = reference.meta.groundScaleCosLatitude / 1000;
        point.x = (mx - reference.anchorMercator[0]) * c;
        point.z = (reference.anchorMercator[1] - my) * c;
        point.y += 0.0004;
      }
      coarse[id] = reference
        ? reference.heightAtWorld(point.x, point.z) + 0.0004
        : point.y;
      positions.set(point.toArray(), id * 3);
      uv.set([u, 1 - v], id * 2);
    }
  let k = 0;
  for (let j = 0; j < n - 1; j++)
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i,
        b = a + 1,
        c = a + n,
        d = c + 1;
      indices.set([a, c, b, b, c, d], k);
      k += 6;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aCoarseHeight", new THREE.BufferAttribute(coarse, 1));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.computeVertexNormals();
  return g;
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
  constructor(geo: Geography) {
    this.geo = geo;
    const height = gridTexture(geo.heights, geo.size);
    this.textures.push(height);
    this.material = this.makeMaterial(height, new THREE.Texture(), geo);
    this.mesh = new THREE.Mesh(geometryFor(geo), this.material);
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
        uSun: { value: new THREE.Vector3(-0.6, 0.72, -0.45).normalize() },
        uPaper: { value: new THREE.Color("#eeede6") },
        uStone: { value: new THREE.Color("#c6b99e") },
        uInk: { value: new THREE.Color("#635842") },
        uSize: { value: new THREE.Vector2(geo.width, geo.depth) },
        uTexel: { value: new THREE.Vector2(1 / geo.size, 1 / geo.size) },
        uDetailRect: { value: new THREE.Vector4(-1.54, -1.96, 1.73, 1.5) },
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
        uDetailHole: { value: 0 },
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
          uIntro: { value: 1 },
        },
      });
      const line = new THREE.LineSegments(g, m);
      line.frustumCulled = false;
      line.renderOrder = 3;
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
    if (this.detail) this.detail.material.uniforms.uRegionImage.value = tex;
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
    material.uniforms.uRegionImage.value = this.material.uniforms.uImage.value;
    this.detail = new THREE.Mesh(geometryFor(detailGeo, this.geo), material);
    this.detail.frustumCulled = false;
    this.detail.renderOrder = 1;
    this.group.add(this.detail);
    const sw = this.geo.project(meta.west, meta.south),
      ne = this.geo.project(meta.east, meta.north);
    this.material.uniforms.uDetailRect.value.set(sw.x, ne.z, ne.x, sw.z);
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
      u.uDrape.value = this.imageryReady ? s.drape : 0;
      u.uSurface.value = s.surface;
      u.uVisibility.value = s.terrainVisibility;
      u.uNight.value = s.night;
      u.uContours.value =
        (1 - s.surface * 0.6) * (1 - s.drape * 0.85) * (1 - s.city * 0.95);
      u.uCity.value = s.city * (1 - smooth(0.87, 0.91, s.p));
      u.uSpan.value = s.pose.span;
      u.uFog.value.set("#eeede6").lerp(new THREE.Color("#111d1e"), s.night);
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
    this.material.uniforms.uDetailHole.value = detailActive ? 1 : 0;
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
    }
    this.grid.visible = s.grid > 0.001;
    (this.grid.material as THREE.LineBasicMaterial).opacity = s.grid * 0.16;
  }
  releaseFineAssets() {
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
