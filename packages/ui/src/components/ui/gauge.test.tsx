import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Gauge, type GaugeThreshold } from './gauge'

const INDEX: GaugeThreshold[] = [
  { value: 0, tone: 'danger', label: 'Critical' },
  { value: 45, tone: 'warning', label: 'Strained' },
  { value: 75, tone: 'success', label: 'Nominal' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const index = () => document.querySelector('[data-slot=gauge-index]')!
const number = () => document.querySelector('[data-slot=gauge-value]')!

/** An IntersectionObserver that reports every target in view at once. */
function inViewport() {
  const original = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver))
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
  return () => {
    globalThis.IntersectionObserver = original
  }
}

describe('Gauge', () => {
  test('is a named meter whose value is spoken with its band', () => {
    reduced(<Gauge value={82} thresholds={INDEX} label="Health index" />)
    const meter = screen.getByRole('meter', { name: 'Health index' })
    expect(meter).toHaveAttribute('aria-valuenow', '82')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-valuetext', '82, Nominal')
  })

  test('shows the band’s label under the value, unless children replace it', () => {
    const { rerender } = reduced(<Gauge value={57} thresholds={INDEX} label="Health" />)
    expect(document.querySelector('[data-slot=gauge-label]')).toHaveTextContent('Strained')
    rerender(
      <YoujProvider reducedMotion="always">
        <Gauge value={57} thresholds={INDEX} label="Health">
          Watch
        </Gauge>
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=gauge-label]')).toHaveTextContent('Watch')
  })

  test('the fill takes the band’s tone; `gradient` lays the bands under it as zones', () => {
    const { rerender } = reduced(<Gauge value={30} thresholds={INDEX} label="Health" />)
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'danger')
    expect(document.querySelector('[data-slot=gauge-indicator]')).toHaveClass('own:text-danger')
    expect(document.querySelector('[data-slot=gauge-track]')).not.toBeNull()
    expect(document.querySelectorAll('[data-slot=gauge-zone]')).toHaveLength(0)
    rerender(
      <YoujProvider reducedMotion="always">
        <Gauge value={60} thresholds={INDEX} gradient label="Health" />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'gradient')
    const zones = [...document.querySelectorAll('[data-slot=gauge-zone]')]
    expect(zones.map((z) => z.getAttribute('data-tone'))).toEqual(['danger', 'warning', 'success'])
    expect(document.querySelector('[data-slot=gauge-track]')).toBeNull()
    // Over the zones the fill still speaks in one tone: the band the value is in.
    expect(document.querySelector('[data-slot=gauge-indicator]')).toHaveClass('own:text-warning')
  })

  test('the range’s ends are written under the band', () => {
    reduced(<Gauge value={40} min={10} max={80} format={{ style: 'unit', unit: 'percent' }} label="Load" />)
    expect(document.querySelector('[data-slot=gauge-min]')).toHaveTextContent('10%')
    expect(document.querySelector('[data-slot=gauge-max]')).toHaveTextContent('80%')
  })

  test('without thresholds the zones are danger, warning and success thirds', () => {
    reduced(<Gauge value={50} gradient label="Score" />)
    expect([...document.querySelectorAll('[data-slot=gauge-zone]')].map((z) => z.getAttribute('data-tone'))).toEqual(['danger', 'warning', 'success'])
  })

  test('a band without a label is still spoken, in the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ meterCritical: 'Kritisch' }}>
        <Gauge value={96} thresholds={[{ value: 90, tone: 'danger' }]} label="Last" />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter', { name: 'Last' })).toHaveAttribute('aria-valuetext', '96, Kritisch')
    expect(document.querySelector('[data-slot=gauge-label]')).toBeNull()
  })

  test('formats the value and clamps it to the range', () => {
    reduced(<Gauge value={140} max={120} format={{ style: 'unit', unit: 'percent' }} label="Load" />)
    const meter = screen.getByRole('meter', { name: 'Load' })
    expect(meter).toHaveAttribute('aria-valuenow', '120')
    expect(number()).toHaveTextContent('120%')
  })

  test('reduced motion draws the index and the number at the value, and changes jump', () => {
    const { rerender } = reduced(<Gauge value={50} label="Score" />)
    expect(index().getAttribute('transform')).toBe('rotate(90)')
    expect(number()).toHaveTextContent('50')
    rerender(
      <YoujProvider reducedMotion="always">
        <Gauge value={75} label="Score" />
      </YoujProvider>,
    )
    expect(index().getAttribute('transform')).toBe('rotate(135)')
    expect(number()).toHaveTextContent('75')
  })

  test('with motion it waits at the minimum until seen, then springs the index and the number to the value together', async () => {
    const offscreen = render(
      <YoujProvider reducedMotion="never">
        <Gauge value={80} label="Score" />
      </YoujProvider>,
    )
    expect(index().getAttribute('transform')).toBe('rotate(0)')
    expect(number()).toHaveTextContent('0')
    offscreen.unmount()

    const restore = inViewport()
    try {
      render(
        <YoujProvider reducedMotion="never">
          <Gauge value={80} label="Score" />
        </YoujProvider>,
      )
      const seen: number[] = []
      await waitFor(() => {
        seen.push(Number(/rotate\(([\d.]+)\)/.exec(index().getAttribute('transform') ?? '')?.[1]))
        expect(seen.at(-1)).toBeCloseTo(144, 0)
      })
      expect(number()).toHaveTextContent('80')
      // It traveled there rather than jumping.
      expect(seen.some((deg) => deg > 0 && deg < 144)).toBe(true)
    } finally {
      restore()
    }
  })
})
