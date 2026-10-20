import { runInNewContext } from 'node:vm'
import { bundlePlugin } from '../scripts/bundle'
import { buildKit } from '../src/data/build-kit'
import type { Kit } from '../src/kit'
import { KEY } from '../src/plugin/store'
import { run } from '../src/plugin/run'
import { CATALOG } from '../src/plugin/components/catalog'
import { allNodes, createFakeFigma, DEFAULT_FONTS, installFakeFigma, type FakeEnv, type FakeNode, type FakeTextStyle } from './fake-figma'

/* The whole plugin against the fake: every page, variable, style, icon and
 * component, then again to prove a re-run updates in place. */

const kit: Kit = buildKit()

/** Every component set the Components page makes. */
const COMPONENT_KEYS = [
  'button', 'toggle', 'toggle-group', 'input', 'textarea', 'select', 'field', 'checkbox', 'radio', 'radio-group', 'switch', 'slider', 'progress',
  'badge', 'avatar', 'kbd', 'separator', 'skeleton', 'alert', 'banner', 'tooltip', 'popover', 'menu-item', 'dropdown-menu', 'dialog', 'toast', 'card',
  'tabs-trigger', 'tabs', 'table-row', 'pagination-link', 'pagination', 'breadcrumb', 'sidebar-item',
  'gauge', 'segmented-meter', 'limit-meter', 'share-bar', 'treemap', 'histogram-range', 'filter-chips', 'data-grid',
  ...CATALOG.map((e) => e.doc.key.replace('component:', '')),
]

const within = (n: FakeNode, root: FakeNode | undefined) => {
  for (let p: FakeNode | null = n; p; p = p.parent) if (p === root) return true
  return false
}
/** Node counts by type, leaving out a subtree (your own page). */
const census = (env: FakeEnv, except?: FakeNode) =>
  allNodes(env)
    .filter((n) => !within(n, except))
    .reduce<Record<string, number>>((m, n) => ((m[n.type] = (m[n.type] ?? 0) + 1), m), {})
const byKey = (env: FakeEnv, key: string) => allNodes(env).find((n) => n.getPluginData(KEY) === key)

