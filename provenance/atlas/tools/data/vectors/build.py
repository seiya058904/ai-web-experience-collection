#!/usr/bin/env python3
"""Rebuild compact ATLAS vector assets from the bundled source snapshot.

Python 3.10+, Shapely 2.1.2. Run from any directory. No network needed once the
optional preprocessing dependency in requirements.txt has been installed.
The map geometry is real GSI / Natural Earth data. Extrusion height and the
selected traversal are explicitly authored exhibition choices.
"""
from pathlib import Path
from collections import defaultdict
import argparse
import hashlib
import heapq
import json
import math
import gzip

from fetch import CITY, REGION, tiles
from mvt import decode, signed_area

ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/"data-source/vectors"
OUT=ROOT/"public/data/vectors"
ANCHOR=[138.8079,35.4875]


def verify_sources():
    manifest=json.loads((SOURCE/'sources.json').read_text())
    for record in manifest['files']:
        path=SOURCE/record['path']
        if hashlib.sha256(path.read_bytes()).hexdigest()!=record['sha256']:
            raise ValueError(f'Pinned source checksum mismatch: {record["path"]}')
    return len(manifest['files'])


def point_distance_sq(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))) if dx or dy else 0
    return (p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2


def simplify_line(points,tolerance):
    if len(points)<3:
        return points
    keep={0,len(points)-1}
    stack=[(0,len(points)-1)]
    tolerance_sq=tolerance*tolerance
    while stack:
        first,last=stack.pop()
        best,index=tolerance_sq,None
        for i in range(first+1,last):
            d=point_distance_sq(points[i],points[first],points[last])
            if d>best:
                best,index=d,i
        if index is not None:
            keep.add(index)
            stack.extend(((first,index),(index,last)))
    return [points[i] for i in sorted(keep)]


def simplify_ring(ring,tolerance):
    if len(ring)<6:
        return ring
    index=max(range(1,len(ring)-1),key=lambda i:point_distance_sq(ring[i],ring[0],ring[0]))
    simplified=simplify_line(ring[:index+1],tolerance)[:-1]+simplify_line(ring[index:],tolerance)
    return simplified if len(simplified)>=4 else ring


def clean_points(points,precision=8):
    out=[]
    for p in points:
        p=[round(p[0],precision),round(p[1],precision)]
        if not out or out[-1]!=p:
            out.append(p)
    return out


def clip_segment(a,b,bounds):
    w,s,e,n=bounds
    dx,dy=b[0]-a[0],b[1]-a[1]
    enter,exit=0.0,1.0
    for p,q in ((-dx,a[0]-w),(dx,e-a[0]),(-dy,a[1]-s),(dy,n-a[1])):
        if p==0:
            if q<0:
                return None
        else:
            r=q/p
            if p<0:
                if r>exit:
                    return None
                enter=max(enter,r)
            else:
                if r<enter:
                    return None
                exit=min(exit,r)
    return [[round(a[0]+enter*dx,8),round(a[1]+enter*dy,8)],[round(a[0]+exit*dx,8),round(a[1]+exit*dy,8)]]


def clip_line(points,bounds):
    parts=[]
    for a,b in zip(points,points[1:]):
        seg=clip_segment(a,b,bounds)
        if not seg or seg[0]==seg[1]:
            continue
        if parts and parts[-1][-1]==seg[0]:
            parts[-1].append(seg[1])
        else:
            parts.append(seg)
    return parts


def clip_ring(points,bounds):
    ring=points[:-1] if points[0]==points[-1] else points
    for axis,edge,side in ((0,bounds[0],1),(0,bounds[2],-1),(1,bounds[1],1),(1,bounds[3],-1)):
        result=[]
        if not ring:
            break
        a=ring[-1]
        a_in=side*(a[axis]-edge)>=-1e-12
        for b in ring:
            b_in=side*(b[axis]-edge)>=-1e-12
            if b_in!=a_in:
                t=(edge-a[axis])/(b[axis]-a[axis])
                result.append([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
            if b_in:
                result.append(b)
            a,a_in=b,b_in
        ring=result
    ring=clean_points(ring)
    if len(ring)<3:
        return None
    if ring[0]!=ring[-1]:
        ring.append(ring[0])
    return ring if abs(signed_area(ring))>1e-13 else None


def clip_geometry(geometry,bounds):
    kind=geometry['type']
    coords=geometry['coordinates']
    if kind in ('LineString','MultiLineString'):
        lines=[coords] if kind=='LineString' else coords
        parts=[part for line in lines for part in clip_line(line,bounds)]
        if not parts:
            return None
        return {'type':'LineString','coordinates':parts[0]} if len(parts)==1 else {'type':'MultiLineString','coordinates':parts}
    if kind in ('Polygon','MultiPolygon'):
        polygons=[coords] if kind=='Polygon' else coords
        parts=[]
        for polygon in polygons:
            outer=clip_ring(polygon[0],bounds)
            if not outer:
                continue
            holes=[r for ring in polygon[1:] if (r:=clip_ring(ring,bounds))]
            parts.append([outer]+holes)
        if not parts:
            return None
        return {'type':'Polygon','coordinates':parts[0]} if len(parts)==1 else {'type':'MultiPolygon','coordinates':parts}
    return None


def feature_collection(name,features,bounds=None,description=None):
    result={'type':'FeatureCollection','name':name,'features':features}
    if bounds:
        result['bbox']=bounds
    if description:
        result['description']=description
    return result


def save(name,data):
    OUT.mkdir(parents=True,exist_ok=True)
    p=OUT/name
    raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
    p.write_bytes(raw)
    record={'file':name,'features':len(data.get('features',[])),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    print(record,flush=True)
    return record


def load_gsi(bounds,zoom):
    result=defaultdict(list)
    for z,x,y in tiles(bounds,zoom):
        path=SOURCE/f'gsi/{z}/{x}/{y}.pbf'
        if not path.exists():
            raise FileNotFoundError(f'Missing pinned source {path}; run fetch.py first')
        layers=decode(path.read_bytes(),z,x,y,selected={'road','building','river','waterarea','label','railway','lake'})
        # GSI MVT includes a small buffered margin outside the nominal tile.
        # Keep only the tile core so adjacent source tiles never paint duplicate
        # overlapping features. Polygon fragments are merged after decoding.
        n=2**z
        lat=lambda yy:math.degrees(math.atan(math.sinh(math.pi*(1-2*yy/n))))
        core=[x/n*360-180,lat(y+1),(x+1)/n*360-180,lat(y)]
        tile_bounds=[max(bounds[0],core[0]),max(bounds[1],core[1]),min(bounds[2],core[2]),min(bounds[3],core[3])]
        for layer,features in layers.items():
            for i,f in enumerate(features):
                geom=clip_geometry(f['geometry'],tile_bounds)
                if not geom:
                    continue
                f['geometry']=geom
                f['id']=f'gsi-{z}-{x}-{y}-{layer}-{i}'
                f['properties']['source_layer']=layer
                result[layer].append(f)
    return result


def merge_footprints(features):
    """Union actual source footprint coverage; remove buffered tile duplicates.

    This changes representation, not the footprint extent. Touching mapped
    structures can become one connected footprint component, suitable for a
    constant-height exhibit. The input feature IDs are retained in lineage.
    """
    try:
        import shapely
        from shapely.geometry import shape,mapping
        from shapely.geometry.polygon import orient
    except ImportError as exc:
        raise SystemExit('Install preprocessing dependencies: python -m pip install -r scripts/data/vectors/requirements.txt') from exc
    valid=[];valid_ids=[]
    for f in features:
        g=shape(f['geometry'])
        if not g.is_valid:
            g=shapely.make_valid(g)
        if g.is_empty:
            continue
        if g.geom_type not in ('Polygon','MultiPolygon'):
            candidates=[p for p in getattr(g,'geoms',[]) if p.geom_type in ('Polygon','MultiPolygon')]
            if not candidates:
                continue
            g=shapely.union_all(candidates)
        valid.append(g);valid_ids.append(f['id'])
    coverage=shapely.union_all(valid,grid_size=1e-8)
    parts=[coverage] if coverage.geom_type=='Polygon' else list(coverage.geoms)
    tree=shapely.STRtree(valid)
    features_out=[];lineage={}
    for part in parts:
        if part.geom_type!='Polygon' or part.area<1e-12:
            continue
        part=orient(part.normalize(),sign=1.0)
        geometry=json.loads(json.dumps(mapping(part)))
        geometry['coordinates']=[clean_points(r,8) for r in geometry['coordinates']]
        raw=json.dumps(geometry,separators=(',',':')).encode()
        fid='gsi-footprint-'+hashlib.sha256(raw).hexdigest()[:20]
        original_ids=sorted(valid_ids[int(i)] for i in tree.query(part,predicate='intersects') if part.intersection(valid[int(i)]).area>1e-14)
        lineage[fid]=original_ids
        features_out.append({'type':'Feature','id':fid,'properties':{
            'source_layer':'building','kind':'building_footprint_component',
            'source_part_count':len(original_ids),'schematic_height_m':8,'height_is_schematic':True
        },'geometry':geometry})
    record={'method':'Source tile buffers clipped to their nominal cores; valid mapped footprint coverage unioned at 1e-8 degree precision. Adjacent touching footprints can form one component. No generated or expanded footprints.',
            'raw_polygon_parts':len(features),'footprint_components':len(features_out),'lineage':lineage}
    (SOURCE/'building-lineage.json.gz').write_bytes(gzip.compress(json.dumps(record,separators=(',',':')).encode(),mtime=0))
    print(f"Mapped footprints: {len(features)} tile-core parts -> {len(features_out)} non-overlapping components",flush=True)
    return features_out


def lines(geometry):
    if geometry['type']=='LineString':
        return [geometry['coordinates']]
    if geometry['type']=='MultiLineString':
        return geometry['coordinates']
    return []


def polygons(geometry):
    if geometry['type']=='Polygon':
        return [geometry['coordinates']]
    if geometry['type']=='MultiPolygon':
        return geometry['coordinates']
    return []


def flat_coords(geometry):
    return [p for line in lines(geometry) for p in line]+[p for poly in polygons(geometry) for ring in poly for p in ring]


def center_of(geometry):
    coords=flat_coords(geometry)
    return [(min(p[0] for p in coords)+max(p[0] for p in coords))/2,(min(p[1] for p in coords)+max(p[1] for p in coords))/2]


def local_distance(a,b):
    return math.hypot((a[0]-b[0])*90565,(a[1]-b[1])*111195)


def great_circle(a,b):
    lat1,lat2=map(math.radians,(a[1],b[1]))
    dlat=lat2-lat1;dlon=math.radians(b[0]-a[0])
    h=math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371008.8*2*math.atan2(math.sqrt(h),math.sqrt(max(0,1-h)))


def road_subset(features):
    result=[]
    for f in features:
        p=f['properties']
        code=p.get('ftCode',0)
        if not 2700<=code<2800:
            continue
        p['kind']='road_centerline'
        p['bridge']=code%10==3
        p['major']=p.get('rdCtg') in (0,1,3) or p.get('rnkWidth',0)>=2
        result.append(f)
    return result


def water_subset(data):
    import shapely
    from shapely.geometry import shape,mapping
    result=[]
    for layer in ('river','waterarea','lake'):
        for f in data.get(layer,[]):
            p=f['properties'];code=p.get('ftCode',0)
            p['kind']='water_area' if layer=='waterarea' else ('river_centerline' if 5300<=code<5330 else 'water_edge')
            if polygons(f['geometry']):
                g=shape(f['geometry'])
                if not g.is_valid:
                    # Concave shorelines can split when a tile core clips them.
                    # Preserve the actual polygon coverage, dropping zero-area
                    # connectors introduced by rectangular ring clipping.
                    g=shapely.make_valid(g)
                    if g.geom_type=='GeometryCollection':
                        g=shapely.union_all([part for part in g.geoms if part.geom_type in ('Polygon','MultiPolygon')])
                    g=shapely.set_precision(g,1e-8)
                    if g.is_empty or g.geom_type not in ('Polygon','MultiPolygon'):
                        continue
                    f['geometry']=json.loads(json.dumps(mapping(g)))
                    p['clipping_topology_repaired']=True
            result.append(f)
    return result


def create_route(roads):
    # Real GSI road vertices provide topology. No straight invented segment is
    # inserted between off-road waypoints; the selected endpoints are snapped
    # to existing vertices in one connected road component.
    graph=defaultdict(list);loc={}
    for f in roads:
        if f['properties'].get('motorway')==1 or f['properties']['ftCode']%10==4:
            continue
        for line in lines(f['geometry']):
            for a,b in zip(line,line[1:]):
                ka,kb=tuple(a),tuple(b)
                if ka==kb:
                    continue
                length=great_circle(a,b)
                graph[ka].append((kb,length,f['id']))
                graph[kb].append((ka,length,f['id']))
                loc[ka]=a;loc[kb]=b
    seen=set();components=[]
    for key in graph:
        if key in seen:
            continue
        component=[];stack=[key];seen.add(key)
        while stack:
            node=stack.pop();component.append(node)
            for nxt,_,_ in graph[node]:
                if nxt not in seen:
                    seen.add(nxt);stack.append(nxt)
        components.append(component)
    component=max(components,key=len)
    intended=[[138.8005,35.4781],ANCHOR,[138.8154,35.4972]]
    # The middle waypoint should be a through intersection, not the tip of a
    # driveway or a clipped source fragment that would force a visual U-turn.
    through=[p for p in component if len({n for n,_,_ in graph[p]})>=3]
    stops=[min(through if i==1 else component,key=lambda p:local_distance(p,target)) for i,target in enumerate(intended)]
    coordinates=[];lineage=[];used_edges=set()
    for start,end in zip(stops,stops[1:]):
        dist={start:0};previous={};queue=[(0,start)]
        while queue:
            length,node=heapq.heappop(queue)
            if length!=dist.get(node):
                continue
            if node==end:
                break
            for nxt,cost,fid in graph[node]:
                # A route is a continuous journey: do not immediately retrace
                # the approach to a waypoint. Every alternative remains a
                # measured road centerline edge from the source data.
                if frozenset((node,nxt)) in used_edges:
                    continue
                candidate=length+cost
                if candidate<dist.get(nxt,math.inf):
                    dist[nxt]=candidate;previous[nxt]=(node,fid);heapq.heappush(queue,(candidate,nxt))
        if end not in dist:
            raise RuntimeError('Selected route is disconnected')
        path=[end];ids=[];node=end
        while node!=start:
            node,fid=previous[node];path.append(node);ids.append(fid)
        path.reverse();ids.reverse()
        coordinates.extend(path if not coordinates else path[1:])
        lineage.extend(ids)
        used_edges.update(frozenset((a,b)) for a,b in zip(path,path[1:]))
    coordinates=[list(p) for p in coordinates]
    distance=sum(great_circle(a,b) for a,b in zip(coordinates,coordinates[1:]))
    record={
        'type':'Feature','id':'atlas-shimoyoshida-traverse',
        'properties':{
            'name':'Shimoyoshida traverse','kind':'authored_exhibition_route',
            'source':'GSI road centerlines','distance_m':round(distance,1),
            'measured_route':False,'road_aligned':True,
            'note':'Authored exhibit traversal following real GSI road geometry; not a recommended or verified pedestrian itinerary.'
        },'geometry':{'type':'LineString','coordinates':coordinates}
    }
    lineage_record={
        'route_id':record['id'], 'distance_m':round(distance,1),
        'method':'Shortest available centerline distance through 3 selected existing GSI road vertices, excluding already traversed edges; no synthesized off-road connectors.',
        'intended_waypoints':intended,'actual_road_vertices':[list(p) for p in stops],
        'waypoint_offset_m':[round(local_distance(a,b),3) for a,b in zip(intended,stops)],
        'graph_vertices':len(graph),'largest_connected_component_vertices':len(component),
        'segment_source_ids':lineage,
        'note':'One source ID for every output route segment. Feature IDs resolve into city-roads.geojson and encode the original tile and layer feature index.'
    }
    (SOURCE/'route-lineage.json').write_text(json.dumps(lineage_record,ensure_ascii=False,indent=2)+'\n')
    return feature_collection('Shimoyoshida authored route',[record],CITY,record['properties']['note'])


def building_lod(buildings,route,limit):
    """Retain true footprints near the route and throughout the real city.

    Half the budget follows the route corridor. Half is spread across a regular
    24 x 24 selection grid, choosing larger existing footprints first in each
    cell. The grid only selects data; it never creates building geometry.
    """
    if len(buildings)<=limit:
        return buildings
    line=route['features'][0]['geometry']['coordinates']
    coslat=math.cos(math.radians(35.49))
    projected_route=[[p[0]*coslat,p[1]] for p in line]
    records=[]
    grid=defaultdict(list)
    for f in buildings:
        center=center_of(f['geometry'])
        pt=[center[0]*coslat,center[1]]
        distance=math.sqrt(min(point_distance_sq(pt,a,b) for a,b in zip(projected_route,projected_route[1:])))
        area=sum(abs(signed_area(p[0]))-sum(abs(signed_area(h)) for h in p[1:]) for p in polygons(f['geometry']))
        record=(distance,-area,f['id'],f)
        records.append(record)
        gx=min(23,max(0,int((center[0]-CITY[0])/(CITY[2]-CITY[0])*24)))
        gy=min(23,max(0,int((center[1]-CITY[1])/(CITY[3]-CITY[1])*24)))
        grid[(gx,gy)].append(record)
    chosen={r[2]:r[3] for r in sorted(records)[:limit//2]}
    cells=[]
    for key in sorted(grid):
        cells.append(sorted(grid[key],key=lambda r:(r[1],r[0],r[2])))
    level=0
    while len(chosen)<limit:
        any_left=False
        for cell in cells:
            if level<len(cell):
                any_left=True
                r=cell[level];chosen[r[2]]=r[3]
                if len(chosen)==limit:
                    break
        if not any_left:
            break
        level+=1
    return sorted(chosen.values(),key=lambda f:(local_distance(center_of(f['geometry']),ANCHOR),f['id']))


def build_globe():
    import shapely
    from shapely.geometry import shape,mapping
    raw=json.loads((SOURCE/'natural-earth/ne_50m_land.geojson').read_text())
    features=[]
    for i,f in enumerate(raw['features']):
        polys=[]
        for poly in polygons(f['geometry']):
            rings=[clean_points(simplify_ring(r,0.02),6) for r in poly]
            polys.append(rings)
        if not polys:
            continue
        geom={'type':'Polygon','coordinates':polys[0]} if len(polys)==1 else {'type':'MultiPolygon','coordinates':polys}
        if not shape(geom).is_valid:
            # A handful of very thin Pacific atoll rings need a topology-aware
            # simplification to avoid an RDP chord crossing another shoreline.
            original=shape(f['geometry'])
            if not original.is_valid:
                original=shapely.make_valid(original)
            fixed=original.simplify(0.02,preserve_topology=True)
            if fixed.geom_type=='GeometryCollection':
                fixed=shapely.union_all([g for g in fixed.geoms if g.geom_type in ('Polygon','MultiPolygon')])
            geom=json.loads(json.dumps(mapping(fixed)))
        features.append({'type':'Feature','id':f'ne50m-land-{i}','properties':{'source':'Natural Earth','scale':'1:50m'},'geometry':geom})
    return save('globe-land.geojson',feature_collection('Natural Earth 50m land; simplified 0.02 degrees',features,[-180,-90,180,90],'Made with Natural Earth; public domain. Generalized land polygons for an orbital cartographic exhibit.'))


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--globe-only',action='store_true');args=parser.parse_args()
    reports=[]
    if (SOURCE/'sources.json').exists():
        print(f'Pinned source checksums verified: {verify_sources()}',flush=True)
    if args.globe_only:
        build_globe();return
    city=load_gsi(CITY,16);region=load_gsi(REGION,12)
    buildings=[]
    for f in city.get('building',[]):
        if not polygons(f['geometry']):
            continue
        # Rendered height is deliberately constant, never a claim of a survey
        # measurement. GSI supplies these plan footprints, not roof heights.
        f['properties'].update({'kind':'building_footprint_part','schematic_height_m':8,'height_is_schematic':True})
        buildings.append(f)
    raw_building_parts=len(buildings)
    buildings=merge_footprints(buildings)
    buildings.sort(key=lambda f:(local_distance(center_of(f['geometry']),ANCHOR),f['id']))
    roads=road_subset(city['road'])
    route=create_route(roads)
    description='Selected real GSI mapped footprint components, source tile buffers removed and adjacent parts unioned. Constant 8 m exhibition extrusion is schematic, not measured. All source parts are recoverable from bundled raw MVT.'
    reports.append(save('city-buildings.geojson',feature_collection('Fujiyoshida building footprint parts / desktop LOD',building_lod(buildings,route,6500),CITY,description)))
    reports.append(save('city-buildings-mobile.geojson',feature_collection('Fujiyoshida building footprint parts / mobile LOD',building_lod(buildings,route,2400),CITY,description)))
    reports.append(save('city-roads.geojson',feature_collection('Fujiyoshida road centerlines',roads,CITY)))
    reports.append(save('city-water.geojson',feature_collection('Fujiyoshida water',water_subset(city),CITY)))
    reports.append(save('region-roads.geojson',feature_collection('Fuji region road centerlines',road_subset(region['road']),REGION)))
    reports.append(save('region-water.geojson',feature_collection('Fuji region rivers and lakes',water_subset(region),REGION)))
    reports.append(save('route.geojson',route))
    reports.append(build_globe())
    metadata={
        'date':'2026-10-06','anchor':ANCHOR,'city_bounds':CITY,'region_bounds':REGION,
        'crs':'EPSG:4326','coordinate_order':'longitude,latitude',
        'render_projection':'Use spherical Web Mercator x=(lon+180)/360, y=(1-asinh(tan(lat*pi/180))/pi)/2, then normalize to the imagery bounds.',
        'sources':'GSI experimental_bvmap vector tiles z16 city, z12 region; Natural Earth 50m land',
        'heights':'Every building part carries height_is_schematic=true and schematic_height_m=8. No measured building elevation is asserted.',
        'buildings_source_tile_core_parts':raw_building_parts,
        'buildings_merged_components':len(buildings),
        'building_lod':'Desktop 6500 / mobile 2400 selected real footprint components. Half follow the route corridor; half are selected spatially, larger existing footprints first. This is a visualization subset, not a complete building census.',
        'route':'Authored traversal on real centerlines; see data-source/vectors/route-lineage.json for segment-by-segment lineage.',
        'files':reports
    }
    save('metadata.json',metadata)


if __name__=='__main__':
    main()
