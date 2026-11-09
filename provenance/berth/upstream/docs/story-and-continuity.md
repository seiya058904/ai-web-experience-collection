# BERTH — story, English copy, and continuity

This is the content and continuity specification for the implementation. It records intended narrative states and acceptance conditions; it does not claim that an image, transition, or test has passed. Canonical interface-facing copy is exported by `src/story.ts`.

## 1. The story in one paragraph

Shen Ning, twenty-nine, is travelling overnight to Linwan to lead her first community writing class. Twelve pages of preparation are ready; her first spoken sentence is not. Ms. Lin, sixty-one, occupies the lower berth. It is her first day of retirement, and she is making her first solo trip to the sea. They make room for each other without becoming each other’s life coaches. A lamp shade is turned. Two small cards are shared. They sleep. In the morning, Ning has an opening sentence and a note from her neighbour; she is still nervous. The two leave the same ordinary compartment for different ordinary mornings.

All characters, locations, story times, and dialogue are fictional. The work contains no real train service, booking, route, or travel recommendation. Reading time is independent of the displayed story times.

## 2. Canonical names and words

| Item | English form | Use |
| --- | --- | --- |
| Work | **BERTH** | All titles and metadata |
| Subtitle | **One night. Ten quiet moments.** | The English rendering of the requested subtitle |
| Protagonist | **Shen Ning** | First introduction and opening sentence; **Ning** after introduction |
| Neighbour | **Ms. Lin** | All narration and attribution; never randomly switch to Mrs. Lin, Lin Ning, or Professor Lin |
| Destination | **Linwan** | A fictional city; one consistent spelling |
| Space | **Compartment Seven** | Visible chapter title; **07** may be used as a compartment number |
| Handout | **Lesson One: How to Ask a Good Question** | Accurate DOM text, not lettering baked into an image |
| Blank line | **Opening** | Remains blank in CH-01 and unfinished in CH-03 regardless of later saved user choices |
| Margin reminder | **Tomorrow: my first community writing class.** | CH-03 handout |
| Retired character’s possession | **Ms. Lin’s note** | Not a letter from an unnamed third character |
| Visitor’s possession | **Ning’s first line** | The sentence on Ning’s distinct card |

### Fixed lines

| Location | Exact copy |
| --- | --- |
| CH-02 lamp offer | Shall I turn the light towards you? |
| CH-03 abandoned opening 1 | Welcome, everyone, to this course. |
| CH-03 abandoned opening 2 | When we talk about writing, we must first… |
| CH-04 partial reveal | Tomorrow, I won’t have to hurry for the bell. |
| CH-05 explanation | Today was my first day of retirement. I’m going to see the sea. |
| CH-05 card request | May I borrow one? Just to write something down. |
| Default opening | Good morning. I’m Shen Ning. |
| Opening option 2 | Today, let’s begin with a question. |
| Opening option 3 | It’s all right to write a little slowly. |
| Ms. Lin’s fixed note | The first good morning doesn’t need notes. |
| CH-09 question | The sea first? |
| CH-09 answer | Yes. No bell today. |
| Closing line | The night didn’t write tomorrow for her. It only left her a first line. |

The greeting and fixed note are constants. CH-07, CH-09, CH-10, copy controls, reset controls, and any export must consume the same values. A visitor’s custom text remains exactly their text; never translate it, run it through a sentiment service, or render it as HTML.

## 3. Fixed physical layout

Viewed from the open doorway, the two fixed berths run along the **right** wall. The ladder is at their near, doorway end. **Ning has the upper berth for the entire night; Ms. Lin has the lower berth.** A rounded window is at the far end; the small table is directly below it. The left side contains the narrow usable aisle and wall hooks. The lamp remains in its fixed table/window area; tilting its shade does not teleport the lamp base.

The compartment is modest and small enough to be credible. Do not enlarge it for a two-person composition, mirror the bed wall between images, add a second window, place a camera inside a mattress, or put both women on the same bed to simplify a scene. The closing camera returns to the opening doorway axis.

Character continuity:

- **Shen Ning:** 29; short dark-brown hair; cream knitted cardigan; dark trousers; grey-green canvas bag.
- **Ms. Lin:** 61; short silver-grey hair; dark-blue top; fine-framed glasses; plain travel bag. Her glasses may leave her face only during the documented sleep interval.
- Age, skin tone, body type, garments, and facial identity remain stable across all generated images. Small tired or relaxed expressions are sufficient; no melodramatic crying or exaggerated gestures.

## 4. Object identities

