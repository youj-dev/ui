import { runInNewContext } from 'node:vm'
import { bundlePlugin } from '../scripts/bundle'
import { buildKit } from '../src/data/build-kit'
import type { Kit } from '../src/kit'
import { SHEETS } from '../src/plugin/pages'
import { drawKit, run } from '../src/plugin/run'
import { PENDING } from '../src/plugin/sheet'
import type { StepState } from '../src/plugin/steps'
import { KEY } from '../src/plugin/store'
import { allNodes, createFakeFigma, DEFAULT_FONTS, installFakeFigma, resolveVariable, type FakeEnv, type FakeNode, type FakeOptions } from './fake-figma'

/* The build's integrity, on every plan: every page holds its sheet and
 * nothing else, every component set has well-formed variants, every bound
 * variable resolves, every text node's font is loaded, nothing is zero-size
 * or off the canvas. Then the failures: an API that throws, a font that
 * won't load, a plan message Figma words differently, a run that stops half
 * way. The build carries on, says what failed, and no page is left silently
 * empty. */

const kit: Kit = buildKit()

type Alias = { type: 'VARIABLE_ALIAS'; id: string }
const aliases = (value: unknown): Alias[] => {
  if (!value || typeof value !== 'object') return []
  const v = value as Record<string, unknown>
  if (v.type === 'VARIABLE_ALIAS' && typeof v.id === 'string') return [v as unknown as Alias]
  return Object.values(v).flatMap(aliases)
}

/** Every variable reference in the file: node fields, paints, effects and styles. */
function references(env: FakeEnv): { where: string; alias: Alias }[] {
  const out: { where: string; alias: Alias }[] = []
  for (const n of allNodes(env)) {
    const where = `${n.type} "${n.name}"`
    for (const alias of aliases(n.boundVariables)) out.push({ where, alias })
    for (const p of [...n.fills, ...n.strokes, ...n.effects]) for (const alias of aliases(p.boundVariables)) out.push({ where, alias })
  }
  for (const s of env.styles) {
    for (const alias of aliases(s.boundVariables)) out.push({ where: `style ${s.name}`, alias })
    const effects = (s as unknown as { effects?: { boundVariables?: unknown }[] }).effects ?? []
    for (const e of effects) for (const alias of aliases(e.boundVariables)) out.push({ where: `style ${s.name}`, alias })
  }
  return out
}

function checkIntegrity(env: FakeEnv) {
  const problems: string[] = []
  const kitPages = env.pages.filter((p) => p.getPluginData(KEY).startsWith('page:'))
  expect(kitPages.length).toBeGreaterThan(0)

  // Pages: each holds sheets and only sheets (nothing stranded where it was created), none is empty.
  const sheets = new Map<string, FakeNode>()
  for (const page of kitPages) {
    if (!page.rawChildren().length) problems.push(`page ${page.name} is empty`)
    for (const top of page.rawChildren()) {
      const key = top.getPluginData(KEY)
      if (!key.startsWith('sheet:')) problems.push(`stray ${top.type} "${top.name}" on ${page.name}`)
      else if (sheets.has(key)) problems.push(`${key} twice`)
      else sheets.set(key, top)
      if (top.getPluginData(PENDING)) problems.push(`${key} carries a notice: ${top.getPluginData(PENDING)}`)
      if (!(top.x >= 0 && top.x < 50_000 && top.y >= 0 && top.y < 50_000)) problems.push(`${key} is off the canvas at ${top.x}, ${top.y}`)
    }
  }
  for (const s of SHEETS) {
    const frame = sheets.get(`sheet:${s}`)
    if (!frame) problems.push(`no sheet:${s}`)
    else if (frame.rawChildren().length < 2 || frame.height < 400) problems.push(`sheet:${s} is nearly empty (${frame.rawChildren().length} children, ${Math.round(frame.height)}px)`)
  }
  // Nothing left on a non-kit page by the build (a new file's page is taken over; your own pages stay yours).
  for (const page of env.pages.filter((p) => !kitPages.includes(p))) {
    for (const n of page.rawChildren()) if (n.getPluginData(KEY) || n.name === 'Svg' || n.type === 'INSTANCE') problems.push(`kit node "${n.name}" left on your page ${page.name}`)
  }

  // Component sets: variants only, uniquely named, all with the same properties.
  for (const set of allNodes(env).filter((n) => n.type === 'COMPONENT_SET')) {
    const kids = set.rawChildren()
    if (!kids.length) problems.push(`${set.name} has no variants`)
    if (kids.some((k) => k.type !== 'COMPONENT')) problems.push(`${set.name} holds a non-component`)
    const names = kids.map((k) => k.name)
    if (new Set(names).size !== names.length) problems.push(`${set.name} has variants with the same values`)
    const shape = (k: FakeNode) => Object.keys(k.variantProperties ?? {}).sort().join(',')
    if (new Set(kids.map(shape)).size > 1) problems.push(`${set.name} mixes variant properties`)
    for (const k of kids) if (!k.rawChildren().length && !/Skeleton|Separator/.test(set.name)) problems.push(`${set.name} / ${k.name} is empty`)
  }

  // Variables: every reference points at a variable that resolves to a value.
  for (const { where, alias } of references(env)) {
    if (!env.variables.some((v) => v.id === alias.id)) problems.push(`${where} binds a missing variable ${alias.id}`)
    else if (resolveVariable(env, alias.id) === undefined) problems.push(`${where} binds ${alias.id}, which doesn't resolve`)
  }

  // Text: written in loaded fonts, never blank. Boxes: never zero-size.
  for (const n of allNodes(env)) {
    if (n.type === 'TEXT') {
      if (!env.loadedFonts.has(`${n.fontName.family}/${n.fontName.style}`)) problems.push(`text "${n.name}" is in an unloaded font ${n.fontName.family} ${n.fontName.style}`)
      if (!n.characters.trim()) problems.push(`text "${n.name}" is blank`)
    }
    if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'TEXT', 'RECTANGLE', 'ELLIPSE'].includes(n.type) && !(n.width > 0 && n.height > 0)) {
      problems.push(`${n.type} "${n.name}" is ${n.width} × ${n.height}`)
    }
  }
  return problems
}

