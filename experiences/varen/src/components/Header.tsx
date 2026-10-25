import { CollectionReturn } from '../../../shared/CollectionReturn';
import { Anchor, Icon } from './Primitives';

export function Header({ count, onSaved, onMenu }: { count: number; onSaved: () => void; onMenu: () => void }) {
  return <header className="site-header"><nav className="container header-inner" aria-label="Main navigation">
    <div className="nav-left"><Anchor href="#collection">Collection</Anchor><Anchor href="#the-cut">The cut</Anchor></div>
    <Anchor href="#top" className="wordmark" aria-label="VAREN home">VAREN</Anchor>
    <div className="nav-right"><CollectionReturn /><button className="text-button header-saved" onClick={onSaved}><span>Saved</span><span className="saved-count">({count})</span></button><button className="icon-button menu-toggle" onClick={onMenu} aria-label="Open navigation menu"><Icon name="menu" size={25} /></button></div>
  </nav></header>;
}
