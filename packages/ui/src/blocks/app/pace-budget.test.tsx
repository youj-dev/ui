import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PaceBudget } from './pace-budget'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const cell = (name: string) =>
  within(screen.getByRole('group', { name: 'Spending by category' })).getByRole('listitem', { name: new RegExp(`^${name}:`) })

describe('pace budget block', () => {
  test('names the page, the meter, the map and the plan, and outlines what the plan trims', () => {
    reduced(<PaceBudget />)
    expect(screen.getByRole('region', { name: 'Spending' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Spending' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Budget spent' })).toHaveAttribute('aria-valuetext', '$3,584 of $4,200, 85%')
    expect(screen.getByRole('region', { name: 'Savings plan' })).toContainElement(screen.getByRole('heading', { level: 3, name: 'Savings plan' }))
    expect(cell('Rent')).toHaveAccessibleName('Rent: $1,650, 46% of total')
    expect(cell('Subscriptions')).toHaveAccessibleName('Subscriptions: $164, 4.6% of total, highlighted')
    expect(cell('Dining out')).toHaveAttribute('data-highlighted')
    expect(cell('Phone & internet')).not.toHaveAttribute('data-highlighted')
    expect(screen.getByRole('switch', { name: 'Cancel 3 unused subscriptions' })).toBeChecked()
    expect(screen.getByRole('switch', { name: /phone plan/ })).not.toBeChecked()
    expect(screen.getByText('Sep 27')).toBeInTheDocument()
    expect(screen.getByText('at $68 a day')).toBeInTheDocument()
  })

  test('switching a step on outlines its category; switching one off lets it go', async () => {
    const user = userEvent.setup()
    reduced(<PaceBudget />)
    await user.click(screen.getByRole('switch', { name: /phone plan/ }))
    expect(cell('Phone & internet')).toHaveAttribute('data-highlighted')
    await user.click(screen.getByRole('switch', { name: 'Cancel 3 unused subscriptions' }))
    expect(cell('Subscriptions')).not.toHaveAttribute('data-highlighted')
  })

  test('with nothing chosen, the plan says so and Apply is disabled', async () => {
    const user = userEvent.setup()
    reduced(<PaceBudget />)
    await user.click(screen.getByRole('switch', { name: 'Cancel 3 unused subscriptions' }))
    await user.click(screen.getByRole('switch', { name: /Cap dining/ }))
    expect(screen.getByText('Nothing selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply plan' })).toBeDisabled()
  })

  test('applying trims the categories, clears the steps that ran and says what it saved', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<PaceBudget onApply={onApply} />)
    await user.click(screen.getByRole('button', { name: 'Apply plan' }))
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([expect.objectContaining({ id: 'subscriptions' }), expect.objectContaining({ id: 'dining' })]),
    )
    await waitFor(() => expect(cell('Subscriptions')).toHaveAccessibleName('Subscriptions: $118, 3.4% of total'))
    expect(screen.queryByRole('switch', { name: 'Cancel 3 unused subscriptions' })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /phone plan/ })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Budget spent' })).toHaveAttribute('aria-valuetext', '$3,446 of $4,200, 82%')
    expect(screen.getByText('Sep 29')).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((el) => el.textContent?.includes('Saved $138'))).toBe(true)
  })

  test('a budget with room to spare lasts the month', () => {
    reduced(<PaceBudget budget={6000} />)
    expect(screen.getByText('Lasts the month')).toBeInTheDocument()
  })

  test('amounts follow the locale and currency', () => {
    reduced(<PaceBudget copy={{ locale: 'de-DE', currency: 'EUR' }} />)
    expect(screen.getByRole('meter', { name: 'Budget spent' }).getAttribute('aria-valuetext')).toMatch(/^3\.584\s€ of 4\.200\s€, 85\s%$/)
  })

  test('embedded, it is a named section with an h2, the plan an h3, and no page around it', () => {
    reduced(<PaceBudget embedded copy={{ title: 'Budget' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Budget' })).toContainElement(screen.getByRole('heading', { level: 2, name: 'Budget' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Savings plan' })).toBeInTheDocument()
  })
})

