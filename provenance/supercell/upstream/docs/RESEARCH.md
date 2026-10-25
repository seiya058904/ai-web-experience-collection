# SUPERCELL — research and acceptance contract

Research checked: 2026-10-24 (Asia/Shanghai). All six originally requested URLs opened successfully. This document separates cited facts from original design recommendations. No source images have been downloaded or licensed through this research step.

## Primary sources and their usable claims

### NOAA NSSL — Thunderstorm Types

URL: https://www.nssl.noaa.gov/education/svrwx101/thunderstorms/types/

A supercell is a persistent, organized storm whose rising air is tilted and rotating. The same page explicitly cautions that individual storms differ and need not show every feature in a classic diagram. Use a connected, angled tower with an identifiable updraft; omit a checklist-like collection of funnels, wall clouds and other features. This supports the central visual idea, not a measurement of the fictional storm. Avoid displaying the page's general size, lifetime or tornado statistics as values for this illustration.

### NWS — The Supercell, Pt. 1

URL: https://www.weather.gov/spotterguide/supercell1

Wind shear is wind speed and/or direction changing with height. The educational account links stronger winds aloft to a tilted updraft and precipitation being displaced downwind, away from the updraft. Use this spatial relationship for the interactive comparison. The account's counterclockwise/clockwise examples are specific explanatory configurations; do not state them as universal across hemispheres or storm types. A one-dimensional artistic control does not determine actual storm evolution or danger.

### NASA — The Anatomy of a Thunderstorm

URL: https://science.nasa.gov/earth/earth-observatory/the-anatomy-of-a-thunderstorm-78101/

This account covers DC3 field research and imagery from May 19, 2012, not a generic live reading. It describes warm moist air rising in the storm and spreading horizontally near the tropopause into an anvil; short-lived overshooting tops can occur. Use vertical rise and lateral spreading as the principal motions, without implying an impermeable hard ceiling. The source photograph is credited to the DC3 team, the satellite visualization to Robert Simmon/GOES, and the caption to Adam Voiland. The website is not a reproduction of that specific storm; no speed, height or date from the research event should be applied to the illustrative model.

### Berndnaut Smilde — Nimbus

URL: https://www.berndnaut.nl/works/nimbus/

The artist describes a cloud's temporary physical presence in a particular location and its persistence as a photographic document after disappearance. This is an artistic reference for a compelling held composition and the cloud as a spatial subject. It is not a scientific source. Do not copy the artist's interior settings, specific photographs or staging. No artwork reproduction is required or implied.

## Official engineering references

### Lenis

URL: https://github.com/darkroomengineering/lenis

The current README examples identify version 1.3.27. Use the installed package's lockfile as the final dependency version. The documented GSAP bridge uses `lenis.on('scroll', ScrollTrigger.update)` and passes ticker seconds multiplied by 1000 to `lenis.raf`. `autoRaf` defaults to false. Use exactly one driver; import `lenis/dist/lenis.css`. The README recommends `gsap.ticker.lagSmoothing(0)`. It currently documents automatic respect for reduced motion and exposes `prefersReducedMotion`; custom rendering must separately stop ambient motion. `data-lenis-prevent` is appropriate on nested modal content. `scrollTo` supports `immediate`, `lock` and `force`; normal narrative navigation should remain interruptible. The package is MIT licensed.

```js
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ autoRaf: false });
lenis.on('scroll', ScrollTrigger.update);
const tick = (seconds) => {
  lenis.raf(seconds * 1000);
  // Render from the latest single progress value and user state here.
};
gsap.ticker.add(tick);
gsap.ticker.lagSmoothing(0);
// Cleanup: gsap.ticker.remove(tick); lenis.destroy(); ownedTrigger.kill();
```

### GSAP ScrollTrigger

URL: https://gsap.com/docs/v3/Plugins/ScrollTrigger/

