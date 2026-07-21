import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

const html = readFileSync('/tmp/workspace/colinkershaw/die-by-the-browser/die-by-the-browser.html', 'utf8');

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

// Test all 4 filter types with formula
const cases = [
  {notation: '6d20--2-3', rolls: [1, 2, 10, 12, 15, 20], desc: 'drop 2 lowest'},
  {notation: '6d20-+2-3', rolls: [1, 2, 10, 12, 15, 20], desc: 'drop 2 highest'},
  {notation: '6d20++2-3', rolls: [1, 2, 10, 12, 15, 20], desc: 'keep 2 highest'},
  {notation: '6d20+-2-3', rolls: [1, 2, 10, 12, 15, 20], desc: 'keep 2 lowest'},
  // Large sided dice with overflow risk
  {notation: '4d100-+2-2', rolls: [50, 70, 99, 100], desc: 'drop 2 highest d100 mod=-2 (overflow risk)'},
  {notation: '4d100+-2-2', rolls: [1, 2, 99, 100], desc: 'keep 2 lowest d100 mod=-2 (overflow risk)'},
];

for (const {notation, rolls, desc} of cases) {
  window.eval(`
    var p = DiceNotation.parse('${notation}');
    var r = DiceNotation.computeResult(${JSON.stringify(rolls)}, p.collections[0]);
    window._r = r;
    DiceApp.state.rollResults = [r];
    DiceApp.state.errorMessage = '';
    DiceApp.ui.renderResults();
  `);

  const result = window._r;
  const cells = [...dom.window.document.querySelectorAll('.die-cell')];
  
  console.log(`\n=== ${notation} (${desc}) ===`);
  console.log(`Mode: ${result.mode}, modifier: ${result.modifier}`);
  console.log(`maxGameWidth (computed): ${window.eval('window._maxGameWidth')}`);
  
  // Get all computed widths from rendered HTML
  const htmlDump = dom.window.document.getElementById('results').innerHTML;
  const chipWidths = [...htmlDump.matchAll(/min-width:(\d+)ch/g)].map(m => m[1]);
  console.log(`All min-width values in output: ${[...new Set(chipWidths)].join(', ')}`);
  
  for (const cell of cells) {
    const isDropped = cell.classList.contains('die-dropped');
    const gameVal = cell.querySelector('.die-game-val')?.textContent;
    const rawFormula = cell.querySelector('.die-raw')?.textContent;
    const gameWidth = cell.querySelector('.die-game-val')?.style.minWidth;
    const rawWidth = cell.querySelector('.die-raw-val')?.style.minWidth;
    const indicator = cell.querySelector('.die-game-indicator')?.textContent || '';
    console.log(`  ${isDropped ? '[DROPPED]' : '[KEPT]  '} game=${gameVal}${indicator} (chip width=${gameWidth}) | formula: ${rawFormula} (raw-val width=${rawWidth})`);
  }
}
