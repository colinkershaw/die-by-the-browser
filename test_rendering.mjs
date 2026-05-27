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

await new Promise(resolve => setTimeout(resolve, 500));

const window = dom.window;
const DiceNotation = window.DiceNotation;
const DiceApp = window.DiceApp;

if (!DiceNotation) { console.error('DiceNotation not found'); process.exit(1); }

// Test: 4d6--2 with modifier -1 (drop 2 lowest, keep 2 highest)
// Fixed rolls: [1, 2, 5, 6]
const notation = '4d6--2-1';
const params = DiceNotation.parse(notation);
console.log('Params[0]:', JSON.stringify(params[0]));

const result = DiceNotation.computeResult([1, 2, 5, 6], params[0]);
console.log('\nMode:', result.mode);
console.log('\ndieResults:');
result.dieResults.forEach((d, i) => {
  console.log(`  [${i}] raw=${d.raw} result=${d.result} rawDisplay="${d.rawDisplay}" resultDisplay="${d.resultDisplay}" kept=${d.kept} isDropped=${d.isDropped}`);
});

// Now render and check the HTML
DiceApp.state.rollResults = [result];
DiceApp.ui.renderResults();
const resultsHtml = window.document.getElementById('results').innerHTML;
console.log('\nRendered HTML (first 3000 chars):');
console.log(resultsHtml.substring(0, 3000));
