> Preserved upstream delivery record. Its original paths, commands, versions and validation claims describe the standalone ZIP; see `ACCEPTANCE.md` for Collection verification.

# ATLAS — The World in Layers

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

A continuous, scroll-controlled cartographic experience: one real place becomes a coordinate, a grid, contours, relief, a real image, a city, a route, and finally one point on Earth. Scale is the story. The visitor explores a visual work, not a mapping utility.

## Users

Visitors on desktop and mobile who want to explore the same place at changing scales. The commission specifically includes 1080p, 1440p, 4K, and mobile inspection.

## Capabilities and Constraints

- Complete local website and reproducible ZIP only. No hosting, site registration, public preview, or deployment.
- Actual elevation, registered satellite/aerial imagery and mapped urban footprints. Generated art must never stand in for geographic observations.
- One persistent geodetic coordinate and one shared line identity throughout.
- Native document scrolling, immediate reverse, keyboard and touch support, responsive camera composition, and reduced motion.
- All runtime resources self-hosted; no keys, external tile requests or accounts.
- Preserve licenses, attribution, preprocessing inputs, source metadata and build instructions.

## Brand Commitments

ATLAS. One place. Every scale. The world in layers. Precise, cinematic, spatial, geological, restrained, editorial.

## Evidence on Hand

Implementation region selected from the brief's criteria: Mount Fuji, Fujiyoshida and the Fuji Five Lakes, Japan. Permanent coordinate: 35.4875° N / 138.8079° E. GSI elevation, Landsat mosaic and aerial imagery; GSI true road and building geometry; Natural Earth global outlines. Rendered building heights and time-of-day lighting are explicitly schematic.

## Implementation Decisions

The technology choice is an implementation decision under the supplied open technical strategy: TypeScript, Vite and Three.js, a single render loop and native scroll. No framework UI is required for the small editorial interface.
