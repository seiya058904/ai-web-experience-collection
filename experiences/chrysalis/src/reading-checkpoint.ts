import { readReadingPosition } from './reading-position.ts';
import type { ReadingPosition } from './reading-position.ts';

export const READING_HISTORY_KEY = '__chrysalisScrollV1';
export const READING_SESSION_KEY = 'chrysalis:reading-position:v1';

interface CheckpointHost {
  route: () => string;
  now: () => number;
  getHistory: () => unknown;
  replaceHistory: (state: Record<string, unknown>) => void;
  getSession: () => string | null;
  setSession: (value: string) => void;
}

interface StoredCheckpoint extends ReadingPosition { version: 1; route: string; savedAt: number; }

function record(value: unknown): Record<string, unknown> | null {
  if (value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value as Record<string, unknown> : null;
}

function decode(value: unknown, route: string): StoredCheckpoint | null {
  const candidate = record(value);
  if (!candidate || candidate.version !== 1 || candidate.route !== route) return null;
  const position = readReadingPosition(candidate);
  if (!position) return null;
  return { ...position, version: 1, route, savedAt: typeof candidate.savedAt === 'number' && Number.isFinite(candidate.savedAt) ? candidate.savedAt : 0 };
}

/** A tab-scoped backup survives a reload that copies history before pagehide. */
export function createReadingCheckpointStore(host: CheckpointHost) {
  return {
    read(): { position: ReadingPosition; source: 'history' | 'session' } | null {
      let historical: StoredCheckpoint | null = null;
      let backup: StoredCheckpoint | null = null;
      const route = host.route();
      try { historical = decode(record(host.getHistory())?.[READING_HISTORY_KEY], route); } catch { /* Optional persistence. */ }
      try { const value = host.getSession(); if (value) backup = decode(JSON.parse(value), route); } catch { /* Optional persistence. */ }
      const source = backup && (!historical || backup.savedAt > historical.savedAt) ? 'session' : 'history';
      const saved = source === 'session' ? backup : historical;
      return saved ? { position: { y: saved.y, viewportHeight: saved.viewportHeight, anchor: saved.anchor }, source } : null;
    },
    save(position: ReadingPosition, writeHistory = true): { history: boolean; session: boolean } {
      const payload: StoredCheckpoint = { ...position, version: 1, route: host.route(), savedAt: host.now() };
      const result = { history: false, session: false };
      // The storage operations are independent: a non-active document or a
      // rejected history write must not prevent the session backup.
      try { host.setSession(JSON.stringify(payload)); result.session = true; } catch { /* Native history remains usable. */ }
      if (writeHistory) {
        try {
          const state = record(host.getHistory());
          if (state) { host.replaceHistory({ ...state, [READING_HISTORY_KEY]: payload }); result.history = true; }
        } catch { /* The earlier active-page checkpoint and session backup remain. */ }
      }
      return result;
    },
  };
}
