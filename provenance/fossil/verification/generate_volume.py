#!/usr/bin/env python3
"""Build FOSSIL's illustrative, deterministic volume and all derivatives.

This is an authored density field, not a CT examination, real specimen, measured
scale, or taxonomic reconstruction. Requires Python 3, NumPy, SciPy and Pillow.

    python scripts/generate_volume.py
    python scripts/generate_volume.py --verify

No network access or third-party specimen assets are used. The 72 PNG sections,
browser data script and reconstruction mesh are derived from the SAME uint8
array. The mesh is an isosurface, not a second artist-authored shell.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates, binary_fill_holes


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MODELS = ROOT / "models"
NX, NY, NZ = 192, 192, 72
SEED = 20261007
XY_EXTENT = 1.20
Z_EXTENT = 0.34
ISO = 112.0
PARAMS = {
    "seed": SEED,
    "turns": 3.30,
    "initial_spiral_radius": 0.049,
    "final_spiral_radius": 0.78,
    "radial_halfwidth_ratio": 0.402,
    "axial_halfwidth_ratio": 0.90,
    "rib_frequency_per_turn": 50,
    "septa_mean_angular_interval": 0.245,
    "terminal_unseptated_angle": 0.48,
    "isosurface_density": ISO,
    "mesh_grid_stride": 1,
    "units": "unitless authored model coordinates; not a measured scale",
}
PATCHES = [
    {"name": "upper outer whorl loss", "theta_before_terminal": 1.38,
     "angular_halfwidth": 0.145, "radial_fraction_min": -0.56,
     "z_min": 0.035, "meaning": "authored missing material, not inferred anatomy"},
    {"name": "lower rim loss", "theta_before_terminal": 3.79,
     "angular_halfwidth": 0.105, "radial_fraction_min": 0.24,
     "z_min": -0.045, "meaning": "authored missing material, not inferred anatomy"},
]


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def b64(array: np.ndarray) -> str:
    return base64.b64encode(array.tobytes(order="C")).decode("ascii")


def make_field() -> np.ndarray:
    rng = np.random.default_rng(SEED)
    xs = np.linspace(-XY_EXTENT, XY_EXTENT, NX, dtype=np.float32)
    ys = np.linspace(-XY_EXTENT, XY_EXTENT, NY, dtype=np.float32)
    zs = np.linspace(-Z_EXTENT, Z_EXTENT, NZ, dtype=np.float32)
    xx, yy = np.meshgrid(xs, ys)
    radius = np.hypot(xx, yy)
    # Array rows run downward; physical/model y runs upward.
    azimuth = np.arctan2(-yy, xx)
    theta_max = PARAMS["turns"] * math.tau
    growth = math.log(PARAMS["final_spiral_radius"] / PARAMS["initial_spiral_radius"]) / theta_max
    orientation = -0.59 - theta_max
    angle = np.mod(azimuth - orientation, math.tau)
    pitch = 2 * XY_EXTENT / (NX - 1)
    # Correlated density variation describes mineral infill and small pores.
    # Each noise field is seeded once in 3D, so sections are spatially coherent.
    noise = rng.standard_normal((NZ, NY, NX), dtype=np.float32)
    fine = gaussian_filter(noise, sigma=0.58)
    fine /= max(float(fine.std()), 1e-8)
    pore = gaussian_filter(noise, sigma=(1.65, 2.1, 2.1))
    pore /= max(float(pore.std()), 1e-8)
    mineral = gaussian_filter(noise, sigma=(3.8, 4.6, 4.6))
    mineral /= max(float(mineral.std()), 1e-8)
    field = np.zeros((NZ, NY, NX), dtype=np.float32)
    z3 = zs[:, None, None]

    for turn in range(math.ceil(PARAMS["turns"])):
        theta = angle + turn * math.tau
        valid_angle = theta <= theta_max
        center_r = PARAMS["initial_spiral_radius"] * np.exp(growth * theta)
        width = PARAMS["radial_halfwidth_ratio"] * center_r
        height = PARAMS["axial_halfwidth_ratio"] * width + 0.006
        rib_phase = PARAMS["rib_frequency_per_turn"] * theta + 0.67 * np.sin(theta * 2.3)
        rib = np.maximum(0.0, 0.5 + 0.5 * np.cos(rib_phase)) ** 4.0
        # Ribs modulate the external tube envelope. They are not septa.
        radial_width = width * (1.0 + 0.10 * rib)
        axial_height = height * (1.0 + 0.105 * rib)
        q2 = (radius - center_r) / radial_width
        q = q2[None, :, :]
        axial = z3 / axial_height[None, :, :]
        envelope = np.sqrt(q * q + axial * axial)
        weather = (0.006 * np.sin(xx * 39.0 + yy * 18.0)
                   + 0.005 * np.cos(xx * 23.0 - yy * 36.0))
        envelope += weather[None, :, :] + 0.005 * fine
        valid = valid_angle[None, :, :] & (envelope <= 1.045)
        soft_boundary = np.clip((1.035 - envelope) / 0.062, 0.0, 1.0)
        # Minimum wall width survives the finite voxel pitch at the inner coil.
        wall_fraction = np.clip((pitch * 1.75) / np.maximum(width, pitch), 0.15, 0.57)
        shell = envelope >= (1.0 - wall_fraction[None, :, :])
        # A separate slowly varying chamber phase creates uneven bowed septa.
        chamber_phase = (theta / PARAMS["septa_mean_angular_interval"]
                         + 0.13 * np.sin(theta * 2.08)
                         + 0.07 * np.sin(theta * 5.2))[None, :, :]
        chamber_phase = chamber_phase + 0.23 * q * q + 0.11 * axial * axial
        chamber_phase += 0.055 * np.sin(q * 12.0 + theta[None, :, :] * 3.1)
        chamber_phase += 0.028 * np.sin(q * 28.0 - axial * 9.0)
        chamber_fraction = np.mod(chamber_phase, 1.0)
        septum_distance = np.minimum(chamber_fraction, 1.0 - chamber_fraction)
        septum_width = (0.068 + 0.012 / np.maximum(center_r, 0.08))[None, :, :]
        septa = (septum_distance < septum_width)
        septa &= theta[None, :, :] < theta_max - PARAMS["terminal_unseptated_angle"]
        chamber_id = np.floor(chamber_phase)
        chamber_tone = 30.0 + 25.0 * (0.5 + 0.5 * np.sin(chamber_id * 12.9898 + 6.42))
        infill = chamber_tone + 12.0 * mineral + 4.3 * fine
        # Mineral cavities are dark and irregular; ordinary infill stays below
        # the reconstruction isovalue, so it cannot become accidental blobs.
        pores = np.clip((pore - 0.72) / 0.85, 0.0, 1.0)
        infill *= 1.0 - pores * 0.84
        infill = np.clip(infill, 9.0, ISO - 19.0)
        wall_density = 205.0 + 11.0 * mineral + 7.0 * fine
        septum_density = 175.0 + 12.0 * mineral + 7.5 * fine
        material = np.where(shell, wall_density, np.where(septa, septum_density, infill))
        # Thin oblique mineral fractures are part of the same scalar field.
        fracture = np.abs(xx * 0.74 + yy * 0.43 + z3 * 0.23 - 0.43
                          + 0.013 * np.sin(yy * 19.0)) < 0.005
        material = np.where(fracture, material * 0.49, material)
        material *= soft_boundary
        material = np.where(valid, material, 0.0)
        # Only the last whorl carries authored partial-preservation losses.
        last_whorl = theta > theta_max - math.tau
        for patch in PATCHES:
            offset = theta - (theta_max - patch["theta_before_terminal"])
            ragged_width = patch["angular_halfwidth"] * (1 + 0.13 * np.sin(z3 * 63 + q * 11))
            loss = ((np.abs(offset)[None, :, :] < ragged_width)
                    & last_whorl[None, :, :]
                    & (q > patch["radial_fraction_min"])
                    & (z3 > patch["z_min"]))
            material = np.where(loss, 0.0, material)
        field = np.maximum(field, material)

    # Quantize exactly once. Everything downstream consumes these bytes.
    return np.clip(np.rint(field), 0, 255).astype(np.uint8)


def contour_paths(image: np.ndarray, level: float = 8.0) -> list[list[list[float]]]:
    """Trace a marching-squares silhouette from the density projection."""
    inside = binary_fill_holes(image > level)
    grid = np.pad(inside.astype(np.uint8), 1)
    table = {
        1: [(3, 0)], 2: [(0, 1)], 3: [(3, 1)], 4: [(1, 2)],
        5: [(3, 0), (1, 2)], 6: [(0, 2)], 7: [(3, 2)],
        8: [(2, 3)], 9: [(2, 0)], 10: [(0, 1), (2, 3)],
        11: [(2, 1)], 12: [(1, 3)], 13: [(1, 0)], 14: [(0, 3)],
    }
    adjacency: dict[tuple[int, int], list[tuple[int, int]]] = {}
    for y in range(grid.shape[0] - 1):
        for x in range(grid.shape[1] - 1):
            bits = int(grid[y, x]) + 2 * int(grid[y, x + 1]) + 4 * int(grid[y + 1, x + 1]) + 8 * int(grid[y + 1, x])
            edges = [(2*x+1, 2*y), (2*x+2, 2*y+1), (2*x+1, 2*y+2), (2*x, 2*y+1)]
            for a, b in table.get(bits, []):
                pa, pb = edges[a], edges[b]
                adjacency.setdefault(pa, []).append(pb)
                adjacency.setdefault(pb, []).append(pa)
    paths = []
    unused = set(adjacency)
    while unused:
        start = min(unused)
        current, previous = start, None
        path = []
        for _ in range(len(adjacency) + 1):
            path.append(current)
            unused.discard(current)
            candidates = [p for p in adjacency[current] if p != previous]
            if not candidates:
                break
            nxt = candidates[0]
            previous, current = current, nxt
            if current == start:
                path.append(start)
                break
        if len(path) > 12:
            paths.append([[(p[0] / 2 - 1) / (NX - 1), (p[1] / 2 - 1) / (NY - 1)] for p in path])
    paths.sort(key=len, reverse=True)
    return paths[:4]


def make_mesh(volume: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Indexed marching-cubes isosurface of the full stored uint8 array.

    The standard lookup table is included with its Three.js MIT attribution.
    Edges span one source voxel: trilinear source-field alignment is testable.
    """
    axes = [np.arange(n) for n in (NZ, NY, NX)]
    coarse = volume[np.ix_(*axes)]
    corners = np.array([[0,0,0], [0,0,1], [0,1,1], [0,1,0],
                        [1,0,0], [1,0,1], [1,1,1], [1,1,0]], dtype=np.int32)
    cvals = np.stack([coarse[c[0]:coarse.shape[0]-1+c[0],
                              c[1]:coarse.shape[1]-1+c[1],
                              c[2]:coarse.shape[2]-1+c[2]] for c in corners], axis=-1)
    active = np.argwhere((cvals.min(-1) < ISO) & (cvals.max(-1) >= ISO))
    corner_grid = active[:, None, :] + corners[None, :, :]
    coords = np.empty(corner_grid.shape, dtype=np.int32)
    for dim in range(3):
        coords[:, :, dim] = axes[dim][corner_grid[:, :, dim]]
    values = volume[coords[:, :, 0], coords[:, :, 1], coords[:, :, 2]].astype(np.float32)
    spacing = (2*Z_EXTENT/(NZ-1), 2*XY_EXTENT/(NY-1), 2*XY_EXTENT/(NX-1))
    gz, gy, gx = np.gradient(volume.astype(np.float32), *spacing)
    gradients = np.stack([-gx, gy, -gz], axis=-1)
    normal_corners = gradients[coords[:, :, 0], coords[:, :, 1], coords[:, :, 2]]
    positions = np.empty(coords.shape, dtype=np.float32)
    positions[:, :, 0] = coords[:, :, 2] * spacing[2] - XY_EXTENT
    positions[:, :, 1] = XY_EXTENT - coords[:, :, 1] * spacing[1]
    positions[:, :, 2] = coords[:, :, 0] * spacing[0] - Z_EXTENT
    edges = [(0,1), (1,2), (2,3), (3,0), (4,5), (5,6),
             (6,7), (7,4), (0,4), (1,5), (2,6), (3,7)]
    table = json.loads((MODELS / "marching-cubes-table.json").read_text())
    masks = ((values >= ISO) * np.array([1,2,4,8,16,32,64,128])).sum(axis=1)
    all_pos, all_norm = [], []
    for case in range(1, 255):
        edge_ids = [x for x in table[case] if x >= 0]
        rows = np.flatnonzero(masks == case)
        if not len(rows):
            continue
        pos_edges, norm_edges = [], []
        for edge in edge_ids:
            a, b = edges[edge]
            va, vb = values[rows, a], values[rows, b]
            t = ((ISO - va) / (vb - va))[:, None]
            pos_edges.append(positions[rows, a] * (1-t) + positions[rows, b] * t)
            norm_edges.append(normal_corners[rows, a] * (1-t) + normal_corners[rows, b] * t)
        all_pos.append(np.stack(pos_edges, axis=1).reshape(-1, 3))
        all_norm.append(np.stack(norm_edges, axis=1).reshape(-1, 3))
    flat_pos = np.concatenate(all_pos)
    flat_norm = np.concatenate(all_norm)
    # Weld shared edges; retain normals from the density gradient.
    rounded = np.rint(flat_pos * 1000000).astype(np.int32)
    _, first, inverse = np.unique(rounded, axis=0, return_index=True, return_inverse=True)
    verts = flat_pos[first]
    normals = np.zeros_like(verts)
    np.add.at(normals, inverse, flat_norm)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-8)
    faces = inverse.reshape(-1, 3)
    area = np.cross(verts[faces[:,1]] - verts[faces[:,0]], verts[faces[:,2]] - verts[faces[:,0]])
    keep = np.linalg.norm(area, axis=1) > 1e-10
    faces, area = faces[keep], area[keep]
    reverse = (area * normals[faces].mean(axis=1)).sum(axis=1) < 0
    faces[reverse] = faces[reverse][:, [0,2,1]]
    return verts.astype(np.float32), normals.astype(np.float32), faces.astype(np.uint32)


