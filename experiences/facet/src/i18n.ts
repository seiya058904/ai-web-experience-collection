export type Language = 'en'|'zh';
export const messages: Record<Language,Record<string,string>>={
 en:{
  skip:'Skip to the exhibition',index:'Index',loading:'Finding the light…',scroll:'Scroll to enter',
  'light.title1':'The light','light.title2':'within.','light.body':'A journey through cut, color and clarity.',
  'facet.title1':'A language','facet.title2':'of planes.','facet.body':'Every angle gives light a new direction.',
  'polish.title1':'The surface,','polish.title2':'awakened.','polish.body':'A veil lifts. Light finds its way in.',
  'depth.title1':'Beyond','depth.title2':'the surface.','depth.body':'Color held in light.\nDepth held in silence.',
  'color.title1':'Color,','color.title2':'felt.','color.body':'From the velvet depth of sapphire to the quiet glow of jade.',
  'color.agate':'A thousand quiet contours. Each band holds a different light.',
  'brilliance.title1':'Light,','brilliance.title2':'unfolded.','brilliance.body':'One beam. Many possibilities.',
  'exhibit.title1':'A world','exhibit.title2':'within.',
  crown:'Crown',girdle:'Girdle',pavilion:'Pavilion',separate:'Separate the cut',followScroll:'Follow scroll',rough:'Rough',polished:'Polished',
  ruby:'Ruby',sapphire:'Sapphire',jade:'Jade',agate:'Agate',diamond:'Diamond',quartz:'Quartz',inside:'A little closer.',throughStone:'Light through stone',angle:'Angle',
  selectStone:'Select a stone to look closer.',returnLight:'Return to the light',backExhibit:'Back to the exhibition',dragTurn:'Drag to turn. Take your time.',resetView:'Reset view',
  indexTitle:'Follow the light.',pauseMotion:'Pause ambient motion',resumeMotion:'Resume ambient motion',exhibitionNote:'Seven moments. One continuous journey.',
  still:'The exhibition is shown as a still study on this device.',
  'inspect.ruby':'A deep red body, a clear white reflection. Turn the stone and watch its color gather at the edges.',
  'inspect.sapphire':'Midnight blue gives way to cobalt. A broad table opens a window into the cut.',
  'inspect.diamond':'White light, held between precise planes. Small changes in angle redraw the entire interior.',
  'inspect.jade':'A softer kind of light. Clouded green moves below a surface that feels almost warm.',
  'inspect.agate':'Contours within contours. Separate bands make a quiet landscape inside the stone.',
  'inspect.quartz':'An uncut rhythm of hexagonal prisms. Clear surfaces hold small, shifting reflections.',
  'nav.previous':'Previous chapter','nav.next':'Next chapter','nav.close':'Close chapter index','nav.gem':'Interactive gemstone. Drag horizontally or use left and right arrow keys to rotate.',
 },
 zh:{
  skip:'跳至展览',index:'目录',loading:'循光而入…',scroll:'滚动，循光而入',
  'light.title1':'光藏','light.title2':'于内。','light.body':'循一束光，穿过切面、色泽与澄澈。',
  'facet.title1':'以切面','facet.title2':'为语言。','facet.body':'每一个角度，都赋予光新的方向。',
  'polish.title1':'表面，','polish.title2':'苏醒。','polish.body':'雾翳褪去，光终于走进来。',
  'depth.title1':'越过','depth.title2':'表面。','depth.body':'色彩藏于光。\n深处归于静。',
  'color.title1':'色泽，','color.title2':'可感。','color.body':'从蓝宝石的深邃，走向玉石的温润。',
  'color.agate':'纹层之内，层层有光。每一道曲线，都是一处静谧的风景。',
  'brilliance.title1':'一束光，','brilliance.title2':'展开。','brilliance.body':'一种入射，无数种可能。',
  'exhibit.title1':'方寸间，','exhibit.title2':'有天地。',
  crown:'冠部',girdle:'腰部',pavilion:'亭部',separate:'展开切面',followScroll:'跟随滚动',rough:'未抛光',polished:'已抛光',
  ruby:'红宝石',sapphire:'蓝宝石',jade:'玉石',agate:'玛瑙',diamond:'钻石',quartz:'水晶',inside:'再近一些。',throughStone:'透光程度',angle:'入射角',
  selectStone:'选择一颗宝石，慢慢靠近。',returnLight:'回到光的起点',backExhibit:'返回展厅',dragTurn:'拖动旋转。不妨，慢慢看。',resetView:'重置视角',
  indexTitle:'循光而行。',pauseMotion:'暂停环境动画',resumeMotion:'恢复环境动画',exhibitionNote:'七段光景，一次连续的旅程。',
  still:'此设备以静态材质研究呈现展览。',
  'inspect.ruby':'深红的内部，清亮的反光。轻轻转动，色泽在边缘聚拢。',
  'inspect.sapphire':'午夜蓝渐渐显露钴蓝。宽阔的台面，是通往内部的一扇窗。',
  'inspect.diamond':'白光往返于精确的平面之间。角度的微小变化，让内部重新显现。',
  'inspect.jade':'光也可以温柔。云雾般的绿色，藏在温润的表面之下。',
  'inspect.agate':'纹层之中，仍有纹层。交错的色带，组成一处方寸间的风景。',
  'inspect.quartz':'六方晶柱，有自己的节奏。澄澈的表面，收藏着流动的倒影。',
  'nav.previous':'上一章','nav.next':'下一章','nav.close':'关闭展览目录','nav.gem':'可交互宝石。横向拖动，或使用左右方向键旋转。',
 }
};
export const specimenNames=['ruby','sapphire','diamond','jade','agate','quartz'] as const;
export function translate(language:Language,key:string):string{return messages[language][key]??messages.en[key]??key;}
export function applyLanguage(language:Language):void{
 document.documentElement.lang=language==='zh'?'zh-CN':'en';
 document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el=>{
  const value=translate(language,el.dataset.i18n!);
  el.replaceChildren(...value.split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));
 });
 document.querySelectorAll<HTMLButtonElement>('.language-button').forEach(button=>{
  const selected=button.id===`lang-${language}`;
  button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected));
 });
 const aria:Record<string,string>={'previous-chapter':'nav.previous','next-chapter':'nav.next','close-index':'nav.close','gem-interaction':'nav.gem'};
 for(const[id,key]of Object.entries(aria)) document.getElementById(id)?.setAttribute('aria-label',translate(language,key));
}
