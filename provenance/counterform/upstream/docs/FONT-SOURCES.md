# COUNTERFORM — Font sources and real glyph geometry

The project bundles actual variable fonts and their original SIL Open Font License 1.1 files. Runtime font loading is local. All samples, vectors, and counters are derived from these fonts; no bitmap or generated image substitutes for a font specimen.

## Acquisition and provenance

Retrieved on **2026-10-12** from the official [Google Fonts repository](https://github.com/google/fonts), pinned to commit [`bd8f81ddb5c74d5c8897b36ad88b440266245103`](https://github.com/google/fonts/tree/bd8f81ddb5c74d5c8897b36ad88b440266245103).

| Face | Runtime asset | Size | Original TTF size | Character coverage |
| --- | --- | ---: | ---: | --- |
| Fraunces upright | `assets/fonts/Fraunces-Variable.woff2` | 195,012 bytes | 360,440 bytes | 624 Unicode code points; 698 glyphs |
| Fraunces italic | `assets/fonts/Fraunces-Italic-Variable.woff2` | 236,016 bytes | 414,904 bytes | 624 Unicode code points; 698 glyphs |
| Roboto Flex | `assets/fonts/RobotoFlex-Variable.woff2` | 791,300 bytes | 1,787,292 bytes | 826 Unicode code points; 948 glyphs |

WOFF2 conversion changes only the container/compression format. There was no subsetting, axis instancing, glyph editing, or renaming of these font binaries. Original TTF downloads are retained in `assets/fonts/original/` as extraction and provenance material. Browsers should load the WOFF2 files, not both formats.

The exact download URLs, source hashes, license hashes, metadata, complete axis lists, Unicode ranges, measured specimen metrics, and vector paths are in `docs/font-spec.json`. `licenses/font-download-provenance.json` records the downloaded files before conversion. Each `.OFL.txt` is the downloaded upstream file without alterations, including its original line endings.

### Fraunces

- [Pinned Google Fonts metadata](https://github.com/google/fonts/blob/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/fraunces/METADATA.pb)
- [Pinned license](https://github.com/google/fonts/blob/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/fraunces/OFL.txt), bundled as `licenses/Fraunces-OFL.txt`
- [Original font project: Undercase Type](https://github.com/undercasetype/Fraunces)
- [Designer specimen](https://fraunces.undercase.xyz)
- Designers credited in the Google Fonts metadata: Undercase Type, Phaedra Charles, and Flavia Zimbardi.
- Upstream source revision recorded by Google Fonts: `d6d385783609ceb11ac0f220f3abd9f1631c8a36`.
- Bundled font version string: `Version 1.000;[b76b70a41]`.

### Roboto Flex

- [Pinned Google Fonts metadata](https://github.com/google/fonts/blob/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/robotoflex/METADATA.pb)
- [Pinned license](https://github.com/google/fonts/blob/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/robotoflex/OFL.txt), bundled as `licenses/RobotoFlex-OFL.txt`
- [Original font project](https://github.com/googlefonts/roboto-flex)
- [Google Fonts specimen](https://fonts.google.com/specimen/Roboto+Flex)
- Designer metadata in the bundled font: `Berlow after Robertson`.
- Upstream source revision recorded by Google Fonts: `739e06dc46ebb14cddd88b9768a6c1504d4677f6`.
- Bundled font version string: `Version 3.200;gftools[0.9.32]`.

The bundled modern designs are used to illustrate structural principles. Their appearance is not presented as an exact reconstruction of an ancient inscription or an early metal typeface.

## Real axes from the bundled binaries

These values were read from each font's `fvar` table. Do not derive slider limits from another release or from a general description of a family.

### Fraunces — upright and italic

| Axis | Name | Minimum | Binary default | Maximum |
| --- | --- | ---: | ---: | ---: |
| `opsz` | Optical Size | 9 | 9 | 144 |
| `wght` | Weight | 100 | 900 | 900 |
| `SOFT` | Softness | 0 | 0 | 100 |
| `WONK` | Wonky | 0 | 1 | 1 |

Fraunces does **not** contain `wdth`. Its upstream README describes some different defaults from the bundled Google Fonts binary, so the binary values above govern this project. The `WONK` axis controls alternate forms and should not be explained as a continuous stroke-width control. Use explicit weight and optical-size values when presenting a fixed specimen.

### Roboto Flex

| Axis | Name | Minimum | Binary default | Maximum |
| --- | --- | ---: | ---: | ---: |
| `opsz` | Optical Size | 8 | 14 | 144 |
| `wght` | Weight | 100 | 400 | 1000 |
| `GRAD` | Grade | -200 | 0 | 150 |
| `wdth` | Width | 25 | 100 | 151 |
| `slnt` | Slant | -10 | 0 | 0 |
| `XOPQ` | Parametric Thick Stroke | 27 | 96 | 175 |
| `YOPQ` | Parametric Thin Stroke | 25 | 79 | 135 |
| `XTRA` | Parametric Counter Width | 323 | 468 | 603 |
| `YTUC` | Parametric Uppercase Height | 528 | 712 | 760 |
| `YTLC` | Parametric Lowercase Height | 416 | 514 | 570 |
| `YTAS` | Parametric Ascender Height | 649 | 750 | 854 |
| `YTDE` | Parametric Descender Depth | -305 | -203 | -98 |
| `YTFI` | Parametric Figure Height | 560 | 738 | 788 |

The public laboratory can expose `wght`, `wdth`, and `opsz` while leaving the ten other real axes at their defaults. Fewer visible controls do not reduce the underlying font's capabilities.

## Font loading and axis mapping

For CSS located at the project root, the following declarations identify the available weight and width ranges:

```css
@font-face {
  font-family: "Fraunces";
  src: url("./assets/fonts/Fraunces-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Fraunces";
  src: url("./assets/fonts/Fraunces-Italic-Variable.woff2") format("woff2");
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Roboto Flex";
  src: url("./assets/fonts/RobotoFlex-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 1000;
  font-stretch: 25% 151%;
  font-display: swap;
}

.live-specimen {
  font-family: "Roboto Flex", sans-serif;
  font-weight: var(--weight);
  font-stretch: calc(var(--width) * 1%);
  font-optical-sizing: none;
  font-variation-settings: "opsz" var(--optical-size);
  font-synthesis: none;
}
```

`font-weight` controls the registered weight axis, and `font-stretch` controls the registered width axis. Numeric optical-size control is explicit through `font-variation-settings`, with automatic optical sizing disabled for that specimen. No geometric scaling is required to simulate a width change. Wait for the required fonts before taking measured specimen layouts or final screenshots. A font-loading failure should leave readable fallback text and an honest disabled laboratory state.

## Outline geometry and anatomical measurements

`docs/font-spec.json` includes the actual `R`, `x`, `a`, `g`, and `&` outlines at the selected design instances. The primary fields are:

- `outlineSampleLocation`: deliberately selected axis values.
- `outlineSampleEffectiveLocation`: all axes, including unchanged defaults.
- `outlineSamples.R.svgPathFontUnitsYUp`: the complete original glyph outline in SVG path notation.
- `outlineSamples.R.counterPathsFontUnitsYUp[0]`: the isolated enclosed counter.
- `outlineSamples.R.contours`: contour paths, bounds, signed areas, and outer/counter roles.
- `outlineSampleMetrics`: metrics measured from glyphs at the selected instance.

| Upright specimen | Instance | Units per em | Cap height | Measured x-height | R bounds: xMin, yMin, xMax, yMax |
| --- | --- | ---: | ---: | ---: | --- |
| Fraunces | `wght=600, opsz=100, SOFT=0, WONK=1` | 2000 | 1400 | 881.043 | 70.152, 0, 1348.858, 1400 |
| Roboto Flex | `wght=650, wdth=100, opsz=72` | 2048 | 1456 | 937.535 | 103.388, 0, 1170.320, 1456 |

Coordinates remain in native font units, with **Y pointing upward** and the baseline at zero. To draw in ordinary SVG screen coordinates, apply a Y-axis inversion and the desired translation. Use `fill-rule="nonzero"` for the full source path.

Cap height is measured from the flat top of `H`; x-height is measured from `x`. Rounded letters such as `a` can extend beyond that x-height, so their overshoot must not be mistaken for the x-height. Static `OS/2` fields are recorded separately in the JSON and describe the font's base metadata. They are not a substitute for measuring a selected variable instance.

Fraunces represents part of its `R` with overlapping contours, so the enclosed counter is not a standalone contour in the raw pen output. Skia PathOps 0.9.2 was used to resolve the actual nonzero filled geometry and isolate the counter. The complete original path is also retained. Exported coordinates are rounded to 0.001 font units; no freehand approximation was introduced.

## Coverage and fallback boundaries

All three files cover the full printable ASCII range and the requested specimen characters `R`, `x`, `a`, `g`, and `&`. Curly quotation marks, apostrophes, en/em dashes, ellipses, multiplication/division signs, and common copyright marks were verified directly from their Unicode maps.

Fraunces does not cover the four directional arrow characters `← ↑ → ↓`; Roboto Flex does. Use Roboto Flex or an authored vector icon for those controls. Neither font covers the tested Chinese characters `文字字体`. The English exhibition text is therefore supported by the bundled fonts; a future Chinese translation requires a deliberate additional font and layout review.

Google Fonts declares Latin, extended Latin, and Vietnamese subsets for Fraunces. Roboto Flex also declares Cyrillic, extended Cyrillic, and Greek. Exact supported Unicode ranges are recorded in the JSON; a subset label is not a guarantee that every possible character in a language is supported.

## Verification and reproduction

Inspection used fontTools **4.61.1** and WOFF2 compression used Brotli **1.2.0**. Reopening the WOFF2 and comparing it to each original TTF confirmed:

- Identical glyph order and Unicode character mappings.
- Identical variable-axis definitions and `gvar` variation data.
- Identical horizontal advances.
- Identical coordinates and contour endpoints for every glyph.

For each exported specimen glyph, a 29 × 29 grid of point probes confirmed that the resolved contours and the original filled outline agree. This is a geometry sanity check; it does not replace the application's browser rendering and interaction checks.

To reproduce a full source path from a bundled WOFF2, install `fonttools` and `brotli`, then use `TTFont(...).getGlyphSet(location=...)` and draw the selected glyph into `fontTools.pens.svgPathPen.SVGPathPen`. The JSON specifies the exact file, code point, axis location, coordinate system, and source hash. Counter extraction additionally uses `skia-pathops`.

Keep the corresponding copyright notices and original OFL text with any redistribution of the bundled fonts. The licenses apply to the fonts; the generated exhibition artwork and website remain separate works.
