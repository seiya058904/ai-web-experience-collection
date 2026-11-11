---
name: CHRYSALIS
description: The architecture of becoming
colors:
  forest: "#173924"
  deep: "#122a1b"
  leaf: "#506a3c"
  pearl: "#e7e7cf"
  gold: "#d1b974"
  jade: "#5b8d69"
  copper: "#c8703a"
  ink: "#1f1c1c"
  muted: "#c2cbb3"
  line: "rgba(231,231,207,.27)"
  light-muted: "#4c6445"
  light-line: "rgba(23,57,36,.26)"
  light-gold: "#715b28"
  study-deep: "#102d25"
typography:
  display:
    fontFamily: "'Libre Caslon Display', Georgia, serif"
    fontSize: "clamp(76px, 7.6vw, 142px)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-.028em"
  headline:
    fontFamily: "'Libre Caslon Display', Georgia, serif"
    fontSize: "clamp(55px, 5.7vw, 102px)"
    fontWeight: 400
    lineHeight: 1.01
    letterSpacing: "-.025em"
  title:
    fontFamily: "'Libre Caslon Display', Georgia, serif"
    fontSize: "39px"
    fontWeight: 400
  body:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
  lead:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: ".08em"
  control:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "14px"
    fontWeight: 400
  action:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "16px"
    fontWeight: 400
  brand:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "17px"
    fontWeight: 500
    letterSpacing: ".17em"
spacing:
  gutter: "clamp(24px, 6.1vw, 120px)"
  gutter-mobile: "24px"
  gutter-narrow: "20px"
components:
  text-link:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    typography: "{typography.action}"
    padding: "13px 0"
  text-link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    typography: "{typography.action}"
    padding: "13px 0"
  quiet-button:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    typography: "{typography.control}"
    padding: "8px 0"
  comparison-button:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    typography: "{typography.control}"
    padding: "14px 18px"
  comparison-button-selected:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    typography: "{typography.control}"
    padding: "14px 18px"
  site-header:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    padding: "0 clamp(24px, 6.1vw, 120px)"
    height: "91px"
    width: "100%"
  site-header-scrolled:
    backgroundColor: "#173924f7"
    textColor: "{colors.pearl}"
    padding: "0 clamp(24px, 6.1vw, 120px)"
    height: "72px"
    width: "100%"
  information-dialog:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.pearl}"
    padding: "48px"
    width: "min(850px, calc(100% - 40px))"
  transition-caption:
    backgroundColor: "#173924ee"
    textColor: "{colors.pearl}"
    padding: "22px 25px"
    width: "min(410px, 42%)"
---

# Design System: CHRYSALIS

Reviewed: 9 November 2026  
This document records the selected design and how the current source expresses it. It is not a browser PASS report, performance claim or independent aesthetic score.

## Overview

**Creative North Star: "The architecture of becoming"**

A complete English-language editorial journey follows one illustrated monarch through eleven chapters. Each chapter has a distinct reason to exist, two content beats and a reading hold. The visitor can scroll normally, jump through the chapter index, inspect a comparison, return to an earlier state, or select the still view.

The design combines full-frame macro moments with open museum spreads and explanatory workbenches. It does not repeat the same image-and-caption layout eleven times. The source and image provenance remain available to explain where observed biology ends and authored illustration begins.

**Key Characteristics:**

+- Photographic-style AI macro plates with real selectable English typography.
- Full-frame observations alternate with open reading spreads and labeled SVG studies.
- A recurring leaf vein and later silk attachment maintain visual continuity.
- One-time arrival and reversible interactions; no perpetual decorative animation.

The YAML frontmatter extracts the current base desktop tokens from CSS. Responsive overrides, shadows, motion, component states and specimen snippets are recorded in `.impeccable/design.json`. Its eight-step OKLCH ramps are synthesized swatch aids for the documentation panel, not additional colors used by the application. Existing implementation notes below are retained; the sidecar is a documentation specimen, not a visual acceptance result.

