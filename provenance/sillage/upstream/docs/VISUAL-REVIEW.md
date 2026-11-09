# SILLAGE — Independent visual finishing review

Review date: 9 November 2026  
Scope: read-only source review and inspection of supplied, actual production-browser captures. The reviewer did not operate a separate browser or modify application code.

## 1. Disposition — SHIP for the reviewed visual and source gate

The final captures clear the remaining mobile TR-09 collision. The three phase artworks now have distinct rows, their labels remain readable, and the user title begins beneath the gallery without compressing it.

The final targeted recheck inspected:

- [390px final handoff](evidence/final-mobile-tr09-p100.jpg), with its [DOM observations](evidence/final-mobile-tr09-p100.json).
- [320px long-title gallery](evidence/final-320-long-title-bridge.jpg), with its [DOM observations](evidence/final-320-long-title-bridge.json).
- [320px long-title action area](evidence/final-320-long-title-bridge-action.jpg), with its [DOM observations](evidence/final-320-long-title-bridge-action.json).

The action-area capture confirms that the complete long title, current shares, continuation link and final caption remain accessible in normal document flow. **No further source correction is required from this review.**

This disposition covers the inspected source and rendered evidence. Continuous interaction, keyboard operation, export, resource-failure behaviour, native browser zoom and final-package acceptance have separate records. This is not a claim of complete runtime acceptance.

## 2. Concrete findings, corrections and rechecks

| Severity and status | Source and actual evidence | Finding and outcome |
| --- | --- | --- |
| Medium — resolved | [Image sizing](../src/style.css); CH-02 [desktop](evidence/final-desktop-ch02.jpg) / [mobile](evidence/final-mobile-ch02.jpg), CH-04 [desktop](evidence/final-desktop-ch04.jpg) / [mobile](evidence/final-mobile-ch04.jpg), CH-07 [desktop](evidence/final-desktop-ch07.jpg) / [mobile](evidence/final-mobile-ch07.jpg) | The image-height correction restores the intended compositions. CH-02 shows the material junction, CH-04 shows the complete chord, and CH-07 shows recognisable memory photographs. The earlier tall crops are superseded. |
| Medium — resolved | [Transition implementation](../src/transitions.ts), [bridge layout](../src/bridge-controls.css); mobile TR-08 at [75%](evidence/final-mobile-tr08-p075.jpg) and [100%](evidence/final-mobile-tr08-p100.jpg) | The bridge now contains real, readable share controls. Arrival and Trace remain small references above the dominant Unfolding phase, while the controls occupy their own row. No artwork/control collision was observed in these captures. |
| Medium — resolved in the final patch | [Bridge layout](../src/bridge-controls.css); the three final TR-09 recheck captures listed in Section 1 | The previous 320px layout placed phase labels inside neighbouring artworks and brought Trace into the title area. The non-shrinking gallery and normal document flow now separate all three phases, labels and title. The default 390px case is also clear. |
| No defect observed | [844 × 390 bridge](evidence/matrix-844x390-bridge.jpg) and [DOM observations](evidence/matrix-844x390-bridge.json) | The short landscape bridge continues below the viewport in document flow. Content below the fold is not clipping. The recorded geometry reports no horizontal or visible-text overflow. |
| No defect observed | [320 × 700 long-title ending](evidence/matrix-320x700-long-ending.jpg) and [DOM observations](evidence/matrix-320x700-long-ending.json), plus the final long-title bridge/action captures | The long user title is preserved and wraps. It increases page height, with artwork or actions farther down the page. No truncation or unreadable font reduction is needed. |

The replacement TR-09 JSON records no broken HTML images, horizontal overflow or visible-text overflow candidates. The screenshots also establish that the phase labels no longer intersect the artwork or title. The earlier geometry checks alone had not detected that visual collision.

The photographic correction was also checked at the memory transition midpoints: TR-06 [desktop](evidence/final-desktop-tr06-p050.jpg) / [mobile](evidence/final-mobile-tr06-p050.jpg), and TR-07 [desktop](evidence/final-desktop-tr07-p050.jpg) / [mobile](evidence/final-mobile-tr07-p050.jpg). The central composition remains clear and the memory fragments have appropriate proportions.

## 3. Comparison against the brief

