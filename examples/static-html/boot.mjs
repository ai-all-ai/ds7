import { initCalculator } from './calculator-dom.mjs';

for (const root of document.querySelectorAll('[data-calculator]')) initCalculator(root);
