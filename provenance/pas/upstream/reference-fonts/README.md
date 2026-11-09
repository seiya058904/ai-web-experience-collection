# Archived font files

These are unmodified copies of the exact Latin font styles imported by PAS from the pinned Fontsource packages:

| Package | Version | Styles |
| --- | --- | --- |
| `@fontsource/bodoni-moda` | 5.3.0 | Latin 400 normal; Latin 400 italic |
| `@fontsource/manrope` | 5.3.0 | Latin 400 normal; Latin 500 normal |

Each package directory contains the original CSS files, the WOFF2 and WOFF resources referenced by those files, and the package's exact SIL Open Font License 1.1 notice. The CSS retains its working `./files/` relative paths. The eight font binaries and four CSS files are preserved here so the source archive contains the actual typography resources even though `node_modules` is excluded.

The normal application still imports its fonts from the locked npm packages. Run `npm ci` to restore those packages; Vite then bundles the imported fonts as local production resources. These archival copies are not a second runtime font load and do not change the application source. No Google Fonts request is made at runtime.

See `../THIRD-PARTY-NOTICES.md` and `../licenses/` for the project-wide provenance and duplicate preserved font notices.
