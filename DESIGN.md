---
name: Beyond the Limit
description: A cinematic racing laboratory for curious Formula 1 newcomers.
colors:
  accent: "#f04432"
  accent-on-paper: "#c6271b"
  carbon: "#08090b"
  foreground: "#f4f4f0"
  muted: "#a8a8ae"
  line: "#35363b"
  paper: "#eeeef0"
  ink: "#141518"
  muted-on-paper: "#5f6066"
  line-on-paper: "#c7c8cd"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: "0.18em"
spacing:
  gutter: "clamp(24px, 4vw, 112px)"
  section-top: "76px"
  section-bottom: "100px"
rounded:
  circle: "50%"
---

# Beyond the Limit — design contract

## Overview

An experience, told as a night in a racing laboratory. The user delegated design and stack choices and requested completion without another approval round. The six generated chapter references are the visual target; all text, controls, charts and track geometry are native web elements. No generated UI pixels are shipped.

### First viewport

One studio photograph of an unbranded silver Formula concept car, bottom right; monumental condensed BEYOND / THE LIMIT. on the left; short Chinese proposition below. A fine header and bottom reading line are the only chrome. It should read as a motorsport editorial cover, not a marketing card stack. Headline may exceed ordinary UI type limits because it is the explicit core of the visual brief.

### Narrative and rhythm

1. The machine: cinematic hero, then a quiet statement of what Formula 1 is. Preserve the complete opening before the camera push and title separation. The car carries the transition into the introduction; the wind tunnel follows its completed reading window.
2. Invisible force: cool light gallery, side-view car, clickable parts, flowing aerodynamic diagram, speed slider and active-aero modes.
3. Energy: dark engine portrait, POWER / RECOVER / REPEAT, visible energy flow that responds to recover/deploy, 350 kW context.
4. Contact: sculptural tyre, compound controls and relative grip/durability. A concise physical-load and safety bridge.
5. Decisions: cinematic pit lane image, standard/sprint weekend tabs and an honest, adjustable strategy model.
6. The world: actual circuit geometry, three contrasting tracks, a strong typographic close and fully accessible sources.

## Colors

Carbon and paper alternate at narrative boundaries. The neutral hierarchy carries reading; racing red marks control state, airflow and the reading progress line. Use the darker accent on light surfaces. Tokens in the frontmatter are normative.

## Typography

- Latin display: Barlow Condensed, 700/800/900, self hosted; Chinese: Noto Sans SC with platform fallback.
- Explanatory copy is generally 13–16px with generous line height; standard micro labels and fine print are 11px. Decorative image captions are smaller, with their meaning repeated in normal-sized source disclosures. Engineering readings use tabular numerals.

## Layout

Open full-bleed layouts with the shared gutter; avoid a repeated card grid. Mobile moves engine and tyre imagery between title and interactive explanation. The desktop hero is pinned briefly; mobile remains in normal flow. At 360px and below the display heading scales to 24vw to preserve both words and the red full stop.

## Elevation & Depth

Depth comes from lighting in the image plates, overlapping camera layers and restrained parallax. Information surfaces remain flat. Image-edge masks blend the plates into their section ground without blurring engineering detail. The fixed header uses a near-opaque ground instead of expensive backdrop blur.

## Shapes

Thin rules separate content and controls. Photography remains rectangular; circles are reserved for tyre selectors, hotspots and directional controls. Do not round the large media into cards.

## Components

Native buttons expose pressed state, ranges retain keyboard operation, and weekend tabs implement arrow/Home/End navigation. Focus rings remain visible. Source and model explanations use native details disclosures. State is conveyed through text as well as color.

Motion: narrative progress is linear and reversible (`scrub: true`); Lenis supplies the only scroll interpolation, unchanged at 0.105. Anchor navigation uses a 1.05s cubic deceleration. Large image translations and pushes carry the camera; clipped horizontal typography provides a secondary rhythm. No delayed scrub, repeated card stagger or independent fade-up reveal system.

### Scroll and interaction

Lenis is fed by one owned GSAP ticker. Wheel smoothing uses restrained interpolation; touch keeps native momentum. No full-page snapping or navigation-blocking intro. Each chapter follows Enter → Hold → Exit. The desktop opening, introduction and five main scenes use CSS sticky with measured travel retained in normal document flow; there are no negative margins that let B consume A's reading window. No ScrollTrigger pin spacers are inserted.

Reading geometry accounts for the header and shared gutter. Hold distance depends on available viewport height, protected content height, text lines and controls; it is not a fixed section extension. A composition taller than the viewport scrolls through naturally before its final important group receives a hold. Content entry and outgoing image motion have separate progress ranges, with neither advancing during Hold. Existing diagonal surfaces stay inside B, below its content, and cannot mask A. Mobile uses normal flow; its reading window ends when the protected first line approaches the header, allowing B's ground to appear below without covering text. Scroll reversal traverses the same ranges without changing z-index.

One shared, cached SVG stroke moves from the introduction to airflow, the energy orbit, tyre contact, pit-lane ground, a strategy datum and the selected real circuit. It is a visual guide, never an additional telemetry series. Cross-chapter morphs start after A's Hold, finish at B's completed entry and remain hidden during stable reading. Controls remain above their scene and interactive. Geometry is sampled before ScrollTrigger refresh at settled checkpoints, including disclosure and viewport changes. Scroll frames interpolate cached points and never measure boxes or SVG paths.

Offscreen Canvas and loops are suspended. Canvas has a 3-million-pixel budget, and only small moving SVG markers are promoted to transform layers. Reduced motion removes sticky wrappers, masks, parallax and continuous motion; controls retain state updates. Mode rebuilding preserves the reading anchor and rechecks settled geometry without overriding subsequent input. Navigation, tab groups, range controls and source disclosure remain keyboard accessible.

## Do's and Don'ts

### Accuracy and intentional deviations from generated concepts

Generated labels are not a factual source. Remove invented nav items, numbers, slogans and brands. In particular, the energy bar is illustrative stored energy, never efficiency; practice sessions are 60 minutes; 2026 qualifying is 18/15/13 minutes; strategy compares two valid one-stop examples, never presents a dry no-stop race as the baseline. Track shapes use MIT GeoJSON instead of the concept's inaccurate track drawing. Images are visibly credited as AI concept illustrations.

### Acceptance

- Every section, CTA and interactive control complete.
- Correct copy and cited sources, including 2026 active aero vs historical DRS.
- No horizontal overflow at 390, 768, 1440, 1920, 2560 and 3840 CSS pixels.
- Loading and missing-media states preserve useful content. Images self hosted, responsive WebP; no remote runtime dependency.
- Real browser interaction checks, keyboard checks, reduced-motion checks, network/console health and bounded scrolling performance sampling.
- No blanket claim of 60 FPS on untested hardware; distinguish measured browser frames from physical high-refresh/touch acceptance.