const plans: [string, FakeOptions][] = [
  ['Professional', { modeLimit: 10 }],
  ['Starter, drafts', { modeLimit: 1 }],
  ['Starter, team file', { modeLimit: 1, pageLimit: 3 }],
]

// Every plan in both styles: Classic (the default, from "Build or update the kit") and Bezel (from the Look menu).
const builds = plans.flatMap(([plan, opts]) => [
  [plan, 'Classic', 'build', opts] as const,
  [plan, 'Bezel', 'look:bezel', opts] as const,
])

describe.each(builds)('a clean build (%s, %s)', (_, style, command, opts) => {
  let env: FakeEnv
  let log: string
  let message: string
  beforeAll(async () => {
    env = installFakeFigma(opts).env
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    message = await run(kit, command)
    log = spy.mock.calls.map((c) => c.join(' ')).join('\n')
    spy.mockRestore()
  })

  test('says it is ready, with no problems', () => {
    expect(message).toMatch(/is ready/)
  })

  test(`draws the components in ${style}`, () => {
    expect(log).toMatch(new RegExp(`Look: ${style}`))
  })

  test('passes the integrity check', () => {
    expect(checkIntegrity(env)).toEqual([])
  })

  test('logs every page’s node count', () => {
    const pages = [...new Set(env.pages.filter((p) => p.getPluginData(KEY).startsWith('page:')).map((p) => p.name))]
    for (const name of pages) expect(log).toMatch(new RegExp(`${name.replace(/[&]/g, '\\&')}: \\d+ nodes`))
  })

  test('a second run is just as whole', async () => {
    expect(await run(kit, 'build')).toMatch(/is ready/)
    expect(checkIntegrity(env)).toEqual([])
  })

  test('switching to the other style redraws in place and stays whole', async () => {
    const sets = allNodes(env).filter((n) => n.type === 'COMPONENT_SET').map((n) => n.id)
    expect(await run(kit, style === 'Classic' ? 'look:bezel' : 'look:classic')).toMatch(/is ready/)
    expect(allNodes(env).filter((n) => n.type === 'COMPONENT_SET').map((n) => n.id)).toEqual(sets)
    expect(checkIntegrity(env)).toEqual([])
  })
})

