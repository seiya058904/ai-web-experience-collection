# PAS — motion score and evaluation contract

## Authorship and scope

The choreography is original, authored as deterministic pose and footstep curves. No existing dance recording, motion-capture performance or animation clip is used. Anatomical mesh proportions come from the shipped MakeHuman-derived adult character shapes: Cen is 1.68 m tall; Cheng is 1.82 m tall. These dimensions describe the fictional character assets, not a biomechanical study or a professional dancer's validation.

The animation is kinematic. It preserves measured limb lengths, ground anchors and selected contact targets; it does not solve forces, friction or human balance. The optional floor marks identify authored sole contact. They are not pressure maps or centre-of-mass measurements.

## One time value

`evaluateDance(t, options)` is a pure query over `t = 0..10`. It owns no animation loop, scroll listener, playback timer or event history. The application supplies the same time to the scene and the DOM. A direct jump, reverse scroll and sequential playback therefore use the same pose evaluation.

- Chapter numbers in the returned object are zero-based.
- Chapter content occupies local `0..0.76`; the outgoing transition occupies `0.76..1`. The last chapter has no outgoing transition.
- `options.mode` is `unison` or `echo`. It changes poses only during `t = 4..4.76`.
- `options.layout` provides wide/narrow camera framing. It does not change identities or the choreography.
- `options.breath` is bounded to `[-1, 1]` and adds at most 1.6 mm of chest displacement. It does not move support feet or a held hand target. Passing zero removes this decorative movement.
- `comparePose('opening' | 'ending')` returns genuine opening/end states with no breathing.

## Character and coordinate contract

Positions are world-space metres. +Y is up, and the observer is on the +Z side. The neutral mesh faces +Z; its anatomical left side is model +X. The consistent connecting pair is **Cen's right hand and Cheng's left hand**. This pair is on the visible side during the opening contact.

Every returned `BodyPose` includes the pelvis, spine, chest, neck, head, head top, nose, bilateral shoulders/elbows/wrists/palms and hips/knees/ankles/toes. Palm centres are separate from wrists. Hand output includes orthonormal forward/normal directions and separate thumb, index, middle, ring and little-finger curl values. Each foot includes its world anchor, direction, swing phase and planted flag.

The renderer maps these targets onto the same anatomical models throughout the work, including hand detail views. There is no independent close-up hand asset to drift in identity or pose.

## Ten movements

| Movement | Selected observation positions | Action |
| --- | --- | --- |
| 01 Between | 0.08, 0.22, 0.68 | Cen offers; Cheng first notices, then raises a hand. The hands remain apart. |
| 02 Ground | 1.08, 1.38, 1.70 | The pair stands independently. Cen moves slightly over fixed feet, then settles. |
| 03 One Palm | 2.05, 2.36, 2.48 | The palms meet. A small directional change passes through Cen's forearm and Cheng's shoulder/elbow response. |
| 04 Counterweight | 3.04, 3.42, 3.90 | A grip is established before a modest outward lean. The pair returns to independent support before releasing it. |
| 05 Unison / Echo | 4.04, 4.28, 4.47, 4.76 | Both perform an independent lift–turn–return phrase. Echo changes the answer's timing while preserving both endpoints. |
| 06 Make Room | 5.06, 5.16, 5.76 | Cheng shortens and moves a step into depth, Cen passes, then Cheng continues. Their screen sides exchange through actual steps. |
| 07 Lower Together | 6.07, 6.50, 6.94 | Backs establish contact, descend together and rise. All four feet stay anchored. |
| 08 A Complete Phrase | 7.10, 7.24, 7.51, 7.98 | Backs release, the pair becomes parallel, Cheng passes a half-body distance while Cen waits, and the hands briefly reconnect. |
| 09 Let Go | 8.07, 8.30, 8.61 | The fingers release after independent support is present. Cen's small shoulder/arm movement receives Cheng's answer. |
| 10 Here, Again | 9.18, 9.70 | Real steps restore a comparable distance. The ending can be compared with the opening and revisited from either viewpoint. |

These are the actual UI observation steps exported by `src/content.ts`, which is also the source for chapter-still filenames. The motion module's older `CHAPTER_POSES` export remains a numerical review-sample list; the application does not use it to label or navigate moments. All UI steps lie on the native sequence's 0.005 progress grid.

The ending intentionally retains the exchanged screen sides: Cen is on the right and Cheng on the left. The opening-like distance and changed hands/shoulders make the comparison legible without adding a second crossing solely to reset the cast.

## Nine continuous handovers

| Transition | Time interval | Invariant |
| --- | --- | --- |
| 01 → 02 | 0.76–1.00 | The held pose remains intact while attention moves towards the feet. |
| 02 → 03 | 1.76–2.00 | Both forearms approach continuously; the hands do not appear after the camera arrives. |
| 03 → 04 | 2.76–3.00 | Palm contact turns into a grasp before the small lean starts. |
| 04 → 05 | 3.76–4.00 | Lean is recovered by 3.90; finger release begins after that; the independent phrase starts at rest. |
| 05 → 06 | 4.76–5.00 | Both timing modes end in the same pose. Gaze, first steps and yielding belong to the next continuous path. |
| 06 → 07 | 5.76–6.00 | The exchanged dancers take small settling steps into back contact, preserving garment identities and body separation. |
| 07 → 08 | 6.76–7.00 | The shared low position rises before back contact is released. |
| 08 → 09 | 7.76–8.00 | The complete phrase's genuine hand contact is retained for the detail view. |
| 09 → 10 | 8.76–9.00 | Each dancer takes real retreating/pivoting steps into the final composition. |

