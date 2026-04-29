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