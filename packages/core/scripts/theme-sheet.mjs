// The theme presets in the published stylesheet (dist/styles.css): only the ones that ship.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const THEMES = join(import.meta.dirname, '../src/lib/youj/theme/themes')

/** The ids in `shippedThemes` (themes/index.ts): what the public API accepts. Iris and Linen stay out, since a `data-yj-theme` that works becomes part of the CSS contract. */
export function shippedThemeIds() {
  const list = readFileSync(join(THEMES, 'index.ts'), 'utf8').match(/export const shippedThemes = \[([^\]]+)\]/)?.[1]
  if (!list) throw new Error('theme-sheet.mjs: no shippedThemes in themes/index.ts')
  return list.split(',').map((id) => id.trim()).filter(Boolean).sort()
}

/** The shipped presets' rules, one `[data-yj-theme='<id>']` block each, after a header comment. */
export function themePresets() {
  const ids = shippedThemeIds()
  const missing = ids.filter((id) => !readdirSync(THEMES).includes(`${id}.css`))
  if (missing.length) throw new Error(`theme-sheet.mjs: ${missing.join(', ')} ship but have no stylesheet in ${THEMES}`)
  const rules = ids.map((id) => readFileSync(join(THEMES, `${id}.css`), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, ''))
  // The two layers a preset pairs, each on its own attribute (theme/layers.test.ts writes them from the TS).
  const layers = ['palettes.css', 'styles.css'].map((file) => readFileSync(join(THEMES, '..', file), 'utf8'))
  return `\n/* Theme presets: data-yj-theme="${ids.join('|')}", with data-yj-motion for the personality. */\n${rules.join('')}\n${layers.join('\n')}`
}
