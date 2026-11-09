# Pip underside support geometry

## Scope

This is a geometric check of the actual Three.js body and support meshes. It is not a browser, screenshot, or visual-quality pass.

## Corrected defect

The former flat support boxes had a top at y = 0.81. At the final underside pose, that plane entered the sloping body. The replacement consists of two rigid wooden cradles with 0.12 × 0.12 footprints, a roof fitted to the body's actual slope, and a base fixed at the mat surface (y = 0.012). The third move mark now has its center at y = 0.586.

The cradles slide along the tabletop as Pip tilts. Their path includes the changing cross-body slope, so the high roof edge cannot enter the body between chapters. Returning through the story evaluates the same roll function. The roof does not stretch or change shape.

## Evidence

- Actual source: `src/scene.ts`, SHA-256 `ab4444baa7971142ae9f7477e379c6e1fdd5659fa3669c43f73fcfad4c9e3055`.
- Three.js revision: 187.
- 104 tilt positions from 0 to −1.03 radians, two supports, and a 9 × 9 roof grid for each.
- 33,696 ray queries; 11,302 roof samples beneath the body.
- **0 penetrations; 0 missed support-roof rays.**
- Minimum sampled body/roof separation: **0.001499986 world units**.
- Once fully engaged (tilt at least 0.55 radians), maximum nearest-contact separation: **0.001804295 world units**.
- Support bases remain at y = 0.012 within Float32 precision.
- 25 sun-to-camera ray checks: **0 occlusions by the supports**. The cradles also sit outside the sun's X extent.

The small positive clearance avoids coplanar flicker and is a digital-model tolerance, not real-world repair guidance. At the beginning of the approach, the supports are outside the body; the far wheels support the partial tilt until the cradles engage.

See `support-geometry.json` for the full measured ledger and profile values. Browser visual validation remains a separate check.
