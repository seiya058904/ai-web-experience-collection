# AURORA — research record

Sources were read on 4 November 2026. Where a formula's original paper could not be opened directly, the record says which source supplied the text.

## Used as published

| Relationship | Form in `model.js` | Source |
| --- | --- | --- |
| Solar wind dynamic pressure | `1.6726e-6 · n · v²` nPa, protons only | Standard expression; the helium correction is left out |
| Subsolar magnetopause distance | `(10.22 + 1.29 tanh(0.184 (Bz + 8.14))) · P^(-1/6.6)` | Shue et al. (1998), J. Geophys. Res. 103, 17691, [doi:10.1029/98JA01103](https://doi.org/10.1029/98JA01103). Coefficients read from their reproduction in [Annales Geophysicae 43, 835 (2025)](https://angeo.copernicus.org/articles/43/835/2025/) |
| Tail flaring | `(0.58 - 0.007 Bz)(1 + 0.024 ln P)` | Same |
| Boundary shape | `r0 (2 / (1 + cos θ))^α` | Shue et al. (1997, 1998) |
| Flux opening rate | `v^(4/3) B_T^(2/3) sin^(8/3)(θc / 2)` | Newell et al. (2007), J. Geophys. Res. 112, A01206, [doi:10.1029/2006JA012015](https://doi.org/10.1029/2006JA012015). The exponents were not visible in the sources opened for this record and come from the widely cited form of the function; check them against the paper before reusing them |
| Oval edge by Kp | Table: 66, 64.5, 62.4, 60.4, 58.3, 56.3, 54.2, 52.2, 50.1, 48 degrees | [SpaceWeatherLive, the Kp index](https://www.spaceweatherlive.com/en/help/the-kp-index). Kp 0 and 9 are stated there as "or higher" and "or lower" |
| Elevation of a point above a spherical Earth | Plane geometry, `R = 6371 km` | Derived; tested in `tests/aurora-model.test.mjs` |

## Used as guidance for colour and height

- [NOAA Space Weather Prediction Center](https://www.spaceweather.gov/phenomena/aurora): aurora typically forms 80 to 500 km up; electrons colliding with oxygen and nitrogen cause it; the ovals sit around the magnetic poles and expand during storms.
- [AuroraWatch UK](https://wp.lancs.ac.uk/aurorawatchuk/2017/05/10/the-vivid-lights-what-causes-the-colour-of-the-aurora/): green 557.7 nm mostly near 100 km with a lifetime near 0.7 s; red high above the green with lifetimes over 200 s; 427.8 nm from ionised nitrogen.
- [Whiter et al. (2023), Annales Geophysicae](https://angeo.copernicus.org/articles/41/1/2023/): measured green and blue emission peaks near 114 km, with blue above green for low-energy electrons. The sources differ on where violet appears. AURORA draws it at the lower fringe in strong activity and faintly at high altitude, and treats this as illustration.

## Our own illustration

These are design choices, not measurements, and the Sources dialog says so:

- Turning coupling into a 0 to 9 activity value: `9 (1 - exp(-coupling / 13600))`, tuned so the presets land in plausible ranges.
- A constant 2 nT east-west field, which keeps the clock angle defined at zero Bz.
- The oval's width, its shift toward the pole at noon, and its 10 degree day-side offset.
- The bow shock at 1.3 times the standoff, the flow as a Rankine half-body, and the dipole stretch in the tail.
- All fold, ray and surge motion on the curtain, the emission height curves, the lake and the skyline.
- A fixed dipole axis in the Sun-Earth plane, with the geomagnetic pole placed near 80.7°N, 72.7°W for the Earth texture. The location is approximate and the pole drifts over time.

## Not modelled

Clouds, moonlight, light pollution, seasons, substorm timing, the southern oval's asymmetry and any real forecast input. The page links visitors to NOAA for a real night out.
