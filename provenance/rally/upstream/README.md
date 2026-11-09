# RALLY

## The space between

An original clay-court exchange between two people, told in ten moments. Follow A's topspin shot, inspect an independent spin comparison, choose B's return, and watch how that choice changes the space available to A. The court, ball, landing marks, and replay share one deterministic coordinate model.

The website, its controls, and its exported result use English. A is always the original near-side player in navy; B is always the original far-side player in cream. A camera change does not exchange their identities.

This is a local project delivery. Publication, repository pushes, releases, and changes to an existing collection are outside this delivery.

## Optional offline file

If the package includes **`portable/RALLY.html`**, open that file directly in a current browser such as Chrome or Edge. It is a standalone copy of the application: JavaScript, CSS, the production images, fonts, favicon, and runtime license notices are embedded in the one HTML file. Viewing this prebuilt file requires neither Node.js nor a local server. The study-notes source links still lead to external websites only if you choose to follow them.

To regenerate the portable file from source after installing dependencies:

```bash
npm run build:portable
```

This command checks the TypeScript source, runs a separate Vite build, and creates `portable/RALLY.html`. Asset substitutions happen only inside the build pipeline; the regular application source is unchanged. The builder checks for remaining external runtime resources. Actual browser interaction results remain part of [the acceptance record](docs/acceptance.md).

## Start on Windows

1. Install **Node.js 24 or later**, including npm, if it is not already installed.
2. Extract the **source archive** into a normal folder. Do not run the project from inside the ZIP viewer.
3. Double-click **`START-WINDOWS.cmd`** to install missing dependencies and open the development site.
4. For a fresh production build and local preview, use **`PREVIEW-WINDOWS.cmd`** instead.

Both scripts start from their own folder, handle spaces in paths, check Node/npm, and leave errors visible. Keep the terminal open while using the website. Press `Ctrl+C` to stop the server. The local address printed by Vite is authoritative if its usual port is already occupied. The scripts bind the server to `127.0.0.1`.

The first dependency installation requires network access to the npm registry. The production website uses packaged assets; it does not need an account, database, runtime AI API, or paid service. Actual Windows execution of the launch scripts must be distinguished from their static review; see the acceptance record for the environments actually exercised.

## Terminal commands

Run these commands in the folder containing `package.json`:

```bash
npm ci
npm run dev -- --host 127.0.0.1 --open
```

For verification and production preview:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --open
```

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency tree from `package-lock.json` |
| `npm run dev` | Start Vite's development server; the package default listens on all host interfaces |
| `npm test` | Execute the model and explicit-state tests with Node's test runner |
| `npm run build` | Run TypeScript checks, then write the production site to `dist/` |
| `npm run build:portable` | Type-check and create the self-contained offline `portable/RALLY.html` |
| `npm run preview` | Serve the production build locally; build first |

Opening the source or ordinary production `index.html` directly through a `file:` URL is not the supported workflow for those versions; use a local HTTP server. The separate `portable/RALLY.html` is specifically built for direct opening. `vite.config.ts` sets `base: './'`, so regular build-generated asset references are relative and can work below a subdirectory. The separate acceptance record identifies whether that subdirectory case was actually tested.

## Delivered files

**`RALLY-source.zip`** is the primary package. It contains editable TypeScript, styles, the dependency lockfile, production images, provenance, documentation, tests, the built `dist/` directory and `portable/RALLY.html`. Use it for the Windows launch scripts or for rebuilding the work.

**`RALLY.html`** is also supplied separately for convenient offline viewing. The source archive contains the identical file under `portable/`. **`RALLY-delivery-report.md`** records the delivery status and limits, and **`SHA256SUMS.txt`** records the final file checksums. No website has been published.

To check downloaded archives in PowerShell, run this in the folder containing those ZIP files and compare the results with the delivery report:

```powershell
Get-ChildItem -File *.zip | Get-FileHash -Algorithm SHA256
```

## The experience

| Chapter | What it adds |
| --- | --- |
| 01 — Between two people | The ball, the net, and the two ends of one shared court |
| 02 — Before contact | A's preparation and the space before the next shot |
| 03 — A single instant | Before and after A's racket contact |
| 04 — See the spin | The same launch with and without topspin; independent from the main rally |
| 05 — A little room | The fixed topspin main shot, its net clearance, and B-side landing |
| 06 — The ground answers | Before, contact, and after at one consistent bounce point |
| 07 — See the opening | B's arrival, A's recovery, and an alternate court view |
| 08 — Where to return | B's two authored answers: crosscourt or down the line |
| 09 — Your rally | The selected branch, with playback, pause, stepping, and reset |
| 10 — Give it back | A quiet closing exchange and a branch-specific rally diagram |

The spin comparison starts with topspin; the return choice starts crosscourt. A no-spin comparison can genuinely land long. Continuing the story restores A's fixed, legal topspin main shot. Changing the return branch invalidates the previous replay immediately. Saved preferences restore paused and muted.

The trajectories are a simplified demonstration, not match data, professional coaching, or a precise aerodynamic simulation. Their assumptions, event timings, and API are documented in [the model contract](docs/physics.md). The player layers are generated editorial poses, not motion-capture records.

## Project guide

| Location | Contents |
| --- | --- |
| `src/` | Scene rendering, interaction, immutable state, and deterministic trajectories |
| `public/art/` | Optimized production images loaded by the site |
| `art-assets/` | Generated source images and exact prompt/provenance records |
| `tests/` | Model and state regression tests |
| `scripts/build-portable.mjs` | Build-only asset embedding and static offline-resource validation |
| `portable/RALLY.html` | Self-contained browser file after `npm run build:portable` |
| `docs/` | Design direction, requirements, sources, and acceptance evidence |
| `public/licenses/` | Runtime and font notices copied into production output |
| `dist/` | Production build after `npm run build` |

Read [art direction](docs/art-direction.md), [the implementation design](docs/design-spec.md), [asset provenance](docs/asset-provenance.md), [the requirements ledger](docs/requirements.md), and [the acceptance record](docs/acceptance.md) for the detailed decisions and their evidence.

## Verification status

The physics and explicit-state suites passed **31 tests** on Linux with Node.js v24.22.1. Whole-application TypeScript checking, the production build and the portable build passed. A source archive was extracted into a new directory; `npm ci`, the same 31 tests and both builds passed there, with byte-identical JavaScript, CSS and portable HTML. Documentation and evidence were finalized after that gate; the final archive is checked against those verified runtime files.

The eight required image roles and three additional utility images were generated and recorded. Actual browser review covered the desktop chapter sequence and several phone chapter/control states. Browser input, capture and recovery interruptions prevented completion of the full viewport, transition and export-download matrix. Final photographic Hero fidelity and all 45 transition frames are **not fully verified**. The portable file's resource independence was checked statically; direct `file:` interaction and the Windows launchers were not exercised on physical Windows hardware.

**Use [docs/acceptance.md](docs/acceptance.md) as the current verification authority.** It separates completed model/asset evidence from browser, responsive, production-build, and clean-extraction checks. An item marked **Unverified** has not been claimed as a pass. No unmeasured Lighthouse score, device frame rate, or physical-phone result is implied.

## Sources and licenses

Original source code is supplied under the [MIT license](LICENSE). Packaged fonts and third-party software retain their own terms. Generated images have a separate provenance record; no exclusive-rights or public-domain claim is made for them. See [sources and licenses](docs/sources-and-licenses.md) for the actual notices, reference material, and dependency versions inspected for this delivery.
