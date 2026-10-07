# AETERNA — Museum Assets and Provenance

This document identifies the two museum-derived models used by AETERNA. The public-domain source objects are distinct from the exhibition’s generated imagery, material studies, lighting, and animated disassembly.

## 1. Lansdowne Herakles — SMK plaster cast

| Field | Record |
|---|---|
| Institution | SMK — Statens Museum for Kunst, Royal Cast Collection |
| Accession | KAS224 |
| Scanned object | Plaster cast acquired in 1897 |
| Ancient model | Lansdowne Herakles, Roman marble, about 125 CE; now at Getty |
| Museum dimensions of the cast | 208 × 88 × 76 cm |
| Runtime derivative | `models/herakles-fragments.glb` |
| Rights designation | Public Domain Mark 1.0 |

**Recommended credit:** SMK — Statens Museum for Kunst, Royal Cast Collection, KAS224. Public Domain.

**Exhibition caption:** Lansdowne Herakles · Roman original, c. 125 CE · digital study from SMK’s plaster cast, acquired 1897.

The downloaded geometry records the museum’s plaster cast. It is not a direct scan of the excavated Roman marble. The runtime derivative simplifies and smooths the geometry, cuts it into 36 pieces with new interior surfaces, and applies newly lit presentation materials. The complete cast silhouette is retained when assembled. Those changes are AETERNA’s artistic treatments, not evidence of historical fractures.

### Official sources

- [SMK collection page](https://open.smk.dk/en/artwork/image/KAS224)
- [SMK official metadata API](https://api.smk.dk/api/v1/art/?object_number=KAS224)
- [SMK reduced STL download](https://api.smk.dk/api/v1/download-3d/kd17cz49m_KAS224_small.stl)
- [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)
- [Getty account of the ancient Roman original](https://www.getty.edu/education/k-12-learning/explore-statue-of-hercules/)

The SMK record marks the object `public_domain: true` and gives the Public Domain Mark rights URL. Its collection page explicitly permits free use of the downloadable material. Public Domain Mark and CC0 are different designations; this asset is credited with the designation SMK supplies.

### Acquired source integrity

- Source file: `kd17cz49m_KAS224_small.stl`
- Format: binary STL
- Size: 20,001,384 bytes
- Triangles: 400,026
- SHA-256: `293a619e4456ef3109eee7df53d2de0a26884e0a80951bfefda8dcea19ca6af8`

The checksum describes the downloaded source STL, not the converted runtime GLB.

### Shipped derivative integrity

- Runtime file: `models/herakles-fragments.glb`
- Size: 8,925,536 bytes
- Separate digital pieces: 36
- Simplified source geometry before cutting: 64,000 triangles
- Final geometry: 154,248 triangles — 75,804 exterior and 78,444 newly created interior cut faces
- SHA-256: `0d73f3a6852023e35b22dd30493f9efacf9813e4744cce2bbc9bd42825f586f7`

Triangle counts describe the digital processing stages, not a physical condition assessment of the museum object. The same derivative supplies the assembly, fracture, and cast-viewing scenes.

## 2. Roman wellhead with water myths

| Field | Record |
|---|---|
| Museum title | Puteal (wellhead) with Narcissus and Echo, and Hylas and the Nymphs |
| Institution | The Metropolitan Museum of Art |
| Accession | 2019.7 |
| Date | Roman, second century CE |
| Material of ancient object | Marble |
| Museum dimensions | Height 104 cm; diameter 67 cm; base height 22 cm |
| Runtime model | `models/roman-wellhead.glb` |
| Rights designation | CC0 1.0 — The Met Open Access |

**Recommended credit:** The Metropolitan Museum of Art, 2019.7. Open Access 3D scan, CC0.

The model derives from the museum’s scan of the ancient object. Its relief joins water-related myths on a functional wellhead. The exhibition changes viewpoint and lighting to reveal the form; its opening image of a procession relief is a separate, imagined composition.

### Official sources

- [Met collection page, 2019.7](https://www.metmuseum.org/art/collection/search/775805)
- [The Met’s 3D publication and Open Access programme](https://www.metmuseum.org/press-releases/3-d-models-announcement-2026)
- [Public GLB supplied through the museum’s VNTANA asset service](https://api.vntana.com/assets/products/b6d09950-3eec-4bb1-94a1-1fb77fe4c73d/organizations/The-Metropolitan-Museum-of-Art/clients/masters/eddda0f3-c593-4c79-9f4e-fbb45c16026b.glb)
- [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

The object page marks this work Public Domain and provides its 3D download. The museum’s 2026 programme explains the CC0 reuse of its Open Access models.

### Acquired source integrity

- Format: GLB 2.0 with `KHR_draco_mesh_compression`
- Size: 7,113,316 bytes
- Triangles: 134,781
- Position accessor count: 129,765 vertices
- Meshes / primitives: one / one
- SHA-256: `08d2718277466e65a195c4cd911e6d84269c89586a89f96eb507f1e951ec4cea`

These measurements describe both the acquired and unchanged runtime GLB. A local Draco decoder accompanies the runtime model so viewing does not require a model-service request. Its Apache 2.0 license and README are included in `models/draco/`.

## Presentation boundaries

Ancient stone sculpture was often painted; the ivory visual treatment evokes surviving sculpture as encountered in a modern exhibition. The historical notes discuss ancient colour without presenting an interactive pigment reconstruction. See [The Met’s polychromy research](https://www.metmuseum.org/essays/polychromy-of-roman-marble-sculpture).

Generated portraits are imagined images with no assigned historical identity. They are not museum photographs, archaeological scans, or evidence of a named person’s appearance. Museum credits apply only to the identified scans and research sources. Other image classes and component licenses are listed in [ASSET_PROVENANCE.md](ATTRIBUTION.md).

Digital disassembly is an artistic simulation. Its cuts, separations, and reassembly do not document ancient breakage, excavation, or a museum conservation procedure.

Museum names identify provenance and sources; they do not imply endorsement. Source rights and asset records were checked in October 2026.
