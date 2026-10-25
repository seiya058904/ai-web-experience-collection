import { useRef } from 'react';
import { useGSAP } from '../use-gsap';
import gsap from 'gsap';
import { Anchor, Image } from './Primitives';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.hero-copy > *', { y: 10, opacity: 0.6 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.62, ease: 'power3.out', clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, { scope: root });
  return <section className="hero container" ref={root} aria-labelledby="hero-title">
    <div className="hero-copy"><h1 id="hero-title">Presence,<br />precisely<br /> cut.</h1><p>A considered wardrobe.<br className="mobile-break" /> A distinct point of view.</p><Anchor href="#collection" className="button">Explore the collection</Anchor></div>
    <figure className="hero-figure"><div className="hero-photo"><Image name="hero" alt="A chocolate suit and open ivory shirt in warm, contemporary limestone architecture" priority sizes="(min-width: 960px) 56vw, 100vw" /></div><figcaption><span className="caption-rule" /><span>A study in presence</span></figcaption><div className="hero-detail"><Image name="lapel" alt="A closer view of the chocolate lapel" sizes="(min-width: 960px) 16vw, 24vw" /></div></figure>
  </section>;
}
