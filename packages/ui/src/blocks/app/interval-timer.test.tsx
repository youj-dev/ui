import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { IntervalTimer, type IntervalTimerInterval, type IntervalTimerItem } from './interval-timer'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const summary = () => document.querySelector('[data-slot=segmented-ring-summary]')!.textContent

const FOCUS: IntervalTimerInterval[] = [
  { kind: 'work', duration: 1500, label: 'Write report' },
  { kind: 'rest', duration: 300 },
  { kind: 'work', duration: 1500, label: 'Answer email' },
]
const TASKS: IntervalTimerItem[] = [
  { id: 'report', name: 'Write report', target: 'a first draft', count: 1, amount: 25 },
  { id: 'email', name: 'Answer email', target: 'inbox under 10', count: 2, amount: 15 },
]

describe('IntervalTimer', () => {
  test('the ring shows round 3, Skip moves to the rest, and a logged entry is announced', async () => {
    const user = userEvent.setup()
    reduced(<IntervalTimer />)
    expect(screen.getByRole('heading', { level: 2, name: 'Evening HIIT' })).toBeInTheDocument()
    expect(summary()).toMatch(/^Round 3 of 8\. Work/)
    await user.click(screen.getByRole('button', { name: 'Skip to the next interval' }))
    expect(summary()).toMatch(/^Round 3 of 8\. Rest, 0:20 left/)
    expect(screen.getByRole('button', { name: '+15 s, Add 15 seconds of rest' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log set' }))
    expect(screen.getByText('Set 3')).toBeInTheDocument()
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Logged Push-ups: 15 × BW')
  })

  test('embedded, it is a section named by an h2; on its own page, an h1', () => {
    const { unmount } = reduced(<IntervalTimer />)
    expect(screen.getByRole('region', { name: 'Evening HIIT' })).toBeInTheDocument()
    unmount()
    reduced(<IntervalTimer embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Evening HIIT' })).toBeInTheDocument()
  })

  test('your intervals, items and words drive the card, and a logged entry reaches onLog', async () => {
    const user = userEvent.setup()
    const onLog = vi.fn()
    reduced(
      <IntervalTimer
        intervals={FOCUS}
        items={TASKS}
        entries={[]}
        elapsed={1500 + 300 + 10}
        onLog={onLog}
        copy={{ title: 'Focus', subtitle: (m) => `2 cycles · ${m} min`, log: 'Log cycle', count: 'Cycles', amount: 'Focus', unit: 'min', noEntries: 'No cycles yet.', entryNumber: (n) => `Cycle ${n}`, total: 'Focused', rest: 'Break' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Focus' })).toBeInTheDocument()
    expect(screen.getByText('2 cycles · 55 min')).toBeInTheDocument()
    expect(screen.getByText('Answer email')).toBeInTheDocument()
    expect(screen.getByText('Target inbox under 10')).toBeInTheDocument()
    expect(screen.getByText('No cycles yet.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log cycle' }))
    expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ item: 'email', count: 2, amount: 15 }))
    expect(screen.getByText('Cycle 1')).toBeInTheDocument()
    expect(screen.getByText(/^Focused/)).toHaveTextContent('Focused 30 min')
  })

  test('no intervals shows the empty message; your own node replaces it', () => {
    const { unmount } = reduced(<IntervalTimer intervals={[]} />)
    expect(screen.getByText('Nothing to time yet')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=segmented-ring-summary]')).toBeNull()
    unmount()
    reduced(<IntervalTimer intervals={[]} empty={<p>Add a block first</p>} />)
    expect(screen.getByText('Add a block first')).toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<IntervalTimer error="No connection." onRetry={onRetry} />)
    expect(screen.getByText('No connection.')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=segmented-ring-summary]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('loading shows skeletons and no demo session', () => {
    const { container } = reduced(<IntervalTimer loading />)
    expect(screen.getByText('Loading the timer')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(5)
    expect(document.querySelector('[data-slot=segmented-ring-summary]')).toBeNull()
    expect(screen.queryByText('Kettlebell swings')).not.toBeInTheDocument()
  })
})
