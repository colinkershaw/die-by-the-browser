import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  // Load the HTML file
  const html = readFileSync(resolve(__dirname, '../die-by-the-browser.html'), 'utf-8');

  // Create a virtual DOM
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + __dirname + '/die-by-the-browser.html',
    beforeParse(window) {
      // Polyfill matchMedia BEFORE scripts execute
      window.matchMedia = window.matchMedia || function(query) {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {}
        };
      };

      // Polyfill history methods for JSDOM
      // JSDOM's history API throws errors with file:// protocol
      // We'll manually update window.location.hash instead
      const originalReplaceState = window.history.replaceState.bind(window.history);
      const originalPushState = window.history.pushState.bind(window.history);

      window.history.replaceState = function(state, title, url) {
        try {
          originalReplaceState(state, title, url);
        } catch (e) {
          // JSDOM limitation: manually update hash
          if (url !== undefined && url !== null) {
            const urlStr = String(url);

            if (urlStr.includes('#')) {
              // Extract hash from URL
              const hashPart = urlStr.split('#')[1];
              window.location.hash = hashPart || '';
            } else if (urlStr === ' ' || urlStr === '') {
              // Clear the hash
              window.location.hash = '';
            }
          }
        }
      };

      window.history.pushState = function(state, title, url) {
        try {
          originalPushState(state, title, url);
        } catch (e) {
          // JSDOM limitation: manually update hash
          if (url !== undefined && url !== null) {
            const urlStr = String(url);

            if (urlStr.includes('#')) {
              // Extract hash from URL
              const hashPart = urlStr.split('#')[1];
              window.location.hash = hashPart || '';
            } else if (urlStr === ' ' || urlStr === '') {
              // Clear the hash
              window.location.hash = '';
            }
          }
        }
      };
    }
  });

  const { window } = dom;

  // Wait for DiceApp
  const timeout = 5000;
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    const checkReady = () => {
      const isReady = window.eval('typeof DiceApp !== "undefined" && typeof DiceApp.tests !== "undefined"');

      if (isReady) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`DiceApp failed to initialize within ${timeout}ms`));
      } else {
        setTimeout(checkReady, 50);
      }
    };
    checkReady();
  });

  try {
    // Run tests - it's async, so we need to await the Promise
    const allPassed = await window.eval('DiceApp.tests.run()');

    // Exit with appropriate code (0 = success, 1 = failure)
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    // Only for unexpected exceptions during test execution
    console.error('\n💥 Test execution threw an exception:', error.message);
    process.exit(1);
  }
}

runTests();