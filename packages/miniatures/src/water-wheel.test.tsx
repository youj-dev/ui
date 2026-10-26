import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'
import { MiniatureWaterWheel, type MiniatureWaterWheelHandle, type MiniatureWaterWheelKey, waterWheel } from './water-wheel'

describeMiniature(MiniatureWaterWheel, waterWheel)

describe('Water wheel mill', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (every state jumps to its end), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureWaterWheelKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureWaterWheel, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(50)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const outside = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGGElement>('.sackout')].filter((g) => g.style.display !== 'none').length

  it('rests at its steady state with motion reduced: milling at 60% flow, the stone eight times the wheel', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(waterWheel.initial.readout)
    expect(snap().state).toBe(waterWheel.initial.state)
    expect(snap().pressed).toEqual(waterWheel.initial.pressed)
  })

  it('mills on its own: the wheel turns and the readout gives its speed, the stone’s and the output', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureWaterWheel)
    await run(1500)
    expect(handle().getSnapshot().state).toBe('MILLING · SLUICE 60% · SACK 2')
    expect(handle().getSnapshot().readout).toMatch(/^5\.9 RPM · STONE 47 RPM · 76 KG\/H$/)
  })

  it('Space shuts the sluice: the wheel runs on, coasts down and comes to rest', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureWaterWheel)
    await run(500)
    act(() => handle().press(' '))
    await run(1500)
    expect(handle().getSnapshot().state).toBe('SLUICE SHUT · WHEEL COASTING')
    const coasting = Number.parseFloat(handle().getSnapshot().readout)
    expect(coasting).toBeGreaterThan(1)
    expect(coasting).toBeLessThan(5.9)
    await run(18000)
    expect(handle().getSnapshot().state).toBe('SLUICE SHUT · SPACE OPENS IT')
    expect(handle().getSnapshot().readout).toBe('0.0 RPM · STONE 0 RPM · 0 KG/H')
  })

  it('Space opens it again: the wheel gathers way under the water’s weight', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureWaterWheel)
    await run(200)
    act(() => handle().press(' '))
    await run(20000)
    act(() => handle().press(' '))
    await run(600)
    expect(handle().getSnapshot().state).toMatch(/^(SLUICE OPENING|WHEEL STARTING) · /)
    const starting = Number.parseFloat(handle().getSnapshot().readout)
    expect(starting).toBeLessThan(3)
    await run(16000)
    expect(handle().getSnapshot().readout).toBe(waterWheel.initial.readout)
    expect(handle().getSnapshot().state).toMatch(/^MILLING · SLUICE 60% · SACK \d$/)
  })

  it.each([
    [['ArrowUp'], '7.2 RPM · STONE 58 RPM · 92 KG/H', 'MILLING · SLUICE 80% · SACK 2'],
    [['ArrowUp', 'ArrowUp'], '8.5 RPM · STONE 68 RPM · 109 KG/H', 'MILLING · SLUICE 100% · SACK 2'],
    [['ArrowDown'], '4.6 RPM · STONE 37 RPM · 59 KG/H', 'MILLING · SLUICE 40% · SACK 2'],
    [['ArrowDown', 'ArrowDown'], '3.3 RPM · STONE 26 RPM · 42 KG/H', 'MILLING · SLUICE 20% · SACK 2'],
    [['ArrowDown', 'ArrowDown', 'ArrowDown'], '0.0 RPM · STONE 0 RPM · 0 KG/H', 'SLUICE SHUT · SPACE OPENS IT'],
    [[' '], '0.0 RPM · STONE 0 RPM · 0 KG/H', 'SLUICE SHUT · SPACE OPENS IT'],
  ] as const)('%j sets the flow, and the wheel, stone and output follow', async (keys, readout, state) => {
    const { snap } = await play([...keys], 2000)
    expect(snap().readout).toBe(readout)
    expect(snap().state).toBe(state)
  })

  it('the arrows stop at full flow, and ArrowUp opens a shut sluice at the flow it had', async () => {
    const { handle, run, snap } = await play(['ArrowUp', 'ArrowUp'], 2000)
    act(() => handle().press('ArrowUp'))
    await run(100)
    expect(snap().state).toBe('FULL FLOW · SLUICE 100%')
    act(() => handle().press(' '))
    await run(2000)
    expect(snap().state).toBe('SLUICE SHUT · SPACE OPENS IT')
    act(() => handle().press('ArrowDown'))
    await run(100)
    expect(snap().state).toBe('SLUICE SHUT · ↑ OR SPACE OPENS IT')
    act(() => handle().press('ArrowUp'))
    await run(2000)
    expect(snap().readout).toBe('8.5 RPM · STONE 68 RPM · 109 KG/H')
  })

  it('the sluice gate is a button that opens and closes it', async () => {
    const { inside, run, snap } = await play()
    const gate = inside.querySelector<SVGGElement>('[aria-label^="Sluice gate"]')!
    expect(gate).toHaveAttribute('role', 'button')
    expect(gate).toHaveAttribute('aria-pressed', 'true')
    act(() => void gate.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(400)
    expect(gate).toHaveAttribute('aria-pressed', 'false')
    expect(snap().state).toBe('SLUICE SHUT · SPACE OPENS IT')
  })

  it('fills the sack under the spout and sets each full one outside', async () => {
    const run = useFrames()
    const { inside, handle } = mount(MiniatureWaterWheel)
    await run(300)
    expect(outside(inside)).toBe(1)
    await run(7000)
    expect(outside(inside)).toBe(2)
    expect(handle().getSnapshot().state).toBe('MILLING · SLUICE 60% · SACK 3')
  })

  it('P steps the progress by a quarter of the batch; past 100% it runs on its own again', async () => {
    const { handle, run, snap } = await play(['p'])
    expect(snap().readout).toBe('PROGRESS 25% · 5.9 RPM')
    act(() => handle().press('p'))
    await run(400)
    expect(snap().readout).toBe('PROGRESS 50% · 5.9 RPM')
    for (const _ of [1, 2]) {
      act(() => handle().press('p'))
      await run(200)
    }
    expect(snap().readout).toBe('PROGRESS 100% · 5.9 RPM')
    act(() => handle().press('p'))
    await run(400)
    expect(snap().readout).toBe(waterWheel.initial.readout)
  })

  it('a progress prop makes it determinate, and the sacks fill to it', async () => {
    const run = useFrames()
    const { handle, rerender, ref, inside } = mount(MiniatureWaterWheel, { reducedMotion: 'always' })
    rerender(<MiniatureWaterWheel ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 5.9 RPM')
    expect(outside(inside)).toBe(2)
    rerender(<MiniatureWaterWheel ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · 5.9 RPM')
    expect(outside(inside)).toBe(3)
  })

  it('done finishes it: the last sack fills, the sluice shuts and the wheel comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureWaterWheel, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureWaterWheel ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toMatch(/^FINISHING · SACK \d OF 4$/)
    await run(40000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    expect(handle().getSnapshot().state).toBe('COMPLETE · SACKS FULL')
  })

  it('the handle drives it too: setProgress, null for indeterminate again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureWaterWheelHandle>()
    const { rerender } = mount(MiniatureWaterWheel, { reducedMotion: 'always' })
    rerender(<MiniatureWaterWheel ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · 5.9 RPM')
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe(waterWheel.initial.readout)
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · SACKS FULL')
  })

  it('a still mill is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureWaterWheel, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 5.9 RPM')
  })

  it('redraws in place: the drawing never grows, through play and every key', async () => {
    const run = useFrames()
    const { svg, handle, rerender, ref } = mount(MiniatureWaterWheel)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const key of [' ', ' ', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'p', 'p', 'Enter'] as const) {
      act(() => handle().press(key))
      await run(700)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    rerender(<MiniatureWaterWheel ref={ref} progress={0.3} />)
    await run(4000)
    rerender(<MiniatureWaterWheel ref={ref} progress={0.3} done />)
    await run(30000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
