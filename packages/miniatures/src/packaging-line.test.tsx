import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniaturePackagingLine, type MiniaturePackagingLineHandle, packagingLine } from './packaging-line'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniaturePackagingLine, packagingLine)

describe('PackagingLine', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('runs on its own by default: indeterminate, a pallet filling at 30 a minute', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'PALLET 05/12 · 30 /MIN', state: 'RUNNING · INDETERMINATE', pressed: { i: true, ' ': false } })
  })

  it('a progress prop makes it determinate: the pallet holds the share and waits for the next', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniaturePackagingLine, { reducedMotion: 'always', progress: 0.5 })
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/^PROGRESS 50% · \d\d\/12$/)
    expect(handle().getSnapshot().pressed.i).toBe(false)
    rerender(<MiniaturePackagingLine ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/^PROGRESS 75% · /)
    expect(handle().getSnapshot().state).toMatch(/^WAITING|^RUNNING/)
  })

  it('done wraps the pallet: the stack is complete and the light turns green', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniaturePackagingLine, { reducedMotion: 'always', progress: 0.4 })
    await run(300)
    rerender(<MiniaturePackagingLine ref={ref} reducedMotion="always" progress={0.4} done />)
    await run(1000)
    expect(handle().getSnapshot()).toEqual({ readout: 'PROGRESS 100% · 12/12', state: 'COMPLETE · PALLET WRAPPED', pressed: { i: false, ' ': false } })
  })

  it('the handle drives it too: setProgress, null for indeterminate again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniaturePackagingLineHandle>()
    const { rerender } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    rerender(<MiniaturePackagingLine ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · 03/12')
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().state).toBe('RUNNING · INDETERMINATE')
    act(() => ref.current!.done())
    await run(1000)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · 12/12')
  })

  it('P steps the progress by a quarter: 25%, 3 of 12', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'PROGRESS 25% · 03/12', state: 'WAITING · 3/12 FOR 25%', pressed: { i: false, ' ': false } })
  })

  it('I toggles between a determinate share and running indeterminate', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('i'))
    await run(400)
    expect(handle().getSnapshot().pressed.i).toBe(false)
    expect(handle().getSnapshot().readout).toMatch(/^PROGRESS \d+% · /)
    act(() => handle().press('i'))
    await run(400)
    expect(handle().getSnapshot()).toMatchObject({ state: 'RUNNING · INDETERMINATE', pressed: { i: true } })
  })

  it('Enter finishes it: PALLET WRAPPED at 100%', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('enter'))
    await run(1000)
    expect(handle().getSnapshot()).toEqual({ readout: 'PROGRESS 100% · 12/12', state: 'COMPLETE · PALLET WRAPPED', pressed: { i: false, ' ': false } })
  })

  it('Space stops the line at 0 a minute and runs it again', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePackagingLine, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('space'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'PALLET 05/12 · 0 /MIN', state: 'STOPPED · SPACE TO RUN', pressed: { i: true, ' ': true } })
    act(() => handle().press('space'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'PALLET 05/12 · 30 /MIN', state: 'RUNNING · INDETERMINATE', pressed: { i: true, ' ': false } })
  })

  it('a still line is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniaturePackagingLine, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/^PROGRESS 50% · /)
  })
})
