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

  const OPEN = 'WHEEL 360° · BOLTS DRAWN · DOOR 102°'
  const SHUT = 'WHEEL 0° · BOLTS THROWN · DOOR 0°'

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

  it('starts shut and bolted, the wheel at rest', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(bankVault.initial)
    expect(inside.querySelector('.lamp')).not.toHaveClass('g')
  })

  it('Space opens it in one go: the wheel turns once, the bolts draw back and the door swings wide', async () => {
    const { snap, inside } = await play([' '])
    expect(snap().readout).toBe(OPEN)
    expect(snap().state).toBe('OPEN · GOLD / SPACE CLOSES IT')
    expect(snap().pressed[' ']).toBe(true)
    expect(inside.querySelector('.lamp')).toHaveClass('g')
    expect(inside.querySelector('[aria-label="Close the door (Space)"]')).toHaveAttribute('tabindex', '0')
  })

  it('Space again swings it shut and throws the bolts', async () => {
    const { snap, press, run } = await play([' '])
    press([' '])
    await run(400)
    expect(snap().readout).toBe(SHUT)
    expect(snap().state).toBe('LOCKED / SPACE OR THE WHEEL OPENS IT')
    expect(snap().pressed[' ']).toBe(false)
  })

  it('Enter does what Space does', async () => {
    const { snap, press, run } = await play(['Enter'])
    expect(snap().readout).toBe(OPEN)
    press(['Enter'])
    await run(400)
    expect(snap().readout).toBe(SHUT)
  })

  it('a click on the wheel opens it, and a click on the open door closes it', async () => {
    const { snap, inside, run } = await play()
    const wheel = inside.querySelector('[aria-label^="Wheel"]')!
    act(() => {
      wheel.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      window.dispatchEvent(new Event('pointerup'))
    })
    await run(400)
    expect(snap().readout).toBe(OPEN)
    act(() => void inside.querySelector('[aria-label="Close the door (Space)"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(400)
    expect(snap().readout).toBe(SHUT)
  })

  it('C changes what the vault holds: gold, cash, a single key', async () => {
    const { snap, press, run } = await play([' '])
    press(['c'])
    await run(100)
    expect(snap().state).toBe('CONTENTS · CASH')
    await run(2000)
    expect(snap().state).toBe('OPEN · CASH / SPACE CLOSES IT')
    press(['c'])
    await run(2000)
    expect(snap().state).toBe('OPEN · KEY / SPACE CLOSES IT')
  })

  it('in full motion it takes its time: the wheel, then the draw-out, then a heavy swing that settles open', async () => {
    const { snap, run } = await play([' '], 300, 'never')
    expect(snap().state).toBe('UNLOCKING / BOLTS DRAWING BACK')
    expect(snap().readout).toMatch(/^WHEEL \d+° · BOLTS (THROWN|MOVING) · DOOR 0°$/)
    await run(1200)
    expect(snap().state).toBe('UNLOCKED / DOOR DRAWING OUT')
    expect(snap().readout).toMatch(/^WHEEL 360° · BOLTS DRAWN · DOOR 0°$/)
    await run(1300)
    expect(snap().state).toBe('DOOR SWINGING OPEN')
    await run(4500)
    expect(snap().state).toBe('OPEN · GOLD / SPACE CLOSES IT')
    expect(snap().readout).toBe(OPEN)
  })

  it('Space mid-swing turns it back, and it comes to rest shut and bolted', async () => {
    const { snap, press, run } = await play([' '], 3000, 'never')
    expect(snap().state).toBe('DOOR SWINGING OPEN')
    press([' '])
    await run(300)
    expect(snap().state).toBe('DOOR SWINGING SHUT')
    await run(6000)
    expect(snap().readout).toBe(SHUT)
    expect(snap().state).toBe('LOCKED / SPACE OR THE WHEEL OPENS IT')
  })
})
