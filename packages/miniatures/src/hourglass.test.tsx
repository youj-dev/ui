import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureHourglass, type MiniatureHourglassHandle, hourglass } from './hourglass'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureHourglass, hourglass)

describe('Hourglass', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('runs on its own by default: indeterminate, turning over when it runs out', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHourglass)
    await run(300)
    expect(handle().getSnapshot().state).toBe('INDETERMINATE · SAND RUNNING')
    expect(handle().getSnapshot().readout).toMatch(/^TURN 1 · \d+ S LEFT$/)
    expect(handle().getSnapshot().pressed.i).toBe(true)
    await run(8000)
    expect(handle().getSnapshot().readout).toMatch(/^TURN 2 · /)
  })

  it('a progress prop makes it determinate, and the sand settles to it', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureHourglass, { reducedMotion: 'always' })
    rerender(<MiniatureHourglass ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50%')
    expect(handle().getSnapshot().pressed.i).toBe(false)
    rerender(<MiniatureHourglass ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75%')
  })

  it('done finishes it: the last sand runs through, it turns and comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureHourglass, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureHourglass ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toMatch(/^FINISHING/)
    await run(6000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    expect(handle().getSnapshot().state).toBe('COMPLETE · SAND AT REST')
  })

  it('the handle drives it too: setProgress, null for indeterminate again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureHourglassHandle>()
    const { rerender } = mount(MiniatureHourglass, { reducedMotion: 'always' })
    rerender(<MiniatureHourglass ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25%')
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().state).toBe('INDETERMINATE · SAND RUNNING')
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
  })

  it('P steps the progress by a quarter; I toggles indeterminate', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHourglass, { reducedMotion: 'always' })
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 25%')
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50%')
    act(() => handle().press('i'))
    await run(400)
    expect(handle().getSnapshot().pressed.i).toBe(true)
    expect(handle().getSnapshot().state).toBe('INDETERMINATE · SAND RUNNING')
  })

  it('F turns the glass over', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHourglass)
    await run(100)
    act(() => handle().press('f'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('INDETERMINATE · TURNING OVER')
    await run(3000)
    expect(handle().getSnapshot().state).toBe('INDETERMINATE · SAND RUNNING')
  })

  it('a still hourglass is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureHourglass, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50%')
  })
})
