import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { QueueMonitor } from './queue-monitor'
import { QUEUES, type QueueMonitorQueue } from './queue-monitor/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const lanes = () => screen.getByRole('group', { name: 'Queue load' })

describe('QueueMonitor', () => {
  test('shows the queue’s throughput and its load, lane by lane', () => {
    reduced(<QueueMonitor live={false} />)
    expect(screen.getByRole('region', { name: 'Job queue' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Job queue' })).toBeInTheDocument()
    expect(screen.getByText('emails · 4 workers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'emails' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(lanes()).getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '24 of 32')
    expect(within(lanes()).getByRole('meter', { name: 'Queued' })).toHaveAttribute('aria-valuetext', '214 of 500')
    expect(within(lanes()).getByRole('meter', { name: 'Failed' })).toHaveAttribute('aria-valuenow', '7')
    expect(screen.getByRole('img', { name: 'Throughput, last 30 minutes' })).toBeInTheDocument()
  })

  test('the queue selector swaps every figure', async () => {
    const user = userEvent.setup()
    reduced(<QueueMonitor live={false} />)
    await user.click(screen.getByRole('button', { name: 'webhooks' }))
    expect(screen.getByText('webhooks · 6 workers')).toBeInTheDocument()
    expect(within(lanes()).getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '46 of 48')
    expect(within(lanes()).getByRole('meter', { name: 'Failed' })).toHaveAttribute('aria-valuenow', '3')
  })

  test('retrying a failed job moves it back to the backlog and says so', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<QueueMonitor live={false} onRetryFailed={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry job-41be07' }))
    expect(screen.queryByRole('button', { name: 'Retry job-41be07' })).not.toBeInTheDocument()
    expect(within(lanes()).getByRole('meter', { name: 'Failed' })).toHaveAttribute('aria-valuenow', '6')
    expect(within(lanes()).getByRole('meter', { name: 'Queued' })).toHaveAttribute('aria-valuetext', '215 of 500')
    expect(onRetry).toHaveBeenCalledWith([{ id: 'job-41be07', error: 'SMTP 421: try again later' }], 'emails')
    expect(screen.getByText('Retrying job-41be07')).toHaveAttribute('role', 'status')
  })

  test('Retry all empties the failed lane', async () => {
    const user = userEvent.setup()
    reduced(<QueueMonitor live={false} />)
    await user.click(screen.getByRole('button', { name: 'Retry all' }))
    expect(within(lanes()).getByRole('meter', { name: 'Failed' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.queryByRole('button', { name: /^Retry job-/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry all' })).toBeDisabled()
    expect(screen.getByText('Retrying 7 jobs')).toHaveAttribute('role', 'status')
  })

  test('Pause stops the queue and counts from there; Resume goes live again', async () => {
    const user = userEvent.setup()
    reduced(<QueueMonitor live={false} />)
    expect(screen.getByText('Live · updated just now')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText(/^Updated/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  test('Scale workers adds a worker’s slots', async () => {
    const user = userEvent.setup()
    const onScale = vi.fn(() => Promise.resolve())
    reduced(<QueueMonitor live={false} onScale={onScale} />)
    await user.click(screen.getByRole('button', { name: 'Scale workers' }))
    await waitFor(() => expect(screen.getByText('emails · 5 workers')).toBeInTheDocument())
    expect(onScale).toHaveBeenCalledWith('emails', 5)
    expect(within(lanes()).getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '24 of 40')
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<QueueMonitor live={false} embedded copy={{ title: 'Queues' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Queues' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Queues' })).toBeInTheDocument()
  })

  test('drifts only its demo queues, under a Demo data marker; yours show as given and update when you pass fresh ones', () => {
    vi.useFakeTimers()
    try {
      const demo = reduced(<QueueMonitor />)
      expect(screen.getByText('Demo data')).toBeInTheDocument()
      demo.unmount()
      const view = reduced(<QueueMonitor queues={QUEUES} />)
      expect(screen.queryByText('Demo data')).toBeNull()
      act(() => vi.advanceTimersByTime(15_000))
      expect(within(lanes()).getByRole('meter', { name: 'Queued' })).toHaveAttribute('aria-valuetext', '214 of 500')
      view.rerender(
        <YoujProvider reducedMotion="always">
          <QueueMonitor queues={QUEUES.map((q) => (q.id === 'emails' ? { ...q, queued: 99 } : q))} />
        </YoujProvider>,
      )
      expect(within(lanes()).getByRole('meter', { name: 'Queued' })).toHaveAttribute('aria-valuetext', '99 of 500')
    } finally {
      vi.useRealTimers()
    }
  })
  describe('for any queues', () => {
    const kitchen: QueueMonitorQueue[] = [
      { id: 'grill', label: 'grill', workers: 2, slotsPerWorker: 4, queued: 9, capacity: 30, running: 6, failed: [{ id: 'table-12', error: 'Steak overcooked' }], done: 120, target: 200, throughput: [3, 4, 5, 4], p95Wait: 420, oldest: 600 },
      { id: 'fry', label: 'fry', workers: 1, slotsPerWorker: 2, queued: 2, capacity: 20, running: 1, failed: [], done: 60, target: 100, throughput: [2, 2, 3, 2], p95Wait: 180, oldest: 240 },
    ]

    test('tabs, slots and counts come from your queues', async () => {
      const user = userEvent.setup()
      reduced(<QueueMonitor queues={kitchen} copy={{ subtitle: (q: string, n: number) => `${q} · ${n} cooks` }} />)
      expect(screen.getByText('grill · 2 cooks')).toBeInTheDocument()
      expect(within(lanes()).getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '6 of 8')
      await user.click(screen.getByRole('button', { name: 'fry' }))
      expect(screen.getByText('fry · 1 cooks')).toBeInTheDocument()
      expect(within(lanes()).getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '1 of 2')
    })

    test('defaultQueue picks the first tab', () => {
      reduced(<QueueMonitor queues={kitchen} defaultQueue="fry" />)
      expect(screen.getByRole('button', { name: 'fry' })).toHaveAttribute('aria-pressed', 'true')
    })

    test('your formatters write the rate and the waits', () => {
      reduced(<QueueMonitor queues={kitchen} format={{ rate: (n) => `${n} orders`, age: (s) => `${Math.round(s / 60)} min` }} />)
      expect(screen.getByText('4 orders')).toBeInTheDocument()
      expect(screen.getByText('7 min')).toBeInTheDocument()
      expect(screen.getByText('10 min')).toBeInTheDocument()
    })

    test('loading holds the figures back, an error offers Retry, and no queues show the empty message', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const view = reduced(<QueueMonitor queues={kitchen} loading />)
      expect(screen.getByText('Loading the queues')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Queue load' })).toBeNull()
      expect(screen.queryByText('4')).toBeNull()
      view.unmount()
      const failed = reduced(<QueueMonitor queues={kitchen} error="Couldn’t load the queues." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load the queues.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalled()
      failed.unmount()
      reduced(<QueueMonitor queues={[]} />)
      expect(screen.getByText('No queues yet')).toBeInTheDocument()
    })
  })
})
