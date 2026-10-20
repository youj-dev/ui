import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

function Views(props: Partial<Parameters<typeof ToggleGroup>[0]>) {
  return (
    <ToggleGroup aria-label="View" {...props}>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
      <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
    </ToggleGroup>
  )
}

const pressed = () => screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)

describe('ToggleGroup', () => {
  test('single select: pressing one releases the other', async () => {
    const user = userEvent.setup()
    render(<Views defaultValue={['list']} />)
    await user.click(screen.getByRole('button', { name: 'Board' }))
    expect(pressed()).toEqual(['Board'])
  })

  test('multiple: items toggle independently', async () => {
    const user = userEvent.setup()
    render(<Views multiple defaultValue={['list']} />)
    await user.click(screen.getByRole('button', { name: 'Timeline' }))
    expect(pressed()).toEqual(['List', 'Timeline'])
  })

  test('one tab stop; arrow keys rove focus and wrap', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Views defaultValue={['board']} />
        <button type="button">After</button>
      </>,
    )
    await user.tab()
    const focused = document.activeElement
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).not.toBe(focused)
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Timeline' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'List' })).toHaveFocus()
    await user.keyboard(' ')
    expect(pressed()).toEqual(['List'])
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  test('controlled value reports changes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Views value={['list']} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Timeline' }))
    expect(onValueChange).toHaveBeenCalledWith(['timeline'], expect.anything())
    expect(pressed()).toEqual(['List'])
  })

  test('segmented look is carried to every item', () => {
    render(<Views variant="segmented" defaultValue={['list']} />)
    expect(screen.getByRole('group', { name: 'View' })).toHaveAttribute('data-variant', 'segmented')
    for (const b of screen.getAllByRole('button')) expect(b).toHaveAttribute('data-variant', 'segmented')
  })

  test('segments stretch to the track only when horizontal, so a vertical group keeps its heights', () => {
    render(<Views variant="segmented" orientation="vertical" defaultValue={['list']} />)
    for (const b of screen.getAllByRole('button')) {
      expect(b).not.toHaveClass('h-full')
      expect(b).not.toHaveClass('min-h-0')
    }
  })

  test('small segments keep room between their words; small icon keys stay compact', () => {
    const { unmount } = render(<Views variant="segmented" size="sm" defaultValue={['list']} />)
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('own:px-2.5')
    unmount()
    render(<Views size="sm" defaultValue={['list']} />)
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('own:px-1.5')
  })

  test('segments never shrink below their labels, and their hit areas take in the track padding', () => {
    for (const size of ['sm', 'default', 'lg'] as const) {
      const { unmount } = render(<Views variant="segmented" size={size} defaultValue={['list']} />)
      for (const b of screen.getAllByRole('button')) {
        // The size's fixed minimum is what let an equal split squeeze a long label.
        expect(b).toHaveClass('min-w-auto')
        expect(b.className).not.toMatch(/(^|\s)min-w-control/)
        expect(b).toHaveClass('after:absolute', 'after:-inset-0.5')
      }
      unmount()
    }
    // Other looks keep the square minimum their icon keys rely on.
    render(<Views defaultValue={['list']} />)
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('min-w-control')
  })

  test('a single-select segmented group raises its key with one decorative sliding indicator', async () => {
    const user = userEvent.setup()
    render(<Views variant="segmented" defaultValue={['list']} />)
    const group = screen.getByRole('group', { name: 'View' })
    const indicators = group.querySelectorAll('[data-slot=toggle-group-indicator]')
    expect(indicators).toHaveLength(1)
    expect(indicators[0]).toHaveAttribute('aria-hidden', 'true')
    // The indicator is not an item: roving focus and pressing still only see the three keys.
    await user.click(screen.getByRole('button', { name: 'Timeline' }))
    expect(pressed()).toEqual(['Timeline'])
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  test('with multiple, each pressed key raises itself and no indicator is rendered', () => {
    render(<Views variant="segmented" multiple defaultValue={['list', 'board']} />)
    expect(document.querySelector('[data-slot=toggle-group-indicator]')).toBeNull()
  })

  test('other looks never render an indicator', () => {
    render(<Views variant="outline" defaultValue={['list']} />)
    expect(document.querySelector('[data-slot=toggle-group-indicator]')).toBeNull()
  })
})
