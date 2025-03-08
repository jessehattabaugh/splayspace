import { defineConfig, devices } from '@playwright/test';
import { getTestEnvironment } from './test/e2e/utils/test-environment';

/**
 * Get the test environment configuration
 */
const env = getTestEnvironment();
console.log(`Configuring Playwright to use environment: ${env.name} (${env.baseUrl})`);

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
    baseURL: env.baseUrl,
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record trace for failed tests */
    trace: 'on-first-retry',
    /* Store WebSocket URL in context */
    contextOptions: {
      webSocket: {
        url: env.wsUrl
      }
    }
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

  /* Run your local dev server before starting the tests - only for local testing */
  webServer: process.env.SPLAY_TEST_ENV === 'local' && process.env.PLAYWRIGHT_START_SERVER === 'true' ? {
    command: 'npm run start',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  } : undefined,
  
  /* We don't need global setup/teardown since we're not using a local WebSocket server */
  globalSetup: undefined,
  globalTeardown: undefined,
});
