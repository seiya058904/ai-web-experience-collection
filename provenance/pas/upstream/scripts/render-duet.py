"""PAS offscreen 3D asset renderer.

Renders the project's original rigged duet mesh packets using headless EGL.
This is asset generation: it does not create, drive or capture a browser.
"""
from __future__ import annotations
from pathlib import Path
import argparse, json, math, os, sys, time
from dataclasses import dataclass
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'deps'))
os.environ.setdefault('LIBGL_ALWAYS_SOFTWARE','1')
os.environ.setdefault('EGL_PLATFORM','surfaceless')
import moderngl

VERTEX='''#version 330
in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;
in vec4 in_joints;
in vec4 in_weights;
in vec3 in_color;
uniform mat4 u_view_projection;
uniform mat4 u_light_projection;
uniform mat4 u_model;
uniform mat4 u_bones[256];
uniform bool u_skinned;
out vec3 v_position;
out vec3 v_normal;
out vec2 v_uv;
out vec4 v_shadow;
out vec3 v_color;
void main(){
 mat4 skin=mat4(1.0);
 if(u_skinned){
  ivec4 j=ivec4(in_joints);
  skin=u_bones[j.x]*in_weights.x+u_bones[j.y]*in_weights.y+u_bones[j.z]*in_weights.z+u_bones[j.w]*in_weights.w;
 }
 vec4 p=u_model*skin*vec4(in_position,1.0);
 vec3 n=normalize(mat3(u_model)*mat3(skin)*in_normal);
 v_position=p.xyz; v_normal=n; v_uv=in_uv; v_color=in_color;
 v_shadow=u_light_projection*vec4(p.xyz+n*0.0015,1.0);
 gl_Position=u_view_projection*p;
}'''
FRAGMENT='''#version 330
in vec3 v_position;
in vec3 v_normal;
in vec2 v_uv;
in vec4 v_shadow;
in vec3 v_color;
uniform sampler2D u_albedo;
uniform sampler2D u_shadow;
uniform sampler2D u_bump;
uniform bool u_has_bump;
uniform float u_bump_scale;
uniform vec3 u_color;
uniform vec3 u_eye;
uniform vec3 u_key_dir;
uniform vec3 u_fill_dir;
uniform float u_alpha_test;
uniform float u_roughness;
uniform float u_exposure;
uniform bool u_double_sided;
uniform int u_material_kind;
uniform vec3 u_feet[4];
out vec4 frag;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float shadow_visibility(vec3 normal){
 vec3 p=v_shadow.xyz/v_shadow.w; p=p*.5+.5;
 if(p.z<0.0||p.z>1.0||p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0)return 1.0;
 float receiver=p.z-max(.00008,.00030*(1.0-dot(normal,u_key_dir)));
 vec2 moments=texture(u_shadow,p.xy).rg;
 if(receiver<=moments.x)return 1.0;
 float variance=max(moments.y-moments.x*moments.x,.0000008);
 float delta=receiver-moments.x;
 float visibility=variance/(variance+delta*delta);
 return clamp((visibility-.22)/.78,0.0,1.0);
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main(){
 vec4 tex=texture(u_albedo,v_uv);
 if(tex.a<u_alpha_test)discard;
 vec3 base=pow(max(tex.rgb,vec3(.0)),vec3(2.2))*u_color*v_color;
 vec3 n=normalize(v_normal); if(u_double_sided&&!gl_FrontFacing)n=-n;
 if(u_has_bump){
  float height=texture(u_bump,v_uv).r*u_bump_scale;
  vec3 dx=dFdx(v_position),dy=dFdy(v_position);
  vec3 r1=cross(dy,n),r2=cross(n,dx);
  float det=dot(dx,r1);
  vec3 grad=sign(det)*(dFdx(height)*r1+dFdy(height)*r2);
  n=normalize(abs(det)*n-grad);
 }
 // Fine matte variation belongs to the material, never to body motion.
 if(u_material_kind==1){
  float weave=sin(v_uv.x*800.0)*sin(v_uv.y*800.0);
  base*=1.0+weave*.012;
 }
 if(u_material_kind==2){
  float grain=hash(floor(v_position.xz*650.0));
  float broad=sin(v_position.x*1.7+v_position.z*.8)*.5+sin(v_position.z*2.1)*.5;
  base*=1.0+(grain-.5)*.018+broad*.007;
 }
 float hemi=clamp(n.y*.5+.5,0.0,1.0);
 vec3 ambient=mix(vec3(.30,.275,.25),vec3(.83,.83,.82),hemi)*.58;
 float shade=shadow_visibility(n);
 float key=max(dot(n,u_key_dir),0.0);
 float fill=max(dot(n,u_fill_dir),0.0);
 vec3 light=ambient+vec3(1.0,.99,.98)*key*shade*1.10+vec3(.90,.93,.95)*fill*.22;
 vec3 viewdir=normalize(u_eye-v_position);
 vec3 halfdir=normalize(u_key_dir+viewdir);
 float power=mix(110.0,8.0,u_roughness);
 float spec=pow(max(dot(n,halfdir),0.0),power)*.022*(1.0-u_roughness*.60)*shade;
 vec3 radiance=base*light+vec3(spec);
 if(u_material_kind==2&&v_position.y<.03){
  float contact=1.0;
  for(int i=0;i<4;i++){
   vec2 d=v_position.xz-u_feet[i].xz;
   float elliptical=d.x*d.x/(.075*.075)+d.y*d.y/(.145*.145);
   float grounded=exp(-max(u_feet[i].y,0.0)*17.0);
   contact*=1.0-.16*exp(-elliptical*1.3)*grounded;
  }
  radiance*=contact;
 }
 vec3 outColor=pow(aces(radiance*u_exposure),vec3(1.0/2.2));
 // A fixed, subpixel photographic grain, independent of narrative time.
 outColor+=(hash(gl_FragCoord.xy)-.5)*.0014;
 frag=vec4(outColor,1.0);
}'''
SHADOW_VERTEX='''#version 330
in vec3 in_position;
in vec2 in_uv;
in vec4 in_joints;
in vec4 in_weights;
uniform mat4 u_view_projection;
uniform mat4 u_model;
uniform mat4 u_bones[256];
uniform bool u_skinned;
out vec2 v_uv;
void main(){
 mat4 skin=mat4(1.0);
 if(u_skinned){ivec4 j=ivec4(in_joints);skin=u_bones[j.x]*in_weights.x+u_bones[j.y]*in_weights.y+u_bones[j.z]*in_weights.z+u_bones[j.w]*in_weights.w;}
 v_uv=in_uv;gl_Position=u_view_projection*u_model*skin*vec4(in_position,1.0);
}'''
SHADOW_FRAGMENT='''#version 330
in vec2 v_uv;
uniform sampler2D u_albedo;
uniform float u_alpha_test;
out vec2 moments;
void main(){if(texture(u_albedo,v_uv).a<u_alpha_test)discard; float z=gl_FragCoord.z; float dx=dFdx(z),dy=dFdy(z);moments=vec2(z,z*z+.25*(dx*dx+dy*dy));}
'''

