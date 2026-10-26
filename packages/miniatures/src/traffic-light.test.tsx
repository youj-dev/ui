import { act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'
import { MiniatureTrafficLight, trafficLight } from './traffic-light'

describeMiniature(MiniatureTrafficLight, trafficLight)

describe('TrafficLight', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /** Mounts it (still by default: no flashing) and lets the first frames run. */
  const signal = async (props: Parameters<typeof mount>[1] = { reducedMotion: 'always' }) => {
    const run = useFrames()
    const view = mount(MiniatureTrafficLight, props)
    await run(100)
    return { ...view, run, snap: () => view.handle().getSnapshot(), press: (key: string) => act(() => view.handle().press(key as never)) }
  }
  const on = (n: Element | null) => n!.classList.contains('on')
  /** Which vehicle lamps are lit: `r`, `a`, `g`. */
  const lamps = (inside: ShadowRoot) => ['r', 'a', 'g'].filter((c) => on(inside.querySelector(`.lit.${c}`))).join('')
  /** The pedestrian head: the hand and the walking figure (the two `.led` groups), and the countdown's lit segments. */
  const ped = (inside: ShadowRoot) => {
    const [hand, man] = [...inside.querySelectorAll('.led')]
    return { hand: on(hand!), man: on(man!), digits: inside.querySelectorAll('.seg.on').length }
  }
  const waitLit = (inside: ShadowRoot) => on(inside.querySelector('.wait'))
  const control = (inside: ShadowRoot, label: RegExp) => [...inside.querySelectorAll('[role=button]')].find((b) => label.test(b.getAttribute('aria-label') ?? ''))!

  it('starts on red with four seconds to go, the hand steady and no call waiting', async () => {
    const { snap, inside } = await signal()
    expect(snap()).toEqual(trafficLight.initial)
    expect(lamps(inside)).toBe('r')
    expect(ped(inside)).toEqual({ hand: true, man: false, digits: 0 })
    expect(waitLit(inside)).toBe(false)
  })

  it('cycles red → green → amber → red on its timing, counting down the seconds', async () => {
    const { snap, run, inside } = await signal()
    await run(2000)
    expect(snap().readout).toBe('RED · 2 S')
    await run(2100)
    expect(snap()).toMatchObject({ readout: 'GREEN · 14 S', state: 'READY · GO' })
    expect(lamps(inside)).toBe('g')
    await run(10000)
    expect(snap().readout).toBe('GREEN · 4 S')
    await run(4000)
    expect(snap()).toMatchObject({ readout: 'AMBER · 3 S', state: 'PENDING · PREPARE TO STOP' })
    expect(lamps(inside)).toBe('a')
    await run(3000)
    expect(snap()).toMatchObject({ readout: 'RED · 10 S', state: 'BLOCKED · STOP' })
    expect(lamps(inside)).toBe('r')
    expect(ped(inside)).toEqual({ hand: true, man: false, digits: 0 })
  })

  it('Space on a green lights WAIT and cuts the green short; the next red shows the walking figure and the countdown', async () => {
    const { snap, run, press, inside } = await signal()
    await run(4100)
    press(' ')
    await run(50)
    expect(snap()).toMatchObject({ readout: 'GREEN · 5 S', state: 'READY · GO / WAIT' })
    expect(waitLit(inside)).toBe(true)
    await run(5000)
    expect(snap()).toMatchObject({ readout: 'AMBER · 3 S', state: 'PENDING · PREPARE TO STOP / WAIT' })
    await run(3000)
    expect(snap()).toMatchObject({ readout: 'RED · 15 S', state: 'BLOCKED · STOP / WAIT' })
    expect(ped(inside)).toMatchObject({ hand: true, man: false })
    await run(1000)
    expect(snap()).toMatchObject({ readout: 'RED · 14 S · WALK 13', state: 'BLOCKED · STOP / WALK' })
    expect(waitLit(inside)).toBe(false)
    expect(ped(inside)).toEqual({ hand: false, man: true, digits: 5 + 2 })
    await run(5000)
    expect(snap()).toMatchObject({ readout: 'RED · 9 S · DON’T WALK 8', state: 'BLOCKED · STOP / FINISH CROSSING' })
    expect(ped(inside)).toEqual({ hand: true, man: false, digits: 7 })
    await run(8000)
    expect(snap()).toMatchObject({ readout: 'RED · 1 S', state: 'BLOCKED · STOP' })
    expect(ped(inside)).toEqual({ hand: true, man: false, digits: 0 })
    await run(1000)
    expect(snap().readout).toBe('GREEN · 14 S')
  })

  it('with motion, the hand flashes through the clearance; reduced, it stays steady', async () => {
    const moving = await signal({ reducedMotion: 'never' })
    moving.press(' ')
    await moving.run(4000 + 5000 + 3000 + 1000 + 5000)
    const seen = new Set<boolean>()
    for (let i = 0; i < 8; i++) {
      await moving.run(250)
      seen.add(ped(moving.inside).hand)
    }
    expect(seen).toEqual(new Set([true, false]))
    moving.unmount()
    const still = await signal()
    still.press(' ')
    await still.run(4000 + 5000 + 3000 + 1000 + 5000)
    for (let i = 0; i < 8; i++) {
      await still.run(250)
      expect(ped(still.inside).hand).toBe(true)
    }
  })

  it('Space at the start of a red brings the walk into that red', async () => {
    const { snap, run, press, inside } = await signal()
    await run(4000 + 14000 + 3000 + 300)
    expect(snap().readout).toBe('RED · 10 S')
    press(' ')
    await run(1000)
    expect(snap().readout).toMatch(/^RED · 14 S · WALK 1[34]$/)
    expect(ped(inside).man).toBe(true)
  })

  it('Space late in a red waits for the next cycle, whose green is cut short', async () => {
    const { snap, run, press, inside } = await signal()
    press(' ')
    await run(100)
    expect(snap().state).toBe('BLOCKED · STOP / WAIT')
    expect(ped(inside).man).toBe(false)
    await run(4000)
    expect(snap()).toMatchObject({ readout: 'GREEN · 5 S', state: 'READY · GO / WAIT' })
  })

  it('pressing again while waiting or walking changes nothing', async () => {
    const { snap, run, press } = await signal()
    await run(4100)
    press(' ')
    await run(1000)
    const before = snap()
    press(' ')
    await run(16)
    expect(snap()).toEqual(before)
  })

  it('R holds red, through amber from a green, until C resumes the cycle', async () => {
    const { snap, run, press, inside } = await signal()
    await run(4100)
    press('r')
    await run(50)
    expect(snap()).toMatchObject({ readout: 'AMBER · 3 S', state: 'PENDING · CHANGING TO BLOCKED' })
    await run(3000)
    expect(snap()).toMatchObject({ readout: 'RED · HELD', state: 'BLOCKED · HELD / C RESUMES THE CYCLE' })
    await run(60000)
    expect(snap().readout).toBe('RED · HELD')
    expect(lamps(inside)).toBe('r')
    press('c')
    await run(50)
    expect(snap()).toMatchObject({ readout: 'RED · 3 S', state: 'BLOCKED · STOP' })
    await run(3000)
    expect(snap().readout).toBe('GREEN · 14 S')
  })

  it.each([
    ['a', 'AMBER', 'PENDING', 'a'],
    ['g', 'GREEN', 'READY', 'g'],
  ] as const)('%s holds %s at once, as a %s status', async (key, name, meaning, lamp) => {
    const { snap, run, press, inside } = await signal()
    press(key)
    await run(50)
    expect(snap()).toMatchObject({ readout: `${name} · HELD`, state: `${meaning} · HELD / C RESUMES THE CYCLE` })
    expect(lamps(inside)).toBe(lamp)
    await run(30000)
    expect(snap().readout).toBe(`${name} · HELD`)
  })

  it('a push while held waits, and is served once the cycle resumes', async () => {
    const { snap, run, press } = await signal()
    press('g')
    press(' ')
    await run(10000)
    expect(snap().readout).toBe('GREEN · HELD')
    press('c')
    await run(50)
    expect(snap()).toMatchObject({ readout: 'GREEN · 3 S', state: 'READY · GO / WAIT' })
    await run(3000 + 3000 + 1000)
    expect(snap().state).toBe('BLOCKED · STOP / WALK')
  })

  it('N flashes amber with the walk signal dark; reduced, the amber stays lit; C returns to red', async () => {
    const moving = await signal({ reducedMotion: 'never' })
    moving.press('n')
    await moving.run(50)
    expect(moving.snap()).toMatchObject({ readout: 'AMBER · FLASHING', state: 'NIGHT · FLASHING AMBER / C RESUMES' })
    expect(ped(moving.inside)).toEqual({ hand: false, man: false, digits: 0 })
    const seen = new Set<string>()
    for (let i = 0; i < 8; i++) {
      await moving.run(250)
      seen.add(lamps(moving.inside))
    }
    expect(seen).toEqual(new Set(['a', '']))
    moving.press('c')
    await moving.run(50)
    expect(moving.snap()).toMatchObject({ readout: 'RED · 4 S', state: 'BLOCKED · STOP' })
    moving.unmount()
    const still = await signal()
    still.press('n')
    for (let i = 0; i < 8; i++) {
      await still.run(250)
      expect(lamps(still.inside)).toBe('a')
    }
  })

  it('a click on the button box pushes it; a click on a lamp holds its state', async () => {
    const { snap, run, inside } = await signal()
    act(() => fireEvent.click(control(inside, /^Pedestrian push button/)))
    await run(50)
    expect(snap().state).toBe('BLOCKED · STOP / WAIT')
    act(() => fireEvent.click(control(inside, /^Green lamp/)))
    await run(50)
    expect(snap().readout).toBe('GREEN · HELD')
    act(() => fireEvent.keyDown(control(inside, /^Amber lamp/), { key: 'Enter' }))
    await run(50)
    expect(snap().readout).toBe('AMBER · HELD')
  })

  it('draws once: its node count stays fixed through the cycle, the walk and every key', async () => {
    const { run, press, inside } = await signal({ reducedMotion: 'never' })
    const count = () => inside.querySelectorAll('*').length
    const nodes = count()
    await run(3000)
    for (const key of [' ', 'r', 'a', 'g', 'c', 'n', 'c', ' ']) {
      press(key)
      await run(700)
      expect(count()).toBe(nodes)
    }
    act(() => fireEvent.click(control(inside, /^Pedestrian push button/)))
    act(() => fireEvent.click(control(inside, /^Red lamp/)))
    press('c')
    await run(40000)
    expect(count()).toBe(nodes)
  })
})
