import { buildKit } from '../src/data/build-kit'
import type { Kit, Rgba } from '../src/kit'
import { applyTheme } from '../src/plugin/run'
import { buildVariables, limitFromError, planLayout, probeModeLimit } from '../src/plugin/variables'
import { installFakeFigma, resolveVariable, type FakeEnv } from './fake-figma'

const kit: Kit = buildKit()

/** A Color variable's value, resolved through its aliases in the given modes. */
function resolve(env: FakeEnv, name: string, modes: Record<string, string> = {}) {
  const color = env.collections.find((c) => c.name === 'Color')!
  const v = env.variables.find((x) => x.variableCollectionId === color.id && x.name === name)!
  return resolveVariable(env, v.id, modes) as Rgba
}
const raw = (name: string, mode: 'light' | 'dark', theme: string) => {
  const v = kit.colors.find((c) => c.name === name)![mode]
  if (!('values' in v)) throw new Error(`${name} is an alias`)
  return v.values[theme]!
}

describe('the plan-limit fallback', () => {
  test('lays collections out for the modes a plan allows', () => {
    expect(planLayout(1, 5, 3)).toEqual({ limit: 1, theme: 'split', color: 'single', motion: 'split' })
    expect(planLayout(2, 5, 3)).toMatchObject({ theme: 'split', color: 'modes', motion: 'split' })
    expect(planLayout(4, 5, 3)).toMatchObject({ theme: 'split', color: 'modes', motion: 'modes' })
    expect(planLayout(10, 5, 3)).toMatchObject({ theme: 'modes', color: 'modes', motion: 'modes' })
  })

  test('reads the cap from Figma’s own error', () => {
    expect(limitFromError(new Error('in addMode: Limited to 1 modes only'), 2)).toBe(1)
    expect(limitFromError(new Error('in addMode: Limited to 4 modes only'), 5)).toBe(4)
    expect(limitFromError('Upgrade your plan to add more modes', 3)).toBe(2)
    expect(limitFromError(new Error('something else'), 2)).toBeNull()
  })

  test.each([
    [1, 1],
    [4, 4],
    [10, 5],
  ])('probes a cap of %i as %i, and leaves no probe behind', async (cap, expected) => {
    const { env } = installFakeFigma({ modeLimit: cap })
    expect(await probeModeLimit(5)).toBe(expected)
    expect(env.collections).toHaveLength(0)
  })
})

describe('Professional: themes and modes are modes', () => {
  test('Theme has a mode per preset, Color has Light and Dark, and they resolve per frame', async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    const vars = await buildVariables(kit, { theme: 'graphite', mode: 'light' }, kit.themes.length)
    const byName = Object.fromEntries(env.collections.map((c) => [c.name, c]))
    expect(Object.keys(byName).sort()).toEqual(['Color', 'Motion', 'Scale', 'Theme'])
    expect(byName.Theme!.modes.map((m) => m.name)).toEqual(['Basalt', 'Graphite', 'Terminal', 'Brutal', 'Meadow', 'Sandstone', 'Cinnabar', 'Umber', 'Seaglass', 'Heather'])
    expect(byName.Color!.modes.map((m) => m.name)).toEqual(['Light', 'Dark'])
    expect(byName.Motion!.modes.map((m) => m.name)).toEqual(['Precise', 'Calm', 'Lively'])

    // A frame in Terminal · Dark sees Terminal's dark canvas through role/canvas → Theme/dark/role/canvas.
    const modes = { [vars.theme.id]: vars.themeModes!.terminal!, [vars.color.id]: vars.colorModes!.dark }
    expect(resolve(env, 'role/canvas', modes)).toEqual(raw('role/canvas', 'dark', 'terminal'))
    // Unscoped, a frame sees the first modes: Basalt (the default preset) in Light.
    expect(resolve(env, 'role/canvas')).toEqual(raw('role/canvas', 'light', 'basalt'))
  })

  test('a second run updates in place: same collections, same variables, same ids', async () => {
    const { env } = installFakeFigma({ modeLimit: 10 })
    await buildVariables(kit, { theme: 'graphite', mode: 'light' }, kit.themes.length)
    const before = env.variables.map((v) => v.id).sort()
    const second = await buildVariables(kit, { theme: 'graphite', mode: 'light' }, kit.themes.length)
    expect(env.variables.map((v) => v.id).sort()).toEqual(before)
    expect(env.collections).toHaveLength(4)
    expect(second.summary.at(-1)).toMatch(/^0 variables created/)
  })
})

describe('Starter: one mode per collection', () => {
  test('each theme is its own source collection, and Theme and Color point at the one in use', async () => {
    const { env } = installFakeFigma({ modeLimit: 1 })
    const vars = await buildVariables(kit, { theme: 'graphite', mode: 'light' }, 1)
    // In the order Figma lists them: what you bind to first, the sources after.
    expect(env.collections.map((c) => c.name)).toEqual([
      'Color',
      'Theme',
      'Theme · Basalt',
      'Theme · Graphite',
      'Theme · Terminal',
      'Theme · Brutal',
      'Theme · Meadow',
      'Theme · Sandstone',
      'Theme · Cinnabar',
      'Theme · Umber',
      'Theme · Seaglass',
      'Theme · Heather',
      'Scale',
      'Motion · Precise',
      'Motion · Calm',
      'Motion · Lively',
    ])
    for (const c of env.collections) expect(c.modes, c.name).toHaveLength(1)
    expect(resolve(env, 'role/canvas')).toEqual(raw('role/canvas', 'light', 'graphite'))
    // A swatch for another theme binds straight to that theme's source.
    expect(resolveVariable(env, vars.source('brutal', 'dark/role/accent').id)).toEqual(raw('role/accent', 'dark', 'brutal'))
    expect(vars.summary.join('\n')).toMatch(/1 mode \(Light\): the plan allows one mode per collection/)
  })

  test('Theme → Terminal · Dark re-points everything in place', async () => {
    const { env } = installFakeFigma({ modeLimit: 1 })
    await buildVariables(kit, { theme: 'graphite', mode: 'light' }, 1)
    const ids = env.variables.map((v) => v.id).sort()
    const message = await applyTheme(kit, 'terminal', 'dark')
    expect(message).toMatch(/Terminal · Dark everywhere/)
    expect(resolve(env, 'role/canvas')).toEqual(raw('role/canvas', 'dark', 'terminal'))
    expect(resolve(env, 'role/hover')).toEqual(raw('role/hover', 'dark', 'terminal'))
    expect(env.collections.find((c) => c.name === 'Color')!.modes[0]!.name).toBe('Dark')
    expect(env.variables.map((v) => v.id).sort()).toEqual(ids)
  })

  test('upgrading the plan later folds the sources into modes, without duplicates', async () => {
    const { env } = installFakeFigma({ modeLimit: 1 })
    await buildVariables(kit, { theme: 'graphite', mode: 'light' }, 1)
    env.opts.modeLimit = 10
    const vars = await buildVariables(kit, { theme: 'graphite', mode: 'light' }, kit.themes.length)
    expect(env.collections.map((c) => c.name).sort()).toEqual(['Color', 'Motion', 'Scale', 'Theme'])
    expect(vars.summary.join('\n')).toMatch(/Removed collections from an earlier layout: Theme · Basalt/)
    const names = env.variables.map((v) => `${v.variableCollectionId}/${v.name}`)
    expect(new Set(names).size).toBe(names.length)
  })
})
