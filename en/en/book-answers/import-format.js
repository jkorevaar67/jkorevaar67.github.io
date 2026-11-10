'use strict';
window.readBookAnswers = function (input) {
  function required(value, label) {
    if (typeof value !== 'string' || !value.trim()) throw Error(label + ' ontbreekt.');
    return value.trim();
  }
  const chapter = required(input?.hoofdstuk, 'Hoofdstuk');
  if (!/^[1-9]\d{0,2}$/.test(chapter)) throw Error('Gebruik een hoofdstuknummer van 1 t/m 999.');
  if (!Array.isArray(input.opgaven) || !input.opgaven.length) throw Error('Er zijn geen opgaven.');
  const title = required(input.onderdeel, 'Onderdeel');
  const exercises = Object.create(null);
  for (const item of input.opgaven) {
    const number = required(item?.nummer, 'Opgavenummer');
    if (!/^[a-z]*\d+[a-z]?$/i.test(number)) throw Error('Ongeldig opgavenummer: ' + number);
    if (Object.hasOwn(exercises, number)) throw Error('Dubbele opgave: ' + number);
    if (Array.isArray(item.onderdelen) && item.onderdelen.length) {
      const letters = new Set();
      exercises[number] = item.onderdelen.map(part => {
        const letter = required(part?.letter, 'Letter bij opgave ' + number);
        if (letters.has(letter.toLowerCase())) throw Error('Dubbel onderdeel bij opgave ' + number);
        letters.add(letter.toLowerCase());
        return letter + '. ' + required(part.antwoord, 'Antwoord bij opgave ' + number);
      }).join('\n');
    } else {
      exercises[number] = required(item.antwoord, 'Antwoord bij opgave ' + number);
    }
  }
  return { chapter, title, exercises };
};
