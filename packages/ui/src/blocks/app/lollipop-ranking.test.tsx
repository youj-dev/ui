import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LollipopRanking } from './lollipop-ranking'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () =>
  within(screen.getByRole('table', { name: 'SLOs' }))
    .getAllByRole('row')
    .slice(1)
const names = () => rows().map((row) => within(row).getAllByRole('button')[0]!.textContent)
const dots = () => within(screen.getByRole('listbox', { name: 'Budget left by SLO, most spent first' })).getAllByRole('option')

describe('LollipopRanking', () => {
  test('counts the SLOs in the head and lists them most spent first, as a section with an h2', () => {
    reduced(<LollipopRanking />)
    expect(screen.getByRole('heading', { level: 2, name: 'Reliability index' })).toBeInTheDocument()
    expect(screen.getByText('18 SLOs · 5 exhausted')).toBeInTheDocument()
    expect(screen.getByText('1 paging')).toBeInTheDocument()
    expect(rows()).toHaveLength(18)
    expect(names().slice(0, 2)).toEqual(['Order intake success', 'Push relay availability'])
    expect(rows()[0]).toHaveTextContent('-82.3%')
    expect(rows()[0]).toHaveTextContent('Paging')
    expect(screen.getByRole('columnheader', { name: 'Budget left' })).toHaveAttribute('aria-sort', 'ascending')
  })

  test('the budget index shows every SLO from the most spent, the most spent picked', () => {
    reduced(<LollipopRanking />)
    expect(dots()).toHaveLength(18)
    expect(dots()[0]).toHaveAccessibleName('Order intake success: -82.3%')
    expect(dots()[0]).toHaveAttribute('aria-selected', 'true')
    expect(rows()[0]).toHaveAttribute('data-state', 'selected')
    expect(screen.getByText('Exhausted', { selector: 'li' })).toHaveTextContent('Exhausted5')
  })

  test('picking a row picks its dot, and the other way round', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<LollipopRanking onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Cart API latency' }))
    expect(onValueChange).toHaveBeenLastCalledWith('cart')
    expect(dots().find((d) => d.getAttribute('aria-selected') === 'true')).toHaveAccessibleName('Cart API latency: +20.6%')
    await user.click(dots()[17]!)
    expect(onValueChange).toHaveBeenLastCalledWith('billing')
    expect(screen.getByRole('button', { name: 'Billing API availability' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('status tabs, the team and the search filter both the table and the index; the budget sorts both ways', async () => {
    const user = userEvent.setup()
    reduced(<LollipopRanking />)
    await user.click(screen.getByRole('tab', { name: /At risk/ }))
    expect(names()).toEqual(['Inventory sync freshness', 'Shipping quote availability', 'Cart API latency'])
    expect(dots()).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Budget left' }))
    expect(names()[0]).toBe('Cart API latency')
    await user.click(screen.getByRole('tab', { name: /All/ }))
    await user.type(screen.getByRole('searchbox', { name: 'Search SLOs' }), 'relay')
    expect(names()).toEqual(['Email relay success', 'Push relay availability'])
    expect(screen.getByRole('tab', { name: /Exhausted/ })).toHaveTextContent('1')
    await user.clear(screen.getByRole('searchbox', { name: 'Search SLOs' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search SLOs' }), 'nothing like this')
    expect(screen.getByText('No SLOs match')).toBeInTheDocument()
  })

  test('the foot says what is shown and when, and the actions call your handlers', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onCreate = vi.fn()
    reduced(<LollipopRanking onOpen={onOpen} onCreate={onCreate} />)
    expect(screen.getByText('Showing 18 of 18 SLOs · 2 muted · Evaluated Sep 29, 14:20 UTC')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open SLO' }))
    expect(onOpen).toHaveBeenCalledWith('intake')
    await user.click(screen.getByRole('button', { name: 'New SLO' }))
    expect(onCreate).toHaveBeenCalled()
  })

  test('your items and words drive the content', () => {
    reduced(
      <LollipopRanking
        items={[
          {
            id: 'a',
            name: 'Checkout',
            detail: 'pay',
            target: 0.999,
            period: 30,
            owner: { name: 'Jo Ng', initials: 'JN' },
            group: 'Shop',
            value: 0.4,
            alert: 'quiet',
            history: [1, 1, 1],
          },
          {
            id: 'b',
            name: 'Search',
            detail: 'find',
            target: 0.99,
            period: 7,
            owner: { name: 'Al Ro', initials: 'AR' },
            group: 'Shop',
            value: -0.1,
            alert: 'quiet',
            history: [1, 0.9, 1],
          },
        ]}
        copy={{ title: 'Budgets' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Budgets' })).toBeInTheDocument()
    expect(names()).toEqual(['Search', 'Checkout'])
    expect(screen.queryByText(/paging/)).not.toBeInTheDocument()
  })

  test('your statuses drive the tabs, the dots, the key and the head count', async () => {
    const user = userEvent.setup()
    reduced(
      <LollipopRanking
        statuses={[
          { id: 'late', label: 'Late', tone: 'danger', below: -0.03 },
          { id: 'ok', label: 'On time', tone: 'success' },
        ]}
        domain={[-0.2, 0.2]}
        items={[
          {
            id: 'a',
            name: 'Northwind',
            detail: '41 orders',
            target: 0.95,
            period: 30,
            owner: { name: 'Jo Ng', initials: 'JN' },
            group: 'Packaging',
            value: -0.12,
            alert: 'raised',
            history: [0.8, 0.82],
          },
          {
            id: 'b',
            name: 'Summit',
            detail: '210 orders',
            target: 0.95,
            period: 30,
            owner: { name: 'Al Ro', initials: 'AR' },
            group: 'Freight',
            value: 0.02,
            alert: 'quiet',
            history: [0.96, 0.97],
          },
          {
            id: 'c',
            name: 'Redwood',
            detail: '152 orders',
            target: 0.95,
            period: 30,
            owner: { name: 'Mi To', initials: 'MT' },
            group: 'Freight',
            value: -0.01,
            alert: 'quiet',
            history: [0.95, 0.94],
            status: 'late',
          },
        ]}
        copy={{
          summary: (total: string, flagged: string) => `${total} suppliers · ${flagged} late`,
          raised: (n: string) => `${n} escalated`,
          alerts: { quiet: 'None', raised: 'Escalated', muted: 'Paused' },
        }}
      />,
    )
    expect(screen.getByText('3 suppliers · 2 late')).toBeInTheDocument()
    expect(screen.getByText('1 escalated')).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['All3', 'Late2', 'On time1'])
    expect(screen.getByText('Late', { selector: 'li' })).toHaveTextContent('Late2')
    expect(rows()[0]).toHaveTextContent('Escalated')
    await user.click(screen.getByRole('tab', { name: /Late/ }))
    expect(names()).toEqual(['Northwind', 'Redwood'])
  })

  test('your icon, detail and period words show under the name', () => {
    reduced(
      <LollipopRanking
        items={[
          {
            id: 'a',
            name: 'Harbor Elementary',
            detail: 'Eastside',
            icon: <svg data-testid="school" />,
            target: 0.95,
            period: 180,
            owner: { name: 'Jo Ng', initials: 'JN' },
            group: 'Eastside',
            value: -0.06,
            alert: 'quiet',
            history: [0.9, 0.89],
          },
        ]}
        copy={{ period: (days: number) => `${days} school days` }}
      />,
    )
    expect(screen.getByTestId('school')).toBeInTheDocument()
    expect(screen.getByText('Eastside · 95% · 180 school days')).toBeInTheDocument()
  })

  test('with no items it shows the empty message over the body and disables Open', () => {
    reduced(<LollipopRanking items={[]} />)
    expect(screen.getByText('No SLOs yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open SLO' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<LollipopRanking items={[]} empty={<p>Add a supplier</p>} />)
    expect(screen.getByText('Add a supplier')).toBeInTheDocument()
    expect(screen.queryByText('No SLOs yet')).not.toBeInTheDocument()
  })

  test('an error shows its message, dashes the head and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<LollipopRanking error="Couldn’t load the ranking." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the ranking.')).toBeInTheDocument()
    expect(screen.queryByText('18 SLOs · 5 exhausted')).not.toBeInTheDocument()
    expect(screen.queryByText('1 paging')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the body as skeletons and shows no demo figures', () => {
    reduced(<LollipopRanking loading />)
    expect(screen.getByText('Loading the ranking')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(0)
    expect(screen.queryByText('18 SLOs · 5 exhausted')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<LollipopRanking embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Reliability index' })).toBeInTheDocument()
  })
})
