# Visual Bible

## The world

**Mode: Experience.** The visitor enters the body of an instrument. A giant amber surface owns the opening; precise high-contrast serif type inhabits the surrounding darkness. Silence carries as much weight as motion.

Research and ten full-screen composition candidates preceded implementation. Nine section directions were curated. The distant-violin Hero candidate was rejected: the room and plinth diluted the required architectural scale. The extreme crop was retained and refined into a transparent instrument asset. All captions, navigation and graphic lines were removed from production image plates; final controls and visual systems are real code.

## Visual tokens

| Token | Value | Role |
|---|---|---|
| Gallery | #080808 | Main stage |
| Ivory | #f2ebdd | Primary type and luminous lines |
| Paper | #ded3bd | Raw material interlude |
| Ink | #211b15 | Type on paper |
| Amber | #c8894d | Surface and active detail |
| Resin | #724021 | Recessed warmth |
| Muted | #b9aa94 | Secondary copy on black |
| Hairline | rgba(242,235,221,.25) | Rules and quiet structure |

Display: self-hosted Cormorant Garamond, 300/400 normal and italic. Roman first line, italic second; optical size responds to viewport. Small metadata and interface captions use DM Sans, with deliberate light tracking; the principal text controls retain the serif voice. The masthead is a small spaced Roman wordmark. Display sizes exceed ordinary interface type because the brief explicitly asks for a monumental poster.

No card grid, no store chrome, no musical notation, no equalizer, no ornamental HUD. Navigation recedes to the top edge; a chapter score at the bottom gives orientation. Real focus states and a chapter index make the long experience traversable.

## Scene architecture and bespoke systems

Each scene has Enter → Stable Composition → Living Hold → Handoff → Exit. Scene geometry is a pure function of scroll; ambient time affects only restrained light and vibration phase.

| Scene | Composition / copy | Custom visual system and handoff |
|---|---|---|
| 01 Presence | Right 62% monumental violin crop. Left: **Silence, / shaped.** | Native transparent foreground gives real type occlusion. A moving light follows the varnished rim. STRING starts on the photographed instrument; CURVE follows its edge toward grain. |
| 02 Wood | Brief bright raw-timber world. **Before sound, / a living grain.** Three materials: Spruce, Maple, Ebony. | Material-specific photo plates with live surface-following grain traces and changing light. Selected grain converges into a plate outline. |
| 03 Craft | Quiet oblique structural reveal on black. **Made by hand. / Held by curves.** | Original parametric violin model: curved plates, thin ribs, f-holes, neck, ebony fingerboard, bridge and four strings. Top opens gently; no explosion. A fallback plate retains the chapter without WebGL. |
| 04 Inside | Low internal viewpoint, unfinished wood, slender treble-side post and bass-side bar. **A small space. / An enormous voice.** | A f-hole-led transition, local raking-light trace and an original sectional SVG connecting top and back. The trace becomes a tensioned string. |
| 05 Tension | Macro bridge at right; four silver strings registered to the crown of the bridge over black. **Hold the / almost.** | String slack, endpoint registration, travelling highlights and tension are drawn live. The scene prepares the exact contact geometry. |
| 06 First Bow | Large vertical bow hair meets the horizontal string. **Then, / contact.** | A native transparent bow asset moves continuously; progress controls gap, contact, loading and drawing. Canvas controls pinned-end displacement. The living hold sustains motion. Optional Draw the bow control changes the same progress. |
| 07 Resonance | Curved instrument outline expands at right. **One motion. / A thousand echoes.** | Original sampled contour field follows string → bridge → plate → body → air. String/Body/Air controls change the interpretation. No measured mode claims. |
| 08 Sound as Space | Full-viewport line sculpture. **Sound, / without edges.** | The same body contours become a spatial acoustic ribbon with a controllable opening. Lines interleave with typography; a quiet center remains legible. |
| 09 Return | The same instrument and opening crop return. **Now, / listen.** | Resonance contracts into the same STRING; varnish light quiets. Begin again restores the opening, and Credits explains sources and interpretation. |

## Shared elements

STRING uses consistently ordered samples, not disconnected replacements. CURVE is an authored violin outline and f-hole path reused in structural geometry, grain tracing, handoffs and acoustic fields. No decorative waveform is unrelated to the instrument.

## Responsive composition

- Desktop / 1080p / 1440p / 4K: full-width stage, photographic assets scale with the frame, controlled pixel budgets. No desktop max-width letterboxing.
- Mobile: typography moves into the upper third; instrument crops toward the lower/right half. The material selector becomes compact. The structural study uses a smaller, separately framed viewing area. Contact geometry moves lower and to the right to stay clear of copy. Resonance uses fewer contours and shorter document travel. The spatial field quiets locally around small reading and input zones while preserving its large contour composition.
- Reduced motion: nine sequential shorter compositions with no long pin, no large camera travel, and representative static acoustic states. User controls remain functional. The footer joins the normal document flow so it cannot cover controls while a short viewport reads a taller panel.

## Motion contract

One Lenis with autoRaf disabled. GSAP ticker calls Lenis, then the one render routine; no other animation frame owner. ScrollTrigger writes the master score. Forward, reverse and arbitrary jumps reconstruct all state. Native resize, font/media readiness, pageshow, visibility restore and media-query changes synchronize geometry. Dynamic images use edge blending or native alpha; no broad tinted wash over varnish.

## Medium decisions

True 3D is limited to the structural reveal where depth and separate parts are meaningful. Hero/wood/interior use production AI plates with native typography, compositing, masked light and live paths. Bow contact and acoustic curves are procedural. This deliberately avoids requiring a whole photoreal instrument renderer to match photographic surface quality.

## Concept authority

docs/concepts contains the nine selected section reference screens. Generated concept microcopy and navigation mistakes are normalized to the copy in this document. They are implementation references, never flattened website screenshots. Production originals and exact prompts are listed in docs/PROVENANCE.md and assets-originals/manifest.json. No discarded candidate image is shipped.

## Collection integration

The authored nine-scene composition and identity remain intact. The Collection retains one Lenis at interpolation 0.105 with its existing GSAP clock, disables wheel smoothing in reduced motion, uses namespaced local media and native Collection return, and retains the source/generated-image distinctions. The original prompt and PNG records live under provenance/luthier/assets-originals/; historical validation is preserved separately in UPSTREAM-VALIDATION.md.
