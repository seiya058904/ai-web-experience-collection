---
name: VEIL — Fabric in Motion
description: A continuous installation of thread, cloth, light and soft structure.
colors:
  ivory: "#e9e6df"
  ink: "#292a28"
  muted-ink: "#64635e"
  dark-space: "#161918"
  hairline: "rgba(41,42,40,.25)"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(64px,7.15vw,268px)"
    fontWeight: 300
    lineHeight: 0.94
    letterSpacing: "-.033em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(11px,.76vw,22px)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: ".035em"
spacing:
  desktop-gutter: "4.2vw"
  mobile-gutter: "24px"
components:
  text-action:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "44px"
  index-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "44px"
  material-control:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    width: "clamp(180px,14vw,380px)"
---

# VEIL — visual and motion direction

## The experience

A single continuous, full-viewport textile installation. Six material studies follow an opening composition. No cards, image galleries, shopping, manufactured statistics or brand claims. English is the exhibition language.

## Visual tokens

The frontmatter records current shared primitives. Motion, breakpoints, the material-sample shadow and representative interface snippets are in `provenance/veil/design.json`.

| Token | Role |
| --- | --- |
| Ivory | Warm studio background; also the main text color in the dark study. |
| Ink | Wordmark, exhibition titles and interactive controls. |
| Muted ink | Labels and secondary reading. |
| Dark space | The light-through-fabric environment. |
| Display type | Slender serif exhibition titles; a slightly firmer wordmark. |
| Interface type | Restrained sans-serif controls and explanatory copy. |
| Desktop gutter | Proportional frame around the spatial installation. |
| Mobile gutter | Fixed readable inset for compact screens. |
| Hairline | Thin structural rules, range tracks and chapter progress. |
| Surface | open space, no containers or card shadows |

## Compositions

1. **Opening:** huge VEIL lettering, silver cloth crossing the right half and occluding some letters. Bottom-left “The poetry of soft structure.” with one sentence; bottom-right scroll cue.
2. **Thread / Weave:** fine strands become a woven surface. “A line becomes a surface.” on the left. Density is an actual interactive material parameter.
3. **Drape:** suspended points, deep hanging folds, thin edges and soft shadows. “The shape of falling.” Tension visibly changes the cloth.
4. **Light:** dark charcoal, broad suspended translucent layers, diagonal light. “Light, held softly.” Light direction is adjustable.
5. **Form:** plane-to-volume motion in the same cloth. Fine seam paths follow its UV coordinates. “Nothing added. Only a fold.” Release and restore run over 1.35 seconds with sine-in-out easing; restore returns to the previous tension. Reduced-motion applies the change immediately.
6. **Detail:** actual over-under woven strands, a local generated silk surface study, fine leader lines. “A world within a thread.”
7. **Veil:** a spatial arrangement of translucent suspended planes; VEIL lettering between layers; “A little matter. An infinity of movement.” and Begin again.

## Motion

One GSAP ticker drives Lenis, ScrollTrigger and the renderer. Scroll sampling is deterministic, with no tween chasing a target. Each scene enters, establishes composition, holds with subtle life, hands off its material, then exits. A common UV surface morphs continuously across the story. All chapter changes are reversible.

Persistent header and chapter rail are anchored to the viewport. Display titles occupy the left or enter the space behind the cloth. Body copy and controls remain in front and legible. Motion pause freezes autonomous drift while preserving deliberate scroll navigation. Reduced-motion removes smooth scroll and autonomous drift, using discrete stable compositions without camera morphing.

## Responsive composition

Desktop keeps the installation on the right and copy on the left. Mobile places the material in the upper two thirds and stacks shorter display text near the lower edge. The chapter rail reduces to a current chapter label and Previous/Next controls; Index retains direct access to all studies. DPR and geometry complexity are bounded.

## Asset treatment and provenance

Original generated photography-like cloth studies support the opening and form a graceful fallback. A generated silk surface study supplies the cloth albedo and the small Detail sample; procedural textures remain available if it fails to load. Geometry, woven yarns, normals, lighting and movement are created in real time. The still edition keeps navigation and readable content, hiding material sliders and fold controls. Research imagery is not bundled. All font files are local. Exact prompts and license notices ship with the project.

## Deliberate functional extensions to the concepts

An accessible motion button, a real chapter index, keyboard focus states, study notes, and three understated material sliders are needed to make the installation usable. Weave and movement are integrated into the other six studies rather than being repeated sections. Original concepts are QA references and are omitted from the delivery.

## Collection integration

Source remains under `experiences/veil/src/`; the independent document is `pages/veil/index.html`. Original images, WOFF2 fonts and notices are namespaced under `public/veil/`. Static font files come unchanged from the delivery; no Fontsource dependency is added. The existing header gains the shared Collection return control. The one GSAP ticker, Lenis lifecycle, common material surface, fold action and still edition remain intact. Document Back and reload retain the browser's reading position; fresh hash entry and subsequent chapter history keep the authored chapter navigation. `UPSTREAM-README.md` archives the supplied build and browser claims; they do not certify the integrated build.
