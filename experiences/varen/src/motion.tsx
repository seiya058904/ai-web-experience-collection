import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const ScrollContext = createContext<{ scrollTo: (target: string | number) => void; refresh: () => void }>({ scrollTo: () => {}, refresh: () => {} });

export function SmoothScroll({ locked, children }: { locked: boolean; children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const lockedRef = useRef(locked);
  const pendingTarget = useRef<string | number | null>(null);
  lockedRef.current = locked;

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let removeTicker: (() => void) | undefined;
    let refreshFrame = 0;
    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => { lenisRef.current?.resize(); ScrollTrigger.refresh(); });
    };
    const setup = () => {
      removeTicker?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if (reduced.matches) return;
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false, anchors: false });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => { if (!document.hidden) lenis.raf(time * 1000); };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      if (lockedRef.current) lenis.stop();
      removeTicker = () => { gsap.ticker.remove(tick); lenis.off('scroll', ScrollTrigger.update); };
      refresh();
    };
    setup();
    reduced.addEventListener('change', setup);
    document.fonts.ready.then(refresh);
    document.addEventListener('load', refresh, true);
    window.addEventListener('varen:layout', refresh);
    return () => {
      reduced.removeEventListener('change', setup);
      document.removeEventListener('load', refresh, true);
      window.removeEventListener('varen:layout', refresh);
      cancelAnimationFrame(refreshFrame);
      removeTicker?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (locked) lenisRef.current?.stop();
    else {
      lenisRef.current?.start();
      if (pendingTarget.current !== null) {
        const target = pendingTarget.current;
        pendingTarget.current = null;
        requestAnimationFrame(() => scrollTo(target));
      }
    }
    document.documentElement.classList.toggle('overlay-open', locked);
    return () => document.documentElement.classList.remove('overlay-open');
  }, [locked]);

  const scrollTo = (target: string | number) => {
    if (lockedRef.current) { pendingTarget.current = target; return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = typeof target === 'number' ? target : (document.querySelector(target)?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
    if (lenisRef.current) {
      lenisRef.current.resize();
      lenisRef.current.scrollTo(Math.max(0, top));
    } else {
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'instant' : 'smooth' });
    }
  };
  return <ScrollContext.Provider value={{ scrollTo, refresh: () => window.dispatchEvent(new Event('varen:layout')) }}>{children}</ScrollContext.Provider>;
}

export const useScroll = () => useContext(ScrollContext);
