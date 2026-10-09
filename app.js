import { RATINGS, selectMotors } from './selector.js';

const $ = id => document.getElementById(id);
const form = $('selector');
const results = $('results');
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
let motors = [];
let lastSelection;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function selection() {
  return { hp: $('power').value.trim() === '' ? NaN : Number($('power').value), poles: Number($('poles').value), efficiency: $('efficiency').value };
}

function card(motor) {
  const card = element('article', 'motor-card');
  const header = element('div', 'motor-card-header');
  header.append(element('span', 'class-tag', motor.efficiency), element('span', 'page-label', `ABB · page ${motor.sourcePage}`));
  const label = element('h3', 'frame-label', 'ABB frame designation');
  const frame = element('p', 'frame-value', motor.frame);
  const specs = element('div', 'motor-spec');
  specs.append(element('strong', '', `${motor.hp} HP / ${motor.kw.toFixed(2)} kW`), element('span', '', `${motor.poles} poles`));
  const price = element('p', 'motor-price', 'Catalogue list price ');
  price.append(element('strong', '', currency.format(motor.priceInr)));
  card.append(header, label, frame, element('p', 'model-code', motor.model), specs, price);
  if (motor.notes.length) motor.notes.forEach(note => card.append(element('p', 'motor-note', note)));
  const docs = element('div', 'documents');
  for (const [key, title] of [['datasheet', 'Data sheet ↗'], ['drawing', 'GA drawing ↗'], ['terminalBox', 'Terminal box ↗']]) {
    if (!motor.documents[key]) continue;
    const link = element('a', '', title);
    link.href = motor.documents[key];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${title.replace(' ↗', '')} for ${motor.efficiency} ${motor.model} (opens new tab)`);
    docs.append(link);
  }
  card.append(docs);
  return card;
}

function renderReference(poles, hp) {
  $('reference-poles').textContent = `${poles} poles`;
  $('reference-rows').replaceChildren();
  for (const rating of RATINGS) {
    const row = element('tr', rating === hp ? 'selected' : '');
    const cell = element('td');
    const button = element('button', 'rating-button', `${rating} HP`);
    button.type = 'button';
    button.addEventListener('click', () => { $('power').value = rating; render(); });
    cell.append(button, element('span', 'kw', `${motors.find(m => m.hp === rating).kw.toFixed(2)} kW`));
    row.append(cell);
    for (const efficiency of ['IE3', 'IE4']) {
      const matches = motors.filter(m => m.hp === rating && m.poles === poles && m.efficiency === efficiency);
      row.append(element('td', '', matches.map(m => m.frame + (m.notes.length ? '*' : '')).join(' / ')));
    }
    $('reference-rows').append(row);
  }
}

function render() {
  const input = selection();
  const selected = selectMotors(motors, input);
  $('power').setAttribute('aria-invalid', String(Boolean(selected.error)));
  $('match-count').textContent = selected.motors.length ? `${selected.motors.length} ${selected.motors.length === 1 ? 'entry' : 'entries'}` : 'No match';
  const summary = $('selection-summary');
  summary.replaceChildren();
  if (Number.isFinite(input.hp)) summary.append(element('span', '', `${input.hp} HP`));
  summary.append(element('span', '', `${input.poles} poles`), element('span', '', `${6000 / input.poles} RPM at 50 Hz`), element('span', '', input.efficiency === 'both' ? 'IE3 & IE4' : input.efficiency));
  results.replaceChildren();
  $('result-caption').hidden = Boolean(selected.error);
  if (selected.error) {
    const message = element('div', 'status-message');
    message.append(element('strong', '', selected.error), element('p', '', 'Listed HP ratings: 10, 12.5, 15, 20, 25, 30, 40 and 50.'));
    if (selected.suggestions.length) {
      message.append(element('p', '', 'Choose a nearby catalogue rating to look it up:'));
      const choices = element('div', 'suggestions');
      for (const rating of selected.suggestions) {
        const button = element('button', '', `${rating} HP`);
        button.type = 'button';
        button.addEventListener('click', () => { $('power').value = rating; render(); });
        choices.append(button);
      }
      message.append(choices);
    }
    results.append(message);
  } else {
    const grid = element('div', `result-grid${selected.motors.length === 1 ? ' single' : ''}`);
    selected.motors.forEach(motor => grid.append(card(motor)));
    results.append(grid);
  }
  lastSelection = JSON.stringify(input);
  renderReference(input.poles, input.hp);
}

form.addEventListener('submit', event => { event.preventDefault(); render(); });
form.addEventListener('input', () => {
  if (motors.length && lastSelection !== JSON.stringify(selection())) {
    results.replaceChildren(element('p', 'status-message', 'Requirements changed. Select “Find frame” to update your result.'));
    $('selection-summary').replaceChildren();
    $('result-caption').hidden = true;
    $('match-count').textContent = 'Update needed';
    $('reference').open = false;
  }
});
for (const radio of document.querySelectorAll('[name="speed-mode"]')) {
  radio.addEventListener('change', () => {
    const speed = radio.value === 'speed';
    $('pole-field').hidden = speed;
    $('speed-field').hidden = !speed;
  });
}
$('poles').addEventListener('change', () => { $('speed').value = $('poles').value; });
$('speed').addEventListener('input', () => { $('poles').value = $('speed').value; });

async function load() {
  try {
    const response = await fetch(new URL('./data/abb-frsm69a.json', import.meta.url));
    if (!response.ok) throw new Error(`Catalogue HTTP ${response.status}`);
    const catalogue = await response.json();
    motors = catalogue.motors;
    $('find-button').disabled = false;
    render();
  } catch (error) {
    results.replaceChildren(element('p', 'status-message', 'The catalogue could not be loaded. Reload the page to try again.'));
    $('match-count').textContent = 'Unavailable';
    $('reference').hidden = true;
    console.error(error);
  }
}
load();
