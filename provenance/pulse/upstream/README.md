# PULSE

## An atlas of one heartbeat

**PULSE is an English-language, illustrated journey through the healthy human heart.** Eleven complete chapters connect its structure, electrical sequence, valves, pulmonary circulation and systemic circulation. Sculptural generated artwork is paired with original, selectable SVG diagrams and concise, source-linked explanations.

The exhibition is intended for curious non-specialists. It does not measure a visitor's heart, display health metrics or offer a personal health assessment. Its images are authored reconstructions, not patient scans or clinically validated anatomical models.

## Open the experience

### Ready-to-open offline edition

Open **`preview/pulse.html`** directly in a modern browser. This self-contained edition embeds the application, fonts and production artwork; no installation or local web server is needed. The story and interactions work offline. Following an external scientific source link naturally requires an internet connection.

The editable source remains the primary project. The commands below rebuild it, and `npm run build:offline` regenerates the single-file edition after changes.

### Build from source — Windows PowerShell

Install Node.js **24 or later**, then open PowerShell in the extracted folder containing `package.json`. The build environment reports Node.js **24.22.1**. Dependency installation needs access to the npm registry; the running site does not require an API key or paid service.

```powershell
node --version
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

Open the local address printed by Vite, normally **http://127.0.0.1:4173**. Keep the terminal open while using the preview. Press `Ctrl+C` to stop it. If the default port is occupied, use the actual URL printed in the terminal.

For development with automatic refresh:

```powershell
npm run dev -- --host 127.0.0.1
```

The development address is normally **http://127.0.0.1:5173**. To regenerate the portable offline file:

```powershell
npm run build:offline
Start-Process .\preview\pulse.html
```

### Build from source — macOS or Linux

From the folder containing `package.json`:

```bash
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

Use `npm run dev -- --host 127.0.0.1` for development and `npm run build:offline` to generate the portable edition. The ordinary Vite output is in `dist/`; serve that directory through a local web server. For a direct `file://` opening, use the dedicated `preview/pulse.html` edition.

## What is included

| Chapter | What it explains | Interaction |
| --- | --- | --- |
| 01 — The Living Form | Organ shape, muscular wall and orientation | Anatomical right / left |
| 02 — Four Chambers | Receiving atria, pumping ventricles and septa | Select a chamber |
| 03 — The Signal | SA node, atrial activation, AV delay and ventricular conduction | Electrical sequence / blood pathway / both |
| 04 — The Return | Body return through the venae cavae and tricuspid valve | Follow the return landmarks |
| 05 — One-Way Gates | Atrioventricular and outflow valve families | Compare valve families |
| 06 — Toward the Lungs | Right ventricular outflow into pulmonary arterial branches | Highlight either lung branch |
| 07 — Exchange | Gas diffusion across an intact alveolar-capillary barrier | Oxygen / carbon dioxide / both |
| 08 — The Way Back | Pulmonary venous return to the left atrium | Compare body and lung returns |
| 09 — The Stronger Wall | Ventricular wall difference and separate aortic outlet | Compare walls and outflow |
| 10 — Around the Body | Systemic distribution, tissue capillaries and venous return | Arterial / venous / both |
| 11 — Beat Again | Two circuits and the distinct electrical process | Revisit either explanatory layer |

Each chapter contains two substantive observations. Ten authored transition sections retain named anatomical anchors. Reading holds stay in normal document flow; there is no introductory scroll lock.

## Controls and reading alternatives

- **Chapters** opens the chapter menu. Chapter links, hashes, reverse scrolling and browser history return to meaningful document positions.
- **About this experience** explains the anatomy conventions, sources, sound and still-view option.
- **Motion: On / Motion: Reduced** changes motion treatment. The system reduced-motion preference is respected until an explicit local choice is made. The choice is stored locally when browser storage is available.
- **Sound: Off / Sound: On** enables or immediately mutes a quiet, original Web Audio sound illustration. Sound starts off and pauses when the page is hidden. It is not a recorded or measured heartbeat.
- Each diagram has keyboard-operable selection buttons, a reset action, a textual result and a **Read the diagram** disclosure. Signal/flow chapters also provide **Show legend**.
- Dialogs support `Escape` and return focus to their opener. Native Tab, Enter, Space, Page and arrow-key navigation remain available.
- The static HTML includes the full narrative, diagram alternatives, chapter index and source list. With JavaScript unavailable, that reading path remains present while script-dependent controls are hidden.
- Print styles retain the reading content while removing transient navigation and transition controls. Browser print output is a convenience, not a separately typeset publication.

