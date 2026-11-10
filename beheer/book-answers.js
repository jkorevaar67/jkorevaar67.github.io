'use strict';
const bookFile = document.querySelector('#bookFile');
const bookPreview = document.querySelector('#bookPreview');
const bookPublish = document.querySelector('#bookPublish');
const bookStatus = document.querySelector('#bookStatus');
let bookImport;

bookFile.addEventListener('change', async () => {
  const file = bookFile.files[0];
  bookImport = null;
  bookPreview.textContent = '';
  bookPublish.disabled = true;
  bookStatus.textContent = '';
  if (!file) return;
  try {
    if (file.size > 500000) throw Error('Gebruik een JSON-bestand van maximaal 500 kB.');
    const data = window.readBookAnswers(JSON.parse(await file.text()));
    if (bookFile.files[0] !== file) return;
    bookImport = data;
    const entries = Object.entries(data.exercises);
    bookStatus.textContent = 'Hoofdstuk ' + data.chapter + ' · ' + data.title + ' · ' + entries.length + ' opgaven';
    bookPreview.textContent = entries.map(([number, text]) => number + ' — ' + text).join('\n');
    bookPublish.disabled = false;
  } catch (error) {
    if (bookFile.files[0] === file) bookStatus.textContent = error.message;
  }
});

bookPublish.addEventListener('click', async () => {
  if (!bookImport || !window.WIZNOVA_AUTH) return;
  if (!confirm('Publiceer deze antwoorden op Mathfinity? Dezelfde opgaven in dit onderdeel worden bijgewerkt.')) return;
  const { chapter, title, exercises } = bookImport;
  bookFile.disabled = true;
  bookPublish.disabled = true;
  bookStatus.textContent = 'Publiceren…';
  try {
    await window.WIZNOVA_AUTH.publishBookAnswers(chapter, title, exercises);
    bookStatus.textContent = 'Opgeslagen in GitHub. Mathfinity toont de antwoorden na de volgende GitHub Pages-publicatie.';
  } catch (error) {
    bookStatus.textContent = error.message;
    bookPublish.disabled = false;
  } finally {
    bookFile.disabled = false;
  }
});
