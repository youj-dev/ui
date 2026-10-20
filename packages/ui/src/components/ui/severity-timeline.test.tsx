import { act, render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SeverityTimeline, type SeverityEvent } from './severity-timeline'

const MIN = 60_000
const T0 = Date.UTC(2026, 8, 28, 13, 52)

const EVENTS: SeverityEvent[] = [
  { id: 'alert', at: T0, severity: 2, title: 'Error rate above 5%', detail: '5xx at 7.4%', actor: 'pagerbot', ongoing: true },
  { id: 'ack', at: T0 + 3 * MIN, milestone: 'acknowledged', title: 'M. Oyelaran took command' },
  { id: 'sev1', at: T0 + 6 * MIN, severity: 1, title: 'Card payments failing', duration: 9 * MIN },
  { id: 'mitigated', at: T0 + 15 * MIN, milestone: 'mitigated', title: 'Authorisations recovering' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => within(screen.getByRole('list', { name: 'Incident timeline' })).getAllByRole('listitem')

describe('SeverityTimeline', () => {
  test('is a list named by its label, oldest first, each row with its time and severity spoken', () => {
    reduced(<SeverityTimeline events={[...EVENTS].reverse()} now={T0 + 20 * MIN} timeZone="UTC" />)
    const items = rows()
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('13:52')
    expect(items[0]).toHaveTextContent('Severity 2')
    expect(items[0]).toHaveTextContent('Error rate above 5%')
    expect(items[2]).toHaveTextContent('Severity 1')
    expect(within(items[0]!).getByText('13:52').closest('time')).toHaveAttribute('dateTime', new Date(T0).toISOString())
  })

  test('says how long after the start each event came, and how long bars lasted', () => {
    reduced(<SeverityTimeline events={EVENTS} now={T0 + 20 * MIN} timeZone="UTC" />)
    const [alert, , sev1] = rows()
    expect(sev1).toHaveTextContent('6 minutes after start')
    expect(sev1).toHaveTextContent('9 minutes')
    expect(alert).toHaveTextContent('20 minutes')
    expect(alert).toHaveTextContent('Ongoing')
  })

  test('draws each milestone as a rule on every row, and marks the milestone word', () => {
    reduced(<SeverityTimeline events={EVENTS} now={T0 + 20 * MIN} />)
    expect(document.querySelectorAll('[data-slot=severity-timeline-event]')).toHaveLength(4)
    // Two milestones on four rows.
    expect(document.querySelectorAll('[data-slot=severity-timeline-ribbon] [data-slot=severity-timeline-rule]')).toHaveLength(8)
    expect(screen.getByText('Acknowledged')).toHaveAttribute('data-slot', 'severity-timeline-label')
    // The ribbon is drawn, not read: the text carries it.
    for (const ribbon of document.querySelectorAll('[data-slot=severity-timeline-ribbon]')) expect(ribbon).toHaveAttribute('aria-hidden', 'true')
  })

  test('an open incident shows a now edge; a resolved one stops the clock and drops Ongoing', () => {
    const view = reduced(<SeverityTimeline events={EVENTS} now={T0 + 20 * MIN} />)
    expect(document.querySelector('[data-slot=severity-timeline]')).toHaveAttribute('data-state', 'open')
    expect(document.querySelectorAll('[data-slot=severity-timeline-now]').length).toBeGreaterThan(0)
    view.rerender(
      <YoujProvider reducedMotion="always">
        <SeverityTimeline events={[...EVENTS, { id: 'resolved', at: T0 + 25 * MIN, milestone: 'resolved', title: 'Back under 0.5%' }]} now={T0 + 40 * MIN} />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=severity-timeline]')).toHaveAttribute('data-state', 'closed')
    expect(document.querySelectorAll('[data-slot=severity-timeline-now]')).toHaveLength(0)
    expect(screen.queryByText('Ongoing')).not.toBeInTheDocument()
    // The ongoing alert ends at the resolution, 25 minutes in.
    expect(rows()[0]).toHaveTextContent('25 minutes')
  })

  test('an ongoing duration ticks with the live clock', () => {
    vi.useFakeTimers({ now: T0 + 2 * MIN })
    try {
      reduced(<SeverityTimeline events={EVENTS.slice(0, 1)} />)
      expect(rows()[0]).toHaveTextContent('2 minutes')
      act(() => {
        vi.advanceTimersByTime(3 * MIN)
      })
      expect(rows()[0]).toHaveTextContent('5 minutes')
    } finally {
      vi.useRealTimers()
    }
  })

  test('a new event joins the list in time order', () => {
    const view = reduced(<SeverityTimeline events={EVENTS.slice(0, 2)} now={T0 + 20 * MIN} />)
    expect(rows()).toHaveLength(2)
    view.rerender(
      <YoujProvider reducedMotion="always">
        <SeverityTimeline events={[...EVENTS.slice(0, 2), { id: 'early', at: T0 + MIN, title: 'Paged the on-call' }]} now={T0 + 20 * MIN} />
      </YoujProvider>,
    )
    expect(rows()).toHaveLength(3)
    expect(rows()[1]).toHaveTextContent('Paged the on-call')
  })

  test('reduced motion marks the root and leaves no pulse on the live end', () => {
    reduced(<SeverityTimeline events={EVENTS} now={T0 + 20 * MIN} />)
    expect(document.querySelector('[data-slot=severity-timeline]')).toHaveAttribute('data-reduced-motion')
    expect(document.querySelectorAll('[style*="transition-delay"]')).toHaveLength(0)
  })

  test('an event without a severity takes its own tone for the node and the bar', () => {
    reduced(
      <SeverityTimeline
        events={[
          { id: 'mail', at: T0, title: 'Opened a link', tone: 'chart-4', duration: 2 * MIN },
          { id: 'plain', at: T0 + MIN, title: 'Signed in' },
        ]}
        end={T0 + 4 * MIN}
      />,
    )
    const [toned, plain] = rows()
    expect(toned!.style.getPropertyValue('--tone')).toBe('var(--color-chart-4)')
    expect(plain!.style.getPropertyValue('--tone')).toBe('var(--color-fg-subtle)')
  })

  test('with no events it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ incidentNoEvents: 'Noch keine Ereignisse', severityTimeline: 'Vorfallverlauf' }}>
        <SeverityTimeline events={[]} />
      </YoujProvider>,
    )
    expect(screen.getByText('Noch keine Ereignisse')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Vorfallverlauf' })).toBeInTheDocument()
  })
})