| Logical identity | Physical meaning | Invariant |
| --- | --- | --- |
| `handout-ning` | Ning’s twelve prepared pages | One stack; clip attached until CH-09 |
| `clip-01` | One orange-red paper clip | Begins on the handout; ends joining the two cards; never duplicates |
| `card-ning` | The card Ning keeps in CH-05 | Blank until CH-07; goes upstairs with her, then downstairs in CH-08 |
| `card-lin` | The card Ning lends to Ms. Lin in CH-05 | Written by CH-06; face down until CH-08; then given to Ning |
| `glasses-lin` | Ms. Lin’s fine-framed glasses | On her face, then beside her note, then back on her face |
| `bag-ning` | Grey-green canvas bag | Source of both blank cards; holds pages and both final cards at departure |
| `bag-lin` | Plain travel bag | Holds the sandals before CH-05, receives them again before sleep, leaves with Ms. Lin |
| `cup-ning` | Ning’s cup of water | Carried out and back by Ning in CH-04; remains at the table until packing |

The table has a consistent **Ms. Lin side** for her face-down card and glasses. It does not matter which pixel coordinate the final art chooses, provided the same location persists from CH-06 through the start of CH-08. Do not use one card image as proof that the same physical card occupies two places; the two cards are separate objects with distinct owners and histories.

### Position ledger

| Story phase | Handout and clip | Ning’s card | Ms. Lin’s card | Glasses | Other action |
| --- | --- | --- | --- | --- | --- |
| CH-01, 20:48 | Handout placed on table; `clip-01` attached | Still inside canvas bag | Still inside canvas bag | On Ms. Lin | Ning enters; canvas bag settles in her space |
| CH-02, 21:05 | Handout drawn slightly into shared lamplight; clip attached | In canvas bag | In canvas bag | On Ms. Lin | Shade tilts; base stays fixed |
| CH-03, 21:32 | On table; two rejected drafts; opening still unfinished; clip attached | In canvas bag | In canvas bag | On Ms. Lin | Lighting experiment is not a canonical story action |
| CH-04, 22:17 | Remains on table; clip attached | In canvas bag | In canvas bag | On Ms. Lin | Ning carries her cup to the corridor and returns with it |
| CH-05, before distribution | On table; clip attached | Taken from canvas bag | Taken from canvas bag | On Ms. Lin | Sandals visible in Ms. Lin’s open travel bag |
| CH-05, after distribution | On table; clip attached | Blank, beside Ning’s hand | Blank, received by Ms. Lin | On Ms. Lin | Cup on table; one card for each traveller |
| CH-06, before ascent | Gathered by Ning; clip still attached | Blank, gathered by Ning | Written, then placed face down on table | Placed beside Ms. Lin’s card | Sandals returned to travel bag |
| CH-06, after ascent | Along edge of upper berth; clip attached | Beside upper-berth pillow | Face down at same table position | Beside face-down card | Ning upstairs; Ms. Lin in lower berth; lamp dims |
| CH-07, 02:10 | At upper-berth edge; clip attached | By pillow, with current opening | Face down on table | On table beside card | Ms. Lin remains asleep |
| TR-07-08 middle | Still upstairs; clip attached | Still upstairs, with opening | Still face down on table | Still beside card | Only outside light changes |
| CH-08 entrance, 05:38 | Still upstairs; clip attached | Still upstairs | Still face down on table | Still beside card | Dawn reveals the same positions |
| CH-08 beat A, after descent | Carried down and placed at Ning’s side of table | Carried down with handout | Still at Ms. Lin’s table side | Still beside the former card position | Ning uses the existing ladder |
| CH-08 beat B | On table; clip attached | On table at Ning’s side | Turned face up and handed to Ning | Remains at same table position | Both cards meet only now |
| CH-09 clipping | Handout on table; `clip-01` removed | Joined to Ms. Lin’s note by `clip-01` | Joined to Ning’s opening by `clip-01` | Still on table, then put on | No additional clip appears |
| CH-09 packing | Unclipped pages enter canvas bag | Both cards enter inner pocket | Travels with Ning’s card | On Ms. Lin’s face | Cup and personal items removed; both bags ready |
| CH-10 departure | With Ning | With Ning | With Ning | With Ms. Lin | Ms. Lin exits first; Ning follows; table is clear |
| CH-10 revisiting notes | Off-scene, with Ning | Shown in a separate reading view | Shown in the same reading view | Off-scene, with Ms. Lin | Reading view is not a claim the cards returned to the empty table |

