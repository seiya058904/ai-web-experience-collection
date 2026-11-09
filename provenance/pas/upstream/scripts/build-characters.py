#!/usr/bin/env python3
"""Prepare PAS's bundled anatomical models from explicitly CC0 graphical data.

This script is original PAS code. It does not import MakeHuman program code.
The checked-in binary models are sufficient to build and run the website.
Regeneration requires Python 3, NumPy and Pillow; no Blender is required.
"""
from __future__ import annotations

import json
from pathlib import Path
import shutil
import struct
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/model-source'
MODELS = ROOT / 'public/assets/models'
TEXTURES = ROOT / 'public/assets/textures'


def read_obj(path: Path):
    vertices, uvs, faces, groups = [], [], [], []
    group = ''
    for line in path.read_text().splitlines():
        p = line.split()
        if not p:
            continue
        if p[0] == 'v':
            vertices.append([float(x) for x in p[1:4]])
        elif p[0] == 'vt':
            uvs.append([float(x) for x in p[1:3]])
        elif p[0] == 'g':
            group = ' '.join(p[1:])
        elif p[0] == 'f':
            face = []
            for v in p[1:]:
                ids = v.split('/')
                face.append((int(ids[0]) - 1, int(ids[1]) - 1 if len(ids) > 1 and ids[1] else 0))
            faces.append(face)
            groups.append(group)
    return np.array(vertices, dtype=np.float64), np.array(uvs, dtype=np.float64), faces, groups


def target_displacements(path: Path, count: int):
    result = np.zeros((count, 3), dtype=np.float64)
    for line in path.read_text().splitlines():
        p = line.split()
        if len(p) == 4 and p[0].isdigit():
            result[int(p[0])] = [float(x) for x in p[1:]]
    return result


def read_proxy(path: Path):
    references, hidden, scales, metadata = [], set(), {}, {}
    state = ''
    for line in path.read_text().splitlines():
        p = line.split()
        if not p:
            continue
        if p[0] == '#' and len(p) > 2 and p[1] in ('author', 'license'):
            metadata[p[1]] = ' '.join(p[2:])
        if p[0] in ('x_scale', 'y_scale', 'z_scale'):
            scales[p[0][0]] = (int(p[1]), int(p[2]), float(p[3]))
        elif p[0] == 'obj_file':
            metadata['obj_file'] = p[1]
        elif p[0] == 'verts':
            state = 'vertices'
        elif p[0] == 'delete_verts':
            state = 'hidden'
        elif p[0].isdigit() or (p[0].startswith('-') and p[0][1:].isdigit()):
            if state == 'vertices':
                if len(p) == 1:
                    references.append(([int(p[0])], [1.0], [0.0, 0.0, 0.0]))
                elif len(p) >= 9:
                    references.append(([int(x) for x in p[:3]], [float(x) for x in p[3:6]], [float(x) for x in p[6:9]]))
            elif state == 'hidden':
                i = 0
                while i < len(p):
                    if i + 2 < len(p) and p[i + 1] == '-':
                        hidden.update(range(int(p[i]), int(p[i + 2]) + 1))
                        i += 3
                    else:
                        hidden.add(int(p[i]))
                        i += 1
    return references, hidden, scales, metadata


def fit_proxy(proxy_path, rest, morphed, all_weights, floor, scale):
    refs, hidden, scales, metadata = read_proxy(proxy_path)
    obj_path = proxy_path.parent / metadata['obj_file']
    original, uv, faces, groups = read_obj(obj_path)
    if len(original) != len(refs):
        raise ValueError(f'{proxy_path.name}: {len(original)} positions / {len(refs)} fit references')
    offset_scale = np.ones(3)
    for i, axis in enumerate('xyz'):
        if axis in scales:
            a, b, denominator = scales[axis]
            offset_scale[i] = abs(morphed[a, i] - morphed[b, i]) / abs(denominator)
    coords, weights = [], []
    for ids, influence, offset in refs:
        f = np.array(influence)
        coords.append(np.sum(morphed[ids] * f[:, None], axis=0) + np.array(offset) * offset_scale)
        weight = np.sum(all_weights[ids] * f[:, None], axis=0)
        weights.append(np.maximum(weight, 0.0))
    coords = np.array(coords)
    coords[:, 1] -= floor
    coords *= scale
    weights = np.array(weights)
    return coords, uv, faces, weights, hidden, metadata


