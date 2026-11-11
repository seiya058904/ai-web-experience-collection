# NIGHTSHIFT asset provenance

Reviewed on **2026-11-09**. This record accounts for **21 actual built-in image-generation calls and outputs**: eight required concept/keyframe assignments and thirteen supporting scene or comparison outputs. Three alternative hero concepts and the original closed-door platform reference are retained as compressed evidence; seventeen images are selected for the experience. EX-09 and EX-10 are the two additional matched CH-10 platform edits.

## Origin and rights boundaries

All photographic scenes are newly AI-generated illustrations of **fictional Meridian City**. They are not photographs documenting real workers, real patients, institutions, routes or schedules. No external documentary photograph, stock photograph, copyrighted character, logo or real-person likeness was supplied as a production asset. Image-edit inputs are earlier generated assets from this same project.

The tool was `image_gen.imagegen` (the built-in image-generation tool). The records retain the exact submitted English prompts. The tool did not return a seed, sampling configuration or model build identifier, so none is invented here. Requested ratios or camera language are prompt instructions, not verified camera metadata or guaranteed generator settings. Reference-path values below use portable paths to the shipped derivative of the same input; source identity and any path-at-call-time distinction are recorded in the JSON metadata.

Generated outputs are included as the artwork requested for this project, subject to the applicable image-generation service terms. This record does not claim exclusive copyright, grant a separate asset license, or guarantee rights beyond those terms. No external terms are quoted as having been reviewed for the image outputs. Third-party fonts and JavaScript libraries have their own notices in `THIRD-PARTY-NOTICES.md` and `licenses/`.

## Selection and final file map

Paths below are relative to the extracted source project. The source ZIP retains distributable WebP copies; full-resolution working PNGs are not required to build or run the site. SHA-256 values identify these final distributable files at this review.

| ID | Role | Decision | Final distributable path | Dimensions |
| --- | --- | --- | --- | --- |
| AI-01 | Hero candidate A | Concept retained; not selected as hero | `evidence/art/concept-street.webp` | 1586 x 992 |
| AI-02 | Hero candidate B | Selected direction; refined as AI-04 | `evidence/art/concept-window.webp` | 1586 x 992 |
| AI-03 | Hero candidate C | Concept retained; not selected as hero | `evidence/art/concept-platform.webp` | 1586 x 992 |
| AI-04 | CH-01 final desktop hero | Selected production asset | `public/media/hero.webp` | 1585 x 992 |
| AI-05 | CH-01 dedicated portrait hero | Selected production asset | `public/media/hero-mobile.webp` | 887 x 1774 |
| AI-06 | CH-06 rail inspection master | Selected production asset | `public/media/rail.webp` | 1586 x 992 |
| AI-07 | CH-09 market master | Selected production asset | `public/media/market.webp` | 1586 x 992 |
| AI-08 | TR-06-07 authored midpoint | Selected; actual transition middle image | `public/media/rail-water-midpoint.webp` | 1586 x 992 |
| EX-01 | CH-03 bakery before preparation | Selected production asset | `public/media/bakery-before.webp` | 1586 x 992 |
| EX-02 | CH-04 care corridor | Selected production asset | `public/media/care.webp` | 1586 x 992 |
| EX-03 | CH-05 curb before sweeping | Selected production asset | `public/media/curb-before.webp` | 1586 x 992 |
| EX-04 | CH-07 water gallery | Selected production asset | `public/media/water.webp` | 1586 x 992 |
| EX-05 | CH-08 utility inspection | Selected production asset | `public/media/utility.webp` | 1586 x 992 |
| EX-06 | CH-03 bakery after preparation | Selected comparison asset | `public/media/bakery-after.webp` | 1586 x 992 |
| EX-07 | CH-05 curb after sweeping | Selected comparison asset | `public/media/curb-after.webp` | 1586 x 992 |
| EX-08 | CH-10 original prepared tram reference | Reference retained; superseded in production by EX-09 / EX-10 | `evidence/art/platform-original.webp` | 1586 x 992 |
| EX-09 | CH-10 platform before first service | Selected photographic reveal plate | `public/media/platform-before.webp` | 1586 x 992 |
| EX-10 | CH-10 first service arrived and boarding | Selected photographic reveal plate | `public/media/platform.webp` | 1586 x 992 |
| EX-dawn | CH-11 return to the opening city | Selected production asset | `public/media/dawn.webp` | 1586 x 992 |
| EX-market-after | CH-09 first-light work result | Selected comparison asset | `public/media/market-after.webp` | 1586 x 992 |
| EX-atlas | CH-02 desk and notebook setting | Selected production asset | `public/media/atlas.webp` | 1586 x 992 |

## Derivatives, registration and fallback images

Production WebP conversion compresses the selected originals without replacing their depicted content. Small files in `public/media/fallback/` are reduced-resolution derivatives of the same named generated scenes, not additional independent image-generation outputs. They retain the target chapter identity during asset recovery. The three concept derivatives and original closed-door platform remain evidence and are not substitutes for completed story chapters. All retained paths in the three generation JSON records are relative shipped paths. Original generator output basenames and PNG hashes retain source identity; input reference paths are explicitly normalized to the shipped copy of the same input asset.

