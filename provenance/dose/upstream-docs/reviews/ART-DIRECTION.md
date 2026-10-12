> Archive note: this is an independent review record from development. Screenshot and task-local QA paths mentioned below identify evidence that was inspected, not files bundled in this source ZIP. The final consolidated results and correction status are in `../QA.md` and `../QA-RESULTS.json`.

# DOSE — independent art-direction and layout review

## Review scope and result

This was the second independent review, after the engineering review. It inspected actual browser screenshots against the seven selected concept references. No browser was launched by this reviewer during this round, no source code was changed, and generated reference images were not substituted for browser output.

The reviewed implementation retains the intended editorial structure, restrained palette, changing scale, and seven distinct chapters. The final corrections removed the identified model/text collisions. **No remaining readability or control-obstruction blocker was observed in the reviewed final frames.** The result is an interactive procedural CGI interpretation of the art direction. It should not be described as a photographic recreation of the concepts: Material, the Evidence cut face, the steel reflections, and Release are visibly more stylized.

### Images actually inspected

- All seven selected concept references in `DOSE/docs/concepts/`: Prologue, Material, Distribution, The press, Surface, Evidence, Release.
- Four isolated final-material preflight images: `work-runtime/scene-shots/hero.png`, `material.png`, `surface.png`, and `evidence.png`.
- All seven integrated browser chapters at each of **360×780, 768×1024, and 1440×900**: 21 principal browser frames.
- Integrated desktop supplementary frames: `final-press-fill.png`, `final-press-eject.png`, `final-ending.png`, `final-surface-handoff.png`, `final-evidence-handoff.png`, `final-depth-surface.png`, and `final-depth-interior.png`.
- Additional isolated press-before, press-ejected, and release-ending frames, plus the separate illustrated-edition ending image. These were supporting context, not evidence that the illustrated image was the WebGL rendering.
- After the final layout correction, the same-name replacement frames were inspected again for 360 Prologue/Surface/Evidence/Release, 768 Surface, and 1440 Surface/Evidence. These seven rechecks are the basis for the resolved geometry findings below. After the final type-size changes, 360 Material/Evidence/Release were inspected a third time; the larger labels and adjusted models remained separated.

The complete six-viewport matrix is owned by the root agent's QA record. This independent review does not claim to have visually inspected every 390, 1920, or 3840 frame.

## Comparison in five dimensions

| Dimension | Selected reference direction | Browser implementation and judgment |
| --- | --- | --- |
| **1. Composition and hierarchy** | Large object-led compositions; oversized opening DOSE; left editorial copy; quiet header and footer; Distribution reverses the usual title/body placement. | The desktop composition preserves those relationships. The title, tablet and invitation are separately legible in the opening. Distribution places supporting copy high and its headline low, giving a useful change of pace. Phone layouts place the title above the object and the body below. The hierarchy remains understandable without the concept image's decorative callout leaders. |
| **2. Typography and reading rhythm** | A strong condensed opening word, lighter broad headlines, mono labels, short editorial copy. | The Barlow Condensed opening and Space Grotesk headlines preserve the large/small type contrast; the mono UI is consistent. Main narrative text is readable at the reviewed phone size. The first art-pass metadata was too small for comfortable reading. The final correction increased explanatory notes, material keys, stage labels, depth endpoints and chapter index to 11 CSS pixels, with the persistent CGI note at 10 pixels. The three targeted phone rechecks show the larger labels without introducing overlap. Secondary text is still deliberately compact; the key scientific distinctions also appear in the larger body copy and About content. |
| **3. Scale, spacing and responsive framing** | Whole-object opening, differentiated raw material forms, packed powder volume, mechanical die, macro surface, cutaway, then fragmentation. Ample negative space supports changes in scale. | The seven subjects remain distinct. Surface is now substantially enlarged and cropped rather than repeating the whole-tablet hero. The smaller tablet layout has more open space than the desktop references, and its model generally sits to the right of the reading column. After correction, the phone Release and tablet Surface have clear model/body separation. The large macro image uses explicit rectangular cropping rather than the reference's seamless photographic full-bleed edge; this is a retained framing decision, not an unnoticed overlap. |
| **4. Palette, lighting and material character** | Porcelain white, warm gray, muted mineral green, stainless steel; dark green reserved for Evidence; tactile microscopic detail. | The color relationships are close to the intended system. Hero and Surface visibly retain fine pores and edge relief. The final tablet has much more readable material detail than the early flat-white rendering. There is a clear fidelity limit: the white Material aggregates are sculptural, green crystals and powder grains retain polygonal facets, the Evidence section is a relatively planar cut, and the steel is more mirror-like than the brushed reference. These are credible signs of real-time procedural CGI, but they do not match the concepts' photographic complexity. |
| **5. Chapter identity, transitions and interface detail** | A consistent tablet silhouette and circular framing connect the scenes; one restrained cutaway slider; simple chapter navigation and a quiet return ending. | The tablet's round form, pale porous material and neutral setting carry through the object, press, macro, cutaway and fragment scenes. The press's fill and ejection frames make the mechanical sequence readable; the compressed hold legitimately obscures most of the tablet. The slider remains visually clear, and its two endpoint captures show distinctly different cutaway depth. Crossfade snapshots visibly contain overlapping outgoing and incoming forms, so this is a composited handoff rather than a physically continuous geometric transformation. The ending preserves readable copy, fragments, a closing line and a return link. Liquid is signaled by restrained rings rather than photoreal water/caustics. |

