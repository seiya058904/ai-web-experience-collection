export function OrbitMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="1.3"/><ellipse cx="24" cy="24" rx="24" ry="7" transform="rotate(-38 24 24)" stroke="currentColor" strokeWidth="1.1"/><circle cx="37" cy="11" r="3" fill="currentColor"/></svg>;
}
export function SoundIcon({ enabled }: { enabled: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>{enabled ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> : <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>}</svg>;
}
export function MenuIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.3"/></svg>; }
export function ReplayIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5.5 7.5a8 8 0 1 1-1 8M5 3v5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
export function ScrollIcon() { return <svg viewBox="0 0 18 30" fill="none" aria-hidden="true"><rect x="3.5" y="1" width="11" height="19" rx="5.5" stroke="currentColor"/><path d="M9 5v5M5 25l4 4 4-4" stroke="currentColor" strokeLinecap="round"/></svg>; }
export function EngineeringOverlay() {
  return <svg className="engineering-drawing" viewBox="0 0 1400 800" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth=".65">
      <circle cx="590" cy="170" r="95"/><circle cx="590" cy="170" r="88"/><circle cx="590" cy="170" r="18"/>
      {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <g key={i}><circle cx={590+57*Math.cos(a)} cy={170+57*Math.sin(a)} r="20"/><circle cx={590+57*Math.cos(a)} cy={170+57*Math.sin(a)} r="15"/></g>})}
      <path d="M470 170h240M590 50v240M820 620h400l55 25-55 25H820Z M850 620v50m200-50v50m90-50v50M810 700h470M820 690v20m230-20v20m225-20v20"/>
      <path d="M820 610v-20m455 45v-45M420 350h850M420 540h850" strokeDasharray="4 8"/>
      <path d="M390 700V365l70-60M920 100h190l75 95M800 455v70h200"/>
    </g>
    <g fill="currentColor" fontSize="11" fontFamily="monospace"><text x="706" y="98">ENGINE ARRAY</text><text x="823" y="728">BOOSTER</text><text x="1060" y="728">UPPER STAGE</text><text x="1200" y="728">FAIRING</text><text x="460" y="302">STRUCTURAL AXIS</text></g>
  </svg>;
}
