# BOX-001 — bounded interface study

## Purpose and boundary

The generated photographic plates establish the industrial world. The local
Three.js and SVG studies explain the container's persistent geometry, contents,
door pivots, support interfaces and spreader contact. They are explicitly
schematic. They are not a photorealistic terminal simulation, certified equipment
design, manufacturing drawing or handling guide.

The nominal external envelope is **6.058 m × 2.438 m × 2.591 m**; see
[SOURCES.md](SOURCES.md). Exact fitting holes, tolerances, wall details, wheel
assemblies and spreader details are illustrative. No payload, load rating,
operator approval, safety certificate or real registration is asserted.

## Canonical object

| Property | Contract |
| --- | --- |
| Entity | `BOX-001`; displayed as `CARGO / BOX-001`, fictional exhibit ID |
| Units | metres |
| Axes | x = length; y = up; z = width |
| Origin | box footprint centre on the bottom plane |
| Door end | +x |
| Door pivots | outer vertical edges at +x, z = ±(width/2 − 0.09) |
| Door motion | mirrored rotations about their own y axes, 0 to 106.2 degrees |
| Locking rods | exactly one per door, retained as that door turns |
| Scratch | one diagonal ochre/rust mark on the upper portion of the right door |
| Corner fittings | eight stable schematic castings; Three uses recessed apertures |
| Paint | oxidized red `#A64B3B`; highlight changes are temporary explanatory states |
| Cargo | the same six timber blocks, in three columns by two rows |
| Text | real DOM identity plate or accessible SVG text; no baked text texture |

The six blocks have x centres −2.12, −0.80 and 0.52 m, z centres −0.56 and
0.55 m, and dimensions 1.13 × 0.91 × 0.96 m. Their arrangement does not depend
on scroll history. The interior cutaway removes the near sheet and roof while
retaining the frame, floor and actual door aperture. Destination mode uses the
same cargo meshes and the same door groups.

## Support and lift contracts

Road and rail are distinct support groups. The box changes its supported base
height, never its dimensions. Road wheels contact the floor; the chassis sits
above their tops and supports the corner region at 1.15 m. Rail wheels contact
the rail heads; the wagon supports the box at 1.00 m. These heights are authored
scene coordinates, not operator specifications.

The lift evaluator is pure and position based:

1. At progress 0, the box is grounded and the spreader is 0.92 m above its top.
2. At progress 0.45, the four schematic feet reach the top corner locations.
3. Only after 0.45 does the box rise, with its spreader attached at the same
   relative position. The maximum depicted lift is 1.55 m.
4. Four vertical cable segments keep their upper ends at the trolley and their
   lower ends at the spreader. Their lengths follow the evaluated pose.
5. Reverse seeking and direct entry use the same equation, without a preceding
   event or accumulated animation state.

The study does not animate a container unsupported between road and rail. The
site's authored boundary/occluder owns the editorial change between supports.

## Rendering and lifecycle

`createContainerScene(host)` returns synchronously with `setState`, `resize`
and `dispose`. It immediately renders the full SVG alternative, then imports
Three.js as a progressive enhancement. It has **no RAF, ticker or elapsed-time
authority**. The parent story controller supplies all state changes.

The WebGL study uses an orthographic explanatory camera, a stable warm key
light from positive x/z and above, a cool fill, and a hemisphere light. Contact
shadows sit on a transparent ground. ACES filmic tone mapping and sRGB output
are explicit. Pixel ratio is bounded to 1.6; shadow maps are 1024 square. These
settings are implementation choices, not measured performance claims.

The parent should keep one active viewer. Resizing changes projection and
render resolution without replacing the actor. The current mode is read at
the time the lazy import completes, so a late import never restores a previous
chapter. Hidden presentation is paused by the parent, which owns time.

Reduced motion uses the SVG study, preserving Empty/Packed, Open/Closed,
Road/Rail, highlighting, and spreader-contact results. Failed Three imports,
unavailable WebGL and context loss also retain the current state in SVG. A
restored context redraws that state. Disposal disconnects resize observation,
removes context listeners, disposes geometries/materials/textures and releases
the renderer context.

## API

```ts
type ContainerMode =
  | 'identity' | 'interior' | 'doors' | 'road'
  | 'rail' | 'lift' | 'destination';

interface ContainerState {
  mode: ContainerMode;
  progress: number;       // clamped 0..1
  packed: boolean;
  doorsOpen: number;      // clamped 0..1
  highlight: 'none' | 'corners' | 'doors' | 'identity';
  reduced: boolean;
}

const viewer = createContainerScene(host);
viewer.setState({ mode: 'interior', packed: true, doorsOpen: 1 });
viewer.resize();
viewer.dispose();
```

`renderContainerFallback(state)` returns a self-contained SVG string. Shared
exports include `DEFAULT_CONTAINER_STATE`, `CONTAINER_DIMENSIONS`,
`CARGO_BLOCKS`, `getContainerPose`, `normalizeContainerState` and
`describeContainerState`. Host data attributes expose the current renderer,
mode, packed state, door opening, spreader gap and lift contact for evidence.

## Module-level verification performed

- TypeScript strict checking passed against Three.js / @types/three 0.187.0
  and TypeScript 5.9.3.
- Contact-before-lift and retained attachment were checked at 0, 0.25, 0.4499,
  0.45, 0.4501, 0.5, 0.75 and 1.
- All six blocks were checked against the internal visual clearances.
- All seven modes at three door openings returned finite, deterministic SVG.
- All 21 SVG variants parsed as valid XML.
- Road/Rail and Empty/Packed produced distinct accessible outputs.
- Six fallback states were rasterized directly through ffmpeg/librsvg, without
  a browser, and visually inspected. That inspection found and corrected a far
  rear post incorrectly drawn through the near wall, overlap between elevated
  diagrams and the identity plate, a cropped lift beam, and a destination view
  that hid the cargo. The final diagnostic is in
  `evidence/non-browser/fallback-contact-sheet.png`; its exact state inputs and
  source SHA-256 are in `evidence/non-browser/fallback-states.json`.

The diagnostic image is labeled **NON-BROWSER**. It is a direct rasterization
of six standalone SVGs, not a screenshot of the site. Its background and header
were added to make the diagram inspection readable. It does not establish
browser layout, WebGL appearance, responsive behavior or interaction quality.

These checks do not claim browser aesthetics, hardware performance, whole-site
accessibility or production acceptance. The production browser evidence ledger
records those separate observations.

## References

- [Three.js official documentation](https://threejs.org/docs/), consulted
  2026-11-09: WebGLRenderer, OrthographicCamera and ExtrudeGeometry.
- [Project factual sources](SOURCES.md), for the nominal external envelope and
  the explicit boundary around unavailable normative detail.
