import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { EventTimeline, type EventTimelineEvent } from './event-timeline'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const timeline = () => screen.getByRole('list', { name: 'Timeline' })
const stat = (name: string) => screen.getByText(name).closest('div')!

describe('Event timeline block', () => {
  test('shows the incident, its status, severity, services and events', () => {
    reduced(<EventTimeline live={false} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Checkout errors' })).toBeInTheDocument()
    expect(screen.getByText('Triggered')).toBeInTheDocument()
    expect(screen.getAllByText('Severity 2').length).toBeGreaterThan(0)
    expect(within(stat('Time to acknowledge')).getByText('Not yet')).toBeInTheDocument()
    const services = within(screen.getByRole('region', { name: 'Affected services' })).getAllByRole('listitem')
    expect(services[1]).toHaveTextContent('payments-workerDown')
    expect(within(timeline()).getAllByRole('listitem')).toHaveLength(4)
  })

  test('Acknowledge adds its milestone, moves the status and fills the time to acknowledge', async () => {
    const user = userEvent.setup()
    const onAcknowledge = vi.fn()
    reduced(<EventTimeline live={false} onAdvance={onAcknowledge} />)
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(within(timeline()).getAllByRole('listitem')).toHaveLength(5))
    expect(onAcknowledge).toHaveBeenCalledWith(expect.objectContaining({ id: 'acknowledged' }))
    expect(within(timeline()).getByText('Acknowledged')).toBeInTheDocument()
    expect(within(stat('Time to acknowledge')).queryByText('Not yet')).not.toBeInTheDocument()
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Incident acknowledged')).toBe(true)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mitigate' })).toBeInTheDocument())
  })

  test('Escalate raises the severity a step and pages the lead', async () => {
    const user = userEvent.setup()
    const onEscalate = vi.fn()
    reduced(<EventTimeline live={false} onEscalate={onEscalate} />)
    await user.click(screen.getByRole('button', { name: 'Escalate' }))
    await waitFor(() => expect(within(timeline()).getByText('Escalated to SEV1')).toBeInTheDocument())
    expect(onEscalate).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Escalate' })).toBeDisabled())
  })

  test('a resolved incident stops the clock and offers the postmortem', () => {
    const start = Date.now() - 40 * 60_000
    reduced(
      <EventTimeline
        live={false}
        defaultPhase="resolved"
        entries={[
          { id: 'a', at: start, severity: 2, title: 'Error rate above 5%', duration: 20 * 60_000 },
          { id: 'r', at: start + 30 * 60_000, milestone: 'resolved', title: 'Back to normal' },
        ]}
      />,
    )
    expect(screen.getByText('Closed after')).toBeInTheDocument()
    expect(screen.getByText('00:30:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start postmortem' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escalate' })).toBeDisabled()
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<EventTimeline live={false} embedded event={{ id: 'INC-9', title: 'Paiements en échec', subject: 'paiements', lead: 'A. Martin' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Paiements en échec' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Paiements en échec' })).toBeInTheDocument()
  })

  const incident: EventTimelineEvent = {
    id: 'OPS-311',
    title: 'Search latency',
    subject: 'search-api',
    lead: 'R. Iyer',
    leadHandle: 'riyer',
    milestones: { acknowledged: 'R. Iyer is on it' },
  }

  test('the incident is data: title, id, subject and lead come from `event`', () => {
    reduced(<EventTimeline live={false} event={incident} copy={{ lead: (name) => `Lead: ${name}`, escalate: 'Raise' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Search latency' })).toBeInTheDocument()
    expect(screen.getByText('OPS-311 · search-api')).toBeInTheDocument()
    expect(screen.getByText('Lead: R. Iyer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Raise' })).toBeInTheDocument()
    expect(screen.queryByText(/Oyelaran|INC-2817/)).not.toBeInTheDocument()
  })

  test('its milestones take the incident’s titles and the commander’s handle', async () => {
    const user = userEvent.setup()
    reduced(<EventTimeline live={false} event={incident} />)
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(within(timeline()).getByText('R. Iyer is on it')).toBeInTheDocument())
    expect(within(timeline()).getAllByText('riyer').length).toBeGreaterThan(0)
  })

  test('a controlled phase follows the app, and the action reports the next one', async () => {
    const user = userEvent.setup()
    const onPhaseChange = vi.fn()
    const { rerender } = reduced(<EventTimeline live={false} phase="acknowledged" onPhaseChange={onPhaseChange} onAdvance={() => {}} />)
    expect(screen.getByText('Acknowledged', { selector: '[data-phase] *, [data-phase]' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mitigate' }))
    await waitFor(() => expect(onPhaseChange).toHaveBeenCalledWith('mitigated'))
    // The app hasn't moved it yet, so the badge holds.
    expect(document.querySelector('[data-phase]')).toHaveAttribute('data-phase', 'acknowledged')
    rerender(
      <YoujProvider reducedMotion="always">
        <EventTimeline live={false} phase="resolved" onPhaseChange={onPhaseChange} />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-phase]')).toHaveAttribute('data-phase', 'resolved')
  })

  test('the app can own the phase with state', async () => {
    const user = userEvent.setup()
    function App() {
      const [phase, setPhase] = useState('triggered')
      return <EventTimeline live={false} phase={phase} onPhaseChange={setPhase} onAdvance={() => {}} />
    }
    reduced(<App />)
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(document.querySelector('[data-phase]')).toHaveAttribute('data-phase', 'acknowledged'))
  })

  test('a controlled severity reports Escalate and holds until the app moves it', async () => {
    const user = userEvent.setup()
    const onSeverityChange = vi.fn()
    reduced(<EventTimeline live={false} severity={3} onSeverityChange={onSeverityChange} onEscalate={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Escalate' }))
    await waitFor(() => expect(onSeverityChange).toHaveBeenCalledWith(2))
    expect(screen.getAllByText('Severity 3').length).toBeGreaterThan(0)
  })

  test('a rejected action shows its message', async () => {
    const user = userEvent.setup()
    reduced(<EventTimeline live={false} onAdvance={() => Promise.reject(new Error('Pager API is down'))} />)
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }))
    expect(await screen.findByText('Pager API is down')).toHaveAttribute('role', 'alert')
    expect(document.querySelector('[data-phase]')).toHaveAttribute('data-phase', 'triggered')
  })

  test('menu actions and the postmortem call back', async () => {
    const user = userEvent.setup()
    const onCopyLink = vi.fn()
    const onPostmortem = vi.fn()
    reduced(<EventTimeline live={false} defaultPhase="resolved" onCopyLink={onCopyLink} onPostmortem={onPostmortem} />)
    await user.click(screen.getByRole('button', { name: 'Start postmortem' }))
    expect(onPostmortem).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Copy link' }))
    expect(onCopyLink).toHaveBeenCalledOnce()
  })

  test('the clock starts from `now`, which server and browser share', () => {
    const start = Date.UTC(2026, 0, 5, 10, 0)
    reduced(<EventTimeline live={false} now={new Date(start + 5 * 60_000)} entries={[{ id: 'a', at: start, title: 'Alert' }]} />)
    expect(screen.getByText('00:05:00')).toBeInTheDocument()
  })

  test('renders the same on the server and in the browser, so it hydrates without a mismatch', async () => {
    const ui = (
      <YoujProvider reducedMotion="always">
        <EventTimeline live={false} timeZone="UTC" />
      </YoujProvider>
    )
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2030, 0, 1))
    const html = renderToString(ui)
    vi.setSystemTime(new Date(2031, 5, 9))
    expect(renderToString(ui)).toBe(html)
    vi.useRealTimers()
    expect(html).toContain('00:12:00')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, ui, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    container.remove()
  })

  test('className and other attributes land on the root', () => {
    reduced(<EventTimeline live={false} embedded headingLevel={3} className="my-incident" data-testid="incident" />)
    expect(screen.getByTestId('incident')).toHaveClass('my-incident')
    expect(screen.getByRole('heading', { level: 3, name: 'Checkout errors' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Timeline' })).toBeInTheDocument()
  })

  test('with no items it says so', () => {
    reduced(<EventTimeline live={false} items={[]} />)
    expect(screen.getByText('No services affected')).toBeInTheDocument()
  })

  test('your phases, severities and statuses drive the pill, the action, the figures and the items', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    const start = Date.UTC(2026, 10, 3, 14, 0)
    reduced(
      <EventTimeline
        live={false}
        now={start + 10 * 60_000}
        timeZone="UTC"
        event={{ id: 'ADM-1', title: 'Chest pain', subject: 'Emergency', lead: 'Dr. Okafor' }}
        phases={[
          { id: 'arrived', label: 'Arrived', tone: 'danger' },
          { id: 'triaged', label: 'Triaged', tone: 'warning', action: 'Triage', pending: 'Triaging…', milestone: '{lead} assessed', stat: { label: 'Wait', name: 'Time to triage' } },
          { id: 'discharged', label: 'Discharged', tone: 'success', action: 'Discharge', stat: { label: 'Stay', name: 'Length of stay' } },
        ]}
        severities={[
          { id: 'a', label: 'Critical', tone: 'danger' },
          { id: 'b', label: 'Urgent', tone: 'warning' },
        ]}
        defaultSeverity={2}
        statuses={[
          { id: 'full', label: 'Over capacity', tone: 'danger', from: 0.3 },
          { id: 'open', label: 'Open', tone: 'success' },
        ]}
        format={{ rate: (n) => `${Math.round(n * 100)} full` }}
        items={[{ id: 'ed', name: 'Emergency', rates: { arrived: 0.4, triaged: 0.1 } }]}
        entries={[{ id: 'door', at: start, severity: 2, title: 'Arrived by ambulance' }]}
        onAdvance={onAdvance}
      />,
    )
    expect(document.querySelector('[data-phase]')).toHaveTextContent('Arrived')
    expect(screen.getAllByText('Urgent').length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Affected services' })).toHaveTextContent('EmergencyOver capacity')
    expect(screen.getByRole('region', { name: 'Affected services' })).toHaveTextContent('40 full')
    expect(within(stat('Time to triage')).getByText('Not yet')).toBeInTheDocument()
    expect(screen.getByText('Length of stay')).toBeInTheDocument()
    expect(screen.queryByText('Time to acknowledge')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Triage' }))
    await waitFor(() => expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ id: 'triaged' })))
    await waitFor(() => expect(within(timeline()).getByText('Dr. Okafor assessed')).toBeInTheDocument())
    expect(within(timeline()).getByText('Triaged')).toBeInTheDocument()
    expect(document.querySelector('[data-phase]')).toHaveTextContent('Triaged')
    expect(screen.getByRole('region', { name: 'Affected services' })).toHaveTextContent('EmergencyOpen')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Discharge' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Escalate' }))
    await waitFor(() => expect(within(timeline()).getByText('Escalated to Critical')).toBeInTheDocument())
  })

  test('`scale` sets the rate at which an item’s bar is full', () => {
    const items = [{ id: 'a', name: 'Emergency', rates: { triggered: 0.2 } }]
    const fill = (c: HTMLElement) => Number.parseFloat(c.querySelector<HTMLElement>('[data-slot=share-bar]')!.style.getPropertyValue('--share-bar-value'))
    const wide = reduced(<EventTimeline live={false} items={items} scale={1} />)
    const half = fill(wide.container)
    wide.unmount()
    const dflt = reduced(<EventTimeline live={false} items={items} />)
    expect(fill(dflt.container)).toBeGreaterThan(half)
  })

  test('it takes the page’s layout density, and the app can set its own', () => {
    const { unmount } = reduced(<EventTimeline live={false} embedded={false} />)
    expect(screen.getByRole('main')).not.toHaveAttribute('data-yj-density')
    unmount()
    reduced(<EventTimeline live={false} embedded data-yj-density="roomy" />)
    expect(screen.getByRole('region', { name: 'Checkout errors' })).toHaveAttribute('data-yj-density', 'roomy')
  })

  test('it keeps its measure embedded and on its own page; with fill it takes the width the app gives it', () => {
    const page = reduced(<EventTimeline live={false} embedded={false} />)
    expect(page.container.querySelector('[data-slot=card]')).toHaveClass('max-w-184')
    page.unmount()
    const { unmount } = reduced(<EventTimeline live={false} data-testid="incident" />)
    expect(screen.getByTestId('incident')).toHaveClass('max-w-184')
    unmount()
    reduced(<EventTimeline live={false} fill data-testid="incident" />)
    expect(screen.getByTestId('incident')).not.toHaveClass('max-w-184')
  })

  test('marks the demo incident as demo data; your events get no marker and no demo arrivals', () => {
    vi.useFakeTimers()
    try {
      const demo = render(<EventTimeline />)
      expect(screen.getByText('Demo data')).toBeInTheDocument()
      demo.unmount()
      const events = [{ id: 'e1', at: Date.parse('2026-09-28T10:00:00Z'), title: 'Error rate over 5%', severity: 2 as const }]
      render(<EventTimeline entries={events} now={Date.parse('2026-09-28T10:05:00Z')} timeZone="UTC" />)
      expect(screen.queryByText('Demo data')).toBeNull()
      const count = within(timeline()).getAllByRole('listitem').length
      act(() => vi.advanceTimersByTime(30_000))
      expect(within(timeline()).getAllByRole('listitem')).toHaveLength(count)
    } finally {
      vi.useRealTimers()
    }
  })
})
