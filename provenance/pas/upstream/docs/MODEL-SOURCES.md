# PAS character assets, provenance and regeneration

PAS uses original choreography and two newly assembled adult character identities. The body topology, neutral anatomical skeleton, source skinning weights, hair cards, skin images and fitted garment source data come from the explicitly CC0 graphical assets listed below. No motion capture, dance sequence, recognisable performance, copyrighted choreography or third-party character animation was imported.

## Sources and licenses

| Source data | Publisher / author | Origin | License |
| --- | --- | --- | --- |
| `base.obj`, `default.mhskel`, `default_weights.mhw`, adult Asian female/male and African male macro targets | MakeHuman Community / MakeHuman Team | [MakeHuman source repository](https://github.com/makehumancommunity/makehuman), inspected revision `a8bc2d54ff0ac92e78ff71431b1023eda42bf482` | CC0 1.0 graphical assets |
| `ponytail01`, `afro01`, young Asian female/male skin texture data | MakeHuman system assets | [Official system asset pack](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html) | CC0 pack |
| Basic tucked T-shirt and fabric maps, `toigo_basic_tucked_t-shirt` | Margaret Toigo; source author field `MRT` | [Official Shirts 01 pack](https://static.makehumancommunity.org/assets/assetpacks/shirts01.html) | CC0 pack; source `.mhclo` declares CC0 |
| Harem pants mesh and fit references, `toigo_harem_pants` | Margaret Toigo; source author field `MRT` | [Official Pants 01 pack](https://static.makehumancommunity.org/assets/assetpacks/pants01.html) | CC0 pack; source `.mhclo` declares CC0 |

Direct archive origins:

- <https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip>
- <https://files2.makehumancommunity.org/asset_packs/shirts01/shirts01_cc0.zip>
- <https://files2.makehumancommunity.org/asset_packs/pants01/pants01_cc0.zip>

Source excerpts, metadata and the CC0 legal text are preserved in `scripts/model-source/`. The original MakeHuman license explains the distinction between its AGPL program logic and its CC0 graphical assets. This project imports the graphical data only. The Python preprocessor, TypeScript renderer, motion functions and offline exporter are original project code; they do not import MakeHuman program code. See the [official license explanation](https://www.makehumancommunity.org/about/license.html) and the included `scripts/model-source/LICENSE.md` / `LICENSE.ASSETS.md`.

## Identity and modifications

Cen is a 1.68 m adult with a rust tee, charcoal tapered training trousers, dark fitted hair and a small low bun. Cheng is a 1.82 m adult with a sand tee, charcoal trousers and short dark curls. Both have bare feet, detailed anatomical hands, individual finger bones, visible faces and explicit eye geometry.

The source adult shape targets are combined into stable original identities. The project normalizes each model to a measured height and ground plane, fits source garments by their barycentric proxy references, retapers the trousers, opens the ankle hems, adds a modest shirt overlap at the waistband, removes covered body surfaces, and smooths the body and garments once with Catmull–Clark subdivision. Skin weights are interpolated with the same geometry operations, reduced to four influences and renormalized. Original source data is retained intact for regeneration.

Cen’s long source ponytail is cropped and compressed into a fitted scalp; the low bun is original geometry. Cheng’s source afro is shortened and supplemented by deterministic instanced curl geometry. Eyes and pupils are original small meshes. Fabric albedo is remapped toward white so the intended material colors are visible; hair maps retain alpha transparency. Runtime texture files are bundled WebP conversions. The app does not fetch textures, meshes or animation from third-party CDNs at runtime.

## Authoritative rig contract

All dimensions are metres. The world is Y-up and the neutral actor faces +Z. Anatomical left is local +X. Motion controls the world positions of pelvis, spine, chest, neck, head, shoulders, elbows, wrists, palm centers, hips, knees, ankles and toes. `src/character-metrics.ts` records measurements from the actual source geometry, and `src/motion-types.ts` documents the pose contract. The near-camera hand pair in the opening orientation is Cen’s right hand and Cheng’s left hand.

`src/render/character.ts` maps these exact world-space targets onto the measured bind skeleton. Each actor owns its skeleton and prop geometry. Imported source mesh geometry and materials are shared, and the asset owner disposes them only after the actors are released. Asset load failures await all sibling requests before cleanup to avoid late-loading orphan resources. No animation mixer or frame-history-dependent pose state is used.

The fingers use separate thumb, index, middle, ring and little-finger chains. A zero curl value preserves the source hand’s naturally curved rest shape. Final fingertip contacts use the actual model’s middle-finger distal endpoint projected into the palm basis, rather than an approximate hand length. This is a visual contemporary-dance study; its anatomical dimensions and kinematic constraints are not a biomechanical or clinical validation.

## Runtime assets and regeneration

A normal website build only needs Node and the committed runtime files. It does not require Python, Blender, MakeHuman or an internet connection after installation:

```sh
npm ci
npm run build
```

To regenerate character binaries and textures from the included source graphical data, install Python 3 with NumPy and Pillow, then run from the project directory:

```sh
python3 scripts/build-characters.py
```

The script writes `public/assets/models/{cen,cheng}.{json,bin}` and the files in `public/assets/textures/`. Binary mesh attribute offsets and type information are in each JSON manifest. Original source data is preserved in `scripts/model-source/`.

## Same-rig native render export

The project also includes a DOM-free export path for software OpenGL rendering of this exact rig. It calls the same `createCharacter()` and `evaluateDance()` functions used by the live renderer, includes the actual eye/bun/curl props, and exports the original static geometry, skin indices, skin weights and per-frame bone matrices. It is not a substitute animation or a sequence of unrelated generated images.

```sh
node --experimental-strip-types scripts/export-render-rig.mjs --out ./render-cache --times 3.42
node --experimental-strip-types scripts/export-render-rig.mjs --out ./render-cache --range 0:10:.005 --mode unison
node --experimental-strip-types scripts/export-render-rig.mjs --out ./render-cache --range 4:4.76:.005 --mode echo
```

`rig.json` describes `rig.bin`. The frame manifests describe their corresponding binary matrix streams. All transforms are column-major. The skinned character meshes have identity bind matrices; the exported bone matrices already contain the world transform multiplied by the inverse bind transform. Each vertex is transformed by the weighted sum of its four bone matrices. Non-skinned props use their exported object world matrices. Instanced curls are expanded once into a static mesh with per-vertex color. Normals use the rotational part of the same weighted transform.

The default rendered image sequence is an offline rendering of the real 3D mesh and deterministic choreography. It is distinct from the eight AI direction images, which document visual development and are not presented as evidence of runtime rendering.
