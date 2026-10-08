import { clamp, mix, smooth, range, colorMix, readable, rgb, personality } from './math.ts';
import type { RGB } from './math.ts';
import { routeHandoff } from './handoff.ts';
import { routeDesktopSupplement } from './handoff-desktop.ts';

export const CONTENT_KEYS = ['title', 'subtitle', 'number', 'image', 'body', 'meta', 'place', 'action', 'mark'] as const;
export type ContentKey = typeof CONTENT_KEYS[number];
export type Family = 0 | 1 | 2;
export type Axes = { wght: number; wdth: number; slnt: number; opsz: number };
export type Box = { x: number; y: number; w: number; h: number; size: number; rotate: number; sx: number; sy: number; opacity: number; tracking: number; leading: number; family: Family; weight: number; accent: number; border: number; z: number };
export type View = { w: number; h: number; mobile: boolean };
export type Frame = { x: number; y: number; w: number; h: number; opacity: number; border: number };
export type Design = {
  viewport: View;
  parts: Record<ContentKey, Box>; paper: RGB; ink: RGB; accent: RGB;
  axes: Axes; cols: number; rows: number; guide: number; skew: number;
  cropX: number; cropY: number; zoom: number; raster: number;
  outline: number; numberOutline: number; typeCrop: number; stack: number; tension: number;
  point: number; rawPanel: number; frame: Frame;
};
export type Scene = { slug: string; name: string; verb: string; statement: string; rules: string[] };
export const SCENES: Scene[] = [
  {slug:'zero',name:'Zero',verb:'Establish a point',statement:'Before order, a point of reference.',rules:['One registration point. No visible columns.','The word begins at the scale of a label.','The photograph is a small, constant specimen.','Empty space gives the point its significance.','Paper, ink, one signal.','Scroll, or choose a system from the index.','A point extends into a baseline; the same word grows.']},
  {slug:'system',name:'System',verb:'Draw the relationships',statement:'A line becomes a relationship.',rules:['Twelve physical columns and a shared baseline.','Scale separates the heading from its supporting information.','The image finds a measured rectangle.','Margins and intervals follow the same unit.','A nearly white field exposes every alignment.','Follow the guides as the composition takes shape.','Lines extend in sequence; content settles onto their intersections.']},
  {slug:'international',name:'International',verb:'Align · Snap · Lock',statement:'Precision gives information a voice.',rules:['An asymmetric twelve-column composition.','A grotesk, flush left, with a deliberate hierarchy.','Objective photography, cropped to the column structure.','A clear separation between title, text and evidence.','Black and white. Red carries one deliberate emphasis.','The next system keeps every piece of information.','Fast, exact alignment followed by a restrained refinement.']},
  {slug:'basel',name:'Basel / Tension',verb:'Bend · Offset · Stretch',statement:'A rule becomes visible when it is tested.',rules:['The original grid persists under a controlled shear.','Rotation, width and letter displacement create tension.','The same frame is rotated and recropped.','Compression in one area opens space in another.','Pale acid yellow, ink and a sharp red reference.','Scroll slowly to follow the letter offsets.','Each element bends around its own stable anchor.']},
  {slug:'type-image',name:'Type as image',verb:'Scale · Crop · Repeat',statement:'The word is now the image.',rules:['The contours of the letters become the dominant edges.','One enormous word; a new role for the same four letters.','Photography contracts to a small piece of evidence.','Readable content occupies a separate lower register.','Vermilion becomes the surface. Black becomes form.','The display word can crop; its semantic identity remains.','The word expands out of its frame without being replaced.']},
  {slug:'editorial',name:'Editorial',verb:'Flow · Pace · Breathe',statement:'Hierarchy changes emotion.',rules:['Six broad columns, generous margins, one image bleed.','Instrument Serif gives the title a quieter, contrasting voice.','The photograph occupies a tall, uninterrupted field.','A broad pause separates the heading and the reading text.','Ivory, ink and a single cobalt folio.','Hold the page. Notice the changed reading order.','A geometric handoff opens into slower, softer spacing.']},
  {slug:'raw',name:'Raw',verb:'Expose · Clash · Assert',statement:'The structure refuses to disappear.',rules:['The outer boundary and internal seams are exposed.','A dense headline meets a hard image edge.','The photograph sits against a plainly visible frame.','Tight blocks collide with a separate readable register.','Acid yellow, ink and a paper-coloured text field.','The visible action remains a usable action.','A short, controlled cut makes the structural change explicit.']},
  {slug:'electronic',name:'Electronic',verb:'Quantize · Scan · Refresh',statement:'A column becomes a pixel.',rules:['Columns divide into discrete cells and character positions.','Local monospaced type takes on a dot-matrix treatment.','A real Canvas quantizes the same photograph.','Positions and scan changes follow discrete increments.','Black, phosphor green, cool white and restrained amber.','The scan follows scroll; a stopped frame stays still.','The image refreshes in measured steps, without flicker.']},
  {slug:'interface',name:'Interface',verb:'Reflow · Resize · Respond',statement:'The page learns to adapt.',rules:['An actual CSS Grid responds to the width of its container.','Text reflows rather than shrinking as a screenshot.','The same media frame moves between paired and stacked layouts.','Padding and gaps preserve relationships across breakpoints.','A neutral screen surface and one functional blue.','Drag the width control and inspect the result.','The container narrows from a page into a screen.']},
  {slug:'variable',name:'Variable',verb:'Interpolate · Modulate',statement:'Type becomes a continuous material.',rules:['Column density follows the same continuous progress as the type.','Four real Roboto Flex axes: weight, width, slant and optical size.','The photograph remains a stable visual comparison.','Small text keeps its measure while the display word changes.','A cool lilac field with restrained violet references.','Adjust any axis; Reset returns to the scroll-driven state.','A complete axis tuple is interpolated on the same heading.']},
  {slug:'synthesis',name:'Synthesis',verb:'Keep the decisions',statement:'One system, with a memory.',rules:['Shared proportional anchors with one deliberate offset.','A contemporary grotesk and a contrasting editorial subtitle.','A final crop gives the photograph its own weight.','Precise alignment and generous pacing share a single composition.','Paper, ink and one orange-red accent.','Look again, or continue until the guides disappear.','The previous decisions converge without becoming a collage.']},
  {slug:'no-grid',name:'No grid',verb:'The order remains',statement:'The lines leave. The relationships stay.',rules:['The twelve-column relationships remain after the guides vanish.','The final type hierarchy stays exactly where it was established.','The photograph keeps its final crop and position.','Space does not move when its measurements disappear.','The synthesis palette remains intact.','Look again returns to the first point.','The same registration mark contracts back to a point.']}
];

