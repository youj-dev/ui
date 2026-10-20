import { writeFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only the scenes it imports. @youj/core stays external (it's a
 * dependency): the scenes run on its provider and tokens. */

// The tokens come from @youj/react/styles.css or @youj/core/styles.css,
// which the app already imports; this sheet only points Tailwind at the built
// scenes, so it generates the classes they use.
const STYLES = `/* @youj/illustrations: the classes the scenes use. Import it after
 * Youj's tokens, in the same stylesheet:
 *
 *   @import 'tailwindcss';
 *   @import '@youj/react/styles.css';   (or '@youj/core/styles.css')
 *   @import '@youj/illustrations/styles.css';
 */
@source './';
`

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  plugins: [useClient()],
  checks: { moduleLevelDirective: false },
  hooks: { 'build:done': () => writeFileSync('dist/styles.css', STYLES) },
})
