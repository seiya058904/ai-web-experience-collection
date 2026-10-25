# Clean archive installation and build

The source archive was extracted into a new empty directory on 24 October 2026.
No `node_modules`, generated build output, browser profile, cached Vite output
or existing application directory was copied into that extraction.

Environment: **Linux x64, Node.js 24.22.1, npm 11.9.0**.

| Check | Actual result |
| --- | --- |
| ZIP integrity | Every compressed entry passed the ZIP CRC check. |
| Extraction | All packaged source/evidence files matched FILE-CHECKSUMS.json before execution. |
| Dependency install | `npm ci --no-audit --no-fund` succeeded; 23 packages installed from the exact lockfile. |
| Model tests | `npm test` succeeded: 23 tests, 23 passes, 0 failures. |
| Production build | `npm run build` succeeded with Vite 8.3.5; 14 modules transformed. |
| Build references | Every local HTML/CSS asset reference resolved to a real generated file. |
| Local fonts | All three WOFF2 production files were present under dist/fonts. |
| Fresh output | Eight generated files; no previous hashed build versions were carried into the extraction. |
| Binary identity | Clean-build index SHA-256 exactly matches the final focused browser regression. |

The production-index SHA-256 from the clean build is:

`29412d915c50d3147809c84aa21d0cdbdd634fe7110b37e6a85d32742bc0e0d4`

The produced application files were:

- `dist/index.html`
- `dist/assets/index-C8VfFiy1.css`
- `dist/assets/index-CVaz18Xt.js`
- `dist/assets/index-CVaz18Xt.js.map`
- `dist/favicon.svg`
- `dist/fonts/archivo-latin.woff2`
- `dist/fonts/archivo-latin-ext.woff2`
- `dist/fonts/ibm-plex-mono-latin.woff2`

An initial `npm ci --offline` probe reported ENOTCACHED for Playwright's package
because the machine did not hold every tarball. The documented ordinary
registry-backed installation then succeeded. Offline first installation is
not claimed; runtime assets are local after installation/build. npm also
printed a host-provided http-proxy configuration warning, which did not prevent
the normal installation, tests or build.

The final review and this verification record were then included in the
archive. Its final contents were extracted again, every manifest hash was
checked, and the same pinned installation, model suite and build were executed
again. The result remained the same production-index hash. Documentation
changes did not alter the tested application source or runtime assets.

The archive deliberately omits generated `dist/`, dependencies, temporary
previews and browser executables. The complete original source and local assets
recreate the verified production build with the commands in the English README.
