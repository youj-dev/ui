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
      thresholds: { statements: 90, branches: 79, functions: 85, lines: 96 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
    testTimeout: 20_000,
  },
})
