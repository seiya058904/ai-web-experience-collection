# Research and interpretive boundaries

Checked during this build against primary sources. Research illustrations are consulted, not redistributed. Source copy is summarized below; original assets are authored for this exhibition.

| Source | Limited finding used | Production consequence |
| --- | --- | --- |
| [MBARI: Angler siphonophore](https://www.mbari.org/animal/angler-siphonophore/) | Erenna sirena is a connected colony with specialized parts and luminescent lures. | A differentiated swimming region, central stem, feeding region and connected fishing tentacles. No umbrella-jelly silhouette. |
| [Haddock et al., 2005](https://dunnlab.org/assets/haddock-etal2005_erenna.pdf), Science 309:263, DOI 10.1126/science.1110441 | Terminal photophores and mature red fluorescent material were described; mature tentilla flicked. Figure 1 was visually inspected. | A terminal red-orange lure on a fine connected branch. Its display brightness is artistic; no emission-spectrum measurement is implied. |
| [MBARI: Bioluminescence](https://www.mbari.org/know-your-ocean/bioluminescence/) | Organisms generate light through chemical reactions. | Surface illumination and internally generated light are distinct render channels. |
| [Burford & Robison, 2020](https://www.pnas.org/doi/10.1073/pnas.1920875117), PNAS 117(15):8524–8531 | The paper records bilaterally pale/dark and countershaded components. Subcutaneous photophores could backlight skin pigmentation; the proposed signaling mechanism was not filmed in situ in that study. | Compare Pattern A (bilaterally pale/dark) and Pattern B (countershaded). Show a conceptual backlight with an explicit hypothesis label. Assign no semantic translations. |
| [MBARI: Humboldt squid research](https://www.mbari.org/news/deciphering-the-visual-language-of-humboldt-squid/) | Photophores lie under the skin; pigment patterns may modulate their visibility. The meanings of sequences remain uncertain. | Fixed pigmentation masks over an independently controlled backlight. Its color and intensity are qualitative artistic choices. |
| [Monterey Bay Aquarium: Comb jelly](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/comb-jelly) | Comb rows interact with external light to produce rainbow effects. | A brief comparison whose rainbow disappears with external illumination. This does not claim comb jellies cannot bioluminesce. |

## What the artwork does not claim

- Exact anatomical reconstruction, measured brightness, spectra, prey-detection thresholds or capture probabilities.
- Recorded encounter timing, natural movement trajectories or co-occurrence of the three observation subjects.
- A decoded squid vocabulary. “Language” is the exhibition's artistic proposition.
- Completely natural darkness: a small exhibition fill keeps the colony legible when survey light is off.

## Originality check

Read the existing collection README through GitHub (README blob `99d9b4fd5a60ed96d916e3ab184388333f6e23aa`), which lists 32 experiences. PELAGIC focuses on observation and biological light rather than ORBITAL's traversal, OPTIC/GLASSHOUSE's optical material, RESONANCE's audio, or VERDANT's environmental atmosphere. The collection was read only.

## Engineering references

- [Lenis official README](https://github.com/darkroomengineering/lenis): default `autoRaf` is false. Its documented GSAP integration calls `lenis.raf(time * 1000)` from the GSAP ticker and connects the scroll event to ScrollTrigger.update. This implementation has exactly one master ticker.
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): chapter progress is derived from the scroll range and geometry is refreshed on actual layout changes. No wheel lock, forced snap or replay-on-scroll event chain.

Access record: original prompt date 2026-10-24. Retrieval occurred during the execution session. The package's QA report records the actual later execution timestamp separately.
