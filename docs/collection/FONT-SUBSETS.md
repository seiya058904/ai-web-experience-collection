# Collection font subsets

Four large fonts have Collection-only text subsets. Original work files, CSS family aliases, glyph outlines, hinting, shaping features, weights and variable axes are retained. The derivatives use distinct embedded family/PostScript names. `public/collection/fonts/NOTICE.md` links the original copyright and complete OFL files.

| Family | Original bytes | Preview bytes |
| --- | ---: | ---: |
| Roboto Flex | 249,700 | 99,084 |
| Fraunces | 195,012 | 52,740 |
| Cormorant Garamond Light | 192,832 | 22,920 |
| Newsreader | 132,000 | 43,012 |
| Total | 769,544 | 217,756 |

This removes 551,788 font bytes from a cold entrance. It does not claim a fixed load-time improvement or apply to a warm visit that already cached the original work fonts. All original work resources remain available unchanged.

## Reproduction

Use Python 3.12 and an external virtual environment (do not put it in the repository):

```sh
python -m venv <outside-repository>/collection-font-tools
<venv-python> -m pip install -r scripts/collection-fonts-requirements.txt
<venv-python> scripts/subset-collection-fonts.py
<venv-python> scripts/subset-collection-fonts.py --check
node --test tests/collection-fonts.test.mjs
```

The generator extracts text from the selected native gallery anchors in `pages/index.html`, including case variants for CSS text transforms. It retains every OpenType layout feature and variable axis, verifies the serialized cmap and axes, and records tool versions, characters and source/output/license SHA-256 in `provenance/collection/font-subsets.json`. Generation has no wall-clock timestamp; `--check` compares bytes without writing.

When those gallery words change, regenerate and review the manifest. When another panel starts using one of these families, add its route to `SPECS` in the generator. The browser check also examines computed font families across every gallery text node, so a new use outside the generator's known panels cannot silently introduce missing glyphs. Original unsupported characters remain explicitly recorded as original fallbacks.

After generation, build and run the browser checks in `BROWSER-CHECKS.md`, then inspect complete frames at the required viewport sizes. Preserve ligatures, line breaks and text metrics; avoid deleting font axes merely to reduce size.
