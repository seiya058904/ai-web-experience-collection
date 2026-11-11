# Chapter implementation ledger

This ledger accounts for **eleven content chapters and twenty-two observation beats**. It was reconciled against `src/content.js`, `src/ui.ts`, `src/interactions.ts`, `src/media.ts`, `src/diagrams.ts`, `src/image-loader.ts`, `src/main.ts`, `index.html`, and the responsive styles. It describes the implemented surfaces and intended learning results.

## Evidence and continuity boundaries

All eleven chapter sections have reported structural checks in phone, tablet and desktop browser layouts. The final QA report and evidence index own the exact browser versions, viewports, actions, captures and outcomes. **See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.** This document does not independently certify visual quality or every control's acceptance.

Incoming and outgoing identities below are **editorial reference cues between distinct illustrated plates**. The transition code uses named anchors, framing transforms and an incoming clip mask. These cues do not prove identical physical geometry, pixel registration, measured scale or a continuously observed biological process. Difficult events are selected poses and comparisons.

All two-beat texts below are reproduced exactly from the shared content module. The main interactive hero has an intentional heading and lead override, documented in CH-01. No loader, navigation screen, transition wrapper or footer is counted as a chapter.

## Shared alternatives and controls

- **Motion: Reduced** preserves content and interaction results while removing or reducing animated treatment. The operating-system preference is respected.
- **View as stills** hides transition wrappers and retains the eleven content sections and their controls. It is separate from the no-script reading edition.
- `public/reading.html` includes all eleven chapters, both beats per chapter and the meaningful comparison states in static document flow. Its wording adapts interaction instructions where needed.
- Source/illustration-note buttons display the corresponding chapter's references and interpretation limits. Dialogs use native dialog behavior and explicit close/focus-return handling.
- The segmented controls expose pressed states. Their keyboard handler supports Left/Right, Home and End. Actual input and focus acceptance belongs to the QA evidence.
- Target-specific embedded image previews are defined in `src/fallbacks.json`. A recoverable full-image error exposes **Retry** and preserves the text; image identity remains owned by its picture element.

## CH-01 — An Egg in the Green

**Section:** `#ch-01`. **Rendered heading:** The interactive `<h1>` is **Everything changes from here.** The stored chapter heading is **The smallest beginning.**, which is used in the reading edition. The interactive hero lead is **Beneath a single milkweed leaf, a life begins in a form almost too small to see.** Its two observation beats are rendered below the hero by `main.ts`.

### Two content beats

1. **A world beneath a leaf** — Look for the point where the pearl-colored egg meets the leaf. The plant is already part of this life.

2. **A surface with structure** — The ridged casing is called the chorion. Its small, raised lines belong to an eggshell, not a smooth glass sphere.

### Distinct result and control behavior

The egg is introduced as a ridged biological casing on a host plant. **What am I seeing?** opens the species/interpretation dialog; **Begin the transformation** navigates to CH-02. The source button opens the chapter-specific references and illustration disclosure.

**Incoming identity:** The first meaningful egg-and-leaf plate begins the story.

**Outgoing identity:** TR-01-02 introduces the wider host plant using the egg-bearing vein as the stated editorial reference.

**Media and implementation:** `index.html` owns the hero markup. `public/assets/ai-04-hero.webp` is the desktop plate; `public/assets/ai-05-mobile.webp` is a separately composed portrait source. `src/main.ts` inserts the two beats and source control. No chapter-specific SVG factory is needed.

**Mobile and still equivalents:** At widths up to 700 CSS pixels, the picture selects the portrait asset. The two observation beats stack in normal flow. Reduced motion retains the hero and controls; still view removes the adjacent bridge. `public/reading.html#ch-01` contains the stored chapter heading, both beats, a species note and the hero image.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-02 — Milkweed, the Host

**Section:** `#ch-02`. **Rendered heading:** **The plant is part of the story.**

### Two content beats

1. **Follow the vein** — The same marked leaf leads into the larger plant. What looked like a vast green landscape is a small part of the habitat.

2. **A place to begin** — Milkweed supports the larval stage. Later, the adult will seek nectar from flowers: one habitat must serve different needs.

### Distinct result and control behavior

The visitor connects the egg to milkweed as the larval host. **Show the host plant** reveals a botanical outline and explanatory text; activating it again hides the outline and updates the expanded state.

**Incoming identity:** TR-01-02 arrives from the egg-bearing vein into the plant view.

**Outgoing identity:** TR-02-03 redirects attention from the host leaf toward the egg and hatching observation.

