# COUNTERFORM — The Shape of Reading

An English typographic installation in seven connected spaces: void, incision, impression, comparison, drawing, working poster and final cover. Keep the original paper/ink/rust palette, Fraunces and Roboto Flex, measured type anatomy and native specimen controls. The letterforms are illustrative artwork, not a claim of universal print or type history.

The complete design record and the pre-implementation concept plates remain in `provenance/counterform/upstream/`. The Collection entrance uses a still captured from the integrated runtime.

## Local print specimen — 2026-10-25

The final page offers **Print / save PDF** once Roboto Flex has loaded. It opens the browser's native print flow. The A4 sheet contains current words, three axis values and a small credit, without navigation or controls. It uses the same local variable font and CSS axes; unsupported glyphs retain the browser's system fallback. The 72-character input bound remains; 40pt print type accommodates the tested maximum width/weight/optical-size combination on one page.

This sheet projects existing state; it adds no persistence store, URL state, requests or backend. Existing sessionStorage restoration and reset remain authoritative. Printing removes the screen journey from layout; the existing owned RAF restores its original position after screen layout returns. No new clock is introduced. Actual printer output and non-Chromium printing remain unverified; see [acceptance](ACCEPTANCE.md).
