# COUNTERFORM — Terminology and content accuracy

This is the content contract for the exhibition. Source links and the reason for using each source are in [REFERENCES.md](REFERENCES.md). The specimen uses the Latin letter R as its recurring form; it is not a survey of every writing system.

## Short exhibition copy

These lines are intentionally short enough to sit beside the letterforms. They are original copy, not quotations.

| Chapter | Suggested on-page copy | Evidence / interpretation |
| --- | --- | --- |
| MARK | **Light finds the edge of a letter. A contemporary relief study, set in Fraunces.** | “Light finds…” is a visual metaphor. The second sentence identifies the actual contemporary typeface and avoids an archaeological claim. |
| PRESS | **A raised, mirrored face carries ink to paper. Its counter stays unprinted.** | A concise description of the relief transfer shown; V&A and Melbourne Museum of Printing. |
| DIVIDE | **Serif and sans draw different rhythms. Proportion, contrast and spacing shape each voice.** | Curatorial description informed by the Typotheque sources; it presents comparison without a hierarchy of progress. |
| ANATOMY | **The bowl is the stroke; the counter is the space it holds. Follow the edge to see the difference.** | Monotype / Fonts.com anatomy definitions applied to R. |
| VARIABLE | **One font, a continuous design space. Change weight, width and optical size to reshape the page.** | The delivered Roboto Flex supports all three axes; the controls must use that font. |

Optional short historical caption: **“Woodblock and movable-type printing developed in East Asia before Gutenberg's work in Europe.”** Use with the BnF reference link. This contextualizes the scene without implying that all printing has a single origin story.

## Working vocabulary

Definitions are paraphrased from the foundry and typographer sources linked in REFERENCES.

| Term | Meaning in this project |
| --- | --- |
| Glyph | A designed representation of a character. |
| Counter | Unfilled space fully or partly enclosed by a letterform. R has an enclosed upper counter. |
| Bowl | The curved stroke surrounding that space. |
| Stem | R's principal vertical stroke. |
| Leg | R's lower diagonal stroke. |
| Serif | A projecting finish attached to a main stroke. |
| Sans serif | A type design without serifs. |
| Baseline | The reference on which letters appear to rest. |
| Cap height | Capital height above the baseline, assessed with flat-topped capitals. |
| x-height | Lowercase body height, conventionally represented by x. |
| Stroke contrast | Difference between thicker and thinner parts of a letter's strokes. |
| Tracking | Spacing adjustment across a run of text. |
| Kerning | Spacing adjustment for a particular character pair. |
| Counterform | The exhibition's broad theme of negative shapes within and between letters. It is not used as an exact synonym for every letter's counter. |

## Accuracy requirements for the scenes

1. **MARK identifies its interpretation.** Fraunces is a contemporary digital typeface. Material texture, tool-like marks and carved shadows must not imply that its R was sampled from a Roman monument. No invented inscription date, archaeological attribution or foundry provenance appears on screen.
2. **PRESS preserves physical causality.** The raised mirror-reading face receives ink, contacts the sheet and leaves a normal-reading impression. An unprinted counter is a recess on the type face. A dark scene or a paper/ink color inversion does not itself demonstrate mirror reversal. The letter's face remains raised even if the surrounding block is rendered dark.
3. **DIVIDE compares whole designs.** Fraunces and Roboto Flex have different authors and design systems. A matched baseline or a crossfade is an editorial comparison, not proof of shared outlines or direct historical descent. Sans need not be monoline, serif need not be high contrast, and neither is labelled universally more readable.
4. **ANATOMY labels actual geometry.** The bowl callout lands on a filled curved stroke; the counter callout lands inside its empty area. Metric lines follow the selected font instance. A lowercase x provides the x-height reference; the middle of a capital R is not x-height. Preserve optical overshoot rather than forcing every contour onto a metric line.
5. **VARIABLE exposes real axes.** The public specimen uses Roboto Flex: `wght` 100–1000, `wdth` 25–151, `opsz` 8–144. These are file-derived ranges recorded in [font-spec.json](font-spec.json), not assumed from the family name. Fraunces has no width axis in the delivered files.
6. **Optical size has its own meaning.** The `opsz` setting selects forms intended for different reading sizes. It does not set CSS `font-size`. For this specimen, holding physical display size constant makes its design changes easier to inspect. Weight, width and optical-size controls retain distinct labels and numeric values.

## Review status and limits

The historical wording and terminology above were checked against the listed primary sources. Font identification and exposed ranges were cross-checked with the font acquisition record. This document describes the intended correct behavior; it does not claim that every animation frame or label position has passed browser QA. Final visual and functional review should confirm items 2, 4, 5 and 6 in the running site.
