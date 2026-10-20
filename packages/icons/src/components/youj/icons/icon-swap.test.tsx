import { act, fireEvent, render } from '@testing-library/react'
import { Bell, BellOff, Bookmark, BookmarkCheck, Check, Copy, Sun, Moon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motionValue } from 'motion/react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import { BellIcon } from './bell'
import { IconSwap, type IconSwapProps } from './icon-swap'

beforeAll(installObservers)

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))
const layers = (c: HTMLElement) => ({
  wrap: c.querySelector<HTMLElement>('.youj-icon-swap')!,
  a: c.querySelector<HTMLElement>('[data-layer="from"]')!,
  b: c.querySelector<HTMLElement>('[data-layer="to"]')!,
  morph: c.querySelector<SVGSVGElement>('[data-layer="morph"]'),
})
const opacity = (el: Element | null) => Number((el as HTMLElement).style.opacity)
const rotation = (el: HTMLElement) => Number(/rotate\((-?[\d.]+)deg\)/.exec(el.style.transform)?.[1] ?? 0)

interface Env {
  timeScale?: number
  reducedMotion?: ReducedMotionSetting
  wrap?: (n: ReactNode) => ReactNode
}

/** Renders with a provider whose time scale makes the swap fast (0.05) or slow enough to catch mid-flight. */
function setup(props: Partial<IconSwapProps>, { timeScale = 0.05, reducedMotion = 'never', wrap = (n) => n }: Env = {}) {
  const Provider = ({ children }: { children: ReactNode }) => (
    <YoujProvider timeScale={timeScale} reducedMotion={reducedMotion}>
      {wrap(children)}
    </YoujProvider>
  )
  const ui = (p: Partial<IconSwapProps>) => <IconSwap from={Bookmark} to={BookmarkCheck} {...props} {...p} />
  const result = render(ui({}), { wrapper: Provider })
  return { ...result, set: (p: Partial<IconSwapProps>) => result.rerender(ui(p)), ...layers(result.container) }
}

describe('state', () => {
  test('rests on `from`, with `to` hidden', () => {
    const { a, b, wrap } = setup({ active: false })
    expect(opacity(a)).toBe(1)
    expect(opacity(b)).toBe(0)
    expect(wrap).toHaveAttribute('data-state', 'from')
  })

  test('a controlled swap mounts directly in its state, without animating in', () => {
    const { a, b, wrap } = setup({ active: true })
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(1)
    expect(wrap).toHaveAttribute('data-state', 'to')
  })

  test.each(['rotate', 'scale-blur', 'flip', 'slide', 'fold', 'wipe', 'zoom', 'pop'] as const)('%s swaps across and back', async (transition) => {
    const { a, b, wrap, set } = setup({ active: false, transition })
    set({ active: true })
    expect(wrap).toHaveAttribute('data-state', 'to')
    await wait(150)
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(1)
    set({ active: false })
    await wait(150)
    expect(opacity(a)).toBe(1)
    expect(opacity(b)).toBe(0)
    // Back at rest, nothing is left transformed or clipped.
    expect(a.style.transform).toBe('')
    expect(a.style.clipPath).toBe('')
  })

  test('hover swaps an uncontrolled IconSwap through its parent button', async () => {
    const { container, b, wrap } = setup({}, { wrap: (n) => <button type="button">{n} Save</button> })
    fireEvent.pointerEnter(container.querySelector('button')!)
    expect(wrap).toHaveAttribute('data-state', 'to')
    await wait(150)
    expect(opacity(b)).toBe(1)
  })
})

describe('interruption', () => {
  test('reversing mid-swap turns back from exactly where it is', async () => {
    // rotate: (slow + fast) × 2 ≈ 960ms, so 300ms in is roughly a third of the way.
    const { a, set } = setup({ active: false, transition: 'rotate' }, { timeScale: 2 })
    set({ active: true })
    await wait(300)
    const out = rotation(a)
    expect(out).toBeLessThan(-5)
    expect(out).toBeGreaterThan(-90)
    set({ active: false })
    await wait(80)
    const back = rotation(a)
    // Turning back: less rotated than at the reversal, but no jump to rest.
    expect(back).toBeGreaterThan(out)
    expect(back).toBeLessThan(0)
    await wait(600)
    expect(a.style.transform).toBe('')
    expect(opacity(a)).toBe(1)
  })

  test('rapid toggles settle on the last state', async () => {
    const { a, b, set } = setup({ active: false, transition: 'flip' }, { timeScale: 1 })
    for (const active of [true, false, true, false, true]) {
      set({ active })
      await wait(20)
    }
    await wait(900)
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(1)
  })
})

