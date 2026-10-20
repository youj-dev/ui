import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import type { ReactNode } from 'react'
import { LogsTable, type LogsTableProps } from './logs'
import type { LogsTableEvent } from './logs/data'

const EVENTS: LogsTableEvent[] = [
  { id: 'e1', time: '2026-10-10T09:00:00.120Z', level: 'info', service: 'api', message: 'GET /v1/orders 200', requestId: 'req_1', duration: 42, payload: { status: 200 } },
  { id: 'e2', time: '2026-10-10T09:00:01.450Z', level: 'warn', service: 'billing', message: 'Card expiring soon', payload: { customer: 'cus_9' } },
  { id: 'e3', time: '2026-10-10T09:00:02.900Z', level: 'error', service: 'worker', message: 'Job reindex failed', duration: 2400, payload: { error: { type: 'OutOfMemory' } } },
]

// jsdom has no layout: give the virtualized scroll area the height it would have.
let restore: () => void
beforeEach(() => {
  const size = (el: HTMLElement) => (el.dataset.slot === 'data-table-scroll' ? 480 : 0)
  const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return size(this)
  })
  const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return size(this) * 2
  })
  restore = () => {
    height.mockRestore()
    width.mockRestore()
  }
})
afterEach(() => restore())

const wrap = (node: ReactNode) => (
  <YoujProvider reducedMotion="always" locale="en-US">
    {node}
  </YoujProvider>
)
function renderLogs(props: Partial<LogsTableProps> = {}) {
  const user = userEvent.setup()
  const view = render(wrap(<LogsTable events={EVENTS} {...props} />))
  return { user, rerender: (next: Partial<LogsTableProps>) => view.rerender(wrap(<LogsTable events={EVENTS} {...props} {...next} />)) }
}

const grid = () => screen.getByRole('grid')
const bodyRows = () => within(grid()).getAllByRole('row').filter((row) => row.hasAttribute('data-row-id'))
const inspector = () => screen.getByRole('complementary', { name: 'Event' })

describe('LogsTable', () => {
  test('names its section and grid by its title, shows the newest event first and counts the errors', () => {
    renderLogs()
    expect(screen.getByRole('region', { name: 'Logs' })).toBeInTheDocument()
    expect(grid()).toHaveAccessibleName('Logs')
    expect(bodyRows()[0]).toHaveTextContent('Job reindex failed')
    expect(bodyRows()[0]).toHaveTextContent('Error')
    expect(screen.getByText('3 events · 1 error')).toBeInTheDocument()
  })

  test('copy rewrites what it says', () => {
    renderLogs({ copy: { title: 'Runtime logs', live: 'Streaming' } })
    expect(screen.getByRole('heading', { name: 'Runtime logs' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Streaming/ })).toBeInTheDocument()
  })

  test('your events turn the simulation and its badge off; without them the stream says it is a demo', () => {
    const { rerender } = renderLogs()
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
    rerender({ events: undefined })
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    rerender({ events: undefined, demoMarker: false })
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })

  test('the inspector follows the active row and shows everything the event carried', async () => {
    const { user } = renderLogs()
    expect(inspector()).toHaveTextContent('Pick an event')
    await user.click(within(bodyRows()[0]!).getByText('Job reindex failed'))
    expect(inspector()).toHaveTextContent('Job reindex failed')
    expect(inspector()).toHaveTextContent('"OutOfMemory"')
    expect(inspector()).toHaveTextContent('2,400 ms')
    await user.keyboard('{ArrowDown}')
    expect(inspector()).toHaveTextContent('Card expiring soon')
    await user.click(within(inspector()).getByRole('button', { name: 'Close the event' }))
    expect(inspector()).toHaveTextContent('Pick an event')
  })

  test('paused, new events wait and are counted; resumed, they arrive', async () => {
    const onPausedChange = vi.fn()
    const { user, rerender } = renderLogs({ onPausedChange })
    await user.click(screen.getByRole('button', { name: /^Live/ }))
    expect(onPausedChange).toHaveBeenCalledWith(true)
    const later: LogsTableEvent = { id: 'e4', time: '2026-10-10T09:00:04.000Z', level: 'info', service: 'edge', message: 'Cache HIT /v1/search' }
    rerender({ onPausedChange, events: [...EVENTS, later] })
    expect(within(grid()).queryByText('Cache HIT /v1/search')).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /^Paused/ })
    expect(toggle).toHaveTextContent('1 new event')
    await user.click(toggle)
    expect(onPausedChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(bodyRows()[0]).toHaveTextContent('Cache HIT /v1/search'))
  })
})