## 5. Ten chapter purposes and two-beat structure

The full prose is in `src/story.ts`. Every paragraph pair is part of the normal reading path, not a hidden optional disclosure. A default visitor who never touches a control must receive every necessary fact and reach the ending.

| Chapter | Time | Title | Beat A | Beat B |
| --- | --- | --- | --- | --- |
| 01 | 20:48 | Compartment Seven | Ning enters and settles her bag | The handout’s blank opening is revealed |
| 02 | 21:05 | A Little of the Light | The neighbours introduce themselves | Ms. Lin offers a little more light |
| 03 | 21:32 | Twelve Pages, One Blank Line | Ning’s first class is established | Two formal openings are crossed out |
| 04 | 22:17 | A Station We Don’t Stop At | Ning gets water and watches a small station pass | She hears the unexplained remark about the bell |
| 05 | 23:06 | Two Kinds of First Time | Retirement and the first solo sea trip are revealed | Two blank cards are distributed, one to each woman |
| 06 | 00:14 | The Compartment Goes Quiet | Ms. Lin leaves her note and glasses on the table | Ning carries her own papers/card upstairs; the light dims |
| 07 | 02:10 | Something Simple to Begin With | Ning wakes briefly and thinks of the class | Her card receives a chosen, custom, or default opening |
| 08 | 05:38 | Morning Finds the Same Room | Dawn arrives; Ning explicitly carries her papers/card down | Ms. Lin hands over her note |
| 09 | 06:12 | Two Cards, One Paper Clip | The original clip joins the two cards | They pack and name their separate next steps |
| 10 | 06:37 | The Light They Leave Behind | Both women leave through the doorway | The opening viewpoint returns in daylight; cards can be revisited separately |

The narrative does not imply that Ning’s anxiety has been cured, that Ms. Lin has become a sage, or that either woman changes the other’s life overnight. Concrete actions carry the emotional movement.

## 6. The nine transitions

Percentages are local progress within each boundary, not chapter lengths or real-time waits. All states must also resolve when entered directly or in reverse. A transition may be compressed for reduced motion, but its two endpoint facts and object positions remain present.

| Transition | 0% | 25% | 50% | 75% | 100% | Continuity anchor and risk |
| --- | --- | --- | --- | --- | --- | --- |
| TR-01-02 | Complete doorway composition | Doorframe shifts slightly; room depth becomes clearer | Window and lamp hold position as Ms. Lin becomes the focus | Ms. Lin looks up; her hand approaches the shade | Her offer of light is readable in full | Rounded window, lamp base, right-hand beds. Reveal her from an existing occlusion, never conjure her with opacity. |
| TR-02-03 | The neighbours and shared table | Shade tilts; local paper illumination changes | People remain behind the increasingly prominent handout | Both crossed-out drafts can be read | The table study and real lamp controls are stable | Lamp base and paper edge. Avoid turning the lamp into a circular transition mask. |
| TR-03-04 | Handout in the saved comparison lighting | Controls recede; “Back to this night” marks the handover | Doorframe enters while the local comparison returns to this moment’s story light | Narrow corridor window becomes visible | A modest station passes outside | Near doorframe and actual aisle. Saved comparison preference persists but cannot leak into later lighting. |
| TR-04-05 | Corridor and passing station | View turns towards the compartment doorway | Doorframe divides corridor from the lamp-lit table | Ning brings the cup in and sets it on the table | Ms. Lin’s bag and the blank cards enter the conversation | Same door and cup in Ning’s possession. The cup is never simultaneously in her hand and on the table. |
| TR-05-06 | Two women, two separately owned cards | Ms. Lin puts sandals away and holds her card | Her written card lands face down; glasses follow; Ning gathers her own card and pages | Ning carries those items up the fixed ladder as the light dims | Pages and Ning’s card are upstairs; Ms. Lin’s card and glasses remain downstairs | Bed edge hides required asset changes. Do not read or overwrite the CH-03 experiment setting. |
| TR-06-07 | Quiet upper-berth view | Near bedding moves back a little | Ning’s card and the distant window can both be located | Her thoughts enter a stable reading area | Card editor and sentence options are available | Pillow/card edge and same window. Ms. Lin remains asleep, paper does not emit light, typing does not force a chapter jump. |
| TR-07-08 | Deep blue window and the chosen opening | Chosen sentence stays saved; window becomes the matching centre | Grey-blue light arrives; upstairs/downstairs object positions remain unchanged | Daylight increases; the women wake | The entrance to the morning chapter is complete | Same window geometry, no facial double exposure, no teleporting papers. Descent and handover occur after this entrance in CH-08. |
| TR-08-09 | Note has been received; both cards and handout are at the table | Ning lifts her own card and Ms. Lin’s note together | Cards overlap without obscuring necessary words; original clip leaves handout | Cards are joined; view widens to packing | Both travellers are ready to leave | One physical clip, two cards. Text reads the current user state, including a late edit. |
| TR-09-10 | Both travellers and their packed belongings | Ms. Lin passes through the real doorway with her bag | Doorframe occludes her; the compartment begins to empty | Ning follows with pages and cards; view returns to the opening axis | Empty morning compartment; separate note-reading view available | The actual doorway provides occlusion. No fading people in a wide shot, no belongings respawning on the cleared table. |

