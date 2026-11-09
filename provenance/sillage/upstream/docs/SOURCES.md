# SILLAGE — research and source boundaries

Research checked on **2026-11-09**. The session clock returned `2026-11-09 01:10:49 UTC` during the first retrieval batch. The following notes describe evidence actually retrieved for this task; they do not certify the website's runtime behaviour.

## Content sources

| Primary source | What was verified | What SILLAGE may take from it |
| --- | --- | --- |
| [NIDCD — The Journey of Smell to the Brain: Text Version](https://www.nidcd.nih.gov/news/multimedia/journey-of-smell-to-brain-text-version) | The retrieved page describes airborne odor molecules activating olfactory sensory neurons, which send signals used by the brain to identify smells. | A biological boundary: this screen-based work offers a visual interpretation rather than an actual olfactory stimulus. The page does not establish any colour, shape, memory association or visual parameter used here. |
| [Fragonard — Fragonard perfume, 120 ml](https://www.fragonard.com/en-int/fragonard/fragonard-p-2906-o-1492.htm) | The official page's indexed text explicitly groups its description under top, heart and base notes. Its initial direct page retrieval succeeded; subsequent targeted detail requests timed out, so the grouping was confirmed from search-returned text belonging to this exact official URL. | A limited example of grouping several qualities in a fragrance description. SILLAGE does not reproduce this product, ingredients, packaging, imagery or formula. Its three qualities and relative stages are authored for this work. |

## Engineering reference

[Lenis official repository and README](https://github.com/darkroomengineering/lenis) was retrieved directly. Its current examples reference **1.3.27**, matching the implementation target reported by the project coordinator. The README documents the package's CSS import, a manual animation loop, millisecond timestamps for `raf`, scroll events, anchor navigation, destruction/cleanup and reduced-motion behaviour. It also documents `autoRaf` as disabled by default.

For SILLAGE, the planned integration is one manual RAF owner with `autoRaf: false`, the packaged stylesheet and one coordinated narrative progress value. Reduced motion must retain native browsing and all content. These are implementation decisions and acceptance requirements, not verified runtime results. A version-specific raw README fetch was unavailable through the retrieval service; the installed package and lockfile remain the final API/version authority. No GSAP integration is planned.

## Original work and use limits

- The Brightness / Spice / Warmth vocabulary, colours, edge identities, hollow, three visual stages, distance treatment, two memory fragments, proportions and titles come from the supplied creative brief and original editorial work.
- No research source supports a fixed evaporation time, concentration, molecular size, diffusion distance, psychological profile or therapeutic outcome for this artwork. None is claimed.
- The site is not a depiction or simulation of the olfactory nervous system. Its shares are parameters of the image, not quantities of perfume materials.
- Source URLs provide background attribution. They are not permissions to redistribute those websites' photography, product text or branding.
- Formal generated art needs its own actual prompt/output/use record. That record must not invent a model, seed or setting that the generation tool did not return.
- Distributable dependency and font licences must accompany the appropriate bundled material. This research note does not replace the package's asset/licence inventory.

## Verification limits

This research verified the narrow factual statements above and reviewed the currently returned Lenis documentation. It did not measure fragrance behaviour, perform physiological experiments, validate final image similarity, execute a browser test, install a dependency or establish any performance result. Browser, asset and packaging evidence belongs in the project's actual validation record.
