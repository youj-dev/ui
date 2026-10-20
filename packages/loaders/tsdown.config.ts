import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'
import { sourceEntryImports } from '../../scripts/youj-sources.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only the loaders it imports, and RSC frameworks see "use client" per
 * module. One entry per loader (`@youj/loaders/vortex`) plus the kit's: they are
 * package.json's "exports" (scripts/loaders.mjs writes the loaders' from the
 * files), so the build and the workspace never disagree on what is public.
 * The workspace keeps resolving to src/; dist/ is only what `pnpm pack` and the
 * release publish (package.json "publishConfig").
 * @youj/core stays external (a peer): the loaders run on its provider and tokens. */
const exports = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).exports as Record<string, string>
const entry = Object.values(exports).filter((file) => /\.tsx?$/.test(file))

export default defineConfig({
  entry,
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  // sourceEntryImports: `@youj/core/lib/youj/…` imports point at core's published entries.
  plugins: [sourceEntryImports(), useClient()],
  // One output file per module keeps each "use client"; the warning is about bundling.
  checks: { moduleLevelDirective: false },
})
