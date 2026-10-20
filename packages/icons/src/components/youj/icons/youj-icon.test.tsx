import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { Bell, Check, Cloud, Settings, Sun } from 'lucide-react'
import type { ReactElement } from 'react'
import { YoujProvider } from '@youj/core'
import { installObservers, liveObservers } from '@youj/core/test-utils'
import { YoujIcon, type YoujIconEffect } from './youj-icon'

// Record every Motion animate() call while still running the real thing.
const calls: { target: unknown; keyframes: Record<string, unknown>; stop: ReturnType<typeof vi.fn> }[] = []
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    animate: vi.fn((...args: Parameters<typeof actual.animate>) => {
      const controls = (actual.animate as (...a: unknown[]) => ReturnType<typeof actual.animate>)(...args)
      const stop = vi.fn(() => controls.stop())
      calls.push({ target: args[0], keyframes: (args[1] ?? {}) as Record<string, unknown>, stop })
      return Object.assign(Object.create(controls), { stop, then: controls.then.bind(controls) })
    }),
  }
})

beforeAll(installObservers)
beforeEach(() => void (calls.length = 0))
afterEach(() => vi.useRealTimers())

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const renderFull = (ui: ReactElement) => render(ui, { wrapper: full })
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const onSvg = (svg: SVGSVGElement) => calls.filter((c) => c.target === svg).map((c) => c.keyframes)

const EFFECTS: YoujIconEffect[] = [
  'pop',
  'wiggle',
  'spin',
  'draw',
  'nudge',
  'pulse',
  'ring',
  'bounce',
  'flip',
  'swing',
  'float',
  'heartbeat',
  'shake',
  'jelly',
  'orbit',
  'tilt',
  'zoom-in',
  'zoom-out',
  'draw-in',
  'draw-out',
  'draw-sequence',
  'stagger-draw',
]

