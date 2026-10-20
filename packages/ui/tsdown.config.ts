import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import { useClient } from '../../scripts/use-client.mjs'
import { sourceEntryImports } from '../../scripts/youj-sources.mjs'

/* The published build: one ESM file and one .d.ts per source module, so an app
 * bundles only the components it imports and RSC frameworks see "use client"
 * per module. The workspace keeps resolving to src/ (package.json "exports");
 * dist/ is only what `pnpm pack` and the release publish ("publishConfig"). */

// ui.css only works compiled in the same Tailwind root as core's tokens, so
// the published stylesheet imports them itself, through motion's sheet (which
// imports core's and points Tailwind at the built motion components): one line
// after Tailwind is the whole setup. The import resolves from this package's
// folder, where @youj/motion is a peer, so it works under pnpm's strict layout.
// The components draw @youj/icons (a dependency too), so its sheet, which
// points Tailwind at the built icons, comes along the same way.
// ui.css's leading comment explains loading it in the workspace; this one
// replaces it.
const STYLES_HEADER = `/* @youj/react: core's tokens, motion presets and theme presets, then
 * the UI-only tokens and the component styles. Import it after Tailwind, in the same file:
 *
 *   @import 'tailwindcss';
 *   @import '@youj/react/styles.css';
 */
@import '@youj/motion/styles.css';
@import '@youj/icons/styles.css';
`
const STYLES_FOOTER = `
/* Generate the classes the built components use. */
@source './';
`

// The component styles (every src/styles/<id>.css but ui.css and the opt-in shadcn.css) are recipes
// scoped to [data-yj-look='<id>'], so they ride along like the theme presets,
// with no extra import: a root YoujProvider writes data-yj-look="bezel"
// (the default) itself. On the registry, each is an item of its own.
function componentStyles() {
  const files = readdirSync('src/styles').filter((f) => f.endsWith('.css') && f !== 'ui.css' && f !== 'shadcn.css').sort()
  if (!files.length) return ''
  const ids = files.map((f) => f.replace(/\.css$/, ''))
  const rules = files.map((f) => readFileSync(`src/styles/${f}`, 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, ''))
  return `\n/* Component styles: data-yj-look="${ids.join('|')}", which YoujProvider's look prop sets. */\n${rules.join('')}`
}

function writeStyles() {
  const ui = readFileSync('src/styles/ui.css', 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '')
  writeFileSync('dist/styles.css', STYLES_HEADER + ui + componentStyles() + STYLES_FOOTER)
  // The shadcn compat sheet is opt-in: @youj/react/shadcn.css, imported beside styles.css.
  copyFileSync('src/styles/shadcn.css', 'dist/shadcn.css')
}

// The main entry and one per optional-peer group (@youj/react/chart…), as scripts/generate.mjs lists them.
const entries = Object.values(JSON.parse(readFileSync('entries.json', 'utf8')) as Record<string, { file: string }>).map((e) => e.file)

export default defineConfig({
  entry: entries,
  platform: 'neutral',
  target: 'es2022',
  unbundle: true,
  dts: true,
  // sourceEntryImports: source-path imports of core, motion and icons point at their published entries.
  plugins: [sourceEntryImports(), useClient()],
  // One output file per module keeps each "use client"; the warning is about bundling.
  checks: { moduleLevelDirective: false },
  hooks: { 'build:done': writeStyles },
})
