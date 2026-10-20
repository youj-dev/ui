import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'

/* The published build: one ESM file per source module, so the player and
 * each pack's audio stay chunks of their own (the provider imports them
 * with import()), and RSC frameworks see "use client" per module.
 * @youj/core stays external: the cue bus must be the one instance
 * the components use. The workspace resolves to src/ (package.json
 * "exports"); dist/ is only what the release publishes. */
export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  plugins: [useClient()],
  checks: { moduleLevelDirective: false },
})
