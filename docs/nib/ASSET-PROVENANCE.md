# Asset Provenance — NIB

**Session date: 2026-10-07.** This register describes the actual materials included in the local-only source package. Full SHA256 digests, byte counts, dimensions, retained prompts and input records are in [PROVENANCE.json](PROVENANCE.json). Paths inside that JSON are relative to the project root.

## What is included

- **11 runtime WebP images**, totaling **1,816,290 bytes**.
- **11 final generated PNG originals**, totaling **14,075,777 bytes**.
- **11 curated Visual Bible PNGs**, totaling **21,475,647 bytes**.
- **No borrowed stock imagery, third-party texture pack or external 3D model.** Original scene geometry and its parameters are included in JavaScript.

All material images were generated with the OpenAI image-generation tool in this session. The exact service/model version was not retained; no version is inferred from image filenames. The 22 delivered PNGs match their recorded generated output files byte for byte. None of those PNGs contains prompt text metadata. Prompt records below come from the retained session maps.

## Runtime materials

Ten production images and their PNG originals are **1672 × 941**. The independent portrait `hero-mobile` is **853 × 1844** in both formats. The six transparent materials preserve independent object or liquid alpha. The other five images are opaque material plates. All production WebPs were exported at **quality 94, alphaQuality 100**, without resizing; all six decoded alpha channels match their PNG originals exactly. The exact encoder build/version was not retained in the supplied maps. Re-exporting images is not required to run or build the project.

| Material | Original / production | Alpha | Runtime role |
| --- | --- | --- | --- |
| `hero` | [PNG](../artwork/originals/hero.png) · [WebP](../public/assets/hero.webp) | Yes | Transparent frontal nib with engraved metal and lacquer; a material object, not a complete page. |
| `reservoir` | [PNG](../artwork/originals/reservoir.png) · [WebP](../public/assets/reservoir.webp) | No | Text-free dark liquid chamber plate. |
| `feed` | [PNG](../artwork/originals/feed.png) · [WebP](../public/assets/feed.webp) | No | Text-free diagonal ebonite feed plate; a small dry crop also supplies material grain to authored Balance geometry. |
| `slit` | [PNG](../artwork/originals/slit.png) · [WebP](../public/assets/slit.webp) | No | Text-free extreme metal and narrow slit plate. |
| `meniscus` | [PNG](../artwork/originals/meniscus.png) · [WebP](../public/assets/meniscus.webp) | Yes | Transparent magnified nib tip, independently registered from liquid; the camera approaches its held interface before entering the optical material. |
| `meniscus-fluid` | [PNG](../artwork/originals/meniscus-fluid.png) · [WebP](../public/assets/meniscus-fluid.webp) | Yes | Transparent held liquid reflection fitted to the meniscus nib registration; the same optical material fills the lens during the scale handoff into paper. |
| `contact` | [PNG](../artwork/originals/contact.png) · [WebP](../public/assets/contact.webp) | Yes | Transparent diagonal nib and lacquer object used for the short landscape Hero and retained as a generation reference for nib-profile. |
| `fiber` | [PNG](../artwork/originals/fiber.png) · [WebP](../public/assets/fiber.webp) | No | Blank extreme-macro cellulose plate supplying substrate relief, localized interstitial staining cues, sampled capillary paths and raised-fiber occlusion. |
| `paper` | [PNG](../artwork/originals/paper.png) · [WebP](../public/assets/paper.webp) | No | Blank warm ivory writing-paper material. |
| `hero-mobile` | [PNG](../artwork/originals/hero-mobile.png) · [WebP](../public/assets/hero-mobile.webp) | Yes | Transparent portrait nib with an optically distinct small attached blue-black bead, preserving the independent mobile composition. |
| `nib-profile` | [PNG](../artwork/originals/nib-profile.png) · [WebP](../public/assets/nib-profile.webp) | Yes | Transparent low side-profile nib with visible arched metal and ebonite-feed thickness; one registered pose continues from the liquid-interface handoff through paper contact, writing and final departure. |

### PNG and WebP identity

The digests below identify the delivered bytes, not visual similarity. Complete machine-readable records are also included in the JSON.

