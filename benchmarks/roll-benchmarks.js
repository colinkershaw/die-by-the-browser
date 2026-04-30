/**
 * roll-benchmarks.js
 *
 * Node.js benchmark harness for die-by-the-browser.
 * Measures per-phase timing for representative stress scenarios:
 *   parse, compute, and format (HTML string generation).
 *
 * DOM-commit and paint-adjacent phases are not measured here because they
 * require a real browser layout engine.  Those phases are measured in the
 * browser via DiceApp.perf (activate with ?perf=1 in the URL or by calling
 * DiceApp.perf.enable() in the DevTools console).
 *
 * Usage
 * -----
 *   node benchmarks/roll-benchmarks.js
 *
 * Optional flags
 *   --runs N      Number of timed iterations per scenario  (default: 10)
 *   --warmup N    Number of warm-up iterations to discard  (default: 3)
 *
 * Interpretation guide
 * --------------------
 *   parse   – tokenising and validating the notation string; almost always <1 ms.
 *   compute – rolling dice and building result objects (Math.random loops).
 *   format  – rendering result objects to an HTML string (no DOM access).
 *
 *   If compute + format is small relative to total wall-clock time you observe
 *   in the browser, the remaining cost is DOM commit + layout + paint (main-
 *   thread browser work that Web Workers cannot help with).
 *
 *   If compute dominates, a multi-worker fan-out could reduce wall-clock time
 *   proportionally to available cores.
 *
 *   If format dominates, off-main-thread string generation (workers) could help
 *   but only moves cost off the main thread; total CPU time is unchanged.
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
function parseFlag(name, defaultVal) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    return isNaN(n) ? defaultVal : n;
  }
  return defaultVal;
}

const RUNS   = parseFlag('--runs',   10);
const WARMUP = parseFlag('--warmup',  3);

// ---------------------------------------------------------------------------
// Benchmark scenarios
// ---------------------------------------------------------------------------
const SCENARIOS = [
  {
    label: 'Small simple roll (10d6)',
    notation: '10d6',
    description: 'Baseline: trivially fast in all phases.',
  },
  {
    label: 'Large simple roll (10000d6)',
    notation: '10000d6',
    description: 'Many dice, no modifiers — isolates raw compute and chip-span generation cost.',
  },
  {
    label: 'Large decorated roll (1000d20+5)',
    notation: '1000d20+5',
    description: 'Distributed modifier per die — full per-die HTML rendering (game-span, clamp, range).',
  },
  {
    label: 'Explosion-heavy roll (500d6!!)',
    notation: '500d6!!',
    description: 'Compounding explosions: recursive extra rolls, explode-chain spans in output.',
  },
  {
    label: 'Filter + modifier combo (200d20++10+3)',
    notation: '200d20++10+3',
    description: 'Keep-high filter plus aggregated modifier — dropped-die strikethrough spans.',
  },
  {
    label: 'Complex batch (50d6 50d6-2 50d20!!)',
    notation: '50d6 50d6-2 50d20!!',
    description: 'Multiple notation groups in one input — parse + multi-result formatting.',
  },
  {
    label: 'Max-stress decorated (5000d20+1)',
    notation: '5000d20+1',
    description: 'Near the spinner threshold with distributed modifier — heaviest realistic format load.',
  },
];

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------
function setupPolyfills(window) {
  // matchMedia
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => {},
    };
  };

  // requestAnimationFrame — stub required because DiceApp.perf calls rAF after each
  // results render when perf is enabled (even though _report is no-op'd in benchmarks).
  // Without this polyfill the JSDOM window would throw on the rAF call.
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));

  // history replaceState / pushState — same workaround as unit tests
  const origReplace = window.history.replaceState.bind(window.history);
  const origPush    = window.history.pushState.bind(window.history);
  const safe = (orig, state, title, url) => {
    try { orig(state, title, url); }
    catch (e) {
      if (url !== undefined && url !== null) {
        const s = String(url);
        if (s.includes('#')) window.location.hash = s.split('#')[1] || '';
        else if (s === ' ' || s === '') window.location.hash = '';
      }
    }
  };
  window.history.replaceState = (s, t, u) => safe(origReplace, s, t, u);
  window.history.pushState    = (s, t, u) => safe(origPush,    s, t, u);
}

async function loadApp() {
  const html = readFileSync(resolve(__dirname, '../die-by-the-browser.html'), 'utf-8');
  const dom  = new JSDOM(html, {
    runScripts: 'dangerously',
    resources:  'usable',
    url: 'file://' + __dirname + '/die-by-the-browser.html',
    beforeParse(window) { setupPolyfills(window); },
  });

  const { window } = dom;

  // Wait for DiceApp to be ready (same pattern as unit tests)
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 10_000;
    const check = () => {
      if (window.eval('typeof DiceApp !== "undefined" && typeof DiceApp.perf !== "undefined"')) {
        return resolve();
      }
      if (Date.now() > deadline) return reject(new Error('DiceApp failed to initialize'));
      setTimeout(check, 50);
    };
    check();
  });

  // Suppress console output that the app emits during init / rendering
  window.console = {
    log:   () => {},
    warn:  () => {},
    error: () => {},
    group: () => {},
    groupEnd: () => {},
  };

  // DiceNotation and DiceApp are both declared with `const` in the script block
  // (not on window). Access them through the window's eval context.
  const DiceNotation = window.eval('DiceNotation');
  const DiceApp      = window.eval('DiceApp');

  return { window, DiceApp, DiceNotation };
}

// ---------------------------------------------------------------------------
// Single-scenario runner
// ---------------------------------------------------------------------------
function runScenario(DiceApp, DiceNotation, notation) {
  // ── parse phase ──────────────────────────────────────────────────────────
  const t0 = performance.now();
  const { collections: parsed, error } = DiceNotation.parse(notation);
  const t1 = performance.now();

  if (!parsed) {
    throw new Error(`Parse error for "${notation}": ${error}`);
  }

  // ── compute phase ─────────────────────────────────────────────────────────
  const t2 = performance.now();
  const nextResults = [];
  for (const coll of parsed) {
    const {
      batchCount, count, sides, modifier, limit, limitSign, modifierMode,
      explodeMode, explodeThreshold, filterAction, filterDirection, filterCount,
    } = coll;
    for (let b = 0; b < batchCount; b++) {
      const rawRolls = DiceNotation.roll(count, sides);
      const result   = DiceNotation.computeResult(rawRolls, {
        count, sides, modifier, limit, limitSign, modifierMode,
        explodeMode, explodeThreshold, filterAction, filterDirection, filterCount,
      });
      nextResults.push(result);
    }
  }
  const t3 = performance.now();

  // ── format + DOM-commit phases via DiceApp.ui.renderResults() ─────────────
  // We use the app's own perf marks (DiceApp.perf) to separate HTML string
  // generation from the JSDOM innerHTML write so the phases are clearly split.
  // Note: JSDOM's innerHTML write is orders of magnitude cheaper than a real
  // browser's DOM commit + layout; do not extrapolate these numbers.
  const originalResults  = DiceApp.state.rollResults;
  const originalRolling  = DiceApp.state.isRolling;
  const originalError    = DiceApp.state.errorMessage;

  DiceApp.state.rollResults  = nextResults;
  DiceApp.state.isRolling    = false;
  DiceApp.state.errorMessage = '';

  // Prime the perf module so renderResults() will record format/domCommit marks.
  DiceApp.perf.beginRoll(notation);

  DiceApp.ui.renderResults();

  const marks = DiceApp.perf.getLastMarks() || {};
  const format    = (marks.formatEnd    !== undefined && marks.formatStart    !== undefined)
    ? marks.formatEnd    - marks.formatStart    : null;
  const domCommit = (marks.domCommitEnd !== undefined && marks.domCommitStart !== undefined)
    ? marks.domCommitEnd - marks.domCommitStart : null;

  // Restore state
  DiceApp.state.rollResults  = originalResults;
  DiceApp.state.isRolling    = originalRolling;
  DiceApp.state.errorMessage = originalError;

  return {
    parse:     t1 - t0,
    compute:   t3 - t2,
    format:    format    ?? 0,
    domCommit: domCommit ?? 0,
    total:     (t1 - t0) + (t3 - t2) + (format ?? 0) + (domCommit ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean   = values.reduce((s, v) => s + v, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min    = sorted[0];
  const max    = sorted[sorted.length - 1];
  return { mean, median, min, max };
}

function fmt(ms) {
  return ms.toFixed(2).padStart(8);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');
  console.log('🎲 die-by-the-browser — Roll Pipeline Benchmark');
  console.log(`   Warm-up runs : ${WARMUP}  |  Timed runs : ${RUNS}`);
  console.log('   Phases measured (Node.js / JSDOM):');
  console.log('     parse      – tokenise + validate notation string');
  console.log('     compute    – Math.random loops + result object construction');
  console.log('     format     – HTML string assembly (JS only, no DOM)');
  console.log('     DOM commit – JSDOM innerHTML write (cheap proxy; ≪ real browser cost)');
  console.log('');
  console.log('   NOT measured here (requires a real browser):');
  console.log('     real DOM commit – node allocation + style resolution');
  console.log('     paint-adjacent  – layout + paint latency (2×rAF gap)');
  console.log('   → Use ?perf=1 in the browser URL for the full 5-phase breakdown.');
  console.log('');

  const { DiceApp, DiceNotation } = await loadApp();

  // Enable perf instrumentation so renderResults() records format/domCommit marks.
  // Console output is already suppressed; only suppress the perf _report.
  DiceApp.perf.enable();
  DiceApp.perf._report = () => {};  // no-op: we read marks directly

  const results = [];

  for (const scenario of SCENARIOS) {
    process.stdout.write(`  ⏳  ${scenario.label} … `);

    const runs = [];
    for (let i = 0; i < WARMUP + RUNS; i++) {
      const r = runScenario(DiceApp, DiceNotation, scenario.notation);
      if (i >= WARMUP) runs.push(r);
    }

    const parse     = stats(runs.map(r => r.parse));
    const compute   = stats(runs.map(r => r.compute));
    const format    = stats(runs.map(r => r.format));
    const domCommit = stats(runs.map(r => r.domCommit));
    const total     = stats(runs.map(r => r.total));

    results.push({ scenario, parse, compute, format, domCommit, total });
    process.stdout.write('done\n');
  }

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('═'.repeat(110));
  console.log(' RESULTS  (all times in ms, median of ' + RUNS + ' runs)');
  console.log('═'.repeat(110));

  const hdr = [
    'Scenario'.padEnd(42),
    'parse'.padStart(8),
    'compute'.padStart(9),
    'format'.padStart(8),
    'DOM(JSDOM)'.padStart(12),
    'subtotal'.padStart(10),
    '  dominant phase',
  ].join(' ');
  console.log(hdr);
  console.log('─'.repeat(110));

  for (const { scenario, parse, compute, format, domCommit, total } of results) {
    const phases  = {
      parse:     parse.median,
      compute:   compute.median,
      format:    format.median,
      'DOM(JSDOM)': domCommit.median,
    };
    const dominant = Object.entries(phases).sort((a, b) => b[1] - a[1])[0][0];
    const pct = (v) => `${Math.round((v / total.median) * 100)}%`.padStart(4);

    console.log([
      scenario.label.padEnd(42),
      fmt(parse.median),
      fmt(compute.median),
      fmt(format.median),
      fmt(domCommit.median).padStart(12),
      fmt(total.median),
      `  ${dominant} (${pct(phases[dominant])})`,
    ].join(' '));
  }

  console.log('─'.repeat(110));
  console.log('');
  console.log(' Phase breakdown (median ms · min – max across ' + RUNS + ' runs)');
  console.log('');

  for (const { scenario, parse, compute, format, domCommit, total } of results) {
    console.log(`  📋 ${scenario.label}`);
    console.log(`     ${scenario.description}`);
    console.log(`     parse        ${fmt(parse.median)} ms  [${parse.min.toFixed(2)} – ${parse.max.toFixed(2)}]`);
    console.log(`     compute      ${fmt(compute.median)} ms  [${compute.min.toFixed(2)} – ${compute.max.toFixed(2)}]`);
    console.log(`     format       ${fmt(format.median)} ms  [${format.min.toFixed(2)} – ${format.max.toFixed(2)}]`);
    console.log(`     DOM (JSDOM)  ${fmt(domCommit.median)} ms  [${domCommit.min.toFixed(2)} – ${domCommit.max.toFixed(2)}]`);
    console.log(`     subtotal     ${fmt(total.median)} ms`);
    console.log('');
  }

  console.log('─'.repeat(110));
  console.log('');
  console.log(' ⚠️  Interpretation notes:');
  console.log('');
  console.log('   "DOM (JSDOM)" is the cost of a JSDOM innerHTML write — it reflects the');
  console.log('   JS overhead of serialising the string into a DOM tree inside JSDOM,');
  console.log('   which is far cheaper than a real browser (no style resolution, no');
  console.log('   layout, no paint).  Do not extrapolate this number to real browser cost.');
  console.log('');
  console.log('   In a real browser, DOM commit + layout + paint is measured separately');
  console.log('   by the ?perf=1 instrumentation built into the app.');
  console.log('');
  console.log(' ℹ️  Web Workers can only shift compute + format cost off the main thread.');
  console.log('    They cannot reduce DOM commit, layout, or paint cost.');
  console.log('    If compute+format << total observed browser time, the bottleneck is');
  console.log('    the DOM render pipeline — Workers would not help.');
  console.log('═'.repeat(110));
  console.log('');
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
