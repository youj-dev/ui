import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureClawMachine, type MiniatureClawMachineKey, clawMachine } from './claw-machine'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureClawMachine, clawMachine)

describe('ClawMachine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  type Key = MiniatureClawMachineKey
  /** From the claw's home over the chute, the steps to the panda on top of the pile: dead centre. */
  const OVER_PANDA: Key[] = ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp']

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: Key[] = [], settle = 400, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureClawMachine, { reducedMotion })
    await run(100)
    const press = (list: Key[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    /** The plushes waiting behind the prize door's flap. */
    const bay = () => view.inside.querySelector('[clip-path="url(#bayClip)"]')!.querySelectorAll('[style*="--c:"]')
    const at = (selector: string) => view.inside.querySelector(selector)!
    return { ...view, run, press, bay, at, snap: () => view.handle().getSnapshot() }
  }

  it('starts ready with three credits, the claw parked over the chute', async () => {
    const { snap, bay } = await play()
    expect(snap()).toEqual(clawMachine.initial)
    expect(bay().length).toBe(0)
  })

  it('C adds a credit', async () => {
    const { snap } = await play(['c'])
    expect(snap().readout).toBe('CREDITS 4 · TIMER 15 · WON 0')
    expect(snap().state).toBe('COIN IN · 4 CREDITS')
  })

  it('an arrow spends a credit on a timed play and steps the gantry', async () => {
    const { snap, at, press, run } = await play()
    const placed = () => [...at('svg').querySelectorAll('g[transform^="translate"]')].map((g) => g.getAttribute('transform')).join()
    const before = placed()
    press(['ArrowRight'])
    await run(200)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 0')
    expect(snap().state).toBe('STEERING · SPACE DROPS')
    expect(placed()).not.toBe(before)
  })

  it('lined up over a plush, Space wins it: down the chute to the prize door, the marquee lit', async () => {
    const { snap, bay, inside, press, run } = await play(OVER_PANDA)
    press([' '])
    await run(600)
    expect(snap().state).toBe('GRABBING')
    await run(2400)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 1')
    expect(snap().state).toBe('WINNER · THE PANDA')
    expect(bay().length).toBe(1)
    expect([...inside.querySelectorAll('.bulb')].every((b) => b.classList.contains('on'))).toBe(true)
    await run(3000)
    expect(snap().state).toBe('PRIZE AT THE DOOR · P TAKES IT')
  })

  it('P takes the prize, and the plush goes back on the pile', async () => {
    const { snap, bay, press, run } = await play([...OVER_PANDA, ' '], 3000)
    expect(bay().length).toBe(1)
    press(['p'])
    await run(200)
    expect(snap().state).toBe('ENJOY THE PANDA')
    expect(bay().length).toBe(0)
    await run(2400)
    expect(snap().state).toBe('READY · STEER, THEN SPACE DROPS')
  })

  it('off center, the grip slips on the way home', async () => {
    const { snap, bay, press, run } = await play(OVER_PANDA.filter((_, i) => i !== 0))
    press([' '])
    await run(3000)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 0')
    expect(snap().state).toBe('IT SLIPPED · SO CLOSE')
    expect(bay().length).toBe(0)
  })

  it('off target, it misses', async () => {
    const { snap, press, run } = await play()
    press([' '])
    await run(100)
    expect(snap().state).toBe('DROPPING THE CLAW')
    await run(700)
    expect(snap().state).toBe('MISSED · RETURNING')
    await run(3000)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 0')
    expect(snap().state).toBe('READY · STEER, THEN SPACE DROPS')
    press([' '])
    await run(3000)
    press([' '])
    await run(3500)
    expect(snap().readout).toBe('CREDITS 0 · TIMER 15 · WON 0')
    expect(snap().state).toBe('INSERT COIN · C ADDS A CREDIT')
    press(['ArrowLeft'])
    await run(100)
    expect(snap().state).toBe('INSERT COIN · C ADDS A CREDIT')
    expect(snap().readout).toBe('CREDITS 0 · TIMER 15 · WON 0')
  })

  it('the timer runs down and drops the claw by itself', async () => {
    const { snap, run } = await play(['ArrowDown'], 10200)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 05 · WON 0')
    expect(snap().state).toBe('HURRY · 5 S LEFT')
    await run(5300)
    expect(snap().state).toBe('TIME UP · DROPPING')
    await run(1000)
    expect(snap().state).toBe('MISSED · RETURNING')
  })

  it('the drop button, the coin slot and the prize door work by click', async () => {
    const { snap, inside, press, run } = await play(OVER_PANDA)
    const click = (label: string) => act(() => void inside.querySelector(`[aria-label^="${label}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    click('Coin slot')
    await run(100)
    expect(snap().readout).toBe('CREDITS 3 · TIMER 15 · WON 0')
    click('Drop button')
    await run(3000)
    expect(snap().readout).toBe('CREDITS 3 · TIMER 15 · WON 1')
    click('Prize door')
    await run(100)
    expect(snap().state).toBe('ENJOY THE PANDA')
    press(['p'])
    await run(100)
    expect(snap().state).toBe('NO PRIZE AT THE DOOR')
  })

  it('hovering over the glass starts nothing; a click there spends a credit and drops the claw', async () => {
    const { snap, inside, run } = await play()
    const glass = inside.querySelector('.steer')!
    act(() => void glass.dispatchEvent(new Event('pointermove', { bubbles: true })))
    await run(300)
    expect(snap()).toEqual(clawMachine.initial)
    act(() => void glass.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 0')
    expect(snap().state).toBe('DROPPING THE CLAW')
  })

  it('in full motion it takes its time: the claw drops, closes, lifts and carries home', async () => {
    const { snap, run, press } = await play(OVER_PANDA, 4000, 'never')
    press([' '])
    await run(300)
    expect(snap().state).toBe('DROPPING THE CLAW')
    await run(1700)
    expect(snap().state).toMatch(/^(GRABBING|GOT THE PANDA)$/)
    await run(5500)
    expect(snap().readout).toBe('CREDITS 2 · TIMER 15 · WON 1')
    expect(snap().state).toBe('PRIZE AT THE DOOR · P TAKES IT')
  })

  it('keeps a fixed number of drawing nodes through every interaction, in full and in reduced motion', async () => {
    for (const motion of ['never', 'always'] as const) {
      const { inside, svg, press, run, unmount } = await play([], 300, motion)
      // The svg only: the live region beside it gains a text node with its first announcement.
      const count = () => svg().querySelectorAll('*').length
      const click = (selector: string) => act(() => void inside.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      const nodes = count()
      await run(2000)
      press(['c', 'c'])
      await run(600)
      press(OVER_PANDA)
      await run(3500)
      press([' '])
      await run(9000)
      press(['p'])
      await run(2500)
      press(['ArrowLeft', 'ArrowDown'])
      await run(1500)
      click('[aria-label^="Drop button"]')
      await run(9000)
      press(OVER_PANDA.filter((_, i) => i !== 0))
      await run(3500)
      click('.steer')
      await run(9000)
      click('[aria-label^="Coin slot"]')
      click('[aria-label^="Prize door"]')
      await run(14000)
      expect(count(), motion).toBe(nodes)
      unmount()
    }
  })

  it('left alone in full motion it plays itself, free and silent, until a key takes over', async () => {
    const { snap, run, press } = await play([], 3500, 'never')
    expect(snap().state).toMatch(/^DEMO · /)
    expect(snap().readout).toMatch(/^CREDITS 3 · /)
    press(['c'])
    await run(100)
    expect(snap().state).toBe('COIN IN · 4 CREDITS')
    expect(snap().readout).toMatch(/^CREDITS 4 · TIMER 15 · /)
  })
})