The bakery and curb after-edits returned at 1585 x 992 while their before-images returned at 1586 x 992. Both new platform edits also returned at 1585 x 992, one pixel narrower than their 1586 x 992 reference. These final comparison and platform WebPs have been normalized to 1586 x 992. The paired scenes preserve the camera and recognizable architectural or workbench landmarks closely, but generative edits are not asserted to be pixel-identical registrations. The intended differences are physical preparation, removed debris, organized stems, empty rails or an open tram door with a boarding passenger, not tint filters. Small incidental generative differences remain possible. The platform pair provides before/arrival photographic plates for a scroll-owned reveal; it is not a fully 3D tram animation or evidence of real public service operations. Its full-size WebPs use Pillow LANCZOS resizing and WebP quality 86 / method 6; its 512 x 320 fallbacks use quality 75 / method 6. These delivery operations change resolution and compression only.

AI-05 requested a 9:19.5 portrait composition; its actual retained output is 887 x 1774. This is disclosed as an independently authored portrait asset, not an exact 390 x 844 raster or a crop of the desktop hero. Responsive composition and text safety are validated in the browser evidence separately.

No image carries essential UI lettering. Real headings, narration, navigation, controls and diagram labels are DOM or accessible SVG text. The imagery supplies material and human context; diagrams supply explanatory geometry. Optional ambience is synthesized by original Web Audio code; no third-party sound recording is bundled.

## Individual generation records

### AI-01 - Hero candidate A

- **Decision:** Concept retained; not selected as hero.
- **Final file:** `evidence/art/concept-street.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `6a4269f6dd28a161970c40b0f36022dc9b32351464f8f58efdcb3e3399f1c438`.
- **Selection rationale:** A grounded worker and street establish the subject, but the close human framing gives less room for the ensemble city premise than the window direction.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT hero concept A, one worker against the sleeping metropolis. One wide 16:10 cinematic documentary photograph, no typography/logos/UI. Eye-height 35mm view of an empty wet street in fictional Meridian City at midnight. On the right third, one anonymous street maintenance worker fastening worn work gloves under a warm sodium-amber lamp, natural anatomy, face concealed by angle, wearing practical dark work jacket; stands safely on the pavement. Wet asphalt reflects restrained amber glints. Dense credible low and medium city buildings recede in honest perspective into dark steel-teal haze. Large quiet unlit upper-left area for future real DOM headline. Authentic surfaces, skin and fabric, respectful unposed human-scale work, richly detailed but not advertising or heroic pose, filmic grain and deep blacks with detail. Palette #0B1421 #203545 #E9A85F. No neon signage, brand names, traffic dangers, sci-fi, impossible buildings, or fake letters.

### AI-02 - Hero candidate B

- **Decision:** Selected direction; refined as AI-04.
- **Final file:** `evidence/art/concept-window.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `a476af88babab5c9ce131fe1813a4035a8d3999cc1a02f9a190a6f152db10b6b`.
- **Selection rationale:** A single warm room reads at human scale against a large quiet city. The sky offers a reliable title area, and the foreground window becomes a recognizable return landmark.

**Exact submitted prompt:**

Use case: photorealistic-natural. Asset AI-02, hero concept B for NIGHTSHIFT, a cinematic editorial website about night workers in fictional Meridian City. Create one exceptionally detailed wide landscape 16:10 cinematic photograph, no typography, no logos, no UI. Oblique view from beside a mid-rise building over an expansive believable sleeping city at midnight. At the lower-left/center third a SINGLE large, clearly readable amber-lit room window is seen slightly from outside; one small anonymous person in profile works at a table with one amber task lamp, face unidentifiable. The window has real thick mullions, rain-softened glass, restrained warm bounce, concrete wall. The room is large enough to recognize humanity, not a tiny irrelevant speck. To its right dense quiet city blocks and a wet curved street recede in honest perspective to a steel-blue horizon. The upper-left 38 percent is very quiet deep midnight ink sky and unlit architecture, deliberately low contrast to support large real website text later. Skyline horizon approximately 55 percent height. Four convincing depths: near window, mid buildings, long streets, atmospheric sky. Natural documentary 35mm lens, fine film grain, subtle mist, tactile wet materials, emotionally humane, extraordinary restrained cinematic quality. Palette midnight ink #0B1421, steel teal #203545, amber #E9A85F. Avoid cyberpunk, neon signs, mountains, futuristic city, identifiable faces, duplicated warm windows, decorative typography, exaggerated bloom, collage, or impossible building geometry.

### AI-03 - Hero candidate C

