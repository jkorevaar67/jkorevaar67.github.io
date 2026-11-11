/* Wiznova: homepage and chooser use the existing shared chapter-catalog.js.
   The newest section is the highest chapter/section number within each class. */
(function () {
  'use strict';
  const labels = {mavo2:'MAVO 2', havo3:'HAVO 2', vwo3:'VWO 3', vwo5wisb:'VWO 5 Wiskunde B'};
  const kinds = {learn:'Leren', exercise:'Oefenen', test:'Test maken'};
  const catalog = Array.isArray(window.WIZNOVA_CATALOG) ? [...window.WIZNOVA_CATALOG] : [];
  // VWO 5 uses one practice site per section. Keep the shared catalog intact.
  const practiceSite = item => page(item, 'exercise') || page(item, 'learn');
  const goniometry = catalog.find(item => item.group === 'vwo5wisb' && Number(item.chapter) === 8 && Number(item.section) === 1);
  if (goniometry) goniometry.pages = {exercise:'goniometrie-oefenen.html'};
  const hasGoniometricEquations = catalog.some(item => item?.group === 'vwo5wisb' &&
    Number(item.chapter) === 8 && Number(item.section) === 3 && page(item, 'exercise'));
  if (!hasGoniometricEquations) {
    catalog.push({
      group: 'vwo5wisb',
      chapter: 8,
      section: 3,
      chapterTitle: 'Goniometrische functies',
      title: 'Goniometrische vergelijkingen',
      pages: {exercise:'vwo5wisb-chapter-8-3-exercise.html'}
    });
  }
  function page(item, kind) {
    const path = item.pages?.[kind];
    if (typeof path !== 'string' || !path.trim()) return null;
    try {
      const url = new URL(path, document.baseURI);
      return url.origin === location.origin && ['http:', 'https:', 'file:'].includes(url.protocol) ? path : null;
    } catch (_) { return null; }
  }
  function itemsFor(group) {
    const unique = new Map();
    for (const item of catalog) {
      if (!item || item.group !== group || !/^\d+$/.test(String(item.chapter)) ||
          !/^\d+$/.test(String(item.section)) || !Object.keys(kinds).some(kind => page(item, kind))) continue;
      unique.set(item.chapter + '.' + item.section, item);
    }
    return [...unique.values()].sort((a,b) => Number(a.chapter)-Number(b.chapter) || Number(a.section)-Number(b.section));
  }
  function title(item) { return item.chapter + '.' + item.section + ' · ' + item.title; }
  function latestContent(container, item) {
    if (!item) { container.hidden = true; return; }
    container.hidden = false;
    const heading = document.createElement('h3');
    heading.textContent = 'Nieuw · ' + title(item);
    const actions = document.createElement('div');
    for (const [kind, label] of (item.group === 'vwo5wisb' ? [['exercise','Open oefensite']] : Object.entries(kinds))) {
      const href = item.group === 'vwo5wisb' ? practiceSite(item) : page(item,kind);
      if (!href) continue;
      const a = document.createElement('a');
      a.className = 'button'; a.href = href; a.textContent = label;
      actions.append(a);
    }
    container.replaceChildren(heading,actions);
  }
  for (const container of document.querySelectorAll('[data-latest-class]')) {
    latestContent(container,itemsFor(container.dataset.latestClass).at(-1));
  }
  const chapter = document.getElementById('chapter');
  if (!chapter) return;
  const $ = id => document.getElementById(id);
  const group = new URLSearchParams(location.search).get('klas');
  const items = labels[group] ? itemsFor(group) : [];
  const practiceOnly = group === 'vwo5wisb';
  if (practiceOnly) { $('activity').value = 'exercise'; $('activity').closest('label').hidden = true; $('start').textContent = 'Open oefensite'; }
  const latest = items.at(-1);
  $('heading').textContent = labels[group] || 'Kies eerst je klas';
  latestContent($('latest-section'), practiceOnly ? undefined : latest);
  function selected() {
    return items.find(item => String(item.chapter) === chapter.value && String(item.section) === $('section').value);
  }
  function update() {
    const item = selected();
    const href = item && (practiceOnly ? practiceSite(item) : page(item,$('activity').value));
    $('start').disabled = !href;
    $('empty').textContent = !labels[group] ? 'Kies eerst je klas via de link bovenaan.' :
      !items.length ? 'Voor deze klas staat nog geen lesmateriaal klaar.' :
      !href ? 'Deze activiteit is voor deze paragraaf nog niet beschikbaar.' : '';
    $('start').onclick = () => { if (href) location.href = href; };
  }
  function sections() {
    $('section').replaceChildren();
    for (const item of items.filter(item => String(item.chapter) === chapter.value)) {
      $('section').add(new Option(title(item) + (!practiceOnly && item === latest ? ' (nieuwste)' : ''),String(item.section)));
    }
    $('section').disabled = !$('section').options.length;
    update();
  }
  chapter.replaceChildren();
  const seen = new Set();
  for (const item of items) {
    const key = String(item.chapter);
    if (seen.has(key)) continue;
    seen.add(key);
    chapter.add(new Option(item.chapter + ' · ' + item.chapterTitle,key));
  }
  chapter.disabled = !seen.size;
  chapter.onchange = sections;
  $('section').onchange = update;
  $('activity').onchange = update;
  sections();
})();
