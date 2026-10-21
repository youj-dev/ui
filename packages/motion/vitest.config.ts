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
      { find: /^@\/(.*)$/, replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/$1` },
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Storybook-only helpers (imported by *.stories.* alone, in no entry or registry item) are not product code.
      exclude: [
        '**/*.test.*',
        '**/*.stories.*',
        '**/*.d.ts',
        'src/test/**',
        'src/components/youj/transitions/presets-story-kit.tsx',
        'src/components/youj/motion/story-kit.tsx',
        'src/components/youj/backgrounds/story-hero.tsx',
        'src/components/youj/effects/entrance/story-demos.tsx',
        'src/components/youj/effects/entrance/demos.fixtures.tsx',
      ],
      reporter: ['text-summary', 'json-summary'],
      // Floor: just under what the suite covered when this was set. Raise it as coverage rises.
      thresholds: { statements: 75, branches: 70, functions: 80, lines: 77 },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
  },
})
