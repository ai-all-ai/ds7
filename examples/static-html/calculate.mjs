export function calculateEnergy({ powerKw, hours, efficiency = 0.85 }) {
  if (
    ![powerKw, hours, efficiency].every(Number.isFinite) ||
    powerKw < 0 ||
    hours < 0 ||
    efficiency < 0 ||
    efficiency > 1
  )
    throw new RangeError('Invalid input');
  return powerKw * hours * efficiency;
}
