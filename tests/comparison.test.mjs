import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RATINGS, MANUFACTURERS, selectMotors } from '../selector.js';
const { motors } = JSON.parse(await readFile(new URL('../data/motor-catalogues.json', import.meta.url), 'utf8'));
const abb = JSON.parse(await readFile(new URL('../data/abb-frsm69a.json', import.meta.url), 'utf8')).motors;

// Independently transcribed frame and price pairs from the supplied Comparison sheet.
// Each entry corresponds to RATINGS; alternatives use |, unavailable entries use -.
const expected = {
  'Innomotics-IE3-2': '132S:141700 132S:192350 160M:314100 160M:337200 160L:399100 180M:429300 200L:622300 200L:690600',
  'Innomotics-IE4-2': '132S:195900 - 160M:363800 160M:418400 160L:516900 180M:582800 200L:774800 200L:927800',
  'Innomotics-IE3-4': '132M:178300 132M:221080 160M:307000 160L:355500 180M:446500 180L:477700 200L:667800 225S:849400',
  'Innomotics-IE4-4': '132M:206000 - 160M:406700 160L:504800 180M:615600 180L:715200 200L:934900 225S:1119600',
  'Innomotics-IE3-6': '160M:284900 - 160L:361700 180L:432800 200L:595700 200L:643400 225M:849300 250M:1247500',
  'Innomotics-IE4-6': '160M:367700 - 160L:475500 180L:584500 200L:796300 200L:848700 225M:1090800 250M:1568000',
  'CG-IE3-2': '132S:83385 132M:126923|160M:147197 160M:155906 160M:170689 160L:212974 180M:243328 200L:366847 200L:435119',
  'CG-IE4-2': '132M:120941 160M:194105 160M:201225 160M:235709 160L:294233 180M:352083 200L:518503 200L:600970',
  'CG-IE3-4': '132M:96906 160M:151164 160M:156376 160L:195209 180M:238931 180L:261672 200L:361026 225S:451588',
  'CG-IE4-4': '132M:136210 160M:211381 160M:213571 160L:260372 180M:323610 180L:354443 200L:498687 225S:596965',
  'CG-IE3-6': '160M:160730 160L:175144 160L:197884 180L:263866 200L:345585 200L:371274 225M:531659 250M:671504',
  'CG-IE4-6': '160M:207444 160L:229646 160L:259359 180L:338795 200L:457286 200L:502918 225M:703475 250M:946005'
};

test('all 96 new manufacturer combinations preserve frames, prices and missing ratings', () => {
  for (const [key, pairs] of Object.entries(expected)) {
    const [manufacturer, efficiency, pole] = key.split('-');
    pairs.split(' ').forEach((pair, i) => {
      const result = selectMotors(motors, { hp: RATINGS[i], poles: Number(pole), manufacturer, efficiency });
      assert.equal(result.error, null);
      assert.deepEqual(result.motors.map(m => `${m.frame}:${m.priceInr}`), pair === '-' ? [] : pair.split('|'), `${key} ${RATINGS[i]} HP`);
      assert.equal(result.unavailable.length, pair === '-' ? 1 : 0);
    });
  }
});

test('all 50 original ABB prices, ordering codes, links and restrictions are retained', () => {
  assert.equal(motors.filter(m => m.manufacturer === 'ABB').length, 50);
  for (const original of abb) {
    const motor = motors.find(m => m.manufacturer === 'ABB' && m.efficiency === original.efficiency && m.model === original.model);
    for (const key of ['hp', 'kw', 'poles', 'sourcePage', 'priceInr']) assert.equal(motor[key], original[key]);
    assert.deepEqual(motor.documents, original.documents);
    for (const note of original.notes) assert.ok(motor.notes.includes(note));
  }
});

test('all-company comparison contains every manufacturer and does not infer missing values', () => {
  assert.equal(motors.length, 147);
  assert.equal(motors.filter(m => m.available).length, 143);
  for (const hp of RATINGS) for (const poles of [2, 4, 6]) for (const efficiency of ['IE3', 'IE4']) {
    const result = selectMotors(motors, { hp, poles, efficiency, manufacturer: 'all' });
    assert.equal(result.error, null);
    assert.deepEqual([...new Set([...result.motors, ...result.unavailable].map(m => m.manufacturer))].sort(), [...MANUFACTURERS].sort());
    for (const m of result.motors) assert.ok(m.frame && m.manufacturerFrame && m.model && Number.isInteger(m.priceInr) && m.priceInr > 0);
    for (const m of result.unavailable) for (const key of ['frame', 'manufacturerFrame', 'model', 'priceInr', 'sourcePage']) assert.equal(m[key], null);
  }
});

test('manufacturer filtering, alternate CG entries and ordering restrictions are preserved', () => {
  const result = selectMotors(motors, { hp: 12.5, poles: 2, efficiency: 'both', manufacturer: 'CG' });
  assert.equal(result.motors.length, 3);
  assert.deepEqual(result.motors.map(m => m.model), ['9.30PN2_132', '9.3KP2', '9.3KX2TOP*']);
  assert.match(result.motors[0].notes.join(' '), /Indent/);
  assert.match(result.motors[2].notes.join(' '), /Indent/);
  assert.ok(result.motors.every(m => m.manufacturer === 'CG'));
  const axelera = selectMotors(motors, { hp: 10, poles: 4, efficiency: 'IE4', manufacturer: 'CG' }).motors[0];
  assert.equal(axelera.series, 'AXELERA Process Performance IE4');
  assert.equal(axelera.sourcePage, 13);
  assert.equal(axelera.manufacturerFrame, 'NX132M');
  assert.ok(selectMotors(motors, { hp: 20, poles: 4, efficiency: 'IE3', manufacturer: 'unknown' }).error);
  assert.deepEqual(selectMotors(motors, { hp: 17, poles: 4, efficiency: 'both', manufacturer: 'CG' }).suggestions, [15, 20]);
});
