import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ImageCompare, type ImageCompareProps } from './image-compare'

/* Reduced motion, so a spring or a step lands at once. */
function renderCompare(props: Partial<ImageCompareProps> = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  const result = render(
    <YoujProvider reducedMotion="always" dir={dir}>
      <ImageCompare before={{ src: '/before.png', alt: 'Sketch' }} after={{ src: '/after.png', alt: 'Render' }} {...props} />
    </YoujProvider>,
  )
  const handle = screen.getByRole('slider')
  const root = handle.closest<HTMLElement>('[data-slot=image-compare]')!
  // jsdom lays nothing out: a 200 × 100 box at the origin.
  root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
  return { ...result, handle, root }
}

describe('ImageCompare', () => {
  test('the handle is a slider named and valued by how much of each side shows', () => {
    const { handle } = renderCompare({ beforeLabel: 'Sketch', afterLabel: 'Render' })
    expect(handle).toHaveAccessibleName('Comparison divider')
    expect(handle).toHaveAttribute('aria-valuenow', '50')
    expect(handle).toHaveAttribute('aria-valuetext', 'Sketch 50%, Render 50%')
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal')
    expect(screen.getByAltText('Sketch')).toBeInTheDocument()
    expect(screen.getByText('Render')).toBeInTheDocument()
  })

  test('arrows step by 5, Page keys by 20, Home and End go to the ends', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { handle } = renderCompare({ onValueChange })
    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(handle).toHaveAttribute('aria-valuenow', '55')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '45')
    await user.keyboard('{PageUp}')
    expect(handle).toHaveAttribute('aria-valuenow', '65')
    await user.keyboard('{Home}')
    expect(handle).toHaveAttribute('aria-valuenow', '0')
    await user.keyboard('{End}')
    expect(handle).toHaveAttribute('aria-valuenow', '100')
    expect(onValueChange).toHaveBeenLastCalledWith(100)
  })

  test('arrows follow the mirrored axis in right-to-left', async () => {
    const user = userEvent.setup()
    const { handle } = renderCompare({}, 'rtl')
    handle.focus()
    await user.keyboard('{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '55')
  })

  test('a press springs the divider to the pointer and dragging follows it', () => {
    const { handle, root } = renderCompare()
    fireEvent.pointerDown(root, { button: 0, clientX: 40, clientY: 50, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '20')
    expect(root).toHaveAttribute('data-dragging')
    expect(handle).toHaveFocus()
    fireEvent.pointerMove(root, { clientX: 150, clientY: 50, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '75')
    fireEvent.pointerUp(root, { clientX: 150, pointerId: 1 })
    expect(root).not.toHaveAttribute('data-dragging')
    // Released, a mouse moving over it no longer moves the divider.
    fireEvent.pointerMove(root, { clientX: 20, pointerType: 'mouse', pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '75')
  })

  test('in right-to-left the start side is on the right', () => {
    const { handle, root } = renderCompare({}, 'rtl')
    fireEvent.pointerDown(root, { button: 0, clientX: 40, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '80')
  })

  test('vertical runs top to bottom and Down moves the divider down', async () => {
    const user = userEvent.setup()
    const { handle, root } = renderCompare({ orientation: 'vertical' })
    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    fireEvent.pointerDown(root, { button: 0, clientY: 30, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '30')
    fireEvent.pointerUp(root, { pointerId: 1 })
    await user.keyboard('{ArrowDown}')
    expect(handle).toHaveAttribute('aria-valuenow', '35')
  })

  test('hover follows a mouse without a press, but not touch', () => {
    const { handle, root } = renderCompare({ hover: true })
    fireEvent.pointerMove(root, { clientX: 160, pointerType: 'mouse', pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '80')
    fireEvent.pointerMove(root, { clientX: 20, pointerType: 'touch', pointerId: 2 })
    expect(handle).toHaveAttribute('aria-valuenow', '80')
  })

  test('controlled: reports changes and shows only the value it is given', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { handle, rerender } = renderCompare({ value: 30, onValueChange })
    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenCalledWith(35)
    expect(handle).toHaveAttribute('aria-valuenow', '30')
    rerender(
      <YoujProvider reducedMotion="always">
        <ImageCompare before={<span>A</span>} after={<span>B</span>} value={70} onValueChange={onValueChange} />
      </YoujProvider>,
    )
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '70')
  })

  test('the before side is clipped at the divider', () => {
    const { root } = renderCompare({ defaultValue: 25 })
    const before = root.querySelector<HTMLElement>('[data-slot=image-compare-before]')!
    expect(before.style.clipPath).toBe('inset(0 75% 0 0)')
  })

  test('disabled ignores presses and keys and leaves the tab order', async () => {
    const user = userEvent.setup()
    const { handle, root } = renderCompare({ disabled: true })
    expect(handle).toHaveAttribute('tabindex', '-1')
    expect(handle).toHaveAttribute('aria-disabled', 'true')
    fireEvent.pointerDown(root, { button: 0, clientX: 20, pointerId: 1 })
    handle.focus()
    await user.keyboard('{End}')
    expect(handle).toHaveAttribute('aria-valuenow', '50')
  })
})
