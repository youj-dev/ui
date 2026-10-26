import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSushiConveyor, type MiniatureSushiConveyorHandle, type MiniatureSushiConveyorKey, sushiConveyor } from './sushi-conveyor'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSushiConveyor, sushiConveyor)

describe('Sushi conveyor', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (the belt holds still, every change jumps), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSushiConveyorKey[] = [], settle = 300) => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(50)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  type View = ReturnType<typeof mount>
  /** The plates riding the belt (the kitchen's are hidden), and the empty ones on your stacks. */
  const belt = (view: View) => [...view.inside.querySelectorAll<SVGGElement>('.plate')].filter((g) => g.style.display !== 'none')
  const stack = (view: View) => [...view.inside.querySelectorAll<SVGGElement>('[aria-label^="Your plates"] > g')].filter((g) => g.style.display !== 'none' && !g.querySelector('.focus-ring'))
  const poses = (view: View) => belt(view).map((g) => g.getAttribute('transform'))
  const part = (view: View, label: string) => view.inside.querySelector(`[aria-label^="${label}"]`) as SVGGElement
  const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

  it('rests serving: no plates taken yet, the belt at its usual speed', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(sushiConveyor.initial.readout)
    expect(snap().state).toBe(sushiConveyor.initial.state)
    expect(snap().pressed).toEqual(sushiConveyor.initial.pressed)
  })

  it('runs on its own: the plates glide round the belt', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor)
    await run(200)
    const before = poses(view)
    await run(800)
    expect(poses(view)).not.toEqual(before)
    expect(view.handle().getSnapshot().state).toBe('SERVING · SPACE TAKES THE FRONT PLATE')
  })

  it('holds the belt still when motion is reduced', async () => {
    const view = await play()
    const before = poses(view)
    const seams = view.inside.querySelector('.seams')!.getAttribute('d')
    await view.run(3000)
    expect(poses(view)).toEqual(before)
    expect(view.inside.querySelector('.seams')!.getAttribute('d')).toBe(seams)
  })

  it('Space takes the plate in front of you: it lands on your stack and the bill adds up by plate color', async () => {
    const view = await play([' '])
    expect(view.snap().readout).toBe('PLATES 01 · $3 · BELT 1.0×')
    expect(view.snap().state).toBe('TAKEN · SALMON · $3')
    expect(belt(view)).toHaveLength(7)
    expect(stack(view)).toHaveLength(1)
    expect(stack(view)[0]).toHaveClass('plb')
    act(() => view.handle().press(' '))
    await view.run(100)
    expect(view.snap().readout).toBe('PLATES 02 · $5 · BELT 1.0×')
    expect(view.snap().state).toBe('TAKEN · CUCUMBER ROLL · $2')
    expect(stack(view)).toHaveLength(2)
    await view.run(2000)
    expect(view.snap().state).toBe('SERVING · SPACE TAKES THE FRONT PLATE')
  })

  it('a click takes the plate clicked', async () => {
    const view = await play()
    const plate = belt(view).find((g) => g.classList.contains('plr'))!
    click(plate)
    await view.run(100)
    expect(view.snap().readout).toBe('PLATES 01 · $5 · BELT 1.0×')
    expect(view.snap().state).toBe('TAKEN · SALMON ROE · $5')
    expect(plate.style.display).toBe('none')
  })

  it('with motion, a taken plate flies to your stack and the empty plate lands there', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor)
    await run(100)
    act(() => view.handle().press(' '))
    await run(100)
    expect(stack(view)).toHaveLength(0)
    await run(800)
    expect(stack(view)).toHaveLength(1)
    expect(view.handle().getSnapshot().readout).toMatch(/^PLATES 01 · \$\d · BELT 1\.0×$/)
  })

  it('the arrows set the belt speed, down to a stop', async () => {
    const view = await play(['ArrowRight'])
    expect(view.snap().readout).toBe('PLATES 00 · $0 · BELT 1.5×')
    expect(view.snap().state).toBe('BELT 1.5× · FASTER')
    act(() => view.handle().press('ArrowRight'))
    await view.run(100)
    expect(view.snap().readout).toBe('PLATES 00 · $0 · BELT 2.0×')
    act(() => view.handle().press('ArrowRight'))
    await view.run(100)
    expect(view.snap().state).toBe('BELT AT FULL SPEED')
    for (let i = 0; i < 4; i++) {
      act(() => view.handle().press('ArrowLeft'))
      await view.run(100)
    }
    expect(view.snap().readout).toBe('PLATES 00 · $0 · BELT STOPPED')
    expect(view.snap().state).toBe('BELT STOPPED · → STARTS IT')
  })

  it('a stopped belt stands still until the arrow starts it again', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor)
    await run(100)
    act(() => view.handle().press('ArrowLeft'))
    act(() => view.handle().press('ArrowLeft'))
    await run(1500)
    const before = poses(view)
    await run(1000)
    expect(poses(view)).toEqual(before)
    act(() => view.handle().press('ArrowRight'))
    await run(1000)
    expect(poses(view)).not.toEqual(before)
  })

  it('O orders a fresh plate from the kitchen, which goes out where the belt has room', async () => {
    const view = await play(['o'])
    expect(view.snap().state).toBe('BELT FULL · TAKE A PLATE FIRST')
    expect(belt(view)).toHaveLength(8)
    act(() => view.handle().press(' '))
    await view.run(100)
    expect(belt(view)).toHaveLength(7)
    act(() => view.handle().press('o'))
    await view.run(100)
    expect(view.snap().state).toMatch(/^FRESH · /)
    expect(belt(view)).toHaveLength(8)
  })

  it('with motion, the fresh plate slides out of the kitchen window onto the belt', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor)
    await run(100)
    for (let i = 0; i < 3; i++) {
      act(() => view.handle().press(' '))
      await run(700)
    }
    act(() => view.handle().press('o'))
    await run(100)
    expect(view.handle().getSnapshot().state).toBe('ORDER IN · A FRESH PLATE IS COMING')
    await run(6000)
    expect(belt(view).length).toBeGreaterThanOrEqual(6)
  })

  it('C asks for the check: the bill is paid and your stack is cleared', async () => {
    const view = await play(['c'])
    expect(view.snap().state).toBe('NOTHING TO PAY · SPACE TAKES A PLATE')
    act(() => view.handle().press(' '))
    act(() => view.handle().press(' '))
    await view.run(100)
    expect(stack(view)).toHaveLength(2)
    act(() => view.handle().press('c'))
    await view.run(100)
    expect(view.snap().state).toBe('PAID $5 · THANK YOU')
    expect(view.snap().readout).toBe('PLATES 00 · $0 · BELT 1.0×')
    expect(stack(view)).toHaveLength(0)
  })

  it('its parts are buttons: the belt takes the front plate, the order screen orders, your stack pays', async () => {
    const view = await play()
    click(part(view, 'Conveyor belt'))
    await view.run(100)
    expect(view.snap().state).toBe('TAKEN · SALMON · $3')
    act(() => void part(view, 'Order screen').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    await view.run(100)
    expect(view.snap().state).toMatch(/^FRESH · /)
    click(part(view, 'Your plates'))
    await view.run(100)
    expect(view.snap().state).toBe('PAID $3 · THANK YOU')
  })

  it('a progress prop makes it determinate: the stack holds the progress, by the dozen', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureSushiConveyor, { reducedMotion: 'always' })
    rerender(<MiniatureSushiConveyor ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 06/12')
    expect(handle().getSnapshot().state).toBe('WAITING · 06/12 FOR 50%')
    rerender(<MiniatureSushiConveyor ref={ref} reducedMotion="always" progress={0.75} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · 09/12')
    rerender(<MiniatureSushiConveyor ref={ref} reducedMotion="always" progress={0.25} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 25% · 03/12')
  })

  it('with motion, the diner takes plates as they come round until the stack holds the progress', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor, { progress: 0.25 })
    await run(300)
    expect(view.handle().getSnapshot().readout).toMatch(/^PROGRESS 25% · 0[01]\/12$/)
    await run(8000)
    expect(view.handle().getSnapshot().readout).toBe('PROGRESS 25% · 03/12')
    expect(stack(view)).toHaveLength(3)
  })

  it('done finishes it: the last plates come off and the check comes', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureSushiConveyor, { progress: 0.5 })
    await run(300)
    rerender(<MiniatureSushiConveyor ref={ref} progress={0.5} done />)
    await run(300)
    expect(handle().getSnapshot().state).toMatch(/^FINISHING · \d+ TO GO$/)
    await run(20000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · 12/12')
    expect(handle().getSnapshot().state).toBe('COMPLETE · CHECK, PLEASE')
  })

  it('the handle drives it too: setProgress, null for free play again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureSushiConveyorHandle>()
    const { rerender } = mount(MiniatureSushiConveyor, { reducedMotion: 'always' })
    rerender(<MiniatureSushiConveyor ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · 03/12')
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toMatch(/^PLATES 03 · \$\d+ · BELT 1\.0×$/)
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · 12/12')
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · CHECK, PLEASE')
  })

  it('a still conveyor is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureSushiConveyor, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · 06/12')
  })

  it('draws once: the drawing keeps its node count through seconds of play and every interaction', async () => {
    const run = useFrames()
    const view = mount(MiniatureSushiConveyor)
    await run(500)
    const svg = view.svg()
    const nodes = svg.querySelectorAll('*').length
    await run(3000)
    expect(svg.querySelectorAll('*').length).toBe(nodes)
    for (const key of [' ', 'ArrowRight', 'ArrowRight', 'o', ' ', 'ArrowLeft', 'c', 'o', ' '] as const) {
      act(() => view.handle().press(key))
      await run(700)
      expect(svg.querySelectorAll('*').length).toBe(nodes)
    }
    click(belt(view)[0]!)
    click(part(view, 'Order screen'))
    click(part(view, 'Your plates'))
    await run(2000)
    expect(svg.querySelectorAll('*').length).toBe(nodes)
    act(() => view.handle().setProgress(0.5))
    await run(4000)
    act(() => view.handle().done())
    await run(6000)
    expect(svg.querySelectorAll('*').length).toBe(nodes)
  })
})
