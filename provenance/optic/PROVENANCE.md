# Asset and model provenance

Project: **OPTIC — The Architecture of an Image**
Record date: **2026-10-06**

## Original authored work

The camera is fictional and unbranded. Its silhouette, geometry, materials, component layout, light narrative, typography, scene compositions and application code were authored specifically for this project. Third-party rendering and font dependencies remain separately identified and licensed. No brand product page, camera CAD or downloaded product image supplies the presentation. Engineering references are listed in [SOURCES.md](SOURCES.md); reference images and diagrams are not bundled as presentation assets.

| File or system                           | Origin and treatment                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/camera-model.js`                    | Original procedural camera mesh: curved hollow body, grip, mount, chassis, sensor carrier, IBIS cradle, PCB routing, electronics, EVF, dials, rear glass and flexible ribbons. Rubber, brushed surfaces, sensor coating and circuit textures are generated locally by code.                                                                                      |
| `src/optics-model.js`                    | Original procedural optical assembly, curved glass elements, aperture blades, barrel details and ray representation. Geometry and relationships are authored; no commercial lens CAD or optical prescription is included.                                                                                                                                        |
| `src/sensor-mechanisms.js`               | Original two-curtain shutter, curtain-gated light handoff, 24 × 16 Bayer overview and magnified 4 × 4 cell study with microlenses, filters, photodiodes, vias and electrical readout. Mechanical and microscopic details are explanatory representations.                                                                                                        |
| `public/assets/optic-mark.svg`           | Original vector identity artwork for this project.                                                                                                                                                                                                                                                                                                               |
| `public/assets/coast-of-light.webp`      | The sole AI-generated raster asset used by the application, created through OpenAI's built-in image-generation capability. Both the source and delivered WebP measure 1536 × 1024 pixels. The delivery conversion uses lossy WebP at quality 93; the final file is 580,736 bytes. The same asset supplies the focus/aperture previews and camera image surfaces. |
| `public/assets/coast-of-light.webp.json` | Sidecar recording the generation prompt and creation timestamp. The prompt is also preserved as readable text in `docs/ASSET_PROMPT.txt`.                                                                                                                                                                                                                        |
| Local font resources                     | Manrope and Cormorant Garamond supplied by their pinned Fontsource packages, with original SIL Open Font License notices retained. See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).                                                                                                                                                                      |

### Final photographic artwork

`coast-of-light.webp` depicts an imagined Pacific coastal scene. It is generated artwork, not documentary photography of an identified place, and was not captured with the fictional OPTIC camera. Exposure values shown within the experience describe its explanatory camera narrative; they are not factual camera EXIF for the generated artwork.

The generation prompt is preserved in [ASSET_PROMPT.txt](ASSET_PROMPT.txt) and the [WebP provenance sidecar](../public/assets/coast-of-light.webp.json). The prompt requested a larger ideal resolution; **1536 × 1024 is the actual delivered resolution**, not 3840 × 2560. Only the final necessary asset and its provenance record are included. Temporary concept sheets, alternate generations, intermediate PNGs, screenshots and rendering experiments are excluded from the deliverable.

The generated image is included as part of this project subject to the applicable generation-provider terms. Its inclusion does not assert exclusive copyright protection, a photography copyright, an actual camera capture, or exclusivity against independently similar generated output. The project's MIT license applies to its original software and accompanying authored documentation; it does not replace third-party font licenses or the applicable terms governing generated output.

## Camera definition

The common model scale is approximately **25 mm per world unit**. The nominal active full-frame sensor is **36 × 24 mm**, represented by a **1.44 × 0.96** plane. Its fictional sampling specification is **6000 × 4000 photosites = 24.0 megapixels**, with **6 µm pitch**.

The lens is a **50 mm f/1.4–f/16 prime** with **ten elements in eight groups** and **nine rounded aperture blades**. The internal architecture is consistent across the experience: lens and iris, front mount, two-curtain focal-plane shutter, Bayer CMOS sensor on a moving stabilization carrier, flex connections, image processor/PCB and rear display. Phase-detection autofocus is located on the imaging sensor.

## Deliberate visual simplifications

- **Optics:** This is an explanatory lens, not an optimized or manufactured optical prescription. Selected rays in the main lens use its surface geometry and Snell refraction. The microscopic cell study uses authored convergence paths through its microlens/filter stack. The overall artwork is not a calibrated optical simulation, aberration analysis or lens-design tool.
- **Focus:** The photographic focus preview uses a depth mask and composited blur. It is not physically integrated depth-of-field rendering and does not calculate the true bokeh of the complete ten-element system.
- **Aperture:** The preview matches brightness by compensating shutter time as the aperture changes. The opening geometry and relative light visualization describe the aperture; a brightness-matched preview should not be interpreted as unchanged shutter time and ISO.
- **Shutter:** Mechanical travel is slowed for inspection. The curtains preserve their ordered sweep and exposure relationship; screen seconds are not the camera's exposure seconds.
- **Sensor sampling:** A **24 × 16 schematic overview** occupies the active sensor area before a **4 × 4 central cell study** is magnified into view. Neither grid is a literal display of the 6000 × 4000 photosite array. Both preserve RGGB sampling; the later full-color image represents reconstructed image data.
- **Sensor layers:** The 4 × 4 study separates curved microlenses, color filters, photodiode wells, rear interconnects and readout. Light ends at the photodiode; subsequent moving markers represent charge/data. Cell size, thickness and layer gaps are enlarged for inspection and do not use the camera body's 25 mm/world-unit scale as fabrication dimensions.
- **Optical inversion:** The photographic texture on the sensor is rotated **180° around the optical axis**. Rear display and final photograph textures are upright. This depicts the optical image's orientation; it does not simulate a complete color reconstruction pipeline.
- **Stabilization:** IBIS translation, roll and surrounding camera motion are exaggerated for visibility. The sensor remains approximately parallel to its focal plane. Five compensated classes of camera movement do not imply five large independent sensor tilts.
- **Exploded view:** Gaps, cable release and component offsets are enlarged and staged for legibility. Portrait phones use independent lateral/vertical inspection positions for the chassis, shutter, sensor/IBIS, PCB and rear enclosure, while preserving their front-to-back order. The lens retains its optical axis. All offsets return to the same assembled state; exploded distances are not physical operating clearances.
- **Light:** Visible rays stand for selected light paths from the subject, not an assertion that one photon contains an entire photograph. At the sensor, the narrative changes from light to charge/data.

## Runtime and distribution

The experience uses local JavaScript, styles, geometry, textures, fonts and the final WebP. It has no required font CDN, analytics service, backend, remote image dependency or external runtime API. Package installation requires access to the package registry unless its dependencies are already cached; the included production build can be served locally with Node without installing dependencies.

No public deployment or hosting is part of this deliverable. A single final production build is included alongside its complete source, package lock, build configuration, documentation and license notices.
