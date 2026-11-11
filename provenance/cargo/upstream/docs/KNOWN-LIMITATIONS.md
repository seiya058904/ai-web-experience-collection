# CARGO — Known limitations and interpretation

This document describes the implementation's deliberate limits. Observed test outcomes belong in [QA-REPORT.md](QA-REPORT.md) and [requirements-evidence.md](requirements-evidence.md); a feature description here is not a test result.

## Industrial interpretation

- BOX-001 is a fictional 20-foot standard general-purpose container using a sourced nominal external envelope. It is not a certified physical asset or a complete manufacturing model.
- The source review verified ISO 1161:2026's publication and scope, not every normative drawing, fitting aperture, tolerance or strength requirement. Corner fittings, door hardware, clearances, carriers, crane structure and securing details are schematic.
- The two door bars, six timber blocks, paint, scratch, seal, operator, route and sites are authored visual choices. The seal is a fictional custody detail and supplies no security guarantee.
- Photographic plates are AI-generated industrial fiction. They are not documentary images or pixel-identical renders of the shared technical model. The technical studies preserve explicit model identity and state; photographic material, perspective and distant equipment are illustrative.
- Road, rail, terminal and vessel changes are editorial handoffs. Opaque structural details conceal changes of support. This is not a real-time logistics or terminal-physics simulator, and it is not a lifting or loading tutorial.
- No real freight tracking, voyage duration, route distance, emission, cost, capacity or safe-load metric is supplied.

See [SOURCES.md](SOURCES.md) for factual support and [model-contract.md](model-contract.md) for the exact recurring geometry and state conventions.

## Presentation and interaction

- The interactive studies use a bounded explanatory view. They are not a freely rotatable photorealistic 3D environment.
- The display is silent. The **Sound: Off** control reports that audio is unavailable; it does not enable a hidden soundtrack.
- Reduced motion presents SVG studies and explicit stage choices. It preserves story content and interaction results but deliberately removes smooth scrolling, cinematic camera motion and prolonged ambient motion.
- A failed photograph is replaced by that chapter's schematic study and retained text. The fallback communicates the subject and state; it does not reproduce the absent photographic atmosphere.
- Interactive behavior requires JavaScript and a modern browser with ES modules. The HTML contains a brief no-JavaScript outline, and [STORY.md](../STORY.md) contains the complete offline narrative and all transition stages.
- The application is intended to be served over HTTP. Direct `file://` opening is not a supported Vite module-loading workflow.

## Compatibility and measurements

Only browser engines, CSS viewports, DPR values, input simulations, network conditions and scenarios actually named in [QA-REPORT.md](QA-REPORT.md) are covered by the recorded verification. A 4K CSS viewport is not a test on physical 4K hardware. Mobile emulation is not physical phone testing. A screenshot does not establish motion continuity, color accuracy, field performance or accessibility conformance.

No universal frame-rate, load-time, memory, Core Web Vitals, WCAG, Safari, Firefox, real-device or high-refresh-display claim is made. Unmeasured combinations remain unmeasured. Changes to assets, fonts, layout, dependencies or model state can invalidate earlier results and should be checked according to the affected risk.

The preparation environment used Node.js 24.22.1. The package's application-toolchain minimum is Node.js 22.12; native TypeScript test loading on early Node.js 22 versions can require `--experimental-strip-types`. Use Node.js 24 for the most direct reproduction of the supplied commands.

## Local storage and connectivity

The motion preference and reload position use optional local/session browser storage. If storage is unavailable, the story remains usable but those conveniences may not persist. There is no cross-device preference synchronization.

The runtime has no external API, telemetry, authentication or database dependency. The first dependency installation and optional Playwright browser installation require package downloads. Research links intentionally lead outside the local site when followed. A static build does not include a service worker or promise offline browser caching; the separately retained story transcript works without a running application.

## Publication boundary

This is a local source handoff. It does not create a hosted site, deploy a public preview, push Git changes, bind a domain or modify another collection. The relative build base supports static serving beneath a path prefix, but a particular host's headers, caching, domain configuration and runtime policy require their own verification if publication is later authorized.