- **Decision:** Concept retained; not selected as hero.
- **Final file:** `evidence/art/concept-platform.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `e05ea5a492d99e0f55ec2d90ed834d4e23c9bdbb6ff86071e81518e5cadb1ce3`.
- **Selection rationale:** The platform is a credible working place, but its early dawn and transit-specific framing reveal the ending too early and narrow the opening premise.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT hero concept C, threshold before dawn. Wide 16:10 natural cinematic documentary photograph. Fictional Meridian City, quiet pre-dawn tram platform, anonymous staff silhouette left-of-center checking empty public space beneath pale warm work light, safe empty platform with no moving vehicle next to staff. Long-lens honest perspective through weathered steel and glass canopy, traces of condensation and soft steel-blue horizon, deep dark structural void occupying right third and upper-right for real website headline later. Intricate credible materials, slate-blue surroundings, restrained amber lamp, very faint dawn rose but no sunrise. Worker is human and legible without recognizable face, gloves practical. No busy passengers, no logos, no writing, no numbers, no UI. High-end documentary cinema, restrained and humane, absolutely no cyberpunk neon or melodramatic action.

### AI-04 - CH-01 final desktop hero

- **Decision:** Selected production asset.
- **Final file:** `public/media/hero.webp`.
- **Dimensions:** 1585 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** AI-02.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `7e9b19c32d6e0f870269b90d5e37fda29722ed8c84a8d0fdcb4a7ccd5cb8d431`.
- **Selection rationale:** Refines AI-02 while keeping the warm window, anonymous worker, lamp, wet street and skyline as the narrative landmarks.

**Exact submitted prompt:**

Use case: photorealistic-natural refinement. Image 1 is the chosen NIGHTSHIFT city hero. Preserve this EXACT city, oblique building geometry, rain-soft glass, single anonymous person at a desk, and one large amber-lit room in lower-left. Preserve the calm documentary mood and natural scale. Refine into a stunning final widescreen 16:10 production photograph: increase subtle legible concrete and window-frame detail, make amber lamp and its bounce more convincing, improve distant street layering and moist air without strong bloom. Keep title-safe upper 38 percent dark quiet sky, horizon near55 percent, window starts below41 percent height. Dark ink and steel teal background, honest amber. No new writing, logos, text, symbols, people, or duplicate lit foreground window. Final should retain all recognizable architectural landmarks for a later matched dawn return. Composition remains completely stable, no collage. Generate one finished photograph only.

### AI-05 - CH-01 dedicated portrait hero

- **Decision:** Selected production asset.
- **Final file:** `public/media/hero-mobile.webp`.
- **Dimensions:** 887 x 1774.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `01748e699791dba760817c575e3da138a59b36fa27f5b07fc220a85c1f8b09fd`.
- **Selection rationale:** An authored interior viewpoint retains sleeve, lamp and city scales on a narrow screen. This is an independent generation, not a desktop crop.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT dedicated portrait/mobile hero, a genuinely recomposed tall 9:19.5 photograph for a 390x844 screen, NOT a crop. Inside a quiet dark mid-rise room in fictional Meridian City looking outward through a tall slender rain-speckled window; upper 38 percent is uninterrupted midnight blue sky through glass, deliberately calm and low contrast for a real website two-line headline. Distant wet quiet streets and believable low-rise buildings below midpoint. In lower third, close anonymous worker sleeve and hand holding a pencil at a desk, warm amber task lamp with honest light falloff on worn wood, a small window mullion at the left edge, three distinct depths. Humane late-night work, room/window/city all legible at a small screen, luxurious understated editorial documentary cinema, midnight ink #0B1421 steel teal #203545 amber #E9A85F. Natural hand anatomy, no identifiable face, no visible writing or numbers or logos or UI. One coherent portrait composition, realistic materials, no cyberpunk, no giant bloom.

### AI-06 - CH-06 rail inspection master

- **Decision:** Selected production asset.
- **Final file:** `public/media/rail.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `97f92ea20ad4a47d926538d1894bae73e52f6e15340e84d9b15cda3fff4e0d3d`.
- **Selection rationale:** Twin rails, sleepers and fasteners give the middle act tangible scale; distant workers remain separated from any operational rolling stock. No train is depicted.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT AI-06 master image for chapter Between Trains. Wide landscape 16:10, exceptionally detailed cinematic documentary still in a fictional rail tunnel during a quiet scheduled inspection. Two straight parallel steel rails and believable sleepers, rough ballast and individual fasteners in near foreground, exact physically coherent vanishing point left of center. Two small anonymous workers in practical high visibility workwear stand far in the background beside stationary inspection lighting; NO trains anywhere. Narrow amber work lamps along steel-blue textured tunnel wall; a supported thick service pipe along left wall, damp worn concrete. Right third is deep blue textured tunnel wall with uncluttered low contrast negative space for real English DOM caption. Natural scale and elegant 35mm optics, steel contact shadows, real rail head profile, warm reflection along rail. Extremely high quality tactile materials, no fantasy, no lightning, no sci-fi, no labels or text or logos, no operational instructions.

### AI-07 - CH-09 market master

