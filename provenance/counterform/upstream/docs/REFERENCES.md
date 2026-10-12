# COUNTERFORM — Research references

Reviewed on 12 October 2026. These references inform the exhibition's terminology, historical framing and technical behavior. The short exhibition texts are original paraphrases. The references do not grant permission to redistribute their photographs, specimen artwork or commercial fonts; none of those materials were obtained for these documents.

Font-file provenance, distribution licenses and measured variation ranges are documented separately in [FONT-SOURCES.md](FONT-SOURCES.md) and [font-spec.json](font-spec.json).

## Typography and historical framing

| Source | Why it is used | Boundary for this exhibition |
| --- | --- | --- |
| Peter Biľak, Typotheque — [A Brief History of Sans Serif Typefaces](https://www.typotheque.com/articles/a-brief-history-of-sans-serif-typefaces) | Documents several approaches to sans design, including geometric and humanist constructions and their historical connections. | DIVIDE presents different design traditions. It makes no claim that removing serifs explains the entire design, or that sans is the final stage of typography. |
| Peter Biľak, Typotheque — [The History of History](https://www.typotheque.com/articles/the-history-of-history) | The designer's account of a layered type system helps frame continuity, recombination and the relation between technologies and letterforms. | It is a conceptual reference for shared structural relationships. COUNTERFORM does not include Typotheque's History font or reproduce its specimens. |
| Martin Majoor, Typotheque — [My Type Design Philosophy](https://www.typotheque.com/articles/my-type-design-philosophy) | A firsthand explanation of making related serif and sans families from a common underlying design. | Treat the designer's judgments as his approach, not universal rules. Fraunces and Roboto Flex are independently authored families; this project does not present them as matching historical relatives. |
| Monotype — [Typography Terms and Definitions](https://www.monotype.com/resources/expertise/typography-terms-and-definitions) | Establishes working definitions of counters, bowls, serifs, baselines, x-height, tracking and kerning. | Anatomy labels distinguish filled strokes from internal space. General letter spacing is not called kerning. |
| Ilene Strizver, MyFonts / Fonts.com — [Anatomy of a Character](https://www.myfonts.com/pages/fontscom-learning-fontology-level-1-type-anatomy-anatomy) | Confirms the arm/leg distinction and measuring cap height against flat capitals. | A capital R has a diagonal leg. An x-height guide belongs to the font's lowercase proportions and needs an actual lowercase reference. |
| Undercase Type — [Fraunces project](https://github.com/undercasetype/Fraunces) | Its creators identify Fraunces as a display soft-serif with inspirations in early twentieth-century type. | MARK is a contemporary relief interpretation set in Fraunces. It is not evidence of an ancient inscription or an archaeological reconstruction. |

## Printing process and its multiple histories

| Source | Why it is used | Boundary for this exhibition |
| --- | --- | --- |
| Victoria and Albert Museum — [What is print?](https://www.vam.ac.uk/articles/what-is-print) | Explains relief printing: the raised image receives ink and transfers it to another surface. | PRESS inks the raised letter shape. Its recessed counter and surrounding nonprinting space stay uninked. The animation is a diagrammatic material study, not a simulation of a named historical press. |
| Melbourne Museum of Printing — [Photoengraving from typesetting](https://www.mmop.org.au/gallery/engrav01/apg0202b.htm) | An explanation attached to a collection object explicitly describes type as reverse-reading. | The type face reads as a mirror image; the impression on paper reads normally. Mirroring is distinct from black/white inversion. |
| Michela Bussotti, BnF / France–Chine — [L'imprimerie chinoise traditionnelle](https://heritage.bnf.fr/france-chine/limprimerie-chinoise-traditionnelle) | A specialist account of Chinese woodblock and movable-type printing, with links to collection objects and early textual testimony. | A stone-to-metal scene change is an artistic transition. It is not presented as a complete or universal chronology of printing. |
| Bibliothèque nationale de France — [Imprimer ! L'Europe de Gutenberg](https://www.bnf.fr/fr/agenda/imprimer-leurope-de-gutenberg) | Places Gutenberg's European work alongside earlier East Asian printing, including the surviving Korean Jikji. | The exhibition avoids assigning all printing to a single inventor or civilization. It does not infer an undocumented direct transmission route between these traditions. |

The BnF sources support this optional historical note: **“Woodblock and movable-type printing developed in East Asia before Gutenberg's work in Europe.”** Specific dates and claims of the very first surviving object are deliberately omitted from the on-page copy.

## Variable typography

| Source | Why it is used | Boundary for this exhibition |
| --- | --- | --- |
| MDN — [font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variation-settings) | Explains registered/custom axes and the relationship between low-level settings and standard CSS properties. | Controls must correspond to axes in the delivered binary. `font-weight` and `font-stretch` are preferred for weight and width; a manually chosen optical size requires an explicit `opsz` setting. |
| Microsoft OpenType specification — [wght](https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_wght) | Defines the registered weight axis. | Increasing its value changes typographic weight through the font's design. |
| Microsoft OpenType specification — [wdth](https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_wdth) | Defines the registered width axis. | The width control invokes the font's width design; CSS geometry scaling is not a substitute. |
| Microsoft OpenType specification — [opsz](https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_opsz) | Defines optical size as design adaptations for different intended text sizes. | Optical size can change proportions, strokes and details while the displayed CSS font size stays fixed. The axis values are interpreted on a typographic point scale. |

## Interpretation and evidence

The recurring negative-space object, animated pressure, changing materials and final poster are the exhibition's visual metaphors. They are not historical artifacts. The sources support terminology and the limited historical assertions above; they do not authenticate the scene's invented object, lighting or choreography.

Actual font ranges and outline geometry are checked against the delivered files. Browser rendering, motion, accessibility and performance require the separate implementation QA; documentary research alone does not certify those behaviors.
