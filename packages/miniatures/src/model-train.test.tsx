import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureModelTrain, type MiniatureModelTrainHandle, modelTrain } from './model-train'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureModelTrain, modelTrain)

describe('ModelTrain', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const speed = (readout: string) => Number(readout.match(/^(\d+) KM\/H/)?.[1] ?? Number.NaN)
  const arms = (inside: ShadowRoot) => [...new Set([...inside.querySelectorAll('.boom-r')].map((n) => n.parentElement!))]
  const lit = (inside: ShadowRoot) => inside.querySelectorAll('.xl.on').length
  const loco = (inside: ShadowRoot) => inside.querySelector('[aria-label^="Train"]')!.querySelector('.livery')!.closest('[aria-label^="Train"] > g')!
  const puffs = (inside: ShadowRoot) => [...inside.querySelectorAll('.puff')].filter((n) => Number(n.getAttribute('opacity')) > 0).length
  const said = (inside: ShadowRoot) => inside.querySelector('[role=status]')!.textContent

  it('stands at Tarnlow on its timetable, then departs and calls at Braemoss', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureModelTrain)
    await run(400)
    expect(handle().getSnapshot()).toMatchObject({ readout: '0 KM/H · NEXT: BRAEMOSS', pressed: {} })
    expect(handle().getSnapshot().state).toMatch(/^AT TARNLOW · DEPARTS IN \d S$/)
    await run(4000)
    expect(speed(handle().getSnapshot().readout)).toBeGreaterThan(20)
    expect(handle().getSnapshot().readout).toMatch(/ · NEXT: BRAEMOSS$/)
    expect(handle().getSnapshot().state).toBe('RUNNING · THROTTLE 3/5')
    await run(5600)
    expect(handle().getSnapshot().readout).toBe('0 KM/H · NEXT: TARNLOW')
    expect(handle().getSnapshot().state).toMatch(/^AT BRAEMOSS · DEPARTS IN \d S$/)
  })

  it('Space departs it from the station at once', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    await run(200)
    act(() => handle().press(' '))
    await run(1200)
    expect(speed(handle().getSnapshot().readout)).toBeGreaterThan(5)
    expect(said(inside)).toBe('Departing Tarnlow for Braemoss.')
  })

  it('Space while running stops it at the next station and holds it there; Space again waits for the crossing and departs', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureModelTrain)
    await run(4000)
    act(() => handle().press(' '))
    await run(200)
    expect(handle().getSnapshot().state).toBe('RUNNING · THROTTLE 3/5 · HOLD AT BRAEMOSS')
    await run(9000)
    expect(handle().getSnapshot()).toMatchObject({ readout: '0 KM/H · NEXT: TARNLOW', state: 'HELD AT BRAEMOSS · SPACE TO DEPART' })
    act(() => handle().press(' '))
    await run(500)
    expect(handle().getSnapshot().state).toBe('WAITING FOR THE CROSSING')
    await run(2500)
    expect(speed(handle().getSnapshot().readout)).toBeGreaterThan(5)
  })

  it('the arrows open and close the throttle: it gathers speed and brakes smoothly, and the knob turns', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    const knob = inside.querySelector('.ptr')!
    await run(100)
    act(() => handle().press(' '))
    act(() => handle().press('ArrowUp'))
    act(() => handle().press('ArrowUp'))
    const seen: number[] = []
    for (let i = 0; i < 12; i++) {
      await run(250)
      seen.push(speed(handle().getSnapshot().readout))
    }
    expect(seen.every((v, i) => i === 0 || v >= seen[i - 1]!)).toBe(true)
    expect(seen[0]).toBeLessThan(30)
    expect(seen[seen.length - 1]).toBeGreaterThan(50)
    expect(knob.getAttribute('transform')).toBe('rotate(120.00 136 4.5)')
    for (let i = 0; i < 5; i++) act(() => handle().press('ArrowDown'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('THROTTLE CLOSED · BRAKING')
    await run(3000)
    expect(handle().getSnapshot()).toMatchObject({ readout: '0 KM/H · NEXT: BRAEMOSS', state: 'STANDING · THROTTLE CLOSED' })
    expect(knob.getAttribute('transform')).toBe('rotate(-120.00 136 4.5)')
    act(() => handle().press('ArrowUp'))
    await run(1500)
    expect(speed(handle().getSnapshot().readout)).toBeGreaterThan(0)
  })

  it('S sets the signal to danger: the train brakes and waits at it, and S clears it', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    const arm = inside.querySelector('.arm')!.parentElement!
    await run(100)
    expect(arm.getAttribute('transform')).toBe('rotate(-40.00)')
    act(() => handle().press('s'))
    await run(1000)
    expect(arm.getAttribute('transform')).toBe('rotate(0.00)')
    await run(7000)
    expect(handle().getSnapshot()).toMatchObject({ readout: '0 KM/H · NEXT: BRAEMOSS', state: 'AT THE SIGNAL · S CLEARS IT' })
    await run(2000)
    expect(handle().getSnapshot().state).toBe('AT THE SIGNAL · S CLEARS IT')
    act(() => handle().press('s'))
    await run(1500)
    expect(speed(handle().getSnapshot().readout)).toBeGreaterThan(5)
    expect(arm.getAttribute('transform')).toBe('rotate(-40.00)')
  })

  it('W blows the whistle: a plume of steam', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    await run(100)
    const before = puffs(inside)
    act(() => handle().press('w'))
    await run(350)
    expect(puffs(inside)).toBeGreaterThan(before + 2)
    expect(said(inside)).toBe('Whistle.')
  })

  it('the crossing closes as the train comes: lights flash in turn, the barriers come down, then rise once it has passed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    const [inner, outer] = arms(inside)
    const lights = [...inside.querySelectorAll('.xl')]
    let down = false
    const flashed = new Set<number>()
    act(() => handle().press(' '))
    for (let t = 0; t < 24000; t += 200) {
      await run(200)
      if (handle().getSnapshot().state.startsWith('AT BRAEMOSS')) act(() => handle().press(' '))
      if (outer!.getAttribute('transform') === 'rotate(90.00)' && inner!.getAttribute('transform') === 'rotate(-90.00)') down = true
      lights.forEach((l, i) => l.classList.contains('on') && flashed.add(i))
      if (down && handle().getSnapshot().state.startsWith('AT TARNLOW')) break
    }
    expect(down).toBe(true)
    expect(flashed).toEqual(new Set([0, 1]))
    expect(handle().getSnapshot().state).toMatch(/^AT TARNLOW/)
    await run(1500)
    expect(outer!.getAttribute('transform')).toBe('rotate(0.00)')
    expect(lit(inside)).toBe(0)
  })

  it('with reduced motion it never travels or flashes: it jumps from station to station', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain, { reducedMotion: 'always' })
    await run(300)
    const car = loco(inside)
    const at = new Set([car.getAttribute('transform')])
    for (let t = 0; t < 5000; t += 100) {
      await run(100)
      at.add(car.getAttribute('transform'))
      expect(lit(inside)).toBe(0)
      expect(puffs(inside)).toBe(0)
    }
    expect(at.size).toBe(2)
    expect(handle().getSnapshot().readout).toBe('0 KM/H · NEXT: TARNLOW')
    expect(handle().getSnapshot().state).toMatch(/^AT BRAEMOSS/)
    act(() => handle().press(' '))
    await run(200)
    expect(handle().getSnapshot().state).toMatch(/^AT TARNLOW/)
  })

  it('a progress prop makes it determinate: the trip to the next station follows it', async () => {
    const run = useFrames()
    const { handle, inside, rerender, ref } = mount(MiniatureModelTrain, { reducedMotion: 'always' })
    await run(200)
    const car = loco(inside)
    const home = car.getAttribute('transform')
    rerender(<MiniatureModelTrain ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 50% · NEXT: BRAEMOSS', state: 'WAITING AT 50%' })
    expect(car.getAttribute('transform')).not.toBe(home)
    rerender(<MiniatureModelTrain ref={ref} reducedMotion="always" progress={1} />)
    await run(300)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 100% · NEXT: BRAEMOSS', state: 'AT BRAEMOSS · 100%' })
  })

  it('done finishes the trip: the train runs in, the platform lamps turn green', async () => {
    const run = useFrames()
    const { handle, inside, rerender, ref } = mount(MiniatureModelTrain, { progress: 0.3 })
    await run(6000)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 30% · NEXT: BRAEMOSS', state: 'WAITING AT 30%' })
    rerender(<MiniatureModelTrain ref={ref} progress={0.3} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('FINISHING · TO BRAEMOSS')
    await run(8000)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 100% · ARRIVED', state: 'COMPLETE · ARRIVED AT BRAEMOSS' })
    expect(inside.querySelectorAll('.lamp.g').length).toBeGreaterThan(0)
  })

  it('the handle drives it too: setProgress, null for the timetable again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureModelTrainHandle>()
    const { rerender } = mount(MiniatureModelTrain, { reducedMotion: 'always' })
    rerender(<MiniatureModelTrain ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · NEXT: BRAEMOSS')
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toMatch(/^0 KM\/H · NEXT: /)
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot()).toMatchObject({ readout: 'PROGRESS 100% · ARRIVED' })
    expect(ref.current!.getSnapshot().state).toMatch(/^COMPLETE · ARRIVED AT /)
  })

  it('a still train is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureModelTrain, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · NEXT: BRAEMOSS')
  })

  it('keeps the same number of nodes frame after frame, through travel, every key, progress and reduced motion', async () => {
    const run = useFrames()
    const { handle, svg, rerender, ref } = mount(MiniatureModelTrain, { reducedMotion: 'never' })
    await run(100)
    const nodes = () => svg().querySelectorAll('*').length
    const start = nodes()
    const counts = new Set([start])
    const at: Record<number, () => void> = {
      2: () => handle().press('w'),
      4: () => handle().press(' '),
      10: () => [1, 2].forEach(() => handle().press('ArrowUp')),
      25: () => handle().press('s'),
      70: () => handle().press('s'),
      80: () => [1, 2, 3, 4, 5].forEach(() => handle().press('ArrowDown')),
      100: () => [1, 2, 3].forEach(() => handle().press('ArrowUp')),
      110: () => handle().press(' '),
    }
    let crossed = false
    let reopened = false
    for (let i = 0; i < 260; i++) {
      if (at[i]) act(() => at[i]!())
      if (handle().getSnapshot().state.startsWith('HELD AT BRAEMOSS')) act(() => handle().press(' '))
      await run(100)
      counts.add(nodes())
      if (handle().getSnapshot().state.startsWith('CROSSING CLOSED')) crossed = true
      else if (crossed && handle().getSnapshot().state.startsWith('RUNNING')) reopened = true
    }
    expect(crossed).toBe(true)
    expect(reopened).toBe(true)
    for (const props of [{ progress: 0.4 }, { progress: 0.4, done: true, reducedMotion: 'always' as const }, {}]) {
      rerender(<MiniatureModelTrain ref={ref} reducedMotion="never" {...props} />)
      for (let i = 0; i < 25; i++) {
        await run(100)
        counts.add(nodes())
      }
    }
    expect([...counts]).toEqual([start])
  })

  it('its parts are buttons: the train departs, the signal turns, the knob opens the throttle', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureModelTrain)
    await run(100)
    const click = (label: string) => act(() => void (inside.querySelector(`[aria-label^="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true })))
    click('Signal')
    await run(800)
    expect(inside.querySelector('.arm')!.parentElement!.getAttribute('transform')).toBe('rotate(0.00)')
    click('Signal')
    click('Throttle')
    click('Train')
    await run(1500)
    expect(handle().getSnapshot().state).toBe('RUNNING · THROTTLE 4/5')
  })
})