/** Builds with a fake that fails somewhere, returning the closing message and the step states. */
async function buildWith(opts: FakeOptions) {
  const { env } = installFakeFigma(opts)
  let steps: StepState[] = []
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  const logs = vi.spyOn(console, 'log').mockImplementation(() => {})
  const warns = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const report = await drawKit(kit, { update: (s) => (steps = s) })
    return { env, report, steps, status: (id: string) => steps.find((s) => s.id === id)!.status }
  } finally {
    errors.mockRestore()
    logs.mockRestore()
    warns.mockRestore()
  }
}

const sheetOf = (env: FakeEnv, key: string) => allNodes(env).find((n) => n.getPluginData(KEY) === `sheet:${key}`)!
const coverText = (env: FakeEnv) =>
  sheetOf(env, 'cover')
    .findAll((n) => n.type === 'TEXT')
    .map((n) => n.characters)
    .join('\n')

describe('a step that throws', () => {
  test('fails alone: its page says why, every other page builds, the cover lists it', async () => {
    const { env, report, status } = await buildWith({ failures: { createImage: 'Image is too large' } })
    expect(status('blocks')).toBe('failed')
    for (const id of ['icons', 'components', 'colour', 'type', 'layout', 'motion', 'cover', 'check']) expect(status(id), id).toBe('done')
    expect(report.problems).toEqual(['Blocks page: Image is too large'])
    const blocks = sheetOf(env, 'blocks')
    expect(blocks.getPluginData(PENDING)).toMatch(/Blocks didn’t build/)
    expect(blocks.findAll((n) => n.type === 'TEXT').map((n) => n.characters).join('\n')).toMatch(/Image is too large/)
    expect(coverText(env)).toMatch(/Problem: Blocks page: Image is too large/)
  })

  test('SVG import failing takes out what draws vectors, and nothing else; the cover still reports', async () => {
    const { env, report, status } = await buildWith({ failures: { createNodeFromSvg: 'SVG import failed' } })
    // Icons and the motion curves are vectors; the cover's lockup is too, but the cover goes on without it.
    expect(status('icons')).toBe('failed')
    expect(status('motion')).toBe('failed')
    for (const id of ['colour', 'type', 'layout', 'blocks', 'cover', 'check']) expect(status(id), id).toBe('done')
    expect(report.problems[0]).toMatch(/^Icons: SVG import failed/)
    expect(sheetOf(env, 'icons').getPluginData(PENDING)).toMatch(/Icons didn’t build/)
    expect(sheetOf(env, 'motion').getPluginData(PENDING)).toMatch(/Motion didn’t build/)
    expect(coverText(env)).toMatch(/Problem: Icons: SVG import failed/)
    expect(coverText(env)).toMatch(/Note: The cover's lockup couldn't be drawn/)
  })

  test('a failure on a re-run keeps the earlier build’s content, with the notice on top', async () => {
    const { figma, env } = installFakeFigma({})
    const quiet = vi.spyOn(console, 'log').mockImplementation(() => {})
    await run(kit, 'build')
    const before = sheetOf(env, 'blocks').rawChildren().length
    env.opts.failures = { createImage: 'Image is too large' }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await run(kit, 'build')).toMatch(/built with 1 problem: Blocks page: Image is too large/)
    vi.restoreAllMocks()
    quiet.mockRestore()
    const blocks = sheetOf(env, 'blocks')
    expect(blocks.rawChildren().length).toBeGreaterThan(1)
    expect(blocks.rawChildren()[1]!.name).toBe('Note')
    expect(before).toBeGreaterThan(0)
    expect(figma).toBeDefined()
  })

  test('code syntax refused: the variables still build, with a note', async () => {
    const { report } = await buildWith({ failures: { setVariableCodeSyntax: 'Dev Mode is not available' } })
    expect(report.problems).toEqual([])
    expect(report.warnings.join('\n')).toMatch(/code syntax \(Dev Mode is not available\)/)
  })
})

describe('plan limits worded differently', () => {
  test('an addMode refusal in any words is read as the mode cap', async () => {
    const { env, report } = await buildWith({ modeLimit: 1, failures: { addMode: 'Something went wrong' } })
    expect(report.problems).toEqual([])
    expect(env.collections.some((c) => c.name === 'Theme · Graphite')).toBe(true)
    expect(checkIntegrity(env)).toEqual([])
  })

  test('a createPage refusal in any words, at three pages, folds the kit into three', async () => {
    const { env, report } = await buildWith({ modeLimit: 1, pageLimit: 3, failures: { createPage: 'Unable to create page' } })
    expect(report.problems).toEqual([])
    expect(env.pages.map((p) => p.name)).toEqual(['Youj', 'Icons', 'Components'])
    expect(checkIntegrity(env)).toEqual([])
  })
})

