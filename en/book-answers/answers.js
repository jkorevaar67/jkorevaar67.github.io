const chapter = document.querySelector('#chapter');
const section = document.querySelector('#section');
const exercise = document.querySelector('#exercise');
const status = document.querySelector('#status');
const answer = document.querySelector('#answer');

const chapters = { 3: 'chapter-3/answers.json' };
const chapterData = new Map();
let imports = {};

function options(select, entries, prompt) {
  select.replaceChildren(new Option(prompt, ''), ...entries.map(([value, label]) => new Option(label, value)));
  select.disabled = !entries.length;
}

function renderAnswer() {
  answer.replaceChildren();
  const data = chapterData.get(chapter.value);
  const selectedSection = data?.sections[section.value];
  const pages = selectedSection?.exercises[exercise.value];
  if (!pages) {
    status.textContent = 'Choose an exercise to view its answer.';
    return;
  }

  status.textContent = selectedSection.title + ' · Exercise ' + exercise.value;
  if (typeof pages === 'string') {
    const text = document.createElement('p');
    text.className = 'answer-text';
    text.textContent = pages;
    answer.append(text);
    return;
  }
  const dataUrl = new URL(chapters[chapter.value], document.baseURI);
  for (const [index, [name, y]] of pages.entries()) {
    const viewport = document.createElement('div');
    viewport.className = 'answer-page';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', index ? 'Answer continued' : status.textContent);
    const source = document.createElement('div');
    source.className = 'answer-source';
    const image = document.createElement('img');
    const [width, height] = data.pages[name];
    image.width = width;
    image.height = height;
    image.alt = index ? 'Continuation of the answer page' : 'Answer page for exercise ' + exercise.value;
    const marker = document.createElement('span');
    marker.className = 'answer-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = '➜';
    marker.style.top = (100 * y / height) + '%';
    image.addEventListener('load', () => {
      viewport.scrollTop = Math.max(0, marker.offsetTop - 32);
    });
    image.addEventListener('error', () => {
      viewport.textContent = 'The answer image could not be loaded.';
    });
    source.append(image, marker);
    viewport.append(source);
    answer.append(viewport);
    image.src = new URL(name, dataUrl);
  }
}

section.addEventListener('change', () => {
  const selected = chapterData.get(chapter.value)?.sections[section.value];
  options(exercise, Object.keys(selected?.exercises ?? {}).map(number => [number, number]), 'Choose an exercise');
  renderAnswer();
});

chapter.addEventListener('change', async () => {
  const selected = chapter.value;
  options(section, [], 'Choose a section');
  options(exercise, [], 'Choose an exercise');
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
