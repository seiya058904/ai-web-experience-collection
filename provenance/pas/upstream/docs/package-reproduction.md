# PAS — candidate package reproduction

**G6 result: passed for candidate source/runtime verification on 9 November 2026.** The final delivery ZIP is assembled after the remaining documentation is complete. This record does not claim final-package browser or visual acceptance.

## Environment and commands

The verification used Node **v24.22.1** and npm **11.9.0** on the Linux environment recorded in `package-reproduction.json`. It began with a new `pas-verify/pas` directory extracted from the candidate ZIP, without dependencies or existing build output.

| Command | Result |
| --- | --- |
| `npm ci` | Exit 0; 29 packages installed from the lockfile |
| `npm run build` | Exit 0; TypeScript and Vite production build passed |
| `npm test` | Exit 0; all 18 motion tests passed |
| `npm run build` after the footer-overlap CSS repair | Exit 0 |
| `npm run build` after the fallback notice/mobile image repair | Exit 0 |
| `npm run build` after the wide-viewport heading maximum repair | Exit 0 |
| `npm run build` after cold hash-entry restoration | Exit 0 |

After the first extraction, root supplied four browser-discovered frontend repairs: the expanded chapter controls needed room above the footer; the whole-sequence failure notice/mobile fallback image needed to preserve the dancers' feet; the chapter heading maximum needed to decrease from 64px to 60px to fit the reading column on wide screens; and cold hash entry needed one post-load restoration of its captured narrative target, canceled by user input, history navigation or accepted review navigation. The exact refreshed `main.ts` and `style.css` are included in both the extracted tree and candidate ZIP. All **21 runtime/test source files** match the current project. The motion sources, tests, package manifests and lockfile remained unchanged; motion tests were not repeated for these frontend-only repairs.

## Archive and media checks

The candidate contains **4,955 files** and is **138,005,815 bytes**. ZIP integrity and every extracted-file hash passed. The latest production build copied all **4,819 public assets byte for byte**.

- 2,001 wide frames and 2,001 narrow frames.
- 153 Echo frames per layout.
- 153 foot details and 218 hand details on the same 0.005 progress grid.
- 100 chapter-still aliases and 20 small chapter posters.
- Eight original reference PNGs and eight generated web assets.
- 15 font-reference files, 37 model-source files, eight license files, model binaries, notices and documentation.
- Eight locally bundled WOFF/WOFF2 files in the production build.

The render manifest reports `complete`. Every required numbered frame exists and is nonempty. **No `.part` files were found in the extracted source or production output.** Dependencies, build directories, offline exports, temporary files and runtime private metadata were excluded from the source ZIP.

Candidate SHA-256:

`e055d07400fc93504fc4ece44c5b48dc030a6e79c238b7041dc5ec0ede43b28b`

Verified `main.ts` SHA-256:

`5434b5b5042606aa2d4f49f7163ab764947c4d31ce98fda231cf71850b28f61d`

Verified stylesheet SHA-256:

`ea9fbacc883f80202ea81214ab49f11e3911f9dcdd5d4ba878d2689f6ba0cd62`

## Scope and next check

The detailed JSON retains exact commands, outputs, exit codes, timings, per-file runtime hashes and media counts. The install used the configured npm environment and its available cache; an empty-cache or disconnected install was not tested. Windows launcher execution and browser/subpath acceptance of the extracted output are separate checks owned by root.

The candidate ZIP predates this report and may predate later documentation-only additions. Its hash identifies the tested candidate, not the final delivery ZIP. The latest rebuilt production output is `/workspace/scratch/cc67f8e5a801/pas-verify/pas/dist`.
