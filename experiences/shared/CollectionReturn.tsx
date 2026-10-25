import './collection-return.css';
import { collectionReturnHref } from './collection-navigation';
export function CollectionReturn(){return <a className="collection-return" href={collectionReturnHref()} aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a>}
