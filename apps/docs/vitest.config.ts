import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { workspacePackages } from './lib/workspace-packages.mjs'

const app = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors tsconfig paths.
    alias: [
      // The workspace packages, from the app's dependencies (lib/workspace-packages.mjs): subpaths to their source.
      ...workspacePackages().flatMap(({ name, src, aliasSubpaths }) => {
        const escaped = name.replace('/', '\\/')
        return aliasSubpaths ? [{ find: new RegExp(`^${escaped}\\/(.*)$`), replacement: `${src}/$1` }] : []
      }),
      { find: /^@\/(.*)$/, replacement: `${app}$1` },
    ],
  },
  test: {
    globals: true,
    // Whole-page tests (the explorers, the header's menus) import lazy chunks; a loaded machine runs them several times slower.
    testTimeout: 30_000,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', '.source/**', 'out/**', '.wrangler/**', '.cloudflare/**'],
  },
})
