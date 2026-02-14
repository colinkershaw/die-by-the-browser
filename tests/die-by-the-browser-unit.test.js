import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  // Load the HTML file
  const html = readFileSync('./die-by-the-browser.html', 'utf-8');

  // Create a virtual DOM
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + __dirname + '/die-by-the-browser.html'
  });

  // Wait for scripts to load and DiceApp to initialize
  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    const result = await dom.window.DiceApp.tests.run();
    process.exit(result ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTests();