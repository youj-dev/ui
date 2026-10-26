import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureBankVault, type MiniatureBankVaultKey, bankVault } from './bank-vault'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureBankVault, bankVault)

describe('BankVault', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const COMBINATION: MiniatureBankVaultKey[] = ['3', '0', 'Enter', '7', '0', 'Enter', '1', '5', 'Enter']

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureBankVaultKey[] = [], settle = 400, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureBankVault, { reducedMotion })
    await run(100)
    const press = (list: MiniatureBankVaultKey[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    return { ...view, run, press, snap: () => view.handle().getSnapshot() }
  }

  it('starts locked, with the demo combination offered', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(bankVault.initial)
    expect(inside.querySelector('[role=slider]')).toHaveAttribute('aria-valuenow', '0')
  })

  it('the arrows turn the dial one number at a time, round past zero', async () => {
    const { snap, press, run } = await play(['ArrowRight', 'ArrowRight'])
    expect(snap().readout).toMatch(/^DIAL 02 /)
    press(['ArrowLeft', 'ArrowLeft', 'ArrowLeft'])
    await run(200)
    expect(snap().readout).toMatch(/^DIAL 99 /)
  })

  it('typing a number spins the dial to it', async () => {
    const { snap, inside } = await play(['7', '0'])
    expect(snap().readout).toMatch(/^DIAL 70 /)
    expect(inside.querySelector('[role=slider]')).toHaveAttribute('aria-valuenow', '70')
  })

  it('Enter on the right number clicks it in and lights its lamp', async () => {
    const { snap, inside } = await play(['3', '0', 'Enter'])
    expect(snap().readout).toBe('DIAL 30 · 30 –– –– · DOOR 0°')
    expect(snap().state).toBe('NUMBER 1 OF 3 SET / TURN TO 70')
    expect(inside.querySelectorAll('.lamp.g')).toHaveLength(1)
  })

  it('a wrong number shakes the door and starts over', async () => {
    const { snap, inside } = await play(['3', '0', 'Enter', '4', '2', 'Enter'])
    expect(snap().readout).toBe('DIAL 42 · –– –– –– · DOOR 0°')
    expect(snap().state).toBe('WRONG NUMBER / START AGAIN')
    expect(inside.querySelectorAll('.lamp.a')).toHaveLength(3)
  })

  it('the combination opens it: bolts back, handle turned, door swung wide', async () => {
    const { snap, inside } = await play(COMBINATION)
    expect(snap().readout).toBe('DIAL 15 · 30 70 15 · DOOR 104°')
    expect(snap().state).toBe('OPEN · GOLD / SPACE TO CLOSE')
    expect(inside.querySelectorAll('.lamp.g')).toHaveLength(3)
    expect(inside.querySelector('[aria-label="Close the door (Space)"]')).toHaveAttribute('tabindex', '0')
  })

  it('Space closes it again and it relocks, the dial scrambled', async () => {
    const { snap, press, run, inside } = await play(COMBINATION)
    press([' '])
    await run(400)
    expect(snap().state).toBe('LOCKED / DEMO 30 · 70 · 15')
    expect(snap().readout).toMatch(/^DIAL \d\d · –– –– –– · DOOR 0°$/)
    expect(inside.querySelectorAll('.lamp.g')).toHaveLength(0)
    expect(inside.querySelector('[aria-label="Close the door (Space)"]')).toHaveAttribute('tabindex', '-1')
  })

  it('Escape closes an open vault too', async () => {
    const { snap, press, run } = await play(COMBINATION)
    press(['Escape'])
    await run(400)
    expect(snap().state).toBe('LOCKED / DEMO 30 · 70 · 15')
  })

  it('Space on a locked vault only rattles the handle', async () => {
    const { snap } = await play([' '])
    expect(snap().state).toBe('LOCKED / DIAL THE COMBINATION')
    expect(snap().readout).toBe(bankVault.initial.readout)
  })

  it('clicking the handle tries it as Space does', async () => {
    const { snap, inside, run } = await play()
    act(() => void inside.querySelector('[aria-label^="Handle"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('LOCKED / DIAL THE COMBINATION')
  })

  it('Escape clears the numbers set so far', async () => {
    const { snap } = await play(['3', '0', 'Enter', 'Escape'])
    expect(snap().readout).toBe('DIAL 30 · –– –– –– · DOOR 0°')
    expect(snap().state).toBe('CLEARED / DEMO 30 · 70 · 15')
  })

  it('three wrong numbers in a row ring the alarm and lock the dial out for a while', async () => {
    const { snap, press, run, inside } = await play(['1', 'Enter', '2', 'Enter', '4', 'Enter'])
    expect(snap().state).toBe('ALARM / LOCKED OUT 8 S')
    expect(inside.querySelectorAll('.lamp.r')).toHaveLength(3)
    press(['3', '0', 'Enter'])
    await run(100)
    expect(snap().state).toMatch(/^LOCKED OUT \/ \d S$/)
    expect(snap().readout).toBe('DIAL 30 · –– –– –– · DOOR 0°')
    await run(8000)
    expect(snap().state).toBe('LOCKED / DEMO 30 · 70 · 15')
    press(COMBINATION)
    await run(400)
    expect(snap().state).toBe('OPEN · GOLD / SPACE TO CLOSE')
  })

  it('C changes what the vault holds: gold, cash, a single key', async () => {
    const { snap, press, run } = await play(COMBINATION)
    press(['c'])
    await run(100)
    expect(snap().state).toBe('CONTENTS · CASH')
    await run(2000)
    expect(snap().state).toBe('OPEN · CASH / SPACE TO CLOSE')
    press(['c'])
    await run(2000)
    expect(snap().state).toBe('OPEN · KEY / SPACE TO CLOSE')
  })

  it('in full motion the door takes its time: bolts first, then a heavy swing that settles open', async () => {
    const { snap, run } = await play(COMBINATION, 300, 'never')
    expect(snap().state).toBe('UNLOCKED / BOLTS DRAWING BACK')
    expect(snap().readout).toMatch(/· DOOR 0°$/)
    await run(1300)
    expect(snap().state).toBe('DOOR SWINGING OPEN')
    await run(5000)
    expect(snap().state).toBe('OPEN · GOLD / SPACE TO CLOSE')
    expect(snap().readout).toMatch(/· DOOR 104°$/)
  })
})
