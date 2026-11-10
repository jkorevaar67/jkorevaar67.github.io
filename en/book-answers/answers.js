const chapter = document.querySelector('#chapter');
const section = document.querySelector('#section');
const status = document.querySelector('#status');
const answer = document.querySelector('#answer');

const chapters = { 3: 'chapter-3/answers.json' };
const chapterData = new Map();
let imports = {};

function options(select, entries, prompt) {
  select.replaceChildren(new Option(prompt, ''), ...entries.map(([value, label]) => new Option(label, value)));
  select.disabled = !entries.length;
}

function renderSection() {
  answer.replaceChildren();
  const data = chapterData.get(chapter.value);
  const selected = data?.sections[section.value];
  if (!selected) {
    status.textContent = 'Choose a section.';
    return;
  }
  status.textContent = selected.title;
  const displayed = new Set();
  for (const [number, entry] of Object.entries(selected.exercises)) {
    if (typeof entry === 'string') {
      const heading = document.createElement('h2');
      heading.textContent = 'Exercise ' + number;
      const text = document.createElement('p');
      text.className = 'answer-text';
      text.textContent = entry;
      answer.append(heading, text);
      continue;
    }
    for (const [name] of entry) {
      if (displayed.has(name)) continue;
      displayed.add(name);
      const source = document.createElement('figure');
      source.className = 'answer-source';
      source.style.margin = '0 0 1rem';
      source.style.minWidth = '0';
      const image = document.createElement('img');
      [image.width, image.height] = data.pages[name];
      image.alt = selected.title + ' · answer page ' + displayed.size;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        source.textContent = 'This answer page could not be loaded.';
      });
      const dataUrl = new URL(chapters[chapter.value], document.baseURI);
      image.src = new URL(name, dataUrl);
      source.append(image);
      answer.append(source);
    }
  }
}

section.addEventListener('change', renderSection);

chapter.addEventListener('change', async () => {
  const selected = chapter.value;
  options(section, [], 'Choose a section');
  answer.replaceChildren();
  if (!selected) {
    status.textContent = 'Choose a chapter.';
    return;
  }

  status.textContent = 'Loading book answers…';
  try {
    if (!chapterData.has(selected)) {
      let data = { sections: [] };
      if (chapters[selected]) {
        const response = await fetch(chapters[selected]);
        if (!response.ok) throw new Error('Chapter unavailable');
        data = await response.json();
      }
      for (const imported of imports[selected]?.sections ?? []) {
        const existing = data.sections.find(section => section.title === imported.title);
        if (existing) Object.assign(existing.exercises, imported.exercises);
        else data.sections.push(imported);
      }
      chapterData.set(selected, data);
    }
    if (chapter.value !== selected) return;
    const data = chapterData.get(selected);
    options(section, data.sections.map(({ title }, index) => [String(index), title]), 'Choose a section');
    status.textContent = 'Choose a section.';
  } catch {
    if (chapter.value !== selected) return;
    chapter.value = '';
    status.textContent = 'Book answers could not be loaded. Choose the chapter again to retry.';
  }
});


async function initialise() {
  let importFailed = false;
  try {
    const response = await fetch('imports.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Imports unavailable');
    imports = await response.json();
  } catch {
    importFailed = true;
  }
  const numbers = [...new Set(['3', ...Object.keys(imports)])].sort((a, b) => Number(a) - Number(b));
  options(chapter, numbers.map(number => [number, number === '3' ? '3 · Graphs and formulas' : number]), 'Choose a chapter');
  chapter.value = '3';
  chapter.dispatchEvent(new Event('change'));
  if (importFailed) {
    const message = document.createElement('p');
    message.textContent = 'Recently uploaded answers could not be loaded.';
    answer.before(message);
  }
}

initialise();
