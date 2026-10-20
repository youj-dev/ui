import { readFileSync } from 'node:fs'
import { DEFAULT_PRESET, shippedThemes as themes } from '@youj/core/lib/youj/theme'
import { looks } from '@youj/core/lib/youj/look'
import { BEZEL_SOURCE } from '../src/plugin/components/bezel'
import { SOURCE as BUTTON } from '../src/plugin/components/button'
import { SOURCES as DATAGRID } from '../src/plugin/components/datagrid'
import { SOURCES as DISPLAY } from '../src/plugin/components/display'
import { SOURCES as FIELDS } from '../src/plugin/components/fields'
import { SOURCES as FORMS } from '../src/plugin/components/forms'
import { SOURCES as METERS } from '../src/plugin/components/meters'
import { SOURCES as NAVIGATION } from '../src/plugin/components/navigation'
import { SOURCES as OVERLAYS } from '../src/plugin/components/overlays'
import { SOURCES as PANELS } from '../src/plugin/components/panels'
import { CATALOG_SOURCES as CATALOG } from '../src/plugin/components/catalog'

/* Drift guards. The components are drawn from their class strings; if a class
 * string changes in packages/ui, this fails and points at the component to
 * redraw. The manifest's Theme menu has to name every preset. */

const repo = new URL('../../../', import.meta.url)

describe.each([BUTTON, ...FIELDS, ...PANELS, ...FORMS, ...DISPLAY, ...OVERLAYS, ...NAVIGATION, ...DATAGRID, ...METERS, ...CATALOG, BEZEL_SOURCE].map((s) => [s.file, s] as const))('%s', (file, source) => {
  // own: files a class under a style's recipes (layer order only); what the component draws is the same.
  const code = readFileSync(new URL(file, repo), 'utf8').replaceAll('own:', '').replace(/\s+/g, ' ')
  test.each(source.classes)('still has %s', (fragment) => {
    expect(code).toContain(fragment.replace(/\s+/g, ' '))
  })
})

describe('manifest.json', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'))

  test('is a Figma design plugin with no network access, running the built bundle', () => {
    expect(manifest.editorType).toEqual(['figma'])
    expect(manifest.networkAccess).toEqual({ allowedDomains: ['none'] })
    expect(manifest.documentAccess).toBe('dynamic-page')
    expect(manifest.main).toBe('dist/code.js')
  })

  test('offers exactly the shipped presets in both modes under Theme, the default (Basalt) first', () => {
    const menu = manifest.menu.find((m: { name?: string }) => m.name === 'Theme').menu as { command: string }[]
    const ordered = [...themes].sort((a, b) => Number(b.id === DEFAULT_PRESET) - Number(a.id === DEFAULT_PRESET))
    expect(menu.map((m) => m.command)).toEqual(ordered.flatMap((t) => [`theme:${t.id}:light`, `theme:${t.id}:dark`]))
  })

  test('offers every look under Look, the default first', () => {
    const menu = manifest.menu.find((m: { name?: string }) => m.name === 'Look').menu as { name: string; command: string }[]
    expect(menu.map((m) => m.command).sort()).toEqual(looks.map((s) => `look:${s.id}`).sort())
    expect(menu[0]).toEqual({ name: 'Classic (default)', command: 'look:classic' })
  })

  test('has a relaunch button for the command the cover sets', () => {
    expect(manifest.relaunchButtons.map((b: { command: string }) => b.command)).toEqual(['build'])
  })
})
