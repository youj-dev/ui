import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TransferList } from './transfer-list'
import { ITEMS, TICK } from './transfer-list/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot=progress-list-item]')]

describe('Transfer list block', () => {
  test('heads the card with the files and total, and folds the list past six rows', () => {
    reduced(<TransferList />)
    expect(screen.getByRole('heading', { level: 2, name: 'Transfers' })).toBeInTheDocument()
    expect(screen.getByText('14 files · 7.6 GB')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: '5 of 14 files' })).toBeInTheDocument()
    expect(rows()).toHaveLength(6)
    expect(rows()[0]).toHaveAttribute('data-status', 'failed')
    expect(rows()[0]).toHaveTextContent('Connection reset at 63%')
    expect(screen.getByRole('button', { name: /Show 8 more/ })).toBeInTheDocument()
  })

  test('moves bytes on the demo clock, and Pause all stops every transfer', async () => {
    vi.useFakeTimers()
    try {
      reduced(<TransferList />)
      const film = () => screen.getByRole('progressbar', { name: 'launch-film-master.mov' })
      const before = Number(film().getAttribute('aria-valuenow'))
      await act(async () => vi.advanceTimersByTime(TICK * 2))
      expect(Number(film().getAttribute('aria-valuenow'))).toBeGreaterThan(before)
      await act(async () => screen.getByRole('button', { name: 'Pause all' }).click())
      expect(screen.getByText('0 active · 0 queued')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Resume all' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('retry requeues the failed file, and cancel removes a row', async () => {
    const user = userEvent.setup()
    reduced(<TransferList />)
    await user.click(screen.getByRole('button', { name: 'Retry eval-traces-0926.jsonl' }))
    expect(screen.queryByText('Connection reset at 63%')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Cancel hero-still-04.png' }))
    expect(screen.getByText('13 files · 7.6 GB')).toBeInTheDocument()
  })

  test('says so when every file is settled, and shows an empty state with none', () => {
    const { unmount } = reduced(<TransferList items={ITEMS.map((f) => ({ ...f, transferred: f.size, status: 'done' as const }))} />)
    expect(screen.getByText('All settled')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeDisabled()
    unmount()
    reduced(<TransferList items={[]} embedded copy={{ title: 'Uploads' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Uploads' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Uploads' })).getByText('Nothing in flight')).toBeInTheDocument()
  })

  test('format writes the sizes and rates in your unit', () => {
    const items = [
      { id: 'a', name: 'orders', size: 4_000_000, transferred: 1_000_000, rate: 250_000, speed: 250_000, status: 'active' as const },
      { id: 'b', name: 'regions', size: 240, transferred: 240, speed: 100, status: 'done' as const },
    ]
    reduced(
      <TransferList
        items={items}
        format={{ size: (rows) => `${rows} rows`, rate: (perSecond) => `${perSecond} rows/s` }}
        copy={{ subtitle: (count, size) => `${count} tables · ${size}`, items: 'Tables' }}
      />,
    )
    expect(screen.getByText('2 tables · 4000240 rows')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'orders' })).toHaveAttribute('aria-valuetext', expect.stringContaining('1000000 rows of 4000000 rows'))
    expect(screen.getAllByText('250000 rows/s').length).toBeGreaterThan(0)
    expect(screen.getByText('240 rows')).toBeInTheDocument()
    expect(screen.queryByText(/MB|GB|KB/)).toBeNull()
  })

  test('loading puts skeletons where the figures and rows go, and nothing can be paused', () => {
    reduced(<TransferList loading />)
    expect(screen.getByRole('status', { name: 'Loading transfers' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/files/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Pause all' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeDisabled()
  })

  test('an error shows its message with Retry, and dashes for the figures', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<TransferList error="Couldn’t load the transfers." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the transfers.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/files/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('empty can be replaced by your own message', () => {
    reduced(<TransferList items={[]} empty={<p>Pick tables to copy.</p>} />)
    expect(screen.getByText('Pick tables to copy.')).toBeInTheDocument()
    expect(screen.queryByText('Nothing in flight')).toBeNull()
  })

  test('an item can bring its own glyph in place of the file one', () => {
    const items = [{ id: 'a', name: 'orders', size: 100, transferred: 40, rate: 5, speed: 5, status: 'active' as const, icon: <svg data-testid="table-glyph" /> }]
    reduced(<TransferList items={items} />)
    expect(screen.getByTestId('table-glyph')).toBeInTheDocument()
  })
})
