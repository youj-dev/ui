import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureDrawbridge, type MiniatureDrawbridgeHandle, type MiniatureDrawbridgeKey, drawbridge } from './drawbridge'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureDrawbridge, drawbridge)

describe('Drawbridge', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const REST = drawbridge.initial.readout
  const OPEN = 'LEAVES 70° · BARRIERS DOWN · CANAL GREEN'

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureDrawbridgeKey[] = [], settle = 300, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureDrawbridge, { reducedMotion })
    await run(100)
    const press = (list: MiniatureDrawbridgeKey[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    return { ...view, run, press, snap: () => view.handle().getSnapshot() }
  }
  const lamps = (inside: ShadowRoot, c: string) => inside.querySelectorAll(`.lamp.${c}`).length

  it('starts closed with a boat waiting: road signals green, span lamps red', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(drawbridge.initial)
    expect(lamps(inside, 'g')).toBe(2)
    expect(lamps(inside, 'r')).toBe(2)
    expect(lamps(inside, 'a')).toBe(0)
  })

  it('Space approves: barriers down, leaves up, the boat through, then everything returns and the next boat comes up', async () => {
    const { snap, run, inside } = await play([' '])
    expect(snap().state).toBe('APPROVED · BARRIERS LOWERING')
    expect(snap().readout).toBe('LEAVES 0° · BARRIERS DOWN · CANAL RED')
    expect(lamps(inside, 'a')).toBe(1)
    await run(700)
    expect(snap().state).toBe('OPENING · LEAVES RISING')
    expect(snap().readout).toBe('LEAVES 70° · BARRIERS DOWN · CANAL RED')
    await run(800)
    expect(snap().state).toBe('OPEN · VESSEL PASSING')
    expect(snap().readout).toBe(OPEN)
    expect(lamps(inside, 'g')).toBe(2)
    await run(1500)
    expect(snap().state).toBe('CLOSING · LEAVES LOWERING')
    expect(snap().readout).toBe('LEAVES 0° · BARRIERS DOWN · CANAL RED')
    await run(900)
    expect(snap().state).toBe('CLOSING · BARRIERS LIFTING')
    expect(snap().readout).toBe(REST)
    await run(500)
    expect(snap().state).toBe('REQUEST · VESSEL ARRIVING')
    await run(800)
    expect(snap()).toEqual(drawbridge.initial)
  })

  it('in full motion the mechanics take their time: barriers, then a heavy lift, the boat, and back', async () => {
    const { snap, run } = await play([' '], 800, 'never')
    expect(snap().state).toBe('APPROVED · BARRIERS LOWERING')
    expect(snap().readout).toBe('LEAVES 0° · BARRIERS MOVING · CANAL RED')
    await run(2000)
    expect(snap().state).toBe('OPENING · LEAVES RISING')
    expect(snap().readout).toMatch(/^LEAVES ([1-9]|[1-6]\d)° · BARRIERS DOWN · CANAL RED$/)
    await run(3000)
    expect(snap().state).toBe('OPEN · VESSEL PASSING')
    expect(snap().readout).toBe(OPEN)
    await run(5000)
    expect(snap().state).toBe('CLOSING · LEAVES LOWERING')
    await run(2500)
    expect(snap().state).toBe('CLOSING · BARRIERS LIFTING')
    await run(1500)
    expect(snap().state).toBe('REQUEST · VESSEL ARRIVING')
    await run(3500)
    expect(snap()).toEqual(drawbridge.initial)
  })

  it('Space while it runs changes nothing', async () => {
    const { snap, press, run } = await play([' '], 1000)
    press([' '])
    await run(100)
    expect(snap().state).toBe('OPENING · LEAVES RISING')
  })

  it('Escape denies a waiting boat: it holds and sounds its horn, and the bridge stays closed', async () => {
    const { snap, run, inside } = await play(['Escape'])
    expect(snap().state).toBe('DENIED · VESSEL HOLDING')
    expect(snap().readout).toBe(REST)
    expect([...inside.querySelectorAll<SVGElement>('.horn')].some((h) => Number(h.style.opacity) > 0)).toBe(true)
    await run(2200)
    expect(snap()).toEqual(drawbridge.initial)
  })

  it('Escape during the opening takes it back: the leaves come down and the barriers lift, the boat still waiting', async () => {
    const { snap, press, run } = await play([' '], 2500, 'never')
    expect(snap().state).toBe('OPENING · LEAVES RISING')
    press(['Escape'])
    await run(300)
    expect(snap().state).toBe('DENIED · LEAVES LOWERING')
    await run(3600)
    expect(snap().state).toBe('DENIED · BARRIERS LIFTING')
    await run(2000)
    expect(snap()).toEqual(drawbridge.initial)
  })

  it('a click on the control tower approves', async () => {
    const { snap, inside, run } = await play()
    act(() => void inside.querySelector('[aria-label^="Control tower"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('APPROVED · BARRIERS LOWERING')
  })

  it('a progress prop makes it a progress indicator: the opening follows it', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureDrawbridge, { reducedMotion: 'always' })
    rerender(<MiniatureDrawbridge ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · LEAVES 26°')
    expect(handle().getSnapshot().state).toBe('OPENING · LEAVES RISING')
    rerender(<MiniatureDrawbridge ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · LEAVES 48°')
  })

  it('done finishes it: the leaves open fully, the boat passes and the bridge comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureDrawbridge, { progress: 0.4 })
    await run(3000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 40% · LEAVES 18°')
    rerender(<MiniatureDrawbridge ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('OPENING · LEAVES RISING')
    await run(4000)
    expect(handle().getSnapshot().state).toBe('OPEN · VESSEL PASSING')
    await run(12000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    expect(handle().getSnapshot().state).toBe('COMPLETE · VESSEL THROUGH')
  })

  it('the handle drives it too: setProgress, null for a request again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureDrawbridgeHandle>()
    const { rerender } = mount(MiniatureDrawbridge, { reducedMotion: 'always' })
    rerender(<MiniatureDrawbridge ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · LEAVES 4°')
    act(() => ref.current!.setProgress(null))
    await run(2000)
    expect(ref.current!.getSnapshot()).toEqual(drawbridge.initial)
    act(() => ref.current!.done())
    await run(5000)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
  })

  it('P steps the progress by a quarter, and Space finishes it', async () => {
    const { snap, press, run } = await play(['p'])
    expect(snap().readout).toBe('PROGRESS 25% · LEAVES 4°')
    press(['p'])
    await run(300)
    expect(snap().readout).toBe('PROGRESS 50% · LEAVES 26°')
    press([' '])
    await run(5000)
    expect(snap().state).toBe('COMPLETE · VESSEL THROUGH')
  })

  it('a progress set while a boat is passing waits for the bridge to close, then opens to it with the next boat waiting', async () => {
    const { snap, handle, run } = await play([' '], 1800)
    expect(snap().state).toBe('OPEN · VESSEL PASSING')
    act(() => handle().setProgress(0.5))
    await run(3500)
    expect(snap().readout).toBe('PROGRESS 50% · LEAVES 26°')
    act(() => handle().done())
    await run(5000)
    expect(snap().state).toBe('COMPLETE · VESSEL THROUGH')
  })

  it('a still drawbridge is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureDrawbridge, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · LEAVES 26°')
  })

  it('redraws its moving parts in place: the drawing never grows, through the whole cycle and every key', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureDrawbridge)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    act(() => handle().press(' '))
    for (let i = 0; i < 10; i++) {
      await run(2000)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    for (const key of ['Escape', ' ', 'Escape', 'p', 'p', ' '] as const) {
      act(() => handle().press(key))
      await run(1500)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    await run(20000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
