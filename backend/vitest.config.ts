import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'controllers/**/*.ts',
        'services/**/*.ts',
        'middleware/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
})
