import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))
const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url))
const iconsSrc = fileURLToPath(new URL('../icons/src', import.meta.url))
const illustrationsSrc = fileURLToPath(new URL('../illustrations/src', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
  { find: /^@youj\/icons$/, replacement: `${iconsSrc}/index.ts` },
  { find: /^@youj\/icons\/(.*)$/, replacement: `${iconsSrc}/$1` },
  { find: /^@youj\/illustrations$/, replacement: `${illustrationsSrc}/index.ts` },
  { find: /^@youj\/illustrations\/(.*)$/, replacement: `${illustrationsSrc}/$1` },
      { find: /^@youj\/react\/(.*)$/, replacement: `${uiSrc}/$1` },
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.stories.*', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 93, branches: 85, functions: 95, lines: 95 },
    },
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // The kit renders all 511 icons with React before the first assertion.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
