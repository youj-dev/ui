import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 98, branches: 96, functions: 98, lines: 98 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
    testTimeout: 20_000,
  },
})
