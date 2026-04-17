// DiceApp Playwright Test Suite
// Install: npm install -D @playwright/test
// Run: npx playwright test
// Run with UI: npx playwright test --ui
// Generate screenshots: npx playwright test --update-snapshots

import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

// Configuration
const testDir = dirname(fileURLToPath(import.meta.url));
const APP_URL = `file://${resolve(testDir, '../die-by-the-browser.html')}`;
const DESKTOP_VIEWPORT = {width: 1280, height: 720};
const MOBILE_VIEWPORT = {width: 400, height: 900};

async function setMockRandom(page, value) {
  await page.addInitScript((input) => {
    // Convert single value to array if needed
    const values = Array.isArray(input) ? input : [input];
    let index = 0;

    // Override the Math.random set by beforeEach
    Math.random = () => {
      const val = values[index];
      index = (index + 1) % values.length;
      return val;
    };
  }, value);

  await page.reload();
}

// Overriding Math.random to always return a predictable sequence
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let mockValues = [0.1, 0.5, 0.9];
    let index = 0;
    Math.random = () => {
      const val = mockValues[index];
      index = (index + 1) % mockValues.length;
      return val;
    };
  });
});

test.describe('DiceApp - Desktop Mode', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
  });

  test('should display desktop text input by default', async ({page}) => {
    const textInput = page.locator('#diceInput');
    const display = page.locator('#dicePseudoInput');
    const keypad = page.locator('#keypad');

    await expect(textInput).toBeVisible();
    await expect(display).not.toBeVisible();
    await expect(keypad).not.toBeVisible();
  });

  test('should accept text input and roll dice', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.click('#rollBtn');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(1);

    const formula = page.locator('.result-formula');
    await expect(formula).toHaveText('3d6');

    const total = page.locator('.result-value');
    const totalText = await total.textContent();
    const value = parseInt(totalText.replace('Total: ', ''));
    expect(value).toBeGreaterThanOrEqual(3);
    expect(value).toBeLessThanOrEqual(18);
  });

  test('should handle multiple dice rolls', async ({page}) => {
    await page.fill('#diceInput', '2d6 1d20');
    await page.click('#rollBtn');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(2);
  });

  test('should show individual roll results', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.click('#rollBtn');

    const rolls = page.locator('.result-rolls');
    await expect(rolls).toBeVisible();

    // In the grid layout the "Rolls:" label lives in the sibling .result-lbl span.
    const rollsRow = page.locator('.result-row').filter({has: rolls});
    const rowText = await rollsRow.textContent();
    expect(rowText).toContain('Rolls:');

    // Each roll is now a .roll-val span; 3d6 should produce 3 of them
    const diceCount = await rolls.locator('.roll-val').count();
    expect(diceCount).toBe(3);
  });

  test('should show error for invalid notation', async ({page}) => {
    await page.fill('#diceInput', 'invalid');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid dice notation');
  });

  test('should clear input and results', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.click('#rollBtn');
    await page.click('#clearBtn');

    const input = page.locator('#diceInput');
    await expect(input).toHaveValue('');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(0);
  });

  test('should support Enter key to roll', async ({page}) => {
    await page.fill('#diceInput', '2d8');
    await page.keyboard.press('Enter');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(1);
  });

  test('should support Escape key to clear', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.keyboard.press('Escape');

    const input = page.locator('#diceInput');
    await expect(input).toHaveValue('');
  });

  test('should update URL hash on roll', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.click('#rollBtn');

    const url = page.url();
    expect(url).toContain('#dice=3d6');
  });

  test('should load dice from URL hash', async ({page}) => {
    await page.goto(`${APP_URL}#dice=2d10`);

    const input = page.locator('#diceInput');
    await expect(input).toHaveValue('2d10');
  });

  test('should match desktop visual snapshot', async ({page}) => {
    await page.fill('#diceInput', '3d6 2d8');
    await page.click('#rollBtn');

    await expect(page).toHaveScreenshot('desktop-with-results.png', { fullPage: true });
  });
});

