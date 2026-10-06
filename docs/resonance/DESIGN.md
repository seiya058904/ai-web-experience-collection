# Visual direction

> Collection integration, 2026-10-07: the supplied identity, eight acts and controls are retained. The existing narrow composition now also covers portrait tablets from 761–900px; short landscape keeps the desktop composition. Runtime source is in `experiences/resonance/src/`, the document in `pages/resonance/`, and fonts/notices in `public/resonance/`. See [ACCEPTANCE.md](ACCEPTANCE.md) for intake findings and actual validation.

## World
Mode: Experience. An intimate dark acoustic installation, with a continuous particle field and a trace that changes physical role. The direction is a precision sound laboratory expressed as a quiet digital sculpture, following the supplied eight-scene brief.

## Tokens
- Background: `#0b0d0d`; lifted surface: `#131615`.
- Main ink: `#eeeae1`; secondary: `#a4a79f`; quiet rules: `#464b46`.
- Energy: `#d6b57c`; focus: `#e8cfab`.
- Display sans: self-hosted Manrope, weight 300, tracking -0.04em.
- Display italic: self-hosted Cormorant Garamond, weight 400, tracking -0.025em.
- UI/body: Manrope, 400/500. Functional UI ranges from 11px on compact screens to 17px on large displays; body copy ranges from 12px in short viewports to 23px on large desktops.
- Desktop gutter: clamp(28px, 4.5vw, 160px). Mobile gutter: 24px.
- Controls: fine 1px rules, circular arrow targets, unfilled mode rectangles. No cards.

## Composition and copy lock
1. Silence: left title “Sound, / made visible.”, right suspended membrane. CTA “Disturb the silence”.
2. Vibration: full-width string, title and copy at bottom left. CTA “Pluck the string”.
3. Propagation: tunnel crosses the frame in depth, title upper left “Motion stays. / Energy travels.”
4. Interference: two sources and a standing field. “Where waves meet.”; phase slider.
5. Resonance: left “Sound takes / shape.”, large oblique square nodal plate right; three mode controls.
6. Harmonics: layered harmonic strings above, “One note. / Many voices.” bottom left; frequency control bottom right.
7. Memory: left “A trace of / what was.”, engraved disc right; real tone capture.
8. Return: “Into the air. / Again.” with re-radiating diaphragm, then quiet collapse.

## Continuity
The same seeded field maps into every scene. Native scrolling is authoritative; a single application RAF drives time, geometry, control state and text. The first 54% of each scroll interval is a readable living hold; the last 46% morphs to the next state. Text gives the geometry space during each handoff. The last scene has an additional decay interval.

## Responsive and motion
At widths up to 760px, and on portrait tablets up to 900px, sculptures are framed above the text, with a compact eight-stop rail below. Landscape and short desktop frames use a smaller display size and tighter controls. Reduced motion retains structure and phase controls, softens autonomous displacement, and removes smooth anchor travel. Sound defaults off; no entrance depends on an audio permission.

## Visual references
Eight coordinated generated composition studies were reviewed before implementation. They guide typography, hierarchy, negative space and material language. They are not shipped as scene backgrounds. Geometry, lighting traces and scene-to-scene relationships are authored in code. Their aesthetic patterns are translated into explicit analytic nodal structures where scientific correspondence matters.
