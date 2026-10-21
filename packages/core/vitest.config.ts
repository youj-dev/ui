import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Storybook docs demos (src/docs) and the tests-only helpers are in no entry or build.
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**', 'src/test-utils.tsx', 'src/docs/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 93, branches: 83, functions: 95, lines: 93 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
  },
})
