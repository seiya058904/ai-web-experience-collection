export interface PresentationState {
  fallback: boolean;
  contextLost: boolean;
  reduced: boolean;
  paused: boolean;
  slow: boolean;
}

/** Controls describe the result available in the current rendering mode. */
export function presentation(state: PresentationState) {
  const imageOnly = state.fallback || state.contextLost;
  const running = !imageOnly && !state.reduced && !state.paused;
  return {
    imageOnly,
    running,
    speedAction: running ? 'speed' : 'read',
    speedText: running ? state.slow ? 'Return to rhythm ' : 'Look closer ' : 'Read the escapement ',
    speedDetail: running ? state.slow ? '¹⁄₃₂ → ⅛ speed' : '⅛ → ¹⁄₃₂ speed' : 'How the beat is made',
    motionLabel: imageOnly ? 'Image edition uses static artwork' : state.reduced ? 'Ambient motion follows your reduced motion preference'
      : state.paused ? 'Resume ambient motion' : 'Pause ambient motion',
    status: imageOnly
      ? `${state.contextLost ? 'Live movement interrupted. ' : ''}Image edition · static mechanism views. Scroll or use Index to inspect all six chapters.`
      : state.reduced ? 'Reduced motion · fixed mechanism poses. Scroll or use Index to inspect each chapter.'
      : state.paused ? 'Ambient motion paused. Scrolling and chapter inspection remain available.' : '',
  } as const;
}

export const MECHANISM_STILLS = [
  null,
  { file: 'energy', description: 'Static view of the original model: the open mainspring barrel and its coiled spring.' },
  { file: 'transmission', description: 'Static exploded view of the original model: wheels, pinions and bridges separated along their axles.' },
  { file: 'oscillation', description: 'Static view of the original model: the balance wheel, hairspring, pallet fork and escape wheel. No mechanical motion is shown.' },
  null,
  null,
] as const;
