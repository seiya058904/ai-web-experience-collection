# COUNTERFORM — integration architecture

`pages/counterform/index.html` owns the independent document and semantic reading fallback. `experiences/counterform/app.js` owns one Lenis instance, one RAF, seven chapter states, real variable-font controls, the Index dialog and teardown. `src/materials.js` provides the authored Canvas material; `src/type-handoff.js` keeps the final type transition aligned with the authored handoff. `src/bootstrap.js` binds Lenis and imports the material and handoff modules before starting the supplied controller.

Lenis and Three.js resolve from the Collection root lockfile. Runtime fonts and the favicon are under `public/counterform/assets/`; HTML font faces use `%BASE_URL%` so project-path deployment resolves correctly. No upstream vendor bundle or nested package manager is deployed.
