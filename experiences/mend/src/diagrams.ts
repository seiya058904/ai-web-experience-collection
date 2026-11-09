import './diagrams.css';
import { softText } from '../../shared/soft-swap.ts';

export interface DiagramFrame {
  faultSmooth: boolean;
  repairPlan: 'A' | 'B';
  assemblyProgress: number;
  trialProgress: number;
  trialMode: 'before' | 'repaired';
  reducedMotion: boolean;
  compareState?: 'before' | 'after';
}

const bounded = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

function mount(id: string, markup: string): HTMLElement | null {
  const host = document.getElementById(id);
  if (host) {
    host.classList.add('mend-diagram');
    host.innerHTML = markup;
  }
  return host;
}

function part<T extends SVGElement = SVGElement>(host: HTMLElement | null, role: string): T | null {
  return host?.querySelector<T>(`[data-diagram-part="${role}"]`) ?? null;
}

function visible(element: SVGElement | null, show: boolean) {
  if (show) element?.removeAttribute('display');
  else element?.setAttribute('display', 'none');
}

const faultMarkup = `
  <svg viewBox="0 0 360 174" role="img" aria-label="Edge view of the tilted rear wheel touching the body." data-diagram-part="image">
    <text class="diagram-kicker" x="5" y="14">Axle view</text>
    <path class="diagram-body" d="M222 25H346V129H222Z" />
    <path class="diagram-grain" d="M235 36h33m30 9h34m-100 68h39m32-12h32" />
    <text class="diagram-label" x="284" y="56" text-anchor="middle">Body</text>
    <path class="diagram-axle" d="M116 88H223" />
    <path class="diagram-axle-inset" d="M223 88H310" />
    <circle class="diagram-axle-end" cx="116" cy="88" r="4" />
    <text class="diagram-label" x="117" y="111">Axle</text>
    <g data-diagram-part="wheel" transform="rotate(28 190 88)">
      <rect class="diagram-old-wheel" x="182" y="32" width="16" height="112" rx="3" />
      <path class="diagram-grain" d="M186 40v39m7 23v33m-5-47v11" />
      <circle class="diagram-wheel-center" cx="190" cy="88" r="3.5" />
    </g>
    <g data-diagram-part="contact">
      <circle class="diagram-contact-ring" cx="222" cy="45" r="7" />
      <path class="diagram-leader" d="M215 40L173 24H113" />
      <text class="diagram-contact-text" x="111" y="21" text-anchor="end">The catch</text>
    </g>
    <g data-diagram-part="gap" display="none">
      <path class="diagram-gap" d="M201 44H219m-15-3-3 3 3 3m12-6 3 3-3 3" />
      <text class="diagram-clear-text" x="202" y="28" text-anchor="middle">A little room</text>
    </g>
    <text class="diagram-caption" x="190" y="166" text-anchor="middle" data-diagram-part="caption">The wheel edge leans into the body.</text>
  </svg>`;

const fittingMarkup = `
  <svg viewBox="0 0 360 183" role="img" aria-label="The original rear wheel stays while a new sleeve seats around its axle." data-diagram-part="image">
    <text class="diagram-kicker" x="5" y="14">One part, in its place</text>
    <path class="diagram-body" d="M292 25H347V137H292Z" />
    <text class="diagram-label" x="319" y="45" text-anchor="middle">Body</text>
    <path class="diagram-axle" d="M98 88H292" />
    <path class="diagram-axle-inset" d="M292 88H332" />
    <g data-diagram-part="wheel" transform="translate(244 88)">
      <ellipse class="diagram-old-wheel" data-diagram-part="wheel-face" rx="14" ry="48" />
      <path class="diagram-grain" d="M-8-35q11 6 17 0M-12-14q14 7 25 1M-12 18q12-6 25-2M-7 36q7-4 15-1" />
      <ellipse class="diagram-wheel-center" cx="-13" cy="0" rx="3.4" ry="7" />
    </g>
    <g data-diagram-part="sleeve" transform="translate(224 88)">
      <path class="diagram-new-part" d="M-6-12H6V12H-6Z" />
      <ellipse class="diagram-new-part" cx="-6" cy="0" rx="4.4" ry="12" />
      <ellipse class="diagram-sleeve-hole" cx="-6" cy="0" rx="1.8" ry="4.5" />
    </g>
    <g data-diagram-part="bag" display="none">
      <path class="diagram-bag-back" d="M14 84L75 88L73 154H12Z" />
      <circle class="diagram-old-wheel" cx="44" cy="122" r="19" />
      <path class="diagram-grain" d="M31 112q15 6 26-1M27 124q19-4 34 1M34 135q11-3 19-1" />
      <circle class="diagram-wheel-center" cx="44" cy="122" r="3.5" />
      <path class="diagram-bag-front" d="M13 94L75 95L73 154H12Z" />
      <path class="diagram-bag-seam" d="M14 96L14 152H71L73 97M14 86L21 94H75" />
      <text class="diagram-label" x="44" y="172" text-anchor="middle">Original, kept</text>
    </g>
    <text class="diagram-label" data-diagram-part="part-label" x="210" y="157" text-anchor="middle">New sleeve. Original wheel.</text>
    <text class="diagram-caption" data-diagram-part="caption" x="210" y="178" text-anchor="middle">In place.</text>
  </svg>`;