The path that starts at 4.76 continues through 6.00. Body roots, individual footsteps and turn directions are authored over that complete interval; chapter boundaries do not restart a walk cycle.

## Contact and limb safeguards

Two-bone IK uses the measured upper-arm, forearm, thigh and shin lengths. A small knee bend is retained at maximum stride to avoid an almost-straight chain snapping as it bends again. The pelvis is lowered when a planted leg's measured reach requires it. Hand orientation uses quaternion interpolation, avoiding the palm flip that linear interpolation of opposing normals can create.

A rendered CH-03 close-up exposed a defect that constant limb lengths alone did not catch: upright palms at the authored reach forced wrist bends of 110.13° and 112.79° at `t = 2.35`. The corrected light touch extends the fingers along the forearms, with opposed palm surfaces facing along the depth axis and relaxed fingers. Wrist bends at that pose are now 16.94° and 14.18°; the maximum across the complete modified approach/contact/grip handover is 65.88°. The actual curved palm pads require 60 mm between the internal palm centres. A renderer surface check at `2.35` found approximately 0.766 mm minimum opposed-surface clearance and no penetrating samples across 51,490 points on its 0.3 mm grid. The corrected close-up was visually inspected for continuous wrist contours and a light, ungripped touch.

That correction is isolated to `1.76 < t < 2.89`: native frame indices 353–577 on the 200-samples-per-unit grid, or 225 frames in each layout. The palm correction does not change any Echo-only frame, foot trajectory, torso action or CH-04 grip endpoint. A first horizontal-palm variant exposed a forearm-twist branch jump during the approach; the final opposed-depth orientation passes the actual rig-matrix check across all 227 interval/end samples, with maximum adjacent rotation changes of 4.95° and 4.81° per 0.005 progress and exactly matching endpoint matrices. The contact marker follows the actual two-palm midpoint throughout the touch and grasp handover.

Grasp targets remain fixed throughout the loaded part of CH-04. The clasp sits 35 mm towards Cen to accommodate the shorter character's measured reach. Both connecting elbows bend below their shoulders, and moderate finger curls retain a single readable hold. The connecting arm's bend plane stays stable across release; the free arms have their own balancing action. A first rendered check found an implausibly high elbow and an almost upright silhouette; the bend pole and modest torso offset were corrected without stretching either arm. CH-07 back spacing was refined against actual skinned geometry: an initial 113 mm surface gap was found and corrected by bringing each root 55 mm inward while retaining the ground anchors.

The CH-06 crossing was also checked against the actual skin. Separate root paths had concealed nearly coincident foot surfaces and upper-arm overlap. Cheng's three intermediate root keys now lie 150 mm farther into depth, while the two passing left-foot anchors move 40 mm rearward. The existing step times, support alternation, side exchange and final back-contact stance remain intact. A 40 mm root change cleared the feet but not the arms; a 100 mm trial still left overlap, so the final depth was chosen from the measured surface clearance. Across all 41 rendered samples from `5.25` through `5.45` at 0.005 intervals, the renderer found at least 16.829 mm nearest-mesh-vertex clearance and 19.110 mm projected upper-body depth separation. Matrix steps remained continuous, with a 4.762° maximum adjacent rotation change. The crossing correction affects only poses within `4.76 < t < 6.00`; all supports have returned to the original endpoints at `6.00`.

After both corrections, all 1,529 native-grid states outside those two intervals were compared with the frozen earlier score: body poses, contact state and camera state remain exactly equal, including endpoints `1.76`, `2.89`, `4.76` and `6.00`. The travelled-path record intentionally changes to represent Cheng's corrected route. The authoritative final packet contains 2,001 Unison states and 153 Echo states at density 200. Its final native images must all be rendered from that packet before packaging.

CH-08/09 fingertip placement uses the shipped middle-finger distal bone offsets in the palm's forward/normal/across basis. The middle digit retains the model's existing natural curve. An initial 8 mm bone-end separation was refined with measured skin-pad offsets (opposite 3.52 mm horizontal, 0.48 mm vertical and 2.85 mm depth corrections) to leave approximately 1 mm of skin clearance. This avoids treating a curved, approximately 127/151 mm palm-to-tip span as an invented short straight finger. Skin surface contact still requires visual inspection; matching bone endpoints alone is not an artistic or physical validation.

## Automated evidence

`npm test` runs 18 motion tests. They cover arbitrary/reversed evaluation, all chapter and transition endpoints, constant measured limb lengths, support continuity, planted-foot drift, the corrected palm exchange's wrist angles, grip/recovery ordering, true timing-mode divergence and identical endpoints, timing isolation, intermediate joint/hand continuity, Cheng's yielding path, the side exchange, coupled lowering/rising, the new CH-08 phrase, finger release order, fingertip reach against the shipped model bones, ending differences, degenerate IK and bounded input/breath.

Dense numerical checks sample 10,001 positions across the score. They verify the stated mathematical invariants; they do not claim that all rendered skin, cloth, finger contact, light or camera compositions are visually correct. Browser and art-direction findings belong in the separate verification report.
