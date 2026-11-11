# PULSE — An atlas of one heartbeat

> **Independent flagship website build brief · Edition 2.0 · November 2026**  
> A fully self-contained execution prompt for a Coding Agent. All instructions, page content, documentation, generated image prompts, accessibility labels, and user-visible strings must be in **English only**.  
> Scope: **11 complete story chapters · 10 fully specified transitions · 8 distinct real AI image-generation outputs · one tested, reproducible source ZIP**.

## 00. Execute the entire website, not a concept deck
**Build PULSE as a complete, polished, long-form immersive website.** Investigate the sources and actual tools, generate and inspect images, lock a visual bible, prototype the high-risk scenes, implement all chapters and transitions, test through real browser interactions, refine weak areas, and deliver an independently rebuildable source ZIP. A pitch, a moodboard, a hero-only demo, a set of static screens, or a partial implementation is not completion. Do not ask for approvals on ordinary composition, styling, implementation, or editorial decisions. Do not deploy, publish, push, or alter the existing collection without explicit authorization.
- **Identity:** PULSE. English subtitle: *An atlas of one heartbeat*.
- **Narrative premise:** Walk through the anatomy, conduction, chambers, valves, pulmonary circulation and systemic circulation of a healthy human heart. The visitor follows a coherent anatomical route while the heartbeat timing remains a separate clearly labeled process. The site is a poetic educational anatomy exhibition, not a medical diagnostic instrument.
- **Audience and takeaway:** Curious non-specialists discover what the heart actually looks like and how electrical timing, valve anatomy, lung gas exchange and circulation fit together without sacrificing biological correctness.
- **Originality boundary:** Unlike the Collection’s hypothetical pharmaceutical tablet, sonic resonance or general abstract fluids, this work centers medically reviewed **human cardiovascular anatomy** and spatially accurate structure/flow. It is neither wellness marketing nor a romantic heart shape animation.
- **Format and language:** standalone browser-native editorial experience; concise, elegant **English-language** narration and UI. Set document language to `en`. Do not render Chinese subtitles, chapter names, source notes, loading messages, image-baked captions, or bilingual decoration. Never use fake text embedded in AI art as content.
- **Operational scope:** no login, paid API dependency, analytics, database, or unrelated feature. Implement locally or in an authorized private sandbox only; produce source and deliverables, not a public release.

