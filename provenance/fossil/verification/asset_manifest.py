#!/usr/bin/env python3
"""Inventory the delivered image assets without altering their pixels.

Optional development utility; Pillow is not required to run the website.
"""
from pathlib import Path
import hashlib
import json
import base64
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def raster(path):
    with Image.open(path) as im:
        return {"path":path.relative_to(ROOT).as_posix(),"format":im.format,
                "width":im.width,"height":im.height,"mode":im.mode,
                "bytes":path.stat().st_size,"sha256":digest(path)}

records=[]
for path in sorted((ROOT/'reference').glob('*.png')):
    record=raster(path)
    prompts=[path.with_suffix('.prompt.txt')]
    refinement=path.with_suffix('.refinement.prompt.txt')
    if refinement.exists(): prompts.append(refinement)
    record.update(origin="AI generated for this project",role="visual-development reference; not used as website pixels",
                  prompts=[{"path":p.relative_to(ROOT).as_posix(),"sha256":digest(p)} for p in prompts])
    records.append(record)
for path in sorted((ROOT/'assets/ai-originals').glob('*.png')):
    record=raster(path)
    prompt=path.with_suffix('.prompt.txt')
    record.update(origin="AI generated for this project",role="text-free production original",
                  prompt={"path":prompt.relative_to(ROOT).as_posix(),"sha256":digest(prompt)},
                  retained="Original PNG pixels and transparency retained; no manual image retouching")
    records.append(record)
    derivative=ROOT/'assets/images'/f'{path.stem}.webp'
    record=raster(derivative)
    record.update(origin="AI-generated production derivative",role="website production material",
                  source=path.relative_to(ROOT).as_posix(),source_sha256=digest(path),
                  prompt=prompt.relative_to(ROOT).as_posix(),
                  transformation="ffmpeg libwebp, quality 91, compression_level 6; original dimensions, no cropping; source alpha retained when present",
                  metadata="Exact generation prompt embedded in WebP metadata; verified not to change decoded pixels")
    records.append(record)

handbook = ROOT/'docs/VISUAL-BIBLE.html'
font_match = re.search(r'data:font/woff;base64,([A-Za-z0-9+/=]+)', handbook.read_text())
embedded_font = base64.b64decode(font_match.group(1)) if font_match else b''
third_party_files = [
    ('vendor/lenis.min.js', 'Lenis 1.3.26', 'licenses/Lenis-MIT.txt'),
    ('assets/fonts/bodoni-moda.woff2', 'Bodoni Moda', 'licenses/Bodoni-Moda-OFL.txt'),
    ('assets/fonts/cormorant-garamond.woff2', 'Cormorant Garamond', 'licenses/Cormorant-Garamond-OFL.txt'),
    ('assets/fonts/cormorant-garamond-italic.woff2', 'Cormorant Garamond Italic', 'licenses/Cormorant-Garamond-OFL.txt'),
    ('assets/fonts/manrope.woff2', 'Manrope', 'licenses/Manrope-OFL.txt'),
    ('models/marching-cubes-table.json', 'Three.js Marching Cubes lookup table', 'models/MARCHING_CUBES_LICENSE.txt'),
]

data={"project":"FOSSIL — Deep Time in Stone","schema":1,
      "interpretation":"Generated images are not photographs of accessioned specimens. The numerical field and mesh are synthetic, not acquired CT.",
      "inventory":records,
      "procedural_records":["data/volume-metadata.json","data/verification.json","models/procedural-parameters.json","data/RENDERING.md"],
      "third_party_assets":[{"path":p,"name":name,"bytes":(ROOT/p).stat().st_size,
                             "sha256":digest(ROOT/p),"license":license_path}
                            for p,name,license_path in third_party_files],
      "embedded_font":{"name":"Droid Sans Fallback Regular","container":"docs/VISUAL-BIBLE.html",
                       "role":"Offline Chinese reading in the Visual Bible only","format":"WOFF",
                       "bytes":len(embedded_font),"sha256":hashlib.sha256(embedded_font).hexdigest(),
                       "source":"Runtime MuPDF / PyMuPDF CJK font resource; Android Droid font",
                       "modification":"Subset to the 750 characters needed by the handbook; converted to WOFF; no glyph redesign",
                       "license":"licenses/Droid-Sans-Fallback-Apache.txt",
                       "embedded_notice":"docs/VISUAL-BIBLE.html#font-license"},
      "third_party_notices":["licenses/Lenis-MIT.txt","licenses/Bodoni-Moda-OFL.txt","licenses/Cormorant-Garamond-OFL.txt","licenses/Manrope-OFL.txt","licenses/Droid-Sans-Fallback-Apache.txt","models/MARCHING_CUBES_LICENSE.txt"],
      "research":"docs/RESEARCH.md; references support terminology, not image or numerical sourcing"}
(ROOT/'docs/ASSET-MANIFEST.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(f'Inventoried {len(records)} original, reference and production raster assets.')
