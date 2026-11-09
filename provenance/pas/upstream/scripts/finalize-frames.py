"""Verify the completed PAS image set, write its manifest, and build still aliases.
Run after all four main sequences and the three dense detail ranges complete.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse, hashlib, json, shutil, subprocess, math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
FRAMES=ROOT/'public/frames'
DENSITY=200
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--packet',type=Path,help='Optional frozen packet directory to fingerprint in the integrity record')
args=parser.parse_args()
VIEWS={
 'wide':{'width':1200,'height':900,'eye':[.12,1.32,4.6]},
 'narrow':{'width':720,'height':960,'eye':[2.25,1.35,4.83]},
}

def normalize(v):
 v=np.asarray(v,dtype='f4');return v/max(float(np.linalg.norm(v)),1e-9)

def projection_view(eye,width,height):
 eye=np.asarray(eye,dtype='f4');f=normalize(np.asarray([0,.9,0])-eye);s=normalize(np.cross(f,[0,1,0]));u=np.cross(s,f)
 view=np.eye(4,dtype='f4');view[0,:3]=s;view[1,:3]=u;view[2,:3]=-f
 view[0,3]=-np.dot(s,eye);view[1,3]=-np.dot(u,eye);view[2,3]=np.dot(f,eye)
 p=np.zeros((4,4),dtype='f4');k=1/math.tan(math.radians(31)/2);near=.04;far=60
 p[0,0]=k/(width/height);p[1,1]=k;p[2,2]=(far+near)/(near-far);p[2,3]=2*far*near/(near-far);p[3,2]=-1
 return (p@view).T.flatten().tolist()

def inspect(job):
 path,size=job
 if not path.exists():raise RuntimeError(f'Missing expected frame: {path.relative_to(ROOT)}')
 with Image.open(path) as image:
  if image.format!='WEBP' or image.size!=size:raise RuntimeError(f'Incorrect frame format or dimensions: {path}')
  image.load()
 data=path.read_bytes()
 return {'file':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

jobs=[];summaries={}
for name,view,start,end in [('wide','wide',0,2000),('narrow','narrow',0,2000),('echo-wide','wide',800,952),('echo-narrow','narrow',800,952)]:
 size=(VIEWS[view]['width'],VIEWS[view]['height'])
 files=[FRAMES/name/f'{i:04d}.webp' for i in range(start,end+1)]
 expected={p.name for p in files}
 actual={p.name for p in (FRAMES/name).glob('*.webp')}
 extras=actual-expected
 if extras:raise RuntimeError(f'Unexpected sequence files in {name}: {sorted(extras)[:5]}')
 jobs.extend((p,size)for p in files)
 summaries[name]={'count':len(files),'width':size[0],'height':size[1],'first':start,'last':end}
detail_ranges={'detail-feet':[(200,352)],'detail-hands':[(400,552),(1596,1660)]}
details={}
for name,ranges in detail_ranges.items():
 files=[FRAMES/name/f'{i:04d}.webp' for start,end in ranges for i in range(start,end+1)]
 expected={p.name for p in files}
 actual={p.name for p in (FRAMES/name).glob('*.webp')}
 extras=actual-expected
 if extras:raise RuntimeError(f'Unexpected detail files in {name}: {sorted(extras)[:5]}')
 jobs.extend((p,(800,600))for p in files)
 details[name]={'count':len(files),'width':800,'height':600,'density':DENSITY,'stride':1,'ranges':ranges}
with ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(inspect,jobs))
for name in summaries:
 summaries[name]['bytes']=sum(x['bytes'] for x in checks if x['file'].startswith(f'public/frames/{name}/'))
for name in details:
 details[name]['bytes']=sum(x['bytes'] for x in checks if x['file'].startswith(f'public/frames/{name}/'))

result=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',f'import {{CHAPTERS}} from {json.dumps((ROOT/"src/content.ts").as_uri())};process.stdout.write(JSON.stringify(CHAPTERS));'],check=True,capture_output=True,text=True)
chapters=json.loads(result.stdout)
aliases=[]

def copy_still(view,name,t,mode='unison',chapter=None,label=None):
 index=min(2000,max(0,round(t*DENSITY)))
 variant=f'echo-{view}' if mode=='echo' and 800<=index<=952 else view
 source=FRAMES/variant/f'{index:04d}.webp'
 dest=ROOT/'public/stills'/('narrow' if view=='narrow' else '')/f'{name}.webp'
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
 aliases.append({'file':str(dest.relative_to(ROOT)),'source':str(source.relative_to(ROOT)),'requestedT':t,'renderedT':index/DENSITY,'chapter':chapter,'label':label,'view':view,'mode':mode})
 return source

for chapter in chapters:
 for view in VIEWS:
  for i,step in enumerate(chapter['steps'],1):
   name=f'ch-{chapter["id"]:02d}-{i}'
   copy_still(view,name,step['t'],chapter=chapter['id'],label=step['label'])
   if chapter['id']==5:
    for mode in ('unison','echo'):copy_still(view,f'{name}-{mode}',step['t'],mode,chapter['id'],step['label'])
  first=chapter['steps'][0]
  source=copy_still(view,f'ch-{chapter["id"]:02d}',first['t'],chapter=chapter['id'],label=first['label'])
  dest=FRAMES/f'posters-{view}'/f'ch-{chapter["id"]:02d}.webp';dest.parent.mkdir(parents=True,exist_ok=True)
  size=(480,360)if view=='wide' else(270,360)
  with Image.open(source)as image:image.resize(size,Image.Resampling.LANCZOS).save(dest,'WEBP',quality=82,method=5)
for view in VIEWS:copy_still(view,'compare-own-weight',2.89,label='Independent support with the grip formed')

views={name:{**spec,'target':[0,.9,0],'fov':31,'motionLayout':'wide','projectionViewMatrix':projection_view(spec['eye'],spec['width'],spec['height'])}for name,spec in VIEWS.items()}
manifest={'version':1,'status':'complete','density':DENSITY,'count':2001,'width':1200,'height':900,'mobileWidth':720,'mobileHeight':960,'floorY':0,'views':views,'sequences':summaries,'details':details,'posters':{'wide':{'width':480,'height':360},'narrow':{'width':270,'height':360}}}
source_files=['scripts/render-duet.py','scripts/export-render-rig.mjs','scripts/finalize-frames.py','src/motion.ts','src/character-metrics.ts','src/render/character.ts','src/render/stage.ts','src/content.ts']
sources={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in source_files if(ROOT/name).exists()}
packet={}
if args.packet:
 freeze_path=args.packet/'freeze-evidence.json'
 if freeze_path.exists():
  frozen_sources=json.loads(freeze_path.read_text()).get('sourceHashes',{})
  changed=[name for name,value in frozen_sources.items() if not(ROOT/name).exists() or hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=value]
  if changed:raise RuntimeError(f'Production sources differ from the frozen render packet: {changed}')
 for name in ('rig.json','rig.bin','frames-unison.json','frames-unison.bin','frames-echo.json','frames-echo.bin'):
  path=args.packet/name
  packet[name]={'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
(FRAMES/'manifest.json').write_text(json.dumps(manifest,indent=2))
report={'status':'All expected main and detail files fully decoded and dimensions verified. This is file validation, not a blanket visual or browser pass.','density':DENSITY,'floorY':0,'frameCount':len(checks),'totalFrameBytes':sum(x['bytes']for x in checks),'sequences':summaries,'details':details,'sourceSha256':sources,'frozenPacket':packet,'aliases':aliases,'files':checks}
(ROOT/'docs/render-assets.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'frames':len(checks),'bytes':report['totalFrameBytes'],'aliases':len(aliases),'posters':20,'manifest':str(FRAMES/'manifest.json')},indent=2))
