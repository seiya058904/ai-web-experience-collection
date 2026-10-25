import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Collection } from './components/Collection';
import { CutStudy, DetailChapter, Wardrobe } from './components/Editorial';
import { Overlay } from './components/Overlay';
import { Anchor, Icon } from './components/Primitives';
import { SmoothScroll, useScroll } from './motion';
import { useLocationState, useSavedLooks } from './hooks';
import type { Look } from './data';

function Site() {
  const location = useLocationState();
  const { saved, toggle, notice } = useSavedLooks();
  const [menu, setMenu] = useState(false);
  const { scrollTo } = useScroll();
  const openLook = (look: Look) => location.update({ look: look.id }, true);
  const openSaved = () => { setMenu(false); location.update({ view: 'saved', look: null }, true); };
  const dismiss = () => { if (menu && !location.look && !location.saved) setMenu(false); else location.close(); };
  const navigate = (target: string) => {
    setMenu(false);
    if (location.look || location.saved) location.update({ look: null, view: null }, false, true);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(target)));
  };
  return <>
    <a className="skip-link" href="#collection">Skip to the collection</a>
    <Header count={saved.length} onSaved={openSaved} onMenu={() => setMenu(true)} />
    <main id="top"><Hero /><Collection category={location.category} saved={saved} onCategory={category => location.update({ category: category === 'All' ? null : category })} onOpen={openLook} onSave={toggle} /><CutStudy /><DetailChapter /><Wardrobe onOpen={openLook} /></main>
    <footer className="site-footer"><div className="container"><div className="footer-top"><Anchor href="#top" className="footer-wordmark" aria-label="VAREN home">VAREN</Anchor><p>A considered wardrobe.<br />A distinct point of view.</p></div><div className="footer-nav"><nav aria-label="Footer navigation"><Anchor href="#collection">Collection</Anchor><Anchor href="#the-cut">The cut</Anchor><button className="text-button" onClick={openSaved}>Saved looks</button></nav><Anchor href="#top" className="back-top">Back to top<Icon name="arrow" size={20} /></Anchor></div><div className="footer-bottom"><p>An independent menswear concept. All garment imagery is AI-generated.</p><span>Designed to be considered.</span></div></div></footer>
    <Overlay look={location.look} savedView={location.saved} menu={menu} saved={saved} onDismiss={dismiss} onOpen={openLook} onSave={toggle} onNavigate={navigate} onSaved={openSaved} />
    <ScrollLock locked={menu || !!location.look || location.saved} />
    <div className={`toast ${notice ? 'is-visible' : ''}`} role="status" aria-live="polite">{notice}</div>
  </>;
}

// Lock state is sent upwards without creating another Lenis instance.
import { createContext, useContext, useEffect } from 'react';
const LockContext = createContext<(locked: boolean) => void>(() => {});
function ScrollLock({ locked }: { locked: boolean }) {
  const setLocked = useContext(LockContext);
  useEffect(() => { setLocked(locked); return () => setLocked(false); }, [locked, setLocked]);
  return null;
}

export default function App() {
  const [locked, setLocked] = useState(false);
  return <LockContext.Provider value={setLocked}><SmoothScroll locked={locked}><Site /></SmoothScroll></LockContext.Provider>;
}
