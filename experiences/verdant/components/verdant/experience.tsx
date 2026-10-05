import { CollectionReturn } from '../../../shared/CollectionReturn';
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../../../shared/ui/sheet";
import { Switch } from "../../../shared/ui/switch";
import { CHAPTERS, numberOf } from "./chapters";
import { Photograph } from "./photograph";
import { createJourney, type JourneyController } from "./journey";

function MenuGlyph({ close = false }: { close?: boolean }) {
  return <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d={close ? "M6 2L22 18M22 2L6 18" : "M1 5.5H27M1 14.5H27"} stroke="currentColor" strokeWidth="1.1" /></svg>;
}

export function VerdantExperience() {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<JourneyController | null>(null);
  const pendingChapter = useRef<number | null>(null);
  const activeRef = useRef(0);
  const hasMounted = useRef(false);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState<boolean | null>(null);
  const [systemReduced, setSystemReduced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update();
    let saved = true;
    try { saved = localStorage.getItem("verdant-motion-v1") !== "reduced"; } catch { /* Storage is optional. */ }
    setMotionEnabled(saved);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || motionEnabled === null) return;
    const restoreChapter = hasMounted.current ? activeRef.current : null;
    let alive = true;
    const journey = createJourney(element, {
      reduced: !motionEnabled || systemReduced,
      onChapter: (index) => { if (alive) { activeRef.current = index; setActive(index); } },
      restoreChapter,
    });
    controller.current = journey;
    hasMounted.current = true;
    if (menuOpen) journey.setMenuOpen(true);
    const hero = element.querySelector<HTMLImageElement>(".world-pavilion img");
    if (hero && !hero.complete && window.scrollY < 50) setLoading(true);
    const timeout = window.setTimeout(() => { if (alive) setLoading(false); }, 2400);
    Promise.allSettled([document.fonts.ready, hero?.decode()]).then(() => {
      if (!alive) return;
      setLoading(false);
      journey.refresh();
    });
    return () => {
      alive = false;
      window.clearTimeout(timeout);
      journey.destroy();
      if (controller.current === journey) controller.current = null;
    };
    // Menu state has its own lock lifecycle, independent of the scene lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionEnabled, systemReduced]);

  useEffect(() => { controller.current?.setMenuOpen(menuOpen); }, [menuOpen]);
  const goTo = useCallback((index: number) => { controller.current?.goTo(index); }, []);
  const chooseChapter = (index: number) => { pendingChapter.current = index; setMenuOpen(false); };
  const toggleMotion = (enabled: boolean) => {
    setMotionEnabled(enabled);
    try { localStorage.setItem("verdant-motion-v1", enabled ? "full" : "reduced"); } catch { /* Optional preference. */ }
  };

  return <div ref={root} className="verdant" data-mode="static" data-scene="0" data-ready={!loading}>
    <a className="skip-link" href="#arrival" onClick={(event) => { event.preventDefault(); goTo(activeRef.current); }}>Skip to the garden</a>
    <header className="site-header">
      <a className="brand" href="#arrival" aria-label="VERDANT — return to arrival" onClick={(event) => { event.preventDefault(); goTo(0); }}>VERDANT</a>
      <span className="brand-caption">A living spring</span>
        <CollectionReturn />
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild><button className="journey-trigger" aria-label="The journey"><span>The journey</span><MenuGlyph /></button></SheetTrigger>
        <SheetContent className="journey-menu" showCloseButton={false} data-lenis-prevent onCloseAutoFocus={(event) => {
          if (pendingChapter.current !== null) {
            event.preventDefault();
            const destination = pendingChapter.current;
            pendingChapter.current = null;
            controller.current?.setMenuOpen(false);
            goTo(destination);
          }
        }}>
          <div className="menu-heading"><SheetTitle>The journey</SheetTitle><SheetClose className="menu-close" aria-label="Close the journey menu"><MenuGlyph close /></SheetClose></div>
          <SheetDescription className="menu-intro">Six moments in a living landscape.</SheetDescription>
          <nav aria-label="Chapters"><ol className="chapter-list">{CHAPTERS.map((chapter, index) => <li key={chapter.id}>
            <a href={`#${chapter.id}`} aria-current={index === active ? "location" : undefined} onClick={(event) => { event.preventDefault(); chooseChapter(index); }}><span className="chapter-number">{numberOf(index)}</span><span className="chapter-name">{chapter.name}<small>{chapter.note}</small></span><span className="chapter-mark" aria-hidden="true" /></a>
          </li>)}</ol></nav>
          <div className="menu-preferences"><div><label htmlFor="gentle-motion">Living motion</label><p>{systemReduced ? "Following your system preference." : "A little movement. A slower pace."}</p></div><Switch id="gentle-motion" className="motion-switch" checked={Boolean(motionEnabled && !systemReduced)} onCheckedChange={toggleMotion} disabled={systemReduced} /></div>
          <p className="menu-signoff">A place to be, for a moment.</p>
        </SheetContent>
      </Sheet>
    </header>

    <main id="garden" className="story"><div className="stage">
      <div className="worlds" aria-hidden="true">
        <div className="world world-pavilion"><div className="camera camera-pavilion"><Photograph name="pavilion" priority /><canvas className="living-canvas" data-surface="water" /></div></div>
        <div className="world world-water"><div className="camera camera-water"><Photograph name="water" /><canvas className="living-canvas" data-surface="reflection" /></div></div>
        <div className="world world-fern"><div className="camera camera-fern"><Photograph name="fern" /><div className="leaf-light" /></div></div>
        <div className="world world-meadow"><div className="camera camera-meadow"><Photograph name="meadow" /><canvas className="living-canvas" data-surface="wind" /></div></div>
        <div className="water-shade" />
      </div>
      <section className="scene scene-arrival" id="arrival" aria-labelledby="arrival-heading" data-chapter="0">
        <Photograph name="pavilion" priority className="still-visual" alt="Morning light across a limestone pavilion, ferns and a reflecting pool." />
        <div className="scene-copy arrival-copy"><h1 id="arrival-heading" tabIndex={-1}><span>A living</span><em>spring.</em></h1><p className="arrival-intro">A quiet passage<br className="desktop-break" /> through nature, space,<br className="desktop-break" /> and the light between.</p></div>
        <a className="scroll-invitation" href="#understory" onClick={(event) => { event.preventDefault(); goTo(1); }}><span className="scroll-thread" aria-hidden="true" />Scroll to wander</a>
      </section>
      <section className="scene scene-understory" id="understory" aria-labelledby="understory-heading" data-chapter="1">
        <Photograph name="fern" className="still-visual" alt="A fresh fern illuminated from behind, with light passing through its delicate leaves." />
        <div className="scene-copy understory-copy"><h2 id="understory-heading" tabIndex={-1}><span>A world,</span><span>within.</span></h2><p>Look closer.<br />There is a landscape in every leaf.</p></div>
      </section>
      <section className="scene scene-architecture" id="architecture" aria-labelledby="architecture-heading" data-chapter="2">
        <Photograph name="pavilion" className="still-visual" alt="A pale stone roof frames a tree and lush plants beside the garden pool." />
        <div className="spatial-lines" aria-hidden="true"><span /><span /></div>
        <div className="scene-copy architecture-copy"><h2 id="architecture-heading" tabIndex={-1}><span>Room</span><span>to</span><em>grow.</em></h2><p>A wall frames<br />the garden.<br />The garden softens<br />the wall.</p></div>
      </section>
      <section className="scene scene-water" id="water" aria-labelledby="water-heading" data-chapter="3">
        <Photograph name="water" className="still-visual" alt="Trees and limestone reflected in the quiet surface of the pool." />
        <div className="scene-copy water-copy"><h2 id="water-heading" tabIndex={-1}><span>Let the world</span><em>settle.</em></h2><p>Light becomes water. Water becomes sky.</p></div>
      </section>
      <section className="scene scene-open-air" id="open-air" aria-labelledby="open-air-heading" data-chapter="4">
        <Photograph name="meadow" className="still-visual" alt="A quiet path through white wildflowers and soft grasses, leading into a misty spring landscape." />
        <div className="scene-copy open-air-copy"><h2 id="open-air-heading" tabIndex={-1}><span>Nothing</span><span>stays <em>still.</em></span></h2><p>Not the light.<br />Not the water.<br />Not even the silence.</p></div>
      </section>
      <section className="scene scene-coda" id="coda" aria-labelledby="coda-heading" data-chapter="5">
        <Photograph name="meadow" className="still-visual" alt="A last glimpse of the open meadow and its small white flowers." />
        <div className="scene-copy coda-copy"><h2 id="coda-heading" tabIndex={-1}><span>Stay a little</span><span>longer.</span></h2><p>Spring has nowhere else to be.</p><a className="begin-again" href="#arrival" onClick={(event) => { event.preventDefault(); goTo(0); }}>Begin again</a></div>
      </section>
    </div></main>
    <footer className="journey-footer" aria-label="Journey progress"><span className="scene-label"><span>{numberOf(active)}</span><span className="label-divider">/</span>{CHAPTERS[active].name}</span><nav className="scene-ticks" aria-label="Jump to a chapter">{CHAPTERS.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} aria-label={`${numberOf(index)} — ${chapter.name}`} aria-current={active === index ? "step" : undefined} onClick={(event) => { event.preventDefault(); goTo(index); }}><span /><span className="tick-label">{chapter.name}</span></a>)}</nav></footer>
    <div className={`loading-veil ${loading ? "is-loading" : ""}`} aria-hidden={!loading}><span className="brand">VERDANT</span><span className="loading-line" /><span className="loading-caption">A living spring</span></div>
  </div>;
}
