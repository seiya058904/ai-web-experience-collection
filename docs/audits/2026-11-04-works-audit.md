# Works audit, 4 November 2026

A defect check of the thirty-eight works that existed before AURORA and CREASE, on a project-path production build of commit `6154024`.

## Method

Chromium 1248 through Playwright with software WebGL, at 1440×900 and at 390×844 with touch emulation. For each work: direct load, a screenshot at the top and at 45 percent scroll, console errors, page errors, failed or 4xx requests, document overflow, elements past the viewport edge outside a clipping ancestor, and the shared return control's presence and size. All 152 screenshots were reviewed on contact sheets.

## Result

- 76 of 76 loads had no console errors, page errors or failed requests, and no document overflow.
- The return control was present and at least 44px tall everywhere.
- One automatic flag, on F1 at 390×844: an `H2.display` element measured wider than the viewport. The screenshot shows the heading fully inside the frame, so this is a false positive from an animated or transformed state and no change was made.
- No visual defect was found, so no work was changed. Low-contrast text seen in a few mid-scroll frames (for example MAGMA and CREMA) is the screenshot catching a fade in progress.

## Limits

This is a single-pass check. It did not exercise every control, every scroll position, slow or fast wheel input, reduced motion, resize or tab recovery for each work. Software WebGL does not represent real frame rates. Physical touch, iOS Safari and high-refresh hardware were not tested.
