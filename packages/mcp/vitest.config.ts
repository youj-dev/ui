import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 87, branches: 80, functions: 81, lines: 90 },
    },
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