BLUR_VERTEX='''#version 330
in vec2 in_position;
out vec2 uv;
void main(){gl_Position=vec4(in_position,0.0,1.0);uv=(in_position+1.0)*.5;}
'''
BLUR_FRAGMENT='''#version 330
uniform sampler2D u_source;
uniform vec2 u_direction;
in vec2 uv;
out vec2 moments;
void main(){vec2 total=vec2(0.0);float weight=0.0;for(int i=-6;i<=6;i++){float w=exp(-float(i*i)/14.0);total+=texture(u_source,uv+u_direction*float(i)).rg*w;weight+=w;}moments=total/weight;}
'''

def normalize(a):
 a=np.asarray(a,dtype='f4');return a/max(float(np.linalg.norm(a)),1e-9)

def look_at(eye,target,up=(0,1,0)):
 eye=np.asarray(eye,dtype='f4');f=normalize(np.asarray(target)-eye);s=normalize(np.cross(f,up));u=np.cross(s,f)
 m=np.eye(4,dtype='f4');m[0,:3]=s;m[1,:3]=u;m[2,:3]=-f;m[0,3]=-np.dot(s,eye);m[1,3]=-np.dot(u,eye);m[2,3]=np.dot(f,eye);return m

def perspective(fov,aspect,near=.04,far=60):
 f=1/math.tan(math.radians(fov)/2);m=np.zeros((4,4),dtype='f4');m[0,0]=f/aspect;m[1,1]=f;m[2,2]=(far+near)/(near-far);m[2,3]=2*far*near/(near-far);m[3,2]=-1;return m