test.describe('DiceApp - Mobile Mode', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_URL);
  });

  test('should display keypad by default on mobile', async ({page}) => {
    const textInput = page.locator('#diceInput');
    const display = page.locator('#dicePseudoInput');
    const keypad = page.locator('#keypad');

    await expect(textInput).not.toBeVisible();
    await expect(display).toBeVisible();
    await expect(keypad).toBeVisible();
  });

  test('should show placeholder in empty display', async ({page}) => {
    const display = page.locator('#dicePseudoInput');
    await expect(display).toHaveClass(/empty/);
  });

  test('should input numbers via keypad', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('3d6');
  });

  test('should show cursor in display', async ({page}) => {
    await page.click('button[data-value="3"]');

    const cursor = page.locator('.cursor');
    await expect(cursor).toBeVisible();
  });

  test('should handle space button', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-value=" "]');
    await page.click('button[data-value="2"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="8"]');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('3d6 2d8');
  });

  test('should handle backspace button', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-action="Backspace"]');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('3d');
  });

  test('should handle arrow navigation', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');

    // Move cursor left
    await page.click('button[data-action="ArrowLeft"]');
    await page.click('button[data-action="ArrowLeft"]');

    // Insert in middle
    await page.click('button[data-value="0"]');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('30d6');
  });

  test('should roll dice from keypad input', async ({page}) => {
    await page.click('button[data-value="2"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="1"]');
    await page.click('button[data-value="0"]');
    await page.click('#rollBtn');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(1);

    const formula = page.locator('.result-formula');
    await expect(formula).toHaveText('2d10');
  });

  test('should support physical keyboard in keypad mode', async ({page}) => {
    await page.keyboard.type('4d12');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('4d12');
  });

  test('should handle physical keyboard arrows', async ({page}) => {
    await page.keyboard.type('3d6');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('0');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('30d6');
  });

  test('should handle physical keyboard backspace', async ({page}) => {
    await page.keyboard.type('3d66');
    await page.keyboard.press('Backspace');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('3d6');
  });

  test('should not intercept Alt+D browser shortcut', async ({page}) => {
    await page.keyboard.type('3d6');

    // This should NOT insert 'd' because Alt is pressed
    await page.keyboard.press('Alt+d');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).not.toContain('3d6d');
  });

  test('should match mobile visual snapshot', async ({page}) => {
    await page.click('button[data-value="2"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('#rollBtn');

    await expect(page).toHaveScreenshot('mobile-with-results.png', { fullPage: true });
  });
});

test.describe('DiceApp - Mode Switching', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
  });

  test('should open hamburger menu', async ({page}) => {
    await page.click('#hamburger');

    const menu = page.locator('#menu');
    await expect(menu).toHaveClass(/active/);
  });

  test('should switch to keypad mode', async ({page}) => {
    await page.click('#hamburger');
    await page.click('[data-mode="keypad"]');

    const keypad = page.locator('#keypad');
    await expect(keypad).toBeVisible();

    const textInput = page.locator('#diceInput');
    await expect(textInput).not.toBeVisible();
  });

  test('should switch to keyboard mode', async ({page}) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_URL);

    await page.click('#hamburger');
    await page.click('[data-mode="keyboard"]');

    const textInput = page.locator('#diceInput');
    await expect(textInput).toBeVisible();

    const keypad = page.locator('#keypad');
    await expect(keypad).not.toBeVisible();
  });

  test('should show checkmark on active mode', async ({page}) => {
    await page.click('#hamburger');

    const autoItem = page.locator('[data-mode="auto"]');
    await expect(autoItem).toHaveClass(/active/);

    const autoCheck = autoItem.locator('.menu-check');
    await expect(autoCheck).toBeVisible();
  });

  test('should preserve input when switching modes', async ({page}) => {
    await page.fill('#diceInput', '3d6 2d8');

    await page.click('#hamburger');
    await page.click('[data-mode="keypad"]');

    const display = page.locator('#dicePseudoInput');
    const text = await display.textContent();
    expect(text).toContain('3d6 2d8');
  });

  test('should close menu when clicking outside', async ({page}) => {
    await page.click('#hamburger');
    await page.click('body', {position: {x: 10, y: 10}});

    const menu = page.locator('#menu');
    await expect(menu).not.toHaveClass(/active/);
  });

  test('should persist mode preference across reload', async ({page}) => {
    await page.click('#hamburger');
    await page.click('[data-mode="keypad"]');
    await page.reload();

    const keypad = page.locator('#keypad');
    await expect(keypad).toBeVisible();
    await expect(page.locator('#diceInput')).not.toBeVisible();
  });

  test('should toggle fit-to-width body class', async ({page}) => {
    await page.click('#hamburger');
    await page.click('[data-setting="fit-to-width"]');
    await expect(page.locator('body')).toHaveClass(/fit-to-width/);
  });

  test('should persist fit-to-width preference across reload', async ({page}) => {
    await page.click('#hamburger');
    await page.click('[data-setting="fit-to-width"]');
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/fit-to-width/);
  });
});

