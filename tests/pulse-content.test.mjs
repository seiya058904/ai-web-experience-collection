import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, sources, heroCopy, sharedNotes, chamberDescriptions } from '../experiences/pulse/src/content.ts';
import { transitionSpecs } from '../experiences/pulse/src/story.ts';
import { findLocaleIssues } from '../provenance/pulse/upstream/scripts/check-locale.mjs';

const expectedChapters = [
  ['The Living Form', 'Not a symbol. An organ.'],
  ['Four Chambers', 'Four rooms, two directions.'],
  ['The Signal', 'Before the push, a signal.'],
  ['The Return', 'A return from the body.'],
  ['One-Way Gates', 'Doors that answer to pressure.'],
  ['Toward the Lungs', 'The short journey outward.'],
  ['Exchange', 'Where air meets blood—across a barrier.'],
  ['The Way Back', 'The return is different now.'],
  ['The Stronger Wall', 'The wall built for distance.'],
  ['Around the Body', 'One beat, many destinations.'],
  ['Beat Again', 'The story has no final beat.'],
];
const sourceIds = new Set(sources.map(s => s.id));
const completeCopy = JSON.stringify({ chapters, heroCopy, sharedNotes, chamberDescriptions });
const wordCount = text => text.trim().split(/\s+/).length;
const chapter = number => chapters[number - 1];

