/**
 * Playwright Configuration — ERP KRAM E2E Tests
 * ─────────────────────────────────────────────────────────────
 * Configuración para pruebas E2E del frontend.
 * 
 * Requisitos:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 * 
 * Ejecución:
 *   npx playwright test --config e2e/playwright.config.js
 *   npx playwright test --config e2e/playwright.config.js --headed
 *   npx playwright show-report e2e/report
 * ─────────────────────────────────────────────────────────────
 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: 'e2e/report' }],
    ['list']
  ],
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
