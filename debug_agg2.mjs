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

// Test aggregated mode rendering with filter
window.eval(`
var p = DiceNotation.parse('6d20--4 -12');
var r = DiceNotation.computeResult([1, 2, 3, 4, 18, 20], p.collections[0]);
window._r = r;
DiceApp.state.rollResults = [r];
DiceApp.state.errorMessage = '';
DiceApp.ui.renderResults();
`);

console.log('Mode:', window.eval('window._r.mode'));
console.log('\nFull rendered HTML:');
const resultsHTML = dom.window.document.getElementById('results').innerHTML;
console.log(resultsHTML.substring(0, 3000));
