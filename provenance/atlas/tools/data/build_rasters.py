#!/usr/bin/env python3
"""Rebuild ATLAS's runtime rasters from the included GSI source crops, offline.

Python 3.10+ and requirements.txt are needed only for this optional data step.
The website's ordinary npm install/build/preview uses prebuilt public/data/.
"""
from __future__ import annotations
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, map_coordinates
from mesh_contours import mesh_contours

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'data-source' / 'gsi'
OUTPUT = ROOT / 'public' / 'data'
RADIUS = 6378137.0
ANCHOR = [138.8079, 35.4875]


def write_json(path, value):
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n')
    temporary.replace(path)


def mercator(lon, lat):
    return RADIUS*math.radians(lon), RADIUS*math.asinh(math.tan(math.radians(lat)))


def bounds_metadata(bounds):
    west, south, east, north = bounds
    mx0, my0 = mercator(west, south)
    mx1, my1 = mercator(east, north)
    ax, ay = mercator(*ANCHOR)
    coslat = math.cos(math.radians((south+north)/2))
    return {
        'west': west, 'south': south, 'east': east, 'north': north,
        'boundsWGS84': bounds,
        'mercatorBounds': {'west': mx0, 'south': my0, 'east': mx1, 'north': my1},
        'projection': 'EPSG:3857', 'geographicCRS': 'EPSG:4326',
        'widthMeters': (mx1-mx0)*coslat, 'depthMeters': (my1-my0)*coslat,
        'groundScaleCosLatitude': coslat,
        'anchor': {'longitude': ANCHOR[0], 'latitude': ANCHOR[1],
                   'u': (ax-mx0)/(mx1-mx0), 'v': (my1-ay)/(my1-my0)},
        'uvConvention': 'u: west=0 to east=1; v: north=0 to south=1; nonlinear in latitude (Web Mercator)',
        'heightUnits': 'metres above sea level, GSI published vertical datum at retrieval',
        'heightEncoding': 'Float32 little endian, no header; row-major north-to-south and west-to-east',
        'gridConvention': 'N × N nodes including bounds; u=column/(N-1), v=row/(N-1)',
    }


def source(name):
    meta = json.loads((SOURCE/f'{name}.json').read_text())
    file = SOURCE/meta['imageFile']
    actual = hashlib.sha256(file.read_bytes()).hexdigest()
    if actual != meta['sourceCropSha256']:
        raise ValueError(f'Source hash mismatch for {file.name}')
    image = Image.open(file).convert('RGB')
    return meta, image


def decode_dem(image):
    rgb = np.array(image).astype(np.int32)
    packed = rgb[:,:,0]*65536 + rgb[:,:,1]*256 + rgb[:,:,2]
    missing = packed == 8388608
    packed = np.where(packed > 8388608, packed-16777216, packed)
    height = packed.astype(np.float64)*0.01
    count = int(np.sum(missing))
    if count:
        # Used only for published no-data samples (e.g. water); the fraction is
        # explicitly recorded so interpolation cannot be mistaken for surveying.
        if count / missing.size > 0.05:
            raise ValueError('DEM has more than 5% missing samples; refusing a synthetic repair')
        indices = distance_transform_edt(missing, return_distances=False, return_indices=True)
        height[missing] = height[tuple(indices[:,missing])]
    return height, count


def sample_dem(height, meta, size):
    sx0, sy0, _, _ = meta['sourceCropGlobalPixelEdges']
    x0, y0, x1, y1 = meta['targetGlobalPixelEdges']
    x = np.linspace(x0-sx0-.5, x1-sx0-.5, size)
    y = np.linspace(y0-sy0-.5, y1-sy0-.5, size)
    xx, yy = np.meshgrid(x, y)
    return map_coordinates(height, [yy, xx], order=1, mode='nearest').astype('<f4')


def image_crop(image, meta, size):
    sx0, sy0, _, _ = meta['sourceCropGlobalPixelEdges']
    x0, y0, x1, y1 = meta['targetGlobalPixelEdges']
    return image.resize((size,size), Image.Resampling.LANCZOS,
                        box=(x0-sx0,y0-sy0,x1-sx0,y1-sy0))


