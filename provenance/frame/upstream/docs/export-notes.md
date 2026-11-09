# Local exports

`src/export.ts` provides two downloads from the same click-time validated configuration. Callers supply already packaged frame assets and own the actual download link / object-URL lifecycle.

```ts
interface FramesProvider {
  load(frame: number, preset: SpacingPreset, camera: 'landscape' | 'portrait'): Promise<HTMLImageElement>;
  dataURL?(frame: number, preset: SpacingPreset, camera: 'landscape' | 'portrait'): Promise<string>;
}

const png: Blob = await exportStoryboard(currentConfig, provider);
const html: Blob = await exportFilm(currentConfig, provider);
```

Both functions copy and sanitize configuration **before their first await**. Later edits cannot alter a download already being prepared. Failed loads or encodes reject the operation; the UI must report the failure and allow a retry.

The provider receives all frame numbers and the frozen chosen preset explicitly. Baked paths are `frames/{landscape|portrait}/{take}-{NN}.webp`. Only frames 08–11 have alternate spacing assets; the provider should resolve every other frame to the shared `even` asset. Landscape frames are 1280×800; portrait frames are independently composed 720×800.

`dataURL` is optional. Providing the original baked WebP bytes as a data URL preserves them and avoids an extra canvas encode. Without it, the exporter loads each image through `load` and encodes it with a temporary canvas. At most four resource operations run concurrently. Embedded raster sources are validated; external, temporary and SVG URLs are rejected.

## PNG storyboard

The 1440×1800 sheet uses four columns and six rows, includes all 24 current-take frames, and preserves the full image bounds. It records the chosen spacing, both additional hold counts, total beats, actual duration, and display count beneath each pose. Images are fit rather than cropped, so the supporting feet and target remain visible.

## Standalone HTML film

The file contains 24 embedded landscape frames and 24 embedded portrait frames, the exact current beat table, all 24 English pose descriptions, responsive CSS and dependency-free playback JavaScript. There are no imports, fetches, remote fonts, CDNs or links back to the website. A restrictive content policy permits only the embedded images and inline style/script.

Playback starts only by explicit user action. Controls include play/pause, replay, previous/next distinct frame, and a slider that can inspect repeated display beats. Hidden tabs and an out-of-view film pause; returning never catches up wall-clock time. Reduced-motion preferences preserve the complete storyboard and manual controls. The film stays on the final frame when finished. A cancelled asynchronous preload cannot start playback later.

Pure helper APIs `createFilmPayload`, `createFilmHTML`, and `exportFilename` support independent verification without browser resources. Node tests verify structural self-containment, both camera payloads, exact hold counts/duration, configuration snapshot isolation, failure propagation, safe embedded raster URLs and valid JavaScript syntax. Actual baked image decoding, exported PNG appearance, file:// playback and browser controls require separate browser verification.
