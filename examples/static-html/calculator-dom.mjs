import { calculateEnergy } from './calculate.mjs';

export function initCalculator(root) {
  if (!(root instanceof HTMLFormElement)) throw new TypeError('Expected a form');
  const output = root.elements.namedItem('result');
  if (!(output instanceof HTMLOutputElement)) throw new TypeError('Missing result output');
  const onSubmit = (event) => {
    event.preventDefault();
    if (!root.reportValidity()) return;
    try {
      const powerKw = Number(root.elements.namedItem('power').value);
      const hours = Number(root.elements.namedItem('hours').value);
      output.value = `${calculateEnergy({ powerKw, hours }).toFixed(2)} kWh`;
    } catch {
      output.value = 'Enter valid non-negative values.';
    }
  };
  root.addEventListener('submit', onSubmit);
  return () => root.removeEventListener('submit', onSubmit);
}
