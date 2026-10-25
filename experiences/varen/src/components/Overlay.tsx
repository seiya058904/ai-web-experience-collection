import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '../use-gsap';
import gsap from 'gsap';
import { looks, type Look } from '../data';
import { Icon, Image, SaveButton } from './Primitives';
import { LookCard } from './Collection';

interface Props {
  look: Look | null;
  savedView: boolean;
  menu: boolean;
  saved: string[];
  onDismiss: () => void;
  onOpen: (look: Look) => void;
  onSave: (id: string) => void;
  onNavigate: (target: string) => void;
  onSaved: () => void;
}

export function Overlay({ look, savedView, menu, saved, onDismiss, onOpen, onSave, onNavigate, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [closeup, setCloseup] = useState(false);
  const open = !!look || savedView || menu;
  useEffect(() => {
    const element = dialog.current!;
    if (open && !element.open) {
      previousFocus.current = document.activeElement as HTMLElement;
      element.showModal();
    } else if (!open && element.open) {
      element.close();
      previousFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);
  useEffect(() => {
    setCloseup(false);
    drawer.current?.scrollTo({ top: 0 });
    if (open) dialog.current?.querySelector<HTMLButtonElement>('.dialog-close')?.focus({ preventScroll: true });
  }, [look?.id, savedView, menu, open]);
  useGSAP(() => {
    if (open && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(drawer.current, { xPercent: 100 }, { xPercent: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' });
  }, { scope: dialog, dependencies: [open], revertOnUpdate: true });

  return <dialog ref={dialog} className={`overlay ${menu && !look && !savedView ? 'overlay-menu' : ''}`} aria-labelledby="overlay-title" onCancel={event => { event.preventDefault(); onDismiss(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), a[href], [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <button className="dialog-scrim" aria-label="Close panel" tabIndex={-1} onClick={onDismiss} />
    <div className="drawer" ref={drawer} data-lenis-prevent="true">
      <div className="drawer-bar"><span>{look ? 'The collection' : menu && !savedView ? 'VAREN' : 'Your selection'}</span><button className="icon-button dialog-close" onClick={onDismiss} aria-label="Close panel"><Icon name="close" size={25} /></button></div>
      {look ? <div className="look-detail-layout"><div className="look-detail-media"><div className={`look-detail-photo ${closeup ? 'is-closeup' : ''}`}><Image name={look.image} alt={closeup ? `Closer view of ${look.title.toLowerCase()}` : look.alt} sizes="(min-width: 960px) 40vw, 100vw" priority /></div><div className="image-view-controls" role="group" aria-label="Image view"><button aria-pressed={!closeup} onClick={() => setCloseup(false)}>Full look</button><button aria-pressed={closeup} onClick={() => setCloseup(true)}>Detail</button></div></div><div className="look-detail-copy"><p className="detail-category">{look.category}</p><h2 id="overlay-title">{look.title}</h2><p className="look-description">{look.description}</p><dl className="look-specs"><div><dt>Colour</dt><dd>{look.colour}</dd></div><div><dt>Silhouette</dt><dd>{look.silhouette}</dd></div><div><dt>Styling</dt><dd>{look.occasion}</dd></div></dl><SaveButton withLabel title={look.title} active={saved.includes(look.id)} onClick={() => onSave(look.id)} /><p className="concept-note">A visual concept, not a product offered for sale.</p></div></div>
        : savedView ? <div className="saved-view"><div className="saved-heading"><h2 id="overlay-title">A personal<br />point of view.</h2><p>{saved.length ? `${saved.length} ${saved.length === 1 ? 'look' : 'looks'}, considered by you.` : 'Your selection starts here.'}</p></div>{saved.length ? <div className="saved-grid">{looks.filter(item => saved.includes(item.id)).map(item => <LookCard key={item.id} look={item} saved onSave={onSave} onOpen={onOpen} />)}</div> : <div className="saved-empty"><Icon name="bookmark" size={40} /><h3>Keep what speaks to you.</h3><p>Save a look from the collection.<br />Find it here whenever you return.</p><button className="button" onClick={() => onNavigate('#collection')}>Explore the collection</button></div>}</div>
          : menu ? <div className="menu-content"><h2 id="overlay-title" className="sr-only">Navigation</h2><nav aria-label="Expanded navigation">{[{ label: 'The collection', target: '#collection' }, { label: 'The art of less', target: '#the-cut' }, { label: 'A closer look', target: '#details' }, { label: 'Your wardrobe', target: '#wardrobe' }].map(item => <a key={item.target} href={item.target} onClick={event => { event.preventDefault(); onNavigate(item.target); }}>{item.label}<Icon name="arrow" size={30} /></a>)}<button onClick={onSaved}>Saved looks<span className="menu-saved-count">{saved.length}</span></button></nav><p>A considered wardrobe.<br />A distinct point of view.</p></div> : null}
    </div>
  </dialog>;
}
