# IMAGO — independent archive reproduction

## Result and scope

The final application runtime was packaged, extracted into a separate directory with no dependency directory, installed from its lockfile, tested, rebuilt, and served as production files. All **266 runtime, source, configuration, launcher, helper, test, and production files** matched the candidate's SHA-256 manifest after rebuilding. The production output contains **130 files totaling 3,817,352 bytes**.

The tested runtime includes the final Chapter 8 safe-area correction and the corrected QA cache-description wording. Final documentation and evidence are assembled afterward. Final packaging extracts the delivery ZIP again and compares its runtime against this same tested manifest; documentation changes do not substitute for a runtime match.

This is a Linux/Chrome reproduction, not an execution of the Windows launchers or every environment permitted by the declared Node minimum.

## Actual sequence

| Step | Action performed | Recorded result |
| --- | --- | --- |
| Package | Create `IMAGO-runtime-candidate.zip` from an explicit file allowlist, with one `IMAGO/` root. | ZIP CRC integrity passed; no `node_modules`, original PNG scratch exports, browser profile, or unrelated project was included. |
| Extract | Extract into a fresh independent directory. | Complete candidate contents were available without referencing the working project's dependencies. |
| Install | Run `npm ci` in the extracted `IMAGO` directory. | Exit 0; 22 packages installed. |
| Test | Run `npm test` in that directory. | 31 tests passed; zero failures, cancellations, skips, or TODOs. |
| Build | Run `npm run build` in that directory. | TypeScript checking and Vite 8.3.6 production compilation succeeded. |
| Compare | Hash every file in the candidate runtime manifest, including rebuilt `dist/`. | 266 checked; zero mismatches. |
| Serve | Copy the independently rebuilt `dist/` into the managed static production preview, at `/` and `/nested/`. | Both returned the IMAGO application. The preview was local to the work environment; it was not a public deployment. |
| Root path | Exercise the production app at 1440×900 and 390×844 CSS viewports. | Each completed 55 settled DOM checkpoints: ten chapter anchors and nine transitions at five positions. |
| Subpath | Visit all ten chapters using the real menu under `/nested/`. | Correct chapter hashes and active chapters; fonts loaded; no sampled horizontal overflow. Script, stylesheet, and art URLs retained the subpath. |
| Departure | Use Watch it leave, wait for the final state, reset, then use Look again. | The empty shell remained, the supported resting image returned, and the page settled at CH01 / scrollY 0 with focus on the Hero heading. |

The managed preview used the same relative production assets shipped in the archive. `npm run preview` is the supplied local Vite command for users; the work environment's managed static service was the server actually used for the browser reproduction. No hosting account, deployment, Git push, PR, or Release was created.

## Evidence

- [Candidate runtime manifest](../evidence/g6-candidate.json)
- [Install log](../evidence/g6-npm-ci.txt), [test log](../evidence/g6-unit-tests.txt), and [production build log](../evidence/g6-production-build.txt)
- [Rebuild hash comparison](../evidence/g6-rebuild-comparison.json)
- [1440×900 matrix](../evidence/g6-desktop.json) and [390×844 matrix](../evidence/g6-phone.json)
- [Subpath, resources, departure, and return observations](../evidence/g6-subpath.json)
- [Desktop screenshot](../evidence/hero-desktop-delivery.jpg) and [phone-sized screenshot](../evidence/hero-390x844-delivery.jpg)

Both final matrices have zero recorded geometry failures, wait timeouts, pending or failed visible images, horizontal overflow, semantic overflow, or recovered-image checkpoints. They follow **54/54 successful image-cache preparation requests**, so they are warm-cache observations. The subpath console sample contains no first-party error entry in the recorded final interval. These results are bounded samples, not a guarantee about every possible action or network condition.

The separately retained earlier candidate, failure records, image fallback/retry, and isolated long-jump timeout are explained in [verification.md](verification.md). The final runs do not erase them or establish their causes.

## Environment and practical limits

The reproduction used Node **v24.22.1**, npm **11.9**, and cloud Chrome **156** on Linux, with DPR 1. The declared minimum remains Node **22.12**. Minimum-version execution, physical Windows/Android devices, other browsers, true 4K hardware, actual 125%/150%/200% browser zoom, controlled network/CPU throttling, operating-system reduced-motion changes, and long-session memory/FPS measurements were not performed.

The source ZIP includes the local artwork, responsive derivatives, exact prompt sidecars, fonts in the production build, source code, pinned dependency files, licenses, Windows launchers, tests, and evidence. A first dependency installation needs access to the package registry or an adequate package cache. The running website itself requires no account, API key, telemetry service, database, or external font server.