**Media and implementation:** `public/assets/ai-02-host.webp`; `src/diagrams.ts` → `hostDiagram()`; `src/ui.ts` → the botanical chapter and `#host-study`; `src/interactions.ts` → `#host-toggle`.

**Mobile and still equivalents:** The desktop botanical spread becomes a single column on phones. The same host plate uses responsive framing; it is not a separately generated phone asset. The native button and diagram remain available with reduced motion and still view. The reading edition includes the outline without requiring a toggle.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-03 — The Shell Opens

**Section:** `#ch-03`. **Rendered heading:** **A first opening.**

### Two content beats

1. **The edge gives way** — Observe the opening in the shell before looking for the animal. The leaf stays fixed while the first small movement changes the scene.

2. **A larva, newly here** — The hatchling remains tiny beside the casing. A young monarch also eats its eggshell before continuing to its host plant.

### Distinct result and control behavior

A shell opening and a tiny hatchling are distinguished. **The intact shell**, **A first opening**, and **The hatchling** select three authored SVG poses and captions. The macro illustration is a reference image and does not change into three photographic frames.

**Incoming identity:** TR-02-03 follows the stated vein/egg reference into the hatching plate.

**Outgoing identity:** TR-03-04 introduces the neighboring feeding margin, with the shell edge named as a contextual landmark.

**Media and implementation:** `public/assets/ai-09-hatch.webp`; `src/diagrams.ts` → `hatchDiagram(0..2)`; `src/ui.ts` → `#hatching-diagram` and `#hatching-caption`; `src/interactions.ts` → the `hatching` selector.

**Mobile and still equivalents:** The title, macro window and inspector stack on phones. The selector remains available with reduced motion and still view. The reading edition places all three labeled diagrams in document flow; no playback is required.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-04 — The First Meal

**Section:** `#ch-04`. **Rendered heading:** **The first bite of a new life.**

### Two content beats

1. **At the mouth** — Find the feeding point beside the head. The altered leaf margin records a local action, not damage scattered across the scene.

2. **A small absence** — Compare the two views. The same leaf and young larva remain; a crescent of missing tissue makes the feeding visible.

### Distinct result and control behavior

The visible feeding change is located at the larva's mouth. **Before feeding** and **After feeding** change the comparison diagram and descriptive caption. The visible **Compare the diagram below.** note identifies the affected surface; the macro artwork remains unchanged.

**Incoming identity:** TR-03-04 brings the shell/hatchling context toward the feeding site.

**Outgoing identity:** TR-04-05 uses the crescent-shaped margin as an editorial bridge into the indexed instar comparison.

**Media and implementation:** `public/assets/ai-10-feeding.webp`; `src/diagrams.ts` → `feedingDiagram(false/true)`; `src/ui.ts` → `#feeding-diagram` and `#feeding-caption`; `src/interactions.ts` → the `feeding` selector.

**Mobile and still equivalents:** Phone layout places the copy and controls before the macro artwork, followed by the diagram and both beats. Reduced motion does not remove comparison results. The reading edition presents the before/after diagrams together.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-05 — Five Instars

**Section:** `#ch-05`. **Rendered heading:** **Growth has five chapters of its own.**

### Two content beats

1. **Growth between molts** — An instar is a larval stage between molts. Monarchs pass through five; shedding the old cuticle allows growth to continue.

2. **Look beyond size** — Compare the head, bands and filaments. Select each specimen to see the differences, then bring all five back into view.

### Distinct result and control behavior

An instar is explained through growth and identifying features. **Instar 1–5** changes the independently parameterized specimen, title and caption. **Show all** restores the five-specimen comparison and five descriptive notes. Differences include body profiles, head proportions, banding, filaments and proleg markings.

**Incoming identity:** TR-04-05 moves from a feeding illustration to a deliberately abstract specimen register.

**Outgoing identity:** TR-05-06 introduces a nearby plant support and the mature larva's hanging posture.

**Media and implementation:** `src/diagrams.ts` → `instarDiagram(0..5)`; `src/content.js` → `instars`; `src/ui.ts` → the specimen workbench, `#instar-name`, `#instar-caption`, and `#instar-all-notes`. This chapter's main specimen media are authored SVGs, not a new generated macro photograph. The no-script reading edition also includes the feeding reference plate.

**Mobile and still equivalents:** On phones the six controls use a three-column grid, while the five notes stack. A selected specimen receives the full diagram width. Still/reduced modes retain every selector result. The reading edition renders five separately labeled specimen diagrams. Display sizes are explicitly not measured lengths.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-06 — A Place to Hang

**Section:** `#ch-06`. **Rendered heading:** **The body chooses a still point.**

