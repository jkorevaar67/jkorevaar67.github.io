/* Shared Mathfinity chapter list: used by the homepage and the chooser.
   Add a new section here once, or via the existing chapter-catalog.js.
   The homepage features the highest available chapter and section number.
*/
(function () {
'use strict';
const common2=[
['2.1A · Operations · Theory A','index.html?topic=opA'],['2.1B · Operations · Theory B','index.html?topic=opB'],['2.2A · Prime factorisation','index.html?topic=prime'],['2.2B · Highest common factor','index.html?topic=hcf'],['2.2C · Lowest common multiple','index.html?topic=lcm']
];
const data={
learn:{label:'Learn',chapters:{'2':{label:'Chapter 2 · Numbers and Operations',sections:[...common2,['2.3 · Fractions','chapter-2-3.html'],['2.4 · Negative Numbers','chapter-2-4.html'],['2.5 · Multiplying and Dividing Negative Numbers','chapter-2-5.html'],['2.6 · Negative Fractions','chapter-2-6.html']]},'3':{label:'Chapter 3 · Graphs and Formulas',sections:[['3.1 · Coordinate planes','chapter-3-1.html'],['3.2 · Patterns in coordinate planes','chapter-3-2.html']]}}},
exercise:{label:'Exercise',chapters:{'2':{label:'Chapter 2 · Numbers and Operations',sections:[...common2.map(x=>[x[0].replace('Theory','Practice'),x[1]]),['2.3 · Fractions','chapter-2-3-exercise.html'],['2.4 · Negative Numbers','chapter-2-4-exercise.html'],['2.5 · Multiplying and Dividing Negative Numbers','chapter-2-5-exercise.html'],['2.6 · Negative Fractions','chapter-2-6-exercise.html']]},'3':{label:'Chapter 3 · Graphs and Formulas',sections:[['3.1 · Coordinate planes','chapter-3-1-exercise.html'],['3.2 · Patterns in coordinate planes','chapter-3-2-exercise.html']]}}},
test:{label:'Test',chapters:{'2':{label:'Chapter 2 · Numbers and Operations',sections:[['2.3 · Fractions','chapter-2-3-test.html'],['2.4 · Negative Numbers','chapter-2-4-test.html'],['2.5 · Multiplying and Dividing Negative Numbers','chapter-2-5-test.html'],['2.6 · Negative Fractions','chapter-2-6-test.html']]},'3':{label:'Chapter 3 · Graphs and Formulas',sections:[['3.1 · Coordinate planes','chapter-3-1-test.html'],['3.2 · Patterns in coordinate planes','chapter-3-2-test.html']]}}},
final:{label:'Final Test',chapters:{'2':{label:'Chapter 2 · Numbers and Operations',url:'chapter-2-final-test.html'}}}
};
for(const item of window.WIZNOVA_CATALOG||[]){if(item.group&&item.group!=='mathfinity')continue;for(const kind of ['learn','exercise','test']){const chapters=data[kind].chapters,key=String(item.chapter);if(!chapters[key])chapters[key]={label:'Chapter '+key+' · '+item.chapterTitle,sections:[]};const url=item.pages[kind],existing=chapters[key].sections.findIndex(x=>x[1]===url);const row=[item.chapter+'.'+item.section+' · '+item.title,url];if(existing>=0)chapters[key].sections[existing]=row;else chapters[key].sections.push(row);}}


window.MATHFINITY_CHAPTERS = data;

// This also runs on the chooser, which has no featured card.
const card = document.getElementById('latest-section');
if (!card) return;
const candidates = [];
for (const [chapterNumber, chapter] of Object.entries(data.learn.chapters)) {
  for (const row of chapter.sections) {
    const match = row[0].match(/^(\d+)\.(\d+)([A-Z])?\s*·/i);
    if (!match || !row[1]) continue;
    candidates.push({chapterNumber, chapter, row,
      chapterRank: Number(match[1]), sectionRank: Number(match[2]),
      partRank: (match[3] || '').toUpperCase()});
  }
}
candidates.sort((a, b) => b.chapterRank - a.chapterRank ||
  b.sectionRank - a.sectionRank || b.partRank.localeCompare(a.partRank));
const latest = candidates[0];
if (!latest) return; // Keep the existing card if the list is empty.
card.querySelector('.pill').textContent = 'New · ' + latest.chapter.label;
card.querySelector('h2').textContent = latest.row[0];
card.querySelector('p').textContent = 'Choose Learn, Exercise or Test to get started with this section.';
const actions = card.querySelector('.actions');
actions.replaceChildren();
const sectionKey = latest.row[0].split(' · ')[0];
for (const [kind, label] of [['learn', '📖 Learn'], ['exercise', '✏️ Exercise'], ['test', '🏆 Test']]) {
  const section = data[kind].chapters[latest.chapterNumber]?.sections.find(
    row => row[0].split(' · ')[0] === sectionKey);
  if (!section || typeof section[1] !== 'string' || !section[1].trim()) continue;
  let url;
  try { url = new URL(section[1], document.baseURI); } catch (_) { continue; }
  if (url.origin !== location.origin || !['http:', 'https:', 'file:'].includes(url.protocol)) continue;
  const link = document.createElement('a');
  link.className = 'chapter-cta';
  link.href = section[1];
  link.textContent = label;
  actions.append(link);
}
})();
