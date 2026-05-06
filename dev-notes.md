## Running Playwright Tests

Running tests:
`npx playwright test`

Running test UI:
`npx playwright test --ui`

Running a single test headless:
`npx playwright test tests/die-by-the-browser-ui.test.js -g 'viewport stays at bottom with threshold dice when pressing Enter'`

Running a single test headed:
`npx playwright test tests/die-by-the-browser-ui.test.js -g 'viewport stays at bottom with threshold dice when pressing Enter' --headed`

Running test multiple times (note: decrease workers to increase reliability):
`npx playwright test tests/die-by-the-browser-ui.test.js -g "shows spinner during heavy roll and hides when complete" --repeat-each=20 --workers=4 --retries=0`

---

## Performance Benchmarking

### Overview

The roll pipeline has four measurable phases:

| Phase | What it does | Where measured |
|---|---|---|
| **parse** | Tokenise + validate notation string | Anywhere (pure JS) |
| **compute** | Math.random loops + result object construction | Anywhere (pure JS) |
| **format** | HTML string assembly — `map().join()` loops | Anywhere (pure JS) |
| **DOM commit** | `innerHTML` parse + node allocation + style | Browser only |
| **paint-adjacent** | Layout + paint latency (2×rAF gap) | Browser only |

The first three phases can be measured in Node.js via the benchmark script. The last two
require a real browser layout engine; they are measured via the built-in `DiceApp.perf`
instrumentation.

---

### Node.js benchmark (parse + compute + format)

```
node benchmarks/roll-benchmarks.js
```

Optional flags:
```
node benchmarks/roll-benchmarks.js --runs 20 --warmup 5
```

The script loads the app in JSDOM (same environment as the unit tests), runs 7 representative
stress scenarios, and prints a phase-breakdown table.  It uses the app's own `DiceApp.perf`
marks to separate the HTML string generation phase from the JSDOM innerHTML write.

**Note:** JSDOM's `innerHTML` write is orders of magnitude cheaper than a real browser's DOM
commit.  The "DOM (JSDOM)" column in the output is useful for comparing relative scenario sizes
but should **not** be extrapolated to real browser DOM commit cost.

#### Representative results (Node.js 22, Apple M2)

```
Scenario                                    parse  compute   format  DOM(JSDOM)  subtotal
Small simple roll (10d6)                     0.02     0.04     0.01        3.68      3.74
Large simple roll (10000d6)                  0.07     1.88     3.89      828.95    833.18
Large decorated roll (1000d20+5)             0.05     0.34     0.71      207.92    210.43
Explosion-heavy roll (500d6!!)               0.01     0.21     0.11       39.49     39.76
Filter + modifier combo (200d20++10+3)       0.02     0.20     0.20       38.26     38.92
Complex batch (50d6 50d6-2 50d20!!)          0.02     0.05     0.08       16.18     16.32
Max-stress decorated (5000d20+1)             0.03     2.45     4.61     1084.44   1090.47
```

**Key finding:** across all scenarios, `parse + compute + format` (all three phases that Web
Workers could theoretically offload) total **< 8 ms**.  The JSDOM innerHTML write dominates
the benchmark, and in a real browser the DOM commit + layout + paint will be even heavier.

---

### Browser instrumentation (all 5 phases, including DOM commit + paint)

`DiceApp.perf` is a developer-only instrumentation module built into the app.  It measures
all five phases for each roll and logs a formatted breakdown to the browser DevTools console.

**Activate with URL param (persists until page reload):**
```
die-by-the-browser.html?perf=1
```

**Activate at runtime from the DevTools console:**
```js
DiceApp.perf.enable()
```

**Disable:**
```js
DiceApp.perf.disable()
```

After each roll a `console.group` like this appears:

```
🔬 Perf "5000d20+1"
  parse                          0.05 ms
  compute                        2.10 ms
  format (HTML gen)              4.80 ms
  DOM commit (innerHTML)       XXX.XX ms   ← real browser cost here
  paint-adjacent (2×rAF)       XXX.XX ms   ← layout + paint latency here
  ── subtotal (excl. paint)    XXX.XX ms
  ── total (incl. 2×rAF)       XXX.XX ms
```

**What "paint-adjacent" measures:**
The gap between the `innerHTML` write completing and the second `requestAnimationFrame`
callback firing.  This approximates layout + paint latency but is an upper bound — it
includes browser scheduling overhead and cannot observe GPU rasterisation directly.

**Raw marks (for scripted use):**
```js
DiceApp.perf.getLastMarks()
// → { parseStart, parseEnd, computeStart, computeEnd,
//     spinnerRenderStart, spinnerRenderEnd,
//     formatStart, formatEnd, domCommitStart, domCommitEnd,
//     paintAdjStart, paintAdjEnd }
```

---

### What the measurements tell us about Web Workers

- **Parse and compute are negligible** (< 3 ms even at 10 000 dice).
- **HTML string generation is fast** (< 5 ms even for 5 000 decorated dice).
- **The real cost lives in the browser's DOM pipeline** — node allocation, style resolution,
  layout, and paint — which Workers **cannot** reduce.
- Offloading string generation to a Worker would move < 5 ms off the main thread while adding
  worker pool management, message serialisation overhead, and `file://` compatibility risk.
- The conclusion is empirical: for this app's architecture (show-the-math, full per-die HTML),
  the bottleneck is rendering, not computation.  Workers are not worth the complexity.