All meaningful text is real English HTML or accessible SVG. Artwork is never used to hold the titles or labels. The site does not require WebGL.

## Scientific and visual conventions

Heart plates use an anterior cutaway convention: the person's anatomical right appears on your left. Posterior connections are exposed schematically where needed. Arteries carry blood away from the heart and veins return it; oxygen content does not define their names. Slate blue is a diagram convention, while oxygen-poor blood is dark red.

Electrical activation and blood transport use different visual marks and retain different timescales. Scroll position controls a reading sequence. It does not claim that a blood cell completes a body-wide circuit in one heartbeat.

The source review is dated **November 9, 2026**. See [research notes](docs/research-notes.md), the on-page source list and [known limitations](docs/known-limitations.md). No independent clinical endorsement is claimed.

## Stack and structure

| Component | Pinned version / purpose |
| --- | --- |
| Vite | 8.3.6 — local development and static production build |
| TypeScript | 7.0.2 — typed content, rendering and interaction logic |
| Lenis | 1.3.27 — one coordinated scrolling instance |
| GSAP / ScrollTrigger | 3.15.1 — shared ticker and scroll lifecycle |
| Cormorant Garamond | Fontsource 5.3.0 — exhibition titles |
| DM Sans | Fontsource 5.3.0 — prose, labels and controls |

`package-lock.json` records the dependency resolution. Fonts are bundled locally. There is no application server, login, analytics, database, external image CDN or runtime AI service.

| Path | Responsibility |
| --- | --- |
| `src/content.ts` | Eleven chapters, 22 observations, interaction outcomes and sources |
| `src/render.ts` | Semantic HTML and the complete static reading path |
| `src/diagrams.ts`, `src/diagrams.css` | Original anatomical SVGs, labels and diagram states |
| `src/story.ts` | Pure chapter/transition state evaluation and ten transition specifications |
| `src/main.ts` | Scrolling, navigation, dialogs, controls, image recovery and optional audio |
| `src/styles.css` | Editorial layout, responsive behavior, reduced motion and print styles |
| `public/art/` | Responsive production WebP assets |
| `docs/art/` | Eight separately inspectable generation outcomes |
| `docs/asset-provenance.json` | Exact generation prompts, references and returned dimensions |
| `scripts/` | Static rendering, locale check and portable build helpers |
| `tests/` | Content, story-state, media recovery and browser review checks |
| `source-manifest.json` | SHA-256 and byte size of packaged files |

The scroll state is derived from a deterministic evaluator. One GSAP ticker calls one Lenis instance; Lenis `autoRaf` is disabled. Diagrams and transition layers share the same evaluated progress. Every image owns its readiness and retry token, preventing a late image from replacing another chapter's identity.

## Verification and evidence

Run the automated checks locally:

```bash
npm test
npm run check:locale
npm run build
```

Or run the combined gate:

```bash
npm run check
```

Automated checks cover content completeness, references and deterministic transition behavior. They are only part of acceptance. Browser interactions, failure probes, layout captures and rebuild evidence are recorded separately:

- [Acceptance results](docs/acceptance.md)
- [Evidence index](evidence/index.md)
- [Transition contracts](docs/transition-contracts.md)
- [Test plan](docs/test-plan.md)
- [Known limitations](docs/known-limitations.md)
- [Visual bible](VISUAL-BIBLE.md)
- [Asset selection](docs/asset-selection.md)
- [Reproducible browser review](docs/review-workflow.md)

Use the recorded results and conditions rather than inferring a browser PASS from a successful build. CSS viewport emulation is not evidence of testing a physical phone or 4K monitor. No FPS guarantee, live performance score or formal accessibility conformance is claimed.

## Rebuild after extraction

Extract the source archive into a fresh folder, run `npm ci`, `npm run check`, and `npm run preview -- --host 127.0.0.1`. Verify the opening, Exchange, and Beat Again chapters, including their images and controls. `npm run build:offline` regenerates the standalone HTML from the same source. The acceptance record documents the extraction/rebuild actually performed for this delivery.

The archive excludes `node_modules`, credentials, browser profiles and dependency caches. A fresh dependency installation is expected for source development. The portable preview can be opened without it.

## Rights and release boundary

See [ATTRIBUTION.md](ATTRIBUTION.md) for the original-source license, generated-art provenance and third-party licenses. GSAP uses its own Standard “No Charge” license; it is not MIT. The fonts retain their SIL Open Font License terms.

This is a local source delivery. No deployment, publication, Git push, pull request, release or change to an existing collection is authorized by this package.