Register the plugin before creating triggers. A standalone `ScrollTrigger.create` can expose normalized progress through `onUpdate`. `refresh` recomputes geometry; `update` reads current scroll state. Refresh after relevant layout changes, rather than every frame. Resize triggers automatic recalculation. Killing an owned trigger removes its associated listeners and restores pin changes. Pin geometry can break under transformed ancestors; animate an inner scene. `ScrollTrigger.matchMedia` is deprecated; use GSAP's current match-media facility if needed. Avoid adding ScrollSmoother or another scroll-normalization mechanism over Lenis. Preserve natural keyboard/touch interaction and interruptible section jumps.

## Original model recommendations (design inference, not sourced physics)

Use normalized model coordinates rather than fictional kilometer or wind-speed values. The renderer and the section share one density function `D(x, y, z, u)` and one mapping from world space to screen space. A height control sets `z = h` in that same field. The exported cross-section is `D(x, y, h, u)`; it is never an unrelated decorative image.

An inexpensive illustration can combine connected smooth density lobes for a low cloud base, angled tower and wide upper anvil. Define a height-dependent tower centerline, then use that centerline consistently for density, streamline positions, the updraft label and the slice's highlighted center. The shear parameter can interpolate among three authored configurations, changing the tower's horizontal displacement with height, its streamline directions and the precipitation region's relative position together. Preserve the same cloud's identity, camera and lighting while it changes. This is an intentionally constrained geometric morph, not a fluid solver.

Use terms such as `Model height`, `Lower / Middle / Upper`, and `Illustrative conditions, not a forecast.` If percentages appear, identify them as normalized model parameters. Do not equate control value with storm severity. A slice outside the main updraft should show that absence honestly; an explicit `Find the updraft` button can choose a readable height. Never change height merely because a new chapter begins.

Treat `p` (scroll narrative), `u` (authored environment) and `h` (section height) as independent state owners. Compute all narrative transforms from current `p`, rather than accumulating chapter-enter effects. A bounded ambient clock can change tiny cloud texture and a single parcel's motion; it must not drift the composition or become a second narrative clock. Pause it when hidden and reset its delta on resumption.

## Hard requirement checklist

### Boundary and delivery

- [ ] New standalone local/private workspace. No public deployment, hosting, preview sharing, push, PR, merge, tag, release or modification of an existing collection.
- [ ] Final user-facing deliverable is a complete downloadable source ZIP.
- [ ] Website interface, explanatory copy and README are concise English.
- [ ] ZIP includes source, styles/shaders, config, dependency manifest and lockfile, all production media/fonts, English setup/build README, Visual Bible, generation records and decisions, sources/licenses, actual tests and known untested cases.
- [ ] Exclude node_modules, caches, browser profiles, secrets, personal data, irrelevant logs, failed builds and large unused exploration sets.
- [ ] Extract ZIP into a fresh directory; install from lockfile and run a production build; verify asset paths and completeness.

### Research and image generation gate

- [ ] Open the four required primary references and official Lenis/ScrollTrigger documentation.
- [ ] Before production scene/layout/model work, actually generate at least three materially different viewable concepts: low-horizon Hero A, oblique Hero B, visible-interior transition.
- [ ] If phone composition remains unresolved, generate an independent portrait exploration; a crop alone does not qualify.
- [ ] Record actual tool, returned file, intended use, and `final asset / reference only / rejected` decision for each.
- [ ] Visual Bible records protagonist, lens/composition, light/materials, typography safe zones, every chapter's held composition, transition start/mid/end, phone composition and selected rendering medium.
- [ ] Use genuine DOM/font text for all necessary text.
- [ ] Complete and inspect Hero → first handoff → interactive slice prototype before extending the whole narrative.

### Scene and state

