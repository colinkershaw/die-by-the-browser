import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

const html = readFileSync('./die-by-the-browser.html', 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  beforeParse(window) {
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    window.history.pushState = () => {};
    window.history.replaceState = () => {};
    window.requestAnimationFrame = (cb) => { setTimeout(cb, 0); return 1; };
    window.cancelAnimationFrame = () => {};
    window.scrollTo = () => {};
  }
});

await new Promise(resolve => setTimeout(resolve, 300));

const window = dom.window;

// Test: parse "6d20--4 -12" (space separated aggregated mod)
window.eval(`
var p1 = DiceNotation.parse('6d20--4 -12');
var p2 = DiceNotation.parse('6d20--4-12');
window._p1 = p1;
window._p2 = p2;
`);

const p1 = JSON.parse(window.eval('JSON.stringify(window._p1)'));
const p2 = JSON.parse(window.eval('JSON.stringify(window._p2)'));

console.log('Parse of "6d20--4 -12":', JSON.stringify(p1.collections[0]));
console.log('Parse of "6d20--4-12":', JSON.stringify(p2.collections[0]));

// Compute with fixed rolls [1, 2, 3, 4, 18, 20] for the space-separated case
window.eval(`
var r1 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], window._p1.collections[0]);
window._r1 = r1;
DiceApp.state.rollResults = [r1];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- "6d20--4 -12" (space-separated = aggregated mode) ---');
console.log('Mode:', window.eval('window._r1.mode'));
const cells1 = dom.window.document.querySelectorAll('.die-cell, .roll-chunk');
cells1.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val, .roll-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});

// Compute for the distributed case
window.eval(`
var r2 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], window._p2.collections[0]);
window._r2 = r2;
DiceApp.state.rollResults = [r2];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- "6d20--4-12" (attached = distributed mode) ---');
console.log('Mode:', window.eval('window._r2.mode'));
const cells2 = dom.window.document.querySelectorAll('.die-cell, .roll-chunk');
cells2.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val, .roll-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});
