import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))
const motionSrc = fileURLToPath(new URL('../motion/src', import.meta.url))
const iconsSrc = fileURLToPath(new URL('../icons/src', import.meta.url))
const illustrationsSrc = fileURLToPath(new URL('../illustrations/src', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@youj\/motion$/, replacement: `${motionSrc}/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: /^@youj\/motion\/(.*)$/, replacement: `${motionSrc}/$1` },
      { find: /^@youj\/icons$/, replacement: `${iconsSrc}/index.ts` },
      { find: /^@youj\/icons\/(.*)$/, replacement: `${iconsSrc}/$1` },
      { find: /^@youj\/illustrations$/, replacement: `${illustrationsSrc}/index.ts` },
      { find: /^@youj\/illustrations\/(.*)$/, replacement: `${illustrationsSrc}/$1` },
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 86, branches: 80, functions: 84, lines: 88 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    // Interaction tests drive whole components through user-event: the longest
    // DataTable scenarios take 4s on a quiet machine, and a loaded one has been
    // seen running them 5x slower. A real hang still fails, just later.
    testTimeout: 30_000,
  },
})
