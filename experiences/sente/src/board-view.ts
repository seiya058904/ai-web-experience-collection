import { coordOf, groupAt, indexOf } from './engine.ts';
import type { Board, Color } from './engine.ts';

export interface BoardStyle {
  liberties?: readonly number[];
  marked?: readonly number[];
  outlined?: readonly number[];
  last?: number | null;
  rejected?: number | null;
  connection?: readonly number[];
  bare?: boolean;
  diagram?: boolean;
  activeColor?: Color;
}

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
}

export function pointXY(index: number): [number, number] {
  return [52 + (index % 7) * 76, 508 - Math.floor(index / 7) * 76];
}

export function boardSvg(board: Board, id: string, style: BoardStyle = {}): string {
  const diagram = style.diagram;
  const lines = Array.from({ length: 7 }, (_, i) => {
    const p = 52 + i * 76;
    return `<path d="M52 ${p}H508 M${p} 52V508"/>`;
  }).join('');
  const coords = Array.from({ length: 7 }, (_, i) => `<text x="${52 + i * 76}" y="29">${'ABCDEFG'[i]}</text><text x="25" y="${513 - i * 76}">${i + 1}</text>`).join('');
  const connections = (style.connection ?? []).flatMap(i => {
    const [x, y] = pointXY(i);
    return (style.connection ?? []).filter(j => (j === i + 1 && Math.floor(j / 7) === Math.floor(i / 7)) || j === i + 7).map(j => {
      const [x2, y2] = pointXY(j);
      return `<path class="connection-line" d="M${x} ${y}L${x2} ${y2}"/>`;
    });
  }).join('');
  const liberties = (style.liberties ?? []).map(i => {
    const [x, y] = pointXY(i);
    return `<g class="liberty-point" data-liberty="${coordOf(i)}"><circle cx="${x}" cy="${y}" r="12"/><circle cx="${x}" cy="${y}" r="2.6" fill="currentColor" stroke="none"/></g>`;
  }).join('');
  const stones = board.map((cell, i) => {
    if (!cell) return '';
    const [x, y] = pointXY(i);
    const marker = style.marked?.includes(i) ? `<path d="M${x - 7} ${y + 6}L${x} ${y - 7}L${x + 7} ${y + 6}Z" fill="none" stroke="${cell === 'black' ? '#f0e8da' : '#544737'}" stroke-width="2.2"/>` : '';
    return `<g class="stone stone-${cell}" data-stone="${coordOf(i)}" data-color="${cell}"><circle class="stone-shadow" cx="${x + 2}" cy="${y + 4}" r="27" fill="#251b10" opacity=".24" filter="url(#${id}-shadow)"/><circle cx="${x}" cy="${y}" r="26" fill="${diagram ? (cell === 'black' ? '#242a29' : '#f5f1e8') : `url(#${id}-${cell})`}" stroke="${cell === 'black' ? '#17201e' : '#b1ab9b'}" stroke-width=".8"/>${cell === 'white' && !diagram ? `<path d="M${x - 17} ${y - 7}Q${x - 4} ${y - 13} ${x + 14} ${y - 2}M${x - 19} ${y + 1}Q${x - 5} ${y - 5} ${x + 18} ${y + 5}" fill="none" stroke="#c9c4b5" stroke-opacity=".22" stroke-width="1"/>` : ''}${marker}${style.last === i ? `<circle cx="${x}" cy="${y}" r="4" fill="${cell === 'black' ? '#efe5d4' : '#544737'}"/>` : ''}${style.outlined?.includes(i) ? `<circle class="string-outline" cx="${x}" cy="${y}" r="31"/>` : ''}</g>`;
  }).join('');
  const rejected = style.rejected != null ? (() => {
    const [x, y] = pointXY(style.rejected!);
    return `<g class="rejected-point" data-rejected="${coordOf(style.rejected!)}"><circle cx="${x}" cy="${y}" r="24"/><path d="M${x - 7} ${y - 7}l14 14m0 -14l-14 14"/></g>`;
  })() : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" preserveAspectRatio="none" class="board-svg${style.bare ? ' board-bare' : ''}${diagram ? ' board-diagram' : ''}" aria-hidden="true" focusable="false">
  <defs><radialGradient id="${id}-black" cx="33%" cy="24%" r="80%"><stop stop-color="#555a55"/><stop offset=".42" stop-color="#2b302e"/><stop offset=".86" stop-color="#181e1c"/><stop offset="1" stop-color="#343731"/></radialGradient><radialGradient id="${id}-white" cx="32%" cy="26%" r="82%"><stop stop-color="#fffef6"/><stop offset=".5" stop-color="#eeece0"/><stop offset=".87" stop-color="#d2cdbd"/><stop offset="1" stop-color="#a49e90"/></radialGradient><filter id="${id}-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><clipPath id="${id}-clip"><rect x="2" y="2" width="556" height="556" rx="5"/></clipPath></defs>
  <g class="board-material"><rect x="2" y="2" width="556" height="556" rx="5" fill="${diagram ? '#f3ead9' : '#c6a476'}"/>${diagram ? '' : `<image href="${import.meta.env.BASE_URL}sente/assets/sente-board-material.webp" x="2" y="2" width="556" height="556" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}-clip)"/>`}<path d="M6 556H554" stroke="#8d6b42" stroke-width="4" opacity=".5"/></g>
  <g fill="none" stroke="${diagram ? '#8f806b' : '#55432e'}" stroke-width="1.35" class="grid-lines">${lines}</g>
  <circle cx="280" cy="280" r="3.2" fill="#55432e"/><g fill="#544737" text-anchor="middle" class="board-coordinates" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="14">${coords}</g>
  ${connections}${liberties}${stones}${rejected}</svg>`;
}

export interface BoardOptions {
  label: string;
  onPoint?: (coord: string) => void;
  mode?: 'play' | 'inspect';
  color?: Color;
  bare?: boolean;
  diagram?: boolean;
}

/** A precise SVG visual and a stable native-button grid share one coordinate map. */
export class BoardView {
  private root: HTMLElement;
  private visual: HTMLElement;
  private buttons: HTMLButtonElement[] = [];
  private options: BoardOptions;
  private id: string;
  private focusIndex = indexOf('D4');
  private lastRender = '';

  constructor(root: HTMLElement, id: string, options: BoardOptions) {
    this.root = root;
    this.id = id;
    this.options = options;
    this.root.classList.add('board');
    if (options.bare) this.root.classList.add('bare');
    if (options.diagram) this.root.classList.add('diagram');
    this.root.setAttribute('data-board', id);
    this.visual = document.createElement('div');
    this.visual.className = 'board-visual';
    this.root.append(this.visual);
    if (options.onPoint) this.makeControls();
    else { this.root.setAttribute('role', 'img'); this.root.setAttribute('aria-label', options.label); }
  }

  private makeControls(): void {
    const grid = document.createElement('div');
    grid.className = 'point-grid';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', this.options.label);
    grid.setAttribute('aria-rowcount', '7');
    grid.setAttribute('aria-colcount', '7');
    grid.setAttribute('aria-describedby', 'board-help');
    for (let row = 6; row >= 0; row--) {
      const line = document.createElement('div');
      line.setAttribute('role', 'row');
      line.className = 'point-row';
      for (let col = 0; col < 7; col++) {
        const index = row * 7 + col;
        const coord = coordOf(index);
        const [x, y] = pointXY(index);
        const cell = document.createElement('div');
        cell.setAttribute('role', 'gridcell');
        cell.className = 'point-cell';
        cell.style.left = `${x / 5.6}%`;
        cell.style.top = `${y / 5.6}%`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'point';
        button.dataset.coord = coord;
        button.dataset.testid = `${this.id}-${coord}`;
        button.tabIndex = index === this.focusIndex ? 0 : -1;
        button.addEventListener('focus', () => {
          this.focusIndex = index;
          this.buttons.forEach(b => { b.tabIndex = b === button ? 0 : -1; });
        });
        button.addEventListener('click', () => this.options.onPoint!(coord));
        button.addEventListener('keydown', event => {
          const directions: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 7, ArrowDown: -7 };
          if (!(event.key in directions) && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();
          let next = event.key === 'Home' ? row * 7 : event.key === 'End' ? row * 7 + 6 : index + directions[event.key];
          if ((event.key === 'ArrowLeft' && col === 0) || (event.key === 'ArrowRight' && col === 6)) next = index;
          if ((event.key === 'ArrowUp' && row === 6) || (event.key === 'ArrowDown' && row === 0)) next = index;
          this.buttons[Math.max(0, Math.min(48, next))]?.focus({ preventScroll: true });
        });
        cell.append(button); line.append(cell); this.buttons[index] = button;
      }
      grid.append(line);
    }
    this.root.append(grid);
  }

  render(board: Board, style: BoardStyle = {}): void {
    const signature = board.join(',') + JSON.stringify(style);
    if (signature === this.lastRender) return;
    this.lastRender = signature;
    this.visual.innerHTML = boardSvg(board, this.id, { bare: this.options.bare, diagram: this.options.diagram, ...style });
    const description = board.map((cell, i) => cell ? `${cell} ${coordOf(i)}` : '').filter(Boolean).join(', ') || 'empty board';
    if (!this.options.onPoint) this.root.setAttribute('aria-label', `${this.options.label}. ${description}.`);
    this.buttons.forEach((button, i) => {
      const cell = board[i];
      const liberties = cell ? groupAt(board, i)!.liberties.length : null;
      const state = cell ? `${cell} stone, string has ${liberties} ${liberties === 1 ? 'liberty' : 'liberties'}` : 'empty';
      const action = this.options.mode === 'inspect' ? 'inspect this point' : `place a ${style.activeColor ?? this.options.color ?? 'black'} stone`;
      button.setAttribute('aria-label', `${coordOf(i)}, ${state}; ${action}`);
      button.dataset.occupied = cell ?? 'empty';
      button.dataset.marked = String(style.marked?.includes(i) ?? false);
      button.classList.toggle('has-stone', cell !== null);
      button.title = `${coordOf(i)} · ${state}`;
    });
  }

  focus(coord = 'D4'): void { this.buttons[indexOf(coord)]?.focus(); }

  /** Decoration only: the authoritative position is already committed. */
  animateMove(placed: number | null, removed: readonly {index: number; color: Color}[] = []): void {
    if (document.documentElement.dataset.motion === 'reduced') return;
    if (placed != null) {
      const stone = this.visual.querySelector<SVGElement>(`[data-stone="${coordOf(placed)}"]`);
      if (stone) {
        stone.style.transformBox = 'fill-box'; stone.style.transformOrigin = 'center';
        stone.animate([{ transform: 'translateY(-5px) scale(.96)' }, { transform: 'translateY(0) scale(1)' }], {duration: 150, easing: 'cubic-bezier(.16,1,.3,1)'});
      }
    }
    for (const capture of removed) {
      const [x, y] = pointXY(capture.index);
      const carrier = document.createElement('span');
      carrier.className = `capture-lift capture-${capture.color}`;
      carrier.setAttribute('aria-hidden', 'true');
      carrier.style.left = `${x / 5.6}%`; carrier.style.top = `${y / 5.6}%`;
      this.root.append(carrier);
      const animation = carrier.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: 'translate(-50%,calc(-50% - 12px)) scale(.9)', opacity: 0 }], {duration: 180, easing: 'ease-out'});
      animation.onfinish = () => carrier.remove();
      animation.oncancel = () => carrier.remove();
    }
  }
}
