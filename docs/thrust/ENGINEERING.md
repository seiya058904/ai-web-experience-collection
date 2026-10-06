# THRUST — Engineering Notes

Reference review: **2026-10-06**.

THRUST follows air through one original, illustrative high-bypass turbofan. Its geometry preserves the principal relationships of a direct-drive, twin-spool engine. The experience is an authored visual explanation; it is not engineering CAD, a certified training device, a computational-fluid-dynamics result, or a performance simulator.

## One engine throughout

The stage counts and proportions below define this concept. They are not the specifications of a named production engine.

| Assembly | Concept configuration | Connection |
| --- | --- | --- |
| Front fan | 22 swept blades | Low-pressure spool |
| Low-pressure booster | 3 compressor rotor stages | Low-pressure spool |
| High-pressure compressor | 9 compressor rotor stages | High-pressure spool |
| Combustor | Annular chamber with 18 injector positions | Stationary casing |
| High-pressure turbine | 2 turbine rotor stages | High-pressure spool |
| Low-pressure turbine | 5 turbine rotor stages | Low-pressure spool |
| Shaft system | Two concentric, independently rotating shafts | Direct drive |
| Exhaust | Separate core and annular bypass exits | Streams mix downstream |

Compressor and turbine stage counts refer to rotor stages with associated stationary blade rows. The fan is listed separately from the three booster stages.

The axial order is **intake → fan → booster → high-pressure compressor → combustor → high-pressure turbine → low-pressure turbine → core nozzle**. The bypass duct branches behind the fan and passes around the core to its own outer nozzle. This arrangement is grounded in NASA Glenn's [turbofan description](https://www.grc.nasa.gov/www/k-12/airplane/turbfan.html).

## The two mechanical connections

The long **inner low-pressure shaft** connects the low-pressure turbine to the fan and booster. The shorter **hollow outer high-pressure shaft** connects the high-pressure turbine to the high-pressure compressor. Each turbine therefore powers its corresponding upstream machinery.

Rotors turn with their assigned spool. Stators, structural frames, ducts and combustor liners remain stationary. NASA's [axial-compressor explanation](https://www.grc.nasa.gov/www/k-12/airplane/caxial.html) describes the distinction between shaft-mounted rotors and casing-mounted stators; its [power-turbine explanation](https://www.grc.nasa.gov/www/k-12/airplane/powturb.html) describes the return of gas energy to shaft work.

Light propagating along a shaft represents **mechanical energy transfer**. Air does not flow through the shaft. The visible gas path is an annular passage around the central machinery.

## The air and energy story

### Intake and fan

The fan acts on the incoming air before it separates into bypass and core streams. Broad, twisted and swept blades establish the scale of the machine; their visual rotation is slowed so the shape and blade-passing rhythm remain readable.

The concept uses an **illustrative bypass ratio of 9:1**:

`bypass air mass flow / core air mass flow = 9`

That corresponds to **90% of inlet air mass flow through the bypass** and **10% through the core**. It is not a claim about the fraction of thrust, the fraction of cross-sectional area, or a constant ratio at every operating condition. NASA defines bypass ratio by [air mass flow](https://www.grc.nasa.gov/www/k-12/airplane/turbfan.html).

### Compression

Alternating rotor and stator rows organize the flow and raise pressure. Compression also raises air temperature. The progressively tighter annular passage, denser tracers and changing visual field express this process. Blade lengths, hub proportions and axial spacing are adjusted for legibility while preserving the direction of the gas path.

The cool visual palette here identifies the air before combustion; it does not imply that compressed air remains at ambient temperature. See NASA's [compressors overview](https://www.grc.nasa.gov/www/k-12/airplane/compress.html) and [axial-compressor description](https://www.grc.nasa.gov/www/k-12/airplane/caxial.html).

### Combustion

Fuel enters an annular chamber around the shafts. Inner and outer liners define the combustion space. Air also supports mixing and cooling around the liner.

The ignition sequence develops into sustained, controlled combustion. The intended thermodynamic relationship is a **large rise in temperature with a small loss of total pressure**, not a pressure jump caused by an explosion. NASA's [combustor description](https://www.grc.nasa.gov/www/k-12/airplane/burner.html) identifies annular construction, perforated liners and this pressure/temperature relationship.

### Turbines and cooling

Hot gas passes through stationary guide vanes and rotating turbine blades. The high-pressure turbine drives the high-pressure compressor; the low-pressure turbine drives the booster and fan. Extraction of shaft work lowers the gas's total temperature and total pressure through the turbine system.

The blade close-up represents **compressor-bleed air** entering a hollow blade, passing through internal channels and leaving through surface holes. The emitted cooling air forms a protective surface film. Cooling-air colors distinguish this path from the hot surrounding gas; they do not indicate fuel or liquid cooling.

The macro view simplifies passage geometry, hole count and wall thickness to expose their function. NASA's [turbine page](https://www.grc.nasa.gov/www/k-12/airplane/powturb.html), [turbine-cooling history](https://www.nasa.gov/special-projects-laboratory-turbine-cooling/) and [film-cooling description](https://technology.nasa.gov/patent/LEW-TOPS-52) provide the engineering basis.

### Exhaust and thrust

The bypass stream exits through the outer annular nozzle; core gas exits through the central nozzle. The two streams retain their identities at the exits and progressively mix downstream. Both contribute to the engine's overall thrust. The illustration uses the [co-annular exhaust relationship described by NASA](https://www.grc.nasa.gov/www/k-12/airplane/nozzle.html).

The closing aircraft scene connects aft-directed airflow with forward propulsion. It is an original aircraft silhouette rather than an identified airframe or a representation of a certified engine installation.

## Visual simplifications

- Geometry is procedural and designed for a continuous camera journey. Dimensions, blade profiles, stage spacing, clearances and cooling passages are illustrative.
- A cutaway or exploded assembly exposes relationships that would be hidden by solid casings. Such views are explanatory arrangements, not operating or maintenance procedures.
- Tracers reveal the flow path. Their count, spacing, color and speed are composed for readability and do not solve conservation equations or reproduce measured flow fields.
- Thermal colors distinguish cooler air, hotter gas and cooling flow. Visible glow and distortion are artistic cues rather than calibrated thermal imagery or material-temperature measurements.
- Displayed pressure, temperature, airflow and rotation indicators, where present, belong to this illustrative concept. They are not live telemetry, certified limits or predictions for a real engine.
- Rotation and camera time are deliberately decoupled from operating-engine speeds. The important invariant is which components share a spool and which remain fixed.
- The flight scene provides context for the engine journey; it does not calculate aerodynamic lift, aircraft performance, weather or a flight trajectory.

The [source register](SOURCES.md) records the public references used for these relationships. Asset and dependency credits are recorded in [ATTRIBUTION.md](../../public/thrust/ATTRIBUTION.md).
