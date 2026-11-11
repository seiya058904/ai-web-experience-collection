#!/usr/bin/env python3
"""Package distributable source and retained evidence. Does not deploy or upload."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=root.parent / 'chrysalis-source.zip')
args = parser.parse_args()
output = args.output.resolve()
files = ['index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
         'vite.config.ts', 'README.md', 'VISUAL-BIBLE.md', 'DESIGN.md',
         'PRODUCT.md', 'LICENSE.md', 'requirements-evidence.md',
         'Start-Chrysalis.ps1', 'START.bat', '.gitignore']
directories = ['src', 'public', 'art', 'scripts', 'tests', 'docs', 'licenses', 'evidence', '.impeccable']
paths = [root / name for name in files]
for directory in directories:
    paths.extend(p for p in (root / directory).rglob('*') if p.is_file())
paths = sorted({p for p in paths if '__pycache__' not in p.parts and p.suffix != '.pyc'})
missing = [str(p.relative_to(root)) for p in paths if not p.is_file()]
if missing:
    raise SystemExit('Missing deliverables: ' + ', '.join(missing))
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in paths:
        archive.write(path, str(Path('chrysalis') / path.relative_to(root)))
with zipfile.ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit('Archive integrity failure: ' + bad)
    names = archive.namelist()
    if any('/node_modules/' in name or '/.preview-project/' in name or '/.env' in name for name in names):
        raise SystemExit('An excluded dependency or private preview path entered the archive.')
print(json.dumps({'archive': str(output), 'files': len(paths), 'bytes': output.stat().st_size,
                  'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}, indent=2))
