import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 96, branches: 82, functions: 91, lines: 98 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // The first test of a file transforms motion's whole module graph, which takes seconds on a busy machine.
    testTimeout: 20_000,
    include: ['src/**/*.test.{ts,tsx}', 'lab/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
