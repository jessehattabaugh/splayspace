import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      NODE_ENV: 'test',
      AWS_REGION: 'local'
    }
  },
});