test.describe('DiceApp - Advanced Mechanics (PRD #2)', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
  });

  test('should render exploding dice with ! notation', async ({page}) => {
    await page.fill('#diceInput', '3d6!');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('3d6!');
    await expect(page.locator('.roll-chunk.die-explode-standard')).toHaveCount(2);
  });

  test('should render exploding dice styling in aggregated mode', async ({page}) => {
    // The suite-level beforeEach mock sequence is [0.1, 0.5, 0.9] repeatedly.
    // For 3d6! this yields rolls 1,4,6 and an explosion bonus 1, so standard explode
    // expansion shows [1,4,6,1], with 2 chunks carrying the explode class.
    await page.fill('#diceInput', '3d6! -1-0');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('3d6! -1-0');
    await expect(page.locator('.result-math')).toBeVisible();
    await expect(page.locator('.result-rolls .roll-chunk')).toHaveCount(4);
    await expect(page.locator('.roll-chunk.die-explode-standard')).toHaveCount(2);
  });

  test('should render compound exploding dice with !! notation', async ({page}) => {
    await setMockRandom(page, [0.05, 0.99, 0.05]);
    await page.fill('#diceInput', '2d12!!');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('2d12!!');
    await expect(page.locator('.roll-chunk.die-explode-compound')).toHaveCount(1);
    // await expect(page.locator('.result-rolls .raw-text')).toContainText(['2', '15']);
    await expect(page.locator('.roll-val')).toHaveText(['1', '13']);
  });

  test('should handle multiple chained compound explosions', async ({ page }) => {
    // Sequence:
    // 0.1  -> 2 (Die 1)
    // 0.99 -> 12 (Die 2, Explodes!!)
    // 0.99 -> 12 (Bonus 1, Explodes!!)
    // 0.1  -> 2 (Bonus 2, Stops)
    // Total for Die 2: 12 + 12 + 2 = 26
    await setMockRandom(page, [0.1, 0.99, 0.99, 0.1]);

    await page.goto(APP_URL);
    await page.fill('#diceInput', '2d12!!');
    await page.click('#rollBtn');

    // Verify the compound result is summed into a single '26'
    await expect(page.locator('.roll-val')).toHaveText(['2', '26']);

    // Verify only one die is marked as a compound explosion
    await expect(page.locator('.die-explode-compound')).toHaveCount(1);
  });

  test('should handle multiple chained compound explosions then one regular', async ({page}) => {
    /*
      * Rolling Logic Trace (Breadth-First):
      * 1. [0.1]  -> Die 1 (Base)      -> 2
      * 2. [0.99] -> Die 2 (Base)      -> 12 (Triggers !! explosion)
      * 3. [0.1]  -> Die 3 (Base)      -> 2
      * 4. [0.99] -> Die 2 (Bonus 1)   -> +12 (Triggers !! again)
      * 5. [0.1]  -> Die 2 (Bonus 2)   -> +2 (Stops)
      * Result for Die 2: 12 + 12 + 2 = 26
      */
    await setMockRandom(page, [0.1, 0.99, 0.1, 0.99, 0.1]);

    await page.goto(APP_URL);
    await page.fill('#diceInput', '3d12!!');
    await page.click('#rollBtn');

    // Verify the compound result is summed into a single '26'
    await expect(page.locator('.roll-val')).toHaveText(['2', '26', '2']);

    // Verify only one die is marked as a compound explosion
    await expect(page.locator('.die-explode-compound')).toHaveCount(1);
  })

  test('should handle multiple dice exploding simultaneously', async ({page}) => {
    /*
     * Rolling Logic Trace (Breadth-First):
     * 1. [0.99] -> Die 1 (Base)    -> 12 (Triggers !! explosion)
     * 2. [0.99] -> Die 2 (Base)    -> 12 (Triggers !! explosion)
     * 3. [0.1]  -> Die 1 (Bonus)   -> +2 (Stops)
     * 4. [0.5]  -> Die 2 (Bonus)   -> +7 (Stops)
     * Result Die 1: 12 + 2 = 14
     * Result Die 2: 12 + 7 = 19
     */
    await setMockRandom(page, [0.99, 0.99, 0.1, 0.5]);

    await page.goto(APP_URL);
    await page.fill('#diceInput', '2d12!!');
    await page.click('#rollBtn');

    // Verify both dice are summed correctly
    await expect(page.locator('.roll-val')).toHaveText(['14', '19']);

    // Verify both are marked as compound explosions
    await expect(page.locator('.die-explode-compound')).toHaveCount(2);
  });

  test('should render keep-high filter', async ({page}) => {
    await page.fill('#diceInput', '2d20++1');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('2d20++1');
    await expect(page.locator('.die-dropped')).toHaveCount(1);
  });

  test('should render drop-low filter', async ({page}) => {
    await page.fill('#diceInput', '4d6--1');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('4d6--1');
    await expect(page.locator('.die-dropped')).toHaveCount(1);
  });

  test('should keep one dropped die and one kept die visibly distinct', async ({page}) => {
    await setMockRandom(page, [0.1, 0.9]);
    await page.fill('#diceInput', '2d20++1');
    await page.click('#rollBtn');

    await expect(page.locator('.die-dropped')).toHaveCount(1);
    const keptDieCellCount = await page.locator('.result-rolls .die-cell:not(.die-dropped)').count();
    const keptRollChunkCount = await page.locator('.result-rolls .roll-chunk:not(.die-dropped)').count();
    expect(keptDieCellCount + keptRollChunkCount).toBe(1);
  });

  test('should strongly de-emphasize dropped dice styling', async ({page}) => {
    await setMockRandom(page, [0.1, 0.9]);
    await page.fill('#diceInput', '2d20++1');
    await page.click('#rollBtn');

    const droppedDie = page.locator('.die-dropped').first();
    await expect(droppedDie).toBeVisible();

    const style = await droppedDie.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        opacity: computed.opacity,
        textDecorationLine: computed.textDecorationLine,
        textDecorationThickness: computed.textDecorationThickness
      };
    });

    expect(parseFloat(style.opacity)).toBeLessThanOrEqual(0.6);
    expect(style.textDecorationLine).toContain('line-through');
    expect(parseFloat(style.textDecorationThickness)).toBeGreaterThanOrEqual(2);
  });

  test('should show critical success styling on nat max', async ({page}) => {
    await setMockRandom(page, 0.999999);
    await page.fill('#diceInput', '1d20');
    await page.click('#rollBtn');
    await expect(page.locator('.roll-val.die-critical-success')).toHaveCount(1);
  });

  test('should show critical failure styling on nat 1', async ({page}) => {
    await setMockRandom(page, 0);
    await page.fill('#diceInput', '1d20');
    await page.click('#rollBtn');
    await expect(page.locator('.roll-val.die-critical-failure')).toHaveCount(1);
  });

  test('should load and roll advanced notation from URL hash', async ({page}) => {
    await page.goto(`${APP_URL}#dice=4d6--1`);
    await expect(page.locator('#diceInput')).toHaveValue('4d6--1');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('4d6--1');
    await expect(page.locator('.die-dropped')).toHaveCount(1);
  });

  test('should clear URL hash after clear', async ({page}) => {
    await page.fill('#diceInput', '3d6');
    await page.click('#rollBtn');
    await expect.poll(async () => new URL(page.url()).hash).toContain('dice=');
    await page.click('#clearBtn');
    await expect.poll(async () => new URL(page.url()).hash).toBe('');
  });

  test('should roll multiple collections loaded from URL hash', async ({page}) => {
    await page.goto(`${APP_URL}#dice=3d6%202d8`);
    await page.click('#rollBtn');
    await expect(page.locator('.result-item')).toHaveCount(2);
  });

  test('should render distributed floor formatting with indicators', async ({page}) => {
    await setMockRandom(page, 0); // all rolls become 1
    await page.fill('#diceInput', '3d4-3-1');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('3d4-3-1');
    await expect(page.locator('.die-clamp-floor')).toHaveCount(3);
    await expect(page.locator('.result-rolls .die-raw')).toContainText(['-3', '-3', '-3']);
    await expect(page.locator('.die-raw').first()).toHaveText('=1-3');
    await expect(page.locator('.die-raw').nth(1)).toHaveText('=1-3');
    await expect(page.locator('.die-raw').nth(2)).toHaveText('=1-3');
  });

  test('should render distributed ceiling formatting with indicators', async ({page}) => {
    await setMockRandom(page, 0.999999); // all rolls become max
    await page.fill('#diceInput', '3d4+5+7');
    await page.click('#rollBtn');
    await expect(page.locator('.result-formula')).toHaveText('3d4+5+7');
    await expect(page.locator('.die-clamp-ceiling')).toHaveCount(3);
    await expect(page.locator('.result-rolls .die-raw')).toContainText(['+5', '+5', '+5']);
    await expect(page.locator('.die-raw').first()).toHaveText('=4+5');
    await expect(page.locator('.die-raw').nth(1)).toHaveText('=4+5');
    await expect(page.locator('.die-raw').nth(2)).toHaveText('=4+5');
  });

  test('should render aggregated math row and range labels', async ({page}) => {
    await page.fill('#diceInput', '3d4 -5-0');
    await page.click('#rollBtn');
    await expect(page.locator('.result-math')).toBeVisible();
    await expect(page.locator('.result-range')).toContainText('(Abs)');
    await expect(page.locator('.result-range')).toContainText('(Mod)');
    await expect(page.locator('.result-range')).toContainText('(Limit)');
  });
});

