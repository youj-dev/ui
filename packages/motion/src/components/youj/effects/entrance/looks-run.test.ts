import { installEntranceEnv, richDemo, type Env } from '../../../../test/entrance-kit'
import { blueprint } from '../blueprint/engine'
import { generate } from '../generate/engine'
import { inspector } from '../inspector/engine'
import { layers } from '../layers/engine'
import { renderPasses } from '../passes/engine'
import { prism } from '../prism/engine'
import { trace } from '../trace/engine'

/* Runs every look on a demo with every kind of part, on a clock of its own (`paused`, then `seek`), with a canvas
 * that counts what is drawn. The pictures are checked in Chromium; this holds what each run does on the way: it
 * draws, it animates the demo without restyling it, it ends where seek says, and it leaves nothing behind. */

let env: Env
beforeEach(() => {
  env = installEntranceEnv()
})
afterEach(() => env.restore())

const looks = {
  blueprint,
  generate,
  inspector,
  layers,
  renderPasses,
  prism,
  trace,
} as const
const attr: Record<string, string> = { renderPasses: 'passes' }

const times = (T: number) => [0, 0.05, 0.12, 0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 1.1].map((q) => q * T)

describe.each(Object.entries(looks))('%s on a full demo', (name, play) => {
  const overlay = `[data-yj-${attr[name] ?? name}]`

  it('draws and animates as it is seeked through, then leaves nothing behind', async () => {
    const { host, node } = richDemo()
    const before = host.innerHTML
    const run = play(node, { reduced: false, paused: true, duration: 6000 })
    expect(host.querySelector(overlay)).not.toBeNull()
    for (const t of times(6000)) run.seek(t)
    await expect(run.finished).resolves.toBeUndefined()
    expect(host.querySelector(overlay)).toBeNull()
    expect(env.animations.every((a) => a.cancelled)).toBe(true)
    expect(host.innerHTML).toBe(before)
    expect(document.head.querySelectorAll('style')).toHaveLength(0)
  })

  it('draws on its canvases (or animates its layers) before it ends', () => {
    const { node } = richDemo()
    const run = play(node, { reduced: false, paused: true, duration: 6000 })
    run.seek(3600)
    expect(env.animations.length + [...env.draws.values()].reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
    run.cancel()
  })

  it('holds paused animations at the seeked time', () => {
    const { node } = richDemo()
    const run = play(node, { reduced: false, paused: true, duration: 6000 })
    run.seek(2000)
    for (const a of env.animations) {
      expect(a.paused).toBe(true)
      expect(a.currentTime).toBe(2000)
    }
    run.seek(500) // marks only go forwards: an earlier time holds at the last
    for (const a of env.animations) expect(a.currentTime).toBe(2000)
    run.cancel()
  })

  it('cancels mid-run, and a second cancel or a late seek is harmless', async () => {
    const { host, node } = richDemo()
    const run = play(node, { reduced: false, paused: true, duration: 6000 })
    run.seek(2500)
    run.cancel()
    expect(host.querySelector(overlay)).toBeNull()
    run.cancel()
    run.seek(5000)
    await expect(run.finished).resolves.toBeUndefined()
  })

  it('plays on animation frames and ends on its own clock', async () => {
    const { host, node } = richDemo()
    const run = play(node, { reduced: false, duration: 1000 })
    expect(env.frames).toHaveLength(1)
    env.frames.shift()!(100)
    for (const now of [200, 400, 700]) env.frames.shift()!(now)
    expect(host.querySelector(overlay)).not.toBeNull()
    env.frames.shift()!(5000)
    expect(host.querySelector(overlay)).toBeNull()
    await expect(run.finished).resolves.toBeUndefined()
  })

  it('runs a right-to-left demo', async () => {
    const { host, node } = richDemo({ rtl: true })
    const run = play(node, { reduced: false, paused: true, duration: 5000 })
    for (const t of times(5000)) run.seek(t)
    await expect(run.finished).resolves.toBeUndefined()
    expect(host.querySelector(overlay)).toBeNull()
  })

  it('skips a stage given no share and keeps the total', async () => {
    const { node } = richDemo()
    const phases = Object.fromEntries(Object.keys(playPhases[name]!).map((k, i) => [k, i === 0 ? 0 : 1]))
    const run = play(node, { reduced: false, paused: true, duration: 4000, phases } as never)
    for (const t of times(4000)) run.seek(t)
    await expect(run.finished).resolves.toBeUndefined()
  })

  it('ends at once for an aborted signal, a detached demo or reduced motion', async () => {
    const { host, node } = richDemo()
    const controller = new AbortController()
    controller.abort()
    await play(node, { reduced: false, signal: controller.signal }).finished
    expect(host.querySelector(overlay)).toBeNull()

    const run = play(node, { reduced: true })
    expect(host.querySelector(overlay)).toBeNull()
    await expect(run.finished).resolves.toBeUndefined()

    const loose = document.createElement('div')
    expect(play(loose, { reduced: false }).cancel).toBeTypeOf('function')
  })

  it('ends when the demo leaves the page, and when focus or a press lands in it', async () => {
    const { host, node } = richDemo()
    const run = play(node, { reduced: false })
    env.frames.shift()!(0)
    host.remove()
    env.frames.shift()!(100)
    await expect(run.finished).resolves.toBeUndefined()

    const again = richDemo()
    play(again.node, { reduced: false })
    again.node.dispatchEvent(new Event('pointerdown'))
    expect(again.host.querySelector(overlay)).toBeNull()
  })
})

const playPhases: Record<string, Record<string, number>> = {
  blueprint: { survey: 1, layout: 1, detail: 1, ink: 1, tone: 1, set: 1, finish: 1 },
  generate: { frame: 1, build: 1, settle: 1 },
  inspector: { inspect: 1, handoff: 1 },
  layers: { stack: 1, collapse: 1, resolve: 1 },
  renderPasses: { layout: 1, paint: 1, composite: 1 },
  prism: { frame: 1, build: 1, settle: 1 },
  trace: { enter: 1, spread: 1, settle: 1 },
}

describe('look options', () => {
  it('blueprint without side columns and with its own words', () => {
    const { node } = richDemo()
    const run = blueprint(node, { reduced: false, paused: true, duration: 4000, columns: 'none', labels: { build: 'Plan' } as never })
    for (const t of times(4000)) run.seek(t)
    run.cancel()
  })

  it('generate follows the regions it is told to drag first', () => {
    const { node } = richDemo()
    const run = generate(node, { reduced: false, paused: true, duration: 4000, order: ['header', 'ul'], names: { header: 'Top bar' } })
    for (const t of times(4000)) run.seek(t)
    run.cancel()
  })

  it('layers and passes name themselves in the words they are given', () => {
    const { host, node } = richDemo()
    const a = layers(node, { reduced: false, paused: true, duration: 4000, labels: { layersFrame: 'cadre' } })
    const b = renderPasses(node, { reduced: false, paused: true, duration: 4000, labels: { renderPassesPaint: 'peindre' } })
    for (const t of times(4000).slice(0, 7)) {
      a.seek(t)
      b.seek(t)
    }
    expect(host.querySelector('[data-yj-layers]')?.textContent).toContain('cadre')
    expect(host.querySelector('[data-yj-passes]')?.textContent).toContain('peindre')
    a.cancel()
    b.cancel()
  })

  it('trace in the accent, prism without registration marks', () => {
    const { node } = richDemo()
    const a = trace(node, { reduced: false, paused: true, duration: 4000, accent: true })
    const b = prism(node, { reduced: false, paused: true, duration: 4000, marks: false })
    for (const t of times(4000)) {
      a.seek(t)
      b.seek(t)
    }
    a.cancel()
    b.cancel()
  })

  it('speed shortens the run and personality changes its feel without breaking it', async () => {
    const { node } = richDemo()
    const run = inspector(node, { reduced: false, paused: true, speed: 4, personality: 'lively' })
    run.seek(1e6)
    await expect(run.finished).resolves.toBeUndefined()
  })
})
