import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an
 * app bundles only the miniatures it imports, and they all share one copy of
 * the engine (dist/engine/). The entries are the workspace exports in
 * package.json, so a ported miniature is built once it's exported there.
 * Nothing from Youj is imported: React is the only peer. */
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { exports: Record<string, string> }

export default defineConfig({
  entry: Object.values(pkg.exports),
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  plugins: [useClient()],
  checks: { moduleLevelDirective: false },
})
