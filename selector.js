export const RATINGS = [10, 12.5, 15, 20, 25, 30, 40, 50];

export function selectMotors(motors, { hp, poles, efficiency }) {
  if (!Number.isFinite(hp) || hp < 10 || hp > 50) {
    return { error: 'Enter a power between 10 and 50 HP.', motors: [], suggestions: [] };
  }
  if (![2, 4, 6].includes(poles) || !['IE3', 'IE4', 'both'].includes(efficiency)) {
    return { error: 'Choose 2, 4 or 6 poles and IE3 or IE4.', motors: [], suggestions: [] };
  }
  const matches = motors.filter(m => Math.abs(m.hp - hp) < 0.000001 && m.poles === poles && (efficiency === 'both' || m.efficiency === efficiency));
  if (!matches.length) {
    const lower = RATINGS.filter(r => r < hp).at(-1);
    const upper = RATINGS.find(r => r > hp);
    return { error: 'This power is not listed in the selected ABB catalogue range.', motors: [], suggestions: [lower, upper].filter(r => r !== undefined) };
  }
  return { error: null, motors: matches, suggestions: [] };
}
