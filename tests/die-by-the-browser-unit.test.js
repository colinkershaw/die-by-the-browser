import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Polyfills for JSDOM environment
 */
function setupPolyfills(window) {
  polyfillMatchMedia(window);
  polyfillHistoryAPI(window);
}

/**
 * Polyfill matchMedia for JSDOM (not natively supported)
 */
function polyfillMatchMedia(window) {
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
}

/**
 * Polyfill History API for JSDOM
 * JSDOM's history.replaceState/pushState throw errors with file:// protocol
 * We manually update window.location.hash as a workaround
 */
function polyfillHistoryAPI(window) {
  const originalReplaceState = window.history.replaceState.bind(window.history);
  const originalPushState = window.history.pushState.bind(window.history);

  const updateHashOnError = (original, state, title, url) => {
    try {
      original(state, title, url);
    } catch (e) {
      // JSDOM limitation: manually update hash
      if (url !== undefined && url !== null) {
        const urlStr = String(url);

        if (urlStr.includes('#')) {
          // Extract and set hash from URL
          window.location.hash = urlStr.split('#')[1] || '';
        } else if (urlStr === ' ' || urlStr === '') {
          // Clear the hash
          window.location.hash = '';
        }
      }
    }
  };

  window.history.replaceState = function(state, title, url) {
    updateHashOnError(originalReplaceState, state, title, url);
  };

  window.history.pushState = function(state, title, url) {
    updateHashOnError(originalPushState, state, title, url);
  };
}

/**
 * Wait for DiceApp to initialize with timeout
 */
async function waitForDiceApp(window, timeoutMs = 5000) {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkReady = () => {
      const isReady = window.eval('typeof DiceApp !== "undefined" && typeof DiceApp.tests !== "undefined"');

      if (isReady) {
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`DiceApp failed to initialize within ${timeoutMs}ms`));
      } else {
        const retryMs = 50;
        setTimeout(checkReady, retryMs);
      }
    };
    checkReady();
  });
}

/**
 * Main test runner
 */
async function runTests() {
  // Load the HTML file
  const html = readFileSync(resolve(__dirname, '../die-by-the-browser.html'), 'utf-8');

  // Create a virtual DOM with polyfills
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + __dirname + '/die-by-the-browser.html',
    beforeParse(window) {
      setupPolyfills(window);
    }
  });

  const { window } = dom;

  // Wait for DiceApp to initialize
  await waitForDiceApp(window);

  try {
    // Run tests - HTML outputs all results
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