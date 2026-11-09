import type { Board } from './engine.ts';

export interface NoteEntry {
  coord: string;
  legal: boolean;
  /** 0 = rejected; 1 = first move observed; 2 = scripted reply observed. */
  seen: number;
  solved: boolean;
  explanation: string;
}

export interface NotePanel {
  id: 'P1' | 'P2' | 'P3';
  title: string;
  board: Board;
  example: boolean;
  caption: string;
  /** Actual attempts in their original chronological order, including rejections. */
  attempts: NoteEntry[];
}

const WIDTH = 1100;
const MARGIN = 72;
const INK = '#242A29';
const MUTED = '#544737';
const ACCENT = '#884F42';
const PAPER = '#F4F1E8';

/** All dynamic content is XML text, never markup, attributes, CSS or URLs. */
function xml(value: string): string {
  return Array.from(String(value))
    .filter(character => {
      const cp = character.codePointAt(0)!;
      return cp === 9 || cp === 10 || cp === 13 ||
        (cp >= 0x20 && cp <= 0xD7FF) || (cp >= 0xE000 && cp <= 0xFFFD) ||
        (cp >= 0x10000 && cp <= 0x10FFFF);
    })
    .join('')
    .replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
    })[character]!);
}

/** Conservative line lengths leave room for common system-font differences. */
function wrap(value: string, limit: number): string[] {
  // Units are approximately half an em. Broad letters and non-Latin text need
  // more width than average English letters; raw character counts can clip a
  // long token of W's even when ordinary sentences fit comfortably.
  const width = (character: string): number => {
    if (/\s/.test(character)) return 0.65;
    if (/[MW@%]/.test(character)) return 1.95;
    if (/[A-Z]/.test(character)) return 1.5;
    if (/[mw]/.test(character)) return 1.75;
    if (/[ilI.,'!:;|]/.test(character)) return 0.65;
    if (/[^\u0020-\u007e]/.test(character)) return 2;
    return 1.15;
  };
  const measure = (text: string): number => Array.from(text).reduce((sum, character) => sum + width(character), 0);
  const paragraphs = String(value).replace(/\r\n?/g, '\n').split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      let remainder = word;
      while (measure(remainder) > limit) {
        if (current) { lines.push(current); current = ''; }
        let prefix = '';
        let used = 0;
        for (const character of Array.from(remainder)) {
          if (used + width(character) > limit && prefix) break;
          prefix += character;
          used += width(character);
        }
        lines.push(prefix);
        remainder = remainder.slice(prefix.length);
      }
      if (!remainder) continue;
      if (current && measure(`${current} ${remainder}`) > limit) {
        lines.push(current);
        current = remainder;
      } else {
        current += (current ? ' ' : '') + remainder;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [''];
}

function textLines(lines: readonly string[], x: number, y: number, size = 21, leading = 31, attributes = ''): string {
  return `<text x="${x}" y="${y}" font-size="${size}" ${attributes}>${lines.map((line, i) =>
    `<tspan x="${x}" y="${y + i * leading}">${xml(line)}</tspan>`).join('')}</text>`;
}

function renderBoard(board: Board, y: number, id: string): string {
  // The array starts at A1; SVG y increases downward. Row 7 must be on top.
  const step = 45;
  const left = 127;
  const top = y + 54;
  const boardSize = 380;
  const points = board.map((cell, index) => {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const c = `${'ABCDEFG'[column]}${row + 1}`;
    const x = left + column * step;
    const cy = top + (6 - row) * step;
    const stone = cell === null ? '' :
      `<circle class="stone" data-stone="${cell}" cx="0" cy="0" r="18.8" fill="url(#stone-${cell})" stroke="${cell === 'black' ? '#161C1B' : '#BEBCAF'}" stroke-width="1.1"/>`;
    return `<g data-coord="${c}" data-cell="${cell ?? 'empty'}" transform="translate(${x} ${cy})"><title>${c}: ${cell ? `${cell} stone` : 'empty'}</title>${stone}</g>`;
  }).join('');
  const grid = Array.from({ length: 7 }, (_, n) =>
    `<path d="M${left + n * step} ${top}V${top + 6 * step} M${left} ${top + n * step}H${left + 6 * step}"/>`).join('');
  const coordinates = Array.from({ length: 7 }, (_, n) =>
    `<text x="${left + n * step}" y="${top + 6 * step + 33}" text-anchor="middle">${'ABCDEFG'[n]}</text>` +
    `<text x="${left - 28}" y="${top + (6 - n) * step + 6}" text-anchor="middle">${n + 1}</text>`).join('');
  return `<g id="board-${id}" role="img" aria-label="${id} seven by seven board; coordinates A to G from left to right and 1 to 7 from bottom to top">
    <rect x="${MARGIN + 3}" y="${y + 5}" width="${boardSize}" height="${boardSize}" rx="3" fill="#544737" opacity=".10"/>
    <rect x="${MARGIN}" y="${y}" width="${boardSize}" height="${boardSize}" rx="3" fill="url(#wood)" stroke="#B39872"/>
    <rect x="${MARGIN}" y="${y}" width="${boardSize}" height="${boardSize}" rx="3" fill="url(#grain)" opacity=".17"/>
    <g stroke="#67583F" stroke-width="1.05" fill="none">${grid}</g>
    <g font-family="monospace" font-size="17" fill="#544737">${coordinates}</g>
    ${points}
  </g>`;
}

/**
 * Creates a complete, portable SVG from precisely the supplied observations.
 * The exporter never solves a puzzle, plays a reply, replaces a record with a
 * solution, or adds dates, timings or scores. The UI owns those observations.
 */
export function createObservationNote(panels: readonly NotePanel[]): string {
  if (panels.length !== 3 || new Set(panels.map(panel => panel.id)).size !== 3 ||
      panels.some(panel => !['P1', 'P2', 'P3'].includes(panel.id))) {
    throw new TypeError('An observation note needs P1, P2 and P3 exactly once.');
  }
  for (const panel of panels) {
    if (panel.board.length !== 49 || Array.from(panel.board).some(cell => cell !== null && cell !== 'black' && cell !== 'white')) {
      throw new TypeError('Each observation board must contain exactly 49 valid intersections.');
    }
  }

  let cursor = 236;
  const sections: string[] = [];
  panels.forEach((panel, panelIndex) => {
    const sectionStart = cursor;
    const title = wrap(panel.title, 22);
    const caption = wrap(panel.caption, 37);
    const titleY = sectionStart + 85;
    const captionY = titleY + title.length * 52 + 14;
    const statusY = captionY + caption.length * 31 + 24;
    const status = panel.example ? 'Example — not played' : 'Your observation';
    const visualBottom = Math.max(sectionStart + 380, statusY + 35);
    let recordY = visualBottom + 60;
    const records: string[] = [];
    if (panel.attempts.length > 0) {
      records.push(textLines(['ATTEMPTS, IN THE ORDER YOU MADE THEM'], MARGIN, recordY, 14, 20, `letter-spacing="1.7" fill="${MUTED}"`));
      recordY += 39;
      panel.attempts.forEach((attempt, attemptIndex) => {
        const outcome = !attempt.legal ? 'Rejected — board unchanged' : attempt.solved ? 'Goal reached' : 'Legal move';
        const headline = wrap(`${String(attemptIndex + 1).padStart(2, '0')}  ·  Black ${attempt.coord}  ·  ${outcome}`, 65);
        const explanation = wrap(attempt.explanation, 80);
        const headY = recordY;
        const explanationY = headY + headline.length * 29 + 7;
        const bottom = explanationY + (explanation.length - 1) * 29 + 31;
        records.push(`<g data-attempt="${attemptIndex + 1}" data-seen="${Number.isFinite(attempt.seen) ? attempt.seen : 0}" data-legal="${attempt.legal}" data-solved="${attempt.solved}">
          ${textLines(headline, MARGIN, headY, 20, 29, `font-weight="600" fill="${attempt.solved ? ACCENT : INK}"`)}
          ${textLines(explanation, MARGIN + 37, explanationY, 20, 29, `fill="${MUTED}"`)}
          <path d="M${MARGIN} ${bottom}H${WIDTH - MARGIN}" stroke="#D9D2C5" stroke-width="1"/>
        </g>`);
        recordY = bottom + 36;
      });
    } else {
      records.push(textLines([panel.example ? 'No personal attempt is recorded for this example.' : 'No attempts are recorded for this observation.'], MARGIN, recordY, 20, 29, `fill="${MUTED}"`));
      recordY += 45;
    }
    cursor = recordY + 68;
    sections.push(`<g id="observation-${panel.id}" data-panel="${panel.id}" data-top="${sectionStart}" data-bottom="${cursor}" aria-labelledby="heading-${panel.id}">
      ${renderBoard(panel.board, sectionStart, panel.id)}
      <text x="510" y="${sectionStart + 25}" font-size="14" letter-spacing="2.3" fill="${MUTED}">${String(panelIndex + 1).padStart(2, '0')} / ${panel.id}</text>
      ${textLines(title, 507, titleY, 43, 52, `id="heading-${panel.id}" font-family="Georgia, 'Times New Roman', serif" fill="${INK}"`)}
      ${textLines(caption, 510, captionY, 22, 31, `fill="${MUTED}"`)}
      <path d="M510 ${statusY - 17}h23" stroke="${ACCENT}" stroke-width="2"/>
      <text x="547" y="${statusY - 10}" font-size="17" fill="${ACCENT}">${xml(status)}</text>
      ${records.join('')}
    </g>`);
  });
  const footerY = cursor + 3;
  const height = footerY + 108;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" lang="en" xml:lang="en" role="img" aria-labelledby="note-title note-description">
  <title id="note-title">SENTE — Three observations</title>
  <desc id="note-description">Three seven by seven practice boards with their recorded attempts in chronological order. Examples are identified. There is no whole-game score.</desc>
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#D2B78F"/><stop offset="1" stop-color="#C6A476"/></linearGradient>
    <pattern id="grain" width="61" height="210" patternUnits="userSpaceOnUse"><path d="M8 -10C16 60 2 145 10 220 M23 -10C17 70 29 145 22 220 M47 -10C40 70 54 150 48 220" fill="none" stroke="#90754F" stroke-width=".7"/></pattern>
    <radialGradient id="stone-black" cx="33%" cy="24%" r="82%"><stop stop-color="#4B504C"/><stop offset=".48" stop-color="#242A29"/><stop offset="1" stop-color="#141918"/></radialGradient>
    <radialGradient id="stone-white" cx="32%" cy="23%" r="85%"><stop stop-color="#FCFCF4"/><stop offset=".55" stop-color="#E7E6DE"/><stop offset="1" stop-color="#C9C7BC"/></radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${height}" fill="${PAPER}"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="${INK}">
    <text x="${MARGIN}" y="98" font-family="Georgia, 'Times New Roman', serif" font-size="65" letter-spacing="4">SENTE</text>
    <text x="${MARGIN}" y="144" font-size="22">Three observations</text>
    <text x="${WIDTH - MARGIN}" y="97" text-anchor="end" font-size="14" letter-spacing="1.5" fill="${MUTED}">A NOTE FROM THE BOARD</text>
    <path d="M${MARGIN} 181H${WIDTH - MARGIN}" stroke="${MUTED}" stroke-width="1"/>
    ${sections.join('\n')}
    <path d="M${MARGIN} ${footerY}H${WIDTH - MARGIN}" stroke="${MUTED}" stroke-width="1"/>
    <text x="${MARGIN}" y="${footerY + 42}" font-size="17">SENTE · Three observations</text>
    <text x="${MARGIN}" y="${footerY + 73}" font-size="16" fill="${MUTED}">7 × 7 practice boards · Local goals; no whole-game score</text>
  </g>
</svg>`;
}
