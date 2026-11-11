# PAPERSUN — reviewed technical sources

Reviewed on **2026-11-09**. PAPERSUN is original fiction. None of these references supplies story facts, copied artwork, or an artwork reuse licence. The design's paper fibres, practical light, camera moves, and miniature stage are artistic approximations.

## Source register

| Reference | Verified scope | Application to this project |
| --- | --- | --- |
| [MDN: CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) | `clip()` bounds subsequent drawing to the current clipping path. `save()` and `restore()` preserve and reinstate drawing state. `globalCompositeOperation` controls how new shapes/images are composited into the existing bitmap. | Canvas masks, if used, need explicit state restoration. Critical words stay in semantic HTML. Exact fragment silhouettes should be shared SVG paths rather than independently painted approximations. |
| [MDN: CSS transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) | A non-`none` transform creates a stacking context and a containing block for fixed/absolute descendants. Transform order affects the visual result. The requested URL redirects to MDN's current property reference. | Keep page navigation outside transformed theatre layers. Give each pinned prop a specified pivot and coordinate space. Inspect masking, depth, and fixed overlays in the actual browser. |
| [W3C: Technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) | `prefers-reduced-motion` allows CSS motion to be suppressed in response to system/user-agent preferences. The technique's check is to enable the preference and confirm that nonessential interaction motion is suppressed. | Supply stable states for every story beat and action. Test the media preference and the on-page motion setting separately. This technique alone does not establish accessibility conformance. |
| [Lenis: official repository](https://github.com/darkroomengineering/lenis) and [its README](https://github.com/darkroomengineering/lenis/blob/main/README.md) | Official integration wires the Lenis scroll event to `ScrollTrigger.update`, calls `lenis.raf(time * 1000)` from GSAP's ticker, and disables GSAP lag smoothing. `autoRaf` defaults to false. The recommended CSS is `lenis/dist/lenis.css`. Anchors require explicit handling or the `anchors` option. | Use one Lenis instance and one clock; do not combine a manual ticker and `autoRaf: true`. Preserve native touch/keyboard navigation and make deliberate focus/hash/history changes. Record the installed version and verify these options against its packaged types/source. The repository root timed out twice; the same repository's official README was successfully read. |
| [GSAP: ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | `scrub: true` directly links animation and scroll progress; numeric scrub adds a catch-up duration. `refresh()` recalculates trigger boundaries. Animate children rather than the pinned element itself. Transformed ancestors can affect fixed pinning. Import and register the plugin. | Use one evaluated progress for text, stage, and object positions. Refresh after layout-affecting fonts/images and on viewport changes. Avoid an additional numeric scrub lag that would desynchronise the stage. Clean up callbacks and triggers. |
| [Playwright: visual comparisons](https://playwright.dev/docs/test-snapshots) | `toHaveScreenshot()` compares screenshots with baselines. Baseline generation waits for matching consecutive captures. Rendering differs by browser, operating system, settings, hardware, and headless mode. | Capture fixed progress points under recorded conditions and inspect the actual images. A screenshot suite is not proof of continuous motion quality, physical-device performance, or other browsers. |
| [W3C: Understanding SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Automatically starting motion that lasts more than five seconds and runs alongside other content needs a pause/stop/hide mechanism unless essential. Auto-updating content has a corresponding control requirement. | The motion control must stop decorative wind-wheel, lamp, signs, and other persistent animation. A reduced-motion preference is not the only route to control. Check the actual page rather than assuming an aesthetic animation is essential. |

## Implementation decisions drawn from these sources

These are project choices, not claims made by the sources:

- Use browser-native DOM/SVG scenes and generated paper art to keep the entire story available without WebGL.
- Derive every important pose from a bounded story snapshot; a previous chapter's callback must not be a prerequisite for a later chapter.
- Keep user-triggered collection and assembly state separate from scroll state. Previewing or skipping to a late chapter must never silently collect a piece.
- Prefer explicit button actions to accuracy-sensitive dragging. Keep all narration and statuses available as text.
- Restrict asset completion to its requesting scene or immutable image element. A late resource must not replace the current chapter's art.
- Mark unperformed tests `NOT TESTED` and real tool/environment blockers `BLOCKED`; neither is a pass.

## Runtime discovery

Read-only discovery found Node **24.22.1**, npm **11.9.0**, Python **3.12.14**, and Playwright **1.62.1** in the primary runtime. Vite, TypeScript, Lenis, GSAP, and `@playwright/test` were not present in that runtime's module root at discovery time. These observations do not describe subsequently installed project dependencies.

The environment identifies itself as a managed Sites container. A browser automation surface is available to the owning agent; no browser was initialised by this research pass. No standard local Chromium executable or Playwright browser cache was found in the checked locations. Browser acceptance must use the permitted preview/browser route and report the actual browser version, viewport, DPR, and conditions when testing occurs.

The source register uses durable public URLs. Its reviewed API behavior informs the implementation; it does not replace production-browser evidence for the actual rendered site. Later browser-environment changes and the local Playwright fallback are documented in [browser-qa.md](browser-qa.md).
