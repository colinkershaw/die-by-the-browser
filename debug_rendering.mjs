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

// Test 1: drop 4 lowest, keep 2 highest, modifier -12 on d20
window.eval(`
var r1 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], {
  count: 6, sides: 20, modifier: -12, modifierSign: '-',
  floor: null, ceiling: null, modifierMode: 'distributed',
  explodeMode: 'none', explodeThreshold: null,
  filterAction: 'drop', filterDirection: 'low', filterCount: 4
});
window._r1 = r1;
DiceApp.state.rollResults = [r1];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- 6d20--4-12 (keep 2 highest [18,20], drop 4 lowest [1,2,3,4]) ---');
console.log('sortState:', window.eval('window._r1.sortState'));
const r1dieResults = JSON.parse(window.eval('JSON.stringify(window._r1.dieResults)'));
r1dieResults.forEach((d, i) => {
  console.log(`  dieResult[${i}]: raw=${d.raw} result=${d.result} kept=${d.kept} isDropped=${d.isDropped} resultDisplay="${d.resultDisplay}"`);
});
const cells1 = dom.window.document.querySelectorAll('.die-cell');
cells1.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});

// Test 2: drop 4 highest, keep 2 lowest, modifier -12 on d20
window.eval(`
var r2 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], {
  count: 6, sides: 20, modifier: -12, modifierSign: '-',
  floor: null, ceiling: null, modifierMode: 'distributed',
  explodeMode: 'none', explodeThreshold: null,
  filterAction: 'drop', filterDirection: 'high', filterCount: 4
});
window._r2 = r2;
DiceApp.state.rollResults = [r2];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- 6d20-+4-12 (drop 4 highest [4,18,20,...], keep 2 lowest [1,2]) ---');
console.log('sortState:', window.eval('window._r2.sortState'));
const r2dieResults = JSON.parse(window.eval('JSON.stringify(window._r2.dieResults)'));
r2dieResults.forEach((d, i) => {
  console.log(`  dieResult[${i}]: raw=${d.raw} result=${d.result} kept=${d.kept} isDropped=${d.isDropped} resultDisplay="${d.resultDisplay}"`);
});
const cells2 = dom.window.document.querySelectorAll('.die-cell');
cells2.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});

// Test 3: keep 2 highest, modifier -12 on d20
window.eval(`
var r3 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], {
  count: 6, sides: 20, modifier: -12, modifierSign: '-',
  floor: null, ceiling: null, modifierMode: 'distributed',
  explodeMode: 'none', explodeThreshold: null,
  filterAction: 'keep', filterDirection: 'high', filterCount: 2
});
window._r3 = r3;
DiceApp.state.rollResults = [r3];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- 6d20++2-12 (keep 2 highest [18,20]) ---');
console.log('sortState:', window.eval('window._r3.sortState'));
const r3dieResults = JSON.parse(window.eval('JSON.stringify(window._r3.dieResults)'));
r3dieResults.forEach((d, i) => {
  console.log(`  dieResult[${i}]: raw=${d.raw} result=${d.result} kept=${d.kept} isDropped=${d.isDropped} resultDisplay="${d.resultDisplay}"`);
});
const cells3 = dom.window.document.querySelectorAll('.die-cell');
cells3.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});

// Test 4: keep 2 lowest, modifier -12 on d20  
window.eval(`
var r4 = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], {
  count: 6, sides: 20, modifier: -12, modifierSign: '-',
  floor: null, ceiling: null, modifierMode: 'distributed',
  explodeMode: 'none', explodeThreshold: null,
  filterAction: 'keep', filterDirection: 'low', filterCount: 2
});
window._r4 = r4;
DiceApp.state.rollResults = [r4];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('\n--- 6d20+-2-12 (keep 2 lowest [1,2]) ---');
console.log('sortState:', window.eval('window._r4.sortState'));
const r4dieResults = JSON.parse(window.eval('JSON.stringify(window._r4.dieResults)'));
r4dieResults.forEach((d, i) => {
  console.log(`  dieResult[${i}]: raw=${d.raw} result=${d.result} kept=${d.kept} isDropped=${d.isDropped} resultDisplay="${d.resultDisplay}"`);
});
const cells4 = dom.window.document.querySelectorAll('.die-cell');
cells4.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
});