- **Decision:** Selected production asset.
- **Final file:** `public/media/market.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `a861d59e7f0066638ef912efe74b31d52724a65874520e01c8d3292fb72ddf25`.
- **Selection rationale:** Hands, stems, crates, a working aisle and canopy lamps show labor before opening rather than retail flower advertising.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT AI-07 late-section master photograph, market before opening in fictional Meridian City. Wide16:10 cinematic documentary still, blue predawn flower and produce wholesale market. On right foreground an anonymous worker's believable gloved hands sort loose stems into a scuffed timber crate, sleeves practical, face outside the frame. At middle depth a few ordinary scratch-marked produce boxes and handcart under translucent weathered canopy, amber task lamps above. Warm light catches thin petal edges and leaves, not a luxury bouquet or floristry advertisement. Far aisle opens to pale blue and a tiny hint of dawn rose, with no customers. Left lower area is quiet dark aisle shadow for an English caption to be added later in DOM. Detailed real physical contact, tiny droplets, humble working materials, coherent natural perspective, film grain, humane restrained cinema. No visible writing, labels, signage, brands, UI, or logos. No extra fingers, floating flowers, glossy luxury, neon, fantasy.

### AI-08 - TR-06-07 authored midpoint

- **Decision:** Selected; actual transition middle image.
- **Final file:** `public/media/rail-water-midpoint.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/core-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `c80639f99259d9dbe9fdd6d505fba64f96241a6cb0ee8b080be1bb866c06f5cc`.
- **Selection rationale:** An opaque near pipe and doorframe separate two coherent facilities. This is an editorial connection; it does not claim that railway and municipal water systems are one physical network.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT authored transition midpoint AI-08. One exceptionally beautiful widescreen16:10 cinematic photographic composition, halfway in an editorial passage between TWO SEPARATE underground facilities. Near camera in the middle-left a huge thick dark vertical cylindrical service pipe and opaque architectural door frame create REAL complete occlusion. Leftmost third shows a believable rail tunnel with two converging steel rails, sleepers, damp concrete and small amber worklights; rightmost half looks beyond the door frame into a separately coherent waterworks gallery of supported curving blue-gray thick pipes, flanges and concrete floor, a warm lamp and a small distant anonymous worker. Both spaces have stable same-height horizon, light direction and natural scale; image is a composed architectural match cut, NOT transparent double exposure, not physical shared plumbing, no hardware morph. Midnight ink and steel teal with restrained amber rim on central pipe. No text, UI, logos, gauges, numbers, trains, sparks, unsafe actions or fantasy machinery. Emphasize true thickness, contact shadows, real opacity and tactile worn materials.

### EX-01 - CH-03 bakery before preparation

- **Decision:** Selected production asset.
- **Final file:** `public/media/bakery-before.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `4f43d67db9e0640271b7234288c65f60089b99628ff033cc4180acca73c59467`.
- **Selection rationale:** Selected. Actual paired anonymous hands work dough; flour, scratched steel, baskets, warm oven, and cool window all read. Strong dark upper-left caption area. No readable lettering or facial identity. Useful before-preparation state.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT editorial scene, fictional Meridian City at 01:10, landscape 16:10 cinematic photograph. A working bakery before opening, modest lived-in kitchen seen from close workbench height with a natural 50mm lens. Anonymous baker's forearms and anatomically correct hands enter from right, one hand resting beside a loose mound of flour, the other drawing dough gently onto a scratched stainless steel table; no face visible. A cloth, flour dust, empty proofing baskets and neatly spaced simple tools establish actual preparation before baking, not a product advertisement. Single amber oven edge and a warm hanging worklamp at rear right, deep steel-teal window shadow left, plausible contact shadows and real tactile materials. Leave upper-left 30 percent as quiet dark negative space suitable for DOM caption later. Exactly one ordinary pair of hands. Cinematic documentary restraint, light film grain, rich natural dynamic range, palette midnight ink #0B1421, steel teal #203545, amber #E9A85F. No text, no logos, no UI, no letters, no figures on equipment, no luxury showroom, no hero loaf, no excessive flour cloud, no fantasy or neon.

### EX-02 - CH-04 care corridor

- **Decision:** Selected production asset.
- **Final file:** `public/media/care.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `ca7218f197aec38cb2dd8125f34aab23790db030da5d93df5544c5e22930f1b6`.
- **Selection rationale:** Selected. Two anatomically plausible hands set a water glass beside folded linen. Quiet cool corridor is distinct from kitchen; no patient or identifiable clinical data. Warm right foreground and cool left corridor provide two content beats.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter The Quiet Corridor, fictional Meridian City at 01:50, landscape 16:10 cinematic documentary photograph. Intimate human-scale night-care corridor with pale sea-glass low floor lighting and cool satin walls receding to a closed unmarked door; a quiet unattended nursing work station occupies foreground right. Close anonymous hands in plain dark teal sleeves carefully set a clear water glass beside a neatly folded cream blanket on a clean enamel tray; no patient, no face, no medical records, no operational medical procedure, no readable signs. Show linen fibers, glass condensation, soft contact shadows, a restrained warm task lamp under a shade, corridor glass reflections. Compose from low chest height, 65mm lens, believable scale; left third offers calm dark corridor negative space for later real DOM type. The activity is mundane care, not emergency spectacle. Color palette midnight ink #0B1421, cool steel teal #203545, low sea-glass and small amber #E9A85F. Fine cinematic grain, photographic realism, beautifully restrained. No typography, logos, UI, screen data, patient details, alarms, neon, advertising, collage or duplicated hands.

### EX-03 - CH-05 curb before sweeping

