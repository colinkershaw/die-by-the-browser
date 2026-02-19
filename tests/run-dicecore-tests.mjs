import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run DiceCore tests in a JSDOM environment
 */
async function runDiceCoreTests() {
  // Load the HTML file
  const html = readFileSync(resolve(__dirname, '../die-by-the-browser.html'), 'utf-8');

  // Create a virtual DOM
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + __dirname + '/die-by-the-browser.html'
  });

  const { window } = dom;

  // Wait for DiceCore to initialize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Check if runDiceCoreTests is available
    if (typeof window.runDiceCoreTests !== 'function') {
      console.error('❌ window.runDiceCoreTests is not available');
      process.exit(1);
    }

    // Run tests
    const result = window.runDiceCoreTests();

    if (!result) {
      console.error('❌ runDiceCoreTests returned undefined/null');
      process.exit(1);
    }

    console.log('\n📊 DiceCore Test Results:');
    console.log(`   Total:  ${result.total}`);
    console.log(`   Passed: ${result.passed} ✅`);
    console.log(`   Failed: ${result.failed} ❌`);

    if (result.failed > 0) {
      console.log('\n❌ Some tests failed:');
      result.results.filter(r => !r.ok).forEach(r => {
        console.log(`   ${r.id}: ${r.error}`);
      });
    }

    // Exit with appropriate code
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n💥 Error running DiceCore tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runDiceCoreTests();
