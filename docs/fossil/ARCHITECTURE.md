# FOSSIL — Collection integration

FOSSIL remains one independent document and its original ten-composition exhibition. The supplied image plates, geology composition, synthetic sections, extracted mesh, copy, controls and rendering limits are retained.

`experiences/fossil/src/app.js` owns the only application RAF and one root-installed Lenis 1.3.26 instance. Lenis uses `lerp: .105`, `syncTouch: false` and `autoRaf: false`; scene progress is the actual document position divided by the current chapter span. Pointer ambient movement remains separate from scene progress. Reduced motion disables wheel smoothing and ambient movement; native dialog scrolling is excluded. Opposite wheel input cancels the old destination. Initial hashes and Back restoration are immediate. Resizing retains the normalized reading position.

`math.js`, `geology.js` and `imaging.js` retain the supplied isolated factories, imported once by the page module. Their original globals belong only to this document. Geology and imaging do not create another RAF. The serialized `public/fossil/data/fossil-volume.js` is a byte-preserved runtime data asset, not a compiled duplicate; its local deferred script loads before the page module constructs imaging. Its decoded field exactly matches `ammonite-density.u8` and all 72 PNG planes.

Rendering retains the hardware WebGL path, desktop/software/mobile/reduced CPU mesh fallback, and semantic static exhibit when rendering fails. Both mesh renderers consume the same authored data. The CPU renderer is not an enlarged section thumbnail. Visibility suspends the frame; persisted pagehide keeps the exhibition for BFCache, while terminal pagehide disposes Lenis, geology and imaging resources and outstanding record URLs.

HTML owns the stylesheet so the no-script exhibit remains styled. Vite processes HTML/CSS media and fonts; runtime image loads and Collection links include the returned base path. The page imports no other work runtime. The original standalone package, preview/build commands and vendored Lenis duplicate are omitted; generator and verification sources are preserved as historical provenance, not Collection build commands.

The first composition uses the supplied AI-generated hero ammonite plate. Reconstruct uses an authored scalar-field isosurface. Neither is a museum specimen or real CT acquisition. Public [notices](../../public/fossil/NOTICE.md), [upstream license](../../public/fossil/LICENSE.txt) and [source mapping](../../provenance/fossil/IMPORT.json) describe these distinct materials.

Chapter heights change atomically, including under the supplied reduced-motion CSS. Initial hash restoration is completed on the existing first owned frame after the browser native anchor pass. Boot and image preparation failures dispose local resources before revealing the original static semantic exhibit. A portrait-tablet-only hero reading gradient protects text over the pale generated rock; it does not change source image bytes.
