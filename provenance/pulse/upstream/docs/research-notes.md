# PULSE — Anatomy research and editorial notes

Reviewed: **November 9, 2026**. Scope: a general educational account of a healthy adult heart, ordinary pulmonary circulation and systemic circulation. This is source verification by the project authors, **not independent clinical validation** of the finished illustrations or software.

## Research method

The four sources explicitly required by the build brief were opened and their relevant text was read. Additional official educational sources were consulted where the brief goes beyond those pages, especially valve support structures, the alveolar barrier and vessel terminology. A published cardiovascular review was consulted for a qualitative comparison of ventricular walls. No source illustration, photograph, animation, sound recording or patient scan was copied into the project.

The website's narrative headings and leads come from the supplied build brief. Supporting prose is newly written. Source links establish factual support; they do not imply endorsement or permission to redistribute the sources' artwork.

## Required sources actually consulted

| ID used in source code | Source | What was checked | Accessed |
| --- | --- | --- | --- |
| `nhlbi-anatomy` | [NIH/NHLBI — What the Heart Looks Like](https://www.nhlbi.nih.gov/health/heart/anatomy) | Four chambers; atria receive and ventricles eject; a septum divides the sides; myocardium is working muscle. | 2026-11-09 |
| `nhlbi-flow` | [NIH/NHLBI — How Blood Flows through the Heart](https://www.nhlbi.nih.gov/health/heart/blood-flow) | Each valve's two connected structures; venae cavae; pulmonary artery/veins; left ventricular ejection into the aorta; artery/vein direction. | 2026-11-09 |
| `nhlbi-beat` | [NIH/NHLBI — How the Heart Beats](https://www.nhlbi.nih.gov/health/heart/heart-beats) | SA-node origin in the right atrium; atrial activation; AV-node delay; ventricular activation; association of heart sounds with valve closure. | 2026-11-09 |
| `aha-heart` | [American Heart Association — How the Healthy Heart Works](https://www.heart.org/en/health-topics/congenital-heart-defects/about-congenital-heart-defects/how-the-healthy-heart-works) | Independent cross-check of the chamber/valve sequence and the two returns; normal mitral versus other valve leaflet counts. | 2026-11-09 |

The requested pages were available. The NHLBI anatomy page displayed a March 24, 2022 update date; the AHA page displayed an April 13, 2026 review date. Those publisher dates are distinct from the project's access date.

## Supplemental sources

| ID | Source | Narrow use in PULSE |
| --- | --- | --- |
| `nhlbi-lungs` | [NIH/NHLBI — What Breathing Does for the Body](https://www.nhlbi.nih.gov/health/lungs/breathing-benefits) | Oxygen passes from alveolar air into capillary blood; carbon dioxide moves in the reverse direction. |
| Supporting reference | [NIH/NHLBI — The Respiratory System](https://www.nhlbi.nih.gov/health/lungs/respiratory-system) | Distinct airway and blood-vessel trees; pulmonary arterial branches lead to capillaries surrounding alveoli. |
| `aha-valves` | [American Heart Association — Heart Valve Anatomy](https://watchlearnlive.heart.org/index.php?moduleSelect=anatom) | Atrioventricular leaflets, chordae and papillary muscles; semilunar outlets; separation of inlet and outlet phases. |
| `nci-structure` | [NIH/NCI SEER — Structure of the Heart](https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html) | Heart position, muscle wall, chamber roles and correct chamber/valve/vessel attachments. |
| `nci-vessels` | [NIH/NCI SEER — Classification & Structure of Blood Vessels](https://training.seer.cancer.gov/anatomy/cardiovascular/blood/classification.html) | Arteries away, veins toward; the pulmonary exception to an oxygen-based naming rule; capillaries connect the two vessel groups. |
| `ventricular-review` | [Lippmann and Maron — The Right Ventricle: From Embryologic Development to RV Failure](https://pmc.ncbi.nlm.nih.gov/articles/PMC9818027/) | Normal right ventricular wall is thinner, left ventricular wall thicker. The project does not reuse numerical dimensions, disease claims, images or diagrams. |
| `blood-color` | [Clinical Methods — Measurement of Oxygen, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK54107/) | Oxygenated blood is bright red; deoxygenated blood is deep red. The relevant search-index passage was readable; direct full-page access returned a browser check. |
| Cross-check only | [MedlinePlus — Gas exchange](https://medlineplus.gov/ency/anatomyvideos/000059.htm) | Independent text confirmation that red blood cells remain in capillaries and gases diffuse across the intervening membrane. No A.D.A.M. content or media is redistributed. |

All supplemental sources were accessed on 2026-11-09. One attempted NHLBI address, `/health/lungs/how-lungs-work`, returned 404; the valid official lung pages above were used instead. The direct Bookshelf browser check is recorded rather than misrepresented as full-text access.

## Fixed anatomical contract

All heart-local diagrams use an **anterior cutaway convention**. Anatomical right is the person's right, appearing on the viewer's left; anatomical left appears on the viewer's right. No responsive view may horizontally mirror the organ or swap its labels. Any diagram that exposes posterior structures must say that it is a schematic cutaway.

| Structure | Required connection / placement | Error to reject |
| --- | --- | --- |
| Superior and inferior vena cava | Both enter the right atrium. | Connection to left atrium or left ventricle. |
| Tricuspid valve | Right atrium to right ventricle. | Treated as the pulmonary outlet. |
| Right ventricular outflow | Through pulmonary valve to pulmonary trunk and pulmonary arteries. | Aortic outlet substituted for pulmonary outlet. |
| Pulmonary capillary bed | Blood runs beside alveolar air across a tissue barrier. | Blood cells in an air sac; open vessel into an alveolus. |
| Pulmonary veins | Enter left atrium from the lungs; actual entries are posterior. | Right-atrial return, or an unlabeled front-surface connection. |
| Mitral valve | Left atrium to left ventricle. | Replaced by tricuspid valve or merged with the aortic outlet. |
| Left ventricular outflow | Through aortic valve to aorta. | Direct aorta-to-vein shortcut. |
| Septa | Right and left atria/ventricles remain separated. | A continuous cavity across both sides of the heart. |
| Left ventricular wall | Qualitatively thicker than the right ventricular wall. | Identical wall thickness or invented measured ratio. |

In the body map, routes are consciously simplified. A route segment may represent many branching vessels. It must not imply that the systemic arteries feed a single pipe directly into the vena cava: the tissue capillary connection remains explicit.

## Two processes, two meanings

The **electrical sequence** describes coordinated activation in heart tissue. The normal sequence begins at the SA node in the right atrium, spreads through atria, slows at the AV node, and passes through the ventricular conduction system. The graphic syntax should be dotted or otherwise visibly different from circulation arrows. It is not a diagnostic ECG.

The **blood pathway** describes anatomical connectivity: body → right heart → lungs → left heart → body. Scroll progress and button steps are educational navigation, not a physiological time axis. There is no claimed heart rate, velocity, oxygen saturation, pressure or duration. A blood cell must never appear to complete the whole circuit as a measured consequence of a single displayed heartbeat.

Valve illustrations compare structures or selected phases. Atrioventricular and outflow valves must not all open together. Chordae belong to the atrioventricular valve apparatus; they should not be drawn on the pulmonary or aortic cusps. Supporting cords stabilize closure; they are not handles that pull the valves open.

## Color and scale

Blood is represented as red tissue/fluid. Lower-oxygen blood is a darker red; higher-oxygen blood is a brighter red. Slate blue, if used, is an explicit schematic route notation. The NIH and AHA diagrams themselves use illustrative blue-purple colors, but that convention must not be mistaken for literal blood color.

The pulmonary-artery-to-alveolus transition is a **change of representation and scale**, with a frame or magnification cue. It is not a continuous geometric flight down a pipe that becomes an air sac. The membrane separates the air and blood compartments at every intermediate state. Oxygen arrows point air → blood; carbon dioxide arrows point blood → air.

The heart cutaways and lung plates are authored illustrations. No visible caption may describe them as real microscopy, a CT/MRI scan, patient data, a clinically validated model or a precise dimensional reconstruction.

## Chapter-by-chapter content map

The complete editable copy is in `src/content.ts`. Each chapter contains an exact brief heading and lead, two separately titled content beats, a diagram note, source IDs, and explicit interaction outcomes.

| Chapter | First beat | Second beat | Main source support |
| --- | --- | --- | --- |
| CH-01 — The Living Form | Muscular organ and chest orientation. | Myocardial wall and the purpose of a cutaway. | NHLBI anatomy; NCI structure. |
| CH-02 — Four Chambers | Atria receive; ventricles send. | Septa and wall differences. | NHLBI anatomy; AHA heart; ventricular review. |
| CH-03 — The Signal | SA-node origin and atrial activation. | AV delay and ventricular conduction. | NHLBI heartbeat. |
| CH-04 — The Return | Superior/inferior vena cava enter right atrium. | Tricuspid inflow to right ventricle. | NHLBI flow; AHA heart. |
| CH-05 — One-Way Gates | Atrioventricular valves and support apparatus. | Semilunar outlets and distinct phases. | AHA valve anatomy; NHLBI flow; NCI structure. |
| CH-06 — Toward the Lungs | Pulmonary outflow and two branches. | Explicit move to lung capillary scale. | NHLBI flow/lungs; NCI vessels. |
| CH-07 — Exchange | Separate air and blood compartments. | Opposing net gas directions. | NHLBI lungs. |
| CH-08 — The Way Back | Pulmonary veins carry oxygen-rich return. | Left atrium, mitral valve, left ventricle. | NHLBI flow; AHA heart; NCI vessels. |
| CH-09 — The Stronger Wall | Qualitative wall comparison. | Separate mitral inlet and aortic outlet. | Ventricular review; NHLBI flow; AHA valve anatomy. |
| CH-10 — Around the Body | Aortic distribution and tissue capillaries. | Venous return without a one-beat transit claim. | NHLBI flow; NCI vessels. |
| CH-11 — Beat Again | Pulmonary and systemic circuits rejoined. | Signal and circulation retain separate meanings. | NHLBI flow/heartbeat; NCI vessels. |

## Editorial decisions and limitations

- The hero title is **“Every beat has a direction.”** The CH-01 body title remains **“Not a symbol. An organ.”** They serve different jobs and should both be retained.
- **“The wall built for distance.”** is poetic supplied copy. Its explanation refers to systemic pressure work; it does not claim distance alone determines wall thickness.
- **“One beat, many destinations.”** refers to distribution, followed by an explicit warning against interpreting the complete map as one-beat cell transit.
- The heart wall copy uses the term *myocardium* only. It avoids conflating the pericardial sac with the epicardium when simplifying the layered wall.
- The normal healthy route is the scope. Congenital variants, disease, fetal shunts, the full coronary circuit and anatomical measurement are outside this exhibition. Coronary surface details in generated artwork are visual context, not an instructional vascular atlas.
- Every source URL is also available as structured data in the site. The renderer should expose chapter-level source links and an About/source panel.
- Any optional sound is an original artistic construction inspired by valve closure, with an explicit caption. It must not be described as a real recording or assigned a diagnostic meaning.
- Visual accuracy, accessible use of the diagrams and final implementation behavior still require the separate browser/visual acceptance process. Research alone does not establish H1–H9 acceptance.

## Reproducible editorial checks

1. Read the 11 `title` and `lead` fields against the supplied build brief.
2. Confirm exactly two `beats` per chapter and distinct learning goals.
3. Resolve every `sourceIds` entry against the `sources` catalog.
4. Check the four chamber descriptions against the attachment table above.
5. Check visible oxygen/carbon dioxide arrows against the direction text.
6. Inspect all anterior illustrations at desktop and portrait sizes for right/left inversions.
7. Confirm the final source and UI contain no unintentional CJK text, numeric health dashboards or claim of independent medical validation.

These are editorial checks to perform with the completed renderer. This document does not claim browser PASS results.
