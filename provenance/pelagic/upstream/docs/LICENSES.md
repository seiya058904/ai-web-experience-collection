# Sources, assets and third-party notices

## Original exhibition material

The HTML, TypeScript, CSS, SVG anatomy diagrams, lure geometry, fish path, pigment fields, observation copy and wave mark were created for this project. They do not incorporate a research institution's logo or copy a research photograph into the application.

The production colony and squid artwork were generated through `image_gen.imagegen` during this execution. Their exact generation records, input references, original output identifiers and hashes are in `IMAGE_GENERATION.json`. Transparent PNG outputs were converted to locally bundled WebP assets; the runtime derives lighting and pigmentation from those same assets. The embedded first-frame image is a small derivative of the colony asset.

The four small images in `concepts/` document the requested exploration and selection. They are marked **reference only**. The two images in `public/art/` used for the living scenes are marked **final asset**. AI-assisted artwork is presented as interpretation, not as specimen photography or scientific evidence.

No third-party research photograph, paper figure, ROV footage, institutional logo or audio recording is redistributed. Research links and paraphrased factual boundaries are collected in [RESEARCH.md](RESEARCH.md).

## Fonts and dependencies

| Component | Installed version | Notice |
| --- | --- | --- |
| Cormorant Garamond, Fontsource package | 5.3.0 | SIL Open Font License 1.1; local regular and italic Latin WOFF2 files. Full notice in `licenses/cormorant-garamond-OFL.txt`. |
| Manrope, Fontsource package | 5.3.0 | SIL Open Font License 1.1; local 400/500 Latin WOFF2 files. Full notice in `licenses/manrope-OFL.txt`. |
| Lenis | 1.3.27 | MIT; full notice in `licenses/lenis-MIT.txt`. |
| GSAP and ScrollTrigger | 3.15.0 | GreenSock's Standard “no charge” license, as declared by this installed package. This is a distinct license, not MIT. Copyright notice and canonical license link are preserved in `licenses/gsap-NOTICE.txt` and in the installed source headers. |
| Vite | 7.3.7 | MIT and bundled dependency notices, copied in `licenses/vite-MIT-and-bundled-notices.txt`. |
| TypeScript | 5.9.3 | Apache License 2.0; full notice in `licenses/typescript-Apache-2.0.txt`. |
| Playwright, testing only | 1.56.1 | Apache License 2.0; full notice in `licenses/playwright-Apache-2.0.txt`. Browser binaries are downloaded separately and are not included in the ZIP. |

Exact transitive dependencies and integrity values are retained in `package-lock.json`. Their own notices remain in their npm packages when installed. The original user brief is not bundled as a newly licensed project asset.

## GSAP source notice

The canonical terms are [GSAP Standard License](https://gsap.com/standard-license/). The package header identifies the copyright as 2008–2026 GreenSock. The canonical webpage redirected to a temporary forum-maintenance page during this execution, so the package does not fabricate or paraphrase a full legal license text. The installed package's declaration and upstream link are provided exactly.
