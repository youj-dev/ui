import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AuditLog } from './audit-log'
import { EVENTS, rawEvent } from './audit-log/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('audit log block', () => {
  test('names the page and lists the newest events first', () => {
    reduced(<AuditLog />)
    expect(screen.getByRole('main', { name: 'Audit log' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Audit log' })).toBeInTheDocument()
    const grid = screen.getByRole('grid', { name: 'Audit events' })
    const first = within(grid).getAllByRole('row')[1]!
    expect(first).toHaveTextContent('Changed Leo Martins’s role to Admin')
    // A page of ten, under the header row.
    expect(within(grid).getAllByRole('row')).toHaveLength(11)
  })

  test('search filters the events', async () => {
    const user = userEvent.setup()
    reduced(<AuditLog />)
    await user.type(screen.getByPlaceholderText('Search events, people, IPs…'), 'Singapore')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1 + EVENTS.filter((e) => e.location === 'Singapore, SG').length))
    expect(screen.queryByText('Deployed storefront to production')).not.toBeInTheDocument()
  })

  test('an event’s summary opens its details with the raw record', async () => {
    const user = userEvent.setup()
    reduced(<AuditLog />)
    await user.click(screen.getByRole('button', { name: 'Changed Leo Martins’s role to Admin' }))
    const sheet = await screen.findByRole('dialog', { name: 'Changed Leo Martins’s role to Admin' })
    expect(within(sheet).getByRole('region', { name: 'Changes' })).toHaveTextContent('Member to Admin')
    expect(within(sheet).getByRole('region', { name: 'Raw event' })).toHaveTextContent(`"id": "${EVENTS[0]!.id}"`)
    expect(within(sheet).getByRole('button', { name: 'Copy event JSON' })).toBeInTheDocument()
    await user.click(within(sheet).getAllByRole('button', { name: 'Close' }).at(-1)!)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Changed Leo Martins’s role to Admin' })).toHaveFocus()
  })

  test('the raw record is the API’s shape', () => {
    const raw = JSON.parse(rawEvent(EVENTS[0]!))
    expect(raw).toMatchObject({ action: 'member.role_updated', actor: { type: 'user' }, changes: { role: { from: 'Member', to: 'Admin' } } })
  })

  test('embedded, it is a section with an h2', () => {
    reduced(<AuditLog embedded />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Audit log' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Audit log' })).toBeInTheDocument()
  })

  describe('with your data', () => {
    const actors = { ana: { id: 'u_1', name: 'Ana Souza', email: 'ana@lumen.health', kind: 'user' as const } }
    const events = [
      {
        id: 'evt_a',
        time: '2026-09-30T09:00:00Z',
        actor: 'ana',
        action: 'record.viewed',
        category: 'records',
        summary: 'Opened patient chart 4471',
        target: 'chart_4471',
        ip: '10.0.0.4',
        location: 'Recife, BR',
        userAgent: 'Edge 141 · Windows',
        result: 'success' as const,
      },
    ]

    test('events, actors and copy drive the page', () => {
      reduced(<AuditLog events={events} actors={actors} copy={{ title: 'Access log', summary: (n) => `${n} accesses` }} categories={[{ id: 'records', label: 'Records' }]} />)
      expect(screen.getByRole('heading', { level: 1, name: 'Access log' })).toBeInTheDocument()
      expect(screen.getByText('1 accesses')).toBeInTheDocument()
      const grid = screen.getByRole('grid', { name: 'Audit events' })
      expect(within(grid).getByText('Ana Souza')).toBeInTheDocument()
      expect(within(grid).getByText('Records')).toBeInTheDocument()
    })

    test('results and categories you pass label the badges, and flagged ones are counted in the summary', async () => {
      const user = userEvent.setup()
      reduced(
        <AuditLog
          events={[
            { ...events[0]!, id: 'evt_1', result: 'allowed' },
            { ...events[0]!, id: 'evt_2', summary: 'Opened a chart in an emergency', result: 'break-glass' },
          ]}
          actors={actors}
          results={[
            { id: 'allowed', label: 'Allowed', tone: 'success' },
            { id: 'break-glass', label: 'Break-glass', tone: 'danger', flagged: true },
          ]}
          categories={[{ id: 'records', label: 'Chart access', tone: 'accent' }]}
          copy={{ summary: (n, flagged) => `${n} accesses, ${flagged} to review` }}
        />,
      )
      expect(screen.getByText('2 accesses, 1 to review')).toBeInTheDocument()
      const grid = screen.getByRole('grid', { name: 'Audit events' })
      expect(within(grid).getByText('Break-glass')).toBeInTheDocument()
      expect(within(grid).getAllByText('Chart access')).toHaveLength(2)
      await user.click(screen.getByRole('button', { name: 'Opened a chart in an emergency' }))
      const sheet = await screen.findByRole('dialog', { name: 'Opened a chart in an emergency' })
      expect(within(sheet).getByText('Break-glass')).toBeInTheDocument()
    })

    test('opening an event calls onOpen with it, and the sheet reads the copy', async () => {
      const user = userEvent.setup()
      const onOpen = vi.fn()
      reduced(<AuditLog events={events} actors={actors} onOpen={onOpen} copy={{ raw: 'Record', copyRaw: 'Copy record' }} />)
      await user.click(screen.getByRole('button', { name: 'Opened patient chart 4471' }))
      expect(onOpen).toHaveBeenCalledWith(events[0])
      const sheet = await screen.findByRole('dialog', { name: 'Opened patient chart 4471' })
      expect(within(sheet).getByRole('region', { name: 'Record' })).toHaveTextContent('"name": "Ana Souza"')
      expect(within(sheet).getByRole('button', { name: 'Copy record' })).toBeInTheDocument()
    })

    test('no events shows the empty state, or your own', () => {
      const { unmount } = reduced(<AuditLog events={[]} />)
      expect(screen.getByText('No events yet')).toBeInTheDocument()
      unmount()
      reduced(<AuditLog events={[]} empty={<p>Nothing logged</p>} />)
      expect(screen.getByText('Nothing logged')).toBeInTheDocument()
    })

    test('className, rest props and headingLevel reach the root', () => {
      const { container } = reduced(<AuditLog embedded headingLevel={3} className="custom-root" data-testid="log" />)
      expect(container.querySelector('section.custom-root')).toBe(screen.getByTestId('log'))
      expect(screen.getByRole('heading', { level: 3, name: 'Audit log' })).toBeInTheDocument()
    })

    test('an error replaces the rows and offers a retry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<AuditLog error="Couldn’t load events" onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load events')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /try again/i }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    test('loading shows skeleton rows', () => {
      reduced(<AuditLog events={[]} loading />)
      expect(screen.queryByText('No events yet')).not.toBeInTheDocument()
    })
  })
})
