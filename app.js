import { RATINGS, MANUFACTURERS, manufacturerLabel, selectMotors } from './selector.js';

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
  return { hp: /^\d+(?:\.\d+)?$/.test($('power').value.trim()) ? Number($('power').value) : NaN, poles: Number($('poles').value), efficiency: $('efficiency').value, manufacturer: $('manufacturer').value };
}

function selectedCompanies(input) { return input.manufacturer === 'all' ? MANUFACTURERS : [input.manufacturer]; }
function selectedClasses(input) { return input.efficiency === 'both' ? ['IE3', 'IE4'] : [input.efficiency]; }

function card(motor) {
  const card = element('article', 'motor-card');
  const header = element('div', 'motor-card-header');
  header.append(element('strong', 'company-name', manufacturerLabel(motor.manufacturer)), element('span', 'class-tag', motor.efficiency));
  card.append(header);
  if (motor.available === false) {
    card.classList.add('unavailable');
    card.append(element('p', 'unavailable-title', 'Not listed'));
    return card;
  }
  const label = element('h4', 'frame-label', 'IEC frame');
  const frame = element('p', 'frame-value', motor.frame);
  const specs = element('div', 'motor-spec');
  specs.append(element('strong', '', `${motor.hp} HP / ${motor.kw.toFixed(2)} kW`), element('span', '', `${motor.poles} poles`));
  const price = element('p', 'motor-price', 'Catalogue list price');
  price.append(element('strong', '', currency.format(motor.priceInr)));
  card.append(label, frame, element('p', 'manufacturer-code', `Manufacturer frame: ${motor.manufacturerFrame}`), element('p', 'model-code', motor.model), specs, price, element('p', 'family-label', motor.series), element('p', 'page-label', `${motor.manufacturer === 'CG' ? 'Printed page' : 'Catalogue page'} ${motor.sourcePage}`));
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

function renderReference(input) {
  const { poles, hp } = input;
  $('reference-poles').textContent = `${poles} poles`;
  $('reference-rows').replaceChildren();
  $('reference-headers').replaceChildren();
  const headings = ['HP / kW', ...selectedCompanies(input).flatMap(company => selectedClasses(input).map(efficiency => `${manufacturerLabel(company)} ${efficiency}`))];
  for (const title of headings) {
    const th = element('th', '', title);
    th.scope = 'col';
    $('reference-headers').append(th);
  }
  for (const rating of RATINGS) {
    const row = element('tr', rating === hp ? 'selected' : '');
    const cell = element('td');
    const button = element('button', 'rating-button', `${rating} HP`);
    button.type = 'button';
    button.addEventListener('click', () => { $('power').value = rating; render(); });
    cell.append(button, element('span', 'kw', `${motors.find(m => m.hp === rating).kw.toFixed(2)} kW`));
    row.append(cell);
    for (const company of selectedCompanies(input)) {
      for (const efficiency of selectedClasses(input)) {
        const matches = motors.filter(m => m.hp === rating && m.poles === poles && m.efficiency === efficiency && m.manufacturer === company);
        const cell = element('td');
        for (const motor of matches) {
          const item = element('div', 'reference-entry');
          item.append(element('strong', '', motor.available ? motor.frame : 'Not listed'));
          if (motor.available) item.append(element('span', 'reference-price', currency.format(motor.priceInr)));
          cell.append(item);
        }
        row.append(cell);
      }
    }
    $('reference-rows').append(row);
  }
}

function render() {
  const input = selection();
  const selected = selectMotors(motors, input);
  $('power').setAttribute('aria-invalid', String(Boolean(selected.error)));
  results.replaceChildren();
  if (selected.error) {
    const message = element('div', 'status-message');
    message.append(element('strong', '', selected.error), element('p', '', 'Listed HP ratings: 10, 12.5, 15, 20, 25, 30, 40 and 50.'));
    if (selected.suggestions.length) {
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
    const companies = selectedCompanies(input);
    const entries = [...selected.motors, ...selected.unavailable];
    for (const efficiency of selectedClasses(input)) {
      const group = element('section', 'comparison-group');
      group.setAttribute('aria-label', `${efficiency} comparison`);
      group.append(element('h3', 'comparison-title', `${efficiency} frames & list prices`));
      const grid = element('div', `result-grid${companies.length === 1 ? ' single' : ' compare-all'}`);
      for (const company of companies) {
        const column = element('div', 'manufacturer-column');
        entries.filter(m => m.efficiency === efficiency && m.manufacturer === company).forEach(motor => column.append(card(motor)));
        grid.append(column);
      }
      group.append(grid);
      results.append(group);
    }
  }
  lastSelection = JSON.stringify(input);
  renderReference(input);
}

form.addEventListener('submit', event => { event.preventDefault(); render(); });
form.addEventListener('input', () => {
  if (motors.length && lastSelection !== JSON.stringify(selection())) {
    results.replaceChildren(element('p', 'status-message', 'Select Find frame to update.'));
    $('reference').open = false;
  }
});
$('poles').addEventListener('change', () => {
  $('calculated-speed').textContent = `${120 * 50 / Number($('poles').value)} RPM · 50 Hz`;
});

async function load() {
  try {
    const response = await fetch(new URL('./data/motor-catalogues.json', import.meta.url));
    if (!response.ok) throw new Error(`Catalogue HTTP ${response.status}`);
    const catalogue = await response.json();
    motors = catalogue.motors;
    $('find-button').disabled = false;
    render();
  } catch (error) {
    results.replaceChildren(element('p', 'status-message', 'The catalogue could not be loaded. Reload the page to try again.'));
    $('reference').hidden = true;
    console.error(error);
  }
}
load();
