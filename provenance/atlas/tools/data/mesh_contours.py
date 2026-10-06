"""Exact height contours of ATLAS's piecewise-linear terrain triangle mesh.

Each grid cell has a=northwest, b=northeast, c=southwest, d=southeast;
the rendered triangles are [a,c,b] and [b,c,d]. No contour segment is
simplified across a triangle boundary. Shared edge/vertex identifiers make
the output a connected graph without coordinate-distance stitching.
"""
from __future__ import annotations
import numpy as np


def sample_triangle_mesh(grid, uv):
    """Independent barycentric sampler used to verify exported contour geometry."""
    size = grid.shape[0]
    xy = np.clip(np.asarray(uv, dtype=np.float64), 0, 1) * (size - 1)
    ij = np.minimum(np.floor(xy).astype(np.int64), size - 2)
    tx, ty = (xy - ij).T
    i, j = ij.T
    a = grid[j, i].astype(np.float64)
    b = grid[j, i+1].astype(np.float64)
    c = grid[j+1, i].astype(np.float64)
    d = grid[j+1, i+1].astype(np.float64)
    return np.where(tx + ty <= 1,
                    a * (1-tx-ty) + b * tx + c * ty,
                    d * (tx+ty-1) + b * (1-ty) + c * (1-tx))


def connect_segments(segments, positions):
    """Trace degree-two chains, retaining junctions as genuine branch endpoints."""
    adjacency = {}
    for index, (a, b) in enumerate(segments):
        adjacency.setdefault(int(a), []).append((int(b), index))
        adjacency.setdefault(int(b), []).append((int(a), index))
    visited = np.zeros(len(segments), dtype=bool)
    result = []

    def trace(start, first_edge):
        chain = [start]
        current, edge = start, first_edge
        while not visited[edge]:
            visited[edge] = True
            a, b = segments[edge]
            following = int(b if a == current else a)
            chain.append(following)
            if following == start or len(adjacency[following]) != 2:
                break
            candidates = adjacency[following]
            next_edge = candidates[0][1] if candidates[0][1] != edge else candidates[1][1]
            current, edge = following, next_edge
        if len(chain) >= 2:
            result.append([positions[node] for node in chain])

    # Open lines and saddle/plateau junctions first, then closed ordinary loops.
    for node in sorted(adjacency):
        if len(adjacency[node]) != 2:
            for _, edge in adjacency[node]:
                if not visited[edge]:
                    trace(node, edge)
    for edge, (start, _) in enumerate(segments):
        if not visited[edge]:
            trace(int(start), edge)
    if not np.all(visited):
        raise ValueError('A terrain contour segment was not traced')
    return result, sum(len(neighbors) > 2 for neighbors in adjacency.values())


def verify_lines(grid, lines, tolerance_metres=0.001):
    """Check vertices and quarter/mid/three-quarter segment samples against mesh."""
    maximum_error = 0.0
    checked = 0
    for line in lines:
        points = np.asarray(line['points'], dtype=np.float64)
        if len(points) < 2 or not np.all(np.isfinite(points)):
            raise ValueError('Invalid terrain contour polyline')
        if np.any(points < 0) or np.any(points > 1):
            raise ValueError('Terrain contour outside normalized bounds')
        samples = np.concatenate([
            points,
            points[:-1] * 0.75 + points[1:] * 0.25,
            (points[:-1] + points[1:]) * 0.5,
            points[:-1] * 0.25 + points[1:] * 0.75,
        ])
        errors = np.abs(sample_triangle_mesh(grid, samples) - line['elevation'])
        maximum_error = max(maximum_error, float(errors.max()))
        checked += len(samples)
    if maximum_error > tolerance_metres:
        raise ValueError(f'Contours depart from matching triangle mesh by {maximum_error:.6f} m')
    return {'sampleCount': checked, 'maximumAbsoluteHeightErrorM': maximum_error,
            'toleranceM': tolerance_metres,
            'method': 'Independent barycentric mesh sampling at every exported vertex and each segment quarter, midpoint and three-quarter position'}


