import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureHotAirBalloon, type MiniatureHotAirBalloonHandle, type MiniatureHotAirBalloonKey, hotAirBalloon } from './hot-air-balloon'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureHotAirBalloon, hotAirBalloon)

describe('HotAirBalloon', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureHotAirBalloonKey[] = [], settle = 300, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureHotAirBalloon, { reducedMotion })
    await run(100)
    const press = (list: MiniatureHotAirBalloonKey[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    /** A real key held down and let go, as a keyboard sends it (press() lets go at once). */
    const key = (type: 'keydown' | 'keyup', k: string) => act(() => void view.host.dispatchEvent(new KeyboardEvent(type, { key: k, cancelable: true })))
    const snap = () => view.handle().getSnapshot()
    const alt = () => Number(/ALT (\d+) M/.exec(snap().readout)![1])
    const env = () => Number(/ENV (\d+)°C/.exec(snap().readout)![1])
    const balloon = () => view.inside.querySelector('g[transform*="rotate("]')!.getAttribute('transform')!
    return { ...view, run, press, key, snap, alt, env, balloon }
  }

  it('starts hovering over its patch, the pilot holding it, the wind calm', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(hotAirBalloon.initial)
    expect(inside.querySelectorAll('.cloud').length).toBeGreaterThan(2)
    expect(inside.querySelector('.fo')!.closest('g[style*="display: none"]')).not.toBeNull()
  })

  it('holding Space fires the burner: it heats, climbs and the flame shows; let go and it cools, sinks and lands', async () => {
    const { key, run, snap, alt, env, inside } = await play([], 300, 'never')
    key('keydown', ' ')
    await run(3000)
    expect(snap().state).toBe('BURNER ON · CLIMBING')
    expect(env()).toBeGreaterThan(110)
    expect(alt()).toBeGreaterThan(30)
    expect(inside.querySelector('.fo')!.getAttribute('d')).toMatch(/^M/)
    key('keydown', ' ')
    key('keyup', ' ')
    await run(1500)
    expect(snap().state).toMatch(/^COOLING · /)
    let landed = false
    for (let i = 0; i < 60 && !landed; i++) {
      await run(1000)
      landed = snap().state === 'LANDED · HOLD SPACE TO FIRE'
    }
    expect(landed).toBe(true)
    expect(alt()).toBe(0)
    expect(env()).toBeLessThan(95)
  })

  it('held long enough it climbs to the top of its tether and no further', async () => {
    const { key, run, snap, alt } = await play([], 300, 'never')
    key('keydown', ' ')
    await run(16000)
    expect(alt()).toBe(60)
    expect(snap().state).toBe('BURNER ON · TETHER TAUT')
    expect(snap().readout).toMatch(/ENV 120°C/)
    key('keyup', ' ')
    await run(1000)
    expect(snap().state).toBe('COOLING · TETHER TAUT')
  })

  it('a tap of Space is a short burst; with reduced motion it jumps a quarter of the tether and steps back down as it cools', async () => {
    const { press, run, snap, alt } = await play([' '], 200)
    expect(snap().state).toBe('BURNER ON · CLIMBING')
    expect(alt()).toBe(45)
    await run(1000)
    expect(snap().state).toBe('COOLING · SINKING SLOWLY')
    expect(alt()).toBe(45)
    await run(3000)
    expect(alt()).toBe(30)
    await run(6200)
    expect(alt()).toBe(0)
    expect(snap().state).toBe('LANDED · HOLD SPACE TO FIRE')
    press([' '])
    await run(200)
    expect(alt()).toBe(15)
  })

  it('a pressed and held balloon fires the burner too, until the pointer lets go', async () => {
    const { inside, run, snap } = await play()
    const hit = inside.querySelector('.control')!
    act(() => void hit.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    await run(500)
    expect(snap().state).toBe('BURNER ON · CLIMBING')
    expect(inside.querySelector('[role=status]')).toHaveTextContent('Burner on.')
    act(() => void hit.dispatchEvent(new Event('pointerup', { bubbles: true })))
    await run(300)
    expect(snap().state).toBe('COOLING · SINKING SLOWLY')
  })

  it('← and → turn the wind a step at a time, up to a breeze, and it drifts with it', async () => {
    const { press, run, snap, balloon } = await play(['ArrowRight'])
    expect(snap().readout).toBe('ALT 30 M · ENV 95°C · WIND 4 KT E')
    expect(snap().state).toBe('WIND 4 KT E')
    const x = () => Number(/translate\(([-\d.]+)/.exec(balloon())![1])
    expect(x()).toBeGreaterThan(5)
    press(['ArrowRight', 'ArrowRight', 'ArrowRight'])
    await run(300)
    expect(snap().readout).toMatch(/WIND 12 KT E$/)
    press(['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft'])
    await run(2000)
    expect(snap().readout).toMatch(/WIND 12 KT W$/)
    expect(x()).toBeLessThan(-5)
    press(['ArrowRight', 'ArrowRight', 'ArrowRight'])
    await run(2000)
    expect(snap().readout).toMatch(/WIND CALM$/)
    expect(snap().state).toBe('HOVERING · HOLD SPACE TO FIRE')
  })

  it('↓ opens the vent: it spills hot air and sinks; on the ground the vent stays shut', async () => {
    const { press, run, snap, alt } = await play(['ArrowDown'], 200)
    expect(snap().state).toBe('VENT OPEN · SINKING')
    expect(alt()).toBe(15)
    press(['ArrowDown'])
    await run(2000)
    expect(alt()).toBe(0)
    expect(snap().state).toBe('LANDED · HOLD SPACE TO FIRE')
    press(['ArrowDown'])
    await run(200)
    expect(snap().state).toBe('LANDED · HOLD SPACE TO FIRE')
  })

  it('left alone it hovers on its own: the pilot gives short burns to hold the altitude', async () => {
    const { run, alt, snap, inside } = await play([], 300, 'never')
    let burns = 0
    for (let i = 0; i < 40; i++) {
      await run(250)
      if (!inside.querySelector('.fo')!.closest('g[style*="display: none"]')) burns++
    }
    expect(burns).toBeGreaterThan(2)
    expect(alt()).toBeGreaterThanOrEqual(24)
    expect(alt()).toBeLessThanOrEqual(36)
    expect(snap().state).toBe('HOVERING · HOLD SPACE TO FIRE')
  })

  it('a while after it has been brought down, the pilot takes off again', async () => {
    const { press, run, snap, alt } = await play(['ArrowDown', 'ArrowDown'], 300)
    expect(alt()).toBe(0)
    await run(9000)
    expect(snap().state).toBe('HOVERING · HOLD SPACE TO FIRE')
    expect(alt()).toBe(30)
    press([' '])
    await run(200)
    expect(alt()).toBe(45)
  })

  it('stays inside its frame whatever it is asked: full burn, a gale either way, venting, landing', async () => {
    const { key, press, run, balloon } = await play([], 300, 'never')
    const [x0, y0, w, hgt] = hotAirBalloon.viewBox.split(' ').map(Number) as [number, number, number, number]
    const check = () => {
      const [, tx, ty, r] = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)/.exec(balloon())!.map(Number) as number[]
      // The envelope is 44 wide either side of its axis, its crown 151 above the basket floor; the sway turns it by at most 6°.
      expect(Math.abs(r!)).toBeLessThanOrEqual(6)
      expect(tx! - 50).toBeGreaterThan(x0)
      expect(tx! + 50).toBeLessThan(x0 + w)
      expect(ty! - 154).toBeGreaterThan(y0)
      expect(ty! + 14).toBeLessThan(y0 + hgt)
    }
    key('keydown', ' ')
    for (let i = 0; i < 16; i++) {
      press(['ArrowRight'])
      await run(1000)
      check()
    }
    key('keyup', ' ')
    key('keydown', 'ArrowLeft')
    for (let i = 0; i < 12; i++) {
      await run(1000)
      check()
    }
    key('keyup', 'ArrowLeft')
    press(['ArrowDown'])
    for (let i = 0; i < 30; i++) {
      await run(1000)
      check()
    }
  })

  it('draws once: its node count stays the same over seconds of play and every interaction', async () => {
    const { inside, key, press, run, rerender, ref } = await play([], 300, 'never')
    const count = () => inside.querySelectorAll('*').length
    const n = count()
    await run(3000)
    expect(count()).toBe(n)
    for (const k of hotAirBalloon.keys.flatMap((h) => h.keys)) {
      press([k])
      await run(400)
      expect(count()).toBe(n)
    }
    key('keydown', ' ')
    await run(4000)
    key('keyup', ' ')
    act(() => void inside.querySelector('.control')!.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    await run(800)
    act(() => void inside.querySelector('.control')!.dispatchEvent(new Event('pointerup', { bubbles: true })))
    expect(count()).toBe(n)
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="never" progress={0.5} />)
    await run(3000)
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="never" progress={null} />)
    await run(3000)
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="never" progress={0.5} done />)
    await run(6000)
    press(['ArrowDown', 'ArrowDown', 'ArrowDown'])
    await run(8000)
    expect(count()).toBe(n)
  })

  it('with reduced motion nothing drifts or flickers: the clouds, the sway and the flame hold still', async () => {
    const { key, run, inside, balloon } = await play()
    const clouds = () => [...inside.querySelectorAll('.cloud')].map((c) => c.getAttribute('transform')).join()
    const before = [clouds(), balloon()]
    await run(2000)
    expect([clouds(), balloon()]).toEqual(before)
    key('keydown', ' ')
    await run(100)
    const flame = inside.querySelector('.fo')!.getAttribute('d')
    await run(150)
    expect(inside.querySelector('.fo')!.getAttribute('d')).toBe(flame)
    expect(clouds()).toBe(before[0])
    key('keyup', ' ')
  })

  it('a progress prop makes it determinate, and the altitude follows it', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureHotAirBalloon, { reducedMotion: 'always' })
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · ALT 30 M')
    expect(handle().getSnapshot().state).toBe('HOLDING AT 50%')
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="always" progress={0.75} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · ALT 45 M')
  })

  it('in full motion the pilot flies it to the progress, then holds it there', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHotAirBalloon, { reducedMotion: 'never', progress: 0.9 })
    await run(500)
    expect(handle().getSnapshot().state).toBe('CLIMBING TO 90%')
    await run(25000)
    const alt = Number(/ALT (\d+) M/.exec(handle().getSnapshot().readout)![1])
    expect(alt).toBeGreaterThanOrEqual(50)
    expect(alt).toBeLessThanOrEqual(58)
  })

  it('done climbs to the top of the tether and comes to rest there', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureHotAirBalloon, { reducedMotion: 'never', progress: 0.4 })
    await run(300)
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="never" progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('FINISHING · CLIMBING TO THE TOP')
    await run(20000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · ALT 60 M')
    expect(handle().getSnapshot().state).toBe('COMPLETE · AT THE TOP OF THE TETHER')
  })

  it('the handle drives it too: setProgress, null for indeterminate, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureHotAirBalloonHandle>()
    const { rerender } = mount(MiniatureHotAirBalloon, { reducedMotion: 'always' })
    rerender(<MiniatureHotAirBalloon ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · ALT 15 M')
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().state).toBe('INDETERMINATE · CRUISING')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · ALT 60 M')
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · AT THE TOP OF THE TETHER')
  })

  it('P steps the progress by a quarter, Enter finishes, and the burner takes it back by hand', async () => {
    const { press, run, snap } = await play(['p'])
    expect(snap().readout).toBe('PROGRESS 25% · ALT 15 M')
    press(['p'])
    await run(300)
    expect(snap().readout).toBe('PROGRESS 50% · ALT 30 M')
    press(['Enter'])
    await run(300)
    expect(snap().readout).toBe('PROGRESS 100% · ALT 60 M')
    press([' '])
    await run(300)
    expect(snap().readout).toMatch(/^ALT 60 M · ENV \d+°C · WIND CALM$/)
    expect(snap().state).toBe('BURNER ON · TETHER TAUT')
  })

  it('a still balloon is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureHotAirBalloon, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · ALT 30 M')
  })
})
