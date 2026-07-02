import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    hookTimeout: 30000,
    testTimeout: 30000,
    include: ['tests/firestore.rules.test.ts'],
  },
});
