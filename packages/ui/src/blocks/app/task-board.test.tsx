import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TaskBoard, type BoardTask } from './task-board'

/* The board fed the app's columns and tasks: the cards come from props,
 * moves and opens reach the app, and a rejected move puts the card back
 * and says why. */

const wrap = (ui: ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const columns = [
  { id: 'todo', title: 'To do' },
  { id: 'shipped', title: 'Shipped' },
]
const tasks: BoardTask[] = [
  { id: 'S-1', key: 'S-1', column: 'todo', title: 'Pack the order', project: 'Shop', label: 'Ops', assignee: 'Ana Lima', priority: 'high', due: 'Today' },
  { id: 'S-2', key: 'S-2', column: 'shipped', title: 'Print labels', project: 'Shop', label: 'Ops', assignee: 'Bo Chen', priority: 'low' },
]
const copy = { subtitle: (open: number) => `${open} to ship.`, doneColumn: 'shipped', newTask: 'New order' }

describe('TaskBoard with your data', () => {
  test('shows your columns and cards, with copy in the header and on the cards', () => {
    const { container } = wrap(<TaskBoard columns={columns} tasks={tasks} copy={copy} />)
    expect(screen.getByRole('region', { name: 'To do' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-kanban-card]')).toHaveLength(2)
    expect(screen.getByText('1 to ship.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New order' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Pack the order/ })).toHaveAccessibleName('Pack the order, S-1. High priority, Ops, Shop, due today, assigned to Ana Lima.')
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and New task, with no main of its own', () => {
    const { container } = wrap(<TaskBoard columns={columns} tasks={tasks} copy={copy} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'My tasks' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'New order' }))
  })

  test('standalone, it is a main on its own canvas', () => {
    wrap(<TaskBoard embedded={false} columns={columns} tasks={tasks} copy={copy} />)
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { level: 1, name: 'My tasks' }))
  })

  test('a card needs only a title: whatever else it has is drawn and read', () => {
    const plain: BoardTask[] = [
      { id: 'd-1', column: 'todo', title: 'Acme renewal' },
      { id: 'd-2', column: 'todo', title: 'Globex pilot', assignee: 'Bo Chen' },
    ]
    const { container } = wrap(<TaskBoard columns={columns} tasks={plain} copy={copy} />)
    expect(screen.getByRole('button', { name: /^Acme renewal/ })).toHaveAccessibleName('Acme renewal.')
    expect(screen.getByRole('button', { name: /^Globex pilot/ })).toHaveAccessibleName('Globex pilot. assigned to Bo Chen.')
    expect(container.querySelectorAll('[data-kanban-card] [data-slot=badge]')).toHaveLength(0)
  })

  test('a move reaches the app with every task; opening and New task too', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    const onOpen = vi.fn()
    const onCreate = vi.fn()
    const { container } = wrap(<TaskBoard columns={columns} tasks={tasks} copy={copy} onMove={onMove} onOpen={onOpen} onCreate={onCreate} />)
    await user.click(screen.getByRole('button', { name: 'New order' }))
    expect(onCreate).toHaveBeenCalledOnce()
    container.querySelector<HTMLElement>('[data-kanban-card="S-1"]')!.focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith(tasks[0])
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')
    expect(onMove).toHaveBeenCalledOnce()
    expect(onMove.mock.calls[0]![0]).toMatchObject({ card: { id: 'S-1' }, to: { column: 'shipped' } })
    expect(screen.getByText('0 to ship.')).toBeInTheDocument()
  })

  test('a rejected move puts the card back and shows why', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn().mockRejectedValue(new Error('Courier is offline'))
    const { container } = wrap(<TaskBoard columns={columns} tasks={tasks} copy={copy} onMove={onMove} />)
    container.querySelector<HTMLElement>('[data-kanban-card="S-1"]')!.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')
    expect(await screen.findByText('Courier is offline')).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'To do' })).getByRole('button', { name: /Pack the order/ })).toBeInTheDocument())
    expect(screen.getByText('1 to ship.')).toBeInTheDocument()
  })

  test('loading, an empty slot and an error with Retry', async () => {
    const user = userEvent.setup()
    const first = wrap(<TaskBoard loading />)
    expect(first.container.querySelectorAll('[data-kanban-card]')).toHaveLength(0)
    first.unmount()
    const second = wrap(<TaskBoard tasks={[]} empty={<p>Nothing to ship</p>} />)
    expect(screen.getByText('Nothing to ship')).toBeInTheDocument()
    second.unmount()
    const onRetry = vi.fn()
    wrap(<TaskBoard error="Tracker unreachable." onRetry={onRetry} headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2, name: 'My tasks' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
