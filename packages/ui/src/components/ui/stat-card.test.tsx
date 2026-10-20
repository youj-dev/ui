import { render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Stat, StatBars, StatBreakdown, StatCard, StatDelta, StatGroup, StatMeter, StatNote, StatValue } from './stat-card'

const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>

describe('Stat', () => {
  test('is a group named by its label, holding the formatted value, the change in words and its comparison', () => {
    render(
      <Stat label="Monthly revenue">
        <StatValue locale="en-US" value={48210} format={usd} />
        <StatDelta locale="en-US" value={0.124}>
          vs. last month
        </StatDelta>
      </Stat>,
      { wrapper: reduced },
    )
    const tile = screen.getByRole('group', { name: 'Monthly revenue' })
    expect(within(tile).getByText('$48,210', { selector: '.sr-only' })).toBeInTheDocument()
    expect(within(tile).getByText('Up', { exact: false, selector: '.sr-only' })).toBeInTheDocument()
    expect(within(tile).getByText('12.4%', { selector: '.sr-only' })).toBeInTheDocument()
    expect(within(tile).getByText('vs. last month')).toBeInTheDocument()
  })

  test('loading: busy, announced, the label stays and the figures wait behind a skeleton', () => {
    const { rerender } = render(
      <Stat label="Active users" loading>
        <StatValue locale="en-US" value={12842} />
      </Stat>,
      { wrapper: reduced },
    )
    const tile = screen.getByRole('group', { name: 'Active users' })
    expect(tile).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading Active users')
    expect(tile.querySelector('[data-slot=stat-value]')).toBeNull()
    expect(tile.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(0)

    rerender(
      <Stat label="Active users">
        <StatValue locale="en-US" value={12842} />
      </Stat>,
    )
    expect(tile).not.toHaveAttribute('aria-busy')
    expect(within(tile).getByText('12,842', { selector: '.sr-only' })).toBeInTheDocument()
  })

  test('an action sits at the end of the label line', () => {
    render(<Stat label="Revenue" action={<span>7 days</span>} />)
    expect(document.querySelector('[data-slot=stat-action]')).toHaveTextContent('7 days')
  })
})

describe('StatValue', () => {
  test('reduced motion: the rolled figure is settled at once, with its unit after it', () => {
    render(<StatValue value={907} unit="seats" />, { wrapper: reduced })
    const wheels = document.querySelectorAll<HTMLElement>('[data-slot=stat-value] [data-wheel]')
    // Each digit's wheel sits on its digit: the glyph at full opacity, at rest.
    const landed = Array.from(wheels, (wheel) => [...wheel.children].find((g) => (g as HTMLElement).style.opacity === '1')?.textContent)
    expect(landed).toEqual(['9', '0', '7'])
    expect(document.querySelector('[data-slot=stat-unit]')).toHaveTextContent('seats')
  })

  test('size is exposed for the style to set the figure', () => {
    render(<StatValue value={4} size="sm" />)
    expect(document.querySelector('[data-slot=stat-value]')).toHaveAttribute('data-size', 'sm')
  })
})

describe('StatDelta', () => {
  const delta = () => document.querySelector('[data-slot=stat-delta]')!
  const figure = () => document.querySelector('[data-slot=stat-delta-value]')!

  test('rising is good news unless the metric is inverted, and the direction is spoken', () => {
    const { rerender } = render(<StatDelta locale="en-US" value={0.1} />, { wrapper: reduced })
    expect(delta()).toHaveAttribute('data-tone', 'good')
    expect(figure()).toHaveClass('own:text-success-text')
    rerender(<StatDelta locale="en-US" value={0.1} invert />)
    expect(delta()).toHaveAttribute('data-tone', 'bad')
    expect(figure()).toHaveClass('own:text-danger-text')
    rerender(<StatDelta locale="en-US" value={-0.1} invert />)
    expect(delta()).toHaveAttribute('data-direction', 'down')
    expect(delta()).toHaveAttribute('data-tone', 'good')
    expect(figure().querySelector('.sr-only')).toHaveTextContent('Down')
  })

  test('no change is neutral, drawn as a dash instead of a triangle', () => {
    render(<StatDelta locale="en-US" value={0} />, { wrapper: reduced })
    expect(delta()).toHaveAttribute('data-tone', 'neutral')
    expect(figure().querySelector('svg')).toBeNull()
    expect(figure()).toHaveTextContent('No change')
  })

  test('the change can be in the value’s own terms', () => {
    render(<StatDelta locale="en-US" value={4} format={{ maximumFractionDigits: 0 }} />, { wrapper: reduced })
    expect(figure().querySelector('[data-slot=counter] .sr-only')).toHaveTextContent(/^4$/)
  })
})

describe('StatBars', () => {
  test('decorative without a label; an image with one; one bar per reading, the latest lit', () => {
    const { rerender } = render(<StatBars data={[2, 4, 3, 8]} />, { wrapper: reduced })
    const chart = () => document.querySelector('[data-slot=stat-bars]')!
    expect(chart()).toHaveAttribute('aria-hidden', 'true')
    const bars = document.querySelectorAll('[data-slot=stat-bar]')
    expect(bars).toHaveLength(4)
    expect(bars[3]).toHaveAttribute('data-lit')
    expect(bars[0]).not.toHaveAttribute('data-lit')

    rerender(<StatBars data={[2, 4, 3, 8]} label="Orders by day" highlight={1} />)
    expect(screen.getByRole('img', { name: 'Orders by day' })).toBe(chart())
    expect(document.querySelectorAll('[data-slot=stat-bar]')[1]).toHaveAttribute('data-lit')
  })

  test('reduced motion: each bar is drawn at its share of the scale, and last period shows as ticks', () => {
    render(<StatBars data={[5, 10]} previous={[8, 4]} />, { wrapper: reduced })
    const bars = document.querySelectorAll<HTMLElement>('[data-slot=stat-bar]')
    expect(bars[0]!.style.clipPath).toBe('inset(50% 0% 0% 0% round 1.5px)')
    expect(bars[1]!.style.clipPath).toBe('inset(0% 0% 0% 0% round 1.5px)')
    expect(document.querySelectorAll('[data-slot=stat-bar-tick]')).toHaveLength(2)
  })

  test('time reads left to right in RTL too', () => {
    render(
      <div dir="rtl">
        <StatBars data={[1, 2]} />
      </div>,
    )
    expect(document.querySelector('[data-slot=stat-bars]')).toHaveAttribute('dir', 'ltr')
  })
})

describe('StatMeter', () => {
  test('leads its caption with the share, and turns warning behind the pace marker', () => {
    const { rerender } = render(
      <StatMeter locale="en-US" value={60} max={100} marker={75}>
        of target
      </StatMeter>,
      { wrapper: reduced },
    )
    const meter = () => document.querySelector('[data-slot=stat-meter]')!
    expect(meter()).toHaveTextContent('60% of target')
    expect(meter()).toHaveAttribute('data-tone', 'warning')
    expect(document.querySelector<HTMLElement>('[data-slot=stat-meter-marker]')!.style.insetInlineStart).toBe('75%')

    rerender(
      <StatMeter locale="en-US" value={80} max={100} marker={75}>
        of target
      </StatMeter>,
    )
    expect(meter()).toHaveAttribute('data-tone', 'accent')
    rerender(<StatMeter locale="en-US" value={120} max={100} detail="Met" />)
    expect(meter()).toHaveAttribute('data-tone', 'success')
    expect(meter()).toHaveTextContent('120%')
    expect(meter()).toHaveTextContent('Met')
  })

  test('an explicit tone wins', () => {
    render(<StatMeter value={9} max={10} tone="danger" />, { wrapper: reduced })
    expect(document.querySelector('[data-slot=stat-meter]')).toHaveAttribute('data-tone', 'danger')
  })
})

describe('StatBreakdown', () => {
  test('keys every part with its figure, and draws only the parts that have a value', () => {
    render(
      <StatBreakdown
        locale="en-US"
        parts={[
          { label: 'Healthy', value: 1200, tone: 'neutral' },
          { label: 'At risk', value: 0, tone: 'warning' },
          { label: 'Churning', value: 3, tone: 'danger' },
        ]}
      />,
      { wrapper: reduced },
    )
    const items = within(document.querySelector('ul')!).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['Healthy1,200', 'At risk0', 'Churning3'])
    expect(document.querySelectorAll('[data-slot=stat-breakdown-part]')).toHaveLength(2)
    // The bar is a picture of the key.
    expect(document.querySelector('[data-slot=stat-breakdown-bar]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('a tiny part keeps a visible sliver', () => {
    render(
      <StatBreakdown
        parts={[
          { label: 'Ready', value: 999 },
          { label: 'Failed', value: 1 },
        ]}
        legend={false}
      />,
      { wrapper: reduced },
    )
    const [, failed] = document.querySelectorAll<HTMLElement>('[data-slot=stat-breakdown-part]')
    // Its clip opens at 98% of the bar (the 2% floor), not at 99.9%.
    expect(failed!.style.clipPath).toContain('calc(98.04% + 1px)')
    expect(document.querySelector('ul')).toBeNull()
  })
})

describe('StatGroup and StatCard', () => {
  test('a group joins its tiles, each still its own named group', () => {
    render(
      <StatGroup aria-label="Key metrics">
        <Stat label="Orders">
          <StatValue value={12} />
        </Stat>
        <Stat label="Returns">
          <StatValue value={2} />
          <StatNote>vs. last week</StatNote>
        </Stat>
      </StatGroup>,
      { wrapper: reduced },
    )
    const panel = document.querySelector('[data-stat-group]')!
    expect(panel).toHaveAttribute('aria-label', 'Key metrics')
    expect(within(panel as HTMLElement).getAllByRole('group')).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Returns' })).toHaveTextContent('vs. last week')
  })

  test('StatCard works the change out from the previous value, and shows a comparison without one as a note', () => {
    const { rerender } = render(<StatCard locale="en-US" label="MRR" value={120} previous={100} format={usd} comparison="vs. last month" />, {
      wrapper: reduced,
    })
    expect(document.querySelector('[data-slot=stat-delta]')).toHaveAttribute('data-direction', 'up')
    expect(document.querySelector('[data-slot=stat-delta-value] [data-slot=counter] .sr-only')).toHaveTextContent('20%')
    expect(screen.getByRole('group', { name: 'MRR' })).toHaveTextContent('vs. last month')

    rerender(<StatCard locale="en-US" label="To ship" value={9} comparison="Paid, waiting to go out" chart={<StatBars data={[1, 2]} />} />)
    expect(document.querySelector('[data-slot=stat-delta]')).toBeNull()
    expect(document.querySelector('[data-slot=stat-note]')).toHaveTextContent('Paid, waiting to go out')
    expect(document.querySelector('[data-slot=stat-chart] [data-slot=stat-bars]')).not.toBeNull()
  })

  test('StatCard loading: busy and announced', () => {
    render(<StatCard locale="en-US" label="Active users" value={12842} loading />)
    expect(screen.getByRole('group', { name: 'Active users' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading Active users')
  })
})
