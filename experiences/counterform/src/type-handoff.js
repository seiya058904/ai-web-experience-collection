/* One native specimen travels between two measured layouts. No animation clock. */
(() => {
  'use strict';
  const mix=(a,b,t)=>a+(b-a)*t;
  const fontKeys=['fontFamily','fontWeight','fontStretch','fontStyle','fontVariationSettings','fontOpticalSizing','fontFeatureSettings','fontKerning','fontVariant','fontSynthesis','textRendering','textTransform','direction'];
  const number=(value,fallback=0)=>Number.isFinite(parseFloat(value))?parseFloat(value):fallback;

  function readType(element) {
    const css=getComputedStyle(element);
    const style=Object.fromEntries(fontKeys.map(key=>[key,css[key]]));
    const size=number(css.fontSize,16);
    return {style,size,line:number(css.lineHeight,size*1.2),spacing:number(css.letterSpacing),whiteSpace:css.whiteSpace,wordBreak:css.wordBreak,overflowWrap:css.overflowWrap,textAlign:css.textAlign};
  }
  function textMap(element) {
    const nodes=[];
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let node,total=0;
    while((node=walker.nextNode())){nodes.push({node,start:total,end:total+node.length});total+=node.length;}
    const point=(offset,end=false)=>{
      const found=nodes.find(item=>end?offset>item.start&&offset<=item.end:offset>=item.start&&offset<item.end)||nodes[nodes.length-1];
      return found?{node:found.node,offset:Math.max(0,Math.min(found.node.length,offset-found.start))}:null;
    };
    return {text:element.textContent,rect(start,end){
      const a=point(start),b=point(end,true);if(!a||!b)return null;
      const range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);
      const rect=range.getBoundingClientRect();
      return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
    }};
  }
  function create({stage,from,to}) {
    if(!stage||!from||!to)throw new TypeError('A stage and both specimen elements are required.');
    const overlay=document.createElement('div');
    overlay.className='type-handoff';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
    Object.assign(overlay.style,{position:'absolute',inset:'0',zIndex:'5',overflow:'hidden',pointerEvents:'none',visibility:'hidden',color:'inherit',textAlign:'left',userSelect:'none'});
    stage.append(overlay);
    let dirty=true,model=null,disposed=false;

    function applyFont(type) {
      Object.assign(overlay.style,type.style);
      overlay.style.fontSize=`${type.size}px`;
      overlay.style.lineHeight=`${type.line}px`;
      overlay.style.letterSpacing=`${type.spacing}px`;
    }
    function nativeOffset(element,origin) {
      const range=document.createRange();range.selectNodeContents(element);
      const rect=range.getBoundingClientRect();
      return {x:rect.x-origin.x,y:rect.y-origin.y,width:rect.width,height:rect.height};
    }
    function measure() {
      dirty=false;model=null;overlay.replaceChildren();overlay.style.visibility='hidden';
      const a=textMap(from),b=textMap(to);
      if(!a.text||a.text!==b.text)return false;
      const first=readType(from),last=readType(to);
      const origin=overlay.getBoundingClientRect();
      const startBox=from.getBoundingClientRect(),endBox=to.getBoundingClientRect();
      if(!origin.width||!origin.height||!startBox.height||!endBox.height)return false;
      applyFont(first);

      // Intl.Segmenter gives UTF-16 offsets at complete grapheme boundaries.
      // Older engines keep one native paragraph rather than guessing and
      // splitting a combining sequence, surrogate pair, or joined emoji.
      if(typeof Intl.Segmenter!=='function'||first.style.direction!=='ltr'||last.style.direction!=='ltr') {
        const paragraph=document.createElement('div');paragraph.textContent=a.text;
        Object.assign(paragraph.style,{position:'absolute',margin:'0',padding:'0',border:'0',whiteSpace:first.whiteSpace,wordBreak:first.wordBreak,overflowWrap:first.overflowWrap,textAlign:first.textAlign});
        overlay.append(paragraph);overlay.dataset.mode='paragraph';
        model={first,last,paragraph,start:{x:startBox.x-origin.x,y:startBox.y-origin.y,width:startBox.width},end:{x:endBox.x-origin.x,y:endBox.y-origin.y,width:endBox.width}};
        return true;
      }
      const segments=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(a.text)];
      const fragments=[];
      for(const {segment,index} of segments) {
        if(/^\s+$/u.test(segment))continue;
        const end=index+segment.length,ra=a.rect(index,end),rb=b.rect(index,end);
        if(!ra||!rb||!ra.height||!rb.height)return false;
        const previous=fragments[fragments.length-1];
        // Keep words intact whenever possible. A long unbroken word splits
        // only where either of the two real layouts already begins a new line.
        if(previous&&previous.end===index&&Math.abs(previous.lineA-ra.y)<.5&&Math.abs(previous.lineB-rb.y)<.5) {
          previous.end=end;previous.text+=segment;
        } else fragments.push({start:index,end,text:segment,lineA:ra.y,lineB:rb.y});
      }
      if(!fragments.length)return false;
      let word=0;
      fragments.forEach((fragment,index)=>{
        if(index&&fragments[index-1].end!==fragment.start)word++;
        fragment.word=word;
      });
      for(const fragment of fragments) {
        const element=document.createElement('span');element.textContent=fragment.text;
        element.dataset.start=String(fragment.start);element.dataset.end=String(fragment.end);
        Object.assign(element.style,{position:'absolute',left:'0',top:'0',display:'block',margin:'0',padding:'0',border:'0',whiteSpace:'pre',transformOrigin:'0 0'});
        overlay.append(element);fragment.element=element;
        const ra=a.rect(fragment.start,fragment.end),rb=b.rect(fragment.start,fragment.end);
        fragment.startRect={x:ra.x-origin.x,y:ra.y-origin.y};
        fragment.endRect={x:rb.x-origin.x,y:rb.y-origin.y};
      }
      // Read all offsets at one font size before writing the other. Native
      // Range tops differ from line-box tops, especially at a .95 line-height.
      for(const fragment of fragments)fragment.startOffset=nativeOffset(fragment.element,origin);
      applyFont(last);
      for(const fragment of fragments)fragment.endOffset=nativeOffset(fragment.element,origin);
      for(const fragment of fragments) {
        fragment.startCenter={x:fragment.startRect.x+fragment.startOffset.width/2,y:fragment.startRect.y+fragment.startOffset.height/2};
        fragment.endCenter={x:fragment.endRect.x+fragment.endOffset.width/2,y:fragment.endRect.y+fragment.endOffset.height/2};
      }
      overlay.dataset.mode='fragments';
      model={first,last,fragments};
      return true;
    }
    function render(value) {
      if(disposed)return false;
      if(dirty&&!measure())return false;
      if(!model)return false;
      const t=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
      const size=mix(model.first.size,model.last.size,t),line=mix(model.first.line,model.last.line,t);
      let scale=1,positions=[];
      if(model.fragments) {
        positions=model.fragments.map(fragment=>({
          fragment,x:mix(fragment.startCenter.x,fragment.endCenter.x,t),y:mix(fragment.startCenter.y,fragment.endCenter.y,t),
          width:mix(fragment.startOffset.width,fragment.endOffset.width,t),height:mix(fragment.startOffset.height,fragment.endOffset.height,t)
        }));
        // Reflowing words can cross each other's line tracks. Contract the
        // whole native specimen uniformly until those tracks have room;
        // never distort widths, change an axis, or draw a second specimen.
        // All geometry here was measured on invalidation, not during scroll.
        if(t>0&&t<1)for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++) {
          const a=positions[i],b=positions[j];
          const gap=a.fragment.word===b.fragment.word?0:size*.16;
          const horizontal=2*Math.abs(a.x-b.x)/(a.width+b.width+2*gap||1);
          const vertical=Math.abs(a.y-b.y)/Math.min(line,(a.height+b.height)/2);
          scale=Math.min(scale,Math.max(horizontal,vertical));
        }
      }
      overlay.style.fontSize=`${size*scale}px`;
      overlay.style.lineHeight=`${line*scale}px`;
      overlay.style.letterSpacing=`${mix(model.first.spacing,model.last.spacing,t)*scale}px`;
      if(model.paragraph) {
        const {paragraph,start,end}=model;
        paragraph.style.transform=`translate(${mix(start.x,end.x,t)}px,${mix(start.y,end.y,t)}px)`;
        paragraph.style.width=`${mix(start.width,end.width,t)}px`;
      } else for(const {fragment,x,y,width,height} of positions) {
        const offsetX=mix(fragment.startOffset.x,fragment.endOffset.x,t),offsetY=mix(fragment.startOffset.y,fragment.endOffset.y,t);
        fragment.element.style.transform=`translate(${x-(offsetX+width/2)*scale}px,${y-(offsetY+height/2)*scale}px)`;
      }
      overlay.style.visibility='visible';
      return true;
    }
    return {
      invalidate(){dirty=true;},
      render,
      hide(){overlay.style.visibility='hidden';},
      dispose(){disposed=true;model=null;overlay.remove();}
    };
  }
  window.CounterformTypeHandoff={create};
})();
