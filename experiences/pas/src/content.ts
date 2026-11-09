/**
 * PAS — English editorial canon.
 * Narrative times use [0, 10]; a chapter begins at id - 1.
 * A chapter’s main content occupies local 0–0.76; its handoff occupies 0.76–1.
 * The final chapter has no outgoing handoff.
 */
export interface ChapterBeat {
  title: string;
  text: string;
}

export interface ChapterStep {
  label: string;
  description: string;
  t: number;
}

export interface Chapter {
  id: number;
  slug: string;
  title: string;
  lead: string;
  beats: [ChapterBeat, ChapterBeat];
  caption: string;
  detail: string;
  alt: string;
  steps: ChapterStep[];
}

export const WORK = {
  "title": "PAS",
  "subtitle": "The distance between two people",
  "opening": "One body makes a movement. Another gives it an answer.",
  "ending": "The distance remains. The waiting has changed.",
  "description": "An original duet in ten movements. Scroll to follow Cen and Cheng through attention, contact, shared weight and release.",
  "observationNote": "An imagined duet for looking, not a movement lesson."
} as const;

export const DANCERS = {
  "cen": {
    "name": "Cen",
    "description": "An adult fictional dancer with dark hair tied low, a rust-red practice shirt, charcoal trousers and bare feet."
  },
  "cheng": {
    "name": "Cheng",
    "description": "An adult fictional dancer with short curls, a sand-grey practice shirt, charcoal trousers and bare feet."
  }
} as const;

