# ANAX — A Mechanical Dragonfly

One precision mechanical dragonfly on a single screen. The visitor turns it, opens it and takes it apart, from the titanium shell to the motor and power core, then closes it again. There is no scroll: one progress value from 0 to 1 drives every part.

## Point of view

The machine is meant to be understood, not admired from outside. The wing drive is a real crank-and-rocker linkage solved every frame, and the gears turn at their true centre distances and tooth ratios. Loads, materials, electronics and the tail's shape-memory coils are illustration, and the Notes dialog says so. The wings beat far slower than a dragonfly's so the mechanism can be followed by eye.

## Tokens

- Ground `#07080a`, ink `#edece8`, with titanium silver and gunmetal in the model itself and a little warm brass.
- Amber `#eaa94f` is the only accent: selection, focus, the active stage and the favicon.
- Roboto Flex (light, widened for the name) and IBM Plex Mono (readouts, numbers, part index), both reused from GRID by URL (`/grid/fonts/`).

## Composition

- A dark studio: key and rim lights built from emitters, a soft floor and gentle bloom. The machine fills the frame and the interface stays at the edges.
- Controls: Disassemble / Reassemble, a slider with three stage marks (I Shell, II Assemblies, III Core), Solid / Glass / Section shell modes, Motion and Labels switches, Reset view, Index and Notes.
- Selecting a part, from the model, the Index or a following callout, highlights it, moves the camera to a per-part heading and opens a dark card with the figures read from the model.

## Stages

Shell 0–0.30, Assemblies 0.30–0.62, Core 0.62–1. The Disassemble button runs a timed journey of about 10.5 seconds that holds for a beat at each stage boundary. The slider and the stage marks set the target directly. Displayed progress follows the target through a critically damped spring, so stopping, dragging and reversing keep their momentum and nothing steps.

## Motion

The camera is an orbit the visitor can take over at any moment. After about 3 seconds of no input it turns slowly, and the next drag takes over without a jump. Reduced motion removes the entrance move, the automatic turn and the journey: a press fades out, changes and fades back in, and the slider still works.

## Preserve

The single progress value, the exact return to rest at 0, the solved linkage and gear ratios, the three shell modes, part selection with its card, the WebGL fallback with its poster and written description, and amber as the one accent.
