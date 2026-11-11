# CARGO — Evidence index

This index distinguishes actual source checks from blocked browser acceptance. Read [QA-REPORT.md](QA-REPORT.md) first.

| Evidence | What it contains | What it does not prove |
| --- | --- | --- |
| [requirements-evidence.md](requirements-evidence.md) | Requirement-by-requirement status, implementation and verification links. | A planned check is not a completed check. |
| [evidence/build.log](evidence/build.log) | Actual TypeScript/Vite production build output. | Browser rendering or working controls. |
| [evidence/unit-tests.log](evidence/unit-tests.log) | Actual twenty-eight-test source suite result. | Pixel fidelity, native input or smooth motion. |
| [evidence/unit-tests-before-camera-contract-fix.log](evidence/unit-tests-before-camera-contract-fix.log) | Historical camera-dependent assertion failure. | A current cargo mismatch; the current world-identity test supersedes it. |
| [evidence/english-check.log](evidence/english-check.log) | Actual automated authored-text guard result. | Full language proofreading or image-lettering review. |
| [evidence/asset-manifest.json](evidence/asset-manifest.json) | Checked paths, file sizes and SHA-256 values for shipped images, entry references and fonts. | Successful HTTP requests or perceived load speed. |
| [evidence/design-detector.json](evidence/design-detector.json) | One raw source-detector result. | An aesthetic assessment. |
| [evidence/environment.json](evidence/environment.json) | Actual Node, platform and architecture. | A browser or physical device specification. |
| [evidence/browser-channel-observations.json](evidence/browser-channel-observations.json) | Actual preview and browser-blocker observations. | Any CARGO browser pass. |
| [evidence/browser-launch.json](evidence/browser-launch.json) | Actual packaged-browser launch failure summary. | An executed page test. |
| [evidence/browser-attempt/report.json](evidence/browser-attempt/report.json) | Actual smoke-run report: four selected cases blocked before page creation. | A browser interaction pass; unselected cases were not executed. |
| [fallback-contact-sheet.png](../evidence/non-browser/fallback-contact-sheet.png) | Six directly rasterized SVG model states, prominently labeled NON-BROWSER. | A screenshot of the website. |
| [fallback-states.json](../evidence/non-browser/fallback-states.json) | Exact states, source hash, rasterization method and limitations. | Actual Three.js rendering. |
| [INDEPENDENT-REVIEW.md](INDEPENDENT-REVIEW.md) | Independent evidence-validity disposition and missing capture packet. | Unobserved visual quality or acceptance. |
| [REPRODUCIBILITY.md](REPRODUCIBILITY.md) | Separate archive extraction, locked install and build verification. | Successful managed browser routing. |
| [source review](source-review.json) and [SOURCES.md](SOURCES.md) | Reviewed factual sources and interpretation boundaries. | Certification of the fictional box or its schematic hardware. |
| [generation-record.json](../art-direction/generation-record.json) | Twelve retained generation results, prompts, known parameters and a rejection record. | Website UI captures or invented generation settings. |

The [browser runner](../tests/browser.mjs) is reproducible test code. Its generated results are authoritative only when a real run records them. Browser captures are intentionally absent from this delivery when no valid CARGO page could be observed.
