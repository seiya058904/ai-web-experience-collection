# Supplied ORBITAL project notes

Imported from the user-supplied ZIP identified in `../../assets/imports.json`. The following describes the upstream work, not a new verification claim. Build and release instructions are in the root README.



A complete, scroll-controlled aerospace journey with eight scenes: Earth, Ignition, Ascent, Stage, Machine, Orbit, Mars/Moon, and Beyond. Built with React, Vinext, GSAP, Lenis and Three.js. The spacecraft and cinematic plates are original illustrations; educational reference values are sourced in the in-site credits. Animated flight telemetry is explicitly illustrative.

## Experience architecture

- `lib/orbital/controller.ts`: one Lenis instance and one GSAP ticker; scroll, rendering, visibility, resizing, chapter navigation and audio lifecycle.
- `lib/orbital/mission.ts` and `poses.ts`: pure, reversible progress mapping, Enter/Hold/Exit intervals and shared spacecraft poses.
- `lib/orbital/flight-scene.ts`: WebGL spacecraft, planets, stars, lighting, orbit paths and exhaust.
- `lib/orbital/raster-scene.ts`: animated Canvas compatibility renderer using layered renders of the same original vehicle, with stage separation and component highlights.
- `components/orbital/Experience.tsx`: persistent mission controls, reading companion, reduced motion, destination and subsystem choices, and source credits.

The sticky scene uses `overflow: clip` to avoid focus-induced internal scrolling. Each normal chapter enters over the first 18% of its interval, holds through 72%, then exits. Physical objects blend into the following composition. The first and last scenes remain fully visible at the journey endpoints. Manual wheel, touch, pointer or navigation-key input takes control from an explicit chapter jump.

Rendering limits device pixel ratio and total pixel count. Reduced motion uses stable chapter poses and only repaints on state changes. Hidden/offscreen rendering pauses, and WebGL context loss activates the complete Canvas journey. Audio starts only through the user's sound control.

## Visual fidelity decisions

1. Earth preserves the accepted concept's oversized left typography, illuminated planetary limb, sparse instrumentation and cold palette.
2. Ignition preserves the warm launch-flame handoff and rising shared vehicle. The same original slender launch vehicle is used across the entire mission instead of unrelated craft from individual concept illustrations.
3. Machine carries that vehicle into an exploded engineering composition. Four working subsystem tabs replace decorative, nonfunctional concept annotations.
4. Orbit preserves the large curved planet, fine cyan trajectories and small spacecraft. The readable text column is retained at narrow widths.
5. Mars uses the accepted warm planetary composition and restrained type; the Moon tab changes both the scene and its reference copy.
6. Beyond preserves the sparse star field, small departing craft and decisive final title. Persistent chapter controls remain usable through the ending.
7. Typography was widened slightly from the most condensed concept treatments for legibility; diagrams, scientific values and mission labels were replaced with internally consistent content.




NASA Earth imagery: https://svs.gsfc.nasa.gov/2915

NASA Moon imagery: https://svs.gsfc.nasa.gov/4720/

NASA Goddard cloud texture: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg (Reto Stöckli / NASA Goddard).

Scientific primary sources, original-illustration notices and further credits are accessible through **Sources & credits** in the experience. ORBITAL is an independent illustrative project, not an official NASA or SpaceX site.
