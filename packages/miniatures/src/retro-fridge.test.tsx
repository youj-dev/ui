import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRetroFridge, retroFridge } from './retro-fridge'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRetroFridge, retroFridge)

describe('RetroFridge', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts idle at cold 3 with both doors closed, frost and a shopping note', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toMatchObject(retroFridge.initial)
    expect(inside.querySelectorAll('[aria-expanded=false]')).toHaveLength(2)
    expect(svg()).not.toHaveClass('run')
    expect(inside.querySelector('.pool')).toHaveStyle({ opacity: '0' })
    expect([...inside.querySelectorAll('.hand')].map((n) => n.textContent)).toEqual(['BUY MILK', '& EGGS', '— June'])
    expect(inside.querySelector('rect.frost')).toHaveAttribute('opacity', '0.28')
  })

  it.each([
    ['d', 'Fresh-food door: open or close (D)', 'DOOR OPEN · LIGHT ON'],
    ['f', 'Freezer door: open or close (F)', 'FREEZER OPEN'],
  ] as const)('%s opens and closes its door and moves its handle', async (key, label, state) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    const grip = inside.querySelector(`[aria-label="${label}"]`)!
    const closed = grip.getAttribute('transform')
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().pressed).toEqual({ d: key === 'd', f: key === 'f' })
    expect(handle().getSnapshot().state).toBe(`${state} · IDLE · FROST 30%`)
    expect(grip).toHaveAttribute('aria-expanded', 'true')
    expect(grip.getAttribute('transform')).not.toBe(closed)
    expect(inside.querySelector('.pool')).toHaveStyle({ opacity: key === 'd' ? '0.16' : '0' })
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().pressed).toEqual({ d: false, f: false })
    expect(handle().getSnapshot().state).toBe('IDLE · FROST 30%')
    expect(grip).toHaveAttribute('aria-expanded', 'false')
    expect(grip).toHaveAttribute('transform', closed!)
    expect(inside.querySelector('.pool')).toHaveStyle({ opacity: '0' })
  })

  it('reports both doors open when D and F are pressed together', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    act(() => {
      handle().press('d')
      handle().press('f')
    })
    await run(100)
    expect(handle().getSnapshot().pressed).toEqual({ d: true, f: true })
    expect(handle().getSnapshot().state).toBe('BOTH DOORS OPEN · IDLE · FROST 30%')
  })

  it('C cycles cold 3 through 4, 5, 1, 2 and back, starting the compressor at 4', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    for (const cold of [4, 5, 1, 2, 3]) {
      act(() => handle().press('c'))
      await run(100)
      expect(handle().getSnapshot().readout).toMatch(new RegExp(` · COLD ${cold}$`))
      if (cold === 4) {
        expect(handle().getSnapshot().state).toBe('COMPRESSOR RUNNING · FROST 30%')
        expect(svg()).toHaveClass('run')
      }
    }
  })

  it('T pauses the compressor, melts frost and can cancel defrost', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    act(() => handle().press('c'))
    await run(100)
    expect(svg()).toHaveClass('run')
    const frost = inside.querySelector('rect.frost')!
    const before = Number(frost.getAttribute('opacity'))
    act(() => handle().press('t'))
    await run(1000)
    expect(handle().getSnapshot().state).toMatch(/^DEFROSTING · FROST \d+%$/)
    expect(svg()).not.toHaveClass('run')
    expect(Number(frost.getAttribute('opacity'))).toBeLessThan(before)
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().state).toMatch(/^COMPRESSOR RUNNING · FROST \d+%$/)
    expect(svg()).toHaveClass('run')
  })

  it('defrost finishes with no frost left to melt', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    act(() => handle().press('t'))
    await run(3000)
    expect(handle().getSnapshot().state).toBe('IDLE · FROST 0%')
    expect(inside.querySelector('rect.frost')).toHaveAttribute('opacity', '0.00')
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('NO FROST TO MELT')
  })

  // The port report flags random drip phases (and optional note audio).
  // Preserve them: motion shows falling drops; reduced motion hides them.
  it.each(['never', 'always'] as const)('defrost drops respect reducedMotion=%s', async (reducedMotion) => {
    const run = useFrames()
    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    const { handle, inside } = mount(MiniatureRetroFridge, { reducedMotion })
    const drops = [...inside.querySelectorAll('.drop')]
    expect(drops).toHaveLength(5)
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().state).toMatch(/^DEFROSTING/)
    const positions = drops.map((n) => n.getAttribute('cy'))
    await run(100)
    if (reducedMotion === 'never') {
      expect(drops.every((n) => Number(n.getAttribute('opacity')) > 0)).toBe(true)
      expect(drops.map((n) => n.getAttribute('cy'))).not.toEqual(positions)
    } else {
      expect(drops.every((n) => n.getAttribute('opacity') === '0')).toBe(true)
    }
    act(() => handle().press('t'))
    await run(100)
    expect(drops.every((n) => n.getAttribute('opacity') === '0')).toBe(true)
  })

  it('N cycles all four notes, changing the paper and temporary state', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRetroFridge, { reducedMotion: 'always' })
    for (const lines of [
      ['PIE FOR', 'SUNDAY', '6 PM ♥'],
      ['DEFROST', 'FRIDAY!', ''],
      ['CALL MOM', 'KL5-0172', ''],
      ['BUY MILK', '& EGGS', '— June'],
    ]) {
      act(() => handle().press('n'))
      await run(100)
      expect([...inside.querySelectorAll('.hand')].map((n) => n.textContent)).toEqual(lines)
      expect(handle().getSnapshot().state).toBe(`NOTE · ${lines[0]} ${lines[1]}`)
    }
    await run(1800)
    expect(handle().getSnapshot().state).toBe('IDLE · FROST 30%')
  })
})