describe('a file with modes (Professional)', () => {
  let env: FakeEnv
  let first: Record<string, number>
  beforeAll(async () => {
    env = installFakeFigma({ modeLimit: 10 }).env
    expect(await run(kit, 'build')).toMatch(/Youj kit \w+ is ready/)
    first = census(env)
  })

  test('makes the nine pages, taking over the empty first page', () => {
    expect(env.pages.map((p) => p.name)).toEqual(['Cover', 'Colour', 'Type', 'Spacing & radius', 'Motion', 'Icons', 'Illustrations', 'Components', 'Blocks'])
  })

  test('draws the logo on the cover, no badge: each letter a vector in the ink, bound to its variable, then the tittle', () => {
    const logo = allNodes(env).find((n) => n.name === 'Youj logo')!
    const parts = logo.rawChildren()
    expect(parts.map((n) => n.name)).toEqual(['y', 'o', 'u', 'j', 'Tittle'])
    parts.slice(0, 4).forEach((l, i) => {
      expect(l.svgPath).toBe(kit.logo.letters[i]!.d)
      expect((l.fills[0] as { boundVariables?: { color?: unknown } }).boundVariables?.color).toBeDefined()
    })
    // the o's counter stays open
    expect(parts[1]!.windingRule).toBe('EVENODD')
    // the frame is the logo's box, the y flush with its start, the tittle where the grid puts it
    const scale = logo.width / kit.logo.box.width
    expect(logo.height / scale).toBeCloseTo(kit.logo.box.height, 5)
    expect(parts[0]!.x).toBeCloseTo(0, 5)
    const tittle = parts[4]!
    expect(tittle.x / tittle.width).toBeCloseTo((kit.logo.tittle.x - kit.logo.box.x) / kit.logo.tittle.size, 5)
    expect(tittle.y / tittle.height).toBeCloseTo((kit.logo.tittle.y - kit.logo.box.y) / kit.logo.tittle.size, 5)
  })


  test('makes every icon a component, and state icons sets with a State property', () => {
    const icons = allNodes(env).filter((n) => /^icon:[a-z0-9-]+$/.test(n.getPluginData(KEY)))
    expect(icons).toHaveLength(kit.icons.length)
    const menu = byKey(env, 'icon:menu')!
    expect(menu.type).toBe('COMPONENT_SET')
    expect(menu.name).toBe('Icon/navigation/menu')
    expect(menu.rawChildren().map((c) => c.name)).toEqual(['State=menu', 'State=close'])
    expect(byKey(env, 'icon:home')!.type).toBe('COMPONENT')
  })

  test('binds icon ink to a Color variable and masks knock-outs by luminance', () => {
    const bellOff = byKey(env, 'icon:bell-off')!
    const vectors = bellOff.findAll((n) => n.type === 'VECTOR')
    const ink = vectors.filter((v) => (v.strokes[0]?.boundVariables as Record<string, unknown> | undefined)?.color)
    expect(ink.length).toBeGreaterThan(0)
    const mask = bellOff.findAll((n) => n.isMask)
    expect(mask[0]!.maskType).toBe('LUMINANCE')
  })

  test('makes the components as sets, with properties and the code’s prop values', () => {
    const button = byKey(env, 'component:button')!
    expect(button.type).toBe('COMPONENT_SET')
    expect(button.rawChildren()).toHaveLength(6 * 4 * 8)
    // Figma's default variant is the top-left one: the default button.
    const topLeft = button.rawChildren().reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x) ? b : a))
    expect(topLeft.name).toBe('Variant=default, Size=default, State=rest')
    const props = Object.keys(button.componentPropertyDefinitions).map((k) => k.split('#')[0])
    expect(props).toEqual(expect.arrayContaining(['Label', 'Leading icon', 'Icon', 'Variant', 'Size', 'State']))
    for (const key of COMPONENT_KEYS) expect(byKey(env, `component:${key}`)?.type, key).toBe('COMPONENT_SET')
  })

  test('labels every variant column on one line, without labels running into each other', () => {
    const holders = allNodes(env).filter((n) => n.name.endsWith(' (labelled)'))
    expect(holders.length).toBeGreaterThan(0)
    for (const holder of holders) {
      const labels = holder
        .rawChildren()
        .filter((n) => n.type === 'TEXT' && n.y === 0 && n.characters.includes('='))
        .sort((a, b) => a.x - b.x)
      expect(labels.length, holder.name).toBeGreaterThan(0)
      for (const l of labels) expect(l.textAutoResize, `${holder.name}: ${l.characters}`).toBe('WIDTH_AND_HEIGHT')
      for (let i = 1; i < labels.length; i++) {
        const [a, b] = [labels[i - 1]!, labels[i]!]
        expect(a.x + a.width, `${holder.name}: ${a.characters} runs into ${b.characters}`).toBeLessThanOrEqual(b.x)
      }
    }
  })

  test('binds component geometry to variables: height, padding, radius', () => {
    const variant = byKey(env, 'component:button')!.rawChildren().find((c) => c.name === 'Variant=default, Size=default, State=rest')!
    expect(Object.keys(variant.boundVariables)).toEqual(expect.arrayContaining(['height', 'paddingLeft', 'paddingRight', 'topLeftRadius', 'itemSpacing']))
  })

  test('binds unchecked checkbox edges to control-edge, preserving hover and checked strokes', () => {
    const color = env.collections.find((c) => c.name === 'Color')!
    const variants = byKey(env, 'component:checkbox')!.rawChildren()
    expect(variants).toHaveLength(12)
    for (const variant of variants) {
      const on = !variant.name.includes('Checked=false')
      const name = on ? 'role/accent' : variant.name.includes('State=hover') ? 'role/fg-muted' : 'role/line-control'
      const variable = env.variables.find((v) => v.variableCollectionId === color.id && v.name === name)!
      const box = variant.rawChildren().find((n) => n.name === 'Box')!
      expect(box.strokes[0]?.boundVariables, variant.name).toEqual({ color: { type: 'VARIABLE_ALIAS', id: variable.id } })
    }
  })

  test('makes the text and effect styles', () => {
    expect(env.styles.filter((s) => s.type === 'TEXT')).toHaveLength(kit.text.length)
    expect(env.styles.filter((s) => s.type === 'EFFECT').map((s) => s.name)).toEqual(kit.effects.map((e) => e.name))
  })

  test('a second run changes nothing it doesn’t have to, and keeps your instances linked', async () => {
    const setId = byKey(env, 'component:button')!.id
    const variant = byKey(env, 'component:button')!.rawChildren()[0]!
    const iconId = byKey(env, 'icon:bell')!.id
    // Your own page, with an instance of the kit's button.
    const mine = (globalThis as unknown as { figma: { createPage(): FakeNode } }).figma.createPage()
    mine.loaded = true
    const instance = variant.createInstance()
    mine.appendChild(instance)

    await run(kit, 'build')
    expect(census(env, mine)).toEqual(first)
    expect(byKey(env, 'component:button')!.id).toBe(setId)
    expect(byKey(env, 'icon:bell')!.id).toBe(iconId)
    expect(instance.removed).toBe(false)
    expect(instance.mainComponentId).toBe(variant.id)
    expect(variant.removed).toBe(false)
    expect(env.collections).toHaveLength(4)
  })
})

