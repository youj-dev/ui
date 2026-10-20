import { LOW_POWER_EXPR, lowPower, resetProbe, skipsEffects } from './power'

const engine = vi.hoisted(() => ({ loaded: 0 }))
vi.mock('./scripts', () => ({ SCRIPTS: {} }))
vi.mock('./compile', () => {
  engine.loaded++
  return { compile: () => ({ cancel() {}, finished: Promise.resolve() }) }
})
vi.mock('./code.css', () => ({}))
vi.mock('@youj/motion/components/youj/effects/generate/engine', () => {
  engine.loaded++
  return { generate: () => ({ cancel() {}, finished: Promise.resolve() }) }
})
vi.mock('@youj/motion/components/youj/effects/entrance/ready', () => ({ ready: async () => {} }))
vi.mock('@/lib/code-load', () => ({
  codeUrl: { example: (name: string) => `/code/docs/${name}.json` },
  loadCode: async () => {
    engine.loaded++
    return { code: '', html: '' }
  },
}))

describe('low-power rule', () => {
  it('lets a capable device through', () => {
    expect(lowPower({ hardwareConcurrency: 8, deviceMemory: 8, connection: { effectiveType: '4g' } })).toBe(false)
    expect(lowPower({})).toBe(false)
  })

  it('skips when the reader asks to save data', () => {
    expect(lowPower({ connection: { saveData: true } })).toBe(true)
  })

  it.each(['slow-2g', '2g'])('skips on a %s connection', (effectiveType) => {
    expect(lowPower({ connection: { effectiveType } })).toBe(true)
  })

  it('skips only when few cores AND little memory are both reported', () => {
    expect(lowPower({ hardwareConcurrency: 4, deviceMemory: 4 })).toBe(true)
    expect(lowPower({ hardwareConcurrency: 2, deviceMemory: 2 })).toBe(true)
    expect(lowPower({ hardwareConcurrency: 4, deviceMemory: 8 })).toBe(false)
    expect(lowPower({ hardwareConcurrency: 8, deviceMemory: 4 })).toBe(false)
    expect(lowPower({ hardwareConcurrency: 2 })).toBe(false) // Safari and Firefox hide the memory: never judged on cores alone
  })

  it('has an inline form that agrees with it', () => {
    const inline = (nav: object) => new Function('navigator', `return ${LOW_POWER_EXPR}`)(nav) as boolean
    const cases = [{}, { connection: { saveData: true } }, { connection: { effectiveType: '2g' } }, { connection: { effectiveType: '4g' } }, { hardwareConcurrency: 4, deviceMemory: 4 }, { hardwareConcurrency: 2 }, { hardwareConcurrency: 8, deviceMemory: 8 }]
    for (const nav of cases) expect(inline(nav), JSON.stringify(nav)).toBe(lowPower(nav))
  })
})

describe('frame probe', () => {
  afterEach(() => {
    resetProbe()
    vi.useRealTimers()
  })

  /** Runs the page's frames `gap` ms apart. */
  async function withFrames(gap: number) {
    vi.useFakeTimers()
    let now = 1000
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb((now += gap)), 0))
    const answer = skipsEffects({})
    await vi.advanceTimersByTimeAsync(400)
    return answer
  }

  it('skips when the frames average over 24 ms', async () => {
    expect(await withFrames(30)).toBe(true)
  })

  it('plays when the frames are on budget', async () => {
    expect(await withFrames(17)).toBe(false)
  })
})

describe('entrances under the rule', () => {
  afterEach(() => {
    resetProbe()
    vi.unstubAllGlobals()
    engine.loaded = 0
  })

  const target = () => {
    const node = document.createElement('div')
    return { host: node, node, speed: 1 }
  }

  it.each(['generate', 'code'])('%s shows the demo plainly and loads no engine on a data-saver connection', async (id) => {
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    const { ENTRANCES } = await import('./entrances')
    const entry = ENTRANCES.find((e) => e.id === id)!
    expect(await entry.run!(target())).toBeUndefined()
    expect(engine.loaded).toBe(0)
  })

  it('plays on a capable device', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 10, deviceMemory: 8 })
    vi.useFakeTimers()
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb((now += 16.7)), 0))
    const { ENTRANCES } = await import('./entrances')
    const playing = ENTRANCES.find((e) => e.id === 'generate')!.run!(target())
    await vi.advanceTimersByTimeAsync(500)
    vi.useRealTimers()
    expect(await playing).toBeDefined()
  })

  it('Code with reduced motion is None: the demo plainly, nothing loaded', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 10, deviceMemory: 8 })
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
    vi.useFakeTimers()
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb((now += 16.7)), 0))
    const { ENTRANCES } = await import('./entrances')
    const playing = ENTRANCES.find((e) => e.id === 'code')!.run!({ ...target(), name: 'card/demo' })
    await vi.advanceTimersByTimeAsync(500)
    vi.useRealTimers()
    expect(await playing).toBeUndefined()
    expect(engine.loaded).toBe(0)
  })

  it('names the Code panel\'s tab after the file', async () => {
    const { codeFileName } = await import('./entrances')
    expect(codeFileName('/code/docs/switch/demo.json')).toBe('switch/demo.tsx')
    expect(codeFileName('/code/blocks/auth-login/blocks/auth/login.tsx.json')).toBe('auth/login.tsx')
  })

  it('leaves None alone', async () => {
    const { ENTRANCES } = await import('./entrances')
    expect(ENTRANCES.find((e) => e.id === 'none')!.run).toBeUndefined()
  })
})