Standalone component specimens include the existing forest page surface where their transparent backgrounds require it; these preview wrappers are not new application components.

## Chapter composition and interaction

| Chapter | Composition | Actual observation control |
| --- | --- | --- |
| CH-01 · An Egg in the Green | Full-frame AI-04 desktop or AI-05 portrait, left title, lower species caption; two observations below. | “What am I seeing?” opens species and interpretation notes; the primary link moves to CH-02. |
| CH-02 · Milkweed, the Host | Narrow botanical reading column and larger host-plant plate. | Show/hide the outlined host study. |
| CH-03 · The Shell Opens | Close macro window beside a compact heading, followed by a specimen strip. | Three buttons change the hatching SVG pose and caption. The main AI image is the completed hatchling observation. |
| CH-04 · The First Meal | Pearl background, image-first feeding spread, dark comparative study beneath. | Before/After explicitly compares the diagram below; the generated feeding plate remains an after-feeding reference. |
| CH-05 · Five Instars | Broad museum specimen workbench on pearl, with a dark comparative field. | Five individual stages plus Show all change morphology, title and explanatory copy. Display sizes are not a measured scale. |
| CH-06 · A Place to Hang | Full-height hanging larva against dark green, real support visible. | Attachment dialogue distinguishes the larval rear attachment from the later pupal cremaster. |
| CH-07 · The Jade Vessel | Sculptural jade image with restrained left narration. | Skin/Chrysalis swaps the selected J-hanging and jade plates with corresponding captions. |
| CH-08 · Inside the Change | Separate study introduction and large explanatory plate. | Exterior/Illustrated inside toggles between opaque pupa and labeled reconstruction; Reset returns to exterior. |
| CH-09 · A Pattern Beneath | Matched late-pupa frame using the same silk reference. | Early/Late swaps AI-06 and AI-08; no universal duration is assigned. |
| CH-10 · Emergence | Warm hanging-adult crescendo, followed by an inspection strip. | Three positions change the diagram and description. The main image uses AI-07 for emergence and AI-15 for expanded hanging wings; it is not three measured photographic frames. |
| CH-11 · First Flight | Original host habitat, separate adult foreground, then a four-stage life-cycle key. | Departure and return are reversible; cycle links and chapter index support revisiting the whole story. |

## Typography

The design uses large, modest-weight Libre Caslon Display headings and Source Sans 3 body/control text. It has a restrained header, chapter numbers, thin rules, understated text links, comparison buttons and native modal dialogs. It avoids decorative dashboards, meaningless metrics, generic card grids and image-baked UI.

Selected controls use a visible underline/color change together with `aria-pressed`. Keyboard users can move through comparison choices with Left/Right, Home and End. Links and buttons have intentional focus outlines. Long prose lives in ordinary selectable DOM text; explanatory figure labels are accessible SVG/DOM content.

The current design tokens and responsive sizing are in [styles.css](src/styles.css) and [scenes.css](src/scenes.css). The locked visual references and light/material rules are in [VISUAL-BIBLE.md](VISUAL-BIBLE.md).

## Scroll and transition ownership

The current implementation uses Lenis with one custom requestAnimationFrame clock and no GSAP runtime. Native actual scroll is the measured source of truth. Chapter and boundary rectangles feed the pure story evaluator; each bridge is evaluated from position, rather than depending on earlier playback events.

All ten adjacent boundaries have explicit source and target plates, deterministic framing and an identifying anchor. Eight use an authored occlusion handoff. The larva-to-pupa boundary (TR-06-07) and pupa-to-emergence boundary (TR-09-10) use complete-pose comparisons: one complete source at the start, two separately framed and labeled opaque poses through the intermediate stops, and one complete target at the end. Each pose retains its own silk support; captions state that the actual skin-shedding or shell-opening movement is not shown. A registered portrait crop retains the complete source height and support rather than joining two incompatible bodies across a wipe.

