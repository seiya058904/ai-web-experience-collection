# Independent motion review addendum

Review date: 2026-11-09. Reviewer: the art/composition agent, independently of the capture runner. This is a visual review of actual retained browser frames. A runner status of `CAPTURED` establishes that recording finished; it is not an aesthetic or continuity pass.

## Scope and method

The complete empty-inventory review covers TR04, TR05, TR07 and TR10 in both directions at both requested speeds, on desktop 1440 × 900 and emulated phone 390 × 844. All **32 sequences, 79 consecutive contact sheets and 1,261 retained frames** were inspected. Full-resolution source JPEGs were additionally opened where a small subject, boundary or text needed closer inspection.

The source manifests are [remaining-boundaries contacts](evidence/local-remaining-boundaries-contacts.json) and [remaining-boundaries run](evidence/local-remaining-boundaries-continuity-2026-11-09T08-58-43-575Z.json). Each contact sheet lists consecutive retained frames with their real compositor elapsed times. Its manifest identifies every full-resolution source. The raw sequence JSON contains native scroll positions, requested scroll duration, observed animation-frame samples and capture timestamps.

The browser was headless Chromium 153.0.8010.0 with CPU rendering, production assets over loopback, and device scale factor 1. Desktop used `isMobile:false, hasTouch:false`; phone used `isMobile:true, hasTouch:true`. This is browser emulation, not a physical Android or iOS test. The runner requested 2,400 ms slow and 650 ms fast scrolls and retained every second compositor frame. Capture overhead and observed intervals vary. This review makes no 60 fps, fixed-rate video, native browser zoom, network-throttling or real-device claim.

The empty-inventory set was recorded against `index-DELhVtXL.js` / `index-7hykGXpd.css`. The later collected set used `index-Bc_ZO-w8.js` / `index-B82G5Cib.css`; the intervening change was the failed-art reading shade, which does not change the normal-art motion inspected here.

## Complete empty-inventory coverage

The four count columns below are numbers of actual retained frames, not requested or synthesized frames. All four speed/direction sequences in every row were visually inspected in full on the consecutive contact sheets.

| Profile | Boundary | Slow forward | Slow reverse | Fast forward | Fast reverse | Total |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | TR04, roof to market | 48 | 44 | 18 | 13 | 123 |
| Desktop | TR05, market to wind | 39 | 38 | 18 | 16 | 111 |
| Desktop | TR07, valley to bridge | 50 | 43 | 18 | 13 | 124 |
| Desktop | TR10, sunrise to ending | 44 | 43 | 25 | 17 | 129 |
| Phone | TR04, roof to market | 73 | 73 | 21 | 21 | 188 |
| Phone | TR05, market to wind | 69 | 75 | 24 | 24 | 192 |
| Phone | TR07, valley to bridge | 73 | 73 | 21 | 21 | 188 |
| Phone | TR10, sunrise to ending | 75 | 75 | 28 | 28 | 206 |
| **Both** | **32 sequences** | **471** | **464** | **173** | **153** | **1,261** |

Evidence filename pattern: `evidence/local-remaining-boundaries-{desktop|mobile}-tr{04|05|07|10}-{slow|fast}-{forward|reverse}-contact-NN.jpg`. Corresponding `.json`, `.webp` and `-frames/NNNN.jpg` files retain the exact run and source frames. Every retained frame is on the contact sheets; this does not mean every compositor frame was captured. Packaging may omit redundant raw frame folders when their complete animation, timing JSON and contact sheets are preserved. The linked close-up evidence below is also retained as byte-identical standalone JPEGs outside those folders.

### Observed normal-art behavior

| Boundary | Independent visual finding |
| --- | --- |
| TR04 | The navy canopy edge remains opaque while market art replaces the rooftops. Its scalloped edge, red line and thickness remain visible. The moving edge hides the character change; no simultaneous duplicate Mira was found. Forward and reverse expose the same paper layers without a blank stage. Phone title and paragraph remain clear. |
| TR05 | The diagonal banner remains solid and its red line/fiber details survive at full resolution. The location and puppet handoff happen behind the edge. No double puppet or picture dissolving through the banner was seen. The uncollected clips contain no carried A, so they do not prove fragment ownership. A phone wind-control contrast weakness is recorded below. |
| TR07 | The rising curved terrain edge replaces the valley with the bridge and covers the old character before the new pose appears. No floating second arch, transparent art ghost or blank stage was seen in this empty-inventory scope. No A/B/C carrier was present, so this set does not prove three-piece continuity. |
| TR10 | The same stitched disc stays seated over the same city while lighting and captions change. There is no extra sun, radius jump or disc/lead overlap in the inspected normal-art frames. Phone ending prose/actions have a navy backing below the disc, and the amber window remains visible. |

