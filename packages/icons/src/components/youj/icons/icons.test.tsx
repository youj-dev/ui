import { readFileSync } from 'node:fs'
import { act, fireEvent, render } from '@testing-library/react'
import { Bell } from 'lucide-react'
import { YoujProvider } from '@youj/core'
import { durations } from '@youj/core'
import { installObservers, liveObservers } from '@youj/core/test-utils'
import { icons, BellIcon, CheckIcon, YoujIcon, LoaderRingIcon, MenuIcon, PlayIcon, SearchIcon } from './index'

beforeAll(installObservers)
afterEach(() => vi.useRealTimers())

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!

describe('icon set structure', () => {
  test('ships at least 48 icons with unique names', () => {
    const names = icons.map((I) => I.meta.name)
    expect(names.length).toBeGreaterThanOrEqual(48)
    expect(new Set(names).size).toBe(names.length)
  })

  test.each(icons.map((I) => [I.meta.name, I] as const))('%s is on the 24 grid, currentColor, round caps and joins', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const svg = svgOf(container)
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('stroke-linecap')).toBe('round')
    expect(svg.getAttribute('stroke-linejoin')).toBe('round')
    expect(svg.getAttribute('stroke-width')).toBe('1.5')
    // Paint is always currentColor. Masks are the only place black/white are allowed.
    for (const el of svg.querySelectorAll('*')) {
      if (el.closest('mask')) continue
      for (const attr of ['stroke', 'fill']) {
        const v = el.getAttribute(attr)
        if (v !== null) expect(['currentColor', 'none']).toContain(v)
      }
      expect(el.getAttribute('stroke-linecap') ?? 'round').toBe('round')
      expect(el.getAttribute('stroke-linejoin') ?? 'round').toBe('round')
    }
  })

  test('every icon has a registry item that depends on the engine', () => {
    const registry = JSON.parse(readFileSync(`${process.cwd()}/registry/icons.json`, 'utf8')) as {
      name: string
      registryDependencies?: string[]
      files: { path: string }[]
    }[]
    const byName = new Map(registry.map((item) => [item.name, item]))
    for (const I of icons) {
      const item = byName.get(`icon-${I.meta.name}`)
      expect(item, I.meta.name).toBeDefined()
      expect(item!.registryDependencies).toEqual(['icon-engine'])
      expect(item!.files[0]!.path).toBe(`src/components/youj/icons/${I.meta.name}.tsx`)
    }
    expect(byName.get('icon-engine')!.registryDependencies).toEqual(['youj-core'])
    expect(byName.get('youj-icon')!.registryDependencies).toEqual(['icon-engine'])
  })
})

describe('props', () => {
  test('decorative by default, labelled icons become images', () => {
    const { container, rerender } = render(<CheckIcon />, { wrapper: full })
    expect(svgOf(container)).toHaveAttribute('aria-hidden', 'true')
    rerender(<CheckIcon aria-label="Done" />)
    expect(svgOf(container)).toHaveAttribute('role', 'img')
    expect(svgOf(container)).toHaveAccessibleName('Done')
    expect(svgOf(container)).not.toHaveAttribute('aria-hidden')
  })

  test('size and strokeWidth reach the svg', () => {
    const { container } = render(<CheckIcon size={40} strokeWidth={2} className="text-accent" />, { wrapper: full })
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('width', '40')
    expect(svg).toHaveAttribute('stroke-width', '2')
    expect(svg).toHaveClass('text-accent')
  })

  test('the theme’s icon weight scales the stroke, and an app’s own style still wins', () => {
    const themed = render(<CheckIcon strokeWidth={1.75} />, { wrapper: full })
    // 1 by default, so the stroke is exactly the icon's own.
    expect(svgOf(themed.container).style.strokeWidth).toBe('calc(1.75 * var(--yj-icon-weight, 1))')
    const own = render(<CheckIcon strokeWidth={1.75} style={{ strokeWidth: '3px' }} />, { wrapper: full })
    expect(svgOf(own.container).style.strokeWidth).toBe('3px')
  })

  test('a new strokeWidth redraws a mounted icon, not only its attribute', async () => {
    const { container, rerender } = render(<BellIcon strokeWidth={1.5} />, { wrapper: full })
    rerender(<BellIcon strokeWidth={2.5} />)
    // The style is the stroke drawn (it wins over the attribute); motion writes it on its next frame.
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(svgOf(container)).toHaveAttribute('stroke-width', '2.5')
    expect(svgOf(container).style.strokeWidth).toBe('calc(2.5 * var(--yj-icon-weight, 1))')
  })
})

