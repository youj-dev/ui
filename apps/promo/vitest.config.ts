import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const packages = fileURLToPath(new URL('../../packages', import.meta.url))

export default defineConfig({
  resolve: {
    // Mirrors remotion.config.ts: the workspace packages' source.
    alias: [
      { find: /^@youj\/core$/, replacement: `${packages}/core/src/index.ts` },
      { find: /^@youj\/motion$/, replacement: `${packages}/motion/src/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${packages}/core/src/$1` },
      { find: /^@youj\/motion\/(.*)$/, replacement: `${packages}/motion/src/$1` },
      { find: /^@youj\/react\/(.*)$/, replacement: `${packages}/ui/src/$1` },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
