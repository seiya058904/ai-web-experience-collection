import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './materials.js';
import './type-handoff.js';

window.Lenis = Lenis;
await import('../app.js');
