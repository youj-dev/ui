import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureGumballMachine, type MiniatureGumballMachineKey, gumballMachine } from './gumball-machine'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureGumballMachine, gumballMachine)

describe('GumballMachine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const COLOR = '(CHERRY|TANGERINE|LEMON|MINT|BLUEBERRY|GRAPE|BUBBLEGUM|VANILLA)'

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureGumballMachineKey[] = [], settle = 200, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureGumballMachine, { reducedMotion })
    await run(100)
    const press = (list: MiniatureGumballMachineKey[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    const snap = () => view.handle().getSnapshot()
    /** The gumballs showing in the globe and in the cup. */
    const shown = (sel: string) => [...view.inside.querySelectorAll<SVGGElement>(`${sel} > g`)].filter((g) => g.getAttribute('display') !== 'none').length
    const globe = () => shown('[clip-path="url(#globeClip)"] > g')
    const cup = () => [...view.inside.querySelectorAll('[aria-label^="Cup"] .gum')].filter((c) => c.parentElement!.getAttribute('display') !== 'none').length
    return { ...view, run, press, snap, globe, cup }
  }

  it('starts ready, with a credit in it, the globe full and the cup empty', async () => {
    const { snap, globe, cup } = await play()
    expect(snap()).toEqual(gumballMachine.initial)
    expect(globe()).toBeGreaterThan(60)
    expect(cup()).toBe(0)
  })

  it('Space spends the credit: one gumball leaves the globe and lands in the cup, its color in the readout', async () => {
    const { snap, globe, cup, run, press } = await play()
    const full = globe()
    press([' '])
    await run(50)
    expect(snap().readout).toMatch(new RegExp(`^CREDIT 0 · OUT 1 · ${COLOR} · GLOBE (99|98)%$`))
    expect(snap().state).toMatch(new RegExp(`^${COLOR} · IN THE CUP / D TAKES IT$`))
    expect(globe()).toBe(full - 1)
    expect(cup()).toBe(1)
  })

  it('Enter turns the crank too', async () => {
    const { snap } = await play(['Enter'])
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 1 · /)
  })

  it('without credit the crank is locked, and C drops in a coin that unlocks it', async () => {
    const { snap, press, run } = await play([' ', ' '])
    expect(snap().state).toBe('LOCKED / C DROPS IN A COIN')
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 1 · /)
    await run(2000)
    expect(snap().state).toBe('NO CREDIT / C DROPS IN A COIN')
    press(['c'])
    await run(50)
    expect(snap().state).toBe('COIN IN · CREDIT 1')
    expect(snap().readout).toMatch(/^CREDIT 1 · OUT 1 · /)
    press([' '])
    await run(50)
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 2 · /)
  })

  it('coins add up, to a full coin box', async () => {
    const { snap, press, run } = await play(['c', 'c', 'c'])
    expect(snap().readout).toBe('CREDIT 4 · OUT 0 · GLOBE 100%')
    press(['c', 'c', 'c', 'c', 'c', 'c'])
    await run(50)
    expect(snap().readout).toBe('CREDIT 9 · OUT 0 · GLOBE 100%')
    expect(snap().state).toBe('CREDIT FULL · TURN THE CRANK')
  })

  it('the cup keeps the last three; D takes them', async () => {
    const { snap, press, run, cup } = await play(['c', 'c', 'c', ' ', ' ', ' ', ' '])
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 4 · /)
    expect(cup()).toBe(3)
    press(['d'])
    await run(50)
    expect(snap().state).toBe('TAKEN · ENJOY')
    expect(cup()).toBe(0)
    press(['d'])
    await run(50)
    expect(snap().state).toBe('THE CUP IS EMPTY')
  })

  it('the globe empties as it goes, and R refills it', async () => {
    const { snap, press, run, globe } = await play()
    const full = globe()
    press(['r'])
    await run(50)
    expect(snap().state).toBe('GLOBE FULL')
    for (let i = 0; i < full; i++) press(['c', ' '])
    await run(50)
    expect(globe()).toBe(0)
    expect(snap().readout).toMatch(new RegExp(`^CREDIT 1 · OUT ${full} · ${COLOR} · GLOBE 0%$`))
    press([' '])
    await run(50)
    expect(snap().state).toBe('GLOBE EMPTY / R REFILLS IT')
    expect(snap().readout).toMatch(new RegExp(`^CREDIT 1 · OUT ${full} · `))
    press(['r'])
    await run(50)
    expect(globe()).toBe(full)
    expect(snap().readout).toMatch(/ · GLOBE 100%$/)
  })

  it('its parts take clicks: the coin slot, the crank, the cup and the cap', async () => {
    const { snap, inside, run, cup, globe } = await play()
    const click = (label: string) => act(() => void inside.querySelector(`[aria-label^="${label}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    click('Coin slot')
    await run(50)
    expect(snap().readout).toBe('CREDIT 2 · OUT 0 · GLOBE 100%')
    const crank = inside.querySelector('[aria-label^="Crank"]')!
    act(() => {
      crank.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      window.dispatchEvent(new Event('pointerup'))
    })
    await run(50)
    expect(snap().readout).toMatch(/^CREDIT 1 · OUT 1 · /)
    expect(cup()).toBe(1)
    click('Cup')
    await run(50)
    expect(cup()).toBe(0)
    const before = globe()
    click('Cap')
    await run(50)
    expect(globe()).toBe(before + 1)
  })

  it('in full motion the gumball takes its time: the crank turns, it rolls down the spiral, then lands in the cup', async () => {
    const { snap, run, cup } = await play([' '], 300, 'never')
    expect(snap().state).toBe('TURNING THE CRANK')
    expect(snap().readout).toBe('CREDIT 0 · OUT 0 · GLOBE 100%')
    await run(900)
    expect(snap().state).toBe('ROLLING DOWN THE SPIRAL')
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 0 · GLOBE (99|98)%$/)
    expect(cup()).toBe(0)
    await run(4000)
    expect(snap().state).toMatch(new RegExp(`^${COLOR} · IN THE CUP / D TAKES IT$`))
    expect(snap().readout).toMatch(/^CREDIT 0 · OUT 1 · /)
    expect(cup()).toBe(1)
  })

  it('the flap swings open as the gumball passes and falls shut after it', async () => {
    const { inside, run } = await play([' '], 300, 'never')
    const flap = () => inside.querySelector('[aria-label^="Cup"]')!.nextElementSibling!.nextElementSibling!.getAttribute('transform')
    const shut = flap()
    let opened = false
    for (let t = 0; t < 4000; t += 50) {
      await run(50)
      if (flap() !== shut) opened = true
    }
    expect(opened).toBe(true)
    await run(3000)
    expect(flap()).toBe(shut)
  })

  it('left alone it serves itself now and then; a key from you stops that', async () => {
    const alone = await play([], 9000, 'never')
    expect(alone.snap().readout).toMatch(/ · OUT 1 · /)
    cleanup()
    const { snap, run } = await play(['d'], 50, 'never')
    await run(12000)
    expect(snap().readout).toBe('CREDIT 1 · OUT 0 · GLOBE 100%')
  })

  it('with reduced motion nothing moves on its own: every change is a jump', async () => {
    const { inside, run, press } = await play([' '])
    const pose = () => [...inside.querySelectorAll('[transform]')].map((n) => n.getAttribute('transform')).join('|')
    const at = pose()
    await run(3000)
    expect(pose()).toBe(at)
    press(['c', 'r', 'd'])
    const after = pose()
    await run(3000)
    expect(pose()).toBe(after)
  })

  it('keeps the same drawing: no node is added or lost over play and every interaction', async () => {
    const { inside, run, press } = await play([], 100, 'never')
    const count = () => inside.querySelectorAll('*').length
    const nodes = count()
    const steps: MiniatureGumballMachineKey[][] = [['c'], [' '], ['c', 'c', ' '], [' '], ['d'], ['r'], ['Enter'], [' '], ['c'], [' '], ['d']]
    for (const keys of steps) {
      press(keys)
      for (let t = 0; t < 1200; t += 200) {
        await run(200)
        expect(count()).toBe(nodes)
      }
    }
    for (const label of ['Coin slot', 'Crank', 'Cup', 'Cap'])
      act(() => void inside.querySelector(`[aria-label^="${label}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(6000)
    expect(count()).toBe(nodes)
  })
})
