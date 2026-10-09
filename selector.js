export const RATINGS = [10, 12.5, 15, 20, 25, 30, 40, 50];
export const MANUFACTURERS = ['ABB', 'Innomotics', 'CG'];
export const manufacturerLabel = name => name === 'CG' ? 'Crompton / CG' : name;

export function selectMotors(motors, { hp, poles, efficiency, manufacturer = 'all' }) {
  if (!Number.isFinite(hp) || hp < 10 || hp > 50) {
    return { error: 'Enter a power between 10 and 50 HP.', motors: [], suggestions: [] };
  }
  if (![2, 4, 6].includes(poles) || !['IE3', 'IE4', 'both'].includes(efficiency)) {
    return { error: 'Choose 2, 4 or 6 poles and IE3 or IE4.', motors: [], suggestions: [] };
  }
  if (manufacturer !== 'all' && !MANUFACTURERS.includes(manufacturer)) {
    return { error: 'Choose ABB, Innomotics, Crompton / CG or all manufacturers.', motors: [], unavailable: [], suggestions: [] };
  }
  if (!RATINGS.includes(hp)) {
    const lower = RATINGS.filter(r => r < hp).at(-1);
    const upper = RATINGS.find(r => r > hp);
    return { error: 'This power is not listed in the selected catalogue range.', motors: [], unavailable: [], suggestions: [lower, upper].filter(r => r !== undefined) };
  }
  const matches = motors.filter(m => m.hp === hp && m.poles === poles && (efficiency === 'both' || m.efficiency === efficiency) && (manufacturer === 'all' || m.manufacturer === manufacturer));
  return { error: null, motors: matches.filter(m => m.available !== false), unavailable: matches.filter(m => m.available === false), suggestions: [] };
}
