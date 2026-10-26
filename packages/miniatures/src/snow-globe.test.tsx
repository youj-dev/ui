import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MiniatureProps } from './engine/types'
import { MiniatureSnowGlobe, type MiniatureSnowGlobeKey, snowGlobe } from './snow-globe'
import { installAudio, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSnowGlobe, snowGlobe)

describe('Snow globe', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it run. */
  const play = async (keys: MiniatureSnowGlobeKey[] = [], settle = 400, props: MiniatureProps = { reducedMotion: 'always' }) => {
    const run = useFrames()
    const view = mount(MiniatureSnowGlobe, props)
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot(), said: () => view.inside.querySelector('[role=status]')!.textContent }
  }
  const settled = (readout: string) => Number(/(\d+)%$/.exec(readout)![1])
  const flakes = (svg: SVGSVGElement) => [...svg.querySelectorAll('.fl')].map((n) => `${n.getAttribute('cx')},${n.getAttribute('cy')},${n.getAttribute('r')}`).join(' ')
  const part = (inside: ShadowRoot, label: string) => inside.querySelector(`[aria-label="${label}"]`) as SVGGElement
  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (target: Element, svg: SVGSVGElement, type: string, x: number, y: number) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }
  const shake = async (inside: ShadowRoot, svg: SVGSVGElement, run: (ms: number) => Promise<void>) => {
    const globe = part(inside, 'Shake the snow globe (Space)')
    pointer(globe, svg, 'pointerdown', 0, -60)
    for (let i = 1; i <= 12; i++) {
      pointer(svg, svg, 'pointermove', i % 2 ? 24 : -24, -60 + (i % 3) * 4)
      await run(40)
    }
    pointer(svg, svg, 'pointerup', 0, -60)
  }

  it('starts with the snow still falling and the music box still, when motion is reduced', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(snowGlobe.initial.readout)
    expect(snap().state).toBe(snowGlobe.initial.state)
    expect(snap().pressed).toEqual(snowGlobe.initial.pressed)
  })

  it('with reduced motion the snow settles in steps, holding still between them', async () => {
    const { run, snap, svg } = await play([], 100)
    const first = flakes(svg())
    await run(1500)
    expect(flakes(svg())).toBe(first)
    expect(snap().readout).toBe(snowGlobe.initial.readout)
    await run(1600)
    expect(flakes(svg())).not.toBe(first)
    expect(settled(snap().readout)).toBeGreaterThan(30)
    // A few jumps, not a stream of frames: six seconds show only a handful of pictures.
    const seen = new Set([flakes(svg())])
    for (let i = 0; i < 60; i++) {
      await run(100)
      seen.add(flakes(svg()))
    }
    expect(seen.size).toBeLessThanOrEqual(5)
    await run(12000)
    expect(snap().readout).toBe('SETTLED · 100%')
    expect(svg().querySelectorAll('.fl[r="0"]').length).toBeGreaterThan(100)
    // Settled, it holds: the few flakes still floating don't step on.
    const rest = flakes(svg())
    await run(8000)
    expect(flakes(svg())).toBe(rest)
  })

  it('Space shakes it: the snow whirls up off the ground, then slowly settles', async () => {
    const { handle, run, snap } = await play([], 100, {})
    act(() => handle().press(' '))
    await run(300)
    expect(snap().readout).toBe('WHIRLING · 0%')
    await run(6000)
    expect(snap().readout).toMatch(/^SETTLING · \d+%$/)
    const midway = settled(snap().readout)
    expect(midway).toBeGreaterThan(0)
    await run(3000)
    expect(settled(snap().readout)).toBeGreaterThan(midway)
    await run(12000)
    expect(snap().readout).toBe('SETTLED · 100%')
  })

  it('with reduced motion Space jumps the snow up into the glass, then settles it in steps', async () => {
    const { handle, run, snap, svg, said } = await play([], 100)
    act(() => handle().press(' '))
    await run(50)
    expect(snap().readout).toBe('WHIRLING · 0%')
    expect(said()).toBe('Shaken: the snow whirls, then slowly settles.')
    expect(svg().querySelectorAll('.fl[r="0"]')).toHaveLength(0)
    await run(14000)
    expect(snap().readout).toBe('SETTLED · 100%')
  })

  it('the arrows swirl the settled snow one way or the other', async () => {
    const { handle, run, snap, said } = await play([], 16000)
    expect(snap().readout).toBe('SETTLED · 100%')
    act(() => handle().press('ArrowLeft'))
    await run(50)
    expect(said()).toBe('Swirled to the left.')
    expect(settled(snap().readout)).toBeLessThan(100)
    await run(16000)
    act(() => handle().press('ArrowRight'))
    await run(50)
    expect(said()).toBe('Swirled to the right.')
    expect(settled(snap().readout)).toBeLessThan(100)
  })

  it('a held arrow keeps swirling, with one sound per press rather than per repeat', async () => {
    const audio = installAudio()
    try {
      const { handle, host, run, snap } = await play([], 16000, { sound: true })
      act(() => void host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
      act(() => handle().press('ArrowRight'))
      const swooshes = vi.spyOn(audio.created[0]!, 'createBufferSource')
      for (let i = 0; i < 6; i++) act(() => void host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, composed: true })))
      await run(2000)
      expect(swooshes).not.toHaveBeenCalled()
      expect(settled(snap().readout)).toBeLessThan(100)
    } finally {
      audio.uninstall()
    }
  })

  it('W winds the music box: it plays its tune through once, slows as the spring runs down, and stops', async () => {
    const { handle, run, snap, said } = await play(['w'], 100)
    expect(snap().state).toBe('WINDING THE MUSIC BOX')
    await run(1000)
    expect(snap().state).toMatch(/^PLAYING · SPRING (100|9\d)%$/)
    expect(said()).toBe('Wound: the music box plays.')
    await run(12000)
    expect(snap().state).toMatch(/^PLAYING · SPRING [3-5]\d%$/)
    await run(9000)
    expect(snap().state).toMatch(/^RUNNING DOWN · SPRING \d+%$/)
    await run(6000)
    expect(snap().state).toBe('MUSIC BOX STILL · W WINDS IT')
    expect(said()).toBe('The music box has run down.')
    act(() => handle().press('w'))
    await run(100)
    expect(snap().state).toBe('WINDING THE MUSIC BOX')
  })

  it('winding it again while it plays tops the spring up', async () => {
    const { handle, run, snap } = await play(['w'], 8000)
    expect(snap().state).toMatch(/^PLAYING · SPRING [6-7]\d%$/)
    act(() => handle().press('w'))
    await run(1200)
    expect(snap().state).toMatch(/^PLAYING · SPRING (100|9\d)%$/)
  })

  it('the key turns and the skater glides while it plays; with reduced motion both hold', async () => {
    const pose = (inside: ShadowRoot) => [...part(inside, 'Wind the music box (W)').querySelectorAll('ellipse')].map((n) => n.getAttribute('ry')).join()
    const skater = (svg: SVGSVGElement) => [...svg.querySelectorAll('g[transform^="translate"]')].map((n) => n.getAttribute('transform')).join()
    const full = await play(['w'], 2000, {})
    const [key, glide] = [pose(full.inside), skater(full.svg())]
    await full.run(1500)
    expect(pose(full.inside)).not.toBe(key)
    expect(skater(full.svg())).not.toBe(glide)
    cleanup()
    const still = await play(['w'], 2000)
    const [key2, glide2] = [pose(still.inside), skater(still.svg())]
    await still.run(1500)
    expect(still.snap().state).toMatch(/^PLAYING/)
    expect(pose(still.inside)).toBe(key2)
    expect(skater(still.svg())).toBe(glide2)
  })

  it('plays real notes when sound is on, after a gesture', async () => {
    const audio = installAudio()
    try {
      const { handle, host, run } = await play([], 100, { sound: true })
      act(() => void host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
      act(() => handle().press('w'))
      expect(audio.created).toHaveLength(1)
      const notes = vi.spyOn(audio.created[0]!, 'createOscillator')
      await run(3000)
      expect(notes.mock.calls.length).toBeGreaterThan(12)
    } finally {
      audio.uninstall()
    }
  })

  it('its parts are buttons: the globe shakes, the key winds', async () => {
    const { inside, run, snap } = await play([], 100)
    act(() => void part(inside, 'Shake the snow globe (Space)').dispatchEvent(new MouseEvent('click')))
    await run(50)
    expect(snap().readout).toBe('WHIRLING · 0%')
    act(() => void part(inside, 'Wind the music box (W)').dispatchEvent(new MouseEvent('click')))
    await run(50)
    expect(snap().state).toBe('WINDING THE MUSIC BOX')
  })

  it('dragging the globe about sloshes the water and whirls the snow', async () => {
    const { inside, run, snap, svg } = await play([], 16000, {})
    expect(snap().readout).toBe('SETTLED · 100%')
    await shake(inside, svg(), run)
    expect(snap().readout).toMatch(/^WHIRLING · \d+%$/)
    expect(settled(snap().readout)).toBeLessThan(60)
  })

  it('with reduced motion a drag whirls the snow when it ends, and the globe never moves', async () => {
    const { inside, run, snap, svg } = await play([], 16000)
    await shake(inside, svg(), run)
    await run(50)
    expect(snap().readout).toBe('WHIRLING · 0%')
    expect(part(inside, 'Shake the snow globe (Space)').getAttribute('transform') ?? '').toBe('')
  })

  it('settled and left alone, it gives itself a gentle swirl now and then', async () => {
    const { run, snap } = await play([], 100, {})
    await run(16000)
    expect(snap().readout).toBe('SETTLED · 100%')
    await run(9000)
    expect(settled(snap().readout)).toBeLessThan(100)
  })

  it('keeps its drawing fixed: no node is added over a long play and every interaction', async () => {
    const { handle, inside, run, svg } = await play([], 500, {})
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    for (const key of [' ', 'ArrowLeft', 'ArrowRight', 'w'] as const) {
      act(() => handle().press(key))
      await run(700)
    }
    await shake(inside, svg(), run)
    act(() => void part(inside, 'Wind the music box (W)').dispatchEvent(new MouseEvent('click')))
    await run(5000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })

  it('glows at night: its dark stylesheet lights the windows and the lamp', () => {
    const { inside, root } = mount(MiniatureSnowGlobe, { mode: 'dark' })
    expect(root()).toHaveAttribute('data-dark')
    const css = inside.querySelector('style')!.textContent!
    expect(css).toContain(':where(.yjm-root[data-dark]) .win,:where(.yjm-root[data-dark]) .lamp{filter:url(#glow)}')
    expect(css).toContain(':where(.yjm-root[data-dark]) .halo{opacity:.5}')
  })
})