test.describe('DiceApp - Visual Regression', () => {

  test('empty state - desktop', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    await expect(page).toHaveScreenshot('empty-desktop.png', { fullPage: true });
  });

  test('wrapped textarea state - desktop', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);

    const input = page.locator('#diceInput');

    const beforeBox = await input.boundingBox();
    expect(beforeBox).not.toBeNull();

    await input.fill('100d100 '.repeat(100));
    await page.evaluate(() => new Promise(requestAnimationFrame));

    const afterBox = await input.boundingBox();
    expect(afterBox).not.toBeNull();
    expect(afterBox.height).toBeGreaterThan(beforeBox.height);

    await expect(page).toHaveScreenshot('wrapped-textarea-desktop.png', {fullPage: true});
  });

  test('empty state - mobile', async ({page}) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_URL);
    await expect(page).toHaveScreenshot('empty-mobile.png', { fullPage: true });
  });

  test('error state', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    await page.fill('#diceInput', 'invalid');
    await page.click('#rollBtn');
    await expect(page).toHaveScreenshot('error-state.png', { fullPage: true });
  });

  test('menu open', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    await page.click('#hamburger');
    await expect(page).toHaveScreenshot('menu-open.png', { fullPage: true });
  });

  test('fit-to-width enabled', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    await page.click('#hamburger');
    await page.click('[data-setting="fit-to-width"]');
    await page.fill('#diceInput', '300d6 40d8 25d20 100d100');
    await page.click('#rollBtn');
    await expect(page).toHaveScreenshot('fit-to-width-desktop.png', { fullPage: true });
  });

  test('complex roll results', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    await page.fill('#diceInput', '3d6 2 4d8 3d20+1+17 3d100 -2-10 3d6! 3d10!! 3d6!+1+2 3d10!!++2 3d6+-1 3d6!!--2 3d6-+1');
    await page.click('#rollBtn');
    await expect(page).toHaveScreenshot('complex-results.png', { fullPage: true });
  });

  test('spinner keeps viewport at bottom when pressing Enter', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);

    const seedNotation = Array.from({length: 40}, () => '100d6').join(' ');
    await page.fill('#diceInput', seedNotation);
    await page.click('#rollBtn');
    await expect(page.locator('.result-item')).toHaveCount(40);

    const hasVerticalScroll = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    expect(hasVerticalScroll).toBe(true);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(50);

    const lastResultVisibleBefore = await page.evaluate(() => {
      const results = document.querySelectorAll('.result-item');
      const last = results.item(results.length - 1);
      if (!last) return false;
      const rect = last.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    expect(lastResultVisibleBefore).toBe(true);

    await page.evaluate(() => {
      const input = document.getElementById('diceInput');
      input.value = '5000d6';
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    // Move focus away from the textarea so Enter is handled by the global keydown handler.
    await page.locator('body').click();

    await page.keyboard.press('Enter');
    await expect(page.locator('.loading')).toBeVisible();

    const lastResultVisibleDuring = await page.evaluate(() => {
      const results = document.querySelectorAll('.result-item');
      const last = results.item(results.length - 1);
      if (!last) return false;
      const rect = last.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    expect(lastResultVisibleDuring).toBe(true);

    expect(await page.screenshot()).toMatchSnapshot('spinner-scrolled-bottom-enter.png');
  });
});

test.describe('DiceApp - Accessibility', () => {
  test('should have proper ARIA labels', async ({page}) => {
    await page.goto(APP_URL);

    const hamburger = page.locator('#hamburger');
    await expect(hamburger).toHaveAttribute('aria-label', 'Menu');
    await expect(page.locator('#diceInput')).toHaveAttribute('aria-label', 'Dice notation input');
  });

  test('should be keyboard navigable', async ({page}) => {
    await page.goto(APP_URL);

    // Tab to focus the first element (usually the hamburger or input)
    await page.keyboard.press('Tab');

    // Explicitly focus the input to be sure
    await page.focus('#diceInput');
    await page.keyboard.type('3d6');

    // Tab to the Roll button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(1);
  });

  test('should have accessible keypad button names', async ({page}) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_URL);
    await expect(page.locator('button[data-action="Backspace"]')).toHaveAttribute('aria-label', /Backspace/i);
    await expect(page.locator('button[data-action="ArrowLeft"]')).toHaveAttribute('aria-label', /left/i);
    await expect(page.locator('button[data-action="ArrowRight"]')).toHaveAttribute('aria-label', /right/i);
    await expect(page.locator('button[data-value=" "]')).toHaveAttribute('aria-label', /Space/i);
  });

  test('should return focus to hamburger after menu close', async ({page}) => {
    await page.goto(APP_URL);
    await page.click('#hamburger');
    await expect(page.locator('#menu')).toHaveClass(/active/);
    await page.click('body', {position: {x: 10, y: 10}});
    await expect(page.locator('#menu')).not.toHaveClass(/active/);
    await expect(page.locator('#hamburger')).toBeFocused();
  });

  test('should have sufficient color contrast', async ({page}) => {
    await page.goto(APP_URL);
    const accessibilityScanResults = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations, JSON.stringify(accessibilityScanResults.violations, null, 2)).toEqual([]);
  });
});

