# Atlas Japanese Labels: source and reproducible generation

This 4,096-byte static weight-400 WOFF2 contains only the 15 unique Unicode characters used by the existing Sources text **国土地理院ベクトルタイル提供実験**. It is a subset of the official Japanese Noto Sans JP source, not a Chinese substitute. No Latin cmap entries are included. CSS places the family after the existing Manrope font, scopes it with exactly these Unicode ranges, and does not preload a full CJK font.

The original Google Fonts repository is frozen at commit `66a36c8c94b1a5d992ee4e7f392fccfe4945767c`. Its metadata names the upstream Noto CJK repository at commit `523d033d6cb47f4a80c58a35753646f5c3608a78`.

- Source TTF: https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf
- Source size: 9,589,900 bytes.
- Source SHA-256: `c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`.
- Original license: https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/OFL.txt
- Preserved license file: `Atlas-Japanese-Labels-OFL-1.1.txt`; its exact SHA-256 is `1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9`.
- Result: `../fonts/atlas-japanese-labels-400.woff2` relative to this licenses directory, 4,096 bytes; SHA-256 `8ac7795304daa27e71d9be1daee1439a499e229478e12038d106099170f86cc2`.

The source is licensed under SIL Open Font License 1.1 and names **Source** as a Reserved Font Name. The modified font's primary family is therefore renamed **Atlas Japanese Labels**; full name **Atlas Japanese Labels Regular**, PostScript name **AtlasJapaneseLabels-Regular**. The font remains under the same OFL; original copyright and license text are retained both in metadata and alongside the asset. No endorsement by Google, Adobe or the original authors is implied.

## Reproduction

Actual generation used Python 3.12, fontTools **4.61.1**, and Brotli **1.1.0**. Start from the project root; use a temporary tool environment, not a project dependency:

```sh
python3 -m venv .font-build
.font-build/bin/python -m pip install fonttools==4.61.1 Brotli==1.1.0
curl --fail --location 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf' --output .font-build/NotoSansJP.ttf
```

Save the following complete script as `.font-build/generate-subset.py`, then run:

```sh
.font-build/bin/python .font-build/generate-subset.py .font-build/NotoSansJP.ttf public/fonts/atlas-japanese-labels-400.woff2
```

The script rejects a source with a different hash. It subsets the original Japanese glyphs with layout closure/hinting retained, statically instantiates weight 400, renames the derivative, retains the original font timestamp and encodes WOFF2. The original 9.59 MB TTF and temporary tool environment are research inputs and are deliberately excluded from the source delivery. Download URLs and hashes are recorded so the small derivative remains reproducible.

```python
#!/usr/bin/env python3
"""Generate only ATLAS's existing Japanese source-name glyphs, at weight 400."""
import argparse
import hashlib
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

TEXT = '国土地理院ベクトルタイル提供実験'
SOURCE_SHA256 = 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    if hashlib.sha256(args.source.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError('Expected the frozen Google Fonts Noto Sans JP source')
    font = TTFont(args.source, recalcTimestamp=False)
    expected = set(map(ord, TEXT))
    if not expected.issubset(font.getBestCmap()):
        raise ValueError('The original Japanese source lacks requested characters')
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.name_legacy = True
    options.glyph_names = True
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=sorted(expected))
    subsetter.subset(font)
    font = instantiateVariableFont(font, {'wght': 400}, inplace=True, optimize=True)
    # OFL's reserved name is "Source". Use an independent derivative family.
    names = {
        1: 'Atlas Japanese Labels', 2: 'Regular',
        3: 'AtlasJapaneseLabels-Regular-1.000',
        4: 'Atlas Japanese Labels Regular', 6: 'AtlasJapaneseLabels-Regular',
        16: 'Atlas Japanese Labels', 17: 'Regular',
        21: 'Atlas Japanese Labels', 22: 'Regular',
    }
    for record in list(font['name'].names):
        if record.nameID in names:
            font['name'].setName(names[record.nameID], record.nameID,
                                 record.platformID, record.platEncID, record.langID)
    # Variable-only prefix is unused after static instancing; do not retain it.
    font['name'].names = [record for record in font['name'].names if record.nameID != 25]
    font['OS/2'].usWeightClass = 400
    font['OS/2'].fsSelection &= ~((1 << 0) | (1 << 5))
    font['OS/2'].fsSelection |= 1 << 6
    font['head'].macStyle &= ~3
    font.recalcTimestamp = False
    font.flavor = 'woff2'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    font.save(args.output)
    font.close()
    output = TTFont(args.output, recalcTimestamp=False)
    assert set(output.getBestCmap()) == expected
    assert 'fvar' not in output and output['OS/2'].usWeightClass == 400
    assert all(ord(char) > 0x7F for char in TEXT)
    output.close()
    print('bytes:', args.output.stat().st_size)
    print('sha256:', hashlib.sha256(args.output.read_bytes()).hexdigest())
    print('unicode-range:', ','.join(f'U+{cp:04X}' for cp in sorted(expected)))

if __name__ == '__main__':
    main()
```

## Checks and scope

The WOFF2 was reopened successfully and its cmap is exactly the 15 requested codepoints, with no ASCII/Latin entries and no remaining variable axis. Default Japanese outline command topology was compared with the original Noto Sans JP at weight 400; static integer quantization changed coordinates by at most 0.499267578125 font units. This is expected rounding during static instancing, not substitution of another region's glyph shapes.

A second independent invocation of the same generator produced the same 4,096 bytes and SHA-256. The stylesheet change is limited to one @font-face block and the existing root sans-family fallback list. It does not change Manrope, font sizes, spacing, layout, the source text, or preload tags.

This record verifies provenance, codepoint coverage and reproducibility. It does **not** assert browser UI acceptance. The Sources dialog must still be viewed in the new frozen production build, with actual Japanese glyphs and mixed Latin/Japanese text checked by QA. Any later Japanese copy outside these codepoints requires an explicit subset regeneration; this asset is not a general Japanese font.
