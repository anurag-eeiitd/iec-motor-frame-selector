import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RATINGS, selectMotors } from '../selector.js';
const { motors } = JSON.parse(await readFile(new URL('../data/abb-frsm69a.json', import.meta.url), 'utf8'));

// Independently transcribed from the six supplied catalogue screenshots.
const expected = {
  'IE3-2': ['132SB2', '132SD2/160MLJ2', '160MLA2', '160MLB2', '160MLC2', '180MLA2', '200MLA2', '200MLB2'],
  'IE3-4': ['132SMA4', '132SMB4/160MLJ4', '160MLA4', '160MLB4', '180MLA4', '180MLB4', '200MLA4', '225SMA4'],
  'IE3-6': ['160MLA6', '160MLJ6', '160MLB6', '180MLA6', '200MLA6', '200MLB6', '225SMA6', '250SMA6'],
  'IE4-2': ['132SB2', '160MLJ2', '160MLA2', '160MLB2', '160MLC2', '180MLA2', '200MLA2', '200MLB2'],
  'IE4-4': ['132SMA4', '160MLJ4', '160MLA4', '160MLB4', '180MLA4', '180MLB4', '200MLA4', '225SMA4'],
  'IE4-6': ['160MLA6', '160MLJ6', '160MLB6', '180MLA6', '200MLA6', '200MLB6', '225SMA6', '250SMA6']
};

test('all 48 rating/class/pole combinations match the supplied catalogue', () => {
  for (const [key, codes] of Object.entries(expected)) {
    const [efficiency, poleString] = key.split('-');
    RATINGS.forEach((hp, i) => {
      const result = selectMotors(motors, { hp, poles: Number(poleString), efficiency });
      assert.equal(result.error, null);
      assert.deepEqual(result.motors.map(m => m.model), codes[i].split('/').map(code => `M2BAX${code}`), `${key}, ${hp} HP`);
    });
  }
});
test('50 rows with the exact HP/kW pairs, source pages and ABB-only HTTPS links', () => {
  assert.equal(motors.length, 50);
  const kw = [7.5, 9.3, 11, 15, 18.5, 22, 30, 37];
  const pages = { 'IE3-2': 10, 'IE3-4': 11, 'IE3-6': 12, 'IE4-2': 14, 'IE4-4': 15, 'IE4-6': 16 };
  for (const motor of motors) {
    assert.equal(motor.kw, kw[RATINGS.indexOf(motor.hp)]);
    assert.equal(motor.sourcePage, pages[`${motor.efficiency}-${motor.poles}`]);
    assert.equal(motor.model, `M2BAX${motor.frame}${motor.model.at(-2)}${motor.poles}`);
    for (const link of Object.values(motor.documents)) {
      const url = new URL(link);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.hostname, 'search.abb.com');
      assert.ok(url.searchParams.get('DocumentID'));
    }
  }
});
test('combined comparison preserves all alternate frames and the catalogue restriction', () => {
  const result = selectMotors(motors, { hp: 12.5, poles: 4, efficiency: 'both' });
  assert.equal(result.motors.length, 3);
  assert.deepEqual(result.motors.map(m => m.frame), ['132SM', '160ML', '160ML']);
  assert.match(result.motors[0].notes[0], /Class F temperature rise only/);
  assert.equal(motors.filter(m => m.notes.length).length, 1);
});
test('unsupported ratings are not interpolated or rounded up', () => {
  const result = selectMotors(motors, { hp: 17, poles: 4, efficiency: 'IE3' });
  assert.ok(result.error);
  assert.deepEqual(result.motors, []);
  assert.deepEqual(result.suggestions, [15, 20]);
});
test('empty, invalid, out-of-scope and unsupported input cannot return a motor', () => {
  for (const hp of [NaN, Infinity, -1, 0, 9.9, 50.01]) {
    assert.ok(selectMotors(motors, { hp, poles: 4, efficiency: 'IE3' }).error);
  }
  assert.ok(selectMotors(motors, { hp: 20, poles: 8, efficiency: 'IE3' }).error);
  assert.ok(selectMotors(motors, { hp: 20, poles: 4, efficiency: 'IE2' }).error);
});
