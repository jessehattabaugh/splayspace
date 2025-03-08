# End-to-End Tests for SplaySpace

These tests use Playwright to simulate real user interaction with the application across multiple browsers simultaneously. Tests run against the staging environment to ensure real AWS infrastructure is used instead of local shims.

## Running Tests

```bash
# Deploy to staging and run all E2E tests
npm run deploy:e2e

# Run E2E tests against an already deployed staging environment
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with debugging enabled
npm run test:e2e:debug

# View HTML report from last test run
npm run test:e2e:report
```

## Configuring Test Environment

Tests run against the staging environment by default, but can be configured for different environments:

```bash
# Test against local development server (NOT RECOMMENDED for WebSocket testing)
SPLAY_TEST_ENV=local npm run test:e2e

# Test against staging (default)
SPLAY_TEST_ENV=staging npm run test:e2e

# Test against production (use with caution)
SPLAY_TEST_ENV=production npm run test:e2e

# Test against custom URL
PLAYWRIGHT_TEST_BASE_URL=https://feature-branch.splayspace.com PLAYWRIGHT_TEST_WS_URL=wss://feature-branch.splayspace.com npm run test:e2e
```

## Understanding the Deployment Process

The `deploy:e2e` script:

1. Runs unit tests to ensure code quality
2. Deploys the application to the AWS staging environment
3. Retrieves the deployed URL and WebSocket URL
4. Runs the E2E tests against these deployed URLs

This ensures we test against real AWS infrastructure instead of local development shims that might not accurately represent production behavior.

## Test Structure

- `multi-user.spec.js`: Tests interactions between two users in the same world
- `single-player.spec.js`: Tests basic functionality for a single user

## Page Objects

We use the Page Object Model pattern to encapsulate page interactions:

- `splay-world.js`: Represents the main game world and its interactions

## Utilities

- `test-environment.js`: Utilities for managing test environments and WebSocket monitoring
