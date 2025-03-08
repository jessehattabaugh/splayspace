import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Tests with multiple browsers need to run sequentially */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://staging.splayspace.com',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record trace for failed tests */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'user-a-chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'user-b-firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.PLAYWRIGHT_START_SERVER === 'true' ? {
    command: 'npm run start',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  } : undefined,
});
