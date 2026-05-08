The file is truncated. Let me get the JavaScript logic section specifically:This is a thorough, well-structured codebase. Let me now look at the full built-in test suite to understand what's already covered before making gap recommendations.Now I have a thorough picture of the entire codebase. Let me compile the analysis.

---

## Code Quality & Correctness Assessment

Overall the code is **impressively well-structured** for a single-file app — the namespace architecture, AST parser pipeline, dual-input sync, and built-in test harness are all solid design choices. The test suites cover the happy path comprehensively. That said, here are the specific issues and gaps I found:

---

## 🐛 Correctness Issues

### 1. CSS indentation anomaly on `#diceInput` (cosmetic but worth fixing)
`#diceInput` at line 260 has inconsistent indentation (excess leading spaces). It's functional but suggests a stray copy-paste and should be normalized.

### 2. `#diceInput:focus` border is a no-op
```css name=die-by-the-browser.html url=https://github.com/colinkershaw/die-by-the-browser/blob/main/die-by-the-browser.html#L279-L281
#diceInput:focus {
    border-color: #2AE3F3; /* same as the un-focused border — does nothing visible */
}
```
The focus style is identical to the default. Either add a meaningful differentiation (e.g. brighter glow) or remove it.

### 3. Performance test uses `performance.now()` in Node/Playwright context incorrectly
```javascript name=tests/die-by-the-browser-ui.test.js url=https://github.com/colinkershaw/die-by-the-browser/blob/main/tests/die-by-the-browser-ui.test.js#L612-L618
const startTime = performance.now(); // Node global — this works
// ... but the test is in a nested describe inside DiceApp - Edge Cases,
// not a top-level performance describe, meaning it's under the wrong suite heading
```

### 4. Performance tests are nested inside `DiceApp - Edge Cases` (structural bug)
The `test.describe('DiceApp - Performance', ...)` block is **nested inside** `test.describe('DiceApp - Edge Cases', ...)`. This means the Performance tests will be reported as edge case tests. They should be sibling `describe` blocks at the top level.

### 5. `should handle single die` — fragile text parsing
```javascript name=tests/die-by-the-browser-ui.test.js url=https://github.com/colinkershaw/die-by-the-browser/blob/main/tests/die-by-the-browser-ui.test.js#L480-L487
const rollsText = await rolls.textContent();
const numbers = rollsText.replace('Rolls:', '').trim().split(' ');
expect(numbers).toHaveLength(1);
```
`.textContent()` on `.result-rolls` now includes `.roll-val` spans and whitespace from the flex layout. The split on `' '` will produce empty strings for leading/trailing whitespace and give a length > 1 for a single die. Should use `.locator('.roll-val').count()` instead (matching the pattern already used in the rolls test above it).

### 6. `should have sufficient color contrast` test is a stub
```javascript name=tests/die-by-the-browser-ui.test.js url=https://github.com/colinkershaw/die-by-the-browser/blob/main/tests/die-by-the-browser-ui.test.js#L442-L453
const accessibilityScanResults = await page.evaluate(() => {
  // This would use axe-core if installed
  return true; // always passes — meaningless
});
```
This always passes and provides zero value. Either wire up `@axe-core/playwright` or remove it and document it as a future task.

### 7. `should handle rapid clicking` — assertion is likely wrong
The test clicks Roll three times rapidly and then asserts `.result-item` count is **exactly 1**, but depending on click timing, all three clicks may land and produce 3 results. The PRD has no concept of debouncing Roll. The test's intent (resilience to rapid clicking) needs clarification.

---

## 🧪 Missing Unit Tests (for `DiceApp.tests` built-in suite)

### Parser — uncovered notation variants