test('all eleven requested chapters and exact editorial headings are present in narrative order', () => {
  assert.equal(chapters.length, 11);
  assert.deepEqual(chapters.map(c => [c.shortTitle, c.title]), expectedChapters);
  assert.deepEqual(chapters.map(c => c.number), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.deepEqual(chapters.map(c => c.id), Array.from({ length: 11 }, (_, i) => `CH-${String(i + 1).padStart(2, '0')}`));
});

test('chapter slugs are unique stable HTML/hash-safe identifiers', () => {
  assert.equal(new Set(chapters.map(c => c.slug)).size, 11);
  assert.equal(new Set(chapters.map(c => c.id)).size, 11);
  for (const c of chapters) assert.match(c.slug, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
});

test('the full narrative contains exactly twenty-two substantive and distinct beats', () => {
  const beats = chapters.flatMap(c => c.beats);
  assert.equal(beats.length, 22);
  assert.equal(new Set(beats.map(b => b.title)).size, 22);
  assert.equal(new Set(beats.map(b => b.body)).size, 22);
  for (const c of chapters) {
    assert.equal(c.beats.length, 2);
    for (const beat of c.beats) {
      assert.ok(beat.title.trim().length >= 8, `${c.id}: empty beat heading`);
      assert.ok(wordCount(beat.body) >= 25, `${c.id}: beat is too slight to explain its subject`);
      assert.ok(beat.body.endsWith('.'), `${c.id}: prose ends mid-sentence`);
    }
  }
});

test('every chapter carries an explanatory lead and a visible illustration qualification', () => {
  for (const c of chapters) {
    assert.ok(wordCount(c.lead) >= 10, `${c.id}: missing lead`);
    assert.ok(wordCount(c.diagramNote) >= 8, `${c.id}: missing diagram note`);
  }
});

test('every chapter is supported by at least one resolvable source record', () => {
  assert.equal(sourceIds.size, sources.length);
  for (const c of chapters) {
    assert.ok(c.sourceIds.length > 0, `${c.id}: missing source`);
    assert.equal(new Set(c.sourceIds).size, c.sourceIds.length, `${c.id}: duplicate source references`);
    for (const id of c.sourceIds) assert.ok(sourceIds.has(id), `${c.id}: unresolved source ${id}`);
  }
});

test('the four required primary source URLs remain available as actual records', () => {
  const urls = new Set(sources.map(s => s.url));
  for (const url of [
    'https://www.nhlbi.nih.gov/health/heart/anatomy',
    'https://www.nhlbi.nih.gov/health/heart/blood-flow',
    'https://www.nhlbi.nih.gov/health/heart/heart-beats',
    'https://www.heart.org/en/health-topics/congenital-heart-defects/about-congenital-heart-defects/how-the-healthy-heart-works',
  ]) assert.ok(urls.has(url), `Required source is absent: ${url}`);
});

test('source records have scoped attribution, secure URLs, and concrete review dates', () => {
  for (const s of sources) {
    const url = new URL(s.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(s.title.trim().length > 5);
    assert.ok(s.organization.trim().length > 3);
    assert.ok(s.scope.trim().length > 20);
    assert.match(s.reviewed, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(`${s.reviewed}T00:00:00Z`)));
  }
});

test('every interaction provides at least two distinct choices with explanatory results', () => {
  for (const c of chapters) {
    const interaction = c.interaction;
    assert.ok(interaction.title.trim().length >= 8, `${c.id}: unnamed interaction`);
    assert.ok(wordCount(interaction.description) >= 6, `${c.id}: missing learning purpose`);
    assert.ok(interaction.options.length >= 2, `${c.id}: not an actual comparison`);
    assert.equal(new Set(interaction.options.map(o => o.value)).size, interaction.options.length, `${c.id}: ambiguous option identity`);
    assert.equal(new Set(interaction.options.map(o => o.result)).size, interaction.options.length, `${c.id}: choices repeat the same result`);
    for (const option of interaction.options) {
      assert.match(option.value, /^[a-z][a-z-]*$/);
      assert.ok(option.label.trim().length >= 3);
      assert.ok(wordCount(option.result) >= 8, `${c.id}/${option.value}: result does not explain the selection`);
    }
    assert.ok(['Reset', 'Reset view'].includes(interaction.resetLabel));
    const hasSelectedOption = interaction.options.some(o => o.value === interaction.initialValue);
    const isUnselectedReset = ['CH-01', 'CH-02'].includes(c.id) && interaction.initialValue === 'all';
    assert.ok(hasSelectedOption || isUnselectedReset, `${c.id}: initial state cannot be selected or reset`);
  }
});

test('chamber locator covers the four specific chambers and correct destinations', () => {
  assert.deepEqual(chapter(2).interaction.options.map(o => o.label), ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle']);
  assert.match(chamberDescriptions.ra, /right atrium.*body.*venae cavae/i);
  assert.match(chamberDescriptions.rv, /right ventricle.*pulmonary valve.*lungs/i);
  assert.match(chamberDescriptions.la, /left atrium.*lungs.*pulmonary veins/i);
  assert.match(chamberDescriptions.lv, /left ventricle.*aortic valve.*systemic/i);
});

test('anterior orientation is explicit and anatomical right is not silently reversed', () => {
  assert.match(sharedNotes.orientation, /Anatomical right appears on your left/);
  assert.match(sharedNotes.orientation, /anatomical left appears on your right/);
  assert.deepEqual(chapter(1).interaction.options.map(o => o.label), ['Anatomical right', 'Anatomical left']);
});

test('electrical and circulation controls retain separate modes and descriptions', () => {
  for (const number of [3, 11]) {
    const options = chapter(number).interaction.options;
    assert.deepEqual(options.map(o => o.label), ['Electrical sequence', 'Blood pathway', 'Both']);
    assert.match(options.find(o => o.value === 'electrical').result, /(?:SA node|right atrium)/);
    assert.match(options.find(o => o.value === 'blood').result, /(?:blood|Blood|heart)/);
    assert.match(options.find(o => o.value === 'both').result, /separate/);
  }
  assert.match(sharedNotes.electrical, /tissue, not the blood vessels/);
});

test('gas-exchange directions are opposite and both cross an explicit barrier', () => {
  const options = chapter(7).interaction.options;
  assert.equal(options.find(o => o.value === 'oxygen').label, 'Oxygen into blood');
  assert.equal(options.find(o => o.value === 'carbon').label, 'Carbon dioxide toward air');
  assert.match(options.find(o => o.value === 'oxygen').result, /alveolar air → tissue barrier → capillary blood/);
  assert.match(options.find(o => o.value === 'carbon').result, /capillary blood → tissue barrier → alveolar air/);
  assert.match(chapter(7).beats[0].body, /Red blood cells remain inside the capillary/);
  assert.match(chapter(7).diagramNote, /Schematic scale/);
});

test('valve family comparison distinguishes inlet support from outflow cusps', () => {
  const c = chapter(5);
  assert.deepEqual(c.interaction.options.map(o => o.label), ['Atrioventricular valves', 'Outflow valves']);
  assert.match(c.beats[0].body, /chordae.*papillary muscles/);
  assert.match(c.beats[1].body, /not all open together/);
  assert.match(c.diagramNote, /Outflow valves have no chordae/);
});

test('venous and arterial naming is based on direction, with pulmonary exceptions explained', () => {
  assert.match(chapter(6).beats[0].body, /artery because it carries blood away from the heart/);
  assert.match(chapter(8).beats[0].body, /vein is named for its direction toward the heart/);
  assert.match(chapter(6).diagramNote, /oxygen-poor blood traveling away/);
  assert.match(chapter(8).lead, /pulmonary veins carry oxygen-rich blood/);
});

test('the public narrative distinguishes actual blood color and journey timescale', () => {
  assert.match(sharedNotes.bloodColor, /Oxygen-poor blood is dark red/);
  assert.match(sharedNotes.bloodColor, /diagram convention, not the color of blood/);
  assert.match(sharedNotes.timing, /does not show a complete circulation in one heartbeat/);
  assert.match(chapter(10).beats[1].body, /does not mean a blood cell crosses the whole body in one beat/);
});

test('the exact hero title, lead, CTA and descriptive alternative text are retained', () => {
  assert.equal(heroCopy.brand, 'PULSE');
  assert.equal(heroCopy.subtitle, 'An atlas of one heartbeat');
  assert.equal(heroCopy.title, 'Every beat has a direction.');
  assert.equal(heroCopy.lead, 'A guided journey through the chambers, signals and pathways that keep blood moving.');
  assert.equal(heroCopy.cta, 'Enter the heart');
  assert.match(heroCopy.alt, /anatomical human heart/i);
  assert.match(heroCopy.metaDescription, /chambers, valves, signals and blood circulation/);
});

test('ten transitions connect the entire editorial sequence without skipped chapters', () => {
  assert.equal(transitionSpecs.length, chapters.length - 1);
  for (const [i, transition] of transitionSpecs.entries()) {
    assert.equal(transition.source, chapters[i].id);
    assert.equal(transition.target, chapters[i + 1].id);
  }
});

test('no filler, invented biometric readings or external clinical-validation claim enters the editorial data', () => {
  assert.doesNotMatch(completeCopy, /lorem ipsum|coming soon|placeholder copy|your heart rate is/i);
  assert.doesNotMatch(completeCopy, /\b\d{2,3}\s*(?:bpm|mmHg|beats per minute)\b/i);
  assert.match(sharedNotes.illustration, /not a patient scan/);
  assert.match(sharedNotes.review, /have not undergone independent clinical validation/);
});

test('the English-only guard covers every editorial string and source record', () => {
  assert.deepEqual(findLocaleIssues(JSON.stringify({ chapters, sources, heroCopy, sharedNotes, chamberDescriptions }), 'content'), []);
});

test('the source-script guard actually detects unexpected scripts with useful positions', () => {
  const sample = `English line.\n${String.fromCodePoint(0x4e2d)}${String.fromCodePoint(0x3042)}${String.fromCodePoint(0xac00)}`;
  const issues = findLocaleIssues(sample, 'sample.ts');
  assert.equal(issues.length, 3);
  assert.deepEqual(issues.map(i => [i.file, i.line, i.column]), [
    ['sample.ts', 2, 1], ['sample.ts', 2, 2], ['sample.ts', 2, 3],
  ]);
});

test('scientific symbols and ordinary English punctuation do not trigger the locale guard', () => {
  assert.deepEqual(findLocaleIssues('PULSE — oxygen → blood; O₂, CO₂, 25%, 1000 × 700.', 'sample.ts'), []);
});
