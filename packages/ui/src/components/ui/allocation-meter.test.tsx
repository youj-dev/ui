import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AllocationMeter, type Envelope } from './allocation-meter'

const ENVELOPES: Envelope[] = [
  { id: 'food', name: 'Groceries', budget: 400, spent: 300, rollover: 40 },
  { id: 'fun', name: 'Fun', budget: 100, spent: 40 },
  { id: 'out', name: 'Eating out', budget: 200, spent: 230 },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const envelope = (id: string) => document.querySelector<HTMLElement>(`[data-envelope="${id}"]`)!

function Harness({ onMove }: { onMove?: (from: string, to: string, amount: number) => void }) {
  const [list, setList] = useState(ENVELOPES)
  return (
    <AllocationMeter
      envelopes={list}
      onMove={(from, to, amount) => {
        onMove?.(from, to, amount)
        setList((l) => l.map((e) => (e.id === from ? { ...e, budget: e.budget - amount } : e.id === to ? { ...e, budget: e.budget + amount } : e)))
      }}
    />
  )
}

describe('AllocationMeter', () => {
  test('names each envelope by what it has left of what, and draws rollover and overspend', () => {
    reduced(<AllocationMeter envelopes={ENVELOPES} />)
    expect(screen.getByRole('group', { name: 'Envelopes' })).toBeInTheDocument()
    expect(envelope('food')).toHaveAccessibleName('$140 Groceries, $140 left of $440, $40 rolled over')
    expect(envelope('out')).toHaveAccessibleName('−$30 Eating out, $30 over')
    expect(envelope('out')).toHaveAttribute('data-state', 'over')
    // 140 of 440 over 16 cells lights 5; the top cells are the rollover's.
    expect(envelope('food').querySelectorAll('[data-slot=allocation-meter-cell][data-state=on]')).toHaveLength(5)
    expect(envelope('food').querySelectorAll('[data-slot=allocation-meter-cell][data-rollover]').length).toBeGreaterThan(0)
    expect(envelope('out').querySelectorAll('[data-slot=allocation-meter-spill] > *').length).toBeGreaterThan(0)
  })

  test('moves money from the keyboard: Space picks it up, Up adds a step, the arrows choose where, Enter drops it', async () => {
    const user = userEvent.setup()
    const moves: [string, string, number][] = []
    reduced(<Harness onMove={(...m) => void moves.push(m)} />)
    expect(screen.getByRole('group', { name: 'Envelopes' })).toHaveAccessibleDescription(/Space picks up money/)
    await user.tab()
    expect(envelope('food')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(envelope('fun')).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('status')).toHaveTextContent('Moving $10 from Fun. Choose an envelope.')
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('status')).toHaveTextContent('Move $20 from Fun to Eating out')
    await user.keyboard('{ArrowLeft}')
    expect(envelope('food')).toHaveFocus()
    expect(envelope('food')).toHaveAttribute('data-target')
    await user.keyboard('{Enter}')
    expect(moves).toEqual([['fun', 'food', 20]])
    expect(screen.getByRole('status')).toHaveTextContent('Moved $20 from Fun to Groceries')
    expect(envelope('fun')).toHaveAccessibleName('$40 Fun, $40 left of $80')
    expect(envelope('food')).toHaveAccessibleName('$160 Groceries, $160 left of $460, $40 rolled over')
  })

  test('Escape puts the money back without a move', async () => {
    const user = userEvent.setup()
    const moves: unknown[] = []
    reduced(<Harness onMove={(...m) => void moves.push(m)} />)
    await user.tab()
    await user.keyboard(' {ArrowRight}{Escape}')
    expect(moves).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('Move canceled')
    expect(envelope('food')).toHaveFocus()
    expect(document.querySelector('[data-target]')).toBeNull()
  })

  test('an empty or overspent envelope has nothing to pick up, and without onMove nothing moves', async () => {
    const user = userEvent.setup()
    reduced(<Harness />)
    envelope('out').focus()
    await user.keyboard(' ')
    expect(document.querySelector('[data-source]')).toBeNull()
    const { unmount } = reduced(<AllocationMeter envelopes={ENVELOPES} />)
    unmount()
  })
})
