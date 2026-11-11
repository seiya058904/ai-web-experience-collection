import { FRAGMENTS, PIECE_IDS, type PieceId } from './fragments.ts';
import type { StoryMemory } from './story-state.ts';

/** Native 1586 × 992 stage coordinates. A piece pose transforms the original
 * fragment path as translate(x y) scale(scale); x/y are never its centroid. */
export type PaperPose = Readonly<{ x: number; y: number; scale: number }>;
export type MiraPlacement = PaperPose & Readonly<{
  pose: 'stand' | 'walk' | 'reach' | 'mend';
  lamp: boolean;
}>;

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

/** The existing native puppet placements. Her front hand keeps the lamp;
 * the carrier attaches to the separate back hand. No camera values live here. */
export function miraPlacement(index: number, memory: Readonly<StoryMemory>, mobile: boolean): MiraPlacement | null {
  switch (index) {
    case 4: return { x: mobile ? 1005 : 984, y: mobile ? 669 : 644, scale: mobile ? .70 : .80, pose: memory.marketRepaired ? 'stand' : 'reach', lamp: true };
    case 5: return { x: mobile ? 1145 : 1192, y: 600, scale: mobile ? .65 : .63, pose: memory.wheelSteady ? 'stand' : 'reach', lamp: true };
    case 6: return { x: mobile ? 970 : 908, y: mobile ? 685 : 647, scale: mobile ? .62 : .67, pose: memory.shadeLifted ? 'stand' : 'reach', lamp: true };
    case 7: return { x: 1072, y: 345, scale: .77, pose: 'walk', lamp: true };
    default: return null;
  }
}

/** Actual back-arm grip from miraBody, rotated about its pinned shoulder.
 * Returning the puppet scale lets the holder use one fixed material geometry. */
export function handPose(placement: MiraPlacement): PaperPose {
  const angle = (placement.pose === 'walk' ? 11 : -8) * Math.PI / 180;
  const dx = 49 - 65, dy = 194 - 130;
  const x = 65 + dx * Math.cos(angle) - dy * Math.sin(angle);
  const y = 130 + dx * Math.sin(angle) + dy * Math.cos(angle);
  return { x: placement.x + x * placement.scale, y: placement.y + y * placement.scale, scale: placement.scale };
}

/** Holder-local origin is the strap's contact with Mira's free hand. Its
 * paper body extends left and down, ending above the existing boot baseline.
 * On the worktable it sits right of the disc, below the lantern and above the
 * phone feedback band. It never participates in the joined sun's geometry. */
export function carrierPose(index: number, memory: Readonly<StoryMemory>, mobile: boolean): PaperPose | null {
  if (index === 8) return { x: 1410, y: 722, scale: .88 };
  const placement = miraPlacement(index, memory, mobile);
  if (!placement) return null;
  const hand = handPose(placement);
  return { x: hand.x, y: hand.y, scale: hand.scale * .8 };
}

/** Fixed slots keep the three outlines separate. All coordinates below are
 * holder-local centroids; this helper converts them back to path origins. */
const SLOTS: Readonly<Record<PieceId, Readonly<{ x: number; y: number }>>> = {
  A: { x: -121, y: 47 },
  B: { x: -75, y: 52 },
  C: { x: -29, y: 47 },
};
const SLOT_SCALE = .30;

export function piecePoseInCarrier(id: PieceId, holderPose: PaperPose): PaperPose {
  const slot = SLOTS[id], centroid = FRAGMENTS[id].centroid;
  const scale = holderPose.scale * SLOT_SCALE;
  return {
    x: holderPose.x + slot.x * holderPose.scale - centroid.x * scale,
    y: holderPose.y + slot.y * holderPose.scale - centroid.y * scale,
    scale,
  };
}

/** A held discovery keeps its own piece at the source fixture. The moving
 * handoff can take that ID over using the same exact pose. This preserves the
 * reveal action instead of silently replacing it with a pre-filled bag. */
export function sourceFixturePose(index: number, id: PieceId, memory: Readonly<StoryMemory>): PaperPose | null {
  if (!memory.found.includes(id)) return null;
  if (index === 4 && id === 'A' && memory.marketRepaired) return { x: 1171, y: 547, scale: .55 };
  if (index === 5 && id === 'B' && memory.wheelSteady) return { x: 1095, y: 360, scale: .95 };
  if (index === 6 && id === 'C' && memory.shadeLifted) return { x: 1055, y: 485, scale: 1.32 };
  return null;
}

/** IDs actually owned by the held carrier. The worktable deliberately offers
 * every unplaced piece, including a direct/skip visit, as its existing repair
 * controls do. A placed ID belongs only to the root's single joined disc. */
