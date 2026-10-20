import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarLink, ToolbarSeparator, ToolbarToggle } from './toolbar'

function FormattingToolbar({ onUndo = () => {} }: { onUndo?: () => void }) {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarGroup aria-label="History">
        <ToolbarButton aria-label="Undo" onClick={onUndo}>
          U
        </ToolbarButton>
        <ToolbarButton aria-label="Redo" disabled focusableWhenDisabled>
          R
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarToggle aria-label="Bold">B</ToolbarToggle>
      <ToggleGroup aria-label="Alignment" defaultValue={['left']}>
        <ToggleGroupItem value="left" aria-label="Align left">
          L
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          C
        </ToggleGroupItem>
      </ToggleGroup>
      <ToolbarLink href="#history">History</ToolbarLink>
    </Toolbar>
  )
}

const button = (name: string) => screen.getByRole('button', { name })

describe('Toolbar', () => {
  test('is a named toolbar with a vertical separator between groups', () => {
    render(<FormattingToolbar />)
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toHaveAttribute('aria-orientation', 'horizontal')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  test('is one tab stop; the arrow keys rove every control, disabled ones included, and toggle-group items join in', async () => {
    const user = userEvent.setup()
    render(<FormattingToolbar />)
    await user.tab()
    expect(button('Undo')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(button('Redo')).toHaveFocus()
    expect(button('Redo')).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{ArrowRight}')
    expect(button('Bold')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(button('Align left')).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('link', { name: 'History' })).toHaveFocus()
    // Focus wraps at the ends.
    await user.keyboard('{ArrowRight}')
    expect(button('Undo')).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  test('buttons act, toggles report aria-pressed, and the group keeps one pressed alignment', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<FormattingToolbar onUndo={onUndo} />)
    await user.click(button('Undo'))
    expect(onUndo).toHaveBeenCalledTimes(1)

    expect(button('Bold')).toHaveAttribute('aria-pressed', 'false')
    await user.click(button('Bold'))
    expect(button('Bold')).toHaveAttribute('aria-pressed', 'true')

    await user.click(button('Align center'))
    expect(button('Align center')).toHaveAttribute('aria-pressed', 'true')
    expect(button('Align left')).toHaveAttribute('aria-pressed', 'false')
  })

  test('a controlled toggle follows its pressed prop', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(
      <Toolbar aria-label="Marks">
        <ToolbarToggle aria-label="Italic" pressed onPressedChange={onPressedChange}>
          I
        </ToolbarToggle>
      </Toolbar>,
    )
    await user.click(button('Italic'))
    expect(onPressedChange).toHaveBeenCalledWith(false, expect.anything())
    expect(button('Italic')).toHaveAttribute('aria-pressed', 'true')
  })

  test('keys mark reduced motion so presses stop scaling', () => {
    render(
      <YoujProvider reducedMotion="always">
        <FormattingToolbar />
      </YoujProvider>,
    )
    expect(button('Undo')).toHaveAttribute('data-reduced-motion', 'true')
    expect(button('Bold')).toHaveAttribute('data-reduced-motion', 'true')
  })
})