describe('draw', () => {
  test('dashes strokes mid-swap and restores them after', async () => {
    const { container, set } = setup({ active: false, transition: 'draw' }, { timeScale: 2 })
    set({ active: true })
    await wait(250)
    expect(container.querySelectorAll('[data-swap-dash]').length).toBeGreaterThan(0)
    await wait(1200)
    // At rest both icons are plain again, and only `to` shows.
    expect(container.querySelectorAll('[data-swap-dash]')).toHaveLength(0)
    expect(opacity(layers(container).a)).toBe(0)
    expect(opacity(layers(container).b)).toBe(1)
  })
})

describe('morph', () => {
  test('builds one track per stroke pairing and shows the morph layer only mid-swap', async () => {
    const { container, a, b, set } = setup({ active: false, transition: 'morph', from: Bell, to: BellOff }, { timeScale: 2 })
    const morph = layers(container).morph!
    expect(morph).toBeInTheDocument()
    // Bell (2 strokes) → bell-off (4): clapper kept, body carved into two pieces, slash drawn in, plus the cut gaps.
    expect(morph.querySelectorAll('path').length).toBeGreaterThanOrEqual(4)
    expect(opacity(morph)).toBe(0)
    set({ active: true })
    await wait(300)
    expect(opacity(morph)).toBe(1)
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(0)
    await wait(1600)
    expect(opacity(morph)).toBe(0)
    expect(opacity(b)).toBe(1)
  })

  test('works between any two icons, including unrelated ones', () => {
    const { container } = setup({ transition: 'morph', from: Copy, to: Check })
    expect(layers(container).morph!.querySelectorAll('path').length).toBeGreaterThanOrEqual(2)
  })
})

