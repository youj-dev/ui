import { writeFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'
import { sourceEntryImports } from '../../scripts/youj-sources.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only what it imports and RSC frameworks see "use client" per module.
 * The workspace keeps resolving to src/ (package.json "exports"); dist/ is only
 * what `pnpm pack` and the release publish (package.json "publishConfig").
 * @youj/core stays external (a peer): the components run on its provider and tokens. */

// The tokens are core's, so the sheet imports them (it resolves from this
// package's folder, where @youj/core is a peer) and points Tailwind at the
// built components, so it generates the classes they use.
const STYLES = `/* @youj/motion: core's tokens, motion presets and theme presets, and the
 * classes the motion components use. Import it after Tailwind, in the same
 * stylesheet:
 *
 *   @import 'tailwindcss';
 *   @import '@youj/motion/styles.css';
 *
 * @youj/react/styles.css imports it itself, so an app on the components
 * imports only that.
 */
@import '@youj/core/styles.css';

/* Generate the classes the built components use. */
@source './';
`

export default defineConfig({
  entry: ['src/index.ts', 'src/interactions.ts', 'src/backgrounds.ts', 'src/players.ts'],
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  // sourceEntryImports: `@youj/core/lib/youj/…` imports point at core's published entries.
  plugins: [sourceEntryImports(), useClient()],
  // One output file per module keeps each "use client"; the warning is about bundling.
  checks: { moduleLevelDirective: false },
  hooks: { 'build:done': () => writeFileSync('dist/styles.css', STYLES) },
})
