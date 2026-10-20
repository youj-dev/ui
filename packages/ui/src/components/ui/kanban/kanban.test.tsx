import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Kanban, type KanbanCardData, type KanbanColumn, type KanbanProps } from './index'
import { moveCard } from './kanban-model'

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress', limit: 2 },
  { id: 'done', title: 'Done' },
]
const CARDS: KanbanCardData[] = [
  { id: 'a', column: 'todo', title: 'Fix login' },
  { id: 'b', column: 'todo', title: 'Write docs' },
  { id: 'c', column: 'doing', title: 'Ship charts' },
  { id: 'd', column: 'doing', title: 'Audit icons' },
]

function Board(props: Partial<KanbanProps<KanbanCardData>>) {
  return (
    <YoujProvider reducedMotion="always">
      <Kanban aria-label="Sprint" columns={COLUMNS} cards={CARDS} renderCard={(c) => c.title} {...props} />
    </YoujProvider>
  )
}

const card = (title: string) => screen.getByRole('button', { name: title })
const status = () => within(screen.getByRole('group', { name: 'Sprint' })).getAllByRole('status').at(-1)!
const titlesIn = (column: string) => within(screen.getByRole('list', { name: column })).queryAllByRole('button').map((b) => b.textContent)

describe('Kanban', () => {
  test('cards are one Tab stop of draggable buttons with instructions', async () => {
    const user = userEvent.setup()
    render(<Board />)
    const a = card('Fix login')
    expect(a).toHaveAttribute('aria-roledescription', 'draggable card')
    expect(a).toHaveAccessibleDescription(/Press Space to pick up a card/)
    expect(screen.getAllByRole('button').filter((b) => b.hasAttribute('data-kanban-card') && b.tabIndex === 0)).toEqual([a])
    await user.tab()
    // The first Tab stop is the first column's collapse button, then the cards.
    await user.tab()
    expect(a).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(card('Write docs')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(card('Audit icons')).toHaveFocus()
  })

  test('Space picks up, arrows move across columns, Space drops and onMove gets both places', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Board onMove={onMove} />)
    card('Fix login').focus()
    await user.keyboard(' ')
    expect(card('Fix login')).toHaveAttribute('aria-pressed', 'true')
    expect(status()).toHaveTextContent('Picked up Fix login. To do, position 1 of 2.')

    await user.keyboard('{ArrowDown}')
    expect(titlesIn('To do')).toEqual(['Write docs', 'Fix login'])
    expect(status()).toHaveTextContent('Fix login: To do, position 2 of 2.')
    await user.keyboard('{ArrowRight}')
    expect(card('Fix login')).toHaveFocus()
    // Across keeps the row it was on.
    expect(titlesIn('In progress')).toEqual(['Ship charts', 'Fix login', 'Audit icons'])
    expect(status()).toHaveTextContent('In progress, position 2 of 3. Over the limit of 2.')
    expect(onMove).not.toHaveBeenCalled()

    await user.keyboard(' ')
    expect(card('Fix login')).toHaveAttribute('aria-pressed', 'false')
    expect(status()).toHaveTextContent('Dropped Fix login in In progress, position 2 of 3.')
    expect(onMove).toHaveBeenCalledWith(
      { card: expect.objectContaining({ id: 'a', column: 'doing' }), from: { column: 'todo', lane: undefined, index: 0 }, to: { column: 'doing', lane: undefined, index: 1 } },
      expect.any(Array),
    )
  })

  test('Escape cancels a lifted card back to where it was', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Board onMove={onMove} />)
    card('Write docs').focus()
    await user.keyboard(' {ArrowRight}{ArrowRight}')
    expect(titlesIn('Done')).toEqual(['Write docs'])
    await user.keyboard('{Escape}')
    expect(titlesIn('To do')).toEqual(['Fix login', 'Write docs'])
    expect(card('Write docs')).toHaveFocus()
    expect(status()).toHaveTextContent('Canceled. Write docs is back in To do, position 2 of 2.')
    expect(onMove).not.toHaveBeenCalled()
  })

  test('column headers are not banner landmarks, with or without lanes', () => {
    const lanes = [{ id: 'web', title: 'Web' }]
    render(<Board lanes={lanes} cards={CARDS.map((c) => ({ ...c, lane: 'web' }))} />)
    expect(screen.queryAllByRole('banner')).toHaveLength(0)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['To do', 'In progress', 'Done'])
  })

  test('the header counts cards and warns over its WIP limit', async () => {
    const user = userEvent.setup()
    render(<Board />)
    const doing = screen.getByRole('region', { name: 'In progress' })
    expect(within(doing).getByLabelText('2 of 2 cards')).toBeInTheDocument()
    expect(doing.querySelector('[data-slot=kanban-column-header]')).not.toHaveAttribute('data-over-limit')
    card('Fix login').focus()
    await user.keyboard(' {ArrowRight}')
    // Live, while the card hovers over the column.
    expect(doing.querySelector('[data-slot=kanban-column-header]')).toHaveAttribute('data-over-limit')
    expect(within(doing).getByLabelText('3 of 2 cards, over the limit')).toBeInTheDocument()
  })

  test('a rejected onMove rolls the card back and says so', async () => {
    const user = userEvent.setup()
    let reject!: (error: Error) => void
    const move = new Promise<void>((_, rej) => { reject = rej })
    const onMove = vi.fn(() => move)
    render(<Board onMove={onMove} />)
    card('Fix login').focus()
    await user.keyboard(' {ArrowRight} ')
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(titlesIn('In progress')).toContain('Fix login')
    // Keep the move pending until its optimistic state has been checked.
    await act(async () => reject(new Error('conflict')))
    await waitFor(() => expect(titlesIn('To do')).toEqual(['Fix login', 'Write docs']))
    expect(status()).toHaveTextContent("Couldn't move Fix login. It's back in To do.")
  })

  test('columns collapse to a rail and cards skip them', async () => {
    const user = userEvent.setup()
    const onCollapsedChange = vi.fn()
    render(<Board onCollapsedChange={onCollapsedChange} />)
    await user.click(screen.getByRole('button', { name: 'Collapse In progress' }))
    expect(onCollapsedChange).toHaveBeenCalledWith(['doing'])
    expect(screen.getByRole('region', { name: 'In progress' })).toHaveAttribute('data-collapsed')
    expect(screen.getByRole('button', { name: 'Expand In progress' })).toHaveAttribute('aria-expanded', 'false')
    card('Fix login').focus()
    await user.keyboard(' {ArrowRight} ')
    expect(titlesIn('Done')).toEqual(['Fix login'])
  })

  test('the add-card composer adds to its column; Escape closes it', async () => {
    const user = userEvent.setup()
    function Adding() {
      const [cards, setCards] = useState(CARDS)
      return <Board cards={cards} onAddCard={({ column }, title) => setCards((cs) => [...cs, { id: title, column, title }])} />
    }
    render(<Adding />)
    const done = screen.getByRole('region', { name: 'Done' })
    await user.click(within(done).getByRole('button', { name: 'Add card' }))
    await user.keyboard('Release notes{Enter}')
    expect(titlesIn('Done')).toEqual(['Release notes'])
    await user.keyboard('{Escape}')
    await waitFor(() => expect(within(done).getByRole('button', { name: 'Add card' })).toHaveFocus())
  })

  test('Enter or a click opens a card', async () => {
    const user = userEvent.setup()
    const onCardAction = vi.fn()
    render(<Board onCardAction={onCardAction} />)
    await user.click(card('Ship charts'))
    expect(onCardAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'c' }), expect.objectContaining({ type: 'click' }))
    await user.keyboard('{Enter}')
    expect(onCardAction).toHaveBeenCalledTimes(2)
  })

  test('the app owns selection: onCardAction gets the modifier keys, and selected cards look and read selected', async () => {
    const user = userEvent.setup()
    function Selectable() {
      const [ids, setIds] = useState<string[]>([])
      return (
        <Board
          selectedIds={ids}
          renderCard={(c, { selected }) => `${c.title}${selected ? ' ✓' : ''}`}
          onCardAction={(c, event) => setIds((old) => (event.shiftKey || event.metaKey ? (old.includes(c.id) ? old.filter((id) => id !== c.id) : [...old, c.id]) : [c.id]))}
        />
      )
    }
    render(<Selectable />)
    await user.click(screen.getByRole('button', { name: 'Fix login' }))
    await user.keyboard('{Shift>}')
    await user.click(screen.getByRole('button', { name: 'Ship charts' }))
    await user.keyboard('{/Shift}')
    const a = screen.getByRole('button', { name: /^Fix login ✓ ?, selected$/ })
    const c = screen.getByRole('button', { name: /^Ship charts ✓ ?, selected$/ })
    expect(a).toHaveAttribute('data-selected')
    expect(c).toHaveAttribute('data-selected')
    expect(screen.getByRole('button', { name: 'Write docs' })).not.toHaveAttribute('data-selected')
    // Enter with no modifier selects only the focused card.
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('button').filter((b) => b.hasAttribute('data-selected'))).toEqual([screen.getByRole('button', { name: /^Ship charts/ })])
  })

  test('lanes take a node for a title, named by their label, and empty ones can hide', () => {
    const lanes = [
      { id: 'web', title: <strong>Web team</strong>, label: 'Web team' },
      { id: 'ops', title: 'Ops' },
    ]
    const cards = CARDS.map((c) => ({ ...c, lane: 'web' }))
    const { rerender } = render(<Board lanes={lanes} cards={cards} />)
    expect(screen.getByRole('region', { name: 'Web team lane' })).toContainHTML('<strong>Web team</strong>')
    expect(screen.getByRole('region', { name: 'Ops lane' })).toBeInTheDocument()
    rerender(<Board lanes={lanes} cards={cards} hideEmptyLanes />)
    expect(screen.queryByRole('region', { name: 'Ops lane' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Web team lane' })).toBeInTheDocument()
  })

  test('snap makes the board snap a column to its start edge, except mid-drag', () => {
    const { rerender } = render(<Board />)
    const scroller = () => document.querySelector('[data-kanban-scroller]')!
    expect(scroller()).not.toHaveAttribute('data-yj-snap')
    rerender(<Board snap />)
    expect(scroller()).toHaveAttribute('data-yj-snap')
    expect(scroller().className).toContain('group-data-dragging/kanban:snap-none')
    expect(screen.getByRole('region', { name: 'Done' }).className).toContain('snap-start')
  })

  test('reduced motion marks the board so lifts do not scale', () => {
    render(<Board />)
    expect(screen.getByRole('group', { name: 'Sprint' })).toHaveAttribute('data-reduced-motion')
    expect(card('Fix login').className).toContain('reduced:data-lifted:scale-100')
  })

  test('fill lets columns grow to share the width, but a collapsed one stays a rail', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Board />)
    expect(screen.getByRole('group', { name: 'Sprint' })).not.toHaveAttribute('data-fill')
    rerender(<Board fill />)
    expect(screen.getByRole('group', { name: 'Sprint' })).toHaveAttribute('data-fill')
    expect(screen.getByRole('region', { name: 'Done' }).className).toContain('group-data-fill/kanban:grow')
    await user.click(screen.getByRole('button', { name: 'Collapse Done' }))
    expect(screen.getByRole('region', { name: 'Done' }).className).toContain('group-data-fill/kanban:grow-0')
  })

  test('moveCard keeps the flat order and lanes', () => {
    const cards = [
      { id: 'a', column: 'x', lane: 'l1', title: 'a' },
      { id: 'b', column: 'x', lane: 'l2', title: 'b' },
      { id: 'c', column: 'y', lane: 'l1', title: 'c' },
    ]
    const next = moveCard(cards, 'a', { column: 'y', lane: 'l1', index: 1 })
    expect(next.map((c) => c.id)).toEqual(['b', 'c', 'a'])
    expect(next[2]).toMatchObject({ column: 'y', lane: 'l1' })
    expect(moveCard(cards, 'c', { column: 'x', lane: 'l2', index: 0 }).map((c) => c.id)).toEqual(['a', 'c', 'b'])
  })
})
