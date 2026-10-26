import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureElevator, type MiniatureElevatorHandle, type MiniatureElevatorKey, elevator } from './elevator'
import type { MiniatureReducedMotion } from './engine/types'
import { installAudio, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureElevator, elevator)

describe('Elevator', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion by default: no travel, no rides of its own), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureElevatorKey[] = [], { settle = 300, reducedMotion = 'always' as MiniatureReducedMotion } = {}) => {
    const run = useFrames()
    const view = mount(MiniatureElevator, { reducedMotion })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    const part = (label: string) => view.inside.querySelector(`[aria-label^="${label}"]`) as SVGElement
    const lamp = (label: string) => part(label).querySelector('.cb')!.getAttribute('class')
    const lanterns = () => [...view.inside.querySelectorAll('.lan')].map((n) => n.getAttribute('class')).filter((c) => c !== 'lan')
    const needle = () =>
      Number(
        view.inside
          .querySelector('.needle')!
          .parentElement!.getAttribute('transform')!
          .match(/rotate\((-?[\d.]+)\)/)![1],
      )
    return { ...view, run, part, lamp, lanterns, needle, snap: () => view.handle().getSnapshot() }
  }
  const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

  it('rests at the lobby with its doors closed when motion is reduced', async () => {
    const { snap, needle } = await play()
    expect(snap()).toEqual(elevator.initial)
    expect(needle()).toBe(-162)
  })

  it('a number key sends the cab to that floor: the dials point to it and the doors open', async () => {
    const { snap, needle } = await play(['3'], { settle: 1800 })
    expect(snap()).toEqual({ readout: '3 · IDLE', state: 'DOORS OPEN', pressed: {} })
    expect(needle()).toBe(-90)
  })

  it('then the doors close by themselves and it waits there', async () => {
    const { run, snap } = await play(['3'])
    await run(3200)
    expect(snap()).toEqual({ readout: '3 · IDLE', state: 'IDLE · DOORS CLOSED', pressed: {} })
  })

  it('with reduced motion the cab jumps between floors and the doors jump open, without travel', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('5'))
    const seen = new Set<string>()
    for (let i = 0; i < 8; i++) {
      await run(16)
      seen.add(handle().getSnapshot().readout.split(' ')[0]!)
      const widths = [...inside.querySelectorAll('rect.leaf')].map((r) => Number(r.getAttribute('width'))).filter((w) => w > 0 && w < 6.5)
      expect(widths).toEqual([])
    }
    expect([...seen]).toEqual(['5'])
  })

  it('in full motion the indicator counts the floors as the cab travels', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    act(() => handle().press('5'))
    const floors: string[] = []
    for (let i = 0; i < 60; i++) {
      await run(80)
      const f = handle().getSnapshot().readout.split(' ')[0]!
      if (floors[floors.length - 1] !== f) floors.push(f)
    }
    expect(floors).toEqual(['1', '2', '3', '4', '5'])
    expect(handle().getSnapshot().readout).toBe('5 · IDLE')
  })

  it('it speeds up and slows down smoothly: the dial sweeps slowly, then fast, then slowly', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    const angle = () =>
      Number(
        inside
          .querySelector('.needle')!
          .parentElement!.getAttribute('transform')!
          .match(/rotate\((-?[\d.]+)\)/)![1],
      )
    act(() => handle().press('5'))
    const steps: number[] = []
    let last = angle()
    for (let i = 0; i < 26; i++) {
      await run(160)
      const a = angle()
      steps.push(a - last)
      last = a
    }
    const moving = steps.filter((s) => s > 0.01)
    const fastest = Math.max(...moving)
    expect(moving[0]).toBeLessThan(fastest / 2)
    expect(moving[moving.length - 1]).toBeLessThan(fastest / 2)
    expect(last).toBeCloseTo(-18, 1)
  })

  it('the readout shows the floor, the direction and the queue', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    act(() => handle().press('5'))
    act(() => handle().press('3'))
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '1 ▲ · NEXT 3, 5', state: 'CAR CALL · FLOOR 3', pressed: {} })
    await run(1500)
    expect(handle().getSnapshot().readout).toMatch(/^[23] ▲ · NEXT 3, 5$/)
    expect(handle().getSnapshot().state).toBe('GOING UP')
  })

  it('collects calls on the way: it stops at 3 before going on to 5', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    act(() => handle().press('5'))
    await run(400)
    act(() => handle().press('3'))
    await run(2600)
    expect(handle().getSnapshot().readout).toBe('3 ▲ · NEXT 5')
    expect(handle().getSnapshot().state).toMatch(/^ARRIVED · DOORS OPENING|^DOORS OPEN$/)
    await run(8000)
    expect(handle().getSnapshot().readout).toBe('5 · IDLE')
  })

  it('↑ presses the up button on the floor above, which stays lit until the cab comes', async () => {
    const { run, snap, lamp, lanterns, handle } = await play([], { reducedMotion: 'never' })
    act(() => handle().press('ArrowUp'))
    await run(16)
    expect(lamp('Floor 2: call the cab to go up')).toBe('cb on')
    expect(snap()).toEqual({ readout: '1 ▲ · NEXT 2', state: 'CALL ▲ · FLOOR 2', pressed: {} })
    await run(3000)
    expect(lamp('Floor 2: call the cab to go up')).toBe('cb')
    expect(snap().readout).toBe('2 · IDLE')
    expect(lanterns()).toEqual(['lan up'])
  })

  it('the hall lantern goes out with the doors: opened again later, the doors show no direction', async () => {
    const { run, lanterns, handle } = await play(['ArrowUp'])
    expect(lanterns()).toEqual(['lan up'])
    await run(3200)
    expect(lanterns()).toEqual([])
    act(() => handle().press('o'))
    await run(100)
    expect(lanterns()).toEqual([])
  })

  it('↑ again lights the next floor up, and ↓ the next floor down, round from the bottom to the top', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown'] as const) act(() => handle().press(k))
    await run(16)
    const lit = [...inside.querySelectorAll('.cb.on')].map((n) => n.parentElement!.getAttribute('aria-label'))
    expect(lit).toEqual(['Floor 2: call the cab to go up', 'Floor 3: call the cab to go up', 'Floor 5: call the cab to go down'])
    await run(200)
    expect(handle().getSnapshot().readout).toBe('1 ▲ · NEXT 2, 3, 5')
  })

  it('a call on the floor the cab is on opens its doors there', async () => {
    const { snap } = await play(['1'])
    expect(snap()).toEqual({ readout: '1 · IDLE', state: 'FLOOR 1 · HERE', pressed: {} })
  })

  it('O holds the doors open past their usual time; C closes them at once', async () => {
    const { handle, run, snap } = await play(['o'])
    expect(snap().state).toBe('DOORS HELD')
    await run(3500)
    expect(snap().state).toBe('DOORS HELD')
    act(() => handle().press('c'))
    await run(16)
    expect(snap().state).toBe('CLOSING DOORS')
    await run(1800)
    expect(snap().state).toBe('IDLE · DOORS CLOSED')
  })

  it('in full motion C closes the doors early, and O opens them again while they close', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    const open = () => Number(inside.querySelector('rect.leaf')!.getAttribute('width'))
    act(() => handle().press('o'))
    await run(1000)
    expect(open()).toBe(0)
    act(() => handle().press('c'))
    await run(400)
    expect(open()).toBeGreaterThan(0)
    act(() => handle().press('o'))
    await run(1200)
    expect(open()).toBe(0)
    expect(handle().getSnapshot().state).toBe('DOORS HELD')
  })

  it('O while the cab travels leaves the doors shut', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    act(() => handle().press('4'))
    await run(800)
    act(() => handle().press('o'))
    await run(16)
    expect(handle().getSnapshot().state).toBe('IN MOTION · DOORS SHUT')
  })

  it('its parts are buttons: a landing’s doors send the cab there, its call buttons call it', async () => {
    const { part, run, snap, lamp } = await play()
    click(part('Floor 4: send the cab here'))
    await run(100)
    expect(snap().readout).toBe('4 · IDLE')
    act(
      () =>
        void part('Floor 2: call the cab to go down').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })),
    )
    await run(16)
    expect(lamp('Floor 2: call the cab to go down')).toBe('cb on')
    expect(snap().readout).toBe('4 ▼ · NEXT 2')
    await run(3000)
    expect(snap().readout).toBe('2 · IDLE')
  })

  it('left alone it serves the building: a call from one floor, a ride to another', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(1700)
    expect(inside.querySelectorAll('.cb.on')).toHaveLength(1)
    expect(handle().getSnapshot().readout).toBe('1 ▲ · NEXT 3')
    await run(9000)
    expect(handle().getSnapshot().readout).not.toMatch(/^1 /)
  })

  it('the page’s keys put its own rides on hold', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(100)
    act(() => handle().press('c'))
    await run(5000)
    expect(inside.querySelectorAll('.cb.on')).toHaveLength(0)
    expect(handle().getSnapshot().readout).toBe('1 · IDLE')
  })

  it('redraws in place: the drawing keeps its node count through play and every interaction', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureElevator, { reducedMotion: 'never' })
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const hint of elevator.keys)
      for (const key of hint.keys) {
        act(() => handle().press(key))
        await run(400)
      }
    for (const el of inside.querySelectorAll('[role=button]')) {
      click(el)
      await run(200)
    }
    await run(12000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })

  it('a progress prop picks the floor, a step for each quarter', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureElevator, { reducedMotion: 'always' })
    rerender(<MiniatureElevator ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '3 · IDLE', state: 'PROGRESS 50% · STEP 3 OF 5', pressed: {} })
    rerender(<MiniatureElevator ref={ref} reducedMotion="always" progress={0.8} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('4 · IDLE')
    expect(handle().getSnapshot().state).toBe('PROGRESS 80% · STEP 4 OF 5')
    rerender(<MiniatureElevator ref={ref} reducedMotion="always" progress={0} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('1 · IDLE')
  })

  it('done takes the cab to the top, where it comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureElevator, { progress: 0.25 })
    await run(4000)
    expect(handle().getSnapshot().readout).toBe('2 · IDLE')
    rerender(<MiniatureElevator ref={ref} progress={0.25} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe(`FINISHING · STEP 5 OF 5`)
    await run(9000)
    expect(handle().getSnapshot()).toEqual({ readout: '5 · IDLE', state: 'COMPLETE · STEP 5 OF 5', pressed: {} })
  })

  it('the handle drives it too: setProgress, null to run free again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureElevatorHandle>()
    const { rerender } = mount(MiniatureElevator, { reducedMotion: 'always' })
    rerender(<MiniatureElevator ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.75))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('4 · IDLE')
    act(() => ref.current!.setProgress(null))
    await run(4000)
    expect(ref.current!.getSnapshot().state).toBe('IDLE · DOORS CLOSED')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot()).toEqual({ readout: '5 · IDLE', state: 'COMPLETE · STEP 5 OF 5', pressed: {} })
  })

  it('a still elevator is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureElevator, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('3 · IDLE')
  })

  it('chimes only once sound is on and someone has pressed something', async () => {
    const audio = installAudio()
    try {
      const run = useFrames()
      const { handle, host } = mount(MiniatureElevator, { reducedMotion: 'never', sound: true })
      await run(2500)
      expect(audio.created).toHaveLength(0)
      act(() => void host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
      act(() => handle().press('2'))
      await run(3000)
      expect(audio.created).toHaveLength(1)
    } finally {
      audio.uninstall()
    }
  })
})
