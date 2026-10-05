# Font attribution

The bundled WOFF2 assets are self-hosted. No font CDN is contacted at runtime.

| Font | Bundled files | Source package | License |
| --- | --- | --- | --- |
| Barlow Condensed — Medium and SemiBold, Latin | `barlow-condensed-latin-500-normal.woff2`, `barlow-condensed-latin-600-normal.woff2` | [`@fontsource/barlow-condensed@5.3.0`](https://www.npmjs.com/package/@fontsource/barlow-condensed/v/5.3.0) | SIL Open Font License 1.1, complete text in `Barlow-Condensed-OFL.txt` |
| DM Sans — variable weight, upright, Latin | `dm-sans-latin-wght-normal.woff2` | [`@fontsource-variable/dm-sans@5.3.0`](https://www.npmjs.com/package/@fontsource-variable/dm-sans/v/5.3.0) | SIL Open Font License 1.1, complete text in `DM-Sans-OFL.txt` |
| Noto Sans JP — variable weight 100–900, upright, eight Japanese characters | `noto-sans-jp-kage-subset.woff2` | [Google Fonts CSS API, requested weights 400 and 500 and an explicit text subset](https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&text=%E5%BD%B1%E7%A9%BA%E7%B7%9A%E9%96%93%E5%85%89%E5%A1%8A%E5%BD%A2%E9%9D%99&display=swap) | SIL Open Font License 1.1, complete text in `Noto-Sans-JP-OFL.txt` |

## Original projects

- Barlow: Copyright 2017 The Barlow Project Authors. [Original project](https://github.com/jpt/barlow).
- DM Sans: Copyright 2014 The DM Sans Project Authors. [Original project](https://github.com/googlefonts/dm-fonts).
- Noto Sans JP: Copyright 2014–2021 Adobe, with Reserved Font Name "Source", as recorded in the [official Google Fonts license](https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt). [Official family source](https://github.com/google/fonts/tree/main/ofl/notosansjp).

The Latin files are copied unchanged from their Fontsource packages. Fontsource provides those Latin web subsets. The Japanese file is copied unchanged from the Google Fonts `text=` subset response retrieved on 2026-10-05; it contains the eight displayed characters **影 空 線 間 光 塊 形 静** (U+5F71, U+7A7A, U+7DDA, U+9593, U+5149, U+584A, U+5F62, U+9759), plus the font's space and required supporting glyphs. Its `wght` variation axis covers 100–900. Google Fonts supplied this small WOFF2 subset; the project does not alter its outlines or name records. All displayed Japanese glyphs are self-hosted, including in the portable HTML edition.

## Bundled file checksums

| Filename | Bytes | SHA-256 |
| --- | ---: | --- |
| `barlow-condensed-latin-500-normal.woff2` | 21424 | `460f141ec8f6c9a1516bfd2bd9fe71656246d7a9d04a0955faf53158d8970c4c` |
| `barlow-condensed-latin-600-normal.woff2` | 22308 | `215a93c696f442034a46fbb382958f753fda60e30490683aeea6b235fcbb2b66` |
| `dm-sans-latin-wght-normal.woff2` | 36932 | `9fea608a947e67020c33cad9a6fe3d60c54119dfb8cff87768a8117a15ed7543` |
| `noto-sans-jp-kage-subset.woff2` | 5464 | `7696a2ef283c9b5d6e31ecfeab1e4565fad7a273f77f0f856805803a1318e3ba` |