describe('a Starter team file: one mode per collection, three pages', () => {
  test('folds into three pages and splits themes into collections, and says so', async () => {
    const { env } = installFakeFigma({ modeLimit: 1, pageLimit: 3 })
    await run(kit, 'build')
    expect(env.pages.map((p) => p.name)).toEqual(['Youj', 'Icons', 'Components'])
    const youj = env.pages[0]!
    expect(youj.rawChildren().map((n) => n.getPluginData(KEY))).toEqual(['sheet:cover', 'sheet:colour', 'sheet:type', 'sheet:layout', 'sheet:motion'])
    // Side by side, not stacked.
    const xs = youj.rawChildren().map((n) => n.x)
    expect(new Set(xs).size).toBe(xs.length)
    expect(env.collections.filter((c) => c.name.startsWith('Theme · '))).toHaveLength(kit.themes.length)
    const report = allNodes(env).filter((n) => n.type === 'TEXT').map((n) => n.characters).join('\n')
    expect(report).toMatch(/1 mode per collection \(Starter\)/)
    expect(report).toMatch(/Pages: 3 \(Youj, Icons, Components\)/)
  })

  test('in a file that already has your page, what doesn’t fit shares the last page that did', async () => {
    const { figma, env } = installFakeFigma({ modeLimit: 1, pageLimit: 3 })
    const yours = figma.createFrame()
    yours.name = 'Your work'
    await run(kit, 'build')
    expect(env.pages.map((p) => p.name)).toEqual(['Page 1', 'Youj', 'Icons'])
    expect(env.pages[0]!.rawChildren().map((n) => n.name)).toEqual(['Your work'])
    const icons = env.pages[2]!.rawChildren().map((n) => n.getPluginData(KEY))
    expect(icons).toEqual(['sheet:icons', 'sheet:illustrations', 'sheet:components', 'sheet:blocks'])
    const xs = env.pages[2]!.rawChildren().map((n) => n.x)
    expect(new Set(xs).size).toBe(4)
    const report = allNodes(env).filter((n) => n.type === 'TEXT').map((n) => n.characters).join('\n')
    expect(report).toMatch(/Components shares the page Icons/)
  })
})