- **Decision:** Selected production asset.
- **Final file:** `public/media/curb-before.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `990fa7bb69713b66d594f5e455ed747c71c193b4a3fdbc53e00f032ebfc5b8b8`.
- **Selection rationale:** Selected. Near leaves, grit and a small blank paper scrap are distinct from wet reflections. Same curb remains visible far into perspective; worker and broom contact pavement at rear-right. Suitable fixed-camera before/after input.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter A Clean Start, fictional Meridian City at 02:25. Landscape 16:10 cinematic documentary photograph with an exact stable camera suitable for a later same-view comparison. Low curb-height view of a wet quiet city sidewalk and road at night. Strong clear stone curb runs diagonally from lower-left foreground toward middle-right vanishing point, with two subtle parallel paving lines and warm reflected light. Real accumulated leaves, a few small scraps of ordinary unmarked paper and loose grit lie along the near curb, enough to make a later sweeping result meaningful but no disgusting mess. In middle-right distance a single anonymous sanitation worker in plain dark workwear holds a grounded long-handled broom against pavement under a warm lamp, no visible face, no moving vehicles. Deep steel-blue buildings, one dark doorway and believable rain sheen, controlled sodium amber reflection. Keep EXACT coherent perspective, texture and landmarks throughout; left upper quarter dark and quiet for real text added later. Natural 35mm lens, realistic cobbles, rubber boots contacting ground, fine grain. Palette midnight ink #0B1421, steel teal #203545, amber #E9A85F. No text, logos, warning signs, license plates, UI, neon, unsafe roadway staging, floating brush, advertising or glamour pose.

### EX-04 - CH-07 water gallery

- **Decision:** Selected production asset.
- **Final file:** `public/media/water.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `5a3640dc3a25b7bd2ff267efc40429af78b890d643ed6f61c4616d866159ad8f`.
- **Selection rationale:** Selected. Near bolted flange, condensation, structural supports and real pipe thickness read clearly; distant anonymous worker with log supports human attention beat. Upper-right dark ceiling is text-safe. Represents a separate fictional water gallery, not a continuation of rail plumbing.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter Water Below, fictional Meridian City at 03:35. One landscape 16:10 cinematic documentary photograph of a quiet water utility pipe gallery, no text or UI. A large curved matte steel-teal water pipe in the near left foreground has convincing thickness, worn paint, bead condensation, a substantial bolted flange, heavy brackets and contact shadows. Several physically separate supported pipes recede along a clean narrow gallery to the right, plausible stable horizon and real damp concrete. A small anonymous adult worker stands well back right under an amber worklamp, holding a blank-looking logbook; face unidentifiable, not manipulating machinery. The scene feels maintained and quiet, no hazardous spectacle, no operational instructions, no exposed controls or numbers. Light comes from restrained warm practical lamps and a faint cool predawn clerestory. 35mm human-scale natural camera, exquisite natural materials, fine cinematic grain; palette #0B1421 midnight ink, #203545 steel teal, #E9A85F amber. Keep a calm negative area at upper right for later real DOM caption, but the environment remains tangible, never empty wallpaper. No writing, logos, signs, readouts, glowing pipes, tunnels merging with railways, fantastical plumbing, arc flashes, overdone bloom or neon.

### EX-05 - CH-08 utility inspection