def normals_of(vertices, faces):
    result = np.zeros_like(vertices)
    for face in faces:
        ids = [x[0] for x in face]
        a = vertices[ids[1]] - vertices[ids[0]]
        b = vertices[ids[2]] - vertices[ids[0]]
        n = np.cross(a, b)
        length = np.linalg.norm(n)
        if length > 1e-12:
            n /= length
        for idx in ids:
            result[idx] += n
    lengths = np.linalg.norm(result, axis=1)
    result /= np.maximum(lengths[:, None], 1e-12)
    return result


def subdivide(vertices, uvs, faces, weights):
    """One smooth Catmull–Clark step with matching corner UVs and skin weights."""
    # Only include referenced vertices. Isolated unused MakeHuman helpers are not
    # part of the body mesh and should not inflate exported resources.
    used = sorted({v for f in faces for v, _ in f})
    remap = {old: new for new, old in enumerate(used)}
    v = vertices[used]
    w = weights[used]
    fids = [[remap[i] for i, _ in f] for f in faces]
    edges = {}
    vfaces = [[] for _ in used]
    vedges = [[] for _ in used]
    fpoints = np.array([v[f].mean(axis=0) for f in fids])
    fw = np.array([w[f].mean(axis=0) for f in fids])
    for fi, face in enumerate(fids):
        for vi in face:
            vfaces[vi].append(fi)
        for i, a in enumerate(face):
            b = face[(i + 1) % len(face)]
            key = tuple(sorted((a, b)))
            if key not in edges:
                edges[key] = []
                vedges[a].append(key)
                vedges[b].append(key)
            edges[key].append(fi)
    points, point_weights = [], []
    for i in range(len(v)):
        boundary = [e for e in vedges[i] if len(edges[e]) == 1]
        if boundary:
            neighbours = [e[0] if e[1] == i else e[1] for e in boundary]
            points.append(v[i] * .75 + v[neighbours].mean(axis=0) * .25)
            point_weights.append(w[i] * .75 + w[neighbours].mean(axis=0) * .25)
        else:
            n = len(vfaces[i])
            F = fpoints[vfaces[i]].mean(axis=0)
            R = np.array([(v[a] + v[b]) / 2 for a, b in vedges[i]]).mean(axis=0)
            Fw = fw[vfaces[i]].mean(axis=0)
            Rw = np.array([(w[a] + w[b]) / 2 for a, b in vedges[i]]).mean(axis=0)
            points.append((F + 2 * R + (n - 3) * v[i]) / n)
            point_weights.append((Fw + 2 * Rw + (n - 3) * w[i]) / n)
    edge_index = {}
    for (a, b), fs in edges.items():
        edge_index[(a, b)] = len(points)
        if len(fs) == 2:
            points.append((v[a] + v[b] + fpoints[fs[0]] + fpoints[fs[1]]) / 4)
            point_weights.append((w[a] + w[b] + fw[fs[0]] + fw[fs[1]]) / 4)
        else:
            points.append((v[a] + v[b]) / 2)
            point_weights.append((w[a] + w[b]) / 2)
    face_start = len(points)
    points.extend(fpoints)
    point_weights.extend(fw)
    output_faces, output_uvs = [], []
    for fi, face in enumerate(fids):
        fuv = np.array([uvs[uv] for _, uv in faces[fi]])
        middle = fuv.mean(axis=0)
        for j, a in enumerate(face):
            b, c = face[(j + 1) % len(face)], face[(j - 1) % len(face)]
            quad = [a, edge_index[tuple(sorted((a, b)))], face_start + fi, edge_index[tuple(sorted((a, c)))]]
            coords = [fuv[j], (fuv[j] + fuv[(j + 1) % len(face)]) / 2, middle, (fuv[j] + fuv[(j - 1) % len(face)]) / 2]
            uvstart = len(output_uvs)
            output_uvs.extend(coords)
            output_faces.append([(idx, uvstart + k) for k, idx in enumerate(quad)])
    return np.array(points), np.array(output_uvs), output_faces, np.array(point_weights)