test.describe('DiceApp - Edge Cases', () => {
  test('should handle very large numbers', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '10000d100');
    await page.click('#rollBtn');

    const results = page.locator('.result-item');
    await expect(results).toHaveCount(1);

    const total = page.locator('.result-value');
    const totalText = await total.textContent();
    const value = parseInt(totalText.replace('Total: ', ''));
    expect(value).toBeGreaterThanOrEqual(100);
    // (509960-11) / ((11+51+91)x3) = 3333 [eg 10k dice]
    expect(value).toBeLessThanOrEqual(509960);
  });

  test('should handle single die', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '1d20');
    await page.click('#rollBtn');

    const rolls = page.locator('.result-rolls').locator(".roll-val");
    await expect(rolls).toHaveCount(1);
  });

  test('should reject zero dice', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '0d6');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
  });

  test('should reject zero-sided die', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '3d0');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
  });

  test('should handle rapid clicking and show final result', async ({ page }) => {
    await page.goto(APP_URL);

    // 1. Setup mock and input
    await setMockRandom(page, 0.5); // Ensure predictable results
    const input = page.locator('#diceInput');
    const rollBtn = page.locator('#rollBtn');
    await input.fill('3d6');

    // 2. Rapid-fire clicks (without waiting for individual completions)
    // We use a simple loop to fire them off quickly
    for (let i = 0; i < 5; i++) {
      await rollBtn.click();
    }

    // 3. Verify stability
    // Ensure no error messages appeared during the spamming
    const error = page.locator('.error');
    await expect(error).not.toBeVisible();

    // 4. Verify the final UI state
    const resultItem = page.locator('.result-item');

    // High-level check: Exactly one result exists
    await expect(resultItem).toHaveCount(1);

    // Detailed check: The formula is correct
    await expect(resultItem.locator('.result-formula')).toHaveText('3d6');

    // Specific data check: Total is correct for the mock
    const totalValue = resultItem.locator('.result-value');
    await expect(totalValue).toHaveText('12');
    await expect(resultItem.locator('.roll-val')).toHaveText(['4', '4', '4']);
  });

  test('should reject very large numbers (overflow count)', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '100001d100');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/Too many dice/);
  });

  test('should reject very large numbers (overflow total count)', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '100000d100 1d4');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/Too many dice/);
  });

  test('should reject very large numbers (overflow sides)', async ({page}) => {
    await page.goto(APP_URL);
    await page.fill('#diceInput', '1d1000000001');
    await page.click('#rollBtn');

    const error = page.locator('.error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/Too many sides/);
  });

  test('should handle window resize', async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);

    await page.fill('#diceInput', '3d6');

    // Resize to mobile
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Wait for the display to be visible and contain the value
    const display = page.locator('#dicePseudoInput');
    await expect(display).toBeVisible();
    await expect(display).toContainText('3d6');
  });

  test('should use keyboard on tablet with mouse', async ({page}) => {
    await page.setViewportSize({width: 800, height: 600}); // Tablet size

    // Mock as non-touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {value: 0});
    });

    await page.goto(APP_URL);

    const textInput = page.locator('#diceInput');
    await expect(textInput).toBeVisible();
  });

});

