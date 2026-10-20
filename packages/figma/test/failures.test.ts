import { runInNewContext } from 'node:vm'
import { bundlePlugin } from '../scripts/bundle'
import { buildKit } from '../src/data/build-kit'
import type { Kit } from '../src/kit'
import { SHEETS } from '../src/plugin/pages'
import { drawKit, run } from '../src/plugin/run'
import { PENDING } from '../src/plugin/sheet'
import type { StepState } from '../src/plugin/steps'
import { KEY } from '../src/plugin/store'
import { allNodes, createFakeFigma, DEFAULT_FONTS, installFakeFigma, type FakeEnv, type FakeOptions } from './fake-figma'
import { checkIntegrity } from './integrity'

/* The failures: an API that throws, a font that won't load, a plan message
 * Figma words differently, a run that stops half way. The build carries on,
 * says what failed, and no page is left silently empty. */

const kit: Kit = buildKit()

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