def pack_geometry(vertices, uvs, faces, weights, blob):
    normals = normals_of(vertices, faces)
    strongest = np.argsort(weights, axis=1)[:, -4:][:, ::-1]
    influences = np.take_along_axis(weights, strongest, axis=1)
    sums = influences.sum(axis=1)
    influences /= np.maximum(sums[:, None], 1e-12)
    vertex_map = {}
    position, normal, uv, si, sw, index = [], [], [], [], [], []
    for face in faces:
        ids = []
        for v, t in face:
            # Duplicate positions only at actual UV seams, not at every corner.
            tex = tuple(np.round(uvs[t], 7))
            key = (v, *tex)
            if key not in vertex_map:
                vertex_map[key] = len(position)
                position.append(vertices[v])
                normal.append(normals[v])
                uv.append(uvs[t])
                si.append(strongest[v])
                sw.append(influences[v])
            ids.append(vertex_map[key])
        for i in range(1, len(ids) - 1):
            index.extend([ids[0], ids[i], ids[i + 1]])
    arrays = {'position': (position, '<f4', 3), 'normal': (normal, '<f4', 3), 'uv': (uv, '<f4', 2), 'skinIndex': (si, '<u2', 4), 'skinWeight': (sw, '<f4', 4), 'index': (index, '<u4' if len(position) > 65535 else '<u2', 1)}
    specs = {}
    for name, (values, dtype, item_size) in arrays.items():
        while len(blob) % 4:
            blob.append(0)
        array = np.asarray(values, dtype=dtype).reshape(-1)
        specs[name] = {'offset': len(blob), 'length': len(array), 'type': dtype, 'itemSize': item_size}
        blob.extend(array.tobytes())
    specs['vertexCount'] = len(position)
    specs['triangleCount'] = len(index) // 3
    return specs


def webp(source, dest, *, lossless=False):
    image = Image.open(source)
    if dest.name == 'cotton.webp':
        # The source map is a grey garment colour. Retain its fabric variation
        # as near-white albedo so the explicit rust/sand material palettes read.
        image = Image.fromarray(np.clip(204 + np.asarray(image.convert('RGB'), dtype=np.float32) * .2, 0, 255).astype(np.uint8))
    if dest.name == 'cotton-bump.webp':
        image = image.convert('RGB')
    temporary = dest.with_name(dest.stem + '.tmp.webp')
    image.save(temporary, format='WEBP', quality=88, method=6, lossless=lossless)
    if temporary.stat().st_size < 64:
        raise ValueError(f'Texture encoder produced an empty file: {dest.name}')
    temporary.replace(dest)


