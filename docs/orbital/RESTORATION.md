# ORBITAL — fragments and reading position

The eight-scene mission retains its shared spacecraft, engineering tabs, Moon/Mars controls, silent-by-default audio, Canvas renderer and reading companion. Its single Lenis instance stays on the existing GSAP ticker.

`#mission-reading` initializes the companion after React has mounted it. The root's `data-reading` state exposes the section even when the browser did not assign `:target` during the initial document load. Navigation to a visual chapter clears that state and focuses the wordmark before the companion collapses.

The current history entry records the settled document position, with an additional paragraph offset for the reading companion. Reload and non-BFCache Back restore that position immediately after geometry is available. A fresh URL follows its fragment normally; it does not inherit another visit's saved reading position. State writes preserve other keys and tolerate restricted history access.

Readiness and viewport measurements preserve actual document position divided by the previous mission travel. They do not use a cached scene progress that may precede native browser restoration. No additional scene smoothing or animation clock is introduced.