export const AXIS_LIMITS = {wght:[100,1000],wdth:[25,151],slnt:[-10,0],opsz:[8,144]} as const;
export function sanitizeAxes(a: Partial<Axes>, defaults: Axes): Axes {
  const result = {...defaults};
  for (const key of Object.keys(AXIS_LIMITS) as (keyof Axes)[]) if (a[key] !== undefined) result[key] = clamp(a[key]!, ...AXIS_LIMITS[key]);
  return result;
}
const baseAxes = (): Axes => ({wght:850,wdth:100,slnt:0,opsz:144});
const clone = (state: Design): Design => structuredClone(state);

export function layout(index: number, v: View): Design {
  index = Math.round(clamp(index, 0, 11));
  const W = v.w, H = v.h, M = v.mobile;
  const body = clamp(W * .015, 15, 27), small = clamp(W * .009, 10, 17);
  const col = (n: number) => W * n / 12;
  const box = (x: number,y: number,w: number,h: number,size=body,extra: Partial<Box>={}): Box => ({x:x*W,y:y*H,w:w*W,h:h*H,size,rotate:0,sx:1,sy:1,opacity:1,tracking:0,leading:1.32,family:0,weight:440,accent:0,border:0,z:3,...extra});
  const p: Record<ContentKey,Box> = {
    title:box(0,.04,.72,.38,W*.30,{weight:850,tracking:-.04,leading:.82,z:4}),
    subtitle:box(0,.50,.53,.20,clamp(W*.042,28,90),{weight:650,tracking:-.025,leading:1.03}),
    number:box(.78,.12,.22,.32,H*.34,{weight:810,leading:.85,tracking:-.035,accent:1}),
    image:box(7/12,.49,5/12,.51,0,{z:2}),
    body:box(0,.775,.34,.14,body),
    meta:box(0,.895,.45,.03,small,{family:2}),
    place:box(0,.934,.38,.03,small,{family:2}),
    action:box(.375,.924,.18,.07,small+1,{family:2,accent:1}),
    mark:box(0,.68,.042,.075,0,{z:5})
  };
  const d: Design = {viewport:{...v},parts:p,paper:rgb('#f8f8f3'),ink:rgb('#121411'),accent:rgb('#d63121'),axes:baseAxes(),cols:12,rows:8,guide:.16,skew:0,cropX:50,cropY:50,zoom:1,raster:0,outline:0,numberOutline:0,typeCrop:0,stack:0,tension:0,point:0,rawPanel:0,frame:{x:0,y:0,w:W,h:H,opacity:0,border:0}};

  if (M) {
    Object.assign(p,{
      title:box(0,.03,1,.19,W*.455,{weight:850,tracking:-.045,leading:.82,z:4}),
      subtitle:box(0,.23,.76,.14,clamp(W*.076,24,34),{weight:650,tracking:-.025,leading:1.05}),
      number:box(.76,.28,.24,.13,W*.24,{weight:810,leading:.85,tracking:-.035,accent:1}),
      image:box(0,.43,1,.265,0,{z:2}),
      body:box(0,.735,1,.105,15),
      meta:box(0,.865,.7,.03,10,{family:2}),
      place:box(0,.901,.7,.03,10,{family:2}),
      action:box(.60,.923,.40,.073,11,{family:2,accent:1}),
      mark:box(0,.941,.075,.045,0,{z:5})
    });
  }

  if (index === 0) {
    d.guide=0;d.point=1;
    if (!M) Object.assign(p,{
      title:box(0,.855,.16,.12,clamp(W*.059,56,150),{weight:820,tracking:-.04,leading:.82}),
      subtitle:box(.16,.872,.165,.11,clamp(W*.014,16,30),{weight:570,leading:1.10}),
      body:box(.36,.86,.2,.135,clamp(W*.0096,12,20)),
      meta:box(.59,.872,.20,.04,small,{family:2}),place:box(.59,.909,.20,.04,small,{family:2}),
      action:box(.59,.945,.19,.055,small,{family:2,accent:1}),
      number:box(.81,.862,.08,.10,clamp(W*.052,54,130),{weight:850,accent:1,leading:.85}),
      image:box(.9,.815,.1,.185,0,{z:2}),mark:box(2/3,.44,6/W,6/H,0,{z:5})
    }); else Object.assign(p,{
      title:box(0,.55,.65,.12,W*.29,{weight:850,tracking:-.04,leading:.82}),
      subtitle:box(0,.685,.71,.09,19,{weight:570,leading:1.10}),
      body:box(0,.788,.73,.12,13),meta:box(0,.913,.63,.04,9,{family:2}),
      place:box(0,.95,.6,.03,9,{family:2}),action:box(.43,.946,.3,.07,10,{family:2,accent:1}),
      number:box(.78,.573,.2,.09,W*.20,{weight:850,accent:1,leading:.85}),
      image:box(.79,.788,.21,.212,0,{z:2}),mark:box(2/3,.32,6/W,6/H,0,{z:5})
    });
  }
  if (index === 1) {
    d.guide=.46;d.outline=.75;d.axes.wght=660;d.axes.wdth=103;
    p.number.accent=0;p.number.weight=450;p.number.size*=.75;
    p.title.y+=H*.04;p.subtitle.y+=H*.02;
    if (!M) {p.image.x=col(6);p.image.w=col(4);p.image.y=H*.68;p.image.h=H*.32;p.body.w=col(4);p.subtitle.w=W*.46;p.mark.x=col(11);p.mark.y=H*.85;}
    else {p.subtitle.y=H*.26;p.image.y=H*.465;p.image.h=H*.22;p.number.y=H*.31;}
  }
  if (index === 3) {
    d.paper=rgb('#f0f18b');d.guide=.24;d.skew=-7;d.tension=1;
    d.axes={wght:960,wdth:76,slnt:-6,opsz:144};
    p.title.rotate=-7;p.title.x=-W*.012;p.title.y=H*.12;p.title.size=Math.min(W*.35,H*.63);
    p.subtitle.x=W*.04;p.subtitle.y=H*.66;p.subtitle.w=W*.52;p.subtitle.size=clamp(W*.034,28,70);
    p.image.x=W*.60;p.image.y=H*.49;p.image.w=W*.40;p.image.h=H*.51;p.image.rotate=-7;
    p.number.x=W*.80;p.number.y=H*.03;p.number.size=H*.24;p.number.rotate=-7;
    p.body.x=W*.04;p.body.y=H*.80;p.body.w=W*.43;p.body.family=2;p.body.size*=.87;
    p.meta.x=W*.04;p.place.x=W*.04;p.action.x=W*.405;p.action.y=H*.93;
    p.mark.x=W*.54;p.mark.y=H*.87;
    if (M) {
      p.title.x=-W*.025;p.title.y=H*.17;p.title.size=W*.53;
      p.subtitle.x=0;p.subtitle.y=H*.38;p.subtitle.w=W*.79;p.subtitle.size=27;
      p.number.x=W*.78;p.number.y=H*.015;p.number.size=W*.23;
      p.image.x=W*.41;p.image.y=H*.60;p.image.w=W*.59;p.image.h=H*.40;p.image.rotate=-6;
      p.body.x=0;p.body.y=H*.56;p.body.w=W*.40;p.body.size=13;p.body.leading=1.36;
      p.meta.x=0;p.meta.y=H*.84;p.meta.w=W*.40;p.meta.size=9;
      p.place.x=0;p.place.y=H*.894;p.place.w=W*.40;p.place.size=9;
      p.action.x=0;p.action.y=H*.934;p.action.w=W*.39;p.action.size=10;
      p.mark.x=W*.04;p.mark.y=H*.08;p.mark.w=28;p.mark.h=28;
    }
  }
  if (index === 4) {
    d.paper=rgb('#f2412d');d.accent=rgb('#fff5e9');d.guide=.055;d.cols=4;d.rows=4;
    d.axes={wght:1000,wdth:70,slnt:0,opsz:144};d.numberOutline=1;d.typeCrop=1;
    Object.assign(p,{
      title:box(-.055,-.02,1.12,.70,W*.59,{weight:1000,tracking:-.045,leading:.80,z:4}),
      subtitle:box(0,.735,.43,.17,clamp(W*.036,28,75),{family:1,leading:1.02}),
      body:box(.47,.76,.29,.18,body*.88,{family:2}),
      image:box(.865,.74,.135,.26,0,{z:2}),
      number:box(.76,.755,.12,.21,H*.225,{weight:400,accent:1,leading:.85}),
      meta:box(0,.946,.25,.03,small,{family:2}),place:box(.27,.946,.25,.03,small,{family:2}),
      action:box(.63,.932,.14,.067,small,{family:2}),mark:box(.69,.49,.053,.096,0,{accent:1,z:5})
    });
    if(M){
      d.stack=1;d.axes.wdth=151;
      Object.assign(p,{
        title:box(-.015,.005,1.07,.58,W*.65,{weight:1000,tracking:-.045,leading:.80,z:4}),
        subtitle:box(0,.60,.94,.115,27,{family:1,leading:1.02}),
        body:box(0,.735,.71,.13,12.5,{family:2}),
        number:box(.76,.775,.24,.14,W*.265,{weight:400,accent:1,leading:.85}),
        image:box(.785,.926,.215,.074,0,{z:2}),
        meta:box(0,.87,.75,.03,9,{family:2}),place:box(0,.908,.7,.03,9,{family:2}),
        action:box(0,.951,.42,.065,10,{family:2}),mark:box(.90,.52,.08,.044,0,{z:5})
      });
    }
  }
  if(index===5){
    d.paper=rgb('#f4f0e7');d.accent=rgb('#1749bc');d.cols=6;d.rows=4;d.guide=.065;
    Object.assign(p,{
      title:box(.03,.055,.65,.50,W*.355,{family:1,weight:400,tracking:-.025,leading:.82,z:4}),
      subtitle:box(.032,.60,.59,.16,clamp(W*.036,26,86),{family:1,leading:1.04}),
      image:box(.72,0,.28,1,0,{z:2}),
      body:box(.035,.82,.34,.13,body*.88,{family:2}),
      number:box(.48,.77,.21,.20,H*.26,{family:1,weight:400,accent:1,leading:.82}),
      meta:box(.03,.03,.37,.03,small,{family:2}),place:box(.50,.03,.2,.03,small,{family:2}),
      action:box(.32,.937,.19,.063,small,{family:2,accent:1}),mark:box(.03,.915,.04,.072,0,{z:5})
    });
    if(M)Object.assign(p,{
      title:box(.035,.085,.93,.18,W*.51,{family:1,weight:400,tracking:-.025,leading:.82,z:4}),
      subtitle:box(.04,.275,.94,.11,27,{family:1,leading:1.06}),
      image:box(.04,.412,.92,.285,0,{z:2}),body:box(.04,.744,.79,.125,13.5,{family:2}),
      number:box(.74,.872,.22,.118,W*.255,{family:1,weight:400,accent:1,leading:.82}),
      meta:box(.04,.018,.92,.04,9,{family:2}),place:box(.04,.889,.64,.03,9,{family:2}),
      action:box(.23,.946,.45,.068,10,{family:2,accent:1}),mark:box(.04,.949,.07,.04,0,{z:5})
    });
  }
  if(index===6){
    d.paper=rgb('#e5f629');d.ink=rgb('#10120e');d.accent=rgb('#10120e');d.cols=6;d.rows=3;d.guide=.28;d.rawPanel=1;
    d.frame={x:0,y:0,w:W,h:H,opacity:1,border:3};d.axes={wght:1000,wdth:65,slnt:0,opsz:144};
    Object.assign(p,{
      title:box(.017,.035,.605,.47,W*.325,{weight:1000,tracking:-.045,leading:.82,z:4}),
      subtitle:box(.03,.55,.56,.20,clamp(W*.055,32,100),{family:1,leading:.98}),
      image:box(.64,.025,.342,.49,0,{z:2}),
      body:box(.03,.79,.54,.11,body*.9,{family:2}),
      number:box(.72,.568,.24,.31,H*.39,{weight:1000,leading:.8,tracking:-.05}),
      meta:box(.03,.935,.35,.04,small,{family:2}),place:box(.40,.935,.24,.04,small,{family:2}),
      action:box(.735,.92,.17,.074,small+1,{family:2}),mark:box(.932,.93,.035,.06,0,{z:5})
    });
    if(M) Object.assign(p,{
      title:box(.035,.035,.92,.19,W*.49,{weight:1000,tracking:-.045,leading:.82,z:4}),
      image:box(.03,.27,.94,.24,0,{z:2}),
      subtitle:box(.04,.548,.72,.135,28,{family:1,leading:1.03}),
      number:box(.78,.56,.20,.14,W*.205,{weight:1000,leading:.8,tracking:-.05}),
      body:box(.04,.725,.92,.105,13.5,{family:2}),
      meta:box(.04,.865,.92,.035,9,{family:2}),place:box(.04,.904,.92,.035,9,{family:2}),
      action:box(.04,.941,.61,.06,11,{family:2}),mark:box(.88,.94,.075,.044,0,{z:5})
    });
  }
  if(index===7){
    d.paper=rgb('#080d09');d.ink=rgb('#e0e7db');d.accent=rgb('#8ef69f');d.cols=M?24:48;d.rows=18;d.guide=.23;d.raster=1;d.cropX=55;d.zoom=1.08;
    Object.assign(p,{
      title:box(.012,.115,.57,.29,W*.243,{family:2,weight:400,tracking:-.045,leading:.82,accent:1,z:4}),
      subtitle:box(.018,.50,.48,.16,clamp(W*.029,26,68),{family:2,leading:1.2}),
      image:box(.59,.15,.41,.67,0,{z:2}),
      number:box(.018,.694,.08,.08,clamp(W*.034,32,80),{family:2,weight:400,accent:1,leading:.85}),
      body:box(.12,.704,.40,.19,body*.91,{family:2}),
      meta:box(.018,.034,.5,.04,small,{family:2}),place:box(.74,.034,.26,.04,small,{family:2}),
      action:box(.018,.94,.30,.06,small+2,{family:2,accent:1}),mark:box(.92,.88,.065,.116,0,{z:5,accent:1})
    });
    if(M) Object.assign(p,{
      title:box(0,.105,1,.155,W*.428,{family:2,weight:400,tracking:-.045,leading:.82,accent:1,z:4}),
      subtitle:box(0,.298,.99,.13,22,{family:2,leading:1.15}),
      image:box(0,.464,1,.29,0,{z:2}),
      number:box(.87,.035,.13,.057,28,{family:2,weight:400,accent:1,leading:.85}),
      body:box(0,.79,.85,.13,13,{family:2}),
      meta:box(0,.019,.80,.053,9,{family:2}),place:box(0,.932,.6,.035,9,{family:2}),
      action:box(.54,.931,.46,.071,10,{family:2,accent:1}),mark:box(.916,.872,.07,.042,0,{z:5,accent:1})
    });
  }
  if(index===8){
    d.paper=rgb('#e2e4df');d.ink=rgb('#20251f');d.accent=rgb('#194fdb');d.guide=.09;d.cols=M?4:12;d.rows=6;
    // Actual CSS Grid endpoint measurements replace these initial boxes at boot.
    d.frame={x:W*.045,y:H*.035,w:W*.91,h:H*.86,opacity:1,border:1};
    p.title.size*=.61;p.title.y=H*.15;p.title.x=W*.08;
    p.image.x=W*.56;p.image.y=H*.15;p.image.w=W*.36;p.image.h=H*.66;
  }
  if(index===9){
    d.paper=rgb('#eeebf7');d.ink=rgb('#191820');d.accent=rgb('#6c3acc');d.cols=8;d.rows=5;d.guide=.22;
    d.axes={wght:390,wdth:105,slnt:0,opsz:70};
    Object.assign(p,{
      title:box(-.005,.045,1,.58,W*.405,{weight:390,tracking:-.04,leading:.82,z:4}),
      subtitle:box(.0,.69,.40,.17,clamp(W*.033,26,76),{family:1,leading:1.04}),
      body:box(.43,.71,.30,.15,body*.82,{family:2}),
      image:box(.80,.69,.20,.17,0,{z:2}),
      number:box(.85,.23,.14,.14,H*.17,{weight:240,leading:.85}),
      meta:box(0,.018,.4,.04,small,{family:2}),place:box(.40,.018,.4,.04,small,{family:2}),
      action:box(.83,.013,.17,.06,small,{family:2}),mark:box(.72,.727,.045,.08,0,{z:5})
    });
    if(M)Object.assign(p,{
      title:box(0,.14,1,.24,W*.46,{weight:390,tracking:-.04,leading:.82,z:4}),
      subtitle:box(0,.38,.98,.115,27,{family:1,leading:1.04}),
      body:box(0,.545,.61,.15,12.5,{family:2}),
      image:box(.68,.535,.32,.17,0,{z:2}),
      number:box(.76,.012,.21,.10,W*.18,{weight:240,leading:.85}),
      meta:box(0,.012,.69,.032,9,{family:2}),place:box(0,.050,.69,.032,9,{family:2}),
      action:box(.57,.733,.43,.062,10,{family:2}),mark:box(0,.731,.07,.04,0,{z:5})
    });
  }
  if(index>=10){
    d.paper=rgb('#f3f0e8');d.ink=rgb('#181915');d.accent=rgb('#d44818');d.guide=index===10?.21:0;d.cols=12;d.rows=6;
    d.axes={wght:880,wdth:88,slnt:0,opsz:144};d.cropX=62;d.zoom=1.05;d.point=index===11?1:0;
    Object.assign(p,{
      title:box(.01,.075,.64,.40,Math.min(W*.313,H*.5875),{weight:880,tracking:-.04,leading:.82,z:4}),
      subtitle:box(.012,.58,.55,.17,clamp(W*.043,28,91),{family:1,leading:1.02}),
      image:box(.64,.015,.36,.84,0,{z:2}),
      number:box(.145,.821,.13,.14,H*.17,{weight:780,accent:1,leading:.85,tracking:-.04}),
      body:box(.30,.815,.32,.14,body*.87,{family:2}),
      meta:box(.145,.974,.31,.025,small,{family:2}),place:box(.52,.974,.24,.025,small,{family:2}),
      action:box(.82,.95,.18,.062,small+1,{family:2}),mark:box(.025,.856,.045,.08,0,{z:5})
    });
    if(M)Object.assign(p,{
      title:box(0,.05,.99,.21,W*.48,{weight:880,tracking:-.04,leading:.82,z:4}),
      subtitle:box(.01,.296,.88,.13,30,{family:1,leading:1.02}),
      image:box(.01,.488,.99,.27,0,{z:2}),
      number:box(.01,.799,.24,.12,W*.24,{weight:780,accent:1,leading:.85,tracking:-.04}),
      body:box(.32,.800,.68,.14,13,{family:2}),
      meta:box(.01,.942,.67,.026,9,{family:2}),place:box(.01,.974,.67,.025,9,{family:2}),
      action:box(.62,.949,.38,.065,10,{family:2}),mark:box(.91,.034,.07,.04,0,{z:5})
    });
    if(index===11)Object.assign(p.mark,{x:W*2/3,y:H*(M?.32:.44),w:6,h:6});
  }
  // A portrait tablet has a page's column relationships, rather than an enlarged phone.
  if(!M&&W/H<1.1){
    if(index===0){p.title.size=Math.min(p.title.size,W*.052);p.subtitle.x=W*.155;p.subtitle.w=W*.18;p.body.size=12;}
    if(index===3){p.subtitle.y=H*.60;p.body.y=H*.77;}
  }
  // The two-digit specimen must fit its actual column, including on a tall
  // tablet where a height-derived display size would otherwise crop the 8.
  p.number.w=Math.min(p.number.w,W-p.number.x);
  p.number.size=Math.min(p.number.size,p.number.w/(p.number.family===1?1.05:1.2));
  // Geometry never depends on accumulated animation state.
  for(const [key,b] of Object.entries(p)){
    b.w=Math.max(1,b.w);b.h=Math.max(1,b.h);
    if(M&&['meta','place','action'].includes(key))b.size=Math.max(key==='action'?11:10,b.size);
    if(M&&key==='body')b.size=Math.max(13,b.size);
  }
  d.ink=readable(d.ink,d.paper);
  return d;
}