| Material | Original PNG SHA256 | Production WebP SHA256 |
| --- | --- | --- |
| `hero` | `0546e69ed54acfc590c7b8bb245d2ae0ae7e083180ed0d3baa87cc6d6b83a306` | `b95d537634a8d4f21ff268bb8d77cfeabec01df6bfab2e4d1c67482e2f994f8e` |
| `reservoir` | `ffa1e9f3fb5c1f4f265bc7662a1a7059b867bc4879b7ce7a0fb2d0b9e43354ca` | `609ffbe2850bf71aaac94d8b9bb1917d6680d8c435900cefc381401de558c694` |
| `feed` | `8b257fe4847d4c84399c2013b20c1ed8eb2dd3f7474478b7e8bef51725beddd7` | `a64907a0d36d67f59ca691f8827cfc4d34d2d51510302ab4914dd490ba4a00ba` |
| `slit` | `03abf3b530481b478e151533d130aa10ee556365a1ed911f314116402c62112f` | `a4aecd9bbf35f4335f69b32d712726f45ea107cb52990c827c1b01c19eac31cc` |
| `meniscus` | `13b32b3ec82529e36662fd291666b92895dd3403a2a6b8e2dee17c66561fac85` | `fc351c94213208da65f0679502e48ac8eb219cf711ea88e4c2bca526f0892598` |
| `meniscus-fluid` | `d4f655fdfca4e9bf00d03949757eb8eb11c38076efc5193a6d96a179e0712223` | `aad435dcd75efee882ee758833e27dd3d9cd43434989e3b58ac2b8e9ef36dd91` |
| `contact` | `ad733c514de4a16cadcf788070876e1bcf23b582524c40c831c001e50014b1f9` | `71800bff1f110cf382a3a97bdcda18f79756aff7f5696b3f3f53599c6ea013a3` |
| `fiber` | `e6e96bcd17e9efa1e42d111b0babd542e8e81ad8cfbb588576f888fa00aeec75` | `1357368517a75830a025b7129ed2aa0cfb586b19dc3d13c6f74c6a5b42338d58` |
| `paper` | `21097eb17fed09bbfb018f419d40c7dd9e29aad5d5993805c88707135dee2968` | `1cebdb7e905d4d50c11691ca180c5fc2cb267cd71c9eeca813bd483dd8a6a20a` |
| `hero-mobile` | `75d5a41a39f2c71189507aaa7631d12766b776d15942101b31120251d83cce37` | `e64876bb8e3da06b51026a092827174c7391453b74daa4415af8629a10faa224` |
| `nib-profile` | `4d1cf1b366d07078281bed3e0233f0829d1561ccadc2a77c709a9b87deb34965` | `a872ce2b023984350c12dc27e98d6a305d2e4075411793eaabc296ac662a99ee` |

## Selected Visual Bible

These eleven images are design references, including conceptual typography. They are not shipped as screenshots of the runtime interface: the live typography, controls, fluid geometry and scene transitions are authored separately. The first ten are 1672 × 941; the mobile study is 852 × 1846.

| Selected study | Delivered file | SHA256 prefix |
| --- | --- | --- |
| 01-metal | [01-metal.png](visual-bible/01-metal.png) | `ae078f8f4a253ce0` |
| 02-reservoir | [02-reservoir.png](visual-bible/02-reservoir.png) | `f4c44cac2d6b44fa` |
| 03-feed | [03-feed.png](visual-bible/03-feed.png) | `1994f135ae1b5e77` |
| 04-balance | [04-balance.png](visual-bible/04-balance.png) | `b8d478134afcfb30` |
| 05-slit | [05-slit.png](visual-bible/05-slit.png) | `e67e3a26de002796` |
| 06-meniscus | [06-meniscus.png](visual-bible/06-meniscus.png) | `740429e52e45736b` |
| 07-contact | [07-contact.png](visual-bible/07-contact.png) | `32593cf3d7940949` |
| 08-absorb | [08-absorb.png](visual-bible/08-absorb.png) | `93680f48ee94300d` |
| 09-write | [09-write.png](visual-bible/09-write.png) | `508c2e933ea93778` |
| 10-trace | [10-trace.png](visual-bible/10-trace.png) | `571e62f7443b3965` |
| 11-mobile | [11-mobile.png](visual-bible/11-mobile.png) | `701dc2dc2ea1f8f3` |

The table uses 16-character hash prefixes for readability; [PROVENANCE.json](PROVENANCE.json) contains every complete digest and all eleven retained concept prompts.

## Recorded generation and refinement lineage

| Record | Retained evidence |
| --- | --- |
| Selected Metal concept | The retained refinement prompt names the earlier generated input. It replaces heavy weathering with polished pale metal and reduces the attached liquid amount. The earlier input is recorded as lineage only and its rejected image is excluded. |
| Reservoir production plate | Explicit reference to the selected Reservoir concept. The retained edit removes typography and bubbles, preserves the liquid level and leaves the live surface to code. |
| Feed production plate | Explicit reference to the selected Feed concept. The retained edit removes text, labels and graphic annotations while preserving the diagonal channel and fin geometry. |
| Meniscus-fluid production asset | Two retained inputs: `artwork/originals/meniscus.png` and `docs/visual-bible/06-meniscus.png`. The generated liquid is registered to the separate metal-tip image. |
| Fiber production plate | Explicit reference to `docs/visual-bible/08-absorb.png`. The edit removes the baked ink and restores blank cellulose so the webpage draws absorption live. |
| Contact production asset | The complete extraction prompt survives and describes a supplied contact concept. Its exact input-file reference does not survive in the map; this gap is recorded. |
| Paper production plate | Complete blank-paper generation prompt retained; no input reference was recorded. |
| Hero, Slit and Meniscus production assets | Output identities and final files are preserved, but production prompts and exact input references were not retained. These fields remain null. |
| Hero-mobile production asset | Explicit reference to `docs/visual-bible/11-mobile.png`. The extraction preserves the separate portrait composition and a small optically distinct attached bead. |
| Nib-profile production asset | Explicit references to `artwork/originals/contact.png` and `artwork/originals/meniscus.png`. A generated low side-profile view supplies arched metal and feed thickness. It appears after the liquid-interface scale handoff and remains the registered nib throughout the paper scenes. |