test.describe('DiceApp - Performance', () => {
  test('should load quickly despite no-cache headers', async ({page}) => {
    const startTime = Date.now();

    await page.goto(APP_URL);
    await page.waitForSelector('#diceInput', {state: 'visible'});

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000);
  });

  test('should handle multiple reloads efficiently', async ({page}) => {
    const reloadTimes = [];

    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await page.goto(APP_URL);
      await page.waitForSelector('#diceInput', {state: 'visible'});
      const loadTime = Date.now() - startTime;
      reloadTimes.push(loadTime);
    }

    const avgTime = reloadTimes.reduce((a, b) => a + b) / reloadTimes.length;
    expect(avgTime).toBeLessThan(1500);
  });

  test('should not degrade with repeated interactions', async ({page}) => {
    await page.goto(APP_URL);

    const interactionTimes = [];

    for (let i = 0; i < 10; i++) {
      const interactionStartTime = Date.now();
      await page.fill('#diceInput', `${i + 1}d6`);
      await page.click('#rollBtn');
      await page.waitForSelector('.result-item');
      const interactionDuration = Date.now() - interactionStartTime;
      interactionTimes.push(interactionDuration);
      await page.click('#clearBtn');
    }

    const avgTime = interactionTimes.reduce((a, b) => a + b) / interactionTimes.length;
    expect(avgTime).toBeLessThan(200);
  });
});

test.describe('DiceApp - Keypad Enhancements', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_URL);
  });

  test('should input operator keys via keypad', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-value="-"]');
    await page.click('button[data-value="1"]');
    await page.click('button[data-value="+"]');
    await page.click('button[data-value="2"]');
    await page.click('button[data-value="!"]');
    await expect(page.locator('#dicePseudoInput')).toContainText('3d6-1+2!');
  });

  test('should support ArrowRight keypad navigation', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-action="ArrowLeft"]');
    await page.click('button[data-action="ArrowRight"]');
    await page.click('button[data-value="0"]');
    await expect(page.locator('#dicePseudoInput')).toContainText('3d60');
  });

  test('should preserve cursor position across roll and clear semantics', async ({page}) => {
    await page.click('button[data-value="3"]');
    await page.click('button[data-value="d"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-action="ArrowLeft"]');
    await page.click('#rollBtn');
    await expect(page.locator('#dicePseudoInput')).toContainText('3d6');
    await page.click('#clearBtn');
    await expect(page.locator('#dicePseudoInput')).toHaveClass(/empty/);
  });
});
