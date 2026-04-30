import {test, expect} from '@playwright/test';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

const testDir = dirname(fileURLToPath(import.meta.url));
const APP_URL = `file://${resolve(testDir, '../die-by-the-browser.html')}`;
const DESKTOP_VIEWPORT = {width: 1280, height: 720};

// With SETTIMEOUT in HTML: test various warm-up sizes
test('SETTIMEOUT: warm-up sizing search', async ({page}) => {
  for (const warmupInput of ['1d6', '50d6', '100d6', '200d6', '500d6']) {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_URL);
    const loading = page.locator('.loading');

    await page.fill('#diceInput', warmupInput);
    await page.click('#rollBtn');
    await expect(loading).toBeHidden({timeout: 30000});

    await page.fill('#diceInput', '90000d20+5+23');
    const t0 = Date.now();
    await page.click('#rollBtn');
    const clickMs = Date.now() - t0;
    const isVisible = await loading.isVisible();
    const total = Date.now() - t0;
    console.log(`[ST warmup=${warmupInput}] click: ${clickMs}ms, visible: ${isVisible}, total: ${total}ms`);
    await expect(loading).toBeHidden({timeout: 60000});
  }
});