describe('fonts', () => {
  test('without Geist, Inter, JetBrains Mono or Roboto, falls back to what the file has and says so', async () => {
    const fonts = ['Regular', 'Medium', 'Bold'].map((style) => ({ family: 'Helvetica', style }))
    const { env, report } = await buildWith({ fonts })
    expect(report.problems).toEqual([])
    expect(report.warnings.join('\n')).toMatch(/Inter isn't available here, so sans text uses Helvetica/)
    expect(report.warnings.join('\n')).toMatch(/JetBrains Mono isn't available here, so mono text uses Helvetica/)
    expect(checkIntegrity(env)).toEqual([])
  })

  test('a listed style that fails to load is swapped for the nearest one that loads', async () => {
    const { env, report } = await buildWith({ unloadable: [{ family: 'Inter', style: 'Semi Bold' }] })
    expect(report.problems).toEqual([])
    expect(report.warnings.join('\n')).toMatch(/listed but didn't load \(Inter Semi Bold\)/)
    expect(checkIntegrity(env)).toEqual([])
  })

  test('no loadable font at all stops the build at the first step, and says why', async () => {
    const { report, status } = await buildWith({ fonts: [{ family: 'Inter', style: 'Regular' }], unloadable: [{ family: 'Inter', style: 'Regular' }] })
    expect(status('fonts')).toBe('failed')
    expect(status('cover')).toBe('skipped')
    expect(report.problems[0]).toMatch(/^Loading fonts: No sans font could be loaded/)
  })
})

describe('a build that stops half way', () => {
  test('leaves every page it didn’t reach saying so, never silently empty', async () => {
    const { env } = installFakeFigma({})
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Figma closing the plugin mid-build: nothing after the icons step runs.
    await expect(
      drawKit(kit, {
        update: (steps) => {
          if (steps.find((s) => s.id === 'icons')?.status === 'running') throw new Error('plugin closed')
        },
      }),
    ).rejects.toThrow('plugin closed')
    quiet.mockRestore()
    for (const key of SHEETS) {
      const frame = sheetOf(env, key)
      expect(frame, key).toBeDefined()
      expect(frame.getPluginData(PENDING), key).toMatch(/isn’t built yet/)
      expect(frame.findAll((n) => n.type === 'TEXT').some((t) => /The build stopped before it reached this page/.test(t.characters)), key).toBe(true)
    }
    expect(DEFAULT_FONTS.length).toBeGreaterThan(0)
  })
})

describe('the bundled code.js with a failing step', () => {
  test('keeps its panel open with the problems until you close it', async () => {
    const code = await bundlePlugin(kit, false)
    const { figma, env } = createFakeFigma({ command: 'build', failures: { createImage: 'Image is too large' } })
    const quiet = { ...console, log: () => {}, error: () => {}, warn: () => {} }
    runInNewContext(code, { figma, console: quiet, setTimeout, clearTimeout })
    await vi.waitFor(() => expect(env.ui?.messages.some((m) => m.type === 'finish')).toBe(true), { timeout: 60_000, interval: 50 })
    const finish = env.ui!.messages.find((m) => m.type === 'finish')!
    expect(finish.ok).toBe(false)
    expect(finish.report).toMatch(/Problem: Blocks page: Image is too large/)
    expect(env.closed).toBeUndefined()
    env.ui!.onmessage!({ type: 'close' })
    await vi.waitFor(() => expect(env.closed).toMatch(/built with 1 problem/))
  })

  test('falls back to toasts when the panel can’t open', async () => {
    const code = await bundlePlugin(kit, false)
    const { figma, env } = createFakeFigma({ command: 'build', failures: { showUI: 'UI unavailable' } })
    runInNewContext(code, { figma, console: { ...console, log: () => {}, error: () => {} }, setTimeout, clearTimeout })
    await vi.waitFor(() => expect(env.closed).toBeDefined(), { timeout: 60_000, interval: 50 })
    expect(env.closed).toMatch(/is ready/)
    expect(env.notifications.some((n) => /\(\d+\/15\)/.test(n))).toBe(true)
  })
})
