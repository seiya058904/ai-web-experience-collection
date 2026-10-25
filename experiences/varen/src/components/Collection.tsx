import { useEffect, useRef } from 'react';
import { useGSAP } from '../use-gsap';
import gsap from 'gsap';
import { categories, looks, type Category, type Look } from '../data';
import { Image, SaveButton } from './Primitives';

export function LookCard({ look, saved, onOpen, onSave }: { look: Look; saved: boolean; onOpen: (look: Look) => void; onSave: (id: string) => void }) {
  return <article className="look-card">
    <a className="look-image" href={`?look=${look.id}`} onClick={event => { event.preventDefault(); onOpen(look); }} aria-label={`View ${look.title}`}><Image name={look.image} alt={look.alt} /></a>
    <div className="look-caption"><div><h3><a href={`?look=${look.id}`} onClick={event => { event.preventDefault(); onOpen(look); }}>{look.title}</a></h3><p>{look.category}</p></div><SaveButton title={look.title} active={saved} onClick={() => onSave(look.id)} /></div>
  </article>;
}

export function Collection({ category, saved, onCategory, onOpen, onSave }: { category: Category; saved: string[]; onCategory: (category: Category) => void; onOpen: (look: Look) => void; onSave: (id: string) => void }) {
  const root = useRef<HTMLElement>(null);
  const initial = useRef(true);
  const filtered = looks.filter(look => category === 'All' || look.category === category);
  useGSAP(() => {
    if (initial.current) { initial.current = false; return; }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo('.look-card', { opacity: 0.55 }, { opacity: 1, duration: 0.22, clearProps: 'opacity' });
  }, { scope: root, dependencies: [category], revertOnUpdate: true });
  useEffect(() => { window.dispatchEvent(new Event('varen:layout')); }, [category]);
  return <section id="collection" className="collection container section-space" ref={root} aria-labelledby="collection-title">
    <div className="section-heading"><h2 id="collection-title">The considered<br className="collection-break" /> collection</h2><p>Six perspectives<br />on getting dressed.</p></div>
    <div className="collection-toolbar"><div className="filters" role="group" aria-label="Filter the collection">{categories.map(item => <button key={item} className="filter-button" aria-pressed={category === item} onClick={() => onCategory(item)}>{item}</button>)}</div><span className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'look' : 'looks'}</span></div>
    <div className="collection-grid">{filtered.map(look => <LookCard key={look.id} look={look} saved={saved.includes(look.id)} onOpen={onOpen} onSave={onSave} />)}</div>
  </section>;
}
