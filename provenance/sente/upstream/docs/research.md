# SENTE — rules and technical research

Checked 9 November 2026. This file distinguishes published rules, this work's authored exercises, and independent computation. It is not a claim of complete tournament-rule coverage.

## Primary rule sources

1. [British Go Association — How to Play](https://www.britgo.org/intro/intro2.html), sections on play, liberties, strings, eyes and ko. Stones occupy intersections and stay there until captured. Connections and liberties use horizontal or vertical adjacency; diagonal proximity is insufficient. Edge and corner boundaries reduce an isolated stone's available neighbours. This supports Chapters 1–3 and the visual language of explicit empty intersections. The source describes immediate ko recapture as prohibited. SENTE does not use its scoring discussion to declare territory or a whole-board winner.
2. [American Go Association Rules — Definition, hosted by BGA](https://www.britgo.org/rules/agarules.html). The page explicitly dates its text **April 1991**. Rule 5 removes surrounded opposing strings before deciding whether the newly played friendly string has no liberties. Rule 6 prohibits a repeated full-board position with the same player to move. This latter formulation is broader than simple immediate-ko checking. SENTE's single K1 illustration demonstrates the shared immediate-recapture case; the project must not advertise that illustration, or a simple-ko engine, as complete AGA rules. Passing, scoring, komi, handicaps, dead-stone adjudication and tournament procedures are outside this tutorial.

No source diagrams or page prose are redistributed. The seven-line positions are authored in the supplied brief and rebuilt from explicit coordinates.

## Independent position verification

Command actually run:

```sh
python3 tests/reference-enumeration.py
```

The independent verifier uses Python coordinate-pair dictionaries and flood-filled sets. It imports no production TypeScript and checks every initially empty intersection, not only the advertised solutions. Full per-move output is in `reference-enumeration.json`.

| Position | Empty first points checked | Legal black first moves | Moves satisfying the stated goal |
| --- | ---: | ---: | --- |
| P1 | 45 | 45 | D5 only |
| P2 | 41 | 41 | D3 only |
| P3 | 38 | 38 | C5 only |

Additional results:

- P1: D5 captures white D4 and leaves D4 empty.
- P2: D3 captures nothing. B3, C3, D3, E3 and F3 become one string. Its eight unique liberties are A3, B2, B4, D2, D4, F2, F4 and G3.
- P2 branch B: black D4 followed by white D3 is legal; the original black strings remain separate.
- P3: all 38 prescribed white replies are legal. Black C5 is answered at F6 and both marked black stones remain. Black F6 captures white F5; white C5 then captures black C3 and C4. No other legal first move preserves both marked stones after the specified reply.
- Chapter 3: D3, D4 and E4 form one string with seven unique liberties: C3, C4, D2, D5, E3, E5 and F4. F5 is a separate string.
- Isolated D4, A4 and A1 have respectively four, three and two liberties. The verifier stores their exact sets.
- Chapter 5: white C3 and white E3 both fail the no-suicide rule. The original board is unchanged.
- K1: black D5 captures white D4. This also checks capture-before-suicide, because D5 initially has no directly empty neighbour. A hypothetical white D4 recapture removes black D5 and exactly reproduces every cell of K1. History-aware checking rejects it.

These results validate the authored puzzle data independently. They do **not**, by themselves, validate the production engine, interface hit testing, animation, accessibility, or export.

## Technical references

### Lenis

[Official Lenis repository and README](https://github.com/darkroomengineering/lenis), checked on the date above. The inspected README's CDN examples identify 1.3.27. Actual installed versions must be recorded in `package-lock.json`; this note does not substitute for that lock.

The documented import is `import Lenis from 'lenis'` and its recommended stylesheet is `lenis/dist/lenis.css`. Use either `autoRaf: true` or one external animation-frame loop calling `raf(time)` in milliseconds. Do not drive the same instance from both. If GSAP is used, the documented integration forwards Lenis scroll events to ScrollTrigger and converts ticker seconds to milliseconds. SENTE can avoid GSAP entirely if its own deterministic transition evaluator is sufficient. Keep anchors working; `destroy()` removes instance event handlers. The currently inspected docs describe `respectReducedMotion` as enabled by default, but SENTE's own visual motion must also respond to the preference.

### Vite

[Official Vite getting-started guide](https://vite.dev/guide/) states Node.js 20.19+ or 22.12+ as the compatibility baseline, with possible template-specific requirements. The available Node 24 runtime is suitable for a plain Vite/TypeScript project; the precise installed Vite version and successful build remain the authority for this deliverable.

## Wording and scope decisions

- Use **string** for the exact orthogonally connected component. The word “group” can be looser in Go literature; a function named `groupAt` still represents a string here.
- The beginner exercises are one-black-move tasks. After a legal unsuccessful attempt, retain it visibly and require Undo or Reset before another attempt. Do not allow an arbitrary sequence of black moves to quietly change the stated one-move objective.
- P3's response is a disclosed teaching script, not a search engine or a claim about the best whole-board reply.
- “Two eyes” refers to the supplied, checked structure. Do not classify any two visually enclosed empty areas as eyes or territory.
- Distinct examples are independent setups, not sequences of legal moves between chapters.
- K1 and the two-eye demonstration are rule observations, not additional scored puzzles.
- Browser tests, screenshots, performance numbers and physical-device support must only be claimed after their own recorded checks.
