# Evidence index

All paths below are relative to this document. Browser screenshots retain the real rendered dimensions. They are JPEGs to keep the source delivery compact. The two exported-image comparison files remain lossless PNGs. The videos contain actual browser scrolling, not a montage of static images.

| Evidence | What it establishes |
| --- | --- |
| [QA_REPORT.md](QA_REPORT.md) | Actual environment, matrix, findings, repairs, limitations and delivery gate |
| [VISUAL_BIBLE.md](VISUAL_BIBLE.md) | Selected direction, media choices, all acts, transitions and final fidelity review |
| [IMAGE_GENERATION.json](IMAGE_GENERATION.json) | Six actual generation calls, prompts, tool-returned filenames, hashes and adoption decisions |
| [concepts/](concepts/) | Five compact real generated references; no fake prompt-only images |
| [evidence/first-path.json](evidence/first-path.json) and `first-path-{hero,local,turn}.png` | Passing early Hero → local observation → first climax, before expanding the full experience; these are stage-one records, not final appearance screenshots |
| [evidence/recording-evidence.json](evidence/recording-evidence.json) | Deterministic chosen initial state, actual local perturbation, control comparison and final digest |
| [evidence/model-case-results.json](evidence/model-case-results.json) and [model-tests.tap](evidence/model-tests.tap) | Fourteen actual model test results |
| [evidence/browser/report.json](evidence/browser/report.json) | Eight viewports × five acts, 56 handoff samples, ten functional check groups, six zoom-equivalent layouts and DOM geometry |
| `evidence/browser/{width}x{height}-{many,local,turn,live,ending}.jpg` | All 40 final stable compositions at actual viewport sizes |
| `evidence/browser/handoff-{boundary}-{forward,reverse}-{0…6}.jpg` | Boundary before/start/quarter/half/three-quarter/end/after frames; the report resolves the exact progress and order |
| [evidence/motion/report.json](evidence/motion/report.json) | Six motion check groups and 116 dense samples from 0.540 to 0.680 in both directions |
| [evidence/motion/desktop-motion.webm](evidence/motion/desktop-motion.webm) | Continuous 1440 × 900 motion recording, about 39.44 seconds |
| [evidence/motion/portrait-motion.webm](evidence/motion/portrait-motion.webm) | Continuous 390 × 844 motion recording, about 32.04 seconds |
| `evidence/motion/*intro-*.jpg` and `*saved-*.jpg` | First/reveal/complete opening frames and selected dense transition samples |
| [evidence/recovery/report.json](evidence/recovery/report.json) | Fifteen loading/failure/recovery checks, thirteen geometry samples, final performance and classified request errors |
| [evidence/recovery/export-source.png](evidence/recovery/export-source.png) and [fieldprint.png](evidence/recovery/fieldprint.png) | Exact current Canvas pixels and the delivered PNG with parameter footer |
| `evidence/recovery/*font*.jpg`, `*resize*.jpg`, `*poster*.jpg` and other named frames | Deliberate fallback and resize states; filenames describe the condition |
| [evidence/native/report.json](evidence/native/report.json) | Real native visibility/freeze/resume events, first-return state, actual Chrome zoom, lower control keyboard operation and native scrollbar drag |
| `evidence/native/native-zoom-*.jpg` | 125/150/200% real browser zoom; screenshots are output pixels while the report records CSS geometry and DPR |
| [evidence/performance-before.json](evidence/performance-before.json) | Concise measured bottleneck baseline supporting the renderer repair; the current result is in the recovery report |
| [evidence/clean-build.json](evidence/clean-build.json) and [clean-build.log](evidence/clean-build.log) | Fresh archive extraction, dependency installation, production build, tests and verified source/asset hashes |

## Reproduction

The English README lists the exact commands. The model suite runs without a browser. Browser suites need the matching Chromium installation; the native suite additionally needs a display, or Xvfb on Linux. All test fixtures are local and temporary. No account, secret or private absolute path is required.

The copied final reports correspond to successful runs. They include injected resource failures because verifying the graceful fallback is the test's purpose. Temporary raw video directories, browser profiles and failed/partial run outputs are excluded. The early first-path images and concise performance baseline are explicitly retained as process and repair evidence, not as alternate final implementations.
