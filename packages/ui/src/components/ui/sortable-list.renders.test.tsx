import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SortableList, SortableListHandle, SortableListItem } from './sortable-list'

const grip = vi.hoisted(() => ({ renders: 0 }))
vi.mock('@youj/icons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@youj/icons')>()
  return {
    ...actual,
    GripIcon: (props: Record<string, unknown>) => {
      grip.renders++
      return createElement(actual.GripIcon, props)
    },
  }
})

const ROWS = Array.from({ length: 60 }, (_, i) => `Row ${i}`)

describe('SortableList renders', () => {
  test('moving focus along the handles re-renders only the two handles whose tab stop changes', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <SortableList aria-label="Rows">
          {ROWS.map((row) => (
            <SortableListItem key={row} value={row} textValue={row}>
              <SortableListHandle />
              {row}
            </SortableListItem>
          ))}
        </SortableList>
      </YoujProvider>,
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Reorder Row 0' })).toHaveFocus()
    grip.renders = 0
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Reorder Row 3' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Reorder Row 3' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: 'Reorder Row 0' })).toHaveAttribute('tabindex', '-1')
    // One handle loses the stop and one gains it at each step; the other 58 stay as they were.
    expect(grip.renders).toBeLessThanOrEqual(3 * 2)
  })
})
