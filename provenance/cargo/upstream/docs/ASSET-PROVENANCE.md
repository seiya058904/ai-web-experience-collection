# CARGO — Generated asset provenance

Record date: **2026-11-09**. This register describes **12 retained image-generation outputs**, their actual retained files and current production roles. It is based on the [generation record](../art-direction/generation-record.json), [visual bible](../VISUAL-BIBLE.md), local image dimensions and source references. It does not claim that creation or file validation alone establishes browser visual fidelity.

## Tool, parameters and evidence

Every retained result is recorded as produced by **`image_gen.imagegen`**. The exact prompt for each ID is preserved verbatim in `art-direction/generation-record.json` under `images[].inputPrompt`. That record also preserves the tool name, output dimensions, retained path, production path, selection decision and rights note.

The returned record knows `transparent_background: false`. It does **not** report a generator model/version, seed, quality tier or hidden generation settings; none is invented here. Requested lens descriptions, aspect ratios and framing are art-direction prose inside prompts, not claims about returned tool parameters or real camera metadata. The full-resolution generated results were retained as compressed WebP design evidence; their dimensions are shown below.

There are three materially different opening candidates: a gantry scene, a warehouse object portrait and an elevated intermodal view. Candidate A is the selected direction. The other two remain inspectable as references. Their rejection as the opening does not mean every part of those images is unusable.

## Retained outputs

### AI-01 · Hero candidate A

- **Retained output:** [art-direction/AI-01.webp](../art-direction/AI-01.webp) — 1536 × 1024 pixels.
- **Delivery derivative:** none; retained for direction evidence.
- **Selection:** Selected concept for refinement; monumental gantry establishes the chosen world.
- **Current use:** Design evidence; refined into AI-04.
- **Exact prompt:** `images[id = "AI-01"].inputPrompt` in the linked generation record.

### AI-02 · Hero candidate B / object portrait

- **Retained output:** [art-direction/AI-02.webp](../art-direction/AI-02.webp) — 1536 × 1024 pixels.
- **Delivery derivative:** [public/media/warehouse.webp](../public/media/warehouse.webp) — 1536 × 1024 pixels.
- **Selection:** Not selected as the opening; retained for door, surface and object-study reference.
- **Current use:** Retained warehouse reference; technical chapters render shared geometry rather than this plate.
- **Exact prompt:** `images[id = "AI-02"].inputPrompt` in the linked generation record.

### AI-03 · Hero candidate C / intermodal geometry

- **Retained output:** [art-direction/AI-03.webp](../art-direction/AI-03.webp) — 1536 × 1024 pixels.
- **Delivery derivative:** none; retained for direction evidence.
- **Selection:** Not selected as the opening; retained for the relation of road, rail and yard.
- **Current use:** Design evidence only.
- **Exact prompt:** `images[id = "AI-03"].inputPrompt` in the linked generation record.

### AI-04 · Refined desktop hero

- **Retained output:** [art-direction/AI-04.webp](../art-direction/AI-04.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/hero.webp](../public/media/hero.webp) — 1584 × 991 pixels.
- **Selection:** Selected from the gantry direction, retaining a single grounded box and quiet left title space.
- **Current use:** CH-01 desktop photograph.
- **Exact prompt:** `images[id = "AI-04"].inputPrompt` in the linked generation record.

### AI-05 · Recomposed portrait hero

- **Retained output:** [art-direction/AI-05.webp](../art-direction/AI-05.webp) — 887 × 1774 pixels.
- **Delivery derivative:** [public/media/hero-mobile.webp](../public/media/hero-mobile.webp) — 780 × 1560 pixels.
- **Selection:** Selected for a tall gantry upright, upper fog and substantial lower container. Independently generated composition, not a crop of AI-04.
- **Current use:** CH-01 portrait picture source at 700 CSS pixels and below.
- **Exact prompt:** `images[id = "AI-05"].inputPrompt` in the linked generation record.

### AI-06 · Lift chapter keyframe

- **Retained output:** [art-direction/AI-06.webp](../art-direction/AI-06.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/lift.webp](../public/media/lift.webp) — 1584 × 991 pixels.
- **Selection:** Selected for the visible relationship of box, spreader, cables, gantry and vessel.
- **Current use:** CH-08 photograph; the separate mechanism study supplies deterministic contact states.
- **Exact prompt:** `images[id = "AI-06"].inputPrompt` in the linked generation record.

### AI-07 · Open-water keyframe

- **Retained output:** [art-direction/AI-07.webp](../art-direction/AI-07.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/sea.webp](../public/media/sea.webp) — 1584 × 991 pixels.
- **Selection:** Selected for ocean scale, right-side vessel and one identified red deck box.
- **Current use:** CH-09 photograph.
- **Exact prompt:** `images[id = "AI-07"].inputPrompt` in the linked generation record.

### AI-08 · Yard-to-lift midpoint reference

- **Retained output:** [art-direction/AI-08.webp](../art-direction/AI-08.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/midpoint.webp](../public/media/midpoint.webp) — 1584 × 991 pixels.
- **Selection:** Selected as a 50% composition reference with an opaque near beam and engaged spreader.
- **Current use:** Retained reference; TR-07-08 uses the live schematic study, not a claim of photographic simulation.
- **Exact prompt:** `images[id = "AI-08"].inputPrompt` in the linked generation record.

### AI-09 · Road chapter plate