describe('triggers', () => {
  test('hover plays on enter and reverses on leave', () => {
    const { container } = render(<BellIcon />, { wrapper: full })
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('data-state', 'rest')
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test('hovering or focusing a parent button drives the icon', () => {
    const { container, getByRole } = render(
      <button type="button">
        <SearchIcon /> Search
      </button>,
      { wrapper: full },
    )
    const svg = svgOf(container)
    fireEvent.pointerEnter(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'rest')

    act(() => getByRole('button').focus())
    expect(svg).toHaveAttribute('data-state', 'active')
    act(() => getByRole('button').blur())
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test('a data-yj-trigger group wins over a nested button', () => {
    const { container, getByTestId } = render(
      <div data-yj-trigger data-testid="card">
        <p>Card</p>
        <button type="button">
          <BellIcon />
        </button>
      </div>,
      { wrapper: full },
    )
    fireEvent.pointerEnter(getByTestId('card'))
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('mount plays once after mounting', () => {
    const { container } = render(<CheckIcon trigger="mount" />, { wrapper: full })
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('none never plays', () => {
    const { container } = render(<BellIcon trigger="none" />, { wrapper: full })
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
  })

  test('loop cycles on the time scale, pauses in hidden tabs and cleans up', () => {
    vi.useFakeTimers()
    const before = liveObservers.size
    const { container, unmount } = render(
      <YoujProvider reducedMotion="never" timeScale={2}>
        <BellIcon trigger="loop" />
      </YoujProvider>,
    )
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('data-state', 'active')
    // On for 2 × deliberate, off for 1 × deliberate, both × timeScale 2.
    const beat = durations.deliberate * 2
    act(() => vi.advanceTimersByTime(beat * 2 - 10))
    expect(svg).toHaveAttribute('data-state', 'active')
    act(() => vi.advanceTimersByTime(20))
    expect(svg).toHaveAttribute('data-state', 'rest')
    act(() => vi.advanceTimersByTime(beat))
    expect(svg).toHaveAttribute('data-state', 'active')

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(svg).toHaveAttribute('data-state', 'rest')
    act(() => vi.advanceTimersByTime(10_000))
    expect(svg).toHaveAttribute('data-state', 'rest')
    visibility.mockRestore()

    expect(liveObservers.size).toBe(before + 1)
    unmount()
    expect(liveObservers.size).toBe(before)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('continuous loaders hold their animation while looping', () => {
    vi.useFakeTimers()
    const { container } = render(<LoaderRingIcon />, { wrapper: full })
    act(() => vi.advanceTimersByTime(10_000))
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })
})

describe('controlled state', () => {
  test('active drives state icons and overrides the trigger', () => {
    const { container, rerender } = render(<MenuIcon active={false} />, { wrapper: full })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    rerender(<MenuIcon active />)
    expect(svg).toHaveAttribute('data-state', 'active')
  })

  test('a controlled icon mounts directly in its state, without animating in', () => {
    const { container } = render(<PlayIcon active />, { wrapper: full })
    expect(container.querySelector('path')!.getAttribute('d')).toBe('M6 4.5 L10 4.5 L10 19.5 L6 19.5 Z')
  })
})

describe('reduced motion', () => {
  test('uncontrolled icons stay at rest; hover and loop do nothing', () => {
    vi.useFakeTimers()
    const { container } = render(
      <>
        <BellIcon />
        <LoaderRingIcon />
      </>,
      { wrapper: reduced },
    )
    const [bell, loader] = container.querySelectorAll('svg')
    fireEvent.pointerEnter(bell!)
    act(() => vi.advanceTimersByTime(5000))
    expect(bell).toHaveAttribute('data-state', 'rest')
    expect(loader).toHaveAttribute('data-state', 'rest')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('mount-triggered draw icons show their finished drawing immediately', () => {
    const { container } = render(<CheckIcon trigger="mount" />, { wrapper: reduced })
    const path = container.querySelector('path')!
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
    expect(path.getAttribute('opacity') ?? '1').toBe('1')
    expect(path.getAttribute('stroke-dashoffset') ?? '0').toBe('0')
  })

  test('state icons jump straight to their end state', async () => {
    const { container, rerender } = render(<PlayIcon active={false} />, { wrapper: reduced })
    rerender(<PlayIcon active />)
    // One frame for Motion to apply the instant transition.
    await act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))
    expect(container.querySelector('path')!.getAttribute('d')).toBe('M6 4.5 L10 4.5 L10 19.5 L6 19.5 Z')
  })
})

describe('YoujIcon', () => {
  test('wraps any lucide icon with the same triggers', () => {
    const { container, getByRole } = render(
      <button type="button">
        <YoujIcon icon={Bell} effect="ring" /> Alerts
      </button>,
      { wrapper: full },
    )
    const svg = svgOf(container)
    expect(svg).toHaveClass('lucide-bell')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    fireEvent.pointerEnter(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(getByRole('button'))
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test('does not animate under reduced motion', () => {
    const { container } = render(<YoujIcon icon={Bell} effect="spin" trigger="mount" />, { wrapper: reduced })
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('data-state', 'rest')
    expect(svg.style.transform).toBe('')
  })
})
