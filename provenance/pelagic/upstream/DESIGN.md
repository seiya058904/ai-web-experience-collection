# Visual Bible — PELAGIC

## Direction

Experience mode: a quiet natural-history observation window. The first screen leads with a complete fragile colony, an asymmetric branch of tissue and one minute warm lure. Museum typography, living tissue, directed light. No submarine HUD, starfield, depth journey, cards or audio-reactive effects.

Hero A is the chosen composition and tissue reference. Hero B is an equally resolved macro alternative but its stylized lure anatomy and weaker mobile silhouette rule it out for production. The midpoint study fixes the same camera and body across light reduction. The squid study fixes material and silhouette, not a factual signal meaning. The final cutouts are newly generated production assets with corrected swimming-region grouping and neutral squid skin; the runtime supplies illumination and pigment masks.

## Visual system

| Token | Value / use |
| --- | --- |
| Water | `#071923` |
| Dim water | `#07141b` |
| Depth | `#17343b` |
| Ink | `#e8e2cf` |
| Secondary | `#9dbebb` |
| Lure | `#be5142`, with a very small warm core |
| Display | Locally bundled Cormorant Garamond 400; italic for emphasis |
| Body / controls | Locally bundled Manrope 400 and 500 |
| Grid | Desktop 7vw margins, left 36% copy, right 60% observation space |
| Controls | Fine rules, native range inputs, text actions and visible keyboard focus |
| Motion | Slow, tiny, phase-offset tissue displacement; a single GSAP ticker |

No generated lettering is used. The brand reads PELAGIC. Hero title: “A language of living light.” Hero description: “Turn down your light. Discover a world that makes its own.” Hero action: “Change the light”. Navigation: “Observations”, “Field notes”, “Pause motion”. Scientific labels and authored/manual mode labels are functional information from the brief, not invented metrics.

## Medium and observation limits

An original 2.5D cutout is rendered in strips to allow sub-pixel, phase-shifted tissue motion. A derived, surface-only lighting channel is composited with the weak exhibition-fill channel. The terminal lure, connection stalk, local glow and fish path are authored geometry. The squid's body-alpha mask bounds two computed pigmentation fields. Backlight changes pattern visibility independently of the survey light. The viewer has no unrestricted rotation, because the observation is a limited view, not an all-angle 3D reconstruction.

The primary renderer uses Canvas 2D. It does not request WebGL. An SVG edition uses the same local art and state, and remains available if canvas creation fails or the visitor requests the illustrated view. All rendering is scheduled from the same clock as Lenis. A local embedded first-frame image and original inline anatomy diagram keep the subject visible if large art is delayed or fails.

## Stable compositions

| Act | Body / camera | Text | Observation |
| --- | --- | --- | --- |
| I Encounter | Complete colony on right, curved vertically; lure below its feeding region | Large, three-line serif at left | First frame already contains the animal; a small sideways light reveal adds thickness |
| II Less light | Same subject, same terminal lure, fixed camera | Left copy clears first; controls occupy their own flow | Native Survey light; weak fill preserves silhouette; emission independent |
| III Purpose | Colony slightly smaller and higher; fish follows a curved approach from left/below | Short copy plus independent playback row | One deterministic encounter; a pause near the lure and a gentle turn away, no capture spectacle |
| IV Pattern | Separate squid in a new observation window, whole mantle, fins and arm crown | Left copy; pattern, light and hypothesis controls | Bilaterally pale/dark versus countershaded; no invented translations |
| V Look again | Exact initial colony composition returns | Short ending and references | User light remains; optional comb-row comparison; no marketing ending |

## Transition contracts

Global narrative positions are 0, 1, 2, 3 and 4. Each handoff occupies the last 42% of its interval; the stable hold occupies the first 58%. Values below are normalized within that handoff. All are reversible pure functions of scroll. Settings are independent.

| Handoff | 0% | 25% | 50% | 75% | 100% | Shared anchor |
| --- | --- | --- | --- | --- | --- | --- |
| I → II | Body fully lit | Hero exits | One side still lit, lure gains prominence | New light explanation enters | Stable dim observation | Same stem, lure, camera; manual mode bypasses only authored light |
| II → III | Dim colony | Small camera pullback | Fish, body and lure legible | Behavior controls enter | One encounter begins if not previously played | Single lure and fish object, separate behavior position |
| III → IV | Encounter held | Old text clears, colony moves right | Separate silhouettes at opposite edges | Squid settles, new copy enters | New observation clearly labeled | Persistent frame, side light and finite water gap |
| IV → V | Squid pattern held | Copy clears | An editorial observation band divides the two subjects | Colony takes the frame | Original colony position restored | Frame and light direction, never an animal morph |

## Mobile and compact layouts

Use a vertically curved animal with upper text, middle observation and lower control flow. Keep readable whole-body silhouettes and reduce secondary annotation before reducing the animal. Short landscape and enlarged-text views use a compact two-column observation. The content region retains native overflow for unusually small heights; keyboard focus can reveal any overflowing control. Resize preserves the current narrative position. Keep real 320px layout checks. Large desktop type scales fluidly; no long line extends into the organism.

## Image decisions

Exact prompts, outputs and SHA-256 are recorded in `docs/IMAGE_GENERATION.json`. The four exploration images are retained only as small evidence copies under `docs/concepts/`. Do not mistake the exploratory anatomy for species evidence. The final production images are under `public/art/`. Source papers and original research photographs are linked, not bundled.

## QA gates

Compare actual desktop, mobile and 4K captures to the accepted camera, copy safety zone, tissue treatment, palette and lure hierarchy. Inspect every handoff at 0/25/50/75/100% in both directions. Test state ownership with a manual light value while jumping and reversing, plus one fish on repeated encounter visits. See `docs/QA.md` for observed results and limitations.
