# End-to-End Tests for SplaySpace

These tests use Playwright to simulate real user interaction with the application across multiple browsers simultaneously.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with debugging enabled
npm run test:e2e:debug

# View HTML report from last test run
npm run test:e2e:report
```

## Configuring Test Environment

Tests can be run against different environments:

```bash
# Test against local development server
SPLAY_TEST_ENV=local npm run test:e2e

# Test against staging (default)
SPLAY_TEST_ENV=staging npm run test:e2e

# Test against production
SPLAY_TEST_ENV=production npm run test:e2e

# Test against custom URL
PLAYWRIGHT_TEST_BASE_URL=https://feature-branch.splayspace.com npm run test:e2e
```

## Starting a Local Server for Testing

If you want the tests to start a local server automatically:

```bash
# Start local server for tests
PLAYWRIGHT_START_SERVER=true npm run test:e2e
```

## Test Structure

- `multi-user.spec.js`: Tests interactions between two users in the same world
- `single-player.spec.js`: Tests basic functionality for a single user

## Page Objects

We use the Page Object Model pattern to encapsulate page interactions:

- `splay-world.js`: Represents the main game world and its interactions

## Utilities

- `test-environment.js`: Utilities for managing test environments and WebSocket monitoring
