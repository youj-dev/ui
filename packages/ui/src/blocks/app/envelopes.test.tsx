import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Envelopes } from './envelopes'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const envelope = (id: string) => document.querySelector<HTMLElement>(`[data-envelope="${id}"]`)!

describe('Envelopes card', () => {
  test('shows safe to spend, the envelopes with one overspent, and the recent entries tagged to envelopes', () => {
    reduced(<Envelopes />)
    expect(screen.getByRole('heading', { level: 2, name: 'Budget' })).toBeInTheDocument()
    expect(screen.getByText('Safe to spend today')).toBeInTheDocument()
    // What's left across the envelopes ($329.95) over three days.
    expect(document.querySelector('[data-slot=envelopes-safe]')).toHaveTextContent('$109.98')
    expect(envelope('eating')).toHaveAccessibleName('Eating out, $32 over')
    const recent = screen.getByRole('list', { name: 'Recent' })
    expect(recent.children).toHaveLength(5)
    expect(recent).toHaveTextContent('Corner Market')
  })

  test('money moved from the keyboard lands in the other envelope', async () => {
    const user = userEvent.setup()
    reduced(<Envelopes />)
    envelope('fun').focus()
    // Picking up aims at the next envelope; Enter drops it there.
    await user.keyboard(' {Enter}')
    expect(envelope('fun')).toHaveAccessibleName('Fun, $79 left of $150')
    expect(envelope('transport')).toHaveAccessibleName('Transport, $27 left of $130')
  })

  test('Cover overspending moves the shortfall from the fullest envelope, and Add expense logs one', async () => {
    const user = userEvent.setup()
    reduced(<Envelopes embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Budget' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cover overspending' }))
    expect(envelope('eating')).not.toHaveAttribute('data-state', 'over')
    expect(screen.getByRole('button', { name: 'Cover overspending' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Add expense' }))
    await waitFor(() => expect(screen.getByRole('list', { name: 'Recent' })).toHaveTextContent('Bakery Sol'))
    await waitFor(() => expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Bakery Sol, $6.40, added'))
  })

  test('format, step, icons and entries drive the card, and onAdd supplies the entry', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn(() => ({ title: 'Pairing session', envelope: 'web', amount: 2 }))
    reduced(
      <Envelopes
        format={{ style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 1 }}
        step={4}
        daysLeft={2}
        envelopes={[
          { id: 'web', name: 'Web app', icon: <svg data-testid="web-icon" />, budget: 40, spent: 10 },
          { id: 'api', name: 'API', budget: 20, spent: 5 },
        ]}
        entries={[{ id: 'e1', title: 'Settings page', envelope: 'web', amount: 5.5, date: '2026-09-27' }]}
        copy={{ add: 'Log hours', dragHint: (step: string) => `Move ${step} at a time`, recent: 'Logged' }}
        onAdd={onAdd}
      />,
    )
    expect(envelope('web')).toHaveAccessibleName('Web app, 30h left of 40h')
    expect(screen.getByText('Move 4h at a time')).toBeInTheDocument()
    expect(screen.getAllByTestId('web-icon').length).toBeGreaterThan(0)
    // 45h left over two days.
    expect(document.querySelector('[data-slot=envelopes-safe]')).toHaveTextContent('22.5h')
    expect(screen.getByRole('list', { name: 'Logged' })).toHaveTextContent('5.5h')
    await user.click(screen.getByRole('button', { name: 'Log hours' }))
    await waitFor(() => expect(onAdd).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByRole('list', { name: 'Logged' })).toHaveTextContent('Pairing session'))
  })

  test('loading takes the figures and envelopes, empty shows the message, error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<Envelopes loading />)
    expect(screen.getByText('Loading the envelopes')).toBeInTheDocument()
    expect(document.querySelector('[data-envelope]')).toBeNull()
    expect(document.querySelector('[data-slot=envelopes-safe] [data-slot=skeleton]')).not.toBeNull()
    rerender(
      <YoujProvider reducedMotion="always">
        <Envelopes envelopes={[]} entries={[]} />
      </YoujProvider>,
    )
    expect(screen.getByText('No envelopes yet')).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <Envelopes error="Couldn’t load the budget." onRetry={onRetry} />
      </YoujProvider>,
    )
    expect(screen.getByText('Couldn’t load the budget.')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=envelopes-safe]')).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
