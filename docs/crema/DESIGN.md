# CREMA — the inspection chamber

## Commitment
Mode: Experience. The artifact leads; controls stay peripheral. A large radial steel object contains a tiny suspended amber drop. The visitor enters it, travels through a granular volume, and returns to the exact attachment point before the first drop is released.

The supplied brief fixes the visual world and grants creative autonomy. Nine accepted standalone desktop/portrait concept frames in `production/concepts` are the composition references. The alternative editorial left-text/right-machine hero was rejected as too conventional. The selected radial hero was refined into `production/originals/machine-master.png`, removing baked text, an inert drip tray and the still-image droplet so HTML and real-time geometry own them.

## Tokens
- Stage: near-black `#090b0a`; index surface `#101310`.
- Type: pale neutral `#eeede6`; secondary `#bfc1ba`; supporting `#979c95`.
- Warm accent: `#c78b4d`, used for liquid, current navigation and focus.
- Type family: self-hosted Archivo Variable, display weight 350–725, body 400.
- Gutters: 3.5vw desktop, 22px portrait; no card containers.
- Interface type: 10–17px at common desktop viewport, appropriately scaled on 4K.
- Main type: generous 60–120px desktop depending on viewport; small phone 40–60px.
- Hero wordmark is architectural typography and intentionally exceeds normal display scale.
- Focus ring 2px amber, links 1px underline, accurate 44px control targets.

## Composition and handoff
| Movement | Stable composition | Living hold | Handoff |
| --- | --- | --- | --- |
| Machine | Monumental radial chrome, suspended drop, vast CREMA type | Drop tension, tiny specular changes | Zoom through filter centre |
| Particle | Large fractured pieces against dark | Restrained light/camera motion | Particles settle into a packed section |
| Bed | Right-biased slab, pores remain legible | Tiny material motion | Water-facing boundary enters |
| Pre-infusion | Matt dry below, reflective wet above | Irregular front and local flow | Bed fills and pressure gathers |
| Pressure | One clean 9 BAR on a dim dense field | Compression and subdued flow | Numeral leaves, camera enters pores |
| Percolation | Interconnected unequal winding routes | Tracers branch, rejoin and vary speed | Solute colour joins the flow |
| Extraction | Clear-to-warm-to-dark within a water parcel | Tracer transport, retained solids | Paths converge, steel returns |
| First drop | Exact opening attachment at real scale | Neck tension | Scroll authors detachment, second drop |
| Stream | Fine dark glossy line, warm edges | Descending liquid highlights | Enlarged liquid surface |
| Crema | Dense tiny uneven red-brown cells | Local film warp | Macro recedes to small cup |
| Cup | Small porcelain in a large dark field | Minute material shimmer | Replay returns to start |

## Implementation decisions
Lenis is the sole smooth-scroll authority. GSAP's ticker calls `lenis.raf`, ScrollTrigger reads the resulting scroll, and WebGL renders from the same stage value. No secondary scroll interpolation, RAF or CSS smooth-scrolling is permitted. Time only animates small ambient material effects; structural state is a function of scroll position. Reverse scroll restores geometry and wetness, including the first drop.

Cold steel and the final cup use selected AI still assets; text is HTML. Most of the journey is an authored instanced volume with shader wetting and an explicit branch/rejoin path network. In 1.1, object-space triplanar colour/height preserves cellular detail across fracture faces; wet darkening and patchy film response keep the rough solid legible. Four stronger primary routes reveal local flattened menisci among thinner secondary branches. A perspective traverse follows an existing pore route after pressure. During extraction exit, a shared below-bed outlet projects onto the exact returning basket attachment while upper routes disappear. A procedural liquid surface handles growth, necking and stream. Crema begins as a small source-bound liquid/gas patch, then uses a curated photographic substrate with an authored cell/film shader. The formation remains compact and disappears before it can cover the photographic macro with a separate lattice. These are artistic physical interpretations, not data-driven CFD.

Portrait changes the framing: the machine crops across the width, the granular volume is closer and lower, the first-drop title sits below the action, and the final cup occupies the lower half. The 894-instance portrait selection retains the packed central crop, culling side particles before visible ones and preserving their original colour/seed identities. Desktop restores all 1,512 instances. A pixel budget caps GPU resolution independently of crisp DOM and photographic layers: 2.6 million pixels on desktop, 1.35 million on portrait, with DPR ceilings of 1.65 and 1.6 respectively.

## Deliberate departures from concept images
- Portrait prose remains grotesk; the generated mobile reference accidentally introduced a serif line, which conflicts with the explicit industrial visual brief.
- Intro tray and support rods removed to create the required empty pressure chamber.
- The same original machine geometry is used for opening and return, instead of inconsistent generated machines.
- Particle and flow keyframes are translated into real three-dimensional material systems, rather than pasted into the page.
- The crema macro is refined to reduce oversized bubbles; an unequally sized microfoam remains.
- Text is editable, accessible DOM; final source contains no baked UI photography.

## 1.1 timing refinements

The perspective traverse enters during 4.50–5.10 and withdraws during 6.12–6.68. Local flow converges during 6.14–6.78; registration to the shared attachment occurs during 6.35–6.78. Coffee fades during 6.27–6.68 while warm terminal flow persists until 6.98. Upper path opacity trims toward the last 8.5% of each route, keeping returning steel clear. All are stage-derived.

The compact liquid surface enters during 8.56–8.68 and develops local gas cells during 8.64–8.79. The photographic reveal follows the actual stream x position from 8.70–8.97; it reaches full opacity by 8.86, and the small procedural formation disappears around 8.813. The mature crema hold retains its selected image and subtle film motion. Portrait applies localized reading gradients behind the crema text, preserving the brightest central material.
