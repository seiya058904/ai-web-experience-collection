# PELAGIC — integration architecture

`pages/pelagic/index.html` is the independent document; `experiences/pelagic/src/main.ts` owns one Lenis instance, the GSAP/ScrollTrigger clock, chapter navigation, dialogs and the observation controls. `state.ts` is pure story and light state; `renderer.ts` draws the Canvas 2D colony with a complete SVG alternative and derived art surfaces.

- **Sources:** `experiences/pelagic/src/` (TypeScript, included in the root type check).
- **Assets:** `public/pelagic/art/` (colony, squid, mark, embedded first-frame), `public/pelagic/fonts/` (Cormorant Garamond and Manrope), notices in `public/pelagic/licenses/`.
- **Base awareness:** `artUrl()` now resolves `import.meta.env.BASE_URL + 'pelagic/art/'`; stylesheet font URLs moved from `/fonts/` to `/pelagic/fonts/`; HTML references use `%BASE_URL%`.
- **Dependencies:** the supplied range pins resolve to the locked `gsap 3.15.0` and `lenis 1.3.26`; no package change.
- **Tests:** `tests/pelagic-state.test.ts` is the supplied state suite with imports rebased.