describe('fonts', () => {
  test('sets type in Basalt’s Inter and JetBrains Mono when the file has them', async () => {
    const { env } = installFakeFigma()
    expect(await run(kit, 'build')).toMatch(/is ready\.$/)
    const families = new Set(allNodes(env).flatMap((n) => (n.type === 'TEXT' ? [n.fontName.family] : [])))
    expect([...families].sort()).toEqual(['Inter', 'JetBrains Mono', 'Youj Display'])
  })

  test('sets the Display styles in Geist when Youj Display isn’t installed, and notes it on the cover', async () => {
    const { env } = installFakeFigma({ fonts: DEFAULT_FONTS.filter((f) => f.family !== 'Youj Display') })
    expect(await run(kit, 'build')).toMatch(/1 note on the cover/)
    const notes = allNodes(env).filter((n) => n.type === 'TEXT' && n.characters.startsWith('Note:'))
    expect(notes[0]!.characters).toMatch(/Youj Display isn't available here, so display text uses Geist/)
    const display = env.styles.find((s) => s.name === 'Display/title') as FakeTextStyle
    expect(display.fontName.family).toBe('Geist')
  })

  test('falls back to another mono when JetBrains Mono isn’t installed, and notes it on the cover', async () => {
    const { env } = installFakeFigma({ fonts: [...DEFAULT_FONTS.filter((f) => f.family !== 'JetBrains Mono'), { family: 'Roboto Mono', style: 'Regular' }, { family: 'Roboto Mono', style: 'Medium' }] })
    expect(await run(kit, 'build')).toMatch(/1 note on the cover/)
    const notes = allNodes(env).filter((n) => n.type === 'TEXT' && n.characters.startsWith('Note:'))
    expect(notes[0]!.characters).toMatch(/JetBrains Mono isn't available here, so mono text uses Roboto Mono/)
  })

  test('falls back to Roboto without Inter, and to another mono without JetBrains Mono', async () => {
    const { env } = installFakeFigma({
      fonts: [...DEFAULT_FONTS.filter((f) => f.family !== 'Inter' && f.family !== 'JetBrains Mono'), { family: 'Roboto Mono', style: 'Regular' }, { family: 'Roboto Mono', style: 'Medium' }],
    })
    expect(await run(kit, 'build')).toMatch(/2 notes on the cover/)
    const notes = allNodes(env)
      .filter((n) => n.type === 'TEXT' && n.characters.startsWith('Note:'))
      .map((n) => n.characters)
    expect(notes.join('\n')).toMatch(/Inter isn't available here, so sans text uses Roboto/)
    expect(notes.join('\n')).toMatch(/JetBrains Mono isn't available here, so mono text uses Roboto Mono/)
  })
})

describe('the Look', () => {
  const colorVar = (env: FakeEnv, name: string) => env.variables.find((v) => v.name === name && env.collections.find((c) => c.id === v.variableCollectionId)?.name === 'Color')!
  const themeVar = (env: FakeEnv, name: string) => env.variables.find((v) => v.name === name && env.collections.find((c) => c.id === v.variableCollectionId)?.name === 'Theme')!
  const variant = (env: FakeEnv, set: string, name: string) => byKey(env, `component:${set}`)!.rawChildren().find((c) => c.name === name)!
  const button = (env: FakeEnv) => variant(env, 'button', 'Variant=default, Size=default, State=rest')
  const input = (env: FakeEnv) => variant(env, 'input', 'State=rest, Content=value')

  test('is Classic by default, on Basalt dark: accent buttons at the control corner, outlined fields, pages opened in Basalt · Dark', async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    expect(await run(kit, 'build')).toMatch(/is ready/)
    expect(button(env).boundVariables.topLeftRadius).toEqual({ type: 'VARIABLE_ALIAS', id: themeVar(env, 'bezel/pill').id })
    expect(button(env).fills[0]!.boundVariables).toEqual({ color: { type: 'VARIABLE_ALIAS', id: colorVar(env, 'role/action').id } })
    expect(input(env).fills).toEqual([])
    const theme = env.collections.find((c) => c.name === 'Theme')!
    const color = env.collections.find((c) => c.name === 'Color')!
    const components = env.pages.find((p) => p.name === 'Components')!
    expect(theme.modes.find((m) => m.modeId === components.explicitVariableModes[theme.id])?.name).toBe('Basalt')
    expect(color.modes.find((m) => m.modeId === components.explicitVariableModes[color.id])?.name).toBe('Dark')
    expect(allNodes(env).some((n) => n.type === 'TEXT' && /^Look: Classic \(the default\)/.test(n.characters))).toBe(true)
  })

  test('on Starter, the one Color mode is Dark and Theme points at Basalt', async () => {
    const { env } = installFakeFigma({ modeLimit: 1 })
    expect(await run(kit, 'build')).toMatch(/is ready/)
    expect(env.collections.find((c) => c.name === 'Color')!.modes.map((m) => m.name)).toEqual(['Dark'])
    expect(env.collections.find((c) => c.name === 'Theme')!.modes.map((m) => m.name)).toEqual(['Basalt'])
  })

  test('Style → Bezel redraws the same sets in Bezel, in place, and Style → Classic brings Classic back', async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    await run(kit, 'build')
    const ids = new Map(COMPONENT_KEYS.map((k) => [k, byKey(env, `component:${k}`)!.id]))
    const buttonId = button(env).id
    const badge = () => Object.keys(byKey(env, 'component:badge')!.componentPropertyDefinitions).map((k) => k.split('#')[0])
    expect(badge()).not.toContain('Dot')

    expect(await run(kit, 'look:bezel')).toMatch(/is ready/)
    for (const [k, id] of ids) expect(byKey(env, `component:${k}`)!.id, k).toBe(id)
    expect(button(env).id).toBe(buttonId)
    expect(button(env).boundVariables.topLeftRadius).toEqual({ type: 'VARIABLE_ALIAS', id: themeVar(env, 'bezel/pill').id })
    expect(button(env).fills[0]!.boundVariables).toEqual({ color: { type: 'VARIABLE_ALIAS', id: colorVar(env, 'role/fg').id } })
    expect(input(env).fills[0]!.boundVariables).toEqual({ color: { type: 'VARIABLE_ALIAS', id: colorVar(env, 'role/field').id } })
    expect(badge()).toContain('Dot')

    // A build after that keeps the chosen style.
    await run(kit, 'build')
    expect(badge()).toContain('Dot')

    await run(kit, 'look:classic')
    expect(button(env).fills[0]!.boundVariables).toEqual({ color: { type: 'VARIABLE_ALIAS', id: colorVar(env, 'role/action').id } })
    expect(badge()).not.toContain('Dot')
  })

  test('rejects a style the kit doesn’t have', async () => {
    installFakeFigma()
    await expect(run(kit, 'look:neon')).rejects.toThrow(/Unknown look neon/)
  })
})

describe('the Theme command', () => {
  test('on a plan with modes, sets the current page’s Theme and Color modes', async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    await run(kit, 'build')
    const message = await run(kit, 'theme:brutal:dark')
    expect(message).toMatch(/Brutal · Dark on this page/)
    const theme = env.collections.find((c) => c.name === 'Theme')!
    const brutal = theme.modes.find((m) => m.name === 'Brutal')!.modeId
    expect(env.currentPage.explicitVariableModes[theme.id]).toBe(brutal)
  })

  test("repaints the cover's tittle the brand's colour for the mode, whatever the theme: amber in dark, blue in light", async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    await run(kit, 'build')
    const cover = env.pages.find((p) => p.name === 'Cover')!
    await (globalThis as unknown as { figma: PluginAPI }).figma.setCurrentPageAsync(cover as unknown as PageNode)
    type Solid = { color: { r: number; g: number; b: number } }
    const tittle = () => (allNodes(env).find((n) => n.name === 'Tittle')!.fills[0] as Solid).color
    const amber = ({ r, g, b }: Solid['color']) => r > 0.9 && g > 0.5 && b < 0.3
    const blue = ({ r, b }: Solid['color']) => b > 0.9 && r < 0.4
    // built in the default, Basalt dark
    expect(amber(tittle())).toBe(true)
    await run(kit, 'theme:basalt:light')
    expect(blue(tittle())).toBe(true)
    await run(kit, 'theme:graphite:dark')
    expect(amber(tittle())).toBe(true)
  })
})

describe('the bundled code.js', () => {
  test.each([
    ['Professional', { modeLimit: 10 }],
    ['Starter', { modeLimit: 1, pageLimit: 3 }],
  ])('runs end to end in a sandbox of its own (%s)', async (_, opts) => {
    const code = await bundlePlugin(kit, false)
    const { figma, env } = createFakeFigma({ ...opts, command: 'build' })
    const errors: unknown[] = []
    runInNewContext(code, { figma, console: { ...console, error: (e: unknown) => errors.push(e) }, setTimeout, clearTimeout })
    await vi.waitFor(() => expect(env.closed).toBeDefined(), { timeout: 60_000, interval: 50 })
    expect(errors).toEqual([])
    expect(env.closed).toMatch(/is ready/)
    expect(allNodes(env).filter((n) => n.type === 'COMPONENT_SET').length).toBe(kit.icons.filter((i) => i.states).length + COMPONENT_KEYS.length)
  })
})
