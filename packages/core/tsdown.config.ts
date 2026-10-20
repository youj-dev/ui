import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'
import { themePresets } from './scripts/theme-sheet.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only what it imports and RSC frameworks see "use client" per module.
 * The workspace keeps resolving to src/ (package.json "exports"); dist/ is only
 * what `pnpm pack` and the release publish (package.json "publishConfig"). */

// The app owns the Tailwind import (importing it twice duplicates every
// utility), so the published stylesheet leaves it out. Core has no components,
// so no @source: each component package's sheet points Tailwind at its own.
const STYLES_HEADER = `/* @youj/core: colour, ease and duration tokens, the motion presets and
 * the theme presets. Import it after Tailwind, in the same stylesheet:
 *
 *   @import 'tailwindcss';
 *   @import '@youj/core/styles.css';
 *
 * @youj/motion/styles.css and @youj/react/styles.css import it themselves,
 * so an app on either imports only that. @youj/icons/styles.css and
 * @youj/illustrations/styles.css go after whichever sheet it has.
 */
`

// The theme presets are a few contract variables each, scoped to
// [data-yj-theme='<id>'], so they ride along: data-yj-theme="terminal" on any
// element themes it with no JavaScript and no extra import. Only the presets
// that ship (scripts/theme-sheet.mjs).

function writeStyles() {
  const tokens = readFileSync('src/styles/youj.css', 'utf8').replace(/^@import 'tailwindcss';\n/m, '')
  writeFileSync('dist/styles.css', STYLES_HEADER + tokens + themePresets())
  writeFileSync('dist/presets.css', readFileSync('src/styles/presets.css', 'utf8'))
}

// One entry per language pack (@youj/core/locales/de…), each loaded only when imported.
const locales = readdirSync('src/locales').filter((f) => /^[a-z]{2}(-[A-Z]{2})?\.ts$/.test(f)).map((f) => `src/locales/${f}`)

export default defineConfig({
  entry: ['src/index.ts', 'src/internal.ts', ...locales],
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  plugins: [useClient()],
  // One output file per module keeps each "use client"; the warning is about bundling.
  checks: { moduleLevelDirective: false },
  hooks: { 'build:done': writeStyles },
})
