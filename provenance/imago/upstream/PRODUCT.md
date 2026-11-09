# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the supplied execution brief. The implemented stack is Vite + TypeScript, DOM-based narrative and controls, generated raster imagery, explanatory SVG, and Lenis for coordinated scrolling. Exact dependency versions are recorded in the lockfile by the implementation owner. No account, database, telemetry, external runtime API, or paid runtime service is required.

## Users

General viewers who want to observe and understand a monarch butterfly's changing body. The experience must work for desktop and mobile readers, keyboard users, and people who request reduced motion.

## Product Purpose

IMAGO is an original natural-history web experience following one imagined *Danaus plexippus* through egg, caterpillar, chrysalis, and adult stages. Success means ten complete chapters, meaningful observation tools, a coherent individual across changing forms, and a runnable source archive.

## Positioning

The work concentrates on one life, one recognizable chrysalis, and one attachment point. The visitor compares stages and changes their viewpoint. Scrolling compresses narrative time without claiming to simulate biological development.

## Operating Context

The deliverable is a self-contained source project for local installation, production build, and preview. The user primarily works on Windows, so the handoff includes straightforward Windows launch instructions. Source and assets must survive extraction into a different directory. Dependency installation may require network access; the finished site must not require a live image, font, or AI API.

## Capabilities and Constraints

- Ten named chapters and nine neighboring transitions, with two substantive content beats in each chapter.
- A finished Hero, an independently composed mobile image, stage navigation, and a return to the stable entrance.
- Egg detail, instar comparison, J-pose/pupa comparison, an explicitly labeled developmental schematic, a three-stage chrysalis observer, an emergence sequence, wing detail, departure, and a stage review.
- Semantic English text and native controls throughout, including alt text, errors, metadata, and interaction results.
- Stage selection never rewrites chronological order. Returning, rapid scrolling, direct links, and late resources must resolve to the intended current state.
- High-quality static chapter compositions preserve the whole story when motion, image upgrades, or WebGL are unavailable.
- Real image generation, real browser checks, production build, extraction test, test limitations, and source ZIP are required.
- No deployment, publication, push, pull request, release, or addition to an existing Collection is authorized by this task.

## Brand Commitments

The name is **IMAGO**; the English subtitle is **Wings within**. The voice is patient, observant, precise, and quietly poetic. The supplied brief fixes macro natural-history imagery, tactile biological surfaces, soft upper-left light, an ivory/leaf/jade/orange/charcoal palette, and a restraint on spectacle. The subject must remain an animal in an environment, never jewelry, a magical ornament, or an anonymous butterfly swarm.

## Evidence on Hand

- The supplied `04-imago(1).md` is the scope and authority.
- Biology and English copy: `docs/biology.md`.
- The build session generated the eight required image roles before production layout. The release inventory now records **31 image-generation outputs, 27 canonical art roles, 58 shipping WebPs, and 58 exact prompt sidecars**. Four original registration frames are retained alongside their adopted corrections. [Generation records](docs/image-generation.json), the [release asset audit](evidence/asset-audit-release.json), and the [release packaging audit](evidence/package-audit-release.json) document this inventory; [art-review.md](docs/art-review.md) records bounded reviews of named artworks.
- Hero candidate A was selected: a complete opaque green chrysalis on the right, with quiet space for typography on the left.
- The protagonist and setting are artistic reconstructions, not a photographed or measured real specimen.
- Browser results, asset quality, and packaging are not implied by the existence of these documents; [verification.md](docs/verification.md) records actual checks and remaining limits.

## Product Principles

1. Preserve biological sequence and clearly separate evidence from interpretation.
2. Give each chapter a reason to exist and a composition worth pausing in.
3. Make observation a real action with an understandable result and a way back.
4. Retain the entire narrative across device sizes, input methods, and reduced motion.
5. Report only implementation and verification that actually occurred.

## Accessibility & Inclusion

Set the document language to English. Keep titles, explanatory prose, and control labels in semantic DOM. Provide visible keyboard focus, touch alternatives to dragging, appropriate selected-state semantics, dialog escape and focus restoration, readable contrast, and normal document flow when space is short. Respect system reduced-motion preference and retain every chapter and observation in that mode. Audio is optional and defaults to off if included.