- **Retained output:** [art-direction/AI-09.webp](../art-direction/AI-09.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/road.webp](../public/media/road.webp) — 1584 × 991 pixels.
- **Selection:** Selected as a distinct road environment with a visibly supported container.
- **Current use:** CH-04 photograph.
- **Exact prompt:** `images[id = "AI-09"].inputPrompt` in the linked generation record.

### AI-11 · Yard chapter plate

- **Retained output:** [art-direction/AI-11.webp](../art-direction/AI-11.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/yard.webp](../public/media/yard.webp) — 1584 × 991 pixels.
- **Selection:** Selected to establish grounded stacks, lanes and the selected container.
- **Current use:** CH-07 photograph; its small derivative also appears in Compare ports.
- **Exact prompt:** `images[id = "AI-11"].inputPrompt` in the linked generation record.

### AI-12 · Receiving-shore plate

- **Retained output:** [art-direction/AI-12.webp](../art-direction/AI-12.webp) — 1586 × 992 pixels.
- **Delivery derivative:** [public/media/shore.webp](../public/media/shore.webp) — 1584 × 991 pixels.
- **Selection:** Selected to establish a different port and warehouse approach while retaining the red subject.
- **Current use:** CH-10 photograph; its small derivative also appears in Compare ports.
- **Exact prompt:** `images[id = "AI-12"].inputPrompt` in the linked generation record.

### AI-10R · Corrected rail chapter plate

- **Retained output:** [art-direction/AI-10R.webp](../art-direction/AI-10R.webp) — 1585 × 992 pixels.
- **Delivery derivative:** [public/media/rail.webp](../public/media/rail.webp) — 1584 × 991 pixels.
- **Selection:** Selected after a semantic image-generation edit removed unwanted title lettering from rejected AI-10.
- **Current use:** CH-06 photograph.
- **Exact prompt:** `images[id = "AI-10R"].inputPrompt` in the linked generation record.

## The rejected rail output and its correction

The generation record separately lists **AI-10** as rejected because it contained unwanted baked title lettering. Its large original PNG is excluded from delivery. **AI-10R** is a genuine image-generation edit: the prompt asks to remove the lettering from the upper-left sky and preserve the train, container, landscape, lighting and camera composition. The retained corrected output is the source of `public/media/rail.webp`.

This distinction is intentional. Removing letters changes image content and was performed through the image-generation tool. Resizing or recompressing an already selected image does not perform that semantic edit. The rejected AI-10 is a recorded failure, not counted as one of the twelve retained outputs or quietly presented as clean artwork.

## Conversion and responsive delivery

Sharp was used for faithful WebP encoding and resizing of the selected delivery assets. These conversions optimize file size and dimensions; they do not redraw machinery, invent a missing support, add text or remove an object. The record does not supply exact Sharp version or encoder-quality settings, so this document makes no such claim. The art-direction originals remain available for comparison.

The landscape production images are approximately 1,584 pixels wide; smaller derivatives are approximately 800 pixels wide. The warehouse reference retains its original 1,536 × 1,024 size. The portrait generation is actually **887 × 1,774**, with a **780 × 1,560** production derivative. The requested phone composition was for a 390 × 844 CSS viewport; that viewport is not misreported as the generated file's pixel dimensions. Portrait cropping performed by a responsive viewport is distinct from deriving the portrait artwork by cropping the desktop master.

The live opening uses separate desktop and portrait sources. The port-comparison panel uses smaller yard and shore derivatives. Other retained small derivatives are available in the media directory; presence in that directory does not imply they are all fetched by the current page. `warehouse.webp` and `midpoint.webp` are retained reference assets rather than photographs displayed by the current technical chapters or transition renderer.

## Text, identity and physical interpretation

All meaningful titles, paragraphs, dimensions, controls and the fictional **CARGO / BOX-001** identity are authored as real HTML/DOM or accessible SVG. No image-baked label is relied upon as readable site content. The rail rejection demonstrates why clean photographic plates are required. The generation prompts prohibit company logos, invented markings, captions and UI.

The image world is photographic fiction. Prompts describe physical contact and continuity, but generated steel, cables, supports, scratches and perspective remain illustrations. The shared container study is authoritative for the project's explicit dimensions, hinges, cargo arrangement and evaluated support states. Fine hardware is schematic, and neither generated photos nor the model certify real equipment or prescribe safe handling.

The desktop hero, portrait hero, lift, sea and midpoint belong to the same restrained palette and lighting direction. They have different editorial tasks: orientation, vertical scale, contact, distance and occlusion. The photographs and the technical study are deliberately separate visual media; there is no claim that the photographs are frames from the model's renderer.

## Rights and retention

The per-image rights note records original generated output for this project, with no external photography or brand asset input. No exclusive rights or technical certification is asserted. These images are not relicensed under the third-party library or font licenses. See [LICENSES.md](../LICENSES.md) for the distinction and retained software notices.

The source handoff retains the compressed concept evidence, selected production assets and exact generation prompts. It excludes the rejected large AI-10 PNG, temporary raw exports and unrelated third-party media. Source references such as ISO, IMO, BIC and Hapag-Lloyd establish facts; their photographs, logos and technical diagrams are not used as art assets.

## Verification boundary

For this documentation pass, all twelve retained paths were checked for existence and pixel dimensions, and every recorded production path was resolved. **Rendered fidelity and complete browser visual acceptance are unverified. The current browser route did not serve CARGO, so that acceptance is blocked and no CARGO browser capture was acquired.** Use [requirements-evidence.md](requirements-evidence.md) and the final [QA report](QA-REPORT.md) for the actual verification status and routing limitation. The selection reasons above record the locked art direction and intended roles, not newly invented visual-review scores or browser PASS evidence.