All **11 concept prompts** and **8 of the 11 production prompts** are retained verbatim. A null input record is not evidence that no reference image was used. Missing prompts have not been reconstructed from the delivered result. The input maps were working records named `concept-map.json`, `asset-map.json`, `asset-additions.json` and `asset-finish-additions.json`; their relevant values are embedded in the portable provenance JSON, so the ZIP does not need the temporary working directory.

The two finish additions retain their exact supplied prompts. The mobile prompt requests 854 × 1846 registration, while the measured returned original is 853 × 1844; its input Bible image is 852 × 1846. The prompt remains unedited, and the final dimensions are recorded from the actual PNG and WebP. The side profile is 1672 × 941. These two material outputs extend the production set; the prior nine production pairs and all eleven Bible PNGs are unchanged. Formal review results are documented separately.

## Generated materials and authored systems

| Authored source | Responsibility |
| --- | --- |
| `src/renderer.js` | Composes separate image materials, applies controlled reflections, and carries the Ink Line. `enterPaper()` travels axially into the held meniscus, fills the lens with its optical material, then pulls back to the registered side-profile nib. |
| `src/fluid-scenes.js` | Builds the reservoir interface, longitudinal feed route and attached buffer wetting; constructs the Balance passages, rails, fins, ink and sparse returning air. A small dry crop of the generated Feed plate supplies surface grain, not the Balance geometry. |
| `src/paper-scenes.js` | Keeps the same side-profile nib registered against stationary paper, extends sampled photographic lacquer boundaries, constructs a liquid bridge, and draws one continuous reversible stroke. Local staining and sampled interstitial paths follow the material; raised photographic fibers partly occlude the wet body before its wet-to-matte finish. |
| `src/main.js`, `src/math.js`, `src/styles.css`, `index.html` | Provide the single scroll/animation clock, responsive framing, typography, narrative structure, accessible controls, reading view and reduced-motion behavior. |

The Meniscus-to-Contact handoff occupies global chapter progress `q = 5.56–5.82`; at `q = 5.72`, the held liquid’s own optical material occupies the lens. The camera then pulls back to `nib-profile`. The same image continues through Contact, the Absorb boundary, Write and the Trace departure. It is uniformly scaled by `0.90` relative to the scene base size and held at a fixed `−0.21` radians about `g.tip`, using the approximate source ink-tip position `(645, 831)`, normalized `(0.386, 0.883)`. This fixed registration is not an animated intermediate rotation. Paper stays stationary while the nib approaches. `contact.webp` remains the short landscape Hero material and a retained generation reference.

The fiber treatment uses brightness and opposed local samples as visual cues for spaces and raised crests. The staining, paths and partial fiber occlusion remain a material-informed interpretation, not measured three-dimensional fiber reconstruction.

Runtime crops, masks, compositing, lighting, cached material layers and code-generated paths are separate from the stored PNG-to-WebP conversion. Model parameters live in these source modules. No hidden external mesh, shader bundle, frame sequence or downloaded model is necessary.

## Research, rights and limits

Manufacturer and scientific sources were used to study anatomy, capillarity, ink/air exchange and paper uptake. [RESEARCH.md](RESEARCH.md) records the URLs, access date and access limitations. No research photograph, diagram or article figure is included. The generated objects do not claim to reproduce a named manufacturer’s product.

The mechanism is an authored qualitative interpretation. Menisci and fibers are magnified; air admission is sparse; fins buffer excess ink; paper draws the liquid; the chosen dye ink loses its wet reflection as a controlled trace remains. The scene does not claim measured pressures, exact flow rates or molecular simulation. See [MECHANISM.md](MECHANISM.md).

Original work is supplied as the user’s project material and receives **no additional license** in this package. AI-generated materials are explicitly identified without asserting exclusive copyright. Third-party software and fonts retain their individual licenses, including the proprietary GSAP standard license. See [ATTRIBUTION.md](../ATTRIBUTION.md) and the [vendor manifest](../licenses/vendor-manifest.json).

Inventory and hash checks are recorded here. Browser behavior, visual inspection and interaction results belong to the separate QA record. The work is delivered as one local source ZIP; no public deployment is part of its provenance.