describe('triggers', () => {
  test.each(EFFECTS)('%s plays on hover of its parent control and settles on leave', (effect) => {
    const { container, getByRole } = renderFull(
      <button type="button">
        <YoujIcon icon={Bell} effect={effect} trigger="hover" /> Alerts
      </button>,
    )
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('data-effect', effect)
    expect(svg).toHaveAttribute('data-state', 'rest')
    const before = calls.length
    fireEvent.pointerEnter(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'active')
    expect(calls.length).toBeGreaterThan(before)
    const played = calls.length
    fireEvent.pointerLeave(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'rest')
    expect(calls.length).toBeGreaterThan(played)
  })

  test('keyboard focus on the parent plays it too', () => {
    const { container, getByRole } = renderFull(
      <button type="button">
        <YoujIcon icon={Settings} effect="flip" /> Settings
      </button>,
    )
    act(() => getByRole('button').focus())
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('a standalone hover icon never listens for focus, so browsers cannot make it a Tab stop', () => {
    const added: string[] = []
    const spy = vi.spyOn(SVGElement.prototype, 'addEventListener').mockImplementation(function (this: SVGElement, type: string) {
      added.push(type)
    })
    try {
      const { container } = renderFull(<YoujIcon icon={Bell} effect="swing" trigger="hover" />)
      expect(svgOf(container)).not.toHaveAttribute('tabindex')
      expect(added).toContain('pointerenter')
      expect(added).not.toContain('focusin')
      expect(added).not.toContain('focusout')
    } finally {
      spy.mockRestore()
    }
  })

  test('mount plays once; none never plays', () => {
    const { container } = renderFull(
      <>
        <YoujIcon icon={Bell} effect="swing" trigger="mount" />
        <YoujIcon icon={Bell} effect="swing" trigger="none" />
      </>,
    )
    const [mounted, none] = container.querySelectorAll('svg')
    expect(mounted).toHaveAttribute('data-state', 'active')
    fireEvent.pointerEnter(none!)
    expect(none).toHaveAttribute('data-state', 'rest')
    expect(onSvg(none as SVGSVGElement)).toHaveLength(0)
  })

  test('draw-in defaults to mount, since it rests undrawn', () => {
    const { container } = renderFull(<YoujIcon icon={Check} effect="draw-in" />)
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('loop replays one-shots, holds float, and cleans up', () => {
    vi.useFakeTimers()
    const before = liveObservers.size
    const { container, unmount } = renderFull(
      <>
        <YoujIcon icon={Bell} effect="heartbeat" trigger="loop" />
        <YoujIcon icon={Cloud} effect="float" trigger="loop" />
      </>,
    )
    const [beat, float] = container.querySelectorAll('svg')
    expect(beat).toHaveAttribute('data-state', 'active')
    act(() => vi.advanceTimersByTime(1200))
    expect(beat).toHaveAttribute('data-state', 'rest')
    act(() => vi.advanceTimersByTime(10_000))
    expect(float).toHaveAttribute('data-state', 'active')
    expect(liveObservers.size).toBe(before + 2)
    unmount()
    expect(liveObservers.size).toBe(before)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('controlled active plays a one-shot each time it turns true, and overrides hover', () => {
    const { container, rerender } = renderFull(<YoujIcon icon={Bell} effect="shake" active={false} />)
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    rerender(<YoujIcon icon={Bell} effect="shake" active />)
    expect(svg).toHaveAttribute('data-state', 'active')
    expect(onSvg(svg).some((k) => Array.isArray(k.x))).toBe(true)
  })
})

describe('choreography', () => {
  const played = (ui: ReactElement) => {
    const { container } = renderFull(ui)
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    return onSvg(svg)
  }

  test('one-shots start from the current value, so a re-trigger mid-flight never jumps', () => {
    for (const effect of ['pop', 'wiggle', 'ring', 'bounce', 'shake', 'swing', 'heartbeat'] as YoujIconEffect[]) {
      const [frames] = played(<YoujIcon icon={Bell} effect={effect} />)
      const values = Object.values(frames!)
      expect(values.every((v) => Array.isArray(v) && v[0] === null)).toBe(true)
    }
  })

  test('the original effects keep their choreography at default intensity', () => {
    expect(played(<YoujIcon icon={Bell} effect="pop" />)[0]).toEqual({ scale: [null, 0.82, 1.12, 1] })
    expect(played(<YoujIcon icon={Bell} effect="wiggle" />)[0]).toEqual({ rotate: [null, -12, 10, -6, 3, 0] })
    expect(played(<YoujIcon icon={Bell} effect="bounce" />)[0]).toEqual({ y: [null, -4, 0, -1.5, 0] })
    expect(played(<YoujIcon icon={Bell} effect="nudge" />)[0]).toEqual({ x: [null, 3, 0] })
  })

  test('intensity scales amplitude', () => {
    const at = (intensity: 'subtle' | 'default' | 'strong') => (played(<YoujIcon icon={Bell} effect="wiggle" intensity={intensity} />)[0]!.rotate as number[])[1]!
    expect(Math.abs(at('subtle'))).toBeLessThan(Math.abs(at('default')))
    expect(Math.abs(at('strong'))).toBeGreaterThan(Math.abs(at('default')))
  })

  test('nudge follows its direction, mirrored for right-to-left reading', () => {
    expect(played(<YoujIcon icon={Bell} effect="nudge" direction="up" />)[0]).toEqual({ y: [null, -3, 0] })
    expect(played(<YoujIcon icon={Bell} effect="nudge" direction="down" />)[0]).toEqual({ y: [null, 3, 0] })
    expect(played(<YoujIcon icon={Bell} effect="nudge" direction="left" />)[0]).toEqual({ x: [null, -3, 0] })
    const rtl = played(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <YoujIcon icon={Bell} effect="nudge" direction="right" />
      </div>,
    )
    expect(rtl[0]).toEqual({ x: [null, -3, 0] })
  })

  test('spin keeps turning forwards when re-triggered mid-turn, and settles by finishing the turn', () => {
    const { container } = renderFull(<YoujIcon icon={Settings} effect="spin" />)
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    fireEvent.pointerLeave(svg)
    fireEvent.pointerEnter(svg)
    expect(onSvg(svg).map((k) => k.rotate)).toEqual([360, 360, 720])
  })

  test('strong spins turn twice', () => {
    expect(played(<YoujIcon icon={Settings} effect="spin" intensity="strong" />)[0]).toEqual({ rotate: 720 })
  })

  test('draw effects animate every stroke', () => {
    const { container } = renderFull(<YoujIcon icon={Sun} effect="stagger-draw" />)
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    const strokes = svg.querySelectorAll('path, circle')
    const drawn = new Set(calls.filter((c) => 'pathLength' in c.keyframes).map((c) => c.target))
    expect(drawn.size).toBe(strokes.length)
  })

  test('draw-in rests undrawn before first paint and draws in on mount', () => {
    const { container } = renderFull(<YoujIcon icon={Check} effect="draw-in" trigger="none" />)
    const path = container.querySelector('path')!
    expect(path.style.opacity).toBe('0')
    expect(path).toHaveAttribute('stroke-dasharray', '0 1')
  })

  test('a float held on by `active` still pauses in a hidden tab, and resumes', () => {
    const before = liveObservers.size
    const { container, unmount } = renderFull(<YoujIcon icon={Cloud} effect="float" active />)
    const svg = svgOf(container)
    expect(liveObservers.size).toBe(before + 1)
    const lift = onSvg(svg).length
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    // Settled back to rest while hidden.
    expect(onSvg(svg).slice(lift)).toContainEqual({ y: 0 })
    visibility.mockRestore()
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(onSvg(svg).at(-1)).toEqual({ y: -3 })
    unmount()
    expect(liveObservers.size).toBe(before)
  })

  test('float stops its bob when it settles and when it unmounts', async () => {
    const { container, unmount } = renderFull(<YoujIcon icon={Cloud} effect="float" />)
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    // Let the rise finish so the endless bob starts.
    const findBob = () => calls.find((c) => c.target === svg && Array.isArray(c.keyframes.y))
    await waitFor(() => expect(findBob()).toBeDefined())
    const bob = findBob()
    unmount()
    expect(bob!.stop).toHaveBeenCalled()
  })
})

describe('reduced motion', () => {
  test.each(EFFECTS)('%s stays still: no transform, nothing scheduled', (effect) => {
    vi.useFakeTimers()
    const { container } = render(
      <>
        <YoujIcon icon={Bell} effect={effect} />
        <YoujIcon icon={Bell} effect={effect} trigger="mount" />
        <YoujIcon icon={Bell} effect={effect} trigger="loop" />
      </>,
      { wrapper: reduced },
    )
    const svgs = container.querySelectorAll('svg')
    fireEvent.pointerEnter(svgs[0]!)
    act(() => vi.advanceTimersByTime(5000))
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('data-state', 'rest')
      expect((svg as SVGSVGElement).style.transform).toBe('')
    }
    expect(vi.getTimerCount()).toBe(0)
    expect(calls).toHaveLength(0)
  })

  test('draw-in rests fully drawn, so the icon still reads', () => {
    const { container } = render(<YoujIcon icon={Check} effect="draw-in" />, { wrapper: reduced })
    expect(container.querySelector('path')!.style.opacity).toBe('')
  })

  test('controlled draw states still communicate: hidden while draw-out is active or draw-in is inactive', () => {
    const { container, rerender } = render(<YoujIcon icon={Check} effect="draw-out" active />, { wrapper: reduced })
    expect(container.querySelector('path')!.style.opacity).toBe('0')
    rerender(<YoujIcon icon={Check} effect="draw-out" active={false} />)
    expect(container.querySelector('path')!.style.opacity).toBe('')
    rerender(<YoujIcon icon={Check} effect="draw-in" active={false} />)
    expect(container.querySelector('path')!.style.opacity).toBe('0')
    rerender(<YoujIcon icon={Check} effect="draw-in" active />)
    expect(container.querySelector('path')!.style.opacity).toBe('')
  })
})

describe('accessibility', () => {
  test('decorative by default; a label makes it an image', () => {
    const { container, rerender } = renderFull(<YoujIcon icon={Bell} effect="ring" />)
    expect(svgOf(container)).toHaveAttribute('aria-hidden', 'true')
    rerender(<YoujIcon icon={Bell} effect="ring" aria-label="3 new alerts" />)
    expect(svgOf(container)).toHaveAttribute('role', 'img')
    expect(svgOf(container)).toHaveAccessibleName('3 new alerts')
  })
})
