import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PublicStatus } from './public-status'
import { SERVICES } from './status/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('status page block', () => {
  test('operational: the banner, service sections and every service are named', () => {
    reduced(<PublicStatus />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Orbit system status' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('All systems operational')
    const section = screen.getByRole('region', { name: 'Services' })
    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Platform', 'Data'])
    for (const s of SERVICES) expect(within(section).getByRole('group', { name: `Daily uptime, ${s.name}` })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /API response time, last 24 hours/ })).toBeInTheDocument()
  })

  test('reads its past incidents from the same days the card shows, newest first', () => {
    reduced(<PublicStatus />)
    const past = screen.getByRole('region', { name: 'Past incidents' })
    // Storage's upload errors four days ago, open; the search index rebuilds before it.
    expect(within(past).getByText('Upload errors in eu-west')).toBeInTheDocument()
    expect(within(past).getByText('Resolved · lasted 26 min')).toBeInTheDocument()
    expect(within(past).getAllByRole('button')).toHaveLength(5)
  })

  test('incident: the banner turns, the updates are listed and the storage row says Outage', () => {
    reduced(<PublicStatus incident />)
    expect(screen.getByRole('status')).toHaveTextContent('Partial outage')
    // An h2, so the updates' day headings (h3) don't skip a level.
    expect(screen.getByRole('heading', { level: 2, name: 'Upload errors in eu-west' })).toBeInTheDocument()
    expect(screen.getByText(/certificate rotation/)).toBeInTheDocument()
    expect(screen.getByText(/Started 58 minutes ago/)).toBeInTheDocument()
    const storage = screen.getByRole('group', { name: 'Daily uptime, storage' }).closest('li')!
    expect(storage).toHaveTextContent('Outage')
  })

  test('the range control redraws the chart, and subscribe opens its tabs', async () => {
    const user = userEvent.setup()
    reduced(<PublicStatus />)
    await user.click(screen.getByRole('button', { name: '7d' }))
    expect(screen.getByRole('img', { name: /last 7 days/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    const tabs = await screen.findByRole('tablist', { name: 'Subscribe by' })
    await user.click(within(tabs).getByRole('tab', { name: 'RSS' }))
    expect(screen.getByRole('textbox', { name: 'Feed URL' })).toHaveValue('https://status.orbit.dev/feed.rss')
  })
})

describe('status page with your data', () => {
  const NOW = Date.UTC(2026, 8, 28, 9, 30)
  const days = (minutesToday = 0) => Array.from({ length: 90 }, (_, i) => ({ date: `2026-07-${String((i % 28) + 1).padStart(2, '0')}`, uptime: i === 89 ? 1 - minutesToday / 1440 : 1 }))
  const services = [
    { id: 'tracking', name: 'tracking-api', days: days() },
    { id: 'edi', name: 'edi-gateway', days: days(41) },
  ]
  const incident = {
    title: 'EDI messages delayed',
    service: 'edi-gateway',
    startedAt: NOW - 41 * 60_000,
    summary: 'Status messages arrive late.',
    updates: [{ id: 'a', type: 'identified', title: 'A saturated retry queue on the EDI gateway.', time: NOW - 12 * 60_000 }],
  }

  test('brand, services, groups, the incident and the copy come from props', () => {
    reduced(
      <PublicStatus
        now={NOW}
        brand={{ name: 'Freightline', logo: <span data-testid="logo" /> }}
        services={services}
        groups={[{ name: 'Shipping', services: ['tracking'] }]}
        incident={incident}
        copy={{ heading: 'Freightline status', otherGroup: 'Integrations', footer: '© Freightline' }}
        data-testid="page"
        className="custom"
      />,
    )
    expect(screen.getByTestId('page')).toHaveClass('custom')
    expect(screen.getByText('Freightline')).toBeInTheDocument()
    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Freightline status' })).toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'Services' })
    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Shipping', 'Integrations'])
    expect(screen.getByRole('status')).toHaveTextContent('Status messages arrive late.')
    expect(screen.getByRole('heading', { level: 2, name: 'EDI messages delayed' })).toBeInTheDocument()
    expect(screen.getByText(/Started 41 minutes ago/)).toBeInTheDocument()
    expect(screen.getByText('A saturated retry queue on the EDI gateway.')).toBeInTheDocument()
    expect(screen.getByText('© Freightline')).toBeInTheDocument()
  })

  test('the range is controlled, and response times come from props', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    reduced(<PublicStatus range="7d" onRangeChange={onRangeChange} responseTimes={{ '7d': [100, 120, 140], '24h': [] }} />)
    expect(screen.getByRole('img', { name: 'API response time, last 7 days, median 120 milliseconds' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '24h' }))
    expect(onRangeChange).toHaveBeenCalledWith('24h')
    // Controlled: it stays on 7d until the parent moves it.
    expect(screen.getByRole('button', { name: '7d' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('an empty range says so; loading shows skeletons and holds the past incidents back', () => {
    const { unmount } = reduced(<PublicStatus responseTimes={{ '24h': [] }} />)
    expect(screen.getByText('No response times for this range.')).toBeInTheDocument()
    unmount()
    reduced(<PublicStatus loading />)
    expect(screen.getByRole('region', { name: 'Services' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('region', { name: 'Past incidents' })).not.toBeInTheDocument()
  })

  test('no services shows the empty slot; an error offers a retry', async () => {
    const user = userEvent.setup()
    const { unmount } = reduced(<PublicStatus services={[]} empty={<p>Add a monitor to start.</p>} />)
    expect(screen.getByText('Add a monitor to start.')).toBeInTheDocument()
    unmount()
    const onRetry = vi.fn()
    reduced(<PublicStatus error="Couldn’t reach the monitor." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t reach the monitor.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('subscribing sends the address to onSubscribe and shows a rejection; links use linkComponent', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockRejectedValueOnce(new Error('That address is already subscribed.'))
    const Link = (props: React.ComponentProps<'a'>) => <a {...props} data-router="" />
    reduced(<PublicStatus onSubscribe={onSubscribe} historyHref="/history" linkComponent={Link} />)
    const history = screen.getByRole('link', { name: 'Incident history' })
    expect(history).toHaveAttribute('href', '/history')
    expect(history).toHaveAttribute('data-router')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'ops@freightline.example')
    await user.click(screen.getByRole('button', { name: 'Subscribe to updates' }))
    expect(onSubscribe).toHaveBeenCalledWith('ops@freightline.example')
    await waitFor(() => expect(screen.getByText('That address is already subscribed.')).toBeInTheDocument())
  })
})
