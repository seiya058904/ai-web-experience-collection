# PARALLAX — assets and notices

This supplied original exhibition follows one architectural sculpture through ten spatial perspectives. Its 18 persistent fragments, camera-ray alignment, mirror captures, membrane refraction, lighting and reassembly are authored geometry and shaders. It is a digital artwork, not an archaeological object, optical measurement or scanned museum artifact.

## Images and model

Four generated production images remain byte-identical: [transparent hero](assets/hero-form.png), [ivory gallery](assets/gallery-ivory.png), [museum gallery](assets/gallery-museum.png) and [black-stone texture](assets/basalt.png). The gallery and social image is a capture of the actual reassembled runtime sculpture with interface labels hidden. Thirteen selected reference images are design targets, preserved in repository provenance; they are not runtime screenshots. Original generation prompts, IDs, dimensions and SHA-256 records remain in `provenance/parallax/assets/provenance.json`.

The [assembled GLB](models/impossible-form.glb) and [model record](models/impossible-form.json) retain the original delivery bytes. The glTF 2.0 binary embeds its texture and contains 18 structural meshes, 19 nodes and 804 triangles, with no external image or buffer URI. The website builds the same sculpture from source to animate its fragments; the GLB represents its portable static assembled state. Mirror, membrane and animated light behavior remain in the website source.

## Fonts and dependencies

- Bodoni Moda Latin 400 normal: [complete SIL OFL 1.1 notice](licenses/BODONI-MODA-LICENSE.txt). Supplied Fontsource acquisition record: 5.2.7.
- Manrope Latin 400/500 normal: [complete SIL OFL 1.1 notice](licenses/MANROPE-LICENSE.txt). Supplied Fontsource acquisition record: 5.2.6.
- Three.js: [complete MIT notice](licenses/THREE-LICENSE.txt). The delivered r186 core, module and Reflector match the existing Collection `three` 0.186.1 byte-for-byte and are built from that root dependency.
- Lenis: existing Collection 1.3.26, MIT, added for wheel smoothing on the exhibition's owned RAF. See the [shared license inventory](../licenses.txt) and [actual production dependency notices](../third-party-licenses.md).

Font binaries retain their source SHA-256 values. No application-wide open-source license is declared in the delivery; no MIT grant for the custom application or generated artwork is inferred from a dependency's license.

The original ZIP remains outside Git and deployment. Archive SHA-256: `72768646c6de27b10f99e7ef7de2233e3c6c7a157661aae491084147051937f0`; 46,316,092 bytes; 73 entries. Repository delivery/import records preserve source hashes, mappings and omitted standalone tooling. Original source links and prompt history remain in scoped provenance.