describe('pace budget with your data', () => {
  const kcal = (value: number) => `${Math.round(value)} kcal`
  const data = {
    budget: 1000,
    pace: 150,
    period: { year: 2026, month: 8, today: 4, days: 7 },
    format: kcal,
    categories: [
      { id: 'meals', name: 'Meals', used: 500 },
      { id: 'snacks', name: 'Snacks', used: 200 },
    ],
    steps: [{ id: 'swap', title: 'Swap the cookie for fruit', detail: 'About 100 kcal less.', frees: 100, category: 'snacks', planned: true }],
    copy: {
      mapLabel: 'Calories by source',
      meter: 'Calories used',
      used: 'Eaten',
      plan: 'Swaps',
      apply: 'Apply swaps',
      applied: (amount: string) => `Freed ${amount}`,
      lasts: 'Lasts the week',
    },
  }

  test('your format, period, pace, labels and copy drive every figure', () => {
    reduced(<PaceBudget {...data} />)
    expect(screen.getByRole('meter', { name: 'Calories used' })).toHaveAttribute('aria-valuetext', '700 kcal of 1000 kcal, 70%')
    expect(within(screen.getByRole('group', { name: 'Calories by source' })).getByRole('listitem', { name: /^Meals:/ })).toHaveAccessibleName(
      /500 kcal/,
    )
    expect(screen.getByText('Eaten')).toBeInTheDocument()
    expect(screen.getByText('300 kcal')).toBeInTheDocument()
    // 300 left at 150 a day: Sep 6.
    expect(screen.getByText('Sep 6')).toBeInTheDocument()
    expect(screen.getByText('at 150 kcal a day')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Swaps' })).toBeInTheDocument()
    // The plan's total and the step's own badge.
    expect(screen.getAllByText('−100 kcal')).toHaveLength(2)
  })

  test('applying reports the steps, trims the category and says what it freed', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<PaceBudget {...data} onApply={onApply} />)
    await user.click(screen.getByRole('button', { name: 'Apply swaps' }))
    await waitFor(() => expect(onApply).toHaveBeenCalledWith([expect.objectContaining({ id: 'swap' })]))
    await waitFor(() => expect(screen.getByRole('meter', { name: 'Calories used' })).toHaveAttribute('aria-valuetext', '600 kcal of 1000 kcal, 60%'))
    expect(screen.getAllByRole('status').some((el) => el.textContent?.includes('Freed 100 kcal'))).toBe(true)
  })

  test('loading shows skeletons and no demo figures', () => {
    reduced(<PaceBudget loading />)
    expect(screen.getByText('Loading the budget')).toBeInTheDocument()
    expect(screen.queryByText(/3,584|4,200|Sep 27/)).toBeNull()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.getByRole('button', { name: 'Apply plan' })).toBeDisabled()
  })

  test('an error shows its message with Retry and dashes for the figures', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<PaceBudget error="Couldn’t load" onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load')).toBeInTheDocument()
    expect(screen.queryByText(/3,584|Sep 27/)).toBeNull()
    expect(screen.queryByRole('meter')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('no categories shows the empty message, or your own', () => {
    const { unmount } = reduced(<PaceBudget categories={[]} />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    unmount()
    reduced(<PaceBudget categories={[]} empty={<p>No spend yet</p>} />)
    expect(screen.getByText('No spend yet')).toBeInTheDocument()
  })

  test('data that arrives after loading fills the card and its plan', () => {
    const { rerender } = reduced(<PaceBudget loading />)
    rerender(
      <YoujProvider reducedMotion="always">
        <PaceBudget {...data} />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter', { name: 'Calories used' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Swap the cookie for fruit' })).toBeChecked()
  })
})
