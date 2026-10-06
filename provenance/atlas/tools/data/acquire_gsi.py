#!/usr/bin/env python3
"""Acquire bounded, openly reusable GSI raster inputs for ATLAS.

Run from any directory. Downloaded tiles are cached outside the deliverable;
only minimal source crops and a manifest of source hashes enter data-source/.
No API key is needed. See the adjacent build_rasters.py for offline rebuilding.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import hashlib
import io
import json
import math
import tempfile
import time
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'data-source' / 'gsi'
REGION = [138.54, 35.24, 138.99, 35.61]
CITY = [138.791, 35.474, 138.827, 35.505]
DATASETS = [
    ('regional-dem', 'dem_png', 'png', 12, REGION),
    ('regional-satellite', 'seamlessphoto', 'jpg', 13, REGION),
    ('city-dem', 'dem_png', 'png', 14, CITY),
    ('city-aerial', 'seamlessphoto', 'jpg', 16, CITY),
]


def pixel(lon: float, lat: float, zoom: int) -> tuple[float, float]:
    scale = 256 * 2**zoom
    return ((lon + 180) / 360 * scale,
            (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * scale)


def acquire(name, layer, extension, zoom, bounds, cache, workers):
    west, south, east, north = bounds
    x0, y0 = pixel(west, north, zoom)
    x1, y1 = pixel(east, south, zoom)
    # Preserve the half-pixel interpolation border around the requested crop.
    crop = [math.floor(x0) - 1, math.floor(y0) - 1,
            math.ceil(x1) + 1, math.ceil(y1) + 1]
    tx0, ty0 = crop[0] // 256, crop[1] // 256
    tx1, ty1 = (crop[2] - 1) // 256, (crop[3] - 1) // 256
    tasks = [(x, y) for y in range(ty0, ty1+1) for x in range(tx0, tx1+1)]
    canvas = Image.new('RGB', ((tx1-tx0+1)*256, (ty1-ty0+1)*256))
    records = []
    print(f'{name}: {len(tasks)} tiles at z{zoom}; target {bounds}', flush=True)

    def fetch(task):
        x, y = task
        url = f'https://cyberjapandata.gsi.go.jp/xyz/{layer}/{zoom}/{x}/{y}.{extension}'
        file = cache / layer / str(zoom) / str(x) / f'{y}.{extension}'
        data = file.read_bytes() if file.exists() else None
        if data is None:
            for attempt in range(3):
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'ATLAS-geographic-artwork/1.0 (bounded educational data preparation)'})
                    with urllib.request.urlopen(req, timeout=35) as response:
                        data = response.read()
                    # Validate the asset before committing it to the cache.
                    with Image.open(io.BytesIO(data)) as probe:
                        if probe.size != (256, 256):
                            raise ValueError(f'Unexpected tile dimensions {probe.size}')
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_bytes(data)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(1 + attempt * 2)
        image = Image.open(io.BytesIO(data)).convert('RGB')
        return x, y, image, {'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        for index, future in enumerate(concurrent.futures.as_completed([executor.submit(fetch, t) for t in tasks]), 1):
            x, y, image, record = future.result()
            canvas.paste(image, ((x-tx0)*256, (y-ty0)*256))
            records.append(record)
            if index % 8 == 0 or index == len(tasks):
                print(f'{name}: {index}/{len(tasks)}', flush=True)

    image = canvas.crop((crop[0]-tx0*256, crop[1]-ty0*256, crop[2]-tx0*256, crop[3]-ty0*256))
    output = SOURCE / f'{name}.png'
    image.save(output, optimize=True)
    metadata = {
        'name': name, 'layer': layer, 'zoom': zoom, 'boundsWGS84': bounds,
        'sourceCropGlobalPixelEdges': crop,
        'sourceCropDimensions': list(image.size),
        'targetGlobalPixelEdges': [x0, y0, x1, y1],
        'pixelReference': 'XYZ/Web Mercator; raster pixels occupy edge-to-edge cells, samples at pixel centres',
        'retrievedUTC': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'imageFile': output.name,
        'sourceCropSha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'tiles': sorted(records, key=lambda r: r['url']),
        'termsURL': 'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
        'catalogURL': 'https://maps.gsi.go.jp/help/use.html',
        'note': 'Minimal lossless spatial crop assembled from original source tile pixels. No colors or heights synthesized.'
    }
    (SOURCE / f'{name}.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False)+'\n')
    print(f'{name}: saved {image.width} × {image.height}, {output.stat().st_size:,} bytes', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=Path(tempfile.gettempdir())/'atlas-gsi-tile-cache')
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--only', choices=[x[0] for x in DATASETS])
    args = parser.parse_args()
    SOURCE.mkdir(parents=True, exist_ok=True)
    for dataset in DATASETS:
        if args.only is None or args.only == dataset[0]:
            acquire(*dataset, args.cache, min(max(args.workers, 1), 8))


if __name__ == '__main__':
    main()
