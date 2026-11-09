# BERTH — Architecture

## Purpose and shape

BERTH is a static, English-language narrative website: ten chapters cover one fictional night in a fixed sleeper compartment. HTML carries the story, dialogue, manuscript text, cards, navigation, and controls. Prepared photographic assets provide the setting. CSS and a single scroll coordinator join the scenes without turning ordinary reading into a timed sequence.

There is no application server, account system, database, telemetry service, runtime image generation, or external text-processing API. Vite is used for local development and the static production build.

## Module boundaries

| Module | Responsibility | Side effects |
| --- | --- | --- |
| `story.ts` | Ten chapter records, names, times, titles, two narrative beats per chapter, default openings, and Lin's fixed note. | None. |
| `state.ts` | Validate and persist user choices; evaluate a story state from chapter, local progress, and user state. | Only the explicit storage helpers access local storage. The evaluator is pure. |
| `render.ts` | Build the semantic document and its chapter-specific image/control structure. | Returns markup; does not commit user choices. |
| `scroll.ts` | Measure the document, coordinate native/Lenis scrolling, select the current chapter, and evaluate visual transition progress. | DOM measurements, CSS properties, navigation, and frame scheduling. |
| `interactions.ts` | Bind native controls, preserve drafts, commit explicit edits, manage undo/copy, and apply preferences. | DOM updates and explicit preference/line persistence. |
| `ambient.ts` | Create a quiet original rail texture after activation; manage playback and cleanup. | Web Audio, created only after an explicit enable action. |
| `main.ts` | Assemble the app, connect state changes to the scroll coordinator, and recover individual image failures. | Initial rendering, local asset requests, event bindings, and development cleanup. |
| `styles.css` | Typography, materials, chapter layouts, scene masks, local illumination, and responsive/static alternatives. | CSS presentation only. |

The current application uses vanilla TypeScript. It does not require React, GSAP, a Canvas renderer, or WebGL.

## Two independent state domains

### User choices

`UserState` contains:

```ts
interface UserState {
  opening: string;
  lamp: 'reading' | 'soft' | 'off';
  motion: boolean;
}
```

These choices are stored with schema version 1 under `berth.user.v1`. `loadState()` handles missing data, malformed JSON, unknown versions, and storage access errors. It can preserve a valid sentence even when another saved field is malformed. `saveState()` reports success only after the storage write returns successfully.

Typing edits a draft in the textarea. Only Save, a preset, Reset, or Undo commits a sentence. Changes to light or motion preferences do not save an unfinished text draft. Undo stores up to twenty previous committed lines for the current visit. Audio activation, draft text, and undo history are intentionally session-local.

The application writes user text through `textContent` or textarea `value`, never through `innerHTML`. User-authored text is direction-aware and marked with an unknown language rather than guessed to be English. Website-owned labels and narration remain English.

### Story facts

`resolveStoryState(chapter, localProgress, userState)` returns a fresh scene description. Its inputs are sufficient to determine the state; it does not inspect the previous chapter, a previously fired event, or an accumulated animation frame.

The returned description includes:

- Chapter, local progress, fictional time, and narrative stage.
- Story/comparison lamp source, physical lamp output, direction, and daylight.
- Each person's current location.
- Separate locations for Ning's manuscript, Ning's card, Lin's card, the one paper clip, and Lin's glasses.
- The paper clip's attachment, the face of Lin's card, and the text permitted to appear at that point.

The user lamp setting is consumed only in Chapter 3. Other chapters evaluate their own story light and cannot overwrite that saved preference. A saved opening never fills the blank early manuscript on a reread: story-visible opening text is `null` before Chapter 7. Lin's message stays hidden until the morning handover.

## Continuity checkpoints

| Point | Required state |
| --- | --- |
| Chapters 1–4 | Manuscript and its clip are at the table; the two future cards are still in Ning's bag. |
| Chapter 5 | Ning takes out two distinct cards, keeping one and lending the other to Lin. |
| Chapter 6 | Lin's face-down card and glasses remain at the table; Ning carries her manuscript and own card up the fixed ladder. |
| Chapter 7 | Ning's manuscript is upstairs and her card is by her pillow; Lin's card remains below. |
| Chapter 8, before `.3` | The morning entrance preserves the upstairs/table positions from the night. |
| Chapter 8, `.3–.5` | Ning descends with her manuscript and card in hand. |
| Chapter 8, `.5–.65` | Ning's objects are back at the table; Lin's card is still face down. |
| Chapter 8, from `.65` | Lin turns and offers her own card; Ning receives it at `.8`. |
| Chapter 9 | The clip is removed from the manuscript at `.35`, joins the two cards at `.5`, and travels with them into Ning's bag at `.75`. Lin puts her glasses on. |
| Chapter 10 | Lin exits first at `.3`; Ning follows at `.65` with the manuscript and both clipped cards. The final keepsake view recalls the cards without putting them back on the empty table. |

The evaluator can restore these facts immediately after a direct jump or a reverse traversal. Its unit assertions establish the state model; they do not, by themselves, establish that artwork accurately represents every physical action. Frame matching, object visibility, and transition continuity require separate visual inspection.

## Text boundaries

