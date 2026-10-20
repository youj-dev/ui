import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Rating } from './rating'

/** jsdom has no layout: give the five 20px keys real boxes, 2px apart. */
function layOut(slider: HTMLElement) {
  slider.querySelectorAll<HTMLElement>('[data-slot=rating-item]').forEach((item, i) => {
    const left = i * 22
    item.getBoundingClientRect = () => ({ left, right: left + 20, top: 0, bottom: 20, width: 20, height: 20, x: left, y: 0, toJSON() {} })
  })
}

describe('Rating', () => {
  test('is one slider with a readable value', () => {
    render(<Rating aria-label="Overall" defaultValue={3} />)
    const slider = screen.getByRole('slider', { name: 'Overall' })
    expect(slider).toHaveAttribute('aria-valuenow', '3')
    expect(slider).toHaveAttribute('aria-valuemax', '5')
    expect(slider).toHaveAttribute('aria-valuetext', '3 of 5 stars')
  })

  test('keyboard: arrows step (by halves with allowHalf), Home/End, digits, Backspace', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rating aria-label="Overall" allowHalf onValueChange={onValueChange} />)
    const slider = screen.getByRole('slider')
    slider.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuetext', '1.5 of 5 stars')
    await user.keyboard('{ArrowLeft}')
    expect(slider).toHaveAttribute('aria-valuenow', '1')
    await user.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuenow', '5')
    await user.keyboard('4')
    expect(slider).toHaveAttribute('aria-valuenow', '4')
    await user.keyboard('{Backspace}')
    expect(slider).toHaveAttribute('aria-valuetext', 'No rating')
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  test('arrows follow the reading direction', async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Rating aria-label="Overall" defaultValue={2} />
      </div>,
    )
    const slider = screen.getByRole('slider')
    slider.focus()
    await user.keyboard('{ArrowLeft}')
    expect(slider).toHaveAttribute('aria-valuenow', '3')
  })

  test('hover previews, leaving restores, clicking commits and clicking again clears', () => {
    const onValueChange = vi.fn()
    render(<Rating aria-label="Overall" allowHalf defaultValue={1} onValueChange={onValueChange} />)
    const slider = screen.getByRole('slider')
    layOut(slider)
    const fill = (i: number) => (slider.querySelectorAll('[data-slot=rating-fill]')[i] as HTMLElement).style.getPropertyValue('--share')
    // x = 75 is the left half of the 4th key (66–86): 3.5.
    fireEvent.pointerMove(slider, { clientX: 75, pointerType: 'mouse' })
    expect(fill(3)).toBe('0.5')
    expect(slider).toHaveAttribute('aria-valuenow', '1')
    fireEvent.pointerLeave(slider)
    expect(fill(3)).toBe('0')
    fireEvent.click(slider, { clientX: 75 })
    expect(onValueChange).toHaveBeenLastCalledWith(3.5)
    fireEvent.click(slider, { clientX: 75 })
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  test('reports the previewed value, and null when the pointer leaves', () => {
    const onPreviewChange = vi.fn()
    render(<Rating aria-label="Overall" defaultValue={2} onPreviewChange={onPreviewChange} />)
    const slider = screen.getByRole('slider')
    layOut(slider)
    // x = 50 is inside the 3rd key (44–64).
    fireEvent.pointerMove(slider, { clientX: 50, pointerType: 'mouse' })
    fireEvent.pointerMove(slider, { clientX: 52, pointerType: 'mouse' })
    expect(onPreviewChange).toHaveBeenCalledTimes(1)
    expect(onPreviewChange).toHaveBeenLastCalledWith(3)
    fireEvent.pointerLeave(slider)
    expect(onPreviewChange).toHaveBeenLastCalledWith(null)
  })

  test('a preview below the value keeps the committed value visible behind it', () => {
    render(<Rating aria-label="Overall" defaultValue={4} />)
    const slider = screen.getByRole('slider')
    layOut(slider)
    const key = (i: number) => slider.querySelectorAll('[data-slot=rating-glyph]')[i]!
    expect(key(3)).not.toHaveClass('own:bg-accent-subtle')
    fireEvent.pointerMove(slider, { clientX: 10, pointerType: 'mouse' })
    // The 4th key: the fill is empty, and the key keeps a faint accent tint; the 5th, never set, doesn't.
    expect((key(3).querySelector('[data-slot=rating-fill]') as HTMLElement).style.getPropertyValue('--share')).toBe('0')
    expect(key(3)).toHaveClass('own:bg-accent-subtle')
    expect(key(4)).not.toHaveClass('own:bg-accent-subtle')
  })

  test('read-only is a labelled image and ignores input', () => {
    render(<Rating readOnly value={4.5} allowHalf />)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Rated 4.5 out of 5' })).toBeInTheDocument()
  })

  test('read-only takes a label of its own', () => {
    render(<Rating readOnly value={4} aria-label="4.2 stars from 86 reviews" />)
    expect(screen.getByRole('img', { name: '4.2 stars from 86 reviews' })).toBeInTheDocument()
  })

  test('disabled is out of the tab order and does nothing', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rating aria-label="Overall" disabled defaultValue={2} onValueChange={onValueChange} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-disabled', 'true')
    expect(slider).toHaveAttribute('tabindex', '-1')
    await user.click(slider)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('submits its value with a name', () => {
    const { container } = render(<Rating aria-label="Overall" name="rating" defaultValue={4} />)
    expect(container.querySelector('input[name=rating]')).toHaveValue('4')
  })
})