- [ ] Same identifiable storm and horizon survive the narrative. No five-background slideshow, shell explosion, revolving display object, tunnel, full-screen flash or masking fog.
- [ ] Five chapters each have Enter, Stable Composition, Living Hold, Handoff and Exit.
- [ ] Hero first meaningful paint contains a readable storm; local poster covers late resources.
- [ ] Hero separates anvil, angled tower, dark base and rain; English title occupies a safe area.
- [ ] Opening is interruptible; reversing does not restart loading choreography.
- [ ] Airflow is explicitly identified as an explanation of normally invisible air; one trackable parcel, at most three key annotations.
- [ ] Section line, displayed slice, selected parcel and labels share the same structure and transform.
- [ ] Native range, keyboard and phone button controls modify the same `h`.
- [ ] Wind comparison changes geometry, airflow and precipitation separation together, under a fixed view.
- [ ] The current `u/h` survives fast cross-chapter movement, reverse scroll, ending and re-entry.
- [ ] Reset Storm changes only `u/h`; Back to Opening changes only `p`.
- [ ] End preserves selected conditions and offers revisit, sources and reset. No forced loop.
- [ ] Sound, if present, starts disabled and is not needed to understand the work.

### Scroll and lifecycle

- [ ] Real Lenis integration with a single GSAP ticker/RAF owner; no autoRaf plus duplicate RAF.
- [ ] One shared progress source controls DOM, camera and rendered scene; no accumulated enter/leave offsets.
- [ ] No forced snap, global wheel swallowing, dual inertia, long empty pin or input lock hiding defects.
- [ ] Resize/orientation/font/image/history restoration refresh geometry only when needed.
- [ ] Menus and native controls do not fight narrative scrolling; closing overlays restores focus.
- [ ] Hidden tabs pause expensive rendering; restoration avoids catching up an unbounded delta.
- [ ] Cleanup releases owned listeners, triggers, timers and GPU resources where applicable.
- [ ] Adaptive quality reduces detail before sacrificing section correspondence; render buffers are capped at 4K viewport sizes.
- [ ] No-WebGL mode keeps local poster, SVG/illustrated section and usable semantic controls.
- [ ] Reduced motion keeps all content and comparison controls, with no required continuous flight.

### Transition evidence

- [ ] Document all four chapter boundaries: shared anchor, exact scroll interval, z-order, old-text exit, new-text entry and focal takeover.
- [ ] Capture 0/25/50/75/100% for every major boundary, in forward and reverse movement.
- [ ] Check slow passage and fast back-and-forth on the actual timeline; do not substitute animation-disabled screenshots.
- [ ] I→II: title clears before detailed path copy; cloud and horizon remain.
- [ ] II→III: observation plane enters the same volume; outside identity stays fixed; section and scale establish together.
- [ ] III→IV: preserve exact user height; conditions change before geometry explains the result.
- [ ] IV→V: explanation exits; section rejoins cloud; complete cloud returns before ending text.
- [ ] No black/white flash, blank frame, regenerated subject, detached background, text overlap or z-order tearing.

### Required browser matrix

- [ ] Real rendered viewports: 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160.
- [ ] Representative 125%, 150%, 200% zoom; delayed/fallback/loaded fonts and wrapping.
- [ ] Cold and warm load, entrance reveal, all stable scenes, first scroll and ending.
- [ ] Slow/fast/reverse/scrollbar jumps, chapter navigation, keyboard and touch.
- [ ] Actual slice/shear effects and resets; changes immediately followed by rapid chapter exit/re-entry.
- [ ] Weak network, missing resources, resize, orientation, background restoration and browser history.
- [ ] WebGL loss/restoration if WebGL is used; document not-applicable if the implementation uses other media.
- [ ] Reduced motion, visible focus, semantic/native controls and touch alternatives to hover.
- [ ] Screenshot inspection plus visible text bounding-box scan excluding hidden layers and intentional decorative overlaps.
- [ ] Separate engineering/interaction review and visual/motion review; scrutinize the weakest chapter.
- [ ] Every real issue records location, viewport, progress/direction, cause, correction and regression outcome.
- [ ] Development and production build; console/resource errors; actual measured performance with environment and interval.
- [ ] Clearly distinguish desktop browser emulation from physical devices and record untested browsers/hardware.

## Useful final-facing copy

- A storm sustained by moving air.
- Air paths are illustrative. The air itself is invisible.
- A section through an illustrative storm.
- Illustrative conditions, not a forecast.
- The shape remains. The air moves on.

