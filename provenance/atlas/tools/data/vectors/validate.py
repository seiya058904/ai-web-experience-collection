#!/usr/bin/env python3
"""Check prepared geographic assets, roof coverage and route source lineage.

Run after build.py. Uses the optional Shapely dependency from requirements.txt.
The application build itself does not depend on this validation script.
"""
from collections import Counter
import gzip
import hashlib
import json
import math

import shapely
from shapely.geometry import shape

from build import OUT,SOURCE,CITY,REGION,flat_coords,lines,polygons,great_circle,verify_sources


def require(condition,message):
    if not condition:
        raise AssertionError(message)


def main():
    source_count=verify_sources()
    metadata=json.loads((OUT/'metadata.json').read_text())
    collections={}
    report={
        'source_snapshot':'2026-10-06',
        'source_files_sha256_verified':source_count,
        'shapely_version':shapely.__version__,
        'geos_version':shapely.geos_version_string,
        'assets':[]
    }
    for item in metadata['files']:
        name=item['file'];path=OUT/name;raw=path.read_bytes()
        require(hashlib.sha256(raw).hexdigest()==item['sha256'],f'Output hash mismatch: {name}')
        data=json.loads(raw);collections[name]=data
        require(data['type']=='FeatureCollection',f'Not a FeatureCollection: {name}')
        require(len(data['features'])==item['features'],f'Count mismatch: {name}')
        seen=set();invalid=[];coordinate_count=0
        for f in data['features']:
            require(f['id'] not in seen,f'Duplicate feature ID in {name}: {f["id"]}')
            seen.add(f['id'])
            g=shape(f['geometry'])
            if not g.is_valid:
                invalid.append((f['id'],shapely.is_valid_reason(g)))
            for p in flat_coords(f['geometry']):
                require(len(p)==2 and all(math.isfinite(v) for v in p),f'Invalid coordinate in {name}')
                b=data['bbox']
                require(b[0]-1e-7<=p[0]<=b[2]+1e-7 and b[1]-1e-7<=p[1]<=b[3]+1e-7,f'Coordinate outside bound in {name}: {p}')
                coordinate_count+=1
            for polygon in polygons(f['geometry']):
                for ring in polygon:
                    require(len(ring)>=4 and ring[0]==ring[-1],f'Open or short ring in {name}')
        require(not invalid,f'Invalid geometry in {name}: {invalid[:3]}')
        entry={'file':name,'features':len(data['features']),'coordinates':coordinate_count,'invalid_geometries':len(invalid),'sha256':item['sha256']}
        if name.startswith('city-buildings'):
            geoms=[shape(f['geometry']) for f in data['features']]
            tree=shapely.STRtree(geoms);overlaps=0
            for i,g in enumerate(geoms):
                for index in tree.query(g,predicate='intersects'):
                    if int(index)<=i:
                        continue
                    if g.intersection(geoms[int(index)]).area>1e-13:
                        overlaps+=1
            require(overlaps==0,f'Overlapping roofs in {name}: {overlaps}')
            for f in data['features']:
                require(f['properties'].get('height_is_schematic') is True,f'Missing height disclosure: {name}')
                require(f['properties'].get('schematic_height_m')==8,f'Unexpected exhibit height: {name}')
            entry['overlapping_footprint_pairs']=overlaps
            entry['all_heights_explicitly_schematic']=True
        report['assets'].append(entry)

    footprint_lineage=json.loads(gzip.decompress((SOURCE/'building-lineage.json.gz').read_bytes()))
    for name in ('city-buildings.geojson','city-buildings-mobile.geojson'):
        for f in collections[name]['features']:
            original_ids=footprint_lineage['lineage'].get(f['id'])
            require(bool(original_ids),f'Missing mapped source lineage: {f["id"]}')
            require(len(original_ids)==f['properties']['source_part_count'],f'Lineage count mismatch: {f["id"]}')
    report['building_source_tile_core_parts']=footprint_lineage['raw_polygon_parts']
    report['building_source_footprint_components']=footprint_lineage['footprint_components']

    route=collections['route.geojson']['features'][0]
    coords=route['geometry']['coordinates']
    lineage=json.loads((SOURCE/'route-lineage.json').read_text())
    ids=lineage['segment_source_ids']
    require(len(ids)==len(coords)-1,'Route lineage does not cover every segment')
    roads={f['id']:f for f in collections['city-roads.geojson']['features']}
    route_edges=set()
    for a,b,fid in zip(coords,coords[1:],ids):
        require(fid in roads,f'Missing source road: {fid}')
        segment=frozenset((tuple(a),tuple(b)))
        source_segments={frozenset((tuple(p),tuple(q))) for line in lines(roads[fid]['geometry']) for p,q in zip(line,line[1:])}
        require(segment in source_segments,f'Invented route segment: {a} -> {b}')
        require(segment not in route_edges,'Route retraces an edge')
        route_edges.add(segment)
    distance=sum(great_circle(a,b) for a,b in zip(coords,coords[1:]))
    require(round(distance,1)==route['properties']['distance_m'],'Route length mismatch')
    report['route']={
        'segments':len(coords)-1,'source_road_segments_verified':len(ids),
        'invented_segments':0,'retraced_segments':0,'distance_m':round(distance,1),
        'anchor_waypoint_offset_m':lineage['waypoint_offset_m'][1]
    }
    report['status']='PASS'
    (SOURCE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='assets'},indent=2))
    print(f"Validated {len(report['assets'])} GeoJSON files and {source_count} pinned source files.")


if __name__=='__main__':
    main()
