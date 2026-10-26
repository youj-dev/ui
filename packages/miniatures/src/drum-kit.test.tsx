import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureDrumKit, type MiniatureDrumKitKey, drumKit } from './drum-kit'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureDrumKit, drumKit)

describe('Acoustic drum kit', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureDrumKitKey[] = [], settle = 200, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureDrumKit, { reducedMotion })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(30)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const part = (inside: ShadowRoot, label: string) => inside.querySelector(`[aria-label="${label}"]`) as SVGGElement
  const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click')))
  /** A drum's head group, which dips when it's hit. */
  const dip = (inside: ShadowRoot, label: string) => [...part(inside, label).querySelector('g')!.children].find((c) => c.localName === 'g')!

  it('waits at 96 BPM with the hi-hat closed, ready to play', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(drumKit.initial)
  })

  it.each([
    ['k', 'KICK'],
    ['s', 'SNARE'],
    ['t', 'HIGH TOM'],
    ['y', 'MID TOM'],
    ['f', 'FLOOR TOM'],
    ['h', 'HI-HAT'],
    ['o', 'OPEN HI-HAT'],
    ['c', 'CRASH'],
    ['r', 'RIDE'],
  ] as const)('%s hits it, and the readout names the last hit: %s', async (key, name) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(`96 BPM · LAST HIT ${name}`)
  })

  it('O opens the hi-hat, lifting the top cymbal; H closes it again', async () => {
    const { handle, inside, run, snap } = await play(['o'])
    const clutch = part(inside, 'Hi-hat (H, or O to open it)').lastElementChild!
    expect(snap().state).toBe('HI-HAT OPEN / H CLOSES IT')
    expect(clutch).toHaveAttribute('transform', 'translate(0 -4.60)')
    act(() => handle().press('h'))
    await run(100)
    expect(snap().state).toBe('READY / SPACE PLAYS THE GROOVE')
    expect(clutch).toHaveAttribute('transform', 'translate(0 0.00)')
  })

  it('the arrows set the tempo: up and down by 4, right and left by 1, from 60 to 180', async () => {
    const { handle, run, snap } = await play(['ArrowUp', 'ArrowRight'])
    expect(snap().readout).toBe('101 BPM · LAST HIT —')
    act(() => handle().press('ArrowDown'))
    act(() => handle().press('ArrowLeft'))
    await run(50)
    expect(snap().readout).toBe('96 BPM · LAST HIT —')
    for (let i = 0; i < 12; i++) act(() => handle().press('ArrowDown'))
    await run(50)
    expect(snap().readout).toBe('60 BPM · LAST HIT —')
    expect(snap().state).toBe('SLOWEST · 60 BPM')
    for (let i = 0; i < 40; i++) act(() => handle().press('ArrowUp'))
    await run(50)
    expect(snap().readout).toBe('180 BPM · LAST HIT —')
  })

  it('Space plays the groove, bar by bar, and stops it', async () => {
    const { handle, run, snap } = await play([' '], 100)
    expect(snap().state).toMatch(/^GROOVE · BAR 1 · BEAT 1$/)
    // The groove opens with a crash and a kick on the one.
    expect(snap().readout).toMatch(/^96 BPM · LAST HIT (CRASH|KICK)$/)
    // At 96 BPM a bar of four beats takes 2.5 s.
    await run(2600)
    expect(snap().state).toMatch(/^GROOVE · BAR 2 · BEAT 1$/)
    act(() => handle().press(' '))
    await run(100)
    expect(snap().state).toBe('STOPPED / SPACE PLAYS IT AGAIN')
    const readout = snap().readout
    await run(1500)
    expect(snap().state).toBe('READY / SPACE PLAYS THE GROOVE')
    expect(snap().readout).toBe(readout)
  })

  it('a faster tempo plays the groove faster', async () => {
    const { handle, run, snap } = await play(Array(20).fill('ArrowUp'))
    expect(snap().readout).toMatch(/^176 BPM/)
    act(() => handle().press(' '))
    // At 176 BPM a bar takes about 1.36 s.
    await run(1500)
    expect(snap().state).toMatch(/^GROOVE · BAR 2 · BEAT 1$/)
  })

  it('its parts are buttons: a click hits each drum and cymbal, and the stool plays the groove', async () => {
    const { inside, run, snap } = await play()
    for (const [label, name] of [
      ['Kick drum (K)', 'KICK'],
      ['Snare drum (S)', 'SNARE'],
      ['High tom (T)', 'HIGH TOM'],
      ['Mid tom (Y)', 'MID TOM'],
      ['Floor tom (F)', 'FLOOR TOM'],
      ['Hi-hat (H, or O to open it)', 'HI-HAT'],
      ['Crash cymbal (C)', 'CRASH'],
      ['Ride cymbal (R)', 'RIDE'],
    ] as const) {
      click(part(inside, label))
      await run(50)
      expect(snap().readout).toBe(`96 BPM · LAST HIT ${name}`)
    }
    click(part(inside, 'Drum stool: play or stop the groove (Space)'))
    await run(50)
    expect(snap().state).toMatch(/^GROOVE · BAR 1/)
  })

  it('heads dip and ring, and cymbals wobble, then settle', async () => {
    const { handle, inside, run } = await play([], 100, 'never')
    const crash = part(inside, 'Crash cymbal (C)').querySelector('.disk')!
    const rest = crash.getAttribute('d')
    act(() => handle().press('s'))
    act(() => handle().press('c'))
    await run(40)
    expect(dip(inside, 'Snare drum (S)').getAttribute('transform')).not.toBe('translate(0.00 0.00)')
    expect(crash.getAttribute('d')).not.toBe(rest)
    await run(1500)
    expect(dip(inside, 'Snare drum (S)')).toHaveAttribute('transform', 'translate(0.00 0.00)')
  })

  it('with reduced motion nothing travels: heads and cymbals hold still and the hi-hat jumps', async () => {
    const { handle, inside, run } = await play()
    const crash = part(inside, 'Crash cymbal (C)').querySelector('.disk')!
    const rest = crash.getAttribute('d')
    for (const key of ['s', 'k', 'c', 'r'] as const) act(() => handle().press(key))
    await run(16)
    expect(dip(inside, 'Snare drum (S)')).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(dip(inside, 'Kick drum (K)')).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(crash.getAttribute('d')).toBe(rest)
    act(() => handle().press('o'))
    await run(16)
    expect(part(inside, 'Hi-hat (H, or O to open it)').lastElementChild).toHaveAttribute('transform', 'translate(0 -4.60)')
  })

  it('redraws in place: the drawing does not grow over seconds of play and every interaction', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureDrumKit)
    await run(300)
    const nodes = svg().querySelectorAll('*').length
    for (const key of drumKit.keys.flatMap((hint) => hint.keys)) {
      act(() => handle().press(key))
      await run(40)
    }
    for (const control of inside.querySelectorAll('[role=button]')) {
      click(control)
      await run(40)
    }
    await run(4000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