The maximum sentence length is **120 Unicode code points**. `truncateOpening()` uses `Intl.Segmenter` with grapheme granularity and keeps the longest prefix made of whole graphemes that fits that code-point budget. A multi-code-point family emoji or accented sequence may therefore leave the counter below 120 instead of being split at the limit.

`sanitizeOpening()` preserves whitespace in nonblank bounded text. Whitespace-only results use the canonical default greeting. The same truncation helper serves stored text and the draft editor; the browser's UTF-16 `maxlength` attribute is not used. During IME composition, truncation waits until composition completes.

## One coordinated scroll clock

Lenis is created with `autoRaf: false`. `scroll.ts` owns the animation-frame loop, calls `lenis.raf(time)` once, then evaluates narrative and transition properties from the resulting coordinated scroll position. No second smooth-scroll library or independent story timeline competes with it.

Chapter progress and each adjacent transition's local progress are derived from measured document positions. The transition's actual computed sticky offset participates in its progress calculation. Viewport changes, content resizing, and font readiness request a new measurement rather than refreshing layout every frame.

The driver does not require sequential `onEnter`/`onLeave` events. Jumping, reversing, dragging the native scrollbar, using a chapter fragment, and restoring browser history all resolve the currently requested position. Explicit text actions remain explicit actions; scrolling never commits or repeats them.

Textareas and marked local input regions are excluded from Lenis input capture. Anchor navigation focuses the destination heading and moves to the relevant chapter with a header offset. The browser's native document remains the underlying reading surface.

## Reduced motion, pause, and lifecycle

`html[data-motion]` records the effective motion mode. The effective value combines the user's preference with `prefers-reduced-motion`; a system reduced-motion request always wins.

With motion paused or reduced, Lenis is destroyed and native scrolling is used. CSS provides static alternatives while retaining all ten chapters, readable text, the light experiment, and the sentence controls. Re-enabling motion rebuilds the coordinator around the current reading position.

The scroll loop stops work while the document is hidden. When the tab returns, the coordinator remeasures and synchronises to the current position rather than replaying a large elapsed interval. Resize observers and listeners are released by `destroy()`; the development hot-reload hook disposes the old controllers.

## Local audio

`ambient.ts` generates a short stereo buffer of filtered rolling noise and soft paired wheel taps. It loops through Web Audio only after the reader deliberately enables sound. There are no audio downloads, microphone access, sound recordings, or recurring JavaScript scheduling timers.

Audio starts muted after every reload. Muting or hiding the tab stops the source and suspends the context. Returning to a visible tab may resume a sound the reader already enabled. Revision guards prevent a late `resume()` result from overriding a later mute request. Unsupported or rejected audio activation leaves the control in a truthful unavailable/off state.

## Images, fonts, and failures

Runtime scene images are already prepared in `public/assets/`, with responsive sizes and lightweight previews. Main images and their alternatives belong to their own picture elements. A late resource response cannot take over a different chapter's picture slot.

If an image fails, the local resource handler tries its fallback, then an embedded preview from the asset manifest. If these fail as well, an English scene description and the full HTML story remain available. An online event can retry the original sources. Font stacks retain readable fallbacks if a bundled font cannot load.

Fonts are resolved from the pinned Fontsource packages and bundled during production builds. All runtime images are served from the application. Original image-generation paths and prompts are retained for provenance, but the ordinary build does not read an external generation folder or require the generation tool. The optional preparation utility is an authoring tool, not a build dependency.

## Clipboard and focus

Copy uses the sentence committed when the button was clicked. Success is reported only after the browser clipboard write succeeds. A rejection reveals selectable text in that same notes component, using its local copy status and fallback elements. A delayed response does not reclaim focus after the reader moves away.

The chapter menu is a native disclosure. Escape closes it and returns focus to the summary. Clicking an interactive element outside it closes the menu while preserving the clicked element's focus. Clicking a noninteractive backdrop may return focus to the summary.

## Build and package boundaries

`package-lock.json` is the dependency authority for `npm ci`. Vite uses a relative asset base and produces static files in `dist/`. Serve those files over HTTP; direct `file://` loading is not supported.

The package's standard build consumes the source, ready-made `public/` assets, and installed dependencies. It does not regenerate artwork. Windows launchers use their own quoted directory, check the Node major version, and run only npm installation/build/serve commands; they do not change system policy or install a shell/runtime.

## Verification boundaries

`tests/state.test.ts` checks the pure state, persistence/error paths, text boundary behaviour, ownership sequence, and replay independence. Type checking and bundling are separate from that test suite.

`tests/viewport.html` is a same-origin iframe harness, with its distributable copy in `public/qa/viewport.html`. Vite copies that public file into `dist/qa/viewport.html`, exposing it at `/qa/viewport.html`. It can set exact CSS frame dimensions and position the real app at a chapter or transition phase. Scaling the iframe for display does not change its internal CSS viewport. Keep the source and public copies in sync when editing the harness.

The harness does not emulate a phone, touch input, a soft keyboard, device pixel ratio, a different rendering engine, network throttling, or physical display resolution. It is a layout inspection aid, not a device certification tool. Actual browser interactions, images, animated boundaries, error recovery, and physical-device coverage must be identified in the final verification report. This architecture document does not assert that those checks passed.
