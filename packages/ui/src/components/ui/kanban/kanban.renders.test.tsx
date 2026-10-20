import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Kanban, type KanbanCardData, type KanbanColumn } from './index'

const cards = vi.hoisted(() => ({ renders: 0 }))
vi.mock('../card', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../card')>()
  return {
    ...actual,
    Card: (props: Record<string, unknown>) => {
      cards.renders++
      return createElement(actual.Card, props)
    },
  }
})

const COLUMNS: KanbanColumn[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
]
const CARDS: KanbanCardData[] = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, column: COLUMNS[i % 2]!.id, title: `Card ${i}` }))

describe('Kanban renders', () => {
  test('moving focus between cards re-renders only the two cards whose tab stop changes', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Kanban aria-label="Board" columns={COLUMNS} cards={CARDS} renderCard={(c) => c.title} />
      </YoujProvider>,
    )
    screen.getByRole('button', { name: 'Card 0' }).focus()
    cards.renders = 0
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Card 6' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Card 6' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: 'Card 0' })).toHaveAttribute('tabindex', '-1')
    expect(cards.renders).toBeLessThanOrEqual(3 * 2)
  })
})
