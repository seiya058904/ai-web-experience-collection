# RALLY — implementation design

## Selected direction

Low-angle clay-court editorial photography, tactile ball felt, cream geometric type, generous air. H-A supplies the direction, H-D the desktop production still and H-M an independently composed phone image. H-B remains a spatial reference; H-C becomes the preparation photograph. Generated images contain no interface text.

## Tokens

Clay `#C96D4C`, cream `#F4F0E4`, cool blue `#C6E2E7`, ball yellow `#DDEA54`, navy `#243840`. Display: locally bundled Barlow Condensed 600/700; text and controls: DM Sans 400/500/600. No remote font calls. Flat editorial bands, generous 5–7vw gutters, thin court-line dividers, square controls with 2px corner softening, explicit focus rings.

## Composition and rhythm

01: full photographic hero and restrained English copy. 02: cream editorial split with close preparation still and positional inset. 03: focused racket/ball contact study on warm clay. 04: navy macro-ball plate with a live side-profile comparison. 05: cream panoramic net-clearance study. 06: tactile clay bounce close-up and three contact states. 07: open cream spatial study with overhead court. 08: navy court and two meaningful route choices. 09: cream deterministic replay with four contact events. 10: quiet closing court and branch-specific downloadable result.

## Hero copy allowlist

RALLY; The space between; Chapters; Sound off; Sound on; The space / between.; Two people. One ball. A little room to choose.; Follow the rally; Explore the positions; A shared court, in ten moments.; Scroll to begin; A / Near side; B / Far side; The ball is enlarged for observation.

## Media rules

The hero and photographic stills remain single images with their original ball; no animated second ball is drawn over them. Exact flight/ground/contact studies are separate code-native scenes with one ball. Natural photographic shade provides title contrast; no tinted wash over the hero. SVG courts use physics coordinates rather than inferred photograph pixels. Generated player cutouts are editorial positional studies, not motion-capture performance. The explanatory macro ball is explicitly enlarged.

## Motion/state plan

One Lenis instance, one application RAF, native scrolling in reduced-motion mode. All scene progress is derived from current scroll geometry; replay is an explicit local timeline. Every chapter has an anchor and can be entered directly. Adjacent transitions preserve an identified line/ball/mark through a scroll-controlled bridge. No scroll locks or mandatory playback. Comparison state does not alter main or branch state. Returning to the hero preserves choices.

## Mobile

Independent H-M composition, title in dark upper air, ball in lower half. Scenes become vertically stacked, never shrink below usable labels. Choice buttons occupy full width. Replay events wrap into a two-column sequence. All chapters and export remain present. Reduced motion uses discrete contact states and native scroll.
