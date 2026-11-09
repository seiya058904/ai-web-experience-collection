"""Validate and catalogue FRAME's bundled production art after an optional rebake."""
from pathlib import Path
from PIL import Image
from datetime import datetime, timezone
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
STILL_FRAMES = {'glance': 2, 'preparation': 6, 'contact': 6, 'pushing': 9, 'overhead': 18, 'ending': 24, 'resting': 24}
GROUPS = {'landscape': list((PUBLIC / 'frames/landscape').glob('*.webp')),
          'portrait': list((PUBLIC / 'frames/portrait').glob('*.webp')),
          'hero': list((PUBLIC / 'frames/hero').glob('*.webp')),
          'hero-portrait': list((PUBLIC / 'frames/hero-portrait').glob('*.webp')),
          'stills': list((PUBLIC / 'stills').glob('*.webp'))}
expected = {'landscape': 32, 'portrait': 32, 'hero': 24, 'hero-portrait': 24, 'stills': 14}
manifest = {'version': 1, 'generatedAt': datetime.now(timezone.utc).isoformat(),
            'scope': 'Bundled CPU-rendered production artwork; image-generation studies have a separate record.',
            'canonicalSequenceImages': 64, 'heroSequenceImages': 24, 'heroPortraitSequenceImages': 24, 'matchedStills': 14,
            'sources': {}, 'groups': {}, 'assets': {}}
for rel in ['src/timeline.ts', 'scripts/render-boop.cpp', 'scripts/bake-frames.mjs']:
    manifest['sources'][rel] = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
for group, paths in GROUPS.items():
    if len(paths) != expected[group]:
        raise ValueError(f'{group}: expected {expected[group]} images, found {len(paths)}')
    size = 0
    for path in sorted(paths):
        data = path.read_bytes()
        with Image.open(path) as image:
            image.load()
            width, height = image.size
        key = path.relative_to(PUBLIC).as_posix()
        entry = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'width': width, 'height': height, 'group': group}
        if group == 'stills':
            name, camera = path.stem.rsplit('-', 1)
            entry.update({'pose': STILL_FRAMES[name], 'camera': camera, 'purpose': name,
                          'inCanonicalTimeline': False, 'seatedEpilogue': name == 'resting'})
        else:
            take, frame = path.stem.rsplit('-', 1)
            entry.update({'pose': int(frame), 'camera': group, 'take': take,
                          'inCanonicalTimeline': not group.startswith('hero')})
        manifest['assets'][key] = entry
        size += len(data)
    manifest['groups'][group] = {'images': len(paths), 'bytes': size}
manifest['totalImages'] = len(manifest['assets'])
manifest['totalBytes'] = sum(group['bytes'] for group in manifest['groups'].values())
(PUBLIC / 'production-art-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'images': manifest['totalImages'], 'bytes': manifest['totalBytes'], 'groups': manifest['groups']}, indent=2))
