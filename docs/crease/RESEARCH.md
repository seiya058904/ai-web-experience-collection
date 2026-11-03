# CREASE — research record

Sources were read on 4 November 2026.

## Geometry

- **Kawasaki's theorem.** A single vertex on a flat sheet can fold flat only if alternating angles sum to 180°. The arXiv survey [Face flips in origami tessellations](https://arxiv.org/pdf/1910.05667) and [Wikipedia's Maekawa's theorem article](https://en.wikipedia.org/wiki/Maekawa%27s_theorem) state the condition. The tests confirm it behaviourally: with the condition met all four creases close together, and with it broken by a few degrees the sheet stays tens of degrees open.
- **Maekawa's theorem.** At a flat-folded vertex, mountain and valley counts differ by two. The tests check this at every interior vertex of the printed Miura pattern.
- **Miura cell.** [Schenk and Guest (2013), PNAS 110(9), 3276](https://doi.org/10.1073/pnas.1217998110) describe the cell by facet sides `a` and `b`, a sector angle and one fold angle. The article's full text could not be opened in this session, so the `H`, `S`, `L`, `V` expressions in `model.js` were not compared with it directly. They are verified independently instead: the tests confirm that facet edges keep their lengths, facets stay planar and neighbours stay joined at every fold.
- **Shrinking in both directions.** The width, length and footprint readouts are measured from the folded result. The published description of in-plane behaviour is taken from the article's citing literature.

## History

- Miura fold on the Space Flyer Unit, launched March 1995, and the single-pull deployment: secondary accounts such as [Heidelberg Laureate Forum](https://www.newsroom.hlf-foundation.org/blog/article/origami-mathematics-the-shape-of-things-to-come/) and [phys.org](https://phys.org/pdf327305212.pdf). Those accounts disagree on when Miura first proposed the pattern and give varying detail about the flight, including a report that the array did not fully retract. The page therefore states only the launch year and the purpose, and the notes dialog says no primary JAXA record was found.

## Idealisation

- Paper has zero thickness and facets are perfectly rigid. Layers may pass through one another near full fold because collisions are not modelled, so the drawn folds stop short of exact closure (177° for the single line, 171° of driver angle at the vertex, 85° for the Miura angle).
- The Kawasaki readout concerns the angular condition only. Real paper also bends, which is why hand folding is more forgiving than this model.
- The printed pattern assumes A4 landscape. It has not been folded by the author of this record.
