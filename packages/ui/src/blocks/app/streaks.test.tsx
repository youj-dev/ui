import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Streaks } from './streaks'
import { ITEMS, history } from './streaks/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const readFirst = [ITEMS[1]!, ...ITEMS.filter((h) => h.id !== 'read')]

describe('Streaks block', () => {
  test('shows the picked habit’s run, its 26 weeks and today’s list, capped at three', () => {
    reduced(<Streaks />)
    expect(screen.getByRole('heading', { level: 2, name: 'Habits' })).toBeInTheDocument()
    expect(screen.getByText('2 of 4 done today')).toBeInTheDocument()
    expect(screen.getByText('Current streak')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Morning run, Last 26 weeks' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Show / }).filter((b) => b.hasAttribute('aria-pressed'))).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Show all 4' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('Mark done marks today in the list and the grid, and the head counts it', async () => {
    const user = userEvent.setup()
    reduced(<Streaks />)
    await user.click(screen.getByRole('button', { name: 'Mark done: Morning run' }))
    expect(screen.getByText('3 of 4 done today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark done: Morning run' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-slot=calendar-heatmap][data-size=default] [data-today]')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Done today')).toBeInTheDocument()
  })

  test('a freeze saves the run yesterday broke: the day turns frozen, a token goes, and it says so', async () => {
    const user = userEvent.setup()
    reduced(<Streaks items={readFirst} />)
    expect(screen.getByText('At risk')).toBeInTheDocument()
    expect(screen.getByText('Yesterday slipped by. Use a freeze to keep your 18-day run going.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use a freeze' }))
    expect(await screen.findByText('1 left', undefined, { timeout: 3000 })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Yesterday slipped by/)).toBeNull())
    expect(document.querySelectorAll('[data-slot=calendar-heatmap][data-size=default] [data-state=frozen]').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Yesterday is frozen. Read is back on track.')
  })

  test('with no freezes left the rescue says so instead of offering one', () => {
    reduced(<Streaks items={readFirst} freezes={{ left: 0, total: 3 }} />)
    expect(screen.getByText('No freezes left this month')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use a freeze' })).toBeNull()
  })

  test('Show all reveals the rest, and picking a habit shows its grid; embedded is an h2', async () => {
    const user = userEvent.setup()
    reduced(<Streaks embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Habits' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all 4' }))
    await user.click(screen.getByRole('button', { name: /^Show Meditate / }))
    expect(screen.getByRole('button', { name: /^Show Meditate / })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Meditate, Last 26 weeks' })).toBeInTheDocument()
  })

  test('items bring their own icon, scale and words', async () => {
    const user = userEvent.setup()
    const onFreeze = vi.fn()
    reduced(
      <Streaks
        items={[
          { id: 'billing', name: 'Billing', detail: 'First reply within 15 minutes', icon: <svg data-testid="billing-icon" />, tone: 'chart-2', max: 1, days: history({ rate: 0.8, run: 12, gap: 1, older: 9, seed: 4 }) },
          { id: 'tech', name: 'Technical', detail: 'First reply within 30 minutes', tone: 'chart-4', max: 1, days: history({ rate: 0.5, run: 3, gap: 1, older: 5, seed: 5 }) },
        ]}
        copy={{ title: 'Support SLA', subtitle: (done, total) => `${done} of ${total} teams on target`, markDone: (name) => `Mark ${name} on target`, list: 'Teams', newItem: 'Add team' }}
        onFreeze={onFreeze}
        freezes={{ left: 1, total: 2 }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Support SLA' })).toBeInTheDocument()
    expect(screen.getByText('0 of 2 teams on target')).toBeInTheDocument()
    expect(screen.getAllByTestId('billing-icon')).toHaveLength(2)
    expect(screen.getByText('First reply within 15 minutes')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Teams' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add team' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark Billing on target' }))
    expect(screen.getByText('1 of 2 teams on target')).toBeInTheDocument()
    // Another item's run, picked from the list.
    await user.click(screen.getByRole('button', { name: /^Show Technical / }))
    expect(screen.getByRole('group', { name: 'Technical, Last 26 weeks' })).toBeInTheDocument()
  })

  test('loading waits behind skeletons and shows no demo habit', () => {
    const { container } = reduced(<Streaks loading />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(10)
    expect(screen.queryByText('Morning run')).not.toBeInTheDocument()
    expect(screen.queryByText(/done today/)).not.toBeInTheDocument()
  })

  test('no items shows the empty message; your own node replaces it', () => {
    const { unmount } = reduced(<Streaks items={[]} />)
    expect(screen.getByText('Nothing to track yet')).toBeInTheDocument()
    unmount()
    reduced(<Streaks items={[]} empty={<p>Add your first team</p>} />)
    expect(screen.getByText('Add your first team')).toBeInTheDocument()
  })

  test('an error shows its message with Retry, and the items appear when they arrive', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<Streaks error="No connection." onRetry={onRetry} items={[]} />)
    expect(screen.getByText('No connection.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
    rerender(
      <YoujProvider reducedMotion="always">
        <Streaks />
      </YoujProvider>,
    )
    expect(screen.getByText('2 of 4 done today')).toBeInTheDocument()
  })
})