### Two content beats

1. **A new place** — A mature larva usually leaves its feeding milkweed to find a pupation site. Here, a nearby support keeps the habitat in view.

2. **The point of contact** — The attachment matters as much as the pose. A silk pad supports the hanging animal; the plant, pad and gravity stay aligned.

### Distinct result and control behavior

The larva's J posture is connected to a physical attachment and a pupation site. **View the attachment** opens a dialog showing the silk pad and rear attachment, with text distinguishing the larval connection from the later pupal cremaster.

**Incoming identity:** TR-05-06 introduces the support after the final larval comparison.

**Outgoing identity:** TR-06-07 names the silk pad/hanging pivot while comparing larval and pupal appearances.

**Media and implementation:** `public/assets/ai-11-j-hang.webp`; `src/diagrams.ts` → `attachmentDiagram()`; `src/ui.ts` → the cinematic chapter and `#attachment-dialog`; `src/interactions.ts` → dialog opening, closing and focus return.

**Mobile and still equivalents:** The phone chapter places its reading area above a responsive crop of the hanging plate. The attachment dialog remains available without motion. The reading edition places the same explanatory diagram inline. The text explicitly states that mature larvae usually leave the feeding milkweed; the nearby support is a composed setting.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-07 — The Jade Vessel

**Section:** `#ch-07`. **Rendered heading:** **A new surface appears.**

### Two content beats

1. **The final larval skin** — The chrysalis emerges from beneath the shed larval skin. The two surfaces are distinct, though the hanging support stays in place.

2. **Still attached** — The cremaster, a small structure at the rear of the pupa, anchors it to the silk. Green and gold now define the exterior.

### Distinct result and control behavior

The visitor distinguishes a larva wearing its final skin from the exposed chrysalis. **Skin** selects the J-hanging larval plate and its caption; **Chrysalis** returns to the jade pupa. These two states do not provide continuous observed skin-shedding footage.

**Incoming identity:** TR-06-07 introduces the pupal plate under the stated attachment reference.

**Outgoing identity:** TR-07-08 leads from the opaque exterior into a labeled explanatory study.

**Media and implementation:** `public/assets/ai-06-jade.webp` initially; `public/assets/ai-11-j-hang.webp` for **Skin**; `src/ui.ts` → `#pupation-caption`; `src/interactions.ts` → `pupation`; `src/image-loader.ts` → token-guarded `setPicture()`.

**Mobile and still equivalents:** Phone layout puts the title, lead and selector above the image. Reduced/still modes keep both image choices. The reading edition provides the jade image and a separate larval-posture diagram, explicitly identifying them as selected states.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-08 — Inside the Change

**Section:** `#ch-08`. **Rendered heading:** **The change is continuous.**

### Two content beats

1. **An exterior reference** — Begin with the intact chrysalis. Keep its outline and attachment in mind before switching to the explanatory view.

2. **Development already under way** — Adult structures begin developing during larval life. Wing growth and flight-muscle development continue in the pupa; the animal does not simply dissolve into nothing.

### Distinct result and control behavior

The visitor separates an intact exterior from a developmental explanation. **Exterior** shows the jade plate. **Illustrated inside** reveals a different, clearly labeled schematic panel and legend. **Reset view** returns to the exterior. This is a switch between views, not a literal view through living tissue.

**Incoming identity:** TR-07-08 retains the shell/support as the reference for its illustrative study.

**Outgoing identity:** TR-08-09 returns attention to the exterior before introducing the late wing pattern.

**Media and implementation:** `public/assets/ai-06-jade.webp`; `src/diagrams.ts` → `insideDiagram()`; `src/ui.ts` → `#inside-exterior`, `#inside-reconstruction`, `#inside-caption`, and `#inside-reset`; `src/interactions.ts` → `inside`.

**Mobile and still equivalents:** The workbench and toolbar reflow for phone width. The reconstruction contains a persistent **Illustrative reconstruction** label, legend and explanation. The toggle and reset work independently of animation. The reading edition places the exterior and explanatory diagram in separate labeled figures.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-09 — A Pattern Beneath

**Section:** `#ch-09`. **Rendered heading:** **The pattern begins to show.**

### Two content beats

1. **Hold the outline** — Compare early and late appearances at the same attachment. The casing remains present as the color beneath it changes.

2. **Color, coming into view** — Late wing-scale pigmentation makes the pattern visible through the covering. The chrysalis has not become an empty glass vessel.

### Distinct result and control behavior

