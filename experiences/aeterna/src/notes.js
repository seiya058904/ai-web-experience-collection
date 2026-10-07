import { sources, collectionObjects, curatorialSections } from './research.js';

const sourceById = new Map(sources.map((source) => [source.id, source]));
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const link = (source) => '<a href="' + escape(source.url) + '" target="_blank" rel="noopener noreferrer">' + escape(source.title) + '</a>';
const paragraph = (text) => '<p>' + escape(text) + '</p>';

function sectionHtml(section) {
  return '<h3>' + escape(section.title) + '</h3>' + paragraph(section.text);
}
function sourceList(ids = sources.map((source) => source.id)) {
  return '<ul class="source-list">' + [...new Set(ids)].map((id) => {
    const source = sourceById.get(id);
    return source ? '<li>' + link(source) + '<small>' + escape(source.institution) + ' · ' + escape(source.note) + '</small></li>' : '';
  }).join('') + '</ul>';
}
function objectHtml(id) {
  const object = collectionObjects.find((entry) => entry.id === id);
  if (!object) return '';
  return '<div class="object-record"><h3>' + escape(object.title) + '</h3><dl>' +
    [['Date', object.period], ['Material', object.medium], ['Collection', object.institution], ['Accession', object.accession], ['Rights', object.license]]
      .map(([key, value]) => '<div><dt>' + key + '</dt><dd>' + escape(value) + '</dd></div>').join('') +
    '</dl></div>' + paragraph(object.interpretation) + paragraph(object.credit) +
    '<p><a href="' + escape(object.url) + '" target="_blank" rel="noopener noreferrer">Open the museum record</a></p>';
}
const selectSections = (indices) => indices.map((i) => curatorialSections[i]);
function sectionPage(indices) {
  const selected = selectSections(indices);
  return selected.map(sectionHtml).join('') + sourceList(selected.flatMap((section) => section.sourceIds));
}

export function installNotes() {
  const notes = document.querySelector('#notes-dialog');
  const index = document.querySelector('#index-dialog');
  const title = document.querySelector('#notes-title');
  const content = document.querySelector('#notes-content');
  let restoreFocus = null;

  function close(dialog) {
    if (dialog.open) dialog.close();
  }
  function open(kind = 'introduction') {
    restoreFocus = document.activeElement;
    close(index);
    let heading = 'The exhibition';
    let body = '';
    if (kind === 'introduction') {
      body = '<p class="intro-quote">Rome did not only build an empire.<br>It built an image of eternity.</p>' +
        paragraph('AETERNA moves through nine rooms of sculpture and memory. Scroll to enter each room, use the index to move freely, and pause at the objects to look more closely.') +
        paragraph('The exhibition combines imagined galleries with two museum scans. Generated images are contemporary Roman-inspired studies. They are not documentary photographs of particular ancient objects.') +
        sectionHtml(curatorialSections[6]) +
        '<h3>A quieter visit</h3>' + paragraph('The index includes Reduce motion. Chapter navigation and direct sculpture controls remain available. The exhibition follows the motion preference of your device until you choose otherwise.') +
        sourceList(['smk-cast', 'met-wellhead']);
    } else if (kind === 'sources') {
      heading = 'Sources & acknowledgements';
      body = paragraph('Historical notes draw on the museum publications below. The two real scan sources are identified separately from the imagined photographic compositions.') +
        sectionHtml(curatorialSections[6]) + objectHtml('herakles') + objectHtml('wellhead') +
        '<h3>Imagined images & materials</h3>' +
        paragraph('The hero, anonymous portraits, macro study, architectural spaces, procession plate and final galleries are original ImageGen compositions. Their framing and light are artistic interpretations. No generated face is assigned the identity of an emperor.') +
        paragraph('Display typography: Bodoni Moda. Interface typography: Manrope. Both are locally included under the SIL Open Font License. Spatial rendering uses Three.js under the MIT License.') +
        sourceList();
    } else if (kind === 'portraiture') {
      heading = 'Portraits and power';
      body = sectionPage([0, 1]) + paragraph('The two portraits in this room are imagined studies of visual traditions. They are not photographs of named sitters or dated museum objects.');
    } else if (kind === 'polychromy') {
      heading = 'Before the white';
      body = sectionPage([4]) + paragraph('The macro image in this room is an interpretive study of weathered stone. It does not document the pigment evidence of a specific sculpture.');
    } else if (kind === 'herakles') {
      heading = 'A cast, a body, an afterlife';
      body = objectHtml('herakles') + sectionPage([2, 5]);
    } else if (kind === 'wellhead') {
      heading = 'A world around a well';
      body = objectHtml('wellhead') + sectionPage([3]) +
        paragraph('The room opens with an imagined procession relief. As the view opens into space, the museum scan takes over: a second-century Roman wellhead. The two images are distinct objects, joined here by the idea of carving stories into a surface.');
    } else if (kind === 'monument') {
      heading = 'The monumental image';
      body = paragraph('An imperial portrait could inhabit a city as a monument. The bronze equestrian Marcus Aurelius, catalogued to 161–180 CE, moved to the Capitoline in 1538. Its long afterlife shows how an image can take on meanings beyond its original setting.') +
        paragraph('The architectural scene in AETERNA is imagined. Its statue and arch are not a reconstruction of that equestrian monument or a particular ancient site.') +
        sourceList(['marcus-aurelius', 'prima-porta']);
    } else if (kind === 'restoration') {
      heading = 'What a fragment remembers';
      body = sectionPage([5, 1]) + paragraph('The interactive fragments come from the same SMK cast scan used in the body room. Their cut boundaries and paths were composed for this exhibition; they are not the object’s historical fractures.');
    }
    title.textContent = heading;
    content.innerHTML = body;
    if (!notes.open) notes.showModal();
    notes.querySelector('.notes-scroll').scrollTop = 0;
    notes.querySelector('.close-dialog').focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-notes]').forEach((button) => button.addEventListener('click', () => open(button.dataset.openNotes)));
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => close(button.closest('dialog'))));
  for (const dialog of [notes, index]) {
    dialog.addEventListener('click', (event) => { if (event.target === dialog && dialog === notes) close(dialog); });
  }
  notes.addEventListener('close', () => {
    const target = restoreFocus instanceof HTMLElement && restoreFocus.isConnected &&
      restoreFocus.checkVisibility() && !restoreFocus.closest('[inert]')
      ? restoreFocus : document.querySelector('#open-index');
    target.focus({ preventScroll: true });
  });
  return { open, close };
}
