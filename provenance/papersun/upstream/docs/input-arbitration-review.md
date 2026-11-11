# Keyboard and hash arbitration — focused diagnosis

This is a diagnostic record, not a whole-site acceptance result. It was prompted by two real failures in the production recovery suite: Arrow Down occasionally failing immediately after Home during a wheel interruption, and a transition hash landing away from its specified midpoint after Page Up.

## Original-build probe

`scripts/qa-input-probe.mjs` observes real Playwright wheel, keyboard, history, resize and hash operations against the production preview. It records the original `window.scrollTo` calls and native events without changing their arguments or return behavior. The probe uses a fresh Chromium instance for each case and a loopback-only server on port 4195. The evidence is `docs/evidence/local-input-before-results.json`, with one actual final screenshot per case.

The tested browser is Chromium 153.0.8010.0 in the documented isolated CPU-rasterization environment. The viewport is 1440 × 900 except for the explicitly exercised 390 × 844 resize. No CPU or network throttling is applied.

### Home followed by Arrow Down

The probe performed wheel 650 → wait until scrollY > 250 → Home → wait until scrollY < 2 → Arrow Down, three times in fresh browsers. All three trials reached 40 CSS pixels after the first Arrow Down and 80 after a later second Arrow Down. This does **not** erase the recovery suite's earlier failure. It shows that the original bug is timing-dependent and was not reproduced in these three focused trials.

### Page Up followed by a direct transition hash

The probe reproduced the complete prior sequence: collect A at CH-05, travel to CH-07, Back/Forward, travel to CH-06, resize to phone and back, Page Down, Page Up, then navigate to `#tr-08-09@50`.

**FAIL — the requested midpoint is not retained.** The record establishes a competing native keyboard scroll after the application's explicit target:

| Recorded event | Scroll position / implication |
| --- | --- |
| Page Up keydown | y = 10070 |
| `popstate` for `#tr-08-09@50` | The app calls `window.scrollTo({top: 14259, behavior: 'instant'})`, the correct measured midpoint. |
| Next native scroll | y = 14391; the sampled transition is `8:0.6467`, already displaced. |
| Later native scroll events | The browser continues to y = 13612 while the hash remains `#tr-08-09@50`. The settled stage is CH-08, outside that transition. |

No subsequent application `window.scrollTo` appears during the downward-to-upward drift. The failure is therefore not explained by a wrong hash formula or a weakened test tolerance. A browser keyboard scroll remains active after the explicit navigation.

The installed Lenis source also returns early from `scrollTo` when the target equals its stored `targetScroll`. Consequently, a second resolver invocation cannot be assumed to cancel a newly competing native movement if Lenis still stores the previous desired target. The original keydown guard itself calls immediate `scrollTo(current)`, which writes native scroll state rather than merely retiring Lenis interpolation.

## Correction boundary

The implementation owner is unifying page-navigation keys with the authoritative scroll coordinator while preserving dialog controls, editable fields, native button activation and other non-page key semantics. A native-preserving alternative would need an explicit controller reset plus proven cancellation of in-flight browser scrolling on hash navigation; source plausibility alone is insufficient.

Retest the original two sequences unchanged after the correction. Also exercise Page Down/Page Up, Home/End, Arrow Up/Down, Space/Shift+Space on the reading surface, Space activation on a focused button, and dialog keyboard focus. The correction must not obtain a pass by increasing tolerances or adding a wait until a wrong hash happens to settle.

## Corrected-build retest

The original four diagnostic cases were repeated unchanged against the build containing `index-FgDiaD9V.js` and `index-DdfpWGC1.css`. An additional fifth case exercises page-key and button semantics. Actual evidence: `docs/evidence/local-input-after-results.json` and its five matching JPGs.

**PASS for the two reported arbitration defects and the additional stated key actions.** All three Home → Arrow Down cases reach 40 CSS pixels after the first arrow and 80 after a second arrow. The full history/resize/Page Up → hash case lands at the measured y = 14259, reports `8:0.5000`, and remains exactly there after a further 700 ms; no native drift follows it. No tolerance or assertion in the original sequence was relaxed.

The additional case asserts Space from the reading surface scrolls by 810 pixels in the 900-pixel viewport, Shift+Space returns to 0, Page Down/Page Up give the same forward/backward page step, End reaches CH-11 and Home returns to 0. Space on the focused Chapters button opens the dialog without scrolling; Escape closes it and restores focus to Chapters. All of these assertions passed.

The new application handler intentionally routes page-navigation keys through Lenis's immediate position update. These are real browser keyboard inputs with application-owned page scrolling, not a claim that Chromium's native smooth-key animation is still used. Dialogs, editable fields, modified shortcuts, custom-widget key semantics and Space activation on buttons/links are left to their normal handlers. Browser text search is a separate recovery-suite check and is not included in this focused PASS.