- **Decision:** Selected production asset.
- **Final file:** `public/media/utility.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `afec7214a6904a178df4dc44f097950bed8c991ef0bfa40bf3a61cf21ff4b496`.
- **Selection rationale:** Selected. Cabinets stay closed; anonymous worker only observes them; warm lamp, rain-glass pane and distant canopy establish the light-to-market handoff. Clipboard has faint non-legible marks and is not a source of UI information. No operating settings or exposed circuitry.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter Light on Duty, fictional Meridian City at 04:05. Create one landscape 16:10 restrained cinematic documentary photograph, no text, no logo, no UI. A modest utility inspection room at predawn; simple CLOSED matte steel equipment cabinets with small generic mechanical latches, NO readable meters, settings, labels, symbols or screens. A warm amber worklamp hangs in upper-right field beside a tall rain-streaked window pane, beyond it a very distant market canopy and a hint of pale blue predawn. In middle-ground right an anonymous worker in plain dark workwear observes the closed cabinet with clipboard angled away and unidentifiable face, hands relaxed and no interaction with exposed electrical parts. Near-left foreground has a substantial dark window mullion and floor edge turning a believable corner, useful as an opaque scene transition anchor; left 30 percent has quiet deep ink negative space for real DOM caption. Natural 50mm perspective, brushed metal scratches, rubber cabinet gaskets, worn gloves tucked at belt, subtle contact shadows, no theatrical fog. Match humane night-city photography: midnight ink #0B1421, steel teal #203545, amber #E9A85F with very subtle predawn rose. No visible live wires, arcs, sparks, warning labels, circuit diagrams, industrial spectacle, brand names, distorted anatomy or advertising.

### EX-06 - CH-03 bakery after preparation

- **Decision:** Selected comparison asset.
- **Final file:** `public/media/bakery-after.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** EX-01.
- **Recorded parameters:** `{"transparent_background": false, "referenced_image_paths": ["public/media/bakery-before.webp"]}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `48d98c0b22eb361e33e2397efe70481f0d3b75b7177c87a6937a92be5438ff55`.
- **Selection rationale:** Selected. Clear material preparation change: six dough portions, less loose flour, ready scraper and folded cloth. Same table, baskets, window, lamp and background perspective visually retained; same sleeves and anonymous hands. AI edit is not asserted to be pixel-identical. Returned 1585x992 versus 1586x992 original; normalize final delivery dimensions consistently before comparison UI.

**Exact submitted prompt:**

Use case: precise-object-edit. Edit the supplied NIGHTSHIFT bakery photograph to show AFTER preparation, for an exact same-camera before/after comparison. Preserve the photograph's camera, 1586x992 landscape composition, viewpoint, lens, all background edges and perspective, left dark wall, tall window panes, city beyond, oven, ceiling lamp, basket positions, workbench rim, lighting, palette and exposure. Keep the same anonymous baker's identity and sleeves entering from right. Change only the working state on the steel table and hand pose: the single pulled piece of dough and loose mound of flour are now a tidy set of five or six small prepared dough portions, hand shaped and arranged ready for the first bake. One hand gently finishes the last portion; the other rests naturally. Tidy loose flour into a light realistic dusting on the work area, move the existing scraper into its ready position, fold the existing cloth simply at lower-left without adding any new object. Preserve realistic worn scratched steel, ordinary work and anatomy. No baked bread, no product advertising, no additional people. This is a material work-progress change, NOT a relighting or color filter. Everything outside these small tabletop and hand regions must remain the SAME image and align under a comparison wipe. No typography, numbers, labels, logos, icons, or UI.

### EX-07 - CH-05 curb after sweeping

- **Decision:** Selected comparison asset.
- **Final file:** `public/media/curb-after.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** EX-03.
- **Recorded parameters:** `{"transparent_background": false, "referenced_image_paths": ["public/media/curb-before.webp"]}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `f3b744a38ab8f0cae0673964df80f747e4a06cedae3d19d4a666eacb06eac6a6`.
- **Selection rationale:** Selected. Leaves, grit and paper are removed from near curb/gutter exposing genuine worn paving and the curb edge; wet reflections and stains remain. Same diagonal camera geometry and building/lamps visually retained, worker/broom naturally adjusted. AI edit is not asserted to be pixel-identical. Returned 1585x992 versus 1586x992 original; normalize delivery dimensions consistently.

**Exact submitted prompt:**

Use case: precise-object-edit. Edit only the cleaning state in the supplied NIGHTSHIFT street photograph to create AFTER sweeping, for an EXACT registered before/after wipe. Preserve the identical camera, image framing, lens, vanishing point, all curb and paving geometry, building and doorway, window frames, streetlamps, sky, wet amber reflections, color palette and exposure. The exact near diagonal curb is the anchor and its edge MUST remain fixed pixel-for-pixel in screen space. Remove the scattered leaves, loose grit and single paper scrap along the near curb and gutter to reveal actual worn cobblestone paving and a clearer curb edge. Do not turn the entire street spotless: retain wet patches, stains, fine uneven texture, occasional tiny remaining debris farther away. Keep the same anonymous worker and clothing, move them only a small distance farther along the same pavement with a naturally grounded broom; no face visible and no new people or vehicles. Change no architecture or lighting. This is real debris removal and exposed paving detail, NOT merely a tint/filter. Everything beyond the cleaned gutter and small worker/broom region must remain the SAME image. No text, numbers, labels, signs, UI or logos.

### EX-08 - CH-10 original prepared tram reference

- **Decision:** Retained source evidence; superseded in production by EX-09 and EX-10.
- **Final file:** `evidence/art/platform-original.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen`.
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `c3310457276758a84f15d6feb50ddb91e1b823ea98a1229716c1b9dd136a226f`.
- **Selection rationale:** Retained as the original reference for EX-09 and EX-10. The closed-door prepared tram established the camera, canopy, platform and dawn palette. Replaced in production by the two matched scene-state edits so the chapter can show empty rails followed by open-door arrival and boarding.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter First Service, fictional Meridian City just before dawn, one landscape 16:10 cinematic documentary photograph. A believable modest urban tram platform at human eye height beneath a dark canopy of satin-steel beams. One prepared stationary generic tram occupies the right side, realistic restrained cream and steel-teal body, coherent proportions, repeated warm window panes, closed door at safe platform level; no branding, route text, numbers, logos or destination display. On the far left platform three small anonymous first passengers in everyday coats stand safely well back from the track edge, faces unidentifiable; no worker on tracks, no approaching train. A substantial foreground canopy column frames the left third, a warm floor guide and paving lines lead into distance, clear horizon near mid-height; subdued blue and soft rose predawn sky beyond and low-rise city beginning to appear. Rain-damp paving retains plausible reflections, rubber seals and brushed steel have real material detail. Quiet spacious composition, humane 35mm natural lens, fine cinematic grain, no high-speed blur. Palette midnight ink #0B1421, steel teal #203545, amber #E9A85F, muted predawn rose #DDA6A0. Keep upper-left dark structural void for later real DOM caption. No typography, labels, UI, neon cyberpunk, fantasy architecture, luxury advertising or crowds.

### EX-09 - CH-10 platform before first service

- **Decision:** Selected photographic reveal plate.
- **Final file:** `public/media/platform-before.webp`.
- **Dimensions:** 1586 x 992 delivered; 1585 x 992 returned by the tool.
- **File size:** 216,956 bytes.
- **Tool:** `image_gen.imagegen` (built-in).
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** EX-08, retained unchanged as `evidence/art/platform-original.webp`.
- **Recorded parameters:** `{"transparent_background": false, "referenced_image_paths": ["evidence/art/platform-original.webp"]}`.
- **Reference path note:** Reference path normalized to the unchanged EX-08 file shipped with this project. The actual call read public/media/platform.webp while that path still contained EX-08, before EX-10 replaced it.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **Generation output name:** `exec-82e8ad49-17cc-464c-a683-fbe9a5695815.png`.
- **Original PNG SHA-256:** `33591a856f0180abb1d61c3c25c58b4dabb19ed981987abe03eb0aa1983defba`.
- **SHA-256:** `21b5975960af53484122d5803942db1f830869574e6ddc5e891dc42b18596146`.
- **Fallback:** `public/media/fallback/platform-before.webp`, 512 x 320, 18,774 bytes; SHA-256 `25a0803e530f7c6fa1dae395b088eacee4c7a01bb6dd6ceae48e1029869ea6f7`.
- **Selection rationale:** Selected. The tram is absent and continuous empty rails reveal the distant city. The same three anonymous waiting figures remain far left, clear of the platform edge. The canopy, foreground column, wet paving, dawn sky and perspective landmarks closely match EX-08. The generated width was 1585 pixels and is normalized to 1586 for delivery. This is a photographic reveal plate, not 3D vehicle motion or guaranteed pixel registration.

**Exact submitted prompt:**

Use case: precise-object-edit. Edit the supplied NIGHTSHIFT platform photograph into the BEFORE first service state for an exact same-camera editorial sequence. Preserve the reference camera, landscape16:10 composition, foreground steel column position, canopy beams and lamps, pavement tiles and tactile edge strip, rails perspective, all distant buildings and trees, dawn blue/rose sky, rain sheen and amber reflections. REMOVE THE TRAM ENTIRELY from the right half, including roof, wires specifically attached to its pantograph, windows and body, and fill only the newly revealed space with physically plausible empty parallel tram rails and the same distant low-rise city background. Keep the fixed overhead route wires and their supporting poles coherent. The platform is waiting before the first vehicle. Preserve the SAME three anonymous waiting people at far left, safely well back from the platform edge; no new people, no face identification, no worker on the tracks. The empty track area must have continuous realistic rails, sleepers and ballast with correct vanishing point. All other existing architectural landmarks should stay fixed and visually registered to the source. This is a real change in scene contents, not a tint change. Restrained cinematic documentary photography, no motion blur, no fake panorama, no typography, labels, route numbers, signage, logos or UI. It is a fictional scene, not a real public transport operating instruction.

### EX-10 - CH-10 first service arrived and boarding

- **Decision:** Selected photographic reveal plate.
- **Final file:** `public/media/platform.webp`.
- **Dimensions:** 1586 x 992 delivered; 1585 x 992 returned by the tool.
- **File size:** 203,352 bytes.
- **Tool:** `image_gen.imagegen` (built-in).
- **Source record:** `docs/supplemental-art.json`.
- **Input asset:** EX-08, retained unchanged as `evidence/art/platform-original.webp`.
- **Recorded parameters:** `{"transparent_background": false, "referenced_image_paths": ["evidence/art/platform-original.webp"]}`.
- **Reference path note:** Reference path normalized to the unchanged EX-08 file shipped with this project. The actual call read public/media/platform.webp while that path still contained EX-08, before EX-10 replaced it.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **Generation output name:** `exec-952e40ea-e1b9-42c9-b532-9b6f207d079f.png`.
- **Original PNG SHA-256:** `670635a954d81db9b9bad8683e8bf870c398307b15f48265b7e28613ea4eaf17`.
- **SHA-256:** `4534e8b883e7af9877bddc4624ff0b1a38485a0171ad992a4face2b763bb34b3`.
- **Fallback:** `public/media/fallback/platform.webp`, 512 x 320, 19,240 bytes; SHA-256 `f060286f842d994f3c93d028958360d66d4d5b19b01151cf5ec70db80375c5a2`.
- **Selection rationale:** Selected. The stationary tram has one clearly open passenger door with a lit interior and visible boarding step. One anonymous passenger begins boarding while two remain waiting at far left; no identifiable face or person on the tracks. The fixed camera, canopy, foreground column and warm window rhythm closely match EX-08 and EX-09. The generated width was 1585 pixels and is normalized to 1586 for delivery. This is a photographic arrival-state plate, not 3D vehicle motion or guaranteed pixel registration.

**Exact submitted prompt:**

Use case: precise-object-edit. Edit the supplied NIGHTSHIFT platform photograph into the ARRIVED first-service state for a matched editorial sequence. Preserve the exact original camera and16:10 framing, foreground canopy column, beams, lamps, wet paving and tactile edge line, dawn blue/rose light, distant city, rail geometry, tram body position/shape and repeated warm window rhythm. The tram is fully STATIONARY at the platform. Open ONE clearly visible passenger door at the existing central-right doorway, with mechanically plausible inward or sliding door panels, warm interior handrail and a safe visible boarding step aligned with the platform. Of the existing three anonymous waiting people, keep TWO at far left and move ONE ordinary anonymous passenger to the opened doorway, viewed from behind in a muted coat, beginning to board from the safe platform, one natural foot on the boarding step and one hand lightly holding an interior rail. No identifiable face, no distorted anatomy, no unsafe gap, no person on tracks, no additional people. Keep all fixed architecture, tram dimensions, materials and lighting as close to the reference as possible so a scroll-owned before/arrival reveal reads as the same camera. This is a quiet material change of work becoming public life, not an advertisement or dramatic action. No typography, route display, words, digits, labels, brand marks or UI. Fictional city scene only, no real service claim.

### EX-dawn - CH-11 return to the opening city

- **Decision:** Selected production asset.
- **Final file:** `public/media/dawn.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/additional-art.json`.
- **Input asset:** AI-04.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `bc8edd54b7f701a3a70644222e7f83712bcc1155daf0f93f7107ac4306d7f69d`.
- **Selection rationale:** The original foreground window, lamp, facade and receding street return in diffuse dawn; the empty chair and closed notebook retain a trace of the night worker.

**Exact submitted prompt:**

Use case: lighting-weather edit. Image 1 is NIGHTSHIFT's actual midnight hero; preserve the EXACT camera, facade, foreground window with identical mullions, building edges, chimney outlines, streets and distant skyline geometry. Change ONLY the time of day and related small narrative traces to early washed silver dawn. Same front room lower-left now gently lit by cool diffuse daylight, task lamp switched off, anonymous worker has left the chair and one neatly closed notebook remains; do not relocate the furniture. Street in right distance softly begins morning with two or three tiny unidentifiable pedestrians, no dense traffic. Muted pale rose at the low horizon, washed morning #E5EAE9, restrained blue-gray architecture and ordinary warm residual streetlights. NOT bright noon or orange sunset. Architecture must precisely match reference as a remembered return. Keep quiet upper sky for DOM title. Extremely fine original film texture and natural material detail, believable dark-to-light change, no text, logos, UI or numbers.

### EX-market-after - CH-09 first-light work result

- **Decision:** Selected comparison asset.
- **Final file:** `public/media/market-after.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/additional-art.json`.
- **Input asset:** AI-07.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `7a9eefb5048f5b89902efa417ae20c90d8a28fd6701e3a2f801fd78b296c4439`.
- **Selection rationale:** Stems are organized into bundles in the same working crate. The activity has a visible result beyond the subtle change in light.

**Exact submitted prompt:**

Use case: precise-object-edit. Image 1 is the NIGHTSHIFT market sorting photograph. Preserve EXACT camera, background city silhouette, canopy beams, lamp positions, all fixed crate corners and handcart. Show the SAME place a little later as first light reaches the aisle: the loose flower stems in front are now carefully sorted in tidy bundles inside the SAME scuffed crate, produce crates arranged for opening, worker's same anonymous sleeves and hands resting at crate edge after completing sorting. No faces. Add cool soft dawn light subtly from left exit while retaining amber lamps. Essential change is real visible organization of flowers/crates, not just a color filter. Keep wholesale work atmosphere, no luxury advertising, no customers, no text/logos/numbers/UI. Natural anatomy and physical contacts, honor all scene geometry.

### EX-atlas - CH-02 desk and notebook setting

- **Decision:** Selected production asset.
- **Final file:** `public/media/atlas.webp`.
- **Dimensions:** 1586 x 992.
- **Tool:** `image_gen.imagegen (built-in)`.
- **Source record:** `docs/additional-art.json`.
- **Input asset:** None; independent generation.
- **Recorded parameters:** `{"transparent_background": false}`.
- **Not returned by the tool:** seed, exact model build and sampling settings.
- **SHA-256:** `dfc19fba9fc338ac3def794d0c806c9eea22dbbb5efff9675e49331292e1054e`.
- **Selection rationale:** Blank tactile paper and an amber reflected edge provide a real surface for the accessible fictional SVG atlas. All meaningful map labels are authored as selectable vector or DOM text.

**Exact submitted prompt:**

Use case: photorealistic-natural. NIGHTSHIFT chapter night atlas, a quiet editorial notebook still life, widescreen16:10. Overhead oblique view of a dark worn wooden work desk beside a rain-spotted nighttime window with distant tiny amber city reflections. A large open unmarked aged blue-gray paper notebook lies toward center-right, two overlapping plain sheets, thin unsharpened pencil, a little glass tumbler, small warm desk lamp out-of-frame making one amber reflection down paper edge. Paper must be completely BLANK, no text, no street lines, no typography or numbers; the actual illustrative city diagram will be drawn as accessible vector on website. Left third and upper area naturally dark navy negative space. Premium tactile editorial photography, realistic subtle contact shadows, human presence only through recently used materials, not stock office photograph, not sci-fi or dashboard. Palette midnight ink, steel teal, small working amber. Quiet restrained cinematic texture.

## Verification limits

The image records prove generation, retained output identity and visual selection. They do not independently establish browser usability, transition continuity, accessibility conformance, hardware frame rate or production performance. Consult the requirements and browser evidence ledgers for those separate acceptance results.