## 7. Story state and visitor state

The currently viewed chapter and local progress determine narrative lighting, traveller positions, physical object positions, and which story facts have been disclosed. Explicit visitor actions determine the lighting **comparison preference**, the opening sentence, sound, and motion preferences. Moving the scroll position must not submit or duplicate a visitor action.

### The lamp study in CH-03

- Controls: **Reading**, **Soft**, **Off**. First visit defaults to **Soft**.
- The setting affects the local paper, nearby person, and window reflection. It must do more than recolour a button.
- Text and navigation retain their own readable contrast. **Off** never makes a black screen or blocks the story.
- Leaving CH-03 relinquishes local control to that moment’s narrative light. Returning restores the saved comparison choice.
- CH-06’s dimming and CH-08’s dawn never read or overwrite the comparison preference.

### The opening sentence in CH-07

- The default is a valid result. The visitor need not choose or type to continue.
- Predefined options, custom entry, undo, and reset all operate on one canonical saved sentence.
- Decide and display a practical maximum length. For Unicode, be explicit about whether the counter counts code points or graphemes; avoid splitting surrogate pairs or emoji sequences in truncation.
- Empty or whitespace-only committed input should visibly return to the default greeting, with an honest status message.
- Persist successfully before claiming “saved”. If storage is unavailable, keep the current in-memory value and explain that it lasts for this visit.
- User text is untrusted text: render with `textContent` or equivalent, preserve Chinese and other scripts, and do not inject it through `innerHTML`.
- CH-09 and CH-10 display the current canonical sentence. Editing after reaching the ending must immediately update both places.
- Copy the visitor’s opening only, not an invisible label or the neighbour’s note. On failure, expose selectable text and truthful instructions.
- Re-reading does not erase the visitor’s choice. Only an explicit reset changes it back to the default.

### Disclosure rules

Do not expose Ms. Lin’s retirement or sea trip before CH-05 in ordinary narrative copy. Her written note stays unreadable and face down until CH-08. The selected opening must not fill the original handout at CH-01 when the visitor scrolls backwards. Saved visitor state and the earlier physical story state are intentionally different.

## 8. Content and accessibility checks to execute

These are acceptance conditions, not recorded test results.

1. Count ten semantic chapter headings, ten distinct purposes, and twenty real beats. Verify the last three chapters contain as much usable story as the earlier ones.
2. Read all text visible in desktop, phone, and reduced-motion modes. Every site-authored label, error, caption, alternative text, accessible name, export label, and audio description is English.
3. Preserve literal user input in different scripts and special characters. Do not claim to know the user input’s language. Use suitable direction isolation where helpful.
4. Confirm the short spoken lines are attributable and remain readable without sound.
5. Check that images supplement the prose and object actions instead of containing the only accessible version of a necessary fact.
6. In the first and last scenes, compare window, ladder, beds, and table positions. At the end, separate the empty physical table from the optional reading view of cards Ning took away.
7. Exercise jump directly to CH-08, jump to CH-10, reverse to CH-03, and return to CH-01. No sequence-dependent action may be required to reconstruct a coherent scene.
8. Check all nine transitions in both directions, especially card ownership at TR-05-06 and the unchanged positions at TR-07-08.
9. Keep text in stable reading areas. No caption may cover a face or depend on a tiny inscription in an image.
10. Long custom text, font fallback, a phone keyboard, and 200% zoom must preserve all story facts and working controls.

## 9. Scope and evidence status

This file and `src/story.ts` deliver the canonical English story and its continuity contract. Actual generated-image selection, browser observations, build results, rendering comparisons, and remaining limitations belong in the project’s separate asset and validation records. Nothing here substitutes for inspecting the implemented webpage.