export const CHAPTERS: Chapter[] = [
  {
    "id": 1,
    "slug": "between",
    "title": "Between",
    "lead": "A hand is offered into the space between them. Before the second hand moves, there is a smaller answer: a glance, a shoulder, a decision to attend.",
    "beats": [
      {
        "title": "An offer",
        "text": "Cen holds one hand in the space between them."
      },
      {
        "title": "An answer",
        "text": "Cheng notices, turns slightly, then lifts a hand."
      }
    ],
    "caption": "An offered hand. An answer, not yet a touch.",
    "detail": "The feet stay where they are. The hands remain apart.",
    "alt": "Cen in rust-red and Cheng in sand-grey stand facing one another on a matte floor. Cen offers a hand; Cheng begins to respond without touching.",
    "steps": [
      {
        "t": 0.08,
        "label": "An offer",
        "description": "Cen offers a hand while Cheng remains still."
      },
      {
        "t": 0.22,
        "label": "Notice",
        "description": "Cheng notices before lifting a hand."
      },
      {
        "t": 0.68,
        "label": "An answer",
        "description": "Both hands are raised, with a gap still between them."
      }
    ]
  },
  {
    "id": 2,
    "slug": "ground",
    "title": "Ground",
    "lead": "Every reach begins somewhere else. Watch the feet as Cen shifts a little weight, then settles, while Cheng remains rooted in a separate, attentive stance.",
    "beats": [
      {
        "title": "Standing",
        "text": "Both dancers settle through their bare feet."
      },
      {
        "title": "A small shift",
        "text": "Cen shifts weight, then steadies. Cheng stays and watches."
      }
    ],
    "caption": "Before reaching, there is somewhere to stand.",
    "detail": "These marks show contact with the floor, not measured force. Both dancers remain in view.",
    "alt": "Both dancers' bare feet meet the same floor. Cen makes a small weight shift while Cheng remains steady.",
    "steps": [
      {
        "t": 1.08,
        "label": "Standing",
        "description": "Both dancers settle through their feet."
      },
      {
        "t": 1.38,
        "label": "Shift",
        "description": "Cen makes a small transfer of weight."
      },
      {
        "t": 1.7,
        "label": "Settle",
        "description": "Cen returns to a steady stance while Cheng watches."
      }
    ]
  },
  {
    "id": 3,
    "slug": "one-palm",
    "title": "One Palm",
    "lead": "The palms meet lightly. A small change in one forearm travels through the other elbow and shoulder, turning a point of contact into a direction both bodies can read.",
    "beats": [
      {
        "title": "First contact",
        "text": "Two palms meet without gripping."
      },
      {
        "title": "A direction received",
        "text": "Cen turns the forearm. Cheng answers through the elbow and shoulder."
      }
    ],
    "caption": "A small change travels beyond the hand.",
    "detail": "A light touch, with no outward pull. Watch the shoulder answer the hand.",
    "alt": "The dancers' palms meet lightly. As Cen changes the forearm's direction, Cheng responds through the elbow and shoulder.",
    "steps": [
      {
        "t": 2.05,
        "label": "Contact",
        "description": "Two palms meet without gripping."
      },
      {
        "t": 2.36,
        "label": "Direction",
        "description": "Cen changes the forearm’s direction."
      },
      {
        "t": 2.48,
        "label": "Response",
        "description": "Cheng receives the change through the elbow and shoulder."
      }
    ]
  },
  {
    "id": 4,
    "slug": "counterweight",
    "title": "Counterweight",
    "lead": "A clear grip gives the two bodies a temporary connection. They lean only a little, keeping their own footing, then return their weight before the hands come apart.",
    "beats": [
      {
        "title": "A grip",
        "text": "One hand from each dancer closes into a clear hold. Both keep their feet on the floor."
      },
      {
        "title": "Out and back",
        "text": "They lean slightly apart, then return their weight over their own feet."
      }
    ],
    "caption": "Each has a footing. For a moment, they also have each other.",
    "detail": "The grip forms before the outward lean. Their free hands balance the movement. Weight returns before the hands separate.",
    "alt": "Cen and Cheng hold one another with one hand each and lean gently apart. Both dancers' feet remain planted; their free hands balance the shared shape.",
    "steps": [
      {
        "t": 3.04,
        "label": "A shared hold",
        "description": "The one-hand grip connects the two dancers."
      },
      {
        "t": 3.42,
        "label": "Counterweight",
        "description": "Both lean gently away while keeping their feet on the floor."
      },
      {
        "t": 3.9,
        "label": "Return",
        "description": "Each dancer receives their own weight before the hands release."
      }
    ]
  },
  {
    "id": 5,
    "slug": "unison-echo",
    "title": "Unison / Echo",
    "lead": "The movement stays the same: lift, turn, return. Change only the interval between its two beginnings, and watch what becomes visible when an answer arrives a little later.",
    "beats": [
      {
        "title": "Unison",
        "text": "Two separate bodies lift, turn and return together."
      },
      {
        "title": "Echo",
        "text": "Cen begins. Cheng follows a moment later. The phrase itself stays the same."
      }
    ],
    "caption": "What changes when an answer takes its time?",
    "detail": "No contact. The interval is the only change. Both versions arrive at the same ending.",
    "alt": "The dancers perform the same independent arm lift, turn and return. In Unison they begin together; in Echo, Cheng begins after Cen.",
    "steps": [
      {
        "t": 4.04,
        "label": "Begin",
        "description": "The independent phrase begins."
      },
      {
        "t": 4.28,
        "label": "Open",
        "description": "The arms open at the selected interval."
      },
      {
        "t": 4.47,
        "label": "Turn",
        "description": "Each dancer continues the same turning phrase."
      },
      {
        "t": 4.76,
        "label": "Return",
        "description": "Both versions arrive at the same ending stance."
      }
    ]
  },
  {
    "id": 6,
    "slug": "make-room",
    "title": "Make Room",
    "lead": "Two paths begin to meet. Cheng shortens a step and moves aside, making enough room for Cen to pass before continuing through the space left open.",
    "beats": [
      {
        "title": "Approaching",
        "text": "Their paths begin to meet."
      },
      {
        "title": "Room to pass",
        "text": "Cheng shortens a step and moves aside. Cen passes; Cheng follows through the space left open."
      }
    ],
    "caption": "One path changes. Two people pass.",
    "detail": "Cheng makes room. The line shows only the path already travelled.",
    "alt": "The dancers approach along intersecting paths. Cheng shortens a step and moves into depth to let Cen pass, then continues. They exchange positions without crossing through each other.",
    "steps": [
      {
        "t": 5.06,
        "label": "Approach",
        "description": "Two paths begin to meet."
      },
      {
        "t": 5.16,
        "label": "Make room",
        "description": "Cheng's shorter step opens a path for Cen."
      },
      {
        "t": 5.76,
        "label": "Exchanged",
        "description": "Both dancers have passed and exchanged positions."
      }
    ]
  },
  {
    "id": 7,
    "slug": "lower-together",
    "title": "Lower Together",
    "lead": "After passing, small settling steps bring their backs together. Knees and hips soften in response, lowering two distinct bodies towards a ground that continues to support them both.",
    "beats": [
      {
        "title": "Back to back",
        "text": "Their backs meet after passing. Their feet find a stable place."
      },
      {
        "title": "A shared descent",
        "text": "Knees and hips soften together. They pause low, ready to rise."
      }
    ],
    "caption": "The ground receives what two backs share.",
    "detail": "Contact is between the backs, not the necks. The feet stay planted as both dancers lower.",
    "alt": "After exchanging places, Cen and Cheng stand back to back. With both dancers' feet planted, they bend their knees and hips together into a modest shared low position.",
    "steps": [
      {
        "t": 6.07,
        "label": "Back to back",
        "description": "Their backs meet after passing, with both sets of feet settled."
      },
      {
        "t": 6.5,
        "label": "Lower",
        "description": "Both dancers pause in a modest shared low position."
      },
      {
        "t": 6.94,
        "label": "Rise",
        "description": "Both rise before back contact releases."
      }
    ]
  },
  {
    "id": 8,
    "slug": "a-complete-phrase",
    "title": "A Complete Phrase",
    "lead": "They rise, receive their own weight and turn side by side. Cen waits while Cheng passes and looks back. One brief touch gathers the whole phrase into its ending.",
    "beats": [
      {
        "title": "Finding their own weight",
        "text": "They rise, release their backs and turn side by side. One step offsets their shoulders."
      },
      {
        "title": "A pause received",
        "text": "Cen waits as Cheng passes half a body-length and turns back. Their hands meet for a moment."
      }
    ],
    "caption": "Rise. Part. Pass. Meet, briefly.",
    "detail": "Back contact releases as each dancer finds independent support. A pause leaves room for the other body. The phrase ends at one small contact.",
    "alt": "The dancers rise from their shared low position and release their backs. They turn side by side, stagger a step, then Cheng passes and looks back while Cen waits. Their hands meet briefly.",
    "steps": [
      {
        "t": 7.1,
        "label": "Release",
        "description": "Back contact has released as each dancer accepts their own weight."
      },
      {
        "t": 7.24,
        "label": "Side by side",
        "description": "Both dancers stand independently, with parallel shoulders."
      },
      {
        "t": 7.51,
        "label": "Offset",
        "description": "Parallel shoulders become staggered as Cheng passes Cen."
      },
      {
        "t": 7.98,
        "label": "Meet",
        "description": "Their hands meet briefly at the end of the phrase."
      }
    ]
  },
  {
    "id": 9,
    "slug": "let-go",
    "title": "Let Go",
    "lead": "Both dancers find their own support before the final fingers separate. Across the returning gap, a small movement of the shoulder and arm still finds an answer.",
    "beats": [
      {
        "title": "Release",
        "text": "Both stand in their own weight. The last fingers separate."
      },
      {
        "title": "An answer across the gap",
        "text": "A small shoulder-and-arm movement in one body receives an answer in the other."
      }
    ],
    "caption": "The touch ends. The attention does not have to.",
    "detail": "Watch Cen's shoulder begin the movement. Watch Cheng answer after the hands have parted.",
    "alt": "Cen and Cheng stand in independent support as the final hand contact releases. Across the returning gap, Cheng responds to a small movement in Cen's shoulder and arm.",
    "steps": [
      {
        "t": 8.07,
        "label": "Independent",
        "description": "Both dancers stand in their own weight while the last fingertips still meet."
      },
      {
        "t": 8.3,
        "label": "Let go",
        "description": "The last touch has opened into a small gap."
      },
      {
        "t": 8.61,
        "label": "Answer",
        "description": "Cheng answers a small movement in Cen’s shoulder and arm."
      }
    ]
  },
  {
    "id": 10,
    "slug": "here-again",
    "title": "Here, Again",
    "lead": "The space between them resembles the beginning. Their hands and shoulders have changed. Look again at a moment of contact, shared weight or delay, following either dancer.",
    "beats": [
      {
        "title": "A familiar distance",
        "text": "They stand apart again. The space resembles the opening; the hands and shoulders do not."
      },
      {
        "title": "Look once more",
        "text": "Return to a moment of contact, counterweight or delay. Follow either dancer's response."
      }
    ],
    "caption": "The distance remains. The waiting has changed.",
    "detail": "The opening and ending share a place, not an identical pose. Your Unison or Echo choice is kept when you return.",
    "alt": "Both dancers stand at a distance comparable with the opening. Their hand and shoulder directions have changed. The floor, light and proportions remain familiar.",
    "steps": [
      {
        "t": 9.18,
        "label": "A familiar distance",
        "description": "The dancers stand apart in a composition that recalls the opening."
      },
      {
        "t": 9.7,
        "label": "Here, again",
        "description": "Their hands and shoulders carry the difference into stillness."
      }
    ]
  }
];