function trialWheel(name: string, x: number, y: number, front: boolean, far: boolean): string {
  return `<g data-diagram-part="${name}-mount" transform="translate(${x} ${y})" ${far ? 'class="diagram-far-wheel"' : ''}>
    <g data-diagram-part="${name}-spin">
      <circle data-diagram-part="${name}-face" class="${front ? 'diagram-blue-wheel' : 'diagram-old-wheel'}" r="10" />
      <path class="${front ? 'diagram-blue-grain' : 'diagram-grain'}" d="M-6-4q6 3 12-1M-7 3q6-2 13 1" />
      <circle class="diagram-wheel-center" r="2" />
    </g>
  </g>`;
}

const trialMarkup = `
  <svg viewBox="0 0 400 162" role="img" aria-label="Side view of Pip at the start of a fixed short path." data-diagram-part="image">
    <text class="diagram-kicker" data-diagram-part="mode-label" x="5" y="14">The same short path</text>
    <path class="diagram-far-ground" d="M28 101H371" />
    <path class="diagram-ground" d="M28 104H371" />
    <path class="diagram-path" d="M116 120H276" />
    <path class="diagram-path-end" d="M116 115v10m160-10v10" />
    <path class="diagram-catch-mark" d="M240.8 115v10" />
    <text class="diagram-label" x="116" y="141" text-anchor="middle">End</text>
    <text class="diagram-label" x="276" y="141" text-anchor="middle">Start</text>
    <text class="diagram-small-label" x="240.8" y="158" text-anchor="middle">The catch</text>
    <path class="diagram-cord" data-diagram-part="cord" d="M225 67C212 87 169 96 35 96" />
    <g data-diagram-part="toy" transform="translate(276 104)">
      ${trialWheel('front-far', -26, -13, true, true)}
      ${trialWheel('rear-far', 32, -13, false, true)}
      <path class="diagram-toy-body" d="M-49-42Q-44-47-39-43L-35-56Q-25-61-18-49L-15-35Q1-33 27-35L34-48Q42-51 40-43L38-26Q37-17 26-16L-28-16Q-39-18-41-30L-48-30Z" />
      <path class="diagram-wear" d="M2-29q11-5 17-2l-3 5-8 2-6-2ZM27-36l6-3 1 4-6 4Z" />
      <path class="diagram-belly" d="M-16-17H19L21-13H-14Z" />
      <g class="diagram-sun-mark">
        <ellipse cx="3" cy="-15" rx="2.5" ry="1.05" />
        <path d="M-.8-15H-2m8.8 0H8M1-16.5l-.6-.5m3.9.1.7-.5M1-13.5l-.7.5m4-.2.8.5" />
      </g>
      <path class="diagram-ear" d="M-25-47Q-18-43-21-34L-25-21L-28-18L-30-23L-32-20Q-38-27-34-40Z" />
      <circle class="diagram-eye" cx="-39" cy="-43" r="1.7" />
      <ellipse class="diagram-nose" cx="-50" cy="-37" rx="3.5" ry="3" />
      ${trialWheel('front-near', -29, -10, true, false)}
      ${trialWheel('rear-near', 29, -10, false, false)}
      <circle class="diagram-trial-sleeve" data-diagram-part="sleeve" cx="29" cy="-10" r="3.8" />
      <circle class="diagram-wheel-center" cx="29" cy="-10" r="1.7" />
      <path class="diagram-rub-mark" data-diagram-part="rub" d="M27-22l5-2m-3 5 5-2" display="none" />
    </g>
  </svg>`;

