# FOSSIL — AI Assets Notice

## Material covered

This notice identifies the generated raster imagery included with **FOSSIL — Deep Time in Stone**:

- Ten scene concepts in `reference/01-specimen.png` through `reference/10-deep-time.png`, with their named scene filenames.
- Seven production-generation PNG originals in `assets/ai-originals/`.
- Seven corresponding production WebP images in `assets/images/`.
- Composites, masks, or presentation surfaces that incorporate those images.

These images were generated for this project with the built-in OpenAI image-generation tool. Exact generation and edit prompts are retained as `.prompt.txt` sidecars. The amber scene also retains its refinement prompt. Clean production plates were generated or edited from the approved project concepts; they are not licensed stock photography or photographs downloaded from a museum.

## Identity and factual status

The fossil, stone, resin, preparation, and archive subjects are interpretive visual studies. They do not depict a verified museum accession, a measured fossil, an identified collecting site, or a documented scientific CT acquisition. The internal study identifier `FSL—001` belongs to the artwork. No geological age, provenance locality, scanner calibration, or species diagnosis is assigned.

AI concept images of scanning and reconstruction are visual-development references. The website's interactive scan and volume are generated from a separate deterministic synthetic field; neither the concept images nor the field constitute scientific observations.

The sources listed in `docs/RESEARCH.md` supplied factual background. Their photographs and real scan data were not incorporated into the delivered imagery. No institutional affiliation, endorsement, or museum media license is claimed.

## Relationship to other licenses

The root MIT license is the license for the project's original code, documentation, vector artwork, and authored synthetic data/model outputs. It does **not** relicense these generated raster images, third-party fonts, or third-party software.

This file is a source and interpretation notice. It does not assert that the generated images are public domain, exclusively human-authored works, or assets released under a museum's open-access policy. It does not promise exclusive rights in generated imagery. Rights associated with AI service outputs remain subject to the applicable service terms and applicable law; this notice does not replace them.

When continuing work on this exhibit, retain the prompts and source relationships so generated material remains identifiable. The notices for Lenis, the three font families, and the Three.js-derived Marching Cubes table remain separate.

## Production conversion

The final WebP files are encoded from their same-named generation PNG originals with `ffmpeg` / `libwebp`, `-quality 91 -compression_level 6`. The conversion preserves image dimensions and existing alpha without cropping or resampling. It is a WebP encoding step, not a claim of lossless RGB equivalence. Adding textual provenance metadata does not create a new photographic or scientific source.

See `docs/PROVENANCE.md` for the seven source-to-production mappings and `docs/ASSET-MANIFEST.json` for the final file inventory, hashes, and metadata.
