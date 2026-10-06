# FACET — Design system

## Direction
A neutral dark exhibition space carrying a continuous optical sculpture. The existing brief is the visual authority. Seven authored concepts establish LIGHT → FACET → POLISH → DEPTH → COLOR → BRILLIANCE → EXHIBIT. One photographic still is a loading/fallback asset; the working exhibition is geometry and light.

## Color lock
- Main background: #080b0e, charcoal with a faint cool undertone.
- Foreground: #edf0ed; secondary: #a8afaf; lines: translucent foreground.
- Light gallery for jade/agate: #e5e8e2; charcoal foreground #182321.
- Material colors belong to the stones: wine/ruby red, midnight/cobalt sapphire, olive and white jade, ivory/ochre agate. No gold interface or decorative rainbow gradient.

## Typography
Self-hosted Instrument Serif regular + italic for the editorial voice; DM Sans regular + medium for controls, supporting prose and wayfinding. Chinese titles use the local serif font stack. Large type establishes space; it does not cover the gemstone. Responsive sizing follows the viewport, with separate mobile composition and safe limits.

## Composition
Full-viewport persistent 3D stage. 4% desktop gutters; a restrained FACET wordmark upper left, Index and language upper right. A thin segmented chapter rail sits at the bottom. LIGHT and FACET place text left and geometry right. POLISH and COLOR invert the composition. DEPTH moves much closer to the broad table of a step cut. BRILLIANCE centers the physical ray path. EXHIBIT opens to a low arc of six graphite plinths and permits individual inspection.

Mobile: the headline sits above the stone, which occupies the center of the viewport; explanatory text/controls sit below. Exhibit uses a sculptural 3-by-2 spatial arrangement. Controls have at least 44px touch targets. The navigation index becomes a compact full-height sheet.

## Motion contract
One normalized, stateless scroll timeline with no per-section pins. Lenis advances from the GSAP ticker; ScrollTrigger reads that same scroll position. A fixed stage removes pin teardown and spacer jumps. Geometry poses blend across scene boundaries using shared smooth intervals. The stable composition and living hold last most of each scene. Subtle light motion continues on a hold; scene progress never free-runs.

- LIGHT: a clean incident beam and restrained diamond rotation.
- FACET: crown and pavilion separate around a thin girdle; precise edges and projected labels establish structure.
- POLISH: a spatial frost-to-polish boundary crosses the same solid.
- DEPTH: a broad step-cut table approaches; ruby absorption hands off to sapphire; restrained internal traces become visible.
- COLOR: sapphire's plane yields to jade volume; jade light then yields to an organically banded agate cross-section. Its slices physically separate.
- BRILLIANCE: a traced beam crosses the model and exits through wavelength-dependent refraction.
- EXHIBIT: the stage pulls back; six individually lit specimens settle onto separate plinths; selecting one brings it forward for pointer/keyboard inspection.

## UI families
Open text links and thin underline tabs; low-profile range controls with diamond thumbs; one chapter-index dialog; a continuous segmented rail. No content cards, nested containers or retail calls to action.

## State and access
All controls have native semantics, focus treatment and English/Chinese labels. Reduced motion removes continuous rotation and smoothing and shortens the travel. The still-art fallback is readable without WebGL; text and chapter navigation remain available. Visibility changes pause rendering, and resource disposal is explicit.
