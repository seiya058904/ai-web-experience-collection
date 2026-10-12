# Local dependencies

All files are distributed locally; the running experience makes no CDN requests.

| Dependency | Pinned package version | License | Upstream |
| --- | --- | --- | --- |
| Three.js | 0.183.2 | MIT; see three-LICENSE.txt | https://github.com/mrdoob/three.js |
| Lenis | 1.3.26 | MIT; see lenis-LICENSE.txt | https://github.com/darkroomengineering/lenis |
| Space Grotesk | @fontsource-variable/space-grotesk 5.3.0 | OFL-1.1; see ../assets/fonts/space-grotesk-OFL.txt | https://github.com/floriankarsten/space-grotesk |
| IBM Plex Mono | @fontsource/ibm-plex-mono 5.3.0 | OFL-1.1; see ../assets/fonts/ibm-plex-mono-OFL.txt | https://github.com/IBM/plex |

Three.js module imports its sibling three.core.js. Keep both files together. Lenis is an ES module and is driven by the application's single animation loop with autoRaf disabled. Space Grotesk contains weights 300–700. IBM Plex Mono contains weights 400 and 500. Font files are Latin WOFF2 subsets obtained from the specified Fontsource packages; each font's original license is retained.

The headline additionally uses Barlow Condensed (@fontsource/barlow-condensed 5.3.0, Latin 600/700, OFL-1.1). Its license is at ../assets/fonts/barlow-condensed-OFL.txt; upstream: https://github.com/jpt/barlow.

RoomEnvironment.js is from Three.js 0.183.2; its only change is the import specifier from the bare package name to the local ./three.module.js file. Three.js's MIT license applies.
