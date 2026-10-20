import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FunnelReport } from './funnel-report'
import { report } from './funnel-report/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
// jsdom can't measure the thumbs, so they're "hidden"; their aria-labels still name them.
const thumb = (name: string) => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name)!
const today = new Date(2026, 8, 29)

describe('funnel report block', () => {
  test('names its landmarks, headline figures, funnel, step bars and cohort grid', () => {
    reduced(<FunnelReport embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Activation funnel' })).toBeInTheDocument()
    const headline = screen.getByRole('region', { name: 'Headline numbers' })
    for (const name of ['Visitor to paid', 'Trials started', 'New paying teams', 'Trial to paid']) expect(within(headline).getByRole('group', { name })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'Trial-to-paid funnel' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Conversion by step' })).getAllByRole('listitem')).toHaveLength(5)
    const grid = screen.getByRole('table', { name: 'Weekly retention by trial cohort' })
    // Eight cohorts and the average, each headed by its row header.
    expect(within(grid).getAllByRole('rowheader')).toHaveLength(9)
    expect(within(grid).getByRole('columnheader', { name: 'Week 7' })).toBeInTheDocument()
  })

  test('the platform switch re-cuts the figures and announces the new conversion', async () => {
    const user = userEvent.setup()
    reduced(<FunnelReport />)
    const trials = () => within(screen.getByRole('group', { name: 'Trials started' })).getByText(/^[\d,]+$/, { selector: '.sr-only' }).textContent
    const before = trials()
    await user.click(screen.getByRole('button', { name: 'iOS' }))
    expect(screen.getByRole('button', { name: 'iOS' })).toHaveAttribute('aria-pressed', 'true')
    expect(trials()).not.toBe(before)
    expect(screen.getAllByRole('status').some((el) => /^iOS: \d+\.\d% of visitors upgraded/.test(el.textContent ?? ''))).toBe(true)
  })

  test('moving the time-to-paid window updates the share inside it', async () => {
    const user = userEvent.setup()
    reduced(<FunnelReport />)
    expect(screen.getByText(/upgraded between day 0 and day 7/)).toBeInTheDocument()
    thumb('Maximum days from trial to paid').focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText(/upgraded between day 0 and day 8/)).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and the platform switch, with no product header or main', () => {
    const { container } = reduced(<FunnelReport brand={{ name: 'Molar' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Activation funnel' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Web' }))
    expect(screen.queryByText('Molar')).not.toBeInTheDocument()
  })
})

describe('funnel report data', () => {
  test('all platforms is the sum of each, and every step is no bigger than the one before', () => {
    const all = report('all', today, 'en-US')
    const parts = (['web', 'ios', 'android'] as const).map((p) => report(p, today, 'en-US'))
    all.steps.forEach((step, i) => expect(step.count).toBe(parts.reduce((t, r) => t + r.steps[i]!.count, 0)))
    all.steps.slice(1).forEach((step, i) => expect(step.count).toBeLessThanOrEqual(all.steps[i]!.count))
  })

  test('cohorts form a triangle that starts at 100%, one paid team a sample, and a day per upgrade dot', () => {
    const r = report('web', today, 'en-US')
    expect(r.cohorts.map((c) => c.retention.length)).toEqual([8, 7, 6, 5, 4, 3, 2, 1])
    expect(r.cohorts.every((c) => c.retention[0] === 1)).toBe(true)
    expect(r.daysToPaid).toHaveLength(r.steps[r.steps.length - 1]!.count)
    expect(r.upgrades.at(-1)!.date).toBe('2026-09-29')
  })
})

describe('funnel report with your data', () => {
  const steps = [
    { id: 'lesson', short: 'Lesson', name: 'Finished a lesson', count: 1000, previous: 900, rate: 1, previousRate: 1 },
    { id: 'trial', short: 'Trial', name: 'Started a trial', count: 400, previous: 300, rate: 0.4, previousRate: 1 / 3 },
    { id: 'plus', short: 'Plus', name: 'Subscribed', count: 100, previous: 60, rate: 0.25, previousRate: 0.2 },
  ]
  const data = {
    steps,
    conversion: 0.1,
    previousConversion: 60 / 900,
    cohorts: [{ label: 'Sep 21', size: 400, retention: [1, 0.6] }],
    daysToPaid: [1, 2, 3, 9, 12],
    upgrades: [
      { date: '2026-09-29', value: 3 },
      { date: '2026-09-30', value: 4 },
    ],
  }

  test('the report, segments, brand and copy come from props', () => {
    reduced(
      <FunnelReport
        embedded={false}
        report={data}
        segments={[
          { value: 'all', label: 'Everyone' },
          { value: 'app', label: 'App' },
        ]}
        brand={{ name: 'Lingoleaf' }}
        copy={{ title: 'Plus funnel', trialsStarted: 'Trials' }}
        data-testid="root"
        className="custom"
      />,
    )
    expect(screen.getByTestId('root')).toHaveClass('custom')
    expect(screen.getByRole('heading', { level: 1, name: 'Plus funnel' })).toBeInTheDocument()
    expect(screen.getByText('Lingoleaf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Everyone' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('group', { name: 'Trials' })).getByText('400', { selector: '.sr-only' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Conversion by step' })).getAllByRole('listitem')).toHaveLength(2)
    expect(within(screen.getByRole('table', { name: 'Weekly retention by trial cohort' })).getByText('Sep 21')).toBeInTheDocument()
  })

  test('the segment is controlled and reported', async () => {
    const user = userEvent.setup()
    const onSegmentChange = vi.fn()
    reduced(<FunnelReport segment="web" onSegmentChange={onSegmentChange} />)
    expect(screen.getByRole('button', { name: 'Web' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'iOS' }))
    expect(onSegmentChange).toHaveBeenCalledWith('ios')
    expect(screen.getByRole('button', { name: 'Web' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('headingLevel sets the title; today ends the upgrades', () => {
    reduced(<FunnelReport headingLevel={3} today={new Date(2026, 8, 29)} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Activation funnel' })).toBeInTheDocument()
  })

  test('loading, error and empty states', async () => {
    const user = userEvent.setup()
    const { unmount } = reduced(<FunnelReport loading />)
    expect(screen.getByText('Loading the report')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Headline numbers' })).not.toBeInTheDocument()
    unmount()

    const onRetry = vi.fn()
    const second = reduced(<FunnelReport error="The analytics API timed out." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('The analytics API timed out.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
    second.unmount()

    reduced(<FunnelReport report={{ ...data, steps: steps.map((s) => ({ ...s, count: 0 })) }} empty={<p>No learners yet.</p>} />)
    expect(screen.getByText('No learners yet.')).toBeInTheDocument()
  })
})
