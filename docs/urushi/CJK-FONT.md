# URUSHI CJK

The complete production font is included at `public/assets/fonts/urushi-cjk.woff2`. An ordinary `npm ci`, `npm test`, and `npm run build` does not require Python, font tools, or a font download.

The refined bilingual copy extends the established static 400 horizontal subset. Its family remains **URUSHI CJK**. The original 393 Unicode values, glyph outlines, advances, ascender, descender, and line gap are preserved. The original notices and the complete SIL Open Font License remain in `public/licenses/noto-serif-sc-OFL.txt`; the previous subset provenance is retained under `docs/upstream/assets/`.

## Rebuilding after a copy change

Run `npm run reading:write` first so the checked-in no-JavaScript edition matches `src/story.js` and `src/i18n.js`. Obtain the two regular font members below from the official [`@fontsource/noto-serif-sc` 5.3.0 package](https://registry.npmjs.org/@fontsource/noto-serif-sc/-/noto-serif-sc-5.3.0.tgz), upstream version v35. Keep these authoring inputs outside the production project. The generator verifies their exact SHA-256 values before reading them.

| Package member | SHA-256 |
| --- | --- |
| `package/files/noto-serif-sc-chinese-simplified-400-normal.woff2` | `7dd5aea2df4644e916c2eb558bc8ed6ad6d8925c2c8e251fe68f7206da211696` |
| `package/files/noto-serif-sc-109-400-normal.woff2` | `e16a579d7e3f6ce1bf4244544955cc9960cd2f12f359b279303e68b9f94108f3` |

Use Python with `fonttools==4.61.1` and `brotli==1.1.0`:

```sh
python scripts/subset-cjk.py --source-dir /path/to/verified-font-inputs
```

The script unions the historical 393 code points with every non-ASCII character in `src/story.js`, `src/i18n.js`, `src/main.js`, and `index.html`. It preserves the established family and horizontal feature selection, compares existing decomposed outlines and horizontal advances, checks line metrics and weight, and writes the WOFF2 plus its actual production provenance. Intermediate component fonts use a temporary directory and are removed on completion.

The source archive, full input fonts, and comparison logs are authoring evidence. They are not runtime assets and are not needed to independently build this website. Browser inspection remains necessary after changing the text or font.
