# Third-party software and font notices

The entries below were checked against the installed packages' own `package.json` metadata and license files on **9 November 2026 (Asia/Tokyo, UTC+09:00)**. The complete copied license text is authoritative; this table is an index.

| Component | Installed version | License declared by package | Retained notice |
| --- | --- | --- | --- |
| Libre Caslon Display, distributed by Fontsource | 5.3.0 | SIL Open Font License 1.1 (`OFL-1.1`) | [`licenses/libre-caslon-display-OFL.txt`](../licenses/libre-caslon-display-OFL.txt) |
| Source Sans 3, distributed by Fontsource | 5.3.1 | SIL Open Font License 1.1 (`OFL-1.1`) | [`licenses/source-sans-3-OFL.txt`](../licenses/source-sans-3-OFL.txt) |
| Lenis | 1.3.27 | MIT | [`licenses/lenis-MIT.txt`](../licenses/lenis-MIT.txt) |
| Vite | 8.3.6 | MIT for Vite core | [`licenses/vite-and-bundled-notices.md`](../licenses/vite-and-bundled-notices.md) |
| TypeScript | 7.0.2 | Apache License 2.0 (`Apache-2.0`) | [`licenses/typescript-Apache-2.0.txt`](../licenses/typescript-Apache-2.0.txt) |
| Playwright — test tooling only | 1.62.1 | Apache License 2.0 (`Apache-2.0`) | [`licenses/playwright-Apache-2.0.txt`](../licenses/playwright-Apache-2.0.txt) |
| Playwright Core — transitive test tooling only | 1.62.1 | Apache License 2.0 (`Apache-2.0`) | [`licenses/playwright-core-Apache-2.0.txt`](../licenses/playwright-core-Apache-2.0.txt) |

## Preservation

- Font license files are copied without altering their supplied copyright or attribution lines. The font binaries used by the main experience are bundled locally; the static reading edition uses system fonts.
- The Lenis file includes the copyright notice supplied by darkroom.engineering.
- Vite's entire installed `LICENSE.md` is retained, including its embedded third-party notices. Those embedded components are not all assigned Vite core's MIT label by this document.
- The full Apache license supplied with TypeScript is retained.
- Playwright and Playwright Core have identical installed `LICENSE` and `NOTICE` texts, but their `ThirdPartyNotices.txt` files differ. Each package's files are retained independently and unmodified: [Playwright notice](../licenses/playwright-NOTICE.txt), [Playwright third-party notices](../licenses/playwright-ThirdPartyNotices.txt), [Playwright Core notice](../licenses/playwright-core-NOTICE.txt), and [Playwright Core third-party notices](../licenses/playwright-core-ThirdPartyNotices.txt).
- Dependency versions and registry integrity values are fixed in `package-lock.json`. Build dependencies are installed from that lockfile; `node_modules` is not part of the source handoff.

## Test tooling is not part of the site runtime

Playwright is pinned as a development dependency for the portable local browser-test harness. Playwright Core is its transitive dependency. Visitors do not need either package to view the built site, and neither package is imported by the application source. Browser executables and local browser profiles are not included in the source handoff. Test setup may install a compatible browser separately; that browser's own distribution retains its applicable notices.

## Project artwork and source references

The generated artwork and authored diagrams are recorded separately in the asset manifest and provenance records. Scientific reference links are evidence for factual statements; they are not image-reuse licenses. The site does not reproduce institutional logos or source photographs and does not imply endorsement.

This notice indexes the installed direct dependencies and the supplied bundled notices. Newly added dependencies or replacement fonts need their own license check before redistribution.
