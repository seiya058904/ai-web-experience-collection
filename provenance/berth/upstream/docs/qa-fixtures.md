# BERTH — Controlled browser-fault fixtures

These fixtures exercise specific failure paths in the **unchanged production application**. They use browser CSP or explicit JavaScript API fault injection. They are not native operating-system permission tests, real network outages, physical-device emulation, or substitute application bundles.

**Execution status:** this document prepares the scenarios for subsequent browser inspection. No browser scenario is marked passed here; actual observations belong in the final verification report.

## Prepare and serve

Run from the project folder:

```sh
npm run build
node scripts/prepare-qa.mjs
npm run preview
```

The generator reads `dist/index.html`, then creates these sibling pages:

| Fixture | Typical preview address | Injected condition |
| --- | --- | --- |
| Images unavailable | `http://127.0.0.1:4173/qa/fail-images.html` | An early CSP meta tag sets `img-src 'none'`. |
| Web fonts unavailable | `http://127.0.0.1:4173/qa/fail-fonts.html` | An early CSP meta tag sets `font-src 'none'`. |
| Storage and clipboard unavailable | `http://127.0.0.1:4173/qa/fail-storage-clipboard.html` | An early inline script makes the `window.localStorage` getter throw `SecurityError` and makes `navigator.clipboard.writeText()` reject with `NotAllowedError`. |

Use the actual host and port printed by the preview server if they differ. The normal application remains at `/`; the viewport harness remains at `/qa/viewport.html`.

A subsequent Vite build replaces `dist/`, so **rerun the generator after each build**. `Preview-BERTH.cmd` also performs a build; for these scenarios, use the command sequence above or regenerate the fixtures after that build. The generator is deliberately not a package-script hook and does not alter the normal application entry.

## What the generator changes

Each fixture starts from the current production HTML and inserts its controlled condition into the head, before resource preloads and the production module. A `<base href="../">` makes the original relative bundle, stylesheet, favicon, image, and manifest URLs resolve against the production root.

The original compiled JavaScript and stylesheet tags remain unchanged. `dist/index.html`, the application bundle, stylesheet contents, and scene assets are not rewritten. There is no visible test banner, synthetic error UI, replacement story, forced success message, or patched application result. The application itself must react to the imposed condition.

The storage fixture does not read, overwrite, or delete existing stored choices. It denies access only in that document. Its clipboard implementation does not touch the system clipboard. Returning to the normal page or reloading a normal URL removes these document-local substitutions.

## Inspect the real failure paths

### Images denied

The browser policy blocks image requests, including image fallback attempts and embedded data-image previews. This is a deliberately severe image failure, not a slower connection or a simulated HTTP status code.

Inspect whether each relevant chapter retains its English story, an understandable scene description, and usable controls. Check the first view, light comparison, input chapter, morning, and ending. A CSP violation in the console is expected evidence of the imposed condition; it is not by itself evidence that the application recovered successfully.

### Fonts denied

The browser policy blocks downloaded font resources. Native system font fallbacks can still render the text, and images and the production module remain permitted.

Inspect headings, longest text, controls, notes, and mobile-width layouts for clipping or unreadable fallback typography. This scenario establishes behavior under a blocked web-font resource; it does not reproduce every platform's installed font set or font rasterisation.

### Storage and clipboard denied

Both API failures are installed before the production module runs. The storage helper should therefore handle a failed initial read as well as later save attempts. A chosen or edited line should still work for the current visit, with truthful feedback that it could not be saved for later.

Inspect explicit Save, a preset, Undo, and Reset. Use Copy beside the Chapter 9 cards and again beside the ending cards. A rejected copy must produce a local explanation and selectable manual-copy text in the same notes component, without moving focus to a distant chapter. The script does not manufacture this fallback; the production interaction code is responsible for it.

Because this fixture substitutes browser APIs, it does **not** establish behavior under a real system clipboard permission dialog, storage quota exhaustion, private browsing policy, or managed-browser policy. Those are separate environments.

## Recording results

For each actual run, record the exact fixture URL, browser, CSS viewport, selected motion mode, interaction sequence, visible outcome, and any screenshot or console evidence. Start each scenario by navigating explicitly to its fixture URL. Do not treat an unmodified page as a fault fixture after navigating away.

If the fixture setup itself reports an error, the intended condition has not been established and the scenario cannot be recorded as a successful fault test. Compare with the normal production page when interpreting a symptom.

The generator's successful exit means only that the fixture files were prepared. It does not certify browser recovery, visual quality, input usability, or accessibility. Those observations must be collected separately.
