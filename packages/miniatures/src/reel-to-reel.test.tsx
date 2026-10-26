import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureReelToReel, type MiniatureReelToReelHandle, type MiniatureReelToReelKey, reelToReel } from './reel-to-reel'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureReelToReel, reelToReel)

describe('Reel-to-reel tape recorder', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (states jump, nothing spins), presses the keys in order and lets it settle. */
  const deck = async (keys: MiniatureReelToReelKey[] = [], settle = 200, props = {}) => {
    const run = useFrames()
    const view = mount(MiniatureReelToReel, { reducedMotion: 'always', ...props })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(50)
    }
    await run(settle)
    return {
      ...view,
      run,
      snap: () => view.handle().getSnapshot(),
      press: async (k: MiniatureReelToReelKey, ms = 100) => {
        act(() => view.handle().press(k))
        await run(ms)
      },
    }
  }
  /** The reels' hub angles in degrees, supply first. */
  const angles = (svg: SVGSVGElement) =>
    [...svg.querySelectorAll('.spin')].map((g) => Number(/rotate\((-?[\d.]+)\)/.exec(g.getAttribute('transform') ?? '')?.[1] ?? 0))
  const lamp = (svg: SVGSVGElement) => svg.querySelector('.rec')!
  const seconds = (readout: string) => {
    const [m, s] = readout.slice(0, 5).split(':').map(Number)
    return m! * 60 + s!
  }

  it('plays the mix by default, as its metadata says', async () => {
    const { snap } = await deck()
    expect(snap().readout).toBe(reelToReel.initial.readout)
    expect(snap().state).toBe(reelToReel.initial.state)
    expect(snap().pressed).toEqual({})
  })

  it('both reels turn counterclockwise, each at the tape speed over its own pack: the thin take-up pack turns faster', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureReelToReel)
    await run(500)
    const [s0, t0] = angles(svg())
    await run(1000)
    const [s1, t1] = angles(svg())
    const supply = s1! - s0!
    const takeUp = t1! - t0!
    expect(supply).toBeLessThan(0)
    expect(takeUp).toBeLessThan(0)
    // At 01:12 the supply pack's radius is about 1.44 times the take-up's.
    expect(takeUp / supply).toBeGreaterThan(1.38)
    expect(takeUp / supply).toBeLessThan(1.5)
    expect(seconds(handle().getSnapshot().readout)).toBe(73)
  })

  it('the needles swing on the mix while it plays', async () => {
    const run = useFrames()
    const { svg } = mount(MiniatureReelToReel)
    await run(300)
    const needles = () => [...svg().querySelectorAll('.needle')].map((n) => n.getAttribute('transform'))
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      await run(120)
      seen.add(needles().join())
    }
    expect(seen.size).toBeGreaterThan(5)
  })

  it('Space stops the tape and plays it again', async () => {
    const { snap, press } = await deck([' '])
    expect(snap().readout).toBe('01:12 · −∞ DB · STOP')
    expect(snap().state).toBe('STOPPED · 03:48 LEFT')
    await press(' ')
    expect(snap().readout).toBe('01:12 · −7 DB · PLAY')
  })

  it('stopping, the reels coast to a halt and the needles fall back', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureReelToReel)
    await run(400)
    act(() => handle().press(' '))
    await run(600)
    const a = angles(svg())
    await run(400)
    expect(angles(svg())).toEqual(a)
    expect(handle().getSnapshot().readout).toMatch(/· −∞ DB · STOP$/)
  })

  it('R records from a stop and lights the lamp; R again punches out', async () => {
    const { snap, press, svg, run } = await deck([' ', 'r'], 50)
    expect(snap().readout).toBe('01:12 · −4 DB · REC')
    expect(snap().state).toBe('RECORDING · 15 IPS')
    expect(lamp(svg())).toHaveClass('on')
    await run(1600)
    expect(snap().state).toMatch(/^RECORDING · 15 IPS · 03:4\d LEFT$/)
    await press('r')
    expect(snap().state).toBe('PUNCH OUT · PLAYING')
    expect(snap().readout).toMatch(/· PLAY$/)
    expect(lamp(svg())).not.toHaveClass('on')
  })

  it('R while playing punches in', async () => {
    const { snap } = await deck(['r'], 50)
    expect(snap().state).toBe('PUNCH IN · RECORDING')
    expect(snap().readout).toMatch(/· REC$/)
  })

  it('what it records plays back: a take over the mix', async () => {
    const { snap, press, run } = await deck(['r'])
    await run(4000)
    await press(' ')
    await press('ArrowLeft')
    expect(snap().readout).toBe('00:00 · −∞ DB · STOP')
    // Back to where the take starts: through the mix, then the take.
    await press(' ')
    await run(70_000)
    expect(snap().state).toBe('PLAYING · 15 IPS · THE MIX')
    await run(3000)
    expect(snap().state).toBe('PLAYING · 15 IPS · YOUR TAKE')
    expect(snap().readout).toMatch(/ · −6 DB · PLAY$/)
  })

  it('→ fast-forwards to the end and ← rewinds to the head, jumping there with reduced motion', async () => {
    const { snap, press } = await deck(['ArrowRight'])
    expect(snap().readout).toBe('05:00 · −∞ DB · STOP')
    expect(snap().state).toBe('END OF TAPE · ← REWINDS')
    await press(' ')
    expect(snap().state).toBe('END OF TAPE · ← REWINDS')
    await press('ArrowLeft')
    expect(snap().readout).toBe('00:00 · −∞ DB · STOP')
    expect(snap().state).toBe('STOPPED · AT THE HEAD')
  })

  it('winds fast with the tape lifted off the heads, the reels a blur, and stops at the end', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureReelToReel)
    await run(300)
    const tape = svg().querySelector('.tape')!.getAttribute('d')
    act(() => handle().press('ArrowRight'))
    await run(2000)
    expect(handle().getSnapshot().readout).toMatch(/· −∞ DB · FF$/)
    expect(seconds(handle().getSnapshot().readout)).toBeGreaterThan(90)
    expect(svg().querySelector('.tape')!.getAttribute('d')).not.toBe(tape)
    expect(Number((svg().querySelector('.reel-blur') as SVGElement).style.opacity)).toBeGreaterThan(0.3)
    await run(20_000)
    expect(handle().getSnapshot().readout).toBe('05:00 · −∞ DB · STOP')
  })

  it('at the end of the tape it rewinds to the head and plays again', async () => {
    const { snap, handle, run } = await deck()
    act(() => handle() && (handle() as MiniatureReelToReelHandle).setProgress(0.99))
    await run(100)
    act(() => (handle() as MiniatureReelToReelHandle).setProgress(null))
    await run(4000)
    expect(snap().state).toMatch(/^END OF TAPE/)
    await run(1600)
    expect(snap().readout).toMatch(/^00:0\d · .* · PLAY$/)
  })

  it('T threads a fresh reel of blank tape; it plays silent until something is recorded on it', async () => {
    const { snap, press, run } = await deck(['t'])
    expect(snap().readout).toBe('00:00 · −∞ DB · STOP')
    expect(snap().state).toBe('FRESH REEL · BLANK TAPE')
    await press(' ')
    expect(snap().state).toBe('PLAYING · 15 IPS · BLANK TAPE')
    expect(snap().readout).toBe('00:00 · −∞ DB · PLAY')
    await press('r')
    await run(3000)
    await press('ArrowLeft')
    await press(' ', 1000)
    expect(snap().state).toBe('PLAYING · 15 IPS · YOUR TAKE')
  })

  it('threading takes the old reels off and puts fresh ones on, the leader drawn through the path', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureReelToReel)
    await run(300)
    act(() => handle().press('t'))
    await run(300)
    expect(handle().getSnapshot().readout).toMatch(/· LOAD$/)
    expect(handle().getSnapshot().state).toBe('THREADING A FRESH REEL')
    await run(500)
    expect(svg().querySelector('.tape')!.getAttribute('d')).toBe('')
    await run(2200)
    expect(handle().getSnapshot().readout).toBe('00:00 · −∞ DB · STOP')
    expect(handle().getSnapshot().state).toBe('FRESH REEL · BLANK TAPE')
    expect(svg().querySelector('.tape')!.getAttribute('d')).not.toBe('')
  })

  it('a progress prop makes the tape travel with it, recording; done winds it to the end', async () => {
    const run = useFrames()
    const { handle, rerender, ref, svg } = mount(MiniatureReelToReel, { reducedMotion: 'always' })
    rerender(<MiniatureReelToReel ref={ref} reducedMotion="always" progress={0.5} />)
    await run(400)
    expect(handle().getSnapshot().readout).toBe('02:30 · −∞ DB · REC')
    expect(handle().getSnapshot().state).toBe('PROGRESS 50% · REC PAUSE')
    expect(lamp(svg())).toHaveClass('on')
    rerender(<MiniatureReelToReel ref={ref} reducedMotion="always" progress={0.75} />)
    await run(400)
    expect(handle().getSnapshot().readout).toBe('03:45 · −∞ DB · REC')
    rerender(<MiniatureReelToReel ref={ref} reducedMotion="always" progress={0.75} done />)
    await run(400)
    expect(handle().getSnapshot().readout).toBe('05:00 · −∞ DB · STOP')
    expect(handle().getSnapshot().state).toBe('COMPLETE · TAPE AT THE END')
    expect(lamp(svg())).not.toHaveClass('on')
  })

  it('with motion the reels wind to the progress and hold there', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureReelToReel, { progress: 0.4 })
    await run(1000)
    expect(handle().getSnapshot().state).toMatch(/^PROGRESS \d+% · RECORDING$/)
    await run(8000)
    expect(handle().getSnapshot().readout).toBe('02:00 · −∞ DB · REC')
    expect(handle().getSnapshot().state).toBe('PROGRESS 40% · REC PAUSE')
  })

  it('with motion done winds the rest through and stops, the record lamp out', async () => {
    const run = useFrames()
    const { handle, rerender, ref, svg } = mount(MiniatureReelToReel, { progress: 0.6 })
    await run(6000)
    rerender(<MiniatureReelToReel ref={ref} progress={0.6} done />)
    await run(500)
    expect(handle().getSnapshot().state).toMatch(/^FINISHING · \d+%$/)
    await run(12_000)
    expect(handle().getSnapshot().readout).toBe('05:00 · −∞ DB · STOP')
    expect(handle().getSnapshot().state).toBe('COMPLETE · TAPE AT THE END')
    expect(lamp(svg())).not.toHaveClass('on')
  })

  it('the handle drives it too: setProgress, null to run free again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureReelToReelHandle>()
    const { rerender } = mount(MiniatureReelToReel, { reducedMotion: 'always' })
    rerender(<MiniatureReelToReel ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('01:15 · −∞ DB · REC')
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('01:15 · −7 DB · PLAY')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · TAPE AT THE END')
  })

  it('a still deck is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureReelToReel, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('02:30 · −∞ DB · REC')
  })

  it('with reduced motion nothing spins or swings: the reels and needles hold still while it plays', async () => {
    const { svg, run, snap } = await deck()
    const still = () => [...angles(svg()), ...[...svg().querySelectorAll('.needle')].map((n) => n.getAttribute('transform'))].join()
    const before = still()
    await run(2500)
    expect(still()).toBe(before)
    expect(seconds(snap().readout)).toBe(74)
  })

  it('its parts are buttons: the transport keys, and the reels thread a fresh one', async () => {
    const { inside, snap, run } = await deck()
    const click = async (label: string) => {
      act(() => void (inside.querySelector(`[aria-label="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click')))
      await run(100)
    }
    await click('Stop (Space)')
    expect(snap().readout).toMatch(/· STOP$/)
    await click('Play (Space)')
    expect(snap().readout).toMatch(/· PLAY$/)
    await click('Record (R)')
    expect(snap().readout).toMatch(/· REC$/)
    await click('Rewind (Left arrow)')
    expect(snap().readout).toBe('00:00 · −∞ DB · STOP')
    await click('Fast-forward (Right arrow)')
    expect(snap().readout).toBe('05:00 · −∞ DB · STOP')
    await click('Thread a fresh reel (T)')
    expect(snap().state).toBe('FRESH REEL · BLANK TAPE')
  })

  it('redraws in place: the drawing keeps its node count through play and every key', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureReelToReel)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const key of [' ', ' ', 'r', 'r', 'ArrowRight', 'ArrowLeft', 't', ' '] as const) {
      act(() => handle().press(key))
      await run(1500)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    act(() => (handle() as MiniatureReelToReelHandle).setProgress(0.6))
    await run(3000)
    act(() => (handle() as MiniatureReelToReelHandle).done())
    await run(6000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
