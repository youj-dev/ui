import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureCuckooClock, cuckooClock } from './cuckoo-clock'
import { installAudio, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCuckooClock, cuckooClock)

describe('CuckooClock', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const clock = () => {
    // Set the epoch before installing frames so each run has the same frame alignment.
    vi.setSystemTime(new Date(2026, 0, 1, 10, 15, 20))
    return useFrames()
  }

  it('starts at local time, running with partially wound weights and the bird inside', async () => {
    const run = clock()
    const { handle, inside } = mount(MiniatureCuckooClock)
    await run(100)
    expect(handle().getSnapshot().readout).toBe('10:15:20')
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 82% / 90%')
    expect(handle().getSnapshot().pressed).toEqual({ ' ': false, f: false })
    expect(inside.querySelector('.inner')).toHaveAttribute('style', 'opacity:0')
    expect(inside.querySelector('.beak')).toBeNull()
    await run(1000)
    expect(handle().getSnapshot().readout).toBe('10:15:21')
  })

  it('Space stops the pendulum and holds the time; a second press starts it again', async () => {
    const run = clock()
    const { handle, inside } = mount(MiniatureCuckooClock, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('space'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('STOPPED')
    expect(handle().getSnapshot().pressed[' ']).toBe(true)
    const held = handle().getSnapshot().readout
    expect(inside.querySelector('.leaf')!.parentElement).toHaveAttribute('transform', 'rotate(0)')
    await run(2000)
    expect(handle().getSnapshot().readout).toBe(held)
    act(() => handle().press(' '))
    await run(1100)
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 82% / 90%')
    expect(handle().getSnapshot().pressed[' ']).toBe(false)
    expect(handle().getSnapshot().readout).toBe('10:15:21')
  })

  it('H advances to the next hour, opens the door and calls eleven times before the bird returns', async () => {
    const run = clock()
    const { handle, inside } = mount(MiniatureCuckooClock, { reducedMotion: 'always' })
    act(() => handle().press('h'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('11:00:00')
    expect(handle().getSnapshot().state).toBe('CUCKOO 0 OF 11')
    expect(inside.querySelector('.inner')).toHaveAttribute('style', 'opacity:0.75')
    expect(inside.querySelectorAll('.beak')).toHaveLength(2)
    await run(650)
    expect(handle().getSnapshot().state).toBe('CUCKOO 1 OF 11')
    await run(9000)
    expect(handle().getSnapshot().state).toBe('CUCKOO 10 OF 11')
    await run(1300)
    expect(handle().getSnapshot().state).toBe('CUCKOO 11 OF 11')
    await run(800)
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 79% / 77%')
    expect(inside.querySelector('.inner')).toHaveAttribute('style', 'opacity:0')
    expect(inside.querySelector('.beak')).toBeNull()
  })

  it('W winds both weights upward and restarts a stopped clock', async () => {
    const run = clock()
    const { handle, inside } = mount(MiniatureCuckooClock)
    await run(100)
    const weights = [...new Set([...inside.querySelectorAll('.cone')].map((cone) => cone.parentElement!))]
    const before = weights.map((weight) => weight.getAttribute('transform'))
    act(() => handle().press('space'))
    act(() => handle().press('w'))
    await run(1500)
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 100% / 100%')
    expect(handle().getSnapshot().pressed[' ']).toBe(false)
    expect(weights.map((weight) => weight.getAttribute('transform'))).not.toEqual(before)
    for (const weight of weights) {
      expect(Number(weight.getAttribute('transform')!.match(/translate\(0 ([^)]+)\)/)![1])).toBeCloseTo(12, 2)
    }
  })

  it('W shows winding while the running weights travel', async () => {
    const run = clock()
    const { handle } = mount(MiniatureCuckooClock)
    act(() => handle().press('w'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('WINDING')
    await run(1400)
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 100% / 100%')
  })

  it('F makes a second advance a minute, then toggles back to normal speed', async () => {
    const run = clock()
    const { handle } = mount(MiniatureCuckooClock, { reducedMotion: 'always' })
    const seconds = () => handle().getSnapshot().readout.split(' · ')[0]!.split(':').reduce((time, part) => time * 60 + Number(part), 0)
    await run(100)
    const normal = seconds()
    act(() => handle().press('f'))
    await run(1000)
    // A frame can land just before the second boundary, and the readout rounds down.
    expect(seconds() - normal).toBeGreaterThanOrEqual(58)
    expect(seconds() - normal).toBeLessThanOrEqual(61)
    expect(handle().getSnapshot().readout).toMatch(/^10:16:\d\d · ×60$/)
    expect(handle().getSnapshot().state).toBe('RUNNING · WEIGHTS 82% / 90%')
    expect(handle().getSnapshot().pressed.f).toBe(true)
    const spedUp = seconds()
    act(() => handle().press('f'))
    await run(1000)
    expect(seconds() - spedUp).toBeGreaterThanOrEqual(0)
    expect(seconds() - spedUp).toBeLessThanOrEqual(2)
    expect(handle().getSnapshot().readout).not.toContain('×60')
    expect(handle().getSnapshot().pressed.f).toBe(false)
  })

  it('random sound noise changes neither the drawing nor the clock state', async () => {
    // The port report flags three Math.random calls: breath noise, its offset, and winding pitch.
    const audio = installAudio()
    try {
      const random = vi.spyOn(Math, 'random')
      const pictures = []
      for (const noise of [0.1, 0.9]) {
        const run = clock()
        random.mockReturnValue(noise)
        const { handle, svg, unmount } = mount(MiniatureCuckooClock, { sound: true, reducedMotion: 'always' })
        act(() => handle().press('h'))
        act(() => handle().press('w'))
        await run(1000)
        pictures.push({ drawing: svg().querySelector('g')!.innerHTML, snapshot: handle().getSnapshot() })
        unmount()
        vi.useRealTimers()
      }
      expect(audio.created).toHaveLength(2)
      expect(random).toHaveBeenCalled()
      expect(pictures[1]).toEqual(pictures[0])
    } finally {
      audio.uninstall()
    }
  })
})