/** Mount noninteractive, accessible diagrams beside the narrative controls. */
export function mountDiagrams(): { update(frame: DiagramFrame): void } {
  const fault = mount('fault-diagram', faultMarkup);
  const fitting = mount('fitting-diagram', fittingMarkup);
  const trial = mount('trial-diagram', trialMarkup);
  const comparison = mount('comparison-diagram', trialMarkup.replace('viewBox="0 0 400 162"', 'viewBox="0 0 400 210"'));
  comparison?.querySelectorAll('.diagram-path,.diagram-path-end,.diagram-catch-mark,.diagram-label,.diagram-small-label').forEach(element => element.remove());
  comparison?.querySelector('.diagram-ground')?.setAttribute('d', 'M28 168H371');
  comparison?.querySelector('.diagram-far-ground')?.setAttribute('d', 'M28 161.4H371');
  part(comparison, 'toy')?.setAttribute('transform', 'translate(236 168) scale(2.2)');
  part(comparison, 'cord')?.setAttribute('d', 'M123.8 86.6C110 126 83 160 29 160');
  const comparisonCaption = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  comparisonCaption.setAttribute('class', 'diagram-caption');
  comparisonCaption.setAttribute('x', '200');
  comparisonCaption.setAttribute('y', '197');
  comparisonCaption.setAttribute('text-anchor', 'middle');
  comparisonCaption.textContent = 'Chipped ear. Worn paint. The little sun.';
  part(comparison, 'image')?.append(comparisonCaption);

  const faultSvg = part(fault, 'image');
  const faultWheel = part(fault, 'wheel');
  const faultContact = part(fault, 'contact');
  const faultGap = part(fault, 'gap');
  const faultCaption = part(fault, 'caption');
  const fittingSvg = part(fitting, 'image');
  const fittingWheel = part(fitting, 'wheel');
  const fittingFace = part(fitting, 'wheel-face');
  const fittingSleeve = part(fitting, 'sleeve');
  const fittingBag = part(fitting, 'bag');
  const fittingLabel = part(fitting, 'part-label');
  const fittingCaption = part(fitting, 'caption');
  const trialSvg = part(trial, 'image');
  const trialToy = part(trial, 'toy');
  const trialCord = part(trial, 'cord');
  const trialLabel = part(trial, 'mode-label');
  const trialRearMount = part(trial, 'rear-near-mount');
  const trialRearFace = part(trial, 'rear-near-face');
  const trialSleeve = part(trial, 'sleeve');
  const trialRub = part(trial, 'rub');
  const wheelSpins = ['front-far', 'rear-far', 'front-near', 'rear-near'].map(name => part(trial, name + '-spin'));
  const comparisonSvg = part(comparison, 'image');
  const comparisonLabel = part(comparison, 'mode-label');
  const comparisonRearMount = part(comparison, 'rear-near-mount');
  const comparisonRearFace = part(comparison, 'rear-near-face');
  const comparisonSleeve = part(comparison, 'sleeve');
  const comparisonRub = part(comparison, 'rub');
  let previousFault: boolean | undefined;
  let previousFitting = '';
  let previousTrial = '';
  let previousComparison = '';

  return {
    update(frame) {
      if (previousFault !== frame.faultSmooth) {
        previousFault = frame.faultSmooth;
        faultWheel?.setAttribute('transform', `rotate(${frame.faultSmooth ? 0 : 28} 190 88)`);
        visible(faultContact, !frame.faultSmooth);
        visible(faultGap, frame.faultSmooth);
        softText(faultCaption, frame.faultSmooth ? 'Aligned, with room to turn.' : 'The wheel edge leans into the body.', { instant: frame.reducedMotion });
        faultSvg?.setAttribute('aria-label', frame.faultSmooth
          ? 'Axle view: the upright rear wheel has a visible gap beside the body.'
          : 'Axle view: the tilted right rear wheel touches the body.');
      }

      const rawAssembly = bounded(frame.assemblyProgress);
      const assembly = frame.reducedMotion ? (rawAssembly < .5 ? 0 : 1) : rawAssembly;
      const fittingKey = `${frame.repairPlan}:${assembly}`;
      if (previousFitting !== fittingKey) {
        previousFitting = fittingKey;
        const keep = frame.repairPlan === 'A';
        const wheelX = keep ? 244 : 155 + 89 * assembly;
        fittingWheel?.setAttribute('transform', `translate(${wheelX.toFixed(3)} 88)`);
        fittingFace?.setAttribute('class', keep ? 'diagram-old-wheel' : 'diagram-new-wheel');
        fittingSleeve?.setAttribute('transform', `translate(${(112 + 112 * assembly).toFixed(3)} 88)`);
        visible(fittingSleeve, keep);
        visible(fittingBag, !keep);
        softText(fittingLabel, keep ? 'New sleeve. Original wheel.' : 'New wheel. Original safely kept.', { instant: frame.reducedMotion });
        softText(fittingCaption, assembly >= .999 ? 'In place.' : 'Moving along the axle.', { instant: frame.reducedMotion });
        fittingSvg?.setAttribute('aria-label', keep
          ? `The original rear wheel stays mounted. A pale new sleeve is ${assembly >= .999 ? 'seated around' : 'approaching'} the axle. No wheel is removed.`
          : `A new rear wheel is ${assembly >= .999 ? 'seated on' : 'approaching'} the axle. The original wheel is visible in its return bag.`);
      }

      const before = frame.trialMode === 'before';
      const progress = Math.min(bounded(frame.trialProgress), before ? .22 : 1);
      const trialKey = `${frame.repairPlan}:${frame.trialMode}:${progress}`;
      if (previousTrial !== trialKey) {
        previousTrial = trialKey;
        const distance = progress * 160;
        const x = 276 - distance;
        // Ground stays fixed. A wheel of radius 10 rolls through distance / radius radians.
        const angle = -distance / 10 * 180 / Math.PI;
        trialToy?.setAttribute('transform', `translate(${x.toFixed(3)} 104)`);
        wheelSpins.forEach(wheel => wheel?.setAttribute('transform', `rotate(${angle.toFixed(3)})`));
        trialRearMount?.setAttribute('transform', before ? 'translate(29 -10) rotate(-12) scale(.82 1)' : 'translate(29 -10)');
        trialRearFace?.setAttribute('class', !before && frame.repairPlan === 'B' ? 'diagram-new-wheel' : 'diagram-old-wheel');
        visible(trialSleeve, !before && frame.repairPlan === 'A');
        visible(trialRub, before && progress >= .219);
        const noseX = x - 51;
        trialCord?.setAttribute('d', `M${noseX.toFixed(3)} 67C${(noseX - 13).toFixed(3)} 87 ${(noseX - 56).toFixed(3)} 96 35 96`);
        softText(trialLabel, before ? 'Before: the same short path' : frame.repairPlan === 'A' ? 'The original wheel, turning again' : 'A new rear wheel, the same path', { instant: frame.reducedMotion });
        const position = progress === 0 ? 'at the start' : before && progress >= .219 ? 'stopped at the catch' : progress >= .999 ? 'at the end' : 'partway along the path';
        trialSvg?.setAttribute('aria-label', `Side projection of Pip with four wheels, ${position}. ${before ? 'The original right rear wheel is tilted.' : frame.repairPlan === 'A' ? 'The original wheel has a new sleeve.' : 'The right rear wheel is new.'} The ground and path markers stay fixed.`);
      }

      const comparisonBefore = frame.compareState === 'before';
      const comparisonKey = `${frame.repairPlan}:${comparisonBefore}`;
      if (previousComparison !== comparisonKey) {
        previousComparison = comparisonKey;
        comparisonRearMount?.setAttribute('transform', comparisonBefore ? 'translate(29 -10) rotate(-12) scale(.82 1)' : 'translate(29 -10)');
        comparisonRearFace?.setAttribute('class', !comparisonBefore && frame.repairPlan === 'B' ? 'diagram-new-wheel' : 'diagram-old-wheel');
        visible(comparisonSleeve, !comparisonBefore && frame.repairPlan === 'A');
        visible(comparisonRub, comparisonBefore);
        softText(comparisonLabel, comparisonBefore
          ? 'Before: the original rear wheel'
          : frame.repairPlan === 'A' ? 'After: the old wheel, with a new sleeve' : 'After: a new rear wheel', { instant: frame.reducedMotion });
        comparisonSvg?.setAttribute('aria-label', `Pip in exactly the same side pose. ${comparisonBefore ? 'Before repair: the original right rear wheel is tilted.' : frame.repairPlan === 'A' ? 'After repair: the original wheel is aligned and has a pale new sleeve.' : 'After repair: a pale new right rear wheel is aligned.'} The chipped ear, worn paint, and orange sun on the visible underside remain in their fixed positions.`);
      }
    },
  };
}