## 01. Research, ethics, and creative facts
**Subject-specific evidence:** NHLBI and the American Heart Association describe the four chambers, four valves, venae cavae, right heart to lungs via pulmonary arteries, pulmonary veins to left heart, and left ventricle to aorta and systemic circulation. SA and AV node conduction sequences can be explained independently from the blood pathway. Arteries carry blood away from the heart, veins toward it; they are not defined by oxygen content. Real oxygen-poor blood is dark red, not physically blue; any blue diagram line must be labeled as an illustrative convention.
**Interpretation rules:** This is general educational anatomy, not a personal health assessment, prediction, device or clinical advice. Do not display fabricated heart rate, diagnostic ECG, blood pressure or intervention instructions. Diagrams and the 3D interior are accurate-in-intent author reconstructions and must never be presented as a scan of a real patient. No gratuitous visceral gore.
Verify primary-source assertions at implementation time, document the reviewed date, and keep externally supported facts separate from stylized fiction, composite scenes, and technical approximations. A source is evidence for a fact, **not** a license to reuse its artwork. Do not invent data, historic events, quotations, counts, brand endorsements, technical settings, medical claims, or material properties. The scenario and editorial decisions in this brief are intentional art direction, not claims that a website or model has already been built.
**Sources to actually consult (their exact scope matters):**
- [NIH/NHLBI — Heart anatomy](https://www.nhlbi.nih.gov/health/heart/anatomy) — four chambers, tissue, valves and orientation.
- [NIH/NHLBI — Blood flow](https://www.nhlbi.nih.gov/health/heart/blood-flow) — vascular direction, valves, pulmonary and systemic circulation.
- [NIH/NHLBI — How the heart beats](https://www.nhlbi.nih.gov/health/heart/heart-beats) — conduction and pump sequence.
- [American Heart Association — The healthy heart](https://www.heart.org/en/health-topics/congenital-heart-defects/about-congenital-heart-defects/how-the-healthy-heart-works) — chambers, valves and function.
- [Lenis official repository](https://github.com/darkroomengineering/lenis) — verify integration and scrolling behavior against the installed version.
- [GSAP ScrollTrigger reference](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — scrub, refresh, pin, media queries and supported lifecycle.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) — test methodology, not a substitute for viewing transitions in motion.
- [W3C WCAG pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) — evaluate continuously moving interface elements as appropriate.

## 02. Non-negotiable acceptance contract: H1–H9
- **H1 · Complete story:** Implement **all 11 planned chapters** CH-01 through CH-11 as distinct, effective story sections. Each has an independent informational/emotional function, **two meaningful beats**, a composed reading hold, an incoming connection and an outgoing connection or complete ending. Loader, navigation, repeated wallpaper, spare paragraph, transition-only screen and footer are not chapters. Eight is the absolute template minimum, not permission to quietly cut this 11-chapter plan.
- **H2 · Directed hero:** The hero has **six validated states**: first meaningful image, reveal, complete composition, living hold, first scroll, and return. Its actual browser rendering must match the approved concept in structure, material, framing, light and text safety.
- **H3 · Real image generation:** **Actually call an available, authorized image generation tool** before production layout and prolonged modeling. Preserve at least eight separately inspectable image results: three materially different hero concepts, one refined desktop hero, one purpose-built portrait/mobile hero, two advanced non-hero keyframes and one transition midpoint. Text prompts or existing photos do not count as generated outputs. Tool unavailable: mark H3 BLOCKED; continue only independent work and never falsely claim acceptance.
- **H4 · Every boundary authored:** Implement **10 specific adjacent transitions**, each with 0/25/50/75/100% staging, an identifiable handoff anchor, foreground/background/text order, reversible motion, random-access state, mobile treatment, and a target-chapter fallback. An undirected global black fade is not an adequate transition.
- **H5 · Lenis integrated:** Use real Lenis, correctly connected to the chosen scroll controller, with one authoritative story progress. Support wheel, scrollbar, touch, keyboard, chapter links, hashes, reverse scroll, fast skip, mid-page refresh and browser history. Never block scrolling for a cinematic introduction.
- **H6 · Readable English typography:** All meaningful words are real, selectable English DOM text (or justified accessible SVG labels). Every active title, body, legend, control, error and caption stays readable across scroll midpoints, font changes, zoom and responsive widths. No subtitle overlap, text clipping, unreadable contrast, pointer-blocking invisible text, or inaccessible fake image lettering.
- **H7 · Build, browse, fix:** Complete a production build and production preview, perform real browser actions, capture evidence, inspect aesthetics and interaction **independently**, repair failures and rerun affected checks. A green build alone is not verification; never fabricate PASS, FPS or speed measurements.
- **H8 · Full accessible alternatives:** Desktop, narrow phones, high-resolution layouts, reduced motion, failing assets, slow network, unsupported WebGL, resize, background restoration and out-of-order resource loading must preserve the **full story and real interaction results**, though camera and media can adapt.
- **H9 · Reproducible, private handoff:** Deliver all source, chosen legal assets, lockfile, documentation, evidence, and a **source ZIP verified by extraction and rebuild**. Do not upload or deploy to Pages, Netlify, Vercel, Cloudflare, publish a preview, push Git changes, create PRs/tags/releases, or touch the existing collection unless separately authorized.
Maintain a small `requirements-evidence.md` ledger: `ID | requirement | implementation path | test method | evidence | status`. Status is one of `NOT STARTED / IN PROGRESS / READY TO TEST / PASS / FAIL / BLOCKED / NOT TESTED`. Visual quality and functional correctness both require evidence; self-awarded aesthetic scores do not qualify.

## 03. Subject-specific visual bible
- **Art direction:** Premium anatomical museum film, not sci-fi HUD or generic “pulse particle” wallpaper. Sculptural living tissue forms and restrained museum-white English explanatory plates, with enough anatomical fidelity to withstand inspection.
- **Palette:** Deep chamber burgundy #4C1722, venous diagram slate #3F6678, oxygenated arterial crimson #B03D42, myocardial rose #CB787A, cool anatomical ivory #F1E9E1, restrained gold #CBA66C for educational linework. Labels explain blue/red *diagram* convention.
- **Surfaces:** Moist but not glossy-plastic myocardium, fibrous valve leaflets, chordae and muscular supports where relevant, vessel thickness, translucent but differentiated alveolar barrier and capillaries. No mirrored chrome blood cells or fake plasma lasers.
- **Lenses and shot system:** 50–85 mm atlas-object portrait, careful controlled cutaways, occasional macro valve details. Maintain a declared anatomical orientation, e.g. anterior view vs viewer-left, and explicitly label physical right/left.
- **Typography:** Elegant scientific editorial serif for major English titles, calm technical sans for accessible anatomy labels; a readable source/illustration note never gets hidden behind animation.
- **Sound and motion:** Muted by default. Optional user-triggered quiet original lub-dub-like sound only with a factual caveat and pause; contractions use restrained authored snapshots, never misleading constant pulsing of everything.
- **Hero art priority:** A recognizable anatomical heart in a soft dark museum environment, partially revealed tissue planes and great vessels; compelling actual anatomy and readable negative space, no Valentine symbol.
- **Continuity signature:** A thin controlled warm-copper tracer indicates **the viewer’s chosen explanatory path**, while the organ retains stable anatomical coordinate and right/left orientation. The directional route travels body return → right heart → lungs → left heart → systemic exit and eventually closes. Electrical signals use a visually distinct marking; they are not blood vessels.
- **Do not accidentally become:** Red-blue laser beams as real blood, an anatomically inverted heart, all four valves opening in the same direction at once, unsupported circulation through cardiac walls, synchronized blood path presented as a single-cell timescale, made-up physiological measurements, or unlicensed patient scans.
Lock selected hero framing, palette, lighting direction, materials, lens language, typography and a shot-to-shot color transform in a short `VISUAL-BIBLE.md`. The bible must include desktop/mobile framing, final asset choices, treatments of still and moving layers, and why these eleven chapters belong to the same world yet differ in observation. All purposeful exceptions must be documented; do not force identical scene layouts on every chapter.

## 04. Eight real AI image-generation assignments
**Do not postpone these until after site construction.** Inspect actual generated full-resolution images. Variants AI-01/02/03 must differ in framing and dramatic premise, not just color. AI-04 is a genuine selected-concept refinement; AI-05 is a genuinely recomposed 390 × 844 portrait concept, not a crop. AI-06/07 prove middle and late production quality; AI-08 designs an intermediate state that is beautiful **even when scrolling stops halfway**. The prompts below are starting art direction; refine them using honest visual comparison.

### AI-01 · Hero candidate A — anatomical specimen portrait
**Generate:** Meticulous naturalistic adult human heart anatomy model in dark burgundy museum space, true atria/ventricles and ascending great vessels, 3/4 anterior orientation, soft grazing light revealing myocardial fiber texture and credible vessel thickness, quiet left-side negative space for real English DOM title, no gore or lettering.
**Must reject or correct:** Reject Valentine-heart silhouette, chrome or oversized arteries that connect incorrectly.

### AI-02 · Hero candidate B — interior and exterior dialogue (recommended)
**Generate:** Premium scientific CGI composite: a biologically plausible human heart exterior with one carefully designated controlled section revealing chamber wall thickness, fine muscle structure and major vessel bases, deep wine and ivory palette, soft single left key light, abundant quiet area for English typography.
**Must reject or correct:** Do not cut through a chamber without a rim, show all vessels wrongly connected or pretend it is an actual patient scan.

### AI-03 · Hero candidate C — situated within the chest
**Generate:** Quiet anatomical torso silhouette with translucent but readable chest tissues framing a correctly positioned realistic heart, no portrait identity, softly graded museum-gray environment, heart fully recognizable, clear side negative space.
**Must reject or correct:** Reject a heart centered incorrectly in a perfect transparent acrylic human or excessive horror-film gore.

### AI-04 · Refined desktop anatomical hero — B selected
**Generate:** Refine the selected interior/exterior heart against precise reputable anatomy reference: consistent anterior axis, realistic valve/cavity boundaries and wall thickness, superior vessel structures with plausible continuity, subdued tissue translucency only in authored cutaway, left third reserved for selectable English title; provide matched still and useful separate layers.
**Must reject or correct:** No detached anatomical components or mismatched cut section between main and fallback layers.

### AI-05 · Recomposed portrait heart hero
**Generate:** Portrait camera at 390×844, one close anatomical heart in lower-center and genuine quiet dark upper region for two-line English heading; preserve recognizable atrial/ventricular separation and vessels, framing is deliberately reframed with natural light rather than cropped.
**Must reject or correct:** Reject a half-visible heart with key vessels cut away or title obscuring the top anatomy.

### AI-06 · Non-hero medical macro — alveolar gas exchange
**Generate:** Author-led educational anatomical close view of alveolus and neighboring red-blood-cell-bearing capillary, realistically thin barrier, separate labeled schematic layer to show oxygen/carbon dioxide directions, quiet gold/rose/teal museum colors and text safe left margin.
**Must reject or correct:** No fantasy oxygen marbles or claim that a single macro graphic is authentic clinical microphotography.

### AI-07 · Non-hero medical macro — left ventricular strength
**Generate:** Beautiful medically informed cutaway from the left ventricle showing comparatively thick myocardium, coherent left atrioventricular valve/muscular structures and aortic outflow relationship, precise tissue depth and soft rim light, enough English annotation space.
**Must reject or correct:** No heart chamber becoming a hollow glowing cave; wall thickness and anatomical neighbors must make sense.

### AI-08 · Critical midpoint — pulmonary artery to alveolar microcirculation
**Generate:** A rigorously staged halfway image from a larger right-heart outflow illustration to an alveolar-capillary educational section: pulmonary arterial branch remains as spatial anchor then resolves to a drawn capillary bed with a credible magnification/diagram boundary, no false continuous 3D pipe-to-air-sac conversion, clean text zone.
**Must reject or correct:** No blood entering the airspace, no oxygen-poor blood literally painted blue without a legend, no seamless fantasy anatomical tunnel.
**Asset selection and provenance:** Record for each `AI-ID` the actual tool, exact retained file path, input prompt, known parameters, role, selected/rejected rationale, license/rights, and where it appears. Do not invent seeds or settings not returned by the tool. Generate reusable background, foreground, shadow and texture passes when the scene needs them; check for repeated subjects left in the backdrop after extraction, haloed cutouts, inconsistent contact shadows, and empty exposed pixels. Generate *without* typography, labels, numbers, logos or UI. Real on-page English text must be DOM/SVG. A chosen image can be a production asset or a modeling reference, but its material, silhouette, illumination and composition must be visibly redeemed in the actual website. If photoreal 3D fails quality review, choose a cleaner layered/precisely matched hybrid rather than default primitives. Keep only distributable final assets in the ZIP.

## 05. Hero: six-state shot direction and real editorial copy
**Desktop, 1440 × 900 CSS pixels:** A plausible anatomical heart occupies right/middle 58% with real vessel openings and believable muscle texture. Left third carries English heading safely against deep neutral background. Use subtle sectional hints without making the heart appear severed.
**Portrait, 390 × 844 CSS pixels:** Portrait camera reveals entire great-vessel crown and a meaningful lower ventricular contour; heading in quiet upper space with a clear small illustration note. A different composition is mandatory.
**Actual English homepage title:** `Every beat has a direction.`
**Document/preview title:** `PULSE — An atlas of one heartbeat`; **English meta description:** “Explore the human heart through an illustrated anatomical journey across chambers, valves, signals and blood circulation.”
**English hero alternative text:** “An anatomical human heart in a dark museum setting, with muscle walls, vessels and a carefully illustrated partial section.” (use only when not redundant to adjacent prose; decorative layers should be hidden from assistive technology).
**Actual English homepage lead:** “A guided journey through the chambers, signals and pathways that keep blood moving.”
**Primary call to action:** `Enter the heart` (must really take the visitor to CH-02, with predictable focus and scroll state).
1. **First meaningful frame:** Show a convincing anatomical heart still and readable English text immediately; no black medical-intro loader or scrolling embargo.
2. **Reveal:** Grazing light reveals surfaces and gently separates a controlled anatomical cutaway from the body without changing organ identity.
3. **Full still composition:** Heart as a real sculptural anatomical volume, not an emoji, aligned with the locked anterior frame and actual source-supported geometry.
4. **Living hold:** Only restrained slow tissue-adjacent light movement; optional beat motion never obscures a medical label or autoplays sound.
5. **First scroll:** A vessel edge and fixed annotation guide bring the observer to chambers, keeping left/right perspective explicit.
6. **Return to opening:** Restore anatomical orientation, cutaway registration and title position exactly; do not make a new randomly oriented heart model.
**Prototype gate:** Independently test this first scroll and return **three times**, pausing around 25/50/75% transition progress. Specifically reject mirror-swapped heart anatomy, disconnected large vessels, flashing blood colors or collision between the title and heart silhouette. A screenshot of a concept is not evidence that the built hero is good.

## 06. Full 11-chapter story — executable cards
Every card specifies original content, two substantive beats, a real English editorial treatment, concrete media, a stable hold, incoming/outgoing identity, cross-device equivalent and a testable failure criterion. A title plus an image is not enough. Chapter numbers below refer to **content sections**, not scroll pin anchors or timing markers.

| ID | English title | Independent reveal | Primary visual medium |
| --- | --- | --- | --- |
| CH-01 | **The Living Form** | Introduce the anatomical organ as a real muscular pump in the chest. | Selected high-fidelity anatomical art with bounded 3D/diagram overlays. |
| CH-02 | **Four Chambers** | Establish the upper receiving chambers and lower pumping chambers with correct spatial relationships. | Accurate illustrative 3D shell and crisp SVG educational section. |
| CH-03 | **The Signal** | Differentiate electrical trigger from transport of blood. | SVG timing overlay registered to stable anatomical heart; optional restrained motion. |
| CH-04 | **The Return** | Explain deoxygenated systemic venous return to the right atrium. | Anatomical heart section and accessible SVG arrows. |
| CH-05 | **One-Way Gates** | Explain valve topology and the physical function of flow direction. | Correct anatomical local models or precise scientific diagrams, no generic flap geometry. |
| CH-06 | **Toward the Lungs** | Explain right ventricular ejection into the pulmonary circulation. | 3D heart-local geometry joined to SVG pulmonary route. |
| CH-07 | **Exchange** | Show gas exchange at the alveolar-capillary interface without confusing blood with air. | High-grade static/mixed medical diagrams, selective controlled SVG arrows. |
| CH-08 | **The Way Back** | Show pulmonary veins returning oxygen-rich blood to the left atrium. | Stable heart-local anatomical section with SVG circulation paths. |
| CH-09 | **The Stronger Wall** | Explain left ventricular wall thickness and systemic ejection. | High-quality accurate ventricle plate, selective 3D myocardium, SVG arrows. |
| CH-10 | **Around the Body** | Explain the general systemic route through aorta, arteries, capillaries and veins. | Accessible SVG body map, limited non-diagnostic 3D details. |
| CH-11 | **Beat Again** | Integrate structure, signal and two circulation loops; close without claiming a fixed heartbeat rate. | Reused original heart art, SVG loop and text-first ending. |

### CH-01 · The Living Form
- **Why this chapter exists:** Introduce the anatomical organ as a real muscular pump in the chest.
- **Actual on-site copy:** **“Not a symbol. An organ.”** — Behind the familiar rhythm is a living structure with walls, vessels and a very specific shape.
- **Content beats:** **Establish A:** A full anatomical heart emerges with readable major vessels and surrounding scale. **Develop B:** A gentle sectional highlight reveals muscle thickness and chamber direction, without opening arbitrary holes.
- **Stable composed hold and art:** Museum-lit genuine anterior anatomy; safe English title space on left. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **exact heart hero and fixed anatomical axis**; resolve both content beats before the chapter yields; exit through **outer heart wall and vessel boundaries guiding chamber map**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Orientation” opens “Anatomical right / Anatomical left” labels in the current view. Build with: Selected high-fidelity anatomical art with bounded 3D/diagram overlays. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Portrait full organ first, then a generous explanatory still. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** heart resembles a Valentine icon, major vessels are wrong, or right/left are reversed.

### CH-02 · Four Chambers
- **Why this chapter exists:** Establish the upper receiving chambers and lower pumping chambers with correct spatial relationships.
- **Actual on-site copy:** **“Four rooms, two directions.”** — The atria receive blood. The ventricles send it onward. A septum separates the sides.
- **Content beats:** **Establish A:** Expose right/left atria and ventricles in a registered sectional view. **Develop B:** Reveal the atrial and ventricular septa and muscle differences with readable labels.
- **Stable composed hold and art:** Controlled anatomy cutaway with physical shell rim, no floating dots as chambers. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **hero muscle boundary and fixed anterior orientation**; resolve both content beats before the chapter yields; exit through **upper atrial region carrying a different electrical overlay**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Name the chambers” highlights each chamber and a fact-checked one-line role. Build with: Accurate illustrative 3D shell and crisp SVG educational section. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Four legible separate callouts rather than one squeezed diagram. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** anatomical left/right orientation silently flips or septum disappears.

### CH-03 · The Signal
- **Why this chapter exists:** Differentiate electrical trigger from transport of blood.
- **Actual on-site copy:** **“Before the push, a signal.”** — An electrical pattern coordinates atria and ventricles; it is not the path the blood takes.
- **Content beats:** **Establish A:** Mark the sinoatrial-node region in the right atrium, then trace atrial activation. **Develop B:** Show the atrioventricular-node delay and ventricular conduction at an explanatory level.
- **Stable composed hold and art:** Thin pale gold node/route overlay on steady heart silhouette, not lightning in vessels. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **same right atrial location from chamber view**; resolve both content beats before the chapter yields; exit through **right atrium becoming explicit route from systemic veins**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Signal / Blood flow” shows visibly different layer families and a brief legend. Build with: SVG timing overlay registered to stable anatomical heart; optional restrained motion. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Step-by-step conduction stills with explanatory text. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** a pulse line enters lungs or the diagram implies blood physically flows through the SA node.

### CH-04 · The Return
- **Why this chapter exists:** Explain deoxygenated systemic venous return to the right atrium.
- **Actual on-site copy:** **“A return from the body.”** — Blood returning from tissues enters the right atrium through large veins.
- **Content beats:** **Establish A:** Show superior and inferior vena cava entering the right atrium. **Develop B:** Trace blood from right atrium through the tricuspid valve into the right ventricle.
- **Stable composed hold and art:** Sectioned heart and anchored vena cava lines; oxygen-poor blood illustrated in dark red with optional teal notation. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **right-atrial anchor from signal overlay**; resolve both content beats before the chapter yields; exit through **tricuspid valve leaflets seen close up**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Trace the return” steps through body, venae cavae, right atrium and right ventricle. Build with: Anatomical heart section and accessible SVG arrows. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Compact side-by-side route plates; direction text always accessible. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** the vena cava attaches to the left atrium or return is colored literal blue blood.

### CH-05 · One-Way Gates
- **Why this chapter exists:** Explain valve topology and the physical function of flow direction.
- **Actual on-site copy:** **“Doors that answer to pressure.”** — Four valves open and close with changing pressure, keeping the circulation moving forward.
- **Content beats:** **Establish A:** Inspect tricuspid and mitral atrioventricular valves in the context of chamber separation. **Develop B:** Compare pulmonary and aortic semilunar outlet valves with their proper outflow locations.
- **Stable composed hold and art:** Clear local valve sections with accurate leaflet orientation and supportive tissue. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **tricuspid valve encountered on right-heart route**; resolve both content beats before the chapter yields; exit through **right ventricular outflow and pulmonary valve**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Atrioventricular / Outflow valves” switches between two labeled groups and role statements. Build with: Correct anatomical local models or precise scientific diagrams, no generic flap geometry. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Two well-captioned plates, no forced real-time 3D free-spin. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** valves are interchangeable or all four falsely shown moving in phase.

### CH-06 · Toward the Lungs
- **Why this chapter exists:** Explain right ventricular ejection into the pulmonary circulation.
- **Actual on-site copy:** **“The short journey outward.”** — From the right ventricle, blood crosses the pulmonary valve and travels to the lungs.
- **Content beats:** **Establish A:** Locate the right ventricular chamber and pulmonary valve precisely. **Develop B:** Pull back along the pulmonary trunk into branching pulmonary arteries toward the lungs.
- **Stable composed hold and art:** Strong inside-out spatial view, vessel wall thickness and directional signs. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **right heart valve and same chamber geometry**; resolve both content beats before the chapter yields; exit through **pulmonary arterial branch handing into capillary diagram**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Follow this branch” illuminates outflow in proper direction, without fake pressure readouts. Build with: 3D heart-local geometry joined to SVG pulmonary route. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Compact right-heart/lung route plates and English arrows. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** pulmonary arteries wrongly shown carrying oxygenated return to the heart.

### CH-07 · Exchange
- **Why this chapter exists:** Show gas exchange at the alveolar-capillary interface without confusing blood with air.
- **Actual on-site copy:** **“Where air meets blood—across a barrier.”** — Oxygen and carbon dioxide move between alveolar air and the blood through thin tissue layers.
- **Content beats:** **Establish A:** Zoom into a labeled lung alveolus bordering a capillary, with separate spaces intact. **Develop B:** Reveal opposite conceptual diffusion directions across the barrier and the outgoing oxygen-rich blood.
- **Stable composed hold and art:** Premier non-hero medical plate: transparent illustration layers for air sac, membrane and blood, clinically sober tone. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **pulmonary arterial branch becoming an explicitly labeled scale change**; resolve both content beats before the chapter yields; exit through **oxygen-rich capillary flow leading to pulmonary vein**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Oxygen / Carbon dioxide” toggles accurately directed explanatory arrows; label “Schematic scale”. Build with: High-grade static/mixed medical diagrams, selective controlled SVG arrows. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** One enlarged stable diagram, direction buttons with legend. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** blood cells float in alveolar airspace or the cutaway is passed off as real microscopy.

### CH-08 · The Way Back
- **Why this chapter exists:** Show pulmonary veins returning oxygen-rich blood to the left atrium.
- **Actual on-site copy:** **“The return is different now.”** — From the lungs, pulmonary veins carry oxygen-rich blood into the left side of the heart.
- **Content beats:** **Establish A:** Capillary outflow connects diagrammatically to pulmonary venous branches. **Develop B:** Trace entry into left atrium and through mitral valve into left ventricle.
- **Stable composed hold and art:** Registered large-vessel reconnection with clear right/left anatomical labels. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **capillary outlet and labeled oxygen-rich pathway**; resolve both content beats before the chapter yields; exit through **mitral valve and thicker left ventricular wall**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Show both returns” compares the two distinct routes and why their content differs. Build with: Stable heart-local anatomical section with SVG circulation paths. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Dual-column “From body / From lungs” comparison. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** pulmonary veins attach to right atrium or arterial/venous naming is based solely on red/blue.

### CH-09 · The Stronger Wall
- **Why this chapter exists:** Explain left ventricular wall thickness and systemic ejection.
- **Actual on-site copy:** **“The wall built for distance.”** — The left ventricle has a thick muscular wall to move blood into the systemic circulation.
- **Content beats:** **Establish A:** Compare left and right ventricular wall thickness in a registered section. **Develop B:** Demonstrate aortic valve outflow path while keeping mitral inflow structurally distinct.
- **Stable composed hold and art:** Prestige later-act myocardium cutaway, dark tissue depth and fine ivory rim annotation. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **mitral valve entering the left ventricular chamber**; resolve both content beats before the chapter yields; exit through **aortic root and branching systemic diagram**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Compare walls” activates accurate labeled cross-section and an English source note. Build with: High-quality accurate ventricle plate, selective 3D myocardium, SVG arrows. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** One annotated wall comparison per screen, never micro unreadable labels. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** ventricular walls are same thickness or outlet valve location/flow direction wrong.

### CH-10 · Around the Body
- **Why this chapter exists:** Explain the general systemic route through aorta, arteries, capillaries and veins.
- **Actual on-site copy:** **“One beat, many destinations.”** — From the aorta, branching arteries reach tissues; blood eventually returns through veins.
- **Content beats:** **Establish A:** Follow aorta and major branching arteries through a clearly schematic body silhouette. **Develop B:** Reveal tissue capillary exchange and venous return, without depicting a literal one-beat round trip.
- **Stable composed hold and art:** Quiet pale body map with consistent anatomy colors and scalable SVG paths. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **aortic root widening into body route**; resolve both content beats before the chapter yields; exit through **return veins leading toward right atrium**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Arterial / Venous path” reveals direction and purpose; “Schematic route” remains visible. Build with: Accessible SVG body map, limited non-diagnostic 3D details. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Vertical body route with anchored explanation blocks. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** site implies one blood cell circulates the entire body in one heartbeat or displays fabricated flow numbers.

### CH-11 · Beat Again
- **Why this chapter exists:** Integrate structure, signal and two circulation loops; close without claiming a fixed heartbeat rate.
- **Actual on-site copy:** **“The story has no final beat.”** — Two connected circuits and a repeating electrical pattern keep a living system moving.
- **Content beats:** **Establish A:** Bring back the identical hero heart and separate electrical/flow route layers. **Develop B:** Let visitors switch route and signal views, then rest on the organ that began the story.
- **Stable composed hold and art:** Full anatomical still, harmonized readable two-layer legend and calm final illumination. This is a real reading and observation hold, not an empty pin.
- **Continuity:** Enter via **returning systemic vein outline and anatomical organ identity**; resolve both content beats before the chapter yields; exit through **original hero heart, same orientation and an actual “Begin again” action**. The hold preserves the chosen composition and readable English copy even when the visitor stops.
- **Interaction and medium:** “Electrical sequence / Blood pathway / Both” presents layer separation rather than a medically impossible single glowing path. Build with: Reused original heart art, SVG loop and text-first ending. Controls must have a real result, reset and keyboard/touch equivalent.
- **Portrait / reduced motion:** Separated controls and stacked diagram for narrow screens. Missing assets must fall back to an authored still of **this chapter** while retaining both beats and English text.
- **Reject if:** there is no clear distinction between electrical and circulatory timelines, or it ends on a vague line animation.

## 07. Ten authored transition contracts (all adjacent boundaries)
Progress positions below are **normalized within the indicated transition**, not entire-page percentages or mandated real-time seconds. An in-between scroll stop must remain composed. At each boundary inspect 0/25/50/75/100%, both sides of entrance/exit thresholds, slow and fast forward motion, reverse motion, direct entry to 50%, and target-asset failure. Primary story motion must be solved from scroll position, not from “the previous event happened” assumptions.

### TR-01-02 · The Living Form → Four Chambers
**Narrative bridge and tracked anchor:** The organ exterior leads to the chambers inside it. Keep **real wall edge and fixed anterior axis** visually traceable throughout.
- **0%:** Complete anatomical heart hold.
- **25%:** Camera settles toward predesignated sectional plane.
- **50%:** Interior chambers visible behind a plausible cut surface.
- **75%:** Registered labels take focus, external contour stays.
- **100%:** Four chambers stable.
**Media, depth and type handoff:** Same physical organ shell and orientation; correct cut-face thickness and chamber positions. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show heart section still with correct labels. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Two medical atlas plates, no camera penetration. **Transition-specific rejection:** wall pops out and left/right swap.

### TR-02-03 · Four Chambers → The Signal
**Narrative bridge and tracked anchor:** A known right atrium becomes a landmark for normal electrical activation. Keep **right atrial anatomy and SA-node region** visually traceable throughout.
- **0%:** Chamber diagram stable.
- **25%:** All but right atrial labels reduce emphasis.
- **50%:** Electrical overlay aligns without hiding tissue boundaries.
- **75%:** SA/AV route becomes clear, chamber labels become secondary.
- **100%:** Signal explanation holds.
**Media, depth and type handoff:** Electrical marks are a separate overlay, not tubes or vessel geometry. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show conduction still over registered heart section. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Stepwise signal plates. **Transition-specific rejection:** conduction lines are confused with blood flow arrows.

### TR-03-04 · The Signal → The Return
**Narrative bridge and tracked anchor:** The same right atrium is revisited as the first stop of systemic venous return. Keep **right atrial contour** visually traceable throughout.
- **0%:** Signal overlay visible.
- **25%:** SA-node mark moves to secondary callout.
- **50%:** Vena cava path enters beside fixed right atrial contour.
- **75%:** Blood flow diagram takes focus with separate legend.
- **100%:** Right-side venous return clear.
**Media, depth and type handoff:** Do not cross-fade electrical wires into veins; layer switch is explicitly labeled. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show right atrium and cava diagram. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Two clear route modes. **Transition-specific rejection:** signal visually transforms into blood vessel.

### TR-04-05 · The Return → One-Way Gates
**Narrative bridge and tracked anchor:** Right-heart inflow narrows attention to tricuspid valve mechanics. Keep **right atrium-to-ventricle orifice** visually traceable throughout.
- **0%:** Right return composition steady.
- **25%:** Tricuspid valve shape gains scale.
- **50%:** Valve leaflets and nearby wall remain registered.
- **75%:** Other valves enter via a controlled comparison plate.
- **100%:** Valve atlas readable.
**Media, depth and type handoff:** Use the same tricuspid landmark as opening, then a clearly labeled comparative cut. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show tricuspid detail still. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Paired atrioventricular/outflow plates. **Transition-specific rejection:** leaflet orientation or opening direction silently flips.

### TR-05-06 · One-Way Gates → Toward the Lungs
**Narrative bridge and tracked anchor:** A specific pulmonary outlet takes over the valve survey to lead toward lungs. Keep **pulmonary valve root** visually traceable throughout.
- **0%:** Valve family comparison clear.
- **25%:** Pulmonary valve isolated from other outlets.
- **50%:** Right ventricle/pulmonary trunk align at matched cut section.
- **75%:** Pulmonary arterial branch enters the view.
- **100%:** Right-heart-to-lung route holds.
**Media, depth and type handoff:** Same anatomical outflow root, registered orientation and stable color legend. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show right ventricle and pulmonary trunk plate. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Simple anatomical route sequence. **Transition-specific rejection:** aortic valve accidentally becomes pulmonary route.

### TR-06-07 · Toward the Lungs → Exchange
**Narrative bridge and tracked anchor:** A larger pulmonary arterial branch becomes a correctly marked magnified lung microanatomy diagram. Keep **pulmonary artery branch and explicit scale cue** visually traceable throughout.
- **0%:** Branching pulmonary artery legible.
- **25%:** A boxed scale/magnification cue identifies the target tissue.
- **50%:** Anatomically different capillary and alveolus coexist behind a diagram boundary.
- **75%:** Gas-exchange structures become the primary visual subject.
- **100%:** Alveolar barrier and arrows stable.
**Media, depth and type handoff:** This is a **scale and representation change**, not a continuous geometric tube entering an alveolus. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show complete alveolar-capillary diagram with “Schematic” label. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Static magnified medical plate. **Transition-specific rejection:** blood appears in alveolar air or zoom masquerades as literal continuity.

### TR-07-08 · Exchange → The Way Back
**Narrative bridge and tracked anchor:** Blood leaving the lung microcirculation rejoins the macroscopic pulmonary-vein return route. Keep **capillary outlet and oxygen-rich notation** visually traceable throughout.
- **0%:** Alveolar diagram with distinct air/blood spaces.
- **25%:** Outgoing capillary highlighted.
- **50%:** Scale label guides conceptual zoom back.
- **75%:** Pulmonary veins form a separate broader route.
- **100%:** Left atrial return visible.
**Media, depth and type handoff:** Maintain oxygen notation with real red blood and labeled diagram colors. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show pulmonary vein/left atrium plate. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Two-step venous path stills. **Transition-specific rejection:** blood loops back through pulmonary artery.

### TR-08-09 · The Way Back → The Stronger Wall
**Narrative bridge and tracked anchor:** Left atrial return arrives at mitral valve and left ventricle. Keep **mitral orifice and chamber rim** visually traceable throughout.
- **0%:** Pulmonary veins and atrium read.
- **25%:** View traces through correct mitral position.
- **50%:** Thicker ventricular wall enters cutaway.
- **75%:** Left ventricular section dominates.
- **100%:** Wall comparison holds.
**Media, depth and type handoff:** Keep physically plausible chamber/valve geometry; do not slide a free-standing new heart model in. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show LV wall section with visible mitral relation. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Paired left atrium/LV plates. **Transition-specific rejection:** wall orientation or flow becomes inverted.

### TR-09-10 · The Stronger Wall → Around the Body
**Narrative bridge and tracked anchor:** Aortic outflow leads to a schematic, intentionally different body-scale circulation map. Keep **aortic root and aorta** visually traceable throughout.
- **0%:** Thick left ventricle and outlet valve hold.
- **25%:** Aortic root trace extends upward.
- **50%:** Anatomical cutaway meets a marked schematic body diagram.
- **75%:** Systemic artery branches become clear with legend.
- **100%:** Body circulation illustration stable.
**Media, depth and type handoff:** Explicit object-to-diagram change through the aorta, not false real-world continuous 3D flying in vessels. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show complete aorta/body map plate. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Labeled anatomical-to-map still sequence. **Transition-specific rejection:** aorta connects to venous return by an invented shortcut.

### TR-10-11 · Around the Body → Beat Again
**Narrative bridge and tracked anchor:** Systemic venous return completes conceptual circulation and revisits original heart. Keep **venous return line entering right atrium** visually traceable throughout.
- **0%:** Body map and return route readable.
- **25%:** Vein trace approaches heart area.
- **50%:** Same hero organ appears as the map recedes behind its actual outline.
- **75%:** Separate electrical and blood overlays settle into their own layers.
- **100%:** Final heartbeat atlas holds.
**Media, depth and type handoff:** Reintroduce exact hero model pose/material and preserve color legend/two clocks. Old English caption leaves the reading/focus zone before the incoming caption occupies it; the target scene always owns the end state.
**Reverse / direct / loading contract:** Evaluate the identical staged function in reverse; direct landing at 50% cannot require prior playback. If target assets are not ready, show final hero anatomical still with separate path overlay. Guard against stale async asset completion overwriting a newer target. **Mobile and reduced motion:** Static original heart and selectable loop plates. **Transition-specific rejection:** ending makes false claim that one cell completes the circuit in one beat.

## 08. Risk register: exact model, asset and identity handoffs
Never promise arbitrary mesh morphing. Classify each change as (1) one parameterized physical object, (2) two separate objects joined by a scene-owned occluder or projected outline, or (3) image / realtime 3D / pre-rendered sequence joined by a prevalidated matched frame. A transparent dissolve is not evidence of physical continuity. Each handoff must document entity identity, units, local axes, pivot, projection and silhouette, FOV and camera target, near/far clipping, lighting direction, tone mapping/color management, support/contact shadows, transparency/depth order, shader/texture readiness, active asset token, reverse restoration and reduced-motion composition.
1. **Anatomical orientation contract:** Declare anatomical right/left, viewing direction, permanent heart coordinate system, cavity topology, branch origin, major valves and schematic vs realistic layers. Code and art tests must compare to vetted medical reference, not only a generated image. **Failure probe:** Inspect cross sections CH-02/04/08/09 at desktop/portrait; reject mirror inversions and wrong attachments.
2. **Valve and flow timing:** Separate a named electrical-state timeline from an explanatory transport path. Do not show all valves opening simultaneously or demand a full circulation loop within one beat. **Failure probe:** Freeze valve action in CH-05, jump to CH-10 and return; state must not imply contradictory flow/closure.
3. **Pulmonary artery → alveolus diagram:** Make the microscope/diagram boundary explicit, keep blood within capillaries and gases crossing tissue barrier, match color legend and annotation registration. **Failure probe:** At 50% transition disable target WebGL and ensure truthful, fully readable static target diagram.
**Fidelity fallback hierarchy:** Use beautiful scientifically accurate annotated atlas stills and precise SVG flow layers rather than an anatomically incorrect, expensive 3D organ. Preserve organ orientation and factual connections at every quality tier. Keep the content outcome and spatial identity intact. Do not call a shallow 2.5D parallax card “fully rotatable 3D.” Core geometry/positions should be deterministic across revisits (stable IDs or seeds) while incidental ambient motion can be time-based.

## 09. Architecture, scrolling, timing and performance
**Use a restrained stack:** Vite + TypeScript, HTML/CSS for real English text and UI, SVG for precise linework and data, Canvas/WebGL for motion that actually benefits from it, refined AI-generated multilayer art for cinematic material, and Three.js only where correct geometry, depth or inspection justifies its cost. React is optional, not an architectural trophy. Verify any library calls against pinned actual versions. Do not add an API server, account system or production-hosting requirement.
**One state authority and one coordinated animation clock.** Integrate one Lenis instance. When a GSAP ticker calls `lenis.raf(...)`, do not also enable `autoRaf` for that instance. Wire Lenis scroll updates to ScrollTrigger correctly, align refresh timing with image/font/pin measurement, avoid duplicate triggers after responsive changes, and dispose listeners/tickers. Put chapter progress and transition progress into a deterministic evaluator such as `evaluateStory({scrollY, viewport, selectedMode, assetsReady, qualityTier})`. Every important DOM title, camera, subject, light, mask and data overlay derives from that same snapshot. If numeric `scrub` is used, DOM and WebGL must consume the same *actual* timeline progress rather than mismatched raw scroll and lagged playheads.
**Continuous input:** wheel/trackpad, scrollbar dragging, Arrow/Page keys, touch, browser find, section links and zoom remain available. Avoid nested scroll traps, scroll-jacking, forced animation completion, excessive Lenis + GSAP + camera easing stacks, and repeat pinning without narrative change. Sections have stable unpinned reading holds; long scroll distance is not a surrogate for content. Stop scrolling during any transition and the picture stays composed without a visible catch-up. Support direct chapter hash, refresh mid-site, rapid top-to-bottom jump, end-to-top reverse, initial scroll during hero reveal, resize and background resume.
**Assets and GPU budget:** preload truly critical hero media; select responsive sources, modern compression and intrinsic dimensions; lazy-load noncritical mid/late resources according to observation and measured demand. Prewarm new shaders/materials before visible takeover where possible. Cache intelligently around the current chapter; release nonshared geometry, textures, materials and render targets only after consumers are done. Pause hidden rendering. Assign an asset request version/target token: when navigating A → B → C quickly, a late B request must never replace C. A target-specific styled still is displayed before target WebGL readiness, not an obsolete model beneath a new title. On WebGL loss, use the same chapter’s still and preserve progress. Avoid rendering all eleven expensive scenes simultaneously.
**Performance reporting:** Measure cold start, first meaningful art, completed hero, time to first interaction, long tasks, frame pacing in heavy transitions and memory behavior during repeated round trips. Log browser, hardware if known, CSS viewport, DPR, throttling, run conditions and caveats. Core Web Vitals reference “good” thresholds (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) are performance targets, not guaranteed local scores. Do not invent a 60/120 FPS claim. Optimize the measured bottleneck without deleting later chapters or degrading the chosen art into placeholders.

## 10. Real interactions and the exact English interface vocabulary
**Interaction priorities:** Empower a precise side-by-side understanding of structure, signal and two flow circuits; no fabricated wellness biometric display.

### Interaction 1 · Orientation and chamber locator
- **Visible English labels:** “Anatomical right”, “Anatomical left”, “Right atrium”, “Right ventricle”, “Left atrium”, “Left ventricle”, “Reset view”
- **Behavior and learning value:** Highlight the appropriate real anatomical chamber with a corresponding English description, preserving fixed orientation and wall positions.
- **Input, reset and failure case:** Real buttons, visible selected focus and labels for nonvisual access; never reset heart axis unexpectedly.

### Interaction 2 · Electrical versus blood pathway
- **Visible English labels:** “Electrical sequence”, “Blood pathway”, “Both”, “Show legend”
- **Behavior and learning value:** The two independent overlays retain distinct graphic syntax and source fact. Switching cannot imply electrical current physically travels in blood vessels.
- **Input, reset and failure case:** Keyboard/touch selects modes; reduced motion shows corresponding labeled stages.

### Interaction 3 · Gas-exchange direction
- **Visible English labels:** “Oxygen into blood”, “Carbon dioxide toward air”, “Show both”, “Reset”
- **Behavior and learning value:** CH-07 shows two truthful arrow directions at a capillary/alveolar interface and clear separation of blood/air compartments.
- **Input, reset and failure case:** Directions available in text labels and non-color shape; no unreviewed diagnostic quantities.
**Shared English-only microcopy contract:** Header `Chapters`, `About this experience`, `Motion: On`, `Motion: Reduced`, `Sound: Off`, `Sound: On`, `Back to beginning`, `Continue`, `Close`, `Retry`, `View as stills`; loading `Preparing the next scene…`; recoverable error `This scene could not load. The story remains available in still view.`; unavailable sound `Audio is unavailable in this version.`; ending CTA `Explore the chapters again`. Adapt tone to this work but never leave an empty, ambiguous or mixed-language control. Audio is opt-in and silent by default, with an immediate off control and properly licensed samples. No action is decorative; opening a modal, selecting an option, downloading, or clicking “Continue” must have the actual described effect.

## 11. English editorial design, responsive composition and accessibility
**English from instruction through implementation:** all authored project files, section headings, navigation, metadata (`<title>`, descriptions, Open Graph alt), generated image prompts, English transcripts, button tooltips, captions, `aria-label`/`alt`, modal text, keyboard instructions, text inside exported images/video (prefer to avoid baked text), notices, empty/error/retry states and README must be in fluent English. Set `<html lang="en">`; English is the sole public locale. Existing technical symbol names and proper nouns may stay as established, but do not expose Chinese labels. Add an automated check for unintended CJK in source text and visible UI; a no-CJK regex is a guard, **not** a substitute for actual English proofreading. Use meaningful copy from each chapter card, not generic slogans. Any scientific or technical claim appearing on the public site should be reviewable against the source list.
**Type and placement:** choose editorial typography appropriate to the subject, with deliberate display/body roles, safe image negative space, natural English word wrapping, sound line height and conservative maximum reading measure. Use CSS Grid/Flex, `clamp()` with bounds and actual DOM flow rather than stacking every headline at one absolute coordinate. Validate real fallback metrics, font swap, long English words, browser zoom and orientation. Dynamic compositing must account for bright regions moving beneath a text panel. Old chapter text must not collide with new text or remain focusable once hidden; artwork must not hijack pointer input. Do not “fix” collisions by deleting prose, shrinking below readable size, disabling zoom or hiding whole-page overflow.
**Required CSS-viewports:** 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160; also test breakpoints on both sides, a short landscape configuration, and representative 125%, 150% and 200% browser zoom. Run the full 11-section / 10-transition main path on at least one desktop and 390×844 phone emulation. Others get risk-based verification of hero, longest copy, hardest transition, most complex interaction and ending. A 4K CSS viewport is not proof of testing real 4K hardware. Mobile composition is redesigned shot-by-shot; do not simply crop the desktop master or remove essential chapters.
**Accessible real states:** semantic headings, keyboard-operable chapter menu, visible focus, Escape-to-close, focus return after dialogs, scroll-target focus semantics, non-hover equivalents, minimum practical touch hit areas, labeled buttons/sliders, text alternatives for diagrams, and no information conveyed by color or motion alone. Reduced-motion (`prefers-reduced-motion`) and an optional UI setting preserve all 11 chapters and every meaningful interaction result, using stable still states and small reveal steps rather than disorienting camera flights. Reduced mode may disable Lenis smoothing. Respect pause/stop requirements for relevant prolonged auto-motion. If a feature requires directional dragging, provide a button or keyboard option. Do not claim accessibility conformance without real testing.

## 12. Work gates and evidence-driven review
- **G0 · Inspect:** Read current workspace and any project-specific AGENTS.md; verify permitted tools, asset access, build environment and actual ability to generate images. Confirm no publication permission.
- **G1 · Research + image generation:** Review each cited primary source, produce **all 8 real art outcomes**, reject bad candidates, form a complete visual bible, story/transition ledger, asset provenance and a hero-to-mobile plan.
- **G2 · De-risk:** Prototype and actually browser-test **CH-01→CH-02** and the hardest subject-specific handoff (**CH-05 valve cutaway and CH-06 → CH-07 pulmonary artery-to-alveolus representation change**). Fix the framing, media choice or geometry before extensive full-production work.
- **G3 · Full narrative:** Establish all 11 navigable, genuinely authored chapters early, then implement the final media, content beats and all 10 handoffs. No “Coming Soon”, repeated scene wallpaper, false link targets or skeleton chapters in completion delivery.
- **G4 · Artistic correction:** Compare actual site captures to selected concept images. Identify and refine the **two weakest non-hero chapters and weakest transition**. Improvements must be visible in content, material, camera, layout or motion, not merely a new background color.
- **G5 · Production acceptance:** Run production build and local production preview. Use a real browser (e.g., Playwright) for scrolling forward/back, chapter jumps, viewport variants, keyboard/touch emulation, failed resources, return/reload and recorded visual review. Log actual failures and retest after fixing root causes.
- **G6 · Unpack and verify:** Produce the final source ZIP; extract it to a separate clean directory, follow the README, install dependencies, build and run a local production preview. Verify first, middle and last chapters and all packaged media paths.
**Evidence matrix — minimum coverage:**

| Target | Actual tests | Evidence / rejection conditions |
| --- | --- | --- |
| 11 chapters | Each has two real beats, authored English content, stable hold, enter/exit, mobile/read-only equivalent | Chapter ledger with real captures; reject repeated or empty late chapters |
| Hero six states | Cold and partial loading, mid-reveal, complete desktop/portrait still, first scroll, return | Actual capture compared to selected AI concept; no black blank, text collision, or major visual downgrading |
| 10 transitions | 0/25/50/75/100% and threshold-neighbor frames; slow/fast, forward/reverse, direct midpoint | Boundary capture/contact sheet and continuous observation; reject one-frame flash, depth pop, lag, dual silhouettes |
| Active controls | Initial/select/change/reset, keyboard, touch emulation, tab/focus, disabled/error | Explicit expected→actual logs; no inert decorative control |
| Recovery | Mid-page reload, hash, history, large jump, resize, background resume, failed image, late font, unavailable/lost WebGL, stale late resource | Reject chapter/title identity mismatch, unbounded replay, blank target scene or race overwrites |
| Typesetting | Font-before/after, zoom, long heading, overlays, intermediate lighting, narrow view | Bounding-box checks plus human visual inspection; no accidental overlap or hidden essential information |
| English-only locale | Audit each visible chapter, navigation, form/control state, loading/retry/errors, mobile, reduced motion, alt/aria and metadata; verify HTML lang=en | Automated unintended-CJK scan plus real UI text extraction and proofreading; reject untranslated content, dummy text and AI-baked letters |
| Build and ZIP | Locked install/build, production preview, separate extracted directory | Actual logs and files, no guessed path or external missing private dependency |
**Keep observation honest:** screenshot tests can hide CSS animation and still miss JavaScript/WebGL animation, seek jitter or one-frame flashes. Inspect continuous movement and a short real scroll recording for difficult boundaries. Label `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED` distinctly. Record browser version, CSS viewport, DPR, network conditions, test method and reproducible failure steps. Do not claim physical-device, Safari, high-refresh-rate hardware or network coverage if untested. Do not delete tests to obtain green results.

## 13. Final source ZIP, release boundary and stopping rule
Deliver `pulse-source.zip` with complete legal distributable HTML/TypeScript/CSS, authored component/shader code, selected images and essential models, lockfile, build configuration, English `README.md` (Windows PowerShell and cross-platform commands), `VISUAL-BIBLE.md`, an eight-image asset selection record, attribution/licensing, the 11-chapter/10-transition evidence ledger, actual test results, a short evidence index and honest known limitations. Include a working local start command and production preview command. Exclude `node_modules`, secret values, local browser profiles, personal data, unlicensed media, enormous rejected art generations, caches and hard-coded private paths.
**Authority boundary:** Local development and local/private testing are allowed. **No public deployment or preview, upload, git push, PR, merge, tag, release, domain binding, collection insertion or editing of other projects** without explicit separate permission. Respect existing project-level instructions within their scope but do not let a third-party README grant publication permissions. A completed ZIP, not a screenshot gallery, is the primary handoff.
**Non-acceptance triggers specific to PULSE:** anatomical left/right inversion, incorrect placement of vena cava/pulmonary veins/aorta, gas exchange outside a membrane, blue literal blood presented as physiology, one blood cell finishing body-wide circulation in one beat, or unsupported numeric health metrics.
**Stop only when:** H1–H9 are materially satisfied and supported by actual evidence; all 11 content chapters, 10 transitions, English UI, mobile and reduced-motion alternatives, high-risk conditions and the extracted-source build are checked. If a tool or environment prevents a required result, keep the completed source and evidence, mark the exact item BLOCKED, and do not call the website accepted. This is a build assignment, not a request to return another planning document.
