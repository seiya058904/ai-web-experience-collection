import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '../use-gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { detailChapters, looks, occasions, type Look } from '../data';
import { useScroll } from '../motion';
import { Image, Icon } from './Primitives';

export function CutStudy() {
  return <section id="the-cut" className="cut-study container section-space" aria-labelledby="cut-title"><h2 id="cut-title">The art<br />of less.</h2><div className="cut-rows">
    <div><h3>The shoulder</h3><p>A natural outline.<br />Structure without excess.</p></div>
    <div><h3>The line</h3><p>Uninterrupted from<br />the first glance to the last.</p></div>
    <div><h3>The proportion</h3><p>Considered as a whole.<br />Made distinct by balance.</p></div>
  </div></section>;
}

export function DetailChapter() {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const { scrollTo } = useScroll();
  const chapter = detailChapters[active];
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
      controller.current = ScrollTrigger.create({ id: 'varen-details', trigger: root.current, start: 'top top+=76', end: () => `+=${Math.round(innerHeight * 1.6)}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => {
          const next = Math.min(2, Math.floor(self.progress * 3));
          if (activeRef.current !== next) { activeRef.current = next; setActive(next); }
        },
      });
      return () => { controller.current?.kill(); controller.current = null; };
    });
    return () => media.revert();
  }, { scope: root });
  useGSAP(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo('.detail-copy-content', { opacity: 0.55 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' });
  }, { scope: root, dependencies: [active], revertOnUpdate: true });
  const select = (index: number) => {
    const trigger = controller.current;
    if (trigger) scrollTo(trigger.start + (trigger.end - trigger.start) * (index + 0.45) / 3);
    else { activeRef.current = index; setActive(index); }
  };
  return <section id="details" className="detail-chapter" ref={root} aria-labelledby="detail-title"><div className="container detail-layout"><div className="detail-visual">{detailChapters.map((item, index) => <Image key={item.name} name={item.image} alt={item.alt} className={`detail-image ${active === index ? 'is-active' : ''}`} sizes="(min-width: 960px) 52vw, 100vw" />)}</div><div className="detail-copy"><div className="detail-copy-content"><h2 id="detail-title">{chapter.title}</h2><p>{chapter.text}</p></div><div className="detail-tabs" role="group" aria-label="Garment details">{detailChapters.map((item, index) => <button key={item.name} aria-pressed={active === index} onClick={() => select(index)}><span>{item.name}</span><span className="detail-tab-mark" aria-hidden="true" /></button>)}</div><p className="detail-scroll-note">A closer look, at your own pace.</p></div></div></section>;
}

export function Wardrobe({ onOpen }: { onOpen: (look: Look) => void }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  const occasion = occasions[active];
  const look = looks.find(item => item.id === occasion.lookId)!;
  useGSAP(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo('.wardrobe-image img, .wardrobe-copy', { opacity: 0.6 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' });
  }, { scope: root, dependencies: [active], revertOnUpdate: true });
  return <section id="wardrobe" className="wardrobe container section-space" ref={root} aria-labelledby="wardrobe-title"><div className="wardrobe-heading"><h2 id="wardrobe-title">A wardrobe,<br />resolved.</h2><div className="occasion-tabs" role="tablist" aria-label="Dress for the occasion">{occasions.map((item, index) => <button key={item.name} id={`occasion-${index}`} role="tab" aria-selected={active === index} aria-controls="occasion-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % occasions.length;
      else if (event.key === 'ArrowLeft') next = (index + occasions.length - 1) % occasions.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = occasions.length - 1;
      else return;
      event.preventDefault(); setActive(next); document.getElementById(`occasion-${next}`)?.focus();
    }}>{item.name}</button>)}</div></div><div id="occasion-panel" role="tabpanel" aria-labelledby={`occasion-${active}`} className="wardrobe-layout"><a className="wardrobe-image" href={`?look=${look.id}`} onClick={event => { if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(look); }} aria-label={`View ${look.title}`}><Image name={look.image} alt={look.alt} sizes="(min-width: 960px) 44vw, 100vw" /></a><div className="wardrobe-copy"><h3>{occasion.heading}</h3><p>{occasion.description}</p><button className="text-link" onClick={() => onOpen(look)}>View the look<Icon name="arrow" size={22} /></button></div></div></section>;
}
