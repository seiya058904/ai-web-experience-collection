# CODEX — Collection integration

The supplied sewn case binding remains the continuous subject of all ten chapters. The photographic prologue, procedural paper and thread, Canvas marbling, cloth, metal type, final cover hinges and authored compositions are retained. CODEX has no audio. Controls remain Contents, chapter navigation, Motion, marbling response, cover open/close, replay and Colophon.

`pages/codex/index.html` is its independent document. `experiences/codex/src/main.js` owns one Lenis (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`) and the original RAF. Wheel interpolation is disabled for reduced motion, touch remains native and dialogs use their own native scrolling. Scene assembly reads actual document position directly; pointer and cover response retain the authored local animation, without another scroll-progress easing layer.

Enhanced chapter sections use `-view` DOM IDs while URLs retain their original chapter hashes. This prevents native fragment scrolling from competing with fixed chapter copy. Cold hash positioning happens immediately after initial geometry measurement. The later font/texture/model readiness pass preserves the user's current position and never replays the startup destination.

The scoped `history.state.codexPosition` checkpoint records actual normalized position and matching hash after settled scrolling and before page suspension. Reload and reconstructed Back restore it immediately; invalid or unrelated state cannot change the destination. Resizing preserves the same normalized chapter position. Other history keys remain intact.

The same RAF pauses before Lenis or scene updates when hidden or retained in BFCache. Visibility/pageshow resumes it once, clears the old elapsed interval and aligns Lenis to actual document position. Non-retained pagehide aborts input listeners, clears both timers, cancels the clock and disposes Lenis, WebGL and Canvas resources. Resources completing after disposal are also disposed.

Runtime images, fonts and original notices are under `public/codex/`. Runtime URL construction includes `import.meta.env.BASE_URL`; HTML includes direct CSS for the JavaScript-disabled reading edition and the shared Collection return link. Root build configuration, route registration and deployed dependency inventory are maintained centrally.

The WebGL-unavailable edition preserves the original still, all DOM chapters and navigation; its cover action is hidden because there is no live cover. The separate Canvas marbling interpretation remains available when Canvas 2D works. JavaScript-disabled HTML remains a readable document with original native chapter anchors.

Concept frames, material source PNGs, the unused static closed-book GLB and original source records remain in `provenance/codex/`. The ZIP remains outside the repository. Standalone package/lock/build configuration and compiled `dist/` are omitted. Exact source-to-import mapping and omissions are in [import-record.json](../../provenance/codex/import-record.json). The supplied standalone QA record is historical; current Collection results are in [ACCEPTANCE.md](ACCEPTANCE.md).