The inspected implementation retains the pinned art direction: warm ivory, the three material colours, matte surfaces, the recurring irregular opening and calm editorial typography. The mobile photographic chapters and portrait panorama preserve subject identity through a rearrangement of the composition.

The requested relationship between viewing and editing is legible in the late sequence:

- **TR-08 to CH-09:** the main phase remains visible while real share controls enter, with the other phases retained as references.
- **TR-09 to CH-10:** the current composition becomes a three-phase path, followed by the user's title, shares and continuation action.
- **Long titles:** user text remains intact and extends the page naturally.
- **Short landscape:** the workbench remains part of the scrollable document.

For the G4 record, the two selected weak chapters were **CH-02 and CH-04**. Their substantive crop defects have been corrected and verified in actual desktop and mobile frames. CH-07 was checked as a regression of the same image-sizing correction and also passes.

The earlier weakest handoff was **TR-08 to CH-09**. Its missing real controls and composition balance have been corrected. The final review then found **TR-09 to CH-10 on narrow screens** to be the remaining weak point. The final patch and replacement captures resolve it. This review finds no reason to reopen the art direction or invent another defect to keep a weakest item outstanding.

The [mobile chapter contact sheet](evidence/final-contact-mobile-chapters.jpg) provides a comparative view of the ten chapters; individual captures remain the evidence for detailed layout findings.

## 4. Evidence limits

The authoritative evidence bundle contains all **90 transition crops**. The reviewer checked the focused chapter, midpoint, late-bridge and edge-case frames individually, and reviewed the mobile chapter contact sheet. This does not mean that every capture in the complete evidence bundle was independently inspected at full size.

The reviewed responsive captures are real browser renders within recorded CSS-size iframes. They are not evidence from physical phones, Safari or native 4K hardware. Individual crops preserve the observed screenshot pixels; contact sheets scale them for comparison. Some captured fixture bars belong to the surrounding QA presentation. Matching JSON distinguishes the requested CSS viewport, document client size and recorded iframe rectangle.

### Near-end progress is distinct from the exact endpoint

| Capture | Recorded TR-09 progress | Observed caption |
| --- | ---: | --- |
| [390px file named `final-mobile-tr09-p100`](evidence/final-mobile-tr09-p100.json) | 0.9991 | Your version opens into a complete path. |
| [320px long-title gallery](evidence/final-320-long-title-bridge.json) | 0.9950 | Your version opens into a complete path. |
| [320px long-title action area](evidence/final-320-long-title-bridge-action.json) | 1.0000 | A title, a balance, a trace to keep. |

The first two records are near-end frames despite the nominal endpoint filename. The separate action-area record reaches the exact endpoint and shows the final caption and accessible action. Acceptance summaries should preserve this distinction.

### Offscreen image caveat

The four reviewed TR-06/TR-07 midpoint JSON files list an offscreen Hero image as broken even though their visible midpoint imagery is correct:

- [Desktop TR-06 midpoint observations](evidence/final-desktop-tr06-p050.json).
- [Mobile TR-06 midpoint observations](evidence/final-mobile-tr06-p050.json).
- [Desktop TR-07 midpoint observations](evidence/final-desktop-tr07-p050.json).
- [Mobile TR-07 midpoint observations](evidence/final-mobile-tr07-p050.json).

The listed resource is `hero-desktop.webp` or `hero-mobile-640.webp`. This was reported to the implementation owner. These records should not be described as proving that every asset loaded. It does not invalidate the observed layout of the visible midpoint scenes.

Static frames establish composition and legibility. They do not establish continuous scroll quality, reverse interaction, keyboard behaviour, download-to-disk success, native browser zoom or performance. Those conclusions require the separate runtime observations. This review makes no native-zoom or full end-to-end acceptance claim.

## 5. Required corrections and finalisation

**No source or visual-layout corrections remain from this review.**

Finalisation requirements are:

1. Use the replacement TR-09 captures and matching JSON as the current evidence.
2. Treat the earlier overlapping TR-09 frames as superseded.
3. Ensure the delivered build and source ZIP include the final `bridge-controls.css` patch. An earlier candidate's hashes describe that earlier source snapshot.
4. Keep the evidence limitations above explicit, particularly near-end versus exact-end progress, the offscreen Hero observations and unverified native zoom.

The reviewed visual and source gate is clear. Application code remains frozen from this reviewer.
