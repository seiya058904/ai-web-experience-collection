import { mix } from './journey.js';

/** Lightweight original Canvas 2D interpretation when WebGL is unavailable.
 * It preserves chapter navigation and useful material/light interactions.
 */
export function createFallback(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 1, h = 1, ratio = 1, lastView, lastState, lastTime, sunlight = 0;
  function pane(points, material, darkness, time, index) {
    const outline = () => {
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h));
      ctx.closePath();
    };
    const g = ctx.createLinearGradient(points[0][0] * w, 0, points[2][0] * w, h);
    const a = material === 'frosted' ? 0.48 : material === 'mirror' ? 0.85 : 0.075;
    g.addColorStop(0, `rgba(200,226,239,${a})`);
    g.addColorStop(0.45, `rgba(240,250,255,${a * 0.45})`);
    g.addColorStop(0.49, `rgba(255,255,255,${a + 0.10})`);
    g.addColorStop(0.53, `rgba(80,111,130,${a * 0.4})`);
    g.addColorStop(1, `rgba(179,213,227,${a})`);
    outline();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = darkness > 0.5 ? 'rgba(209,238,249,.7)' : 'rgba(34,71,90,.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.translate(3, 1.5);
    outline();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    outline(); ctx.clip();
    const x = (Math.sin(time * 0.1 + index) * 0.08 + 0.7 + sunlight * .22) * w;
    const ray = ctx.createLinearGradient(x - 30, 0, x + 30, h);
    ray.addColorStop(0, 'rgba(255,255,255,0)');
    ray.addColorStop(0.48, 'rgba(255,255,255,.02)');
    ray.addColorStop(0.5, 'rgba(255,255,255,.48)');
    ray.addColorStop(0.52, 'rgba(255,255,255,.02)');
    ray.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ray; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  function update(view, time, state) { lastView = view; lastState = state; lastTime = time; }
  function render() {
    if (!lastView || !ctx) return;
    const view = lastView, state = lastState, time = lastTime;
    const d = view.darkness;
    const house = (view.from === 5 ? 1 - view.blend : 0) + (view.to === 5 ? view.blend : 0);
    sunlight = Math.sin((state.daylight || 0) * Math.PI / 180) * house;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const value = Math.round(mix(233, 20, d));
    ctx.fillStyle = `rgb(${value - 3},${value},${value + 3})`;
    ctx.fillRect(0, 0, w, h);
    const ambient = ctx.createRadialGradient(w * (.77 + sunlight * .22), h * .3, 0, w * (.65 + sunlight * .22), h * .3, w * .8);
    ambient.addColorStop(0, `rgba(255,255,255,${mix(0.85, 0.05, d)})`);
    ambient.addColorStop(1, 'rgba(125,150,164,0.08)');
    ctx.fillStyle = ambient; ctx.fillRect(0, 0, w, h);
    const floor = ctx.createLinearGradient(0, h * 0.61, 0, h);
    floor.addColorStop(0, `rgba(110,132,145,${mix(0.03, 0.09, d)})`);
    floor.addColorStop(1, `rgba(50,72,90,${mix(0.12, 0.32, d)})`);
    ctx.fillStyle = floor; ctx.fillRect(0, h * 0.61, w, h * 0.4);
    const chapter = view.chapter;
    const m = w <= 760;
    ctx.save();
    if (m) { ctx.translate(-w * 0.7, h * 0.02); ctx.scale(1.8, 0.8); }
    if (chapter === 0) {
      pane([[.41,.18],[.61,.30],[.61,.74],[.41,.69]], 'clear', d,time,0);
      pane([[.57,.09],[.85,.32],[.85,.72],[.57,.78]], 'clear', d,time,1);
      pane([[.62,.47],[.95,.40],[.95,.72],[.62,.79]], 'clear', d,time,2);
    } else if (chapter === 1) {
      ctx.font = `500 ${w * .09}px Manrope, sans-serif`; ctx.fillStyle = '#253c48';
      ctx.fillText('UNSEEN', w * .31, h * .52);
      for (let i=0;i<3;i++) { const x=.39+i*.18; pane([[x,.18],[x+.14,.12],[x+.14,.66],[x,.72]], i===1?state.material:['frosted','clear','mirror'][i],d,time,i); }
    } else if (chapter === 2) {
      pane([[.7,.14],[.89,.76],[.48,.71]],'clear',d,time,0);
      ctx.save(); ctx.globalCompositeOperation='screen';
      const angle = (state.lightAngle||0) * .004;
      ctx.beginPath(); ctx.moveTo(w*.02,h*(.12+angle)); ctx.lineTo(w*.7,h*.43); ctx.lineTo(w*.02,h*(.115+angle)); ctx.fillStyle='#f8fcff';ctx.fill();
      ['#e7a3a0','#eacf99','#b3d4ac','#a6d7e8','#baa4d0'].forEach((c,i)=>{ctx.beginPath();ctx.moveTo(w*.7,h*.43);ctx.lineTo(w,h*(.64+i*.018-angle));ctx.lineTo(w,h*(.65+i*.018-angle));ctx.fillStyle=c;ctx.globalAlpha=.48;ctx.fill();}); ctx.restore();
    } else if (chapter === 3 || chapter === 4) {
      for(let i=6;i>=0;i--){const s=1-i*.078,x=.61+i*.033,y=.11+i*.035;pane([[x,y],[x+.25*s,y+.03],[x+.25*s,.76-i*.02],[x,.8-i*.02]],chapter===3?'mirror':'clear',d,time,i);}
    } else {
      for(let i=5;i>=0;i--){const x=.39+i*.087;pane([[x,.30-i*.017],[x+.15,.2-i*.005],[x+.15,.69-i*.002],[x,.79-i*.02]],'clear',d,time,i);}
      pane([[.32,.31],[.78,.11],[.98,.21],[.50,.43]],'clear',d,time,9);
    }
    ctx.restore();
  }
  return {
    update, render,
    resize(width,height){w=width;h=height;ratio=Math.min(window.devicePixelRatio||1,1.5);canvas.width=w*ratio;canvas.height=h*ratio;},
    warmup:async()=>{},dispose:()=>{},lowerQuality:()=>{},
    get info(){return {mode:'canvas-2d'};}
  };
}