export const UI = {
  "chapters": "Chapters",
  "closeChapters": "Close chapters",
  "begin": "Enter the duet",
  "continue": "Continue",
  "previous": "Previous moment",
  "next": "Next moment",
  "pause": "Pause",
  "play": "Play",
  "replay": "Watch again",
  "reset": "Reset",
  "pauseBreath": "Pause gentle motion",
  "resumeBreath": "Resume gentle motion",
  "motion": "Motion",
  "motionFull": "Full motion",
  "motionReduced": "Step by step",
  "motionSystem": "Follow system",
  "soundOn": "Sound on",
  "soundOff": "Sound off",
  "backToScroll": "Return to scrolling",
  "backToBeginning": "Return to the beginning",
  "overview": "Show the full duet",
  "closeOverview": "Close full duet",
  "skip": "Skip to the duet",
  "loading": "Preparing this moment…",
  "imageFallback": "This moment is shown as a still. The chapter and its controls remain available.",
  "renderFallback": "The animated view is unavailable. Explore the duet one moment at a time.",
  "imageUnavailable": "The image could not be loaded. The description of this moment remains below.",
  "focusCen": "Watch Cen",
  "focusCheng": "Watch Cheng",
  "scroll": "Scroll to follow the movement",
  "scrollShort": "Scroll to continue",
  "indexTitle": "Ten movements",
  "chapterLabel": "Movement",
  "chapterNavigation": "Choose a movement",
  "progressLabel": "Duet progress",
  "sceneLabel": "Cen and Cheng — the duet",
  "observations": "Watching notes",
  "openNotes": "About this duet",
  "closeNotes": "Close notes",
  "unison": "Unison",
  "echo": "Echo",
  "unisonDescription": "The same phrase begins at the same time.",
  "echoDescription": "Cheng begins after Cen. Both complete the same phrase.",
  "resetUnison": "Reset to Unison",
  "playPhrase": "Play the phrase",
  "watchWholePhrase": "Watch the whole phrase",
  "floorContact": "Show floor contact",
  "hideFloorContact": "Hide floor contact",
  "floorContactDescription": "These marks show contact with the floor, not measured force.",
  "contact": "Look at the contact",
  "beforeLean": "Before the lean",
  "duringLean": "During the lean",
  "path": "Show the path",
  "hidePath": "Hide the path",
  "pathDescription": "The line shows only the path already travelled.",
  "opening": "The opening",
  "ending": "The ending",
  "returnOnePalm": "Return to One Palm",
  "returnCounterweight": "Return to Counterweight",
  "returnTiming": "Return to Unison / Echo",
  "cenFocus": "Watch the shoulder begin, then the arm follow.",
  "chengFocus": "Watch the answer arrive after the hands have parted.",
  "paused": "Paused",
  "playing": "Playing",
  "ended": "The phrase is complete.",
  "stepLabel": "Choose a moment",
  "stepHint": "Choose a moment to see its pose.",
  "reduceMotionDescription": "Explore the same duet through still moments.",
  "fullMotionDescription": "Follow the continuous movement as you scroll.",
  "motionPaused": "Gentle motion is paused.",
  "motionResumed": "Gentle motion has resumed.",
  "contactModeUnavailable": "The timing choices are available in Unison / Echo, when the dancers are apart.",
  "retry": "Try again",
  "overviewLabel": "Full-body view of both dancers",
  "close": "Close",
  "sourceNote": "The characters and choreography are fictional. This is a work for observation, not a movement lesson.",
  "soundDescription": "A quiet original soundscape. The duet is complete in silence."
} as const;
