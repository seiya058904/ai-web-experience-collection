# FRAME visual system

The supplied visual bible is authoritative. Normal design choices are delegated in the brief; its fixed ten chapters and eight art roles take precedence over a new direction interview. Three actual Hero references were compared. IMG-01's eye-level task clarity wins; IMG-02's bounded pose cards inform the worktable; IMG-03's expression informs the close views. IMG-04 refines the selected identity. No unapproved alternate world is substituted.

## Surface

Mode: Experience, with a small Operate surface inside chapter 08. The artifact leads; controls are an approachable worktable. The storyboard, not a marketing funnel, provides sequence.

## Production references

- concepts/UI-01.png: desktop composition, brand, hierarchy, Hero copy, color and controls.
- concepts/UI-02.png: worktable information layout and dark contrast section. Its accidental serif type and chapter eyebrow are intentionally replaced by the brief's mature rounded sans and a discreet chapter index in the bottom rule.
- concepts/IMG-04.png: canonical original Boop; IMG-05.png: portrait task composition.
- concepts/IMG-06.png: anticipation. IMG-07.png: ordered bounded frames. IMG-08.png: selected frame expands toward the premiere.
- Generated pictures are references, not claimed physical photographs. Production animation uses one deterministic model and real baked poses.

## Tokens

Mint #AED0C4; clay #9D87B7; watermelon #D66B66; butter #E4D88B; ink #403D49; pale paper #F4F3ED. Type: locally bundled Manrope Variable, weight range 200–800, with a system sans fallback. The implemented body weight is 450; display headings use 720/780 and principal buttons use 650. Data and frame numbers use tabular numbers with a monospace fallback. Display headings reach 96px with -0.04em tracking. Body, captions, and frame indices have role-specific responsive sizes in `src/style.css`; the implementation does not maintain a universal 14px caption minimum. Small labels require viewport legibility review. Default reading measure is approximately 50–65ch.

Layout uses responsive desktop gutters, 20–24px standard phone gutters, a 1440px main content limit, normal document flow, and images with explicit dimensions. The wider Hero has its own 1660px limit, and the narrowest phone breakpoint reduces the gutter to 17px. Ten chapters alternate full mint, pale paper, lavender, and one dark worktable, retaining the same light and actor. No nested-card grid. Six-frame strips and the full 24-frame expansion are actual storyboard controls.

## First viewport and copy

Header: FRAME, The story, Your worktable; accessible chapter menu and motion/sound controls are required functional extensions. H1: A little move. / A lot of life. Description: One small block. One determined Boop. / Find the life between the frames. Primary: Watch Boop try. Link: Explore the frames. Bottom: An original digital stop-motion story. Index 01/10. No eyebrow.

## Component families

Ink primary and quiet outlined buttons; three-choice spacing controls; plus/minus hold controls; a numbered frame rail; stage canvas with a DOM image fallback; native range seek; chapter nav; one nonmodal status line. Icons use a 24px SVG design grid with strokes or filled play triangles, rather than text glyph stand-ins.

## Motion and identity

Frames switch at 12 authored beats per second. Page scroll uses one Lenis RAF and calculated boundary progress. Nine finite handoff compositions reference the relevant source poses and target markers. They use separate bridge canvases with panel transforms and discrete observation changes; they are not continuous transfers of one shared DOM object between chapters. No scroll lock, snap, forced playback, or page-wide 12 FPS. Reduced motion uses static handoff compositions and native scroll; play remains a deliberate user action.

## Intentional deviations and reasons

The deterministic model is a rendered interpretation of the generated reference. Its silhouette, eyes, folded corner, and surface response differ from the generated pixels; this is not a pixel-identical material reconstruction. All real playback uses the same model, so an AI-reference-to-model swap does not occur inside the film. Exact seamlessness across every chapter boundary and physical-device performance are not established by source structure or isolated screenshots. See `docs/delivery-limitations.md` for the explicit verification boundary.
