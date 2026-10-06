"""Small, dependency-free reader for the public Mapbox Vector Tile 2.x format.

Only protobuf wire primitives and geometry types used by the GSI tiles are
implemented. This is a format decoder, not a general GIS engine.
Reference: https://github.com/mapbox/vector-tile-spec/tree/master/2.1
"""
import math
import struct


def varint(data, pos=0):
    value = shift = 0
    while True:
        b = data[pos]
        pos += 1
        value |= (b & 127) << shift
        if not b & 128:
            return value, pos
        shift += 7
        if shift > 70:
            raise ValueError("Malformed protobuf varint")


def fields(data):
    pos = 0
    while pos < len(data):
        key, pos = varint(data, pos)
        number, wire = key >> 3, key & 7
        if wire == 0:
            value, pos = varint(data, pos)
        elif wire == 1:
            value, pos = data[pos:pos+8], pos+8
        elif wire == 2:
            size, pos = varint(data, pos)
            value, pos = data[pos:pos+size], pos+size
        elif wire == 5:
            value, pos = data[pos:pos+4], pos+4
        else:
            raise ValueError(f"Unsupported protobuf wire type {wire}")
        yield number, wire, value


def packed(data):
    result, pos = [], 0
    while pos < len(data):
        value, pos = varint(data, pos)
        result.append(value)
    return result


def zigzag(value):
    return (value >> 1) ^ -(value & 1)


def read_value(data):
    for n, wire, value in fields(data):
        if n == 1:
            return value.decode("utf-8")
        if n == 2:
            return struct.unpack("<f", value)[0]
        if n == 3:
            return struct.unpack("<d", value)[0]
        if n in (4, 5):
            return value
        if n == 6:
            return zigzag(value)
        if n == 7:
            return bool(value)
    return None


def read_geometry(data):
    commands = packed(data)
    pos = x = y = 0
    paths = []
    while pos < len(commands):
        command = commands[pos]
        pos += 1
        kind, count = command & 7, command >> 3
        if kind in (1, 2):
            for _ in range(count):
                x += zigzag(commands[pos])
                y += zigzag(commands[pos+1])
                pos += 2
                if kind == 1:
                    paths.append([])
                paths[-1].append([x, y])
        elif kind == 7:
            for _ in range(count):
                if paths[-1] and paths[-1][0] != paths[-1][-1]:
                    paths[-1].append(paths[-1][0][:])
        else:
            raise ValueError(f"Unsupported MVT command {kind}")
    return paths


def signed_area(ring):
    return sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(ring, ring[1:])) / 2


def lonlat(point, z, tx, ty, extent):
    x, y = point
    n = 2**z
    lon = (tx+x/extent)/n*360-180
    lat = math.degrees(math.atan(math.sinh(math.pi*(1-2*(ty+y/extent)/n))))
    return [round(lon, 8), round(lat, 8)]


def decode(data, z, tx, ty, selected=None):
    result = {}
    for n, wire, layer_bytes in fields(data):
        if n != 3:
            continue
        name, extent, keys, values, features = None, 4096, [], [], []
        for field, wire, value in fields(layer_bytes):
            if field == 1:
                name = value.decode("utf-8")
            elif field == 2:
                features.append(value)
            elif field == 3:
                keys.append(value.decode("utf-8"))
            elif field == 4:
                values.append(read_value(value))
            elif field == 5:
                extent = value
        if selected is not None and name not in selected:
            continue
        decoded = []
        for feature_bytes in features:
            fid, tags, ftype, geometry = None, [], None, None
            for field, wire, value in fields(feature_bytes):
                if field == 1:
                    fid = value
                elif field == 2:
                    tags = packed(value)
                elif field == 3:
                    ftype = value
                elif field == 4:
                    geometry = read_geometry(value)
            props = {keys[tags[i]]:values[tags[i+1]] for i in range(0, len(tags), 2)}
            conv = lambda path:[lonlat(p,z,tx,ty,extent) for p in path]
            if ftype == 1:
                points = [p for path in geometry for p in conv(path)]
                geom = {"type":"Point","coordinates":points[0]} if len(points)==1 else {"type":"MultiPoint","coordinates":points}
            elif ftype == 2:
                paths = [conv(p) for p in geometry if len(p)>1]
                if not paths:
                    continue
                geom = {"type":"LineString","coordinates":paths[0]} if len(paths)==1 else {"type":"MultiLineString","coordinates":paths}
            elif ftype == 3:
                polygons = []
                for ring in geometry:
                    if len(ring)<4 or signed_area(ring)==0:
                        continue
                    # In the MVT screen coordinate system exterior rings are
                    # clockwise (positive). GeoJSON rings use the opposite Y.
                    if signed_area(ring)>0 or not polygons:
                        polygons.append([list(reversed(conv(ring)))])
                    else:
                        polygons[-1].append(list(reversed(conv(ring))))
                if not polygons:
                    continue
                geom = {"type":"Polygon","coordinates":polygons[0]} if len(polygons)==1 else {"type":"MultiPolygon","coordinates":polygons}
            else:
                continue
            feature={"type":"Feature","properties":props,"geometry":geom}
            if fid is not None:
                feature["id"]=fid
            decoded.append(feature)
        result[name]=decoded
    return result