def write_assets() -> None:
    DATA.mkdir(exist_ok=True)
    MODELS.mkdir(exist_ok=True)
    sections = DATA / "sections"
    sections.mkdir(exist_ok=True)
    volume = make_field()
    raw = volume.tobytes(order="C")
    (DATA / "ammonite-density.u8").write_bytes(raw)
    section_hashes = []
    slice_bounds = []
    for z in range(NZ):
        Image.fromarray(volume[z], mode="L").save(sections / f"section-{z:03d}.png", optimize=True)
        section_hashes.append(digest(volume[z].tobytes()))
        ys, xs = np.where(volume[z] > 5)
        slice_bounds.append([int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)] if len(xs) else [0,0,0,0])
    verts, normals, faces = make_mesh(volume)
    with (MODELS / "ammonite-interpretive.obj").open("w") as obj:
        obj.write("# FOSSIL authored illustrative density isosurface; not a real specimen.\n")
        obj.write(f"# source SHA256 {digest(raw)}; isovalue {ISO:g}; full voxel grid\n")
        obj.write("# Unitless coordinates, x right, y up, z front. Intentional missing patches.\n")
        for v in verts:
            obj.write("v %.6f %.6f %.6f\n" % tuple(v))
        for n in normals:
            obj.write("vn %.6f %.6f %.6f\n" % tuple(n))
        for face in faces + 1:
            obj.write("f " + " ".join(f"{i}//{i}" for i in face) + "\n")
    p16 = np.rint(verts / XY_EXTENT * 32767).astype("<i2")
    n8 = np.rint(normals * 127).astype(np.int8)
    index_type = "uint16" if len(verts) <= 65535 else "uint32"
    indices = faces.astype("<u2" if index_type == "uint16" else "<u4")
    occupied = np.argwhere(volume > 5)
    metadata = {
        "title": "FOSSIL — interpretive ammonite density volume",
        "status": "SYNTHETIC / ILLUSTRATIVE — not real CT data or a scientific reconstruction",
        "generator": "scripts/generate_volume.py",
        "dimensions": {"x": NX, "y": NY, "z": NZ},
        "array_order": "z, y, x; x contiguous; y down in PNG sections",
        "dtype": "uint8",
        "density_meaning": "authored relative grayscale only; no calibrated physical units",
        "coordinates": {"x": [-XY_EXTENT, XY_EXTENT], "y": [-XY_EXTENT, XY_EXTENT], "z": [-Z_EXTENT, Z_EXTENT], "model_y": "up", "section_y": "down", "units": "unitless"},
        "seed": SEED,
        "field_sha256": digest(raw),
        "section_sha256": section_hashes,
        "occupied_voxel_bounds_zyx": [occupied.min(0).tolist(), occupied.max(0).tolist()],
        "procedural_parameters": PARAMS,
        "missing_patches": PATCHES,
        "mesh": {"method": "marching cubes of stored uint8 volume", "isovalue": ISO,
                 "grid_stride": 1, "vertices": len(verts), "triangles": len(faces),
                 "bounds": [verts.min(0).tolist(), verts.max(0).tolist()],
                 "includes": "shell walls and chamber septa; ordinary low-density infill excluded",
                 "source_field_sha256": digest(raw)},
        "display_sections": [10, 22, 35, 48, 62],
        "limitations": ["No claim of real specimen anatomy, age, locality or preservation history.",
                       "Ribs, chambers, mineral density, fractures and missing patches are authored.",
                       "The mesh is an isosurface of authored relative density, not calibrated material.",
                       "The model is deliberately incomplete; gaps do not encode quantified confidence."],
    }
    (DATA / "volume-metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    (MODELS / "procedural-parameters.json").write_text(json.dumps({"parameters": PARAMS, "missing_patches": PATCHES, "source_field_sha256": digest(raw), "mesh": metadata["mesh"]}, indent=2) + "\n")
    classic = {
        "nx": NX, "ny": NY, "nz": NZ, "seed": SEED,
        "bounds": metadata["coordinates"], "sha256": digest(raw),
        "illustrative": True, "densityBase64": b64(volume),
        "sliceBounds": slice_bounds, "thumbSections": metadata["display_sections"],
        "contours": contour_paths(volume.max(axis=0)),
        "mesh": {"positionsBase64": b64(p16), "normalsBase64": b64(n8),
                 "indicesBase64": b64(indices), "indexType": index_type,
                 "positionScale": XY_EXTENT, "vertexCount": len(verts),
                 "triangleCount": len(faces), "iso": ISO},
    }
    (DATA / "fossil-volume.js").write_text("/* Authored synthetic density data. No real CT, measurements or specimen claims. */\nwindow.FOSSIL_VOLUME = " + json.dumps(classic, separators=(",", ":")) + ";\n")
    (DATA / "README.md").write_text("""# Interpretive volume

Every asset here is generated from one deterministic, seeded scalar field. This
is an illustration of how internal sections can inform interpretation. It is
**not a real CT scan, measured specimen, diagnostic image, or validated anatomy**.
The study reference does not represent a museum accession.

`ammonite-density.u8` is a 192 × 192 × 72 unsigned-byte array, ordered Z/Y/X
(X contiguous). `sections/section-000.png` through `section-071.png` are exact
lossless grayscale planes from that array. Rows run downward in the images.
`fossil-volume.js` embeds the same bytes and a quantized isosurface for offline
classic-script use, including `file://` without fetch. `volume-metadata.json`
records the seed, hash, orientation, authored parameters and limitations.

The OBJ in `../models/` is extracted from the stored array at relative density
112 on the full voxel grid. The threshold has no physical unit. It includes shell
walls and septa while excluding ordinary low-density chamber infill. Its two
missing outer patches are deliberate authored gaps, recorded in the model's
parameter file. External ribs and internal septa use different functions.

Rebuild with `python scripts/generate_volume.py`. Verify independently persisted
representations with `python scripts/generate_volume.py --verify`. Verification
checks every PNG against raw voxel bytes, the embedded browser data, mesh
orientation and extent, and mesh samples against the original scalar field.

Runtime: load `data/fossil-volume.js`, then `src/imaging.js`. Construct
`new FossilImaging({scanCanvas, volumeCanvas, thumbs, onReady})`. No network,
runtime imports, RAF loop, or external specimen imagery is required by this
component. The main scene owns controls, wording, animation time and placement.

The hardware renderer draws a chalk-shaded isosurface and 48 data-derived
section contours. It uses line geometry rather than transparent texture planes.
The mobile, reduced-motion and software-graphics fallback rasterizes the same
indexed mesh with a CPU depth buffer at 768 pixels across; it is not a magnified
voxel thumbnail. Its 16 section planes remain vector geometry.

`renderScan` uses one fixed volume frame for all sections and fits it into the
supplied rectangle without changing aspect ratio. `drawContour` accepts the
same optional `rect` for an exact coordinate match. The original `x,y,size`
arguments define a square outer frame, with the contour fitted inside it.
`time` is expressed in seconds. Render scale can be below one for pixel budgets.
""")
    print(f"Built {NX}×{NY}×{NZ} field; {len(verts):,} mesh vertices; {len(faces):,} triangles.")
    verify_assets()


def verify_assets() -> None:
    metadata = json.loads((DATA / "volume-metadata.json").read_text())
    raw = (DATA / "ammonite-density.u8").read_bytes()
    assert len(raw) == NX * NY * NZ, "Raw volume length does not match dimensions"
    assert digest(raw) == metadata["field_sha256"], "Raw volume hash mismatch"
    volume = np.frombuffer(raw, dtype=np.uint8).reshape(NZ, NY, NX)
    for z in range(NZ):
        pixels = np.asarray(Image.open(DATA / "sections" / f"section-{z:03d}.png"))
        assert np.array_equal(pixels, volume[z]), f"PNG section {z} differs from raw plane"
        assert digest(pixels.tobytes()) == metadata["section_sha256"][z]
    text = (DATA / "fossil-volume.js").read_text()
    embedded = json.loads(text.split("window.FOSSIL_VOLUME = ", 1)[1].rstrip(";\n"))
    assert base64.b64decode(embedded["densityBase64"]) == raw, "Browser volume differs from raw field"
    mesh = embedded["mesh"]
    vertices = np.frombuffer(base64.b64decode(mesh["positionsBase64"]), dtype="<i2").reshape(-1,3).astype(np.float32) / 32767 * mesh["positionScale"]
    normals = np.frombuffer(base64.b64decode(mesh["normalsBase64"]), dtype=np.int8).reshape(-1,3).astype(np.float32) / 127
    indices = np.frombuffer(base64.b64decode(mesh["indicesBase64"]), dtype="<u2" if mesh["indexType"] == "uint16" else "<u4").reshape(-1,3)
    assert len(vertices) == mesh["vertexCount"] and len(indices) == mesh["triangleCount"]
    assert int(indices.max()) < len(vertices) and np.isfinite(vertices).all()
    assert np.all(np.linalg.norm(normals,axis=1) > .97), "Mesh normals invalid"
    # The OBJ and browser mesh must retain exactly the same y orientation.
    obj_vertices = []
    for line in (MODELS / "ammonite-interpretive.obj").read_text().splitlines():
        if line.startswith("v "):
            obj_vertices.append([float(x) for x in line.split()[1:4]])
    obj_vertices = np.asarray(obj_vertices)
    assert obj_vertices.shape == vertices.shape
    assert np.max(np.abs(obj_vertices - vertices)) < 0.00004, "OBJ/browser mesh transform mismatch"
    # Sample the original field at reconstructed vertices. Marching-cubes edge
    # crossings span one voxel, so trilinear density must match the isovalue
    # within the small quantization error of the browser's int16 positions.
    sample = vertices[::max(1, len(vertices)//12000)]
    coords = np.array([(sample[:,2]+Z_EXTENT)/(2*Z_EXTENT)*(NZ-1),
                       (XY_EXTENT-sample[:,1])/(2*XY_EXTENT)*(NY-1),
                       (sample[:,0]+XY_EXTENT)/(2*XY_EXTENT)*(NX-1)])
    density = map_coordinates(volume.astype(np.float32), coords, order=1, mode="constant", cval=0)
    error = np.abs(density - ISO)
    assert float(np.median(error)) < 0.3, "Mesh no longer tracks the source density field"
    assert float(np.quantile(error, .90)) < 0.8, "Mesh/source density correspondence degraded"
    occupied = np.argwhere(volume > 5)
    low, high = occupied.min(0), occupied.max(0)
    voxel_pitch = 2*XY_EXTENT/(NX-1)
    expected_width = (high[2] - low[2]) * voxel_pitch
    expected_height = (high[1] - low[1]) * voxel_pitch
    assert abs(float(vertices[:,0].max()-vertices[:,0].min()) - expected_width) < voxel_pitch * 3, "Mesh x extent differs from occupied source voxels"
    assert abs(float(vertices[:,1].max()-vertices[:,1].min()) - expected_height) < voxel_pitch * 3, "Mesh y extent differs from occupied source voxels"
    assert volume[36].max() > 180 and np.count_nonzero(volume[36] > ISO) > 2000
    assert not np.array_equal(volume[22], volume[50]), "Sections are repeated decorative images"
    assert not any(np.any(face) for face in (volume[0], volume[-1], volume[:,0], volume[:,-1], volume[:,:,0], volume[:,:,-1])), "Density field clips the volume boundary"
    report = {
        "result": "PASS", "field_sha256": digest(raw), "sections_checked": NZ,
        "browser_data_identical": True, "obj_browser_alignment": "within 0.00004 unitless model units",
        "mesh_density_error_median": round(float(np.median(error)),3),
        "mesh_density_error_p90": round(float(np.quantile(error,.90)),3),
        "note": "Checks representation consistency; does not establish scientific accuracy.",
    }
    (DATA / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="verify stored data, PNG sections and mesh without rebuilding")
    args = parser.parse_args()
    verify_assets() if args.verify else write_assets()
