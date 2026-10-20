import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRepairBench, repairBench } from './repair-bench'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRepairBench, repairBench)

describe('RepairBench', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const checklist = (inside: ShadowRoot) => [...inside.querySelectorAll('text')].find((n) => n.textContent === 'SERVICE')!.parentElement!
  const lid = (inside: ShadowRoot) => [...inside.querySelectorAll('text')].find((n) => n.textContent === 'Li-ion 3.7 V')

  it('starts soldering in an indeterminate cycle, with the lamp on and drawer closed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench)
    await run(300)
    expect(handle().getSnapshot()).toMatchObject(repairBench.initial)
    expect(inside.querySelector('.pool')).toHaveStyle({ opacity: '1' })
    expect(lid(inside)).toBeTruthy()
    expect(inside.querySelector('.g .dcore')).toBeNull()
    await run(3500)
    expect(handle().getSnapshot().readout).toBe('CYCLE 01 · FASTEN · STEP 3/4')
    await run(8500)
    expect(handle().getSnapshot().readout).toBe('CYCLE 02 · INSPECT · STEP 1/4')
  })

  it('P advances the checks by quarters, waits for completion, and wraps back to zero', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    for (const [percent, checks, state] of [
      [25, 1, 'SOLDER · STEP 2 OF 4'],
      [50, 2, 'FASTEN · STEP 3 OF 4'],
      [75, 3, 'TEST · STEP 4 OF 4'],
      [100, 4, 'ALL CHECKS PASSED · AWAITING CLOSE'],
      [0, 0, 'INSPECT · STEP 1 OF 4'],
    ] as const) {
      act(() => handle().press('p'))
      await run(200)
      expect(handle().getSnapshot().readout).toBe(`PROGRESS ${percent}% · ${checks}/4 CHECKS`)
      expect(handle().getSnapshot().state).toBe(state)
      expect(handle().getSnapshot().pressed.i).toBe(false)
      expect(checklist(inside).querySelectorAll('.lamp.g')).toHaveLength(checks)
      expect(lid(inside)).toBeTruthy()
      expect(inside.querySelector('.g .dcore')).toBeNull()
    }
  })

  it('I holds the current step as progress and toggles the automatic cycle back on', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    act(() => handle().press('i'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({
      readout: 'PROGRESS 25% · 1/4 CHECKS', state: 'SOLDER · STEP 2 OF 4', pressed: { i: false },
    })
    act(() => handle().press('i'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject(repairBench.initial)
  })

  it('Enter parks the tools, closes the case and turns the beacon green', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    act(() => handle().press('enter'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({
      readout: 'PROGRESS 100% · CASE CLOSED', state: 'MAINTENANCE COMPLETE · BEACON GREEN', pressed: { i: false },
    })
    expect(lid(inside)).toBeUndefined()
    expect(inside.querySelector('.g .dcore')).toBeTruthy()
    expect(checklist(inside).querySelectorAll('.lamp.g')).toHaveLength(5)
  })

  it('L switches the magnifier light, its cone and its pool off and on', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    const lamp = inside.querySelector('[aria-label="Magnifier lamp: switch the light (L)"]')!
    for (const on of [false, true]) {
      act(() => handle().press('l'))
      await run(200)
      expect(handle().getSnapshot().pressed.l).toBe(on)
      expect(handle().getSnapshot().state).toBe(on ? 'LAMP ON · 5× LENS' : 'LAMP OFF')
      expect(lamp).toHaveAttribute('aria-pressed', String(on))
      expect(inside.querySelector('.pool')).toHaveStyle({ opacity: on ? '1' : '0' })
      expect(inside.querySelector('.cone')).toHaveStyle({ opacity: on ? '0.75' : '0' })
      expect(inside.querySelector('.ringlit')).toHaveStyle({ opacity: on ? '1' : '0' })
    }
  })

  it('D opens the top drawer to reveal screwdrivers and closes it again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    const drawer = inside.querySelector('[aria-label="Tool chest drawer: open or close (D)"]')!
    const closed = drawer.innerHTML
    act(() => handle().press('d'))
    await run(200)
    expect(handle().getSnapshot().pressed.d).toBe(true)
    expect(handle().getSnapshot().state).toBe('DRAWER OPEN · SCREWDRIVERS')
    expect(drawer).toHaveAttribute('aria-pressed', 'true')
    expect(drawer.querySelectorAll('.redf, .rubber, .grip')).toHaveLength(5)
    act(() => handle().press('d'))
    await run(200)
    expect(handle().getSnapshot().pressed.d).toBe(false)
    expect(handle().getSnapshot().state).toBe('DRAWER CLOSED')
    expect(drawer).toHaveAttribute('aria-pressed', 'false')
    expect(drawer.innerHTML).toBe(closed)
  })

  it('the handle sets progress, resumes indeterminate work, completes, and reopens for another repair', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRepairBench, { reducedMotion: 'always' })
    act(() => handle().setProgress(0.5))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 2/4 CHECKS')
    expect(handle().getSnapshot().state).toBe('FASTEN · STEP 3 OF 4')
    expect(handle().getSnapshot().pressed.i).toBe(false)
    expect(inside.querySelectorAll('.joint.shine')).toHaveLength(5)
    act(() => handle().setProgress(null))
    await run(200)
    expect(handle().getSnapshot().state).toBe('UNDER MAINTENANCE · INDETERMINATE')
    expect(handle().getSnapshot().pressed.i).toBe(true)
    act(() => handle().done())
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · CASE CLOSED')
    expect(handle().getSnapshot().state).toBe('MAINTENANCE COMPLETE · BEACON GREEN')
    act(() => handle().setProgress(0))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 0% · 0/4 CHECKS')
    expect(lid(inside)).toBeTruthy()
    expect(inside.querySelector('.g .dcore')).toBeNull()
  })

  it('progress and done props drive a still bench without interaction', async () => {
    const run = useFrames()
    const props = { interactive: false, autoPlay: false, reducedMotion: 'always' } as const
    const { handle, ref, rerender, host } = mount(MiniatureRepairBench, { ...props, progress: 0.25 })
    expect(host).toHaveAttribute('role', 'img')
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 25% · 1/4 CHECKS')
    rerender(<MiniatureRepairBench {...props} ref={ref} progress={0.75} />)
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · 3/4 CHECKS')
    rerender(<MiniatureRepairBench {...props} ref={ref} progress={0.75} done />)
    await run(200)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · CASE CLOSED')
    expect(handle().getSnapshot().state).toBe('MAINTENANCE COMPLETE · BEACON GREEN')
  })
})