Early and late pupal appearances are compared without a glass-shell claim. **Early** loads the jade reference; **Late** loads the patterned pupa. The caption explains the visible pattern through developing wing-scale pigmentation, with no fixed countdown.

**Incoming identity:** TR-08-09 bridges from the explanatory study to the external late pattern.

**Outgoing identity:** TR-09-10 moves from the patterned casing toward an authored adult-and-shell pose.

**Media and implementation:** `public/assets/ai-08-pattern.webp` initially; `public/assets/ai-06-jade.webp` for **Early**; `src/ui.ts` → `#maturation-caption`; `src/interactions.ts` → `maturation`; `src/image-loader.ts` → `setPicture()`.

**Mobile and still equivalents:** Phone layout separates copy and controls from the framed image. Both states remain selectable in reduced/still view. The reading edition includes labeled early and late images side by side at wide widths and stacked on narrow screens.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-10 — Emergence

**Section:** `#ch-10`. **Rendered heading:** **The first time the wings unfold.**

### Two content beats

1. **Free of the casing** — First, follow the adult leaving the shell. Hanging beneath the spent casing is a separate moment from being ready to fly.

2. **Room for the wings** — Fluid expands the wings after emergence. The new adult remains hanging while they unfold and dry.

### Distinct result and control behavior

Leaving the shell, expanding the wings and readiness for flight are separate results. Three named buttons select different SVG poses and captions. **Back to stage one** restores the first pose. The macro artwork has two states: `ai-07-emergence` for the first stage and `ai-15-unfolding` for both later stages; only the diagram distinguishes all three positions.

**Incoming identity:** TR-09-10 introduces the hanging adult and retained casing as a selected illustrated pose.

**Outgoing identity:** TR-10-11 connects the adult wing pattern with the wider milkweed habitat.

**Media and implementation:** `public/assets/ai-07-emergence.webp`, `public/assets/ai-15-unfolding.webp`; `src/diagrams.ts` → `emergenceDiagram(0..2)`; `src/content.js` → `emergenceStages`; `src/ui.ts` → the emergence inspector; `src/interactions.ts` → `emergence` and reset.

**Mobile and still equivalents:** The phone inspector stacks caption and diagram beneath a three-button row. Reduced/still modes preserve the three SVG states and the two macro media states. The reading edition shows all three labeled diagrams plus the unfolding macro plate. No measured time interval is claimed.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## CH-11 — First Flight

**Section:** `#ch-11`. **Rendered heading:** **The leaf remains.**

### Two content beats

1. **A different way to move** — The settled wings carry the individual beyond the frame. The original plant remains, linking the adult to its beginning.

2. **Four stages, one life cycle** — Egg. Larva. Pupa. Adult. Return to any chapter to compare the forms and the different needs each stage brings to a habitat.

### Distinct result and control behavior

The ending connects the adult to the habitat that supported its beginning. **Watch the first flight** moves/fades one butterfly layer out and changes the status text; **Return the butterfly** restores it. The cycle diagram and four stage links resolve the biology, while **Explore the chapters again** opens all eleven anchors.

**Incoming identity:** TR-10-11 introduces the larger meadow through a wing/leaf reading cue.

**Outgoing identity:** The narrative ends on the retained leaf. Optional chapter links and the restart action return to earlier observations; there is no twelfth chapter.

**Media and implementation:** `public/assets/ai-13-meadow.webp` as the background; `public/assets/ai-14-butterfly.webp` as the alpha layer; `public/assets/ai-12-adult.webp` as the complete adult-still fallback; `src/diagrams.ts` → `cycleDiagram()`; `src/ui.ts` → `#flight-toggle` and `.cycle-links`; `src/interactions.ts` → departure/return state.

**Mobile and still equivalents:** The phone scene places its copy above the image area. Reduced/still modes disable the departure transition but retain its end states and updated text. If the butterfly alpha asset fails, the image loader switches to the complete adult still, and the control alternates that still with the leaf view. The reading edition shows the mature adult, habitat-only plate, cycle and stage descriptions.

**Evidence:** See `qa-report` / `evidence-index`; structural checks do not establish visual acceptance.

## Reading holds and completeness

The chapter bodies use normal document flow for their two beats. Visitors can stop to read, select an inspection state or follow a source without requiring a timed playback. Chapter headings and anchors are separate from the bridge markers. All eleven entries have their own informational role: egg structure, host plant, hatching, feeding, larval stages, support, pupation, internal development, visible pigmentation, emergence and habitat-linked resolution.

This ledger records implemented content and paths. Remaining visual-fidelity limitations, failures and untested conditions must remain visible in the QA report rather than being overwritten by a chapter-count result.