def make_elevation(name, filename, sizes):
    meta, image = source(name)
    height, missing = decode_dem(image)
    out = bounds_metadata(meta['boundsWGS84'])
    out.update({'demSource': 'Geospatial Information Authority of Japan (GSI), DEM10B PNG elevation tiles',
                'sourceLayer': meta['layer'], 'sourceZoom': meta['zoom'],
                'retrievedUTC': meta['retrievedUTC'],
                'sourceResolutionMetresApprox': 2*math.pi*RADIUS/(256*2**meta['zoom'])*out['groundScaleCosLatitude'],
                'sourceNoDataSamples': missing, 'sourceSamples': int(height.size),
                'sourceNoDataProcessing': 'Nearest valid published elevation for no-data samples only; none if count is zero',
                'processing': 'Decode centimetre RGB; bilinear resample into a uniform Web Mercator node grid. No vertical exaggeration baked into data.',
                'attribution': 'Elevation: GSI. Cropped and resampled for ATLAS.',
                'sourceURL': 'https://maps.gsi.go.jp/help/use.html',
                'licenseURL': 'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
                'grids': []})
    arrays = {}
    for size in sizes:
        array = sample_dem(height, meta, size)
        file = OUTPUT/f'{filename}-{size}.bin'
        array.tofile(file)
        arrays[size] = array
        out['grids'].append({'size': size, 'file': file.name, 'bytes': file.stat().st_size,
                             'minimumElevationM': float(array.min()), 'maximumElevationM': float(array.max()),
                             'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
        print(file.name, size, f'height {array.min():.2f} to {array.max():.2f} m', flush=True)
    array = arrays[max(sizes)]
    out['minimumElevationM'] = float(array.min())
    out['maximumElevationM'] = float(array.max())
    a = out['anchor']
    out['anchor']['elevationM'] = float(map_coordinates(array,[[a['v']*(array.shape[0]-1)],[a['u']*(array.shape[1]-1)]],order=1,mode='nearest')[0])
    return out, arrays


def make_imagery(name, filename, sizes, kind):
    meta, image = source(name)
    variants=[]
    for size in sizes:
        resized = image_crop(image,meta,size)
        path=OUTPUT/f'{filename}-{size}.webp'
        resized.save(path,quality=91,method=6)
        variants.append({'size':size,'file':path.name,'bytes':path.stat().st_size,
                         'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        print(path.name, path.stat().st_size, flush=True)
    return {'kind':kind,'sourceLayer':meta['layer'],'sourceZoom':meta['zoom'],
            'retrievedUTC':meta['retrievedUTC'],'variants':variants,
            'source':('GSI seamlessphoto, national Landsat 8 mosaic' if name=='regional-satellite' else 'GSI seamlessphoto, seamless aerial orthophotography mosaic'),
            'processing':'Lossless source-tile mosaic crop, Lanczos resampling, WebP encoding. Native colors retained; no AI imagery.',
            'acquisitionTime':'Multi-date mosaic; not a current or single-date observation',
            'uvConvention':'u west-to-east; v north-to-south, same EPSG:3857 bounds as paired elevation',
            'sourceURL':'https://maps.gsi.go.jp/help/use.html',
            'licenseURL':'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html'}


def make_contours(array, filename='contours-100m.json'):
    result=mesh_contours(array, interval=100, major_interval=500)
    grid_file=OUTPUT/f'elevation-{array.shape[0]}.bin'
    result['sourceGridFile']=grid_file.name
    result['sourceGridSha256']=hashlib.sha256(grid_file.read_bytes()).hexdigest()
    path=OUTPUT/filename
    write_json(path,result)
    print(filename,result['polylineCount'],'polylines',result['pointCount'],'points',
          f"max triangle height error {result['verification']['maximumAbsoluteHeightErrorM']:.8f} m",flush=True)
    return {'file':filename,'gridSize':array.shape[0],'sourceGrid':grid_file.name,
            'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'polylines':result['polylineCount'],'points':result['pointCount'],
            'maximumAbsoluteHeightErrorM':result['verification']['maximumAbsoluteHeightErrorM']}


def contour_metadata(arrays):
    desktop=make_contours(arrays[513],'contours-100m.json')
    mobile=make_contours(arrays[257],'contours-mobile.json')
    return {'file':desktop['file'],'mobileFile':mobile['file'],
            'intervalMetres':100,'majorIntervalMetres':500,
            'method':'Exact contours of the matching LOD triangle mesh, [a,c,b] / [b,c,d]',
            'variants':[desktop,mobile]}


def main():
    OUTPUT.mkdir(parents=True,exist_ok=True)
    region, arrays=make_elevation('regional-dem','elevation',[1025,513,257,129])
    region['imagery']=make_imagery('regional-satellite','satellite',[2048,1024],'satellite')
    region['contours']=contour_metadata(arrays)
    write_json(OUTPUT/'terrain.json',region)
    city,_=make_elevation('city-dem','city-elevation',[257,129])
    city['imagery']=make_imagery('city-aerial','city-aerial',[2048,1024],'aerial')
    write_json(OUTPUT/'city-raster.json',city)
    print('Raster assets rebuilt. Geographic data unchanged; checksums in terrain.json and city-raster.json.',flush=True)


if __name__=='__main__':
    main()
