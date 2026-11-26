---
name: collection-qa-release
description: Use when running multi-viewport UI/motion QA, checking per-work Lenis/clock/font sharing conventions, or verifying GitHub Pages deployment for AI Web Experience Collection.
---

# Collection QA, Clocks & Pages Release

## Per-Work Clock & Shared Asset Conventions
- **GSAP ticker + Lenis**: F1, VERDANT, ORBITAL, GLAZE, CHRONOS, INTERVAL, FORM, FUSION, GLASSHOUSE, VEIL, INKSCAPE, FACET, SILICON, LUTHIER, NIB, CREMA, CRAVE, GRID, RELAY, SUPERCELL, PELAGIC, BACKSTAGE, MURMURATION, VAREN, AURORA, CREASE, PAPERSUN, CARGO, PULSE, NIGHTSHIFT.
- **Owned RAF + Lenis**: KAGE, OPTIC, ATLAS, THRUST, RESONANCE, AETERNA, PARALLAX, CODEX, MAGMA, FOSSIL, URUSHI, DOSE, COUNTERFORM, FERRUM, IMAGO, SILLAGE, AER, BERTH, MEND, FRAME, ODDS, RALLY, SENTE, CHRYSALIS.
- **No scroll / no Lenis**: ANAX (single-screen draw-on-change owned RAF).
- **Interpolation defaults**: `lerp: 0.105`, `syncTouch: false`, `autoRaf: false` for OPTIC, ATLAS, THRUST, RESONANCE, AETERNA, PARALLAX, LUTHIER, CODEX, MAGMA, FOSSIL, URUSHI, NIB, CREMA, CRAVE, GRID, DOSE, AURORA, CREASE. Retain supplied `lerp` (0.13–0.18) and timing for COUNTERFORM, FERRUM, PAPERSUN, CARGO, PULSE, NIGHTSHIFT, CHRYSALIS, and the Nov 9 works (IMAGO..SENTE).
- **Cross-work shared assets by URL**: VERDANT & CHRONOS share byte-identical DM Sans in `public/shared/fonts/`; AURORA reuses GRID's Roboto Flex and ORBITAL's Earth texture; CREASE reuses DOSE's Space Grotesk; ANAX reuses GRID's Roboto Flex and IBM Plex Mono.

## Multi-Viewport UI / Motion QA
- Inspect complete frames at `390×844`, `768×1024`, `1440×900`, `1920×1080`, `2560×1440`, and `3840×2160` (plus wide/short VERDANT).
- Exercise slow/normal/fine/high-frequency wheel, fast down/reverse, arbitrary stops, scene boundaries, disclosures, every control, menus, reduced motion, immediate-load input, resize, and tab recovery. Physical touch, iOS, and high-refresh checks require real devices.

## GitHub Pages Release Verification
- Production entrance: `https://seiya058904.github.io/ai-web-experience-collection/` (`.github/workflows/pages.yml` builds with Pages base path, validates output refs, and deploys only `dist/` on `main`).
- Before authorized release: run project-path build/preview and verify direct loads, refresh, home/work/back links, fonts/images/GLB, WebGL/Canvas, and both production license files.
- After deploy: compare live asset bytes against the verified build, repeat core desktop/mobile flows, and record exact commit SHA, `0/0` parity, and clean state.
