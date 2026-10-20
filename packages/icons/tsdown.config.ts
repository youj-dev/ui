import { writeFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'
import { sourceEntryImports } from '../../scripts/youj-sources.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only the icons it imports. @youj/core stays external (it's a
 * dependency): the icons run on its provider and tokens. */

// The tokens come from @youj/react/styles.css or @youj/core/styles.css,
// which the app already imports; this sheet only points Tailwind at the built
// icons, so it generates the classes they use. @youj/react/styles.css
// imports it itself.
const STYLES = `/* @youj/icons: the classes the icons use. Import it after Youj's
 * tokens, in the same stylesheet (@youj/react/styles.css already does):
 *
 *   @import 'tailwindcss';
 *   @import '@youj/core/styles.css';
 *   @import '@youj/icons/styles.css';
 */
@source './';
`

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  // sourceEntryImports: `@youj/core/lib/youj/…` imports point at core's published entries.
  plugins: [sourceEntryImports(), useClient()],
  checks: { moduleLevelDirective: false },
  hooks: { 'build:done': () => writeFileSync('dist/styles.css', STYLES) },
})
