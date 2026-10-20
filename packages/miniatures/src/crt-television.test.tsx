import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureCrtTelevision, crtTelevision } from './crt-television'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCrtTelevision, crtTelevision)

// Port log: preserve the random snow, jitter and audio. Seeded lab/port DOM
// comparisons (including snow pixel-buffer hashes) matched in light and dark
// at 0, 1500, 3500, 5000, 6500 and 8000 ms; browser pixel review was blocked.
describe('CrtTelevision', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const picture = (inside: ShadowRoot) => inside.querySelector<SVGGElement>('[clip-path="url(#scr)"]')!
  const knobRotation = (inside: ShadowRoot, label: string) => inside.querySelector(`[aria-label^="${label}"] g[transform^="rotate("]`)!
  const scenes = (inside: ShadowRoot) => [...picture(inside).firstElementChild!.children].filter((child): child is SVGGElement => child.localName === 'g')

  it('starts off on channel 2, with volume 5 and the picture hidden', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toMatchObject(crtTelevision.initial)
    expect(svg()).not.toHaveClass('on')
    expect(picture(inside).style.display).toBe('none')
    expect(scenes(inside)).toHaveLength(6)
    expect(knobRotation(inside, 'Channel dial')).toHaveAttribute('transform', 'rotate(-150.00)')
    expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', 'rotate(-150)')
    expect(inside.querySelector('.halo')).toHaveStyle({ opacity: '0' })
  })

  it('O switches the picture, pilot jewel and volume knob on and off', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    await run(300)
    expect(handle().getSnapshot().readout).toBe('CH 2 · TEST CARD · VOL 5')
    expect(handle().getSnapshot().state).toBe('SNOWY · SIGNAL 50% · ANTENNA -15°')
    expect(svg()).toHaveClass('on')
    expect(picture(inside).style.display).toBe('')
    expect(inside.querySelector('[aria-label^="Volume and power"]')).toHaveAttribute('aria-pressed', 'true')
    expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', 'rotate(0)')
    expect(Number(inside.querySelector<SVGElement>('.halo')!.style.opacity)).toBeGreaterThan(0)
    act(() => handle().press('o'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('OFF · PRESS O')
    expect(svg()).not.toHaveClass('on')
    expect(picture(inside).style.display).toBe('none')
    expect(inside.querySelector('[aria-label^="Volume and power"]')).toHaveAttribute('aria-pressed', 'false')
    expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', 'rotate(-150)')
  })

  it('warms the raster up and collapses it to an afterglow when motion is allowed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCrtTelevision)
    act(() => handle().press('o'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('WARMING UP · ANTENNA -15°')
    expect(picture(inside).firstElementChild!.getAttribute('transform')).not.toContain('scale(1.00 1.00)')
    await run(1400)
    expect(handle().getSnapshot().state).toBe('SNOWY · SIGNAL 50% · ANTENNA -15°')
    expect(picture(inside).firstElementChild!).toHaveAttribute('transform', expect.stringContaining('scale(1.00 1.00)'))
    act(() => handle().press('o'))
    await run(600)
    expect(handle().getSnapshot().state).toBe('OFF · AFTERGLOW')
    expect(picture(inside).style.display).toBe('none')
    expect(Number(inside.querySelector('.dot')!.getAttribute('opacity'))).toBeGreaterThan(0)
    await run(2200)
    expect(handle().getSnapshot().state).toBe('OFF · PRESS O')
    expect(inside.querySelector('.dot')).toHaveAttribute('opacity', '0.00')
  })

  it('Left and Right wrap the channel dial between 2 and 13', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    act(() => handle().press('ArrowLeft'))
    await run(300)
    expect(handle().getSnapshot().readout).toBe('CH 13 · STAND BY · VOL 5')
    expect(handle().getSnapshot().state).toBe('CLEAR · ANTENNA -15°')
    expect(knobRotation(inside, 'Channel dial')).toHaveAttribute('transform', 'rotate(180.00)')
    expect(scenes(inside).filter((scene) => scene.style.display !== 'none')).toEqual([scenes(inside)[5]])
    act(() => handle().press('ArrowRight'))
    await run(300)
    expect(handle().getSnapshot().readout).toBe('CH 2 · TEST CARD · VOL 5')
    expect(knobRotation(inside, 'Channel dial')).toHaveAttribute('transform', 'rotate(-150.00)')
    expect(scenes(inside).filter((scene) => scene.style.display !== 'none')).toEqual([scenes(inside)[0]])
  })

  it('Right selects each station picture and snow on the empty channels', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    const stations: Record<number, [string, number]> = {
      2: ['TEST CARD', 0], 4: ['NEWS', 1], 7: ['LAUNCH', 2],
      9: ['CARTOON', 3], 11: ['WESTERN', 4], 13: ['STAND BY', 5],
    }
    for (const channel of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 2]) {
      act(() => handle().press('ArrowRight'))
      await run(200)
      const station = stations[channel]
      expect(handle().getSnapshot().readout).toBe(`CH ${channel} · ${station?.[0] ?? 'NO STATION'} · VOL 5`)
      expect(knobRotation(inside, 'Channel dial')).toHaveAttribute('transform', `rotate(${(-150 + (channel - 2) * 30).toFixed(2)})`)
      expect(scenes(inside).filter((scene) => scene.style.display !== 'none')).toEqual(station ? [scenes(inside)[station[1]]] : [])
      if (!station) {
        expect(handle().getSnapshot().state).toBe('SNOW · ANTENNA -15°')
        expect(inside.querySelector('.snow')).toHaveAttribute('opacity', '1.00')
      }
    }
  })

  it('A turns the rabbit ears through clear, snowy and lost reception and wraps around', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    await run(200)
    const rod = inside.querySelector('[aria-label^="Rabbit-ear"] path.rc')!
    let previous = rod.getAttribute('d')
    for (const [state, snow] of [
      ['CLEAR · ANTENNA 15°', '0.02'],
      ['SNOWY · SIGNAL 50% · ANTENNA 45°', '0.44'],
      ['LOST · TURN ANTENNA · 75°', '0.86'],
      ['LOST · TURN ANTENNA · -45°', '0.86'],
      ['SNOWY · SIGNAL 50% · ANTENNA -15°', '0.44'],
    ]) {
      act(() => handle().press('a'))
      await run(200)
      expect(handle().getSnapshot().state).toBe(state)
      expect(handle().getSnapshot().readout).toBe('CH 2 · TEST CARD · VOL 5')
      expect(inside.querySelector('.snow')).toHaveAttribute('opacity', snow)
      expect(rod.getAttribute('d')).not.toBe(previous)
      previous = rod.getAttribute('d')
    }
  })

  it('Up and Down turn the volume knob and clamp the volume at 0 and 10', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCrtTelevision, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    act(() => handle().press('ArrowUp'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('CH 2 · TEST CARD · VOL 6')
    expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', 'rotate(24)')
    act(() => handle().press('ArrowDown'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('CH 2 · TEST CARD · VOL 5')
    expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', 'rotate(0)')
    for (const [key, volume, angle] of [['ArrowDown', 0, -120], ['ArrowUp', 10, 120]] as const) {
      act(() => { for (let i = 0; i < 12; i++) handle().press(key) })
      await run(200)
      expect(handle().getSnapshot().readout).toBe(`CH 2 · TEST CARD · VOL ${volume}`)
      expect(handle().getSnapshot().state).toBe('SNOWY · SIGNAL 50% · ANTENNA -15°')
      expect(knobRotation(inside, 'Volume and power')).toHaveAttribute('transform', `rotate(${angle})`)
    }
  })
})