The reading chapters remain ordinary document sections; only the short bridge frame is sticky. Text stays in its own region while the observations hand over. Neither a biological mesh morph nor a global black fade is used.

The dedicated [transition ledger](docs/transition-ledger.md) defines the five inspection positions and boundary-specific meaning. The design contract requires forward, reverse and direct-entry compositions to remain useful at a stopped midpoint; test evidence must establish whether the browser meets that contract.

## Responsive and low-motion treatment

The hero uses an independently generated portrait at 700 CSS pixels or less. Later scenes preserve the full informational content by placing text above their images and cropping toward the right-hand subject. Comparison controls wrap deliberately, specimen notes become a vertical list, and the chapter-index dialog becomes one column. The fixed chapter rail is removed on narrow screens.

Reduced motion disables the one-time light arrival, removes animated departure timing and chooses static bridge states. “View as stills” also removes the bridge sections while preserving the eleven chapters and their controls. The separate reading edition supplies all chapter text, images and sources when JavaScript is unavailable.

There is no WebGL rendering dependency. The experience uses images, SVG, CSS and DOM, so a missing WebGL implementation does not require substituting a different biological story.

## Media loading and failure behavior

The desktop/mobile hero has a matching preload. Other plates are local lazy-loaded assets. Each image request has an identity token so a stale completion cannot replace a more recently selected plate. Each photo also has a chapter-specific embedded fallback thumbnail. A failed image exposes a Retry action while text and comparison results remain available.

If the final alpha layer cannot load, the composed adult still replaces the layered scene. The departure control then swaps adult and clean-leaf stills, preserving its actual result. The final butterfly is a single non-looping authored departure with a reset; it is not an anatomically simulated flight.

The version is silent. The Sound control currently reports that audio is unavailable. No licensed ambience or functioning audio playback is claimed.

## Source responsibilities

| Module | Responsibility |
| --- | --- |
| `src/content.js` | English chapter copy, two beats, biological notes and source references. |
| `src/ui.ts` / `index.html` | Semantic composition, chapter layouts, hero and dialogs. |
| `src/diagrams.ts` | Explicitly authored educational figures and state poses. |
| `src/interactions.ts` | Selectors, disclosures, dialog focus, view preferences and departure/reset. |
| `src/scroll-controller.ts` | Lenis lifecycle, native-scroll synchronization, navigation and restoration. |
| `src/story.ts` / `src/transitions.ts` | Pure position-derived state and boundary definitions. |
| `src/media.ts` / `src/image-loader.ts` | Local asset identities, alternatives, loading and failure handling. |
| `src/fallbacks.json` | Embedded chapter-specific fallback bytes. |

## Intentional limits

The image-generation set contains 15 selected images from 20 actual calls. Native wide rasters are approximately 1.66K pixels across, not 4K; large CSS viewports upscale them. Early and late states are illustrated comparisons, not continuous microscopy. Precise developmental interiors, instar distinctions and the hatching/feeding steps use labeled schematic figures.

These choices are part of the current implementation. Production build, browser actions, narrow-screen rendering, contrast, focus, failed assets and transition aesthetics must be reported in the separate evidence ledger. No unobserved browser outcome is implied here.

## Do's and Don'ts

### Do

+- Do preserve the selected plate, its physical attachment and its text-safe region.
- Do use the independent portrait hero at 700 CSS pixels or less.
- Do label developmental interiors and comparative figures as illustrations.
- Do keep foreground AI-14 registered over clean backplate AI-13.
- Do record native raster dimensions and separate design intent from browser evidence.

### Don't

+- Don't place the moving butterfly over AI-12, which already contains the adult.
- Don't treat a generated frame as microscopy, measured anatomy or a timed recording.
- Don't add continuous decorative loops or block native scrolling for an introduction.
- Don't replace selectable English text with lettering baked into images.
- Don't claim native 4K art or visual acceptance without corresponding evidence.