export function refine(state: Design, index: number, local: number, overrides: Partial<Axes>={}): Design {
  const d=clone(state), t=range(0,.36,local), wave=Math.sin(t*Math.PI);
  if(index===0){d.guide=.16*smooth(range(0,.36,local));d.cols=12;d.rows=1;}
  else if(index===9){
    d.axes=sanitizeAxes(overrides,{wght:mix(390,920,smooth(t)),wdth:mix(105,62,smooth(t)),slnt:mix(0,-9,smooth(t)),opsz:mix(70,144,smooth(t))});
    d.cols=mix(8,12,smooth(t));d.parts.title.tracking=mix(-.04,-.026,smooth(t));
  } else if(index!==8&&index!==10&&index!==11){
    d.parts.title.tracking+=wave*.0025;d.cropX+=wave*2.2;d.zoom+=wave*.014;
    d.guide+=wave*.026;d.parts.number.y+=wave*1.5;
    if(index===3){d.parts.title.rotate-=wave*.8;d.tension+=wave*.15;}
  }
  return d;
}

export function interpolate(a: Design,b: Design,t: number,next: number): Design {
  const d=clone(a), f=personality(next,t), safe=clamp(f);
  for(const key of CONTENT_KEYS){
    const x=a.parts[key],y=b.parts[key],z=d.parts[key];
    for(const prop of Object.keys(x) as (keyof Box)[]) {
      if(prop==='family'){z.family=(safe<.5?x.family:y.family);continue;}
      z[prop]=mix(x[prop],y[prop],f);
    }
    if(x.family!==y.family&&(key==='title'||key==='number')) z.sy*=.035+.965*Math.pow(Math.abs(2*safe-1),.55);
  }
  const scalars=['cols','rows','guide','skew','cropX','cropY','zoom','raster','outline','numberOutline','typeCrop','stack','tension','point','rawPanel'] as const;
  for(const key of scalars)d[key]=mix(a[key],b[key],safe);
  for(const key of Object.keys(a.axes) as (keyof Axes)[])d.axes[key]=mix(a.axes[key],b.axes[key],safe);
  for(const key of Object.keys(a.frame) as (keyof Frame)[])d.frame[key]=mix(a.frame[key],b.frame[key],f);
  // Colour trails geometry slightly: complementary grounds cross their muddy
  // midpoint faster while the composition is already mostly re-formed.
  const colour = smooth(range(.12, 1, safe));
  d.paper=colorMix(a.paper,b.paper,colour);d.ink=readable(colorMix(a.ink,b.ink,colour),d.paper);
  d.accent=colorMix(a.accent,b.accent,colour);
  return routeDesktopSupplement(routeHandoff(d,a,b,safe,next),a,b,safe,next);
}

export function resolve(coordinate:number,states:Design[],overrides:Partial<Axes>={},interfaceExit?:Design,reduced=false):Design {
  const p=clamp(coordinate,0,11);
  if(reduced)return refine(states[Math.round(p)],Math.round(p),0,Math.round(p)===9?overrides:{});
  const i=Math.floor(p),local=p-i;
  if(i===11)return clone(states[11]);
  if(local<=.36)return refine(states[i],i,local,i===9?overrides:{});
  const a=i===8&&interfaceExit?interfaceExit:refine(states[i],i,.36,i===9?overrides:{});
  return interpolate(a,states[i+1],range(.36,1,local),i+1);
}
