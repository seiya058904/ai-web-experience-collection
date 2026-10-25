import { DEFORMATION_GLSL, deformation, heightToY } from './field';
import type { Story } from './story';
import { buildProjectedDensity } from './volume';

const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D photograph; uniform sampler2D structure; uniform vec2 viewport; uniform vec2 imageSize;
uniform float shear; uniform float clock; uniform float motion; uniform float scale;
uniform vec2 shift; uniform float mobile; uniform float height; uniform float plane; uniform float reveal;
${DEFORMATION_GLSL}
vec2 referenceUV(vec2 p){return vec2(mix(p.x,(p.x-.55)/1.1+.62,mobile),p.y);}
float displacement(vec2 p){return stormDeformation(referenceUV(p),shear)*mix(1.,1.1,mobile);}
void main(){
 vec2 screen=vec2(uv.x,1.-uv.y)*viewport;
 float cover=max(viewport.x/imageSize.x,viewport.y/imageSize.y);
 vec2 display=imageSize*cover;
 vec2 coord=((screen-viewport*.5-shift*viewport)/scale+display*.5)/display;
 vec2 original=coord;
 coord.x=original.x-displacement(coord);
 coord.x=original.x-displacement(coord);
 float cloud=1.-smoothstep(.72,.86,coord.y);
 vec2 local=vec2(sin(coord.y*31.+clock*.07)*cos(coord.x*15.-clock*.04),cos(coord.x*21.-clock*.05));
 coord+=local*.00037*cloud*motion;
 vec3 col=texture2D(photograph,clamp(coord,.001,.999)).rgb;
 vec2 ref=referenceUV(original);
 float rainRegion=smoothstep(.70,.86,ref.x)*(1.-smoothstep(.94,1.,ref.x))*smoothstep(.45,.65,ref.y)*(1.-smoothstep(.84,.87,ref.y));
 float streak=pow(max(0.,sin(ref.x*1750.+sin(ref.y*28.)*.4)),28.);
 float fall=pow(max(0.,sin(ref.y*140.-clock*1.1+ref.x*87.)),6.);
 col+=vec3(.018,.021,.023)*streak*fall*rainRegion*motion;
 vec3 field=texture2D(structure,clamp(ref,0.,1.)).rgb;
 float slice=1.-smoothstep(.005,.048,abs(ref.y-(.79-.74*height)));
 vec3 material=mix(vec3(.14,.22,.28),vec3(.86,.79,.64),field.g);
 float optical=slice*plane*clamp(field.r*2.,0.,1.);
 col=mix(col,mix(col*.72,material,.28),optical*.66);
 col*=mix(.92,1.,reveal);
 gl_FragColor=vec4(col,1.);
}`;

export class WeatherRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private densityTexture: WebGLTexture | null = null;
  private densityShear = -1;
  private buffer: WebGLBuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private image = new Image();
  private fallback: CanvasRenderingContext2D | null;
  private mobile = false;
  private ready = false;
  private lost = false;
  private disposed = false;
  private lastKey = '';
  private width = 1;
  private height = 1;
  private quality = 1;
  private frameTotal = 0;
  private frameCount = 0;
  private forceFallback = new URLSearchParams(location.search).has('fallback');
  mode = 'poster';
  constructor(private canvas: HTMLCanvasElement, private fallbackCanvas: HTMLCanvasElement, private onMode: (mode:string)=>void) {
    this.fallback = fallbackCanvas.getContext('2d', { alpha: false });
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    if (!this.forceFallback) this.initGL();
    this.resize();
  }
  private onLost = (event: Event) => { event.preventDefault(); this.lost=true;this.canvas.classList.remove('ready');this.lastKey='';this.setMode('illustrated'); };
  private onRestored = () => { this.lost=false;this.initGL();if(this.ready)this.upload();this.lastKey=''; };
  private setMode(mode:string) { this.mode=mode;this.onMode(mode); }
  private compile(kind:number, source:string) {
    const gl=this.gl!;const shader=gl.createShader(kind)!;gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message||'Shader compile failure');}return shader;
  }
  private initGL() {
    try {
      const gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
      if(!gl){this.setMode('illustrated');return;}
      this.gl=gl;
      const vs=this.compile(gl.VERTEX_SHADER,vertex),fs=this.compile(gl.FRAGMENT_SHADER,fragment);
      const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Shader link failure');
      this.program=program;gl.useProgram(program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attribute=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      this.densityTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.densityTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);this.densityShear=-1;
      for(const name of ['photograph','structure','viewport','imageSize','shear','clock','motion','scale','shift','mobile','height','plane','reveal'])this.uniforms[name]=gl.getUniformLocation(program,name);
      this.setMode('webgl');
    } catch(error) { console.info('SUPERCELL: illustrated fallback active.',String(error));this.gl=null;this.setMode('illustrated'); }
  }
  private upload(){const gl=this.gl;if(!gl||!this.ready||this.lost)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,this.image);this.lastKey='';}
  resize(){
    this.width=innerWidth;this.height=innerHeight;
    const nextMobile=this.width<=700;const pixelRatio=Math.min(devicePixelRatio||1,1.35,1920/this.width,1200/this.height)*this.quality;
    for(const canvas of [this.canvas,this.fallbackCanvas]){canvas.width=Math.max(1,Math.round(this.width*pixelRatio));canvas.height=Math.max(1,Math.round(this.height*pixelRatio));}
    if(!this.image.src||nextMobile!==this.mobile){
      this.mobile=nextMobile;this.ready=false;this.canvas.classList.remove('ready');this.fallbackCanvas.classList.remove('ready');
      const image=new Image();this.image=image;image.decoding='async';
      image.onload=()=>{if(this.disposed||this.image!==image)return;this.ready=true;this.upload();this.lastKey='';};
      image.onerror=()=>{if(this.image===image)this.setMode('poster');};
      image.src=new URL(this.mobile?'assets/storm-mobile.webp':'assets/storm-desktop.webp',document.baseURI).href;
    }
    this.lastKey='';
  }
  /** Reduce only raster detail after sustained slow frames; never alter the field. */
  observeFrame(seconds:number){
    if(!this.ready||!this.gl||this.lost||seconds<=0||seconds>.25||this.quality<=.56)return;
    this.frameTotal+=seconds;this.frameCount++;
    if(this.frameCount<90)return;
    const average=this.frameTotal/this.frameCount;this.frameTotal=0;this.frameCount=0;
    if(average>.033){this.quality=Math.max(.55,this.quality*.82);this.resize();}
  }
  /** Project the shared 3D explanatory field onto the image's authored view. */
  project(x:number,h:number,z:number,story:Story){
    const imageWidth=this.mobile?941:1672,imageHeight=this.mobile?1672:941;
    const factor=Math.max(this.width/imageWidth,this.height/imageHeight);
    const displayW=imageWidth*factor,displayH=imageHeight*factor;
    const imageX=this.mobile?.55+(x-.62)*1.1:x;
    const imageY=heightToY(h)-z*.075;
    return {x:((imageX-.5)*displayW)*story.scale+this.width*.5+story.shiftX*this.width*(this.mobile?.25:1),y:((imageY-.5)*displayH)*story.scale+this.height*.5+story.shiftY*this.height};
  }
  render(story:Story,shear:number,height:number,clock:number,motion:boolean,reveal:number){
    if(!this.ready||this.disposed)return;
    const key=[story.p.toFixed(5),shear,height,this.width,this.height,motion&&this.gl&&!this.lost?Math.floor(clock*30):0,reveal.toFixed(2)].join('|');if(key===this.lastKey)return;this.lastKey=key;
    const shiftX=story.shiftX*(this.mobile?.25:1);
    if(this.gl&&!this.lost){
      const gl=this.gl;const u=this.uniforms;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.useProgram(this.program);
      if(this.densityShear!==shear){const projected=buildProjectedDensity(shear,96,64);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.densityTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,projected.width,projected.height,0,gl.RGBA,gl.UNSIGNED_BYTE,projected.data);gl.activeTexture(gl.TEXTURE0);this.densityShear=shear;}
      gl.uniform1i(u.structure,1);
      gl.uniform2f(u.viewport,this.width,this.height);gl.uniform2f(u.imageSize,this.image.naturalWidth,this.image.naturalHeight);gl.uniform1i(u.photograph,0);gl.uniform1f(u.shear,shear);gl.uniform1f(u.clock,clock);gl.uniform1f(u.motion,motion?1:0);gl.uniform1f(u.scale,story.scale);gl.uniform2f(u.shift,shiftX,story.shiftY);gl.uniform1f(u.mobile,this.mobile?1:0);gl.uniform1f(u.height,height);gl.uniform1f(u.plane,story.plane);gl.uniform1f(u.reveal,reveal);gl.drawArrays(gl.TRIANGLES,0,6);
      this.canvas.classList.add('ready');this.fallbackCanvas.classList.remove('ready');this.setModeIfChanged('webgl');
    }else if(this.fallback){
      // A no-WebGL mesh projection, retaining the identical shear field.
      const ctx=this.fallback;const W=this.fallbackCanvas.width,H=this.fallbackCanvas.height;const iw=this.image.naturalWidth,ih=this.image.naturalHeight;const cover=Math.max(W/iw,H/ih)*story.scale;
      const dw=iw*cover,dh=ih*cover,ox=(W-dw)/2+shiftX*W,oy=(H-dh)/2+story.shiftY*H;ctx.clearRect(0,0,W,H);ctx.drawImage(this.image,ox,oy,dw,dh);
      const columns=48,rows=80;
      if(Math.abs(shear-.5)>.001){for(let j=0;j<rows;j++){for(let i=0;i<columns;i++){
        const ix=i/columns,iy=j/rows;const referenceX=this.mobile?(ix-.55)/1.1+.62:ix;
        const d=deformation(referenceX,iy,shear)*(this.mobile?1.1:1);
        const d2=deformation(this.mobile?((ix+1/columns)-.55)/1.1+.62:ix+1/columns,iy,shear)*(this.mobile?1.1:1);
        ctx.drawImage(this.image,ix*iw,iy*ih,iw/columns,ih/rows,ox+(ix+d)*dw,oy+iy*dh,dw/columns+(d2-d)*dw+1,dh/rows+1);
      }}}
      this.fallbackCanvas.classList.add('ready');this.setModeIfChanged('illustrated');
    }
  }
  private setModeIfChanged(mode:string){if(this.mode!==mode)this.setMode(mode);}
  dispose(){this.disposed=true;this.canvas.removeEventListener('webglcontextlost',this.onLost);this.canvas.removeEventListener('webglcontextrestored',this.onRestored);this.image.onload=null;this.image.onerror=null;if(this.gl){this.gl.deleteTexture(this.texture);this.gl.deleteTexture(this.densityTexture);this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}this.gl=null;}
}