def ortho(left,right,bottom,top,near,far):
 m=np.eye(4,dtype='f4');m[0,0]=2/(right-left);m[1,1]=2/(top-bottom);m[2,2]=-2/(far-near);m[0,3]=-(right+left)/(right-left);m[1,3]=-(top+bottom)/(top-bottom);m[2,3]=-(far+near)/(far-near);return m

def linear_hex(h):
 return tuple((int(h[i:i+2],16)/255)**2.2 for i in (1,3,5))

def set_matrix(program,name,matrix):
 program[name].write(np.asarray(matrix,dtype='f4').T.tobytes())

@dataclass
class DrawMesh:
 name:str
 vertex_buffer:object
 index_buffer:object
 vao:object
 shadow_vao:object
 texture:object
 color:tuple
 alpha_test:float=0.0
 roughness:float=.9
 double_sided:bool=False
 kind:int=0
 skinned:bool=False
 actor:str|None=None
 model:object=None
 cast_shadow:bool=True
 bump_texture:object=None
 bump_scale:float=0.0

class Renderer:
 def __init__(self,width=1200,height=900,exposure=.68,shadow_size=2048):
  self.ctx=moderngl.create_context(standalone=True,backend='egl',require=330)
  self.width,self.height=width,height;self.exposure=exposure
  self.main=self.ctx.program(vertex_shader=VERTEX,fragment_shader=FRAGMENT)
  self.shadow=self.ctx.program(vertex_shader=SHADOW_VERTEX,fragment_shader=SHADOW_FRAGMENT)
  self.main['u_albedo']=0;self.main['u_shadow']=1;self.main['u_bump']=2;self.shadow['u_albedo']=0
  self.white=self.ctx.texture((1,1),4,bytes([255,255,255,255]));self.textures={}
  self.depth=self.ctx.depth_texture((shadow_size,shadow_size));self.depth.compare_func='';self.depth.repeat_x=False;self.depth.repeat_y=False
  self.depth.filter=(moderngl.LINEAR,moderngl.LINEAR)
  self.moments=self.ctx.texture((shadow_size,shadow_size),2,dtype='f4')
  self.blur_temp=self.ctx.texture((shadow_size,shadow_size),2,dtype='f4')
  self.soft_shadow=self.ctx.texture((shadow_size,shadow_size),2,dtype='f4')
  for texture in (self.moments,self.blur_temp,self.soft_shadow):
   texture.filter=(moderngl.LINEAR,moderngl.LINEAR);texture.repeat_x=False;texture.repeat_y=False
  self.shadow_fbo=self.ctx.framebuffer([self.moments],depth_attachment=self.depth)
  self.blur_x_fbo=self.ctx.framebuffer([self.blur_temp]);self.blur_y_fbo=self.ctx.framebuffer([self.soft_shadow])
  self.blur_program=self.ctx.program(vertex_shader=BLUR_VERTEX,fragment_shader=BLUR_FRAGMENT)
  self.blur_program['u_source']=0
  self.blur_buffer=self.ctx.buffer(np.array([-1,-1,3,-1,-1,3],dtype='f4').tobytes())
  self.blur_vao=self.ctx.vertex_array(self.blur_program,[(self.blur_buffer,'2f','in_position')])
  samples=min(4,self.ctx.info.get('GL_MAX_SAMPLES',4))
  self.ms_color=self.ctx.renderbuffer((width,height),4,samples=samples)
  self.ms_depth=self.ctx.depth_renderbuffer((width,height),samples=samples)
  self.color_fbo=self.ctx.framebuffer([self.ms_color],self.ms_depth)
  self.output_fbo=self.ctx.simple_framebuffer((width,height),components=4)
  self.meshes=[]
  self.key_pos=np.array([-3.8,5.2,3.5],dtype='f4');self.key_target=np.array([0,.8,0],dtype='f4')
  self.light_vp=ortho(-3.8,3.8,-2.,3.8,.1,15)@look_at(self.key_pos,self.key_target)
  self.key_dir=normalize(self.key_pos-self.key_target);self.fill_dir=normalize([4,2.3,2])
  self.ctx.enable(moderngl.DEPTH_TEST)
  self.identity=np.eye(4,dtype='f4')
  self.bones=np.tile(self.identity,(256,1,1))
  self._upload_bones(self.main,self.bones);self._upload_bones(self.shadow,self.bones)
  self.add_environment()

 def _upload_bones(self,program,bones):
  # Matrices in ndarray are mathematical row-major, GLSL expects column-major.
  matrices=np.tile(self.identity,(256,1,1));matrices[:len(bones)]=bones
  program['u_bones'].write(matrices.transpose(0,2,1).astype('f4').tobytes())

 def texture(self,path):
  if not path:return self.white
  path=str(Path(path).resolve())
  if path not in self.textures:
   img=Image.open(path).convert('RGBA').transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   tex=self.ctx.texture(img.size,4,img.tobytes());tex.build_mipmaps();tex.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR);tex.repeat_x=True;tex.repeat_y=True
   self.textures[path]=tex
  return self.textures[path]

 def add_mesh(self,name,positions,normals,uv,indices,material=None,joints=None,weights=None,actor=None,model=None,cast_shadow=True,colors=None):
  material=material or {};positions=np.asarray(positions,dtype='f4').reshape(-1,3);count=len(positions)
  normals=np.asarray(normals,dtype='f4').reshape(-1,3)
  uv=np.asarray(uv if uv is not None else np.zeros((count,2)),dtype='f4').reshape(-1,2)
  skinned=joints is not None and weights is not None
  joints=np.asarray(joints if joints is not None else np.zeros((count,4)),dtype='f4').reshape(-1,4)
  weights=np.asarray(weights if weights is not None else np.tile([1,0,0,0],(count,1)),dtype='f4').reshape(-1,4)
  colors=np.asarray(colors if colors is not None else np.ones((count,3)),dtype="f4").reshape(-1,3)
  packed=np.concatenate([positions,normals,uv,joints,weights,colors],axis=1).astype('f4')
  vbo=self.ctx.buffer(packed.tobytes());ibo=self.ctx.buffer(np.asarray(indices,dtype='u4').tobytes())
  vao=self.ctx.vertex_array(self.main,[(vbo,'3f 3f 2f 4f 4f 3f','in_position','in_normal','in_uv','in_joints','in_weights','in_color')],ibo,index_element_size=4)
  svao=self.ctx.vertex_array(self.shadow,[(vbo,'3f 12x 2f 4f 4f 12x','in_position','in_uv','in_joints','in_weights')],ibo,index_element_size=4)
  color=material.get('color',[1,1,1]);color=linear_hex(color) if isinstance(color,str) else tuple(color)
  texpath=material.get('map') or material.get('texture')
  mesh=DrawMesh(name,vbo,ibo,vao,svao,self.texture(texpath),color,float(material.get('alphaTest',0)),float(material.get('roughness',.9)),bool(material.get('doubleSided',False)),int(material.get('kind',0)),skinned,actor,np.asarray(model if model is not None else self.identity,dtype='f4').reshape(4,4),cast_shadow)
  mesh.bump_texture=self.texture(material.get('bumpMap')) if material.get('bumpMap') else None
  mesh.bump_scale=float(material.get('bumpScale',.0015)) if mesh.bump_texture is not None else 0.0
  self.meshes.append(mesh);return mesh

 def add_environment(self):
  self.add_mesh('floor',[[-15,0.,-15],[15,0.,-15],[15,0.,15],[-15,0.,15]],[[0,1,0]]*4,[[0,0],[1,0],[1,1],[0,1]],[0,2,1,0,3,2],{'color':'#b4a18a','roughness':1,'kind':2},cast_shadow=False)
  self.add_mesh('wall',[[-15,0,-2.7],[15,0,-2.7],[15,12,-2.7],[-15,12,-2.7]],[[0,0,1]]*4,[[0,0],[1,0],[1,1],[0,1]],[0,1,2,0,2,3],{'color':'#bba88e','roughness':1,'kind':2},cast_shadow=False)

 def _draw(self,mesh,program,shadow=False):
  program['u_skinned']=mesh.skinned;set_matrix(program,'u_model',mesh.model)
  mesh.texture.use(0);program['u_alpha_test']=mesh.alpha_test
  # Skin and clothing contain intentional doubled edges; disable culling for a
  # stable film asset. Back-facing surface normals still receive proper lighting.
  self.ctx.disable(moderngl.CULL_FACE)
  if not shadow:
   program['u_color']=mesh.color;program['u_roughness']=mesh.roughness;program['u_double_sided']=mesh.double_sided;program['u_material_kind']=mesh.kind
   program['u_has_bump']=mesh.bump_texture is not None;program['u_bump_scale']=mesh.bump_scale
   (mesh.bump_texture or self.white).use(2)
  (mesh.shadow_vao if shadow else mesh.vao).render(moderngl.TRIANGLES)

 def render(self,out,eye=(.12,1.32,4.6),target=(0,.9,0),fov=31,feet=None,bones=None,models=None,quality=88):
  started=time.perf_counter()
  if models:
   for m in self.meshes:
    if m.name in models:m.model=np.asarray(models[m.name],dtype='f4').reshape(4,4)
  feet=np.asarray(feet if feet is not None else [[-.65,0,.02],[-.82,0,.02],[.65,0,.02],[.82,0,.02]],dtype='f4').reshape(4,3)
  self.shadow_fbo.use();self.ctx.viewport=(0,0,*self.depth.size);self.shadow_fbo.clear(1,1,1,1,depth=1)
  set_matrix(self.shadow,'u_view_projection',self.light_vp)
  current_actor=None
  for m in self.meshes:
   if not m.cast_shadow:continue
   if m.skinned and bones and m.actor!=current_actor:
    self._upload_bones(self.shadow,np.asarray(bones[m.actor],dtype='f4').reshape(-1,4,4));current_actor=m.actor
   self._draw(m,self.shadow,True)
  self.ctx.disable(moderngl.DEPTH_TEST)
  self.blur_x_fbo.use();self.moments.use(0);self.blur_program['u_direction']=(2.2/self.depth.size[0],0);self.blur_vao.render(moderngl.TRIANGLES)
  self.blur_y_fbo.use();self.blur_temp.use(0);self.blur_program['u_direction']=(0,2.2/self.depth.size[1]);self.blur_vao.render(moderngl.TRIANGLES)
  self.ctx.enable(moderngl.DEPTH_TEST)
  self.color_fbo.use();self.ctx.viewport=(0,0,self.width,self.height);self.color_fbo.clear(.714,.639,.545,1,depth=1)
  self.soft_shadow.use(1)
  set_matrix(self.main,'u_view_projection',perspective(fov,self.width/self.height)@look_at(eye,target))
  set_matrix(self.main,'u_light_projection',self.light_vp)
  self.main['u_eye']=tuple(eye);self.main['u_key_dir']=tuple(self.key_dir);self.main['u_fill_dir']=tuple(self.fill_dir);self.main['u_exposure']=self.exposure;self.main['u_feet'].write(feet.tobytes())
  current_actor=None
  for m in self.meshes:
   if m.skinned and bones and m.actor!=current_actor:
    self._upload_bones(self.main,np.asarray(bones[m.actor],dtype='f4').reshape(-1,4,4));current_actor=m.actor
   self._draw(m,self.main)
  self.ctx.copy_framebuffer(self.output_fbo,self.color_fbo)
  img=Image.frombytes('RGBA',(self.width,self.height),self.output_fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB')
  out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
  temporary=out.with_name(out.stem+f'.part-{os.getpid()}'+out.suffix)
  if out.suffix.lower()=='.webp':img.save(temporary,'WEBP',quality=quality,method=5)
  else:img.save(temporary)
  temporary.replace(out)
  return {'path':str(out.resolve()),'elapsed_seconds':round(time.perf_counter()-started,4),'width':self.width,'height':self.height,'bytes':out.stat().st_size}


def read_array(spec,root,default_dtype='<f4',default_file=None):
 if isinstance(spec,list):return np.asarray(spec)
 if isinstance(spec,str):return np.fromfile(root/spec,dtype=default_dtype)
 dtype=spec.get('dtype',spec.get('type',default_dtype))
 dtype={'f32':'<f4','u32':'<u4','u16':'<u2'}.get(dtype,dtype)
 file=spec.get('file',default_file)
 data=np.fromfile(root/file,dtype=dtype,offset=int(spec.get('offset',0)),count=int(spec.get('length',spec.get('count',-1))))
 shape=spec.get('shape');return data.reshape(shape) if shape else data


def load_packet(renderer,packet_path):
 packet_path=Path(packet_path);root=packet_path.parent;packet=json.loads(packet_path.read_text())
 binary=packet.get('binary')
 def arr(spec,dtype='<f4'):return read_array(spec,root,dtype,binary)
 for mesh in packet['meshes']:
  a=mesh.get('attributes',mesh);mat=mesh.get('material',{}).copy()
  if mat.get('map'):mat['map']=str((root/mat['map']).resolve())
  name=mesh.get('name','mesh')
  if 'shirt' in name or 'pants' in name:mat.setdefault('kind',1)
  renderer.add_mesh(name,
    arr(a.get('position',a.get('positions'))).reshape(-1,3),
    arr(a.get('normal',a.get('normals'))).reshape(-1,3),
    arr(a['uv']).reshape(-1,2) if 'uv'in a else None,
    arr(mesh.get('index',a.get('index',a.get('indices'))),'<u4'),mat,
    arr(a.get('skinIndex',a.get('joints'))).reshape(-1,4) if ('skinIndex'in a or 'joints'in a) else None,
    arr(a.get('skinWeight',a.get('weights'))).reshape(-1,4) if ('skinWeight'in a or 'weights'in a) else None,
    actor=mesh.get('skeleton',mesh.get('actor')),model=mesh.get('matrix',mesh.get('model')),
    cast_shadow=mesh.get('castShadow',True),colors=arr(a['color']).reshape(-1,3) if 'color'in a else None)
 return packet


def resolve_frame(metadata,frame_index,root):
 frame=metadata['frames'][frame_index]
 def arr(spec):return read_array(spec,root,'<f4',metadata['binary'])
 bones={actor:arr(spec).reshape(-1,4,4).transpose(0,2,1) for actor,spec in frame.get('skeletons',{}).items()}
 transforms=arr(frame['transforms']).reshape(-1,4,4).transpose(0,2,1)
 models=dict(zip(metadata['meshNames'],transforms))
 feet=[]
 for actor in ('cen','cheng'):
  for side in ('left','right'):
   foot=frame['poses'][actor]['feet'][side]
   a=np.array(foot['ankle']);b=np.array(foot['toe']);c=(a+b)*.5;c[1]=max(0,b[1]-.02)
   feet.append(c.tolist())
 return frame,bones,models,feet


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('packet',type=Path);parser.add_argument('--out',type=Path,required=True)
 parser.add_argument('--report',type=Path,help='Write the batch render record outside the image directory')
 parser.add_argument('--frames',type=Path);parser.add_argument('--index',type=int,default=0)
 parser.add_argument('--all',action='store_true');parser.add_argument('--density',type=int,default=200);parser.add_argument('--skip-existing',action='store_true');parser.add_argument('--stride',type=int,default=1);parser.add_argument('--start-index',type=int,default=0);parser.add_argument('--end-index',type=int)
 parser.add_argument('--width',type=int,default=1200);parser.add_argument('--height',type=int,default=900)
 parser.add_argument('--exposure',type=float,default=.68);parser.add_argument('--quality',type=int,default=88)
 parser.add_argument('--detail',choices=['hands','feet']);parser.add_argument('--detail-x',type=float,default=.025);parser.add_argument('--fov',type=float,default=31);parser.add_argument('--camera-x',type=float,default=.12);parser.add_argument('--camera-y',type=float,default=1.32);parser.add_argument('--camera-z',type=float,default=4.6)
 args=parser.parse_args();started=time.perf_counter();renderer=Renderer(args.width,args.height,args.exposure);packet=load_packet(renderer,args.packet)
 frame_path=args.frames or args.packet.with_name('frames-unison.json')
 metadata=json.loads(frame_path.read_text()) if frame_path.exists() else None
 indices=range(args.start_index,min(args.end_index or len(metadata['frames']),len(metadata['frames'])),args.stride) if args.all else [args.index]
 results=[]
 for i in indices:
  if metadata:frame,bones,models,feet=resolve_frame(metadata,i,frame_path.parent)
  else:frame=packet.get('frame',{});bones=frame.get('bones');models=frame.get('models');feet=frame.get('feet')
  number=int(round(float(frame.get('t',i/args.density))*args.density))
  output=args.out/f'{number:04d}.webp' if args.all else args.out
  if args.all and args.skip_existing and output.exists() and output.stat().st_size>1000:continue
  eye=[args.camera_x,args.camera_y,args.camera_z];target=[0,.9,0];fov=args.fov
  if args.detail:
   if args.detail=='hands':
    target=frame.get('contact',{}).get('point') or frame.get('camera',{}).get('detailTarget') or [0,1.18,.18]
    eye=(np.asarray(target)+np.array([args.detail_x,.11,1.15])).tolist();fov=28
   else:
    target=[0,.17,.06];eye=[.03,.65,1.95];fov=31
  result=renderer.render(output,eye=eye,target=target,fov=fov,feet=feet,bones=bones,models=models,quality=args.quality)
  result['t']=frame.get('t');results.append(result)
  if not args.all or i%10==0:print(json.dumps(result),flush=True)
 final={'renderer':renderer.ctx.info.get('GL_RENDERER'),'frames':len(results),'total_seconds':round(time.perf_counter()-started,3),'results':results}
 if args.all:
  report_path=args.report or args.out/'render-results.json'
  report_path.parent.mkdir(parents=True,exist_ok=True);report_path.write_text(json.dumps(final,indent=2))
  print(json.dumps({k:v for k,v in final.items() if k!='results'}),flush=True)
 else:print(json.dumps({k:v for k,v in final.items() if k!='results'}))

if __name__=='__main__':main()