def mesh_contours(grid, interval=100, major_interval=500):
    grid = np.asarray(grid)
    if grid.ndim != 2 or grid.shape[0] != grid.shape[1] or grid.shape[0] < 2:
        raise ValueError('Terrain contour source must be a square regular node grid')
    if not np.all(np.isfinite(grid)):
        raise ValueError('Terrain contour source contains nonfinite heights')
    size = grid.shape[0]
    count = size * size
    values = grid.astype(np.float64).ravel()
    row, column = np.mgrid[:size-1, :size-1]
    a = row * size + column
    b, c = a + 1, a + size
    d = c + 1
    triangles = np.stack([a, c, b, b, c, d], axis=-1).reshape(-1, 3)
    heights = values[triangles]
    minima, maxima = heights.min(axis=1), heights.max(axis=1)
    low = int(np.ceil(values.min() / interval)) * interval
    high = int(np.floor(values.max() / interval)) * interval
    lines = []
    segments_total, junctions_total = 0, 0
    for elevation in range(low, high+1, interval):
        selected = (minima < elevation) & (maxima >= elevation)
        faces = triangles[selected]
        if not len(faces):
            continue
        face_heights = heights[selected]
        above = face_heights >= elevation
        crossing = above != np.roll(above, -1, axis=1)
        face_index, edge_index = np.nonzero(crossing)
        if not np.all(crossing.sum(axis=1) == 2):
            raise ValueError('A nondegenerate triangle should have two contour crossings')
        start = faces[face_index, edge_index]
        end = faces[face_index, (edge_index+1) % 3]
        # Canonical undirected grid edge makes both adjacent triangles use
        # identical interpolation, including floating-point arithmetic order.
        edge_a, edge_b = np.minimum(start, end), np.maximum(start, end)
        ha, hb = values[edge_a], values[edge_b]
        fraction = (elevation-ha) / (hb-ha)
        keys = edge_a.astype(np.int64)*count + edge_b
        keys = np.where(ha == elevation, -edge_a-1,
                        np.where(hb == elevation, -edge_b-1, keys))
        u = ((edge_a % size) + ((edge_b % size)-(edge_a % size))*fraction) / (size-1)
        v = ((edge_a // size) + ((edge_b // size)-(edge_a // size))*fraction) / (size-1)
        unique, indices = np.unique(keys, return_index=True)
        positions = {int(key): [round(float(u[index]), 9), round(float(v[index]), 9)]
                     for key, index in zip(unique, indices)}
        segments = np.sort(keys.reshape(-1, 2), axis=1)
        segments = segments[segments[:, 0] != segments[:, 1]]
        segments = np.unique(segments, axis=0)
        chains, junctions = connect_segments(segments, positions)
        segments_total += len(segments)
        junctions_total += junctions
        for points in chains:
            lines.append({'elevation': elevation, 'major': elevation % major_interval == 0,
                          'points': points})
    verification = verify_lines(grid, lines)
    return {
        'intervalMetres': interval, 'majorIntervalMetres': major_interval,
        'coordinateSystem': 'normalized EPSG:3857 uv; u west-to-east, v north-to-south',
        'sourceGridSize': size,
        'source': f'GSI DEM10B, regional elevation-{size}.bin',
        'triangleConvention': 'a=northwest, b=northeast, c=southwest, d=southeast; faces [a,c,b] and [b,c,d]',
        'processing': 'Piecewise-linear triangle/height-plane intersections; stitch by shared mesh edge or exact-level vertex identifiers; remove duplicate and zero-length segments only; retain every triangle bend; normalized coordinates rounded to 9 decimals.',
        'degenerateLevelRule': 'Superlevel boundary uses height >= contour level. Flat triangles at the level are omitted; shared level edges are emitted once; degree >2 junctions split connected polylines without an invented join.',
        'segmentCount': segments_total, 'junctionCount': junctions_total,
        'polylineCount': len(lines), 'pointCount': sum(len(line['points']) for line in lines),
        'verification': verification,
        'lines': lines,
    }
