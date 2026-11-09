# FRAME — primary-source research and asset boundaries

Checked: 2026-11-09. These references inform working methods. They do not grant rights to reproduce the sites' photography, animation, characters, logos, or props. No external reference-page imagery is required for the delivered project.

## 1. ACMI — Make a stop motion animation

URL: https://www.acmi.net.au/education/school-program-and-resources/make-stop-motion-animation/

Publisher: ACMI. Publication date was not established from the retrieved page; do not invent one.

Verified substance: the learning resource asks readers to compare different numbers of captured frames for the same movement, to try repeated stationary frames as pauses, and to use onion skinning to compare the previous capture with the next view. It also stresses consistent lighting and checking framing and playback. Its beginner guidance suggests 8–12 frames per second.

Application to FRAME: expose genuine frame spacing and hold choices; provide a previous-frame comparison; use stable light and texture; keep the task readable at each framing. The particular 24-pose / 12-beat-per-second / 36-base-beat arrangement is the user's creative specification, not a universal stop-motion rule.

## 2. Aardman — Behind the Craft: Wallace & Gromit, Shot On iPhone

URL: https://www.aardman.com/latest-news/2025/june/behind-the-craft-wallace-gromit-shot-on-iphone/

Author: Gavin Strange. Published: 2025-06-09, explicitly displayed by the source.

Verified substance: drawings assembled into an animatic served as the production blueprint. The team overlaid the unusual narrow display silhouette while planning the framing. Because the film was silent, the action and performance had to remain readable.

Application to FRAME: establish the whole small story before asset refinement; rehearse portrait compositions independently; verify the desire, overshoot, pause, and correction without sound. This is a method reference only. Boop, its silhouette, its task, and its assets must remain original. FRAME must be described as digital stop-motion artwork rather than physical set photography.

## 3. Lenis — official repository and package manifest

README: https://github.com/darkroomengineering/lenis

Package manifest: https://github.com/darkroomengineering/lenis/blob/main/package.json

The retrieved official README examples and `main` manifest both identify **1.3.27**. This is the version verified in this research, not proof of the project's installed version; the delivery's actual lockfile is authoritative.

Verified API: import `Lenis` from `lenis`; import `lenis/dist/lenis.css`. `autoRaf` defaults to `false`. Choose either the built-in loop with `autoRaf: true` or one custom loop calling `lenis.raf(time)` in milliseconds. `autoResize` defaults to `true`. Anchor handling is opt-in. The documented GSAP integration connects `scroll` to `ScrollTrigger.update` and converts ticker seconds to milliseconds.

Application to FRAME: one scroll driver, one RAF owner, shared evaluated progress, working anchors, and an explicit reduced-motion/native-scroll path. Do not also enable automatic RAF when manually advancing the instance. Recommended dependency decision: exact-pin 1.3.27 if installation succeeds, then verify the installed package and lockfile. Lenis declares the MIT license; retain its license in dependency attribution.

## 4. GSAP — ScrollTrigger documentation (optional)

URL: https://gsap.com/docs/v3/Plugins/ScrollTrigger/

Verified substance: `scrub: true` connects animation progress directly to scroll progress; a numerical scrub adds catch-up time. For numerical scrub, the documentation recommends listening to the animation's update when synchronizing another layer with the actual tween. Refresh recalculates geometry; it is distinct from updating scroll progress. Very fast traversal can skip a toggle event when both boundaries are crossed within one tick.

Application to FRAME if GSAP is used: derive complete scenes from current state; do not rely on all entry/exit events firing in order. Do not feed one layer raw progress and another a delayed playhead. Use pinning only where the composition needs it. GSAP is optional; its presence is not required to satisfy the brief if all nine reversible transitions are implemented coherently.

## Asset and license ledger requirements

The final project should retain an individual record for every generated concept and production asset: actual filename, tool, exact prompt, purpose, adoption/rejection decision, and usage location. Do not invent seeds or generation settings the tool did not return. Generated-image text never substitutes for semantic DOM labels and controls.

For code-generated frames, retain the deterministic source and record the connection to the selected art direction. For fonts and dependencies, retain the actual shipped licenses. Do not call these sources asset suppliers, imply endorsement, or describe original digital renders as physical photographs.

## 5. Vite — official getting-started guide

URL: https://vite.dev/guide/

The current official guide states Node.js 20.19+ or 22.12+ compatibility requirements, and the installed Vite 8.3.6 manifest declares `^20.19.0 || >=22.12.0`. FRAME deliberately specifies Node.js 24 in its own engine requirement and launch documentation. That project choice is stricter than Vite's minimum; do not attribute a universal Node.js 24 minimum to Vite. The guide documents `vite`, `vite build`, and `vite preview`; it describes production bundling with Rolldown.

## 6. Manrope — Fontsource distribution and installed attribution

Distribution page: https://fontsource.org/fonts/manrope

Upstream project named by the installed font license: https://github.com/sharanda/manrope

The Fontsource page identifies Manrope as a variable sans-serif typeface under OFL-1.1. The installed `@fontsource-variable/manrope` 5.3.0 package includes the SIL Open Font License 1.1 and attributes the font to The Manrope Project Authors, copyright 2019. Its metadata lists normal style and a weight axis from 200 to 800. The exact installed license is retained unchanged under `third-party/fontsource-variable__manrope/LICENSE`; package licensing and the shipped font source are documented in `licenses.md`.

## Research verification boundary

This document records reading of the primary source surfaces and installed manifests described above. It makes no claim that the website, browser interactions, image generation, production build, exports, or ZIP have already been verified. Those claims require separate implementation evidence.
