import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LimitMeter, type LimitMeterProps } from './limit-meter'

const EUR = { style: 'currency', currency: 'EUR' } as const
const FREEZE = [{ value: 1800, label: 'freeze', tone: 'warning' as const }]

const reduced = (props: Partial<LimitMeterProps> = {}, labels?: Record<string, unknown>) =>
  render(
    <YoujProvider reducedMotion="always" labels={labels}>
      <LimitMeter spent={1240} limit={2000} format={EUR} markers={FREEZE} label="Card limit" {...props} />
    </YoujProvider>,
  )
const ticks = () => [...document.querySelectorAll<HTMLElement>('[data-slot=limit-meter-tick]')]
const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot=${name}]`)!

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

describe('LimitMeter', () => {
  test('formatValue writes the amounts, the scale and the marker in your own unit', () => {
    reduced({ formatValue: (value) => `${value} GB` })
    expect(screen.getByRole('meter', { name: 'Card limit' })).toHaveAttribute('aria-valuetext', '1240 GB spent of 2000 GB, 760 GB left, freeze at 1800 GB')
    expect(screen.getByText('0 GB')).toBeInTheDocument()
    expect(screen.getByText('1000 GB')).toBeInTheDocument()
  })

  test('is a meter of spend against the limit that speaks what is left and each marker', () => {
    reduced()
    const meter = screen.getByRole('meter', { name: 'Card limit' })
    expect(meter).toHaveAttribute('aria-valuenow', '1240')
    expect(meter).toHaveAttribute('aria-valuemax', '2000')
    expect(meter).toHaveAttribute('aria-valuetext', '€1,240.00 spent of €2,000.00, €760.00 left, freeze at €1,800.00')
  })

  test('shows the remainder large with its decimals quiet, and the spent and limit as a readout under it', () => {
    reduced()
    expect(slot('limit-meter-label')).toHaveTextContent('Remaining')
    expect(slot('limit-meter-remaining')).toHaveTextContent('€760.00')
    expect(slot('limit-meter-fraction')).toHaveTextContent('.00')
    const summary = slot('limit-meter-summary')
    expect(summary).toHaveTextContent('Spent€1,240.00')
    expect(summary).toHaveTextContent('Limit€2,000.00')
    expect(slot('limit-meter-axis')).toHaveTextContent('€0€1,000€2,000')
  })

  test('draws minor and major ticks: spent, the runway to the marker in its tone, then idle', () => {
    reduced()
    const all = ticks()
    expect(all).toHaveLength(51)
    expect(all.filter((t) => t.dataset.major)).toHaveLength(6)
    expect(all[31]).toHaveAttribute('data-zone', 'spent')
    expect(all[31]).toHaveClass('own:text-success')
    expect(all[32]).toHaveAttribute('data-zone', 'runway')
    expect(all[45]).toHaveClass('own:text-warning')
    expect(all[46]).toHaveAttribute('data-zone', 'idle')
    expect(slot('limit-meter-marker').style.insetInlineStart).toBe('90%')
  })

  test('lays its labels out once measured: close ones pushed apart, none past the ruler’s ends', () => {
    // A 576px ruler, and labels 7px a character wide.
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const width = this.dataset.slot === 'limit-meter-flags' ? 576 : this.dataset.slot === 'limit-meter-flag' ? (this.textContent?.length ?? 0) * 7 : 0
      return { width, height: 16, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 16, toJSON: () => ({}) } as DOMRect
    })
    try {
      reduced({
        spent: 2080,
        markers: [
          { value: 1600, label: 'notify', tone: 'accent' },
          { value: 1800, label: 'freeze', tone: 'warning' },
          { value: 2000, label: 'hard stop', tone: 'danger' },
        ],
      })
      const flags = [...document.querySelectorAll<HTMLElement>('[data-slot=limit-meter-flag]')]
      expect(flags.map((f) => f.textContent)).toEqual(['notify', 'freeze', 'hard stop'])
      // Measured: offsets replace the first render's alignment.
      for (const flag of flags) expect(flag).not.toHaveAttribute('data-align')
      const lines = [0.8, 0.9, 1].map((at) => at * 576)
      const spans = flags.map((flag, i) => {
        const start = lines[i]! + Number(flag.style.getPropertyValue('--offset'))
        return [start, start + flag.textContent!.length * 7] as const
      })
      for (const [start, end] of spans) {
        expect(start).toBeGreaterThanOrEqual(0)
        expect(end).toBeLessThanOrEqual(576)
      }
      for (let i = 1; i < spans.length; i++) expect(spans[i]![0] - spans[i - 1]![1]).toBeGreaterThanOrEqual(8)
    } finally {
      measure.mockRestore()
    }
  })

  test('marks the spend with an index caret under the ruler, riding the same rail as its hairline', () => {
    reduced()
    const flags = [...document.querySelectorAll<HTMLElement>('[data-slot=limit-meter-flag]')]
    expect(flags.map((f) => f.textContent)).toEqual(['freeze'])
    expect(slot('limit-meter-caret').parentElement).toBe(slot('limit-meter-spent').parentElement)
  })

  test('keeps the rails that slide under its labels and spend caret from widening the page', () => {
    reduced({ spent: 2080 })
    expect(slot('limit-meter-scale')).toHaveClass('overflow-x-clip')
  })

  test('past the limit, it shows what is over in danger, and spent ticks past a marker take its tone', () => {
    reduced({ spent: 2080 })
    expect(slot('limit-meter-label')).toHaveTextContent('Over limit')
    expect(slot('limit-meter-remaining')).toHaveTextContent('€80.00')
    expect(slot('limit-meter-remaining')).toHaveClass('own:text-danger')
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '€2,080.00 spent of €2,000.00, €80.00 over, freeze at €1,800.00')
    expect(ticks()[46]).toHaveAttribute('data-zone', 'spent')
    expect(ticks()[46]).toHaveClass('own:text-warning')
    expect(ticks()[44]).toHaveClass('own:text-success')
  })

  test('speaks the provider’s language', () => {
    reduced({ locale: 'de-DE', format: { style: 'currency', currency: 'EUR' }, markers: [] }, { allowanceRemaining: 'Verbleibend', allowanceValueText: (s: string, l: string, r: string) => `${s} von ${l} ausgegeben, ${r} übrig` })
    expect(slot('limit-meter-label')).toHaveTextContent('Verbleibend')
    const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', `${eur(1240)} von ${eur(2000)} ausgegeben, ${eur(760)} übrig`)
  })

  test('with motion, the spend sweeps up from zero once seen: the line travels and the ticks light in order', async () => {
    const restore = inViewport()
    try {
      render(
        <YoujProvider reducedMotion="never">
          <LimitMeter spent={1240} limit={2000} format={EUR} markers={FREEZE} label="Card limit" />
        </YoujProvider>,
      )
      const rail = () => slot('limit-meter-spent').parentElement!
      await act(async () => {})
      expect(rail().style.getPropertyValue('--at')).toBe('0.62')
      expect(parseFloat(rail().style.transitionDuration)).toBeGreaterThan(0)
      const delays = ticks()
        .slice(1, 32)
        .map((t) => parseFloat(t.style.transitionDelay || '0'))
      expect(delays.every((d, i) => i === 0 || d > delays[i - 1]!)).toBe(true)
    } finally {
      restore()
    }
  })

  test('reduced motion draws the spend in place', () => {
    reduced()
    const rail = slot('limit-meter-spent').parentElement!
    expect(rail.style.getPropertyValue('--at')).toBe('0.62')
    expect(rail.style.transitionDuration).toBe('0ms')
    expect(ticks().every((t) => !t.style.transitionDelay)).toBe(true)
  })
})
