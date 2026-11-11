# Packaged third-party notices

Copied or extracted from the actual installed packages on November 9, 2026. These notices retain their original wording. The project's original-source MIT terms do not replace any dependency or font license.

| File | Installed package | Original location | Treatment |
| --- | --- | --- | --- |
| [Cormorant-Garamond-OFL.txt](Cormorant-Garamond-OFL.txt) | `@fontsource/cormorant-garamond` 5.3.0 | `node_modules/@fontsource/cormorant-garamond/LICENSE` | Complete file copied byte-for-byte. |
| [DM-Sans-OFL.txt](DM-Sans-OFL.txt) | `@fontsource/dm-sans` 5.3.0 | `node_modules/@fontsource/dm-sans/LICENSE` | Complete file copied byte-for-byte. |
| [Lenis-MIT.txt](Lenis-MIT.txt) | `lenis` 1.3.27 | `node_modules/lenis/LICENSE` | Complete file copied byte-for-byte. |
| [GSAP-source-notices.txt](GSAP-source-notices.txt) | `gsap` 3.15.1 | `gsap-core.js`, `ScrollTrigger.js`, `Observer.js` in the installed package | Each leading license-comment block is reproduced exactly, preceded by its source path. |
| [GSAP-package-license.json](GSAP-package-license.json) | `gsap` 3.15.1 | `node_modules/gsap/package.json` | The exact `name`, `version` and `license` field values, serialized as JSON. |

## GSAP scope

The installed GSAP package has no standalone `LICENSE` file. Its actual source notices and declared license are retained here instead of inventing an MIT notice or presenting a summary as the full license. GSAP uses the [Standard “No Charge” License](https://gsap.com/standard-license/); its complete terms are available at that official address. The website, source bundle and portable build must preserve the proprietary notices already included in the library code.

## Copy verification

The three complete copied files were compared byte-for-byte with their installed originals. Their SHA-256 values are:

```text
732f37009943e7f4378cf37113c9bcc4716af002a8583511aa91ed5d37683e73  Cormorant-Garamond-OFL.txt
6fbd040a29c2037a765dfb9f2561e9965b5c95c6dcb5dce516089d63d5f17af7  DM-Sans-OFL.txt
7d1896b31f2eed9f286b05faca067c4e35b2f109ae7c4ed5105220e2d2820228  Lenis-MIT.txt
```

These hashes identify the packaged notice files, not the executable code or the entire source archive. See [ATTRIBUTION.md](../../ATTRIBUTION.md) for generated artwork, factual sources, optional sound and build-tool attribution.