Selected full-resolution checks include desktop TR04 slow-forward frame0025, TR05 frame0020, TR07 frame0025 and TR10 frame0031; phone TR04 frames0040/0072, TR05 frames0036/0038 and TR10 frame0048. The latter is [the phone ending during actual movement](evidence/local-motion-ending-review.jpg).

These are authored 2.5D paper joins. They do not establish a continuously reconstructed 3D camera or a deforming shared mesh. Caption opacity is a text treatment; it is not credited as proof of physical art continuity.

## Collected-state diagnostic: ownership still requires correction

The empty-inventory coverage exposed an evidence gap. A separate run therefore used real visible UI actions to repair the market, steady the wheel, lift the shade and place A/B/C at the worktable. Storage was read to assert the result, not seeded. The setup is visible in [desktop completed table](evidence/local-collected-continuity-desktop-collected-table.jpg) and [phone completed table](evidence/local-collected-continuity-mobile-collected-table.jpg), both showing the assembled disc, three removal controls and 3/3 inventory. Lift was not clicked during setup.

Sources: [collected run](evidence/local-collected-continuity-continuity-2026-11-09T09-07-02-048Z.json) and [collected contact manifest](evidence/local-collected-continuity-contacts.json).

The diagnostic review inspected all four desktop TR05 sequences, desktop TR07 slow-forward and phone TR07 slow-forward: **6 complete sequences, 15 contact sheets and 221 retained frames**, plus full-resolution risk frames. The remaining collected clips were not credited as reviewed after these concrete failures were found. This set must not be described as a complete collected-state pass.

1. **TR05 carrier endpoint fade.** The carried A has the correct notched outline and no simultaneous duplicated A was found in the four desktop sequences. However, its temporary paper holder fades into and out of the shot. It does not remain a physically registered holder at the held hill endpoint. Full-resolution [frame0026](evidence/local-carrier-a-handoff-before.jpg) and [frame0034](evidence/local-carrier-a-destination-before.jpg), followed by the final contact sheet, show that behavior. The source's opacity envelope agrees with the visible fade. Correct shape identity alone is insufficient to close the brief's physical handoff requirement.
2. **TR07 duplicated source C.** [Desktop frame0019](evidence/local-carrier-duplicate-c-desktop-before.jpg) and [phone frame0020](evidence/local-carrier-duplicate-c-mobile-before.jpg) visibly show four gold objects: large C still under the valley arch, plus A/B/C in the incoming holder. This is a real ownership failure, not a screenshot timing inference.
3. **TR07 destination registration and gap.** [Desktop frame0038](evidence/local-carrier-floating-before.jpg) places the holder over foreground canyon layers below the bridge, detached from Mira. Phone slow-forward contact03 shows the temporary carrier fade around frames0060–0063 and the held bridge carrier return larger at frame0066. The existing fixed bridge holder and transition holder therefore need a single registered, opaque handoff. No corrected result is claimed yet.

These findings were sent to the root and geometry agents. Keep these pre-fix captures as historical evidence. Corrective retakes should test both profiles, both speeds and both directions with actual collected state, and inspect the source-C ownership moment plus the final carrier registration.

## Phone wind control contrast: corrected and independently retaken

The full-resolution [phone TR05 frame0038](evidence/local-wind-transition-controls-before.jpg) shows the small CH06 feedback crossing the pale rotor blade near y410, with “Reset scene” also over pale paper. The title and main paragraph remain readable; this finding concerns the smaller control/feedback layer. Root's dedicated before image is [wind controls before](evidence/local-wind-controls-before.jpg).

The correction adds narrow navy backing behind the primary action, reset and feedback without moving the rotor or main copy. The [final wind report](evidence/local-wind-readable-final-results.json), on `index-Cf4W_qji.js` / `index-C8PaC5EY.css`, records 20 measured passing states across 320 × 700, 360 × 640, 390 × 844 and 700 × 900, with zero page errors. This reviewer independently opened [390 × 844 TR05 at 75%](evidence/local-wind-readable-final-390x844-tr05-075.jpg) and [320 × 700 steadied wheel](evidence/local-wind-readable-final-320x700-steady.jpg) at full resolution. In both, primary/reset/feedback are clearly readable against the dark backing; the rotor, B when revealed, Mira and amber lamp remain visible. The original contrast finding is visually closed for these two samples. The other 18 report cases are measured scope, not an assertion of independent visual inspection here.

## Disposition

The complete empty-inventory review supports the opaque canopy/banner/terrain mechanics and the normal-art ending composition within the stated profiles and retained frames. It does not prove collected-fragment ownership. The collected diagnostics found a duplicated C and carrier fade/registration defects, so strict TR05/TR07 physical-continuity closure remains **pending corrective evidence**. The phone wind-control contrast finding is **closed by the two independently viewed final retakes** above.