def main():
    MODELS.mkdir(parents=True, exist_ok=True)
    TEXTURES.mkdir(parents=True, exist_ok=True)
    base, body_uv, base_faces, groups = read_obj(SOURCE / 'base.obj')
    body_faces = [f for f, group in zip(base_faces, groups) if group == 'body']
    rig = json.loads((SOURCE / 'default.mhskel').read_text())
    weights = json.loads((SOURCE / 'default_weights.mhw').read_text())['weights']
    bone_names = list(rig['bones'])
    bone_index = {name: i for i, name in enumerate(bone_names)}
    weight_array = np.zeros((len(base), len(bone_names)))
    for name, entries in weights.items():
        for vertex, influence in entries:
            weight_array[vertex, bone_index[name]] += influence
    empty = weight_array.sum(axis=1) < 1e-12
    weight_array[empty, bone_index['root']] = 1
    metrics = json.loads((SOURCE / 'character-metrics.json').read_text())
    proxies = {
        'shirt': SOURCE / 'clothes/toigo_basic_tucked_t-shirt/toigo_basic_tucked_t-shirt.mhclo',
        'pants': SOURCE / 'clothes/toigo_harem_pants/toigo_harem_pants.mhclo',
        'cenHair': SOURCE / 'hair/ponytail01/ponytail01.mhclo',
        'chengHair': SOURCE / 'hair/afro01/afro01.mhclo',
    }
    textures = [
        ('skins/young_asian_female/young_lightskinned_female_diffuse3.png', 'cen-skin.webp', False),
        ('skins/young_asian_male/young_lightskinned_male_diffuse3.png', 'cheng-skin.webp', False),
        ('clothes/toigo_basic_tucked_t-shirt/T-shirt_basic.png', 'cotton.webp', False),
        ('clothes/toigo_basic_tucked_t-shirt/T-shirt_basic-bump.png', 'cotton-bump.webp', False),
        ('hair/ponytail01/ponytail01_diffuse.png', 'cen-hair.webp', False),
        ('hair/afro01/afro_diffuse.png', 'cheng-hair.webp', False),
    ]
    for source, dest, lossless in textures:
        webp(SOURCE / source, TEXTURES / dest, lossless=lossless)
    for character, spec in metrics.items():
        morphed = base.copy()
        for target, influence in spec['morphs'].items():
            morphed += target_displacements(SOURCE / f'{target}.target', len(base)) * influence
        floor, scale = spec['sourceGround'], spec['sourceScale']
        normalized = morphed.copy()
        normalized[:, 1] -= floor
        normalized *= scale
        bones = []
        for name, b in rig['bones'].items():
            h = normalized[rig['joints'][b['head']]].mean(axis=0)
            t = normalized[rig['joints'][b['tail']]].mean(axis=0)
            bones.append({'name': name, 'head': np.round(h, 8).tolist(), 'tail': np.round(t, 8).tolist(), 'parent': b['parent']})
        output = {'version': 1, 'id': character, 'metrics': spec, 'bones': bones, 'binary': f'{character}.bin', 'meshes': []}
        blob = bytearray()
        garment_data = {}
        hidden = set()
        for kind in ('shirt', 'pants'):
            garment_data[kind] = fit_proxy(proxies[kind], base, morphed, weight_array, floor, scale)
            hidden.update(garment_data[kind][4])
        # The shirt asset has no delete_verts mask. Hide only covered torso and
        # proximal upper-arm skin, keeping the neckline and full forearms/hands.
        # This also avoids cloth/body intersections when the shoulders rotate.
        neck_y = spec['joints']['neck'][1]
        shoulder_x = spec['joints']['leftShoulder'][0]
        torso = (normalized[:, 1] < neck_y - .036) & (np.abs(normalized[:, 0]) < shoulder_x + .018)
        torso &= normalized[:, 1] > spec['joints']['pelvis'][1] - .025
        shoulder_cap = (normalized[:, 1] < neck_y + .004) & (np.abs(normalized[:, 0]) > .066)
        shoulder_cap &= np.abs(normalized[:, 0]) < shoulder_x + .016
        shoulder_cap &= normalized[:, 1] > spec['joints']['chest'][1] - .055
        covered = torso | shoulder_cap
        for side in ('left', 'right'):
            shoulder = np.array(spec['joints'][side + 'Shoulder'])
            elbow = np.array(spec['joints'][side + 'Elbow'])
            axis = elbow - shoulder
            fraction = ((normalized - shoulder) @ axis) / np.dot(axis, axis)
            radial = np.linalg.norm(normalized - shoulder - fraction[:, None] * axis, axis=1)
            covered |= (fraction > -.10) & (fraction < .49) & (radial < .092)
        hidden.update(np.nonzero(covered)[0].tolist())
        # The source pants are longer than the final hems. Restore every ankle
        # vertex so the exposed ankle and bare foot remain a continuous surface.
        hidden.difference_update(np.nonzero(normalized[:, 1] < .17)[0].tolist())
        # The intact source is retained for regeneration; covered body surfaces
        # are omitted from the runtime mesh to prevent cloth poke-through.
        visible_body = [f for f in body_faces if not all(v in hidden for v, _ in f)]
        v, uv, f, w = subdivide(normalized, body_uv, visible_body, weight_array)
        output['meshes'].append({'name': 'body', 'attributes': pack_geometry(v, uv, f, w, blob)})
        for kind in ('shirt', 'pants'):
            v, uv, f, w, _, metadata = garment_data[kind]
            if kind == 'shirt':
                # Let the plain tee overlap the waistband during upper-body
                # counter-rotation; the fitted source was originally tucked in.
                hem = v[:, 1].min()
                lengthen = np.clip((hem + .13 - v[:, 1]) / .13, 0, 1)
                v[:, 1] -= .045 * lengthen
                v[:, 0] *= 1 + .035 * lengthen
                v[:, 2] += np.sign(v[:, 2] - .025) * .006 * lengthen
            if kind == 'pants':
                # A restrained training-trouser silhouette: retain the cloth
                # folds and fitted waist, with a gently tapered lower leg.
                for side in (-1, 1):
                    mask = v[:, 0] * side > 0
                    ankle_x = spec['joints']['leftAnkle' if side > 0 else 'rightAnkle'][0]
                    blend = np.clip((.44 - v[:, 1]) / .3, 0, 1)
                    v[mask, 0] = ankle_x + (v[mask, 0] - ankle_x) * (1 - .22 * blend[mask])
                # Keep hems just above the ankle, exposing every supporting toe.
                min_y = v[:, 1].min()
                low = np.clip((.24 - v[:, 1]) / .16, 0, 1)
                v[:, 1] += low * max(0, spec['ankleHeight'] + .015 - min_y)
            v, uv, f, w = subdivide(v, uv, f, w)
            output['meshes'].append({'name': kind, 'source': metadata, 'attributes': pack_geometry(v, uv, f, w, blob)})
        hair = fit_proxy(proxies[character + 'Hair'], base, morphed, weight_array, floor, scale)
        v, uv, f, _, _, metadata = hair
        head = np.array(spec['joints']['head'])
        if character == 'cen':
            # Keep the fitted scalp of the CC0 ponytail and replace its long tail
            # with an original low bun in the renderer, matching the concept.
            f = [face for face in f if np.mean([v[i, 1] for i, _ in face]) > head[1] - .078]
            # Compress the source tail's posterior cards into the fitted nape;
            # the only projecting hair mass is the original small low bun.
            v[:, 2] = np.maximum(v[:, 2], head[2] - .123)
        else:
            # The source afro is shortened into a close, soft curl silhouette.
            sy = (spec['height'] + .04 - head[1]) / (v[:, 1].max() - head[1])
            v[:, 1] = head[1] + (v[:, 1] - head[1]) * min(1, sy)
            v[:, 0] *= .94
        hw = np.zeros((len(v), len(bone_names)))
        hw[:, bone_index['head']] = 1
        output['meshes'].append({'name': 'hair', 'source': metadata, 'attributes': pack_geometry(v, uv, f, hw, blob)})
        (MODELS / f'{character}.bin').write_bytes(blob)
        (MODELS / f'{character}.json').write_text(json.dumps(output, separators=(',', ':')))
        counts = {m['name']: (m['attributes']['vertexCount'], m['attributes']['triangleCount']) for m in output['meshes']}
        print(character, len(blob), 'bytes', counts, flush=True)


if __name__ == '__main__':
    main()