## Issues found and final disposition

### 1. Phone Release encroached on the first body line — corrected

In the original `final-360-6.png`, the lowest fragment and liquid-ring region reached the first body line. This reduced separation between the subject and the words “Structure meets liquid.” The root agent raised the phone Release composition by about 40 pixels.

**Final visual check:** the replacement `final-360-6.png` shows a visible gap between the lowest opaque fragment and the paragraph. The faint liquid rings remain in the artwork region. The return link and footer remain clear.

### 2. Phone Evidence decorative ring crossed the paragraph — corrected

The original phone Evidence tablet itself was clear of the text, but the much larger circle extended through the first two body lines. The circle was decorative and did not help the small layout.

**Final visual check:** the replacement `final-360-5.png` removes that circle. The tablet, paragraph, conceptual-status note and slider now occupy distinct vertical regions. The phone Prologue circle was also removed, leaving the invitation below the tablet unobstructed.

### 3. Tablet Surface model occupied the paragraph's background — corrected

In the original `final-768-4.png`, the model intruded under the end of the first body line, around x=355–425 and y=770–790. The phrase “This tablet is” sat on the textured tablet rather than the page background. The nearby straight crop edge made the collision more noticeable.

**Final visual check:** in the replacement 768 Surface image the artwork ends around y=734 and the paragraph starts around y=771. The entire body now reads against a consistent pale background. The scene was raised and bounded to protect the paragraph.

### 4. Desktop Surface and Evidence decorative framing needed tighter bounds — corrected

The initial desktop macro extended behind the footer, and the large Evidence circle crossed the depth track region. The final Surface crop ends above the footer; its isolated broad ground shadow was removed. The final Evidence circle is smaller.

**Final visual check:** `final-1440-4.png` leaves the footer/progress rail on a clear page background. `final-1440-5.png` leaves the depth control below the circle and model. There is no model overlap with the main copy.

### 5. Keyboard range focus outline crossed adjacent labels — corrected in source by the root agent

The earlier supplementary depth-endpoint screenshots showed the generic seven-pixel focus-outline offset reaching the label and endpoint text. This did not block the slider, but a tighter range-specific focus outline was recommended. The root agent reported changing the range-specific offset to one pixel. The final independent image recheck was limited to the requested three phone chapters; a second focused-slider screenshot is not claimed by this reviewer.

### 6. Phone secondary type was undersized — corrected and targeted frames rechecked

The first pass used approximately 8–9-pixel metadata and legends. The final correction raised most secondary copy to 11 pixels and the persistent CGI label to 10 pixels. Because the Material key now wraps onto two lines, its model was lifted; Evidence was lifted again to preserve room for the larger explanatory note.

**Final visual check:** replacement 360 Material, Evidence and Release screenshots show the larger notes and footer labels. The Material key wraps cleanly, its paragraph remains below the particles, the Evidence tablet is clear of the body, and Release retains its model/body gap. No new collision was introduced by the type changes.

## Retained art-direction decisions and honest limitations

### Surface crop

At 360 pixels the macro forms a wide image band with a straight lower edge above the paragraph. At tablet and desktop sizes a vertical crop edge is also visible inside the composition. The final version is readable and signals a different observation scale. It is less seamless than the reference photograph, where the object continues naturally beyond the viewport. This boundary is explicitly retained; it should not be called a hidden technical defect or a pixel-faithful copy.

### Material and fragment realism

The implementation distinguishes the ingredient families through silhouette, color and texture. However, the Material aggregates look more like stylized sculptural clumps than the granular clusters in the selected reference. Release retains relatively planar fracture faces and an organized overall distribution. These frames work as explanatory art, but they provide less organic irregularity than the reference concepts. No quantitative or biological interpretation should be inferred from their shapes.

### Press presentation

The fill frame shows powder in the die, and the ejection frame shows the lower punch presenting the formed tablet. In the compressed hold, the upper punch covers the compact, which is consistent with the illustrated sequence. The mechanism is deliberately reduced to the working parts; it is not a full press assembly. The large, glossy reflections are a visible departure from the more finely brushed-metal reference.

### Ending

The inspected complete WebGL ending remains a fragment composition with a quiet closing line. It does not depict all material disappearing into solution. This is compatible with the narrative's distinction between breakup and dissolution, and it avoids a fake measured dissolution endpoint. The work's quietness and temporal pacing cannot be proven from a screenshot; that belongs to the playback and interaction checks.

### Review limits

This round inspected pixels, not a video recording. It cannot certify smooth frame pacing, scroll feel, transition duration, touch comfort on a real phone, or all possible cutaway/scroll combinations. The snapshots came from Chromium software rendering. The functional, scientific and performance limits documented elsewhere remain applicable. No arbitrary numerical “design score,” photographic-realism claim, or universal-device pass is assigned.

## Final review statement

The identified model/text collisions were corrected and rechecked in actual replacement browser screenshots. The reviewed final frames present a coherent seven-chapter editorial experience with readable primary copy and unobstructed controls. Remaining differences from the generated references are documented choices and fidelity limits, particularly procedural material detail, rectangular macro framing, composited handoffs and stylized liquid/fragment rendering.

## Delivery completion annotation by the project integrator

The integrator also inspected the final seven native 1536×1024 browser captures and the final focused range endpoint. The focus rectangle now clears its adjacent labels. The procedural-material, macro-crop and liquid-cue fidelity limits described above remain part of the delivered design.
