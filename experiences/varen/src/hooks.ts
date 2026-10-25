import { useEffect, useState } from 'react';
import { categories, looks, type Category } from './data';

const storageKey = 'varen:saved:v1';
const knownIds = new Set(looks.map(look => look.id));

function readLocation() {
  const query = new URLSearchParams(window.location.search);
  const candidate = query.get('category');
  return {
    category: categories.includes(candidate as Category) ? candidate as Category : 'All' as Category,
    look: looks.find(look => look.id === query.get('look')) ?? null,
    saved: query.get('view') === 'saved',
  };
}

export function useLocationState() {
  const [state, setState] = useState(readLocation);
  useEffect(() => {
    const sync = () => setState(readLocation());
    window.addEventListener('popstate', sync);
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { window.removeEventListener('popstate', sync); history.scrollRestoration = previous; };
  }, []);
  const update = (patch: Record<string, string | null>, overlay = false, replace = false) => {
    const url = new URL(window.location.href);
    Object.entries(patch).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    history[replace ? 'replaceState' : 'pushState']({ varenOverlay: overlay }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const close = () => {
    if (history.state?.varenOverlay) history.back();
    else update({ look: null, view: null }, false, true);
  };
  return { ...state, update, close };
}

function parseSaved(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))] : [];
  } catch { return []; }
}

export function useSavedLooks() {
  const [saved, setSaved] = useState<string[]>(() => {
    try { return parseSaved(localStorage.getItem(storageKey)); } catch { return []; }
  });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === storageKey) setSaved(parseSaved(event.newValue)); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const toggle = (id: string) => {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice(next.includes(id) ? 'Look added to your selection.' : 'Look removed from your selection.');
    } catch { setNotice('Saved for this visit. Browser storage is unavailable.'); }
  };
  return { saved, toggle, notice };
}
