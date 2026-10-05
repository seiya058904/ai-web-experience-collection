import { CollectionReturn } from '../../../shared/CollectionReturn';
'use client';

import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '../../../shared/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../shared/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui/tabs';
import { CHAPTERS, SUBSYSTEMS, SOURCES, type Destination, type Subsystem } from '../../lib/orbital/mission';
import type { MissionController } from '../../lib/orbital/controller';
import { OrbitMark, SoundIcon, MenuIcon, ReplayIcon, ScrollIcon, EngineeringOverlay } from './Icons';

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<MissionController | null>(null);
  const [active, setActive] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [destination, setDestination] = useState<Destination>('mars');
  const [subsystem, setSubsystem] = useState<Subsystem>('propulsion');

  useEffect(() => {
    let cancelled = false;
    import('../../lib/orbital/controller').then(({ createMission }) => {
      if (cancelled || !root.current) return;
      controller.current = createMission(root.current, setActive, setReduced);
    }).catch(() => { root.current?.setAttribute('data-load-error', 'true'); });
    return () => { cancelled = true; controller.current?.destroy(); controller.current = null; };
  }, []);

  function goTo(index: number) {
    setIndexOpen(false);
    controller.current?.setLocked(false);
    controller.current?.goTo(index);
  }
  function openIndex(open: boolean) { setIndexOpen(open); controller.current?.setLocked(open || creditsOpen); }
  function openCredits(open: boolean) { setCreditsOpen(open); controller.current?.setLocked(open || indexOpen); }
  function changeDestination(value: string) { const d = value as Destination; setDestination(d); controller.current?.setDestination(d); }
  function changeSubsystem(value: string) { const s = value as Subsystem; setSubsystem(s); controller.current?.setSubsystem(s); }
  async function toggleSound() { const enabled = await controller.current?.toggleSound(); setSound(Boolean(enabled)); }
  function toggleMotion() { const next = !reduced; setReduced(next); controller.current?.setReduced(next); }

  return <main ref={root} className="mission-root" data-scene="earth" data-phase="hold" data-renderer="loading">
    <a className="skip-link" href="#mission-reading">Read the mission</a>
    <header className="site-header">
      <button className="wordmark" onClick={() => goTo(0)} aria-label="ORBITAL — return to Earth"><OrbitMark/><span>ORBITAL</span></button>
      <nav className="primary-nav" aria-label="Main navigation">
        <button onClick={() => goTo(0)}>Mission</button><button onClick={() => goTo(4)}>The vehicle</button><button onClick={() => goTo(6)}>Destinations</button>
      </nav>
      <div className="header-actions">
        <CollectionReturn />
        <button className="sound-button" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Mute ambient sound' : 'Enable ambient sound'} title={sound ? 'Sound on' : 'Sound off'}><SoundIcon enabled={sound}/></button>
        <Sheet open={indexOpen} onOpenChange={openIndex}>
          <SheetTrigger asChild><button className="index-button" aria-label="Mission index"><span>Mission index</span><MenuIcon/></button></SheetTrigger>
          <SheetContent className="mission-index" data-lenis-prevent>
            <SheetHeader><p className="mono orange">FLIGHT PLAN / 01—08</p><SheetTitle>The mission.</SheetTitle><SheetDescription>From our home planet to the great unknown. Choose a chapter to explore.</SheetDescription></SheetHeader>
            <nav aria-label="Mission chapters" className="index-chapters">{CHAPTERS.map((c,i)=><button key={c.id} onClick={() => goTo(i)} aria-current={active===i?'step':undefined}><span className="mono">0{i+1}</span><span>{c.name}</span><span className="index-marker"/></button>)}</nav>
            <div className="index-footer"><button onClick={toggleMotion} className="motion-option"><span>Reduced motion</span><span className="mono">{reduced?'ON':'OFF'}</span></button><button onClick={() => {setIndexOpen(false);openCredits(true);}} className="credits-link">Sources & credits</button><p className="mono">ORBITAL / AN ILLUSTRATIVE MISSION</p></div>
          </SheetContent>
        </Sheet>
      </div>
    </header>

    <div className="scroll-track" data-scroll-track>
      <div className="mission-viewport">
        <div className="visual-stage" aria-hidden="true">
          <img className="scene-background earth-background" src={import.meta.env.BASE_URL + "orbital/media/hero-earth.webp"} alt="" fetchPriority="high" decoding="async" draggable="false"/>
          <img className="scene-background launch-background" src={import.meta.env.BASE_URL + "orbital/media/launch.webp"} alt="" decoding="async" draggable="false"/>
          <img className="scene-background mars-background" src={import.meta.env.BASE_URL + "orbital/media/mars.webp"} alt="" decoding="async" draggable="false"/>
          <canvas className="universe-canvas" data-universe/>
          <div className="scene-vignette"/>
          <div className="technical-layer" data-technical><EngineeringOverlay/></div>
          <div className="ascent-scale" data-ascent-scale>{[100,80,60,40,20,0].map(n=><div key={n}><span>{n}</span><i/></div>)}<small>KM</small></div>
          <div className="orbital-crosshair crosshair-a"/><div className="orbital-crosshair crosshair-b"/>
        </div>

        <div className="scene-content">
          {CHAPTERS.map((chapter, i) => <section key={chapter.id} id={'chapter-'+chapter.id} className={'chapter chapter-'+chapter.id} data-chapter={i} aria-label={chapter.name} aria-hidden={i!==active}>
            <div className="chapter-copy">
              {i>0 && i<7 && <p className="chapter-kicker mono"><span>0{i+1}</span><i/>{chapter.label}</p>}
              {i===0 ? <h1>{chapter.title.map(line=><span key={line}>{line}</span>)}</h1> : <h2>{chapter.title.map(line=><span key={line}>{line}</span>)}</h2>}
              <p className="chapter-description">{chapter.description}</p>
              {i===0 && <button className="begin-button" onClick={() => goTo(1)}><span>Begin the mission</span><span className="button-orbit" aria-hidden="true"/></button>}
              {i===1 && <div className="flight-metrics"><div><span>THRUST</span><strong className="ice">NOMINAL</strong></div><div><span>VELOCITY</span><strong><b data-flight-speed>0000</b> <small>M/S</small></strong></div><div><span>ALTITUDE</span><strong><b data-flight-altitude>000</b> <small>KM</small></strong></div></div>}
              {i===2 && <div className="science-note"><p className="mono orange">MAX-Q / DYNAMIC PRESSURE</p><p>Where speed meets dense air, the structural load peaks. After Max-Q, the pressure begins to fall.</p><div className="pressure-graph" aria-hidden="true"><svg viewBox="0 0 320 55" fill="none"><path d="M0 48h320M0 0v50" stroke="#78838b" strokeOpacity=".3"/><path d="M0 48C35 48 50 45 72 30S99 0 118 9s24 30 65 34 80 4 137 5" stroke="currentColor" strokeWidth="1.5"/><circle cx="108" cy="8" r="3" fill="currentColor"/><path d="M108 8v40" stroke="currentColor" strokeDasharray="2 4" opacity=".4"/></svg></div></div>}
              {i===3 && <div className="separation-state mono"><span className="separation-dot"/>STAGE SEPARATION<div>LESS MASS. MORE POSSIBILITY.</div></div>}
              {i===4 && <Tabs value={subsystem} onValueChange={changeSubsystem} className="machine-tabs" orientation="vertical"><TabsList variant="line" aria-label="Vehicle systems">{SUBSYSTEMS.map((s,j)=><TabsTrigger key={s.id} value={s.id}><span className="mono">0{j+1}</span>{s.name}</TabsTrigger>)}</TabsList>{SUBSYSTEMS.map(s=><TabsContent key={s.id} value={s.id}><p>{s.description}</p><span className="mono ice">{s.value}</span></TabsContent>)}</Tabs>}
              {i===5 && <><div className="orbital-speed"><strong>7.7</strong><span className="mono">KM / S</span></div><p className="reference-caption">Approximate orbital speed at 400 km altitude.</p><p className="orbit-explanation">Gravity is still here. You and your spacecraft are falling together.</p></>}
              {i===6 && <Tabs value={destination} onValueChange={changeDestination} className="destination-tabs"><TabsList variant="line" aria-label="Choose a destination"><TabsTrigger value="moon">MOON</TabsTrigger><TabsTrigger value="mars">MARS</TabsTrigger></TabsList><TabsContent value="mars"><p className="destination-value">55–400 <small>MILLION KM</small></p><p>The Earth–Mars distance is always changing.<br/>Even light takes about 3–22 minutes, one way.</p></TabsContent><TabsContent value="moon"><p className="destination-value">384,400 <small>KM</small></p><p>Our nearest world. A quarter of a million miles away.<br/>Average distance from Earth.</p></TabsContent></Tabs>}
              {i===7 && <button className="replay-button" onClick={() => goTo(0)}>Replay the mission<ReplayIcon/></button>}
            </div>
            {i===0 && <div className="earth-annotation mono"><span>OUR POINT OF DEPARTURE</span><strong>EARTH</strong><span>One planet. Everything we know.</span></div>}
            {i===4 && <div className="machine-callouts mono"><span className="callout-payload">PAYLOAD<i/></span><span className="callout-stage">UPPER STAGE<i/></span><span className="callout-booster">BOOSTER<i/></span></div>}
            {i===5 && <div className="orbit-annotation mono">LOW EARTH ORBIT<span>ALT / ~400 KM</span><span>PERIOD / ~93 MIN</span></div>}
            {i===7 && <div className="ending-footer"><span className="mono">ORBITAL / BEYOND THE FAMILIAR</span><button onClick={() => openCredits(true)}>Sources & credits</button></div>}
          </section>)}
        </div>

        <aside className="chapter-rail" aria-label="Chapter navigation">{CHAPTERS.map((c,i)=><button key={c.id} onClick={() => goTo(i)} aria-label={'Chapter '+(i+1)+': '+c.name} aria-current={i===active?'step':undefined}><span>0{i+1}</span><i/></button>)}</aside>
        <div className="mission-caption"><span className="current-chapter mono"><span className="orange">0{active+1}</span><i>/</i>{CHAPTERS[active].name.toUpperCase()}</span><span className="scroll-hint mono"><ScrollIcon/>SCROLL TO EXPLORE</span><button className="simulation-note mono" onClick={() => openCredits(true)}>ILLUSTRATIVE MISSION</button></div>
        <nav className="mission-timeline" aria-label="Mission timeline"><div className="timeline-base"/><div className="timeline-progress" data-timeline-progress/>{CHAPTERS.map((c,i)=><button key={c.id} onClick={() => goTo(i)} aria-current={active===i?'step':undefined}><i/><span className="mono">{c.name.toUpperCase()}</span></button>)}</nav>
      </div>
    </div>

    <section id="mission-reading" className="mission-reading" aria-label="Mission reading mode"><h2 tabIndex={-1}>The mission, in words.</h2><p>An accessible reading companion to the journey.</p>{CHAPTERS.map((c,i)=><article key={c.id}><h3>0{i+1} / {c.name}</h3><p>{c.description}</p>{i===2&&<p>Max-Q is the point of highest dynamic pressure during ascent, determined by speed and atmospheric density.</p>}{i===5&&<p>At about 400 km altitude, an orbit takes roughly 93 minutes at approximately 7.7 km/s. Astronauts float because they and their spacecraft are falling together.</p>}{i===6&&<p>The Moon is an average of 384,400 km from Earth. Earth–Mars distance varies from around 55 to 400 million km.</p>}</article>)}<button onClick={() => goTo(0)}>Return to the visual mission</button><button onClick={() => openCredits(true)}>Sources & credits</button></section>

    <Dialog open={creditsOpen} onOpenChange={openCredits}><DialogContent className="credits-dialog" data-lenis-prevent><p className="mono orange">THE SCIENCE BEHIND THE JOURNEY</p><DialogTitle>Sources & credits.</DialogTitle><DialogDescription>This is an illustrative mission. The flight path, timing, vehicle, scale and changing readouts are simplified for the experience. Reference facts come from the sources below.</DialogDescription><div className="source-list">{SOURCES.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><span>{s.title}</span><small>{s.publisher}</small></a>)}</div><p className="credits-fineprint">Earth texture: NASA / Goddard Space Flight Center Scientific Visualization Studio; Reto Stöckli, NASA Earth Observatory. Moon texture: NASA’s Scientific Visualization Studio. Cinematic backgrounds: original AI-generated visualizations. Vehicle: original conceptual engineering model. No affiliation with or endorsement by NASA, SpaceX or other space agencies.</p></DialogContent></Dialog>
    <noscript><style>{'.mission-reading{position:relative!important;clip-path:none!important;width:auto!important;height:auto!important;padding:5rem 6vw!important;overflow:visible!important}.scroll-track{height:100svh!important}'}</style></noscript>
  </main>;
}