| Gap | Example to test |
|-----|----------------|
| Batching parse — `batchCount` propagated correctly | `"3 3d6"` → `batchCount === 3` |
| Batching + aggregated modifier | `"2 3d4 -2-0"` → `batchCount===2`, `modifierMode==='aggregated'` |
| Batching + distributed modifier | `"2 3d4-2-0"` → `batchCount===2`, `modifierMode==='distributed'` |
| Explode notation `!Y` threshold parsed | `"2d6!4"` → `explodeThreshold === 4` |
| Compound explode `!!` parsed | `"3d6!!"` → `explodeMode==='compound'`, `explodeThreshold===6` |
| Filter keep-high | `"4d6++3"` → `filterAction==='keep'`, `filterDirection==='high'`, `filterCount===3` |
| Filter keep-low | `"2d20+-1"` → `filterAction==='keep'`, `filterDirection==='low'` |
| Filter drop-high | `"4d6-+1"` → `filterAction==='drop'`, `filterDirection==='high'` |
| Filter drop-low | `"4d6--1"` → `filterAction==='drop'`, `filterDirection==='low'` |
| Symmetry rule violation | `"3d6+5-1"` → `error !== null` |
| Explode threshold too low (< 2) | `"1d6!1"` → `error === 'INVALID_EXPLODE_THRESHOLD'` |
| Explode threshold > sides | `"1d6!7"` → `error === 'INVALID_EXPLODE_THRESHOLD'` |
| Empty string input | `""` → `error === 'INVALID_FORMAT'` |
| Whitespace-only input | `"   "` → `error === 'INVALID_FORMAT'` |
| Case insensitive `D` | `"3D6"` → parses successfully |
| Multiple collections | `"3d6 2d10"` → `collections.length === 2` |
| Batch count of zero | `"0 3d6"` → `error !== null` |

### `computeResult` — uncovered engine paths

| Gap | Description |
|-----|-------------|
| Standard explosion `!` — chain > 1 | Verify bonus dice are appended to `rollDetails` and `kept===true` for both the trigger and bonus die |
| Compound explosion `!!` — `didExplode` flag | Verify `didExplode===true` when chain.length > 1, `false` when not |
| Explosion cap at 20 iterations | Test with deterministic roller always returning `sides` — verify chain is capped and total is `sides * 20` |
| Filter + explosion interaction | Ensure explosion happens before filter, and dropped exploded dice are `kept===false` |
| Filter count >= dice count | `filterAction=keep, filterCount=4` on `4d6` → all kept |
| `modifierMode === 'none'` range check | `result.min` and `result.max` match `count` and `count * sides` |
| Distributed + floor at exactly die minimum | `1d6-5-1` rolling 1 → `1-5=-4`, clamped to `1` with `indicator==='*'` |
| Aggregated with no clamping fires no indicator | `3d6 +0` → `indicator === ''` |
| Mixed keep + modifier | `4d6--1 +2` (drop low, then aggregate +2) — verify total |

### `buildFormula` — uncovered cases

| Gap | Example |
|-----|---------|
| Explode standard | Should produce `2d6!` |
| Explode standard with threshold | Should produce `2d6!4` |
| Explode compound | Should produce `2d6!!` |
| Filter keep-high | `4d6++3` |
| Filter drop-low | `4d6--1` |
| Batched formula | `3 3d6` |

---

## 🧪 Missing Playwright UI Tests

### Advanced notation — PRD #2 features have **zero UI test coverage**

```javascript
// Suggested additions to die-by-the-browser-ui.test.js

test.describe('DiceApp - Advanced Mechanics (PRD #2)', () => {

  test('should render exploding dice with ! notation', async ({page}) => {
    await page.fill('#diceInput', '3d6!');
    await page.click('#rollBtn');
    const formula = page.locator('.result-formula');
    await expect(formula).toHaveText('3d6!');
    // Glow class present on at least the triggering die
  });

  test('should render compound exploding dice with !! notation', async ({page}) => {
    await page.fill('#diceInput', '2d6!!');
    await page.click('#rollBtn');
    const formula = page.locator('.result-formula');
    await expect(formula).toHaveText('2d6!!');
  });

  test('should render keep-high filter (D&D Advantage)', async ({page}) => {
    await page.fill('#diceInput', '2d20++1');
    await page.click('#rollBtn');
    const formula = page.locator('.result-formula');
    await expect(formula).toHaveText('2d20++1');
    // Verify one die has strikethrough (dropped)
    const dropped = page.locator('.die-dropped');
    await expect(dropped).toHaveCount(1);
  });

  test('should render drop-low filter (D&D stat roll)', async ({page}) => {
    await page.fill('#diceInput', '4d6--1');
    await page.click('#rollBtn');
    const dropped = page.locator('.die-dropped');
    await expect(dropped).toHaveCount(1);
    const rolls = page.locator('.result-rolls');
    await expect(rolls).toBeVisible();
  });

  test('should show critical success styling on nat max', async ({page}) => {
    // Mock Math.random to always return max (0.999...)
    // Then verify .die-critical-success is present
  });

  test('should show critical failure styling on nat 1', async ({page}) => {
    // Mock Math.random to always return 0
    // Then verify .die-critical-failure is present
  });
});
```

