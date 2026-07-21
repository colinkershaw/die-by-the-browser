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

// Simulate 20d20--18-12 (drop 18 lowest, keep 2 highest)
// Roll results: 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,18,20
// Dropped: 18 dice with raw=1
// Kept: raw=18 (result=6), raw=20 (result=8)
const rolls = Array(18).fill(1).concat([18, 20]);

window.eval(`
var r = DiceNotation.computeResult(${JSON.stringify(rolls)}, {
  count: 20, sides: 20, modifier: -12, modifierSign: '-',
  floor: null, ceiling: null, modifierMode: 'distributed',
  explodeMode: 'none', explodeThreshold: null,
  filterAction: 'drop', filterDirection: 'low', filterCount: 18
});
window._r = r;
DiceApp.state.rollResults = [r];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

const cells = dom.window.document.querySelectorAll('.die-cell');
console.log('Total cells:', cells.length);

// Check for any dropped cells that incorrectly show modifier
let bugs = [];
cells.forEach((cell, i) => {
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  
  // For dropped dice: formula should be "=raw" only (no -12)
  if (isDropped && dieRaw && dieRaw.includes('-12')) {
    bugs.push(`BUG Cell[${i}]: dropped=true but formula "${dieRaw}" contains modifier`);
  }
  // For dropped dice: game should NOT be the modified value (-11 to 8)
  if (isDropped && gameVal) {
    const gameNum = Number(gameVal);
    if (gameNum < 1) {
      bugs.push(`BUG Cell[${i}]: dropped=true but game="${gameVal}" shows modified value`);
    }
  }
  // For kept dice: formula SHOULD contain -12
  if (!isDropped && dieRaw && !dieRaw.includes('-12')) {
    bugs.push(`BUG Cell[${i}]: kept=true but formula "${dieRaw}" missing modifier`);
  }
});

if (bugs.length > 0) {
  console.log('\n*** BUGS FOUND ***');
  bugs.forEach(b => console.log(b));
} else {
  console.log('\nNo bugs found - all cells render correctly');
}

// Show first 5 and last 5 cells
console.log('\nFirst 5 cells:');
for (let i = 0; i < Math.min(5, cells.length); i++) {
  const cell = cells[i];
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
}
console.log('Last 5 cells:');
for (let i = Math.max(0, cells.length-5); i < cells.length; i++) {
  const cell = cells[i];
  const isDropped = cell.classList.contains('die-dropped');
  const gameVal = cell.querySelector('.die-game-val')?.textContent;
  const dieRaw = cell.querySelector('.die-raw')?.textContent;
  console.log(`  Cell[${i}]: dropped=${isDropped}, game="${gameVal}", formula="${dieRaw}"`);
}
