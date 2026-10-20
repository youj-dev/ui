import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { shippedThemes } from '../src/lib/youj/theme/themes'
import { shippedThemeIds, themePresets } from './theme-sheet.mjs'

/* The published stylesheet carries the presets the package ships, and no others. */

test('the published sheet has a rule for every shipped preset and none for an unreleased one', () => {
  expect(shippedThemeIds()).toEqual(shippedThemes.map((t) => t.id).sort())
  const sheet = themePresets()
  const ids = [...sheet.matchAll(/\[data-yj-theme='([\w-]+)'\]/g)].map((m) => m[1])
  expect([...new Set(ids)].sort()).toEqual(shippedThemeIds())
  expect(sheet).not.toMatch(/data-yj-theme='youj'/)
})

test('the stylesheets in the folder that do not ship are exactly the internal presets', () => {
  const all = readdirSync(join(import.meta.dirname, '../src/lib/youj/theme/themes')).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4))
  expect(all.filter((id) => !shippedThemeIds().includes(id)).sort()).toEqual(['youj'])
})
