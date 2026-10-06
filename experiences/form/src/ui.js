import { CHAPTERS, clamp, chapterAt } from './director.js';

const NS = 'http://www.w3.org/2000/svg';
const arrow = '<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M1 10h28m-8-8 9 8-9 8"/></svg>';
const circleArrow = '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M7 23a12 12 0 1 1 23-5m-6-3 6 4 3-7"/></svg>';

export function createUI({ controls, navigate, onMotionChange, onIndexChange, onStructureChange, onAssemblyChange }) {
  const copyHost = document.querySelector('#scene-copy');
  const controlHost = document.querySelector('#scene-controls');
  const markerHost = document.querySelector('#chapter-markers');
  const rail = document.querySelector('.chapter-rail');
  const dialog = document.querySelector('#index-dialog');
  const indexLinks = dialog.querySelector('.index-links');
  const fallbackHost = document.querySelector('.fallback-chapters');
  const cue = document.querySelector('.begin-cue');
  const hero = document.querySelector('.hero-word');
  const caption = document.querySelector('#object-caption');
  const orbit = document.querySelector('#orbit-area');
  const drawing = document.querySelector('#drawing');
  const announcement = document.querySelector('#chapter-announcement');
  const toggle = document.querySelector('.index-toggle');
  const motionToggle = document.querySelector('#motion-toggle');
  const root = document.documentElement;
  const copies = [], railLinks = [], panels = [];
  let active = -1, announced = -1, wasOpen = false, indexStopped = false;
  let labelNodes = [];

  CHAPTERS.forEach((chapter, i) => {
    const n = String(i + 1).padStart(2, '0');
    const copy = document.createElement('section');
    copy.className = `chapter-copy copy-${chapter.id}`;
    copy.setAttribute('aria-labelledby', `title-${chapter.id}`);
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    const tag = i === 0 ? 'h1' : 'h2';
    copy.innerHTML = `<${tag} id="title-${chapter.id}" tabindex="-1">${i === 0 ? '<span class="sr-only">FORM — </span>' : ''}${chapter.lines.map(t => `<span>${t}</span>`).join('')}</${tag}><p class="chapter-description">${chapter.description.replaceAll('\n', '<br>')}</p>${i > 0 ? `<p class="chapter-note"><span>${n}</span><span>${chapter.name}</span></p>` : ''}`;
    copyHost.append(copy);
    copies.push(copy);
    const marker = document.createElement('div');
    marker.className = 'chapter-anchor';
    marker.id = chapter.id;
    marker.style.top = `calc(var(--travel) * ${i === 0 ? 0 : i + .25})`;
    marker.setAttribute('aria-hidden', 'true');
    markerHost.append(marker);
    const a = document.createElement('a');
    a.href = `#${chapter.id}`;
    a.className = 'rail-link';
    a.setAttribute('aria-label', `${n} — ${chapter.name}`);
    a.innerHTML = `<span class="rail-track"><span></span></span><span class="rail-number">${n}</span><span class="rail-name">${chapter.name}</span>`;
    rail.append(a);
    railLinks.push(a);
    const link = document.createElement('a');
    link.href = `#${chapter.id}`;
    link.innerHTML = `<span>${n}</span><span>${chapter.name}</span>${arrow}`;
    indexLinks.append(link);
    const panel = document.createElement('div');
    panel.className = `control-panel control-${chapter.id}`;
    panel.inert = true; panel.hidden = true;
    controlHost.append(panel); panels.push(panel);
    const article = document.createElement('article');
    article.innerHTML = `<p>${n} / ${chapter.name.toUpperCase()}</p><h2>${chapter.title}</h2><p>${chapter.description.replaceAll('\n', ' ')}</p>`;
    fallbackHost.append(article);
  });

  panels[2].innerHTML = `<button class="text-action" id="structure-toggle" type="button" aria-pressed="true"><span class="action-disc">${circleArrow}</span><span>View assembled</span></button>`;
  panels[3].innerHTML = `<fieldset class="material-picker"><legend>Choose a finish</legend><div>${['Walnut', 'Oak', 'Ink'].map((f, i) => `<button class="swatch-button swatch-${f.toLowerCase()}" type="button" data-finish="${i}" aria-pressed="${i === 0}"><span class="swatch" aria-hidden="true"></span><span>${f}</span></button>`).join('')}</div></fieldset><div class="finish-detail"><span id="finish-number">01 /</span><h3 id="finish-title">American walnut</h3><p id="finish-description">Warm grain. Quiet character.</p></div>`;
  panels[4].innerHTML = `<label class="range-label" for="light-range"><span>Move the light</span><output id="light-value">50°</output></label><div class="range-row"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M18 10H2m5-5-5 5 5 5"/></svg><input id="light-range" type="range" min="0" max="100" value="50" aria-label="Move the studio light"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10h16m-5-5 5 5-5 5"/></svg></div>`;
  panels[5].innerHTML = `<label class="range-label" for="section-range"><span>Section</span><output id="section-value">65%</output></label><input id="section-range" type="range" min="0" max="100" value="65" aria-label="Adjust the lamp cutaway">`;
  panels[6].innerHTML = `<button class="text-action" id="assembly-toggle" type="button" aria-pressed="false"><span class="action-disc">${circleArrow}</span><span>Reassemble</span></button>`;
  panels[7].innerHTML = `<button class="text-action return-action" type="button" data-go="outline"><span>Back to the beginning</span>${arrow}</button>`;

  function closeIndex() {
    if (!dialog.open) return;
    dialog.close();
    finishIndexClose();
  }
  function finishIndexClose() {
    toggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('index-open');
    // Resume synchronously before a chapter link starts its navigation. The
    // queued native close event must not reset that new Lenis animation.
    if (indexStopped) { indexStopped = false; onIndexChange(false); }
    if (wasOpen) toggle.focus({ preventScroll: true });
    wasOpen = false;
  }
  function openIndex() {
    wasOpen = true;
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    root.classList.add('index-open');
    indexStopped = true;
    onIndexChange(true);
  }
  toggle.addEventListener('click', openIndex);
  dialog.querySelector('.index-close').addEventListener('click', closeIndex);
  dialog.addEventListener('close', finishIndexClose);

  document.querySelectorAll('a[href^="#"], [data-go]').forEach(link => {
    if (link.classList.contains('skip-link')) return;
    link.addEventListener('click', e => {
      const id = link.dataset.go || link.getAttribute('href').slice(1);
      if (!CHAPTERS.some(c => c.id === id)) return;
      e.preventDefault(); closeIndex(); navigate(id, true);
    });
  });
  motionToggle.addEventListener('click', () => onMotionChange(!controls.reduced));

  const finishNames = [
    ['American walnut', 'Warm grain. Quiet character.'],
    ['Natural oak', 'A lighter grain. The same gesture.'],
    ['Ink-stained veneer', 'A dark surface. A sharper silhouette.']
  ];
  document.querySelectorAll('[data-finish]').forEach(button => {
    button.addEventListener('click', () => {
      controls.finish = +button.dataset.finish;
      document.querySelectorAll('[data-finish]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.finish === controls.finish)));
      document.querySelector('#finish-number').textContent = `0${controls.finish + 1} /`;
      document.querySelector('#finish-title').textContent = finishNames[controls.finish][0];
      document.querySelector('#finish-description').textContent = finishNames[controls.finish][1];
    });
  });
  document.querySelector('#structure-toggle').addEventListener('click', e => {
    controls.structureOpen = !controls.structureOpen;
    e.currentTarget.setAttribute('aria-pressed', String(controls.structureOpen));
    e.currentTarget.lastElementChild.textContent = controls.structureOpen ? 'View assembled' : 'Explode structure';
    onStructureChange(controls.structureOpen);
  });
  document.querySelector('#assembly-toggle').addEventListener('click', onAssemblyChange);
  document.querySelector('#light-range').addEventListener('input', e => {
    controls.light = +e.target.value;
    document.querySelector('#light-value').textContent = `${Math.round(controls.light)}°`;
  });
  document.querySelector('#section-range').addEventListener('input', e => {
    controls.section = +e.target.value;
    document.querySelector('#section-value').textContent = `${controls.section}%`;
  });
  document.querySelector('#orbit-left').addEventListener('click', () => { controls.orbit = clamp(controls.orbit - .18, -.8, .8); });
  document.querySelector('#orbit-right').addEventListener('click', () => { controls.orbit = clamp(controls.orbit + .18, -.8, .8); });
  document.querySelector('#retry-world').addEventListener('click', () => window.location.reload());

  function paintAnnotations(annotations, world, mobile) {
    const max = mobile ? 2 : 4;
    const selected = (annotations || []).filter(a => (a.opacity ?? 1) > .04).slice(0, max);
    while (labelNodes.length < selected.length) {
      const group = document.createElementNS(NS, 'g');
      const path = document.createElementNS(NS, 'path');
      const circle = document.createElementNS(NS, 'circle');
      const text = document.createElementNS(NS, 'text');
      circle.setAttribute('r', '2');
      group.append(path, circle, text); drawing.append(group);
      labelNodes.push({ group, path, circle, text });
    }
    labelNodes.forEach((node, i) => {
      const annotation = selected[i];
      if (!annotation) { node.group.style.display = 'none'; return; }
      const p = world.project(annotation.anchor);
      if (!p.visible || p.y < world.height * .11 || p.y > world.height * .86 || p.x < 8 || p.x > world.width - 8) { node.group.style.display = 'none'; return; }
      node.group.style.display = '';
      node.group.style.opacity = annotation.opacity ?? 1;
      const dimension = annotation.kind === 'dimension';
      let side = annotation.side === 'left' ? -1 : 1;
      const length = mobile ? 28 : Math.min(50, world.width * .03);
      const margin = mobile ? 16 : 30;
      const fontSize = mobile ? 8.5 : clamp(world.width * .0071, 10, 21);
      const textWidth = annotation.text.length * fontSize * .625;
      if (side > 0 && p.x + length + 6 + textWidth > world.width - margin) side = -1;
      else if (side < 0 && p.x - length - 6 - textWidth < margin) side = 1;
      const x = dimension ? clamp(p.x, margin + textWidth / 2, world.width - margin - textWidth / 2)
        : side < 0 ? clamp(p.x - length, margin + textWidth + 6, world.width - margin)
          : clamp(p.x + length, margin, world.width - margin - textWidth - 6);
      const y = p.y - (dimension ? 12 : length * .45) - (annotation.lift || 0) - (mobile ? annotation.mobileLift || 0 : 0);
      node.circle.setAttribute('cx', p.x); node.circle.setAttribute('cy', p.y);
      node.circle.style.opacity = dimension ? '0' : '1';
      node.path.setAttribute('d', dimension ? '' : `M${p.x.toFixed(1)},${p.y.toFixed(1)}L${(p.x + (x - p.x) * .45).toFixed(1)},${y.toFixed(1)}H${x.toFixed(1)}`);
      node.text.setAttribute('x', dimension ? x : x + side * 6);
      node.text.setAttribute('y', dimension ? p.y - 7 : y + 4);
      node.text.setAttribute('text-anchor', dimension ? 'middle' : side < 0 ? 'end' : 'start');
      node.text.textContent = annotation.text;
    });
  }

  function update(state, world, annotations, mobile) {
    const i = state.chapter;
    if (active !== i) {
      active = i;
      root.dataset.chapter = CHAPTERS[i].id;
      copies.forEach((c, j) => { c.classList.toggle('is-active', j === i); c.setAttribute('aria-hidden', String(j !== i)); c.inert = j !== i; });
      panels.forEach((c, j) => { c.hidden = j !== i; c.inert = j !== i; });
      railLinks.forEach((a, j) => { if (j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      caption.innerHTML = `<span>${CHAPTERS[i].object}</span><span>${CHAPTERS[i].detail}</span>`;
      orbit.hidden = i !== 7;
      world.canvas.classList.toggle('can-orbit', i === 7);
    }
    if (announced !== i && state.copy > .8) { announced = i; announcement.textContent = `Chapter ${i + 1} of 8: ${CHAPTERS[i].name}. ${CHAPTERS[i].title}`; }
    const factor = Math.round(state.copy * 1000) / 1000;
    copies[i].style.opacity = factor;
    panels[i].style.opacity = factor;
    panels[i].style.pointerEvents = factor > .65 ? '' : 'none';
    panels[i].inert = factor <= .65;
    caption.style.opacity = factor * (i === 0 ? .85 : .75);
    const heroOpacity = 1 - Math.min(1, Math.max(0, (state.progress - .55) / .42));
    hero.style.opacity = heroOpacity;
    hero.style.transform = `translate3d(${-state.progress * 3}%,0,0)`;
    cue.style.opacity = heroOpacity;
    cue.inert = heroOpacity < .5;
    cue.style.pointerEvents = heroOpacity < .5 ? 'none' : '';
    orbit.style.opacity = state.final;
    railLinks.forEach((link, j) => { link.firstElementChild.firstElementChild.style.transform = `scaleX(${clamp(state.progress - j)})`; });
    const darkness = state.dark;
    const rgb = world.sceneColor.getStyle();
    root.style.setProperty('--surface', rgb);
    const ink = Math.round(38 + (238 - 38) * darkness);
    root.style.setProperty('--ink', `rgb(${ink} ${ink} ${Math.round(33 + (228 - 33) * darkness)})`);
    const muted = Math.round(107 + (173 - 107) * darkness);
    root.style.setProperty('--muted', `rgb(${muted} ${muted - 3} ${muted - 10})`);
    root.style.setProperty('--rule', `rgba(${ink},${ink},${ink},.24)`);
    root.style.setProperty('--darkness', darkness);
    root.style.setProperty('--light-x', `${58 + (controls.light - 50) * .2 * state.light}%`);
    root.style.setProperty('--film-progress', (state.progress / 8).toFixed(4));
    paintAnnotations(annotations, world, mobile);
    if (i === 5 && controls.section === null) {
      document.querySelector('#section-range').value = Math.round(state.cut * 100);
      document.querySelector('#section-value').textContent = `${Math.round(state.cut * 100)}%`;
    }
    if (i === 6) {
      const open = controls.assemblyTarget ?? state.te > .45;
      const button = document.querySelector('#assembly-toggle');
      button.setAttribute('aria-pressed', String(open));
      button.lastElementChild.textContent = open ? 'Reassemble' : 'Separate parts';
    }
    motionToggle.setAttribute('aria-pressed', String(controls.reduced));
    motionToggle.textContent = controls.reduced ? 'Full motion' : 'Reduce motion';
    root.dataset.motion = controls.reduced ? 'reduced' : 'full';
  }

  function prepareMaterials(materials) {
    const swatchCanvas = document.createElement('canvas');
    swatchCanvas.width = swatchCanvas.height = 128;
    const ctx = swatchCanvas.getContext('2d');
    ctx.drawImage(materials.wood.map.image, 128, 700, 720, 720, 0, 0, 128, 128);
    const grain = swatchCanvas.toDataURL('image/webp', .82);
    document.querySelectorAll('.swatch').forEach(element => {
      element.style.backgroundImage = `url(${grain})`;
      element.style.backgroundBlendMode = 'multiply';
      element.style.backgroundSize = 'cover';
    });
  }
  function resize(width, height) { drawing.setAttribute('viewBox', `0 0 ${width} ${height}`); }
  function ready() { document.querySelector('#loading-note').hidden = true; root.dataset.ready = 'true'; }
  function fallback() {
    document.querySelector('#fallback').hidden = false;
    document.querySelector('#experience').hidden = true;
    rail.hidden = true; cue.hidden = true;
    document.querySelector('#loading-note').hidden = true;
    root.classList.add('is-fallback');
  }
  return { update, resize, ready, fallback, closeIndex, dialog, copies, panels, prepareMaterials };
}