describe('direction', () => {
  const offset = (el: HTMLElement) => Number(/translate\((-?[\d.]+)%/.exec(el.style.transform)?.[1] ?? 0)

  test('slide left travels left, and mirrors under right-to-left reading', async () => {
    const ltr = setup({ active: false, transition: 'slide', direction: 'left' }, { timeScale: 2 })
    ltr.set({ active: true })
    await wait(350)
    expect(offset(ltr.a)).toBeLessThan(0)
    ltr.unmount()

    const rtl = setup(
      { active: false, transition: 'slide', direction: 'left' },
      {
        timeScale: 2,
        wrap: (n) => (
          <div dir="rtl" style={{ direction: 'rtl' }}>
            {n}
          </div>
        ),
      },
    )
    rtl.set({ active: true })
    await wait(350)
    expect(offset(rtl.a)).toBeGreaterThan(0)
  })

  test('changing transition clears what the previous one set', () => {
    const { wrap, set } = setup({ transition: 'slide' })
    expect(wrap.style.overflow).toBe('hidden')
    set({ transition: 'flip' })
    expect(wrap.style.overflow).toBe('')
    expect(wrap.style.perspective).not.toBe('')
  })
})

describe('accessibility', () => {
  test('labels name the current state as an image', async () => {
    const { wrap, set } = setup({ active: false, labels: ['Online', 'Offline'], from: Sun, to: Moon })
    expect(wrap).toHaveAttribute('role', 'img')
    expect(wrap).toHaveAccessibleName('Online')
    set({ active: true })
    expect(wrap).toHaveAccessibleName('Offline')
  })

  test('without labels the swap is decorative', () => {
    const { wrap } = setup({})
    expect(wrap).toHaveAttribute('aria-hidden', 'true')
    expect(wrap).not.toHaveAttribute('role')
  })

  test('youj icons inside are held still, so only the swap moves', () => {
    const { container } = setup({ from: BellIcon, to: Check, active: false }, { wrap: (n) => <button type="button">{n}</button> })
    fireEvent.pointerEnter(container.querySelector('button')!)
    expect(container.querySelector('[data-icon="bell"]')).toHaveAttribute('data-state', 'rest')
  })
})

describe('progress', () => {
  test('a driven number holds that moment of the transition', () => {
    // rotate at 0.5: `from` has faded out mid-turn, `to` is turning in from the other side.
    const { a, b, wrap } = setup({ progress: 0.5, transition: 'rotate' })
    expect(opacity(a)).toBe(0)
    expect(rotation(a)).toBeLessThan(0)
    expect(rotation(a)).toBeGreaterThan(-90)
    expect(opacity(b)).toBeGreaterThan(0)
    expect(opacity(b)).toBeLessThan(1)
    expect(rotation(b)).toBeGreaterThan(0)
    expect(rotation(b)).toBeLessThan(90)
    expect(wrap).toHaveAttribute('data-state', 'to')
  })

  test('a MotionValue repaints on every change, and active and hover are ignored', () => {
    const value = motionValue(0)
    const { a, b, wrap, container } = setup({ progress: value, active: true, transition: 'scale-blur' }, { wrap: (n) => <button type="button">{n}</button> })
    expect(opacity(a)).toBe(1)
    expect(opacity(b)).toBe(0)
    expect(wrap).toHaveAttribute('data-state', 'from')
    act(() => value.set(1))
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(1)
    expect(wrap).toHaveAttribute('data-state', 'to')
    act(() => value.set(0.2))
    expect(wrap).toHaveAttribute('data-state', 'from')
    fireEvent.pointerEnter(container.querySelector('button')!)
    expect(wrap).toHaveAttribute('data-state', 'from')
    expect(opacity(a)).toBeGreaterThan(0)
    expect(opacity(a)).toBeLessThan(1)
  })

  test('values outside 0–1 clamp to the ends', () => {
    const { a, b, set } = setup({ progress: -2, transition: 'flip' })
    expect(opacity(a)).toBe(1)
    set({ progress: 7, transition: 'flip' })
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBe(1)
    expect(b.style.transform).toBe('')
  })

  test('labels name the nearer icon', () => {
    const { wrap, set } = setup({ progress: 0.3, labels: ['Online', 'Offline'], from: Sun, to: Moon })
    expect(wrap).toHaveAccessibleName('Online')
    set({ progress: 0.7, labels: ['Online', 'Offline'], from: Sun, to: Moon })
    expect(wrap).toHaveAccessibleName('Offline')
  })

  test('drives the true morph mid-way, and the draw transition dashes its strokes', () => {
    const morph = setup({ progress: 0.5, transition: 'morph', from: Bell, to: BellOff })
    expect(opacity(layers(morph.container).morph)).toBe(1)
    morph.unmount()
    const draw = setup({ progress: 0.5, transition: 'draw', from: Bell, to: BellOff })
    expect(draw.container.querySelectorAll('[data-swap-dash]').length).toBeGreaterThan(0)
  })

  test('is painted as given under reduced motion: the value is the caller’s', () => {
    const { a, b } = setup({ progress: 0.5, transition: 'rotate' }, { reducedMotion: 'always' })
    expect(opacity(a)).toBe(0)
    expect(opacity(b)).toBeGreaterThan(0)
    expect(opacity(b)).toBeLessThan(1)
  })

  test('back to a state, it animates on from wherever the driven value left it', async () => {
    const { a, set } = setup({ progress: 0.4, transition: 'rotate' }, { timeScale: 2 })
    const held = rotation(a)
    expect(held).toBeLessThan(0)
    set({ progress: undefined, active: false })
    await wait(60)
    // Turning back towards rest, not jumping there.
    expect(rotation(a)).toBeGreaterThan(held)
    expect(rotation(a)).toBeLessThan(0)
  })
})

describe('reduced motion', () => {
  test('swaps instantly, for every transition', () => {
    for (const transition of ['rotate', 'draw', 'morph', 'slide'] as const) {
      const { a, b, set, unmount, container } = setup({ active: false, transition, from: Bell, to: BellOff }, { reducedMotion: 'always', timeScale: 20 })
      set({ active: true })
      expect(opacity(a)).toBe(0)
      expect(opacity(b)).toBe(1)
      expect(container.querySelectorAll('[data-swap-dash]')).toHaveLength(0)
      unmount()
    }
  })

  test('labels still follow the state', () => {
    const { wrap, set } = setup({ active: false, labels: ['Bookmark', 'Bookmarked'] }, { reducedMotion: 'always' })
    set({ active: true })
    expect(wrap).toHaveAccessibleName('Bookmarked')
  })
})

describe('cleanup', () => {
  test('unmounting mid-swap stops painting', async () => {
    const { a, set, unmount } = setup({ active: false, transition: 'rotate' }, { timeScale: 2 })
    set({ active: true })
    await wait(100)
    unmount()
    const frozen = a.style.transform
    await wait(200)
    expect(a.style.transform).toBe(frozen)
  })
})
