export const chapters = [
  { id: 'material', name: 'Material', title: 'SILICON', description: 'A single crystal. A surface of possibilities.', note: 'Single crystal · sliced · polished' },
  { id: 'pattern', name: 'Pattern', title: 'Written<br>in light.', description: 'A pattern becomes a possibility. Light changes a delicate film, leaving instructions for what comes next.', note: 'EUV · 13.5 nm · reflective optics' },
  { id: 'build', name: 'Build', title: 'A world,<br>layer by layer.', description: 'Add a film. Define a pattern. Remove what is not needed. Repeat, until a surface becomes an architecture.', note: 'Deposit · pattern · etch · repeat' },
  { id: 'transistor', name: 'Transistor', title: 'Small enough.<br>To change<br>everything.', description: 'Three silicon channels. A gate around them. A tiny change in voltage decides whether current can flow.', note: 'Gate-all-around · nanosheet structure' },
  { id: 'interconnect', name: 'Interconnect', title: 'Nothing<br>works alone.', description: 'Above the switches, a city of metal takes shape. Routes cross the surface. Vias connect the heights.', note: 'Metal routes · dielectric · vertical vias' },
  { id: 'package', name: 'Package', title: 'Many dies.<br>One whole.', description: 'Logic and stacked memory meet on a shared foundation. Every connection brings the system closer together.', note: 'Logic · HBM · interposer · substrate' },
  { id: 'signal', name: 'Signal', title: 'The first<br>pulse.', description: 'The architecture is complete. Now a change travels through it. A state becomes a signal. A signal becomes information.', note: 'Activity · information · heat' },
  { id: 'silicon', name: 'Silicon', title: 'Matter,<br>awakened.', description: 'From sand to signal.', note: 'An architecture of possibility.' },
] as const;

export const references = [
  ['SUMCO', 'The making of a silicon wafer', 'https://www.sumcosi.com/english/products/process/'],
  ['ASML', 'Semiconductor manufacturing', 'https://www.asml.com/en/company/stories/2021/semiconductor-manufacturing-process-steps'],
  ['ASML', 'EUV and reflective optics', 'https://www.asml.com/en/products/euv-lithography-systems'],
  ['imec', 'The nanosheet transistor', 'https://www.imec-int.com/en/articles/entering-nanosheet-transistor-era-0'],
  ['IBM Research', 'Stacked gate-all-around nanosheets', 'https://research.ibm.com/publications/stacked-nanosheet-gate-all-around-transistor-to-enable-scaling-beyond-finfet'],
  ['imec', 'BEOL nano-interconnects', 'https://www.imec-int.com/en/expertise/cmos-advanced/compute/beol'],
  ['TSMC', 'Advanced packaging and interposers', 'https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm'],
  ['SK hynix', 'Stacked memory and packaging', 'https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/'],
] as const;
