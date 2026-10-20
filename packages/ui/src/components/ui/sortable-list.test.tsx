import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SortableList, SortableListHandle, SortableListItem } from './sortable-list'

const TASKS = ['Design review', 'Ship beta', 'Write docs']

function List({ onValueChange, controlled = false }: { onValueChange?: (v: string[]) => void; controlled?: boolean }) {
  const [value, setValue] = useState(TASKS)
  const items = controlled ? value : TASKS
  return (
    <YoujProvider reducedMotion="always">
      <SortableList
        aria-label="Tasks"
        value={controlled ? value : undefined}
        onValueChange={(next) => {
          if (controlled) setValue(next)
          onValueChange?.(next)
        }}
      >
        {items.map((task) => (
          <SortableListItem key={task} value={task} textValue={task}>
            <SortableListHandle />
            {task}
          </SortableListItem>
        ))}
      </SortableList>
      <button type="button">Elsewhere</button>
    </YoujProvider>
  )
}

const rows = () => screen.getAllByRole('listitem').map((li) => li.textContent)
const status = () => screen.getByRole('status').textContent?.trim()

describe('SortableList', () => {
  test('renders a named list with one tab stop across the handles', () => {
    render(<List />)
    expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument()
    const handles = screen.getAllByRole('button', { name: /^Reorder/ })
    expect(handles.map((h) => h.getAttribute('aria-label'))).toEqual(TASKS.map((t) => `Reorder ${t}`))
    expect(handles.map((h) => h.tabIndex)).toEqual([0, -1, -1])
    expect(handles[0]).toHaveAttribute('aria-describedby')
  })

  test('arrow keys walk between handles', async () => {
    const user = userEvent.setup()
    render(<List />)
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Reorder Ship beta' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Reorder Write docs' })).toHaveFocus()
  })

  test('Space lifts, arrows move, Space drops, announcing each step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<List onValueChange={onValueChange} />)
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Reorder Design review' })).toHaveAttribute('aria-pressed', 'true')
    expect(status()).toMatch(/^Picked up Design review, position 1 of 3\./)
    await user.keyboard('{ArrowDown}')
    expect(rows()).toEqual(['Ship beta', 'Design review', 'Write docs'])
    expect(status()).toBe('Design review: position 2 of 3.')
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard(' ')
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(['Ship beta', 'Design review', 'Write docs'])
    expect(status()).toBe('Dropped Design review at position 2 of 3.')
    expect(screen.getByRole('button', { name: 'Reorder Design review' })).toHaveFocus()
  })

  test('Escape puts the row back where it was', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<List onValueChange={onValueChange} />)
    await user.tab()
    await user.keyboard('{Enter}{End}')
    expect(rows()).toEqual(['Ship beta', 'Write docs', 'Design review'])
    await user.keyboard('{Escape}')
    expect(rows()).toEqual(TASKS)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(status()).toBe('Canceled. Design review is back at position 1 of 3.')
    expect(screen.getByRole('button', { name: 'Reorder Design review' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('leaving a lifted row cancels the move', async () => {
    const user = userEvent.setup()
    render(<List />)
    await user.tab()
    await user.keyboard(' {ArrowDown}')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    await waitFor(() => expect(rows()).toEqual(TASKS))
    expect(status()).toMatch(/^Canceled\./)
  })

  test('a controlled list shows the order it is given', async () => {
    const user = userEvent.setup()
    render(<List controlled />)
    await user.tab()
    await user.keyboard(' {End} ')
    expect(rows()).toEqual(['Ship beta', 'Write docs', 'Design review'])
    // The new order came back through value: the next lift starts from it.
    await user.keyboard(' {Home} ')
    expect(rows()).toEqual(['Design review', 'Ship beta', 'Write docs'])
  })

  test('disabled lists do not reorder', async () => {
    const user = userEvent.setup()
    render(
      <SortableList aria-label="Locked" disabled>
        <SortableListItem value="a">
          <SortableListHandle />A
        </SortableListItem>
      </SortableList>,
    )
    expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  test('asHandle rows are their own keyboard stop', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <SortableList aria-label="Rows" defaultValue={['b', 'a']}>
          <SortableListItem value="a" asHandle>
            Alpha
          </SortableListItem>
          <SortableListItem value="b" asHandle>
            Beta
          </SortableListItem>
        </SortableList>
      </YoujProvider>,
    )
    expect(rows()).toEqual(['Beta', 'Alpha'])
    await user.tab()
    expect(screen.getAllByRole('listitem')[0]).toHaveFocus()
    await user.keyboard(' {ArrowDown} ')
    expect(rows()).toEqual(['Alpha', 'Beta'])
    expect(status()).toBe('Dropped Beta at position 2 of 2.')
  })

  test('unmounting mid-lift leaves no listeners or errors behind', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<List />)
    await user.tab()
    await user.keyboard(' ')
    unmount()
    await new Promise((r) => requestAnimationFrame(r))
    expect(document.querySelector('[data-slot="sortable-list"]')).toBeNull()
  })
})
