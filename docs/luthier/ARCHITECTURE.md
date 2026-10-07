# LUTHIER — Collection runtime

`pages/luthier/index.html` owns one independent document. `experiences/luthier/src/main.ts` composes nine scenes and keeps the supplied typography, transparent generated plates, material/structure controls, bow contact, sound fields and opt-in audio. The original source is integrated; there is no iframe or shared work renderer.

## Progress and scheduling

`story.ts` owns reversible, piecewise-linear scene/scroll mapping. Its authored distances are viewport heights, with a distinct phone score. ScrollTrigger writes the pure master score using `scrub: true` and `ease: none`; the scene receives that score directly. One Lenis instance uses `lerp: .105`, `syncTouch: false`, `autoRaf: false` and no automatic resize. The existing GSAP ticker runs Lenis before rendering, and the other modules create no private frame loop. Opposite wheel input cancels the outstanding inertial target; native dialogs retain contained scrolling through their supplied `data-lenis-prevent` markers.

`field.ts` reconstructs common STRING/CURVE drawing from progress. Ambient time adds light and restrained phase without easing scene progress. `violin-model.ts` lazily builds the original Craft study, awaits local material images, and renders only when its owner calls it. Canvas caps its drawing buffer near five million pixels; the selective model keeps its separate 3.2-million-pixel budget.

## Controls and fallbacks

Wood selects Spruce/Maple/Ebony and its live grain. Inside selects sound post/bass bar. Bow contact and the native Draw the bow range use the same pure contact state; later user scroll releases manual bow control. String/Body/Air and Open the space affect the supplied acoustic artwork. Audio is entirely local synthesis; construction creates no AudioContext, and the visitor's Sound action opts in.

Reduced motion disables wheel smoothing and produces nine short, sequential reading compositions while preserving controls. A unavailable Craft renderer or texture leaves the supplied generated Craft plate visible. JavaScript-disabled notices include a native Collection return and source notice link. Both native dialogs, replay, keyboard focus and source/generated-image caveats remain intact.

## Restoration and ownership

Resize preserves the scene coordinate across the phone breakpoint and restores document position immediately. Explicit navigation cancels a pending preservation writeback. Visibility recovery resets ambient time and synchronizes geometry. Refresh/history use the supplied document and chapter state. Terminal `pagehide` performs idempotent disposal; persisted pages retain state for BFCache. Disposal removes the owned ticker and ScrollTriggers, destroys Lenis and releases Canvas/audio/model resources. The diagnostic `window.__luthier` remains development-only.

Runtime texture URLs include `import.meta.env.BASE_URL`; HTML and CSS media are namespaced under `public/luthier/` and resolved through Vite. Source images, exact prompts and original delivery hashes are under `provenance/luthier/`. Public source/font/runtime notices are under `public/luthier/`.
