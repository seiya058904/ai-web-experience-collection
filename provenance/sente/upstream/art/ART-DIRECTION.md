# SENTE — Art direction

## Selected direction

The overhead Hero (IMG-01) is the selected direction. It exposes the complete board, gives the empty intersections visual weight, and leaves a calm left-hand region for real English copy. The low-angle alternative communicates material well but would compress touch targets; the cropped alternative is editorially attractive but conceals playable coordinates. Both remain references, not the primary board.

IMG-04 refines the chosen direction into a **clean, unruled production plate**. Exact grid lines, coordinates, focus, stones and liberties are drawn by the application. IMG-09 provides a separately generated raw wood surface for portable, fully responsive boards. It contains no board edge, grid or objects.

The implemented page references two optimized derivatives: `public/assets/sente-hero-table.webp` from IMG-04 and `public/assets/sente-board-material.webp` from IMG-09. The nine original PNGs remain individually inspectable below. Their original grid/stone imagery never supplies rule data.

## Palette and materials

| Element | Target |
| --- | --- |
| Warm wood | #C6A476 |
| Charcoal stones and principal text | #242A29 |
| Warm white stones and light surfaces | #E7E6DE |
| Deep brown details | #544737 |
| Restrained attention color | #884F42 |

Black stones are subtly matte; white stones have a gentle varied surface. The generated material is not described as a precious mineral or historic artifact. A broad soft upper-left light gives short contact shadows and a legible surface. Grain is subordinate to the intersections. The UI uses real serif headings and stable sans-serif body copy; labels and coordinates remain selectable code-rendered text.

## Independent outputs and uses

| ID | Delivered file | Role and adoption |
| --- | --- | --- |
| IMG-01 | concepts/img-01-hero-a.png | Selected full-board overhead composition |
| IMG-02 | concepts/img-02-hero-b.png | Alternate low view; material reference only |
| IMG-03 | concepts/img-03-hero-c.png | Alternate cropped editorial view; spacing reference only |
| IMG-04 | concepts/img-04-desktop-refined.png | Selected unruled desktop environment |
| IMG-05 | concepts/img-05-mobile-composition.png | Independently composed portrait reference |
| IMG-06 | concepts/img-06-two-eyes.png | Chapter-five two-opening material/composition reference |
| IMG-07 | concepts/img-07-choice-comparison.png | Chapter-eight equal-scale comparison reference |
| IMG-08 | concepts/img-08-transition-midpoint.png | TR-08-09 opaque physical-board hierarchy reference |
| IMG-09 | concepts/img-09-board-material.png | Additional raw surface for code-rendered boards |

Each file is a distinct original tool output, not a crop of another. The eight mandatory roles are fulfilled by IMG-01 through IMG-08. IMG-09 is an additional production material, not a substitute for any required role. The exact prompts, original output basenames, selection decisions, dimensions and final adoption records appear in generation-log.json.

## Desktop and phone

The desktop reference reserves approximately one third of the width for copy and two thirds for the board/table composition. In IMG-04 the blank board lies approximately within x 541–1328 and y 91–901 of the 1536×1024 original. The runtime aligns its exact SVG and native-button grid within that surface. At 2200px and above the Hero is capped at 2200px and centred with paper gutters; it no longer repeats a separate wood texture outside the photograph.

The phone reference was generated at 1024×1536. It shows a complete board above a separate lower copy/control region. At 999px and below the implementation recomposes this arrangement in DOM: the square SVG board uses the separate wood material and the actual copy follows below it. The original portrait PNG is a reference, not a runtime poster. P1/P2 also expose result text and Undo immediately below their boards in this compact layout.

## Middle, late and transition frames

Chapter five concentrates on two openings and the connecting central stone. Chapter eight compares two outcomes at equal scale under the same light. The key eighth-to-ninth transition uses separate opaque boards, with the new board given clear priority. No transparent stacks, overlapping coordinate systems, or ghost stones are used as a substitute for an understandable transition.

The delivered choreography is a restrained two-dimensional editorial handoff. TR-08-09 displays both labelled P3 examples beside a separate K1; all remain present while the thread, explanation and small group displacement respond to scroll. It does not reproduce a continuous camera move or a physical merge of two boards into one. Other late boundaries similarly retain both P2 branches and all three actual observation-note panels. The full implementation distinctions are recorded in `docs/CHAPTERS-AND-TRANSITIONS.md`; the current visual contract is `DESIGN.md` at the project root.

Generated arrangements in IMG-07 and IMG-08 are **conceptual** and do not match all P3/K1 coordinates. They must not appear as authoritative puzzle diagrams. Programmatic states supply every official position. IMG-06 visually matches the intended two-opening motif, but even there the coordinate data remains the source of truth.

## Review and provenance

All nine actual outputs were visually reviewed. No seeds, model versions or sampling settings were reported by the tool, so none are invented. This document records completed art generation and selection; it does not claim browser fidelity or test results. The implementation report and actual page screenshots record those separately.

Generated image outputs are supplied with the project. No third-party stock photo or cultural ornament was added. All eight reference outputs can be independently inspected.

