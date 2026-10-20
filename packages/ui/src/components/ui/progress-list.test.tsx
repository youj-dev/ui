import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ProgressList, TransferSummary, type TransferItem } from './progress-list'

const MB = 1_000_000
const ITEMS: TransferItem[] = [
  { id: 'q', name: 'deck.pdf', size: 40 * MB, transferred: 0, status: 'queued' },
  { id: 'a', name: 'film.mov', size: 100 * MB, transferred: 50 * MB, rate: 10 * MB, status: 'active' },
  { id: 'd', name: 'notes.md', size: 2 * MB, transferred: 2 * MB, status: 'done' },
  { id: 'f', name: 'traces.jsonl', size: 10 * MB, transferred: 6 * MB, status: 'failed', error: 'Connection reset' },
  { id: 'p', name: 'brand.key', size: 20 * MB, transferred: 5 * MB, status: 'paused' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot=progress-list-item]')]

describe('ProgressList', () => {
  test('orders failed first, then moving, then queued, with done rows at the foot', () => {
    reduced(<ProgressList items={ITEMS} max={0} />)
    expect(rows().map((r) => r.dataset.status)).toEqual(['failed', 'active', 'paused', 'queued', 'done'])
  })

  test('each unfinished row is a progressbar named by its file, with its state spoken', () => {
    reduced(<ProgressList items={ITEMS} max={0} />)
    const film = screen.getByRole('progressbar', { name: 'film.mov' })
    expect(film).toHaveAttribute('aria-valuenow', '50')
    expect(film.getAttribute('aria-valuetext')).toMatch(/50 MB of 100 MB/)
    expect(screen.getByRole('progressbar', { name: 'brand.key' }).getAttribute('aria-valuetext')).toMatch(/Paused/)
    expect(screen.getByText('Connection reset')).toBeInTheDocument()
    // Moved bytes read in the size's unit, even at zero.
    expect(rows()[3]).toHaveTextContent('0 MB of 40 MB')
    // Rate and time left for the moving row.
    expect(rows()[1]).toHaveTextContent('10 MB/s')
    expect(rows()[1]).toHaveTextContent('0:05 left')
  })

  test('lights whole cells up to the bytes moved, and a done row folds its cells away', () => {
    reduced(<ProgressList items={ITEMS} max={0} segments={10} />)
    const film = rows()[1]!
    expect(film.querySelectorAll('[data-slot=progress-list-cell][data-state=on]')).toHaveLength(5)
    expect(rows()[4]!.querySelector('[data-slot=progress-list-progress]')).toBeNull()
  })

  test('pause, resume, cancel and retry call back with the row’s id', async () => {
    const user = userEvent.setup()
    const calls: string[] = []
    const log = (name: string) => (id: string) => void calls.push(`${name}:${id}`)
    reduced(<ProgressList items={ITEMS} max={0} onPause={log('pause')} onResume={log('resume')} onCancel={log('cancel')} onRetry={log('retry')} />)
    await user.click(screen.getByRole('button', { name: 'Pause film.mov' }))
    await user.click(screen.getByRole('button', { name: 'Resume brand.key' }))
    await user.click(screen.getByRole('button', { name: 'Retry traces.jsonl' }))
    await user.click(screen.getByRole('button', { name: 'Cancel deck.pdf' }))
    expect(calls).toEqual(['pause:a', 'resume:p', 'retry:f', 'cancel:q'])
    // A done row has nothing left to press.
    expect(screen.queryByRole('button', { name: 'Cancel notes.md' })).toBeNull()
  })

  test('without callbacks it shows no buttons', () => {
    reduced(<ProgressList items={ITEMS} max={0} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('folds rows past max under Show N more, and unfolds them', async () => {
    const user = userEvent.setup()
    reduced(<ProgressList items={ITEMS} max={2} />)
    expect(rows()).toHaveLength(2)
    const more = screen.getByRole('button', { name: /Show 3 more/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(rows()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('announces a row that finishes or fails', () => {
    const { rerender } = reduced(<ProgressList items={ITEMS} max={0} />)
    const next = ITEMS.map((i) => (i.id === 'a' ? { ...i, transferred: i.size, status: 'done' as const } : i))
    rerender(
      <YoujProvider reducedMotion="always">
        <ProgressList items={next} max={0} />
      </YoujProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('film.mov finished')
  })

  test('moves focus to the row in its place when a cancelled row leaves', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [items, setItems] = useState(ITEMS)
      return <ProgressList items={items} max={0} onCancel={(id) => setItems((l) => l.filter((i) => i.id !== id))} />
    }
    reduced(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Cancel film.mov' }))
    // film.mov sat second, after the failed row; the paused row below it takes focus.
    expect(document.activeElement).toHaveAccessibleName('Cancel brand.key')
  })
})

describe('TransferSummary', () => {
  test('totals the bytes, counts done files in the meter and offers the all-row actions', async () => {
    const user = userEvent.setup()
    const paused: string[] = []
    reduced(<TransferSummary items={ITEMS} onPauseAll={() => paused.push('all')} onCancelAll={() => {}} />)
    const meter = screen.getByRole('meter', { name: '1 of 5 files' })
    expect(meter).toHaveAttribute('aria-valuenow', String((63 / 172) * 100))
    expect(document.querySelector('[data-slot=transfer-summary-figure]')).toHaveTextContent('63 MB of 172 MB')
    await user.click(screen.getByRole('button', { name: 'Pause all' }))
    expect(paused).toEqual(['all'])
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeInTheDocument()
  })
})

