# DOSE — Collection intake and acceptance

12 October 2026. Local integration acceptance; no push, deployment or live-release validation was performed.

## Delivery

- Original ZIP: `D:/下载/DOSE-The-Architecture-of-a-Tablet-source.zip`, 14,214,141 bytes, modified 12 October 2026 21:55:29 (machine local time), 83 file entries under one DOSE root.
- SHA-256: `9571b6c88878ed33b02914561d08e41a2f67c14e59eaea5339d5134ecb264dfd`.
- Archive inventory rejected absolute paths, drive paths and traversal. No nested archive or lockfile. Extraction used a fresh temporary directory outside Git. All 82 hashes in the supplied FILE-MANIFEST.sha256 matched; six binary runtime assets (five fonts and the icon) match the delivery byte for byte.
- Original assets, fonts and licenses are namespaced. Supplied generated concept images, research, QA claims and prompts stay in provenance, outside deployment. Original research/QA records describe the upstream work and are not proof of this revision.
- Standalone dist, vendored runtime modules/source map, launcher, build/server scripts and local design tooling are omitted. Root dependencies and lockfile are retained. Three.js is the existing Collection 0.186.1 rather than the delivery's 0.183.2; Lenis is unchanged at 1.3.26.
- Poster and social image are captures of the actual procedural runtime, not generated concept plates or drug-product photographs.

## Confirmed findings and repairs

| Finding | Evidence | Repair |
| --- | --- | --- |
| P1 / CONFIRMED-RUNTIME: endpoint text overlap in wide, short windows | Original 1440×720 Prologue gap −40.9px, Release −59.9px; 1920×800 gaps −141.1px and −158.4px. Original images inspected. | Endpoint heading/copy share a flex frame with protected spacing. Display/body sizes respond to both viewport width and height. Original typefaces, copy and model identity remain. |
| P2 / CONFIRMED-RUNTIME: unregistered double silhouettes during handoffs | Original Press→Surface and Surface→Evidence captures show differently scaled/positioned tablets superimposed. | Adjacent representations share an interpolated world position, quaternion and scale, converted back through their actual parents. Press machinery fades before the tablet macro view. Canvas shares one interpolated layout frame. |
| P2 / CONFIRMED-STATIC: lighting steps at scene boundaries | Original key intensity ended Surface at 2.6 and began Evidence at 1.8; rim intensity jumped 1.1→1.45. | Key position, intensity and rim use continuous per-chapter endpoints. All six boundaries have a numerical regression. |
| P2 / experience finding: short, hurried handoff | Handoff spans the final 22% of travel; captions apply narrower curves within it. User described an abrupt change rather than speed alone. | First six chapter spans add approximately 39–40% travel. Original process phases and 0.78 handoff start remain; readable caption ranges do not overlap. Registration and lighting address continuity in addition to pacing. |

The new world-frame interpolation has no integrator or independent easing clock. Stops and reverse scroll reconstruct the same pose. Original geometry, scientific caveats, quiet/light preferences, native touch, dialogs and owned RAF remain.

## Actual verification

- `npm test`: 326 passed, 0 failed. Includes imported timeline/contrast tests and registered-frame, transformed-parent, reverse-sample and lighting-boundary regressions.
- `npm run build` and `npm run verify:build`: root output passed, 878 HTML/CSS references checked.
- `npm run build -- --base=/ai-web-experience-collection/` and `npm run verify:build`: project-path output passed, 878 references checked.
- Production browser URL: `http://127.0.0.1:4191/ai-web-experience-collection/dose/`. The preview command carries the same `--base=/ai-web-experience-collection/`.
- Browser plugin/skill was not supplied in the session. Existing bundled Playwright and installed Chrome were used; no browser dependency or root dependency was installed/updated.
- Page identity, meaningful first frame, no Vite overlay, WebGL renderer, 0 page errors and 0 failed HTTP responses on the final production run.
- A focused console check of the WebGL opening, Release and Canvas edition found 0 console errors and one GPU shader compiler precision warning (`X4122`, arithmetic involving approximately 1e-17). The programs compiled and rendered; no console-clean claim is made. No shader or dependency change was inferred from this numerical warning.
- Full seven-chapter frames at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160, 1440×720 and 1920×800: 56 frames, no measured heading/copy overlap or horizontal overflow. Full-frame contact sheet and target frames inspected.
- Desktop: 60 forward/reverse handoff samples. Mobile emulation: 24 additional handoff captures, WebGL active and no horizontal overflow. Press/Surface/Evidence transition images inspected.
- Collection entry, work return, direct load/refresh, all seven chapter links, Index, About, Escape, focus restoration, depth End/Home, quiet/light switches and reload persistence passed.
- Normal wheel and reverse wheel passed. Resize retained normalized chapter position.
- Reduced-motion phone edition, final-chapter jump, explicit Canvas2D edition, no-JavaScript seven-chapter reading and visible Collection return passed.
- Browser history returned to the same measured scroll position (1164px) and WebGL runtime recovered. Separate-page tests resumed drawing after bringing the work forward.
- Mechanical design detector ran once. Its reported 16px flat hierarchy is a false positive from not resolving Vite/module-linked CSS; actual full-frame typography is differentiated. Its font-popularity warnings are not defects in preserved, supplied work identities.
- Original lockfile and existing work runtimes/assets are unchanged. Original ZIP and temporary browser scripts/screenshots remain outside Git.

## Limits and unsuccessful checks

- Initial production preview omitted the preview server's base flag, producing the Collection fallback/404 chunks at the requested subpath. Restarting preview with the documented base fixed the environment; the final production run has no failed requests.
- Initial no-JavaScript integration imported styles only through JavaScript; it was corrected to HTML stylesheets. The native Collection return was moved out of the no-script hidden-control selector, and the production reading/navigation checks passed.
- Background-tab suspension is **NEEDS-VERIFICATION** at runtime: automated page switching did not expose a reliable hidden visibility state. A same-context run held the frame count and scroll stable, but recorded no visibilitychange event. The original explicit visibility suspension remains confirmed in source; no real-background certification is claimed.
- The first history test waited for a fresh load event and timed out on return. The final history test observed the restored document/state instead and verified the retained position.
- No physical touch device, iOS Safari, Firefox, high-refresh hardware, sustained GPU/FPS benchmark, forced WebGL context loss/restore, exhaustive high-frequency input stress, or live Pages release was verified.
- Naturalness remains a perceptual judgment. Registration, endpoint continuity and viewed sequences support this repair; the local preview is available for user review.

Temporary evidence directory: `C:/Users/admin/AppData/Local/Temp/dose-intake-kguql3ph/`; final browser data is `qa-production.json`, mobile data is `mobile.json`, and history data is `lifecycle.json`. These paths are local evidence, not durable deployment resources.
