# Interpretive volume

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
