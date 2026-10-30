import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StatusCard, type StatusService } from './status'
import { SERVICES_INCIDENT } from './status/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Status card block', () => {
  test('leads with the SLA, the status today and the error budget left', () => {
    reduced(<StatusCard />)
    expect(screen.getByRole('region', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Status' })).toBeInTheDocument()
    expect(screen.getByText('6 services · last 90 days')).toBeInTheDocument()
    expect(screen.getByText('99.95%')).toBeInTheDocument()
    expect(screen.getByText('All systems operational')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Error budget left' })).toHaveAttribute('aria-valuetext', '74 min')
    expect(screen.getByText('Last incident 4 days ago · storage')).toBeInTheDocument()
  })

  test('shows every day of the window, and each service with its own strip as decoration', () => {
    const { container } = reduced(<StatusCard />)
    const strip = screen.getByRole('group', { name: 'Daily uptime, all services' })
    expect(within(strip).getAllByRole('listitem')).toHaveLength(90)
    const rows = screen.getAllByRole('button', { pressed: false })
    expect(rows.map((b) => b.getAttribute('aria-label'))).toEqual([
      'api-gateway 99.98%, Operational',
      'web-app 99.99%, Operational',
      'webhooks 99.83%, Operational',
      'auth 99.98%, Operational',
      'search 99.97%, Operational',
      'storage 99.96%, Operational',
    ])
    const minis = container.querySelectorAll('button [data-slot=history-strip]')
    expect(minis).toHaveLength(6)
    for (const mini of minis) {
      expect(mini).toHaveAttribute('aria-hidden', 'true')
      expect(mini.querySelector('[tabindex]')).toBeNull()
    }
  })

  test('pressing a service puts it on the day strip and the figure; its chip goes back to all of them', async () => {
    const user = userEvent.setup()
    reduced(<StatusCard />)
    await user.click(screen.getByRole('button', { name: 'webhooks 99.83%, Operational' }))
    expect(screen.getByRole('button', { name: 'webhooks 99.83%, Operational' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Daily uptime, webhooks' })).toBeInTheDocument()
    // Webhooks spent more than the window's error budget.
    expect(screen.getByRole('meter', { name: 'Error budget left' })).toHaveAttribute('aria-valuetext', '0 min')
    await user.click(screen.getByRole('button', { name: 'Show all services' }))
    expect(screen.getByRole('group', { name: 'Daily uptime, all services' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
  })

  test('names an outage today in the pill, the row and the footer', () => {
    reduced(<StatusCard services={SERVICES_INCIDENT} />)
    expect(screen.getByText('Partial outage')).toBeInTheDocument()
    expect(screen.getByText('1 affected today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^storage [0-9.]+%, Outage$/ })).toBeInTheDocument()
    expect(screen.getByText('Incident ongoing · storage')).toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2; copy rewrites its strings', () => {
    reduced(<StatusCard embedded copy={{ title: 'Estado' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Estado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Estado' })).toBeInTheDocument()
  })

  test('Subscribe runs onSubscribe', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn(() => Promise.resolve())
    reduced(<StatusCard onSubscribe={onSubscribe} />)
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    await waitFor(() => expect(onSubscribe).toHaveBeenCalledTimes(1))
  })

  // A week of your own monitoring, the last entry being Jan 10.
  const week = (id: string, name: string, bad?: { day: number; minutes: number }) => ({
    id,
    name,
    days: Array.from({ length: 7 }, (_, i) => {
      const minutes = bad?.day === i ? bad.minutes : 0
      return { date: `2027-01-${String(4 + i).padStart(2, '0')}`, uptime: 1 - minutes / 1440, downtimeMinutes: minutes, incidents: minutes ? 1 : 0 }
    }),
  })
  const mine: StatusService[] = [week('db', 'postgres-main', { day: 3, minutes: 30 }), week('cdn', 'edge-cdn')]

  test('your services drive the figures, the rows and "days ago", counted from `today`', () => {
    reduced(<StatusCard services={mine} today="2027-01-12" copy={{ subtitle: (n) => `${n} systems` }} />)
    expect(screen.getByText('2 systems')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false }).map((b) => b.getAttribute('aria-label')?.split(' ')[0])).toEqual(['postgres-main', 'edge-cdn'])
    expect(within(screen.getByRole('group', { name: 'Daily uptime, all services' })).getAllByRole('listitem')).toHaveLength(7)
    // The incident was on Jan 7, five days before the 12th.
    expect(screen.getByText('Last incident 5 days ago · postgres-main')).toBeInTheDocument()
  })

  test('without `today`, your last entry is today', () => {
    reduced(<StatusCard services={mine} />)
    expect(screen.getByText('Last incident 3 days ago · postgres-main')).toBeInTheDocument()
  })

  test('`today` moves the demo fleet’s window', () => {
    reduced(<StatusCard today="2026-10-01" />)
    expect(screen.getByText('Last incident 4 days ago · storage')).toBeInTheDocument()
  })

  test('a controlled selection reports presses and follows the app', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = reduced(<StatusCard services={mine} value={null} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: /^edge-cdn/ }))
    expect(onValueChange).toHaveBeenCalledWith('cdn')
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <StatusCard services={mine} value="db" onValueChange={onValueChange} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Daily uptime, postgres-main' })).toBeInTheDocument()
  })

  test('menu and footer actions call back', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    const onHistory = vi.fn()
    reduced(<StatusCard onExport={onExport} onHistory={onHistory} />)
    await user.click(screen.getByRole('button', { name: 'Incident history' }))
    expect(onHistory).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Export CSV' }))
    expect(onExport).toHaveBeenCalledOnce()
  })

  test('a rejected subscribe shows its message', async () => {
    const user = userEvent.setup()
    reduced(<StatusCard onSubscribe={() => Promise.reject(new Error('Email already subscribed'))} />)
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByText('Email already subscribed')).toHaveAttribute('role', 'alert')
  })

  test('loading, error and empty states', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<StatusCard loading />)
    expect(screen.queryByRole('group', { name: /Daily uptime/ })).not.toBeInTheDocument()
    expect(document.querySelector('[aria-busy]')).toBeInTheDocument()
    const wrap = (ui: React.ReactNode) => rerender(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
    wrap(<StatusCard error={new Error('Monitoring API timed out')} onRetry={onRetry} />)
    expect(screen.getByText('Monitoring API timed out')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
    wrap(<StatusCard services={[]} />)
    expect(screen.getByText('No services to show yet')).toBeInTheDocument()
    wrap(<StatusCard services={[]} empty={<p>Connect a monitor</p>} />)
    expect(screen.getByText('Connect a monitor')).toBeInTheDocument()
  })

  test('your statuses name the rows and the pill, and a service can say its own', () => {
    const statuses = [
      { id: 'on-time', label: 'On time', tone: 'success' as const },
      { id: 'delays', label: 'Delays', tone: 'warning' as const },
      { id: 'suspended', label: 'Suspended', tone: 'danger' as const },
    ]
    const lines: StatusService[] = [week('red', 'Red line'), { ...week('tram', 'Old Town tram'), status: 'suspended' }]
    reduced(<StatusCard services={lines} statuses={statuses} />)
    expect(screen.getByRole('button', { name: /^Red line [0-9.]+%, On time$/ })).toHaveAttribute('data-status', 'on-time')
    expect(screen.getByRole('button', { name: /^Old Town tram [0-9.]+%, Suspended$/ })).toHaveAttribute('data-status', 'suspended')
    expect(screen.getByText('1 affected today')).toBeInTheDocument()
    expect(screen.getByText('Partial outage')).toBeInTheDocument()
    expect(screen.queryByText('Operational')).not.toBeInTheDocument()
  })

  test('format.uptime writes the figure, the target and the rows', () => {
    reduced(<StatusCard services={mine} format={{ uptime: (n) => `${Math.round(n * 1000) / 10} pts` }} />)
    expect(screen.getAllByText('99.9 pts').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /^edge-cdn 100 pts, Operational$/ })).toBeInTheDocument()
  })

  test('the legend’s bands stay distinct when the target is at or under the critical line', () => {
    reduced(<StatusCard services={mine} target={0.99} />)
    const legend = screen.getAllByRole('listitem').map((li) => li.textContent).filter((t) => t?.startsWith('≥') || t?.startsWith('<'))
    expect(new Set(legend).size).toBe(3)
  })

  test('className, headingLevel and other attributes reach the root', () => {
    reduced(<StatusCard embedded headingLevel={3} className="my-status" data-testid="status" />)
    expect(screen.getByTestId('status')).toHaveClass('my-status')
    expect(screen.getByRole('heading', { level: 3, name: 'Status' })).toBeInTheDocument()
  })
})