export function carrierPiecesForScene(index: number, memory: Readonly<StoryMemory>): readonly PieceId[] {
  if (index === 8) return PIECE_IDS.filter(id => !memory.placed.includes(id));
  if (index < 4 || index > 7) return [];
  return PIECE_IDS.filter(id => memory.found.includes(id) && !sourceFixturePose(index, id, memory));
}

/** One held world pose per ID. Use this for both source and destination;
 * never draw the fixture and the carrier representation of an ID together. */
export function scenePiecePose(index: number, id: PieceId, memory: Readonly<StoryMemory>, mobile: boolean): PaperPose | null {
  if (index === 8 && memory.placed.includes(id)) return null;
  if (index !== 8 && !memory.found.includes(id)) return null;
  const fixture = sourceFixturePose(index, id, memory);
  if (fixture) return fixture;
  const holder = carrierPose(index, memory, mobile);
  return holder ? piecePoseInCarrier(id, holder) : null;
}

/** Self-contained, opaque paper holder. Definitions are deterministic and
 * namespaced by the caller's unique prefix. No timing, opacity envelope or
 * shape substitution occurs in this renderer. */
export function renderCarrierBody(prefix: string): string {
  const id = `${safeId(prefix)}-carrier-holder`;
  const d = 'M-150 23Q-77 5 1 23L-5 72Q-76 87-144 72Z';
  return `<g class="canonical-carrier-body" data-carrier-body="true">
    <defs>
      <linearGradient id="${id}-paper" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#E7D8B9"/><stop offset="1" stop-color="#BCA88A"/></linearGradient>
      <pattern id="${id}-fiber" width="29" height="23" patternUnits="userSpaceOnUse"><path d="M2 5l5-1m12 9 4 1M9 20l5-2" fill="none" stroke="#F4E9D1" stroke-opacity=".45" stroke-width=".45"/><path d="M7 11l4 1m11-7 3-1" fill="none" stroke="#89785D" stroke-opacity=".24" stroke-width=".4"/></pattern>
      <filter id="${id}-shadow" x="-15%" y="-20%" width="140%" height="150%"><feDropShadow dx="1.7" dy="2.7" stdDeviation="1.6" flood-color="#07111D" flood-opacity=".45"/></filter>
    </defs>
    <g fill="none" stroke-linecap="round"><path d="M0 0Q-12 5-22 24M0 0Q-67 5-137 25" stroke="#233249" stroke-width="6"/><path d="M0 0Q-12 5-22 24M0 0Q-67 5-137 25" stroke="#D7C5A4" stroke-width="3.6"/><path d="M0 0Q-67 5-137 25" stroke="#A75C4C" stroke-width=".7"/></g>
    <path d="${d}" fill="url(#${id}-paper)" stroke="#8E7A60" stroke-width="1.4" stroke-linejoin="round" filter="url(#${id}-shadow)"/>
    <path d="${d}" fill="url(#${id}-fiber)"/>
    <path d="M-145 26Q-76 12-3 26" fill="none" stroke="#F0E3C6" stroke-width="1.4"/>
    <path d="M-141 67Q-75 82-8 68" fill="none" stroke="#9D5145" stroke-width="1.2" stroke-dasharray="2.7 3.3"/>
  </g>`;
}

/** Render the immutable canonical path at its own origin. The caller applies
 * a PaperPose; material layers share the same contour and add no extra piece. */
export function renderCarrierPiece(piece: PieceId, prefix: string): string {
  const id = `${safeId(prefix)}-carrier-piece-${piece}`, fragment = FRAGMENTS[piece];
  return `<g class="canonical-carrier-piece" data-carrier-piece="${piece}">
    <defs>
      <linearGradient id="${id}-wash" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#FFF0BA" stop-opacity=".17"/><stop offset=".5" stop-color="#D6A04A" stop-opacity="0"/><stop offset="1" stop-color="#815A2E" stop-opacity=".16"/></linearGradient>
      <pattern id="${id}-fiber" width="31" height="27" patternUnits="userSpaceOnUse"><path d="M3 5l6-1m12 10 4 1M9 23l5-2" fill="none" stroke="#F9E5AE" stroke-opacity=".42" stroke-width=".55"/><path d="M10 10l4 1m12-5 3-1" fill="none" stroke="#92672D" stroke-opacity=".22" stroke-width=".45"/></pattern>
      <filter id="${id}-shadow" x="-15%" y="-15%" width="140%" height="145%"><feDropShadow dx="2" dy="3" stdDeviation="1.7" flood-color="#3C2B17" flood-opacity=".34"/></filter>
    </defs>
    <path data-piece="${piece}" d="${fragment.path}" fill="${fragment.color}" stroke="#97682F" stroke-width="1.35" stroke-linejoin="round" filter="url(#${id}-shadow)"/>
    <path d="${fragment.path}" fill="url(#${id}-wash)"/>
    <path d="${fragment.path}" fill="url(#${id}-fiber)"/>
  </g>`;
}
