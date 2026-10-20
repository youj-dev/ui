import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { DistributionStrip, percentileOf } from './distribution-strip'

/** 1 to 100 ms, one of each: p50 50.5, p90 90.1, p99 99.01; 90 of them within 90 ms. */
const HUNDRED = Array.from({ length: 100 }, (_, i) => i + 1)
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const dots = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-slot=distribution-strip-dot]')]

describe('percentileOf', () => {
  test('interpolates between the nearest ranks, whatever the order', () => {
    expect(percentileOf([4, 1, 3, 2], 50)).toBe(2.5)
    expect(percentileOf([4, 1, 3, 2], 0)).toBe(1)
    expect(percentileOf([4, 1, 3, 2], 100)).toBe(4)
    expect(percentileOf(HUNDRED, 99)).toBeCloseTo(99.01)
  })

  test('clamps the percentile and has no answer for no samples', () => {
    expect(percentileOf([1, 2, 3], 140)).toBe(3)
    expect(percentileOf([], 50)).toBeNaN()
  })
})

describe('DistributionStrip', () => {
  test('is a figure named by its label and described by its percentiles and the share within the objective', () => {
    render(reduced(<DistributionStrip samples={HUNDRED} slo={90} label="Sampled requests" />))
    expect(screen.getByRole('figure', { name: 'Sampled requests' })).toHaveAccessibleDescription(
      '100 requests sampled: p50 51 ms, p90 90 ms, p99 99 ms. 90.0% within the 90 ms SLO.',
    )
  })

  test('flags each percentile with its latency, and counts the share within the objective in its header', () => {
    const { container } = render(reduced(<DistributionStrip samples={HUNDRED} slo={90} />))
    const flags = [...container.querySelectorAll('[data-slot=distribution-strip-flag]')].map((f) => f.textContent)
    expect(flags).toEqual(['p5051 ms', 'p9090 ms', 'p9999 ms'])
    expect(screen.getByText('Within SLO')).toBeInTheDocument()
    expect(screen.getAllByText('90.0%').length).toBeGreaterThan(0)
    expect(screen.getByText('SLO 90 ms')).toBeInTheDocument()
  })

  test('marks the samples past the objective, and draws them decoratively', () => {
    const { container } = render(reduced(<DistributionStrip samples={HUNDRED} slo={90} />))
    expect(dots(container)).toHaveLength(100)
    expect(dots(container).filter((d) => d.hasAttribute('data-over'))).toHaveLength(10)
    expect(container.querySelector('[data-slot=distribution-strip-plot]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-slot=distribution-strip-axis]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('without an objective: no share, no hatch, and the summary leaves it out', () => {
    const { container } = render(reduced(<DistributionStrip samples={HUNDRED} />))
    expect(screen.getByRole('figure', { name: 'Latency distribution' })).toHaveAccessibleDescription('100 requests sampled: p50 51 ms, p90 90 ms, p99 99 ms.')
    expect(screen.queryByText('Within SLO')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot=distribution-strip-over]')).toBeNull()
    expect(dots(container).some((d) => d.hasAttribute('data-over'))).toBe(false)
  })

  test('marks the percentiles it is given, in order, formatted its way', () => {
    render(reduced(<DistributionStrip samples={HUNDRED} percentiles={[75, 25]} format={(v) => `${Math.round(v)}ms`} />))
    expect(screen.getByRole('figure')).toHaveAccessibleDescription('100 requests sampled: p25 26ms, p75 75ms.')
  })

  test('leaves out samples that are negative or not numbers', () => {
    const { container } = render(reduced(<DistributionStrip samples={[Number.NaN, -4, 10, 20]} />))
    expect(dots(container)).toHaveLength(2)
    expect(screen.getByRole('figure')).toHaveAccessibleDescription('2 requests sampled: p50 15 ms, p90 19 ms, p99 20 ms.')
  })

  test('says so when there are no samples, with no description', () => {
    const { container } = render(reduced(<DistributionStrip samples={[]} slo={300} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-describedby')
    expect(dots(container)).toHaveLength(0)
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <DistributionStrip samples={HUNDRED} slo={90} />
      </YoujProvider>,
    )
    // German spaces its units and percent sign with a no-break space, as Intl does.
    const ms = new Intl.NumberFormat('de-DE', { style: 'unit', unit: 'millisecond', maximumFractionDigits: 0 }).format
    const share = new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 1 }).format(0.9)
    expect(screen.getByRole('figure', { name: de.latencyDistribution })).toHaveAccessibleDescription(
      `${de.latencySummary(100, `p50 ${ms(51)}, p90 ${ms(90)}, p99 ${ms(99)}`)} ${de.latencyWithin(share, ms(90))}`,
    )
  })

  test('reduced motion: the dots are drawn in place at once', () => {
    const { container } = render(reduced(<DistributionStrip samples={HUNDRED} slo={90} />))
    expect(screen.getByRole('figure')).toHaveAttribute('data-reduced-motion')
    const [first, last] = [dots(container)[0]!, dots(container).at(-1)!]
    expect(first.style.opacity).toBe('1')
    expect(last.style.transitionDelay).toBe('')
  })

  test('with motion, the dots wait below the baseline until the strip scrolls into view', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <DistributionStrip samples={HUNDRED} slo={90} />
      </YoujProvider>,
    )
    expect(screen.getByRole('figure')).not.toHaveAttribute('data-reduced-motion')
    expect(dots(container).every((d) => d.style.opacity === '0')).toBe(true)
  })

  test('stops observing its size when it unmounts', () => {
    const disconnect = vi.spyOn(globalThis.ResizeObserver.prototype, 'disconnect')
    const { unmount } = render(reduced(<DistributionStrip samples={HUNDRED} />))
    unmount()
    expect(disconnect).toHaveBeenCalled()
    disconnect.mockRestore()
  })
})
