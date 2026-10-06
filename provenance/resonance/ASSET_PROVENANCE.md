# Asset provenance and references

## Assets included in the project

| Asset | Origin | Use and license |
| --- | --- | --- |
| Procedural fields, strings, plate patterns, harmonic geometry and recording traces | Original code authored for RESONANCE | Rendered locally by the included visual modules; no stock scene photography |
| Interface icons, brand mark and favicon | Original SVG paths authored for this project | Included directly in the HTML and favicon |
| Synthesized sound and exported captures | Generated locally by the included audio module | No third-party audio samples or recordings |
| Manrope | Google Fonts distribution; upstream Manrope project | Bundled WOFF2 font; SIL Open Font License 1.1; license notice in `licenses/` |
| Cormorant Garamond, italic | Google Fonts distribution; upstream Cormorant project | Bundled WOFF2 font; SIL Open Font License 1.1; license notice in `licenses/` |

All runtime assets are local to the project. Reference links are acknowledgments and further reading; their pages, images and recordings are not embedded in the experience.

## Font sources and license records

### Manrope

- [Google Fonts family page](https://fonts.google.com/specimen/Manrope)
- [Google Fonts upstream family directory](https://github.com/google/fonts/tree/main/ofl/manrope)
- [Upstream OFL license](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt)
- Included runtime font: `dist/assets/fonts/manrope-latin.woff2`
- Bundled notice: [licenses/manrope-latin-OFL.txt](./licenses/manrope-latin-OFL.txt)

### Cormorant Garamond

- [Google Fonts family page](https://fonts.google.com/specimen/Cormorant+Garamond)
- [Google Fonts upstream family directory](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond)
- [Upstream OFL license](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt)
- Included runtime font: `dist/assets/fonts/cormorant-garamond-latin-italic.woff2`
- Bundled notice: [licenses/cormorant-garamond-latin-italic-OFL.txt](./licenses/cormorant-garamond-latin-italic-OFL.txt)

The font license texts and copyright notices are bundled under `licenses/`. Keep those notices with redistributed font files. The OFL applies to the font software; it does not require the surrounding website to use the same license.

## Generated composition studies

Custom generated images were used during the visual-direction pass to explore framing, typography, material, light and negative space. They are not shipped as scene backgrounds or runtime assets. The final visual fields, patterns and transitions are authored in code.

## Scientific and technical references

These sources informed the relationships depicted by the original implementation. No textbook passages, source photographs, charts, experimental recordings or third-party simulation code are bundled.

| Reference | Relationship used |
| --- | --- |
| [OpenStax — University Physics, 15.5 Damped Oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations) | Oscillation with an exponentially decreasing envelope under light damping |
| [OpenStax — 17.1 Sound Waves](https://openstax.org/books/university-physics-volume-1/pages/17-1-sound-waves) | Compression, rarefaction and longitudinal particle motion in air |
| [OpenStax — 16.6 Standing Waves and Resonance](https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance) | Counterpropagating waves, stationary nodes and ideal fixed-string harmonics |
| [OpenStax — 17.4 Normal Modes of a Standing Sound Wave](https://openstax.org/books/university-physics-volume-1/pages/17-4-normal-modes-of-a-standing-sound-wave) | Interference from phase and path differences |
| [UNSW Music Acoustics — Chladni patterns of guitar plates](https://www.phys.unsw.edu.au/~jw/guitar/guitarchladni_engl.html) | Experimental nodal patterns and sand settling near low-displacement regions |
| [COMSOL — How Do Chladni Plates Make It Possible to Visualize Sound?](https://www.comsol.com/blogs/how-do-chladni-plates-make-it-possible-to-visualize-sound) | Dependence of plate modes on geometry, material and constraints |
| [Council on Library and Information Resources — The Care and Handling of Recorded Sound Materials](https://www.clir.org/pubs/reports/child/sound/) | Mechanical motion, electrical signal, groove recording and playback |

The website's Chladni-inspired modes are qualitative rather than material-calibrated. The visual time scale is slowed relative to the synthesized audio. The recording trace communicates storage and transduction; it is not a physically specified record groove.

## Art and installation references

These are conceptual references only. Their artworks, photography, videos and soundtracks remain the property of their respective creators and rights holders. None is reused as a project asset.

| Reference | Design interpretation |
| --- | --- |
| [Ryoji Ikeda — datamatics, official artist page](https://www.ryojiikeda.com/project/datamatics/) | Precise monochrome fields, restrained accents and a continuous change of scale from line to space |
| [Carsten Nicolai — unidisplay, Copenhagen Contemporary](https://copenhagencontemporary.org/en/carsten-nicolai/) | Pattern as an architectural environment; long visual holds and extended spatial composition |
| [Zimoun — official works archive](https://zimoun.net/works/) | Material causes of sound, repetition with individual variation, and the physical presence of a source |

The implementation draws on these compositional ideas while using its own geometry, page structure, motion and synthesized sound. Acknowledgment is not a claim of endorsement or affiliation.
