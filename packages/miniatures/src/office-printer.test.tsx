import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureOfficePrinter, type MiniatureOfficePrinterHandle, officePrinter } from './office-printer'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureOfficePrinter, officePrinter)

describe('OfficePrinter', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const pages = (inside: ShadowRoot) => inside.querySelectorAll('.page')
  const panel = (inside: ShadowRoot) => inside.querySelector('[aria-label="Print a report (P)"]')!
  const lid = (inside: ShadowRoot) => inside.querySelector('[aria-label$="the scanner lid (L)"]')!
  const drawer = (inside: ShadowRoot, n: number) => inside.querySelector(`[aria-label$="paper drawer ${n} (${n})"]`)!
  const binned = (inside: ShadowRoot) => [...inside.querySelectorAll('[clip-path="url(#binClip)"] > g')].filter((g) => (g as SVGElement).style.display !== 'none')

  it('starts ready, with its counter, the lid down, an empty output tray and its drawers in', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter)
    await run(100)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'READY · COUNTER 04816', state: 'READY · LID CLOSED', pressed: {} })
    expect(panel(inside).textContent).toContain('READY')
    expect(pages(inside)).toHaveLength(0)
    expect(lid(inside)).toHaveAttribute('aria-pressed', 'false')
    for (const n of [1, 2, 3]) expect(drawer(inside, n)).toHaveAttribute('aria-label', `Pull out paper drawer ${n} (${n})`)
    expect(binned(inside)).toHaveLength(2)
  })

  it('P prints a six-page report into the output tray and counts the pages', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'always' })
    act(() => handle().press('p'))
    await run(100)
    expect(pages(inside)).toHaveLength(6)
    expect(handle().getSnapshot().readout).toBe('READY · COUNTER 04822')
    expect(handle().getSnapshot().state).toBe('DONE · 06 PAGES · REPORT')
    expect(panel(inside).textContent).toContain('DONE')
  })

  it('feeds the pages one by one while the exit rollers turn, then comes to rest', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    const tread = inside.querySelector('.tread')!
    const rest = tread.getAttribute('y1')
    act(() => handle().press('p'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('PROCESSING · REPORT')
    await run(1000)
    expect(handle().getSnapshot().state).toBe('PRINTING · REPORT · TRAY 1')
    expect(handle().getSnapshot().readout).toBe('PAGE 00/06 · COUNTER 04816')
    expect(pages(inside)).toHaveLength(1)
    expect(tread.getAttribute('y1')).not.toBe(rest)
    expect(panel(inside).textContent).toContain('PRINTING')
    await run(2400)
    expect(handle().getSnapshot().readout).toMatch(/^PAGE 0[23]\/06 · COUNTER 0481[89]$/)
    await run(5000)
    expect(pages(inside)).toHaveLength(6)
    expect(handle().getSnapshot().readout).toBe('READY · COUNTER 04822')
    expect(handle().getSnapshot().state).toBe('DONE · 06 PAGES · REPORT')
    await run(2000)
    expect(handle().getSnapshot().state).toBe('READY · LID CLOSED')
  })

  it('a second report queues behind the first, and each job lands offset from the last', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    act(() => handle().press('p'))
    act(() => handle().press('p'))
    await run(1300)
    expect(handle().getSnapshot().state).toBe('PRINTING · REPORT · TRAY 1 · 1 QUEUED')
    await run(16000)
    expect(pages(inside)).toHaveLength(12)
    const left = (p: Element) => Number(p.getAttribute('d')!.slice(1).split(',')[0])
    const [first, last] = [pages(inside)[0]!, pages(inside)[11]!]
    expect(Math.abs(left(first) - left(last))).toBeGreaterThan(3)
  })

  it('C copies the original: the light bar sweeps under the glass, then one page prints', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    const bar = inside.querySelector('.scanbar')!.parentElement as unknown as SVGGElement
    act(() => handle().press('c'))
    await run(1000)
    expect(handle().getSnapshot().state).toBe('COPYING · SCANNING THE ORIGINAL')
    expect(Number(bar.style.opacity)).toBeGreaterThan(0.5)
    const at = bar.getAttribute('transform')
    await run(300)
    expect(bar.getAttribute('transform')).not.toBe(at)
    await run(3000)
    expect(pages(inside)).toHaveLength(1)
    expect(handle().getSnapshot().state).toBe('DONE · 01 PAGE · COPY')
    expect(Number(bar.style.opacity)).toBe(0)
  })

  it('L lifts the lid, the light bar sweeps under the glass, and L lowers it again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    const closed = lid(inside).innerHTML
    act(() => handle().press('l'))
    await run(1400)
    expect(lid(inside)).toHaveAttribute('aria-pressed', 'true')
    expect(lid(inside)).toHaveAttribute('aria-label', 'Lower the scanner lid (L)')
    expect(lid(inside).innerHTML).not.toBe(closed)
    expect(handle().getSnapshot().state).toBe('SCANNING · LID OPEN')
    await run(1500)
    expect(handle().getSnapshot().state).toBe('READY · LID OPEN')
    act(() => handle().press('l'))
    await run(1500)
    expect(handle().getSnapshot().state).toBe('READY · LID CLOSED')
    expect(lid(inside)).toHaveAttribute('aria-pressed', 'false')
    expect(lid(inside).innerHTML).toBe(closed)
  })

  it('1–3 pull a drawer out to show its ream, and push it back in', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    await run(100)
    const plate = drawer(inside, 3)
    const shut = plate.getAttribute('transform')
    expect(inside.querySelectorAll('.ream')).toHaveLength(0)
    act(() => handle().press('3'))
    await run(1200)
    expect(handle().getSnapshot().state).toBe('DRAWER 3 OUT · A3 REAM')
    expect(plate).toHaveAttribute('aria-pressed', 'true')
    expect(plate).toHaveAttribute('aria-label', 'Push in paper drawer 3 (3)')
    expect(plate.getAttribute('transform')).not.toBe(shut)
    expect(inside.querySelectorAll('.ream').length).toBeGreaterThan(0)
    act(() => handle().press('3'))
    await run(1200)
    expect(handle().getSnapshot().state).toBe('READY · LID CLOSED')
    expect(plate.getAttribute('transform')).toBe(shut)
    expect(inside.querySelectorAll('.ream')).toHaveLength(0)
  })

  it('with drawers 1 and 2 both out it waits for paper, then feeds from the one pushed back', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOfficePrinter, { reducedMotion: 'always' })
    act(() => handle().press('1'))
    act(() => handle().press('2'))
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('CLOSE DRAWER 1 OR 2 TO FEED')
    expect(handle().getSnapshot().readout).toBe('PAGE 00/06 · COUNTER 04816')
    act(() => handle().press('2'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('DONE · 06 PAGES · REPORT')
  })

  it('every third report jams; D opens the side door, the sheet goes in the bin and the job carries on', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'always' })
    for (const _ of [1, 2, 3]) act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('PAPER JAM · OPEN SIDE DOOR · D')
    expect(handle().getSnapshot().readout).toBe('PAGE 02/06 · COUNTER 04830')
    expect(pages(inside)).toHaveLength(2)
    expect(panel(inside).textContent).toContain('PAPER JAM')
    expect(binned(inside)).toHaveLength(2)
    act(() => handle().press('d'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('JAM CLEARED · READY')
    expect(binned(inside)).toHaveLength(3)
    expect(pages(inside)).toHaveLength(6)
    await run(1600)
    expect(handle().getSnapshot().state).toBe('DONE · 06 PAGES · REPORT')
    expect(handle().getSnapshot().readout).toBe('READY · COUNTER 04834')
  })

  it('D swings the side door open on the paper path and shuts it again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureOfficePrinter, { reducedMotion: 'never' })
    const door = inside.querySelector('[aria-label^="Open the side door"]')!
    const shut = door.innerHTML
    act(() => handle().press('d'))
    await run(600)
    expect(handle().getSnapshot().state).toBe('SIDE DOOR OPEN · PATH CLEAR')
    expect(door.innerHTML).not.toBe(shut)
    expect(door.querySelector('.rubber')).not.toBeNull()
    await run(1200)
    expect(handle().getSnapshot().state).toBe('READY · LID CLOSED')
    expect(door.innerHTML).toBe(shut)
  })

  it('a progress prop makes it determinate: the export prints up to it', async () => {
    const run = useFrames()
    const { handle, inside, rerender, ref } = mount(MiniatureOfficePrinter, { reducedMotion: 'always' })
    rerender(<MiniatureOfficePrinter ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 05/10 PAGES')
    expect(handle().getSnapshot().state).toBe('EXPORT · WAITING AT 50%')
    expect(pages(inside)).toHaveLength(5)
    rerender(<MiniatureOfficePrinter ref={ref} reducedMotion="always" progress={0.8} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 80% · 08/10 PAGES')
    expect(pages(inside)).toHaveLength(8)
  })

  it('done finishes the export: the last pages print and the panel turns green', async () => {
    const run = useFrames()
    const { handle, inside, rerender, ref } = mount(MiniatureOfficePrinter, { progress: 0.3 })
    await run(5000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 30% · 03/10 PAGES')
    rerender(<MiniatureOfficePrinter ref={ref} progress={0.3} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('FINISHING · EXPORT')
    await run(8000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · 10/10 PAGES')
    expect(handle().getSnapshot().state).toBe('COMPLETE · EXPORT DELIVERED')
    expect(pages(inside)).toHaveLength(10)
    expect(inside.querySelector('.ok')?.textContent).toContain('COMPLETE')
  })

  it('the handle drives it too: setProgress, null for indeterminate, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureOfficePrinterHandle>()
    const { rerender } = mount(MiniatureOfficePrinter, { reducedMotion: 'always' })
    rerender(<MiniatureOfficePrinter ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · 02/10 PAGES')
    act(() => ref.current!.setProgress(null))
    await run(4000)
    expect(ref.current!.getSnapshot().state).toBe('EXPORTING · INDETERMINATE')
    expect(ref.current!.getSnapshot().readout).toMatch(/^EXPORTING · \d\d\/10 PAGES$/)
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · 10/10 PAGES')
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · EXPORT DELIVERED')
  })

  it('a still printer is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureOfficePrinter, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 05/10 PAGES')
  })
})
