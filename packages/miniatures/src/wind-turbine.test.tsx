import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'
import { MiniatureWindTurbine, type MiniatureWindTurbineHandle, type MiniatureWindTurbineKey, windTurbine } from './wind-turbine'

describeMiniature(MiniatureWindTurbine, windTurbine)

describe('Wind turbine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (still by default: every change jumps to its end), presses the keys in order and lets it settle. */
  const turbine = async (props: Parameters<typeof mount>[1] = { reducedMotion: 'always' }, keys: MiniatureWindTurbineKey[] = [], settle = 1800) => {
    const run = useFrames()
    const view = mount(MiniatureWindTurbine, props)
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot(), press: (k: MiniatureWindTurbineKey) => act(() => view.handle().press(k)) }
  }
  const button = (inside: ShadowRoot, label: RegExp) =>
    [...inside.querySelectorAll('[role=button]')].find((b) => label.test(b.getAttribute('aria-label') ?? ''))!
  /** The blades' outlines: they move as the rotor turns and thin as the blades feather. */
  const blades = (inside: ShadowRoot) => [...inside.querySelectorAll('path.outline')].map((p) => p.getAttribute('d')).join()
  /** Where the nacelle points: its met mast, at the back of it, swings round the tower as it yaws. */
  const nacelle = (inside: ShadowRoot) => inside.querySelector('path.rod')!.getAttribute('d')
  const said = (inside: ShadowRoot) => inside.querySelector('[role=status]')!.textContent

  it('turns in a 10 m/s wind from the south-southwest, making 1.8 MW', async () => {
    const { snap, inside } = await turbine()
    expect(snap()).toEqual(windTurbine.initial)
    expect(inside.querySelector('text.lcd')).toHaveTextContent('1.8 MW')
    expect(inside.querySelector('circle.lamp')).toHaveClass('g')
    expect((inside.querySelector('path.flow') as SVGElement).style.opacity).toBe('0.9')
  })

  it('turns its rotor with the wind, and holds it still when motion is reduced', async () => {
    const moving = await turbine({})
    const before = blades(moving.inside)
    await moving.run(500)
    expect(blades(moving.inside)).not.toBe(before)
    expect(moving.snap().readout).toMatch(/^(1\.[6-9]|2\.[01]) MW · 10 M\/S$/)
    cleanup()
    const still = await turbine()
    const pose = blades(still.inside)
    await still.run(2000)
    expect(blades(still.inside)).toBe(pose)
  })

  it('Space sends a gust: the wind rises, the rotor spins up and the power climbs to rated, then it eases back', async () => {
    const { snap, run } = await turbine({ reducedMotion: 'always' }, [' '], 100)
    expect(snap()).toMatchObject({ readout: '3.6 MW · 16 M/S', state: 'GUST · 16 M/S' })
    await run(1600)
    expect(snap().state).toBe('GUST · ROTOR SPINNING UP')
    await run(1600)
    expect(snap()).toEqual(windTurbine.initial)
  })

  it('a gust in motion: the power climbs as the rotor spins up, and settles once it has passed', async () => {
    const { snap, run } = await turbine({}, [' '], 1200)
    expect(snap().readout).toMatch(/^[23]\.\d MW · 1[5-7] M\/S$/)
    await run(1000)
    expect(snap().state).toBe('GUST · ROTOR SPINNING UP')
    await run(7000)
    expect(snap().readout).toMatch(/^(1\.[6-9]|2\.[01]) MW · 10 M\/S$/)
    expect(snap().state).toMatch(/^GENERATING · WIND SSW · 1[12] RPM$/)
  })

  it.each([
    ['ArrowRight', 'SW', 'southwest'],
    ['ArrowLeft', 'S', 'south'],
  ] as const)('%s turns the wind, and the nacelle yaws to face it', async (key, point, name) => {
    const { snap, run, inside, press } = await turbine()
    const facing = nacelle(inside)
    press(key)
    await run(100)
    expect(snap()).toMatchObject({ readout: '1.8 MW · 10 M/S', state: `WIND FROM ${point}` })
    expect(said(inside)).toBe(`Wind from the ${name}. The nacelle yaws to face it.`)
    expect(nacelle(inside)).not.toBe(facing)
    await run(1700)
    expect(snap().state).toBe(`GENERATING · WIND ${point} · 11 RPM`)
  })

  it('in motion the vane swings with the wind at once, then the nacelle follows, losing power until it faces it', async () => {
    const { snap, run, inside, press } = await turbine({})
    const facing = nacelle(inside)
    const vane = inside.querySelector('path.vane')!.getAttribute('d')
    for (let i = 0; i < 4; i++) press('ArrowRight')
    await run(50)
    expect(inside.querySelector('path.vane')!.getAttribute('d')).not.toBe(vane)
    expect(nacelle(inside)).toBe(facing)
    await run(2000)
    expect(snap().state).toMatch(/^YAWING · \d+° TO THE WIND$/)
    expect(Number.parseFloat(snap().readout)).toBeLessThan(1.5)
    await run(7000)
    expect(snap().state).toMatch(/^GENERATING · WIND WNW · 1[12] RPM$/)
    expect(snap().readout).toMatch(/^(1\.[6-9]|2\.[01]) MW · 10 M\/S$/)
  })

  it('the wind can turn all the way round: the rotor then faces away, behind the tower', async () => {
    const { snap, inside, press, run } = await turbine()
    const rotor = inside.querySelector('path.spin')!.parentElement!
    const tower = inside.querySelector('path.tower')!
    const after = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(after(tower, rotor)).toBe(true)
    for (let i = 0; i < 8; i++) press('ArrowRight')
    await run(1700)
    expect(snap().state).toBe('GENERATING · WIND NNE · 11 RPM')
    expect(after(rotor, tower)).toBe(true)
  })

  it.each([
    ['ArrowUp', '2.4 MW · 11 M/S', 'WIND 11 M/S', 'GENERATING · WIND SSW · 12 RPM'],
    ['ArrowDown', '1.3 MW · 9 M/S', 'WIND 9 M/S', 'GENERATING · WIND SSW · 10 RPM'],
  ] as const)('%s sets the wind speed, and the power follows its curve', async (key, readout, note, state) => {
    const { snap, run, press } = await turbine()
    press(key)
    await run(100)
    expect(snap()).toMatchObject({ readout, state: note })
    await run(1700)
    expect(snap().state).toBe(state)
  })

  it('above the rated wind the blades pitch to hold the rated power', async () => {
    const { snap } = await turbine({ reducedMotion: 'always' }, ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp'])
    expect(snap()).toMatchObject({ readout: '3.6 MW · 16 M/S', state: 'RATED POWER · PITCH 6°' })
  })

  it('at cut-out the blades feather and it idles; when the storm eases it runs again', async () => {
    const { snap, run, press, inside } = await turbine({ reducedMotion: 'always' }, Array(15).fill('ArrowUp'))
    expect(snap()).toMatchObject({ readout: '0.0 MW · 25 M/S', state: 'STORM · CUT-OUT · BLADES FEATHERED' })
    expect(inside.querySelector('circle.lamp')).toHaveClass('a')
    for (let i = 0; i < 3; i++) press('ArrowDown')
    await run(1800)
    expect(snap()).toMatchObject({ readout: '3.6 MW · 22 M/S', state: 'RATED POWER · PITCH 16°' })
  })

  it('below cut-in it idles without power, and in a calm the rotor rests', async () => {
    const { snap, run, press } = await turbine({ reducedMotion: 'always' }, Array(8).fill('ArrowDown'))
    expect(snap()).toMatchObject({ readout: '0.0 MW · 2 M/S', state: 'BELOW CUT-IN · IDLING' })
    press('ArrowDown')
    press('ArrowDown')
    await run(1800)
    expect(snap()).toMatchObject({ readout: '0.0 MW · 0 M/S', state: 'CALM · ROTOR AT REST' })
  })

  it('B brakes: the blades feather and the rotor stops; it restarts on its own after a hold', async () => {
    const { snap, run, inside, press } = await turbine()
    const running = blades(inside)
    press('b')
    await run(200)
    expect(snap()).toMatchObject({ readout: '0.0 MW · 10 M/S', state: 'STOPPED · BRAKE ON' })
    expect(said(inside)).toBe('Brake: the blades feather and the rotor comes to a stop.')
    expect(blades(inside)).not.toBe(running)
    expect(inside.querySelector('text.lcd')).toHaveTextContent('0.0 MW')
    expect((inside.querySelector('path.flow') as SVGElement).style.opacity).toBe('0')
    await run(4000)
    expect(snap()).toEqual(windTurbine.initial)
    expect(blades(inside)).toBe(running)
  })

  it('B again while it is stopped releases the brake at once', async () => {
    const { snap, run, press } = await turbine({ reducedMotion: 'always' }, ['b'], 300)
    press('b')
    await run(100)
    expect(snap()).toMatchObject({ readout: '1.8 MW · 10 M/S', state: 'BRAKE RELEASED' })
    await run(1700)
    expect(snap()).toEqual(windTurbine.initial)
  })

  it('in motion the brake runs through: feathering, stopped, restarting, generating', async () => {
    const { snap, run, press } = await turbine({})
    press('b')
    await run(500)
    expect(snap()).toMatchObject({ readout: '0.0 MW · 10 M/S', state: 'BRAKING · BLADES FEATHERING' })
    await run(6000)
    expect(snap().state).toBe('STOPPED · BRAKE ON')
    await run(4500)
    expect(snap().state).toBe('RESTARTING · BLADES PITCHING IN')
    await run(9000)
    expect(snap().state).toMatch(/^GENERATING · WIND SSW · 1[12] RPM$/)
  })

  it('its parts are buttons: the rotor sends a gust, the tower door brakes', async () => {
    const { snap, run, inside } = await turbine()
    act(() => void button(inside, /^Rotor/).dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('GUST · 16 M/S')
    act(() => void button(inside, /^Tower door/).dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('STOPPED · BRAKE ON')
  })

  it('its aviation light blinks, and stays lit when motion is reduced', async () => {
    const moving = await turbine({}, [], 0)
    const beacon = () => moving.inside.querySelector('circle.bcn')!.classList.contains('on')
    const seen = new Set<boolean>()
    for (let i = 0; i < 12; i++) {
      await moving.run(200)
      seen.add(beacon())
    }
    expect([...seen].sort()).toEqual([false, true])
    cleanup()
    const still = await turbine()
    for (let i = 0; i < 5; i++) {
      await still.run(400)
      expect(still.inside.querySelector('circle.bcn')).toHaveClass('on')
    }
  })

  it('a progress prop sets the power as a share of the rated power, and done runs it up to rated', async () => {
    const { snap, run, rerender, ref } = await turbine({ reducedMotion: 'always', progress: 0.25 }, [], 300)
    expect(snap()).toEqual({ readout: '0.9 MW · 8 M/S', state: 'PROGRESS 25% · HOLDING', pressed: {} })
    rerender(<MiniatureWindTurbine ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(snap()).toMatchObject({ readout: '1.8 MW · 10 M/S', state: 'PROGRESS 50% · HOLDING' })
    rerender(<MiniatureWindTurbine ref={ref} reducedMotion="always" progress={0.5} done />)
    await run(300)
    expect(snap()).toMatchObject({ readout: '3.6 MW · 13 M/S', state: 'COMPLETE · RATED POWER' })
  })

  it('in motion the power ramps to the progress, then holds', async () => {
    const { snap, run, rerender, ref } = await turbine({})
    rerender(<MiniatureWindTurbine ref={ref} progress={0.9} />)
    await run(300)
    expect(snap().state).toBe('PROGRESS 90% · RAMPING')
    await run(5000)
    expect(snap()).toMatchObject({ readout: expect.stringMatching(/^3\.2 MW · 1[12] M\/S$/), state: 'PROGRESS 90% · HOLDING' })
  })

  it('while the progress sets the power, ↑ and ↓ leave the wind alone', async () => {
    const { snap, run, press } = await turbine({ reducedMotion: 'always', progress: 0.25 }, [], 300)
    press('ArrowUp')
    await run(100)
    expect(snap()).toMatchObject({ readout: '0.9 MW · 8 M/S', state: 'WIND FOLLOWS THE PROGRESS' })
  })

  it('the handle drives it too: setProgress, null for indeterminate, done; a new progress starts over', async () => {
    const ref = createRef<MiniatureWindTurbineHandle>()
    const { run, rerender } = await turbine()
    rerender(<MiniatureWindTurbine ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.75))
    await run(300)
    expect(ref.current!.getSnapshot()).toMatchObject({ readout: '2.7 MW · 11 M/S', state: 'PROGRESS 75% · HOLDING' })
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().state).toBe('INDETERMINATE · GENERATING')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot()).toMatchObject({ readout: '3.6 MW · 13 M/S', state: 'COMPLETE · RATED POWER' })
    act(() => ref.current!.setProgress(0.5))
    await run(300)
    expect(ref.current!.getSnapshot()).toMatchObject({ readout: '1.8 MW · 10 M/S', state: 'PROGRESS 50% · HOLDING' })
  })

  it('a still turbine is still a progress indicator: progress works without interaction', async () => {
    const { snap, host, run } = await turbine({ interactive: false, autoPlay: false, progress: 0.25, reducedMotion: 'always' }, [], 0)
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(snap().readout).toBe('0.9 MW · 8 M/S')
  })

  it('redraws in place: the drawing keeps its node count over seconds of play and through every key, button and progress', async () => {
    const { run, svg, inside, rerender, ref, press } = await turbine({}, [], 500)
    const count = () => svg().querySelectorAll('*').length
    const nodes = count()
    await run(3000)
    expect(count()).toBe(nodes)
    const keys: MiniatureWindTurbineKey[] = [
      ' ',
      'ArrowLeft',
      'ArrowLeft',
      ...Array<MiniatureWindTurbineKey>(10).fill('ArrowRight'),
      'b',
      ...Array<MiniatureWindTurbineKey>(16).fill('ArrowUp'),
      ...Array<MiniatureWindTurbineKey>(26).fill('ArrowDown'),
      'b',
      'b',
    ]
    for (const key of keys) {
      press(key)
      await run(350)
      expect(count()).toBe(nodes)
    }
    await run(8000)
    expect(count()).toBe(nodes)
    for (const label of [/^Rotor/, /^Tower door/]) {
      act(() => void button(inside, label).dispatchEvent(new MouseEvent('click', { bubbles: true })))
      await run(1500)
      expect(count()).toBe(nodes)
    }
    for (const props of [{ progress: 0.3 }, { progress: null }, { progress: 0.8, done: true }]) {
      rerender(<MiniatureWindTurbine ref={ref} {...props} />)
      await run(2500)
      expect(count()).toBe(nodes)
    }
  })
})
