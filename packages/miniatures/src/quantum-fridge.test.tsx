import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureQuantumFridge, quantumFridge } from './quantum-fridge'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureQuantumFridge, quantumFridge)

describe('QuantumFridge', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const room = 'MXC 300 K · STILL 300 K · DAY 0.0'
  const base = 'MXC 9.8 mK · STILL 850 mK · DAY 1.9'

  async function atBase() {
    const run = useFrames()
    const view = mount(MiniatureQuantumFridge, { reducedMotion: 'always' })
    act(() => view.handle().press('o'))
    await run(100)
    act(() => view.handle().press('c'))
    await run(200)
    return { ...view, run }
  }

  it('starts at room temperature with the can open and the qubit idle', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureQuantumFridge)
    await run(300)
    expect(handle().getSnapshot()).toMatchObject({
      readout: room,
      state: 'CAN OPEN · O TO SEAL',
      pressed: { o: false, c: false },
    })
    expect(inside.querySelector('[aria-label="QELVA · OVC · 10⁻⁶ mbar: raise the vacuum can (O)"]')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--off)' })
    expect(inside.querySelectorAll('.shot')).toHaveLength(0)
    expect(inside.querySelector('.flow')).not.toHaveClass('on')
    expect(inside.textContent).toContain('|0⟩ 0 · |1⟩ 0')
  })

  it('O raises and seals the can, pumps it out, then lowers it back into the pit', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureQuantumFridge, { reducedMotion: 'always' })
    const can = inside.querySelector('[aria-label="QELVA · OVC · 10⁻⁶ mbar: raise the vacuum can (O)"]')!
    const open = can.querySelector('.hole')!.getAttribute('d')
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state: 'PUMPING THE CAN', pressed: { o: true, c: false } })
    expect(can).toHaveAttribute('aria-label', 'QELVA · OVC · 10⁻⁶ mbar: lower the vacuum can (O)')
    expect(can).toHaveAttribute('aria-pressed', 'true')
    expect(can.querySelector('.hole')!.getAttribute('d')).not.toBe(open)
    await run(3200)
    expect(handle().getSnapshot().state).toBe('SEALED · C TO COOL')
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state: 'CAN OPEN · O TO SEAL', pressed: { o: false } })
    expect(can).toHaveAttribute('aria-label', 'QELVA · OVC · 10⁻⁶ mbar: raise the vacuum can (O)')
    expect(can.querySelector('.hole')).toHaveAttribute('d', open)
  })

  it('C requires a sealed can before cooling', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureQuantumFridge, { reducedMotion: 'always' })
    act(() => handle().press('c'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state: 'SEAL THE CAN FIRST · O', pressed: { o: false, c: false } })
    await run(2000)
    expect(handle().getSnapshot().state).toBe('CAN OPEN · O TO SEAL')
  })

  it('C cools all five stages to base temperature and enables the qubit', async () => {
    const { handle, inside } = await atBase()
    expect(handle().getSnapshot()).toMatchObject({ readout: base, state: 'BASE TEMPERATURE · QUBIT |0⟩', pressed: { o: true, c: true } })
    expect(inside.querySelector('[aria-label="QELVA · DR–5 · 300 K: warm up (W)"]')).toBeTruthy()
    expect(inside.querySelector('.flow')).toHaveClass('on')
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--accent)', filter: 'url(#glow)' })
    const halos = [...inside.querySelectorAll<SVGElement>('.halo')]
    expect(halos).toHaveLength(5)
    expect(halos.every((halo) => Number(halo.style.getPropertyValue('--u')) > 0)).toBe(true)
    expect(inside.textContent).toContain('BASE 9.8 mK')
    expect(inside.textContent).toContain('1.8 kW')
  })

  it('O refuses to vent cold stages; W warms them so the can can be opened', async () => {
    const { handle, inside, run } = await atBase()
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: base, state: 'WARM UP FIRST · W', pressed: { o: true, c: true } })
    act(() => handle().press('w'))
    await run(2200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, pressed: { o: true, c: false } })
    expect(inside.querySelector('.flow')).not.toHaveClass('on')
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--off)' })
    expect(inside.querySelector<SVGElement>('.qb')!.style.filter).toBe('')
    expect(inside.querySelector('[aria-label="QELVA · DR–5 · 300 K: cool down (C)"]')).toBeTruthy()
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state: 'CAN OPEN · O TO SEAL', pressed: { o: false, c: false } })
  })

  it('W at room temperature reports that it is already warm', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureQuantumFridge, { reducedMotion: 'always' })
    act(() => handle().press('w'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state: 'ALREADY AT 300 K', pressed: { o: false, c: false } })
  })

  it.each([
    [' ', 'TOO WARM FOR READOUT · C'],
    ['x', 'TOO WARM FOR A π-PULSE · C'],
  ] as const)('%s refuses a pulse above 20 mK', async (key, state) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureQuantumFridge, { reducedMotion: 'always' })
    act(() => handle().press(key))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: room, state })
    expect(inside.querySelectorAll('.shot, .pg')).toHaveLength(0)
    expect(inside.textContent).toContain('|0⟩ 0 · |1⟩ 0')
  })

  it('X flips the qubit to one and back to zero, changing its visible color', async () => {
    const { handle, inside, run } = await atBase()
    act(() => handle().press('x'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: base, state: 'π-PULSE · QUBIT |1⟩' })
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--drive)' })
    await run(1900)
    expect(handle().getSnapshot().state).toBe('BASE TEMPERATURE · QUBIT |1⟩')
    act(() => handle().press('x'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('π-PULSE · QUBIT |0⟩')
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--accent)' })
  })

  it('Space measures the prepared state and plots each shot on the monitor', async () => {
    const { handle, inside, run } = await atBase()
    // The lab has a 5% readout error and random shot positions. Keep this
    // interaction deterministic without changing the figure's randomness.
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    act(() => handle().press('space'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({ readout: base, state: 'MEASURED |0⟩ · 1 SHOTS' })
    expect(inside.textContent).toContain('|0⟩ 1 · |1⟩ 0')
    expect(inside.querySelectorAll('.shot')).toHaveLength(1)
    expect(inside.querySelector('.shot')).toHaveStyle({ fill: 'var(--accent)' })
    act(() => handle().press('x'))
    await run(200)
    act(() => handle().press(' '))
    await run(200)
    expect(handle().getSnapshot().state).toBe('MEASURED |1⟩ · 2 SHOTS')
    expect(inside.textContent).toContain('|0⟩ 1 · |1⟩ 1')
    expect(inside.querySelectorAll('.shot')).toHaveLength(2)
    expect(inside.querySelectorAll('.shot')[1]).toHaveStyle({ fill: 'var(--drive)' })
  })

  it('preserves the lab’s occasional readout error without flipping the prepared qubit', async () => {
    const { handle, inside, run } = await atBase()
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    act(() => handle().press(' '))
    await run(200)
    expect(handle().getSnapshot().state).toBe('MEASURED |1⟩ · 1 SHOTS')
    expect(inside.textContent).toContain('|0⟩ 0 · |1⟩ 1')
    expect(inside.querySelector('.qb')).toHaveStyle({ fill: 'var(--accent)' })
    await run(2400)
    expect(handle().getSnapshot().state).toBe('BASE TEMPERATURE · QUBIT |0⟩')
  })
})