### URL / state persistence — partially covered but missing

| Gap | Reason it matters |
|-----|------------------|
| URL hash with advanced notation (`#dice=4d6--1`) loads correctly | Deep-link is a key feature (README calls it out) |
| URL hash cleared after Clear | Covered in unit tests but not Playwright |
| Multiple collections from URL hash | `#dice=3d6+2d8` → two result items |

### Distributed modifier display — zero Playwright coverage

| Gap |
|-----|
| `3d4-3-1` → each die shows `[raw-modifier]` format and `*` floor indicators |
| `3d4+5+7` → `^` ceiling indicators visible per die |
| Aggregated `3d4 -5-0` → Math row visible with `(` sum `)` `+/-M` `=` total |
| Range labels `(Abs)`, `(Mod)`, `(Limit)` visible when applicable |

### Keypad — missing coverage

| Gap |
|-----|
| Operator keys (`-`, `+`, `!`) insert correct characters |
| `!` key enables exploding dice notation via keypad |
| `ArrowRight` key moves cursor right correctly |
| Cursor position survives roll and clear |
| Home/End key behaviour (if supported) |

### Mode persistence

| Gap |
|-----|
| Mode preference persisted to `localStorage` and restored on reload (if implemented) |
| `fit-to-width` menu item toggles `body.fit-to-width` class |
| Fit-to-width visual snapshot |

### Accessibility — currently a stub

The one real accessibility test just verifies `aria-label="Menu"` on the hamburger. Missing:
- All keypad `<button>` elements have accessible names (they use icon text like `⌫` — screen readers need `aria-label`)
- `#diceInput` has a proper label association (currently uses `aria-label` attribute — worth verifying)
- Focus is trapped/returned correctly when the menu opens and closes
- Roll button is reachable via Tab from the input

---

## 📋 Code Quality Notes

| Item | Observation |
|------|-------------|
| **Commented-out CSS** | `background: conic-gradient(...)` is left commented out at line 78 — harmless but should be cleaned up |
| **`Math.random` mock sequence** | The Playwright mock `[0.1, 0.5, 0.9]` cycles, but the expected dice values in tests that use `parseInt(totalText)` don't verify the exact mocked outcome — they just check range bounds. With a known sequence the tests could assert exact values, making them more deterministic |
| **`DiceApp - Performance` nesting** | Already noted above — structural mistake in the test file |
| **Unit test harness is ad-hoc** | `DiceApp.tests.run()` returns a boolean and logs to `console`. There's no granular assertion output captured for CI — consider emitting structured output (TAP format or similar) so CI can parse individual failures without reading stdout manually |
| **`waitForDiceApp` polling** | The 50ms polling loop in the unit runner is fragile; a `MutationObserver` or a `DOMContentLoaded` hook wired to resolve a Promise would be more reliable |
| **`loading` / `.spinner` CSS is defined** | But there's no corresponding HTML element for it in the visible source — the loading overlay appears to be dynamically inserted by JS (confirmed by the `isRolling` spinner test). Worth a comment or a `<!-- spinner injected dynamically by DiceApp.ui -->` in the HTML |

---

## Priority Summary

| Priority  | Item                                                                                  |
|-----------|---------------------------------------------------------------------------------------|
| 🔴 High   | Fix nested `DiceApp - Performance` inside `DiceApp - Edge Cases`                      |
| 🔴 High   | Fix `should handle single die` test (fragile `.split(' ')` on flex-layout text)       |
| 🔴 High   | Add Playwright tests for all PRD #2 advanced mechanics (explosion, filter, criticals) |
| 🟡 Medium | Add parser unit tests for batching, all filter variants, and symmetry rule violation  |
| 🟡 Medium | Add `buildFormula` unit tests for explosion and filter notations                      |
| 🟡 Medium | Replace stub accessibility test with real `@axe-core/playwright` integration          |
| 🟡 Medium | Add URL hash round-trip Playwright tests for advanced notation                        |
| 🟢 Low    | Clean up `#diceInput:focus` no-op rule and commented-out gradient                     |
| 🟢 Low    | Add `aria-label` to keypad buttons (`⌫`, `←`, `→`, `␣`) for screen readers            |