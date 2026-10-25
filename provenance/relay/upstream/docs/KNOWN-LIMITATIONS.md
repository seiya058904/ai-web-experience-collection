# Known limitations and tested boundaries

## Explicit remaining visual stress finding

The optional 125%, 150% and 200% **forced inline font-size** tests report
overflow or intersections. These tests multiply computed font sizes and write
them directly into selected elements, overriding the responsive viewport and
`clamp()` rules without enlarging the surrounding layout. They are retained
as three noncritical FAIL records and screenshots. Arbitrary stylesheet
overrides are therefore not claimed to be supported.

This is separate from actual browser zoom. **Native Chrome browser zoom at
125%, 150% and 200% passed** after repairing the short-window layout. The
measured layout viewport, DPR, native interactions and compositor screenshots
are recorded in `NATIVE-BROWSER-REVIEW.md` and its machine-readable evidence.
Font-file failure and delayed font loading were also exercised separately.

## Browser and hardware coverage

- Actual browser execution used Chrome/Chromium 145.0.7632.6 on Linux x64,
  with headless viewport/touch emulation and a headed browser on Xvfb.
- The eight requested viewport sizes were rendered at their actual CSS sizes.
  This is not a claim of testing eight physical devices.
- Safari, Firefox, Windows graphics hardware, physical iOS/Android devices,
  assistive screen-reader applications and high-refresh physical displays
  were not tested.
- Keyboard and native-control accessibility, visible focus, touch emulation
  and `prefers-reduced-motion` were tested. This is not a formal accessibility
  certification.
- The short performance sample measures animation callbacks in the stated
  environment. It is not a Lighthouse, Web Vitals, physical-device FPS or
  battery benchmark.

The application expects a modern browser with ES modules, SVG, native
`dialog` and `popover`. Archivo and IBM Plex Mono are bundled locally. Chinese
and emoji entered by the viewer use available platform glyph fallbacks;
their appearance can differ between operating systems. The byte protocol and
UTF-8 reassembly remain independent of glyph appearance.

## Test harness boundaries

The connected Browser extension failed before navigation, so the explicitly
permitted Playwright path supplied the production matrix. The test harness
delivers the real, unmodified production files at an isolated origin. It does
not replace the simulation with mocks and uses actual UI controls to mutate
the round. `window.__RELAY__` exposes detached, read-only diagnostics.

The headless and Playwright-managed headed tab-switch attempts did not expose
native hidden-tab state because the automation framework emulates focus.
Those attempts remain marked NOT_TESTED in their original reports. A separate
ordinary Chrome test, without that emulation, **passed actual background
pause and return**, with the exact same simulation time and trace before and
after. The native test also observed real browser cache-hit events for the
production script, stylesheet and local fonts. Successful reloads alone were
never counted as cache evidence.

Request delay, font failure and module failure were controlled browser test
conditions, not a physical cellular-network field trial. The production
renderer uses native SVG/DOM, so WebGL context-loss testing is not applicable.

## Deliberate model boundaries

RELAY is an original, finite demonstration protocol. It does not implement
TCP, QUIC, BGP, real Internet path selection, cryptographic integrity,
production congestion control, persistent messaging or a remote recipient.
Its six-node transport graph, block acknowledgements, queue rules and time
budgets are public in `MODEL.md`.

Messages stay in browser memory. Reload begins the fixed seeded demonstration;
an explicit new round clears the previous round's state and history. Inputs
are limited to 120 UTF-8 bytes. For large block counts, tiny on-sculpture labels
are simplified; the native **Blocks** selector retains every block's complete
identity, byte interval, payload and status. The 24-block maximum was tested.

With JavaScript unavailable, the initial native sculpture and explanatory
content remain visible, but the simulation cannot run. No static illustration
is presented as proof of successful message delivery.
