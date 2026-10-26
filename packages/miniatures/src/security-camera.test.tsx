import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSecurityCamera, type MiniatureSecurityCameraKey, securityCamera } from './security-camera'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSecurityCamera, securityCamera)

describe('Security camera', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (no patrol, no travel), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSecurityCameraKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureSecurityCamera, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (svg: SVGSVGElement, type: string, x: number, y: number) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void svg.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }
  const angles = (readout: string) => [...readout.matchAll(/([+−])(\d+\.\d)°/g)].map((m) => (m[1] === '−' ? -1 : 1) * Number(m[2]))

  it('rests at home, recording in daylight, when motion is reduced', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(securityCamera.initial.readout)
    expect(snap().state).toBe('HOME · REC · DAY')
    expect(snap().pressed).toEqual(securityCamera.initial.pressed)
  })

  it('patrols on its own, sweeping away from home', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureSecurityCamera)
    await run(2000)
    expect(handle().getSnapshot().state).toBe('PATROL · REC · DAY')
    expect(handle().getSnapshot().readout).not.toBe(securityCamera.initial.readout)
  })

  it.each([
    ['ArrowLeft', 'PAN −55.0° · TILT −14.0° · 1.0×'],
    ['ArrowRight', 'PAN −35.0° · TILT −14.0° · 1.0×'],
    ['ArrowUp', 'PAN −45.0° · TILT −9.0° · 1.0×'],
    ['ArrowDown', 'PAN −45.0° · TILT −19.0° · 1.0×'],
  ] as const)('%s jogs the head by hand', async (key, readout) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(readout)
    expect(snap().state).toBe('MANUAL · REC · DAY')
  })

  it('jogs add up, then it goes home again on its own', async () => {
    const { handle, run, snap } = await play(['ArrowRight', 'ArrowRight', 'ArrowUp'])
    expect(snap().readout).toBe('PAN −25.0° · TILT −9.0° · 1.0×')
    await run(5200)
    expect(snap().state).toBe('HOME · REC · DAY')
    act(() => handle().press('ArrowLeft'))
    await run(100)
    expect(snap().readout).toBe('PAN −55.0° · TILT −14.0° · 1.0×')
  })

  it('Z steps the zoom through 2× and 4× and back to 1×', async () => {
    const { handle, run, snap } = await play(['z'])
    expect(snap().readout).toBe('PAN −45.0° · TILT −14.0° · 2.0×')
    expect(snap().state).toBe('ZOOM 2× · 26° VIEW')
    act(() => handle().press('z'))
    await run(100)
    expect(snap().readout).toMatch(/· 4\.0×$/)
    act(() => handle().press('z'))
    await run(100)
    expect(snap().readout).toMatch(/· 1\.0×$/)
  })

  it('N switches the infrared night vision on, and off again', async () => {
    const { handle, run, snap, svg, inside } = await play(['n'])
    expect(snap().state).toBe('IR NIGHT · CUT FILTER OUT')
    expect(svg()).toHaveClass('night')
    expect(inside.querySelector('[aria-label="Night vision (N)"]')).toHaveAttribute('aria-pressed', 'true')
    await run(1600)
    expect(snap().state).toBe('HOME · REC · IR NIGHT')
    act(() => handle().press('n'))
    await run(100)
    expect(snap().state).toBe('DAY · CUT FILTER IN')
    expect(svg()).not.toHaveClass('night')
  })

  it('P closes the privacy shutter and parks the head; P again opens it', async () => {
    const { handle, run, snap, svg, inside } = await play(['z', 'p'])
    expect(snap().state).toBe('PRIVACY · SHUTTER CLOSED')
    expect(snap().readout).toBe('PAN −45.0° · TILT −10.0° · 1.0×')
    expect(svg()).toHaveClass('priv')
    expect(inside.querySelector('[aria-label="Privacy shutter (P)"]')).toHaveAttribute('aria-pressed', 'true')
    act(() => handle().press('p'))
    await run(100)
    expect(snap().state).toBe('SHUTTER OPEN · RECORDING')
    expect(svg()).not.toHaveClass('priv')
    await run(1600)
    expect(snap().state).toBe('HOME · REC · DAY')
  })

  it('with the shutter closed, it takes no snapshot and no jog or zoom', async () => {
    const { handle, run, snap } = await play(['p'])
    for (const [key, state] of [
      [' ', 'SHUTTER CLOSED · NO SNAPSHOT'],
      ['ArrowLeft', 'PRIVACY · P TO OPEN'],
      ['z', 'SHUTTER CLOSED · ZOOM HELD'],
    ] as const) {
      act(() => handle().press(key))
      await run(100)
      expect(snap().state).toBe(state)
      expect(snap().readout).toBe('PAN −45.0° · TILT −10.0° · 1.0×')
    }
  })

  it('Space takes a snapshot and logs it as an event', async () => {
    const { handle, run, snap } = await play([' '])
    expect(snap().state).toBe('SNAPSHOT · EVENT 01')
    act(() => handle().press(' '))
    await run(100)
    expect(snap().state).toBe('SNAPSHOT · EVENT 02')
  })

  it('follows the pointer over the yard, holds a moment when it leaves, then goes home', async () => {
    const { run, snap, svg } = await play()
    pointer(svg(), 'pointermove', -40, 105)
    await run(100)
    expect(snap().state).toBe('TRACKING · REC · DAY')
    const [left, down] = angles(snap().readout)
    expect(left).toBeLessThan(-5)
    expect(down).toBeLessThan(-10)
    pointer(svg(), 'pointermove', 60, 90)
    await run(100)
    expect(angles(snap().readout)[0]).toBeGreaterThan(5)
    act(() => void svg().dispatchEvent(new MouseEvent('pointerleave')))
    await run(400)
    expect(snap().state).toBe('TARGET LOST · REC · DAY')
    await run(1200)
    expect(snap().state).toBe('HOME · REC · DAY')
  })

  it('above its own wall it turns toward the pointer and lifts its head, never into the wall', async () => {
    const { run, snap, svg } = await play()
    pointer(svg(), 'pointermove', 80, -70)
    await run(100)
    const [pan, tilt] = angles(snap().readout)
    expect(pan).toBeGreaterThan(60)
    expect(tilt).toBeGreaterThan(0)
  })

  it('a fast movement counts as motion: an event is logged', async () => {
    const { run, snap, svg } = await play()
    pointer(svg(), 'pointermove', -60, 90)
    await run(16)
    pointer(svg(), 'pointermove', 60, 100)
    await run(100)
    expect(snap().state).toBe('MOTION · EVENT 01')
    pointer(svg(), 'pointermove', -60, 100)
    await run(100)
    expect(snap().state).toBe('MOTION · EVENT 01')
  })

  it('its parts are buttons: the head takes a snapshot, the sensor switches night, the junction box the shutter', async () => {
    const { inside, run, snap } = await play()
    act(() => (inside.querySelector('[aria-label="Take a snapshot (Space)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('SNAPSHOT · EVENT 01')
    act(() => (inside.querySelector('[aria-label="Night vision (N)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('IR NIGHT · CUT FILTER OUT')
    act(() => (inside.querySelector('[aria-label="Privacy shutter (P)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('PRIVACY · SHUTTER CLOSED')
  })
})
